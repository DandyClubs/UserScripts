// ==UserScript==
// @name         AutoClick (Refactored)
// @version      2025.10.01
// @description  Auto actions and cross-window messaging with maintainable structure
// @author       DandyClubs
// @include      /^https?:\/\/(cosplayjav|nylons)\.pl\/(download|thumbnails)\/\?forPost=.*$/
// @include      http://www.ex745.com/*
// @include      http://www.xc745.com/*
// @include      http://www.365shares.net/storage/*
// @include      https://newsteez.com/blog/?link=*
// @include      https://newsteez.com/?go=*
// @include      https://imgmffmv.sbs/*
// @include      https://sehuatang.net/*
// @include      https://www.terabox.com/*/sharing/*
// @include      https://www.1024tera.com/*/sharing/*
// @include      https://www.terabox.app/*/sharing/*
// @include      https://allasiangirls.net/*
// @include      https://themezon.net/*
// @include      https://shrinkme.*/*
// @include      https://bestgirlsexy.com/*
// @include      https://en.mrproblogger.com/*
// @include      https://misskon.com/*
// @include      https://www.mediafire.com/file/*
// @include      https://www.mediafire.com/folder/*
// @include      https://www.mediafire.com/error.php*
// @include      https://www.mediafire.com/download_repair.php*
// @include      https://ouo.io/*
// @include      https://ouo.press/*
// @include      https://drive.google.com/*
// @include      https://rapidgator.net/file/*
// @run-at       document-start
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js
// @require      https://raw.githubusercontent.com/DandyClubs/CopyLinksCommonJS/main/CopyLinksCommonJS.js
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @connect      *
// @noframes
// ==/UserScript==

/* ===============================
 * Styles
 * =============================== */
GM_addStyle(`
.AutoClickCenterBox {
  right: 40%;
  left: auto;
  top: 5px;
  border-radius: .25em !important;
  max-width: max-content;
  position: fixed !important;
  display: flex;
  flex-wrap: nowrap;
  justify-content: center;
  align-items: center;
  word-spacing: .5rem;
  font-style: initial !important;
  text-align: center;
  color: dodgerblue !important;
  border-radius: .25em !important;
  -webkit-box-sizing: border-box !important;
  box-sizing: border-box !important;
  background-color: rgba(0,0,0,0.5) !important;
  text-shadow: 1px 1px 1px red, 0 0 2px blue, 0 0 1px black;
  z-index: 999999;
}

.queueState {	
	padding: 0 .25em;
	margin: auto .25em;
	color: white;
    transform: scale(0.65);
}

.AutoClick {
 padding: 0 .25em;
 margin: auto .25em;
 cursor: pointer;
 font-size: .75em;
}
.AutoClick, .Reset { cursor: pointer; }
.AutoClick.On { color: Chartreuse !important; }
.AutoClick.Off { color: MidnightBlue !important; }
.Reset * {
  font-size: .7rem;
  font-family: Montserrat, sans-serif;
  color: #b513e2;
}
`);

class linkManagerDB {
    constructor() {
        this.dbName = 'linkManager';
        this.storeName = 'linkStore';
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 3);

            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'S' });
                }
            };

            request.onsuccess = (e) => {
                this.db = e.target.result;
                resolve();
            };

            request.onerror = (e) => reject(e.target.error);
        });
    }

    async add(S, U, F) {
        return this._tx('readwrite', store => store.put({ S: S, U: U, F: F }));
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



const linkManager = new linkManagerDB();


/* ===============================
 * IndexedDB 기반 Queue + BroadcastChannel 관리
 * =============================== */
class IndexedDBQueue {
    constructor(dbName = 'AutoClickJobQueueDB', storeName = 'queue') {
        this.dbName = dbName;
        this.storeName = storeName;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 3);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'url' });
                }
            };
            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve();
            };
            request.onerror = (event) => reject(event.target.error);
        });
    }

    async enqueue(url) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(this.storeName, 'readwrite');
            const store = tx.objectStore(this.storeName);

            const entry = { url, timestamp: Date.now() };
            const req = store.put(entry); // 같은 url → 갱신됨 (중복 방지)

            req.onsuccess = () => {
                console.log(`[Queue] '${url}' 추가됨`);
                resolve(url);
            };
            req.onerror = (e) => reject(e.target.error);
        });
    }

    async dequeue(url) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(this.storeName, 'readwrite');
            const store = tx.objectStore(this.storeName);
            const req = store.delete(url);
            req.onsuccess = () => resolve(true);
            req.onerror = (e) => reject(e.target.error);
        });
    }

    async list() {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(this.storeName, 'readonly');
            const store = tx.objectStore(this.storeName);
            const req = store.getAll();

            req.onsuccess = () => {
                resolve(req.result.sort((a, b) => a.timestamp - b.timestamp));
            };
            req.onerror = (e) => reject(e.target.error);
        });
    }

    async size() {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(this.storeName, 'readonly');
            const store = tx.objectStore(this.storeName);
            const countReq = store.count();

            countReq.onsuccess = () => resolve(countReq.result);
            countReq.onerror = (e) => reject(e.target.error);
        });
    }

    async isEmpty() {
        const count = await this.size();
        return count === 0;
    }
}

