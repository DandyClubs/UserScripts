// ==UserScript==
// @name         VideoCode & MetaData Extractor IndexedDB 7.0
// @namespace    http://tampermonkey.net/
// @version      7.5.2
// @description  개수 표시 + IndexedDB 고도화
// @author       DancyClubs
// @match        https://video.dmm.co.jp/*
// @match        https://www.javlibrary.com/*
// @match        https://www.dmm.co.jp/mono/dvd/*
// @require      https://raw.githubusercontent.com/DandyClubs/RootDomain/main/RootDomain.js
// @require      https://raw.githubusercontent.com/DandyClubs/CopyLinksCommonJS/main/MutilImagesDownloader.js
// @require      https://raw.githubusercontent.com/DandyClubs/CopyLinksCommonJS/main/MakerMap.js
// @require      https://cdn.jsdelivr.net/npm/sweetalert2@11.26.24/dist/sweetalert2.all.min.js
// @require      https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js
// @require      https://cdn.jsdelivr.net/npm/fflate@0.8.2/umd/index.min.js
// @require      https://cdn.jsdelivr.net/npm/streamsaver@2.0.6/StreamSaver.min.js
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_getResourceText
// @grant        GM_xmlhttpRequest
// @run-at       document-end
// @connect      dmm.co.jp
// @connect      prestige-av.com
// @connect      av-wiki.net
// @connect      *
// @noframes
// ==/UserScript==

(function () {
    'use strict';

    const FontAwesomeCSS = function () {
        let css = document.createElement('link');
        css.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css';
        css.rel = 'stylesheet';
        css.type = 'text/css';
        document.getElementsByTagName('head')[0].appendChild(css);
    };

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

    .spotlight-active {
    position: relative !important;
    z-index: 100 !important;
background: rgba(255, 255, 255, 0.01);
border-radius: 16px;
box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
backdrop-filter: blur(3px);
-webkit-backdrop-filter: blur(3px);
backdrop-filter: blur(1px);
}

/* 강조를 더 눈에 띄게 */
.pulse-border {
    outline: 3px solid #515cd8 !important;
    animation: pulse 1.2s infinite;
}


@keyframes pulse {
    0% { outline-offset: 0px; opacity: 1; }
    100% { outline-offset: 10px; opacity: 0; }
}

.swal2-popup-custom {
    transform: scale(0.9); /* 축소 (0.3은 너무 작을 수 있으니 조절해보세요) */
    font-size: 0.8rem !important; /* 글자 크기 축소 */
    filter: none !important;
}

.swal2-title {
    font-size: 1.2em !important; /* 제목 크기 별도 조절 */
}

.swal2-styled {
    padding: 5px 15px !important; /* 버튼 크기 축소 */
}
div:where(.swal2-container) {
	z-index: 99999;	
}

div:where(.swal2-container) .swal2-input {
	height: 1.75em;
	padding: .25em;
	width: 18ch;
	margin: 1em auto 0;    
}

.CoverDownload {
	cursor: pointer;
	text-shadow: 2px 4px 4px rgba(0,0,0,0.2),
                 0px -5px 10px rgba(255,255,255,0.15);
	padding: .5rem;
	margin: .5rem;
    bottom: 0;
    right: 0;
    position: absolute;
}


.map-container {
	text-align: center;
}

#vce-search-icon {
    position: fixed; top: 10px; right: 10px; z-index: 9999;
    cursor: pointer; font-size: 16px; background: #fff; border-radius: 50%; padding: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.3);
}


/* CSS 예시 (기존 스타일에 병합하세요) */
#vce-search-modal {
    display: none;
    flex-direction: column;
    position: fixed;
    z-index: 9999;
    background: #1e1e1e;
    color: #eee;
    border: 1px solid #444;
    max-width: 80%;
    min-width: 1000px;
    min-height: 800px;
    top: 50%; left: 50%; transform: translate(-50%, -50%);
    border-radius: 8px;
    /* --- 추가 --- */
    resize: both;
    overflow: hidden; /* 헤더 드래그를 위해 필요 */
}

.vce-pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 5px;
    padding: 10px;
}

.vce-pagination button {
    cursor: pointer;
    background: #333;
    border: 1px solid #555;
    color: #fff;
    padding: 2px 8px;
}

.vce-pagination button.active {
    background: #00FF41;
    color: #000;
    font-weight: bold;
}

.vce-pagination button:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}

/* 헤더 (드래그 핸들) */
.vce-modal-header {
    padding: 10px; background: rgba(30, 30, 30, 0.8); border-bottom: 1px solid #444;
    cursor: move; display: flex; justify-content: space-between; align-items: center;
    font-weight: bold; font-size: 11px; color: #2196F3; letter-spacing: 1px;
}


/* 최소화 시 하단 중앙 바 스타일 */
#vce-search-modal.vce-minimized {
    position: fixed !important;
    left: 50% !important;
    transform: translateX(-50%) !important; /* 가로 중앙 정렬 핵심 */
    border-radius: 8px 8px 0 0 !important; /* 위쪽만 둥글게 */
    box-shadow: 0 -4px 15px rgba(0,0,0,0.3);
    z-index: 10001;
    cursor: pointer;
    overflow: hidden;
}

/* 내용물 숨김 */
#vce-search-modal.vce-minimized .vce-content-wrapper {
    display: none !important;
}

/* 컨텐츠 영역 */
.vce-content-wrapper { padding: 12px; flex: 1; display: flex; flex-direction: column; gap: 10px; overflow: hidden; }

/* 검색바 및 입력창 */
.vce-control-bar {
    display: flex; flex-direction: column; gap: 8px; padding: 8px;
    background: #222; border-radius: 4px; border: 1px solid #333;
}
.vce-input-group { display: flex; gap: 5px; }
.vce-input-group input#vce-query {
    flex: 1; background: #111; color: #00FF41; border: 1px solid #444;
    padding: 6px; font-size: 12px; border-radius: 3px; outline: none; font-family: monospace;
}

