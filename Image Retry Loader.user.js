// ==UserScript==
// @name         Image Retry Loader with GM_xmlhttpRequest
// @namespace    http://tampermonkey.net/
// @version      2026.05.04
// @description  Automatically retries loading failed images by checking their existence with GM_xmlhttpRequest.
// @author       Your Name
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @connect      *
// @run-at       document-body
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @noframes
// ==/UserScript==

(function () {
    'use strict';

    // 이미지 재시도 큐    
    const retryQueue = [];
    const retrySet = new Set();
    const failedImagesSet = new Set();

    // 재시도 간격 및 횟수
    const RETRY_INTERVAL = 10000;
    const MAX_RETRY_COUNT = 1;
    const LOAD_TIMEOUT = 30000; // 30초 타임아웃

    class Queue {
        constructor() {
            this.items = {};
            this.front = 0;
            this.rear = 0;
        }
        enqueue(item) { this.items[this.rear++] = item; }
        dequeue() {
            if (this.isEmpty()) return undefined;
            const item = this.items[this.front];
            delete this.items[this.front++];
            return item;
        }
        get size() { return this.rear - this.front; }
        isEmpty() { return this.size === 0; }
    }

    const lazyImageQueue = new Queue();

    // 🔥 IntersectionObserver 설정 (화면 진입 감지)
    const viewportObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                
                // 관찰 중단 (한 번 감지되면 더 이상 관찰하지 않음)
                observer.unobserve(img);

                // 뷰포트에 들어온 시점에 유효성 검사 후 큐에 삽입
                if (isValidExternalImage(img)) {
                    img.setAttribute('loading', 'lazy');
                    lazyImageQueue.enqueue(img);
                    startLazyWorkers();
                }
            }
        });
    }, {
        root: null, // 뷰포트를 기준으로 감지
        rootMargin: '1000px 0px', // 화면에 보이기 200px 전에 미리 로딩 시작
        threshold: 0.01
    });

    async function waitForImage(img, timeout) {
        return new Promise((resolve) => {

            const currentSrc = img.getAttribute('src');

            if (!currentSrc || currentSrc === "" || img.src === window.location.href) {
                return resolve('skipped');
            }

            if (img.complete && img.naturalWidth > 0) {
                img.decode()
                    .then(() => {
                        img.dataset.isImageState = "true";
                        resolve('loaded');
                    })
                    .catch(() => {
                        console.warn('[ImageRetry] decode 실패 → 깨진 이미지 감지:', img.src);
                        resolve('corrupted');
                    });
                return;
            }

            if (img.src.startsWith('blob:')) return resolve('loaded');

            const timer = setTimeout(() => {
                console.warn(`[ImageRetry] 로딩 타임아웃: ${img.src}`);
                cleanup();
                resolve('timeout');
            }, timeout);

            function cleanup() {
                clearTimeout(timer);
                img.removeEventListener('load', onLoad);
                img.removeEventListener('error', onError);
            }

            function onLoad() {
                cleanup();
                img.decode()
                    .then(() => {
                        img.dataset.isImageState = "true";
                        resolve('loaded');
                    })
                    .catch(() => {
                        console.warn('[ImageRetry] decode 실패 (onLoad 이후)');
                        resolve('corrupted');
                    });
            }

            function onError() {
                cleanup();
                resolve('error');
            }
            img.addEventListener('load', onLoad);
            img.addEventListener('error', onError);

            img.removeAttribute('loading');
        });
    }

    const CONCURRENCY = 5;
    let activeWorkers = 0;

    function startLazyWorkers() {
        while (activeWorkers < CONCURRENCY && !lazyImageQueue.isEmpty()) {
            runLazyWorker();
        }
    }

    async function runLazyWorker() {
        if (lazyImageQueue.isEmpty()) return;

        activeWorkers++;

        const img = lazyImageQueue.dequeue();

        if (img && img.isConnected) {
            waitForImage(img, LOAD_TIMEOUT).then(result => {
                if (result === 'error' || result === 'corrupted' || result === 'timeout') {
                    if (!retrySet.has(getPureUrl(img.src))) {
                        enqueueFailedImage(img, result);
                    }
                }
                activeWorkers--;
                startLazyWorkers();
            });
        }
    }

    function getHeader(headers, name) {
        const match = headers.match(new RegExp(`^${name}:\\s*(.*)$`, 'im'));
        return match ? match[1].trim() : null;
    }

    function isCloudflareChallenge(response) {
        const headers = response.responseHeaders || '';

        const contentType = getHeader(headers, 'content-type');
        const server = getHeader(headers, 'server');
        const finalUrl = response.finalUrl || '';

        if (finalUrl.includes('challenges.cloudflare.com')) return true;

        if (server && server.toLowerCase().includes('cloudflare') &&
            contentType && contentType.includes('text/html')) {
            return true;
        }

        return false;
    }

    function isImageResponse(response) {
        const contentType = getHeader(response.responseHeaders, 'content-type');
        return contentType && contentType.startsWith('image/');
    }

    function getContentLength(response) {
        const len = getHeader(response.responseHeaders, 'content-length');
        return len ? parseInt(len, 10) : null;
    }

    async function checkImage(url, options = {}) {
        const {
            timeout = 5000,
            minSize = 300,
            retry = 1
        } = options;

        const headResult = await request(url, 'HEAD', timeout);
        const judged = judgeResponse(headResult, { minSize });

        if (judged.final) {
            return judged.result;
        }

        if (retry > 0) {
            const getResult = await request(url, 'GET', timeout, {
                Range: 'bytes=0-1023'
            });

            return judgeResponse(getResult, { minSize, forceFinal: true }).result;
        }

        return { exists: false, retry: true, reason: 'uncertain' };
    }

    function request(url, method, timeout, headers = {}) {
        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method,
                url,
                headers,
                timeout,
                onload: (res) => resolve({ type: 'load', res }),
                onerror: () => resolve({ type: 'error' }),
                ontimeout: () => resolve({ type: 'timeout' }),
                onabort: () => resolve({ type: 'abort' })
            });
        });
    }

    function judgeResponse(responseWrapper, options = {}) {
        const { minSize = 300, forceFinal = false } = options;

        if (!responseWrapper || responseWrapper.type !== 'load') {
            return {
                final: true,
                result: { exists: false, retry: true, reason: responseWrapper?.type || 'fail' }
            };
        }

        const res = responseWrapper.res;
        const status = res.status;

        if (isCloudflareChallenge(res)) {
            return {
                final: true,
                result: { exists: false, reason: 'cloudflare_block' }
            };
        }

        const isImage = isImageResponse(res);
        const size = getContentLength(res);

        if (status >= 200 && status < 300) {
            if (!isImage) {
                return {
                    final: true,
                    result: { exists: false, reason: 'not_image' }
                };
            }

            if (size !== null && size < minSize) {
                return {
                    final: true,
                    result: { exists: false, reason: 'too_small', size }
                };
            }

            return {
                final: true,
                result: { exists: true, reason: 'ok', size }
            };
        }

        if (status === 403) {
            if (isImage) {
                return {
                    final: true,
                    result: { exists: true, reason: 'forbidden_but_image' }
                };
            }

            return forceFinal
                ? { final: true, result: { exists: false, reason: 'forbidden' } }
                : { final: false };
        }

        if (status === 404) {
            return {
                final: true,
                result: { exists: false, reason: '404' }
            };
        }

        if (status >= 500) {
            return forceFinal
                ? { final: true, result: { exists: false, reason: 'server_error' } }
                : { final: false };
        }

        return forceFinal
            ? { final: true, result: { exists: false, reason: 'unknown' } }
            : { final: false };
    }

    const RETRY_CONCURRENCY = 3;
    let retryWorkers = 0;

    function enqueueFailedImage(imgElement, reason = '') {
        const pureSrc = getPureUrl(imgElement.src);

        if (pureSrc.startsWith('blob:') || pureSrc.startsWith('data:')) {
            return;
        }

        if (retrySet.has(pureSrc) && failedImagesSet.has(pureSrc)) {
            return;
        }

        imgElement.dataset.retryCount = imgElement.dataset.retryCount ? parseInt(imgElement.dataset.retryCount) : 0;

        retryQueue.push({ imgElement });
        retrySet.add(pureSrc);
        console.log(`[ImageRetry] 큐에 이미지 추가됨: `, imgElement, reason);
        startRetryWorkers();
    }

    function startRetryWorkers() {
        while (retryWorkers < RETRY_CONCURRENCY && retryQueue.length > 0) {
            runRetryWorker();
        }
    }

    async function runRetryWorker() {
        if (retryQueue.length === 0) {
            return;
        }
        retryWorkers++;

        const item = retryQueue.shift();
        retrySet.delete(getPureUrl(item.imgElement.src));

        try {
            const imgElement = item.imgElement;
            let retryCount = parseInt(imgElement.dataset.retryCount);

            const imgElementSrc = imgElement.getAttribute('src');
            if (!imgElementSrc || imgElementSrc.startsWith('blob:') || imgElementSrc.startsWith('data:') || imgElementSrc.startsWith('https://wsrv.nl')) {
                return;
            }
            const { exists, reason, status = null } = await checkImage(imgElement.getAttribute('src'));
            console.log(exists, reason, status);
            if (!exists && (reason === 'client_error' || reason === 'server_error')) {
                console.warn(`[ImageRetry] 서버에 존재하지 않는 이미지입니다. 재시도하지 않습니다: ${status ? 'HTTP ' + status : ''} => ${reason}`, imgElement);
                failedImagesSet.add(getPureUrl(imgElement.src));
                saveBadLink(imgElement.src);
                imgElement.dataset.isImageState = "false";
                return;
            }

            if (exists && reason === 'Region restrictions' && !imgElementSrc.startsWith('https://wsrv.nl')) {
                console.log('지역 제한 wsrv.nl 프록시 서비스 사용', imgElement, reason);
                imgElement.setAttribute('src', `https://wsrv.nl/?url=${encodeURIComponent(imgElementSrc)}`);
            }

            imgElement.dataset.retryCount = ++retryCount;
            console.warn(`[ImageRetry] 이미지 재로딩 시도 (${retryCount}회차): `, imgElement);
            function retryError() {
                if (!retrySet.has(getPureUrl(this.src))) {
                    enqueueFailedImage(this, 'retry_error');
                }
                imgElement.removeEventListener('error', retryError);
            }
            imgElement.addEventListener('error', retryError);

        } finally {
            retryWorkers--;
            setTimeout(startRetryWorkers, RETRY_INTERVAL);
        }
    }

    // MutationObserver: 새로 생성된 노드 등록 시 바로 실행하는 대신 IntersectionObserver 등록
    const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.tagName === 'IMG') {
                            viewportObserver.observe(node);
                        }
                        node.querySelectorAll('img').forEach(img => {
                            viewportObserver.observe(img);
                        });
                    }
                });
            }
        }
    });

    function isRealDomain(url) {
        try {
            const u = new URL(url);
            const hostname = u.hostname;

            const regex = /^(?!-)([a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,}$/;
            return regex.test(hostname);
        } catch {
            return false;
        }
    }

    function getPureUrl(url) {
        if (!url) return '';

        if (url.startsWith('https://wsrv.nl')) {
            return url;
        }
        try {
            let absoluteUrl = url;

            if (url.startsWith('//')) {
                absoluteUrl = window.location.protocol + url;
            }
            else if (/^https?:\/\/\//.test(url)) {
                absoluteUrl = url.replace(/^https?:\/\/\//, window.location.origin + '/');
            }
            const u = new URL(absoluteUrl, window.location.href);
            return u.origin + u.pathname;

        } catch (e) {
            console.error(`[Error] URL 파싱 실패: ${url}`, e);
            return url;
        }
    }

    function getFixUrl(videoPageUrl, brokenSrc) {
        return new Promise((resolve, reject) => {
            const fileNameMatch = brokenSrc.match(/\/([^\/]+\.(jpg|jpeg|png|gif|webp))/i);
            if (!fileNameMatch) {
                return reject('파일명 추출 실패');
            }
            const targetFileName = fileNameMatch[1].split('.')[0];

            GM_xmlhttpRequest({
                method: 'GET',
                url: videoPageUrl,
                onload: function (result) {
                    if (result.status === 200) {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(result.responseText, 'text/html');

                        const matchedImg = doc.querySelector(`img[src*="${targetFileName}"]`);

                        if (matchedImg) {
                            const realSrc = matchedImg.getAttribute('src');
                            console.log(`[Success] 매칭 성공: ${realSrc}`);
                            resolve(realSrc);
                        } else {
                            reject(`[Fail] 해당 파일명을 가진 이미지를 찾을 수 없음: ${targetFileName}`);
                        }
                    } else {
                        reject(`서버 응답 에러: ${result.status}`);
                    }
                },
                onerror: reject
            });
        });
    }

    const lazyAttributes = [
        "data-actualsrc",
        "data-cover",
        "data-defer-src",
        "data-imageurl",
        "data-ks-lazyload",
        "data-ks-lazyload-custom",
        "data-lazy-load-src",
        "data-lazy-src",
        "data-lazy-stored-src",
        "data-lazyload",
        "data-lazyload-src",
        "data-orig-file",
        "data-original",
        "data-placeholder",
        "data-src",
        "data-thumb_url",
        "data-url",
    ];

    let lazyAttributesMap = [];
    lazyAttributes.forEach(function (name) {
        lazyAttributesMap[name] = true;
    });

    const targetDomains = `
                imagebam.com
                fastpic.(org|ru|net)
                static-file.com
                dmm.co.jp
                faleno.jp
                eleggp.com
                javstore.net
                `;

    const domainpattern = targetDomains
        .trim()
        .split('\n')
        .map(d => d.replace(/\./g, '\\.').trim())
        .filter(Boolean)
        .join('|');

    const domainRegex = new RegExp(`(${domainpattern})`, 'i');

    function isValidExternalImage(img) {
        if (!img) return false;
        if (img.dataset.isFixing) return false;
        if (img.closest('.image-masonry')) return false;
        if (img.closest('.hiddenbox')) return false;

        // 🔥 CSS 가시성 확인 (display: none 등 체크)
        const isVisible = img.checkVisibility({
            checkOpacity: false,
            checkVisibilityCSS: false
        });

        if (!isVisible) {
            console.log('이미지가 화면에 숨겨져 있습니다 (display: none 포함).', img);
            return false;
        }

        let src = img.src || '';

        if (src.startsWith('http://data:image')) {
            img.src = src.replace('http://', '');
            src = img.src;
        }

        if (src.startsWith('data:image')) {
            for (const attr of img.attributes) {
                if (lazyAttributesMap[attr.name]) {
                    img.src = attr.value;
                    src = attr.value;
                    break;
                }
            }
        }

        if (!src || src.startsWith('blob:') || src.startsWith('data:') || src.startsWith('https://cm-exchange.toast.com/pixel')) {
            return false;
        }

        const rawSrc = img.getAttribute('src') || "";

        if (rawSrc.startsWith('https:///e/attach')) {
            const videoLink = img.closest('a[href*="video.php"]');
            if (videoLink) {
                img.dataset.isFixing = "true";
                console.log(`[Fixing] 이미지 복구 시도 중: ${rawSrc}`);

                getFixUrl(videoLink.href, rawSrc)
                    .then(realUrl => {
                        img.src = realUrl;
                        viewportObserver.observe(img); // 복구된 URL 적용 후 재관찰
                    })
                    .catch(err => console.warn(`[Fix-Error] ${err}`));
            }
            return false;
        }
        else if (src.startsWith('http://')) {
            if (domainRegex.test(src)) {
                img.src = src.replace('http://', 'https://');
                src = img.src;
                console.log(`[HTTPS-Upgrade] 프로토콜 변경 완료: ${img.src}`);
            }
        }
        else if (src.startsWith('https://i.maxjav.com/')) {
            img.src = getRedirectUrl(src, "url");
            src = img.src;
        }

        if (!isRealDomain(src)) {
            console.warn(`정상적인 도메인이 아닙니다. ${src} `, img);
            return false;
        }

        if (isBadLink(src)) {
            console.warn(`[Skip] 이미 404로 기록된 링크입니다: ${src}`);
            img.dataset.isImageState = "false";
            return false;
        }

        const finalRawSrc = img.getAttribute('src');
        if (!finalRawSrc || finalRawSrc.trim() === "" || finalRawSrc === window.location.href) {
            return false;
        }

        if (img.complete && img.naturalWidth > 0) return false;

        return true;
    }

    function getRedirectUrl(url, paramName) {
        try {
            const urlObj = new URL(url);
            const params = new URLSearchParams(urlObj.search);
            const redirectUrl = params.get(paramName);

            return redirectUrl ? decodeURIComponent(redirectUrl) : url;
        } catch (e) {
            console.error("Error_getRedirectUrl: " + e);
            return url;
        }
    }

    function saveBadLink(url) {
        const now = Date.now();
        GM_setValue(getPureUrl(url), now);
    }

    function isBadLink(url) {
        const cleanUrl = getPureUrl(url);
        return GM_getValue(cleanUrl) !== undefined;
    }

    function cleanOldBadLinks() {
        const now = Date.now();
        const oneDayLimit = 24 * 60 * 60 * 1000;
        const keys = GM_listValues();

        keys.forEach(key => {
            const savedTime = GM_getValue(key);
            if (now - savedTime > oneDayLimit) {
                GM_deleteValue(key);
                console.log(`[Storage] 24시간 경과 데이터 삭제: ${key}`);
            }
        });
    }

    window.addEventListener("load", () => {
        cleanOldBadLinks();
        
        // 초기 로드시 모든 이미지를 IntersectionObserver에 관찰 등록
        document.querySelectorAll('img').forEach(img => {
            viewportObserver.observe(img);
        });

        observer.observe(document.body, { childList: true, subtree: true });
        console.log('[ImageRetry] 스크립트 활성화 완료');

    }, { once: true });

})();