/* ===============================
 * Queue 동작 관리
 * =============================== */
const queue = new IndexedDBQueue();

const AutoClickBC = new BroadcastChannel("AutoClickChannel");

let queueState = null;
let processCount = 5;
let size = 0;

async function updatequeueState() {
    size = await queue.size();
    if (queueState) {
        queueState.innerText = size;
    }
}

/* ===============================
 * Globals & Config
 * =============================== */
const DEBUG = false;
const log = (...args) => { if (DEBUG) console.log("[AutoClick]", ...args); };

const config = { attributes: true, childList: true, subtree: true };
const PageURL = window.location !== window.parent.location ? document.referrer : document.location.href;

let ClickBTN = null;
let AutoClick = null; // '1' or '0' in localStorage
let PopUp = null;
let childWindow = null;
let parentWindow = null;
let GetFileNameElement = null;
let GetFileName = null;
let isClicked = false;
let reloadTimer = null;


/* ===============================
 * Utilities
 * =============================== */
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function getRandomIntInclusive(min, max) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled);
}
function querySelectorIncludesText(selector, text) {
    return Array.from(document.querySelectorAll(selector)).filter(el => el.textContent.toLowerCase().includes(text.toLowerCase()));
}
function domRemove(className) {
    document.querySelectorAll(`.${className}`).forEach(el => el.remove());
}
function classRemove(className) {
    document.querySelectorAll(`.${className}`).forEach(el => {
        el.removeAttribute('onclick');
        el.classList.remove(className);
    });
}
function insertFontAwesome() {
    const css = document.createElement('link');
    css.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css';
    css.rel = 'stylesheet';
    css.type = 'text/css';
    document.head.appendChild(css);
}

function getDefaultFontSize() {
    const tmp = document.createElement('div');
    tmp.style.width = '1rem';
    tmp.style.position = 'absolute';
    tmp.style.visibility = 'hidden';
    document.documentElement.appendChild(tmp);
    const px = parseFloat(getComputedStyle(tmp).width);
    tmp.remove();
    return px || 16;
}
function normalizeUrlKey() {
    let host = window.location.hostname;
    const href = location.href;
    if (/pl\/thumbnails/.test(href)) return "thumbnails";
    if (/pl\/download/.test(href)) return "download";
    if (host.startsWith('www.')) host = host.slice(4);
    return host;
}

const JobManager = {
    keys() { return GM_listValues(); },
    add(url) { GM_setValue(url, true); },
    remove(url) {
        GM_deleteValue(url);
    }
};


/* ===============================
 * UI Manager
 * =============================== */
