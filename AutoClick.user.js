// ==UserScript==
// @name         AutoClick (Refactored)
// @version      2025.08.20
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
  right: 50%;
  left: auto;
  top: 0;
  margin: 0 auto;
  max-width: max-content;
  position: fixed !important;
  word-spacing: .5rem;
  font-style: initial !important;
  text-align: center;
  color: dodgerblue !important;
  border-radius: .25em !important;
  -webkit-box-sizing: border-box !important;
  box-sizing: border-box !important;
  z-index: 999999;
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

const titleSelector = 'body.single.single-post div.page-title div.page-title-inner.container div .entry-title';

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
    // 팝업 가로/세로는 고정하지 않고, 기본 브라우저 팝업으로 열기 (차단 회피)
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
    keys() { return GM_listValues().filter(k => k !== 'JobList'); },
    add(url) { GM_setValue(url, true); },
    remove(url) {
        GM_deleteValue(url);
        JobManager.updateList();
    },
    updateList() {
        const jobs = GM_listValues().filter(e => e !== 'JobList');
        GM_setValue('JobList', jobs.length ? `Next Go! ${jobs[0]}` : '');
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
            el.insertAdjacentHTML('afterend', '<i class="Reset fa-solid fa-eraser"></i>');
            resetIcon = document.querySelector('.Reset');
        }

        resetIcon.insertAdjacentHTML('beforeend', `<span class="fileName">${fileName}</span>`);

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
    window.addEventListener('beforeunload', () => JobManager.remove(PageURL));    
}

/* ===============================
 * Site-specific Observers
 * =============================== */
const globalObserver = new MutationObserver(async (mutations) => {
    const href = window.location.href;

    // terabox / 1024tera — detect download button then orchestrate Job queue & messaging
    if (/(terabox|1024tera)\.(app|com)\/.+sharing/.test(href)) {
        ClickBTN = document.querySelector('div.action-bar div.action-bar-download.action-bar-btn');
        if (ClickBTN) {
            globalObserver.disconnect();

            GetFileNameElement = document.querySelector('div.info div.file-name-info span.file-name');
            GetFileName = (GetFileNameElement?.textContent || GetFileNameElement?.innerText || '').trim();

            // Ensure page is registered
            const keys = JobManager.keys();
            if (!keys.includes(PageURL)) JobManager.add(PageURL);

            // Listen for JobList changes across tabs
            GM_addValueChangeListener('JobList', function (key, oldValue, newValue, remote) {
                if (remote) {
                    const jobs = JobManager.keys();
                    if (jobs[0] === PageURL) {
                        Downloader(ClickBTN);
                    }
                }
            });

            const jobs = JobManager.keys();
            if (jobs[0] === PageURL) {
                Downloader(ClickBTN);
            }
        }
        return;
    }

    // allasiangirls.net — fix shrinkme & popup workflow & messaging
    if (/allasiangirls\.net\/.+/.test(href)) {
        ClickBTN = document.querySelector('div.entry-content.single-page a.button.primary.is-primary');
        if (ClickBTN && ClickBTN.innerText === 'CLICK HERE') {
            let link = ClickBTN.getAttribute('href') || '';
            if (/shrinkme\..*/.test(link)) {
                link = link.replace(/shrinkme\.(org|dev|us)/, 'shrinkme.site');
                ClickBTN.setAttribute('href', link);
            }

            globalObserver.disconnect();
            await sleep(3000);

            parentWindow = PageURL;
            const cached = CacheManager.get(link);
            if (cached) {
                ClickBTN.setAttribute('href', cached.U);
                UIManager.addResetButton(ClickBTN, link, cached.T);
            } else {
                PopUp = ClickBTN.href;
                if (AutoClick === '1') {
                    await sleep(getRandomIntInclusive(10, 200) * 10);
                    const popupName = document.querySelector(titleSelector)?.innerText.replace(/\s/g, '') || '';
                    childWindow = openPopup(PopUp, popupName);
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
    const copyTitle = document.querySelector('div#content.site-content div.elementor-widget-container .elementor-heading-title')
        ?.textContent.replace(/part\d+$/i, '').trim();
    if (!copyTitle) return;

    await sleep(3000);

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
                UIManager.addResetButton(link, oldHref, e.data.FileName);
                childWindow?.postMessage({ S: parentWindow }, e.origin);
                await sleep(2500);
                self.close();
            }
        };

        window.addEventListener('message', handleMessage, { once: false });

        if (cached) {
            link.setAttribute('href', cached.U);
            UIManager.addResetButton(link, oldHref, cached.T);
            continue; // 이미 캐시된 경우 팝업 필요 없음
        }

        await sleep(getRandomIntInclusive(0, 500) * 10);
        childWindow = openPopup(link.href, title);

        window.addEventListener('beforeunload', () => {
            if (childWindow && !childWindow.closed) {
                childWindow.postMessage({ action: 'closed' }, '*');
            }
        });
    }
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
    "en.mrproblogger.com": handleMrProBlogger,
    "allasiangirls.net": handleAllAsianGirls,
    "bestgirlsexy.com": handleBestGirlSexy,
    "imgmffmv.sbs": () => globalObserver.observe(document, config),
    "terabox.com": () => { setupBeforeUnloadForJobs(); globalObserver.observe(document, config); },
    "1024tera.com": () => { setupBeforeUnloadForJobs(); globalObserver.observe(document, config); },
    "terabox.app": () => { setupBeforeUnloadForJobs(); globalObserver.observe(document, config); },
    "themezon.net": () => globalObserver.observe(document, config),
    "sehuatang.net": () => setTimeout(() => document.querySelector('body > a.enter-btn')?.click(), 1000),
};

/* ===============================
 * Downloader Orchestrator (TeraBox)
 * =============================== */
async function Downloader(el) {
    const jobs = JobManager.keys();
    if (jobs[0] !== PageURL) return;
    GM_setValue('JobList', jobs.length ? 'Start Click!' : '');

    const messageHandler = async (e) => {
        const origin = new URL(e.origin).origin;
        if (!/bestgirlsexy\.com|allasiangirls\.net/.test(origin)) return;

        if (e.data.A) {
            parentWindow = e.data.A;

            if (window.opener && parentWindow) {
                await sleep(2500);
                el.click();
                await sleep(5000);

                const allowed = ['https://allasiangirls.net', 'https://bestgirlsexy.com'];
                if (allowed.includes(origin)) {
                    window.opener.postMessage({ token: PageURL, FileName: GetFileName, P: parentWindow }, origin);
                }
            }
        } else if (e.data.S || e.data.action === 'closed') {
            await sleep(2500);
            JobManager.remove(PageURL);            
            self.close();
        }
    };

    window.addEventListener('message', messageHandler);
    if (window.opener) {
        window.opener.postMessage({ Q: 'parentWindow?' }, '*');
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
