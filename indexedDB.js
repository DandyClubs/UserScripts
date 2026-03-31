// ==UserScript==
// @name         VideoCode & MetaData Extractor IndexedDB 고도화 5.0
// @namespace    http://tampermonkey.net/
// @version      5.1
// @description  개수 표시 + IndexedDB 고도화
// @author       DancyClubs
// @match        https://video.dmm.co.jp/av/list/?maker=*
// @match        https://video.dmm.co.jp/av/maker/*
// @match        https://www.dmm.co.jp/mono/dvd/-/detail/=/cid=*
// @match        https://video.dmm.co.jp/av/content/?id=*
// @resource     MAKER_MAP https://raw.githubusercontent.com/DandyClubs/CopyLinksCommonJS/main/DMM_MakerMap_2026-03-26.json
// @require      https://raw.githubusercontent.com/DandyClubs/RootDomain/main/RootDomain.js
// @require      https://cdn.jsdelivr.net/npm/sweetalert2@11.26.24/dist/sweetalert2.all.min.js
// @require      https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js
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
    let statusEl = null;

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

        static async getAllData(storeName) {
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


        static async getSchedulableTasks(storeName) {
            const db = await this.open();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(storeName, "readwrite");
                const store = tx.objectStore(storeName);
                const request = store.getAll();

                request.onsuccess = (e) => {
                    const tasksToRun = e.target.result.filter(task => !task.metaStatus !== 'SUCCESS' || task.resolutionmetaStatus !== 'SUCCESS');
                    tx.oncomplete = () => resolve(tasksToRun);
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

    function findIdsByName(map, targetName, mode = 'id') {
        const resultIds = [];

        // Map의 [key, value] 쌍을 순회합니다.
        for (const [id, data] of map.entries()) {
            // original이나 final 중 하나라도 targetName과 같다면 id를 추가
            if (mode === 'id' && data.original === targetName || data.final === targetName) {
                return id;
            } else if (mode === 'final' && data.final === targetName) {
                return data.final;
            }
        }
        return null;
    }


    const siteConfigs = {
        DMM: {
            ContentIdBuilder: (data) => {
                const full = NumberFormatter.pad(data.number, data.padLen);   // 00001
                const short = NumberFormatter.trimAndMinPad(data.number, 3); // 001

                const prefix = data.displayCode.split('-')[0].toLowerCase();

                return [
                    `${prefix}${full}`,   // 정식
                    `${prefix}${short}`   // fallback
                ];
            },
            buildUrls: async (meta) => {
                const data = await getCodeData(meta);
                if (!data) return [];

                const searchCodes = siteConfigs.DMM.ContentIdBuilder(data);
                return searchCodes.map(cid =>
                    `https://www.dmm.co.jp/mono/dvd/-/detail/=/cid=${cid}/`
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
        },
        FANZA_DIGITAL: {
            addDB: async () => {
                const imageEl = document.querySelector('div.grid div.flex a picture source');
                if (imageEl) {
                    const url = imageEl.closest('a')?.href;
                    if (url) {
                        const cleanUrl = url.split('?')[0];
                        const existingMeta = await VceDB.get('imageMeta', cleanUrl);
                        if (existingMeta && existingMeta.sourceSite === 'FANZA_DIGITAL') return;
                        imageEl.classList.add(PROCESSED_CLASS);
                        const parse = createPostProcessor(siteConfigs['FANZA_DIGITAL']);
                        const result = parse(document.body);
                        if (!result || !result.realCode) return;
                        if (result.makerLabel) {
                            const makerLabelCode = findIdsByName(makerMap, result.makerLabel, 'id');
                            if (makerLabelCode) processWork(cleanUrl, '2D', makerLabelCode, result.makerLabel);
                            await sleep(1000);
                            const existingMeta = await VceDB.get('imageMeta', cleanUrl);
                            if (existingMeta) {
                                let metaData = {};
                                if (result) {
                                    metaData = {
                                        ...result,
                                        sourceSite: 'FANZA_DIGITAL',
                                        metaStatus: 'SUCCESS'
                                    };
                                    await VceDB.save("imageMeta", cleanUrl, metaData);
                                }
                            }
                        }
                    }
                }
            },
            rawImageDownloader: () => {
                const imageEl = document.querySelector('div.grid div.flex a picture source');
                if (imageEl) {
                    document.addEventListener('click', (e) => {
                        e.preventDefault();
                        const CoverDownload = e.target.closest('.CoverDownload');
                        if (CoverDownload) {                            
                            const parse = createPostProcessor(siteConfigs['FANZA_DIGITAL']);
                            const result = parse(document.body);
                            if (!result || !result.realCode) return;
                            const fileName = `${result.realCode} ${result.title}`;
                            const limitedfileName = byteLengthOf(fileName, 240);
                            let finalFileName = FilenameConvert(limitedfileName);
                            const url = imageEl.closest('a')?.href;
                            if (url) {
                                const cleanUrl = url.split('?')[0];
                                const output = Object.entries(result).map(([key, value]) => `${key}: ${value}`).join('\n').replace(/^,/gm, '');
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

            ContentIdBuilder: (data) => {
                const full = NumberFormatter.pad(data.number, data.padLen);   // 00001
                const short = NumberFormatter.trimAndMinPad(data.number, 3); // 001

                const prefix = data.displayCode.split('-')[0].toLowerCase();

                return [
                    `${prefix}${full}`,   // 정식
                    `${prefix}${short}`   // fallback
                ];
            },
            buildUrls: async (meta) => {
                const data = await getCodeData(meta);
                if (!data) return [];

                const searchCodes = siteConfigs.DMM.ContentIdBuilder(data);
                return searchCodes.map(cid =>
                    `https://www.dmm.co.jp/mono/dvd/-/detail/=/cid=${cid}/`
                );
            },
            titleSelector: 'h1.font-bold.text-2xl.inline.text-base',
            InfoSelector: 'table.text-xs.shrink.table-fixed',
            realCodeKeys: ['メーカー品番'],
            seriesKeys: ['シリーズ'],
            labelKeys: ['レーベル'],
            castKeys: ['出演者'],
            releaseDateKeys: ['商品発売日'],
            makerLabel: ['メーカー'],
        },
        AVWiki: {
            ContentIdBuilder: (data) => {
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
            titleSelector: 'div.article-header h1.entry-title',
            InfoSelector: 'section.article-body dl.dltable',
            realCodeKeys: ['メーカー品番'],
            seriesKeys: ['シリーズ'],
            labelKeys: ['レーベル'],
            castKeys: ['AV女優名'],
            releaseDateKeys: ['配信開始日'],
            makerLabel: ['メーカー'],
        },
    };


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
        toDisplay(code) {
            if (!code) return '';

            const match = code.match(/^([a-zA-Z]+)(\d+)([a-zA-Z]*)$/);
            if (!match) return code.toUpperCase();

            return `${match[1].toUpperCase()}-${match[2]}${match[3].toLowerCase()}`;
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
            displayCode: codeData.displayCode,
            number,
            padLen: codeData.padLen,
            suffix: codeData.suffix || ''
        };
    }

    const ParserUtils = {
        buildTableMap(root) {
            const map = {};

            // -------------------------
            // 1. table 구조 (tr)
            // -------------------------
            root.querySelectorAll('tr').forEach(tr => {
                const cells = tr.querySelectorAll('th, td');
                if (cells.length >= 2) {
                    const key = cells[0].innerText.replace('：', '').trim();
                    const valueEl = cells[1];
                    map[key] = valueEl;
                }
            });

            // -------------------------
            // 2. dl 구조 (dt/dd)
            // -------------------------
            root.querySelectorAll('dt').forEach(dt => {
                const dd = dt.nextElementSibling;

                if (dd && dd.tagName.toLowerCase() === 'dd') {
                    const key = dt.innerText.trim();
                    map[key] = dd;
                }
            });
            return map;
        },

        cleanText(el) {
            if (!el) return '';

            return el.innerHTML
                .replace(/<[^>]*>/gi, ' ')
                .replace(/▼すべて表示する.+/, '')
                .replace(/\s+/g, ' ')
                .trim();
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

            if (result.releaseDate) {
                result.releaseDate = result.releaseDate.replace(/[\/\-_]/g, '.');
            }
            if (result.realCode) {
                result.realCode = CodeNormalizer.toDisplay(result.realCode);
            }
            // series 없으면 label fallback
            if (!result.series && result.label) {
                result.series = result.label;
            }

            return result;
        }
    };


    const createPostProcessor = (config) => {
        return (doc) => {
            const table = doc.querySelector(config.InfoSelector);
            if (!table) return null;

            const map = ParserUtils.buildTableMap(table);

            const metaData = {
                title: doc.querySelector(config.titleSelector)?.innerText.trim() || '',
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

                    if (res.status !== 200) {
                        localStorage.setItem(`404_${url}`, res.status);
                        console.log(`[${siteName}] → ${url} ${res.status}`);
                        return resolve(null);
                    }

                    const doc = new DOMParser()
                        .parseFromString(res.responseText, "text/html");

                    const config = siteConfigs[siteName];
                    const parse = createPostProcessor(config);

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
        const siteOrder = ['AVWiki', 'DMM'];
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

    function fetchImageResolution(url) {
        // 1. URL 확장자를 통해 필요한 바이트 크기 미리 계산
        const getExpectedRange = (url) => {
            const cleanUrl = url.split('?')[0];
            const lowerUrl = cleanUrl.toLowerCase();
            if (url.endsWith('f=webp')) {
                return "0-5000"; // WebP는 약 5KB 정도
            } else if (lowerUrl.endsWith('.png') || lowerUrl.endsWith('.gif')) {
                return "0-1000"; // PNG/GIF는 1KB면 충분함
            } else if (lowerUrl.endsWith('.jpg') || lowerUrl.endsWith('.jpeg')) {
                return "0-20000"; // JPEG나 알 수 없는 경우 20KB
            } else if (lowerUrl.endsWith('.webp')) {
                return "0-5000"; // WebP는 약 5KB 정도
            }
        };

        const targetRange = getExpectedRange(url + "?f=webp");

        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: url + "?f=webp",
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


    let isResProcessing = false;
    let isMetaProcessing = false;
    const requestMetaMap = new Map();
    const requestResMap = new Map();


    async function addToQueue(task) {
        const existingMeta = await VceDB.get('imageMeta', task.url);

        if (!requestMetaMap.has(task.url) && existingMeta.metaStatus !== 'SUCCESS') {
            requestMetaMap.set(task.url, task);
            if (!isMetaProcessing) doMeta();
        }

        if (!requestResMap.has(task.url) && existingMeta.resolutionState !== 'SUCCESS') {
            requestResMap.set(task.url, task);
            if (!isResProcessing) doRes();
        }
    }

    async function doMeta() {
        isMetaProcessing = true;

        while (requestMetaMap.size > 0) {
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


            if (meta.makerLabel) {
                meta.makerLabel = findIdsByName(makerMap, meta.makerLabel, 'final') || meta.makerLabel;
            }

            let metaData = {};
            if (meta) {
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

        while (requestResMap.size > 0) {
            const firstKey = requestResMap.keys().next().value;
            const task = requestResMap.get(firstKey);
            requestResMap.delete(firstKey);

            updateProcessingStatus(requestMetaMap.size, requestResMap.size);

            const res = await fetchImageResolution(task.url);
            let resData;
            if (res && res.width > 0) {
                resData = {
                    resolution: { W: res.width, H: res.height },
                    resolutionState: 'SUCCESS'
                };
                await VceDB.save("imageMeta", task.url, resData);
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
                const tasksToRun = await VceDB.getSchedulableTasks('imageMeta');
                if (tasksToRun.length > 0) {
                    console.log(`${tasksToRun.length}개의 재시도 작업을 큐에 추가합니다.`);
                    for (const task of tasksToRun) {
                        await addToQueue({ url: task.url });
                    }
                }
            };
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
                await sleep(200);
            }
        }
    };

    const observer = new MutationObserver(mutCallback);

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

    let coverDownloadIcon = null;

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

        if (PageURL().startsWith('https://video.dmm.co.jp/av/content/?id=')) {
            const config = siteConfigs['FANZA_DIGITAL'];
            if (config) {
                config.addDB();
                if (coverDownloadIcon) coverDownloadIcon.remove();
                waitElement('div.flex.flex-col.relative.w-full');
            }
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

    async function processWork(sourceURL, rawMediaType, makerLabelCode, makerLabel) {

        if (!makerLabelCode || !rawMediaType || !makerLabel) return false;

        if (!sourceURL || !sourceURL.includes('https://awsimgsrc.dmm.co.jp/pics_dig/digital/video/')) return false;
        const cleanUrl = sourceURL.split('?')[0];

        const majorsLabel = /digital\/video\/(.*?)([a-z]{3,7}\d{4,7}|[ts]{1,2}\d{2,7})[v]?/i;
        if (!majorsLabel.test(cleanUrl)) return false;


        const skipPatterns = [
            /digital\/video\/yrnk([a-z]*)/, // yrnknkjdvaj yrnkmtndvaj스트리밍 dvaj
            /digital\/video\/\/td048.*dv\d+([a-z0-9]*?)\//, // td008dvaj0058, td048mtndv01598
            /digital\/video\/(h_[0-9]*?)([vpjg])(\d{3,})([a-z]*?)\//,
            /digital\/video\/\d+jdxa\d+/i,
        ];

        for (const skipRegex of skipPatterns) if (skipRegex.test(cleanUrl)) return false;

        const pathSegments = cleanUrl.split('/');
        const contentId = pathSegments[pathSegments.length - 2];
        const fileName = pathSegments.pop();
        const fileExtension = fileName.split('.').pop();
        const originalImage = cleanUrl.replace(fileName, `${contentId}pl.${fileExtension}`);

        // --- [섹션 2: 코드 DB 중복 체크] ---   
        const existingImage = await VceDB.get('imageMeta', originalImage);
        if (existingImage) return true;

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
            const prefix = match[1];
            const code = match[2].toUpperCase();
            const padLen = match[3].length;
            const suffix = match[4];
            const displayCode = code;
            const uniqueKey = `${displayCode}_${prefix}_${padLen}_${suffix}_${makerLabelCode}_${rawMediaType}`;


            // --- [섹션 1: 이미지 메타 처리] ---

            await VceDB.save("imageMeta", originalImage, {
                displayCode: displayCode, // Index  
                uniqueKey: uniqueKey, // Index             
                makerLabelCode: makerLabelCode,
                makerLabel: makerLabel,
                rawMediaType: rawMediaType,
                imageSource: originalImage,
                contentId: contentId, // Index
                //스케줄 작업으로 처리하는 값들
                title: '',
                realCode: '', // Index
                series: '', // 시리즈가 없거나 ---- 면 라벨
                label: '',
                cast: '',
                releaseDate: '',
                resolution: '', // 스케줄 작업으로 처리{W: 0, H: 0},                                 
                /** 메타 데이타
                const parser = new DOMParser();
                const doc = parser.parseFromString(res.responseText, "text/html");
                */
            });

            if (currentSessionCodes.has(uniqueKey)) return true;
            currentSessionCodes.add(uniqueKey);

            const existinguniqueKey = await VceDB.get('codes', uniqueKey);
            if (existinguniqueKey) return true;

            const imageSourceKey = Object.keys(imageUrlsMap).find(key =>
                originalImage.startsWith(imageUrlsMap[key])
            ) || "UNKNOWN";

            await VceDB.save("codes", uniqueKey, {
                displayCode: displayCode,
                imageSourceKey: imageSourceKey,
                imageSource: originalImage,
                contentId: contentId,
                prefix: prefix,
                padLen: padLen,
                suffix: suffix,
                makerLabelCode: makerLabelCode,
                makerLabel: makerLabel,
                rawMediaType: rawMediaType,
            });
            updateDisplayList();
            return true;
        }
        return false;
    }

    async function updateDisplayList(shouldScroll = false) {
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
            const idMatch = itemData.imageSource.match(/digital\/video\/([^\/]+)\//i);
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
                <div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1; cursor:help;" title="${itemData.imageSource}">
                <a href="${itemPageUrl}" target="_blank"><span style="color:#00FF41; font-family:monospace; font-size:12px;">${itemData.displayCode}</span></a>
                    ${detailLabel ? `<span style="color:white; font-size:10px; margin-left:5px;">[</span><span style="color:#00FF41; font-size:10px;">${detailLabel}</span><span style="color:white; font-size:10px;">]</span>` : ''}
                </div>
                <span style="color:white; font-size:10px;padding-left:5px;">[ ${itemData.rawMediaType} ]</span>
                <button class="reset-btn" style="background:none; border:none; color:#aaa; cursor:pointer; display:flex; align-items:center; padding:0 5px;">${refreshIcon}</button>
            `;

            row.querySelector('.item-check').onchange = updateCounts;

            // updateDisplayList 함수 내 반복문(items.forEach) 부분 수정
            row.querySelector('.reset-btn').onclick = async (e) => {
                const targetUrl = itemData.imageSource;
                const makerLabel = itemData.makerLabel;
                const makerLabelCode = itemData.makerLabelCode; // 상위 스코프 변수 활용
                const rawMediaType = itemData.rawMediaType;

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
                    await VceDB.delete('codes', key);
                    await VceDB.deleteAll('imageMeta', 'uniqueKey', key);
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


    async function startWithHighlight(type, highlightPairs) {
        const autoStatus = getState();
        const continuePage = GetParam(autoStatus.pendingPage, 'page') || 1;
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
                if (Number(continuePage) === 1 && !autoStatus.pendingPage) {
                    const pagination = document.querySelector('ul[data-e2eid="pagination"]');
                    if (!pagination) return false;
                    const firstPageLink = pagination.querySelector('li:nth-child(2) a');
                    swalConfig.title = '수집을 시작하시겠습니까?';
                    swalConfig.html = `<b>${continuePage}</b>페이지부터 <b>${lastP}</b>페이지까지 수집합니다.<br><br>페이지 표시 갯수(<b>${count}</b>)와 새로고침 여부를 확인하셨나요?<br><br>첫 페이지부터 다시 하려면 수집하기 버튼 옆 이어하기 초기화 아이콘을 클릭하세요!`;
                    swalConfig.confirmButtonText = '네, 시작합니다!';

                    // 확인 시 동작: 수집 로직 실행
                    swalConfig.preConfirm = () => {
                        if (firstPageLink) firstPageLink.click();
                        startAuto();
                        setState({ active: true });
                        toggleAutoRun();
                    };
                }
                if (Number(continuePage) >= Number(lastP)) {
                    // [상황 1] 현재 페이지가 제한 페이지보다 큰 경우 (재설정 필요)
                    swalConfig.title = '페이지 범위 오류';
                    swalConfig.html = `현재 페이지(<b>${continuePage}</b>)가 제한(<b>${lastP}</b>)보다 큽니다.<br><br><span style="color: #ff4d4d;">[${count}] 단위를 클릭하고 페이지를 새로고침 하시겠습니까?</span>`;
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
                    swalConfig.html = `<b>${continuePage}</b>페이지부터 <b>${lastP}</b>페이지까지 수집합니다.<br><br>페이지 표시 갯수(<b>${count}</b>)와 새로고침 여부를 확인하셨나요?<br><br>첫 페이지부터 다시 하려면 수집하기 버튼 옆 이어하기 초기화 아이콘을 클릭하세요!`;
                    swalConfig.confirmButtonText = '네, 시작합니다!';

                    // 확인 시 동작: 수집 로직 실행
                    swalConfig.preConfirm = () => {
                        startAuto();
                        setState({ active: true });
                        toggleAutoRun();
                    };
                }
            } else if (type === 'search-form') {
                swalConfig.title = '수집되지 않는 페이지';
                swalConfig.html = `<b>2D/VR에서 <a id="choicetype" href="https://video.dmm.co.jp/av/list/?maker=${makerLabelCode}&media_type=2d">2D</a>를 선택하세요.<br><br><span style="color: #ff4d4d;">페이지 표시 갯수를 120개로 설정하고<br>새로고침 F5를 클릭하세요!</span>`;
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
    function extraMakerMap() {
        const makerNodes = document.querySelectorAll('li a[href*="/av/list/?maker="] p.line-clamp-2.text-ellipsis');
        if (makerNodes.length === 0) {
            alert("저장할 메이커 데이터가 없습니다.");
            return;
        }
        makerNodes.forEach(node => {
            try {
                const link = node.closest('li a');
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

            if (!makerMap.has(id)) {
                const entry = makerMap.get(id);
                if (makerName !== entry.final) {
                    const newData = { original: label, final: makerName };
                    const currentLocal = GM_getValue(LOCAL_MAKER_KEY, {});
                    currentLocal[id] = newData;
                    GM_setValue(LOCAL_MAKER_KEY, currentLocal);
                    console.log(`[신규 메이커 저장] ${id}: ${makerlName}`);
                }
            }
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

    function createUI() {
        return new Promise((resolve) => {
            const panel = document.createElement('div');
            panel.classList.add('videocodeextractor');
            panel.style = "position:fixed; bottom:15px; right:15px; z-index:99999; display:flex !important; flex-direction:column; background:rgba(15,15,15,0.95); padding:8px; border-radius:12px; width:280px; border:1px solid #444; box-shadow:0 8px 32px rgba(0,0,0,0.5); color:white; font-family:sans-serif; box-sizing:border-box;";
            panel.innerHTML = `<div style='font-weight:bold; font-size:10px; margin-bottom:5px; text-align:center; color:#2196F3;'>DMM CODE TRACKER</div>`;

            statusEl = document.createElement('div');
            statusEl.id = 'vce-status-indicator';
            statusEl.style = `display: grid; justify-content: space-around; padding: 5px 10px; background: rgba(0,0,0,0.7); color: white; font-size: 12px; border-size: 12px; border-radius: 5px; z-index: 99999;`;

            panel.appendChild(statusEl);

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
            <div style="display:flex; align-items:center; gap:4px;">
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

                let queue = JSON.parse(GM_getValue("process_queue", "[]"));
                for (const cb of selected) {
                    const key = cb.dataset.key;
                    const item = await VceDB.get('codes', key);
                    if (item && !queue.some(q => q.url === item.origin)) {
                        queue.push({
                            url: item.origin,
                            maker: item.makerLabel,
                            makerCode: item.makerLabelCode,
                            type: item.rawMediaType
                        });
                        await VceDB.delete('codes', key);
                        await VceDB.deleteAll('imageMeta', 'uniqueKey', key);
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
                        await VceDB.delete('codes', key); // IndexedDB 삭제
                        await VceDB.deleteAll('imageMeta', 'uniqueKey', key);
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
            btnContainer.style = "display:grid; grid-template-columns: repeat(4,auto); gap:5px;";

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
            const resetBtn = document.createElement('button');
            resetBtn.innerText = "DB 리셋";
            resetBtn.style.cssText = `padding:4px; background-color: #ff4d4d; background:#F44336; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px; font-weight:bold;`;

            btnContainer.appendChild(dlBtn);
            btnContainer.appendChild(metaDlBtn);
            btnContainer.append(clBtn);
            btnContainer.appendChild(resetBtn);

            dlBtn.onclick = async () => {
                const db = await VceDB.open();
                const allItems = await new Promise(r => {
                    db.transaction("codes").objectStore("codes").getAll().onsuccess = e => r(e.target.result);
                });
                if (allItems.length === 0) return alert("데이터가 없습니다.");

                // 1. [1차 & 2차 정렬] 메이커와 품번으로 먼저 줄을 세웁니다.
                // 3차 정렬(기존 순번)은 삭제로 인해 신뢰할 수 없으므로, 등록 순서(timestamp)를 활용하는 것이 좋습니다.
                allItems.sort((a, b) => {
                    const makerA = a.makerLabel || "기타";
                    const makerB = b.makerLabel || "기타";
                    if (makerA !== makerB) return makerA.localeCompare(makerB, 'ja');

                    if (a.displayCode !== b.displayCode) return a.displayCode.localeCompare(b.displayCode);

                    // 같은 품번 내에서는 등록 순서(timestamp)대로 순번이 매겨지도록 정렬
                    return (a.timestamp || 0) - (b.timestamp || 0);
                });

                // 2. [핵심] 품번별로 현재 몇 번째인지 기억할 카운터 객체 (Map)
                const codeCounterMap = new Map();

                let output = "";
                let currentMaker = "";

                // 3. [데이터 순회 및 실시간 순번 부여]
                allItems.forEach(obj => {
                    const maker = obj.makerLabel || "기타";
                    const code = obj.displayCode;

                    // 메이커 구분선 출력
                    if (maker !== currentMaker) {
                        if (currentMaker !== "") output += "\n";
                        currentMaker = maker;
                        output += `// ${currentMaker}\n`;
                    }

                    // [중요] 해당 품번(code)이 전체에서 몇 번째로 등장했는지 계산
                    // 처음 등장하면 0, 두 번째면 1, 세 번째면 2... (메이커가 바뀌어도 유지됨)
                    let currentSeq = codeCounterMap.get(code) || 0;
                    codeCounterMap.set(code, currentSeq + 1);

                    // 출력용 데이터 복사 및 마지막 인덱스에 순번 주입
                    const exportData = [...obj.data];
                    exportData[exportData.length - 1] = currentSeq;

                    output += `"${code}": ${JSON.stringify(exportData)},\n`;
                });

                // 4. [다운로드 처리]
                const blob = new Blob([output], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `Codes_${new Date().toISOString().slice(0, 10)}.txt`;
                link.click();
                URL.revokeObjectURL(url);
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
                        메이커: item.makerLabel,
                        코드: item.displayCode,
                        실제코드: item.realCode,
                        시리즈: (item.series === '' || item.series === '----') ? item.label : item.series,
                        배우: item.cast || '정보없음',
                        출시일: item.releaseDate,
                        // resolution 객체를 "1920x1080" 형태의 문자열로 변환
                        해상도: item.resolution && item.resolution.W ? `${item.resolution.W}x${item.resolution.H}` : '계산중',
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
                    updateDisplayList();
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


            const autoContainer = document.createElement('div');
            autoContainer.style = "display: flex; gap:5px;";

            // 수동 수집 버튼 추가
            if (/video\.dmm\.co\.jp\/av\/list\/\?maker=\d+/.test(PageURL())) {
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
                        } else {
                            btnStop.innerText = `수집 작업 중... ${s && s > 0 ? s + 's' : ""}`;
                        }
                    }
                };
                btnAutoRun.onclick = () => {
                    if (/video\.dmm\.co\.jp\/av\/list\/\?maker=\d+&media_type=/.test(PageURL())) {
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
                    if (/video\.dmm\.co\.jp\/av\/list\/\?maker=\d+&media_type=/.test(PageURL())) {
                        setState({ active: false, pendingPage: PageURL() });
                    } else {
                        setState({ active: false });
                    }
                    btnStop.innerText = "수집 정지 됨";
                };
            }

            panel.appendChild(autoContainer);


            if (/video\.dmm\.co\.jp\/av\/maker\//.test(PageURL())) {
                const mapContainer = document.createElement('div');
                mapContainer.style = "display:flex; gap:5px;";

                const extraBtn = document.createElement('button');
                extraBtn.innerText = "메이커 맵 수집";
                extraBtn.style = "flex:1;margin-top:5px; padding:5px; background:#2196F3; color:white; border:none; border-radius:4px; cursor:pointer; font-size:11px;";
                extraBtn.onclick = extraMakerMap;

                const saveBtn = document.createElement('button');
                saveBtn.innerText = "메이커 맵 저장";
                saveBtn.style = "flex:1;margin-top:5px; padding:5px; background:#2196F3; color:white; border:none; border-radius:4px; cursor:pointer; font-size:11px;";
                saveBtn.onclick = saveMakerMapToFile;

                mapContainer.append(extraBtn, saveBtn);
                panel.appendChild(mapContainer);
            }


            document.body.appendChild(panel);
            updateDisplayList();
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
        return Math.floor(Math.random() * (10000 - 5000 + 1)) + 5000;
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

            setState({
                active: false,
                pendingPage: null
            });
            VCE.updateResetButton();

            return false;
        }
    }

    function startAuto() {
        const maker = getMaker();
        const lockName = `vc_${maker}`;

        navigator.locks.request(
            lockName,
            { ifAvailable: true },
            async lock => {
                if (!lock) {
                    console.log('[Lock] 다른 탭 실행 중');
                    return;
                }

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

                console.log('[Lock] 해제');
            }
        );
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
        return new Promise((resolve, reject) => {
            const element = targetNode.querySelector(selector);

            if (element) {
                const mainVideo = document.querySelector(selector);
                if (mainVideo) {
                    if (coverDownloadIcon) coverDownloadIcon.remove();
                    coverDownloadIcon = document.createElement('div');
                    coverDownloadIcon.classList.add('CoverDownload', 'fa-regular', 'fa-image');
                    coverDownloadIcon.style = `color: dodgerblue !important; bottom: 0; right: 0;`;
                    mainVideo.appendChild(coverDownloadIcon);
                    config.rawImageDownloader();
                }
                resolve(element);
            } else {
                const observer = new MutationObserver((mutations, obs) => {
                    const found = targetNode.querySelector(selector);
                    if (found) {
                        const mainVideo = document.querySelector(selector);
                        if (mainVideo) {
                            if (coverDownloadIcon) coverDownloadIcon.remove();
                            coverDownloadIcon = document.createElement('div');
                            coverDownloadIcon.classList.add('CoverDownload', 'fa-regular', 'fa-image');
                            coverDownloadIcon.style = `color: dodgerblue !important; bottom: 0; right: 0;`;
                            mainVideo.appendChild(coverDownloadIcon);
                            config.rawImageDownloader();
                        }
                        obs.disconnect();
                        resolve(found);
                    }
                });

                observer.observe(targetNode, {
                    childList: true,
                    subtree: true
                });
            }
        });
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
        FontAwesomeCSS();
        initializeMakerMap();
        await sleep(2000);
        const autoStatus = getState();
        if (autoStatus.active) {
            if (/video\.dmm\.co\.jp\/av\/list\/\?maker=\d+$/.test(PageURL())) {
                startPage = 1;
                window.location.href = UpdateParam(PageURL(), 'media_type', '2d');
            }
        }
        await createUI();

        if (/video\.dmm\.co\.jp\/av\/list\/\?maker=\d+&media_type=/.test(PageURL())) {
            mutCallback();
            observer.observe(document.body, { childList: true, subtree: true });
            if (autoStatus.active) {
                startAuto();
            }
        }

        if (PageURL().startsWith('https://video.dmm.co.jp/av/content/?id=')) {
            const config = siteConfigs['FANZA_DIGITAL'];
            if (config) {
                config.addDB();
                await sleep(1000);
                waitElement('div.flex.flex-col.relative.w-full');
            }
        }

        refreshQueueButton();
        updateProcessingStatus();
    }


    if (document.readyState === 'complete') {
        collectAndProcess();
    } else {
        window.addEventListener('load', async () => {
            collectAndProcess();
        });
    }
})();