const UIManager = {
    ensureBox() {
        const exists = document.querySelector('.AutoClickCenterBox');
        if (!exists) {
            document.body.insertAdjacentHTML('afterbegin', '<div class="AutoClickCenterBox" style="max-width: max-content;"></div>');
        }
        return document.querySelector('.AutoClickCenterBox');
    },
    setResponsiveFont() {
        const dpi = window.devicePixelRatio || 1;
        const defaultFont = getDefaultFontSize(); // px per rem
        const scaleFactor = (1 / (dpi / 1.5)) * (16 / defaultFont);
        const fontSize = scaleFactor.toFixed(2) + 'rem';
        const box = this.ensureBox();
        box.style.setProperty('font-size', fontSize, 'important');
    },
    syncIcon() {
        const on = localStorage.getItem('AutoClick') === '1';
        let icon = document.querySelector('.AutoClick');
        if (!icon) {
            const box = this.ensureBox();
            box.insertAdjacentHTML('beforeend', `
                <i class="AutoClick ${on ? 'On' : 'Off'} fa-solid fa-square-check"></i>
                <span class="queueState">${size}</span>
                `);
            queueState = document.querySelector('.queueState');
            icon = document.querySelector('.AutoClick');
            icon.addEventListener('click', (e) => {
                const isOn = e.currentTarget.classList.contains('On');
                e.currentTarget.classList.replace(isOn ? 'On' : 'Off', isOn ? 'Off' : 'On');
                localStorage.setItem('AutoClick', isOn ? '0' : '1');
            });
            window.addEventListener('storage', (ev) => {
                if (ev.key === 'AutoClick') {
                    const ic = document.querySelector('.AutoClick');
                    if (!ic) return;
                    ic.classList.replace(ev.oldValue === '1' ? 'On' : 'Off', ev.newValue === '1' ? 'On' : 'Off');
                }
            });
        } else {
            icon.classList.replace(on ? 'Off' : 'On', on ? 'On' : 'Off');
        }
    },
    addResetButton(el, originalLink, fileName) {
        let resetIcon = el.nextElementSibling;

        // el의 다음 형제 요소가 존재하고, 그 요소에 'Reset' 클래스가 없는 경우
        if (resetIcon && !resetIcon.classList.contains('Reset')) {
            el.insertAdjacentHTML('afterend', '<i class="Reset fa-solid fa-eraser" style="display: flex; align-items: center; justify-content: center;"></i>');
        }
        // el의 다음 형제 요소가 아예 없는 경우
        else if (!resetIcon) {
            el.insertAdjacentHTML('afterend', '<i class="Reset fa-solid fa-eraser" style="display: flex; align-items: center; justify-content: center;"></i>');
        }

        resetIcon = el.nextElementSibling;

        let fileNameEl = resetIcon.querySelector('.fileName');
        if (!fileNameEl) {
            resetIcon.insertAdjacentHTML('beforeend', `<span class="fileName">${fileName}</span>`);
        } else {
            fileNameEl.innerText = fileName;
        }

        const newResetIcon = resetIcon.cloneNode(true);
        resetIcon.replaceWith(newResetIcon);

        newResetIcon.addEventListener('click', (e) => {
            e.preventDefault();
            e.currentTarget.style.color = 'purple';
            linkManager.remove(originalLink);
            el.setAttribute('href', originalLink);
            newResetIcon.remove();
        });
    }
};


function addReloadEvent(delay = 60000) {
    reload(delay);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            reload(delay);
        } else {
            cancelReload();
        }
    }, { once: true });
}

function reload(delay = 60000) {
    reloadTimer = setTimeout(() => {
        if (location.href === PageURL) {
            clearTimeout(reloadTimer);
            location.href = PageURL;
        }
    }, delay);
}

// 다른 곳에서 취소 가능
function cancelReload() {
    if (reloadTimer) {
        clearTimeout(reloadTimer);
        reloadTimer = null;
    }
}

window.addEventListener('popstate', cancelReload);   // history로 주소 변경될 때
window.addEventListener('hashchange', cancelReload); // hash 변경될 때


/* ===============================
 * Shared / Reusable helpers
 * =============================== */
async function autoClickBySelector(sel) {
    const check = setInterval(() => {
        const el = document.querySelector(sel);
        if (el) {
            clearInterval(check);
            el.click();
        }
    }, 500);
}

function setupBeforeUnloadForJobs() {
    window.addEventListener('beforeunload', () => { cancelReload(); JobManager.remove(PageURL); });
}

async function taskState() {
    await queue.dequeue(PageURL);
    AutoClickBC.postMessage({ type: "updateState" });
}

/* ===============================
 * Site-specific Observers
 * =============================== */
