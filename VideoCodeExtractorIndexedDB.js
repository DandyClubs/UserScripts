// ==UserScript==
// @name         Video Code Extractor IndexedDB 고도화
// @namespace    http://tampermonkey.net/
// @version      4.2
// @description  개수 표시 + IndexedDB 고도화
// @author       DancyClubs
// @match        https://video.dmm.co.jp/av/list/?maker=*
// @match        https://video.dmm.co.jp/av/maker/*
// @resource     MAKER_MAP https://raw.githubusercontent.com/DandyClubs/CopyLinksCommonJS/main/DMM_MakerMap_2026-03-26.json
// @grant        GM_getResourceText
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @run-at       document-body
// @noframes
// ==/UserScript==

(function () {
    'use strict';

    GM_addStyle(`
    .videocodeextractor {
        display: flex !important;
    }
    .videocodeextractor div::-webkit-scrollbar { width: 6px; }
    .videocodeextractor div::-webkit-scrollbar-thumb { background: #444; border-radius: 10px; }
    @keyframes blink { /* 요소가 깜빡거리는 */
    0% {opacity:0}
    50% {opacity:1}
    100% {opacity:0}
    }
    @keyframes blinkC { /* 색이 깜빡거리는 */ 
        50% {color:yellow}
    }
    #choicetype {
        animation:blink 1s infinite ease;	
    }
    `);

    const PageURL = () => window.location !== window.parent.location ? document.referrer : document.location.href;
    const KEY_PREFIX = "DMM_";
    const imageSelector = 'main ul li a[href*="/av/content/?id="] picture source[srcset^="https://awsimgsrc.dmm.co.jp/pics_dig/digital/video/"]';
    let makerLabelCode = GetParam(PageURL(), 'maker');
    const makerSelector = `body div main a[href="/av/list/?maker=${makerLabelCode}"]`;
    let rawMediaType = GetParam(PageURL(), 'media_type');

    const PROCESSED_CLASS = 'processed-marker';
    
    /* [기존 코드 보존] 메모리 기반 중복 방지 (이제 IndexedDB imageMeta가 대신함) */
    // const patternMemoryDB = new Set();

    let alertStatus = null; // 상태 메시지용 엘리먼트    
    let makerLabel = ""; // 전역 변수로 관리
    let listContainer = null;
    let countStatus = null; // 개수를 표시할 엘리먼트
    let currentSessionCodes = new Set();
    let isShowAllMode = false;
    let filterText = "";

    // =====================================================================
    // [신규 코드 추가] IndexedDB 매니저 및 유휴 상태 해상도 추출 큐 시스템
    // =====================================================================
    const DB_CONFIG = { name: "VideoCodeExtractorDB", version: 8, stores: { codes: "id", imageMeta: "url" } };

    class VceDB {
        static async open() {
            return new Promise((resolve) => {
                const request = indexedDB.open(DB_CONFIG.name, DB_CONFIG.version);
                request.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains("codes")) db.createObjectStore("codes", { keyPath: "id" });
                    if (!db.objectStoreNames.contains("imageMeta")) {
                        const store = db.createObjectStore("imageMeta", { keyPath: "url" });
                        store.createIndex("patternKey", "patternKey", { unique: false });
                        store.createIndex("status", "status", { unique: false });
                    }
                };
                request.onsuccess = () => resolve(request.result);
            });
        }
        static async getCode(id) {
            const db = await this.open();
            return new Promise(r => db.transaction("codes").objectStore("codes").get(id).onsuccess = e => r(e.target.result));
        }
        static async saveCode(id, payload) {
            const db = await this.open();
            const tx = db.transaction("codes", "readwrite");
            const store = tx.objectStore("codes");
            const existing = await new Promise(r => store.get(id).onsuccess = e => r(e.target.result));
            if (existing) return new Promise(r => store.put({ ...existing, ...payload, updatedAt: Date.now() }).onsuccess = () => r());

            const all = await new Promise(r => store.getAll().onsuccess = e => r(e.target.result));
            const sameCodeCount = all.filter(item => item.displayCode === payload.displayCode).length;
            const data = { id, ...payload, timestamp: Date.now(), data: [...(payload.data || []), sameCodeCount] };
            return new Promise(r => store.put(data).onsuccess = () => r());
        }
        static async getAllCodes() {
            const db = await this.open();
            return new Promise(r => db.transaction("codes").objectStore("codes").getAll().onsuccess = e => r(e.target.result));
        }
        static async deleteCode(id) {
            const db = await this.open();
            return new Promise(r => db.transaction("codes", "readwrite").objectStore("codes").delete(id).onsuccess = () => r());
        }
        static async setImageMeta(meta) {
            const db = await this.open();
            return new Promise(r => db.transaction("imageMeta", "readwrite").objectStore("imageMeta").put({ ...meta, updatedAt: Date.now() }).onsuccess = () => r());
        }
        static async getImageMeta(url) {
            const db = await this.open();
            return new Promise(r => db.transaction("imageMeta").objectStore("imageMeta").get(url).onsuccess = e => r(e.target.result));
        }
        static async getImageByPattern(patternKey) {
            const db = await this.open();
            return new Promise(r => db.transaction("imageMeta").objectStore("imageMeta").index("patternKey").get(patternKey).onsuccess = e => r(e.target.result));
        }
        static async getPendingTasks() {
            const db = await this.open();
            return new Promise(r => db.transaction("imageMeta").objectStore("imageMeta").index("status").getAll("pending").onsuccess = e => r(e.target.result));
        }
    }

    const requestQueue = [];
    let isIdleProcessing = false;

    async function fetchImageResolution(url) {
        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method: "GET", url: url, headers: { "Range": "bytes=0-30000" }, responseType: "arraybuffer",
                onload: (res) => {
                    const bytes = new Uint8Array(res.response);
                    let result = { width: 0, height: 0 };
                    if (bytes[0] === 0xFF && bytes[1] === 0xD8) {
                        let i = 2;
                        while (i < bytes.length) {
                            const marker = (bytes[i] << 8) | bytes[i + 1];
                            const len = (bytes[i + 2] << 8) | bytes[i + 3];
                            if (marker >= 0xFFC0 && marker <= 0xFFCF && ![0xFFC4, 0xFFC8, 0xFFCC].includes(marker)) {
                                result.height = (bytes[i + 5] << 8) | bytes[i + 6]; result.width = (bytes[i + 7] << 8) | bytes[i + 8]; break;
                            }
                            i += len + 2;
                        }
                    }
                    resolve(result);
                },
                onerror: () => resolve({ width: 0, height: 0 })
            });
        });
    }

    function addToQueue(task) {
        if (!requestQueue.find(t => t.url === task.url)) {
            requestQueue.push(task);
            if (!isIdleProcessing) scheduleIdleWork();
        }
    }

    function scheduleIdleWork() {
        isIdleProcessing = true;
        if ('requestIdleCallback' in window) window.requestIdleCallback(doIdleWork, { timeout: 2000 });
        else setTimeout(doIdleWork, 100);
    }

    async function doIdleWork(deadline) {
        while (requestQueue.length > 0 && (deadline.timeRemaining() > 0 || deadline.didTimeout)) {
            const task = requestQueue.shift();
            const res = await fetchImageResolution(task.url);
            const resText = res.width ? `${res.width}x${res.height}` : "";

            const existingMeta = await VceDB.getImageMeta(task.url);
            if (existingMeta) await VceDB.setImageMeta({ ...existingMeta, status: "completed", width: res.width, height: res.height, resText });

            if (task.uniqueKey) {
                const existingCode = await VceDB.getCode(task.uniqueKey);
                if (existingCode) {
                    await VceDB.saveCode(task.uniqueKey, { resText: resText });
                    updateDisplayList(); 
                }
            }
        }
        if (requestQueue.length > 0) scheduleIdleWork();
        else isIdleProcessing = false;
    }
    // =====================================================================


    /* [기존 코드 보존: 일반 동기식 mutCallback] 
    const mutCallback = () => {
        if (/video\.dmm\.co\.jp\/av\/list\/\?maker=\d+&media_type=/.test(PageURL())) {
            let hasNew = false;
            const targets = document.querySelectorAll(`${imageSelector}:not(.${PROCESSED_CLASS})`);
            if (targets.length === 0) return;
            targets.forEach(el => {
                el.classList.add(PROCESSED_CLASS);
                const targetUrl = el.getAttribute('srcset') || el.getAttribute('src');
                if (targetUrl && processUrl(targetUrl)) { hasNew = true; }
            });
            if (hasNew) { updateDisplayList(); }
        }
        makerLabelCode = GetParam(PageURL(), 'maker');
        makerLabel = getMakerLabel(makerLabelCode);
        rawMediaType = GetParam(PageURL(), 'media_type');
    };
    */

    // [신규 코드 추가: 비동기 지원 mutCallback]
    const mutCallback = async () => {
        if (/video\.dmm\.co\.jp\/av\/list\/\?maker=\d+&media_type=/.test(PageURL())) {
            const targets = document.querySelectorAll(`${imageSelector}:not(.${PROCESSED_CLASS})`);
            if (targets.length === 0) return;
            for (const el of targets) {
                el.classList.add(PROCESSED_CLASS);
                const targetUrl = el.getAttribute('srcset') || el.getAttribute('src');
                if (targetUrl) await processUrl(targetUrl); // await 처리를 위해 변경됨
            }
        }
        makerLabelCode = GetParam(PageURL(), 'maker');
        makerLabel = getMakerLabel(makerLabelCode);
        rawMediaType = GetParam(PageURL(), 'media_type');
    };

    const observer = new MutationObserver(mutCallback);

    function GetParam(url, paramName) {
        const urlObj = new URL(url);
        const params = new URLSearchParams(urlObj.search);
        const result = params.get(paramName);
        return result?.toUpperCase() || '';
    }

    // --- 유틸리티: 개수 업데이트 함수 ---
    /* [기존 코드 보존] 
    function updateCounts() { ... const totalCount = Object.keys(localStorage).filter(k => k.startsWith(KEY_PREFIX)).length; ... }
    */
    // [신규 코드 추가: 비동기 DB 지원]
    async function updateCounts() {
        if (!countStatus || !listContainer) return;
        const selectedCount = listContainer.querySelectorAll('.item-check:checked').length;
        const currentListCount = listContainer.querySelectorAll('.item-check').length;
        
        const allCodes = await VceDB.getAllCodes();
        const totalCount = allCodes.length; // 로컬스토리지 대신 DB 갯수로 대체

        countStatus.innerHTML = `
            <span style="color:#00FF41">선택: ${selectedCount}</span> |
            <span>목록: ${currentListCount}</span> |
            <span style="color:#2196F3">전체: ${totalCount}</span>
        `;

        if (alertStatus) {
            if (/^https:\/\/video\.dmm\.co\.jp\/av\/maker\/$/.test(PageURL())) {
                alertStatus.innerHTML = `<div style="color:#F44336; margin-bottom:5px; font-weight:bold;">❌ 추출할 메이커 페이지로 이동하세요!</div>`;
            } else if (!rawMediaType) {
                alertStatus.innerHTML = `<div style="color:#FF9800; margin-bottom:5px; font-weight:bold;">⚠️ <a id="choicetype" href="https://video.dmm.co.jp/av/list/?maker=${makerLabelCode}&media_type=2d">2D</a>를 선택하세요!<br>❌ 페이지 주소가 맞지 않아 수집 중단.</div>`;
            } else if (!makerLabelCode || makerLabel === "Unknown") {
                alertStatus.innerHTML = `<div style="color:#F44336; margin-bottom:5px; font-weight:bold;">❌ 제작사 정보를 가져오지 못했습니다.</div>`;
            } else {
                alertStatus.innerHTML = "";
            }
        }
        makerLabelCode = GetParam(PageURL(), 'maker');
        makerLabel = getMakerLabel(makerLabelCode);
        rawMediaType = GetParam(PageURL(), 'media_type');
    }

    const resetSessionCodes = () => {
        if (currentSessionCodes.size > 0) {
            currentSessionCodes.clear();
            updateDisplayList();
        }
        if (/video\.dmm\.co\.jp\/av\/list\/\?maker=\d+&media_type=/.test(PageURL())) {
            observer.observe(document.body, { childList: true, subtree: true });
        }
        makerLabelCode = GetParam(PageURL(), 'maker');
        makerLabel = getMakerLabel(makerLabelCode);
        rawMediaType = GetParam(PageURL(), 'media_type');
    };

    window.addEventListener('popstate', resetSessionCodes);
    window.addEventListener('hashchange', resetSessionCodes);

    const originalPush = history.pushState;
    history.pushState = function () { originalPush.apply(this, arguments); resetSessionCodes(); };
    const originalReplace = history.replaceState;
    history.replaceState = function () { originalReplace.apply(this, arguments); resetSessionCodes(); };


    /* [기존 코드 보존: 로컬스토리지 방식 processUrl]
    function processUrl(srcset) {
        ... (중략) ...
        const maskedId = contentId.replace(/\d/g, '0');
        const currentPattern = `${maskedId}_${makerLabelCode}_${rawMediaType}`;
        if (patternMemoryDB.has(currentPattern)) return false;

        // ... 매칭 후 로컬스토리지 저장 로직
        if (!localStorage.getItem(uniqueKey)) {
            currentSessionCodes.add(uniqueKey);
            localStorage.setItem(uniqueKey, JSON.stringify({ ... }));
            if (typeof currentPattern !== 'undefined') patternMemoryDB.add(currentPattern);
            return true;
        }
        return false;
    }
    */

    // [신규 코드 추가: DB 저장 + 해상도 큐 추가 비동기 processUrl]
    async function processUrl(srcset) {
        if (!srcset || !srcset.includes('https://awsimgsrc.dmm.co.jp/pics_dig/digital/video/')) return false;
        const cleanUrl = srcset.split('?')[0];
        
        const majorsLabel = /digital\/video\/(.*?)([a-z]{3,7}\d{4,7}|[ts]{1,2}\d{2,7})[v]?/i;
        if (!majorsLabel.test(cleanUrl)) return false;

        const skipPatterns = [
            /digital\/video\/(h_[0-9]*?)([vpjg])(\d{3,})([a-z]*?)\//,
            /digital\/video\/\d+jdxa\d+/i,
        ];
        for (const skipRegex of skipPatterns) if (skipRegex.test(cleanUrl)) return false;

        const extractPatterns = [
            /digital\/video\/(.*)(d1clymax)(\d{5,})(.*?)\//,
            /digital\/video\/([a-z]*?)(dvaj|dvajbx)(\d{5,})(.*?)\//,
            /digital\/video\/(\d{2})(kt)(\d{5,})(.*?)\//,
            /digital\/video\/(\d{2})([t]\d{1})(\d{5,})(.*?)\//,
            /digital\/video\/(h_[h0-9]*?)(ss)(\d{3,})([a-z]*?)\//,
            /digital\/video\/(h_[h0-9]*?)([a-z]{3,})(\d{3,})([a-z]*?)\//,
            /digital\/video\/(\d*?)(ss)(\d{3,})([a-z]*?)\//,
            /digital\/video\/([0-9]*?)([a-z]+)(\d+)(.*?)\//,
        ];

        let match = null;
        for (const regex of extractPatterns) { match = cleanUrl.match(regex); if (match) break; }
        
        if (match) {
            if (!makerLabelCode || !rawMediaType || !makerLabel) return false;

            const prefixMatch = match[1];
            const code = match[2].toUpperCase();
            const padLen = `zero${match[3].length}`;
            const suffix = match[4];
            const displayCode = code;
            const uniqueKey = `${KEY_PREFIX}${displayCode}_${prefixMatch}_${padLen}_${suffix}_${makerLabelCode}_${rawMediaType}`;

            // 1. 화면 표시 및 DB 코드 저장 (기존 로컬스토리지 대체)
            if (!currentSessionCodes.has(uniqueKey)) {
                currentSessionCodes.add(uniqueKey);
                let existingCode = await VceDB.getCode(uniqueKey);
                await VceDB.saveCode(uniqueKey, {
                    displayCode: displayCode,
                    data: ["FANZA_DIGITAL", prefixMatch, padLen, suffix, makerLabel, rawMediaType],
                    origin: cleanUrl,
                    resText: existingCode ? existingCode.resText : "" 
                });
                updateDisplayList(); 
            }

            // 2. 해상도/패턴 캐시 확인 및 큐 추가 (기존 patternMemoryDB 대체)
            const meta = await VceDB.getImageMeta(cleanUrl);
            if (meta && meta.status === "completed") return true;

            const pathSegments = cleanUrl.split('/');
            const contentId = pathSegments[pathSegments.length - 2];
            const maskedId = contentId.replace(/\d/g, '0');
            const patternKey = `${maskedId}_${makerLabelCode}_${rawMediaType}`;
            
            if (await VceDB.getImageByPattern(patternKey)) return true;

            if (!meta) await VceDB.setImageMeta({ url: cleanUrl, patternKey, status: "pending" });
            addToQueue({ url: cleanUrl, uniqueKey: uniqueKey });

            return true;
        }
        return false;
    }


    /* [기존 코드 보존: 로컬스토리지 기반 리스트 출력]
    function updateDisplayList(shouldScroll = false) {
        ...
        let keys = isShowAllMode ? Object.keys(localStorage).filter(k => k.startsWith(KEY_PREFIX)).sort() : Array.from(currentSessionCodes).sort();
        ...
        keys.forEach(key => {
            const itemData = JSON.parse(localStorage.getItem(key));
            ...
        });
        ...
    }
    */

    // [신규 코드 추가: IndexedDB 기반 리스트 출력]
    async function updateDisplayList(shouldScroll = false) {
        if (!listContainer) return;
        const currentScroll = listContainer.scrollTop;
        listContainer.innerHTML = "";

        let items = await VceDB.getAllCodes();
        if (!isShowAllMode) {
            items = items.filter(item => currentSessionCodes.has(item.id));
        }

        if (filterText !== "") {
            let regex = null;
            if (filterText.startsWith('/') && filterText.endsWith('/')) {
                try { regex = new RegExp(filterText.slice(1, -1), 'i'); } catch (e) { }
            }
            items = items.filter(item => {
                const code = item.displayCode.toUpperCase();
                return regex ? regex.test(code) : code === filterText.toUpperCase();
            });
        }

        if (items.length === 0) {
            listContainer.innerHTML = `<div style='color:#888; font-size:11px; text-align:center; padding:20px 0;'>${isShowAllMode ? "저장된 데이터 없음" : "현재 페이지 추출 없음"}</div>`;
            updateCounts();
            return;
        }

        items.sort((a, b) => b.timestamp - a.timestamp);

        items.forEach(itemData => {
            const key = itemData.id;
            const detailLabel = `${itemData.data[1] && itemData.data[3] ? itemData.data[1] + ', ' + itemData.data[3] : itemData.data[1] || itemData.data[3] || ''}`;
            const idMatch = itemData.origin.match(/digital\/video\/([^\/]+)\//i);
            const contentId = idMatch ? idMatch[1] : "";
            const itemPageUrl = contentId ? `https://video.dmm.co.jp/av/content/?id=${contentId}` : "#";
            const row = document.createElement('div');
            row.style = "display:flex; align-items:center; border-bottom:1px solid #333; padding:6px 0; gap:8px;";
            row.innerHTML = `
                <input type="checkbox" class="item-check" data-key="${key}" style="margin-left:5px; width:15px; height:15px; cursor:pointer; accent-color:#00FF41; appearance:auto;">
                <div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1; cursor:help;" title="${itemData.origin}">
                <a href="${itemPageUrl}" target="_blank"><span style="color:#00FF41; font-family:monospace; font-size:12px;">${itemData.displayCode}</span></a>
                    ${detailLabel ? `<span style="color:white; font-size:10px; margin-left:5px;">[</span><span style="color:#00FF41; font-size:10px;">${detailLabel}</span><span style="color:white; font-size:10px;">]</span>` : ''}                    
                    ${itemData.resText ? `<span style="color:#FF9800; font-size:10px; margin-left:5px;">(${itemData.resText})</span>` : ''} </div>
                <span style="color:white; font-size:10px;padding-left:5px;">[ ${itemData.data[5]} ]</span>
                <button class="del-btn" style="background:none; border:none; color:#ff4d4d; cursor:pointer; font-weight:bold; font-size:16px; padding:0 5px;">×</button>
            `;

            row.querySelector('.item-check').onchange = updateCounts;

            row.querySelector('.del-btn').onclick = async (e) => {
                // [기존: localStorage.removeItem] -> [신규: VceDB.deleteCode]
                await VceDB.deleteCode(key);
                currentSessionCodes.delete(key);
                const getS = e.target.parentElement.getAttribute('title');
                if (getS) {
                    processUrl(getS);
                }
                updateDisplayList(false);
            };
            listContainer.appendChild(row);
        });

        if (shouldScroll) listContainer.scrollTop = listContainer.scrollHeight;
        else listContainer.scrollTop = currentScroll;

        updateCounts();
    }

    const makerMap = new Map();

    function initializeMakerMap() {
        try {
            if (typeof GM_getResourceText !== "undefined") {
                const resourceText = GM_getResourceText("MAKER_MAP");
                if (resourceText) {
                    const externalData = JSON.parse(resourceText);
                    Object.entries(externalData).forEach(([id, name]) => {
                        makerMap.set(id, name);
                    });
                }
            }
        } catch (e) {
            console.warn("[VCE] 外部リソースのロードに失敗しました:", e);
        }
        console.log(`메이커 맵 구성: ${makerMap.size}개 항목`, makerMap);
        if (/video\.dmm\.co\.jp\/av\/list\/\?maker=\d+&media_type=/.test(PageURL())) {
            observer.observe(document.body, { childList: true, subtree: true });
        }
        makerLabelCode = GetParam(PageURL(), 'maker');
        makerLabel = getMakerLabel(makerLabelCode);
        rawMediaType = GetParam(PageURL(), 'media_type');
    }

    function getMakerLabel(id) {
        if (makerMap.has(id)) {
            return makerMap.get(id);
        }
        const el = document.querySelector(makerSelector);
        const label = el?.innerText.trim();

        if (label) {
            makerMap.set(id, label);
            return label;
        }
        return "Unknown";
    }

    // --- [사용자 보존 요청: 활용을 위해 남겨둔 함수들 삭제 금지] ---
    /**
    let currentMakerLabel = ""; // 전역 변수
    function buildMakerMap() {
        const makerNodes = document.querySelectorAll('a[href*="maker="]');

        makerNodes.forEach(node => {
            try {
                const url = new URL(node.href, window.location.origin);
                const makerId = url.searchParams.get('maker');
                // .line-clamp-2.text-ellipsis 클래스를 가진 텍스트 추출
                const makerName = node.querySelector('.line-clamp-2.text-ellipsis')?.innerText.trim();

                if (makerId && makerName) {
                    makerMap.set(makerId, makerName);
                }
            } catch (e) {
                // URL 파싱 에러 등 예외 처리
            }
        });

        console.log(`[VCE] 메이커 맵 구성 완료: ${makerMap.size}개 항목`);
    }

    /**
    function findMakerLabel(retryCount = 0) {
        // 1. 먼저 페이지 내 모든 메이커 정보를 맵으로 빌드
        buildMakerMap();

        // 2. 현재 페이지의 파라미터에서 maker ID 가져오기
        const urlParams = new URLSearchParams(window.location.search);
        const makerId = urlParams.get('maker');

        // 3. 맵에서 찾거나, 직접 셀렉터로 찾기
        const label = getMakerNameById(makerId);

        if (label && label !== "Unknown") {
            currentMakerLabel = label;
            console.log(`[VCE] 매칭된 메이커: ${currentMakerLabel}`);
        } else if (retryCount < 10) {
            console.log(`[VCE] 메이커 텍스트 추출 재시도 중... (${retryCount + 1}/10)`);
            setTimeout(() => findMakerLabel(retryCount + 1), 1000);
        }
    }

    function saveMakerMapToFile() {
        if (makerMap.size === 0) {
            alert("저장할 메이커 데이터가 없습니다. 먼저 맵을 빌드하세요.");
            return;
        }

        // 1. Map을 일반 Object로 변환 후 JSON 문자열화
        const obj = Object.fromEntries(makerMap);
        const jsonString = JSON.stringify(obj, null, 2); // 보기 좋게 들여쓰기 포함

        // 2. Blob 객체 생성
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        // 3. 가상 링크를 만들어 다운로드 실행
        const a = document.createElement('a');
        a.href = url;
        a.download = `DMM_MakerMap_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();

        // 4. 리소스 정리
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log(`[VCE] ${makerMap.size}개의 메이커 정보가 파일로 저장되었습니다.`);
    }
    */
    // -------------------------------------------------------------

    function createUI() {
        const panel = document.createElement('div');
        panel.classList.add('videocodeextractor');
        panel.style = "position:fixed; bottom:20px; right:20px; z-index:9999; display:flex !important; flex-direction:column; background:rgba(15,15,15,0.95); padding:12px; border-radius:12px; width:260px; border:1px solid #444; box-shadow:0 8px 32px rgba(0,0,0,0.5); color:white; font-family:sans-serif; box-sizing:border-box;";
        panel.innerHTML = `<div style='font-weight:bold; font-size:13px; margin-bottom:5px; text-align:center; color:#2196F3;'>DMM CODE TRACKER</div>`;

        alertStatus = document.createElement('div');
        alertStatus.style = "font-size:11px; text-align:center; line-height:1.4;";
        panel.appendChild(alertStatus);

        countStatus = document.createElement('div');
        countStatus.style = "font-size:10px; color:#aaa; text-align:center; margin-bottom:8px; padding:4px; background:#222; border-radius:4px;";
        panel.appendChild(countStatus);

        const controlBar = document.createElement('div');
        controlBar.style = "display:flex; flex-direction:column; padding:8px; background:#222; border-bottom:1px solid #444; gap:8px; margin-bottom:10px; border-radius:4px; box-sizing:border-box;"; 
        controlBar.innerHTML = `
            <div style="display:flex; align-items:center; justify-content:space-between; width:100%; gap:5px;">
                <label style="color:#ccc; font-size:11px; cursor:pointer; display:flex; align-items:center; user-select:none; white-space:nowrap; flex-shrink:0;">
                    <input type="checkbox" id="selectAll" style="margin-right:5px; width:14px; height:14px; accent-color:#00FF41; cursor:pointer;"> 전체 선택
                </label>
                <button id="delSelected" style="background:#444; color:#ff4d4d; border:none; padding:4px 8px; font-size:11px; cursor:pointer; border-radius:3px; font-weight:bold; white-space:nowrap; flex-shrink:0;">선택 삭제</button>
            </div>
            <div style="display:flex; gap:5px; width:100%;">
                <input type="text" id="filterInput" placeholder="예: abc or /abc/" style="flex:1; min-width:0; background:#111; color:#00FF41; border:1px solid #444; padding:5px; font-size:12px; border-radius:3px; outline:none; font-family:monospace;">
                <button id="clearBtn" style="background:#666; color:#fff; border:none; padding:0 8px; font-size:11px; cursor:pointer; border-radius:3px; white-space:nowrap;">X</button>
                <button id="searchBtn" style="background:#00FF41; color:#000; border:none; padding:0 12px; font-size:11px; cursor:pointer; border-radius:3px; font-weight:bold; white-space:nowrap;">찾기</button>
            </div>
        `;
        panel.appendChild(controlBar);

        const filterInput = controlBar.querySelector('#filterInput');
        const searchBtn = controlBar.querySelector('#searchBtn');

        searchBtn.onclick = () => { filterText = filterInput.value.trim(); controlBar.querySelector('#selectAll').checked = false; updateDisplayList(false); };
        filterInput.onkeydown = (e) => {
            if (e.key === 'Enter') searchBtn.click();
            else if (e.key === 'Escape') filterInput.value = '';
        };
        controlBar.querySelector('#clearBtn').onclick = () => { filterInput.value = ""; filterText = ""; controlBar.querySelector('#selectAll').checked = false; updateDisplayList(false); };

        controlBar.querySelector('#selectAll').onclick = (e) => {
            const checkboxes = listContainer.querySelectorAll('.item-check');
            checkboxes.forEach(cb => cb.checked = e.target.checked);
            updateCounts(); 
        };

        controlBar.querySelector('#delSelected').onclick = async () => {
            const selected = listContainer.querySelectorAll('.item-check:checked');
            if (selected.length === 0) return alert("삭제할 항목을 선택해주세요.");
            if (confirm(`${selected.length}개의 항목을 삭제하시겠습니까?`)) {
                /* [기존 코드 보존] 
                selected.forEach(cb => {
                    const key = cb.dataset.key;
                    localStorage.removeItem(key);
                    currentSessionCodes.delete(key);
                });
                */
                // [신규 코드 추가: DB 멀티 삭제]
                for (const cb of selected) {
                    const key = cb.dataset.key;
                    await VceDB.deleteCode(key);
                    currentSessionCodes.delete(key);
                }
                updateDisplayList(false);
                controlBar.querySelector('#selectAll').checked = false;
            }
        };

        const tabBox = document.createElement('div');
        tabBox.style = "display:flex; margin-bottom:10px; border-bottom:1px solid #444; font-size:11px; cursor:pointer;";
        const sTab = document.createElement('div'); sTab.innerText = "현재 페이지"; sTab.style = "flex:1; text-align:center; padding:5px; color:#2196F3; border-bottom:2px solid #2196F3;";
        const aTab = document.createElement('div'); aTab.innerText = "전체 저장소"; aTab.style = "flex:1; text-align:center; padding:5px; color:#888;";
        tabBox.append(sTab, aTab);
        panel.appendChild(tabBox);

        sTab.onclick = () => { isShowAllMode = false; sTab.style.color = '#2196F3'; sTab.style.borderBottom = '2px solid #2196F3'; aTab.style.color = '#888'; aTab.style.borderBottom = 'none'; updateDisplayList(); };
        aTab.onclick = () => { isShowAllMode = true; aTab.style.color = '#2196F3'; aTab.style.borderBottom = '2px solid #2196F3'; sTab.style.color = '#888'; sTab.style.borderBottom = 'none'; updateDisplayList(); };

        listContainer = document.createElement('div');
        listContainer.style = "max-height:400px; overflow-y:auto; margin-bottom:10px; padding-right:5px;";
        panel.appendChild(listContainer);

        const btnContainer = document.createElement('div');
        btnContainer.style = "display:flex; gap:5px;";
        const dlBtn = document.createElement('button'); dlBtn.innerText = "다운로드"; dlBtn.style = "flex:2; padding:8px; background:#4CAF50; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px; font-weight:bold;";
        
        dlBtn.onclick = async () => {
            /* [기존 코드 보존]
            let output = "";
            const allKeys = Object.keys(localStorage).filter(k => k.startsWith(KEY_PREFIX)).sort();
            ...
            */
            // [신규 코드 추가: IndexedDB 포맷 다운로드]
            let output = "";
            const allItems = await VceDB.getAllCodes();
            allItems.sort((a,b) => a.displayCode.localeCompare(b.displayCode));
            
            allItems.forEach(obj => {
                output += `"${obj.displayCode}": ${JSON.stringify(obj.data)}, // 해상도: ${obj.resText || 'N/A'}, 원본: ${obj.origin}\n`;
            });

            if (!output) return alert("데이터가 없습니다.");
            const blob = new Blob([output], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `DMM_List_${new Date().toISOString().slice(0, 10)}.txt`;
            a.click();
            URL.revokeObjectURL(url);
        };

        const clBtn = document.createElement('button'); clBtn.innerText = "초기화"; clBtn.style = "flex:1; padding:8px; background:#F44336; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px; font-weight:bold;";
        clBtn.onclick = async () => { 
            if (confirm("모든 데이터를 삭제하시겠습니까?")) { 
                /* [기존 코드 보존]
                Object.keys(localStorage).filter(k => k.startsWith(KEY_PREFIX)).forEach(k => localStorage.removeItem(k)); 
                currentSessionCodes.clear(); updateDisplayList(); 
                */
                // [신규 코드 추가]
                const db = await VceDB.open();
                db.transaction("codes", "readwrite").objectStore("codes").clear();
                currentSessionCodes.clear(); 
                updateDisplayList(); 
            } 
        };
        btnContainer.append(dlBtn, clBtn);
        panel.appendChild(btnContainer);
        document.body.appendChild(panel);
        updateDisplayList();
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    window.addEventListener('load', async () => {
        initializeMakerMap();
        await sleep(2000);

        // =========================================================
        // [신규 코드 추가: 데이터 이관(Migration) 및 복구]
        // =========================================================
        const keys = Object.keys(localStorage).filter(k => k.startsWith(KEY_PREFIX));
        if (keys.length > 0) {
            console.log(`[VCE] ${keys.length}개의 구형 데이터를 마이그레이션 합니다...`);
            for (const key of keys) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    await VceDB.saveCode(key, data);
                    localStorage.removeItem(key);
                } catch(e) {}
            }
        }
        const pendingTasks = await VceDB.getPendingTasks();
        if (pendingTasks.length > 0) pendingTasks.forEach(task => addToQueue({ url: task.url, uniqueKey: null }));
        // =========================================================

        createUI();

        if (/video\.dmm\.co\.jp\/av\/list\/\?maker=\d+&media_type=/.test(PageURL())) {
            mutCallback();
            observer.observe(document.body, { childList: true, subtree: true });
        }

        makerLabelCode = GetParam(PageURL(), 'maker');
        makerLabel = getMakerLabel(makerLabelCode);
        rawMediaType = GetParam(PageURL(), 'media_type');
    });
})();