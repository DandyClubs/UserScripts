// ==UserScript==
// @name         AutoClick (Refactored)
// @version      2025.09.02
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
// @run-at       document-start
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js
// @require      https://raw.githubusercontent.com/DandyClubs/CopyLinksCommonJS/main/CopyLinksCommonJS.js
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @grant        GM_addValueChangeListener
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

.AutoClick {
 margin: .2em;
 cursor: pointer;
 font-size: .7em;
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
    }

    dequeue() {
        if (this.isEmpty()) {
            return undefined; // or throw error
        }
        const item = this.items[this.front];
        delete this.items[this.front];
        this.front++;
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
}


const queue = new Queue();
const AutoClickBC = new BroadcastChannel('AutoClickChannel')


let queueIndex = 0;

// 큐 관리 함수
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
            Management();
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
    return Array.from(document.querySelectorAll(selector)).filter(el => el.textContent.includes(text));
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
function openPopup(url, title) {
    try {
        return window.open(url, title || '');
    } catch (e) {
        log("Popup blocked?", e);
        return null;
    }
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
            box.insertAdjacentHTML('beforeend', `<i class="AutoClick ${on ? 'On' : 'Off'} fa-solid fa-square-check"></i>`);
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


function reload(delay = 30000) {
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
            reload(120000);
        }
        return;
    }
    // allasiangirls.net — fix shrinkme & popup workflow & messaging
    if (/allasiangirls\.net\/.+/.test(href)) {
        const titleSelector = 'body.single.single-post div.page-title div.page-title-inner.container div .entry-title';
        ClickBTN = document.querySelector('div.entry-content.single-page a.button.primary.is-primary');
        if (ClickBTN && ClickBTN.innerText === 'CLICK HERE') {
            let link = ClickBTN.getAttribute('href') || '';
            if (/shrinkme\..*/.test(link)) {
                link = link.replace(/shrinkme\.(org|dev|us)/, 'shrinkme.site');
                ClickBTN.setAttribute('href', link);
            }

            globalObserver.disconnect();
            await sleep(1000);

            parentWindow = PageURL;
            const cached = CacheManager.get(link);
            if (cached) {
                ClickBTN.setAttribute('href', cached.U);
                AutoClickBC.postMessage({
                    type: 'taskComplete',
                    url: PageURL
                });
                UIManager.addResetButton(ClickBTN, link, cached.T);
            } else {
                PopUp = ClickBTN.href;
                if (AutoClick === '1') {
                    AutoClickBC.postMessage({
                        type: 'addTask',
                        url: PageURL
                    });
                    AutoClickBC.onmessage = (e) => {
                        // 메인 페이지로부터 'startTask' 메시지 수신
                        if (e.data && e.data.type === 'startTask' && e.data.url === PageURL) {
                            console.log(`작업 지시 수신: ${PageURL}`);
                            const popupName = document.querySelector(titleSelector)?.innerText.replace(/\s/g, '') || '';
                            childWindow = openPopup(PopUp, popupName);
                        }
                    };
                }
            }

            // Single message event listener
            window.addEventListener('message', function (e) {
                if (!/terabox\.com|1024tera\.com|terabox\.app|en\.mrproblogger\.com/.test(e.origin)) return;

                if (e.data.code && link) {
                    const shortcode = new URL(link).pathname;
                    if (shortcode !== e.data.code) {
                        childWindow?.postMessage({ link: link }, e.origin);
                    }
                }

                if (e.data.Q && childWindow) {
                    childWindow.postMessage({ A: parentWindow }, e.origin);
                } else if (e.data.token) {
                    if (e.data.P === PageURL) {
                        ClickBTN.setAttribute('href', e.data.token);
                        CacheManager.set(PopUp || link, { U: e.data.token, T: e.data.FileName });
                        AutoClickBC.postMessage({
                            type: 'taskComplete',
                            url: PageURL
                        });
                        UIManager.addResetButton(ClickBTN, link, e.data.FileName);
                        if (childWindow) childWindow.postMessage({ S: parentWindow }, e.origin);
                    } else {
                        log("Mismatched P:", e.data);
                    }
                }
            }, false);

            window.addEventListener('beforeunload', () => {
                if (childWindow && !childWindow.closed) {
                    childWindow.postMessage({ action: 'closed' }, '*');
                }
            });
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
 * =============================== */
async function handleAllAsianGirls() {

    const checkSubPage = document.querySelector('body.single-post');
    if (!checkSubPage) {
        window.addEventListener('beforeunload', (e) => {
            if (queue.size) {
                e.preventDefault();
            }
        });
        mainQueueManagemnt();
        return;
    }
    const titleSelector = 'body.single.single-post div.page-title div.page-title-inner.container div .entry-title';
    AutoClick = localStorage.getItem('AutoClick') || '0';
    UIManager.setResponsiveFont();
    UIManager.syncIcon();

    const clickBtn = document.querySelector('div.entry-content.single-page blockquote div a.button.primary.is-primary');
    if (!clickBtn) return;

    clickBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const title = document.querySelector(titleSelector)?.innerText || '';
        childWindow = openPopup(clickBtn.href, title.replace(/\s/g, ''));
    });    

    globalObserver.observe(document, config);
}

