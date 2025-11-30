// ==UserScript==
// @name         all-voyeur.net
// @namespace    http://tampermonkey.net/
// @version      2025.08.20
// @description  try to take over the world!
// @author       You
// @match        https://all-voyeur.net/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=all-voyeur.net
// @require      https://raw.githubusercontent.com/DandyClubs/RootDomain/main/RootDomain.js
// @require      https://raw.githubusercontent.com/DandyClubs/CopyLinksCommonJS/main/CopyLinksCommonJS.js
// @require      https://code.jquery.com/jquery-3.6.1.min.js
// @grant		 GM_addStyle
// @grant        GM_xmlhttpRequest
// @run-at       document-end
// @connect      *
// @noframes
// ==/UserScript==


const FontAwesomeCSS = function () {
    let css = document.createElement('link');
    css.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css';
    css.rel = 'stylesheet';
    css.type = 'text/css';
    document.getElementsByTagName('head')[0].appendChild(css);
};

GM_addStyle(`
@import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c&family=Nanum+Gothic&family=Nanum+Gothic+Coding&family=Noto+Sans&display=swap');

:root {
  --main-color: LimeGreen; /* 전역 변수 정의 */
}

.CloseIcon, .CopyIcon, .Minus, .GetTitle, .IDSearch {
    text-align: center;
    cursor: pointer;
    color: LimeGreen !important;
    font-style: initial !important;
}


li.post:hover div.article a:link {
	color: #000000 !important;
}

li.post div.article a:visited {
	color: #FF9800 !important;
}

.IconSet {
    word-spacing: .5rem;
    white-space : nowrap;
    top: var(--SetTop);
    left: var(--SetLeft);
    position: fixed !important;
    padding: 1px 0.25em 1px 0.25em !important;
    border-radius: .25em !important;
    -webkit-box-sizing: border-box !important;
    box-sizing: border-box !important;
    background-color: rgba(0,0,0,0.5) !important;
    z-index: 999999;
}

.CopyNotice {
    font-family: 'Nanum Gothic', 'M PLUS Rounded 1c', 'Noto Sans', sans-serif !important;
    margin-left: auto;
    margin-right: auto;
    border-radius: 4px;
    color: white !important;
    background: rgba(255, 110, 0, 0.75) !important;
    padding: .25em 1em;
    white-space: pre;
 	text-shadow: initial !important;
    text-align: left;
    line-height: 1.25em;
	font-weight: 500 !important;
	font-style: initial !important;
    display: -webkit-box;
    -webkit-line-clamp: 15;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    position: fixed !important;
    z-index: 999999;
}

.CenterBox {
    right: 50%;
    left: auto;
    top: 1px;
    margin: 0 auto;
    max-width: max-content;
    position: fixed !important;
    word-spacing: .5rem;
    font-style: initial !important;
    text-align: center;
    color: LimeGreen !important;
    padding: 1px 0.5em 1px 0.25em !important;
    border-radius: .25em !important;
    -webkit-box-sizing: border-box !important;
    box-sizing: border-box !important;
    background-color: rgba(0,0,0,0.5) !important;
}


.ToTop {
    font-style: initial !important;
    text-align: center;
    cursor: pointer;
    padding: .25em !important;
    color: LimeGreen !important;
    background-color:transparent !important;
}

.CopyButton, .ClearButton {
    font-style: initial !important;
    word-spacing: .5rem;
    cursor: pointer;
    color: var(--main-color) !important;
    background-color:transparent !important;
}

.State {
    display: inline-block;
    font-weight: bold;
    text-align: right;
    vertical-align: middle;
    font-family: 'Noto Sans', sans-serif !important;
    font-style: italic !important;
    max-width: 12ch;
    transform: scale(0.65);
    color: WhiteSmoke !important;
    background-color:transparent !important;
}

.AutoClose {
    word-spacing: .5rem;
    white-space : nowrap;
    top: var(--SetTop);
    left: var(--SetLeft);
    position: fixed !important;
    padding: 0.25em !important;
    border-radius: .25em !important;
    -webkit-box-sizing: border-box !important;
    box-sizing: border-box !important;
    background-color: rgba(0,0,0,0.5) !important;
    cursor: pointer;
}

.AutoClose.On {
    color: LawnGreen !important;
    opacity: 1;
}

.AutoClose.Off {
    color: LightGrey !important;
    opacity: 0.25;
}



`);


