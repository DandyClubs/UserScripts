// ==UserScript==
// @name         AutoClick (Refactored)
// @version      2025.09.03
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
// @include      https://ouo.io/*
// @include      https://ouo.press/*
// @include      https://drive.google.com/*
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



class Queue {
    constructor() {
        this.items = {};
        this.front = 0;
        this.rear = 0;
    }

    enqueue(item) {
        // 큐의 모든 요소를 순회하며 현재 추가하려는 item이 이미 존재하는지 확인합니다.
        for (let i = this.front; i < this.rear; i++) {
            if (this.items[i] === item) {
                console.log(`'${item}'은(는) 이미 큐에 존재합니다. 추가되지 않습니다.`);
                return; // 중복 값이므로 함수를 종료합니다.
            }
        }

        // 중복이 아닐 경우에만 큐에 추가합니다.
        this.items[this.rear] = item;
        this.rear++;
        this._notify({ type: "add", item });
    }

    dequeue() {
        if (this.isEmpty()) {
            return undefined; // or throw error
        }
        const item = this.items[this.front];
        delete this.items[this.front];
        this.front++;
        this._notify({ type: "remove", item });
        return item;
    }

    peek() {
        if (this.isEmpty()) {
            return undefined;
        }
        return this.items[this.front];
    }

    get size() {
        return this.rear - this.front;
    }

    isEmpty() {
        return this.size === 0;
    }

    _notify(event) {
        if (this.onchange) this.onchange(event); // ★ 같은 탭 내부에서도 바로 콜백 실행
    }
}


const queue = new Queue();
const AutoClickBC = new BroadcastChannel('AutoClickChannel')


let queueIndex = 0;
let queueState = null;

function updatequeueState(size) {
    if (queueState) {
        queueState.innerText = size;
    }
}

queue.onchange = (event) => {
    //console.log("로컬 DB 이벤트 발생:", event);
    const size = queue.size;
    updatequeueState(size);
    AutoClickBC.postMessage({ type: 'updateState', size: size });
};


// 큐 관리 함수
async function Management() {

    // Management() 함수가 이미 실행 중이거나 작업 슬롯이 꽉 찼거나 큐가 비어있으면 종료
    if (queueIndex >= 7 || queue.isEmpty()) {
        return;
    }
    // 하나의 작업을 시작
    //const node = queue.peek();
    const node = queue.dequeue();

    if (node) {
        console.log(`새 작업 시작: ${node} ${queueIndex}`);

        // 작업 페이지로 메시지 전송
        AutoClickBC.postMessage({ type: 'startTask', url: node });
        queueIndex++;
    }
}


function mainQueueManagemnt() {
    // 메시지 수신 핸들러 (한 번만 등록)
    AutoClickBC.onmessage = async (e) => {
        // 'taskComplete' 메시지 수신 시 처리
        if (e.data && e.data.type === 'taskComplete') {
            const completedUrl = e.data.url;
            console.log(`작업 완료 알림 수신: ${completedUrl}`);

            // 작업 슬롯 하나 반환
            queueIndex--;
            // 다음 작업 시작
            Management();

        } else if (e.data && e.data.type === 'addTask') {
            queue.enqueue(e.data.url);
            if (queueIndex < 7) {
                Management();
            }
        }
    };
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
    return Array.from(document.querySelectorAll(selector)).filter(el => el.innerText.includes(text));
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

/* ===============================
 * Managers
 * =============================== */
const CacheManager = {
    get(key) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : null;
        } catch (e) { log("Cache get error", e); return null; }
    },
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) { log("Cache set error", e); }
    },
    del(key) { localStorage.removeItem(key); }
};

const JobManager = {
    keys() { return GM_listValues() },
    add(url) { GM_setValue(url, true) },
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
                <span class="queueState">${queue.size}</span>
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
        let resetIcon = document.querySelector('.Reset');
        if (!resetIcon) {
            el.insertAdjacentHTML('afterend', '<i class="Reset fa-solid fa-eraser" style="display: flex;align-items: center; justify-content: center;"></i>');
            resetIcon = document.querySelector('.Reset');
        }

        let fileNameEl = document.querySelector('.Reset .fileName');
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
            CacheManager.del(originalLink);
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
    });
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

/* ===============================
 * Site-specific Observers
 * =============================== */