async function handleBestGirlSexy() {
    const checkSubPage = document.querySelector('body.single-post');
    if (!checkSubPage) {
        window.addEventListener('beforeunload', (e) => {
            if (queue.size) {
                e.preventDefault();
            }
        });
        mainQueueManagemnt();
        return;
    }
    const copyTitle = document.querySelector('div#content.site-content div.elementor-widget-container .elementor-heading-title')
        ?.textContent.replace(/part\d+$/i, '').trim();
    if (!copyTitle) return;

    const teraLinks = querySelectorIncludesText('A', 'TeraBox');
    if (!teraLinks?.length) return;

    for (const link of teraLinks) {
        const oldHref = link.href;
        parentWindow = PageURL;

        const cached = CacheManager.get(oldHref);
        const title = (copyTitle || '').replace(/\s/g, '');

        const handleMessage = async (e) => {
            if (!/terabox\.com|1024tera\.com|terabox\.app/.test(e.origin)) return;

            if (e.data.Q) {
                childWindow?.postMessage({ A: parentWindow }, e.origin);
            } else if (e.data.token) {
                link.setAttribute('href', e.data.token);
                CacheManager.set(oldHref, { U: e.data.token, T: e.data.FileName });
                AutoClickBC.postMessage({
                    type: 'taskComplete',
                    url: PageURL
                });
                UIManager.addResetButton(link, oldHref, e.data.FileName);
                childWindow?.postMessage({ S: parentWindow }, e.origin);
                await sleep(5000);
                self.close();
            }
        };

        window.addEventListener('message', handleMessage, { once: false });

        if (cached) {
            link.setAttribute('href', cached.U);
            AutoClickBC.postMessage({
                type: 'taskComplete',
                url: PageURL
            });
            UIManager.addResetButton(link, oldHref, cached.T);
            continue; // 이미 캐시된 경우 팝업 필요 없음
        }

        if (AutoClick === '1') {
            AutoClickBC.postMessage({
                type: 'addTask',
                url: PageURL
            });
            AutoClickBC.onmessage = (e) => {
                // 메인 페이지로부터 'startTask' 메시지 수신
                if (e.data && e.data.type === 'startTask' && e.data.url === PageURL) {
                    console.log(`작업 지시 수신: ${PageURL}`);
                    childWindow = openPopup(link.href, title);
                }
            };        

        window.addEventListener('beforeunload', () => {
            if (childWindow && !childWindow.closed) {
                childWindow.postMessage({ action: 'closed' }, '*');
            }
        });
    }
}

async function handleMissKon() {

    AutoClick = localStorage.getItem('AutoClick') || '0';
    UIManager.setResponsiveFont();
    UIManager.syncIcon();
    const checkSubPage = document.querySelector('body.single-post');
    if (!checkSubPage) {
        window.addEventListener('beforeunload', (e) => {
            if (queue.size) {
                e.preventDefault();
            }
        });
        mainQueueManagemnt();
        return;
    }
    const copyTitle = document.querySelector('article#the-post .post-title.entry-title')
        ?.textContent.replace(/part\d+$/i, '').trim();

    if (!copyTitle || /AI\sGenerated/i.test(copyTitle)) {
        AutoClickBC.postMessage({
            type: 'taskComplete',
            url: PageURL
        });
        return;
    }

    const mediaFireLink = querySelectorIncludesText('a.shortc-button', 'MediaFire');
    const teraLink = querySelectorIncludesText('a.shortc-button', 'Terabox');
    if (mediaFireLink.length === 0 && teraLink === 0) return;

    const title = copyTitle.replace(/\s/g, '');

    let oldLink, link, cached;
    if (mediaFireLink.length > 0) {
        oldLink = mediaFireLink[0].href;
        link = mediaFireLink[0];
        cached = CacheManager.get(oldLink);
        if (cached && cached.U === 'NotFound') {
            link.remove();
            return handleMissKon('TeraBox')
        } else {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                childWindow = openPopup(oldLink, title.replace(/\s/g, ''));
            });
        }

    } else {
        oldLink = teraLink[0].href;
        link = teraLink[0];
        cached = CacheManager.get(oldLink);
        link.addEventListener('click', (e) => {
            e.preventDefault();
            childWindow = openPopup(oldLink, title.replace(/\s/g, ''));
        });
    }

    parentWindow = PageURL;

    const handleMessage = async (e) => {
        if (!/terabox\.com|1024tera\.com|terabox\.app|mediafire\.com/.test(e.origin)) return;

        if (/terabox\.com|1024tera\.com|terabox\.app/.test(e.origin)) {
            if (e.data.Q) {
                childWindow?.postMessage({ A: parentWindow }, e.origin);
            } else if (e.data.token) {
                link.href = e.data.token;
                CacheManager.set(oldLink, { U: e.data.token, T: e.data.FileName });
                AutoClickBC.postMessage({
                    type: 'taskComplete',
                    url: PageURL
                });
                UIManager.addResetButton(link, oldLink, e.data.FileName);
                childWindow?.postMessage({ S: parentWindow }, e.origin);
            }
        } else {
            if (e.data.token) {
                if (e.data.token === 'NotFound') {
                    CacheManager.set(oldLink, { U: e.data.token, T: 'File Not Found' });
                    link.remove();
                    childWindow.postMessage({ action: 'closed' }, e.origin);
                    if (teraLink[0]) {
                        return handleMissKon()
                    } else {
                        AutoClickBC.postMessage({
                            type: 'taskComplete',
                            url: PageURL
                        });
                        UIManager.addResetButton(link, oldLink, 'File Not Found');
                    }
                } else {
                    link.href = e.data.token;
                    CacheManager.set(oldLink, { U: e.data.token, T: copyTitle });
                    AutoClickBC.postMessage({
                        type: 'taskComplete',
                        url: PageURL
                    });
                    UIManager.addResetButton(link, oldLink, copyTitle);
                    childWindow.postMessage({ action: 'closed' }, e.origin);
                }
            }
        }
    };

    window.addEventListener('message', handleMessage, { once: false });

    if (cached) {
        link.href = cached.U;
        if (cached.U === 'NotFound') {
            link.remove();
            return handleMissKon()
        } else {
            AutoClickBC.postMessage({
                type: 'taskComplete',
                url: PageURL
            });
            UIManager.addResetButton(link, oldLink, cached.T);
        }
    } else if (AutoClick === '1') {
        AutoClickBC.postMessage({
            type: 'addTask',
            url: PageURL
        });
        AutoClickBC.onmessage = (e) => {
            // 메인 페이지로부터 'startTask' 메시지 수신
            if (e.data && e.data.type === 'startTask' && e.data.url === PageURL) {
                console.log(`작업 지시 수신: ${PageURL}`);
                childWindow = openPopup(link.href, title);
            }
        };
    }

    window.addEventListener('beforeunload', () => {
        if (childWindow && !childWindow.closed) {
            childWindow.postMessage({ action: 'closed' }, '*');
        }
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
    "en.mrproblogger.com": () => { handleMrProBlogger(); reload(); },
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
    "shrinkme.site": () => { reload(); },
    "shrinkme.org": () => { reload(); },
    "ouo.io": () => { reload(); },
    "ouo.press": () => { reload(); },
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
