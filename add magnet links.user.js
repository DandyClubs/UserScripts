// ==UserScript==
// @name        Torrent Sites - add magnet links
// @namespace   DandyClubs
// @version     2025.09.11
// @description Adds a column with magnet links in lists (multi-site support)
// @author      DandyClubs
// @license     MIT
// @include     https://xxxclub.to/torrents/*
// @include     https://therarbg.com/get-posts/*
// @grant       GM_addStyle
// @grant       GM_setClipboard
// @grant       GM_xmlhttpRequest
// @run-at      document-end
// @require     https://raw.githubusercontent.com/DandyClubs/RootDomain/main/RootDomain.js
// ==/UserScript==




const commonStyle = `
.DBCenterBox {
    top: 5px;     
    position: absolute;
    max-width: max-content;    
    font-style: initial !important;
    text-align: center;    
    border-radius: .25em !important;
    -webkit-box-sizing: border-box !important;
    box-sizing: border-box !important;
    background-color: rgba(0,0,0,0.5) !important;
    display: flex;
	flex-wrap: nowrap;
	justify-content: center;
	align-items: center;
    z-index: 9999;
}

.DBCenterBox .DownButton, .DBCenterBox .UpButton {
    text-align: center;
    cursor: pointer;
    color: LimeGreen !important;
    padding: .25em !important;
    background-color:transparent !important;
}

.DBCenterBox .State {
    display: inline-block;    
    transform: scale(0.5);
    font-weight: bold;
    text-align: right;
    vertical-align: middle;
    font-family: 'Noto Sans', sans-serif !important;
    font-style: italic !important;
    max-width: 12ch;
    color: WhiteSmoke !important;
    background-color:transparent !important;
}
`

const therarbgStyle = `
	main.container, div.container {
		max-width: 1600px;		
	}

    .container, .container-lg, .container-md, .container-sm, .container-xl, .container-xxl {
	    max-width: 1600px;
    }
	.GetMagnet {
		font-size: 13px;
		color: dodgerblue !important;
	}
    .visited {
        color: Orange !important;
    }
	table td.dl-buttons {
		padding-left: 2.5px;
		padding-right: 2.5px;
		text-align: center !important;
		position: relative;
		display: table-cell !important; /* proper height of cell on multiple row torrent name */
		width: 3%;
	}

	td.dl-buttons > a,
	td.dl-buttons > a:hover,	
	td.dl-buttons > a:link,
	td.dl-buttons > a:active {
		color: inherit;
		text-decoration: none;
		cursor: pointer;
		display: inline-block !important;
		/* margin: 0 1.5px; */
		margin: 0 2px;
	}

	table > thead > tr > th:nth-child(3),
	table > thead > tr > td:nth-child(3) {
		text-align: center;
	}

`;


const xxxclubStyle = `

	main.container, div.container {
		max-width: 1600px;
	}

    .container, .container-lg, .container-md, .container-sm, .container-xl, .container-xxl {
	    max-width: 1600px;
    }
	.GetMagnet, .GetTitle {
		font-size: 13px;
		color: dodgerblue !important;
        cursor: pointer;
	}
    .visited {
        color: Orange !important;
    }

	ul > li > span:nth-child(3) {
		text-align: center;
	}

`;