const globalObserver = new MutationObserver(async (mutations) => {
    const href = window.location.href;

    // terabox / 1024tera — detect download button then orchestrate Job queue & messaging
    if (/(terabox|1024tera)\.(app|com)\/.+sharing/.test(href)) {
        ClickBTN = document.querySelector('div.action-bar div.action-bar-download.action-bar-btn');
        const isLogin = document.querySelector('div.header-main-box div.header-right-menus div.user-card-box');
        if (ClickBTN && isLogin) {
            globalObserver.disconnect();
            cancelReload();
            GetFileNameElement = document.querySelector('div.info div.file-name-info span.file-name');
            GetFileName = (GetFileNameElement?.textContent || GetFileNameElement?.innerText || '').trim();

            // Ensure page is registered
            if (!GM_getValue(PageURL)) {
                JobManager.add(PageURL);
            }

            const jobs = JobManager.keys();
            const order = jobs.findIndex(j => j === PageURL);
            await sleep(getRandomIntInclusive(0, 10) * 10 * order + 3000 * order);
            Downloader(ClickBTN);
        }
        else if (!ClickBTN && !isLogin) {
            reload(60000);
        }
        return;
    }

    // themezon.net — next page auto nav
    if (/themezon\.net/.test(href)) {
        const next = document.querySelector('div#nextPage a');
        if (next) {
            globalObserver.disconnect();
            window.location.href = next.href;
        }
        return;
    }

    // fallback small automations
    mutations.forEach(function () {
        const urlLink = document.querySelector('a.page-scroll.no-p.url-link');
        if (urlLink && urlLink.innerText) urlLink.click();

        const newImg = document.querySelector('#newImgE');
        if (newImg && !/data:image/.test(newImg.src)) {
            document.location.href = newImg.src;
            globalObserver.disconnect();
        }
    });
});



/* ===============================
 * Site Handlers (Start-time)
 * ===============================   
*/

function DBResetButton() {
    const btn = document.createElement('button');
    btn.textContent = '🧹 Reset Job DB';
    btn.style = 'position:fixed;bottom:5px;right:35px;z-index:9999;height: 16px;font-size: 10px;border-radius: 5px;border: 1px; ';
    btn.onclick = () => {
        indexedDB.deleteDatabase('AutoClickJobQueueDB');
        alert('JobQueue DB가 삭제되었습니다. 페이지를 새로고침하세요.');
    };
    document.body.appendChild(btn);
}

// 작업 시작
async function startWork(currentLinks) {
    if (window._isWorking) return;
    const jobs = await queue.list();
    const myIndex = jobs.findIndex(j => j.url === PageURL);

    if (myIndex === -1) return; // 이미 제거됨

    if (myIndex < processCount && currentLinks?.length) {
        window._isWorking = true;
        const entry = currentLinks[0];
        console.log(`작업 지시 수신: ${PageURL} (${entry.type}) ${myIndex + 1}/${processCount}`);
        childWindow = window.open(entry.oldLink, entry.title);
    } else {
        console.log(`대기중: ${PageURL} 순번: ${myIndex + 1} / ${processCount}`);
    }
}


