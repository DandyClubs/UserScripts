// ==UserScript==
// @name         eyny Copy Links
// @namespace    http://tampermonkey.net/
// @version      2025.08.13
// @description  try to take over the world!
// @author       You
// @include      /eyny\.com\/forum\.php\?mod=viewthread/
// @include      /eyny\.com\/thread-.*\.html/
// @include      https://*.eyny.com/home.php?mod=space*
// @include      https://*.eyny.com/forum.php?mod=forumdisplay*
// @grant        GM_setClipboard
// @grant		 GM_addStyle
// @grant		 GM_openInTab
// @run-at       document-end
// @grant		 GM_xmlhttpRequest
// @connect      *
// @grant        unsafeWindow
// @require      https://raw.githubusercontent.com/DandyClubs/RootDomain/main/RootDomain.js
// @require      https://raw.githubusercontent.com/DandyClubs/CopyLinksCommonJS/main/CopyLinksCommonJS.js
// @require      https://raw.githubusercontent.com/DandyClubs/CopyLinksCommonJS/main/extractMetaInfoLinks.user.js
// @require      https://code.jquery.com/jquery-3.7.1.min.js
// @exclude      /www\.eyny\.com\/forum\.php\?mod=viewthread.*dateline$/
// @noframes
// ==/UserScript==

// ====================================================================================
// 전역 변수 및 상수 정의
// ====================================================================================

const FontAwesomeCSS = function () {
    let css = document.createElement('link')
    css.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css'
    css.rel = 'stylesheet'
    css.type = 'text/css'
    document.getElementsByTagName('head')[0].appendChild(css)
}

GM_addStyle(`
    @import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c&family=Nanum+Gothic&family=ZCOOL+KuaiLe&display=swap');

    .CopyItemIcon, .CopyKatIcon, .CloseIcon, .ThanksReply {
        cursor: pointer !important;
        color: dodgerblue !important;
        vertical-align: middle;
    }

    .CopyNotice {
        position: fixed !important;
        font-family: 'Nanum Gothic', 'M PLUS Rounded 1c', 'ZCOOL+KuaiLe', sans-serif !important;
        margin-left: auto;
        margin-right: auto;
        border-radius: 4px;
        color: white !important;
        background: rgba(255, 165, 0, 0.85) !important;
        padding: .25em 1em;
        z-index: 999999999 !important;
        white-space: pre;
        text-shadow: initial !important;
        text-align: left;
        line-height: 1.25em;
        font-weight: initial !important;
        font-style: initial !important;
    }

    .CopyItemBox{
        right: 30%;
        left: auto;
        top: 40%;
        margin: 0 auto;
        max-width: max-content;
        position: fixed !important;
        word-spacing: .5rem;
        padding: .25em;
        font-style: initial !important;
        text-align: center;
        color: dodgerblue !important;
        background-color:transparent !important;
        text-shadow: -1px 0px white, 0px 1px white, 1px 0px white, 0px -1px white;
        display: flex;
        align-items: center;
    }

    .CopyItemBox i{
        margin: .25em;
        padding: .25em;
    }
    .CenterBox {
        right: 50%;
        left: auto;
        margin: 0 auto;
        max-width: max-content;
        position: fixed !important;
        word-spacing: .5rem;
        font-style: initial !important;
        text-align: center;
        color: dodgerblue !important;
        padding: 1px 0.5em 1px 0.25em !important;
        border-radius: .25em !important;
        -webkit-box-sizing: border-box !important;
        box-sizing: border-box !important;
    }

    .ToTop {
        font-style: initial !important;
        text-align: center;
        cursor: pointer;
        padding: .25em !important;
        background-color:transparent !important;
        text-shadow: -1px 0px white, 0px 1px white, 1px 0px white, 0px -1px white;
    }

    .State {
        display: inline;
        font-weight: bold;
        text-align: center;
        vertical-align: middle;
        font-family: 'Noto Sans', sans-serif !important;
        padding: .25em !important;
        font-style: italic !important;
        background-color:transparent !important;
    }

    .CopyButton, .ClearButton {
        font-style: initial !important;
        word-spacing: .5rem;
        cursor: pointer;
        background-color:transparent !important;
        text-shadow: -1px 0px white, 0px 1px white, 1px 0px white, 1px -1px white;
    }
`);