/* 버튼 공통 스타일 */
.vce-btn {
    border: none; padding: 5px 10px; font-size: 10px; cursor: pointer;
    border-radius: 3px; font-weight: bold; color: white; transition: opacity 0.2s;
}
.vce-btn:hover { opacity: 0.8; }
.btn-blue { background: #2196F3; }
.btn-green { background: #4CAF50; }
.btn-grey { background: #666; }
.btn-search { background: #00FF41; color: #000; }

/* 테이블 스타일 */
.vce-table-container { flex: 1; overflow-y: auto; background: #111; border: 1px solid #333; border-radius: 4px; }
.vce-result-table { width: 100%; border-collapse: collapse; font-size: 11px; overflow: hidden; }
.vce-result-table th { position: sticky; top: 0; background: #222; color: #aaa; padding: 8px; border-bottom: 1px solid #444; text-align: center; text-wrap: nowrap;}
.vce-result-table td { padding: 5px; border-bottom: 1px solid #222; color: #eee; }
.vce-result-table tr:hover { background: #1a1a1a; }
.vce-result-table tbody tr:hover .delete-btn {    
    opacity: 1 !important;
    transition: opacity 0.2s;
}

/* 선택사항: 버튼 자체에 호버했을 때 색상을 더 진하게 하고 싶다면 */
.delete-btn:hover {
    color: #666 !important;
}

/* 페이징 */
.vce-pagination { display: flex; justify-content: center; gap: 4px; margin: 0 0 10px 0; }
.vce-pagination button { background: #333; color: #ccc; border: 1px solid #444; padding: 3px 7px; font-size: 10px; cursor: pointer; border-radius: 2px; }
.vce-pagination button.active { background: #2196F3; color: white; border-color: #2196F3; }

#vce-total-count {
	text-align: center;
	font-size: 12px;
	margin: 0;
	padding: 0;
}
.vce-table-container {
    overflow-y: auto;
    /* 스크롤이 끝에 도달했을 때 부모(body)로 전파되는 것을 방지 */
    overscroll-behavior: contain;
}
.vce-result-table th:nth-child(1) {  text-align: center; width: 40px; }
.vce-result-table th:nth-child(2) { width: 14ch; }
.vce-result-table th:nth-child(3) { width: 12ch; }    
.vce-result-table th:nth-child(4) { width: 120ch; }
.vce-result-table th:nth-child(6) { width: 40ch; }
.vce-result-table th:nth-child(7) {  min-width: 10ch; max-width: 10ch;}
.vce-result-table th:nth-child(8) {  min-width: 9ch; max-width: 9ch; }
.vce-result-table th:nth-child(9) {  width: 30px; }
    `);

    const imageUrlsMap = {
        'FANZA_DIGITAL': "https://awsimgsrc.dmm.co.jp/pics_dig/digital/video/",
        'FANZA_MONO_DVD': "https://awsimgsrc.dmm.com/dig/mono/movie/",
        'PRESTIGE': "https://www.prestige-av.com/api/media/goods/prestige/", // BGN045~072, CHN156~217, ABP398~999번, ABW001~279번        
        'DMM': "https://pics.dmm.co.jp/mono/movie/adult/",
        'DMMR': "https://pics.dmm.co.jp/mono/movie/adult/",
    };

    const selectKeyPreFixMap = {
        'dmm.co.jp': 'FANZA_DIGITAL',
        'dmm.com': 'FANZA_MONO_DVD',
        'prestige-av.com': 'PRESTIGE',
    };



    const PageURL = () => window.location !== window.parent.location ? document.referrer : document.location.href;
    const KEY_PREFIX = (url) => selectKeyPreFixMap[extractRootDomain(url)];
    // --- 모달 크기 저장 및 복원 (수정본) ---
    const STORAGE_KEY = 'vce_modal_size';

    const replaceReg = /【独占】|【準新作】|【FANZA独占】|【配信専用】|【最新作】|【新作】|【先行公開】|【セール】|【予約】|【.*パンツまつり\d+％OFF.*】|【.*ブランドストア\d+％OFF.*】/g;


    const imageSelectorMap = {
        'video.dmm.co.jp': 'main ul li div[data-e2eid="content-card"] div.relative a[href*="/av/content/?id="] picture source[srcset^="https://awsimgsrc.dmm.co.jp/pics_dig/digital/video/"]',
        'dmm.co.jp': 'ul#list li.list-wrap div.box-top p.tmb a span.img img',
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


    const Logger = {
        // 환경 변수나 설정에 따라 로그 활성화 여부 결정
        isEnabled: false,

        info(message, data = "") {
            if (!this.isEnabled) return;
            console.info(
                `%c[INFO] ${new Date().toLocaleTimeString()}: ${message}`,
                "color: #007bff; font-weight: bold",
                data
            );
        },

        error(message, error = "") {
            if (!this.isEnabled) return;
            console.error(
                `%c[ERROR] ${message}`,
                "background: red; color: white; padding: 2px 5px; border-radius: 3px;",
                error
            );
        },

        // 객체를 테이블 형태로 출력
        table(data) {
            if (!this.isEnabled) return;
            console.table(data);
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
    let FANZADIGITAL = null;
    let statusEl = null;
    let autoContainer = null;
    let mapContainer = null;


    const DB_CONFIG = { name: "VideoCodeExtractorDB" };
    const DB_VERSION_KEY = "VideoCodeExtractorDB_LAST_DB_VERSION"; // GM에 저장할 키 이름

    const DB_SCHEMA = {
        codes: {
            keyPath: "id", // uniqueKey
            indexes: [
                { name: "displayCode", keyPath: "displayCode", unique: false }
            ]
        },
        imageMeta: {
            keyPath: "url", // originalImage
            indexes: [
                { name: "displayCode", keyPath: "displayCode", unique: false },
                { name: "contentId", keyPath: "contentId", unique: false },
                { name: "uniqueKey", keyPath: "uniqueKey", unique: false },
                { name: "realCode", keyPath: "realCode", unique: false },
                { name: "resolution", keyPath: "resolution", unique: false } // 스케줄러 핵심 인덱스
            ]
        }
    };

    class VceDB {
        /**
         * DB를 열고 스키마를 검증한 후, 필요시 강제 업그레이드를 수행합니다.
         */
        static async open() {
            let targetVersion = GM_getValue(DB_VERSION_KEY, 1);

            const connect = (version) => new Promise((resolve, reject) => {
                const request = indexedDB.open(DB_CONFIG.name, version);

                request.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    const tx = e.currentTarget.transaction;
                    console.log(`[DB Upgrade] 버전 ${version}으로 업데이트 및 구조 재구성 중...`);

                    for (const [storeName, config] of Object.entries(DB_SCHEMA)) {
                        let store = db.objectStoreNames.contains(storeName)
                            ? tx.objectStore(storeName)
                            : db.createObjectStore(storeName, { keyPath: config.keyPath });

                        config.indexes.forEach(idx => {
                            if (!store.indexNames.contains(idx.name)) {
                                store.createIndex(idx.name, idx.keyPath, { unique: idx.unique });
                            }
                        });
                    }
                    console.log(`[DB Upgrade] 버전 ${db.version}으로 업데이트 및 구조 재구성 완료!`);
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

                // --- [방어 로직: SCHEMA 기반 전수 조사] ---
                let needsUpgrade = false;
                for (const [storeName, config] of Object.entries(DB_SCHEMA)) {
                    if (!db.objectStoreNames.contains(storeName)) {
                        needsUpgrade = true;
                        break;
                    }

                    // 인덱스 존재 여부 검사 (readonly 트랜잭션 활용)
                    const tx = db.transaction(storeName, "readonly");
                    const store = tx.objectStore(storeName);
                    const hasAllIndexes = config.indexes.every(idx => store.indexNames.contains(idx.name));

                    if (!hasAllIndexes) {
                        needsUpgrade = true;
                        break;
                    }
                }

                if (needsUpgrade) {
                    console.warn("DB 구조 누락 발견: 강제 업그레이드를 시작합니다.");
                    const nextVer = db.version + 1;
                    db.close();
                    return await connect(nextVer);
                }

                return db;

            } catch (err) {
                // 버전 충돌(VersionError) 발생 시 최신 버전 파악 후 재시도
                if (err.name === "VersionError") {
                    console.warn("버전 충돌 발생: 최신 버전을 확인하여 재시도합니다.");
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

        // --- 공통 CRUD 메서드 ---

        // 데이터 하나 가져오기
        static async get(storeName, key) {
            const db = await this.open();
            return new Promise(r => {
                const req = db.transaction(storeName, "readonly").objectStore(storeName).get(key);
                req.onsuccess = e => r(e.target.result);
            });
        }

        // 데이터 저장 (기존 데이터가 있으면 병합)
        static async save(storeName, key, payload) {
            const db = await this.open();
            const tx = db.transaction(storeName, "readwrite");
            const store = tx.objectStore(storeName);
            const keyPath = DB_SCHEMA[storeName].keyPath;

            const existing = await new Promise(r => store.get(key).onsuccess = e => r(e.target.result));

            const data = existing
                ? { ...existing, ...payload, updatedAt: Date.now() } // 기존 데이터와 합치기
                : { [keyPath]: key, ...payload, createdAt: Date.now(), updatedAt: Date.now() }; // 신규 생성

            return new Promise(r => store.put(data).onsuccess = () => r(data));
        }

        // 인덱스로 데이터 검색 (예: status가 'pending'인 것 찾기)
        static async getByIndex(storeName, indexName, value) {
            const db = await this.open();
            return new Promise(r => {
                try {
                    const index = db.transaction(storeName, "readonly").objectStore(storeName).index(indexName);
                    index.get(value).onsuccess = e => r(e.target.result);
                } catch (e) { r(null); }
            });
        }

        static async getAll(storeName) {
            const db = await this.open();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(storeName, "readonly");
                const store = tx.objectStore(storeName);
                const request = store.getAll();

                request.onsuccess = (e) => {
                    tx.oncomplete = () => resolve(request.result);
                };
                request.onerror = (err) => reject(err);
            });
        }

        static async deleteAll(storeName, indexName, value) {
            const db = await this.open();

            return new Promise((resolve, reject) => {
                const tx = db.transaction(storeName, "readwrite");
                const store = tx.objectStore(storeName);

                let target = store;

                if (indexName) {
                    target = store.index(indexName);
                }

                const range = IDBKeyRange.only(value);
                const cursorReq = target.openCursor(range);

                let deleteCount = 0;

                cursorReq.onsuccess = (e) => {
                    const cursor = e.target.result;
                    if (cursor) {
                        cursor.delete();
                        deleteCount++;
                        cursor.continue();
                    }
                };

                cursorReq.onerror = () => reject(cursorReq.error);
                tx.oncomplete = () => resolve(deleteCount);
                tx.onerror = () => reject(tx.error);
            });
        }


        static async getSchedulableTasks(storeName, type) {
            const db = await this.open();

            return new Promise((resolve, reject) => {
                const tx = db.transaction(storeName, "readonly");
                const store = tx.objectStore(storeName);
                const request = store.getAll();

                request.onsuccess = (e) => {
                    const result = e.target.result || [];
                    let tasksToRun = [];

                    if (type === 'meta') {
                        tasksToRun = result.filter(task => task.metaStatus !== 'SUCCESS');
                    } else if (type === 'image') {
                        tasksToRun = result.filter(task => task.resolutionmetaStatus !== 'SUCCESS');
                    } else if (type === 'both') {
                        tasksToRun = result.filter(task =>
                            task.metaStatus !== 'SUCCESS' ||
                            task.resolutionmetaStatus !== 'SUCCESS'
                        );
                    }

                    resolve(tasksToRun); // ✅ 여기서 바로 반환
                };

                request.onerror = (err) => reject(err);
            });
        }

        // 전체 삭제
        static async delete(storeName, key) {
            const db = await this.open();
            return new Promise(r => db.transaction(storeName, "readwrite").objectStore(storeName).delete(key).onsuccess = () => r());
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

    let FANZADIGITALBC = new BroadcastChannel("FANZADIGITALChannel");

    function findIdsByName(map, targetName, mode = 'id') {
        const resultIds = [];

        // Map의 [key, value] 쌍을 순회합니다.
        for (const [id, data] of map.entries()) {
            // original이나 final 중 하나라도 targetName과 같다면 id를 추가
            if (mode === 'id' && data.original === targetName || data.final === targetName) {
                return id;
            } else if (mode === 'final' && data.final === targetName) {
                return data.final || data.original;
            }
        }
        return null;
    }


    const bulkReplace = (str, map) => {
        const pattern = new RegExp(Object.keys(map).sort((a, b) => b.length - a.length).join('|'), 'g');
        return str.replace(pattern, matched => map[matched]);
    };


    const extractPatterns = [
        /(.*)(KT[a-zA-Z]*)(\d{3,5})(v*)/i,
        /(.*)(TS[a-zA-Z]*)(\d{3,5})(v*)/i,
        /(\d+)(SW[a-zA-Z]*)(\d{3,5})(v*)/i,
        /(.*)(\d{2}ID[a-zA-Z]*)(\d{3,})(.*)/i,
        /([a-z]*)(dvaj|dvajbx)(\d{3,5})(.*)/i,
        /(\d{2})(T0*\d{2}[a-zA-Z]*)(\d{3,5})(.*)/i,
        /(\d{2})(T\d{2})(\d{3,5})(.*)/i,
        /(h_[h0-9]*)(ss|sy|id)(\d{3,5})([a-z]*)/i,
        /(h_[h0-9]*)([a-z]{3,})(\d{3,5})([a-z]*)/i,
        /([0-9]*)([a-z]+)(\d{3,5})(.*)/i
    ];

    /**
* 사이트별 포맷팅 전략 정의
* p: prefix, c: displayCode, s: suffix, n: numbering(숫자), l: padLen
*/
    const SITE_STRATEGIES = {
        'DMMR': (p, c, s, n, l) => `${p}${c}${NumberFormatter.trimAndMinPad(n, 3)}${s}r`,
        'DMM': (p, c, s, n, l) => `${p}${c}${NumberFormatter.trimAndMinPad(n, 3)}${s}`,
        'FANZA_DIGITAL': (p, c, s, n, l) => `${p}${c}${NumberFormatter.pad(n, l)}${s}`,
        'FANZA_MONO': (p, c, s, n, l) => `${p}${c}${NumberFormatter.trimAndMinPad(n, 3)}${s}`,
        'AVWIKIS': (p, c, s, n, l) => `${c}-${NumberFormatter.trimAndMinPad(n, 3)}`,
        'AVWIKIL': (p, c, s, n, l) => `${c}${NumberFormatter.pad(n, l)}`,
        'JAVLIBRARY': (p, c, s, n, l) => `${c.replace(/^\d+/, '')}${NumberFormatter.trimAndMinPad(n, 3)}`,
        'JAVBUS': (p, c, s, n, l) => `${c}-${NumberFormatter.trimAndMinPad(n, 3)}`,
        // 기본값 (정의되지 않은 사이트일 경우)
        'DEFAULT': (p, c, s, n, l, parts) => {
            return [parts[0], parts[1], parts[2], parts[3], parts[5]].join('');
        }
    };

    const virtualKeyMaker = (key, id, siteName) => {

        try {
            const parts = key.split('|');
            // key 구조: displayCode|prefix|padLen|suffix|makerLabelCode|maskedContentId 
            // parts 구조 [displayCode, prefix, padLen, suffix, makerLabelCode, maskedContentId] 
            // id 구조 prefix + displaycode padLen만큼 0으로 채워진 숫자 suffix  예 55T3800001vai01
            // id에서 prefix + displaycode 앞부분 이후 숫자만 추출 뒤의 suffix 제거

            const [displayCode, prefix, padLen, suffix] = parts;
            const p = prefix;
            const c = displayCode.toLowerCase();
            const s = suffix;
            const regex = new RegExp(`^${p}${c}|${s}$`, 'i');
            const num = (str) => {
                const cleanStr = str.replace(regex, '');
                const n = parseInt(cleanStr, 10);
                return n;
            };

            const numbering = num(id);
            if (isNaN(numbering)) throw new TypeError('숫자가 아닙니다.');

            //A 사이트 ${prefix}${displayCode}${numbering.pad}$ 
            //B 사이트 displayCode pad 3자리~4자리 넘버   
            //C 사이트 prefix displayCode pad 3~4자리 넘버
            // 2. 전략 맵에서 해당 사이트 로직 실행
            const strategy = SITE_STRATEGIES[siteName.toUpperCase()] || SITE_STRATEGIES['DEFAULT'];

            return strategy(prefix, displayCode.toLowerCase(), suffix, numbering, parseInt(padLen, 10), parts);

        } catch (error) {
            console.error(error);
        }
    };

    const keyMap = {
        title: 'Title',
        realCode: '品番',
        series: 'シリーズ',
        label: 'レーベル',
        cast: '出演者',
        releaseDate: '発売日',
        makerLabel: 'メーカー',
    };
    const siteConfigs = {
        DMMR: {
            addDB: async (searchUrl) => {
                try {
                    const { key, id } = GM_getValue('WORK_TASK');
                    const result = await domMeta(searchUrl, 'DMMR');
                    if (!result) return { work: 'FAIL', reason: `result not fouund` };
                    const FANZA_DIGITAL_KEY = virtualKeyMaker(key, id, 'FANZA_DIGITAL');
                    const FANZA_MONO_KEY = virtualKeyMaker(key, id, 'FANZA_MONO');
                    const DMM_KEY = virtualKeyMaker(key, id, 'DMM');
                    const testImageUrl = [
                        `https://awsimgsrc.dmm.co.jp/pics_dig/digital/video/${FANZA_DIGITAL_KEY}/${FANZA_DIGITAL_KEY}pl.jpg`,
                        `https://awsimgsrc.dmm.com/dig/mono/movie/${FANZA_MONO_KEY}/${FANZA_MONO_KEY}pl.jpg`,
                        `https://pics.dmm.co.jp/mono/movie/adult/${DMM_KEY}/${DMM_KEY}pl.jpg`,
                    ];
                    let resData = {};
                    let imageSrc;
                    for (const src of testImageUrl) {
                        const checkMeta = await VceDB.get('imageMeta', src);
                        if (checkMeta?.resolutionState === 'SUCCESS' && checkMeta?.resolution) {
                            imageSrc = checkMeta.url;
                            break;
                        }
                        const { exists, reason, result } = await fetchImageResolution(src, 'DMMR AddDB');
                        if (exists && result.width > 90 && result.height > 90) {
                            imageSrc = src;
                            resData = {
                                resolution: { W: result.width, H: result.height },
                                resolutionState: 'SUCCESS'
                            };
                            break;
                        }
                        // 해당 URL 실패 시 다음 후보로 이동
                        console.log(`[${result}] 결과 없음: ${src}`);
                    }

                    const rawImage = imageSrc?.split('?')[0] || null;
                    if (!rawImage) return { work: 'FAIL', reason: `rawImage not fouund` };
                    if (rawImage) {
                        if (Object.keys(resData).length > 0 && resData.resolutionState === 'SUCCESS') {
                            await VceDB.save("imageMeta", rawImage, resData);
                        }
                    }

                    if (/[a-zA-Z]*-\d{3}-\d{2}/i.test(result.realCode)) {
                        await VceDB.delete('imageMeta', 'url', rawImage);
                        Logger.info('Not Add Item', result.realCode);
                        return { work: 'FAIL', reason: 'Not Add Item' };
                    }

                    if (!result.makerLabel) return `makerLabel not found`;
                    const makerLabel = makerLabelReplaceMap[result.makerLabel] || result.makerLabel;
                    const makerLabelCode = findIdsByName(makerMap, makerLabel, 'id');
                    if (!makerLabelCode) {
                        console.log(`[신규 메이커 발견] ${makerLabel}`);
                        const currentLocal = GM_getValue('NEW_MAKER_KEY', '[]');
                        if (!currentLocal.includes(makerLabel)) {
                            currentLocal.push(makerLabel);
                            GM_setValue(LOCAL_MAKER_KEY, currentLocal);
                        }
                        return { work: 'FAIL', reason: `makerLabelCode not fouund` };
                    }

                    const rawMediaType = result.rawMediaType || /【VR】/.test(result.title) ? 'VR' : '2D';

                    for (const Regex of deletePattons) {
                        if (Regex.test(result.realCode) && deleteMakerCodes.includes(makerLabelCode)) {
                            return { work: 'FAIL', reason: 'deletePattons' };
                        }
                    }

                    return await processWork(rawImage, searchUrl, {
                        makerLabelCode,
                        rawMediaType,
                    }).then(async (re) => {
                        if (re) {
                            const hasMeta = await VceDB.get('imageMeta', rawImage);
                            const hasCode = await VceDB.get('codes', hasMeta?.uniqueKey);
                            if (hasMeta?.sourceSite === 'FANZA_DIGITAL') {
                                if (hasCode?.codeStatus === 'SUCCESS') {
                                    return { work: 'SUCCESS', dbData: hasMeta, rawImage };
                                }
                            }

                            if (!hasCode && !currentSessionCodes.has(hasMeta?.uniqueKey)) {
                                Logger.info('currentSessionCodes Check', hasMeta?.uniqueKey);
                                currentSessionCodes.add(hasMeta?.uniqueKey);
                            }

                            const imageSourceKey = Object.keys(imageUrlsMap).find(key =>
                                rawImage.startsWith(imageUrlsMap[key])
                            ) || "UNKNOWN";

                            const metaData = {
                                ...result,
                                makerLabel,
                                makerLabelCode,
                                rawMediaType,
                                sourceSite: imageSourceKey,
                                metaStatus: 'SUCCESS'
                            };

                            if (hasMeta?.resolutionState !== 'SUCCESS' || !hasMeta?.resolution) {
                                if (Object.keys(resData).length > 0 && resData.resolutionState === 'SUCCESS') {
                                    await VceDB.save("imageMeta", rawImage, resData);
                                }
                            }

                            await VceDB.save("imageMeta", rawImage, metaData);

                            const codeData = {
                                makerLabel,
                                makerLabelCode,
                                rawMediaType,
                                reTryData: {
                                    imageSrc: rawImage,
                                    linkUrl: searchUrl,
                                    makerLabelCode,
                                    rawMediaType,
                                },
                                sourceSite: 'DMMR',
                                codeStatus: 'SUCCESS'
                            };

                            await VceDB.save("codes", hasCode?.uniqueKey || hasMeta?.uniqueKey, codeData);
                            return { work: 'SUCCESS', dbData: metaData, rawImage };
                        } else {
                            return { work: 'FAIL', reason: 'not Match Rules' };
                        }
                    });
                } catch (e) {
                    console.log(e);
                    Logger.error('addDB error', e);
                    return { work: 'FAIL', reason: e };
                }
            },
            ContentIdBuilder: (data) => {
                const urlsDB = [];
                const withPrefix = data.prefix.toLowerCase();
                const withSuffix = data.suffix.toLowerCase();
                const extraID = /\d+ID$/i.test(data.displayCode) ? parseInt(data.displayCode) : null;
                const extraIDX = /\d+IDX$/i.test(data.displayCode) ? parseInt(data.displayCode) : null;
                if (extraID && extraID < 24) {
                    const short = NumberFormatter.trimAndMinPad(data.number, 3);    //55id24031
                    const reMakeCode = data.displayCode.toLowerCase().replace(/(\d{2})([a-zA-Z]*)/i, '$2$1');
                    const prefix = withPrefix + reMakeCode.toLowerCase();

                    return [
                        `${prefix}${short}`,
                    ];
                } else if (extraID && extraID >= 24) {
                    const short = NumberFormatter.trimAndMinPad(data.number, 3);    //55id25031
                    const prefix = withPrefix + data.displayCode.toLowerCase();
                    return [
                        `${prefix}${short}`,
                    ];
                }
                if (extraIDX) {
                    const short = NumberFormatter.trimAndMinPad(data.number, 3);    //55idx25031
                    const prefix = withPrefix + data.displayCode.toLowerCase();
                    return [
                        `${prefix}${short}${withSuffix}`,
                    ];
                }
                const extraHitma = data.displayCode.match(/hitma/i);
                if (extraHitma) {
                    const short = NumberFormatter.trimAndMinPad(data.number, 3);    //55hitma282
                    const prefix = withPrefix + data.displayCode.toLowerCase();
                    return [
                        `${prefix}${short}`,
                    ];
                }

                const short = NumberFormatter.trimAndMinPad(data.number, 3); // 001
                const full = NumberFormatter.pad(data.number, data.padLen);   // 00001
                const prefix = data.displayCode.split('-')[0].toLowerCase();
                const addPrefix = withPrefix ? withPrefix + data.displayCode.toLowerCase() : null;

                urlsDB.push(`${prefix}${short}`);
                if (addPrefix) {
                    urlsDB.push(`${addPrefix}${short}`);
                    urlsDB.push(`${addPrefix}${full}`);
                }
                urlsDB.push(`${prefix}${full}`);
                return urlsDB;
            },
            buildUrls: async (meta) => {
                const data = await getCodeData(meta);
                if (!data) return [];

                const searchCodes = siteConfigs.DMM.ContentIdBuilder(data);
                return searchCodes.map(cid =>
                    `https://www.dmm.co.jp/rental/ppr/-/detail/=/cid=${cid}r/`

                );
            },
            titleSelector: 'div.page-detail div.area-headline div.hreview h1.item',
            InfoSelector: 'div.page-detail table tbody tr td table',
            realCodeKeys: ['品番'],
            seriesKeys: ['シリーズ'],
            labelKeys: ['レーベル'],
            castKeys: ['出演者'],
            releaseDateKeys: ['貸出開始日'],
            makerLabel: ['メーカー'],
            rawMediaType: ['コンテンツタイプ']
        },
        DMM: {
            addDB: async (searchUrl) => {
                try {
                    const { key, id } = GM_getValue('WORK_TASK');
                    const result = await domMeta(searchUrl, 'DMM');
                    if (!result) return { work: 'FAIL', reason: `result not fouund` };
                    const FANZA_DIGITAL_KEY = virtualKeyMaker(key, id, 'FANZA_DIGITAL');
                    const FANZA_MONO_KEY = virtualKeyMaker(key, id, 'FANZA_MONO');
                    const DMM_KEY = virtualKeyMaker(key, id, 'DMM');
                    const testImageUrl = [
                        `https://awsimgsrc.dmm.co.jp/pics_dig/digital/video/${FANZA_DIGITAL_KEY}/${FANZA_DIGITAL_KEY}pl.jpg`,
                        `https://awsimgsrc.dmm.com/dig/mono/movie/${FANZA_MONO_KEY}/${FANZA_MONO_KEY}pl.jpg`,
                        `https://pics.dmm.co.jp/mono/movie/adult/${DMM_KEY}/${DMM_KEY}pl.jpg`,
                    ];
                    let resData = {};
                    let imageSrc;
                    for (const src of testImageUrl) {
                        const checkMeta = await VceDB.get('imageMeta', src);
                        if (checkMeta?.resolutionState === 'SUCCESS' && checkMeta?.resolution) {
                            imageSrc = checkMeta.url;
                            break;
                        }
                        const { exists, reason, result } = await fetchImageResolution(src, 'DMM AddDB');
                        if (exists && result.width > 90 && result.height > 90) {
                            imageSrc = src;
                            resData = {
                                resolution: { W: result.width, H: result.height },
                                resolutionState: 'SUCCESS'
                            };
                            break;
                        }
                        // 해당 URL 실패 시 다음 후보로 이동
                        console.log(`[${result}] 결과 없음: ${src}`);
                    }
                    const rawImage = imageSrc?.split('?')[0] || null;
                    if (!rawImage) return { work: 'FAIL', reason: `rawImage not fouund` };
                    if (rawImage) {
                        if (Object.keys(resData).length > 0 && resData.resolutionState === 'SUCCESS') {
                            await VceDB.save("imageMeta", rawImage, resData);
                        }
                    }

                    if (/[a-zA-Z]*-\d{3}-\d{2}/i.test(result.realCode)) {
                        await VceDB.delete('imageMeta', 'url', rawImage);
                        Logger.info('Not Add Item', result.realCode);
                        return { work: 'FAIL', reason: 'Not Add Item' };
                    }

                    if (!result.makerLabel) return `makerLabel not found`;
                    const makerLabel = makerLabelReplaceMap[result.makerLabel] || result.makerLabel;
                    const makerLabelCode = findIdsByName(makerMap, makerLabel, 'id');
                    if (!makerLabelCode) {
                        console.log(`[신규 메이커 발견] ${makerLabel}`);
                        const currentLocal = GM_getValue('NEW_MAKER_KEY', '[]');
                        if (!currentLocal.includes(makerLabel)) {
                            currentLocal.push(makerLabel);
                            GM_setValue(LOCAL_MAKER_KEY, currentLocal);
                        }
                        return { work: 'FAIL', reason: `makerLabelCode not fouund` };
                    }

                    const rawMediaType = result.rawMediaType || /【VR】/.test(result.title) ? 'VR' : '2D';

                    for (const Regex of deletePattons) {
                        if (Regex.test(result.realCode) && deleteMakerCodes.includes(makerLabelCode)) {
                            return { work: 'FAIL', reason: 'deletePattons' };
                        }
                    }

                    return await processWork(rawImage, searchUrl, {
                        makerLabelCode,
                        rawMediaType,
                    }).then(async (re) => {
                        if (re) {
                            const hasMeta = await VceDB.get('imageMeta', rawImage);
                            const hasCode = await VceDB.get('codes', hasMeta?.uniqueKey);
                            if (hasMeta?.sourceSite === 'FANZA_DIGITAL') {
                                if (hasCode?.codeStatus === 'SUCCESS') {
                                    return { work: 'SUCCESS', dbData: hasMeta, rawImage };
                                }
                            }

                            if (!hasCode && !currentSessionCodes.has(hasMeta?.uniqueKey)) {
                                Logger.info('currentSessionCodes Check', hasMeta?.uniqueKey);
                                currentSessionCodes.add(hasMeta?.uniqueKey);
                            }

                            const imageSourceKey = Object.keys(imageUrlsMap).find(key =>
                                rawImage.startsWith(imageUrlsMap[key])
                            ) || "UNKNOWN";

                            const metaData = {
                                ...result,
                                makerLabel,
                                makerLabelCode,
                                rawMediaType,
                                sourceSite: imageSourceKey,
                                metaStatus: 'SUCCESS'
                            };

                            if (hasMeta?.resolutionState !== 'SUCCESS' || !hasMeta?.resolution) {
                                if (Object.keys(resData).length > 0 && resData.resolutionState === 'SUCCESS') {
                                    await VceDB.save("imageMeta", rawImage, resData);
                                }
                            }

                            await VceDB.save("imageMeta", rawImage, metaData);

                            const codeData = {
                                makerLabel,
                                makerLabelCode,
                                rawMediaType,
                                reTryData: {
                                    imageSrc: rawImage,
                                    linkUrl: searchUrl,
                                    makerLabelCode,
                                    rawMediaType,
                                },
                                sourceSite: 'DMM',
                                codeStatus: 'SUCCESS'
                            };

                            await VceDB.save("codes", hasCode?.uniqueKey || hasMeta?.uniqueKey, codeData);
                            return { work: 'SUCCESS', dbData: metaData, rawImage };
                        } else {
                            return { work: 'FAIL', reason: 'not Match Rules' };
                        }
                    });
                } catch (e) {
                    console.log(e);
                    Logger.error('addDB error', e);
                    return { work: 'FAIL', reason: e };
                }
            },
            ContentIdBuilder: (data) => {
                const urlsDB = [];
                const withPrefix = data.prefix.toLowerCase();
                const withSuffix = data.suffix.toLowerCase();
                const extraID = /\d+ID$/i.test(data.displayCode) ? parseInt(data.displayCode) : null;
                const extraIDX = /\d+IDX$/i.test(data.displayCode) ? parseInt(data.displayCode) : null;
                if (extraID && extraID < 24) {
                    const short = NumberFormatter.trimAndMinPad(data.number, 3);    //55id24031
                    const reMakeCode = data.displayCode.toLowerCase().replace(/(\d{2})([a-zA-Z]*)/i, '$2$1');
                    const prefix = withPrefix + reMakeCode.toLowerCase();

                    return [
                        `${prefix}${short}`,
                    ];
                } else if (extraID && extraID >= 24) {
                    const short = NumberFormatter.trimAndMinPad(data.number, 3);    //55id25031
                    const prefix = withPrefix + data.displayCode.toLowerCase();
                    return [
                        `${prefix}${short}`,
                    ];
                }
                if (extraIDX) {
                    const short = NumberFormatter.trimAndMinPad(data.number, 3);    //55idx25031
                    const prefix = withPrefix + data.displayCode.toLowerCase();
                    return [
                        `${prefix}${short}${withSuffix}`,
                    ];
                }
                const extraHitma = data.displayCode.match(/hitma/i);
                if (extraHitma) {
                    const short = NumberFormatter.trimAndMinPad(data.number, 3);    //55hitma282
                    const prefix = withPrefix + data.displayCode.toLowerCase();
                    return [
                        `${prefix}${short}`,
                    ];
                }

                const short = NumberFormatter.trimAndMinPad(data.number, 3); // 001
                const full = NumberFormatter.pad(data.number, data.padLen);   // 00001
                const prefix = data.displayCode.split('-')[0].toLowerCase();
                const addPrefix = withPrefix ? withPrefix + data.displayCode.toLowerCase() : null;

                urlsDB.push(`${prefix}${short}`);
                if (addPrefix) {
                    urlsDB.push(`${addPrefix}${short}`);
                    urlsDB.push(`${addPrefix}${full}`);
                }
                urlsDB.push(`${prefix}${full}`);
                return urlsDB;
            },
            buildUrls: async (meta) => {
                const data = await getCodeData(meta);
                if (!data) return [];

                const searchCodes = siteConfigs.DMM.ContentIdBuilder(data);
                return searchCodes.map(cid =>
                    `https://www.dmm.co.jp/rental/ppr/-/detail/=/cid=${cid}r/`
                );
            },
            titleSelector: 'div.page-detail div.area-headline div.hreview h1#title',
            InfoSelector: 'div.wrapper-detailContents div.wrapper-product table',
            realCodeKeys: ['品番'],
            seriesKeys: ['シリーズ'],
            labelKeys: ['レーベル'],
            castKeys: ['出演者'],
            releaseDateKeys: ['発売日'],
            makerLabel: ['メーカー'],
            rawMediaType: ['コンテンツタイプ']
        },
        FANZA_DIGITAL: {
            addDB: async () => {
                try {
                    const infoArea = document.querySelector(siteConfigs['FANZA_DIGITAL'].InfoSelector);
                    if (infoArea) {
                        const more = infoArea.querySelector('tbody tr td span div button');
                        if (more) {
                            more.click();
                        }
                    }
                    const el = document.querySelector('div[data-e2eid="sample-image-gallery"] a');
                    const url = location.href;
                    const contentId = GetParam(url, 'id').toLocaleLowerCase();
                    if (!contentId || !el) return { work: 'FAIL', reason: 'not contentId' };
                    const regex = /00(?=\d{3}(?!\d))/;
                    const cid = contentId.replace(regex, '');
                    const testImageUrl = [
                        `https://awsimgsrc.dmm.co.jp/pics_dig/digital/video/${contentId}/${contentId}pl.jpg`,
                        `https://awsimgsrc.dmm.com/dig/mono/movie/${cid}/${cid}pl.jpg`,
                        `https://pics.dmm.co.jp/mono/movie/adult/${cid}/${cid}pl.jpg`,
                    ];
                    let resData = {};
                    let imageSrc;
                    for (const src of testImageUrl) {
                        const checkMeta = await VceDB.get('imageMeta', src);

                        if (checkMeta?.resolutionState === 'SUCCESS' && checkMeta?.resolution) {
                            imageSrc = checkMeta.url;
                            break;
                        }
                        const { exists, reason, result } = await fetchImageResolution(src, 'FANZA_DIGITAL AddDB');
                        if (exists && result.width > 90 && result.height > 90) {
                            imageSrc = src;
                            resData = {
                                resolution: { W: result.width, H: result.height },
                                resolutionState: 'SUCCESS'
                            };
                            break;
                        }
                        // 해당 URL 실패 시 다음 후보로 이동
                        console.log(`[${result}] 결과 없음: ${src}`);
                    }

                    const rawImage = imageSrc?.split('?')[0] || null;
                    if (!rawImage) return { work: 'FAIL', reason: `rawImage not fouund` };
                    const parse = createPostProcessor(siteConfigs['FANZA_DIGITAL'], 'FANZA_DIGITAL');
                    const result = await parse(document.body);
                    if (!result || !result.realCode) return { work: 'FAIL', reason: `result not fouund` };

                    if (/[a-zA-Z]*-\d{3}-\d{2}/i.test(result.realCode)) {
                        await VceDB.delete('imageMeta', 'url', rawImage);
                        Logger.info('Not Add Item', result.realCode);
                        return 'Not Add Item';
                    }

                    if (!result.makerLabel) return { work: 'FAIL', reason: `makerLabel not found` };
                    const makerLabel = makerLabelReplaceMap[result.makerLabel] || result.makerLabel;
                    let makerLabelCode = findIdsByName(makerMap, makerLabel, 'id');
                    if (!makerLabelCode) {
                        const infoArea = document.querySelector(siteConfigs['FANZA_DIGITAL'].InfoSelector);
                        if (infoArea) {
                            const makerUrl = infoArea.querySelector('a[href*="/av/list/?maker="]')?.href;
                            makerLabelCode = GetParam(makerUrl, 'maker');
                        }
                    }
                    if (!makerLabelCode) {
                        console.log(`[신규 메이커 발견] ${makerLabel}`);
                        const currentLocal = GM_getValue('NEW_MAKER_KEY', '[]');
                        if (!currentLocal.includes(makerLabel)) {
                            currentLocal.push(makerLabel);
                            GM_setValue(LOCAL_MAKER_KEY, currentLocal);
                        }
                        return { work: 'FAIL', reason: `makerLabelCode not fouund` };
                    }

                    const rawMediaType = result.rawMediaType || /【VR】/.test(result.title) ? 'VR' : '2D';

                    for (const Regex of deletePattons) {
                        if (Regex.test(result.realCode) && deleteMakerCodes.includes(makerLabelCode)) {
                            return 'deletePattons';
                        }
                    }

                    return await processWork(rawImage, url, {
                        makerLabelCode,
                        rawMediaType,
                    }).then(async (re) => {
                        if (re) {
                            const hasMeta = await VceDB.get('imageMeta', rawImage);
                            const hasCode = await VceDB.get('codes', hasMeta?.uniqueKey);
                            if (hasMeta?.sourceSite === 'FANZA_DIGITAL') {
                                if (hasCode?.codeStatus === 'SUCCESS') {
                                    return { work: 'SUCCESS', dbData: hasMeta, rawImage };
                                }
                            }

                            if (!hasCode && !currentSessionCodes.has(hasMeta?.uniqueKey)) {
                                Logger.info('currentSessionCodes Check', hasMeta?.uniqueKey);
                                currentSessionCodes.add(hasMeta?.uniqueKey);
                            }
                            const imageSourceKey = Object.keys(imageUrlsMap).find(key =>
                                rawImage.startsWith(imageUrlsMap[key])
                            ) || "UNKNOWN";

                            const metaData = {
                                ...result,
                                makerLabel,
                                makerLabelCode,
                                rawMediaType,
                                sourceSite: imageSourceKey,
                                metaStatus: 'SUCCESS'
                            };

                            if (hasMeta?.resolutionState !== 'SUCCESS' || !hasMeta?.resolution) {
                                if (Object.keys(resData).length > 0 && resData.resolutionState === 'SUCCESS') {
                                    await VceDB.save("imageMeta", rawImage, resData);
                                }
                            }

                            await VceDB.save("imageMeta", rawImage, metaData);

                            const codeData = {
                                makerLabel,
                                makerLabelCode,
                                rawMediaType,
                                reTryData: {
                                    imageSrc: rawImage,
                                    linkUrl: url,
                                    makerLabelCode,
                                    rawMediaType,
                                },
                                sourceSite: 'FANZA_DIGITAL',
                                codeStatus: 'SUCCESS'
                            };

                            await VceDB.save("codes", hasCode?.uniqueKey || hasMeta?.uniqueKey, codeData);
                            return { work: 'SUCCESS', dbData: metaData, rawImage };
                        } else {
                            return { work: 'FAIL', reason: 'not Match Rules' };
                        }
                    });
                } catch (e) {
                    console.log(e);
                    Logger.error('addDB error', e);
                    return { work: 'FAIL', reason: e };;
                }


            },
            rawImageDownloader: () => {
                const imageEl = document.querySelector('div.grid div.flex a picture source');
                if (imageEl) {
                    document.addEventListener('click', (e) => {
                        e.preventDefault();
                        const CoverDownload = e.target.closest('.CoverDownload');
                        if (CoverDownload) {
                            const parse = createPostProcessor(siteConfigs['FANZA_DIGITAL'], 'FANZA_DIGITAL');
                            const result = parse(document.body);
                            if (!result || !result.realCode) return;
                            result.title = result.title;
                            const fileName = `${result.realCode} ${result.title}`;
                            const limitedfileName = byteLengthOf(fileName, 240);
                            let finalFileName = FilenameConvert(limitedfileName);
                            const url = imageEl.closest('a')?.href;
                            if (url) {
                                const cleanUrl = url.split('?')[0];
                                const output = Object.entries(result).map(([key, value]) => `${keyMap[key]}: ${value}`).join('\n').replace(/^,/gm, '');
                                const blob = new Blob([output], { type: "text/plain:charset=utf-8" });
                                const dataurl = URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = dataurl;
                                link.download = `${finalFileName}.txt`;
                                link.click();
                                URL.revokeObjectURL(dataurl);
                                forceDownload(cleanUrl, finalFileName + '.jpg');
                            }
                        }
                    });
                }
            },
            titleSelector: 'h1.font-bold.inline.text-base',
            InfoSelector: 'table.table-fixed',
            realCodeKeys: ['メーカー品番'],
            seriesKeys: ['シリーズ'],
            labelKeys: ['レーベル'],
            castKeys: ['出演者'],
            releaseDateKeys: ['商品発売日'],
            makerLabel: ['メーカー'],
            rawMediaType: ['コンテンツタイプ']
        },
        AVWiki: {
            addDB: async (searchUrl) => {
                try {
                    const { key, id } = GM_getValue('WORK_TASK');
                    const result = await domMeta(searchUrl, 'AVWiki');
                    if (!result) return { work: 'FAIL', reason: `result not fouund` };
                    const FANZA_DIGITAL_KEY = virtualKeyMaker(key, id, 'FANZA_DIGITAL');
                    const FANZA_MONO_KEY = virtualKeyMaker(key, id, 'FANZA_MONO');
                    const DMM_KEY = virtualKeyMaker(key, id, 'DMM');
                    const testImageUrl = [
                        `https://awsimgsrc.dmm.co.jp/pics_dig/digital/video/${FANZA_DIGITAL_KEY}/${FANZA_DIGITAL_KEY}pl.jpg`,
                        `https://awsimgsrc.dmm.com/dig/mono/movie/${FANZA_MONO_KEY}/${FANZA_MONO_KEY}pl.jpg`,
                        `https://pics.dmm.co.jp/mono/movie/adult/${DMM_KEY}/${DMM_KEY}pl.jpg`,
                    ];
                    let resData = {};
                    let imageSrc;
                    for (const src of testImageUrl) {
                        const checkMeta = await VceDB.get('imageMeta', src);

                        if (checkMeta?.resolutionState === 'SUCCESS' && checkMeta?.resolution) {
                            imageSrc = checkMeta.url;
                            break;
                        }
                        // 이미 실패 기록이 있는 URL은 스킵
                        const { exists, reason, result } = await fetchImageResolution(src, 'AVWiki AddDB');
                        if (exists && result.width > 90 && result.height > 90) {
                            imageSrc = src;
                            resData = {
                                resolution: { W: result.width, H: result.height },
                                resolutionState: 'SUCCESS'
                            };
                            break;
                        }
                        // 해당 URL 실패 시 다음 후보로 이동
                        console.log(`[${result}] 결과 없음: ${src}`);
                    }
                    const rawImage = imageSrc?.split('?')[0] || null;
                    if (!rawImage) return { work: 'FAIL', reason: `rawImage not fouund` };
                    if (/[a-zA-Z]*-\d{3}-\d{2}/i.test(result.realCode)) {
                        await VceDB.delete('imageMeta', 'url', rawImage);
                        Logger.info('Not Add Item', result.realCode);
                        return { work: 'FAIL', reason: 'Not Add Item' };
                    }

                    if (!result.makerLabel) return `makerLabel not found`;
                    const makerLabel = makerLabelReplaceMap[result.makerLabel] || result.makerLabel;
                    const makerLabelCode = findIdsByName(makerMap, makerLabel, 'id');
                    if (!makerLabelCode) {
                        console.log(`[신규 메이커 발견] ${makerLabel}`);
                        const currentLocal = GM_getValue('NEW_MAKER_KEY', '[]');
                        if (!currentLocal.includes(makerLabel)) {
                            currentLocal.push(makerLabel);
                            GM_setValue(LOCAL_MAKER_KEY, currentLocal);
                        }
                        return { work: 'FAIL', reason: `makerLabelCode not fouund` };
                    }

                    const rawMediaType = result.rawMediaType || /【VR】/.test(result.title) ? 'VR' : '2D';

                    for (const Regex of deletePattons) {
                        if (Regex.test(result.realCode) && deleteMakerCodes.includes(makerLabelCode)) {
                            return { work: 'FAIL', reason: 'deletePattons' };
                        }
                    }

                    return await processWork(rawImage, searchUrl, {
                        makerLabelCode,
                        rawMediaType,
                    }).then(async (re) => {
                        if (re) {
                            const hasMeta = await VceDB.get('imageMeta', rawImage);
                            const hasCode = await VceDB.get('codes', hasMeta?.uniqueKey);
                            if (hasMeta?.sourceSite === 'FANZA_DIGITAL') {
                                if (hasCode?.codeStatus === 'SUCCESS') {
                                    return { work: 'SUCCESS', dbData: hasMeta, rawImage };
                                }
                            }

                            if (!hasCode && !currentSessionCodes.has(hasMeta?.uniqueKey)) {
                                Logger.info('currentSessionCodes Check', hasMeta?.uniqueKey);
                                currentSessionCodes.add(hasMeta?.uniqueKey);
                            }

                            const imageSourceKey = Object.keys(imageUrlsMap).find(key =>
                                rawImage.startsWith(imageUrlsMap[key])
                            ) || "UNKNOWN";

                            const metaData = {
                                ...result,
                                makerLabel,
                                makerLabelCode,
                                rawMediaType,
                                sourceSite: imageSourceKey,
                                metaStatus: 'SUCCESS'
                            };

                            if (hasMeta?.resolutionState !== 'SUCCESS' || !hasMeta?.resolution) {
                                if (Object.keys(resData).length > 0 && resData.resolutionState === 'SUCCESS') {
                                    await VceDB.save("imageMeta", rawImage, resData);
                                }
                            }

                            await VceDB.save("imageMeta", rawImage, metaData);

                            const codeData = {
                                makerLabel,
                                makerLabelCode,
                                rawMediaType,
                                reTryData: {
                                    imageSrc: rawImage,
                                    linkUrl: searchUrl,
                                    makerLabelCode,
                                    rawMediaType,
                                },
                                sourceSite: 'AVWiki',
                                codeStatus: 'SUCCESS'
                            };

                            await VceDB.save("codes", hasCode?.uniqueKey || hasMeta?.uniqueKey, codeData);
                            return { work: 'SUCCESS', dbData: metaData, rawImage };
                        } else {
                            return { work: 'FAIL', reason: 'not Match Rules' };
                        }
                    });
                } catch (e) {
                    console.log(e);
                    Logger.error('addDB error', e);
                    return { work: 'FAIL', reason: e };
                }
            },
            ContentIdBuilder: (data) => {
                const extraID = data.displayCode.match(/(\d+)ID/i);
                if (extraID) return [];
                const num = NumberFormatter.trimAndMinPad(data.number, 3);
                return [
                    `${data.displayCode.toLowerCase()}-${num}`,
                ];
            },
            buildUrls: async (meta) => {
                const data = await getCodeData(meta);
                if (!data) return [];

                const searchCodes = siteConfigs.AVWiki.ContentIdBuilder(data);
                return searchCodes.map(cid =>
                    `https://av-wiki.net/${cid}/`
                );
            },
            titleSelector: 'section.article-body div.blockquote-like p',
            InfoSelector: 'section.article-body dl.dltable',
            realCodeKeys: ['メーカー品番'],
            seriesKeys: ['シリーズ'],
            labelKeys: ['レーベル'],
            castKeys: ['AV女優名'],
            releaseDateKeys: ['配信開始日'],
            makerLabel: ['メーカー'],
            rawMediaType: ['コンテンツタイプ']
        },
        Javlibrary: {
            addDB: async (searchUrl, options = {}) => {
                try {
                    const {
                        data = result,
                    } = options;
                    const { key, id } = GM_getValue('WORK_TASK');
                    const FANZA_DIGITAL_KEY = virtualKeyMaker(key, id, 'FANZA_DIGITAL');
                    const FANZA_MONO_KEY = virtualKeyMaker(key, id, 'FANZA_MONO');
                    const DMM_KEY = virtualKeyMaker(key, id, 'DMM');
                    const testImageUrl = [
                        `https://awsimgsrc.dmm.co.jp/pics_dig/digital/video/${FANZA_DIGITAL_KEY}/${FANZA_DIGITAL_KEY}pl.jpg`,
                        `https://awsimgsrc.dmm.com/dig/mono/movie/${FANZA_MONO_KEY}/${FANZA_MONO_KEY}pl.jpg`,
                        `https://pics.dmm.co.jp/mono/movie/adult/${DMM_KEY}/${DMM_KEY}pl.jpg`,
                    ];
                    let resData = {};
                    let imageSrc;
                    for (const src of testImageUrl) {
                        const checkMeta = await VceDB.get('imageMeta', src);
                        if (checkMeta?.resolutionState === 'SUCCESS' && checkMeta?.resolution) {
                            imageSrc = checkMeta.url;
                            break;
                        }
                        const { exists, reason, result } = await fetchImageResolution(src, 'Javlibrary AddDB');
                        if (exists && result.width > 90 && result.height > 90) {
                            imageSrc = src;
                            resData = {
                                resolution: { W: result.width, H: result.height },
                                resolutionState: 'SUCCESS'
                            };
                            break;
                        }
                        // 해당 URL 실패 시 다음 후보로 이동
                        console.log(`[${result}] 결과 없음: ${src}`);
                    }
                    const rawImage = imageSrc?.split('?')[0] || null;
                    if (!rawImage) return { work: 'FAIL', reason: `rawImage not fouund` };
                    if (/[a-zA-Z]*-\d{3}-\d{2}/i.test(data.realCode)) {
                        await VceDB.delete('imageMeta', 'url', rawImage);
                        Logger.info('Not Add Item', data.realCode);
                        return { work: 'FAIL', reason: 'Not Add Item' };
                    }

                    if (!data.makerLabel) return `makerLabel not found`;
                    const makerLabel = makerLabelReplaceMap[data.makerLabel] || data.makerLabel;
                    const makerLabelCode = findIdsByName(makerMap, makerLabel, 'id');
                    if (!makerLabelCode) {
                        console.log(`[신규 메이커 발견] ${makerLabel}`);
                        const currentLocal = GM_getValue('NEW_MAKER_KEY', '[]');
                        if (!currentLocal.includes(makerLabel)) {
                            currentLocal.push(makerLabel);
                            GM_setValue(LOCAL_MAKER_KEY, currentLocal);
                        }
                        return { work: 'FAIL', reason: `makerLabelCode not fouund` };
                    }

                    const rawMediaType = data.rawMediaType || /【VR】/.test(data.title) ? 'VR' : '2D';

                    for (const Regex of deletePattons) {
                        if (Regex.test(data.realCode) && deleteMakerCodes.includes(makerLabelCode)) {
                            return { work: 'FAIL', reason: 'deletePattons' };
                        }
                    }

                    return await processWork(rawImage, searchUrl, {
                        makerLabelCode,
                        rawMediaType,
                    }).then(async (re) => {
                        if (re) {
                            const hasMeta = await VceDB.get('imageMeta', rawImage);
                            const hasCode = await VceDB.get('codes', hasMeta?.uniqueKey);
                            if (hasMeta?.sourceSite === 'FANZA_DIGITAL') {
                                if (hasCode?.codeStatus === 'SUCCESS') {
                                    return { work: 'SUCCESS', dbData: hasMeta, rawImage };
                                }
                            }

                            if (!hasCode && !currentSessionCodes.has(hasMeta?.uniqueKey)) {
                                Logger.info('currentSessionCodes Check', hasMeta?.uniqueKey);
                                currentSessionCodes.add(hasMeta?.uniqueKey);
                            }

                            const imageSourceKey = Object.keys(imageUrlsMap).find(key =>
                                rawImage.startsWith(imageUrlsMap[key])
                            ) || "UNKNOWN";

                            const metaData = {
                                ...data,
                                makerLabel,
                                makerLabelCode,
                                rawMediaType,
                                sourceSite: imageSourceKey,
                                metaStatus: 'SUCCESS'
                            };

                            if (hasMeta?.resolutionState !== 'SUCCESS' || !hasMeta?.resolution) {
                                if (Object.keys(resData).length > 0 && resData.resolutionState === 'SUCCESS') {
                                    await VceDB.save("imageMeta", rawImage, resData);
                                }
                            }

                            await VceDB.save("imageMeta", rawImage, metaData);
                            const codeData = {
                                makerLabel,
                                makerLabelCode,
                                rawMediaType,
                                reTryData: {
                                    imageSrc: rawImage,
                                    linkUrl: searchUrl,
                                    makerLabelCode,
                                    rawMediaType,
                                },
                                sourceSite: 'Javlibrary',
                                codeStatus: 'SUCCESS'
                            };

                            await VceDB.save("codes", hasCode?.uniqueKey || hasMeta?.uniqueKey, codeData);
                            return { work: 'SUCCESS', dbData: metaData, rawImage };
                        } else {
                            return { work: 'FAIL', reason: 'not Match Rules' };
                        }
                    });
                } catch (e) {
                    console.log(e);
                    Logger.error('addDB error', e);
                    return { work: 'FAIL', reason: e };
                }
            },
            titleSelector: 'div#video_title h3.post-title a',
            InfoSelector: 'div#video_info',
            realCodeKeys: ['品番'],
            seriesKeys: ['シリーズ'],
            labelKeys: ['レーベル'],
            castKeys: ['出演者'],
            releaseDateKeys: ['発売日'],
            makerLabel: ['メーカー'],
            rawMediaType: ['コンテンツタイプ']
        },
        JavBus: {
            addDB: async (searchUrl) => {
                try {
                    const { key, id } = GM_getValue('WORK_TASK');
                    const result = await domMeta(searchUrl, 'JavBus');
                    if (!result) return { work: 'FAIL', reason: `result not fouund` };
                    const FANZA_DIGITAL_KEY = virtualKeyMaker(key, id, 'FANZA_DIGITAL');
                    const FANZA_MONO_KEY = virtualKeyMaker(key, id, 'FANZA_MONO');
                    const DMM_KEY = virtualKeyMaker(key, id, 'DMM');
                    const testImageUrl = [
                        `https://awsimgsrc.dmm.co.jp/pics_dig/digital/video/${FANZA_DIGITAL_KEY}/${FANZA_DIGITAL_KEY}pl.jpg`,
                        `https://awsimgsrc.dmm.com/dig/mono/movie/${FANZA_MONO_KEY}/${FANZA_MONO_KEY}pl.jpg`,
                        `https://pics.dmm.co.jp/mono/movie/adult/${DMM_KEY}/${DMM_KEY}pl.jpg`,
                    ];
                    let resData = {};
                    let imageSrc;
                    for (const src of testImageUrl) {
                        const checkMeta = await VceDB.get('imageMeta', src);

                        if (checkMeta?.resolutionState === 'SUCCESS' && checkMeta?.resolution) {
                            imageSrc = checkMeta.url;
                            break;
                        }
                        const { exists, reason, result } = await fetchImageResolution(src, 'javBus AddDB');
                        if (exists && result.width > 90 && result.height > 90) {
                            imageSrc = src;
                            resData = {
                                resolution: { W: result.width, H: result.height },
                                resolutionState: 'SUCCESS'
                            };
                            break;
                        }
                        // 해당 URL 실패 시 다음 후보로 이동
                        console.log(`[${result}] 결과 없음: ${src}`);
                    }
                    const rawImage = imageSrc?.split('?')[0] || null;
                    if (!rawImage) return { work: 'FAIL', reason: `rawImage not fouund` };
                    if (/[a-zA-Z]*-\d{3}-\d{2}/i.test(result.realCode)) {
                        await VceDB.delete('imageMeta', 'url', rawImage);
                        Logger.info('Not Add Item', result.realCode);
                        return { work: 'FAIL', reason: 'Not Add Item' };
                    }

                    if (!result.makerLabel) return `makerLabel not found`;
                    const makerLabel = makerLabelReplaceMap[result.makerLabel] || result.makerLabel;
                    const makerLabelCode = findIdsByName(makerMap, makerLabel, 'id');
                    if (!makerLabelCode) {
                        console.log(`[신규 메이커 발견] ${makerLabel}`);
                        const currentLocal = GM_getValue('NEW_MAKER_KEY', '[]');
                        if (!currentLocal.includes(makerLabel)) {
                            currentLocal.push(makerLabel);
                            GM_setValue(LOCAL_MAKER_KEY, currentLocal);
                        }
                        return { work: 'FAIL', reason: `makerLabelCode not fouund` };
                    }

                    const rawMediaType = result.rawMediaType || /【VR】/.test(result.title) ? 'VR' : '2D';

                    for (const Regex of deletePattons) {
                        if (Regex.test(result.realCode) && deleteMakerCodes.includes(makerLabelCode)) {
                            return { work: 'FAIL', reason: 'deletePattons' };
                        }
                    }

                    return await processWork(rawImage, searchUrl, {
                        makerLabelCode,
                        rawMediaType,
                    }).then(async (re) => {
                        if (re) {
                            const hasMeta = await VceDB.get('imageMeta', rawImage);
                            const hasCode = await VceDB.get('codes', hasMeta?.uniqueKey);
                            if (hasMeta?.sourceSite === 'FANZA_DIGITAL') {
                                if (hasCode?.codeStatus === 'SUCCESS') {
                                    return { work: 'SUCCESS', dbData: hasMeta, rawImage };
                                }
                            }

                            if (!hasCode && !currentSessionCodes.has(hasMeta?.uniqueKey)) {
                                Logger.info('currentSessionCodes Check', hasMeta?.uniqueKey);
                                currentSessionCodes.add(hasMeta?.uniqueKey);
                            }

                            const imageSourceKey = Object.keys(imageUrlsMap).find(key =>
                                rawImage.startsWith(imageUrlsMap[key])
                            ) || "UNKNOWN";

                            const metaData = {
                                ...result,
                                makerLabel,
                                makerLabelCode,
                                rawMediaType,
                                sourceSite: imageSourceKey,
                                metaStatus: 'SUCCESS'
                            };

                            if (hasMeta?.resolutionState !== 'SUCCESS' || !hasMeta?.resolution) {
                                if (Object.keys(resData).length > 0 && resData.resolutionState === 'SUCCESS') {
                                    await VceDB.save("imageMeta", rawImage, resData);
                                }
                            }

                            await VceDB.save("imageMeta", rawImage, metaData);

                            const codeData = {
                                makerLabel,
                                makerLabelCode,
                                rawMediaType,
                                reTryData: {
                                    imageSrc: rawImage,
                                    linkUrl: searchUrl,
                                    makerLabelCode,
                                    rawMediaType,
                                },
                                sourceSite: 'JavBus',
                                codeStatus: 'SUCCESS'
                            };

                            await VceDB.save("codes", hasCode?.uniqueKey || hasMeta?.uniqueKey, codeData);
                            return { work: 'SUCCESS', dbData: metaData, rawImage };
                        } else {
                            return { work: 'FAIL', reason: 'not Match Rules' };
                        }
                    });
                } catch (e) {
                    console.log(e);
                    Logger.error('addDB error', e);
                    return { work: 'FAIL', reason: e };
                }
            },
            titleSelector: 'div.container h3',
            InfoSelector: 'div.container div.movie div.info',
            realCodeKeys: ['品番'],
            seriesKeys: ['シリーズ'],
            labelKeys: ['レーベル'],
            castKeys: ['出演者'],
            releaseDateKeys: ['発売日'],
            makerLabel: ['メーカー'],
            rawMediaType: ['コンテンツタイプ']
        },
    };


    const deletePattons = [
        /[a-zA-Z]*-\d{3}-\d{2}/i,
        /[a-zA-Z]*-\d{3}-[a-zA-Z]-\d{2}/i,
    ];
    const deleteMakerCodes = ['45276'];


    const NumberFormatter = {
        // 그대로 (DMM 스타일)
        pad(num, length) {
            return num.toString().padStart(length, '0');
        },

        // 앞 0 제거
        noPad(num) {
            return String(Number(num));
        },

        // 최소 자리 보장 (ex: 3자리)
        minPad(num, minLen) {
            return num.toString().padStart(minLen, '0');
        },

        // 하이브리드 (앞 0 제거 후 최소 자리)
        trimAndMinPad(num, minLen) {
            return String(Number(num)).padStart(minLen, '0');
        }
    };

    const CodeNormalizer = {
        toDisplay(inputCode) {
            let matchCode;
            if (!inputCode) return '';
            if (/-/.test(inputCode)) {
                const parts = inputCode.split('-');
                const [code, numbering, suffix] = parts;
                const rawNumber = parseInt(numbering);
                if (isNaN(rawNumber)) return code.toUpperCase();
                const number = NumberFormatter.trimAndMinPad(rawNumber, 3);
                const extraSuffix = numbering.replace(/^\d+/i, '') || '';
                const rawSuffix = suffix?.replace(/r$/i, '').toLowerCase() || '';
                return `${code.toUpperCase()}-${number}${extraSuffix}${rawSuffix}`;
            }
            for (const regex of extractPatterns) { matchCode = inputCode.match(regex); if (matchCode) break; }
            if (!matchCode) return code.toUpperCase();
            if (matchCode) {
                const [_, prefix, code, numbering, suffix] = matchCode;
                const rawNumber = parseInt(numbering);
                if (isNaN(rawNumber)) return code.toUpperCase();
                const number = NumberFormatter.trimAndMinPad(rawNumber, 3);
                const extraSuffix = numbering.replace(/^\d+/i, '') || '';
                const rawSuffix = suffix?.replace(/r$/i, '').toLowerCase() || '';
                return `${code.toUpperCase()}-${number}${extraSuffix}${rawSuffix}`;
            }



        }
    };

    function extractNumber(str, codeData) {

        // displayCode 이전 제거
        let cleanStr = str.replace(
            new RegExp(`^.*?${codeData.displayCode}`, 'i'),
            ''
        );

        // suffix 제거
        if (codeData.suffix) {
            cleanStr = cleanStr.replace(
                new RegExp(`${codeData.suffix}$`, 'i'),
                ''
            );
        }

        return cleanStr;
    }

    async function getCodeData(meta) {
        const codeData = await VceDB.get('codes', meta.uniqueKey);
        if (!codeData) return null;

        const number = extractNumber(meta.contentId, codeData);

        return {
            prefix: codeData.prefix || '',
            displayCode: codeData.displayCode,
            number,
            padLen: codeData.padLen,
            suffix: codeData.suffix || ''
        };
    }

    const ParserUtils = {
        buildTableMap(root, siteName) {
            const map = {};

            // -------------------------
            // 1. table 구조 (tr)
            // -------------------------
            if (siteName === 'FANZA_DIGITAL' || siteName === 'DMMR' || siteName === 'DMM' || siteName === 'Javlibrary') {
                root.querySelectorAll('tr').forEach(tr => {
                    const cells = tr.querySelectorAll('th, td');
                    if (cells.length >= 2) {
                        const key = cells[0].innerText.replace(/[：:]$/, '').trim();
                        const valueEl = cells[1];
                        map[key] = valueEl;
                    }
                });
            }
            // -------------------------
            // 2. dl 구조 (dt/dd)
            // -------------------------
            else if (siteName === 'AVWiki') {
                root.querySelectorAll('dt').forEach(dt => {
                    const dd = dt.nextElementSibling;

                    if (dd && dd.tagName.toLowerCase() === 'dd') {
                        const key = dt.innerText.trim();
                        map[key] = dd;
                    }
                });
            }
            else if (siteName === 'JavBus') {
                root.querySelectorAll('p').forEach(p => {
                    const headerSpan = p.querySelector('span.header');

                    if (headerSpan) {
                        // 1. <span> 태그 기반의 헤더가 존재하는 경우 (출연자, 품번, 발매일 등)
                        const key = headerSpan.innerText.replace(/[：:]$/, '').trim();
                        if (key === '出演者') {
                            // p 태그 내의 모든 'a' 태그들의 텍스트를 모으거나, 
                            // p 태그 전체에서 header를 제외한 텍스트를 가져옵니다.
                            // 여기서는 질문하신 의도대로 '다음 텍스트나 a의 텍스트'를 위해 p 자체를 보냅니다.
                            map[key] = p.nextElementSibling;
                        } else {
                            // 데이터 추출을 위해 복제 후 헤더만 삭제
                            const valueClone = p.cloneNode(true);
                            const headerInClone = valueClone.querySelector('span.header');
                            if (headerInClone) headerInClone.remove();

                            // 텍스트 노드나 <a> 태그 등이 섞여 있어도 cleanText가 알아서 처리함
                            map[key] = valueClone;
                        }

                    } else {
                        // 2. <span> 헤더가 없는 일반적인 p 태그 처리 (기존 로직 유지)
                        const cells = p.querySelectorAll('span, a');
                        if (cells.length >= 2) {
                            const key = cells[0].innerText.replace(/[：:]$/, '').trim();
                            map[key] = cells[1];
                        } else if (/[：:]$/.test(p.innerText)) {
                            // 태그가 아예 없고 "키: 값" 형태의 텍스트만 있는 경우 대응
                            const parts = p.innerText.split(/[：:]$/);
                            const key = parts[0].trim();
                            // 임시 span을 만들어 value로 저장 (cleanText와의 호환성을 위해)
                            const tempSpan = document.createElement('span');
                            tempSpan.innerText = parts.slice(1).join(' ').trim();
                            map[key] = tempSpan;
                        }
                    }
                });
            }
            return map;
        },

        cleanText(el) {
            if (!el) return '';

            const clone = el.cloneNode(true);

            // 제거하고 싶은 요소를 선택해서 삭제합니다.
            // '▼すべて表示하는' 링크나 버튼 등을 식별할 수 있는 선택자를 넣으세요.
            const junkSelectors = [
                '#a_performer',
                'script',
                'style',
                'ul:has(.idol-box)',
            ];

            junkSelectors.forEach(selector => {
                clone.querySelectorAll(selector).forEach(node => node.remove());
            });


            let arrayText = [];

            // 1. 컨테이너 내부의 모든 자식 노드를 확인
            clone.childNodes.forEach(node => {
                let text = "";

                // 요소 노드(<a>, <span> 등)인 경우
                if (node.nodeType === Node.ELEMENT_NODE) {
                    // 제외할 버튼(id="a_performer")이나 스크립트 태그는 건너뜀
                    if (node.tagName === 'SCRIPT') return;
                    // performer_extends 내부의 텍스트도 포함해서 가져옴
                    text = node.textContent.trim();
                }
                // 순수 텍스트 노드인 경우
                else if (node.nodeType === Node.TEXT_NODE) {
                    text = node.textContent.trim();
                }

                // 빈 문자열이 아니면 배열에 추가
                if (text) {
                    // 간혹 여러 이름이 한꺼번에 들어있는 경우 공백으로 분리
                    const splitText = text.split(/\s+/);
                    arrayText.push(...splitText);
                }
            });

            // 2. 중복 제거 및 결과 합치기
            const finalResult = [...new Set(arrayText)].join(' ');

            return finalResult
                .replace(/\s+/g, ' ')      // 과도한 공백 및 줄바꿈 정리
                .replace(/----/g, '')      // 기존 로직의 구분선 제거
                .trim();
            /*
        return clone.innerHTML
            .replace(/<[^>]*>/gi, '')
            .replace(/▼すべて表示する.+/, '')
            .replace(/\s+/g, ' ')
            .replace(/----/g, '')
            .trim();
            */
        },

        get(map, keys) {
            for (const key of keys) {
                if (map[key]) {
                    return this.cleanText(map[key]);
                }
            }
            return '';
        },

        normalize(meta) {
            const result = { ...meta };

            Object.keys(result).forEach(key => {
                let val = result[key];

                if (!val || val === '----') {
                    result[key] = '';
                    return;
                }

                if (key === 'cast') {
                    result[key] = val;
                }
            });

            if (result.title) {
                result.title = bulkReplace(result.title, replaceTextMap)
                    .replace(replaceReg, '')
                    .replace(`(${result.realCode.toLowerCase()})`, '')
                    .replace(`【${result.realCode}】`, '')
                    .replace(new RegExp(`^${result.realCode}`), '').trim();
            }
            if (result.releaseDate) {
                result.releaseDate = result.releaseDate.replace(/[\/\-_]/g, '.');
            }
            if (result.realCode) {
                result.realCode = CodeNormalizer.toDisplay(result.realCode);
            }
            if (result.label && /DOCPREMIUM/i.test(result.label)) {
                result.label = result.label.replace(/DOCPREMIUM/i, 'DOC PREMIUM').trim();
            }
            // series 없으면 label fallback
            if (!result.series && result.label) {
                result.series = result.label;
            }

            return result;
        }
    };


    const createPostProcessor = (config, siteName) => {
        return (doc) => {
            const table = doc.querySelector(config.InfoSelector);
            if (!table) return null;

            const map = ParserUtils.buildTableMap(table, siteName);

            const metaData = {
                title: doc.querySelector(config.titleSelector)?.textContent.trim() || '',
                realCode: ParserUtils.get(map, config.realCodeKeys),
                series: ParserUtils.get(map, config.seriesKeys),
                label: ParserUtils.get(map, config.labelKeys),
                cast: ParserUtils.get(map, config.castKeys),
                releaseDate: ParserUtils.get(map, config.releaseDateKeys),
                makerLabel: ParserUtils.get(map, config.makerLabel) || '',
            };

            return ParserUtils.normalize(metaData);
        };
    };

    async function domMeta(url, siteName) {
        const urlObj = new URL(url);

        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET",
                url,
                headers: { 'referer': url, 'origin': urlObj.origin },
                onload: (res) => {


                    if (res.status === 404) {
                        setClearBad(url);
                        console.log(`[${siteName}] → ${url} → ${res.status}`);
                        return resolve(null);
                    }

                    const doc = new DOMParser()
                        .parseFromString(res.responseText, "text/html");


                    const removeSelectors = [
                        `span.entry-subtitle`
                    ];

                    // 3. 해당 요소들을 DOM에서 완전히 삭제
                    removeSelectors.forEach(selector => {
                        doc.querySelectorAll(selector).forEach(node => node.remove());
                    });

                    const config = siteConfigs[siteName];
                    const parse = createPostProcessor(config, siteName);

                    const result = parse(doc);


                    if (!result || !result.realCode) {
                        return resolve(null);
                    }

                    resolve(result);
                },
                onerror: () => resolve(null),
                ontimeout: () => resolve(null)
            });
        });
    }

    async function runFallbackParser(existingMeta) {
        const siteOrder = ['DMM', 'AVWiki'];
        const allTasks = [];

        // 1. 모든 사이트로부터 시도할 URL 후보군을 먼저 수집
        for (const siteName of siteOrder) {
            const config = siteConfigs[siteName];
            if (!config) continue;

            const urls = await config.buildUrls(existingMeta);
            if (urls && urls.length > 0) {
                urls.forEach(url => {
                    allTasks.push({ url, siteName });
                });
            }
        }

        // 후보군이 하나도 없으면 바로 종료
        if (allTasks.length === 0) {
            console.warn(`[Meta] 모든 사이트에서 생성된 URL이 없습니다. `, existingMeta.url);
            return null;
        }

        console.log(`[Meta] 총 ${allTasks.length}개의 후보 URL 분석 시작...`);

        // 2. 통합된 리스트를 순회하며 하나라도 성공하면 즉시 종료
        for (const { url, siteName } of allTasks) {
            // 이미 실패 기록이 있는 URL은 스킵
            if (localStorage.getItem(`404_${url}`)) {
                console.log(`[Skip] 이미 404 확인됨: ${url}`);
                continue;
            } else if (localStorage.getItem(`Success_${url}`) === existingMeta.contentId) {
                console.log(`[Skip] 이미 Success 확인됨: ${url}`);
            }

            console.log(`[${siteName}] 시도 중: ${url}`);

            const result = await domMeta(url, siteName);

            if (result && result.realCode) {
                // ⭐ 성공 시점: 결과를 찾으면 즉시 리턴하여 '전체 루프'를 탈출합니다.
                localStorage.setItem(`Success_${url}`, existingMeta.contentId);
                console.log(`[${siteName}] 성공 및 종료: ${url}`);

                return {
                    ...result,
                    sourceSite: siteName,
                };
            }

            // 해당 URL 실패 시 다음 후보로 이동
            console.log(`[${siteName}] 결과 없음: ${url}`);
        }

        // 모든 후보를 다 돌았는데도 성공이 없으면 null 반환
        console.log(`[Meta] 모든 후보 URL 시도 실패`, existingMeta.url);
        return null;
    }

    function fetchImageResolution(url, where) {

        console.log('fetchImageResolution', url, where);
        const cleanUrl = url.split('?')[0];
        const finalUrl = cleanUrl.toLowerCase();


        // 1. URL 확장자를 통해 필요한 바이트 크기 미리 계산
        const getExpectedRange = (finalUrl) => {
            if (finalUrl.endsWith('.png') || finalUrl.endsWith('.gif')) {
                return "0-1000"; // PNG/GIF는 1KB면 충분함
            } else if (finalUrl.endsWith('.jpg') || finalUrl.endsWith('.jpeg')) {
                return "0-20000"; // JPEG나 알 수 없는 경우 20KB
            } else if (finalUrl.endsWith('.webp')) {
                return "0-5000"; // WebP는 약 5KB 정도
            }
        };

        const targetRange = getExpectedRange(finalUrl);

        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: finalUrl,
                headers: {
                    "Range": `bytes=${targetRange}`,
                    "Referer": finalUrl,
                    "Origin": new URL(finalUrl).origin
                },
                responseType: "arraybuffer",
                onload: (res) => {
                    const status = res.status;
                    let result = { width: 0, height: 0, status: res.status, errorReason: "", type: "Unknown" };

                    // 1. HTTP 오류 체크
                    if (status === 0) {
                        const sameDomain = location.hostname === new URL(finalUrl).hostname;
                        if (sameDomain) {
                            console.warn(`[VideoCode] status=0 (같은 도메인) → 네트워크 문제, 재시도 가능: ${finalUrl}`);
                            resolve({ exists: false, retry: true, reason: 'network_error' });
                        } else {
                            console.warn(`[VideoCode] status=0 (외부 도메인) → CORS 가능성, 재시도 허용: ${finalUrl}`);
                            resolve({ exists: false, retry: true, reason: 'cors_possible' });
                        }
                    }
                    else if (status >= 200 && status < 300) {
                        console.log(`[VideoCode] 이미지 존재 확인됨 (HTTP ${status}): ${finalUrl}`);
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
                        resolve({ exists: true, result });
                    }
                    else if (status >= 300 && status < 400) {
                        console.warn(`[VideoCode] 리다이렉트 응답 (HTTP ${status}): ${finalUrl}`);
                        // GM_xmlhttpRequest는 리다이렉트를 따라가므로 이 경우는 거의 없음
                        resolve({ exists: false, reason: 'redirect' });
                    }
                    else if (status === 403) {
                        console.warn(`[VideoCode] 국가제한 (HTTP ${status}): ${finalUrl}`);
                        resolve({ exists: false, reason: 'Region restrictions' });
                    }
                    else if (status >= 400 && status < 500) {
                        console.warn(`[VideoCode] 클라이언트 오류 (HTTP ${status}) → 이미지 없음: ${finalUrl}`);
                        resolve({ exists: false, reason: 'client_error' });
                    }
                    else if (status >= 500) {
                        console.warn(`[VideoCode] 서버 오류 (HTTP ${status}) → 재시도 가능: ${finalUrl}`);
                        resolve({ exists: false, reason: 'server_error' });
                    }
                },
                onerror: () => resolve({ width: 0, height: 0, status: 0, errorReason: "네트워크 오류" }),
                ontimeout: () => resolve({ width: 0, height: 0, status: 0, errorReason: "시간 초과" })
            });
        });
    }


    let isResProcessing = false;
    let isMetaStop = false;
    let isMetaProcessing = false;
    let isResStop = false;
    const requestMetaMap = new Map();
    const requestResMap = new Map();


    async function addToQueue(task) {
        const existingMeta = await VceDB.get('imageMeta', task.url);

        if (!requestMetaMap.has(task.url) && existingMeta.metaStatus !== 'SUCCESS') {
            requestMetaMap.set(task.url, task);
            if (!isMetaProcessing) {
                doMeta();
                isMetaStop = false;
            }
            if (isMetaProcessing) {
                isMetaStop = true;
            }
        }

        if (!requestResMap.has(task.url) && existingMeta.resolutionState !== 'SUCCESS') {
            requestResMap.set(task.url, task);
            if (!isResProcessing) {
                doRes();
                isResStop = false;
            }
            if (isResProcessing) {
                isResStop = true;
            }
        }
    }

    async function doMeta() {
        isMetaProcessing = true;

        while (requestMetaMap.size > 0 && isMetaStop === false) {

            const firstKey = requestMetaMap.keys().next().value;
            const task = requestMetaMap.get(firstKey);
            requestMetaMap.delete(firstKey);

            updateProcessingStatus(requestMetaMap.size, requestResMap.size);

            const existingMeta = await VceDB.get('imageMeta', task.url);
            if (!existingMeta) {
                console.warn(`[Skip] DB 정보가 없음: ${task.url}`);
                continue;
            }

            const meta = await runFallbackParser(existingMeta);


            let metaData = {};
            if (meta) {
                if (meta.makerLabel) {
                    meta.makerLabel = makerLabelReplaceMap[meta.makerLabel] || meta.makerLabel;
                }
                metaData = {
                    ...meta,
                    metaStatus: 'SUCCESS'
                };
                await VceDB.save("imageMeta", task.url, metaData);
            }

        }

        if (requestMetaMap.size > 0) {
            doMeta();
        } else {
            isMetaProcessing = false;
            updateProcessingStatus(requestMetaMap.size, requestResMap.size);
        }
    }
    async function doRes() {
        isResProcessing = true;

        while (requestResMap.size > 0 && isResStop === false) {
            const firstKey = requestResMap.keys().next().value;
            const task = requestResMap.get(firstKey);
            requestResMap.delete(firstKey);

            updateProcessingStatus(requestMetaMap.size, requestResMap.size);

            const { exists, reason, result } = await fetchImageResolution(src, 'doRes');
            let resData = {};
            if (exists && result.width > 90 && result.height > 90) {
                resData = {
                    resolution: { W: res.width, H: res.height },
                    resolutionState: 'SUCCESS'
                };
                await VceDB.save("imageMeta", rawImage, resData);
            }

        }

        if (requestResMap.size > 0) {
            doRes();
        } else {
            isResProcessing = false;
            updateProcessingStatus(requestMetaMap.size, requestResMap.size);
        }
    }

    function updateProcessingStatus(metaCount = 0, resCount = 0) {

        if (!statusEl) {
            statusEl = document.getElementById('vce-status-indicator');
            if (!statusEl) return;
        }
        if (metaCount > 0 || resCount > 0) {
            statusEl.innerHTML = `
                <span style = "display:inline-flex; align-items:center; gap:6px;">
                    <svg width="24" height="14" viewBox="0 0 56 32" fill="none">
                        <rect x="1" y="1" width="54" height="30" rx="4" stroke="currentColor" stroke-width="2"/>
                        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
                            font-size="14" font-weight="bold" fill="currentColor">4K</text>
                    </svg>
   정보 확인 중...(M:${metaCount} I:${resCount})</span>
`;
        } else {
            statusEl.innerHTML = `
                <span style = "display:inline-flex; align-items:center; gap:6px; cursor:pointer">
                    <svg width="24" height="14" viewBox="0 0 56 32" fill="none">
                        <rect x="1" y="1" width="54" height="30" rx="4" stroke="currentColor" stroke-width="2" />
                        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
                            font-size="14" font-weight="bold" fill="currentColor">4K</text>
                    </svg>
   해상도 메타 정보 확인</span>
   `;

            statusEl.onclick = async () => {
                const tasksToRun = await VceDB.getSchedulableTasks('imageMeta', 'both');
                if (tasksToRun.length > 0) {
                    console.log(`${tasksToRun.length}개의 재시도 작업을 큐에 추가합니다.`);
                    for (const task of tasksToRun) {
                        await addToQueue({ url: task.url });
                    }
                }
            };
        }
    }


    function updateProcessingFANZADIGITAL(metaCount = 0, contentId = '') {
        if (!FANZADIGITAL) {
            FANZADIGITAL = document.getElementById('FANZADIGITAL-status-indicator');
            if (!FANZADIGITAL) return;
        }
        if (metaCount > 0) {
            FANZADIGITAL.innerHTML = `
                <span style = "display:inline-flex; align-items:center; gap:6px;white-space: nowrap;">
                    <svg width="24" height="14" viewBox="0 0 56 32" fill="none">
                        <rect x="1" y="1" width="54" height="30" rx="4" stroke="currentColor" stroke-width="2"/>
                        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
                            font-size="14" font-weight="bold" fill="currentColor">4K</text>
                    </svg>
   정보 확인 중...${metaCount} ${contentId}</span>
`;
        } else {
            FANZADIGITAL.innerHTML = `
                <span style = "display:inline-flex; align-items:center; gap:6px; cursor:pointer">
                    <svg width="24" height="14" viewBox="0 0 56 32" fill="none">
                        <rect x="1" y="1" width="54" height="30" rx="4" stroke="currentColor" stroke-width="2" />
                        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
                            font-size="14" font-weight="bold" fill="currentColor">4K</text>
                    </svg>
   FANZA_DIGITAL 메타 정보 확인</span>
   `;

            FANZADIGITAL.onclick = async () => {
                if (isRunning) {
                    startJob();
                } else {
                    const result = await Swal.fire({
                        customClass: { popup: 'swal2-popup-custom' },
                        confirmButtonColor: '#2196F3',
                        cancelButtonColor: '#666',
                        background: '#fff',
                        color: '#1e1e1e',
                        title: '찾을 코드를 입력하세요',
                        input: 'text',
                        inputLabel: '영문 + 숫자만 입력 가능합니다',
                        inputPlaceholder: '예: ABC, T38',
                        showCancelButton: true,
                        confirmButtonText: '확인',
                        cancelButtonText: '취소',

                        didOpen: () => {
                            const input = Swal.getInput();

                            input.addEventListener('input', () => {
                                // 영문 + 숫자만 허용
                                input.value = input.value.replace(/[^a-zA-Z0-9]/g, '');
                            });
                        },
                        inputValidator: (value) => {
                            if (!value) return null;
                            if (!/^[a-zA-Z0-9]+$/.test(value)) {
                                return '영문과 숫자만 입력 가능합니다';
                            }
                        }
                    });

                    if (result.isConfirmed) {
                        const value = result.value
                            .replace(/[^a-zA-Z0-9]/g, '')
                            .trim()
                            .toUpperCase();
                        startJob(value);
                    }
                }
            };
        }
    }


    const queue = [];
    let isProcessing = false;

    function enqueue(task) {
        queue.push(task);
        runQueue();
    }

    async function runQueue() {
        if (isProcessing) return;
        isProcessing = true;

        while (queue.length > 0) {
            const task = queue.shift();
            await task();
        }

        isProcessing = false;
    }

    const mutCallbackItems = new Set();

    const mutCallback = async () => {
        Logger.info('Page', PageURL());
        if (/^https:\/\/video\.dmm\.co\.jp\/av\/list\/\?maker=\d+/.test(PageURL())) {
            imageSelector = getImageSelector();
            if (!imageSelector) return;
            const targets = document.querySelectorAll(`${imageSelector}:not(.${PROCESSED_CLASS})`);
            Logger.info('targets', targets);

            if (targets.length === 0) return;
            for (const el of targets) {
                el.classList.add(PROCESSED_CLASS);
            }
            for (const el of targets) {
                const makerLabelCode = GetParam(PageURL(), 'maker');
                const rawMediaType = GetParam(PageURL(), 'media_type');
                enqueue(() => processWork(el.getAttribute('srcset'), el.closest('a').href, { makerLabelCode, rawMediaType }));
            }
        }
        else if (/^https:\/\/www\.dmm\.co\.jp\/mono\/dvd\/-\/list\/=\/article=maker\/id=\d+/.test(PageURL())) {
            imageSelector = getImageSelector();
            if (!imageSelector) return;
            const targets = document.querySelectorAll(`${imageSelector}:not(.${PROCESSED_CLASS})`);
            Logger.info('targets', targets);
            if (targets.length === 0) return;
            const matchmaker = PageURL().match(/maker\/id=(\d+)\//i);
            if (!matchmaker) return;
            const makerLabelCode = matchmaker[1];
            for (const el of targets) {
                el.classList.add(PROCESSED_CLASS);
            }

            for (const el of targets) {
                const link = el.closest('a').href;
                const matchCid = link.match(/\/cid=(.+)\//);
                if (!matchCid) continue;
                const cid = matchCid[1];
                if (mutCallbackItems.has(cid)) continue;
                mutCallbackItems.add(cid);

                const getLimitText = el.getAttribute('alt');
                if (getLimitText && /【FANZA限定】|【数量限定】|【ベストヒッツ】/.test(getLimitText)) continue;
                if (/^(ka|kc|d\d)|^(ka|kc|tk|dk|9|k9|77|88|7|pb|4k|8)[a-z]|(bod|dod|ec|br|tk)$|118(gw|.*tk)/i.test(cid)) continue;

                const parts = cid.match(/([a-z0-9]*)(\d{3})(.*)/);

                const [_, prefix, number, suffix] = parts;

                const contentId = `${prefix}${number.padStart(5, '0')}${suffix}`;

                const testImageUrl = [
                    `https://awsimgsrc.dmm.co.jp/pics_dig/digital/video/${contentId}/${contentId}pl.jpg`,
                    `https://awsimgsrc.dmm.com/dig/mono/movie/${cid}/${cid}pl.jpg`,

                ];
                let imageSrc;
                let resolution, resolutionState;
                for (const src of testImageUrl) {
                    const hasMeta = await VceDB.get('imageMeta', src);
                    if (hasMeta) break;
                    const { exists, reason, result } = await fetchImageResolution(src, 'mutCallback');
                    if (exists && result.width > 0 && result.height > 0) {
                        imageSrc = src;
                        resolution = { W: result.width, H: result.height },
                            resolutionState = 'SUCCESS';
                        break;
                    }
                    imageSrc = el.src;
                }
                if (imageSrc) {
                    const rawImage = imageSrc?.split('?')[0] || null;
                    if (!rawImage) return { work: 'FAIL', reason: `rawImage not fouund` };
                    enqueue(() => processWork(rawImage, link, { makerLabelCode, resolution, resolutionState }));
                }
            }
        }
    };

    function GetParam(url, paramName) {
        if (!url) return '';
        const urlObj = new URL(url);
        const params = new URLSearchParams(urlObj.search);
        const result = params.get(paramName);
        return result?.toUpperCase() || '';
    }

    async function updateCounts() {
        if (!countStatus || !listContainer) return;
        const selectedCount = listContainer.querySelectorAll('.item-check:checked').length;
        const currentListCount = listContainer.querySelectorAll('.item-check').length;

        const db = await VceDB.open();
        const allCodes = await new Promise(r => {
            db.transaction("codes").objectStore("codes").getAll().onsuccess = e => r(e.target.result);
        });
        const totalCount = allCodes.length; // 로컬스토리지 대신 DB 갯수로 대체

        countStatus.innerHTML = `
            <span style="color:#00FF41">선택: ${selectedCount}</span> |
            <span>목록: ${currentListCount}</span> |
            <span style="color:#2196F3">전체: ${totalCount}</span>
        `;

        if (alertStatus) {
            const rawMediaType = GetParam(PageURL(), 'media_type');
            const makerLabelCode = GetParam(PageURL(), 'maker');
            if (!rawMediaType && !makerLabelCode) {
                alertStatus.innerHTML = `<div style="color:#F44336; margin-bottom:5px; font-weight:bold;">❌ 추출할 <a id="makergroup" href="https://video.dmm.co.jp/av/maker/">메이커 페이지</a>로 이동하여 선택하세요!</div>`;
                document.querySelector('a#makergroup').addEventListener('click', (e) => {
                    e.stopPropagation(); // 🔥 body 이벤트 차단
                });
            } else if (!rawMediaType) {
                alertStatus.innerHTML = `<div style="color:#FF9800; margin-bottom:5px; font-weight:bold;">⚠️ ${makerLabelCode ? `<a id="choicetype" href="https://video.dmm.co.jp/av/list/?maker=${makerLabelCode}&media_type=2d">2D</a>를 선택하세요!</a>` : `제조사 리스트 페이지로 이동하세요!`}<br>❌ 페이지 주소가 맞지 않아 수집 중단.</div>`;
                document.querySelector('a#choicetype').addEventListener('click', (e) => {
                    e.stopPropagation(); // 🔥 body 이벤트 차단
                });
            } else if (!makerLabelCode || makerLabel === "Unknown") {
                alertStatus.innerHTML = `<div style="color:#F44336; margin-bottom:5px; font-weight:bold;">❌ 제작사 정보를 가져오지 못했습니다.</div>`;
            } else {
                alertStatus.innerHTML = "";
            }
        }
    }

    let coverDownloadIcon = null;

    async function checkIcon(waitTime, where, guard = 0) {
        const config = siteConfigs['FANZA_DIGITAL'];
        if (!config) return false;
        if (guard > waitTime) {
            console.log(`[Auto] guard ${guard} 종료`);
            return 'guard Time Out';
        };
        const element = document.querySelectorAll('iframe[title], button[data-e2eid="sample-movie-button"], div picture source.rounded-lg');
        if (element.length > 0) {
            if (coverDownloadIcon) coverDownloadIcon.remove();
            coverDownloadIcon = document.createElement('div');
            coverDownloadIcon.classList.add('CoverDownload', 'fa-regular', 'fa-image');
            coverDownloadIcon.style = `color: dodgerblue !important; bottom: 0; right: 0;`;
            element[0].parentElement.appendChild(coverDownloadIcon);
            config.rawImageDownloader();
            const found = await checkTable(waitTime);
            if (found) {
                config.addDB().then((e) => { console.log(e, where); });

            }
            return true;
        } else {
            await sleep(1000);
            return await checkIcon(waitTime, where, guard + 1000);
        }

    }

    const resetSessionCodes = () => {
        const newUrl = PageURL();

        if (currentSessionCodes.size > 0) {
            currentSessionCodes.clear();
            updateDisplayList(false, 'resetSessionCodes');
        }
        if (/^https:\/\/video\.dmm\.co\.jp\/av\/list\/\?maker=\d+/.test(newUrl)) {
            mutCallback(); // 즉시 한 번 실행
            updateCounts();
        } else if (/https:\/\/www\.dmm\.co\.jp\/rental\/ppr\/-\/detail\/=\/cid=/.test(newUrl)) {
            mutCallback(); // 즉시 한 번 실행
            updateCounts();
        }
        if (/video\.dmm\.co\.jp\/av\/content\/\?id/.test(newUrl)) {
            const waitTime = Math.max(getRandomDelay(), getRandomDelay());
            checkIcon(waitTime, 'resetSessionCodes', 0);
        }
        if (/video\.dmm\.co\.jp\/av\/maker\//.test(newUrl) || /dmm\.co\.jp\/mono\/dvd\/-\/maker\//.test(newUrl)) {
            mapContainer.style.display = 'flex';
            extraMakerMap();
        } else {
            mapContainer.style.display = 'none';
        }

        if (/^https:\/\/video\.dmm\.co\.jp\/av\/list\/\?maker=\d+/.test(newUrl)) {
            autoContainer.style.display = 'flex';
        } else {
            autoContainer.style.display = 'none';
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

    async function processWork(imageSrc, linkUrl, options = {}) {

        const {
            makerLabelCode = '',
            rawMediaType = '',
            resolution,
            resolutionState,
            reTry = false,
        } = options;



        try {
            Logger.info('Input', { imageSrc, linkUrl, makerLabelCode, rawMediaType });
            let makerLabel = '';
            if (makerLabelCode && makerMap.has(makerLabelCode)) {
                const entry = makerMap.get(makerLabelCode);
                makerLabel = entry.final || entry.original;
            }

            if (!/(pl|ps)\.jpg/i.test(imageSrc)) {
                imageSrc = `https://pics.dmm.co.jp/mono/movie/adult/${contentId}/${contentId}pl.jpg`;
            } else {
                imageSrc = imageSrc.replace(/ps\.jpg/i, 'pl.jpg');
            }

            const rawImage = imageSrc?.split('?')[0] || null;
            if (!rawImage) return { work: 'FAIL', reason: `rawImage not fouund` };

            const pathSegments = rawImage.split('/');
            const contentId = pathSegments[pathSegments.length - 2];


            const majorsLabelPatterns = [
                /.*[a-z]{3,7}\d{3,7}/i,
                /.*(KT|TS|SW|BF)[a-zA-Z]*\d{3,5}[v]*/i,
                /.*[a-z]{3,7}\d{3,5}[v]*/i,
                /.*\d{2}ID[a-zA-Z]*\d{3,7}[v]*/i,
                /h_[h0-9]*[a-z]{2,}\d{3,}[a-z]*/i,
                /\d{2}t\d{2}\d{3,5}/i
            ];

            const isMajorMatched = majorsLabelPatterns.some(regex => regex.test(contentId));
            if (!isMajorMatched) {
                console.error('majorsLabel fail', contentId);
                return false;
            }

            const skipPatterns = [
                /h_\d+[a-z]{2}\d+[a-z]\d+/i,
                /\d+adi\d+/i,
                /yrnk([a-z]*)/i,
                /td048.*dv\d+([a-z0-9]*)/i,
                /(h_[0-9]*)([vpjg])(\d{3,})([a-z]*)/i,
                /\d+jdxa\d+/i,
                /([0-9]*)([a-z]+)(\d+)([a-z]\d{2})/i,
            ];

            for (const skipRegex of skipPatterns) {
                if (skipRegex.test(contentId)) {
                    Logger.error('skipPatterns Test', { contentId, skipRegex });
                    return false;
                }
            }

            // --- [섹션 2: 코드 DB 중복 체크] ---
            const hasMeta = await VceDB.get('imageMeta', rawImage);
            if (hasMeta) {
                const hasCode = hasMeta?.uniqueKey ? await VceDB.get('codes', hasMeta?.uniqueKey) : null;
                if (hasCode && hasCode?.displayCode) {
                    const p = hasCode.prefix;
                    const c = hasCode.displayCode.toLowerCase();
                    const s = hasCode.suffix;
                    const num = (str) => {
                        const cleanStr = str.replace(regex, '');
                        const n = parseInt(cleanStr, 10);
                        return isNaN(n) ? 1 : n;
                    };

                    const regex = new RegExp(`^${p}${c}|${s}$`, 'i');
                    const numbering = num(hasMeta.contentId);
                    if (numbering > 5000) {
                        Logger.info('잘못된 넘버링', hasMeta.contentId);
                        return false;
                    }
                    updateMinMax(hasCode, numbering);

                    Logger.info('hasMeta Check', { hasMeta, hasCode });
                    return true;
                }
            }

            let match = null;
            for (const regex of extractPatterns) { match = contentId.match(regex); if (match) break; }

            Logger.info('match', match);
            if (match && makerLabelCode) {
                const prefix = match[1];
                const code = match[2].replace(/(T)0?(\d{2})/, '$1$2').toUpperCase();
                const padLen = match[3].length;
                const numbering = match[3];
                const suffix = match[4];

                if (
                    suffix !== '' &&
                    !suffix.endsWith('ai') &&
                    !/[rvz]$/i.test(suffix) &&
                    !/re\d+$/i.test(suffix) &&
                    !/\d{2}/i.test(code)
                ) {
                    Logger.info('skip suffix', suffix);
                    return false; // skip
                }

                const displayCode = code;
                const uniqueKey = `${displayCode}|${prefix}|${padLen}|${suffix}|${makerLabelCode}|${contentId.replace(/\d/g, '0')}`;
                Logger.info('match', { prefix, code, padLen, suffix, displayCode, uniqueKey, numbering });

                const num = (str) => {
                    const n = parseInt(str, 10);
                    return isNaN(n) ? 1 : n;
                };

                if (num(numbering) > 5000) {
                    Logger.info('잘못된 넘버링', numbering);
                    return false;
                }
                // --- [섹션 1: 이미지 메타 처리] ---

                await VceDB.save("imageMeta", rawImage, {
                    displayCode, // Index
                    uniqueKey, // Index
                    makerLabelCode,
                    makerLabel,
                    rawMediaType,
                    rawImage,
                    contentId, // Index
                    //스케줄 작업으로 처리하는 값들
                    /*
                title: '',
                realCode: '', // Index
                series: '', // 시리즈가 없거나 ---- 면 라벨
                label: '',
                cast: '',
                releaseDate: '',
                resolution: '', // 스케줄 작업으로 처리{W: 0, H: 0},
                */
                    /** 메타 데이타
                const parser = new DOMParser();
                const doc = parser.parseFromString(res.responseText, "text/html");
                */
                });
                let resData = {};
                if (resolution && resolutionState) {
                    resData = {
                        resolution,
                        resolutionState
                    };
                } else {
                    const checkMeta = await VceDB.get('imageMeta', src);
                    if (checkMeta?.resolutionState !== 'SUCCESS') {
                        const { exists, reason, result } = await fetchImageResolution(rawImage, 'processWork');

                        if (exists && result.width > 90 && result.height > 90) {
                            resData = {
                                resolution: { W: result.width, H: result.height },
                                resolutionState: 'SUCCESS'
                            };
                        }
                    }
                }
                if (resData) {
                    await VceDB.save("imageMeta", rawImage, resData);
                }

                const hasUniqueKey = await VceDB.get('codes', uniqueKey);

                if (hasUniqueKey) {
                    updateMinMax(hasUniqueKey, numbering);
                    return true;
                }

                if (!hasUniqueKey && !currentSessionCodes.has(uniqueKey)) {
                    Logger.info('currentSessionCodes Check', uniqueKey);
                    currentSessionCodes.add(uniqueKey);
                }

                const imageSourceKey = Object.keys(imageUrlsMap).find(key =>
                    rawImage.startsWith(imageUrlsMap[key])
                ) || "UNKNOWN";
                Logger.info('imageSourceKey Check', imageSourceKey);

                if (!hasUniqueKey?.displayCode) {
                    const data = {
                        displayCode,
                        imageSourceKey,
                        reTryData: {
                            imageSrc: rawImage,
                            linkUrl,
                            makerLabelCode,
                            rawMediaType,
                            contentId
                        },
                        contentId,
                        prefix,
                        padLen,
                        suffix,
                        makerLabelCode,
                        makerLabel,
                        rawMediaType,
                    };
                    await VceDB.save("codes", uniqueKey, data);
                    const addedKey = await VceDB.get("codes", uniqueKey);
                    updateDisplayList(false, 'processWork');
                    updateMinMax(addedKey, numbering);
                    updateCounts();
                }
                return true;
            }
            return false;
        } catch (e) {
            Logger.error('processWork Error', e);
            return false;
        }
    }

    async function updateDisplayList(shouldScroll = false, where) {
        //console.log(where);
        if (!listContainer) return;
        const currentScroll = listContainer.scrollTop;
        listContainer.innerHTML = "";

        const db = await VceDB.open();
        let items = await new Promise(r => {
            db.transaction("codes").objectStore("codes").getAll().onsuccess = e => r(e.target.result);
        });

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
            const detailLabel = `${itemData.prefix && itemData.suffix ? itemData.prefix + ', ' + itemData.suffix : itemData.prefix || itemData.suffix || ''}`;
            const itemPageUrl = itemData.reTryData?.linkUrl || '';
            const row = document.createElement('div');
            const refreshIcon = `
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M23 4v6h-6"></path>
                                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                                </svg>`;
            row.style = "display:flex; align-items:center; border-bottom:1px solid #333; padding:6px 0; gap:8px;";
            row.innerHTML = `
                <input type="checkbox" class="item-check" data-key="${key}" style="margin-left:5px; width:15px; height:15px; cursor:pointer; accent-color:#00FF41; appearance:auto;">
                <div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1; cursor:help;" title="${itemData.reTryData?.imageSrc || ''}">
                <a href="${itemPageUrl || ''}" target="_blank"><span style="color:#00FF41; font-family:monospace; font-size:12px;">${itemData.displayCode}</span></a>
                    ${detailLabel ? `<span style="color:white; font-size:10px; margin-left:5px;">[</span><span style="color:#00FF41; font-size:10px;">${detailLabel}</span><span style="color:white; font-size:10px;">]</span>` : ''}
                </div>
                <span style="color:white; font-size:10px;padding-left:5px;">[ ${itemData.makerLabelCode} ] [ ${itemData.rawMediaType || ''} ]</span>
                <button class="reset-btn" style="background:none; border:none; color:#aaa; cursor:pointer; display:flex; align-items:center; padding:0 5px;">${refreshIcon}</button>
            `;

            row.querySelector('.item-check').onchange = updateCounts;
            row.querySelector('.item-check').addEventListener('click', (e) => {
                e.stopPropagation(); // 🔥 body / row 이벤트 차단
                updateCounts();
            });
            row.querySelector('a').addEventListener('click', (e) => {
                e.stopPropagation(); // 🔥 body / row 이벤트 차단
            });

            // updateDisplayList 함수 내 반복문(items.forEach) 부분 수정
            row.querySelector('.reset-btn').addEventListener('click', async (e) => {
                const imageSrc = itemData.reTryData?.imageSrc;
                const linkUrl = itemData.reTryData?.linkUrl;
                const makerLabelCode = itemData.reTryData?.makerLabelCode;
                const rawMediaType = itemData.reTryData?.rawMediaType;
                const contentId = itemData.reTryData?.contentId;

                if (imageSrc) {
                    // 1. 대기열(Queue)에 객체 형태로 추가

                    if (confirm(`${itemData.displayCode} 항목을 삭제하시겠습니까?`)) {
                        let queue = GM_getValue("process_queue", []);
                        if (!queue.some(q => q.imageSrc === imageSrc)) {
                            queue.push({
                                imageSrc,
                                linkUrl,
                                makerLabelCode,
                                rawMediaType,
                                contentId
                            });
                            GM_setValue("process_queue", queue);
                            console.log(`[Queue Add] ${imageSrc}`);
                        }
                        // 2. DB 및 메모리에서 즉시 삭제
                        await VceDB.delete('codes', key);
                        await VceDB.deleteAll('imageMeta', 'uniqueKey', key);
                        currentSessionCodes.delete(key);

                        // 3. 리스트 갱신 및 큐 카운트 업데이트
                        updateDisplayList(false, 'reset-btn');
                        refreshQueueButton(); // 아래에서 정의할 버튼 갱신 함수
                    }
                }
            });
            listContainer.appendChild(row);
        });

        if (shouldScroll) listContainer.scrollTop = listContainer.scrollHeight;
        else listContainer.scrollTop = currentScroll;
        updateCounts();
    }


    const UniqueKeyUtil = (() => {

        const VERSION = 2;

        // ----------------------------
        // 🔧 내부 유틸
        // ----------------------------
        const sanitize = (v) => (v ?? "").toString().trim();
        const safeNumber = (v) => Number(v) || 0;

        const zeroMaskContentId = (contentId) => {
            return sanitize(contentId).replace(/\d/g, '0');
        };

        // ----------------------------
        // 🏗️ 생성
        // ----------------------------
        function build({
            displayCode,
            prefix = "",
            padLen = 0,
            suffix = "",
            makerLabelCode = "",
            contentId
        }) {
            if (!displayCode || !contentId) {
                throw new Error("build: displayCode / contentId 필수");
            }

            return [
                sanitize(displayCode),
                sanitize(prefix),
                safeNumber(padLen),
                sanitize(suffix),
                sanitize(makerLabelCode),
                zeroMaskContentId(contentId)
            ].join("|");
        }

        // ----------------------------
        // 🔍 파싱
        // ----------------------------
        function parse(v) {
            if (!v.uniqueKey || typeof v.uniqueKey !== "string") {
                return { valid: false, reason: "empty" };
            }

            const parts = v.uniqueKey.split("|");

            // v2 (정상)
            if (parts.length === 6) {
                const [
                    displayCode,
                    prefix,
                    padLenStr,
                    suffix,
                    makerLabelCode,
                    contentIdZero
                ] = parts;

                return {
                    valid: true,
                    version: 2,
                    displayCode,
                    prefix,
                    padLen: safeNumber(padLenStr),
                    suffix,
                    makerLabelCode,
                    contentIdZero
                };
            }
            return { valid: false, reason: "invalid_format", raw: uniqueKey };
        }

        // ----------------------------
        // 📦 공개 API
        // ----------------------------
        return {
            VERSION,
            build,
            parse,
        };
    })();


    async function updateUniqueKey() {
        const allMeta = await VceDB.getAll("imageMeta");
        const allCodes = await VceDB.getAll("codes");

        const keyPath = DB_SCHEMA["codes"].keyPath;

        const removeUpdatePromises = [];
        const db = await VceDB.open();
        const txR = db.transaction("imageMeta", "readwrite");
        const storeR = txR.objectStore("imageMeta");


        for (const v of allMeta) {
            if (v.uniqueKey.includes(`${v.displayCode}_`)) {
                const parts = v.uniqueKey.match(/([a-zA-Z0-9]+)_([a-zA-Z]_\d+|.*)_(\d)_(.*)_(\d+)/i);
                if (parts >= 4) {
                    const contentIdZero = v.contentId.replace(/\d/g, '0');
                    const makerLabelCode = v.makerLabelCode;
                    const suffix = parts[4];
                    const padLenStr = parts[3];
                    const prefix = parts[2];
                    const displayCode = v.displayCode;

                    const newKey = `${displayCode}|${prefix}|${padLenStr}|${suffix}|${makerLabelCode}|${contentIdZero}`;
                    await VceDB.save("imageMeta", v.imageSource, {
                        uniqueKey: newKey
                    });
                }
            }
            const pattern = new RegExp(Object.keys(replaceTextMap).sort((a, b) => b.length - a.length).join('|'), 'g');
            if (v.title && (pattern.test(v.title) || replaceReg.test(v.title) || v.title.toLowerCase().includes(v.realCode.toLowerCase()))) {
                const newTitle = bulkReplace(v.title, replaceTextMap).replace(replaceReg, '').replace(`(${v.realCode.toLowerCase()})`, '').trim();

                if (/[●○〇]/.test(v.title)) {
                    console.log(`${v.realCode} ${v.title} -> ${newTitle}`);
                }
                await VceDB.save("imageMeta", v.imageSource, {
                    title: newTitle
                });
            }

            for (const Regex of deletePattons) {
                if (v.realCode && Regex.test(v.realCode) && deleteMakerCodes.has(v.makerLabelCode)) {
                    //console.log(v.realCode);
                    const request = storeR.delete(v.url); // keyPath가 url인 경우

                    // 프로미스 생성 및 배열 추가
                    const p = new Promise((resolve, reject) => {
                        request.onsuccess = () => resolve();
                        request.onerror = () => reject(request.error);
                    });
                    removeUpdatePromises.push(p);
                }
            }
        };

        try {
            await Promise.all(removeUpdatePromises);
            console.log(`deletePattons 규칙에 의해 ${removeUpdatePromises.length}개의 데이터가 삭제되었습니다.`);
        } catch (error) {
            console.error("삭제 중 오류 발생:", error);
        }

        // 3. 트랜잭션이 완전히 끝날 때까지 기다리는 것이 더 안전함
        await new Promise((resolve, reject) => {
            txR.oncomplete = resolve;
            txR.onerror = () => reject(txR.error);
        });


        // [Step 2: 삭제 후 최신 Meta 재로드]
        const remainingMeta = await new Promise(r => {
            db.transaction("imageMeta").objectStore("imageMeta").getAll().onsuccess = e => r(e.target.result);
        });


        // 🔥 수정: 이미지 객체 전체가 아니라, UniqueKey를 기준으로 '대표 이미지 1장'씩만 추출
        const uniqueKeyMap = new Map();

        remainingMeta.forEach(m => {
            if (m.makerLabelCode && !uniqueKeyMap.has(m.uniqueKey)) {
                uniqueKeyMap.set(m.uniqueKey, m);
            }
        });

        // 이제 existingMakerLabel은 중복 없는 '작품 리스트'가 됩니다.
        const existingMakerLabel = Array.from(uniqueKeyMap.values());

        // [Step 3: Codes 정리]
        // 삭제 작업 전 최신 codes 상태를 가져옴
        const currentCodes = await VceDB.getAll("codes");
        const currentCodeKeys = new Set(currentCodes.map(v => v[keyPath]));

        // 현재 존재하는 메타들의 Key 집합
        const metaKeys = new Set(uniqueKeyMap.keys());


        // 메타가 하나도 없는 코드들만 골라내서 삭제
        const keysToRemove = [...currentCodeKeys].filter(key => !metaKeys.has(key));
        const keysToRemovePromises = [];
        const txC = db.transaction("codes", "readwrite");
        const storeC = txC.objectStore("codes");

        if (keysToRemove.length > 0) {
            keysToRemove.forEach(k => storeC.delete(k));
            for (const k of keysToRemove) {
                keysToRemovePromises.push(storeC.delete(k));
                console.log(`${k} 빈 코드 항목이 정리`);
            }
        }

        try {
            await Promise.all(keysToRemovePromises);
            console.log(`${keysToRemovePromises.length}개의 빈 코드 항목이 정리되었습니다.`);
        } catch (error) {
            console.error("삭제 중 오류 발생:", error);
        }

        // 3. 트랜잭션이 완전히 끝날 때까지 기다리는 것이 더 안전함
        await new Promise((resolve, reject) => {
            txC.oncomplete = resolve;
            txC.onerror = () => reject(txR.error);
        });

        // [Step 4: 생성/업데이트 루프]
        // 삭제가 완료된 후의 Key 상태를 다시 확인
        const finalRemainingCodes = await VceDB.getAll("codes");
        const finalKeys = new Set(finalRemainingCodes.map(v => v[keyPath]));

        let created = 0, deleted = 0, updated = 0, skipped = 0;

        for (const obj of existingMakerLabel) {

            // 필수값 체크
            if (!obj.displayCode || !obj.contentId) {
                console.log('skip', obj.displayCode, obj.contentId);
                skipped++;
                continue;
            }

            // makerLabelCode 없으면 v2 생성 불가 → skip
            if (!obj.makerLabelCode) {
                skipped++;
                continue;
            }

            const parsed = UniqueKeyUtil.parse(obj);
            const prefix = parsed.prefix;
            const padLen = parsed.padLen;
            const suffix = parsed.suffix;

            const oldKey = obj.uniqueKey || null;

            // 🔥 new key 생성
            let newKey;
            try {
                newKey = UniqueKeyUtil.build({
                    displayCode: obj.displayCode,
                    prefix: prefix,
                    padLen: padLen,
                    suffix: suffix,
                    makerLabelCode: obj.makerLabelCode,
                    contentId: obj.contentId
                });
            } catch (err) {
                console.warn("key 생성 실패:", obj, err);
                skipped++;
                continue;
            }

            // ----------------------------
            // 1️⃣ codes 없으면 생성
            // ----------------------------
            if (!finalKeys.has(newKey)) {

                await VceDB.save("codes", newKey, {
                    displayCode: obj.displayCode,
                    imageSourceKey: obj.imageSourceKey || "",
                    reTryData: {
                        imageSrc: obj.imageSource,
                        linkUrl: `https://video.dmm.co.jp/av/content/?id=${obj.contentId}`,
                        makerLabelCode: obj.makerLabelCode,
                        rawMediaType: obj.rawMediaType || "",
                    },
                    contentId: obj.contentId,

                    // 🔥 uniqueKey에서 파싱 대신 직접 넣는 구조 유지
                    prefix: prefix,
                    padLen: padLen,
                    suffix: suffix,

                    makerLabelCode: obj.makerLabelCode,
                    makerLabel: obj.makerLabel || "",
                    rawMediaType: obj.rawMediaType || "",
                });

                finalKeys.add(newKey);
                created++;
            }

            // ----------------------------
            // 2️⃣ 구버전 key 삭제
            // ----------------------------
            if (oldKey !== newKey) {
                // v1 key만 삭제 (안전)
                if (finalKeys.has(oldKey)) {
                    await VceDB.delete("codes", oldKey);
                    finalKeys.delete(oldKey);
                    deleted++;
                }
            }

            // ----------------------------
            // 3️⃣ imageMeta key 업데이트
            // ----------------------------
            if (oldKey && oldKey !== newKey) {

                for (const m of remainingMeta) {
                    await VceDB.save("imageMeta", m.url, {
                        uniqueKey: newKey
                    });
                    updated++;
                }
            }
        }

        console.log(`
[updateUniqueKey 완료]
생성: ${created}
삭제: ${deleted}
업데이트: ${updated}
스킵: ${skipped}
`);

        await getMinMax();

    }

    const makerMap = new Map();

    function initializeMakerMap() {
        try {
            Object.entries(makerMapData).forEach(([id, originalName]) => {
                // 변경 이름이 있으면 가져오고, 없으면 null 혹은 원래 이름을 넣습니다.
                const makerName = makerLabelReplaceMap[originalName] || '';

                // Map에 객체 형태로 저장: [ID, { 원래이름, 변경이름 }]
                makerMap.set(id, {
                    original: originalName,
                    final: makerName
                });
            });

            // 2. GM_getValue로 저장된 로컬 데이터 로드 및 병합
            const localData = GM_getValue(LOCAL_MAKER_KEY, {});
            let isUpdated = false; // 변경 사항이 있는지 추적

            Object.entries(localData).forEach(([id, data]) => {
                if (makerMap.has(id)) {
                    // 이미 외부 리소스(makerMap)에 존재하는 ID라면 로컬 데이터에서 삭제
                    delete localData[id];
                    isUpdated = true;
                } else {
                    // 존재하지 않는다면 로컬 데이터를 맵에 추가
                    makerMap.set(id, data);
                }
            });

            // 데이터에 변경(삭제)이 발생했을 때만 다시 저장하여 성능 최적화
            if (isUpdated) {
                GM_setValue(LOCAL_MAKER_KEY, localData);
            }
        } catch (e) {
            console.warn("[initializeMakerMap] 외부리소스 로딩 실패", e);
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


    async function startWithHighlight(type, highlightPairs) {
        const autoStatus = getState();
        const continuePage = Number(GetParam(autoStatus.pendingPage, 'page')) || Number('1');
        const currentPage = Number(GetParam(PageURL(), 'page')) || Number('1');
        const lastP = getLastPageNumber();


        let count;

        highlightPairs.forEach(({ countText, container }) => {
            if (countText) {
                const last = container.lastElementChild;
                if (last?.classList.contains('bg-black')) {
                    count = Number(last.textContent.trim());
                } else {
                    count = Number(container.textContent.trim());
                }
            };
        });


        if (count >= 120) {

            // 선택 요소 위로 올리기
            highlightPairs.forEach(({ container }) => {
                container.parentElement.classList.add('spotlight-active');
                container.classList.add('pulse-border');
            });
            // 기본 공통 설정
            let swalConfig = {
                customClass: { popup: 'swal2-popup-custom' },
                showCancelButton: true,
                confirmButtonColor: '#2196F3',
                cancelButtonColor: '#666',
                background: '#fff',
                color: '#1e1e1e',
                didClose: () => {
                    highlightPairs.forEach(({ container }) => {
                        container.parentElement.classList.remove('spotlight-active');
                        container.classList.remove('pulse-border');
                    });
                }
            };



            // --- 조건별 분기 처리 ---
            if (type === 'pageView') {
                if (autoStatus.pendingPage || Number(currentPage) > 1) {
                    const pagination = document.querySelector('ul[data-e2eid="pagination"]');
                    if (!pagination) return false;
                    const firstPageLink = pagination.querySelector('li:nth-child(2) a');
                    swalConfig.title = '이어서 수집을 시작하시겠습니까?';
                    swalConfig.html = `
<b>${continuePage || currentPage}</b>페이지부터
<input
  id="swal-max-page"
  type="number"
  value="${lastP}"
  min="${continuePage || currentPage}"
  max="${lastP}"
  style="width:3ch; text-align:center;">
페이지까지 수집합니다.
<br><br>
페이지 표시 갯수(<b>${count}</b>)와 새로고침 여부를 확인하셨나요?
<br><br>
첫 페이지부터 다시 하려면 수집하기 버튼 옆 이어하기 초기화 아이콘을 클릭하세요!
`;
                    swalConfig.confirmButtonText = '네, 시작합니다!';

                    // 확인 시 동작: 수집 로직 실행
                    swalConfig.preConfirm = () => {
                        const input = document.getElementById('swal-max-page');
                        const value = Math.min(
                            lastP,
                            Math.max(continuePage, parseInt(input.value, 10) || continuePage)
                        );

                        if (isNaN(value) || value <= 0) {
                            Swal.showValidationMessage('올바른 페이지 숫자를 입력하세요');
                            return false;
                        }

                        maxPagesLimit = value;

                        if (firstPageLink) firstPageLink.click();

                        startAuto(value);
                        setState({ active: true });
                        toggleAutoRun();
                    };
                }
                if (Number(continuePage) >= Number(lastP) || Number(currentPage) >= Number(lastP)) {
                    // [상황 1] 현재 페이지가 제한 페이지보다 큰 경우 (재설정 필요)
                    swalConfig.title = '페이지 범위 오류';
                    swalConfig.html = `현재 페이지(<b>${continuePage || currentPage}</b>)가 제한(<b>${lastP}</b>)보다 큽니다.<br><br><span style="color: #ff4d4d;">[${count}] 단위를 클릭하고 페이지를 새로고침 하시겠습니까?</span>`;
                    swalConfig.confirmButtonText = '네, 설정 후 재로딩';

                    // 확인 시 동작: target 클릭 후 새로고침
                    swalConfig.preConfirm = () => {
                        const target = highlightPairs.find(({ container }) => {
                            const last = container.lastElementChild;
                            return last?.tagName === 'BUTTON';
                        });

                        if (target) {
                            target.container.lastElementChild.click();
                        }
                        setState({ active: true });
                        setTimeout(() => location.reload(), 500); // 0.5초 뒤 새로고침
                        return false; // Swal이 자동으로 닫히지 않게 하거나 reload로 종료
                    };
                } else {
                    // [상황 2] 정상적인 수집 시작
                    swalConfig.title = '수집을 시작하시겠습니까?';
                    swalConfig.html = `
<b>${continuePage || currentPage}</b>페이지부터
<input
  id="swal-max-page"
  type="number"
  value="${lastP}"
  min="${continuePage || currentPage}"
  max="${lastP}"
  style="width:3ch; text-align:center;">
페이지까지 수집합니다.
<br><br>
페이지 표시 갯수(<b>${count}</b>)와 새로고침 여부를 확인하셨나요?
<br><br>
첫 페이지부터 다시 하려면 수집하기 버튼 옆 이어하기 초기화 아이콘을 클릭하세요!
`;

                    swalConfig.confirmButtonText = '네, 시작합니다!';

                    // 확인 시 동작: 수집 로직 실행
                    swalConfig.preConfirm = () => {
                        const input = document.getElementById('swal-max-page');
                        const value = Math.min(
                            lastP,
                            Math.max(continuePage, parseInt(input.value, 10) || continuePage)
                        );

                        if (isNaN(value) || value <= 0) {
                            Swal.showValidationMessage('올바른 페이지 숫자를 입력하세요');
                            return false;
                        }
                        maxPagesLimit = value;
                        startAuto();
                        setState({ active: true });
                        toggleAutoRun();
                    };
                }
            } else if (type === 'search-form') {
                swalConfig.title = '수집되지 않는 페이지';
                swalConfig.html = `<b>2D/VR에서 <a id="choicetype" href="https://video.dmm.co.jp/av/list/"></a>를 선택하세요.<br><br><span style="color: #ff4d4d;">페이지 표시 갯수를 120개로 설정하고<br>새로고침 F5를 클릭하세요!</span>`;
                swalConfig.confirmButtonText = '네, 페이지 이동!';

                // 확인 시 동작: 수집 로직 실행
                swalConfig.preConfirm = () => {
                    setState({ active: true });
                    window.location.href = UpdateParam(PageURL(), 'media_type', '2d');
                };
            }

            // 0.5초 대기 후 실행
            await new Promise(resolve => setTimeout(resolve, 500));
            await Swal.fire(swalConfig);

        } else {
            if (confirm("페이지 표시 단위를 찾을 수 없습니다.")) {
                // 기본 동작 실행
            }
        }
    };

    // --- [맵 데이타 구축] ---

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


    function extraMakerMap(doc = document) {
        const newAdd = new Map();

        const makerNodes = doc.querySelectorAll('li a[href*="/av/list/?maker="] p.line-clamp-2.text-ellipsis, div.maker-text a[href*="article=maker/id="], td a[href*="article=maker/id="]');
        if (makerNodes.length === 0) {
            console.warn("저장할 메이커 데이터가 없습니다.");
            return;
        }
        makerNodes.forEach(node => {
            try {
                let makerId, makerName;
                if (/video\.dmm\.co\.jp\/av\/maker\//.test(PageURL())) {
                    const link = node.closest('li a');
                    const url = new URL(link.href, window.location.origin);
                    makerId = url.searchParams.get('maker');
                    // .line-clamp-2.text-ellipsis 클래스를 가진 텍스트 추출
                    makerName = link.querySelector('p.line-clamp-2.text-ellipsis')?.innerText.trim();
                } else if (/dmm\.co\.jp\/mono\/dvd\/-\/maker\//.test(PageURL())) {
                    const link = node.closest('a');
                    const getId = (link) => /article=maker\/id=(\d+)/i.exec(link.href);
                    makerId = getId(link)[1];
                    // .line-clamp-2.text-ellipsis 클래스를 가진 텍스트 추출
                    makerName = link?.innerText.trim();
                }

                if (makerId && makerName) {
                    newAdd.set(makerId, makerName);
                    addMakerMap.set(makerId, makerName);
                }
            } catch (e) {
                console.warn(e);
            }
        });

        console.log(`[extraMakerMap] 메이커 맵 구성 완료: 총 ${addMakerMap.size}개 항목 <- 새로 추가된 ${newAdd.size}개 항목`);
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
                || '';

            const entry = makerMap.get(id);
            if (!makerMap.has(id)) {
                if (makerName !== entry?.original || makerName !== entry?.final) {
                    const newData = { original: originalName, final: makerName };
                    const currentLocal = GM_getValue(LOCAL_MAKER_KEY, {});
                    currentLocal[id] = newData;
                    GM_setValue(LOCAL_MAKER_KEY, currentLocal);
                    console.log(`[신규 메이커 저장] ${id}: ${makerName}`);
                }
            }
            if (makerMap.has(id)) {
                saveMakerMap.set(id, entry.original);
            } else {
                saveMakerMap.set(id, originalName);
            }

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
    function formatTable(data) {
        const rows = data.map(m => [
            m.realCode || '',
            m.makerLabel || '',
            m.series || '',
            m.label || '',
            m.cast || '',
            m.releaseDate || '',
            m.resolution ? `${m.resolution.W}x${m.resolution.H}` : '',
            m.imageSource || '',
            m.sourceSite || ''
        ]);

        const headers = [
            'Code', 'Maker', 'Series', 'Label',
            'Cast', 'Date', 'Res', 'Image', 'Site'
        ];

        // 헤더 포함
        rows.unshift(headers);

        // 🔥 각 컬럼 최대 길이 계산
        const colWidths = headers.map((_, colIndex) =>
            Math.max(...rows.map(row => (row[colIndex] || '').length))
        );

        // 🔥 padEnd로 정렬
        const lines = rows.map(row =>
            row.map((cell, i) =>
                (cell || '').padEnd(colWidths[i], ' ')
            ).join(' | ')
        );

        return lines.join('\n');
    }

    const virtualKeyExtractor = (key) => {
        const parts = key.split('|');
        // uniqueKey 구조: [displayCode, prefix, padLen, suffix, makerLabelCode, maskedContentId]

        // makerLabelCode(인덱스 4)를 제외하고 다시 조립하여 가상 키 생성
        return [
            parts[0], // displayCode
            parts[1], // prefix
            parts[2], // padLen
            parts[3], // suffix
            // parts[4] 는 무시 (makerLabelCode)
            parts[5]  // contentId (masked)
        ].join('|');
    };

    const findDuplicateGroups = (Codes) => {
        const groups = {};

        Codes.forEach(item => {
            const virtualKey = virtualKeyExtractor(item.id);

            if (!groups[virtualKey]) {
                groups[virtualKey] = [];
            }
            groups[virtualKey].push(item);
        });

        // 2. 그룹화된 결과 중 makerLabelCode만 다른 경우 추출
        const results = [];

        for (const vKey in groups) {
            const list = groups[vKey];

            // 같은 가상 키를 가졌는데, 실제 makerLabelCode가 서로 다른 게 있는지 확인
            const uniqueMakerCodes = new Set(list.map(i => i.makerLabelCode));

            if (uniqueMakerCodes.size > 1) {
                // makerLabelCode가 2종류 이상 발견된 경우 리스트에 추가
                results.push({
                    commonPattern: vKey,
                    items: list
                });
            }
        }
        return results;
    };





    async function getMinMax() {

        const db = await VceDB.open();
        const allCodes = await new Promise(r => {
            db.transaction("codes").objectStore("codes").getAll().onsuccess = e => r(e.target.result);
        });
        if (allCodes.length === 0) return alert("데이터가 없습니다.");

        const MinMaxMeta = await new Promise(r => {
            db.transaction("imageMeta").objectStore("imageMeta").getAll().onsuccess = e => r(e.target.result);
        });

        const txMinMax = db.transaction("codes", "readwrite"); // 🔥 삭제 작업 완료 후 생성!
        const storeMinMax = txMinMax.objectStore("codes");
        const firstUpdatePromises = [];

        // 2. displayCode별 출현 빈도 계산 (전체 codes 테이블 기준)
        const displayCodeCounts = allCodes.reduce((acc, curr) => {
            acc[curr.displayCode] = (acc[curr.displayCode] || 0) + 1;
            return acc;
        }, {});


        const specialPatternMap = new Map();

        const duplicateGroups = findDuplicateGroups(allCodes);

        duplicateGroups.forEach(group => {
            const codesInPattern = new Set(group.items.map(i => i.makerLabelCode));
            specialPatternMap.set(group.commonPattern, codesInPattern);
        });


        allCodes.forEach(obj => {
            // A의 key와 일치하는 B의 데이터들 필터링
            const group = MinMaxMeta.filter(m => m.uniqueKey === obj.id);

            if (group.length > 0) {
                // 숫자 추출 로직
                const p = obj.prefix;
                const c = obj.displayCode.toLowerCase();
                const s = obj.suffix;
                const regex = new RegExp(`^${p}${c}|${s}$`, 'i');

                const errNumber = 5000;
                const nums = group.map(m => {
                    const cleanStr = m.contentId.replace(regex, '');
                    const n = parseInt(cleanStr, 10);
                    return isNaN(n) ? 1 : n;
                }).filter(n => n < errNumber);

                const currentVKey = virtualKeyExtractor(obj.id);

                let minNum, maxNum;

                const isSpecialGroup = specialPatternMap.has(currentVKey) &&
                    specialPatternMap.get(currentVKey).has(obj.makerLabelCode);

                if (isSpecialGroup || s) {
                    // 1. 특수 그룹: 실제 존재하는 번호만 추출해서 저장
                    obj.actualNums = [...nums]
                        .sort((a, b) => a - b)
                        .map(num => NumberFormatter.trimAndMinPad(num, 3));

                    // 특수 그룹은 실제 번호들의 최소/최대를 사용
                    minNum = Math.min(...nums);
                    maxNum = Math.max(...nums);
                } else {
                    // 2. 일반 그룹: actualNums를 저장하지 않음 (용량 절약)
                    obj.actualNums = null;

                    if (displayCodeCounts[obj.displayCode] === 1) {
                        minNum = 1;
                        maxNum = Math.max(...nums);
                    } else if (obj.suffix) {
                        obj.actualNums = [...nums]
                            .sort((a, b) => a - b)
                            .map(num => NumberFormatter.trimAndMinPad(num, 3));

                        // 특수 그룹은 실제 번호들의 최소/최대를 사용
                        minNum = Math.min(...nums);
                        maxNum = Math.max(...nums);
                    } else {
                        minNum = Math.min(...nums);
                        maxNum = Math.max(...nums);
                    }
                }

                obj.minIndex = NumberFormatter.trimAndMinPad(minNum, 3);
                obj.maxIndex = NumberFormatter.trimAndMinPad(maxNum, 3);

                const request = storeMinMax.put(obj);
                firstUpdatePromises.push(new Promise(r => request.onsuccess = r));
            }
        });


        // 🔥 중요: 첫 번째 작업이 DB에 모두 반영될 때까지 대기
        await Promise.all(firstUpdatePromises);
        console.log("넘버링 업데이트 완료");

        // [Step 2] 최신화된 데이터를 다시 가져와서 두 번째 작업(보정) 시작
        const updatedCodes = await new Promise(r => {
            db.transaction("codes").objectStore("codes").getAll().onsuccess = e => r(e.target.result);
        });

        const tx2 = db.transaction("codes", "readwrite");
        const store2 = tx2.objectStore("codes");
        const secondUpdatePromises = [];

        const groupByDisplayAndMaker = (Codes) => {
            const groups = {};

            Codes.forEach(item => {
                // 1. 두 코드를 조합하여 고유한 그룹 키 생성
                const groupKey = `${item.displayCode}_${item.makerLabelCode}`;

                // 2. 해당 키가 없으면 초기화
                if (!groups[groupKey]) {
                    groups[groupKey] = {
                        displayCode: item.displayCode,
                        makerLabelCode: item.makerLabelCode,
                        items: []
                    };
                }

                // 3. 그룹에 현재 아이템 추가
                groups[groupKey].items.push(item);
            });

            // 4. 객체 형태를 배열로 변환하여 반환
            return Object.values(groups);
        };

        const groupedResult = groupByDisplayAndMaker(updatedCodes);
        const duplicateDisplayCodes = groupedResult.filter(group => group.items.length > 1);

        duplicateDisplayCodes.forEach(group => {
            let absoluteMin = Infinity;
            let targetItem = null;

            group.items.forEach(item => {
                const currentMin = parseInt(item.minIndex, 10);
                if (currentMin < absoluteMin) {
                    absoluteMin = currentMin;
                    targetItem = item;
                }
            });

            if (targetItem) {
                targetItem.minIndex = NumberFormatter.trimAndMinPad(1, 3);
                const request = store2.put(targetItem);
                secondUpdatePromises.push(new Promise(r => request.onsuccess = r));
            }
        });


        // 🔥 중요: 두 번째 보정 작업 대기
        await Promise.all(secondUpdatePromises);
        console.log("보정 작업 완료");

    }

    async function updateMinMax(code, numbering) {

        const db = await VceDB.open();
        const allCodes = await new Promise(r => {
            db.transaction("codes").objectStore("codes").getAll().onsuccess = e => r(e.target.result);
        });

        const specialPatternMap = new Map();

        // 2. displayCode별 출현 빈도 계산 (전체 codes 테이블 기준)
        const displayCodeCounts = allCodes.reduce((acc, curr) => {
            acc[curr.displayCode] = (acc[curr.displayCode] || 0) + 1;
            return acc;
        }, {});


        const duplicateGroups = findDuplicateGroups(allCodes);

        duplicateGroups.forEach(group => {
            const codesInPattern = new Set(group.items.map(i => i.makerLabelCode));
            specialPatternMap.set(group.commonPattern, codesInPattern);
        });

        const currentVKey = virtualKeyExtractor(code.id);

        const isSpecialGroup = specialPatternMap.has(currentVKey) &&
            specialPatternMap.get(currentVKey).has(code.makerLabelCode);

        const num = (numbering) => {
            const n = parseInt(numbering, 10);
            return isNaN(n) ? 1 : n;
        };

        const currentNumber = num(numbering);
        const key = code.id;
        const errNumber = 5000;

        // 1. 실제 번호 목록 초기화 (null이나 undefined 대비)
        let actualNums = Array.isArray(code.actualNums) ? [...code.actualNums] : [];

        // 2. 현재 min/max를 숫자로 변환하여 가져오되, 없으면 현재 번호를 기준으로 설정
        let currentMinNum = code.minIndex ? num(code.minIndex) : currentNumber;
        let currentMaxNum = code.maxIndex ? num(code.maxIndex) : currentNumber;

        // 에러 번호 처리 로직
        if (currentNumber > errNumber) {
            if (actualNums.length > 0) {
                const hasErr = actualNums.some(n => num(n) > errNumber);
                if (hasErr || num(code.maxIndex) > errNumber) {
                    const filtered = actualNums.filter(n => num(n) < errNumber);
                    const newMax = filtered.length > 0 ? filtered[filtered.length - 1] : NumberFormatter.trimAndMinPad(1, 3);
                    await VceDB.save("codes", key, {
                        minIndex: code.minIndex || NumberFormatter.trimAndMinPad(1, 3),
                        maxIndex: newMax,
                        actualNums: filtered
                    });
                }
            }
            return;
        }

        let addNumber = null;
        // 3. 특수 그룹 또는 Suffix 조건 처리 (actualNums 추가)
        const isSuffixSpecial = code.suffix && (/[a-zA-Z]$/i.test(code.suffix) || /ai$/i.test(code.suffix));

        if (isSpecialGroup || isSuffixSpecial) {
            const checkNumberStr = NumberFormatter.trimAndMinPad(currentNumber, 3);
            if (!actualNums.includes(checkNumberStr)) {
                addNumber = checkNumberStr;
                actualNums.push(checkNumberStr);
                actualNums.sort((a, b) => num(a) - num(b));

                // actualNums 기반으로 min/max 재계산
                currentMinNum = Math.min(currentMinNum, num(actualNums[0]));
                currentMaxNum = Math.max(currentMaxNum, num(actualNums[actualNums.length - 1]));
            }
        } else {
            // 4. 일반적인 Min/Max 비교 로직 (더 직관적으로 변경)
            if (displayCodeCounts[code.displayCode] === 1) {
                currentMinNum = Math.min(currentMinNum, 1, currentNumber);
            } else {
                currentMinNum = Math.min(currentMinNum, currentNumber);
            }
            currentMaxNum = Math.max(currentMaxNum, currentNumber);
        }

        // 최종 포맷팅
        const finalMin = NumberFormatter.trimAndMinPad(currentMinNum, 3);
        const finalMax = NumberFormatter.trimAndMinPad(currentMaxNum, 3);
        const finalActualNums = actualNums.length > 0 ? actualNums : null;

        // 5. 변경사항이 있을 때만 저장
        if (code.minIndex !== finalMin || code.maxIndex !== finalMax || addNumber) {
            const logAddNumber = addNumber ? `actualNums: ${actualNums} -> ${addNumber}` : '';
            console.log(`갱신 [${key}]: ${code.minIndex}->${finalMin}, ${code.maxIndex}->${finalMax} ${logAddNumber}`);
            await VceDB.save("codes", key, {
                minIndex: finalMin,
                maxIndex: finalMax,
                actualNums: finalActualNums
            });
        }
    }


    function createUI() {
        return new Promise((resolve) => {
            const panel = document.createElement('div');
            panel.classList.add('videocodeextractor');
            panel.style = "position:fixed; bottom:15px; right:15px; z-index:99999; display:flex !important; flex-direction:column; background:rgba(15,15,15,0.95); padding:8px; border-radius:12px; width:280px; border:1px solid #444; box-shadow:0 8px 32px rgba(0,0,0,0.5); color:white; font-family:sans-serif; box-sizing:border-box;";
            panel.innerHTML = `<div style='font-weight:bold; font-size:10px; margin-bottom:5px; text-align:center; color:#2196F3;'>DMM CODE TRACKER</div>`;

            FANZADIGITAL = document.createElement('div');
            FANZADIGITAL.id = 'FANZADIGITAL-status-indicator';
            FANZADIGITAL.style = `display: grid; justify-content: space-around; padding: 5px 10px; background: rgba(0,0,0,0.7); color: white; font-size: 12px; border-size: 12px; border-radius: 5px; z-index: 99999;`;

            panel.appendChild(FANZADIGITAL);
            /*
                    statusEl = document.createElement('div');
                    statusEl.id = 'vce-status-indicator';
                    statusEl.style = `display: grid; justify-content: space-around; padding: 5px 10px; background: rgba(0,0,0,0.7); color: white; font-size: 12px; border-size: 12px; border-radius: 5px; z-index: 99999;`;

                    panel.appendChild(statusEl);
        */
            alertStatus = document.createElement('div');
            alertStatus.style = "font-size:11px; text-align:center; line-height:1.4;";
            panel.appendChild(alertStatus);

            countStatus = document.createElement('div');
            countStatus.style = "font-size:10px; color:#aaa; text-align:center; margin-bottom:8px; padding:4px; background:#222; border-radius:4px;";
            panel.appendChild(countStatus);

            // controlBar 생성
            const controlBar = document.createElement('div');
            controlBar.style = "display:flex; flex-direction:column; padding:8px; background:#222; border-bottom:1px solid #444; gap:8px; margin-bottom:10px; border-radius:4px; box-sizing:border-box;";
            // 1. 공통 스타일을 변수로 정의
            const commonBtnStyle = "border:none; padding:4px 8px; font-size:10px; cursor:pointer; border-radius:3px; font-weight:bold; word-break:keep-all; line-height:1.2;";

            // 2. `${}`를 사용하여 버튼에 삽입
            controlBar.innerHTML = `
            <div style="display:flex; text-align:center; gap:4px;">
                <button id="btnSelectAll" style="background:#2196F3; color:white; ${commonBtnStyle}">전체 선택</button>
                <button id="btnUnselectAll" style="background:#666; color:white; ${commonBtnStyle}">전체 해제</button>
                <button id="delSelected" style="background:#444; color:#ff4d4d; ${commonBtnStyle}">선택 삭제</button>
                <button id="btnRetrySel" style="background:#FF9800; color:white; ${commonBtnStyle}">선택 재시도 예약</button>
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

                let queue = GM_getValue("process_queue", []);
                for (const cb of selected) {
                    const key = cb.dataset.key;
                    const item = await VceDB.get('codes', key);
                    if (item && !queue.some(q => q.imageSrc === item.reTryData.imageSrc)) {
                        queue.push({
                            imageSrc,
                            linkUrl,
                            makerLabelCode,
                            rawMediaType,
                            contentId
                        });
                        await VceDB.delete('codes', key);
                        await VceDB.deleteAll('imageMeta', 'uniqueKey', key);
                        currentSessionCodes.delete(key);
                    }
                }
                GM_setValue("process_queue", queue);
                //updateDisplayList(false, 'btnRetrySel');
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
                const queue = GM_getValue("process_queue", []);
                if (queue.length === 0) return;
                GM_setValue("process_queue", []); // 즉시 비우기
                btnRun.disabled = true;

                for (let i = 0; i < queue.length; i++) {
                    const { imageSrc,
                        linkUrl,
                        makerLabelCode,
                        rawMediaType,
                        contentId
                    } = queue[i];
                    btnRun.innerText = `처리 중 (${i + 1}/${queue.length})`;
                    await processWork(imageSrc, linkUrl, { makerLabelCode, rawMediaType, contentId, reTry: true });
                }
                btnRun.disabled = false;
                refreshQueueButton();
                //updateDisplayList(false, 'btnRunQueue');
            };

            const filterInput = controlBar.querySelector('#filterInput');
            const searchBtn = controlBar.querySelector('#searchBtn');

            // [찾기] 버튼: #selectAll 참조 제거
            searchBtn.onclick = () => {
                filterText = filterInput.value.trim();
                updateDisplayList(false, 'searchBtn');
            };

            filterInput.onkeydown = (e) => {
                if (e.key === 'Enter') searchBtn.click();
                else if (e.key === 'Escape') { filterInput.value = ''; searchBtn.click(); }
            };

            // [X] 버튼: #selectAll 참조 제거
            controlBar.querySelector('#clearBtn').onclick = () => {
                filterInput.value = "";
                filterText = "";
                updateDisplayList(false, 'clearBtn');
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
                        await VceDB.delete('codes', key); // IndexedDB 삭제
                        await VceDB.deleteAll('imageMeta', 'uniqueKey', key);
                        currentSessionCodes.delete(key); // 메모리 셋 갱신
                    }
                    updateDisplayList(false, 'delSelected');
                }
            };

            const tabBox = document.createElement('div');
            tabBox.style = "display:flex; margin-bottom:10px; border-bottom:1px solid #444; font-size:11px; cursor:pointer;";
            const sTab = document.createElement('div'); sTab.innerText = "현재 페이지"; sTab.style = "flex:1; text-align:center; padding:5px; color:#2196F3; border-bottom:2px solid #2196F3;";
            const aTab = document.createElement('div'); aTab.innerText = "전체 저장소"; aTab.style = "flex:1; text-align:center; padding:5px; color:#888;";
            tabBox.append(sTab, aTab);
            panel.appendChild(tabBox);

            sTab.onclick = () => { isShowAllMode = false; sTab.style.color = '#2196F3'; sTab.style.borderBottom = '2px solid #2196F3'; aTab.style.color = '#888'; aTab.style.borderBottom = 'none'; updateDisplayList(false, 'sTab'); };
            aTab.onclick = () => { isShowAllMode = true; aTab.style.color = '#2196F3'; aTab.style.borderBottom = '2px solid #2196F3'; sTab.style.color = '#888'; sTab.style.borderBottom = 'none'; updateDisplayList(false, 'aTab'); };

            listContainer = document.createElement('div');
            listContainer.style = "max-height:400px; overflow-y:auto; margin-bottom:10px; padding-right:5px;";
            panel.appendChild(listContainer);

            const btnContainer = document.createElement('div');
            btnContainer.style = "display:grid; grid-template-columns: repeat(4,auto); gap:5px; text-align:center;";

            // 1. 기존 품번(Codes) 다운로드 버튼
            const dlBtn = document.createElement('button');
            dlBtn.innerText = "품번 저장";
            dlBtn.style = "padding:4px; background:#4CAF50; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px; font-weight:bold;";
            const metaDlBtn = document.createElement('button');
            metaDlBtn.innerText = "메타 저장";
            metaDlBtn.style = "padding:4px; background:#2196F3; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px; font-weight:bold;";
            const clBtn = document.createElement('button');
            clBtn.innerText = "품번 리셋";
            clBtn.style = "padding:4px; background:#F44336; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px; font-weight:bold;";
            const buildBtn = document.createElement('button');
            buildBtn.innerText = "품번 생성";
            buildBtn.style = "display:none;padding:4px; background:#F44336; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px; font-weight:bold;";
            const resetBtn = document.createElement('button');
            resetBtn.innerText = "DB 리셋";
            resetBtn.style.cssText = `padding:4px; background-color: #ff4d4d; background:#F44336; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px; font-weight:bold;`;


            btnContainer.appendChild(dlBtn);
            btnContainer.appendChild(metaDlBtn);
            btnContainer.append(clBtn);
            btnContainer.append(buildBtn);
            btnContainer.appendChild(resetBtn);

            dlBtn.onclick = async () => {
                const db = await VceDB.open();
                const allCodes = await new Promise(r => {
                    db.transaction("codes").objectStore("codes").getAll().onsuccess = e => r(e.target.result);
                });
                if (allCodes.length === 0) return alert("데이터가 없습니다.");

                const allMeta = await new Promise(r => {
                    db.transaction("imageMeta").objectStore("imageMeta").getAll().onsuccess = e => r(e.target.result);
                });
                if (allMeta.length === 0) return alert("메타 데이터가 없습니다.");

                // [Step 1] 삭제 대상 식별 및 imageMeta 삭제
                const deletedCandidateKeys = new Set(); // 삭제된 메타의 uniqueKey 후보들
                const removeUpdatePromises = [];
                const txR = db.transaction("imageMeta", "readwrite");
                const storeR = txR.objectStore("imageMeta");

                for (const obj of allMeta) {
                    for (const Regex of deletePattons) {
                        if (Regex.test(obj.realCode) && deleteMakerCodes.includes(obj.makerLabelCode)) {
                            const request = storeR.delete(obj.url);
                            // 나중에 codes에서 지울지 말지 결정하기 위해 uniqueKey 보관
                            deletedCandidateKeys.add(obj.uniqueKey);

                            const p = new Promise((resolve, reject) => {
                                request.onsuccess = () => resolve();
                                request.onerror = () => reject(request.error);
                            });
                            removeUpdatePromises.push(p);
                        }
                    }
                }

                await Promise.all(removeUpdatePromises);
                await new Promise(r => txR.oncomplete = r); // 삭제 트랜잭션 확정
                console.log("메타 데이터 삭제 완료");

                // ---------------------------------------------------------

                // [Step 2] 살아남은 메타 데이터 확인 및 codes 테이블 삭제
                // 삭제 후 남은 전체 메타를 가져옵니다.
                const remainingMeta = await new Promise(r => {
                    db.transaction("imageMeta").objectStore("imageMeta").getAll().onsuccess = e => r(e.target.result);
                });

                // 여전히 남아있는 uniqueKey들의 집합 생성
                const remainingKeys = new Set(remainingMeta.map(m => m.uniqueKey));

                // 삭제 후보(deletedCandidateKeys) 중, 남은 메타(remainingKeys)에 없는 것만 골라냄
                const keysToRemoveFromCodes = [...deletedCandidateKeys].filter(key => !remainingKeys.has(key));

                if (keysToRemoveFromCodes.length > 0) {
                    const txC = db.transaction("codes", "readwrite");
                    const storeC = txC.objectStore("codes");

                    keysToRemoveFromCodes.forEach(key => {
                        storeC.delete(key);
                        currentSessionCodes.delete(key);
                        console.log(`[codes 삭제] 연관된 메타가 없어 ${key} 항목을 삭제했습니다.`);
                    });

                    await new Promise(r => txC.oncomplete = r);
                }

                await getMinMax();

                // [Step 3] 최종 결과 정렬 및 파일 생성
                // 보정이 완료된 최종 데이터를 다시 가져옴
                const finalCodes = await new Promise(r => {
                    db.transaction("codes").objectStore("codes").getAll().onsuccess = e => r(e.target.result);
                });

                finalCodes.sort((a, b) => {
                    // 1. 정렬 (maker → code → timestamp)
                    const makerA = a.makerLabel || "기타";
                    const makerB = b.makerLabel || "기타";

                    if (makerA !== makerB) return makerA.localeCompare(makerB, 'ja');
                    if (a.displayCode !== b.displayCode) return a.displayCode.localeCompare(b.displayCode);

                    return (a.createdAt || 0) - (b.createdAt || 0);
                });

                // 2. code별 seq 카운터
                const codeCounterMap = new Map();

                let output = "";
                let currentMaker = "";

                // 3. 순회
                finalCodes.forEach(obj => {
                    const maker = obj.makerLabel || "기타";
                    const code = obj.displayCode;

                    // 메이커 구분선
                    if (maker !== currentMaker) {
                        if (currentMaker !== "") output += "\n";
                        currentMaker = maker;
                        output += `// ${currentMaker}\n`;
                    }

                    // seq 계산 (code 기준 유지)
                    let currentSeq = codeCounterMap.get(code) || 0;
                    codeCounterMap.set(code, currentSeq + 1);

                    // ✅ 기존 data 포맷 재구성
                    const exportData = [
                        obj.imageSourceKey || "",
                        obj.prefix || "",
                        obj.padLen || 0,
                        obj.suffix || "",
                        obj.minIndex || "",
                        obj.maxIndex || "",
                        obj.actualNums || null,
                        obj.makerLabel || "",
                        obj.rawMediaType || "",
                        currentSeq
                    ];

                    output += `"${code}": ${JSON.stringify(exportData)},\n`;
                });

                // 4. 다운로드
                const fileName = `Codes_${new Date().toISOString().slice(0, 10)}.txt`;
                downloadFile(output, fileName);

            };

            metaDlBtn.onclick = async () => {
                const db = await VceDB.open();
                const allMeta = await new Promise(r => {
                    db.transaction("imageMeta").objectStore("imageMeta").getAll().onsuccess = e => r(e.target.result);
                });

                if (allMeta.length === 0) return alert("메타 데이터가 없습니다.");

                const cleanMeta = allMeta.filter(m => m.metaStatus === 'SUCCESS');

                // 보기 좋게 정렬 (패턴키 기준)
                cleanMeta.sort((a, b) => (a.contentId || "").localeCompare(b.contentId || ""));


                const displayData = cleanMeta.map(item => {
                    return {
                        メーカー: item.makerLabel,
                        メーカー品番: item.realCode,
                        제목: item.title,
                        レーベル: item.label || '',
                        出演者: item.cast || '',
                        商品発売日: item.releaseDate,
                        // resolution 객체를 "1920x1080" 형태의 문자열로 변환
                        해상도: item.resolution && item.resolution.W ? `${item.resolution.W}x${item.resolution.H}` : '',
                        출처: item.sourceSite
                    };
                });

                // 1. 새 워크북 생성
                const workbook = XLSX.utils.book_new();

                // 2. JSON 데이터를 시트로 변환
                const worksheet = XLSX.utils.json_to_sheet(displayData);

                // 3. 워크북에 시트 추가
                XLSX.utils.book_append_sheet(workbook, worksheet, "DataSheet");

                // 4. 파일 다운로드 (파일명: exported_data.xlsx)
                XLSX.writeFile(workbook, "exported_data.xlsx");



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

            clBtn.onclick = async () => {
                if (confirm("수집한 품번 데이터를 삭제하시겠습니까?")) {
                    const db = await VceDB.open();
                    db.transaction("codes", "readwrite").objectStore("codes").clear();
                    currentSessionCodes.clear();
                    clBtn.style = "display:none;";
                    buildBtn.style = "display:block;";
                    updateDisplayList(false, 'clBtn');
                }
            };
            buildBtn.onclick = async () => {
                if (confirm("수집한 메타 데이터를 이용하여 품번을 생성합니다!")) {
                    await updateUniqueKey();
                    buildBtn.style = "display:none;";
                    clBtn.style = "display:block;";
                    updateDisplayList(false, 'clBtn');
                }
            };
            resetBtn.onclick = async () => {
                if (confirm("주의: 모든 저장된 코드와 이미지 메타데이터가 삭제됩니다. 계속하시겠습니까?")) {
                    try {
                        await VceDB.resetDatabase();
                        localStorage.
                            alert("DB가 초기화되었습니다. 페이지를 새로고침하여 재설정합니다.");
                        location.reload(); // 새로고침하면 open()이 실행되며 DB가 재생성됨
                    } catch (err) {
                        console.error(err);
                    }
                }
            };

            panel.appendChild(btnContainer);


            autoContainer = document.createElement('div');
            autoContainer.classList.add('auto-container');
            autoContainer.style = "display: none; gap:5px;";
            if (/video\.dmm\.co\.jp\/av\/list\//.test(PageURL())) {
                autoContainer.style = "display: flex; gap:5px;";
            }

            // 수동 수집 버튼 추가

            const btnAutoRun = document.createElement('button');
            btnAutoRun.innerText = "페이지 수집 시작";
            btnAutoRun.style = "flex:1;background:#E91E63; color:white; border:none; padding:5px 5px; font-size:10px; cursor:pointer; border-radius:3px; font-weight:bold; margin-top:5px;";
            const btnReset = document.createElement('button');
            btnReset.id = "btnReset";
            btnReset.title = "이어하기 초기화";
            btnReset.style = `
    width:28px;
    height:24px;
    background:#555;
    color:white;
    border:none;
    border-radius:4px;
    font-size:11px;
    cursor:pointer;
    display:flex;
    align-items:center;
    justify-content:center;
    margin-top:5px;
`;
            const btnStop = document.createElement('button');
            btnStop.innerText = "정지 중";
            btnStop.style = "flex:1;background:#E91E63; color:white; border:none; padding:5px 5px; font-size:10px; cursor:pointer; border-radius:3px; font-weight:bold; margin-top:5px;";

            autoContainer.appendChild(btnAutoRun);
            autoContainer.appendChild(btnReset); // 👈 여기 추가
            autoContainer.appendChild(btnStop);

            toggleAutoRun = (s) => {
                const autoStatus = getState();
                if (autoStatus.active) {
                    if (s == 0) {
                        btnStop.innerText = `수집 완료`;
                        maxPagesLimit = 50;
                    } else {
                        btnStop.innerText = `수집 작업 중... ${s && s > 0 ? s + 's' : ""}`;
                    }
                }
            };
            btnAutoRun.onclick = () => {
                if (/video\.dmm\.co\.jp\/av\/list\//.test(PageURL())) {
                    const pageViewMode = document.querySelector('[data-e2eid="search-form"] select#sort');
                    const pageViewCount = document.querySelector('[data-e2eid="search-number-displays"] li:last-child');
                    const countText = '120';
                    const containerPairs = [
                        { container: pageViewMode },
                        { container: pageViewCount, countText: countText }
                    ];
                    startWithHighlight('pageView', containerPairs);
                } else {
                    const searchMode = document.querySelector('[data-e2eid="search-form"] select#contentType');
                    const pageViewCount = document.querySelector('[data-e2eid="search-number-displays"] li:last-child');
                    const countText = '120';
                    const containerPairs = [
                        { container: searchMode },
                        { container: pageViewCount, countText: countText }
                    ];
                    startWithHighlight('search-form', containerPairs);
                }
            };

            btnReset.onclick = () => {
                const state = getState();

                setState({
                    ...state,
                    pendingPage: null
                });

                btnReset.innerText = "✔";
                btnReset.style.background = "#4CAF50";

                setTimeout(() => {
                    VCE.updateResetButton();
                }, 500);

                console.log('[Auto] pendingPage 초기화');
            };

            window.VCE = {
                updateResetButton() {
                    const state = getState();
                    const btn = document.querySelector('#btnReset');
                    if (!btn) return;

                    if (state.pendingPage) {
                        const page = GetParam(state.pendingPage, 'page') || '1';
                        btn.innerText = `${page}`;
                        btn.style.background = "#FF9800";
                    } else {
                        btn.innerText = "⟳";
                        btn.style.background = "#555";
                    }
                }
            };

            btnStop.onclick = () => {
                if (/video\.dmm\.co\.jp\/av\/list\//.test(PageURL())) {
                    setState({ active: false, pendingPage: PageURL() });
                } else {
                    setState({ active: false });
                    maxPagesLimit = 50;
                }
                btnStop.innerText = "수집 정지 됨";
            };


            panel.appendChild(autoContainer);

            mapContainer = document.createElement('div');
            mapContainer.classList.add('map-container');
            mapContainer.style = "display:none; gap:5px; text-align:center;";

            if (/video\.dmm\.co\.jp\/av\/maker\//.test(PageURL()) || /dmm\.co\.jp\/mono\/dvd\/-\/maker\//.test(PageURL())) {
                mapContainer.style = "display:flex; gap:5px; text-align:center;";
            }
            const extraBtn = document.createElement('button');
            extraBtn.innerText = "메이커 맵 수집";
            extraBtn.style = "flex:1; margin-top:5px; padding:5px; background:#2196F3; color:white; border:none; border-radius:4px; cursor:pointer; font-size:11px;";
            if (/video\.dmm\.co\.jp\/av\/maker\//.test(PageURL())) {
                extraBtn.onclick = extraMakerMap;
            } else if (/dmm\.co\.jp\/mono\/dvd\/-\/maker\//.test(PageURL())) {

                const lists = [
                    `https://www.dmm.co.jp/mono/dvd/-/maker/`,
                    `https://www.dmm.co.jp/mono/dvd/-/maker/=/keyword=a/`,
                    `https://www.dmm.co.jp/mono/dvd/-/maker/=/keyword=i/`,
                    `https://www.dmm.co.jp/mono/dvd/-/maker/=/keyword=u/`,
                    `https://www.dmm.co.jp/mono/dvd/-/maker/=/keyword=e/`,
                    `https://www.dmm.co.jp/mono/dvd/-/maker/=/keyword=o/`,
                    `https://www.dmm.co.jp/mono/dvd/-/maker/=/keyword=ka/`,
                    `https://www.dmm.co.jp/mono/dvd/-/maker/=/keyword=ki/`,
                    `https://www.dmm.co.jp/mono/dvd/-/maker/=/keyword=ku/`,
                    `https://www.dmm.co.jp/mono/dvd/-/maker/=/keyword=ke/`,
                    `https://www.dmm.co.jp/mono/dvd/-/maker/=/keyword=ko/`,
                    `https://www.dmm.co.jp/mono/dvd/-/maker/=/keyword=sa/`,
                    `https://www.dmm.co.jp/mono/dvd/-/maker/=/keyword=si/`,
                    `https://www.dmm.co.jp/mono/dvd/-/maker/=/keyword=su/`,
                    `https://www.dmm.co.jp/mono/dvd/-/maker/=/keyword=se/`,
                    `https://www.dmm.co.jp/mono/dvd/-/maker/=/keyword=so/`,
                    `https://www.dmm.co.jp/mono/dvd/-/maker/=/keyword=ta/`,
                    `https://www.dmm.co.jp/mono/dvd/-/maker/=/keyword=ti/`,
                    `https://www.dmm.co.jp/mono/dvd/-/maker/=/keyword=tu/`,
                    `https://www.dmm.co.jp/mono/dvd/-/maker/=/keyword=te/`,
                    `https://www.dmm.co.jp/mono/dvd/-/maker/=/keyword=to/`,
                    `https://www.dmm.co.jp/mono/dvd/-/maker/=/keyword=na/`,
                    `https://www.dmm.co.jp/mono/dvd/-/maker/=/keyword=ni/`,
                    `https://www.dmm.co.jp/mono/dvd/-/maker/=/keyword=nu/`,
                    `https://www.dmm.co.jp/mono/dvd/-/maker/=/keyword=ne/`,
                    `https://www.dmm.co.jp/mono/dvd/-/maker/=/keyword=no/`,
                    `https://www.dmm.co.jp/mono/dvd/-/maker/=/keyword=ha/`,
                    `https://www.dmm.co.jp/mono/dvd/-/maker/=/keyword=hi/`,
                    `https://www.dmm.co.jp/mono/dvd/-/maker/=/keyword=hu/`,
                    `https://www.dmm.co.jp/mono/dvd/-/maker/=/keyword=he/`,
                    `https://www.dmm.co.jp/mono/dvd/-/maker/=/keyword=ho/`,
                    `https://www.dmm.co.jp/mono/dvd/-/maker/=/keyword=ma/`,
                    `https://www.dmm.co.jp/mono/dvd/-/maker/=/keyword=mi/`,
                    `https://www.dmm.co.jp/mono/dvd/-/maker/=/keyword=mu/`,
                    `https://www.dmm.co.jp/mono/dvd/-/maker/=/keyword=me/`,
                    `https://www.dmm.co.jp/mono/dvd/-/maker/=/keyword=mo/`,
                    `https://www.dmm.co.jp/mono/dvd/-/maker/=/keyword=ya/`,
                    `https://www.dmm.co.jp/mono/dvd/-/maker/=/keyword=yu/`,
                    `https://www.dmm.co.jp/mono/dvd/-/maker/=/keyword=yo/`,
                    `https://www.dmm.co.jp/mono/dvd/-/maker/=/keyword=ra/`,
                    `https://www.dmm.co.jp/mono/dvd/-/maker/=/keyword=ri/`,
                    `https://www.dmm.co.jp/mono/dvd/-/maker/=/keyword=ru/`,
                    `https://www.dmm.co.jp/mono/dvd/-/maker/=/keyword=re/`,
                    `https://www.dmm.co.jp/mono/dvd/-/maker/=/keyword=ro/`,
                    `https://www.dmm.co.jp/mono/dvd/-/maker/=/keyword=wa/`,
                    `https://www.dmm.co.jp/mono/dvd/-/maker/=/keyword=wo/`,
                    `https://www.dmm.co.jp/mono/dvd/-/maker/=/keyword=nn/`,

                ];

                async function dom(url) {
                    const urlObj = new URL(url);
                    return new Promise((resolve, reject) => {
                        GM_xmlhttpRequest({
                            method: "GET",
                            url,
                            headers: { 'referer': url, 'origin': urlObj.origin },
                            onload: (res) => {
                                if (res.status === 404) {
                                    return resolve(null);
                                }

                                const doc = new DOMParser()
                                    .parseFromString(res.responseText, "text/html");

                                resolve(doc);
                            },
                            onerror: () => resolve(null),
                            ontimeout: () => resolve(null)
                        });
                    });
                }

                extraBtn.onclick = async () => {
                    for (const url of lists) {
                        extraBtn.innerText = "메이커 맵 수집 중...";
                        const doc = await dom(url);
                        if (doc) {
                            extraMakerMap(doc);
                        }
                    }
                    extraBtn.innerText = "메이커 맵 수집 완료";
                };
            }

            const saveBtn = document.createElement('button');
            saveBtn.innerText = "메이커 맵 저장";
            saveBtn.style = "flex:1;margin-top:5px; padding:5px; background:#2196F3; color:white; border:none; border-radius:4px; cursor:pointer; font-size:11px;";
            saveBtn.onclick = saveMakerMapToFile;

            mapContainer.append(extraBtn, saveBtn);
            panel.appendChild(mapContainer);


            document.body.appendChild(panel);
            updateDisplayList(false, 'createUI');
            if (window.VCE) {
                VCE.updateResetButton();
            }
            resolve();
        });
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }


    function refreshQueueButton() {
        const queue = GM_getValue("process_queue", []);
        const group = document.getElementById('retry-group');
        const btn = document.getElementById('btnRunQueue');

        if (group && btn) {
            const hasItems = queue.length > 0;
            group.style.display = hasItems ? "flex" : "none";
            if (hasItems) btn.innerText = `대기열 실행 (${queue.length})`;
        }
    }


    // 현재 탭에서 자동 수집 버튼을 눌렀는지 확인 (탭 닫으면 초기화됨)

    let toggleAutoRun = null;
    let startPage = 1;
    let maxPagesLimit = 50;


    function getMaker() {
        return GetParam(PageURL(), 'maker') || 'all';
    }

    function getStorageKey() {
        return `VideoCodeExtractor_${getMaker()}`;
    }
    function getState() {
        try {
            return JSON.parse(localStorage.getItem(getStorageKey())) || {};
        } catch {
            return {};
        }
    }

    function setState(data) {
        const newState = {
            ...getState(),
            ...data,
            updatedAt: Date.now()
        };

        localStorage.setItem(getStorageKey(), JSON.stringify(newState));
        return newState;
    }

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
        return Math.floor(Math.random() * (15000 - 5000 + 1)) + 5000;
    }

    async function countdown(ms) {
        let remainingTime = ms;

        while (remainingTime > 0) {
            const autoStatus = getState();

            if (!autoStatus.active) {
                console.log('[Auto] 중단됨');
                return false;
            }

            const sec = (remainingTime / 1000).toFixed(1);
            toggleAutoRun(sec);

            await sleep(1000);
            remainingTime -= 1000;
        }

        return true;
    }

    function autoStep() {
        const pagination = document.querySelector('ul[data-e2eid="pagination"]');
        if (!pagination) return false;

        const nextImg = pagination.querySelector('img[alt="次へ"]');
        const nextBtn = nextImg ? nextImg.closest('a') : null;

        // ✅ 변경: localStorage 사용
        const autoStatus = getState();

        let isWorkingPage = PageURL();
        const lastPage = getLastPageNumber();
        const pendingPage = autoStatus.pendingPage;

        if (nextBtn && nextBtn.href) {
            const firstPageLink = pagination.querySelector('li:nth-child(2) a');
            const currentstartPage = pagination.querySelector('li:nth-child(2) p.text-white');

            const firstPage = GetParam(PageURL(), 'page') || '';

            // ✅ 1. 페이지 제한 초과
            if (Number(GetParam(PageURL(), 'page')) > Number(maxPagesLimit)) {
                console.log(`[Auto] ${maxPagesLimit} 초과`);
                toggleAutoRun(0);
                setState({ active: false });
                maxPagesLimit = 50;
                return false;
            }

            // ✅ 2. 첫 페이지 상태
            if (currentstartPage) {
                setState({
                    pendingPage: nextBtn.href
                });
                VCE.updateResetButton();
                nextBtn.click();
                return true;
            }

            // ✅ 3. pendingPage 복구
            if (pendingPage && isWorkingPage !== pendingPage) {
                const continuePage = GetParam(pendingPage, 'page');

                if (!continuePage || continuePage === "1") {
                    setState({
                        pendingPage: nextBtn.href
                    });
                    VCE.updateResetButton();
                    nextBtn.click();
                } else {
                    const targetUrl = UpdateParam(pendingPage, 'page', continuePage);

                    setState({
                        pendingPage: targetUrl
                    });
                    VCE.updateResetButton();
                    window.location.href = targetUrl;
                }
                return true;
            }

            // ✅ 4. page=1 처리
            if (firstPage === 1 || firstPage === "1") {
                const targetUrl = removeUriWithParam(PageURL(), 'page');

                setState({
                    pendingPage: targetUrl
                });
                VCE.updateResetButton();
                window.location.href = targetUrl;
                return true;
            }

            // ✅ 5. 마지막 페이지
            const currentPage = Number(GetParam(PageURL(), 'page'));
            const lastPageNum = Number(lastPage);

            if (currentPage === lastPageNum) {
                console.log("[Auto] 끝");
                toggleAutoRun(0);
                setState({ active: false, pendingPage: null });
                maxPagesLimit = 50;
                return false;
            }

            // ✅ 6. 시작 페이지 이동
            if (startPage !== 1 && firstPageLink) {
                setState({
                    pendingPage: firstPageLink.href
                });
                firstPageLink.click();
                return true;
            }

            // ✅ 7. 기본 next
            //console.log('Next');
            setState({
                pendingPage: nextBtn.href
            });
            VCE.updateResetButton();
            nextBtn.click();
            return true;

        } else {
            console.log("[Auto] 끝");
            toggleAutoRun(0);
            maxPagesLimit = 50;

            setState({
                active: false,
                pendingPage: null
            });
            VCE.updateResetButton();

            return false;
        }
    }

    async function startAuto() {

        const state = getState();

        // 🔥 이어서 이동
        if (state.pendingPage && location.href !== state.pendingPage) {
            console.log('[Auto] 이어서 이동:', state.pendingPage);
            location.href = state.pendingPage;
            return;
        }

        setState({ active: true });

        await autoLoop();

        setState({ active: false });

    }

    async function autoLoop() {
        let guard = 0;
        const pagination = document.querySelector('ul[data-e2eid="pagination"]');
        if (!pagination) return;

        while (true) {
            const autoStatus = getState();

            if (!autoStatus.active) {
                console.log('[Auto] 종료');
                break;
            }

            if (++guard > 1000) {
                console.log('[Auto] guard 종료');
                break;
            }

            //console.log("[Auto] 대기...");

            let waitTime;
            const currentstartPage = pagination.querySelector('li:nth-child(2) p.text-white');
            if (currentstartPage) {
                waitTime = 1000;
            } else {
                waitTime = getRandomDelay();
            }

            const ok = await countdown(waitTime);
            if (!ok) break;

            const moved = autoStep();
            if (!moved) break;

            // 👉 SPA URL 변경 대기
            await waitForPageChange();

            setState({
                pendingPage: null
            });

            // 👉 DOM 안정화
            await sleep(800);
        }
    }


    function waitForPageChange() {
        return new Promise(resolve => {
            const prev = location.href;

            const observer = new MutationObserver(() => {
                if (location.href !== prev) {
                    observer.disconnect();
                    resolve();
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        });
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


    function waitElement(selector, targetNode = document.body) {
        const config = siteConfigs['FANZA_DIGITAL'];
        const element = targetNode.querySelector(selector);
        if (element) {
            if (coverDownloadIcon) coverDownloadIcon.remove();
            coverDownloadIcon = document.createElement('div');
            coverDownloadIcon.classList.add('CoverDownload', 'fa-regular', 'fa-image');
            coverDownloadIcon.style = `color: dodgerblue !important; bottom: 0; right: 0;`;
            element.parentElement.appendChild(coverDownloadIcon);
            config.rawImageDownloader();
        } else {
            const iconObserver = new MutationObserver((mutations, obs) => {
                const mainVideo = document.querySelector(selector);
                if (mainVideo) {
                    if (coverDownloadIcon) coverDownloadIcon.remove();
                    coverDownloadIcon = document.createElement('div');
                    coverDownloadIcon.classList.add('CoverDownload', 'fa-regular', 'fa-image');
                    coverDownloadIcon.style = `color: dodgerblue !important; bottom: 0; right: 0;`;
                    mainVideo.parentElement.appendChild(coverDownloadIcon);
                    config.rawImageDownloader();
                    obs.disconnect();
                }

            });
            iconObserver.observe(targetNode, {
                childList: true,
                subtree: true
            });
        }
    }


    function forceDownload(url, fileName) {
        GM_xmlhttpRequest({
            method: "GET",
            url: url,
            responseType: 'blob',
            onload: function (res) {
                //console.log(res.response, fileName)
                saveAs(res.response, fileName);
            }
        });
    }

    function byteLengthOf(text, maxByte) {
        let currentByte = 0;
        let result = '';
        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i);
            let charByte;
            if (charCode <= 0x7F) charByte = 1;
            else if (charCode <= 0x7FF) charByte = 2;
            else if (charCode <= 0xFFFF) charByte = 3;
            else {
                charByte = 4;
                i++;
            }

            if (currentByte + charByte >= maxByte) {
                // 마지막 문자가 '、' 또는 ','인 경우 제거
                if (result.endsWith('、') || result.endsWith(',')) {
                    result = result.slice(0, -1);
                }
                return result.trim() + '…';
            }
            currentByte += charByte;
            result += text[i];
        }
        return result;
    }

    function FilenameConvert(text) {
        if (typeof text !== 'string') return '';

        const replacements = {
            '<': '＜',
            '>': '＞',
            ':': '：',
            '"': '＂',
            '/': '／',
            '\\': '＼',
            '|': '｜',
            '?': '？',
            '*': '＊',
        };

        return [...text].map(c => replacements[c] || c).join('');
    }


    async function collectAndProcess() {

        const autoStatus = getState();
        await createUI();

        if (/video\.dmm\.co\.jp\/av\/list\/\?maker=\d+&media_type=.*/.test(PageURL())) {
            Logger.info('page', PageURL());
            mutCallback();
            if (autoStatus.active) {
                startAuto();
            }
            const observer = new MutationObserver(mutCallback);
            observer.observe(document.body, { childList: true, subtree: true });
        } else if (/^https:\/\/www\.dmm\.co\.jp\/mono\/dvd\/-\/list\/=\/article=maker\/id=\d+/.test(PageURL())) {
            Logger.info('page', PageURL());
            mutCallback();
            if (autoStatus.active) {
                startAuto();
            }
            const observer = new MutationObserver(mutCallback);
            observer.observe(document.body, { childList: true, subtree: true });
        }

        refreshQueueButton();
        updateProcessingFANZADIGITAL();
        //updateProcessingStatus();

        if (PageURL().startsWith('https://video.dmm.co.jp/av/content/')) {
            const waitTime = Math.max(getRandomDelay(), getRandomDelay());
            checkIcon(waitTime, 'collectAndProcess', 0);
        }
    }


    async function exportFullBackup() {
        try {
            // 모든 스토어의 데이터를 병렬로 가져옴
            const [codesData, imageMetaData] = await Promise.all([
                VceDB.getAll("codes"),
                VceDB.getAll("imageMeta")
            ]);

            const backupPayload = {
                version: 1.0,
                timestamp: Date.now(),
                data: {
                    codes: codesData,
                    imageMeta: imageMetaData
                }
            };

            const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `VceDB_Full_Backup_${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("전체 백업 실패:", err);
        }
    }

    async function importFullBackup() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';

        fileInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const payload = JSON.parse(event.target.result);

                    // 통합 백업 형식인지 확인
                    if (!payload.data || !payload.data.codes || !payload.data.imageMeta) {
                        alert("올바른 통합 백업 파일 형식이 아닙니다.");
                        return;
                    }

                    if (!confirm("기존 데이터에 덧씌워 복원하시겠습니까?")) return;

                    // 1. codes 데이터 복원
                    for (const item of payload.data.codes) {
                        await VceDB.put("codes", item);
                    }

                    // 2. imageMeta 데이터 복원
                    for (const item of payload.data.imageMeta) {
                        await VceDB.put("imageMeta", item);
                    }

                    alert("모든 데이터베이스가 복원되었습니다.");

                } catch (err) {
                    alert("복원 실패: " + err.message);
                }
            };
            reader.readAsText(file);
        };
        fileInput.click();
    }

    let externalUpdateVirtualRow;

    async function searchVCE() {
        let allResults = [];
        let currentPage = 1;
        const itemsPerPage = 100;

        const refreshIcon = `
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M23 4v6h-6"></path>
                                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                                </svg>`;

        const vceIcons = {
            minimize: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
            restore: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>`,
            close: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`
        };

        // 모달 생성
        const modal = document.createElement('div');
        modal.id = 'vce-search-modal';
        modal.innerHTML = `
        <div class="vce-modal-header" id="vce-drag-handle">
            <span>DATABASE EXPLORER</span>
            <div>
            <button id="vce-minimize-btn" style="background:none; border:none; color:#888; cursor:pointer; font-size:14px; margin-right:10px;">${vceIcons.minimize}</button>
            <button id="vce-close-x" style="background:none; border:none; color:#888; cursor:pointer; font-size:14px;">${vceIcons.close}</button>
            </div>
        </div>
        <div class="vce-content-wrapper">
            <div class="vce-control-bar">               
                    <div class="vce-input-group" style="overflow: visible !important;">                     
                        <div class="vce-input-wrapper">
                                <input type="text" id="vce-query" placeholder="예: ABC 100-200" style="width:100%;">                        
                                <div id="vce-pattern-dropdown"></div>                        
                        </div>
                        <button id="vce-btn-clear" class="vce-btn btn-grey">X</button>
                        <button id="vce-btn-run-search" class="vce-btn btn-search">SEARCH</button>
                        <button id="vce-btn-generate" class="vce-btn btn-blue">GENERATE</button>                                                                   
                    </div>
                    <div style="display:flex; justify-content: space-between; align-items:center;">
                    <div style="display:flex; gap:4px;">
                        <button id="vce-sel-all" class="vce-btn btn-blue">전체 선택</button>
                        <button id="vce-unsel-all" class="vce-btn btn-grey">전체 해제</button>                                                
                    </div>
                    <div style="display:flex; gap:4px;">
                    <button id="vce-btn-imageZipexport" class="vce-btn btn-green">검색된 모든 이미지 저장</button>
                        <button id="vce-btn-export" class="vce-btn btn-green">선택 항목 메타 저장</button>
                        <button id="vce-btn-allexport" class="vce-btn btn-green">모든 메타 저장</button>
                        <button id="vce-btn-allDBExport" class="vce-btn btn-green">DB 내려받기</button>
                        <button id="vce-btn-allDBImport" class="vce-btn btn-green">DB 업로드</button>
                    </div>
                </div>
            </div>

            <div class="vce-table-container">
                <table class="vce-result-table">
                    <thead>
                        <tr>
                            <th style="width:40px;cursor:default;">선택</th>
                            <th class="sortable" data-col="makerLabel" style="cursor:pointer;">제작사 ↕</th>
                            <th class="sortable" data-col="realCode" style="cursor:pointer;color:#00FF41; font-family:monospace;">품번 ↕</th>
                <th class="sortable" data-col="title" style="cursor:pointer;">제목 ↕</th>
                <th class="sortable" data-col="label" style="cursor:pointer;">라벨 ↕</th>
                <th class="sortable" data-col="cast" style="cursor:pointer;">배우 ↕</th>
                <th class="sortable" data-col="releaseDate" style="cursor:pointer;">출시일 ↕</th>
                <th class="sortable" data-col="resolution.W" style="cursor:pointer;">해상도 ↕</th>
                <th class="sortable" data-col="url" style="cursor:pointer;">${refreshIcon}</th>
                        </tr>
                    </thead>
                    <tbody id="vce-table-body"></tbody>
                </table>
            </div>
            <div id="vce-total-count" class="vce-totalCountInfo"></div>
            <div id="vce-paging-bar" class="vce-pagination"></div>
        </div>
    `;


        // 1. 저장된 크기 불러오기 (값이 없으면 1200px, 높이는 auto)
        const savedSize = GM_getValue(STORAGE_KEY, {});
        if (savedSize && Object.keys(savedSize).length !== 0) {
            const { width } = JSON.parse(savedSize);
            modal.style.width = width + 'px';
        }
        // 높이는 항상 콘텐츠에 맞게 (초기에는 auto)
        modal.style.height = 'auto';
        modal.style.maxHeight = '80vh'; // 화면을 넘지 않도록 최대 높이 제한

        document.body.appendChild(modal);

        const overlay = document.createElement('div');
        overlay.style = "display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.15); z-index:99;";
        document.body.appendChild(overlay);


        // 2. 이벤트 리스너 함수 정의

        const minimizeBtn = modal.querySelector('#vce-minimize-btn');


        // 최소화 버튼 클릭 이벤트
        minimizeBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // 헤더 드래그 이벤트 등으로 전파 방지
            toggleMinimize(e);
        });

        // 최소화된 상태의 모달을 클릭하면 다시 복원
        modal.addEventListener('click', (e) => {
            if (modal.classList.contains('vce-minimized')) {
                toggleMinimize(e);
            }
        });

        // --- 수정된 드래그 로직 ---
        const handle = document.getElementById('vce-drag-handle');
        let isDragging = false, offset = { x: 0, y: 0 };

        // 최소화/복원 토글 함수
        const toggleMinimize = (e) => {
            const isMinimized = modal.classList.toggle('vce-minimized');

            if (isMinimized) {
                // --- 최소화 모드 전환 ---
                overlay.style.display = 'none'; // 배경 클릭 허용

                // 현재 브라우저 높이에서 40px(헤더높이)을 뺀 위치 계산
                const targetTop = window.innerHeight - 40;

                modal.style.top = targetTop + 'px';
                // 가로 위치는 CSS의 left: 50%와 transform이 처리하므로 left는 초기화
                modal.style.left = '50%';

                minimizeBtn.innerHTML = vceIcons.restore;
                minimizeBtn.title = "원래대로";

            } else {
                // --- 복원 모드 (원래 위치로) ---
                overlay.style.display = 'block';

                // 드래그했던 마지막 위치가 있다면 복원
                if (modal.dataset.lastLeft) {
                    modal.style.left = modal.dataset.lastLeft;
                    modal.style.top = modal.dataset.lastTop;
                    modal.style.transform = 'none'; // 드래그 모드일 땐 중앙정렬 해제
                } else {
                    // 위치 기록이 없다면 화면 중앙 배치
                    modal.style.left = '50%';
                    modal.style.top = '50%';
                    modal.style.transform = 'translate(-50%, -50%)';
                }

                minimizeBtn.innerHTML = vceIcons.minimize;
                minimizeBtn.title = "최소화";

                // 저장된 원래 너비 복원
                const savedSize = GM_getValue(STORAGE_KEY, {});
                if (savedSize && Object.keys(savedSize).length !== 0) {
                    const { width } = JSON.parse(savedSize);
                    modal.style.width = width + 'px';
                } else {
                    modal.style.width = '1200px';
                }

                modal.style.height = 'auto';
            }
        };

        // --- 드래그 로직 보완 ---
        handle.onmousedown = (e) => {
            if (e.target.tagName === 'BUTTON' || modal.classList.contains('vce-minimized')) return;

            isDragging = true;
            const rect = modal.getBoundingClientRect();

            // 드래그 시작 시 transform 제거 (좌표 계산 정확도를 위해)
            modal.style.transform = 'none';
            modal.style.left = rect.left + 'px';
            modal.style.top = rect.top + 'px';

            offset.x = e.clientX - rect.left;
            offset.y = e.clientY - rect.top;

            document.onmousemove = (e) => {
                if (isDragging) {
                    modal.style.left = (e.clientX - offset.x) + 'px';
                    modal.style.top = (e.clientY - offset.y) + 'px';

                    // 위치 데이터 업데이트
                    modal.dataset.lastLeft = modal.style.left;
                    modal.dataset.lastTop = modal.style.top;
                }
            };
            document.onmouseup = () => { isDragging = false; };
        };


        // --- 영문/숫자 입력 씹힘 방지 및 검색 ---
        const queryInput = document.getElementById('vce-query');
        queryInput.addEventListener('keydown', (e) => {
            e.stopPropagation(); // 사이트 단축키 방해 차단
            if (e.key === 'Enter') performSearch();
            if (e.key === 'Escape') { queryInput.value = ''; performSearch(); }
        }, true);

        document.getElementById('vce-btn-generate').onclick = async () => {
            performGenerate();
        };


        const dropdownStyles = `
    /* 입력창을 감싸는 컨테이너 */
    .vce-input-wrapper { 
        position: relative; 
        flex: 1; 
        display: flex; 
        flex-direction: column; /* 추천창이 아래로 붙도록 설정 */
    }

    #vce-pattern-dropdown {
        position: absolute;
        top: 100%; /* 입력창 바로 아래 */
        left: 0;
        width: 70%;
        min-width: 250px; /* 너무 좁아지지 않게 최소 너비 설정 */
        background: #1e1e1e;
        border: 1px solid #00FF41; /* 강조색으로 테두리 */
        z-index: 9999; /* 최상단으로 올림 */
        max-height: 400px;
        overflow-y: auto;
        display: none;
        box-shadow: 0 10px 25px rgba(0,0,0,0.8);
        border-radius: 0 0 8px 8px;
    }

    .vce-dropdown-item {
        display: flex;
        align-items: center;
        padding: 10px;
        border-bottom: 1px solid #333;
        cursor: pointer;
        color: #eee;
        justify-content: space-between;
    }

    .vce-dropdown-item:hover { background: #2a2a2a; }    
    
`;

        if (!document.getElementById('vce-dropdown-style')) {
            const styleTag = document.createElement('style');
            styleTag.id = 'vce-dropdown-style';
            styleTag.innerHTML = dropdownStyles;
            document.head.appendChild(styleTag);
        }

        const dropdown = document.getElementById('vce-pattern-dropdown');

        // 입력창에 타이핑할 때 추천 목록 표시
        queryInput.addEventListener('input', async () => {
            const val = queryInput.value.trim().split(/\s+/)[0]; // 공백 앞부분(코드)만 추출
            if (!val) {
                dropdown.style.display = 'none';
                return;
            }

            const db = await VceDB.open();
            const allPatterns = await new Promise(r => {
                db.transaction("codes", "readonly").objectStore("codes").getAll().onsuccess = e => {
                    r(e.target.result.filter(c => c.displayCode.toUpperCase().includes(val.toUpperCase())));
                };
            });

            renderDropdown(allPatterns);
        });

        function renderDropdown(patterns) {
            const dropdown = document.getElementById('vce-pattern-dropdown');
            if (patterns.length === 0) {
                dropdown.style.display = 'none';
                return;
            }

            dropdown.innerHTML = patterns.map((p, idx) => {
                const ruleKey = `${p.prefix}|${p.padLen}|${p.suffix}`;
                return `
            <div class="vce-dropdown-item" data-rule="${ruleKey}" style="display:flex; align-items:center; padding:6px; cursor:pointer;">                
                    <div style="font-weight:bold; font-size:14px; margin-bottom:4px; font-size:12px;overflow: hidden;">${p.displayCode} 
                    <span style="font-weight:normal; color:#888; font-size:12px;">(${p.makerLabel})</span>
                    <span style="font-weight:normal; color:#888; font-size:12px;">첫작품: <span style="font-family:monospace; color:#00FF41; background:#003310; padding:2px 6px; border-radius:4px; font-size:11px;">${p.minIndex || ''}</span></span>
                    <span style="font-weight:normal; color:#888; font-size:12px;">끝작품: <span style="font-family:monospace; color:#00FF41; background:#003310; padding:2px 6px; border-radius:4px; font-size:11px;">${p.maxIndex || ''}</span></span>
                    <br>
                    <span style="font-weight:normal; color:#888; font-size:12px;">해당작품: <span style="font-family:monospace; color:#00FF41; background:#003310; padding:2px 6px; border-radius:4px; font-size:11px;">[${p.actualNums || '전체'}]</span></span>
                    </div>
                    <br>
                    <span class="vce-rule-tag" style="font-family:monospace; color:#00FF41; background:#003310; padding:2px 6px; border-radius:4px; font-size:11px;">
                        Rule: ${p.prefix}${p.displayCode}${String(0).padStart(p.padLen, '0')}${p.suffix} 
                    </span>                
            </div>
        `;
            }).join('');

            dropdown.style.display = 'block';

            document.addEventListener('click', (e) => {
                if (!e.target.closest('.vce-input-wrapper')) {
                    dropdown.style.display = 'none';
                }
            });

            // [중요 1] 드롭다운 영역에서의 모든 마우스 이벤트가 부모(모달 드래그)로 가는 것을 원천 차단
            dropdown.onmousedown = (e) => e.stopPropagation();
            dropdown.onmouseup = (e) => e.stopPropagation();
            dropdown.onclick = (e) => e.stopPropagation();
        }

        async function performSearch() {
            const val = queryInput.value.trim();
            const db = await VceDB.open();
            const dbData = await new Promise(r => {
                db.transaction("imageMeta", "readonly").objectStore("imageMeta").getAll().onsuccess = e => {
                    const filtered = e.target.result.filter(task => task.metaStatus == 'SUCCESS');
                    r(filtered);
                };
            });

            if (!val) {
                allResults = dbData;
            } else {
                const parts = val.split(/\s+/);
                const displayCodePart = parts[0]; // 검색어 (예: "T38")
                const rangePart = parts[1];      // 범위 (예: "001-100")

                allResults = dbData.filter(item => {
                    const realCode = item.realCode || "";
                    const displayCode = item.displayCode || "";

                    // 1. 우선 displayCode에 검색어가 포함되는지 확인 (대소문자 무시)
                    if (!displayCode.toLowerCase().includes(displayCodePart.toLowerCase())) return false;

                    // 2. 범위 검색이 있는 경우
                    if (rangePart) {
                        const rangeMatch = rangePart.match(/^(\d+)-(\d+)$/);
                        const singleMatch = rangePart.match(/^(\d+)$/);

                        // [핵심] displayCodePart 바로 뒤에 오는 숫자 뭉치를 찾는 정규식
                        // 예: T38 뒤에 하이픈이 있든 없든 그 뒤의 첫 숫자를 잡음
                        // escapeRegExp를 통해 특수문자 대응, [^0-9]*는 숫자 전까지의 기호 무시
                        const regex = new RegExp(`${escapeRegExp(displayCodePart)}[^0-9]*(\\d+)`, 'i');
                        const match = realCode.match(regex);

                        if (match) {
                            const extractedNum = parseInt(match[1]); // 찾아낸 숫자 (예: 001 -> 1)

                            if (rangeMatch) {
                                const start = parseInt(rangeMatch[1]), end = parseInt(rangeMatch[2]);
                                if (isNaN(start) || isNaN(end)) return alert("입력 형식이 올바르지 않습니다.");
                                if (start > end) return alert("시작번호가 끝번호 보다 큽니다.");

                                return extractedNum >= start && extractedNum <= end;
                            } else if (singleMatch) {
                                return extractedNum === parseInt(singleMatch[1]);
                            }
                        }
                        return false; // 숫자를 찾지 못하면 탈락
                    }

                    return true;
                });
            }

            currentPage = 1;
            renderTable();
        }

        function escapeRegExp(string) {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }

        function showPatternSelector(patterns, onConfirm) {
            // 1. 전용 오버레이 생성 (메인 모달보다 위에 위치)
            const selectorOverlay = document.createElement('div');
            selectorOverlay.id = 'vce-selector-overlay';
            selectorOverlay.style = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.7); z-index: 99999; display: flex;
        align-items: center; justify-content: center;overscroll-behavior: contain;
    `;

            // 2. 선택창 컨테이너 생성
            const selector = document.createElement('div');
            selector.style = `
        width: 450px; background: #1e1e1e; border: 1px solid #00FF41;
        box-shadow: 0 0 30px rgba(0,255,65,0.2); color: white;
        padding: 20px; border-radius: 12px; z-index: 9999;
        display: flex; flex-direction: column;
    `;

            let html = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid #333; padding-bottom:10px;">
            <h3 style="margin:0; font-size:12px; color:#00FF41;">GENERATE PATTERN SELECT</h3>
            <span style="font-size:12px; color:#888;">동일한 규칙의 패턴만 다중 선택 가능</span>
        </div>
        <div id="vce-pattern-list" style="max-height:200px; overflow-y:auto; margin-bottom:10px; border:1px solid #333; border-radius:4px; background:#111;overscroll-behavior: contain">
    `;

            patterns.forEach((p, idx) => {
                const ruleKey = `${p.prefix}|${p.padLen}|${p.suffix}`;
                html += `
            <label class="vce-pattern-item" data-rule="${ruleKey}" style="display:flex; align-items:center; padding:5px; border-bottom:1px solid #222; cursor:pointer;">
                <input type="checkbox" class="vce-pattern-cb" value="${idx}" style="margin-left:5px; width:15px; height:15px; cursor:pointer; accent-color:#00FF41; appearance:auto;">
                <div class="vce-pattern-info">
                    <div style="font-weight:bold; font-size:14px; margin-bottom:4px;">${p.displayCode} 
                    <span style="font-weight:normal; color:#888; font-size:12px;">(${p.makerLabel})</span><br>
                    <span style="font-weight:normal; color:#888; font-size:12px;">첫작품: <span style="font-family:monospace; color:#00FF41; background:#003310; padding:2px 6px; border-radius:4px; font-size:11px;">${p.minIndex || ''}</span></span>
                    <span style="font-weight:normal; color:#888; font-size:12px;">끝작품: <span style="font-family:monospace; color:#00FF41; background:#003310; padding:2px 6px; border-radius:4px; font-size:11px;">${p.maxIndex || ''}</span></span>
                    <span style="font-weight:normal; color:#888; font-size:12px;">해당작품: <span style="font-family:monospace; color:#00FF41; background:#003310; padding:2px 6px; border-radius:4px; font-size:11px;">[${p.actualNums || '전체'}]</span></span>
                    <br><span class="vce-rule-tag" style="font-family:monospace; color:#00FF41; background:#003310; padding:2px 6px; border-radius:4px; font-size:11px;">
                        Rule: ${p.prefix}${p.displayCode}${String(0).padStart(p.padLen, '0')}${p.suffix} 
                    </span>
                    </div>
                </div>
            </label>
        `;
            });

            html += `</div>
        <div style="display:flex; justify-content:flex-end; gap:10px;">
            <button id="vce-selector-cancel" class="vce-btn" style="background:#444; color:white; padding:8px 20px; border:none; border-radius:4px; cursor:pointer;">CANCEL</button>
            <button id="vce-selector-ok" class="vce-btn" style="background:#00FF41; color:black; font-weight:bold; padding:8px 25px; border:none; border-radius:4px; cursor:pointer;">GENERATE NOW</button>
        </div>
    `;

            selector.innerHTML = html;
            selectorOverlay.appendChild(selector);
            modal.appendChild(selectorOverlay);

            const cbs = selector.querySelectorAll('.vce-pattern-cb');
            const items = selector.querySelectorAll('.vce-pattern-item');

            // 제약 조건: 첫 번째 선택한 것과 규칙이 다르면 비활성화
            cbs.forEach(cb => {
                cb.onchange = (e) => {
                    const checked = Array.from(cbs).filter(c => c.checked);
                    if (checked.length > 0) {
                        const baseRule = checked[0].closest('.vce-pattern-item').dataset.rule;
                        items.forEach(item => {
                            if (item.dataset.rule !== baseRule) {
                                item.style.opacity = '0.3';
                                item.style.pointerEvents = 'none';
                                item.querySelector('input').disabled = true;
                            }
                        });
                    } else {
                        items.forEach(item => {
                            item.style.opacity = '1';
                            item.style.pointerEvents = 'auto';
                            item.querySelector('input').disabled = false;
                        });
                    }
                };
            });

            // 확인 버튼
            selector.querySelector('#vce-selector-ok').onclick = () => {
                const selected = Array.from(cbs).filter(c => c.checked).map(c => patterns[c.value]);
                if (selected.length === 0) return alert("패턴을 선택해주세요.");
                onConfirm(selected);
                selectorOverlay.remove();
            };

            // 취소 버튼
            selector.querySelector('#vce-selector-cancel').onclick = () => selectorOverlay.remove();

            // 오버레이 클릭 시 닫기 (선택사항)
            selectorOverlay.onclick = (e) => {
                if (e.target === selectorOverlay) selectorOverlay.remove();
            };
            // 내부 클릭 시 전파 방지
            selector.onclick = (e) => e.stopPropagation();
        }


        /**
 * @param {string} templateRealCode - DB에 있던 실제 예시 (예: "55T38-600v")
 * @param {object} pattern - codes에서 가져온 규칙 {prefix, displayCode, suffix}
 * @param {number} newNum - 생성할 번호 (예: 1)
 */
        /**
         * @param {string} templateRealCode - 실제 DB 예시 (예: "55T38-600v")
         * @param {string} displayCode - 기준점 (예: "T38")
         * @param {number} newNum - 새 번호 (예: 1)
         */
        function generateByDisplayCode(templateRealCode, displayCode, newNum) {
            if (!templateRealCode || !displayCode) return templateRealCode;

            const dIdx = templateRealCode.indexOf(displayCode);
            if (dIdx === -1) return templateRealCode; // displayCode가 없으면 변환 불가

            // 1. displayCode를 기준으로 앞(Head)과 뒤(Remainder)를 나눕니다.
            const head = templateRealCode.substring(0, dIdx); // 예: "55"
            const remainder = templateRealCode.substring(dIdx + displayCode.length); // 예: "-600v"

            // 2. remainder에서 첫 번째로 등장하는 숫자 뭉치를 찾습니다.
            const match = remainder.match(/\d+/);
            if (!match) {
                // 숫자가 없다면 displayCode 뒤에 그냥 번호를 붙여서 반환 (최후의 수단)
                return `${head}${displayCode}${String(newNum).padStart(3, '0')}`;
            }

            const originalNumStr = match[0]; // "600"
            const numIdx = match.index;      // 숫자 시작 위치
            const padLen = originalNumStr.length; // 원본 자리수 (3)

            // 3. 숫자 앞부분(기호 등)과 뒷부분(접미사 등)을 나눕니다.
            const midSymbol = remainder.substring(0, numIdx); // 예: "-"
            const tail = remainder.substring(numIdx + originalNumStr.length); // 예: "v"

            // 4. 새 숫자 패딩
            const newNumStr = String(newNum).padStart(padLen, '0');

            // 5. 최종 조립: [실제앞부분] + [displayCode] + [기호] + [새숫자] + [실제뒷부분]
            return `${head}${displayCode}${midSymbol}${newNumStr}${tail}`;
        }


        async function performGenerate() {
            const val = queryInput.value.trim();
            const match = val.match(/^([A-Z0-9-]+)\s+(\d+)-(\d+)$/i);
            if (!match) return alert("입력 형식이 올바르지 않습니다. (예: T38 001-100)");

            const [_, queryCode, startStr, endStr] = match;
            const startNum = parseInt(startStr);
            const endNum = parseInt(endStr);

            if (isNaN(startNum) || isNaN(endNum)) return alert("입력 형식이 올바르지 않습니다.");
            if (startNum > endNum) return alert("시작번호가 끝번호 보다 큽니다.");

            const db = await VceDB.open();

            // 1. codes 스토어에서 검색된 모든 패턴 가져오기
            const allPatterns = await new Promise(r => {
                db.transaction("codes", "readonly").objectStore("codes").getAll().onsuccess = e => {
                    const filtered = e.target.result.filter(c =>
                        c.displayCode.toUpperCase().includes(queryCode.toUpperCase())
                    );
                    r(filtered);
                };
            });

            if (allPatterns.length === 0) return alert("등록된 패턴이 없습니다.");

            // 2. 패턴 선택 UI 생성 및 표시
            showPatternSelector(allPatterns, async (selectedPatterns) => {
                if (selectedPatterns.length === 0) return;

                const existingMeta = await new Promise(r => {
                    db.transaction("imageMeta", "readonly").objectStore("imageMeta").getAll().onsuccess = e => {
                        r(e.target.result || []);
                    };
                });

                const generatedResults = [];
                const getMetaLists = new Set();

                for (const pattern of selectedPatterns) {
                    const { id, prefix, padLen, suffix, makerLabel, displayCode, contentId: baseContentId } = pattern;

                    const targetItem = existingMeta.find(m =>
                        m.uniqueKey === id && m.realCode && m.realCode.includes(displayCode) && m.metaStatus === 'SUCCESS'
                    );

                    // 값이 있을 때만 템플릿 생성 로직 실행

                    for (let i = startNum; i <= endNum; i++) {
                        const currentNumStr = String(i).padStart(padLen, '0');
                        const expectedcontentId = `${prefix}${displayCode.toLowerCase()}${currentNumStr}${suffix}`.toLowerCase();
                        const foundItem = existingMeta.find(m => expectedcontentId === m.contentId && m.metaStatus === 'SUCCESS');
                        const expectedRealCode = targetItem
                            ? generateByDisplayCode(targetItem.realCode, displayCode, i)
                            : `${displayCode}-${String(i).padStart(3, '0')}`; // 데이터 없으면 기본 포맷


                        if (foundItem) {
                            generatedResults.push(foundItem);
                        } else {
                            getMetaLists.add({
                                key: id,
                                id: expectedcontentId,
                                makerLabel
                            });
                            generatedResults.push({
                                displayCode: displayCode,
                                realCode: expectedRealCode,
                                makerLabel: '',
                                title: `[생성예정]`,
                                contentId: expectedcontentId,
                            });
                        }
                    }
                }

                // 결과 반영 (중복 제거 포함)
                allResults = Array.from(new Map(generatedResults.map(item => [item.realCode, item])).values());
                currentPage = 1;
                renderTable();
                startJob(getMetaLists);
            });
        }


        function renderTable() {
            // renderTable 상단에 추가하면 좋습니다.
            const container = document.querySelector('.vce-table-container');
            if (container) {
                container.scrollTop = 0; // 페이지 변경 시 스크롤을 맨 위로 올림
            }
            const tbody = document.getElementById('vce-table-body');
            tbody.innerHTML = '';
            const start = (currentPage - 1) * itemsPerPage;
            allResults.slice(start, start + itemsPerPage).forEach(item => {
                const tr = document.createElement('tr');
                if (!item.url) {
                    tr.className = 'vce-row-virtual';
                    tr.style.opacity = '.25';
                }
                tr.setAttribute('data-id', item.contentId);
                tr.innerHTML = `
                <td style="text-align:center;"><input type="checkbox" class="vce-row-cb" data-key="${item.url}" style="margin-left:5px; width:12px; height:12px; cursor:pointer; accent-color:#00FF41; appearance:auto;"></td>
                <td style="white-space:nowrap;">${item.makerLabel || ''}</td>
                <td style="color:#00FF41; font-family:monospace;white-space:nowrap;">${item.realCode || ''}</td>
                <td>${item.title || ''}</td>
                <td style="white-space:nowrap;">${item.label || ''}</td>
                <td>${item.cast || ''}</td>
                <td style="white-space:nowrap; text-align: center;">${item.releaseDate || ''}</td>
                <td style="white-space:nowrap; text-align: center;">${item.resolution ? `<a class="vce-preview" href="${item.url}" target="_blank">${item.resolution.W}x${item.resolution.H}</a>` : ''}</td>                
                <td syle="white-space:nowrap; text-align: center;"><button class="delete-btn"
            data-key="${item.url}" 
            style="display: flex; opacity: 0; background:none; border:none; color:#aaa; cursor:pointer; align-items:center; padding:0 5px;">
        ${refreshIcon}
    </button>
    </td>                
            `;
                tbody.appendChild(tr);
                tr.querySelector('.vce-row-cb').addEventListener('click', (e) => {
                    e.stopPropagation(); // 🔥 body / row 이벤트 차단
                });
                const deleteBtn = tr.querySelector('.delete-btn');
                deleteBtn.addEventListener('click', async (e) => {
                    e.stopPropagation(); // 🔥 body 이벤트 차단                    
                    const button = e.target.closest('.delete-btn');
                    if (!button) return;
                    const key = button.getAttribute('data-key');
                    if (confirm(`${item.realCode || ''} 항목을 삭제하시겠습니까?`)) {
                        console.log(`${key} 삭제`);
                        await VceDB.delete('imageMeta', key); // IndexedDB 삭제                        
                        const findIndex = allResults.findIndex((item) => item.url === key);
                        if (findIndex > -1) {
                            allResults.splice(findIndex, 1);
                        }
                        tr.remove();
                    }

                });
            });
            renderPaging();
        }


        let container = null;
        let preview = null;
        function renderPreview() {
            container = document.querySelector('.vce-table-container');

            preview = document.createElement('img');
            preview.style.position = 'absolute';
            preview.style.top = '50%';
            preview.style.left = '50%';
            preview.style.transform = 'translate(-50%, -50%)';
            preview.style.maxWidth = '80%';
            preview.style.maxHeight = '80%';
            preview.style.display = 'none';
            preview.style.zIndex = '999';

            container.appendChild(preview);

            window.addEventListener('scroll', () => {
                preview.style.display = 'none';
            });

        }

        renderPreview();

        // hover 이벤트
        container.addEventListener('mouseover', (e) => {
            const a = e.target.closest('a');
            if (!a || !container.contains(a)) return;

            const href = a.href + '?f=webp';

            preview.src = href;
            preview.style.transition = 'opacity 0.2s';
            preview.style.opacity = '0';

            preview.style.display = 'block';
            requestAnimationFrame(() => {
                preview.style.opacity = '1';
            });

            a.addEventListener('mouseleave', () => {
                preview.style.display = 'none';
            }, { once: true });
        });


        /**
         * @param {string} id - 작업 중인 항목의 uniqueKey (또는 id)
         * @param {object} updates - 변경할 내용 (예: { metaStatus: 'SUCCESS', title: '완료됨' })
         */
        async function updateVirtualRow(id, updates) {
            //console.log(id, updates);
            // 1. 메모리 상의 데이터(allResults) 업데이트
            const { dbData, rawImage } = updates;
            const targetIndex = allResults.findIndex(item => item.contentId === id);
            //console.log(targetIndex, allResults.length, updates);

            if (targetIndex !== -1) {
                // 기존 데이터에 새로운 변경사항 덮어쓰기
                const hasMeta = await VceDB.get('imageMeta', rawImage);
                //console.log(hasMeta);
                if (hasMeta) {
                    allResults[targetIndex] = { ...allResults[targetIndex], ...hasMeta };
                    //console.log(allResults[targetIndex], hasMeta, allResults.length);
                    // 2. DOM(화면) 실시간 업데이트
                    // 전체 renderTable()을 호출하는 대신, 해당 ID를 가진 TR만 찾아 수정합니다.
                    const rowElement = document.querySelector(`tr[data-id="${id}"]`);
                    //console.log(rowElement);
                    if (rowElement) {
                        rowElement.innerHTML = `
                <td style="text-align:center;"><input type="checkbox" class="vce-row-cb" data-key="${hasMeta.url}" style="margin-left:5px; width:12px; height:12px; cursor:pointer; accent-color:#00FF41; appearance:auto;"></td>
                <td style="white-space:nowrap;">${hasMeta.makerLabel || ''}</td>
                <td style="color:#00FF41; font-family:monospace;white-space:nowrap;">${hasMeta.realCode || ''}</td>
                <td>${hasMeta.title || ''}</td>
                <td style="white-space:nowrap;">${hasMeta.label || ''}</td>
                <td>${hasMeta.cast || ''}</td>
                <td style="white-space:nowrap;">${hasMeta.releaseDate || ''}</td>
                <td style="white-space:nowrap;text-align: center;">${hasMeta.resolution ? `<a class="vce-preview" href="${hasMeta.url}" target="_blank">${hasMeta.resolution.W}x${hasMeta.resolution.H}</a>` : ''}</td>                
            `;
                        // 상태 열(Cell)을 찾아 텍스트와 스타일 변경
                        rowElement.classList.remove('vce-row-virtual');
                        rowElement.style.opacity = '1';

                    }
                }
            }
        }

        externalUpdateVirtualRow = updateVirtualRow;


        function renderPaging() {
            const bar = document.getElementById('vce-paging-bar');
            bar.innerHTML = '';
            const totalPage = Math.ceil(allResults.length / itemsPerPage);

            const pageStep = 3; // 현재 페이지 앞뒤로 보여줄 번호 개수

            // 버튼 생성 공통 함수
            const createBtn = (text, targetPage, active = false, disabled = false) => {
                const b = document.createElement('button');
                b.innerText = text;
                if (active) b.className = 'active';
                if (disabled) b.disabled = true;
                else b.onclick = () => { currentPage = targetPage; renderTable(); };
                return b;
            };

            // 1. [맨처음 <<], [이전 <]
            bar.appendChild(createBtn('<<', 1, false, currentPage === 1));
            bar.appendChild(createBtn('<', Math.max(1, currentPage - 1), false, currentPage === 1));

            // 2. 페이지 번호 (현재 페이지 기준 앞뒤 범위)
            let startPage = Math.max(1, currentPage - pageStep);
            let endPage = Math.min(totalPage, currentPage + pageStep);

            // 앞에 생략 기호 ...
            if (startPage > 2) {
                const dot = document.createElement('span');
                dot.innerText = '...';
                dot.style.margin = '0 5px';
                bar.appendChild(createBtn(`1`, Math.min(currentPage, 1), false, currentPage === 1));
                bar.appendChild(dot);
            }

            for (let i = startPage; i <= endPage; i++) {
                bar.appendChild(createBtn(i, i, i === currentPage));
            }

            // 뒤에 생략 기호 ...
            if (endPage < (totalPage - 1)) {
                const dot = document.createElement('span');
                dot.innerText = '...';
                dot.style.margin = '0 5px';
                bar.appendChild(dot);
                bar.appendChild(createBtn(`${totalPage}`, Math.max(totalPage, endPage), false, currentPage === totalPage));
            }

            // 3. [다음 >], [맨뒤로 >>]
            bar.appendChild(createBtn('>', Math.min(totalPage, currentPage + 1), false, currentPage === totalPage));
            bar.appendChild(createBtn('>>', totalPage, false, currentPage === totalPage));
            // renderTable 상단에 추가하면 좋습니다.
            const totalCountInfo = document.getElementById('vce-total-count');
            if (totalCountInfo) totalCountInfo.innerText = `총 ${allResults.length}건`;

        }

        // --- 버튼 이벤트들 ---
        document.getElementById('vce-btn-run-search').onclick = performSearch;
        document.getElementById('vce-btn-clear').onclick = () => { queryInput.value = ''; performSearch(); };
        document.getElementById('vce-sel-all').onclick = () => document.querySelectorAll('.vce-row-cb').forEach(c => c.checked = true);
        document.getElementById('vce-unsel-all').onclick = () => document.querySelectorAll('.vce-row-cb').forEach(c => c.checked = false);

        document.getElementById('vce-btn-imageZipexport').onclick = () => {
            if (allResults.length === 0) {
                alert("저장할 검색 결과가 없습니다.");
                return;
            }
            const data = allResults.filter(i => i.metaStatus === 'SUCCESS' && i.resolutionState === 'SUCCESS');
            const ZipFileName = queryInput.value ? `${queryInput.value.toUpperCase()}_${new Date().toISOString().slice(0, 10)}` : `Images_${new Date().toISOString().slice(0, 10)}`;
            // 보기 좋게 정렬 (패턴키 기준)
            data.sort((a, b) => (a.realCode || "").localeCompare(b.realCode || ""));

            const imagesDB = data.map(item => {
                const fileName = `${item.realCode} ${item.title}`;
                const limitedfileName = byteLengthOf(fileName, 240);
                const finalFileName = FilenameConvert(limitedfileName) + '.jpg';
                return {
                    src: item.url,
                    filename: finalFileName
                };
            });
            generateZIP(imagesDB, ZipFileName).then((e) => downloadPhotosWithRetry(e.DownloadImagesDB, e.ArchivesFileName));
        };

        document.getElementById('vce-btn-export').onclick = () => {
            const checked = Array.from(document.querySelectorAll('.vce-row-cb:checked')).map(c => c.getAttribute('data-key'));
            if (checked.length === 0) return alert("항목을 선택하세요.");
            const data = allResults.filter(i => checked.includes(String(i.url)));
            // 보기 좋게 정렬 (패턴키 기준)
            data.sort((a, b) => (a.realCode || "").localeCompare(b.realCode || ""));


            const displayData = data.map(item => {
                return {
                    メーカー: item.makerLabel,
                    メーカー品番: item.realCode,
                    제목: item.title,
                    レーベル: item.label || '',
                    出演者: item.cast || '',
                    商品発売日: item.releaseDate,
                    // resolution 객체를 "1920x1080" 형태의 문자열로 변환
                    해상도: item.resolution && item.resolution.W ? `${item.resolution.W}x${item.resolution.H}` : '',
                };
            });

            // 1. 새 워크북 생성
            const workbook = XLSX.utils.book_new();

            // 2. JSON 데이터를 시트로 변환
            const worksheet = XLSX.utils.json_to_sheet(displayData);

            // 3. 워크북에 시트 추가
            XLSX.utils.book_append_sheet(workbook, worksheet, "DataSheet");

            // 4. 파일 다운로드 (파일명: exported_data.xlsx)
            XLSX.writeFile(workbook, "exported_data.xlsx");
        };
        document.getElementById('vce-btn-allexport').onclick = async () => {
            if (allResults.length === 0) {
                alert("저장할 검색 결과가 없습니다.");
                return;
            }
            // 보기 좋게 정렬 (패턴키 기준)
            allResults.sort((a, b) => (a.realCode || "").localeCompare(b.realCode || ""));


            const displayData = allResults.map(item => {
                return {
                    メーカー: item.makerLabel,
                    メーカー品番: item.realCode,
                    제목: item.title,
                    レーベル: item.label || '',
                    出演者: item.cast || '',
                    商品発売日: item.releaseDate,
                    // resolution 객체를 "1920x1080" 형태의 문자열로 변환
                    해상도: item.resolution && item.resolution.W ? `${item.resolution.W}x${item.resolution.H}` : '',
                };
            });

            // 1. 새 워크북 생성
            const workbook = XLSX.utils.book_new();

            // 2. JSON 데이터를 시트로 변환
            const worksheet = XLSX.utils.json_to_sheet(displayData);

            // 3. 워크북에 시트 추가
            XLSX.utils.book_append_sheet(workbook, worksheet, "DataSheet");

            // 4. 파일 다운로드 (파일명: exported_data.xlsx)
            XLSX.writeFile(workbook, "exported_data.xlsx");
        };
        document.getElementById('vce-btn-allDBExport').onclick = () => {
            exportFullBackup();
        };
        document.getElementById('vce-btn-allDBImport').onclick = () => {
            importFullBackup();
        };

        document.getElementById('vce-close-x').onclick = () => {
            modal.style.display = 'none';
            overlay.style.display = 'none';
        };


        // 2. 크기 변경 감지 (너비만 저장)
        const resizer = new ResizeObserver(entries => {
            for (let entry of entries) {
                const { width } = entry.contentRect;
                if (width > 800) {
                    GM_setValue(STORAGE_KEY, JSON.stringify({ width }));
                }
            }
        });
        resizer.observe(modal);


        const icon = document.createElement('div');
        icon.id = 'vce-search-icon';
        icon.innerHTML = '🔍';
        document.body.appendChild(icon);
        icon.addEventListener('click', (e) => {
            e.stopPropagation(); // 🔥 body / row 이벤트 차단
            window.openVceExplorer();
        });



        let sortState = { column: null, asc: true };

        function sortResults(column) {
            if (sortState.column === column) {
                sortState.asc = !sortState.asc;
            } else {
                sortState.column = column;
                sortState.asc = true;
            }

            allResults.sort((a, b) => {
                let valA, valB;

                // --- 해상도(W) 특수 정렬 로직 ---
                if (column === 'resolution.W') {
                    valA = (a.resolution && a.resolution.W) ? parseInt(a.resolution.W) : 0;
                    valB = (b.resolution && b.resolution.W) ? parseInt(b.resolution.W) : 0;
                } else {
                    // 일반적인 컬럼들
                    valA = a[column] || "";
                    valB = b[column] || "";
                }

                // 숫자 비교 (해상도는 숫자로 비교하는 게 정확합니다)
                if (typeof valA === 'number' && typeof valB === 'number') {
                    return sortState.asc ? valA - valB : valB - valA;
                }

                // 문자열 비교 (그 외)
                valA = String(valA).toLowerCase();
                valB = String(valB).toLowerCase();
                return sortState.asc
                    ? valA.localeCompare(valB, undefined, { numeric: true })
                    : valB.localeCompare(valA, undefined, { numeric: true });
            });

            //currentPage = 1;
            renderTable();
        }

        modal.querySelectorAll('th.sortable').forEach(th => {
            th.onclick = () => {
                const column = th.getAttribute('data-col');
                sortResults(column);

                // 시각적 피드백: 모든 헤더에서 active 제거 후 현재 헤더에 표시
                modal.querySelectorAll('th.sortable').forEach(el => el.style.color = "");
                th.style.color = "#00FF41";
            };
        });


        // 아이콘 클릭 시 열기 (기존 아이콘 코드에 연결)
        window.openVceExplorer = () => {
            if (modal.style.display === 'flex') return;
            modal.style.display = 'flex';
            overlay.style.display = 'block';
            performSearch();
        };

        document.querySelector('#vce-query').focus();
    }


    function runOnceAWeek(taskName, callback) {
        const lastRun = localStorage.getItem(taskName); // 저장된 마지막 실행 시간 가져오기
        const now = new Date().getTime(); // 현재 시간 (밀리초 단위)

        // 일주일을 밀리초로 계산: 7일 * 24시간 * 60분 * 60초 * 1000밀리초
        const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;

        // 기록이 없거나(null), 현재 시간과 차이가 일주일 이상일 때
        if (!lastRun || (now - lastRun) > ONE_WEEK) {
            callback(); // 전달받은 함수 실행
            localStorage.setItem(taskName, now); // 실행한 시간을 로컬스토리지에 업데이트
            console.log(`${taskName} 실행 완료: 다음 실행은 일주일 뒤입니다.`);
        } else {
            const daysLeft = Math.ceil((ONE_WEEK - (now - lastRun)) / (1000 * 60 * 60 * 24));
            console.log(`${taskName}은(는) 이미 실행되었습니다. 약 ${daysLeft}일 후에 다시 실행됩니다.`);
        }
    }


    let isRunning = false;
    let workerDMMWindow = null;
    


    /*********************************************************
     * 공통 유틸
     *********************************************************/

    function isDMMWorker() {
        return window.name === 'wokerDMMWin';
    }

    
    async function startJob(data) {

        let taskQueue = [];
        let contentId = null;

        
        let isProcessing = false; // 중복 실행 방지 플래그

        if (isRunning) {
            isRunning = false;
            workerDMMWindow?.close();
            workerDMMWindow = null;
            updateProcessingFANZADIGITAL(taskQueue.length, '');
            return;
        }

        const origin = (url) => new URL(url).origin;
        let popupOrigin;
        const parentOrigin = origin(window.location.href);
        GM_setValue('parentOrigin', parentOrigin);
        isRunning = true;



        // CASE A: 빈 값 (null, undefined, '') -> 전체 리스트 반환
        if (!data || (typeof data === 'string' && data.trim() === '')) {
            console.log("모드: 전체 리스트 작업");
            const allTask = await VceDB.getSchedulableTasks('imageMeta', 'meta');
            taskQueue = allTask.map(e => {
                return {
                    key: e.uniqueKey,
                    id: e.contentId,
                    makerLabel
                };
            });
        }

        // CASE B: 작업 리스트가 들어온 경우 (Set 또는 Array)        
        if (data instanceof Set || Array.isArray(data)) {
            console.log("모드: 전달받은 특정 리스트 내에서만 작업");
            data.forEach(e => {
                // taskQueue에 넣을 형식으로 객체 구성                
                taskQueue.push(e);
            });
        }

        // CASE C: 특정 문자열(평문)이 들어온 경우 -> 검색 필터링
        if (typeof data === 'string') {
            console.log(`모드: '${data}' 필터링 작업`);
            const allTasks = await VceDB.getSchedulableTasks('imageMeta', 'meta');
            taskQueue = allTasks.filter(e => e.displayCode && e.displayCode.includes(data.toUpperCase()))
                .map(e => {
                    return {
                        key: e.uniqueKey,
                        id: e.contentId,
                        makerLabel
                    };
                });;

        }

        console.log('총 작업:', taskQueue.length);

        if (taskQueue.length === 0) {
            console.log('작업 없음');
            isRunning = false;
            return;
        }


        console.log('[VCE] Parent mode');

        
        function ensureWorker(windowName, url) {
            if (!workerDMMWindow || workerDMMWindow.closed) {
                workerDMMWindow = window.open(url, windowName, 'width=600, height=300');
                popupOrigin = origin(url);
                GM_setValue('popupOrigin', popupOrigin);
                return workerDMMWindow; // 새로 열렸을 때
            } else {
                workerDMMWindow.postMessage({
                    type: 'MOVE_TASK',
                    url,
                }, origin(url));
            }
            window.addEventListener('beforeunload', () => {
                workerDMMWindow?.close();
                workerDMMWindow = null;
            });
            return workerDMMWindow; // 기존 창 재사용
        }

        
        async function assignNext() {
            if (isProcessing) return;
            isProcessing = true; // 락(Lock) 설정           

            try {
                if (taskQueue.length === 0) {
                    console.log('모든 작업 완료');
                    isRunning = false;
                    workerDMMWindow?.close();
                    workerDMMWindow = null;
                    updateProcessingFANZADIGITAL(taskQueue.length, '');
                    GM_deleteValue('WORK_TASK');
                    return;
                }
                
                const task = taskQueue.shift();
                //const pathSegments = task.url.split('/');
                //const contentId = pathSegments[pathSegments.length - 2];
                const [displayCode, prefix, padLen, suffix] = task.key.split('|');
                //console.log(displayCode, prefix, padLen, suffix, Number(padLen) === 5);
                contentId = task.id;
                GM_setValue('WORK_TASK', task);
                let workerUrl;
                if (Number(padLen) === 5 && makerLabel !== 'Prestige') {
                    workerUrl = `https://video.dmm.co.jp/av/content/?id=${contentId}`;
                }
                updateProcessingFANZADIGITAL(taskQueue.length, contentId);
                //console.log(workerWin, workerUrl, contentId, taskQueue);
                if (workerUrl) {
                    workerDMMWindow = ensureWorker('wokerDMMWin', workerUrl);
                    /*
                    workerWin.postMessage({
                        type: 'MOVE_TASK',
                        url: workerUrl,
                    }, origin(workerUrl));
                    */
                } else {
                    await trySelf(parentOrigin);
                }
            } finally {
                isProcessing = false; // 작업 지시 후 플래그 해제
            }
        }

        async function trySelf(parentOrigin) {
            const startTime = performance.now();
            const { key, id } = GM_getValue('WORK_TASK');
            const DMMR_KEY = virtualKeyMaker(key, id, 'DMMR');
            const DMM_KEY = virtualKeyMaker(key, id, 'DMM');
            const AVWIKIS_KEY = virtualKeyMaker(key, id, 'AVWIKIS');
            const AVWIKIL_KEY = virtualKeyMaker(key, id, 'AVWIKIL');
            const JAVBUS_KEY = virtualKeyMaker(key, id, 'JAVBUS');
            const searchUrls = [
                `https://www.dmm.co.jp/rental/ppr/-/detail/=/cid=${DMMR_KEY}/`,
                `https://www.dmm.co.jp/mono/dvd/-/detail/=/cid=${DMM_KEY}/`,
                `https://av-wiki.net/${AVWIKIS_KEY}/`,
                `https://av-wiki.net/${AVWIKIL_KEY}/`,
                `https://www.javbus.com/ja/${JAVBUS_KEY}`
            ];
            const filtersUrls = searchUrls.filter(u => getClearBad(u));

            let success = false;

            for (const searchUrl of filtersUrls) {
                let targetSite;
                if (searchUrl.startsWith('https://av-wiki.net/')) {
                    targetSite = 'AVWiki';
                } else if (searchUrl.startsWith('https://www.dmm.co.jp/rental/')) {
                    targetSite = 'DMMR';
                } else if (searchUrl.startsWith('https://www.dmm.co.jp/mono/')) {
                    targetSite = 'DMM';
                } else if (searchUrl.startsWith('https://www.javbus.com')) {
                    targetSite = 'JavBus';
                }

                const e = await siteConfigs[targetSite].addDB(searchUrl);

                const { rawImage, work, dbData, reason } = e || {};

                console.log('[VCE] 작업 완료', e.work, searchUrl);

                const endTime = performance.now();
                const executionTime = `${endTime - startTime} ms`;
                const send = `${work} ${reason ? reason : ''} -> ${executionTime}`;

                if (work === 'SUCCESS') {
                    externalUpdateVirtualRow(id, {
                        isVirtual: false,      // 이제 실제 데이터가 됨
                        rawImage,
                    });
                    success = true;
                    break; // ✅ 정상 동작                                        
                }
            }

            isProcessing = false;
            assignNext();

        }




        window.addEventListener('message', async (e) => {
            if (!/dmm\.co\.jp/.test(e.origin)) return;
            const { type, rawImage, work, dbData, contentId } = e.data || {};
            if (type === 'TASK_DONE') {
                console.log('완료:', e.data);
                if (work === 'SUCCESS' && rawImage) {
                    await VceDB.save("imageMeta", rawImage, dbData);
                    externalUpdateVirtualRow(contentId, {
                        isVirtual: false,      // 이제 실제 데이터가 됨
                        rawImage,
                        dbData
                    });
                    isProcessing = false;
                    assignNext();
                } else if (work === 'ALL FAILED') {
                    isProcessing = false;
                    assignNext();
                } else {
                    isProcessing = false;
                    assignNext();
                }

            } else if (type === 'TASK_FAIL') {
                console.log('실패:', e.data);
            }
        });
        if (/video\.dmm\.co.jp/.test(location.href)) {
            workerDMMWindow = ensureWorker('wokerDMMWin', location.origin);
        } else {
            assignNext();
        }

    };



    /*********************************************************
     * 부모 (컨트롤러)
     *********************************************************/



    async function checkTable(waitTime, guard = 0) {
        const config = siteConfigs['FANZA_DIGITAL'];
        if (!config) return false;

        if (guard > waitTime) {
            console.log('[Auto] guard 종료');
            return false; // 시간 초과 시 false 반환
        };
        const NotFound = document.querySelector('main div div h1');
        if (NotFound && NotFound?.textContent === '404Not Found') {
            return NotFound?.textContent;
        }
        const infoArea = document.querySelector(config.InfoSelector);
        if (infoArea) {
            //console.log(infoArea);
            return true; // 요소를 찾으면 true 반환
        } else {
            await sleep(1000);
            // ★ 중요: 반드시 return을 붙여야 하위 재귀의 결과를 상위로 전달합니다.
            return await checkTable(waitTime, guard + 1000);
        }
    }

    /*********************************************************
     * 워커 (자식탭)
     *********************************************************/
    async function runWorker() {
        console.log('[VCE] Worker mode');

        const startTime = performance.now();
        const origin = (url) => new URL(url).origin;
        const currentPage = PageURL();

        const parentOrigin = GM_getValue('parentOrigin');

        async function tryOther(startTime, parentOrigin) {
            const { key, id } = GM_getValue('WORK_TASK');
            const DMMR_KEY = virtualKeyMaker(key, id, 'DMMR');
            const DMM_KEY = virtualKeyMaker(key, id, 'DMM');
            const AVWIKIS_KEY = virtualKeyMaker(key, id, 'AVWIKIS');
            const AVWIKIL_KEY = virtualKeyMaker(key, id, 'AVWIKIL');
            const JAVBUS_KEY = virtualKeyMaker(key, id, 'JAVBUS');
            const searchUrls = [
                `https://www.dmm.co.jp/rental/ppr/-/detail/=/cid=${DMMR_KEY}/`,
                `https://www.dmm.co.jp/mono/dvd/-/detail/=/cid=${DMM_KEY}/`,
                `https://av-wiki.net/${AVWIKIS_KEY}/`,
                `https://av-wiki.net/${AVWIKIL_KEY}/`,
                `https://www.javbus.com/ja/${JAVBUS_KEY}`
            ];
            const filtersUrls = searchUrls.filter(u => getClearBad(u));

            let success = false;

            for (const searchUrl of filtersUrls) {
                let targetSite;
                if (searchUrl.startsWith('https://av-wiki.net/')) {
                    targetSite = 'AVWiki';
                } else if (searchUrl.startsWith('https://www.dmm.co.jp/rental/')) {
                    targetSite = 'DMMR';
                } else if (searchUrl.startsWith('https://www.dmm.co.jp/mono/')) {
                    targetSite = 'DMM';
                } else if (searchUrl.startsWith('https://www.javbus.com')) {
                    targetSite = 'JavBus';
                }

                const e = await siteConfigs[targetSite].addDB(searchUrl);

                const { rawImage, work, dbData, reason } = e || {};

                console.log('[VCE] 작업 완료', e.work, searchUrl);

                const endTime = performance.now();
                const executionTime = `${endTime - startTime} ms`;
                const send = `${work} ${reason ? reason : ''} -> ${executionTime}`;

                if (work === 'SUCCESS') {
                    window.opener.postMessage({
                        type: 'TASK_DONE',
                        rawImage,
                        contentId: id,
                        workUrl: searchUrl,
                        work,
                        result: send,
                        dbData
                    }, parentOrigin);
                    success = true;
                    break; // ✅ 정상 동작                                        
                } else {
                    window.opener.postMessage({
                        type: 'TASK_FAIL',
                        rawImage: null,
                        workUrl: searchUrl,
                        result: send
                    }, parentOrigin);
                }
            }
            if (!success) {
                const endTime = performance.now();
                const executionTime = `${endTime - startTime} ms`;
                const send = `All FAILED Time -> ${executionTime}`;
                window.opener.postMessage({
                    type: 'TASK_DONE',
                    rawImage: null,
                    work: 'ALL FAILED',
                    result: send
                }, parentOrigin);
            }
        }


        async function requestTask() {
            if (/エラーが発生しました/gm.test(document.body.textContent)) {
                await sleep(20000);
                location.reload(true);
            }


            if (/^https:\/\/video\.dmm\.co\.jp\/$/.test(location.href)) {
                window.opener.postMessage({
                    type: 'TASK_DONE',
                    url: location.href,
                    result: 'Main Page'
                }, parentOrigin);
            } else {
                const config = siteConfigs['FANZA_DIGITAL'];
                const contentId = GetParam(location.href, 'id').toLowerCase();
                if (config) {
                    const waitTime = Math.max(getRandomDelay(), getRandomDelay()) + Math.min(getRandomDelay(), getRandomDelay());
                    const found = await checkTable(waitTime);
                    const contentId = GetParam(location.href, 'id').toLowerCase();
                    if (found === '404Not Found') {
                        await tryOther(startTime, parentOrigin);
                    } else if (found) {
                        const url = location.href;
                        config.addDB().then(async (e) => {
                            const { rawImage, work, dbData, reason } = e || {};
                            console.log('[VCE] 작업 완료', work, location.href);
                            const endTime = performance.now();
                            const executionTime = `${endTime - startTime} ms`;
                            await sleep(1000);
                            const send = `${work} ${reason ? reason : ''} -> ${executionTime}`;
                            if (work === 'SUCCESS') {
                                window.opener.postMessage({
                                    type: 'TASK_DONE',
                                    rawImage,
                                    workUrl: location.href,
                                    work,
                                    contentId,
                                    result: send,
                                    dbData
                                }, parentOrigin);
                            } else {
                                window.opener.postMessage({
                                    type: 'TASK_DONE',
                                    rawImage: null,
                                    workUrl: location.href,
                                    result: send
                                }, parentOrigin);
                            }

                        });
                    } else {
                        await tryOther(startTime, parentOrigin);
                    }
                }
            }
        }
        /******** 메시지 수신 ********/
        window.addEventListener('message', async (e) => {
            if (!/dmm\.co\.jp/.test(e.origin)) return;
            const { type, url, result, ID } = e.data || {};
            if (type === 'MOVE_TASK') {
                console.log('[VCE] 이동:', url);
                //location.href = url;
                const a = document.createElement('a');
                a.href = url;
                a.click();
            }
        });

        /******** 초기 진입 ********/

        requestTask();
    }

    initializeMakerMap();

    function setClearBad(url) {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        // 만료 시간 기록
        const data = {
            expires: tomorrow.getTime() // ms 단위 timestamp
        };

        localStorage.setItem(url, JSON.stringify(data));
    }

    function getClearBad(url) {
        const raw = localStorage.getItem(url);
        if (!raw) return url;

        try {
            const data = JSON.parse(raw);
            if (!data.expires) return url;
            else if (Date.now() > data.expires) {
                // 만료되었으면 삭제 후 null 반환
                localStorage.removeItem(url);
                return url;
            }
            return null;
        } catch {
            return null;
        }
    }


    if (isDMMWorker()) {
        runWorker();
    } else {
        if (/javlibrary/.test(location.href)) {
            return;
        }
        FontAwesomeCSS();
        runOnceAWeek('weekly_update_updateUniqueKey', updateUniqueKey);
        collectAndProcess();
        searchVCE();
    }

})();