async function handleSite({ copyTitle, linkSelectors, autoClose = false, enableJdownloaer = false }) {

    const JdownloaderData = [];
    const allowHost = /mega\.nz|drive\.google\.com|mediafire\.com/;
    AutoClick = localStorage.getItem('AutoClick') || '0';
    UIManager.setResponsiveFont();
    updatequeueState();
    UIManager.syncIcon();
    //DBResetButton();
    let pendingState = false;
    const checkSubPage = document.querySelector('body.single-post');
    if (!checkSubPage) {
        AutoClickBC.onmessage = (e) => {
            if (e.data?.type === 'updateState') {
                updatequeueState();
            }
        };
        return;
    } else {
        AutoClickBC.onmessage = (e) => {
            if (e.data?.type === 'updateState') {
                updatequeueState();
                if (!window._isWorking && pendingState) {
                    startWork(currentLinks);
                }
            }
        };
    }

    if (!copyTitle || /AI\sGenerated/i.test(copyTitle)) return;

    let links = linkSelectors.flatMap(sel => {
        if (sel.text) {
            return querySelectorIncludesText(sel.selector, sel.text).map(el => ({ el, type: sel.type }));
        } else {
            return Array.from(document.querySelectorAll(sel.selector)).map(el => ({ el, type: sel.type }));
        }
    }).filter(({ el }) => {
        if (/shink\.me|zippyshare\.com|adf\.ly/.test(el.href)) {
            console.log(`Skip ${el} ${el.href}`);
            UIManager.addResetButton(el, el.href, 'Skipped');
            return false;
        } else {
            return true;
        }
    });

    console.log({ copyTitle, links });

    if (!links.length) {
        if (AutoClick === '1') {
            console.log(`${links} is Empty! Close`);
            await sleep(10000);
            self.close();
        }
        return;
    }

    parentWindow = PageURL;
    const title = copyTitle.replace(/\s/g, '');

    let errorTypes = new Set();
    let cachedCheck = {};
    let rawLinks = {};

    // 1. type별 그룹화
    const grouped = links.reduce((acc, { el, type }) => {
        if (!acc[type]) acc[type] = [];
        acc[type].push(el);
        return acc;
    }, {});

    // 2. 그룹 순회
    for (const [type, elements] of Object.entries(grouped)) {
        let cachedCount = 0;
        let rawLinkCount = 0;
        for (const link of elements) {
            let oldLink = link.href;

            if (/mediafire\.com/.test(oldLink)) {
                rawLinkCount++;
                continue;
            }

            if (/shrinkme\..*/.test(oldLink)) {
                oldLink = oldLink.replace(/shrinkme\.(org|dev|us)/, 'shrinkme.site');
                link.href = oldLink;
            }
            const cached = await linkManager.get(oldLink); // 예시: 캐시에서 가져오기

            if (cached) {
                if (cached.U === 'NotFound') {
                    UIManager.addResetButton(link, oldLink, 'File Not Found');
                    //link.remove();
                    errorTypes.add(type); // NotFound가 하나라도 있으면 type 기록
                } else {
                    link.href = cached.U;
                    UIManager.addResetButton(link, oldLink, cached.F);
                    cachedCount++;
                }
            }
        }

        // 3. 링크 수와 resetButton 추가 수 체크
        cachedCheck[type] = {
            type,
            totalLinks: elements.length,
            cachedLinks: cachedCount,
            allMatched: elements.length === cachedCount
        };
        rawLinks[type] = {
            type,
            totalLinks: elements.length,
            cachedLinks: rawLinkCount,
            allMatched: elements.length === rawLinkCount
        };
    }

    if (errorTypes.size > 0) {
        links = links.filter(({ type }) => !errorTypes.has(type));
    }
    const hasRawLinksMatched = Object.values(rawLinks).some(v => v.allMatched);
    const hasAllMatched = Object.values(cachedCheck).some(v => v.allMatched);
    const cachedTeraBoxType = Object.values(cachedCheck).some(v => v.type === 'terabox' && v.allMatched);

    if (hasAllMatched || hasRawLinksMatched || cachedTeraBoxType) return;

    const typeGroups = new Map();

    for (const { el: link, type } of links) {
        let oldLink = link.href;

        link.addEventListener('click', (e) => {
            e.preventDefault();
            childWindow = window.open(link.href, title);
        });

        // 그룹별 추가
        if (!typeGroups.has(type)) typeGroups.set(type, []);
        typeGroups.get(type).push({ linkEl: link, oldLink, title, type });
    }

    const types = [...typeGroups.keys()];
    if (!types.length) return;

    pendingState = true;
    let currentTypeIndex = 0;
    let currentLinks = typeGroups.get(types[currentTypeIndex]);

    if (AutoClick === '1') {
        window.addEventListener('beforeunload', taskState);
        await queue.enqueue(PageURL);
        updatequeueState();
        startWork(currentLinks);
        AutoClickBC.postMessage({ type: "updateState" });
    }



    /* ===============================
    * 공통 이벤트 핸들러 (중복 등록 방지)
    * =============================== */
    window.addEventListener('message', async (e) => {
        if (!/terabox\.com|1024tera\.com|terabox\.app|en\.mrproblogger\.com|drive\.google\.com|mediafire\.com|ouo\.io|ouo\.press|rapidgator\.net/.test(e.origin)) return;

        // 토큰 응답 도착
        if (!currentLinks?.length) return;

        let entry = currentLinks[0];

        if (e.data.code && entry.oldLink) {
            const shortcode = new URL(entry.oldLink).pathname;
            if (shortcode !== e.data.code) {
                childWindow?.postMessage({ link: entry.oldLink }, e.origin);
            }
        } else if (e.data.Q) {
            // 자식이 부모 정보 요청 → 응답
            childWindow?.postMessage({ A: parentWindow }, e.origin);
        } else if (e.data.retry) {
            childWindow.postMessage({ action: 'closed' }, e.origin);
            await sleep(250);
            entry = currentLinks[0];
            console.log(`다시 시도 type(${types[currentTypeIndex]}) 링크 시도: ${entry.oldLink}`);
            childWindow = window.open(entry.oldLink, entry.title);
        } else if (e.data.token) {
            if (e.data.token === 'NotFound') {
                childWindow.postMessage({ action: 'closed' }, e.origin);
                // 현재 type 실패 → 곧바로 다음 type으로 넘어감
                linkManager.add(entry.oldLink, 'NotFound', 'File Not Found');
                UIManager.addResetButton(entry.linkEl, entry.oldLink, 'File Not Found');
                //entry.linkEl.remove();
                await sleep(500);
                currentTypeIndex++;
                if (currentTypeIndex < types.length) {
                    currentLinks = typeGroups.get(types[currentTypeIndex]);
                    if (currentLinks?.length) {
                        entry = currentLinks[0];
                        console.log(`다음 type(${types[currentTypeIndex]}) 링크 시도: ${entry.oldLink}`);
                        childWindow = window.open(entry.oldLink, entry.title);
                    }
                } else {
                    // 모든 type 실패           
                    await queue.dequeue(PageURL);
                    updatequeueState();
                    AutoClickBC.postMessage({ type: 'updateState' });
                    window.removeEventListener('beforeunload', taskState);

                }
            } else {
                // 성공 → 링크 갱신 & 캐시 저장
                linkManager.add(entry.oldLink, e.data.token, e.data.FileName || entry.title);
                entry.linkEl.href = e.data.token;
                if (allowHost.test(e.data.token)) {
                    JdownloaderData.push(e.data.token);
                }

                UIManager.addResetButton(entry.linkEl, entry.oldLink, e.data.FileName || entry.title);

                currentLinks.shift();

                await sleep(1000);

                if (currentLinks?.length) {
                    entry = currentLinks[0];
                    console.log(`다음 type(${types[currentTypeIndex]}) 링크 시도: ${entry.oldLink}`);
                    childWindow = window.open(entry.oldLink, entry.title);
                } else {
                    await queue.dequeue(PageURL);
                    updatequeueState();
                    AutoClickBC.postMessage({ type: 'updateState' });
                    window.removeEventListener('beforeunload', taskState);

                    console.log({ autoClose }, entry.type);
                    if (/terabox\.com|1024tera\.com|terabox\.app/.test(e.origin)) {
                        childWindow?.postMessage({ S: parentWindow, action: 'closed' }, e.origin);
                    }
                    if (autoClose) {
                        await sleep(7500);
                        self.close();
                    }

                    currentLinks = [];
                    currentTypeIndex = types.length;
                    if (enableJdownloaer && JdownloaderData.length > 0) {
                        JDownloader(JdownloaderData.join('\n'), copyTitle, PageURL);
                    }
                }
            }
        }
    });

    window.addEventListener('beforeunload', () => {
        if (childWindow && !childWindow.closed) {
            childWindow.postMessage({ action: 'closed' }, '*');
        }
    });
}