// 폰트 크기 및 DPI 관련 변수를 최상위에 선언
const getDPI = window.devicePixelRatio;
const defaultFontSize = getDefaultFontSize();
const PAGE_URL = window.location.href;
const ROOT_DOMAIN = extractRootDomain(PAGE_URL);

// 필터링 및 정규식 상수를 최상위에 정의
let SKIP_FILTER = new RegExp('windfiles\\.com|mypikpak\\.com|pricing\\?aff|mega\\.nz\\/aff|katfile\\.com\\/free\\d+.html|developershome|md5file\\.com|attachment|premium|upgrade|javascript|search|SKIP|#$|^\/|^(?=.*' + ROOT_DOMAIN + ')(?!.*\\?site).*$');
const SKIP_CLASS_NAMES = ['adead_link', 'autohyperlink', 'social-icon'];
const SKIP_TITLE = ['ACZD', 'HIGR'];
const EXCLUDE_CHAR = /[<\/:>*?"|\\]/g;
const TITLE_EXPR = /(影片名稱|電子書名稱|檔案名稱|資源格式|影片名称|本片名稱)(.*)/;

// 동적으로 할당될 변수들
let area, infoArea;
let titleDBIndex = [];
let rootDomainDB;
let folderLinksExpand = false;
let linksDB = [];

// DOM 요소 변수들
let centerBox = null;
let toTopButton = null;
let clearButton = null;
let copyButton = null;
let stateElement = null;

// ====================================================================================
// 초기화 및 메인 실행 로직
// ====================================================================================

// 아이콘 생성 및 초기 상태 설정
MakeIcon();


const PageURL = window.location !== window.parent.location ? document.referrer : document.location.href;
const siteRules = [
    {
        regex: /eyny\.com\/forum\.php\?mod=viewthread/,
        separatorText: ['影片名稱'],
        area: document.querySelector('div#postlist td[id^="postmessage"]'),
        priority: ['3840', '1920', '1280', '720'],
        coverImage: '',
        useResolution: true,
        getTitleRegex: /(?<=影片名稱】[：:])(.*?)(?=(?:【影片大小.*$)?(?:$))/m,
        getTitleMatchPoint: 0,
        passwordRegex: /解壓密碼】[：:]?(.*?)\s*(.+)/,
        breakPoint: ['需要存取權'],
    },
]


// 사이트별 특별 규칙 적용
const rule = siteRules.find((r) => r.regex.test(PageURL));


window.addEventListener('storage', (e) => {
    rootDomainDB = JSON.parse(localStorage.getItem(ROOT_DOMAIN)) || [];
    if (centerBox) {
        stateElement.innerText = `${rootDomainDB?.length} | ${PackageList(rootDomainDB)?.length}`;
        clearButton.style.color = "dodgerblue";
        copyButton.style.color = "dodgerblue";
    }
});

// 특정 포럼 페이지를 제외
const forumList = document.querySelectorAll('div#wp.wp div#pt.bm.cl div.z a');
const matchText = [...forumList].some((elem) => elem.textContent === '18+收藏俱樂部');
if (matchText) {
    return;
}

const subjectText = document.querySelector('div#postlist a#thread_subject')?.innerText
const lableText = subjectText?.match(/^kuzu_v0/) ? subjectText.match(/^kuzu_v0/)[0] + ' ' : ''

// 폰트어썸 CSS 로드 및 메인 로직 실행
FontAwesomeCSS();
//main();

function main() {
    const postBodyElement = document.querySelector('div.pcb > div > table > tbody');
    if (postBodyElement) {
        const matchingAreas = MatchRegex(postBodyElement, new RegExp('postmessage'), 'id');
        area = matchingAreas[0];
    }

    if (!area) return;

    const katFolderLinks = area.querySelectorAll('a[href*="https://katfile.com/f/"]');

    if (katFolderLinks?.length && folderLinksExpand) {
        const urls = Array.from(katFolderLinks).map(link => link.href);

        const getLinks = async (urlsDB) => await Promise.allSettled(urlsDB.map(item => FoldertoFileLinks(item)));

        getLinks(urls).then(() => {
            for (const { U, R } of linksDB) {
                let resort = R.map(x => x.replace(/.*(katfile|fikper)\.com\/.*\//, '')).sort();
                let links = resort.map(t => R.filter(x => x.includes(t)));

                let replaceArea = document.createElement('span');
                for (const link of links) {
                    replaceArea.innerHTML += `<a href="${link}">${decodeURIComponent(link)}</a>${link === links.at(-1) ? '' : '<br>'}`;
                }
                area.querySelector(`a[href*="${U}"]`).replaceWith(replaceArea);
            }
        }).then(() => {
            CheckInfoArea();
        });
    } else {
        CheckInfoArea();
    }
}


// ====================================================================================
// 함수 정의
// ====================================================================================

function MakeIcon() {
    // CenterBox 아이콘 생성 로직 (이전 응답과 동일)
    const iconHTML = `
        <div class="CenterBox">
            <i class="ToTop fa-solid fa-circle-chevron-up"></i>
            <i class="ClearButton far fa-minus-square"></i>
            <i class="CopyButton fas fa-paste"></i>
            <i class="State"></i>
        </div>
    `;
    document.querySelector("body").insertAdjacentHTML('afterbegin', iconHTML);

    centerBox = document.querySelector(".CenterBox");
    if (centerBox) {
        toTopButton = centerBox.querySelector(".ToTop");
        clearButton = centerBox.querySelector(".ClearButton");
        copyButton = centerBox.querySelector(".CopyButton");
        stateElement = centerBox.querySelector('.State');
    }

    const baseFontSize = (1 / (getDPI / 1.5)) * (16 / defaultFontSize);
    const stateFontSize = baseFontSize * 0.65;

    if (centerBox) {
        centerBox.style.setProperty('font-size', baseFontSize + 'rem', 'important');
    }
    if (stateElement) {
        stateElement.style.setProperty('font-size', stateFontSize + 'rem', 'important');
    }

    if (toTopButton) {
        toTopButton.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (clearButton) {
        clearButton.addEventListener("click", event => {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            clearUrls();
        });
    }

    if (copyButton) {
        copyButton.addEventListener("click", event => {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            clipPaste();
        });
    }

    (async () => {
        rootDomainDB = JSON.parse(localStorage.getItem(ROOT_DOMAIN)) || [];
        if (stateElement) {
            stateElement.innerText = `${rootDomainDB?.length} | ${PackageList(rootDomainDB)?.length}`;
        }
    })();
}

// ---
// CopyItemBox와 관련된 아이콘들을 생성하고 이벤트 리스너를 할당하는 블록
// ---

if (!document.querySelector('.CopyItemIcon') && document.querySelector('.pg_viewthread') && document.querySelector('.plc.ptm.pbn > div.y')) {

    const copyItemHTML = `
        <div class="CopyItemBox">
            <i class="CopyItemIcon fa-regular fa-clipboard"></i>
            <i class="CopyKatIcon fa-brands fa-kickstarter"></i>
            <i class="CloseIcon fa-regular fa-circle-xmark"></i>
            <i class="ThanksReply fa-solid fa-heart"></i>
        </div>
    `;

    document.querySelector('body').insertAdjacentHTML('beforeend', copyItemHTML);
    document.querySelector('body').insertAdjacentHTML('afterend', '&nbsp;&nbsp;<div class="CopyNotice" style="display: none;"></div>');

    // 삽입된 DOM 요소들을 변수에 저장하여 재사용합니다.


    const copyItemBox = document.querySelector('.CopyItemBox');
    const copyItemIcon = copyItemBox.querySelector('.CopyItemIcon');
    const copyKatIcon = copyItemBox.querySelector('.CopyKatIcon');
    const closeIcon = copyItemBox.querySelector('.CloseIcon');
    const thanksReplyIcon = copyItemBox.querySelector('.ThanksReply');

    const copyTitleArea = document.querySelector('div#postlist.pl table tbody tr td.plc.ptm.pbn h1.ts');

    const fontHeight = parseFloat(window.getComputedStyle(copyTitleArea).fontSize) / defaultFontSize;
    const iconSize = Math.min((1 / (getDPI / 1.5)) * (16 / defaultFontSize), fontHeight);

    copyItemIcon.style.setProperty('font-size', `${iconSize}rem`, 'important');

    // 이벤트 리스너 할당
    copyItemIcon.addEventListener("click", function (e) {
        e.preventDefault();
        copyItemIcon.style.setProperty('color', 'Orange', 'important');
        CopyProcess();
    });

    copyKatIcon.addEventListener("click", function (e) {
        e.preventDefault();
        SKIP_FILTER = new RegExp('developershome|md5file\.com|attachment|premium|upgrade|javascript|search|SKIP|\/(users|reg)\/|#$|^\/|^(?!.*(fikper|katfile|rosefile|mega|rapidgator|mexa\.sh|drop\.download)).*$');
        console.log(SKIP_FILTER);
        copyKatIcon.style.setProperty('color', 'Orange', 'important');
        KatCopyProcess();
    });

    closeIcon.addEventListener("click", function (e) {
        e.preventDefault();
        window.open('', '_self').close();
    });

    thanksReplyIcon.addEventListener("click", function (e) {
        e.preventDefault();
        const textarea = document.querySelector("div.area textarea#fastpostmessage");
        const submitButton = document.querySelector('form#fastpostform table tbody tr td.plc p.ptm.pnpost button#fastpostsubmit.pn.pnc.vm');

        if (textarea && submitButton) {
            textarea.value = '謝謝大大分享讓我們有影片可以看';
            submitButton.click();
            thanksReplyIcon.style.setProperty('color', 'Orange', 'important');
        }
    });
}


async function clearUrls() {
    if (clearButton) {
        clearButton.style.color = "Orange";
        clearButton.style.setProperty('font-size', `${(1 / (getDPI / 1.5)) * (16 / defaultFontSize)}rem`, 'important');
    }
    localStorage.removeItem(ROOT_DOMAIN);
    rootDomainDB = [];
    if (stateElement) {
        stateElement.innerText = `${rootDomainDB?.length} | ${PackageList(rootDomainDB)?.length}`;
    }
}

async function clipPaste() {
    if (copyButton) {
        copyButton.style.color = "Orange";
        copyButton.style.setProperty('font-size', `${(1 / (getDPI / 1.5)) * (16 / defaultFontSize)}rem`, 'important');
    }
    rootDomainDB = JSON.parse(localStorage.getItem(ROOT_DOMAIN)) || [];
    JDownloaderDB(rootDomainDB);
}

async function FoldertoFileLinks(targetLink) {
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: 'GET',
            url: targetLink,
            onload: function (response) {
                linksDB.push({ U: targetLink, R: AddDB(response.responseText, 'div#files_list div.file-item div.link a') });
                resolve(response.responseText);
            },
            onerror: function (error) {
                console.error('Request failed for', targetLink, ':', error);
                reject(error);
            }
        });
    });
}