const PageURL = window.location !== window.parent.location ? document.referrer : document.location.href;
const RootDomain = extractRootDomain(PageURL);
let AutoCopy = false;
//console.log(RootDomainDB)

let InfoArea = [];

const SkipClassNames = ['adead_link', 'autohyperlink', 'social-icon'];
let SkipFilter = new RegExp('safedl\\.net|katfile\\.com\\/free\\d+.html|developershome|md5file\\.com|attachment|premium|upgrade|javascript|search|SKIP|#$|^\/|^(?=.*' + RootDomain + ')(?!.*\\?site).*$');
const TitleExr = /(GetTitle\s:\s?)(.+)/;
const ExcludeChar = /[<\/:>*?"|\\]/g;

let TitleDBIndex = [], GetDPI, DefaultFontSize, CenterBoxFontSize, StateFontSize, StateLineHeight, CenterBoxZIndex;

let CopyOffSetArea;

let GetState, PackageCount;
let RootDomainDB = [];

let AutoClose = localStorage.getItem('AutoClose') || 0;

async function Start() {
    console.log('Link Copy Start!');

    const $ = document.querySelector.bind(document);
    const $$ = document.querySelectorAll.bind(document);

    let GetDPI = window.devicePixelRatio;
    let DefaultFontSize = getDefaultFontSize();
    console.log('GetDPI:', GetDPI, 'DefaultFontSize:', DefaultFontSize);

    const calcFont = (multiplier = 1) =>
        `${((1 / (GetDPI / 1.5)) * multiplier * (16 / DefaultFontSize)).toFixed(2)}rem`;

    const CenterBoxFontSize = calcFont(1);
    const StateFontSize = calcFont(0.65);
    const StateLineHeight = CenterBoxFontSize;


    document.body.insertAdjacentHTML('beforeend', `
        <div class="CenterBox" style="display: none;">
            <i class="ToTop fa-solid fa-circle-chevron-up"></i>
            <i class="ClearButton far fa-minus-square"></i>
            <i class="CopyButton fas fa-paste"></i>
            <i class="State"></i>
        </div>
    `);

    const centerBox = $('.CenterBox');
    centerBox.style.cssText = `font-size: ${CenterBoxFontSize}; display: block;`;

    $('.ToTop').onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });

    const autoCloseState = localStorage.getItem('AutoClose') ? 'On' : 'Off';
    centerBox.insertAdjacentHTML('afterend', `<div class="AutoClose ${autoCloseState} fa-solid fa-square-check"></div>`);
    const autoClose = $('.AutoClose');

    function applyElementPosition(element, target, offsetX = 0) {
        if (!element || !target) return;
        const top = target.offsetTop + (target.offsetHeight - element.offsetHeight) / 2;
        const left = target.offsetLeft + offsetX;
        element.style.position = 'fixed';
        element.style.setProperty('--SetTop', `${Math.floor(top)}px`);
        element.style.setProperty('--SetLeft', `${Math.floor(left)}px`);
        element.style.zIndex = CenterBoxZIndex;
    }

    function updateUIPositions() {
        GetDPI = window.devicePixelRatio;
        DefaultFontSize = getDefaultFontSize();

        const newFontSize = calcFont(1);
        centerBox.style.cssText = `font-size: ${newFontSize}; z-index: ${CenterBoxZIndex}; display: block;`;

        const iconSet = $('.IconSet');
        if (iconSet) {
            applyElementPosition(iconSet, centerBox, centerBox.offsetWidth + centerBox.offsetHeight);
        }

        if (autoClose) {
            autoClose.style.fontSize = calcFont(0.9);
            applyElementPosition(autoClose, centerBox, -centerBox.offsetHeight * 2);
        }
    }

    window.visualViewport.addEventListener("resize", updateUIPositions);

    const resizeObserver = new ResizeObserver(updateUIPositions);
    resizeObserver.observe(centerBox);

    autoClose.addEventListener('click', (e) => {
        e.preventDefault();
        const isOff = e.target.classList.contains("Off");
        e.target.classList.toggle("Off", !isOff);
        e.target.classList.toggle("On", isOff);
        localStorage.setItem('AutoClose', isOff ? '1' : '0');
        AutoCopy = !!isOff;
    });

    const handlers = {
        ClearButton: () => {
            Object.keys(localStorage).forEach(key => {
                if (/^http.+/.test(key)) localStorage.removeItem(key);
            });
            UpdateDB();
        },

        CopyButton: (target) => {
            UpdateDB();
            target.style.setProperty('--main-color', 'white');
            JDownloaderDB(RootDomainDB);
        },

        CopyIcon: async () => {
            await CopyItems();
            UpdateDB();
        },

        CloseIcon: () => {
            self.close();
        },

        Minus: () => {
            const postContent = document.querySelector('#post_content');
            if (!postContent) return;
            const allLinks = Array.from(postContent.querySelectorAll('a'))
                .map(a => a.href)
                .filter(href => href && !SkipFilter.test(href));
            const uniqueLinks = [...new Set(allLinks)];
            uniqueLinks.forEach(link => localStorage.removeItem(link));
            UpdateDB();
        }
    };

    document.addEventListener('click', async (e) => {
        const target = e.target;

        for (const className in handlers) {
            if (target.classList.contains(className)) {
                e.preventDefault();
                // async 핸들러 지원 위해 await 처리
                await handlers[className](target);
                break; // 하나만 처리
            }
        }
    });

    const CopyOffSetArea = $('#post_content');

    UpdateDB();
    if (!CopyOffSetArea) return;

    if (CopyOffSetArea && !$('.IconSet')) {
        centerBox.insertAdjacentHTML('afterend', `
            <div class="IconSet" style="max-width: max-content; position: fixed;">
                <i class="CopyIcon far fa-clone" style="color: goldenrod !important;"></i>
                <i class="CloseIcon fa-solid fa-square-xmark" style="color: goldenrod !important;"></i>
                <i class="Minus fa-solid fa-magnifying-glass-minus" style="color: goldenrod !important; visibility:hidden;"></i>
            </div>
        `);

        document.body.insertAdjacentHTML('beforeend', `<div class="CopyNotice" style="display: none;"></div>`);

        if (localStorage.getItem('AutoClose') === '1') {
            CopyItems();
            UpdateDB();
        }

        const iconSet = $('.IconSet');
        if (iconSet) iconSet.style.fontSize = calcFont(0.95);
    }
}