const globalObserver = new MutationObserver(async (mutations) => {
    const href = window.location.href;

    // terabox / 1024tera — detect download button then orchestrate Job queue & messaging
    if (/(terabox|1024tera)\.(app|com)\/.+sharing/.test(href)) {
        ClickBTN = document.querySelector('div.action-bar div.action-bar-download.action-bar-btn');
        const isLogin = document.querySelector('div.header-main-box div.header-right-menus div.user-card-box')
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
            const order = jobs.indexOf(PageURL)
            await sleep(getRandomIntInclusive(0, 10) * 100 + 5000 * order);
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


const beforeUnloadHandler = (event) => {
    if (queue.size) {
        event.preventDefault();
        console.log('queue is not Empty!', queue.size)
        // Included for legacy support, e.g. Chrome/Edge < 119
        event.returnValue = true;
    }
    else {
        window.removeEventListener("beforeunload", beforeUnloadHandler);
    }
};




/* ===============================
 * Site Handlers (Start-time)
 * =============================== */

async function handleSite({ titleSelector, linkSelectors, autoClose = false }) {
    const linkMap = new Map();
    AutoClick = localStorage.getItem('AutoClick') || '0';
    UIManager.setResponsiveFont();
    UIManager.syncIcon();

    const checkSubPage = document.querySelector('body.single-post');
    if (!checkSubPage) {
        window.addEventListener("beforeunload", beforeUnloadHandler);
        mainQueueManagemnt();
        return;
    }

    const copyTitle = document.querySelector(titleSelector)
        ?.textContent.replace(/part\d+$/i, '').trim();
    if (!copyTitle || /AI\sGenerated/i.test(copyTitle)) return;

    const links = linkSelectors.flatMap(sel => {
        if (sel.text) {
           return Array.from(document.querySelectorAll(sel.selector)).map(el => ({ el, type: sel.type }));
        } else {
            return querySelectorIncludesText(sel.selector, sel.text).map(el => ({ el, type: sel.type }));
        }
    });

    console.log({ copyTitle, links })
    if (!links.length) return;

    parentWindow = PageURL;
    const title = copyTitle.replace(/\s/g, '');

    for (const { el: link, type } of links) {
        let oldLink = link.href;
        if (/shrinkme\..*/.test(oldLink)) {
            oldLink = oldLink.replace(/shrinkme\.(org|dev|us)/, 'shrinkme.site');
            link.href = oldLink;
        }
        const cached = CacheManager.get(oldLink);
        if (cached) {
            link.href = cached.U;
            if (cached.U === 'NotFound') {
                link.remove();
            } else {
                UIManager.addResetButton(link, oldLink, cached.T);
                break;
            }
            continue; // 캐시된 경우 추가 처리 불필요
        }
        link.addEventListener('click', (e) => {
            e.preventDefault();
            childWindow = window.open(oldLink, title);
        });

        linkMap.set(oldLink, { linkEl: link, type, title });
    }

    const entries = [...linkMap.entries()];
    if (!entries.length) return;

    if (AutoClick === '1') {
        AutoClickBC.postMessage({ type: 'addTask', url: PageURL });
        AutoClickBC.onmessage = (e) => {
            if (e.data?.type === 'startTask' && e.data.url === PageURL) {
                const entry = [...linkMap.values()][0]; // 첫 링크 기준
                if (entry) {
                    console.log(`작업 지시 수신: ${PageURL}`);
                    childWindow = window.open(entry.linkEl.href, entry.title);
                }
            } else if (e.data?.type === 'updateState') {
                updatequeueState(e.data.size);
            }
        };
    }



    /* ===============================
    * 공통 이벤트 핸들러 (중복 등록 방지)
    * =============================== */
    window.addEventListener('message', async (e) => {
        if (!/terabox\.com|1024tera\.com|terabox\.app|en\.mrproblogger\.com|drive\.google\.com|mediafire\.com/.test(e.origin)) return;

        // 토큰 응답 도착
        const entries = [...linkMap.entries()];
        if (!entries.length) return;

        const [oldLink, entry] = entries[0];

        if (e.data.code && oldLink) {
            const shortcode = new URL(oldLink).pathname;
            if (shortcode !== e.data.code) {
                childWindow?.postMessage({ link: oldLink }, e.origin);
            }
        } else if (e.data.Q) {
            // 자식이 부모 정보 요청 → 응답
            childWindow?.postMessage({ A: parentWindow }, e.origin);
        } else if (e.data.token) {
            if (e.data.token === 'NotFound') {
                // 현재 링크 실패 → 다음 링크 재시도
                CacheManager.set(oldLink, { U: 'NotFound', T: 'File Not Found' });
                entry.linkEl.remove();
                //AutoClickBC.postMessage({ type: 'taskComplete', url: PageURL });
                childWindow.postMessage({ action: 'closed' }, e.origin);
                await sleep(1000);

                linkMap.delete(oldLink);

                const nextEntry = [...linkMap.values()][0];
                if (nextEntry) {
                    console.log(`다음 링크 시도: ${nextEntry.linkEl.href} ${nextEntry.title}`);
                    childWindow = window.open(nextEntry.linkEl.href, nextEntry.title);
                } else {
                    AutoClickBC.postMessage({ type: 'taskComplete', url: PageURL });
                }
            } else {
                // 성공 → 링크 갱신 & 캐시 저장
                CacheManager.set(oldLink, { U: e.data.token, T: e.data.FileName || entry.title });
                entry.linkEl.href = e.data.token;
                AutoClickBC.postMessage({ type: 'taskComplete', url: PageURL });
                UIManager.addResetButton(entry.linkEl, oldLink, e.data.FileName || entry.title);

                if (autoClose && entry.type === 'terabox') {
                    await sleep(5000);
                    self.close();
                }

                childWindow?.postMessage({ S: parentWindow, action: 'closed' }, e.origin);
                linkMap.clear(); // 더 이상 처리할 링크 없음
                if (/drive\.google\.com/.test(e.origin)) {
                    JDownloader(e.data.token, e.data.FileName, PageURL);
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
    return handleSite({
        titleSelector: 'body.single.single-post div.page-title div.page-title-inner div .entry-title',
        linkSelectors: [{ selector: 'A[href^="https://shrinkme"]', text: '', type: 'terabox' }],
    });
}

async function handleBestGirlSexy() {
    return handleSite({
        titleSelector: 'div#content.site-content div.elementor-widget-container .elementor-heading-title',
        linkSelectors: [{ selector: 'A', text: 'TeraBox', type: 'terabox' }],
        autoClose: true
    });
}

async function handleMissKon() {
    return handleSite({
        titleSelector: 'article#the-post .post-title.entry-title',
        linkSelectors: [
            { selector: 'a.shortc-button', text: 'MediaFire', type: 'mediafire' },
            { selector: 'a.shortc-button', text: 'Terabox', type: 'terabox' }
        ]
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
    const notFound = document.querySelector('div.container .no-found');
    if (window.opener && notFound) {
        window.opener.postMessage({ token: 'NotFound' }, 'https://misskon.com');
        self.close();
    }
}



async function handleMediaFire() {
    await sleep(500);
    // relay for code -> opener
    if (window.opener) {
        if (PageURL.startsWith('https://www.mediafire.com/error.php')) {
            window.opener.postMessage({ token: 'NotFound' }, 'https://misskon.com');
        } else {
            window.opener.postMessage({ token: PageURL }, 'https://misskon.com');
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
    await sleep(1000);
    // relay for code -> opener
    if (window.opener) {
        const GetFileName = document.querySelector('head title')?.innerText.replace(' - Google Drive', '');
        window.opener.postMessage({ token: PageURL, FileName: GetFileName, P: parentWindow }, '*');
        window.addEventListener('message', function (e) {
            if (e.data.action === 'closed') {
                //JobManager.remove(PageURL);
                self.close();
            }
        });
    }
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
    "en.mrproblogger.com": () => { handleMrProBlogger(); addReloadEvent(); },
    "allasiangirls.net": handleAllAsianGirls,
    "bestgirlsexy.com": handleBestGirlSexy,
    "misskon.com": handleMissKon,
    "mediafire.com": handleMediaFire,
    "imgmffmv.sbs": () => globalObserver.observe(document, config),
    "terabox.com": () => { setupBeforeUnloadForJobs(); globalObserver.observe(document, config); },
    "1024tera.com": () => { setupBeforeUnloadForJobs(); globalObserver.observe(document, config); },
    "terabox.app": () => { setupBeforeUnloadForJobs(); globalObserver.observe(document, config); },
    "themezon.net": () => globalObserver.observe(document, config),
    "sehuatang.net": () => setTimeout(() => document.querySelector('body > a.enter-btn')?.click(), 1000),
    "shrinkme.site": () => { addReloadEvent(); },
    "shrinkme.org": () => { addReloadEvent(); },
    "shrinkme.top": () => { addReloadEvent(); },
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
                await sleep(4000)
                const allowed = ['https://allasiangirls.net', 'https://bestgirlsexy.com', 'https://misskon.com'];
                if (allowed.includes(origin)) {
                    window.opener.postMessage({ token: PageURL, FileName: GetFileName, P: parentWindow }, origin);
                }
            }
        } else if (e.data.S || e.data.action === 'closed') {
            JobManager.remove(PageURL);
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
window.addEventListener("DOMContentLoaded", () => {
    log('AutoClick init');

    window.addEventListener("pageshow", (event) => {
        if (event.persisted) {
            localStorage.setItem('AutoClick', '0');
        }
    });

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
        data.append(`referer`, PageURL)
        if (sourceURL) {
            data.append(`source`, sourceURL)
        }
        if (PackageName) {
            data.append(`package`, PackageName)
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
        })
        //console.log(data)
    }

}
