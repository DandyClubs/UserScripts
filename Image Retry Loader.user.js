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
    const LOAD_TIMEOUT = 30000; // 5초 타임아웃

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

    async function waitForImage(img, timeout) {
        return new Promise((resolve) => {

            const currentSrc = img.getAttribute('src');

            if (!currentSrc || currentSrc === "" || img.src === window.location.href) {
                return resolve('skipped');
            }

            // 🔥 기존 조건 제거하고 decode 기반으로 변경
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
                // 🔥 여기 추가
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
            //img.setAttribute('src', img.getAttribute('src'));
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
                startLazyWorkers(); // 🔥 끝나자마자 다음 작업
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

    // 🔥 메인 함수
    async function checkImage(url, options = {}) {
        const {
            timeout = 5000,
            minSize = 300,     // 너무 작은 이미지 필터
            retry = 1          // fallback 시도 횟수
        } = options;

        // --- 1️⃣ HEAD 요청 ---
        const headResult = await request(url, 'HEAD', timeout);

        const judged = judgeResponse(headResult, { minSize });

        if (judged.final) {
            return judged.result;
        }

        // --- 2️⃣ fallback: Range GET ---
        if (retry > 0) {
            const getResult = await request(url, 'GET', timeout, {
                Range: 'bytes=0-1023'
            });

            return judgeResponse(getResult, { minSize, forceFinal: true }).result;
        }

        return { exists: false, retry: true, reason: 'uncertain' };
    }

    // 🔥 요청 래퍼
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

    // 🔥 판단 로직 (핵심)
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

        // 🔥 Cloudflare 차단
        if (isCloudflareChallenge(res)) {
            return {
                final: true,
                result: { exists: false, reason: 'cloudflare_block' }
            };
        }

        const isImage = isImageResponse(res);
        const size = getContentLength(res);

        // --- 성공 케이스 ---
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

        // --- 403 ---
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

        // --- 404 ---
        if (status === 404) {
            return {
                final: true,
                result: { exists: false, reason: '404' }
            };
        }

        // --- 5xx ---
        if (status >= 500) {
            return forceFinal
                ? { final: true, result: { exists: false, reason: 'server_error' } }
                : { final: false };
        }

        // --- 기타 ---
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

    /**
     * 큐에 있는 이미지를 순차적으로 처리하는 함수
     */
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

            // 재시도 전에 GM_xmlhttpRequest를 사용하여 실제 파일 존재 여부 확인
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
            //imgElement.setAttribute('src', imgElementSrc);
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

    // MutationObserver 설정
    const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.tagName === 'IMG') {
                            if (isValidExternalImage(node)) {
                                node.setAttribute('loading', 'lazy');
                                //img.setAttribute('decoding', 'auto');
                                lazyImageQueue.enqueue(node);
                                startLazyWorkers();
                            }

                        }
                        node.querySelectorAll('img').forEach(img => {
                            if (isValidExternalImage(img)) {
                                img.setAttribute('loading', 'lazy');
                                //img.setAttribute('decoding', 'auto');
                                lazyImageQueue.enqueue(img);
                                startLazyWorkers();
                            }

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

        // 1. 특정 서비스(프록시) 예외 처리
        if (url.startsWith('https://wsrv.nl')) {
            return url;
        }
        try {
            let absoluteUrl = url;

            // 2. 프로토콜 상대 경로 (//) 처리
            if (url.startsWith('//')) {
                absoluteUrl = window.location.protocol + url;
            }
            // 3. 도메인 누락 (https:///) 처리
            else if (/^https?:\/\/\//.test(url)) {
                absoluteUrl = url.replace(/^https?:\/\/\//, window.location.origin + '/');
            }
            // 4. 상대 경로 (./ 또는 / 또는 그냥 파일명) 처리
            // new URL(상대경로, 기준경로)를 사용하면 브라우저가 알아서 합쳐줍니다.
            const u = new URL(absoluteUrl, window.location.href);
            return u.origin + u.pathname;

        } catch (e) {
            console.error(`[Error] URL 파싱 실패: ${url}`, e);
            return url;
        }
    }

    function getFixUrl(videoPageUrl, brokenSrc) {
        return new Promise((resolve, reject) => {
            // 1. 깨진 주소에서 파일명만 추출 (예: 20260226023129_9982.jpg)
            const fileNameMatch = brokenSrc.match(/\/([^\/]+\.(jpg|jpeg|png|gif|webp))/i);
            if (!fileNameMatch) {
                return reject('파일명 추출 실패');
            }
            const targetFileName = fileNameMatch[1].split('.')[0]; // 확장자 제외 이름만 비교 (안전함)

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
    /**
     * 처리가 필요한 이미지인지 확인 (data: URI 제외)
     */


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

    // 转为 Object
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

    // 1. 문자열 정리 및 배열화
    const domainpattern = targetDomains
        .trim()                     // 앞뒤 공백 제거
        .split('\n')                // 줄바꿈으로 분리
        .map(d => d.replace(/\./g, '\\.').trim())         // 각 라인별 공백 제거
        .filter(Boolean)
        .join('|');     // 빈 줄 제외


    // 3. RegExp 객체 생성 (Case Insensitive: i 플래그 권장)
    const domainRegex = new RegExp(`(${domainpattern})`, 'i');



function isValidExternalImage(img) {
    // 1. 공통 Guard Clauses (최상단 배치로 불필요한 연산 즉시 차단)
    if (!img) return false;
    if (img.dataset.isFixing) return false;
    if (img.closest('.image-masonry')) return false;

    // 참조 편의를 위한 로컬 변수 선언
    let src = img.src || '';

    // 2. Lazy / Data URI 1차 정규화 (상호 배타적 구조)
    if (src.startsWith('http://data:image')) {
        img.src = src.replace('http://', '');
        src = img.src;
    }
    
    if (src.startsWith('data:image')) {
        // look for lazy attributes
        for (const attr of img.attributes) {
            if (lazyAttributesMap[attr.name]) {
                img.src = attr.value;
                src = attr.value; // 변경된 주소 동기화
                break;
            }
        }
    } 

    // 3. 무효한 포맷 및 트래커 선제 차단
    if (!src || src.startsWith('blob:') || src.startsWith('data:') || src.startsWith('https://cm-exchange.toast.com/pixel')) {
        return false;
    }

    // 4. 특정 도메인 및 경로별 조건 분기 최적화 (if - else if)
    const rawSrc = img.getAttribute('src') || "";

    if (rawSrc.startsWith('https:///e/attach')) {
        const videoLink = img.closest('a[href*="video.php"]');
        if (videoLink) {
            img.dataset.isFixing = "true";
            console.log(`[Fixing] 이미지 복구 시도 중: ${rawSrc}`);

            getFixUrl(videoLink.href, rawSrc)
                .then(realUrl => {
                    img.src = realUrl;
                    lazyImageQueue.enqueue(img);
                    startLazyWorkers();
                })
                .catch(err => console.warn(`[Fix-Error] ${err}`));
        }
        return false; // 이 조건에 해당하면 이후의 무의미한 도메인 체크를 건너뛰고 즉시 종료
    } 
    // 위 조건이 아닐 때만 아래 도메인 분기들을 탑니다.
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

    // 5. 최종 도메인 및 링크 상태 검증
    if (!isRealDomain(src)) {
        console.warn(`정상적인 도메인이 아닙니다. ${src} `, img);
        return false;
    }

    if (isBadLink(src)) {
        console.warn(`[Skip] 이미 404로 기록된 링크입니다: ${src}`);
        img.dataset.isImageState = "false";
        return false;
    }

    // HTML 원본 고유 검증 (최종 단계)
    const finalRawSrc = img.getAttribute('src');
    if (!finalRawSrc || finalRawSrc.trim() === "" || finalRawSrc === window.location.href) {
        return false;
    }

    // 이미 로드가 잘 완료된 이미지 제외
    if (img.complete && img.naturalWidth > 0) return false;

    return true;
}


    function getRedirectUrl(url, paramName) {
        try {
            // 1. URL 객체를 사용하여 파라미터를 추출 (현대적인 방식)
            const urlObj = new URL(url);
            const params = new URLSearchParams(urlObj.search);
            const redirectUrl = params.get(paramName);

            // 2. 결과값이 있으면 디코딩하여 반환, 없으면 원본 URL 반환
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
        const oneDayLimit = 24 * 60 * 60 * 1000; // 24시간 (밀리초)
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
        document.querySelectorAll('img').forEach(img => {
            if (isValidExternalImage(img)) {
                img.setAttribute('loading', 'lazy');
                //img.setAttribute('decoding', 'auto');
                lazyImageQueue.enqueue(img);
            }

        });
        startLazyWorkers();

        observer.observe(document.body, { childList: true, subtree: true });
        console.log('[ImageRetry] 스크립트 활성화 완료');

    }, { once: true });


})();