function AddDB(data, selector) {
    const container = document.implementation.createHTMLDocument().documentElement;
    container.innerHTML = data;
    const links = container.querySelectorAll(selector);
    return Array.from(links).map(link => link.href);
}

function CheckInfoArea() {
    if (!area) return;

    for (const ex of area.querySelectorAll('br + br + a[href^="https://katfile.com/f/"]')) {
        ex.insertAdjacentHTML('beforebegin', '<br><span style="display:none;">exclude</span><br>');
    }

    infoArea = area.innerHTML
        .replace(/(.+<strong>KF : <\/strong>.+)|<font style="background-color:white">/g, '$1<br>LastLine')
        .replace(/.*<font style="background-color:rgb\(253, 253, 253\)">\d+\/\d+\/\d+<\/font>.*/g, '<br>LastLine<br>')
        .replace(/.*<font style="background-color:red"><font size="5"><strong>\d+\/\d+\/\d+<\/strong><\/font>.*/g, '<br>LastLine<br>')
        .replace(/(【影片名稱】.+)(【影片大小】.+)/, '$1<br>$2')
        .replace(/(【影片名稱】.+|【影片大小】.+)(【解壓密碼】.+)/, '$1<br>$2')
        .replace(/<br>{2}|<li>|<p align="left">/gm, '<br>')
        .replace(/<\/ol>|<\/li>|<\/a>/gm, '$&<br>')
        .replace(/&nbsp;/gm, ' ')
        .replace(/\s{2,}/gm, ' ')
        .replace(/\n/gm, '')
        .replace(/J_VID/g, 'JVID')
        .replace(/台.灣/g, '台灣')
        .replace(/\(MP4@多空@無碼\)/g, '')
        .split(/<br>|<\/p>/)
        .map(value => value.trim())
        .filter(Boolean);

    if (/pstatus/.test(infoArea[0])) {
        infoArea.shift();
    }

    const lastTitleIndex = infoArea.findLastIndex(e => TITLE_EXPR.test(e));
    const lastLineSearchPatterns = /想看A片更多:|複製代碼|溫馨小小建議及下載小技巧|更多優質影片|background-color:magenta|解壓縮出現錯誤.+|.*其他影片分享.*|.*其他精彩主題.*|.*其他影片載點.*/;
    const firstLastLineIndex = infoArea.findLastIndex((value, index) => lastLineSearchPatterns.test(value) && index > lastTitleIndex);

    if (firstLastLineIndex > -1) {
        infoArea.splice(firstLastLineIndex);
    }

    const forceLastLineIndex = infoArea.findLastIndex(
        (value, index) => index > 3 && value.includes('<strong><font size="5"><font color="#ff0000">KF : </font></font></strong>')
    );
    if (forceLastLineIndex > -1 && forceLastLineIndex + 1 < infoArea.length) {
        infoArea.splice(forceLastLineIndex + 1);
    }

    infoArea = infoArea.filter(Boolean);

    infoArea = infoArea.map(value => {
        if (/.*影片載點(?=.*http)(?!.*<a\shref).*$/.test(value)) {
            return removeHTML(value).replace(/.*影片載點.+http/, 'http').trim();
        } else if (/<a.*href="http.*<\/a>/.test(value) && !/forum\.php\?mod|高速會員詳情/.test(value)) {
            const match = value.match(/<a.*href="http.*<\/a>/);
            return match ? GetLink(match[0]) : value;
        } else {
            return removeHTML(value).trim();
        }
    }).filter(value => value && !/eyny\.com/.test(value));

    const firstLineIndex = infoArea.findLastIndex(value => /所有空間的分割檔都能互補/.test(value));
    const lastLineIndexFinal = infoArea.findLastIndex(e => e === 'LastLine');

    if (lastLineIndexFinal > -1) {
        infoArea = infoArea.slice(firstLineIndex > 0 ? firstLineIndex : 0, lastLineIndexFinal);
    }

    infoArea = infoArea.filter(Boolean);

    CheckTitle(0, TITLE_EXPR);
}

function CheckTitle(first, titleExr) {
    titleDBIndex = [];
    const lastLineIndex = infoArea.findIndex(e => e === 'LastLine');
    const limit = lastLineIndex > -1 ? lastLineIndex : infoArea.length;

    for (let i = first; i < limit; i++) {
        const value = infoArea[i];
        const matchPoint = value.match(titleExr);

        if (matchPoint && matchPoint[2]?.replace(/^(】 :|】:|：|】：|】)/, '').replace(/\(MP4@KF@無碼\).*/, '').trim()) {
            titleDBIndex.push(i);
        } else if (i > 0 && titleDBIndex.includes(i - 1)) {
            const sizeMatch = value.match(/^【?(影片格式|影片大小)】?/);
            if (sizeMatch) {
                titleDBIndex.push(i - 1);
            }
        }
    }
    titleDBIndex = [...new Set(titleDBIndex)];
}

async function CopyItems() {
    const linksDB = [];
    let noticeText = '';

    const copyNotice = document.querySelector('.CopyNotice');
    if (rule) {
        analyzePage(rule).then(results => {                        
            for (const x of results) {
                console.log('current Object: ', x)                
                const title = byteLengthOfCheck(x.title) > 241 ? byteLengthOf(x.title, 241).trim() : x.title                    
                noticeText += title + "\n";
                for (const currentlink of x.links) {
                    
                    if (SKIP_FILTER.test(currentlink)) {
                        continue;
                    }
                    else {                        
                        const U = currentlink;
                        const T = title;
                        const P = x.password;
                        const S = PAGE_URL;
                        linksDB.push({ U, T, P, S });
                        updateDB(U, T, P, S);
                        noticeText += U + "\n";
                    }
                }
            }

            if (linksDB.length) {
                if (copyNotice) {
                    copyNotice.innerHTML = `<code>${noticeText}</code>`;
                }
                localStorage.setItem(ROOT_DOMAIN, JSON.stringify(rootDomainDB));
                if (stateElement) {
                    stateElement.innerText = `${rootDomainDB?.length} | ${PackageList(rootDomainDB)?.length}`;
                }
                JDownloaderDB(linksDB);
            }
        });
    }
    /**
        if (!titleDBIndex.length) {
            if (copyNotice) {
                copyNotice.innerHTML = `<code>Title Empty</code>`;
            }
            return;
        }

        for (let i = 0; i < titleDBIndex.length; i++) {
            const first = titleDBIndex[i];
            const last = titleDBIndex[i + 1] ? titleDBIndex[i + 1] : infoArea.length - 1;

            let title = infoArea[first].match(TITLE_EXPR)?.[2]
                .replace(/^(】 :|】:|：|】：|】)/, '')
                .replace('(MP4@RF@無碼)', '')
                .replace('J.V.I.D', 'JVID')
                .trim() || infoArea[first];

            if (!title || SKIP_TITLE.some(skip => title.includes(skip))) {
                continue;
            }

            title = lableText + FilenameConvert(title.replace(/\(MP4@KF@無碼\)/, '').replace(/【影片大小】.+/, '').replace(/^(FC2-PPV-|FC2\sPPV-|FC2PPV-)/i, 'FC2 PPV ').trim());
            if (byteLengthOfCheck(title) > 241) {
                title = byteLengthOf(title, 241).trim();
            }
            noticeText += title + "\n";

            const password = FindPassWord(infoArea, first, last) || '';

            let linkStartIndex = first;
            const bdIndex = infoArea.findIndex((e, index) => index > first && index <= last && /【 藍光原檔 】|【 4K藍光原檔 】/.test(e));

            if (bdIndex > -1) {
                linkStartIndex = bdIndex;
            } else {
                const hdIndex = infoArea.findIndex((e, index) => index > first && index <= last && /【 HD版 】/.test(e));
                if (hdIndex > -1) {
                    linkStartIndex = hdIndex;
                }
            }

            const megaLinks = infoArea.filter((e, index) => index > linkStartIndex && index <= last && /mega\.nz\/file\//.test(e));
            const katLinks = infoArea.filter((e, index) => index > linkStartIndex && index <= last && /katfile.com\/.+\.html/.test(e));

            if (katLinks.length && megaLinks.length && megaLinks.length < katLinks.length) {
                infoArea = infoArea.map((x, index) => (index > linkStartIndex && index <= last && katLinks.includes(x) ? 'katfile.com' : x));
            }

            for (let j = linkStartIndex; j <= last; j++) {
                const currentItem = infoArea[j];
                if (/LastLine|exclude/.test(currentItem)) {
                    break;
                }

                if (/^https?:/.test(currentItem)) {
                    if (/dudujb\.com/.test(currentItem)) {
                        return openInNewTab(currentItem);
                    }

                    if (!SKIP_FILTER.test(currentItem)) {
                        const U = currentItem;
                        const T = title;
                        const P = password;
                        const S = PAGE_URL;
                        linksDB.push({ U, T, P, S });
                        updateDB(U, T, P, S);
                        noticeText += U + "\n";
                    }
                }
            }
        }

    if (linksDB.length) {
        if (copyNotice) {
            copyNotice.innerHTML = `<code>${noticeText}</code>`;
        }
        localStorage.setItem(ROOT_DOMAIN, JSON.stringify(rootDomainDB));
        if (stateElement) {
            stateElement.innerText = `${rootDomainDB?.length} | ${PackageList(rootDomainDB)?.length}`;
        }
        JDownloaderDB(linksDB);
    }
    */
}
function PackageList(linksDB) {
    if (linksDB?.length > 0) {
        let uniqueTitle = [...new Set(linksDB.map(x => x.T))];
        return uniqueTitle;
    } else {
        return [];
    }
}

function updateDB(target, urlTitle, password, source) {
    const searchResult = rootDomainDB.find((x) => x.U === target);
    if (searchResult) {
        searchResult.T = urlTitle;
        searchResult.P = password;
        searchResult.S = source;
    } else {
        rootDomainDB.push({ U: target, T: urlTitle, P: password, S: source });
    }
    return rootDomainDB;
}

function openInNewTab(href) {
    Object.assign(document.createElement('a'), {
        target: '_blank',
        rel: 'noopener noreferrer',
        href: href,
    }).click();
}

function FindPassWord(db, start, end) {
    const passwordLine = db.slice(start, end + 1)
        .find(line => /【解壓密碼】：|【密碼】:|【解压密码】：/.test(line));

    if (passwordLine) {
        return passwordLine.replace(/【解壓密碼】：|【密碼】:|【解压密码】：/, '')
            .replace(/^\s?無/, '')
            .trim();
    }
    return null;
}

async function KatCopyItems() {
    let noticeText = '';
    const copyNotice = document.querySelector('.CopyNotice');

    const lastLineIndex = infoArea.findIndex(line => line.includes("LastLine"));
    const relevantItems = infoArea.slice(0, lastLineIndex + 1);

    const linksDB = relevantItems.filter(item => {
        const isMatchLink = /^https?:\/\/(katfile\.com|mega\.nz\/file\/|fikper\.com)/.test(item);
        const isSkipped = SKIP_FILTER.test(item);
        return isMatchLink && !isSkipped;
    }).map(url => {
        const password = FindPassWord(infoArea, 0, infoArea.length) ?? '';
        noticeText += url + "\n";
        return { U: url, T: '', P: password, S: PAGE_URL };
    });

    if (copyNotice) {
        copyNotice.innerHTML = `<code>${noticeText}</code>`;
    }

    JDownloaderDB(linksDB);
}

function JDownloader(JdownloaderData, PackageName, PW, Source) {
    if (JdownloaderData) {
        let data = new URLSearchParams();
        if (PW) {
            data.append(`passwords`, PW);
        }
        if (Source) {
            data.append(`source`, Source);
        }
        data.append(`urls`, JdownloaderData);
        data.append(`referer`, PAGE_URL);
        if (PackageName) {
            data.append(`package`, PackageName);
        }
        fetch('http://127.0.0.1:9666/flash/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Access-Control-Allow-Origin': 'http://localhost:9666',
            },
            body: data
        });
    }
}

