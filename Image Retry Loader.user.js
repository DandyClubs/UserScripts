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
// @noframes
// ==/UserScript==

(function () {
    'use strict';

    // 이미지 재시도 큐
    const retryQueue = [];
    let isProcessing = false;

    // 재시도 간격 및 횟수
    const RETRY_INTERVAL = 10000;
    const MAX_RETRY_COUNT = 1;
    const LOAD_TIMEOUT = 5000; // 5초 타임아웃

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
    let isLazyProcessing = false;

    function waitForImage(img, timeout) {
        return new Promise((resolve) => {
            const timer = setTimeout(() => {
                console.warn(`[ImageRetry] 로딩 타임아웃 (다음으로 넘어감): ${img.src}`);
                cleanup();
                resolve('timeout');
            }, timeout);

            function cleanup() {
                clearTimeout(timer);
                img.removeEventListener('load', onLoad);
                img.removeEventListener('error', onError);
            }

            function onLoad() { cleanup(); resolve('loaded'); }
            function onError() { cleanup(); resolve('error'); }

            img.addEventListener('load', onLoad);
            img.addEventListener('error', onError);

            // 강제 로딩 시작
            img.setAttribute('loading', 'eager');
            // src가 이미 설정되어 있다면 다시 할당하여 로딩 트리거 (일부 브라우저 대응)
            const currentSrc = img.src;
            img.src = currentSrc;
        });
    }

    async function processLazyQueue() {
        if (isLazyProcessing) return;
        isLazyProcessing = true;

        while (!lazyImageQueue.isEmpty()) {
            const img = lazyImageQueue.dequeue();
            if (img && img.isConnected) { // 문서에 붙어있는지 확인
                //console.log(`[ImageRetry] 순차 로딩 시작: ${img.src}`);
                await waitForImage(img, LOAD_TIMEOUT);
            }
        }

        isLazyProcessing = false;
    }


    // GM_xmlhttpRequest를 이용한 이미지 존재 여부 확인 (상태별 처리)
    function checkImageExistenceWithGM(url) {
        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method: 'HEAD',
                url: !/^https?:/.test(url) ? new URL(url, location)?.href : url,
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
        if (retryQueue.some(item => item === imgElement)) {
            return;
        }

        imgElement.dataset.retryCount = imgElement.dataset.retryCount ? parseInt(imgElement.dataset.retryCount) : 0;

        retryQueue.push({ imgElement });
        //console.log(`[ImageRetry] 큐에 이미지 추가됨: `, imgElement);

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
            console.warn(`[ImageRetry] 최대 재시도 횟수 초과: `, imgElement);
            return;
        }

        // 재시도 전에 GM_xmlhttpRequest를 사용하여 실제 파일 존재 여부 확인
        const imgElementSrc = imgElement.getAttribute('src');
        const exists = await checkImageExistenceWithGM(imgElement.getAttribute('src'));
        if (!exists) {
            console.log(`[ImageRetry] 서버에 존재하지 않는 이미지입니다. 재시도하지 않습니다: `, imgElement);
            return;
        }

        imgElement.dataset.retryCount = ++retryCount;
        imgElement.onerror = null;
        imgElement.setAttribute('src', imgElementSrc);
        console.log(`[ImageRetry] 이미지 재로딩 시도 (${retryCount}회차): `, imgElement);

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
                            if (isValidExternalImage(node)) {
                                //node.setAttribute('loading', 'lazy');
                                lazyImageQueue.enqueue(node);
                                if (!isLazyProcessing) {
                                    processLazyQueue();
                                }        
                            }                                  
                            addErrorListenerToImages(node);
                        }
                        node.querySelectorAll('img').forEach(img => {  
                            if (isValidExternalImage(img)) {
                                //img.setAttribute('loading', 'lazy');
                                lazyImageQueue.enqueue(img);
                                if (!isLazyProcessing) {
                                    processLazyQueue();
                                }        
                            }                                      
                            addErrorListenerToImages(img);
                        });
                    }                    
                });
            }            
        }
    });


    /**
     * 처리가 필요한 이미지인지 확인 (data: URI 제외)
     */
    function isValidExternalImage(img) {
        // src가 없거나, 이미 로딩 완료되었거나, data: 형식인 경우 제외
        if (!img || !img.src) return false;
        if (img.src.startsWith('data:')) return false;
        if (img.complete) return false;        
        return true;
    }


    window.addEventListener("DOMContentLoaded", () => {
        document.querySelectorAll('img').forEach(img => {    
            if (isValidExternalImage(img)) {
                //img.setAttribute('loading', 'lazy');                
                lazyImageQueue.enqueue(img);
            }            
            addErrorListenerToImages(img);
        });

        if (!isLazyProcessing) {
            processLazyQueue();
        }        

        observer.observe(document.body, { childList: true, subtree: true });
        console.log('[ImageRetry] 스크립트 활성화 완료');

    }, { once: true });


})();