async function handleAllAsianGirls() {
    processCount = 3;
    const titleSelector = 'body.single.single-post div.page-title div.page-title-inner div .entry-title';

    let Title = document.querySelector(titleSelector)
        ?.textContent.replace(/part\d+$/i, '') || null;
    return handleSite({
        copyTitle: Title,
        linkSelectors: [{ selector: 'a[href^="https://shrinkme"], a[href^="https://ouo"]', text: '', type: 'terabox' }],
        enableJdownloaer: true,
    });
}

async function handleBestGirlSexy() {
    const titleSelector = 'div#content.site-content div.elementor-widget-container .elementor-heading-title';
    let Title = document.querySelector(titleSelector)
        ?.textContent.replace(/part\d+$/i, '') || null;
    return handleSite({
        copyTitle: Title,
        linkSelectors: [{ selector: 'a.maxbutton', text: 'TeraBox', type: 'terabox' }],
        autoClose: true,
        enableJdownloaer: true,
    });
}

async function handleMissKon() {
    processCount = 7;
    const titleSelector = 'article#the-post .post-title.entry-title';
    let Title = document.querySelector(titleSelector)
        ?.textContent.replace(/part\d+$/i, '')
        .replace(/(\d+)\sphotos/i, `$1P`)
        .replace(/(\d+)\svideos?/i, `$1V`)
        .replace(/P(\s\+\s)/, 'P')
        .trim() || null;;
    if (Title) {
        Title = mbConvertKana(Title, 'rans');
        Title = byteLengthOf(Title, 241).trim();
    }
    return handleSite({
        copyTitle: Title,
        linkSelectors: [
            { selector: 'a.shortc-button', text: 'MediaFire', type: 'mediafire' },
            { selector: 'a.shortc-button', text: 'Google Drive', type: 'googleDrive' },
            { selector: 'a.shortc-button', text: 'Terabox', type: 'terabox' }
        ],
        enableJdownloaer: true,
    });
}

