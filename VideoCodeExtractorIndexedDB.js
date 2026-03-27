// ==UserScript==
// @name         Video Code Extractor IndexedDB 고도화
// @namespace    http://tampermonkey.net/
// @version      4.2.1
// @description  개수 표시 + IndexedDB 고도화
// @author       DancyClubs
// @match        https://video.dmm.co.jp/av/list/?maker=*
// @match        https://video.dmm.co.jp/av/maker/*
// @resource     MAKER_MAP https://raw.githubusercontent.com/DandyClubs/CopyLinksCommonJS/main/DMM_MakerMap_2026-03-26.json
// @require      https://raw.githubusercontent.com/DandyClubs/RootDomain/main/RootDomain.js
// @grant        GM_getResourceText
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_getResourceText
// @grant        GM_xmlhttpRequest
// @run-at       document-body
// @connect      dmm.co.jp
// @connect      prestige-av.com
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

    const imageUrlsMap = {
        'FANZA_DIGITAL': "https://awsimgsrc.dmm.co.jp/pics_dig/digital/video/",
        'FANZA_MONO_DVD': "https://awsimgsrc.dmm.com/dig/mono/movie/",
        'PRESTIGE': "https://www.prestige-av.com/api/media/goods/prestige/", // BGN045~072, CHN156~217, ABP398~999번, ABW001~279번
        'DMM': "https://pics.dmm.co.jp/mono/movie/adult/",
    };

    const selectKeyPreFixMap = {
        'dmm.co.jp': 'FANZA_DIGITAL',
        'dmm.com': 'FANZA_MONO_DVD',
        'prestige-av.com': 'PRESTIGE',
    };

    const makerLabelReplaceMap = {
        "SODクリエイト": "SOD",
        "アイデアポケット": "IdeaPocket",
        "アタッカーズ": "Attackers",
        "エスワン ナンバーワンスタイル": "S1 NO.1 STYLE",
        "エムズビデオグループ": "M’s video Group",
        "オーロラプロジェクト・アネックス": "AuroraProjectAnnex",
        "グローリークエスト": "GloryQuest",
        "ケイ・エム・プロデュース": "KMP",
        "ナチュラルハイ": "NaturalHigh",
        "プレステージ": "Prestige",
        "マックスエー": "MAX-A",
        "マドンナ": "Madonna",
        "ムーディーズ": "MOODYZ",
        "メディアブランド": "MediaBrand",
        "ワンズファクトリー": "WanzFactory",
        "ワープエンタテインメント": "Waap",
    };

    const PageURL = () => window.location !== window.parent.location ? document.referrer : document.location.href;
    const KEY_PREFIX = (url) => selectKeyPreFixMap[extractRootDomain(url)];

    const imageSelectorMap = {
        'video.dmm.co.jp': 'main ul li a[href*="/av/content/?id="] picture source[srcset^="https://awsimgsrc.dmm.co.jp/pics_dig/digital/video/"]',
    };
    const getImageSelector = () => {
        try {
            const urlObj = new URL(PageURL());
            let hostname = urlObj.hostname;

            // 정규식 설명:
            // ^www     : 문자열이 'www'로 시작하고
            // \d* : 그 뒤에 숫자가 0개 이상(있어도 되고 없어도 됨) 붙으며
            // \.       : 그 뒤에 마침표(.)가 오는 패턴을 찾습니다.
            hostname = hostname.replace(/^www\d*\./, '');

            return imageSelectorMap[hostname];
        } catch (e) {
            // URL 생성 실패 시 현재 창의 호스트네임에서 숫자 포함 www 제거
            console.warn('[작업에 맞는 사이트가 아닙니다]');
            return null;
        }
    };

    const LOCAL_MAKER_KEY = "CUSTOM_MAKER_DATA"; // 로컬 저장 키

    let imageSelector = getImageSelector();

    let makerLabelCode = GetParam(PageURL(), 'maker');
    let makerSelector = `body div main a[href="/av/list/?maker=${makerLabelCode}"]`;
    let rawMediaType = GetParam(PageURL(), 'media_type');

    const PROCESSED_CLASS = 'processed-marker';

    let alertStatus = null; // 상태 메시지용 엘리먼트    
    let makerLabel = ""; // 전역 변수로 관리
    let listContainer = null;
    let countStatus = null; // 개수를 표시할 엘리먼트
    let currentSessionCodes = new Set();
    let isShowAllMode = false;
    let filterText = "";


    const DB_CONFIG = { name: "VideoCodeExtractorDB", version: 8, stores: { codes: "id", imageMeta: "url" } };
    const DB_VERSION_KEY = "VideoCodeExtractorDB_LAST_DB_VERSION"; // GM에 저장할 키 이름

    class VceDB {      

        static async open() {
            // 1. GM 저장소에서 마지막 기록된 버전을 가져옵니다. (없으면 기본값 1)
            let currentVersion = GM_getValue(DB_VERSION_KEY, 1);

            const tryOpen = (version) => new Promise((resolve, reject) => {
                const request = indexedDB.open(DB_CONFIG.name, version);

                request.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    const tx = e.currentTarget.transaction;

                    // --- [구조 점검 및 자동 복구 로직] ---
                    // codes 스토어
                    if (!db.objectStoreNames.contains("codes")) {
                        const store = db.createObjectStore("codes", { keyPath: "id" });
                        store.createIndex("patternKey", "patternKey", { unique: false });
                    } else {
                        const store = tx.objectStore("codes");
                        if (!store.indexNames.contains("patternKey")) {
                            store.createIndex("patternKey", "patternKey", { unique: false });
                        }
                    }

                    // imageMeta 스토어
                    if (!db.objectStoreNames.contains("imageMeta")) {
                        const store = db.createObjectStore("imageMeta", { keyPath: "url" });
                        store.createIndex("patternKey", "patternKey", { unique: false });
                        store.createIndex("status", "status", { unique: false });
                    } else {
                        const store = tx.objectStore("imageMeta");
                        if (!store.indexNames.contains("patternKey")) {
                            store.createIndex("patternKey", "patternKey", { unique: false });
                        }
                    }
                    console.log(`[DB Upgrade] 버전 ${version}으로 구조 업데이트 완료`);
                };

                request.onsuccess = (e) => {
                    const db = e.target.result;
                    // 오픈 성공 시 현재 버전을 GM에 최신화
                    GM_setValue(DB_VERSION_KEY, db.version);
                    resolve(db);
                };

                request.onerror = (e) => reject(e);
            });

            try {
                // 2. 먼저 GM에 저장된 버전으로 오픈을 시도합니다.
                let db = await tryOpen(currentVersion);

                // 3. [핵심] 오픈은 성공했지만, 코드 실행 전에 인덱스가 정말 있는지 최종 확인
                // 만약 인덱스가 없다면 (코드는 업데이트됐는데 DB 버전은 그대로인 경우)
                if (!db.objectStoreNames.contains("codes") ||
                    !db.transaction("codes").objectStore("codes").indexNames.contains("patternKey")) {

                    db.close(); // 기존 연결 닫기
                    console.warn("인덱스 누락 감지! 버전을 올려 재구성합니다.");
                    return await tryOpen(currentVersion + 1); // 버전 +1 하여 강제 업그레이드 유도
                }
                return db;
            } catch (err) {
                // 버전 충돌(VersionError) 등이 발생하면 무조건 +1 해서 재시도
                if (err.target?.error?.name === "VersionError") {
                    return await tryOpen(currentVersion + 1);
                }
                throw err;
            }
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
        static async getCodeByPattern(patternKey) {
            const db = await this.open();
            return new Promise(r => {
                const tx = db.transaction("codes", "readonly");
                const store = tx.objectStore("codes");
                // patternKey 인덱스가 있다면:
                const index = store.index("patternKey");
                const request = index.get(patternKey);
                request.onsuccess = (e) => r(e.target.result);
                request.onerror = () => r(null);
            });
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
        static async getSchedulableTasks() {
            const db = await this.open();
            return new Promise((resolve, reject) => {
                const tx = db.transaction("imageMeta", "readwrite"); // 'readwrite' 권한 필수
                const store = tx.objectStore("imageMeta");
                const request = store.getAll(); // 상태와 시간을 모두 체크하기 위해 전체 호출

                request.onsuccess = async (e) => {
                    const now = Date.now();
                    const TIMEOUT = 5 * 60 * 1000; // 5분 타임아웃
                    const allTasks = e.target.result;

                    // 1. 실행 가능한 작업 필터링
                    const tasksToRun = allTasks.filter(task => {
                        // 조건 A: 대기 중(pending)이고 실행 시간이 되었거나 첫 실행인 경우
                        if (task.status === "pending") {
                            return !task.nextRetryAt || task.nextRetryAt <= now;
                        }

                        // 조건 B: 실행 중(processing)인데 시작한 지 5분이 넘었을 경우 (고립된 작업 구출)
                        if (task.status === "processing") {
                            return task.lastStartTime && (now - task.lastStartTime) > TIMEOUT;
                        }

                        return false;
                    });

                    // 2. [중요] 필터링된 작업들을 즉시 '진행 중' 상태로 업데이트 (Lock 걸기)
                    // 이렇게 해야 다른 탭이 동시에 실행했을 때 목록에서 제외됨
                    for (const task of tasksToRun) {
                        task.status = "processing";
                        task.lastStartTime = now; // 작업 시작 시간 기록 (타임아웃 체크용)
                        store.put(task);
                    }

                    // 트랜잭션이 완료되면 작업 목록을 반환
                    tx.oncomplete = () => {
                        resolve(tasksToRun);
                    };

                    tx.onerror = (err) => {
                        console.error("트랜잭션 오류:", err);
                        reject(err);
                    };
                };
            });
        }
    }

    const requestQueue = [];
    let isIdleProcessing = false;

    async function fetchImageResolution(url) {
        // 1. URL 확장자를 통해 필요한 바이트 크기 미리 계산
        const getExpectedRange = (url) => {
            const lowerUrl = url.toLowerCase();
            if (lowerUrl.endsWith('.png') || lowerUrl.endsWith('.gif')) {
                return "0-1000"; // PNG/GIF는 1KB면 충분함
            } else if (lowerUrl.endsWith('.webp')) {
                return "0-5000"; // WebP는 약 5KB 정도
            } else {
                return "0-20000"; // JPEG나 알 수 없는 경우 20KB
            }
        };

        const targetRange = getExpectedRange(url);

        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: url,
                headers: { "Range": `bytes=${targetRange}` },
                responseType: "arraybuffer",
                onload: (res) => {
                    let result = { width: 0, height: 0, status: res.status, errorReason: "", type: "Unknown" };

                    // 1. HTTP 오류 체크
                    if (res.status < 200 || res.status >= 300) {
                        result.errorReason = `HTTP ${res.status} 오류`;
                        return resolve(result);
                    }

                    const bytes = new Uint8Array(res.response);

                    // 2. 포맷 판별 및 해상도 추출
                    // PNG (89 50 4E 47 ...)
                    if (bytes[0] === 0x89 && bytes[1] === 0x50) {
                        result.type = "PNG";
                        result.width = (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
                        result.height = (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];
                    }
                    // GIF (47 49 46 38 ...)
                    else if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
                        result.type = "GIF";
                        result.width = bytes[6] | (bytes[7] << 8); // Little-endian
                        result.height = bytes[8] | (bytes[9] << 8);
                    }
                    // JPEG (FF D8 ...)
                    else if (bytes[0] === 0xFF && bytes[1] === 0xD8) {
                        result.type = "JPEG";
                        let i = 2;
                        while (i < bytes.length - 8) {
                            const marker = (bytes[i] << 8) | bytes[i + 1];
                            const len = (bytes[i + 2] << 8) | bytes[i + 3];
                            // SOF 마커 확인 (0xFFC0 ~ 0xFFCF 중 일부 제외)
                            if (marker >= 0xFFC0 && marker <= 0xFFCF && ![0xFFC4, 0xFFC8, 0xFFCC].includes(marker)) {
                                result.height = (bytes[i + 5] << 8) | bytes[i + 6];
                                result.width = (bytes[i + 7] << 8) | bytes[i + 8];
                                break;
                            }
                            i += len + 2;
                        }
                    }
                    // WebP (52 49 46 46 ... 57 45 42 50)
                    else if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
                        result.type = "WebP";
                        // WebP는 내부 청크(VP8/VP8L/VP8X)에 따라 위치가 달라 더 복잡하지만, 
                        // 간단하게 24-30바이트 사이에서 기초 해상도를 읽을 수 있습니다.
                        if (bytes[12] === 0x56 && bytes[13] === 0x50 && bytes[14] === 0x38) {
                            result.width = (bytes[26] | (bytes[27] << 8)) & 0x3FFF;
                            result.height = (bytes[28] | (bytes[29] << 8)) & 0x3FFF;
                        }
                    }

                    if (!result.width) result.errorReason = "해상도 정보 추출 불가";
                    resolve(result);
                },
                onerror: () => resolve({ width: 0, height: 0, status: 0, errorReason: "네트워크 오류" }),
                ontimeout: () => resolve({ width: 0, height: 0, status: 0, errorReason: "시간 초과" })
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

            // 1. 상태 표시 업데이트 (대기량 알림)
            updateProcessingStatus(true, requestQueue.length);

            const res = await fetchImageResolution(task.url);
            const existingMeta = await VceDB.getImageMeta(task.url);
            if (!existingMeta) continue;

            let updateData = { ...existingMeta };

            if (res.width > 0) {
                // 성공 시
                updateData.status = "completed";
                updateData.width = res.width;
                updateData.height = res.height;
                updateData.resText = `${res.width}x${res.height}`;
                updateData.retryCount = 0; // 초기화
            } else {
                // 실패 시 재시도 로직 계산
                const retryCount = (existingMeta.retryCount || 0) + 1;
                const now = Date.now();

                updateData.lastError = res.errorReason;
                updateData.retryCount = retryCount;

                if (res.status === 404) {
                    // 404: 24시간 뒤 재시도, 2회 실패 시 포기
                    if (retryCount >= 2) {
                        updateData.status = "failed_permanently";
                    } else {
                        updateData.status = "pending";
                        updateData.nextRetryAt = now + (24 * 60 * 60 * 1000);
                    }
                } else {
                    // 403, 500, 451, 0 등: 12시간 뒤 무한 재시도
                    updateData.status = "pending";
                    updateData.nextRetryAt = now + (12 * 60 * 60 * 1000);
                }
            }

            await VceDB.setImageMeta(updateData);
        }

        // 작업 완료 후 상태 업데이트
        if (requestQueue.length > 0) {
            scheduleIdleWork();
        } else {
            isIdleProcessing = false;
            updateProcessingStatus(false, 0);
        }
    }

    function updateProcessingStatus(isWorking, count) {
        let statusEl = document.getElementById('vce-status-indicator');
        if (!statusEl) {
            statusEl = document.createElement('div');
            statusEl.id = 'vce-status-indicator';
            Object.assign(statusEl.style, {
                position: 'fixed', bottom: '10px', right: '10px',
                padding: '5px 10px', background: 'rgba(0,0,0,0.7)',
                color: 'white', fontSize: '12px', borderRadius: '5px', zIndex: '9999'
            });
            document.body.appendChild(statusEl);
        }

        if (isWorking) {
            statusEl.innerHTML = `⚙️ 처리 중... (대기: ${count})`;
            statusEl.style.display = 'block';
        } else {
            statusEl.style.display = 'none';
        }
    }

    const mutCallback = async () => {
        if (/video\.dmm\.co\.jp\/av\/list\/\?maker=\d+&media_type=/.test(PageURL())) {
            imageSelector = getImageSelector();
            if (!imageSelector) return;
            const targets = document.querySelectorAll(`${imageSelector}:not(.${PROCESSED_CLASS})`);
            if (targets.length === 0) return;
            for (const el of targets) {
                el.classList.add(PROCESSED_CLASS);
                const targetUrl = el.getAttribute('srcset') || el.getAttribute('src');
                if (targetUrl) await processWork(targetUrl); // await 처리를 위해 변경됨
            }
        }
    };

    const observer = new MutationObserver(mutCallback);

    function GetParam(url, paramName) {
        const urlObj = new URL(url);
        const params = new URLSearchParams(urlObj.search);
        const result = params.get(paramName);
        return result?.toUpperCase() || '';
    }

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
            console.log({ rawMediaType, makerLabelCode, makerLabel });
            if (!rawMediaType && !makerLabelCode) {
                alertStatus.innerHTML = `<div style="color:#F44336; margin-bottom:5px; font-weight:bold;">❌ 추출할 메이커 페이지로 이동하세요!</div>`;
            } else if (!rawMediaType) {
                alertStatus.innerHTML = `<div style="color:#FF9800; margin-bottom:5px; font-weight:bold;">⚠️ ${makerLabelCode ? `<a id="choicetype" href="https://video.dmm.co.jp/av/list/?maker=${makerLabelCode}&media_type=2d">2D</a>를 선택하세요!</a>` : `제조사 리스트 페이지로 이동하세요!`}<br>❌ 페이지 주소가 맞지 않아 수집 중단.</div>`;
            } else if (!makerLabelCode || makerLabel === "Unknown") {
                alertStatus.innerHTML = `<div style="color:#F44336; margin-bottom:5px; font-weight:bold;">❌ 제작사 정보를 가져오지 못했습니다.</div>`;
            } else {
                alertStatus.innerHTML = "";
            }
        }
    }

    const resetSessionCodes = () => {
        const newUrl = PageURL();
        makerLabelCode = GetParam(newUrl, 'maker');
        rawMediaType = GetParam(newUrl, 'media_type');
        makerLabel = getMakerLabel(makerLabelCode);

        if (currentSessionCodes.size > 0) {
            currentSessionCodes.clear();
            updateDisplayList();
        }
        if (/video\.dmm\.co\.jp\/av\/list\/\?maker=\d+&media_type=/.test(newUrl)) {
            observer.disconnect(); // 기존 감시 중단 후 재시작
            observer.observe(document.body, { childList: true, subtree: true });
            mutCallback(); // 즉시 한 번 실행
        }
    };

    // History API 가로채기
    const wrapHistory = (type) => {
        const original = history[type];
        return function () {
            const res = original.apply(this, arguments);
            const event = new Event(type.toLowerCase());
            event.arguments = arguments;
            window.dispatchEvent(event);
            return res;
        };
    };

    history.pushState = wrapHistory('pushState');
    history.replaceState = wrapHistory('replaceState');

    // 모든 주소 변경 이벤트에 대응
    window.addEventListener('pushstate', resetSessionCodes);
    window.addEventListener('popstate', resetSessionCodes);
    window.addEventListener('hashchange', resetSessionCodes);

    const originalPush = history.pushState;
    history.pushState = function () { originalPush.apply(this, arguments); resetSessionCodes(); };
    const originalReplace = history.replaceState;
    history.replaceState = function () { originalReplace.apply(this, arguments); resetSessionCodes(); };


    async function processWork(sourceURL) {

        if (!sourceURL || !sourceURL.includes('https://awsimgsrc.dmm.co.jp/pics_dig/digital/video/')) return false;
        const cleanUrl = sourceURL.split('?')[0];

        const majorsLabel = /digital\/video\/(.*?)([a-z]{3,7}\d{4,7}|[ts]{1,2}\d{2,7})[v]?/i;
        if (!majorsLabel.test(cleanUrl)) return false;


        const skipPatterns = [
            /digital\/video\/(h_[0-9]*?)([vpjg])(\d{3,})([a-z]*?)\//,
            /digital\/video\/\d+jdxa\d+/i,
        ];

        for (const skipRegex of skipPatterns) if (skipRegex.test(cleanUrl)) return false;

        const pathSegments = cleanUrl.split('/');
        const contentId = pathSegments[pathSegments.length - 2];
        const fileName = pathSegments.pop();
        const fileExtension = fileName.split('.').pop();
        const originalImage = cleanUrl.replace(fileName, `${contentId}pl.${fileExtension}`);
        const maskedId = contentId.replace(/\d/g, '0');
        const patternKey = `${maskedId}_${makerLabelCode}_${rawMediaType}`;

        // --- [섹션 1: 이미지 메타 처리] ---
        // 이미지 해상도 체크는 코드 추출 여부와 상관없이 별개로 진행 (중복 시 DB가 알아서 처리)
        const meta = await VceDB.getImageMeta(originalImage);
        if (!meta) {
            await VceDB.setImageMeta({ url: originalImage, patternKey, status: "pending" });
            addToQueue({ url: originalImage });
        }

        // --- [섹션 2: 코드 DB 중복 체크 (PatternKey 기준)] ---
        // ★ 여기서 patternKey로 이미 저장된 코드가 있는지 확인합니다.
        const existingPattern = await VceDB.getCodeByPattern(patternKey);
        if (existingPattern) {
            // 이미 이 패턴의 코드를 추출한 적이 있다면 더 이상 진행 안 함
            return true;
        }

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
        for (const regex of extractPatterns) { match = originalImage.match(regex); if (match) break; }

        if (match) {
            if (!makerLabelCode && !rawMediaType && !makerLabel) return false;

            const prefixMatch = match[1];
            const code = match[2].toUpperCase();
            const padLen = match[3].length;
            const suffix = match[4];
            const displayCode = code;
            const uniqueKey = `${KEY_PREFIX(originalImage)}_${displayCode}_${prefixMatch}_${padLen}_${suffix}_${makerLabelCode}_${rawMediaType}`;

            if (!currentSessionCodes.has(uniqueKey)) {
                currentSessionCodes.add(uniqueKey);
                const imageSourceKey = Object.keys(imageUrlsMap).find(key =>
                    cleanUrl.startsWith(imageUrlsMap[key])
                ) || "UNKNOWN";

                // 저장할 때 patternKey를 포함시켜서 나중에 위에서 검색 가능하게 함
                await VceDB.saveCode(uniqueKey, {
                    displayCode: displayCode,
                    data: [imageSourceKey, prefixMatch, padLen, suffix, makerLabel, rawMediaType],
                    origin: cleanUrl,
                    patternKey: patternKey // 검색용 키 저장
                });
                updateDisplayList();
            }

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
                </div>                                        
                <span style="color:white; font-size:10px;padding-left:5px;">[ ${itemData.data[5]} ]</span>
                <button class="del-btn" style="background:none; border:none; color:#ff4d4d; cursor:pointer; font-weight:bold; font-size:16px; padding:0 5px;">×</button>
            `;

            row.querySelector('.item-check').onchange = updateCounts;

            row.querySelector('.del-btn').onclick = async (e) => {
                await VceDB.deleteCode(key);
                currentSessionCodes.delete(key);
                const getS = e.target.parentElement.getAttribute('title');
                if (getS) {
                    processWork(getS);
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

                    Object.entries(externalData).forEach(([id, originalName]) => {
                        // 변경 이름이 있으면 가져오고, 없으면 null 혹은 원래 이름을 넣습니다.
                        const finalName = makerLabelReplaceMap[originalName] || originalName;

                        // Map에 객체 형태로 저장: [ID, { 원래이름, 변경이름 }]
                        makerMap.set(id, {
                            original: originalName,
                            final: finalName
                        });
                    });
                }
            }
            // 2. GM_getValue로 저장된 로컬 데이터 로드 및 병합
            const localData = GM_getValue(LOCAL_MAKER_KEY, {});
            Object.entries(localData).forEach(([id, data]) => {
                makerMap.set(id, data); // 외부 리소스보다 로컬 데이터(수정본)를 우선함
            });
        } catch (e) {
            console.warn("[initializeMakerMap] 외부리소스 로딩 실패", e);
        }
        console.log(`메이커 맵 구성: ${makerMap.size}개 항목`, makerMap);
        if (/video\.dmm\.co\.jp\/av\/list\/\?maker=\d+&media_type=/.test(PageURL())) {
            observer.observe(document.body, { childList: true, subtree: true });
        }
        makerLabelCode = GetParam(PageURL(), 'maker');
        rawMediaType = GetParam(PageURL(), 'media_type');
        makerLabel = getMakerLabel(makerLabelCode);
    }

    function getMakerLabel(id) {
        if (!id) return "Unknown";

        // 1. 이미 맵(메모리+로컬저장소)에 존재하면 즉시 반환
        if (makerMap.has(id)) {
            const entry = makerMap.get(id);
            return entry.final || entry.original;
        }

        // 2. 맵에 없을 경우 페이지에서 직접 추출
        const el = document.querySelector(`a[href*="maker=${id}"]`) || document.querySelector(makerSelector);
        const label = el?.innerText.trim();

        if (label) {
            const makerlName = makerLabelReplaceMap[label] || label;
            const newData = { original: label, final: makerlName };

            // 메모리에 저장
            makerMap.set(id, newData);

            // [핵심] GM_setValue를 이용해 영구 저장소 업데이트
            const currentLocal = GM_getValue(LOCAL_MAKER_KEY, {});
            currentLocal[id] = newData;
            GM_setValue(LOCAL_MAKER_KEY, currentLocal);

            console.log(`[신규 메이커 저장] ${id}: ${makerlName}`);
            return makerlName;
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
            <div style="display:flex; align-items:center; justify-content:flex-start; width:100%; gap:8px;">
                <button id="btnSelectAll" style="background:#2196F3; color:white; border:none; padding:4px 8px; font-size:11px; cursor:pointer; border-radius:3px; font-weight:bold;">전체 선택</button>
                <button id="btnUnselectAll" style="background:#666; color:white; border:none; padding:4px 8px; font-size:11px; cursor:pointer; border-radius:3px; font-weight:bold;">전체 해제</button>
                <div style="flex:1"></div> <button id="delSelected" style="background:#444; color:#ff4d4d; border:none; padding:4px 8px; font-size:11px; cursor:pointer; border-radius:3px; font-weight:bold;">선택 삭제</button>
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

        // 전체 선택 버튼
        controlBar.querySelector('#btnSelectAll').onclick = () => {
            const checkboxes = listContainer.querySelectorAll('.item-check');
            checkboxes.forEach(cb => cb.checked = true);
            updateCounts(); // 상단 개수 표시 갱신
        };

        // 전체 해제 버튼
        controlBar.querySelector('#btnUnselectAll').onclick = () => {
            const checkboxes = listContainer.querySelectorAll('.item-check');
            checkboxes.forEach(cb => cb.checked = false);
            updateCounts();
        };

        controlBar.querySelector('#delSelected').onclick = async () => {
            const selected = listContainer.querySelectorAll('.item-check:checked');
            if (selected.length === 0) return alert("삭제할 항목을 선택해주세요.");
            if (confirm(`${selected.length}개의 항목을 삭제하시겠습니까?`)) {
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
            allItems.sort((a, b) => a.displayCode.localeCompare(b.displayCode));

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
        createUI();
        await sleep(2000);

        const tasksToRun = await VceDB.getSchedulableTasks();

        if (tasksToRun.length > 0) {
            console.log(`${tasksToRun.length}개의 재시도 작업을 큐에 추가합니다.`);
            for (const task of tasksToRun) {
                await addToQueue({ url: task.url });
            }
        }

        if (/video\.dmm\.co\.jp\/av\/list\/\?maker=\d+&media_type=/.test(PageURL())) {
            mutCallback();
            observer.observe(document.body, { childList: true, subtree: true });
        }
    });
})();