FontAwesomeCSS();

GetOriginalURL('a[href*="https://safedl.net/dl"]');

async function GetOriginalURL(selector) {
    const linkElements = Array.from(document.querySelectorAll(selector));
    if (!linkElements.length) {
        Start(); // 처리할 링크 없으면 즉시 Start
        return;
    }

    const uniqueLinks = [...new Set(linkElements.map(el => el.href))];

    // safedl 링크 -> 실제 링크 추출
    const resolveSafedlLink = (url) => {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: url,
                onload: (resp) => {
                    const match = /window\.location='(?<url>http[^']+)'/.exec(resp.responseText);
                    if (match?.groups?.url) {
                        updateDOMWithDirectLink(url, match.groups.url);
                        resolve(match.groups.url);
                    } else {
                        console.warn('No redirect found in', url);
                        resolve(null);
                    }
                },
                onerror: (err) => {
                    console.error('Request error:', err);
                    reject(err);
                }
            });
        });
    };

    // 실제 링크로 DOM 업데이트
    const updateDOMWithDirectLink = (originalURL, realURL) => {
        const anchors = document.querySelectorAll(`a[href="${originalURL}"]`);
        anchors.forEach(anchor => {
            anchor.href = realURL;
            if (/safedl\.net/.test(anchor.textContent)) {
                anchor.textContent = realURL;
            }
        });
    };

    try {
        const promises = uniqueLinks.map(resolveSafedlLink);
        await Promise.allSettled(promises);
    } catch (e) {
        console.warn('Error while resolving safedl links:', e);
    } finally {
        Start(); // 완료 후 항상 호출
    }
}