async function handleMrProBlogger() {
    // relay for code -> opener
    const code = new URL(PageURL).pathname;
    if (window.opener) {
        window.opener.postMessage({ code: code }, 'https://allasiangirls.net');
        window.addEventListener('message', function (e) {
            if (e.data.link) {
                location.href = e.data.link;
            }
        });
    }
}

async function handleOUO() {
    window.addEventListener('message', function (e) {
        if (e.data.action === 'closed') {
            //JobManager.remove(PageURL);
            self.close();
        }
    });

    console.log(PageURL, window.opener);
    if (window.opener) {
        if (PageURL === 'https://ouo.io/' || PageURL === 'https://ouo.press/') {
            window.opener.postMessage({ retry: 'reTryAgain' }, 'https://misskon.com');
        }
        const notFound = document.querySelector('div.container .no-found');
        if (notFound) {
            window.opener.postMessage({ token: 'NotFound' }, 'https://misskon.com');
        }
    }
}



async function handleMediaFire() {
    await sleep(500);
    // relay for code -> opener
    if (window.opener) {
        if (PageURL.startsWith('https://www.mediafire.com/error.php') || PageURL.startsWith('https://www.mediafire.com/download_repair.php')) {
            window.opener.postMessage({ token: 'NotFound' }, '*');
        } else {
            const GetFileName = document.querySelector('div.dl-btn-label')?.getAttribute('title')?.trim() || null;
            window.opener.postMessage({ token: PageURL, FileName: GetFileName, P: parentWindow }, '*');
        }
        window.addEventListener('message', function (e) {
            if (e.data.action === 'closed') {
                //JobManager.remove(PageURL);
                self.close();
            }
        });
    }
}


async function handleRapidgator() {
    await sleep(500);
    // relay for code -> opener
    if (window.opener) {
        if (PageURL.startsWith('https://rapidgator.net/error')) {
            window.opener.postMessage({ token: 'NotFound' }, '*');
        } else {
            const GetFileName = document.querySelector('div.in div.text-block.file-descr div.btm p a')?.innerText?.trim() || null;
            window.opener.postMessage({ token: PageURL, FileName: GetFileName, P: parentWindow }, '*');
        }
        window.addEventListener('message', function (e) {
            if (e.data.action === 'closed') {
                //JobManager.remove(PageURL);
                self.close();
            }
        });
    }
}

async function handleGoogleDrive() {
    const GetFileName = document.querySelector('head title')?.innerText.replace(' - Google Drive', '');
    if (window.opener) {
        window.opener.postMessage({ token: PageURL, FileName: GetFileName, P: parentWindow }, '*');
        window.addEventListener('message', function (e) {
            if (e.data.action === 'closed') {
                //JobManager.remove(PageURL);
                self.close();
            }
        });
    } else {
        JDownloader(PageURL, GetFileName, PageURL);
    }
}


function childWindowClose() {
    window.addEventListener('message', function (e) {
        if (e.data.action === 'closed') {
            //JobManager.remove(PageURL);
            self.close();
        }
    });
}


