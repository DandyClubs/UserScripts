// ==UserScript==
// @name         Image Retry Loader with GM_xmlhttpRequest
// @namespace    http://tampermonkey.net/
// @version      2025.08.11
// @description  Automatically retries loading failed images by checking their existence with GM_xmlhttpRequest.
// @author       Your Name
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @connect      *
// @run-at       document-start
// @noframes
// ==/UserScript==

(function () {
    'use strict';



    // placeholder인지 여부를 떠나 src가 존재하면 임시 저장하고 비워버림
    function preventEarlyImageLoad() {
        if (document.visibilityState === 'hidden') {
            document.querySelectorAll('img').forEach(img => {
                if (img.src && !img.dataset.lazyStoredSrc) {
                    const srcUrl = img.getAttribute('src');

                    // 이미 data-*에 저장된 경우 중복 방지
                    if (srcUrl && !srcUrl.startsWith('data:')) {
                        img.setAttribute('data-lazy-stored-src', srcUrl);
                        img.src = ''; // 이미지 비우기 → lazy load 차단
                    }
                }
            });
        }
    }

    // 예외 처리 포함해서 safe하게 작성하면:
    function safePreventImageLoad() {
        if (document.visibilityState === 'hidden') {
            preventEarlyImageLoad();
        }
    }

    // visible 상태가 되면 src 복구
    function loadImages() {
        document.querySelectorAll('img').forEach(img => {
            const lazySrc =
                img.getAttribute('data-lazy-stored-src') ||
                img.getAttribute('data-src') ||
                img.getAttribute('data-original') ||
                img.getAttribute('data-lazy') ||
                img.getAttribute('data-lazy-src') ||
                img.getAttribute('data-img');

            if (lazySrc) {
                img.src = lazySrc;
                img.removeAttribute('data-lazy-stored-src');
                addErrorListenerToImages(img)
            }
        });
    }




    // 이미지 재시도 큐
    const retryQueue = [];
    let isProcessing = false;

    // 재시도 간격 및 횟수
    const RETRY_INTERVAL = 10000;
    const MAX_RETRY_COUNT = 1;

    
    // GM_xmlhttpRequest를 이용한 이미지 존재 여부 확인 (상태별 처리)
    function checkImageExistenceWithGM(url) {
        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method: 'HEAD',
                url: url,
                timeout: 5000, // 5초 제한
                onload: function (response) {
                    const status = response.status;

                    if (status === 0) {
                        const sameDomain = location.hostname === new URL(url, location.href).hostname;
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


    /**
     * 큐에 이미지 추가 함수
     */
    function enqueueFailedImage(imgElement) {
        if (retryQueue.some(item => item.imgElement === imgElement)) {
            return;
        }

        imgElement.dataset.retryCount = imgElement.dataset.retryCount ? parseInt(imgElement.dataset.retryCount) : 0;

        retryQueue.push({ imgElement });
        console.log(`[ImageRetry] 큐에 이미지 추가됨: ${imgElement.src}`);

        if (!isProcessing) {
            processQueue();
        }
    }

    /**
     * 큐에 있는 이미지를 순차적으로 처리하는 함수
     */
    async function processQueue() {
        if (retryQueue.length === 0) {
            isProcessing = false;
            console.log('[ImageRetry] 큐 처리 완료');
            return;
        }

        isProcessing = true;
        const item = retryQueue.shift();
        const imgElement = item.imgElement;
        let retryCount = parseInt(imgElement.dataset.retryCount);

        if (retryCount >= MAX_RETRY_COUNT) {
            console.warn(`[ImageRetry] 최대 재시도 횟수 초과: ${imgElement.src}`);
            return;
        }

        // 재시도 전에 GM_xmlhttpRequest를 사용하여 실제 파일 존재 여부 확인
        const exists = await checkImageExistenceWithGM(imgElement.src);
        if (!exists) {
            console.log(`[ImageRetry] 서버에 존재하지 않는 이미지입니다. 재시도하지 않습니다: ${imgElement.src}`);
            return;
        }

        imgElement.dataset.retryCount = ++retryCount;
        imgElement.onerror = null;
        imgElement.src = imgElement.src;
        console.log(`[ImageRetry] 이미지 재로딩 시도 (${retryCount}회차): ${imgElement.src}`);

        imgElement.onerror = function () {
            enqueueFailedImage(this);
        };

        setTimeout(processQueue, RETRY_INTERVAL);
    }

    // 새로운 이미지에 onerror 이벤트 리스너를 추가하는 함수
    function addErrorListenerToImages(element) {
        if (element.tagName === 'IMG' && element.src) {
            if (!element.complete || (element.naturalWidth === 0 && element.naturalHeight === 0)) {
                element.onerror = function () {
                    enqueueFailedImage(this);
                };
            }
        }
    }

    // MutationObserver 설정
    const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.tagName === 'IMG') {
                            addErrorListenerToImages(node);
                        }
                        node.querySelectorAll('img').forEach(img => addErrorListenerToImages(img));
                    }
                });
            }
        }
    });


    if (document.readyState === 'loading') {
        window.addEventListener("DOMContentLoaded", () => {

            safePreventImageLoad();
            // 시작 시 히든이라면 강제 초기화
            preventEarlyImageLoad();

            if (document.visibilityState === 'visible') {
                loadImages();
            } else {
                const onVisible = () => {
                    if (document.visibilityState === 'visible') {
                        loadImages();
                        document.removeEventListener('visibilitychange', onVisible);
                    }
                };
                document.addEventListener('visibilitychange', onVisible);
            }
            // 스크립트 실행 시작

            document.querySelectorAll('img').forEach(img => addErrorListenerToImages(img));
            observer.observe(document.body, { childList: true, subtree: true });
            console.log('[ImageRetry] 스크립트 활성화 완료');

        }, { once: true });
    } else {
        safePreventImageLoad(); // 이미 로딩된 경우 즉시 실행
    }

})();