window.addEventListener('storage', (e) => {
    if (localStorage.getItem('AutoClose') == 1) {
        CopyItems();
    }
    UpdateDB();
});


function UpdateDB() {
    const clearBtn = document.querySelector('.ClearButton');
    const copyBtn = document.querySelector('.CopyButton');
    const stateBox = document.querySelector('.State');
    const autoCloseBtn = document.querySelector('.AutoClose');
    const minusBtn = document.querySelector('.Minus');
    const postLinks = document.querySelectorAll('#post_content');

    const entries = Object.entries(localStorage)
        .filter(([key]) => /^http.+/.test(key))
        .map(([key, value]) => ({ U: key, T: value }));

    RootDomainDB = entries;
    const packageList = PackageList(entries);
    const count = entries.length;
    const pkgCount = packageList?.length;

    stateBox.textContent = `${count} | ${pkgCount}`;

    const opacity = count === 0 ? "0.25" : "1";
    clearBtn.style.opacity = opacity;
    copyBtn.style.opacity = opacity;
    copyBtn.style.setProperty('--main-color', 'LimeGreen');

    // AutoClose 상태 반영
    const autoCloseEnabled = localStorage.getItem('AutoClose') === '1';
    if (autoCloseBtn) {
        autoCloseBtn.classList.remove(autoCloseEnabled ? 'Off' : 'On');
        autoCloseBtn.classList.add(autoCloseEnabled ? 'On' : 'Off');
    }

    // Minus 버튼 표시 조건
    if (minusBtn) {
        try {
            if (count > 0) {
                const currentPostLinks = listToDo(postLinks);
                const showMinus = entries.some(item =>
                    currentPostLinks.includes(item.U) && item.U !== 'AutoClose'
                );

                minusBtn.style.visibility = showMinus ? 'visible' : 'hidden';

                if (showMinus && autoCloseEnabled) {
                    setTimeout(() => self.close(), 2000);
                }
            } else {
                minusBtn.style.visibility = 'hidden';
            }
        } catch (err) {
            console.warn('Error checking Minus visibility:', err);
        }
    }

    return RootDomainDB;
}


function listToDo(Area) {
    const List = [];
    const CheckSet = new Set(); // 중복 검사용 Set 사용

    try {
        Area.forEach(linkEntry => {
            linkEntry.querySelectorAll('a').forEach(aEntry => {
                if (!CheckSet.has(aEntry)) {
                    CheckSet.add(aEntry);
                }
            });
        });

        for (const aEntry of CheckSet) {
            const href = aEntry.href;
            if (!href) continue;

            const skipLink = SkipFilter.test(href);
            const hasImgChild = /(uploadgig\.com\/file\/download|alfafile\.net\/file)/.test(href)
                && Array.from(aEntry.children).some(child => child.matches('img'));

            if (skipLink || hasImgChild) continue;

            const target = href.replace(/\?site.+/, '');
            if (!List.includes(target)) {
                List.push(target);
            }
        }

        return List;
    } catch (err) {
        console.error(err);
        return [];
    }
}