class MagnetManagerDB {
    constructor() {
        this.dbName = 'MagnetManager';
        this.storeName = 'MagnetStore';
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {            
            const request = indexedDB.open(this.dbName, 3);

            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                // 스토어가 없다면 새로 만들고 인덱스를 생성합니다.
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'S' });
                    store.createIndex('dateIndex', 'D', { unique: false });
                }
                // 스토어는 있지만 인덱스가 없는 경우, 즉 기존에 있던 DB에 인덱스를 추가해야 하는 경우
                else {
                    const store = request.transaction.objectStore(this.storeName);
                    if (!store.indexNames.contains('dateIndex')) {
                        store.createIndex('dateIndex', 'D', { unique: false });
                    }
                }
            };

            request.onsuccess = (e) => {
                this.db = e.target.result;
                resolve();
            };

            request.onerror = (e) => reject(e.target.error);
        });
    }

    async add(S, M, D) {
        return this._tx('readwrite', store => store.put({ S: S, M: M, D: D }));
    }

    async remove(S) {
        // 짧은 URL을 키로 사용하여 삭제합니다.
        return this._tx('readwrite', store => store.delete(S));
    }

    async get(S) {
        // 짧은 URL을 키로 사용하여 특정 데이터를 가져옵니다.
        return this._tx('readonly', store => store.get(S));
    }

    async getAll() {
        // 모든 저장된 데이터를 배열로 가져옵니다.
        return this._tx('readonly', store => store.getAll());
    }

    async getAllKeys() {
        return this._tx('readonly', store => store.getAllKeys());
    }

    async getOldData(days) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([this.storeName], 'readonly');
            const store = tx.objectStore(this.storeName);

            // 'dateIndex' 인덱스를 사용합니다.
            const index = store.index('dateIndex');

            const oneDay = 1000 * 60 * 60 * 24;
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);

            // IndexedDB 키 범위(IDBKeyRange)를 사용하여 특정 날짜 이전의 데이터만 가져옵니다.
            // `upperBound`는 지정된 값보다 작은 모든 키를 포함합니다.
            const range = IDBKeyRange.upperBound(cutoffDate.toISOString().slice(0, 10));

            const request = index.getAll(range);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async downloadDB() {
        // 모든 데이터를 가져옵니다.
        const allData = await this.getAll();

        // 데이터를 JSON 문자열로 변환합니다.
        const jsonString = JSON.stringify(allData, null, 2);

        // JSON 문자열을 Blob 객체로 만듭니다.
        const blob = new Blob([jsonString], { type: 'application/json' });

        // Blob 객체를 위한 URL을 생성합니다.
        const url = URL.createObjectURL(blob);

        // 다운로드를 위한 <a> 태그를 생성합니다.
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.dbName}_backup.json`; // 파일 이름 설정
        document.body.appendChild(a);

        // 클릭 이벤트를 트리거하여 파일을 다운로드합니다.
        a.click();

        // 불필요한 DOM 요소를 정리하고 URL을 해제합니다.
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return true;
    }

    async uploadDB(file) {
        if (!file) {
            throw new Error("파일이 선택되지 않았습니다.");
        }

        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = async (event) => {
                try {
                    // 파일 내용을 JSON으로 파싱합니다.
                    const data = JSON.parse(event.target.result);

                    if (!Array.isArray(data)) {
                        throw new Error("파일 형식이 올바르지 않습니다. 배열이 아닙니다.");
                    }

                    // 트랜잭션을 시작합니다.
                    const tx = this.db.transaction([this.storeName], 'readwrite');
                    const store = tx.objectStore(this.storeName);

                    // 데이터를 순회하며 DB에 저장합니다.
                    for (const item of data) {
                        // put을 사용하여 기존 데이터가 있다면 덮어씁니다.
                        store.put(item);
                    }

                    tx.oncomplete = () => {
                        console.log('데이터가 성공적으로 업로드되었습니다.');
                        resolve(true);
                    };

                    tx.onerror = (e) => reject(e.target.error);

                } catch (e) {
                    reject(e);
                }
            };

            reader.onerror = (e) => reject(e.target.error);

            // 파일을 텍스트로 읽습니다.
            reader.readAsText(file);
        });
    }

    async _tx(mode, action) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([this.storeName], mode);
            const store = tx.objectStore(this.storeName);
            const request = action(store);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
}



const magnetManager = new MagnetManagerDB();

/* ----------------------------
   Site Configurations
----------------------------- */
const siteConfigs = {
    "xxxclub.to": {
        tableSelector: "div.browsetableinside",
        cellSelectorInitial: "ul > li > span:nth-child(2)",
        cellSelectorNew: "ul > li > span:nth-child(3)",
        insertHeadersCellsInitial: (cell, index, title) => cell.insertAdjacentHTML('afterend', (index === 0 ? `<span>${title}</span>` : `<span>${title}</span>`)),
        getKey: (cell) => cell.querySelector('a[href*="/torrents/details/"]').textContent,
        getHref: (cell) => cell.querySelector('a[href*="/torrents/details/"]').href,
        extractMagnet: (doc) => doc.querySelector('div.detailsdescr ul li.downloadboxlist span a.mg-link[href^="magnet:"]'),
        hasTitleCopy: true,
        style: xxxclubStyle,        
        makeIconSelector: "div.page-header",
    },
    "therarbg.com": {
        tableSelector: "div.row.p-1",
        cellSelectorInitial: `table > thead > tr:not(.blank) > th:nth-child(2),
                          table > tbody > tr:not(.blank) > td:nth-child(2)`,
        cellSelectorNew: `table > thead > tr:not(.blank) > th:nth-child(3),
                      table > tbody > tr:not(.blank) > td:nth-child(3)`,
        insertHeadersCellsInitial: (cell, index, title) => cell.insertAdjacentHTML('afterend', (index === 0 ? `<th>${title}</th>` : `<td>${title}</td>`)),
        getKey: (cell, href, RootDomain) => href.match(new RegExp(RootDomain + '(.*)')).pop(),
        getHref: (cell) => cell.querySelector('a').href,
        extractMagnet: (doc) => doc.querySelector('div.table-responsive a[href^="magnet:"]'),
        hasTitleCopy: false,
        style: therarbgStyle,
        makeIconSelector: "body.postBody",
        
    }
}

/* ----------------------------
   Common Utilities
----------------------------- */
function FontAwesomeCSS() {
    let css = document.createElement('link')
    css.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css'
    css.rel = 'stylesheet'
    css.type = 'text/css'
    document.head.appendChild(css)
}


function AddStyles(CSS, ID) {
    let styleSheet = document.createElement("style")
    styleSheet.textContent = CSS
    styleSheet.id = ID
    document.head.appendChild(styleSheet)
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function updateClipboard(CopyData) {
    try {
        navigator.clipboard.writeText(CopyData)
    } catch {
        GM_setClipboard(CopyData)
    }
}

/* ----------------------------
   Main Script
----------------------------- */
const PageURL = location.href
const RootDomain = extractRootDomain(PageURL)
const config = siteConfigs[RootDomain]

if (!config) return  // not supported site


let JobList = []
let isProcessing = false;


function setClearList(name, value) {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    // 현재 시간과 내일 00:00:00 사이의 차이를 초 단위로 계산
    const diffInSeconds = Math.floor((tomorrow - now) / 1000);

    // Max-Age를 사용하여 쿠키 생성    
    document.cookie = `${name}=${value}; max-age=${diffInSeconds}; domain=${RootDomain}; path=/;`
}

function getCookie(name) {
    let cookie = document.cookie;
    if (document.cookie != "") {
        let cookie_array = cookie.split("; ");
        for (var index in cookie_array) {
            var cookie_name = cookie_array[index].split("=")
            if (cookie_name[0] == name) {
                return cookie_name[1];
            }
        }
    }
    return null;
}


async function checkClear() {
    const cookieCheck = getCookie("ClearList");

    if (!cookieCheck || cookieCheck !== "Y") {
        // cleanup old keys
        // 180일이 지난 데이터를 가져옵니다.
        const oldData = await magnetManager.getOldData(180);

        for (const data of oldData) {
            magnetManager.remove(data.S);
        }
        setClearList("ClearList", "Y");
    }
}


function appendColumn() {
    const tables = document.querySelectorAll(config.tableSelector)
    const title = 'ML'

    tables.forEach((table) => {
        const headersCellsInitial = table.querySelectorAll(config.cellSelectorInitial)
        headersCellsInitial.forEach((cell, index) => {
            config.insertHeadersCellsInitial(cell, index, title)
        })

        const headersCellsNew = table.querySelectorAll(config.cellSelectorNew)
        headersCellsNew.forEach(async (cell, index) => {
            cell.classList.add('hideCell');
            let MagnetLink = '';
            if (index === 0) {
                cell.innerHTML = title
            } else {
                let url = config.getHref(headersCellsInitial[index])
                let Key = config.getKey(headersCellsInitial[index], url, RootDomain)
                const stored = await magnetManager.get(Key);
                if (stored?.M && typeof stored.M === "object" && Object.keys(stored.M).length === 0) {
                    await magnetManager.remove(Key);
                    return;
                }
                if (stored) {
                    MagnetLink = stored.M;
                }

                cell.classList.add('dl-buttons')
                cell.innerHTML = `
          ${config.hasTitleCopy ? `<span><i class="GetTitle fa-solid fa-paste" data-key="${Key}"></i></span>` : ""}
          <span><a class="GetMagnet fa-solid fa-magnet ${MagnetLink ? 'visited' : 'not-processed'}" data-key="${Key}" data-url="${url}" href="${MagnetLink ? MagnetLink : '#unprocessed'}" title="ML"></a></span>`

                if (MagnetLink) {
                    cell.querySelector('.GetMagnet').style.setProperty('color', 'Orange', 'important')
                }

                if (config.hasTitleCopy) {
                    cell.querySelector('.GetTitle').addEventListener('click', (event) => {
                        updateClipboard(Key.replace(/(\[|\(|\d+p).*/i, '').trim())
                        event.target.style.setProperty('color', 'Orange', 'important')
                    })
                }
            }
        })
    })
}

/* ----------------------------
   Request Handler (fetch → GM_xmlhttpRequest)
----------------------------- */
async function requestPage(tLink) {
    try {
        return await fetch(tLink).then(r => {
            if (!r.ok) throw new Error("fetch failed")
            return r.text()
        })
    } catch {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: tLink,
                responseType: "text",
                onload: (resp) => resp.status === 200 ? resolve(resp.responseText) : reject(resp),
                onerror: reject
            })
        })
    }
}

async function processJob(el) {
    let check = el.classList.contains('not-processed')
    if (!check) return

    let tLink = el.getAttribute('data-url')
    let responseText
    try {
        responseText = await requestPage(tLink)
    } catch (e) {
        console.log("request failed, retry later", e)
        return
    }

    let container = document.implementation.createHTMLDocument().documentElement
    container.innerHTML = responseText
    let retrievedLink = config.extractMagnet(container)?.href;

    if (retrievedLink) {
        let Key = el.getAttribute('data-key')
        if (retrievedLink && typeof retrievedLink === "string" && retrievedLink.trim()) {
            await magnetManager.add(Key, retrievedLink, new Date().toISOString().slice(0, 10))
        }
        el.setAttribute('href', retrievedLink)
        el.classList.add('visited')
        el.classList.remove('not-processed')
        el.style.setProperty('color', 'Orange', 'important')
        el.removeEventListener('click', GetMagnet, false);
        el.click()
        JobList = JobList.filter(job => job.el !== el)   // ✅ 정상 응답일 때만 제거
    }
}


const beforeUnloadHandler = (event) => {
    if (JobList.length) {
        event.preventDefault();
        console.log('JobList is not Empty!', JobList.length)
        // Included for legacy support, e.g. Chrome/Edge < 119
        event.returnValue = true;
    }
    else {
        window.removeEventListener("beforeunload", beforeUnloadHandler);
    }
};

window.addEventListener("beforeunload", beforeUnloadHandler)

async function jobWorker() {
    if (isProcessing) return;
    isProcessing = true;

    while (true) {
        // Find the first pending job that hasn't exceeded its retry limit
        const jobIndex = JobList.findIndex(job => job.status === 'pending' && job.retries < 1)
        const failedJobIndex = JobList.findIndex(job => job.status === 'failed' && job.retries === 1);

        if (jobIndex === -1 && failedJobIndex === -1) {
            // No more pending jobs to process
            isProcessing = false;
            break;
        }

        const job = JobList[jobIndex];
        const el = job.el;

        try {
            await processJob(el);
            job.status = 'completed'; // Mark as completed on success

        } catch (e) {
            console.error("Failed to process job:", e);
            job.retries += 1; // Increment the retry count
            if (job.retries >= 1) {
                job.status = 'failed'; // Mark as failed after one retry
            }
        }

        await sleep(2000); // Wait between requests
    }

    isProcessing = false;
}


function GetMagnet(event) {
    event.preventDefault();
    const link = this; // 'this' refers to the element the listener is on.
    if (!JobList.some(job => job.el === link)) {
        // Add a new job object to the list
        JobList.push({
            el: link,
            status: 'pending',
            retries: 0
        });

        jobWorker(); // Start the worker
    }
}


function addClickListeners(links) {
    links.forEach((link) => {
        link.addEventListener('click', GetMagnet, false)
    });
}

async function createColumn() {
    appendColumn()
    addClickListeners(document.querySelectorAll('a.GetMagnet.not-processed'))
}

function getDefaultFontSize() {
    const element = document.createElement('div');
    element.style.width = '1rem';
    element.style.position = 'absolute'; // ensure no layout impact
    element.style.visibility = 'hidden'; // keep invisible but measurable
    element.style.height = '0';          // no height needed
    document.body.appendChild(element);

    const widthStr = window.getComputedStyle(element).width;
    const widthMatch = widthStr.match(/[\d.]+/); // allow decimals

    element.remove();

    if (!widthMatch) return null;

    const result = parseFloat(widthMatch[0]);
    return isNaN(result) ? null : result;
}


function getFixedElementPosition(element) {
    const rect = element.getBoundingClientRect();

    return {
        top: rect.top,    // Already relative to viewport
        left: rect.left,  // No scroll position needed
        bottom: rect.bottom,
        right: rect.right,
        // Include useful additional information
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth,
        isFullyVisible: (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= window.innerHeight &&
            rect.right <= window.innerWidth
        )
    };
}

async function MakeIcon() {
    let GetDPI = window.devicePixelRatio;
    let DefaultFontSize = getDefaultFontSize();
    console.log('GetDPI:', GetDPI, 'DefaultFontSize:', DefaultFontSize);
    if (!document.querySelector("div.DBCenterBox")) {
        // Create wrapper
        const boxHTML = `
            <div class="DBCenterBox" style="max-width: max-content; visibility:hidden;">
                <i class="DownButton fa-solid fa-file-arrow-down"></i>                
                <i class="UpButton fa-solid fa-file-arrow-up"></i>
                <i class="State"></i>
            </div>`;
        document.body.insertAdjacentHTML('afterbegin', boxHTML);

        const centerBox = document.querySelector('.DBCenterBox');
        centerBox.style.setProperty('font-size', ((1 / (GetDPI / 1.5)) * (16 / DefaultFontSize)) + 'rem', 'important');

        // Position it relative to header
        const adjustPosition = () => {
            GetDPI = window.devicePixelRatio;
            DefaultFontSize = getDefaultFontSize();
            const header = document.querySelector(config.makeIconSelector);
            const position = getFixedElementPosition(header);            
            const xOffset = position.left + header.offsetWidth - centerBox.offsetWidth * 2 - 16;
            centerBox.style.left = `${xOffset}px`;
            centerBox.style.setProperty('font-size', ((1 / (GetDPI / 1.5)) * (16 / DefaultFontSize)) + 'rem', 'important');
        };

        adjustPosition();
        window.addEventListener("resize", adjustPosition);

        centerBox.style.visibility = "visible";

        // Set counter value
        const stateCounter = centerBox.querySelector('.State');
        stateCounter.textContent = await magnetManager.getAllKeys().then(keys => keys.length || 0);

        // Handle download
        centerBox.querySelector(".DownButton").addEventListener('click', async () => {
            await magnetManager.downloadDB();
        });

        // Handle upload
        centerBox.querySelector(".UpButton").addEventListener('click', () => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "application/json";

            input.addEventListener('change', async (e) => {
                try {
                    await magnetManager.uploadDB(e.target.files[0]);
                    alert('백업 파일이 성공적으로 로드되었습니다!');
                } catch (e) {
                    alert('백업 파일 로드에 실패했습니다: ' + e.message);
                }                
                input.remove();
                stateCounter.textContent = await magnetManager.getAllKeys().then(keys => keys.length || 0);
            });
            input.click();
        });
    }
}



/* ----------------------------
   Run
----------------------------- */

(async () => {
    // init() 메서드를 먼저 실행해야 합니다.
    await magnetManager.init();
    checkClear();
    FontAwesomeCSS();
    AddStyles(commonStyle, commonStyle);
    AddStyles(config.style, config.style);    
    MakeIcon();
    createColumn();
})();

