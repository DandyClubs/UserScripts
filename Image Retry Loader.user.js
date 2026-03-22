// ==UserScript==
// @name         Image Retry Loader with GM_xmlhttpRequest
// @namespace    http://tampermonkey.net/
// @version      2025.10.13
// @description  Automatically retries loading failed images by checking their existence with GM_xmlhttpRequest.
// @author       Your Name
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @connect      *
// @run-at       document-start
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
    const LOAD_TIMEOUT = 60000; // 5초 타임아웃

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
                    .then(() => resolve('loaded'))
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
                    .then(() => resolve('loaded'))
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
            img.src = currentSrc;
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
                if (result === 'error' || result === 'timeout' || result === 'corrupted') {
                    img.onerror = null;
                    if (!retrySet.has(getPureUrl(img.src))) {
                        enqueueFailedImage(img, result);
                    }
                }
                activeWorkers--;
                startLazyWorkers(); // 🔥 끝나자마자 다음 작업
            });
        }
    }


    // GM_xmlhttpRequest를 이용한 이미지 존재 여부 확인 (상태별 처리)
    function checkImageExistenceWithGM(link) {
        const url = getPureUrl(link);
        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method: 'HEAD',
                url: url,
                timeout: 5000, // 5초 제한
                onload: function (response) {
                    const status = response.status;

                    if (status === 0) {
                        const sameDomain = location.hostname === new URL(url).hostname;
                        if (sameDomain) {
                            console.warn(`[ImageRetry] status=0 (같은 도메인) → 네트워크 문제, 재시도 가능: ${url}`);
                            resolve({ exists: false, retry: true, reason: 'network_error' });
                        } else {
                            console.warn(`[ImageRetry] status=0 (외부 도메인) → CORS 가능성, 재시도 허용: ${url}`);
                            resolve({ exists: true, retry: true, reason: 'cors_possible' });
                        }
                    }
                    else if (status >= 200 && status < 300) {
                        console.log(`[ImageRetry] 이미지 존재 확인됨 (HTTP ${status}): ${url}`);
                        resolve({ exists: true, reason: 'ok' });
                    }
                    else if (status >= 300 && status < 400) {
                        console.warn(`[ImageRetry] 리다이렉트 응답 (HTTP ${status}): ${url}`);
                        // GM_xmlhttpRequest는 리다이렉트를 따라가므로 이 경우는 거의 없음
                        resolve({ exists: true, reason: 'redirect' });
                    }
                    else if (status >= 400 && status < 500) {
                        console.warn(`[ImageRetry] 클라이언트 오류 (HTTP ${status}) → 이미지 없음: ${url}`);
                        resolve({ exists: false, reason: 'client_error' });
                    }
                    else if (status >= 500) {
                        console.warn(`[ImageRetry] 서버 오류 (HTTP ${status}) → 재시도 가능: ${url}`);
                        resolve({ exists: false, reason: 'server_error' });
                    }
                    else {
                        console.warn(`[ImageRetry] 알 수 없는 응답 (HTTP ${status}): ${url}`);
                        resolve({ exists: false, reason: 'unknown' });
                    }
                },
                onerror: function () {
                    console.error(`[ImageRetry] 요청 오류: ${url}`);
                    resolve({ exists: false, reason: 'request_error' });
                },
                onabort: function () {
                    console.error(`[ImageRetry] 요청 중단됨: ${url}`);
                    resolve({ exists: false, reason: 'aborted' });
                },
                ontimeout: function () {
                    console.error(`[ImageRetry] 요청 시간 초과: ${url}`);
                    resolve({ exists: false, reason: 'timeout' });
                }
            });
        });
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

            if (retryCount >= MAX_RETRY_COUNT) {
                console.warn(`[ImageRetry] 최대 재시도 횟수 초과: `, imgElement);
                console.log('wsrv.nl 프록시 서비스 사용', imgElement);
                imgElement.src = `https://wsrv.nl/?url=${encodeURIComponent(getPureUrl(imgElement.src))}`;
                return;
            }

            // 재시도 전에 GM_xmlhttpRequest를 사용하여 실제 파일 존재 여부 확인
            const imgElementSrc = imgElement.getAttribute('src');
            if (!imgElementSrc || imgElementSrc.startsWith('blob:') || imgElementSrc.startsWith('data:') || imgElementSrc.startsWith('https://wsrv.nl')) {
                return;
            }
            const { exists, reason, status = null } = await checkImageExistenceWithGM(imgElement.getAttribute('src'));
            if (!exists && (reason === 'client_error' || reason === 'server_error')) {
                console.log(`[ImageRetry] 서버에 존재하지 않는 이미지입니다. 재시도하지 않습니다: ${status ? 'HTTP ' + status : ''} => ${reason}`, imgElement);
                failedImagesSet.add(getPureUrl(imgElement.src));
                saveBadLink(imgElement.src);
                imgElement.dataset.isBadImage = "true";
                return;
            }

            if (!exists && !imgElementSrc.startsWith('https://wsrv.nl')) {
                console.log('wsrv.nl 프록시 서비스 사용', imgElement);
                imgElement.src = `https://wsrv.nl/?url=${encodeURIComponent(imgElementSrc)}`;
                /*
                만약 weserv.nl이 느리다면 아래 주소로 교체해서 테스트해 보세요:;
                https://wsrv.nl/?url=${encodeURIComponent(realSrc)} (같은 서비스의 짧은 도메인)
                https://images1-focus-opensocial.googleusercontent.com/gadgets/proxy?container=focus&refresh=2592000&url=${encodeURIComponent(realSrc)} (구글 프록시)
                */
            }

            imgElement.dataset.retryCount = ++retryCount;
            imgElement.onerror = null;
            imgElement.setAttribute('src', imgElementSrc);
            console.log(`[ImageRetry] 이미지 재로딩 시도 (${retryCount}회차): `, imgElement);
            imgElement.onerror = function () {
                if (!retrySet.has(getPureUrl(this.src))) {
                    enqueueFailedImage(this, 'retry_error');
                }
            };

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
                                node.setAttribute('decoding', 'async');
                                lazyImageQueue.enqueue(node);
                                startLazyWorkers();
                            }

                        }
                        node.querySelectorAll('img').forEach(img => {
                            if (isValidExternalImage(img)) {
                                img.setAttribute('loading', 'lazy');
                                img.setAttribute('decoding', 'async');
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
    function isValidExternalImage(img) {
        if (!img) return false;

        if (!img.src || img.src.startsWith('blob:') || img.src.startsWith('data:')) {
            return false;
        }

        if (img.dataset.isFixing) return false;
        let rawSrc = img.getAttribute('src') || "";

        if (rawSrc.startsWith('https:///e/attach')) {
            const videoLink = img.closest('a[href*="video.php"]');
            if (videoLink) {
                // 🔥 [변경] 복구 시작 기록
                img.dataset.isFixing = "true";
                console.log(`[Fixing] 이미지 복구 시도 중: ${rawSrc}`);

                getFixUrl(videoLink.href, rawSrc)
                    .then(realUrl => {
                        img.src = realUrl;
                        // 성공 후 로딩 대기열에 다시 추가 (선택 사항)                        
                        lazyImageQueue.enqueue(img);
                        startLazyWorkers();
                    })
                    .catch(err => console.warn(`[Fix-Error] ${err}`))
                    .finally(() => {
                        // 작업 완료 후 플래그 제거는 하지 않음 (성공/실패 여부와 상관없이 재요청 방지)
                    });
            }
            return false;
        }
        // 현재는 깨진 상태이므로 검사 로직상 false 반환

        if (img.src.startsWith('http://')) {
            const targetDomains = [/imagebam\.com/i, /fastpic\.(org|ru|net)/i, /static-file\.com/i, /dmm\.co\.jp/i, /faleno\.jp/i];
            const isTarget = targetDomains.some(regex => regex.test(img.src));

            if (isTarget) {
                img.src = img.src.replace('http://', 'https://');
                console.log(`[HTTPS-Upgrade] 프로토콜 변경 완료: ${img.src}`);
            }
        }

        if (!isRealDomain(img.src)) {
            console.warn(`정상적인 도메인이 아닙니다. ${img.src}`);
            return false;
        }

        if (isBadLink(img.src)) {
            console.warn(`[Skip] 이미 404로 기록된 링크입니다: ${img.src}`);
            return false;
        }        

        // getAttribute를 사용하여 HTML에 적힌 원본 src 값을 확인 (비어있으면 차단)
        rawSrc = img.getAttribute('src');
        if (!rawSrc || rawSrc.trim() === "" || rawSrc === window.location.href) {
            return false;
        }       

        // 이미 잘 로드된 경우 제외
        if (img.complete && img.naturalWidth > 0) return false;

        return true;
    }

    function saveBadLink(url) {
        const now = Date.now();
        GM_setValue(getPureUrl(url), now);
    }

    function isBadLink(url) {
        return GM_getValue(getPureUrl(url)) !== undefined;
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

    window.addEventListener("DOMContentLoaded", () => {
        cleanOldBadLinks();
        document.querySelectorAll('img').forEach(img => {
            if (isValidExternalImage(img)) {
                img.setAttribute('loading', 'lazy');
                img.setAttribute('decoding', 'async');
                lazyImageQueue.enqueue(img);
            }

        });
        startLazyWorkers();

        observer.observe(document.body, { childList: true, subtree: true });
        console.log('[ImageRetry] 스크립트 활성화 완료');

    }, { once: true });


})();