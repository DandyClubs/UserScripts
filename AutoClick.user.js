// ==UserScript==
// @name         AutoClick
// @version      2025.08.18
// @description  This automatically clicks
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
// @grant		 GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @grant        GM_addValueChangeListener
// @noframes
// ==/UserScript==

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

.AutoClick, .Reset {
 cursor: pointer;
}
.AutoClick.On {
    color: Chartreuse !important;
}

.AutoClick.Off {
    color: MidnightBlue !important;
}

.Reset * {
	font-size: .7rem;
	font-family: Montserrat, sans-serif;
	color: #b513e2;
}

`);

const config = { attributes: true, childList: true, subtree: true }
let ClickBTN, AutoClick
const PageURL = window.location !== window.parent.location ? document.referrer : document.location.href;
let JobList = GM_listValues()

let PopUp, GetFileNameElement, GetFileName, childWindow, parentWindow

const observer = new MutationObserver(async function (mutations) {
    if (/(terabox|1024tera)\.(app|com)\/.+sharing/.test(window.location.href)) {
        ClickBTN = document.querySelector('div.action-bar div.action-bar-download.action-bar-btn');

        if (ClickBTN) {
            observer.disconnect();
            GetFileNameElement = document.querySelector('div.info div.file-name-info span.file-name')
            GetFileName = GetFileNameElement.textContent || GetFileNameElement.innerText


            if (!JobList.includes(PageURL)) {
                GM_setValue(PageURL, true);
            }

            GM_addValueChangeListener('JobList', function (key, oldValue, newValue, remote) {
                if (remote) {
                    JobList = GM_listValues().filter(e => e !== 'JobList');
                    if (JobList[0] === PageURL) {
                        Downloader(ClickBTN);
                    }
                }
            });

            JobList = GM_listValues().filter(e => e !== 'JobList');
            if (JobList[0] === PageURL) {
                Downloader(ClickBTN);
            }
        }
    }


    else if (/allasiangirls\.net\/.+/.test(window.location.href)) {
        ClickBTN = document.querySelector('div.entry-content.single-page a.button.primary.is-primary');

        if (ClickBTN && ClickBTN.innerText === 'CLICK HERE') {
            let Link = ClickBTN.getAttribute('href');

            if (/shrinkme\..*/.test(Link)) {
                Link = Link.replace(/shrinkme\.(org|dev|us)/, 'shrinkme.site');
                ClickBTN.setAttribute('href', Link);
            }

            observer.disconnect();
            await sleep(3000)

            parentWindow = PageURL;

            const cached = localStorage.getItem(Link);
            if (cached) {
                const cachedData = JSON.parse(cached);
                ClickBTN.setAttribute('href', cachedData.U);
                Reset(ClickBTN, Link, cachedData.T);


                //childWindow = window.open(cachedData.U, document.querySelector('body.single.single-post div.page-title div.page-title-inner.container div .entry-title').innerText.replace(/\s/g, ''));

            } else {
                PopUp = ClickBTN.href;

                if (AutoClick == 1) {
                    await sleep(getRandomIntInclusive(10, 200) * 10)
                    // const width = '1280';
                    // const height = '960';

                    // // 팝업을 가운데 위치시키기 위해 아래와 같이 값 구하기
                    // const left = Math.ceil((window.screen.width - width) / 2);
                    // const top = Math.ceil((window.screen.height - height) / 2);
                    // const strOption = `width=${width}, height=${height}, top=${top}, left=${left}, location=no, menubar=no, resizable=no, scrollbars=yes, status=no, toolbar=no`;
                    const popupName = document.querySelector('body.single.single-post div.page-title div.page-title-inner.container div .entry-title').innerText.replace(/\s/g, '')
                    childWindow = window.open(PopUp, popupName);
                }
            }

            // Add a single message event listener
            window.addEventListener('message', function (e) {
                if (!/terabox\.com|1024tera\.com|terabox\.app|en\.mrproblogger\.com/.test(e.origin)) return;

                if (e.data.code && Link) {
                    const shortcode = new URL(Link).pathname
                    if (shortcode !== e.data.code) {
                        childWindow.postMessage({ link: Link }, e.origin);
                    }
                }

                if (e.data.Q && childWindow) {
                    childWindow.postMessage({ A: parentWindow }, e.origin);
                } else if (e.data.token) {
                    if (e.data.P === PageURL) {
                        ClickBTN.setAttribute('href', e.data.token);
                        localStorage.setItem(PopUp || Link, JSON.stringify({ U: e.data.token, T: e.data.FileName }));
                        Reset(ClickBTN, Link, e.data.FileName);
                        if (childWindow) {
                            childWindow.postMessage({ S: parentWindow }, e.origin);
                        }
                    } else {
                        console.log(e.data);
                    }
                }
            }, false);

            window.addEventListener('beforeunload', () => {
                if (childWindow && !childWindow.closed) {
                    childWindow.postMessage({ action: 'closed' }, '*');
                }
            });
        }
    }

    else if (/themezon\.net/.test(window.location.href)) {
        ClickBTN = document.querySelector('div#nextPage a')
        console.log(ClickBTN)
        if (ClickBTN) {
            observer.disconnect()
            window.location.href = ClickBTN.href
        }
    }
    else {
        mutations.forEach(function (mutation) {

            //console.log(document.querySelector('a.page-scroll.no-p.url-link'))
            if (document.querySelector('a.page-scroll.no-p.url-link') && document.querySelector('a.page-scroll.no-p.url-link').innerText) {
                document.querySelector('a.page-scroll.no-p.url-link').click()
            }

            else if (document.querySelector('#newImgE') && !/data:image/.test(document.querySelector('#newImgE').src)) {
                document.location.href = document.querySelector('#newImgE').src
                observer.disconnect()
            }
        })
    }
})

function UpdateJobList() {
    GM_deleteValue(PageURL);

    // get all keys except 'JobList'
    const jobKeys = GM_listValues().filter(e => e !== 'JobList');


    // Save the updated list back, as a JSON string
    GM_setValue('JobList', jobKeys.length ? jobKeys : []);
    // Update the global variable if needed    
}


async function Downloader(el) {
    JobList = GM_listValues().filter(key => key !== 'JobList');

    if (JobList[0] !== PageURL) return;

    const messageHandler = async (e) => {
        const origin = new URL(e.origin).origin;

        if (!/bestgirlsexy\.com|allasiangirls\.net/.test(origin)) return;

        if (e.data.A) {
            parentWindow = e.data.A;

            if (window.opener && parentWindow) {
                await sleep(2500);
                el.click();
                await sleep(5000);

                const allowedOrigins = ['https://allasiangirls.net', 'https://bestgirlsexy.com'];
                if (allowedOrigins.includes(origin)) {
                    window.opener.postMessage(
                        { token: PageURL, FileName: GetFileName, P: parentWindow },
                        origin
                    );
                }
            }
        } else if (e.data.S || e.data.action === 'closed') {
            UpdateJobList();
            self.close();
        }
    };

    window.addEventListener('message', messageHandler);

    if (window.opener) {
        window.opener.postMessage({ Q: 'parentWindow?' }, '*');
    }
}


function Reset(el, link, fileName) {
    let resetIcon = document.querySelector('.Reset');

    if (!resetIcon) {
        el.insertAdjacentHTML('afterend', '<i class="Reset fa-solid fa-eraser"></i>');
        resetIcon = document.querySelector('.Reset');
    }

    resetIcon.insertAdjacentHTML('beforeend', `<span class="fileName">${fileName}</span>`);

    // Remove any previous click listeners to avoid stacking
    const newResetIcon = resetIcon.cloneNode(true);
    resetIcon.replaceWith(newResetIcon);

    newResetIcon.addEventListener('click', (e) => {
        e.preventDefault();
        e.currentTarget.style.color = 'purple';
        localStorage.removeItem(link);
        el.setAttribute('href', link);
        newResetIcon.remove();
    });
}


function getRandomIntInclusive(min, max) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled); // The maximum is inclusive and the minimum is inclusive
}



async function Start() {
    let iurl = window.location.hostname;

    if (/pl\/thumbnails/.test(location.href)) {
        iurl = "thumbnails";
    } else if (/pl\/download/.test(location.href)) {
        iurl = "download";
    } else if (iurl.startsWith("www.")) {
        iurl = iurl.slice(4);
    }

    const titleSelector = 'body.single.single-post div.page-title div.page-title-inner.container div .entry-title';

    switch (iurl) {
        case "thumbnails":
            [
                'banner-top',
                'img-thumbnails-info',
                'show-thumbnails-info',
                'btn-thumbnails',
                'adblock-true',
                'baner-bottom-section'
            ].forEach(domRemove);
            ['img-thumbnails', 'hidden'].forEach(ClassRemove);
            break;

        case "download":
            setTimeout(() => {
                document.querySelector('.btn.btn-primary.btn-download')?.click();
            }, 500);
            break;

        case "ex745.com":
        case "xc745.com":
        case "365shares.net": {
            const clickCheck = setInterval(() => {
                const dlink = document.querySelector('#dlink');
                if (dlink) {
                    clearInterval(clickCheck);
                    dlink.click();
                }
            }, 500);
            break;
        }

        case "newsteez.com":
            setTimeout(() => {
                document.querySelector('.btn.btn-primary')?.click();
            }, 500);
            break;

        case "en.mrproblogger.com": {
            const code = new URL(PageURL).pathname
            if (window.opener) {
                window.opener.postMessage(
                    { code: code },
                    'https://allasiangirls.net'
                );
                window.addEventListener('message', function (e) {
                    if (e.data.link) {
                        location.href = e.data.link;
                    }
                })
            }
            break;
        }

        case "allasiangirls.net": {
            AutoClick = localStorage.getItem('AutoClick');
            MakeIcon();
            const clickBtn = document.querySelector('div.entry-content.single-page blockquote div a.button.primary.is-primary');
            if (!clickBtn) return;

            clickBtn.addEventListener('click', e => {
                e.preventDefault();
                // const width = '1280';
                // const height = '960';

                // // 팝업을 가운데 위치시키기 위해 아래와 같이 값 구하기
                // const left = Math.ceil((window.screen.width - width) / 2);
                // const top = Math.ceil((window.screen.height - height) / 2);
                // const strOption = `width=${width}, height=${height}, top=${top}, left=${left}, location=no, menubar=no, resizable=no, scrollbars=yes, status=no, toolbar=no`;
                const title = document.querySelector(titleSelector)?.innerText || "";
                childWindow = window.open(clickBtn.href, title);
            });

            observer.observe(document, config);
            break;
        }
        case "bestgirlsexy.com": {
            const copyTitle = document.querySelector('div#content.site-content div.elementor-widget-container .elementor-heading-title')
                ?.textContent.replace(/part\d+$/i, '').trim();
            if (!copyTitle) return;

            const teraBoxLinks = querySelectorIncludesText('A', 'TeraBox');
            if (!teraBoxLinks) return;
            await sleep(3000)
            teraBoxLinks.forEach(async link => {
                const oldHref = link.href;
                parentWindow = PageURL;

                const cached = localStorage.getItem(oldHref);
                const title = copyTitle.replace(/\s/g, '');

                const handleMessage = async (e) => {
                    if (!/terabox\.com|1024tera\.com|terabox\.app/.test(e.origin)) return;

                    if (e.data.Q) {
                        childWindow.postMessage({ A: parentWindow }, e.origin);
                    } else if (e.data.token) {
                        link.setAttribute('href', e.data.token);
                        localStorage.setItem(oldHref, JSON.stringify({ U: e.data.token, T: e.data.FileName }));
                        Reset(link, oldHref, e.data.FileName);
                        childWindow.postMessage({ S: parentWindow }, e.origin);
                        await sleep(2500);
                        self.close();
                    }
                };

                window.addEventListener('message', handleMessage);

                if (cached) {
                    const cachedData = JSON.parse(cached);
                    link.setAttribute('href', cachedData.U);
                    Reset(link, oldHref, cachedData.T);
                }
                await sleep(getRandomIntInclusive(0, 500) * 10)
                e.preventDefault();
                // const width = '1280';
                // const height = '960';

                // // 팝업을 가운데 위치시키기 위해 아래와 같이 값 구하기
                // const left = Math.ceil((window.screen.width - width) / 2);
                // const top = Math.ceil((window.screen.height - height) / 2);
                // const strOption = `width=${width}, height=${height}, top=${top}, left=${left}, location=no, menubar=no, resizable=no, scrollbars=yes, status=no, toolbar=no`;
                childWindow = window.open(link.href, title);

                window.addEventListener('beforeunload', () => {
                    if (childWindow && !childWindow.closed) {
                        childWindow.postMessage({ action: 'closed' }, '*');
                    }
                });
            });
            break;
        }

        case "imgmffmv.sbs":
            observer.observe(document, config);
            break;

        case "terabox.com":
        case "1024tera.com":
        case "terabox.app":
            window.addEventListener('beforeunload', () => UpdateJobList());
            observer.observe(document, config);
            break;
        case "themezon.net":
            observer.observe(document, config);
            break;
        case "sehuatang.net":
            setTimeout(() => {
                document.querySelector('body > a.enter-btn')?.click();
            }, 1000);
            break;
    }
}


let GetDPI, DefaultFontSize, CneterBoxFontSize



function querySelectorIncludesText(selector, text) {
    return Array.from(document.querySelectorAll(selector))
        .filter(el => el.textContent.includes(text));
}


function MakeIcon() {
    const dpi = window.devicePixelRatio || 1;
    const defaultFontSize = getDefaultFontSize();
    const scaleFactor = (1 / (dpi / 1.5)) * (16 / defaultFontSize);
    const fontSize = scaleFactor.toFixed(2) + 'rem';

    console.log('DPI:', dpi, 'DefaultFontSize:', defaultFontSize);

    const existingBox = document.querySelector('.AutoClickCenterBox');
    if (!existingBox) {
        document.body.insertAdjacentHTML(
            'afterbegin',
            '<div class="AutoClickCenterBox" style="max-width: max-content;"></div>'
        );
    }

    const box = document.querySelector('.AutoClickCenterBox');
    box.style.setProperty('font-size', fontSize, 'important');

    // Toggle icon based on localStorage
    const autoClickValue = localStorage.getItem('AutoClick') === '1';
    const existingIcon = document.querySelector('.AutoClick');

    if (existingIcon) {
        existingIcon.classList.replace(autoClickValue ? 'Off' : 'On', autoClickValue ? 'On' : 'Off');
    } else {
        box.insertAdjacentHTML(
            'beforeend',
            `<i class="AutoClick ${autoClickValue ? 'On' : 'Off'} fa-solid fa-square-check"></i>`
        );
    }

    // Update icon if localStorage changes (from another tab)
    window.addEventListener('storage', (e) => {
        if (e.key === 'AutoClick') {
            const icon = document.querySelector('.AutoClick');
            if (icon) {
                icon.classList.replace(e.oldValue === '1' ? 'On' : 'Off', e.newValue === '1' ? 'On' : 'Off');
            }
        }
    });

    // Click toggle for AutoClick icon
    document.querySelector('.AutoClick').addEventListener('click', (e) => {
        const icon = e.currentTarget;
        const isOn = icon.classList.contains('On');
        icon.classList.replace(isOn ? 'On' : 'Off', isOn ? 'Off' : 'On');
        localStorage.setItem('AutoClick', isOn ? '0' : '1');
    });
}



window.addEventListener("DOMContentLoaded", () => {
    console.log('AutoClick!', performance.navigation.type);

    window.addEventListener("pageshow", (event) => {
        if (event.persisted) {
            localStorage.setItem('AutoClick', 0);
        }
    });

    insertFontAwesome();
    Start();
}, { once: true });

function insertFontAwesome() {
    const css = document.createElement('link');
    css.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css';
    css.rel = 'stylesheet';
    css.type = 'text/css';
    document.head.appendChild(css);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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