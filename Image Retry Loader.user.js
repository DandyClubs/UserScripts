// ==UserScript==
// @name         Image Retry Loader
// @namespace    http://tampermonkey.net/
// @version      2026.11.07
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
// @require      https://cdn.jsdelivr.net/npm/tldts@7.4.19/dist/index.umd.min.js
// @noframes
// ==/UserScript==

(function () {
    'use strict';


    // 이미지 재시도 큐    
    const retryQueue = [];
    const retrySet = new Set();
    const failedImagesSet = new Set();
    const imageCheckCache = new WeakMap();

    // 재시도 간격 및 횟수
    const RETRY_INTERVAL = 10000;
    const MAX_RETRY_COUNT = 3;
    const LOAD_TIMEOUT = 30000; // 30초 타임아웃
    const PROXY_LOAD_TIMEOUT = 30000;

    const tryProxy = ['https://proxy.duckduckgo.com/iu/?u=', 'https://wsrv.nl/?url=']
    const SUCCESSFUL_PROXY_STORAGE_PREFIX = 'successfulProxy:';
    const STORAGE_EXPIRATION = 24 * 60 * 60 * 1000;
    const BAD_URL_PREFIX = 'badUrl:';
    const PROXY_URL_CACHE_PREFIX = 'imageRetryProxyUrl:';
    const PROXY_URL_CACHE_EXPIRATION = 48 * 60 * 60 * 1000;
    const successfulProxyByDomain = new Map();

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
    const queuedLazyImages = new WeakSet();
    const appliedCachedProxyUrls = new WeakMap();


    const checkImageVisibility = (img) => {
        if (!img || queuedLazyImages.has(img)) return;

        if (isListImage(img)) {
            queuedLazyImages.add(img);
            img.setAttribute('loading', 'lazy');
            lazyImageQueue.enqueue(img);
            startLazyWorkers();
        }
    };


    async function waitForImage(img, timeout) {
        return new Promise((resolve) => {

            const currentSrc = img.getAttribute('src');

            if (!currentSrc || currentSrc === "" || img.src === window.location.href) {
                img.dataset.loaded = "false";
                resolve('skipped');
            }

            if (img.complete && img.naturalWidth !== 0) {
                img.decode()
                    .then(() => {
                        img.dataset.loaded = "true";
                        resolve('loaded');
                    })
                    .catch(() => {
                        console.warn('[ImageRetry] decode 실패 → 깨진 이미지 감지:', img.src);
                        resolve('corrupted');
                    });                
            }

            if (img.src.startsWith('blob:')) {
                img.dataset.loaded = "true";
                resolve('loaded');
            }

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
                        img.dataset.loaded = "true";
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

        try {
            if (img && img.isConnected) {
                const result = await waitForImage(img, LOAD_TIMEOUT);
                if (result === 'error' || result === 'corrupted' || result === 'timeout') {
                    const originalSrc = appliedCachedProxyUrls.get(img);
                    if (originalSrc) {
                        appliedCachedProxyUrls.delete(img);
                        removeProxyUrl(originalSrc);
                        img.src = originalSrc;
                    }
                    if (!retrySet.has(getPureUrl(img.src))) {
                        enqueueFailedImage(img, result);
                    }
                } else {
                    appliedCachedProxyUrls.delete(img);
                }
            }
        } finally {
            queuedLazyImages.delete(img);
            activeWorkers--;
            startLazyWorkers();
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

    function getProxyUrlCacheKey(originalUrl) {
        return `${PROXY_URL_CACHE_PREFIX}${originalUrl}`;
    }

    function readProxyUrlCache(originalUrl) {
        let serialized;
        try {
            serialized = localStorage.getItem(getProxyUrlCacheKey(originalUrl));
        } catch (error) {
            console.error('[ImageRetry] 프록시 URL 캐시를 읽을 수 없습니다:', error);
            return null;
        }

        if (!serialized) return null;

        try {
            const saved = JSON.parse(serialized);
            if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
                return saved;
            }
            console.error('[ImageRetry] 프록시 URL 캐시 형식이 올바르지 않습니다.');
        } catch (error) {
            console.error('[ImageRetry] 프록시 URL 캐시를 파싱할 수 없습니다:', error);
        }

        try {
            localStorage.removeItem(getProxyUrlCacheKey(originalUrl));
        } catch (error) {
            console.error('[ImageRetry] 손상된 프록시 URL 캐시를 삭제할 수 없습니다:', error);
        }
        return null;
    }

    function writeProxyUrlCache(originalUrl, saved) {
        try {
            localStorage.setItem(getProxyUrlCacheKey(originalUrl), JSON.stringify(saved));
        } catch (error) {
            console.error('[ImageRetry] 프록시 URL 캐시를 저장할 수 없습니다:', error);
        }
    }


    function cleanProxyUrlCache() {

        let cacheKeys;
        try {
            cacheKeys = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index))
                .filter(key => key && key.startsWith(PROXY_URL_CACHE_PREFIX));
        } catch (error) {
            console.error('[ImageRetry] 프록시 URL 캐시 목록을 읽을 수 없습니다:', error);
            return;
        }

        for (const cacheKey of cacheKeys) {
            const originalUrl = cacheKey.slice(PROXY_URL_CACHE_PREFIX.length);
            getSavedProxyUrl(originalUrl);
        }
    }

    function saveProxyUrl(originalUrl, proxyUrl) {
        if (!originalUrl || !proxyUrl || !isProxyUrl(proxyUrl)) return;

        writeProxyUrlCache(originalUrl, {
            proxyUrl,
            savedAt: Date.now()
        });
    }

    function removeProxyUrl(originalUrl) {
        try {
            localStorage.removeItem(getProxyUrlCacheKey(originalUrl));
        } catch (error) {
            console.error('[ImageRetry] 프록시 URL 캐시를 삭제할 수 없습니다:', error);
        }
    }

    function getSavedProxyUrl(originalUrl) {
        const saved = readProxyUrlCache(originalUrl);
        if (!saved) return null;

        if (typeof saved.proxyUrl !== 'string' ||
            !isProxyUrl(saved.proxyUrl) ||
            !Number.isFinite(saved.savedAt) ||
            Date.now() - saved.savedAt > PROXY_URL_CACHE_EXPIRATION) {
            removeProxyUrl(originalUrl);
            return null;
        }

        return saved.proxyUrl;
    }

    async function getCachedProxyUrl(originalUrl) {
        const proxyUrl = getSavedProxyUrl(originalUrl);
        if (!proxyUrl) return null;

        const result = await checkImage(proxyUrl, { timeout: PROXY_LOAD_TIMEOUT, minSize: 0 });
        if (result.exists) return proxyUrl;

        removeProxyUrl(originalUrl);
        return null;
    }

    function findFirstWorkingProxy(url, proxyUrls) {
        if (proxyUrls.length === 0) return Promise.resolve(null);

        return new Promise((resolve) => {
            let remaining = proxyUrls.length;
            let found = false;

            for (const proxyUrl of proxyUrls) {
                const candidateUrl = `${proxyUrl}${encodeURIComponent(url)}`;
                checkImage(candidateUrl, { timeout: PROXY_LOAD_TIMEOUT, minSize: 0 }).then(result => {
                    if (result.exists && !found) {
                        found = true;
                        resolve(candidateUrl);
                        return;
                    }

                    remaining--;
                    if (remaining === 0 && !found) resolve(null);
                });
            }
        });
    }

    function getSuccessfulProxy(imageDomain) {
        const storageKey = `${SUCCESSFUL_PROXY_STORAGE_PREFIX}${imageDomain}`;
        const saved = successfulProxyByDomain.get(imageDomain) || GM_getValue(storageKey);
        if (!saved) return null;

        if (!tryProxy.includes(saved.proxyUrl) ||
            !Number.isFinite(saved.savedAt) ||
            Date.now() - saved.savedAt > STORAGE_EXPIRATION) {
            successfulProxyByDomain.delete(imageDomain);
            GM_deleteValue(storageKey);
            return null;
        }

        successfulProxyByDomain.set(imageDomain, saved);
        return saved.proxyUrl;
    }

    function saveSuccessfulProxy(imageDomain, proxyUrl) {
        const saved = {
            proxyUrl,
            savedAt: Date.now()
        };
        successfulProxyByDomain.set(imageDomain, saved);
        GM_setValue(`${SUCCESSFUL_PROXY_STORAGE_PREFIX}${imageDomain}`, saved);
    }

    async function findWorkingProxy(url) {
        const cachedProxyUrl = await getCachedProxyUrl(url);
        if (cachedProxyUrl) return cachedProxyUrl;

        let imageDomain;
        try {
            imageDomain = new URL(url).hostname.toLowerCase();
        } catch {
            imageDomain = null;
        }

        const preferredProxy = imageDomain ? getSuccessfulProxy(imageDomain) : null;
        if (preferredProxy) {
            const candidateUrl = `${preferredProxy}${encodeURIComponent(url)}`;
            const result = await checkImage(candidateUrl, { timeout: PROXY_LOAD_TIMEOUT, minSize: 0 });
            if (result.exists) {
                saveProxyUrl(url, candidateUrl);
                return candidateUrl;
            }
            successfulProxyByDomain.delete(imageDomain);
            GM_deleteValue(`${SUCCESSFUL_PROXY_STORAGE_PREFIX}${imageDomain}`);
        }

        const fallbackProxies = tryProxy.filter(proxyUrl => proxyUrl !== preferredProxy);
        const workingProxy = await findFirstWorkingProxy(url, fallbackProxies);
        if (workingProxy && imageDomain) {
            const successfulProxy = tryProxy.find(proxyUrl => workingProxy.startsWith(proxyUrl));
            if (successfulProxy) saveSuccessfulProxy(imageDomain, successfulProxy);
        }
        if (workingProxy) saveProxyUrl(url, workingProxy);
        return workingProxy;
    }

    function isProxyUrl(url) {
        return tryProxy.some(proxyUrl => url.startsWith(proxyUrl));
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

        if (status === 400) {
            return {
                final: true,
                result: { exists: false, reason: '400' }
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
                ? { final: true, result: { exists: false, reason: 'Region restrictions', status } }
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
        if (!imgElement || !imgElement.isConnected) {
            return;
        }
        const pureSrc = getPureUrl(imgElement.src);

        if (pureSrc.startsWith('blob:') || pureSrc.startsWith('data:')) {
            return;
        }

        if (retrySet.has(pureSrc) && failedImagesSet.has(pureSrc)) {
            return;
        }

        imgElement.dataset.retryCount = imgElement.dataset.retryCount ? parseInt(imgElement.dataset.retryCount) : 1;

        retryQueue.push({ imgElement, reason });
        retrySet.add(pureSrc);
        console.log(`[ImageRetry] 큐에 이미지 추가됨: \n${imgElement.src}\n`, imgElement,  `\n${reason}`);
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
            const imgElementSrc = imgElement.src;
            if (!imgElement || !imgElement.isConnected || !imgElementSrc || imgElementSrc.startsWith('blob:') || imgElementSrc.startsWith('data:') || isProxyUrl(imgElementSrc)) {
                return;
            }

            let retryCount = parseInt(imgElement.dataset.retryCount);

            let workingProxy = null;
            if (item.reason === 'timeout' &&
                (getDomainForComparison(new URL(imgElementSrc).hostname) !== getDomainForComparison(window.location.hostname) ||
                    retryCount > 2)) {
                console.log('[ImageRetry] 타임아웃 후 로드 가능한 프록시를 시도합니다:', imgElementSrc);
                workingProxy = await findWorkingProxy(imgElementSrc);
                if (workingProxy) {
                    console.log('[ImageRetry] 타임아웃 후 로드 가능한 프록시를 적용합니다:', workingProxy);
                } else {
                    imgElement.dataset.loaded = "false";
                    console.warn('[ImageRetry] 타임아웃된 이미지의 프록시 후보에서 로드에 실패했습니다:', imgElementSrc);
                    return;
                }
            }

            let checkResult = imageCheckCache.get(imgElement);

            if (!workingProxy && (!checkResult || checkResult.src !== imgElementSrc)) {
                checkResult = {
                    src: imgElementSrc,
                    result: await checkImage(imgElementSrc)
                };
                imageCheckCache.set(imgElement, checkResult);
            }
            //if (imgElement.src !== imgElementSrc) return;

            if (checkResult) {
                console.log(`[ImageRetry] 이미지 존재 여부 확인 결과: `, checkResult.result, imgElement);
            }

            const { exists, reason, status = null } = checkResult?.result || {};

            if (exists && !workingProxy && retryCount >= MAX_RETRY_COUNT) {
                console.warn(`[ImageRetry] 최대 재시도 횟수(${MAX_RETRY_COUNT}회)에 도달했습니다.`, imgElement);
                workingProxy = await findWorkingProxy(imgElementSrc);
                if (workingProxy) {
                    console.log('[ImageRetry] 로드 가능한 프록시를 적용합니다:', workingProxy);
                    imgElement.removeAttribute('loading');
                } else {
                    imgElement.dataset.loaded = "false";
                    console.warn('[ImageRetry] 프록시 후보에서 이미지 로드에 실패했습니다:', imgElementSrc);
                    return;
                }
            }


            if (!workingProxy && !exists && (reason === 'client_error' || reason === 'server_error')) {
                console.warn(`[ImageRetry] 서버에 존재하지 않는 이미지입니다. 재시도하지 않습니다: ${status ? 'HTTP ' + status : ''} => ${reason}`, imgElement);
                failedImagesSet.add(getPureUrl(imgElement.src));
                saveBadLink(imgElement.src);
                imgElement.dataset.loaded = "false";
                return;
            }

            if (!workingProxy && !exists && reason === 'Region restrictions') {
                console.log('[ImageRetry] 지역 제한 감지, 프록시 이미지 로드 확인 중:', imgElementSrc);
                workingProxy = await findWorkingProxy(imgElementSrc);
                if (workingProxy) {
                    console.log('[ImageRetry] 로드 가능한 프록시를 적용합니다:', workingProxy);
                } else {
                    imgElement.dataset.loaded = "false";
                    console.warn('[ImageRetry] 프록시 후보에서 이미지 로드에 실패했습니다:', imgElementSrc);
                    return;
                }
            }

            function removeRetryListeners() {
                imgElement.removeEventListener('load', retryLoad);
                imgElement.removeEventListener('error', retryError);
            }

            const retrySrc = workingProxy || imgElementSrc;
            let retryLoadTimer;
            let retryFinished = false;

            function retryLoad() {
                if (retryFinished) return;
                const loadedSrc = imgElement.currentSrc || imgElement.src;
                removeRetryListeners();
                imgElement.decode()
                    .then(() => {
                        if (!retryFinished && (imgElement.currentSrc || imgElement.src) === loadedSrc) {
                            imgElement.dataset.loaded = "true";
                        }
                        retryFinished = true;
                        clearTimeout(retryLoadTimer);
                    })
                    .catch(error => {
                        console.warn('[ImageRetry] 재시도 이미지 decode 실패:', error);
                        if ((imgElement.currentSrc || imgElement.src) === loadedSrc) {
                            retryError();
                        } else {
                            retryFinished = true;
                            clearTimeout(retryLoadTimer);
                        }
                    });
            }

            function retryError(reason = 'retry_error') {
                if (retryFinished) return;
                if (reason !== 'timeout') reason = 'retry_error';
                retryFinished = true;
                clearTimeout(retryLoadTimer);
                removeRetryListeners();
                if (retryCount >= MAX_RETRY_COUNT) {
                    imgElement.dataset.loaded = "false";
                    console.warn(`[ImageRetry] 최대 재시도 횟수(${MAX_RETRY_COUNT}회)에 도달했습니다. 이미지 로드 실패: `, imgElement);
                } else if (isProxyUrl(imgElement.src)) {
                    imgElement.dataset.loaded = "false";
                    console.warn('[ImageRetry] 프록시 이미지 로드에 실패했습니다:', imgElement);
                } else {
                    imgElement.dataset.retryCount = ++retryCount;
                    if (exists && !retrySet.has(getPureUrl(imgElement.src))) {
                        console.log(`[ImageRetry] 이미지 재시도 대기열에 추가 (${retryCount}회차): `, imgElement);
                        enqueueFailedImage(imgElement, reason);
                    }
                }
            }

            imgElement.addEventListener('load', retryLoad);
            imgElement.addEventListener('error', retryError);
            retryLoadTimer = setTimeout(() => {
                if (imgElement.src !== retrySrc) {
                    retryFinished = true;
                    removeRetryListeners();
                    return;
                }
                console.warn(`[ImageRetry] 재시도 이미지 로딩 타임아웃 (${LOAD_TIMEOUT}ms):`, imgElement);
                retryError('timeout');
            }, LOAD_TIMEOUT);
            imgElement.setAttribute('src', retrySrc);

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
                            checkImageVisibility(node);
                        }
                        node.querySelectorAll('img').forEach(img => {
                            checkImageVisibility(img);
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

    function getDomainForComparison(hostname) {
        return tldts.getDomain(hostname, { allowPrivateDomains: true }) || hostname.toLowerCase();
    }

    function getPureUrl(url) {
        if (!url) return '';

        if (isProxyUrl(url)) {
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
        "ess-data",
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

    const proxyImageDomainsPattern = `
    gifyu.com
    11img.com
    imgccc.com
    `.trim()
        .split('\n')
        .map(d => d.replace(/\./g, '\\.').trim())
        .filter(Boolean)
        .join('|');

    function isListImage(img) {
        if (!img || !img.isConnected) return false;
        if (img.dataset.isFixing) return false;
        //if (img.closest('.image-masonry')) return false;
        if (img.closest('.hiddenbox')) return false;
        if (img.closest('.lazyload-preview')) return false;
        /*
                // 🔥 CSS 가시성 확인 (display: none 등 체크)
                const isVisible = img.checkVisibility({
                    checkOpacity: false,
                    checkVisibilityCSS: false
                });
        
                if (!isVisible) {
                    console.log('이미지가 화면에 숨겨져 있습니다 (display: none 포함).', img);
                    return false;
                }
        */
        let rawSrc = img.src;

        if (rawSrc.startsWith('http://data:image')) {
            img.src = rawSrc.replace('http://', '');
            rawSrc = img.src;
        }

        for (const attr of img.attributes) {
            if (lazyAttributesMap[attr.name]) {
                if (attr.value && attr.value.trim() !== '') {
                    console.log(`[Lazy-Attribute] ${attr.name} 속성에서 이미지 URL 발견: ${attr.value}`);
                    img.src = attr.value;
                    img.removeAttribute(attr.name);
                    rawSrc = attr.value;
                    break;
                }
            }
        }

        if (!rawSrc || rawSrc.startsWith('blob:') || rawSrc.startsWith('data:') || rawSrc.startsWith('https://cm-exchange.toast.com/pixel')) {
            return false;
        }

        if (rawSrc.startsWith('https:///e/attach')) {
            const videoLink = img.closest('a[href*="video.php"]');
            if (videoLink) {
                img.dataset.isFixing = "true";
                console.log(`[Fixing] 이미지 복구 시도 중: ${rawSrc}`);

                getFixUrl(videoLink.href, rawSrc)
                    .then(realUrl => {
                        img.src = realUrl;
                        checkImageVisibility(img); // 복구된 URL 적용 후 재관찰
                    })
                    .catch(err => console.warn(`[Fix-Error] ${err}`));
            }
            return false;
        }

        else if (rawSrc.startsWith('http://')) {
            if (domainRegex.test(rawSrc)) {
                img.src = rawSrc.replace('http://', 'https://');
                rawSrc = img.src;
                console.log(`[HTTPS-Upgrade] 프로토콜 변경 완료: ${img.src}`);
            }
        }

        else if (rawSrc.startsWith('https://i.maxjav.com/')) {
            img.src = getRedirectUrl(rawSrc, "url");
            rawSrc = img.src;
        }

        if (!isRealDomain(rawSrc)) {
            console.warn(`정상적인 도메인이 아닙니다. ${rawSrc} `, img);
            return false;
        }

        if (isBadLink(rawSrc)) {
            console.warn(`[Skip] 이미 404로 기록된 링크입니다: ${rawSrc}`);
            img.dataset.loaded = "false";
            return false;
        }

        const cachedProxyUrl = getSavedProxyUrl(rawSrc);
        if (cachedProxyUrl) {
            appliedCachedProxyUrls.set(img, rawSrc);
            img.src = cachedProxyUrl;
            rawSrc = cachedProxyUrl;
        }

        if (rawSrc && !isProxyUrl(rawSrc) &&
            !img.dataset.proxyTestFailed &&
            new RegExp(`(${proxyImageDomainsPattern})`, 'i').test(rawSrc)) {
            if (!img.dataset.isProxyTesting) {
                img.dataset.isProxyTesting = 'true';
                findWorkingProxy(rawSrc)
                    .then(workingProxy => {
                        delete img.dataset.isProxyTesting;
                        //if (!img.isConnected || img.src !== rawSrc) return false;

                        if (workingProxy) {
                            img.src = workingProxy;
                            img.decode()
                                .then(() => {
                                    img.dataset.loaded = "true";
                                    return false;
                                })
                                .catch(error => {
                                    console.warn('[ImageRetry] 재시도 이미지 decode 실패:', error);
                                    return true;
                                });
                        } else {
                            console.warn('[ImageRetry] 도메인 프록시 후보에서 이미지 로드에 실패했습니다:', rawSrc);
                            img.dataset.proxyTestFailed = 'true';
                            img.dataset.loaded = "false";
                            return true;
                        }
                    })
                    .catch(error => {
                        delete img.dataset.isProxyTesting;
                        console.error('[ImageRetry] 도메인 프록시 테스트 실패:', rawSrc, error);
                        img.dataset.proxyTestFailed = 'true';
                        img.dataset.loaded = "false";
                        return true;
                    });
            }
            return false;
        }

        const finalRawSrc = img.src;

        if (!finalRawSrc || finalRawSrc.trim() === "" || finalRawSrc === window.location.href) {
            return false;
        }

        if (img.complete && img.naturalWidth !== 0) {
            img.decode()
                .then(() => {
                    img.dataset.loaded = "true";
                    return false;
                })
        }
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
        GM_setValue(BAD_URL_PREFIX + getPureUrl(url), now);
    }

    function isBadLink(url) {
        const cleanUrl = getPureUrl(url);
        return GM_getValue(cleanUrl) !== undefined;
    }

    function cleanOldBadLinks() {
        const now = Date.now();
        const keys = GM_listValues();

        keys.forEach(key => {
            const savedTime = GM_getValue(key);
            if (key.startsWith(SUCCESSFUL_PROXY_STORAGE_PREFIX)) {
                if (!savedTime ||
                    !Number.isFinite(savedTime.savedAt) ||
                    now - savedTime.savedAt > STORAGE_EXPIRATION) {
                    GM_deleteValue(key);
                    console.log(`[Storage] 24시간 경과 프록시 데이터 삭제: ${key}`);
                }
            } else if (now - savedTime > STORAGE_EXPIRATION) {
                GM_deleteValue(key);
                console.log(`[Storage] 24시간 경과 데이터 삭제: ${key}`);
            }
        });
    }

    document.addEventListener("DOMContentLoaded", () => {
        cleanOldBadLinks();
        cleanProxyUrlCache();
        document.querySelectorAll('img').forEach(img => {
            checkImageVisibility(img);
        });

        observer.observe(document.body, { childList: true, subtree: true });
        console.log('[ImageRetry] 스크립트 활성화 완료');

    }, { once: true });

})();