function removeHTML(str) {
    var tmp = document.createElement("DIV");
    tmp.innerHTML = str;
    return tmp.textContent || tmp.innerText || "";
}


// Title 정규화 및 바이트 제한
function NormalizeTitle(title) {
    title = title.replace(/^(】 ?:|】:|：|】：|】)/, "").trim();
    title = FilenameConvert(title); // 사용자가 정의한 함수
    if (byteLengthOfCheck(title) > 241) {
        title = byteLengthOf(title, 241).trim();
    }
    return title;
}

function CheckTitle(startIndex) {
    const result = InfoArea.reduce((acc, line, idx) => {
        if (idx >= startIndex && TitleExr.test(line)) acc.push(idx);
        return acc;
    }, []);

    return result.length > 0 ? result : [0];
}


function extractText(DOMElement) {
    if (!DOMElement) return [];

    return Array.from(DOMElement.childNodes)
        .filter(child => child.textContent?.trim())
        .map(child => {            
            const text = child.textContent.trim();
            const isTitle = /<h[12].+<\/h[12]>/s.test(child.outerHTML) || /<div class="title-04">\s*<div class="red"/s.test(child.outerHTML);
            if (isTitle) {
                return 'GetTitle :' + text.trim();
            } else {
                return text.replace('\n', ' ').replace('Download (ダウンロード):', '').trim();
            }
        });
}

function createArea(A, B) {
    if (B) {
        A.appendChild(B);
    }
    return A;
}

// 슬라이드 애니메이션 (slideToggle 대체)
function slideToggle(el, duration = 300) {
    const isHidden = window.getComputedStyle(el).display === 'none';
    el.style.transition = `max-height ${duration}ms ease-in-out, opacity ${duration}ms ease-in-out`;
    el.style.overflow = 'hidden';
    if (isHidden) {
        el.style.display = 'block';
        el.style.maxHeight = '0';
        el.style.opacity = '0';
        requestAnimationFrame(() => {
            el.style.maxHeight = el.scrollHeight + 'px';
            el.style.opacity = '1';
        });
    } else {
        el.style.maxHeight = el.scrollHeight + 'px';
        el.style.opacity = '1';
        requestAnimationFrame(() => {
            el.style.maxHeight = '0';
            el.style.opacity = '0';
        });
        setTimeout(() => {
            el.style.display = 'none';
            el.textContent = '';
        }, duration);
    }
}

// Sleep helper
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 메인 실행 함수
async function CopyItems() {
    console.log('CopyItems Start!');
    const titleParagraph = document.querySelector('div#post_content > div div.item-top > div.title-04 > p');
    const mutilTitleParagraph = document.querySelectorAll('div#post_content > h1 > span');
    const singleParagraph = document.querySelector('div#content div.article_container');
    const mainContent = document.querySelector('div#post_content');
    const baseElement = titleParagraph ? createArea(
        document.querySelector('div#post_content > div div.item-top > div.title-04'),
        mainContent.querySelector('p')
    ) : mutilTitleParagraph?.length > 0 ? mainContent : singleParagraph;
    console.log(titleParagraph, mutilTitleParagraph, mainContent, baseElement);

    InfoArea = extractText(baseElement)
        .flatMap(e => e.split('\n'))
        .map(e => e.trim())
        .filter(Boolean);

    TitleDBIndex = CheckTitle(0);
    console.log(InfoArea, TitleDBIndex, baseElement);

    const LinksDB = [];
    let Notice = '';

    for (let i = 0; i < TitleDBIndex.length; i++) {
        const First = TitleDBIndex[i];
        const Last = TitleDBIndex[i + 1] ?? InfoArea.length;
        const rawTitle = InfoArea[First].match(TitleExr)?.[2] || InfoArea[First];
        const Title = NormalizeTitle(rawTitle);
        console.log(Title, First, Last);
        for (let j = First + 1; j < Last; j++) {
            const line = InfoArea[j];
            if (/GetTitle/.test(line)) break;
            if (/^https?:/.test(line) && !SkipFilter.test(line)) {
                LinksDB.push({ U: line, T: Title });
                Notice += `${Title}\n${line}\n`;
                localStorage.setItem(line, Title);
            }
        }
    }

    const CopyNotice = document.querySelector('.CopyNotice');
    if (LinksDB.length) {
        CopyNotice.textContent = Notice;

        // 위치 설정
        const CenterBox = document.querySelector('.CenterBox');
        CopyNotice.style.fontSize = ((1 / (GetDPI / 1.5)) * 0.6 * (16 / DefaultFontSize)).toFixed(2) + 'rem';
        CopyNotice.style.position = 'absolute';
        CopyNotice.style.top = (CenterBox.offsetHeight + CenterBox.offsetTop * 1.5) + 'px';
        CopyNotice.style.left = (CenterBox.offsetLeft - CenterBox.offsetWidth) + 'px';

        // 애니메이션 표시
        slideToggle(CopyNotice, 500);
        await sleep(2000);
        slideToggle(CopyNotice, 1000);

        if (localStorage.getItem('AutoClose') === '1') {
            setTimeout(() => self.close(), 3000);
        }
    } else {
        CopyNotice.textContent = 'Empty...............';
        slideToggle(CopyNotice, 1000);
    }
}