function JDownloaderDB(linksDB) {
    const uniqueTitle = [...new Set(linksDB.map(x => x.T))] || [...new Set(linksDB.map(x => x.U))];
    uniqueTitle.forEach(title => JDownloader(GetMatchLinks(title, linksDB), title, GetMatchPassWord(title, linksDB), GetMatchSource(title, linksDB)));
}

function GetMatchLinks(text, linksDB) {
    try {
        const matchingLinks = linksDB
            .filter(u => text.includes(u.T))
            .map(l => l.U)
            .join('\r\n');
        return matchingLinks;
    } catch (err) {
        console.error(err, text, linksDB);
        return '';
    }
}

function GetMatchProperty(text, linksDB, property) {
    try {
        const match = linksDB.find(u => text.includes(u.T));
        return match ? match[property] : false;
    } catch (err) {
        console.error(err, text, linksDB);
        return false;
    }
}

function GetMatchPassWord(text, linksDB) {
    return GetMatchProperty(text, linksDB, 'P');
}

function GetMatchSource(text, linksDB) {
    return GetMatchProperty(text, linksDB, 'S');
}

function TempLink(str) {
    const tempElement = document.createElement("DIV");
    tempElement.innerHTML = str;

    const textContent = tempElement.innerText;
    const collection = textContent ? [textContent] : [];

    const links = tempElement.querySelectorAll('a');
    links.forEach(aEntry => {
        const linkHref = aEntry.href.replace(/\?site.+/, '');
        const isSkipClass = SKIP_CLASS_NAMES.some(skip => aEntry.classList.contains(skip));
        const isSkipLink = SKIP_FILTER.test(aEntry.href);
        const hasImgChild = aEntry.querySelector('img');

        if (!isSkipLink && !isSkipClass && !hasImgChild) {
            collection.push(linkHref);
        }
    });
    return collection.join('<br>');
}

