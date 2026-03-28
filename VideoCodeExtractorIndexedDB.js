// ==UserScript==
// @name         Video Code Extractor IndexedDB 고도화
// @namespace    http://tampermonkey.net/
// @version      4.3.5
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
// @grant        GM_deleteValue
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


    const DB_CONFIG = { name: "VideoCodeExtractorDB", stores: { codes: "id", imageMeta: "url" } };
    const DB_VERSION_KEY = "VideoCodeExtractorDB_LAST_DB_VERSION"; // GM에 저장할 키 이름
    
    class VceDB {
        /**
         * DB를 열고 구조를 최신화합니다.
         * @returns {Promise<IDBDatabase>}
         */
        static async open() {
            // 1. GM 저장소에서 마지막 기록된 버전을 가져옵니다. (없으면 기본값 1)
            let targetVersion = GM_getValue(DB_VERSION_KEY, 1);

            const connect = (version) => new Promise((resolve, reject) => {
                const request = indexedDB.open(DB_CONFIG.name, version);

                request.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    const tx = e.currentTarget.transaction;

                    console.log(`[DB Upgrade] 버전 ${version}으로 업데이트 중...`);

                    // --- [1. codes 스토어 생성 및 인덱스 관리] ---
                    if (!db.objectStoreNames.contains("codes")) {
                        const store = db.createObjectStore("codes", { keyPath: "id" });
                        store.createIndex("patternKey", "patternKey", { unique: false });
                    } else {
                        const store = tx.objectStore("codes");
                        if (!store.indexNames.contains("patternKey")) {
                            store.createIndex("patternKey", "patternKey", { unique: false });
                        }
                    }

                    // --- [2. imageMeta 스토어 생성 및 인덱스 관리] ---
                    if (!db.objectStoreNames.contains("imageMeta")) {
                        const store = db.createObjectStore("imageMeta", { keyPath: "url" });
                        store.createIndex("patternKey", "patternKey", { unique: false });
                        store.createIndex("status", "status", { unique: false });
                    } else {
                        const store = tx.objectStore("imageMeta");
                        if (!store.indexNames.contains("patternKey")) {
                            store.createIndex("patternKey", "patternKey", { unique: false });
                        }
                        if (!store.indexNames.contains("status")) {
                            store.createIndex("status", "status", { unique: false });
                        }
                    }
                };

                request.onsuccess = (e) => {
                    const db = e.target.result;
                    GM_setValue(DB_VERSION_KEY, db.version);
                    resolve(db);
                };

                request.onerror = (e) => reject(e.target.error);
            });

            try {
                let db = await connect(targetVersion);

                // [방어 로직] 실제로 저장소와 인덱스가 모두 존재하는지 최종 검사
                const hasCodes = db.objectStoreNames.contains("codes");
                const hasImageMeta = db.objectStoreNames.contains("imageMeta");

                let needsUpgrade = !hasCodes || !hasImageMeta;

                if (!needsUpgrade && hasCodes) {
                    const tx = db.transaction("codes", "readonly");
                    if (!tx.objectStore("codes").indexNames.contains("patternKey")) {
                        needsUpgrade = true;
                    }
                }

                if (needsUpgrade) {
                    console.warn("DB 구조 누락 발견: 버전을 올려 재구성을 강제합니다.");
                    const nextVer = db.version + 1;
                    db.close();
                    return await connect(nextVer);
                }

                return db;
            } catch (err) {
                // 버전 충돌(VersionError) 발생 시 최신 버전 파악 후 재시도
                if (err.name === "VersionError") {
                    return new Promise(resolve => {
                        const req = indexedDB.open(DB_CONFIG.name);
                        req.onsuccess = (e) => {
                            const db = e.target.result;
                            const nextV = db.version + 1;
                            db.close();
                            resolve(connect(nextV));
                        };
                    });
                }
                throw err;
            }
        }

        // --- 데이터 조작 메서드들 ---

        static async getCode(id) {
            const db = await this.open();
            return new Promise(r => db.transaction("codes").objectStore("codes").get(id).onsuccess = e => r(e.target.result));
        }

        static async saveCode(id, payload) {
            const db = await this.open();
            const tx = db.transaction("codes", "readwrite");
            const store = tx.objectStore("codes");

            const existing = await new Promise(r => store.get(id).onsuccess = e => r(e.target.result));
            if (existing) {
                return new Promise(r => store.put({ ...existing, ...payload, updatedAt: Date.now() }).onsuccess = () => r());
            }

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
                try {
                    const index = store.index("patternKey");
                    index.get(patternKey).onsuccess = (e) => r(e.target.result);
                } catch (e) { r(null); }
            });
        }

        static async setImageMeta(meta) {
            const db = await this.open();
            return new Promise(r => db.transaction("imageMeta", "readwrite").objectStore("imageMeta").put({ ...meta, updatedAt: Date.now() }).onsuccess = () => r());
        }

        static async getImageMeta(url) {
            const db = await this.open();
            return new Promise(r => {
                const tx = db.transaction("imageMeta", "readonly");
                tx.objectStore("imageMeta").get(url).onsuccess = e => r(e.target.result);
            });
        }

        static async getSchedulableTasks() {
            const db = await this.open();
            return new Promise((resolve, reject) => {
                const tx = db.transaction("imageMeta", "readwrite");
                const store = tx.objectStore("imageMeta");
                const request = store.getAll();

                request.onsuccess = (e) => {
                    const now = Date.now();
                    const TIMEOUT = 5 * 60 * 1000;
                    const tasksToRun = e.target.result.filter(task => {
                        if (task.status === "pending") return !task.nextRetryAt || task.nextRetryAt <= now;
                        if (task.status === "processing") return task.lastStartTime && (now - task.lastStartTime) > TIMEOUT;
                        return false;
                    });

                    for (const task of tasksToRun) {
                        task.status = "processing";
                        task.lastStartTime = now;
                        store.put(task);
                    }

                    tx.oncomplete = () => resolve(tasksToRun);
                };
                request.onerror = (err) => reject(err);
            });
        }

        /**
     * 데이터베이스를 완전히 삭제하고 초기화합니다.
     */
        static async resetDatabase() {
            return new Promise((resolve, reject) => {
                // 현재 연결된 DB가 있다면 닫아야 삭제가 가능할 수 있습니다.
                // 여기서는 단순 삭제 요청을 보냅니다.
                const req = indexedDB.deleteDatabase(DB_CONFIG.name);

                req.onsuccess = () => {
                    console.log("데이터베이스 삭제 성공");
                    GM_deleteValue(DB_VERSION_KEY); // 저장된 버전 정보도 삭제
                    resolve();
                };

                req.onerror = () => {
                    console.error("데이터베이스 삭제 실패");
                    reject(new Error("DB 삭제에 실패했습니다."));
                };

                req.onblocked = () => {
                    console.warn("삭제 작업이 차단되었습니다. 모든 탭을 닫고 다시 시도해 주세요.");
                    alert("다른 탭에서 DB를 사용 중입니다. 모든 관련 탭을 닫고 다시 시도해 주세요.");
                    reject(new Error("DB Blocked"));
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
                headers: {
                    "Range": `bytes=${targetRange}`,
                    "Referer": "https://video.dmm.co.jp/", // 정상 경로인 척 함
                    "Origin": "https://video.dmm.co.jp"
                },
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
                color: 'white', fontSize: '12px', borderRadius: '5px', zIndex: '99999'
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
                if (targetUrl) await processWork(targetUrl, rawMediaType, makerLabelCode, makerLabel); // await 처리를 위해 변경됨
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


    async function processWork(sourceURL, rawMediaType, makerLabelCode, makerLabel) {
        if (!makerLabelCode || !rawMediaType || !makerLabel) return false;

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
            await VceDB.setImageMeta({ url: originalImage, contentId, patternKey, status: "pending" });
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

            const prefixMatch = match[1];
            const code = match[2].toUpperCase();
            const padLen = match[3].length;
            const suffix = match[4];
            const displayCode = code;
            const uniqueKey = `${displayCode}_${prefixMatch}_${padLen}_${suffix}_${makerLabelCode}_${rawMediaType}`;

            if (!currentSessionCodes.has(uniqueKey)) {
                currentSessionCodes.add(uniqueKey);
                const imageSourceKey = Object.keys(imageUrlsMap).find(key =>
                    originalImage.startsWith(imageUrlsMap[key])
                ) || "UNKNOWN";

                // 저장할 때 patternKey를 포함시켜서 나중에 위에서 검색 가능하게 함
                await VceDB.saveCode(uniqueKey, {
                    displayCode: displayCode,
                    data: [imageSourceKey, prefixMatch, padLen, suffix, makerLabel, rawMediaType],
                    origin: originalImage,
                    patternKey: patternKey, // 검색용 키 저장
                    makerLabelCode: makerLabelCode,
                });
                updateDisplayList();
            }

            return true;
        }
        return false;
    }

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
            const refreshIcon = `
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M23 4v6h-6"></path>
                                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                                </svg>`;
            row.style = "display:flex; align-items:center; border-bottom:1px solid #333; padding:6px 0; gap:8px;";
            row.innerHTML = `
                <input type="checkbox" class="item-check" data-key="${key}" style="margin-left:5px; width:15px; height:15px; cursor:pointer; accent-color:#00FF41; appearance:auto;">
                <div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1; cursor:help;" title="${itemData.origin}">
                <a href="${itemPageUrl}" target="_blank"><span style="color:#00FF41; font-family:monospace; font-size:12px;">${itemData.displayCode}</span></a>
                    ${detailLabel ? `<span style="color:white; font-size:10px; margin-left:5px;">[</span><span style="color:#00FF41; font-size:10px;">${detailLabel}</span><span style="color:white; font-size:10px;">]</span>` : ''}
                </div>
                <span style="color:white; font-size:10px;padding-left:5px;">[ ${itemData.data[5]} ]</span>
                <button class="reset-btn" style="background:none; border:none; color:#aaa; cursor:pointer; display:flex; align-items:center; padding:0 5px;">${refreshIcon}</button>
            `;

            row.querySelector('.item-check').onchange = updateCounts;

            // updateDisplayList 함수 내 반복문(items.forEach) 부분 수정
            row.querySelector('.reset-btn').onclick = async (e) => {
                const targetUrl = itemData.origin;
                const makerLabel = itemData.data[4];
                const makerLabelCode = itemData.makerLabelCode; // 상위 스코프 변수 활용
                const rawMediaType = itemData.data[5];

                if (targetUrl) {
                    // 1. 대기열(Queue)에 객체 형태로 추가
                    let queue = JSON.parse(GM_getValue("process_queue", "[]"));
                    if (!queue.some(q => q.url === targetUrl)) {
                        queue.push({
                            url: targetUrl,
                            maker: makerLabel,
                            makerCode: makerLabelCode,
                            type: rawMediaType
                        });
                        GM_setValue("process_queue", JSON.stringify(queue));
                        console.log(`[Queue Add] ${targetUrl}`);
                    }

                    // 2. DB 및 메모리에서 즉시 삭제
                    await VceDB.deleteCode(key);
                    currentSessionCodes.delete(key);

                    // 3. 리스트 갱신 및 큐 카운트 업데이트
                    updateDisplayList(false);
                    refreshQueueButton(); // 아래에서 정의할 버튼 갱신 함수
                }
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
                        const makerName = makerLabelReplaceMap[originalName] || '';

                        // Map에 객체 형태로 저장: [ID, { 원래이름, 변경이름 }]
                        makerMap.set(id, {
                            original: originalName,
                            final: makerName
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
        //console.log(`메이커 맵 구성: ${makerMap.size}개 항목`, makerMap);
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
    // ================================================================================
    /**
        let currentMakerLabel = ""; // 전역 변수

        const addMakerMap = new Map();
        const saveMakerMap = new Map();

        function findMakerLabel(retryCount = 0) {
            // 1. 먼저 페이지 내 모든 메이커 정보를 맵으로 빌드
            extraMakerMap();

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
        function extraMakerMap() {
            const makerNodes = document.querySelectorAll('li a[href*="/av/list/?maker="] p.line-clamp-2.text-ellipsis');
            if (makerNodes.length === 0) {
                alert("저장할 메이커 데이터가 없습니다.");
                return;
            }
            makerNodes.forEach(node => {
                try {
                    const link = node.closest('li a');
                    console.log(link);
                    const url = new URL(link.href, window.location.origin);
                    const makerId = url.searchParams.get('maker');
                    // .line-clamp-2.text-ellipsis 클래스를 가진 텍스트 추출
                    const makerName = link.querySelector('p.line-clamp-2.text-ellipsis')?.innerText.trim();

                    if (makerId && makerName) {
                        addMakerMap.set(makerId, makerName);
                    }
                } catch (e) {
                    console.warn(e);
                }
            });

            console.log(`[extraMakerMap] 메이커 맵 구성 완료: ${addMakerMap.size}개 항목`);
        }
        function saveMakerMapToFile() {
            if (addMakerMap.size === 0) {
                alert("저장할 데이터가 없습니다. 먼저 수집하세요.");
                return;
            }

            // 초기화 (기존 데이터 중첩 방지)
            saveMakerMap.clear();

            // 수정 전: addMakerMap.forEach(([id, originalName]) => { ... })
            // 수정 후: value(이름)가 먼저, key(ID)가 두 번째 인자입니다.
            addMakerMap.forEach((originalName, id) => {
                // 치환 맵(makerLabelReplaceMap)에 있으면 치환된 이름을, 없으면 원래 이름을 사용
                const makerName = (typeof makerLabelReplaceMap !== 'undefined' && makerLabelReplaceMap[originalName])
                    || originalName;

                saveMakerMap.set(id, makerName);
            });

            // 이하 JSON 변환 및 다운로드 로직은 동일
            const obj = Object.fromEntries(saveMakerMap);
            const jsonString = JSON.stringify(obj, null, 2);

            const blob = new Blob([jsonString], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `DMM_MakerMap_${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }

        */
    // ================================================================================

    function createUI() {
        const panel = document.createElement('div');
        panel.classList.add('videocodeextractor');
        panel.style = "position:fixed; bottom:15px; right:15px; z-index:99999; display:flex !important; flex-direction:column; background:rgba(15,15,15,0.95); padding:8px; border-radius:12px; width:268px; border:1px solid #444; box-shadow:0 8px 32px rgba(0,0,0,0.5); color:white; font-family:sans-serif; box-sizing:border-box;";
        panel.innerHTML = `<div style='font-weight:bold; font-size:10px; margin-bottom:5px; text-align:center; color:#2196F3;'>DMM CODE TRACKER</div>`;

        alertStatus = document.createElement('div');
        alertStatus.style = "font-size:11px; text-align:center; line-height:1.4;";
        panel.appendChild(alertStatus);

        countStatus = document.createElement('div');
        countStatus.style = "font-size:10px; color:#aaa; text-align:center; margin-bottom:8px; padding:4px; background:#222; border-radius:4px;";
        panel.appendChild(countStatus);

        // controlBar 생성
        const controlBar = document.createElement('div');
        controlBar.style = "display:flex; flex-direction:column; padding:8px; background:#222; border-bottom:1px solid #444; gap:8px; margin-bottom:10px; border-radius:4px; box-sizing:border-box;";
        controlBar.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:flex-start; width:100%; gap:4px;">
            <button id="btnSelectAll" style="background:#2196F3; color:white; border:none; padding:4px 8px; font-size:10px; cursor:pointer; border-radius:3px; font-weight:bold;">전체 선택</button>
            <button id="btnUnselectAll" style="background:#666; color:white; border:none; padding:4px 8px; font-size:10px; cursor:pointer; border-radius:3px; font-weight:bold;">전체 해제</button>
            <button id="delSelected" style="background:#444; color:#ff4d4d; border:none; padding:4px 8px; font-size:10px; cursor:pointer; border-radius:3px; font-weight:bold;">선택 삭제</button>
            <button id="btnRetrySel" style="background:#FF9800; color:white; border:none; padding:5px; font-size:10px; cursor:pointer; border-radius:3px; font-weight:bold;">선택 재시도 예약</button>
        </div>
        <div style="display:flex; gap:5px; width:100%;">
            <input type="text" id="filterInput" placeholder="예: abc or /abc/" style="flex:1; min-width:0; background:#111; color:#00FF41; border:1px solid #444; padding:5px; font-size:12px; border-radius:3px; outline:none; font-family:monospace;">
            <button id="clearBtn" style="background:#666; color:#fff; border:none; padding:0 8px; font-size:11px; cursor:pointer; border-radius:3px; white-space:nowrap;">X</button>
            <button id="searchBtn" style="background:#00FF41; color:#000; border:none; padding:0 12px; font-size:11px; cursor:pointer; border-radius:3px; font-weight:bold; white-space:nowrap;">찾기</button>
        </div>
`;

        panel.appendChild(controlBar);

        // 선택 재시도 클릭 이벤트
        controlBar.querySelector('#btnRetrySel').onclick = async () => {
            const selected = listContainer.querySelectorAll('.item-check:checked');
            if (selected.length === 0) return alert("항목을 선택해주세요.");

            let queue = JSON.parse(GM_getValue("process_queue", "[]"));
            for (const cb of selected) {
                const key = cb.dataset.key;
                const item = await VceDB.getCode(key);
                if (item && !queue.some(q => q.url === item.origin)) {
                    queue.push({
                        url: item.origin,
                        maker: item.data[4],
                        makerCode: item.makerLabelCode,
                        type: item.data[5]
                    });
                    await VceDB.deleteCode(key);
                    currentSessionCodes.delete(key);
                }
            }
            GM_setValue("process_queue", JSON.stringify(queue));
            updateDisplayList(false);
            refreshQueueButton();
        };

        // 버튼 그룹 생성 및 초기 숨김
        const retryGroup = document.createElement('div');
        retryGroup.id = "retry-group";
        retryGroup.style = "display:none; gap:5px; margin-top:8px; width:100%;";
        retryGroup.innerHTML = `
            <button id="btnRunQueue" style="flex:1; background:#007BFF; color:white; border:none; padding:5px; font-size:11px; cursor:pointer; border-radius:3px; font-weight:bold;">대기열 실행 (0)</button>
`;
        controlBar.appendChild(retryGroup);

        // 대기열 실행 클릭 이벤트
        const btnRun = retryGroup.querySelector('#btnRunQueue');
        btnRun.onclick = async () => {
            const queue = JSON.parse(GM_getValue("process_queue", "[]"));
            if (queue.length === 0) return;
            GM_setValue("process_queue", "[]"); // 즉시 비우기
            btnRun.disabled = true;

            for (let i = 0; i < queue.length; i++) {
                const t = queue[i];
                btnRun.innerText = `처리 중 (${i + 1}/${queue.length})`;
                // 기존 processWork(sourceURL, rawMediaType, makerLabelCode, makerLabel) 순서에 맞춰 호출
                await processWork(t.url, t.type, t.makerCode, t.maker);
            }
            btnRun.disabled = false;
            refreshQueueButton();
            updateDisplayList(false);
        };

        const filterInput = controlBar.querySelector('#filterInput');
        const searchBtn = controlBar.querySelector('#searchBtn');

        // [찾기] 버튼: #selectAll 참조 제거
        searchBtn.onclick = () => {
            filterText = filterInput.value.trim();
            updateDisplayList(false);
        };

        filterInput.onkeydown = (e) => {
            if (e.key === 'Enter') searchBtn.click();
            else if (e.key === 'Escape') { filterInput.value = ''; searchBtn.click(); }
        };

        // [X] 버튼: #selectAll 참조 제거
        controlBar.querySelector('#clearBtn').onclick = () => {
            filterInput.value = "";
            filterText = "";
            updateDisplayList(false);
        };

        // [전체 선택] 버튼
        controlBar.querySelector('#btnSelectAll').onclick = () => {
            const checkboxes = listContainer.querySelectorAll('.item-check');
            checkboxes.forEach(cb => cb.checked = true);
            if (typeof updateCounts === 'function') updateCounts();
        };

        // [전체 해제] 버튼
        controlBar.querySelector('#btnUnselectAll').onclick = () => {
            const checkboxes = listContainer.querySelectorAll('.item-check');
            checkboxes.forEach(cb => cb.checked = false);
            if (typeof updateCounts === 'function') updateCounts();
        };

        // [선택 삭제] 버튼: #selectAll 참조 제거 및 VceDB 연동
        controlBar.querySelector('#delSelected').onclick = async () => {
            const selected = listContainer.querySelectorAll('.item-check:checked');
            if (selected.length === 0) return alert("삭제할 항목을 선택해주세요.");

            if (confirm(`${selected.length}개의 항목을 삭제하시겠습니까?`)) {
                for (const cb of selected) {
                    const key = cb.dataset.key;
                    await VceDB.deleteCode(key); // IndexedDB 삭제
                    currentSessionCodes.delete(key); // 메모리 셋 갱신
                }
                updateDisplayList(false);
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

        // 1. 기존 품번(Codes) 다운로드 버튼
        const dlBtn = document.createElement('button');
        dlBtn.innerText = "품번 저장";
        dlBtn.style = "padding:4px; background:#4CAF50; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px; font-weight:bold;";

        dlBtn.onclick = async () => {
            const allItems = await VceDB.getAllCodes();
            if (allItems.length === 0) return alert("데이터가 없습니다.");

            // [3단계 정렬 수행]
            allItems.sort((a, b) => {
                // 1차: 메이커명 (일본어/영어 섞임)
                const makerA = a.data[4] || "기타";
                const makerB = b.data[4] || "기타";

                if (makerA !== makerB) {
                    // 'ja' 옵션을 주면 일본어 정렬 규칙을 더 정확히 따릅니다.
                    return makerA.localeCompare(makerB, 'ja');
                }

                // 2차: 품번
                if (a.displayCode !== b.displayCode) return a.displayCode.localeCompare(b.displayCode);

                // 3차: sameCodeCount (숫자)
                const seqA = a.data[a.data.length - 1] || 0;
                const seqB = b.data[b.data.length - 1] || 0;
                return seqA - seqB;
            });


            let output = "";
            let currentMaker = "";

            allItems.forEach(obj => {
                const maker = obj.data[4] || "기타";

                // 메이커가 바뀌는 지점에 주석 삽입
                if (maker !== currentMaker) {
                    if (currentMaker !== "") output += "\n"; // 메이커 간 구분 공백
                    currentMaker = maker;
                    output += `// ${currentMaker}\n`;
                }

                // DB에 저장된 data 배열(sameCodeCount 포함)을 그대로 JSON화하여 출력
                output += `"${obj.displayCode}": ${JSON.stringify(obj.data)},\n`;
            });

            // 파일 다운로드 처리
            const blob = new Blob([output], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Codes_Final_${new Date().toISOString().slice(0, 10)}.txt`;
            a.click();
            URL.revokeObjectURL(url);
        };

        // 2. 신규 이미지 메타(ImageMeta) 다운로드 버튼
        const metaDlBtn = document.createElement('button');
        metaDlBtn.innerText = "메타 저장";
        metaDlBtn.style = "padding:4px; background:#2196F3; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px; font-weight:bold;";

        metaDlBtn.onclick = async () => {
            const db = await VceDB.open();
            const allMeta = await new Promise(r => {
                db.transaction("imageMeta").objectStore("imageMeta").getAll().onsuccess = e => r(e.target.result);
            });

            if (allMeta.length === 0) return alert("이미지 메타 데이터가 없습니다.");

            const cleanMeta = allMeta.filter(m => m.status === 'completed');

            // 보기 좋게 정렬 (패턴키 기준)
            cleanMeta.sort((a, b) => (a.contentId || "").localeCompare(b.contentId || ""));

            let output = cleanMeta.map(m =>
                `${m.contentId} | URL: ${m.url}} | [${m.width}] | [${m.height}] | [${m.resText}]`
            ).join("\n");

            downloadFile(output, `Meta_${new Date().toISOString().slice(0, 10)}.txt`);
        };

        // 공통 다운로드 함수 (중복 코드 방지)
        function downloadFile(content, fileName) {
            const blob = new Blob([content], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();
            URL.revokeObjectURL(url);
        }

        const clBtn = document.createElement('button');
        clBtn.innerText = "초기화";
        clBtn.style = "padding:4px; background:#F44336; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px; font-weight:bold;";
        clBtn.onclick = async () => {
            if (confirm("모든 데이터를 삭제하시겠습니까?")) {
                const db = await VceDB.open();
                db.transaction("codes", "readwrite").objectStore("codes").clear();
                currentSessionCodes.clear();
                updateDisplayList();
            }
        };
        btnContainer.appendChild(dlBtn);
        btnContainer.appendChild(metaDlBtn);
        btnContainer.append(clBtn);


        // createUI 함수 내부 혹은 적절한 위치에 추가
        
            const resetBtn = document.createElement('button');
            resetBtn.innerText = "DB초기화";
        resetBtn.style.cssText = `flex:1; padding:4px; background-color: #ff4d4d; background:#F44336; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px; font-weight:bold;`;

            resetBtn.onclick = async () => {
                if (confirm("주의: 모든 저장된 코드와 이미지 메타데이터가 삭제됩니다. 계속하시겠습니까?")) {
                    try {
                        await VceDB.resetDatabase();
                        alert("DB가 초기화되었습니다. 페이지를 새로고침하여 재설정합니다.");
                        location.reload(); // 새로고침하면 open()이 실행되며 DB가 재생성됨
                    } catch (err) {
                        console.error(err);
                    }
                }
            };

        btnContainer.appendChild(resetBtn);    


        panel.appendChild(btnContainer);

        const autoContainer = document.createElement('div');
        autoContainer.style = "display:flex; gap:5px;";

        // 수동 수집 버튼 추가
        if (/video\.dmm\.co\.jp\/av\/list\/\?maker=\d+&media_type=/.test(PageURL())) {
            autoStatus = GM_getValue("auto_paging", { active: false });
            const btnAutoRun = document.createElement('button');
            btnAutoRun.innerText = "페이지 수집 시작";
            btnAutoRun.style = "flex:1;background:#E91E63; color:white; border:none; padding:5px 5px; font-size:10px; cursor:pointer; border-radius:3px; font-weight:bold; margin-top:5px;";
            const btnStop = document.createElement('button');
            btnStop.innerText = "정지 중";
            btnStop.style = "flex:1;background:#E91E63; color:white; border:none; padding:5px 5px; font-size:10px; cursor:pointer; border-radius:3px; font-weight:bold; margin-top:5px;";

            autoContainer.appendChild(btnAutoRun);
            autoContainer.appendChild(btnStop);

            toggleAutoRun = (s) => {
                if (autoStatus.active) {
                    if (s == 0) {
                        btnStop.innerText = `수집 완료`;
                    } else {
                        btnStop.innerText = `수집 작업 중... ${s && s > 0 ? s + 's' : ""}`;
                    }
                }
            };
            btnAutoRun.onclick = () => {
                autoStatus = GM_getValue("auto_paging", { active: false, lastPage: 1 });
                const continuePage = GetParam(autoStatus.pendingPage || PageURL(), 'page') || 1;
                const lastP = getLastPageNumber();
                if (!confirm(`${continuePage}페이지부터 ${lastP}페이지까지 자동으로 이동하며 수집합니다. 시작하시겠습니까?`)) return;

                // 상태 저장
                GM_setValue("auto_paging", { active: true, lastPage: lastP });
                autoNextPage();
                toggleAutoRun();

            };

            const lastP = getLastPageNumber();
            btnStop.onclick = () => {
                GM_setValue("auto_paging", { active: false, lastPage: lastP, pendingPage: PageURL() });
                btnStop.innerText = "수집 정지 됨";
                toggleAutoRun();
            };
            toggleAutoRun();
            if (autoStatus.active) autoNextPage();

        }


        panel.appendChild(autoContainer);

        // 페이지에서 수집
        //-------------------------------------------------------------
        /*
        const mapContainer = document.createElement('div');
        mapContainer.style = "display:flex; gap:5px;";

        const extraBtn = document.createElement('button');
        extraBtn.innerText = "메이커 맵 수집";
        extraBtn.style = "margin-top:5px; padding:5px; background:#2196F3; color:white; border:none; border-radius:4px; cursor:pointer; font-size:11px;";
        extraBtn.onclick = extraMakerMap;

        const saveBtn = document.createElement('button');
        saveBtn.innerText = "메이커 맵 저장";
        saveBtn.style = "margin-top:5px; padding:5px; background:#2196F3; color:white; border:none; border-radius:4px; cursor:pointer; font-size:11px;";
        saveBtn.onclick = saveMakerMapToFile;

        mapContainer.append(extraBtn, saveBtn);
        panel.appendChild(mapContainer);
        */
        //-------------------------------------------------------------

        document.body.appendChild(panel);

        updateDisplayList();


    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }


    function refreshQueueButton() {
        const queue = JSON.parse(GM_getValue("process_queue", "[]"));
        const group = document.getElementById('retry-group');
        const btn = document.getElementById('btnRunQueue');

        if (group && btn) {
            const hasItems = queue.length > 0;
            group.style.display = hasItems ? "flex" : "none";
            if (hasItems) btn.innerText = `대기열 실행 (${queue.length})`;
        }
    }


    // 현재 탭에서 자동 수집 버튼을 눌렀는지 확인 (탭 닫으면 초기화됨)

    let waitTime = 0;
    let remainingTime = 0;
    let countdownTimer = null;
    let toggleAutoRun = null;
    let startPage = 1;
    let maxPagesLimit = 50;
    let autoStatus = GM_getValue("auto_paging", { active: false });
    let pendingPage;


    // 마지막 페이지 번호 추출 함수
    function getLastPageNumber() {
        const pagination = document.querySelector('ul[data-e2eid="pagination"]');
        if (!pagination) return 1;
        const links = pagination.querySelectorAll('a');
        let maxPage = 1;
        links.forEach(link => {
            const p = parseInt(new URLSearchParams(link.search).get('page'));
            if (p > maxPage) maxPage = p;
        });
        return Math.min(maxPage, maxPagesLimit);
    }

    // 10초 ~ 15초 사이의 랜덤 대기 함수
    function getRandomDelay() {
        return Math.floor(Math.random() * (10000 - 5000 + 1)) + 5000;
    }
    function startCountdown(ms) {
        if (countdownTimer) clearInterval(countdownTimer);


        remainingTime = ms;

        countdownTimer = setInterval(() => {
            autoStatus = GM_getValue("auto_paging", { active: false });
            if (!autoStatus.active) {
                remainingTime = 0;
                clearInterval(countdownTimer);
                return;
            }

            remainingTime -= 1000;
            const sec = (remainingTime / 1000).toFixed(1);
            toggleAutoRun(sec);

            if (remainingTime <= 0) {
                remainingTime = 0;
                clearInterval(countdownTimer);

                const pagination = document.querySelector('ul[data-e2eid="pagination"]');
                if (!pagination) return;

                // "次へ" 이미지의 부모 <a> 태그 찾기
                const nextImg = pagination.querySelector('img[alt="次へ"]');
                const nextBtn = nextImg ? nextImg.closest('a') : null;

                let isWorkingPage = PageURL();
                const lastPage = getLastPageNumber();

                const pendingPage = autoStatus.pendingPage;

                if (nextBtn && nextBtn.href) {
                    const firstPageLink = pagination.querySelector('li:nth-child(2) a'); // 대략적인 1페이지 링크

                    const firstPage = GetParam(PageURL(), 'page') || '';

                    if (GetParam(PageURL(), 'page') > maxPagesLimit) {
                        console.log(`[Auto] ${maxPagesLimit} 초과`);
                        toggleAutoRun(remainingTime);
                        GM_setValue("auto_paging", { active: true });
                        clearInterval(countdownTimer);
                    }

                    if (pendingPage && isWorkingPage !== pendingPage) {
                        const continuePage = GetParam(pendingPage, 'page');
                        if (!continuePage || continuePage === "1") {
                            nextBtn.click();
                        } else {
                            window.location.href = UpdateParam(pendingPage, 'page', continuePage);
                        }
                    } else if (firstPage === 1) {
                        window.location.href = removeUriWithParam(PageURL(), 'page');
                    }
                    else if (isWorkingPage === lastPage) {
                        console.log("[Auto] 끝");
                        toggleAutoRun(remainingTime);
                        GM_setValue("auto_paging", { active: true });
                        clearInterval(countdownTimer);
                    } else if (startPage !== 1 && firstPageLink) {
                        firstPageLink.click();
                    } else {
                        console.log('next');
                        nextBtn.click();
                    }
                    // ⭐ 계속 루프 유지
                    autoNextPage();

                } else {
                    console.log("[Auto] 끝");
                    toggleAutoRun(remainingTime);
                    GM_setValue("auto_paging", { active: true });
                    clearInterval(countdownTimer);
                }
            }
        }, 1000);
    }

    function removeUriWithParam(baseUrl, key) {
        try {
            const Url = new URL(baseUrl);
            const urlParams = new URLSearchParams(Url.search);
            const keys = Array.isArray(key) ? key : [key];

            keys.forEach(k => urlParams.delete(k));
            Url.search = urlParams.toString() ? `?${urlParams.toString()}` : '';
            return Url.toString();
        } catch (err) {
            console.error(err);
            return baseUrl;
        }
    }


    function UpdateParam(baseUrl, key, val) {
        try {
            const Url = new URL(baseUrl);
            const urlParams = new URLSearchParams(Url.search);
            urlParams.set(key, val);
            Url.search = urlParams.toString();
            return Url.toString();
        } catch (err) {
            console.error(err);
            return baseUrl;
        }
    }

    async function autoNextPage() {
        autoStatus = GM_getValue("auto_paging", { active: false });
        if (autoStatus.active === false) return;

        console.log("[Auto] 대기...");
        waitTime = getRandomDelay();
        startCountdown(waitTime);
    }


    window.addEventListener('load', async () => {        
        initializeMakerMap();
        await sleep(2000);        
        if (autoStatus.active) {
            if (/video\.dmm\.co\.jp\/av\/list\/\?maker=\d+$/.test(PageURL())) {
                startPage = 1;
                window.location.href = UpdateParam(PageURL(), 'media_type', '2d');
            }
        }
        createUI();
        if (/video\.dmm\.co\.jp\/av\/list\/\?maker=\d+&media_type=/.test(PageURL())) {
            mutCallback();
            observer.observe(document.body, { childList: true, subtree: true });
        }
        
        refreshQueueButton();
        const tasksToRun = await VceDB.getSchedulableTasks();

        if (tasksToRun.length > 0) {
            console.log(`${tasksToRun.length}개의 재시도 작업을 큐에 추가합니다.`);
            for (const task of tasksToRun) {
                await addToQueue({ url: task.url });
            }
        }
    });
})();