function PackageList(LinksDB) {
    if (LinksDB?.length > 0) {
        let uniqueTitle = [...new Set(LinksDB.map(x => x.T))];
        console.log(uniqueTitle);
        return uniqueTitle;
    }
    else {
        return [];
    }
}

function byteLengthOfCheck(str) {
    return new Blob([str]).size;
}

function byteLengthOf(str, maxBytes) {
    let result = '';
    let bytes = 0;
    for (const char of str) {
        const charBytes = byteLengthOfCheck(char);
        if (bytes + charBytes > maxBytes) break;
        result += char;
        bytes += charBytes;
    }
    return result;
}

function FilenameConvert(str) {
    const replaceMap = {
        '/': '／',
        '\\': '＼',
        ':': '：',
        '*': '＊',
        '?': '？',
        '"': '＂',
        '<': '＜',
        '>': '＞',
        '|': '｜',
    };
    return str.replace(/[\/\\:*?"<>|]/g, match => replaceMap[match]);
}


function JDownloader(JdownloaderData, PackageName) {
    console.log(PackageName + '\n' + JdownloaderData);
    if (JdownloaderData) {
        /*
        $.post("http://127.0.0.1:9666/flash/add", {
            urls: JdownloaderData,
            referer: PageURL,
            package: PackageName
        })
        */
        let data = new URLSearchParams();
        data.append(`urls`, JdownloaderData);
        data.append(`referer`, PageURL);
        if (PackageName) {
            data.append(`package`, PackageName);
        }
        //console.log(data)
        fetch('http://127.0.0.1:9666/flash/add', {
            method: 'POST',
            //mode: 'cors',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            },
            body: data
        });

    }

}

function JDownloaderDB(LinksDB) {
    let uniqueTitle = [...new Set(LinksDB.map(x => x.T))] || [...new Set(LinksDB.map(x => x.U))];
    //console.log(uniqueTitle)
    uniqueTitle.forEach(x => JDownloader(GetMatchLinks(x, LinksDB), x));
}

function GetMatchLinks(text, LinksDB) {
    if (typeof text !== 'string' || !Array.isArray(LinksDB)) {
        console.warn('Invalid input to GetMatchLinks:', { text, LinksDB });
        return '';
    }

    try {
        return LinksDB
            .filter(item => text.includes(item.T))
            .map(item => item.U)
            .join('\r\n');
    } catch (err) {
        console.error('GetMatchLinks error:', err, { text, LinksDB });
        return '';
    }
}