function removeHTML(str) {
    const tempElement = document.createElement("DIV");
    tempElement.innerHTML = str;
    return tempElement.textContent || '';
}

function GetLink(str) {
    const tempElement = document.createElement("DIV");
    tempElement.innerHTML = str;
    const linkElement = tempElement.querySelector('a');
    return linkElement ? linkElement.href : null;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function processCopy(actionToPerform) {
    if (!centerBox) {
        console.error('CenterBox element not found.');
        return;
    }

    const fixTop = centerBox.offsetTop + centerBox.offsetHeight;
    const fixLeft = centerBox.offsetLeft;
    $('.CopyNotice').css({
        "fontSize": ((1 / (getDPI / 1.5)) * 0.65 * (16 / defaultFontSize)) + 'rem',
        "top": fixTop,
        "left": fixLeft,
        "position": "absolute"
    });
    await actionToPerform();
    $('.CopyNotice').slideToggle('fast', 'linear');
    await sleep(2000);
    $('.CopyNotice').slideToggle('slow');
}

async function CopyProcess() {
    await processCopy(CopyItems);
}

async function KatCopyProcess() {
    await processCopy(KatCopyItems);
}

function getDefaultFontSize() {
    const element = document.createElement('div');
    element.style.width = '1rem';
    element.style.display = 'none';
    document.body.append(element);

    const widthMatch = window.getComputedStyle(element).getPropertyValue('width').match(/\d+/);
    element.remove();
    if (!widthMatch || widthMatch.length < 1) {
        return null;
    }
    const result = Number(widthMatch[0]);
    return !isNaN(result) ? result : null;
}

function MatchRegex(area, regex, attributeToSearch) {
    const output = [];
    if (attributeToSearch) {
        for (let element of area.querySelectorAll(`[${attributeToSearch}]`)) {
            if (regex.test(element.getAttribute(attributeToSearch))) {
                output.push(element);
            }
        }
    } else {
        for (let element of area.querySelectorAll('*')) {
            for (let attribute of element.attributes) {
                if (regex.test(attribute.value)) {
                    output.push(element);
                }
            }
        }
    }
    return output;
}

function byteLengthOf(titleText, maxByte) {
    let result;
    let lineByte = 0;
    for (let i = 0; i < titleText.length; i++) {
        const code = titleText.charCodeAt(i);
        let charByte;
        if (code < 0x0080) {
            charByte = 1;
        } else if (code < 0x0800) {
            charByte = 2;
        } else if (code < 0xD800) {
            charByte = 3;
        } else if (code < 0xDC00) {
            const lo = titleText.charCodeAt(++i);
            if (i < titleText.length && lo >= 0xDC00 && lo <= 0xDFFF) {
                charByte = 4;
            } else {
                throw new Error("UCS-2 String malformed");
            }
        } else if (code < 0xE000) {
            throw new Error("UCS-2 String malformed");
        } else {
            charByte = 3;
        }
        lineByte += charByte;
        if (lineByte >= maxByte) {
            titleText = titleText.substr(0, i).replace(/(、|,)$/, '').trim();
            result = titleText + '…';
            break;
        }
    }
    return result ? result.trim() : titleText;
}

function byteLengthOfCheck(titleText) {
    let lineByte = 0;
    for (let i = 0; i < titleText.length; i++) {
        const code = titleText.charCodeAt(i);
        if (code < 0x0080) {
            lineByte += 1;
        } else if (code < 0x0800) {
            lineByte += 2;
        } else if (code < 0xD800) {
            lineByte += 3;
        } else if (code < 0xDC00) {
            const lo = titleText.charCodeAt(++i);
            if (i < titleText.length && lo >= 0xDC00 && lo <= 0xDFFF) {
                lineByte += 4;
            } else {
                throw new Error("UCS-2 String malformed");
            }
        } else if (code < 0xE000) {
            throw new Error("UCS-2 String malformed");
        } else {
            lineByte += 3;
        }
    }
    return lineByte;
}

function FilenameConvert(text) {
    return text.replace(EXCLUDE_CHAR, elem => String.fromCharCode(parseInt(elem.charCodeAt(0)) + 65248));
}