const siteHandlers = {
    "thumbnails": () => {
        ['banner-top', 'img-thumbnails-info', 'show-thumbnails-info', 'btn-thumbnails', 'adblock-true', 'baner-bottom-section']
            .forEach(domRemove);
        ['img-thumbnails', 'hidden'].forEach(classRemove);
    },
    "download": () => {
        setTimeout(() => document.querySelector('.btn.btn-primary.btn-download')?.click(), 500);
    },
    "ex745.com": () => autoClickBySelector('#dlink'),
    "xc745.com": () => autoClickBySelector('#dlink'),
    "365shares.net": () => autoClickBySelector('#dlink'),
    "newsteez.com": () => setTimeout(() => document.querySelector('.btn.btn-primary')?.click(), 500),
    "en.mrproblogger.com": () => { handleMrProBlogger(); addReloadEvent(); childWindowClose(); },
    "allasiangirls.net": handleAllAsianGirls,
    "bestgirlsexy.com": handleBestGirlSexy,
    "misskon.com": handleMissKon,
    "mediafire.com": handleMediaFire,
    "rapidgator.net": handleRapidgator,
    "imgmffmv.sbs": () => globalObserver.observe(document, config),
    "terabox.com": () => { setupBeforeUnloadForJobs(); globalObserver.observe(document, config); },
    "1024tera.com": () => { setupBeforeUnloadForJobs(); globalObserver.observe(document, config); },
    "terabox.app": () => { setupBeforeUnloadForJobs(); globalObserver.observe(document, config); },
    "themezon.net": () => { globalObserver.observe(document, config); childWindowClose(); },
    "sehuatang.net": () => setTimeout(() => document.querySelector('body > a.enter-btn')?.click(), 1000),
    "shrinkme.site": () => { addReloadEvent(30000); childWindowClose(); },
    "shrinkme.org": () => { addReloadEvent(30000); childWindowClose(); },
    "shrinkme.top": () => { addReloadEvent(30000); childWindowClose(); },
    "shrinkme.dev": () => { addReloadEvent(30000); childWindowClose(); },
    "ouo.io": () => { handleOUO(); addReloadEvent(); },
    "ouo.press": () => { handleOUO(); addReloadEvent(); },
    "drive.google.com": () => { handleGoogleDrive(); },
};

/* ===============================
 * Downloader Orchestrator (TeraBox)
 * =============================== */
async function Downloader(el) {
    const messageHandler = async (e) => {
        const origin = new URL(e.origin).origin;
        if (!/bestgirlsexy\.com|allasiangirls\.net|misskon\.com/.test(origin)) return;

        if (e.data.A) {
            parentWindow = e.data.A;
            if (window.opener && parentWindow && !isClicked) {
                el.click();
                isClicked = true;
                const allowed = ['https://allasiangirls.net', 'https://bestgirlsexy.com', 'https://misskon.com'];
                if (allowed.includes(origin)) {
                    window.opener.postMessage({ token: PageURL, FileName: GetFileName, P: parentWindow }, origin);
                }
            }
        } else if (e.data.S || e.data.action === 'closed') {
            await sleep(2500);
            JobManager.remove(PageURL);
            await sleep(2500);
            self.close();
        }
    };

    window.addEventListener('message', messageHandler);
    if (window.opener) {
        window.opener.postMessage({ Q: 'parentWindow?' }, '*');
    } else {
        await sleep(5000);
        el.click();
        await sleep(5000);
        self.close();
    }
}

/* ===============================
 * Boot
 * =============================== */
window.addEventListener("DOMContentLoaded", async () => {


    if (/allasiangirls\.net|bestgirlsexy\.com|misskon\.com/.test(PageURL)) {
        await linkManager.init();
        log('AutoClick init');
        await queue.init();
    }

    insertFontAwesome();

    const key = normalizeUrlKey();
    if (siteHandlers[key]) {
        Promise.resolve(siteHandlers[key]()).catch(err => log("handler error", err));
    }
}, { once: true });


function JDownloader(JdownloaderData, PackageName, sourceURL) {
    //console.log(PackageName + '\n' + JdownloaderData)
    /*
if(JdownloaderData){
    $.post("http://127.0.0.1:9666/flash/add", {
        urls: JdownloaderData,
        referer: PageURL,
        package: PackageName
    })
}
*/
    if (JdownloaderData) {

        let data = new URLSearchParams();
        data.append(`urls`, JdownloaderData);
        data.append(`referer`, PageURL);
        if (sourceURL) {
            data.append(`source`, sourceURL);
        }
        if (PackageName) {
            data.append(`package`, PackageName);
        }
        /*
    if(Comment){
        data.append(`comment`, Comment)
    }
    */
        fetch('http://localhost:9666/flash/add', {
            method: 'POST',
            //mode: 'no-cors',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Access-Control-Allow-Origin': 'http://localhost:9666',
            },
            body: data
        }).then((response) => {
            //console.log(response.ok)
        });
        //console.log(data)
    }

}
