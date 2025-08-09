// ==UserScript==
// @name         Copy Links & Title
// @namespace    http://tampermonkey.net/
// @version      1.2.2
// @description  try to take over the world!
// @author       You
// @include      /gm\d+.xyz/
// @include      /pornbb\.org\/newsearch\.php/
// @include      /pornbb\.org\/.*\.html/
// @include      /forumophilia\.com/
// @include      /sexfetishforum\.com\/index.php\?topic/
// @include      http://www.planetsuzy.org/*.html
// @include      /planetsuzy\.org\/showthread\.php/
// @include      https://x-idol.net/*
// @include      https://www.porn-w.org/search.php*
// @exclude      https://x-idol.net/?p=*
// @grant        GM_setClipboard
// @grant		 GM_addStyle
// @grant		 GM_xmlhttpRequest
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js
// @require      https://raw.githubusercontent.com/DandyClubs/RootDomain/main/RootDomain.js
// @require      https://raw.githubusercontent.com/DandyClubs/CopyLinksCommonJS/main/CopyLinksCommonJS.js
// @run-at       document-start
// @noframes
// ==/UserScript==

const FontAwesomeCSS = function () {
    let css = document.createElement('link')
    css.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css'
    css.rel = 'stylesheet'
    css.type = 'text/css'
    document.getElementsByTagName('head')[0].appendChild(css)
}


GM_addStyle(`


@import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c&family=Nanum+Gothic&family=Nanum+Gothic+Coding&family=Noto+Sans&display=swap');
:root {
  --IconSize: 1em;
  --dynamic-zindex: 0;
}

.dynamic-z {
  z-index: var(--dynamic-zindex);
}

.IconSet, .CloseIcon, .AllCopy {
    text-align: center;
    cursor: pointer;
    word-spacing: .5em;
    white-space : nowrap;
    background-color: transparent !important;
    transform: rotate(360deg);
    text-shadow: -1px 0px white, 0px 1px white, 1px 0px white, 0px -1px white;
}

.CopyIcon, .Minus {
    font-size: var(--IconSize) !important;
     padding: .5em;
     cursor: pointer;
     text-shadow: -1px 0px white, 0px 1px white, 1px 0px white, 0px -1px white;
     z-index: var(--dynamic-zindex);
}

.CopyIcon.Copyed, .Minus.NotCopyed {
    display: none !important;
}

.Copyed , .Minus{
    color: Orange !important;
}



.noticeArea {
    font-family: 'Nanum Gothic', 'M PLUS Rounded 1c', 'ZCOOL KuaiLe', sans-serif !important;
    margin-left: auto;
    margin-right: auto;
    border-radius: .25em;
    color: white !important;
    background: rgba(255, 165, 0, .95) !important;
    padding: .5em;
    white-space: pre;
 	text-shadow: initial !important;
    text-align: left;
    line-height: 1em;
	font-weight: 500 !important;
	font-style: initial !important;
    display: -webkit-box;
    -webkit-line-clamp: 15;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: var(--NFontSize, 0.6rem);
    z-index: var(--dynamic-zindex);
}
.CenterBox {
	right: 50%;
	left: auto;
	top: 0;
	max-width: max-content;
	position: fixed !important;
	display: flex;
	flex-wrap: nowrap;
	justify-content: space-around;
	align-items: baseline;
	color: LimeGreen !important;
    padding: 0 .25em;
    margin: .25em;
	border-radius: .25em !important;
	-webkit-box-sizing: border-box !important;
	box-sizing: border-box !important;
	background-color: rgba(0,0,0,0.5) !important;
    z-index: var(--dynamic-zindex);
}

.CenterBox * {
    margin: .25em;
    padding: .25em;
}

.ToTop {
    font-style: initial !important;
    text-align: center;
    cursor: pointer;
    margin: .25em;
    color: LimeGreen !important;
    background-color:transparent !important;
    text-shadow: 1px 1px 1px red, 0 0 2px blue, 0 0 1px black;
}


.State , .AllCopyState{
    display: inline-block;
    font-weight: bold;
    text-align: right;
    vertical-align: middle;
    font-family: 'Noto Sans', sans-serif !important;
    font-style: italic !important;
    max-width: 12ch;
    color: WhiteSmoke !important;
    background-color:transparent !important;
}

.CopyButton, .ClearButton {
    font-style: initial !important;
    word-spacing: .5em;
    cursor: pointer;
    background-color:transparent !important;
    text-shadow: -1px 0px white, 0px 1px white, 1px 0px white, 0px -1px white;
}

`);

const PageURL = window.location !== window.parent.location ? document.referrer : document.location.href;
const RootDomain = extractRootDomain(PageURL)

let GetDPI, DefaultFontSize, elementPosition
let GetState, searchDB
let copyLinks = ''
let Copyed = ''

let RootDomainDB = JSON.parse(localStorage.getItem(RootDomain) || '[]');
let Maker
let UrlTitle = ''
let DirectCopy = true


let Target, DownloadArea, CopyTitle, CopyTitleArea, noticeArea, CopyTitleSelector, Series, TitleID, ID, CoverImage
const SkipFilter = new RegExp('filejoker\\.net\/file\/q25fhzi4k86y|sendurl\\.me|xufile\\.com|pixhost\\.to|imgbox\\.com|utm_source|safedl\\.net|upgrade|\\.jpg$|javascript|SKIP|#|^\/|^(?=.*' + window.location.origin + ')(?!.*\\?site).*$')
const SkipID = /C_\d+/i
const JapaneseChar = /[ぁ-んァ-ン一-龯]/
const SkipClassNames = ['adead_link', 'autohyperlink', 'social-icon', 'postdetails']
const SearchID = /^([a-zA-Z]{2,11}-?\d{2,6}[a-zA-Z]?|\d{2,4}[a-zA-Z]{2,7}-?\d{3,6}[a-zA-Z]?|[a-zA-Z]{1,2}-?\d{2}-?\d{2}|[a-zA-Z]{2,7}-?[a-zA-Z]{1,2}\d{2})(.*)/
const ChinaID = /([a-zA-Z]{2,11}-?\d{2,6}[a-zA-Z]?|\d{2,4}[a-zA-Z]{2,7}-?\d{3,6}[a-zA-Z]?|[a-zA-Z]{1,2}-?\d{2}-?\d{2}|[a-zA-Z]{2,7}-?[a-zA-Z]{1,2}\d{2})/
const SearchFC2ID = /(^FC2.+\d{6})(.*)/
const SearchIDRegExp = /^(\[\s?)?(?=([a-zA-Z]{2,11}-?\d{2,6}[a-zA-Z]?|\d{2,4}[a-zA-Z]{2,7}-?\d{3,6}[a-zA-Z]?|[a-zA-Z]{1,2}-?\d{2}-?\d{2}|[a-zA-Z]{2,7}-?[a-zA-Z]{1,2}\d{2}))(?!(C_\d+|file\d+))(.*)$/
const DateRegEx = /((19|20)[0-9]{2}[.\/-]([1][0-2]|[0]?[1-9])[.\/-]([3][0|1]|[1|2][0-9]|[0]?[1-9])|([3][0|1]|[1|2][0-9]|[0]?[1-9])[.\/-]([1][0-2]|[0]?[1-9])[.\/-]((19|20)?[0-9]{2})).*/
const SkipTitle = [
    'assfuck',
    'busty',
    'amateur',
    'big tits',
    'bigass',
    'boobs',
    'butt',
    'anal',
    'sex',
    'porn video',
    'blowjob',
    'brunette',
    'skinny',
    'stockings',
    'cumshot on big tits'
]

console.log(SkipFilter)


document.addEventListener("DOMContentLoaded", () => {

    let cookieCheck = getCookie("ClearCopyed")
    if (!cookieCheck || cookieCheck != "Y") {
        console.log('ClearCopyed')
        ClearCopyed()
        setClearCopyed("ClearCopyed", "Y", 1)
    }

    FontAwesomeCSS()

    const DomainRules = getDomainConfig(RootDomain);
    if (!DomainRules) {
        console.error("해당 도메인에 대한 설정이 없습니다.");
        return
    }

    try {
        MakeIcon()
        AddCopyIcon(document.body);
    } catch (error) {
        let errorMessage = "아이콘 추가 중 예상치 못한 오류가 발생했습니다.";

        if (error instanceof TypeError) {
            errorMessage = error.message;
        } else if (error instanceof ReferenceError) {
            errorMessage = "아이콘 추가에 필요한 함수 또는 변수가 정의되지 않았습니다.";
        }
        console.error(errorMessage);
        console.error("오류 상세 정보:", error.stack);
    }

    const myObserver = new ResizeObserver(entries => {
        RefreshIcon('ResizeObserver')
    });

    window.visualViewport.addEventListener("resize", function (e) {
        RefreshIcon('Window Resize Event')
    })
    myObserver.observe(document.querySelector(".ToTop"))


    document.addEventListener("AutoPagerize_DOMNodeInserted", function (event) {
        let node = event.target;
        AddCopyIcon(node)
    }, false);


}, { once: true })

window.addEventListener('storage', (e) => {

    RootDomainDB = localStorage.getItem(RootDomain) ? JSON.parse(localStorage.getItem(RootDomain)) : []
    GetState = RootDomainDB
    if (document.querySelector('.CenterBox')) {
        document.querySelector('.State').innerText = GetState?.length + ' | ' + PackageList(RootDomainDB)?.length
        document.querySelector('.ClearButton').style = "color: dodgerblue !important;";
        document.querySelector('.CopyButton').style = "color: dodgerblue !important;";
    }

});

function ClearCopyed() {
    console.log('Start Delete Copyed!')
    Copyed = Object.keys(localStorage).filter(k => k.includes(RootDomain + '/') && /\d{4}-\d{2}-\d{2}/.test(localStorage.getItem(k)))
    for (let key of Copyed) {
        if (localStorage.getItem(key)) {
            let Now = new Date(Date.now()).toISOString().slice(0, 10)

            let AddedDay = new Date(localStorage.getItem(key)).toISOString().slice(0, 10)
            const oneDay = 1000 * 60 * 60 * 24;
            if (((new Date(Now) - new Date(AddedDay)) / oneDay) > 180) {
                localStorage.removeItem(key)
                console.log('Delete Item: ', key, AddedDay)
            }
        }
    }
}

function setClearCopyed(name, value, expiresDay) {
    const NowTime = new Date();
    const MidNight = new Date(NowTime.getFullYear(), NowTime.getMonth(), NowTime.getDate() + expiresDay, 9)
    document.cookie = escape(name) + "=" + escape(value) + "; expires=" + MidNight.toUTCString();
}

const SkipMakers = [
    'Tubanomi', 'New World Harlem', 'Anikuramogusex',
    'Toshiaki', 'Buena Vista', 'Punimoe!', 'palupunte'
];







const DomainHandlers = {
    'gm\\d+\\.xyz': {
        selectors: {
            copyTitle: '.entry-title a',
            visitedLink: 'h2.entry-title a',
        },
        getPostArea: (el) => el.closest('.inside-article'),
        GetInfo: (el) => DomainRules.relativeSelector(el)?.querySelector('.entry-title a')?.textContent.trim() || '',
        //getCoverImage: (downloadArea) => downloadArea.querySelector('p img')?.getAttribute('data-src') || '',
        getCopyID: (relativeArea) => relativeArea.querySelector('.entry-title a')?.href,
        iconPosition: (iconSet) => {
            const relativeArea = DomainRules.relativeSelector(iconSet);
            const relativeAreaMetrics = getElementMetrics(relativeArea, { mode: 'relative' });
            const iconSetMetrics = getElementMetrics(iconSet, { mode: 'relative' });
            iconSet.style.setProperty('top', `${(relativeAreaMetrics.height / 2 - iconSetMetrics.height / 2).toFixed(0)}px`);
            iconSet.style.setProperty('right', `${(-iconSetMetrics.width / 4).toFixed(0)}px`);
        },
        infoSelector: (el) => DomainRules.getPostArea(el).querySelector('.entry-content') || '',
        relativeSelector: (el) => DomainRules.getPostArea(el).querySelector('header.entry-header') || '',
    },
    'pornbb\\.org': {
        selectors: {
            copyTitle: 'div.search-post-subj a.postdetails, span.postdetails.subject',
            visitedLink: null,
        },
        getPostArea: (el) => el.closest('div.postbody'),
        GetInfo: (el) => {
            const rawTitle = DomainRules.relativeSelector(el)?.querySelector('a.postdetails, span.postdetails.subject')?.textContent.trim() || '';
            const infoRaw = DomainRules.infoSelector(el)?.innerText || '';
            const infoLines = infoRaw.split(/\n+/).map(line => line.trim()).filter(Boolean);
            return parseForumTitle(infoLines, rawTitle)
        },
        getCopyID: (relativeArea, pageURL) => {
            if (/newsearch\.php/.test(pageURL)) return relativeArea.querySelector('a')?.href;
            if (/\.html#\d+/.test(pageURL)) return pageURL;
            return relativeArea.querySelector('a.inl-bl')?.href;
        },
        iconPosition: (iconSet) => {
            const relativeArea = DomainRules.relativeSelector(iconSet) || ''
            const relativeAreaMetrics = getElementMetrics(relativeArea, { mode: 'relative' });
            const iconSetMetrics = getElementMetrics(iconSet, { mode: 'relative' });
            iconSet.style.setProperty('z-index', '99999');
            iconSet.style.setProperty('vertical-align', window.getComputedStyle(relativeArea).getPropertyValue('vertical-align'));
            iconSet.style.setProperty('line-height', window.getComputedStyle(relativeArea).getPropertyValue('line-height'));
            iconSet.style.setProperty('top', `${(relativeAreaMetrics.height / 2 - iconSetMetrics.height / 2).toFixed(0)}px`);
            iconSet.style.setProperty('left', `${(relativeAreaMetrics.width).toFixed(0)}px`);
        },
        infoSelector: (el) => DomainRules.getPostArea(el).querySelector('.post-text') || '',
        relativeSelector: (el) => DomainRules.getPostArea(el).querySelector('.search-post-subj') || '',
    },
    'x-idol\\.net': {
        selectors: {
            copyTitle: 'h2.post-title.entry-title a',
            visitedLink: 'h2.post-title.entry-title a',
        },
        getPostArea: (el) => el.closest('div.post.hentry:not(.sticky)')?.querySelector('div.entry') || el.closest('div.post.hentry:not(.sticky)'),
        GetInfo: (el) => {
            const rawTitle = DomainRules.relativeSelector(el)?.querySelector('h2.post-title.entry-title a')?.textContent.trim() || '';
            const infoRaw = DomainRules.infoSelector(el)?.innerText || '';
            const infoLines = infoRaw.split(/\n+/).map(line => line.trim()).filter(Boolean);
            return extractInfoFromText(infoLines, rawTitle, { rawMode: true, preferJapanese: true });
        },
        getCopyID: (relativeArea) => relativeArea?.querySelector('h2.post-title.entry-title a')?.getAttribute('href'),
        iconPosition: (iconSet) => {
            const relativeArea = iconSet.closest('.post-title');
            const relativeAreaMetrics = getElementMetrics(relativeArea, { mode: 'relative' });
            const iconSetMetrics = getElementMetrics(iconSet, { mode: 'relative' });
            iconSet.style.setProperty('vertical-align', window.getComputedStyle(relativeArea).getPropertyValue('vertical-align'));
            iconSet.style.setProperty('line-height', window.getComputedStyle(relativeArea).getPropertyValue('line-height'));
            iconSet.style.setProperty('top', `${(relativeAreaMetrics.height / 2 - iconSetMetrics.height / 2).toFixed(0)}px`);
            iconSet.style.setProperty('right', `${(-iconSetMetrics.width / 5).toFixed(0)}px`);
        },
        infoSelector: (el) => DomainRules.getPostArea(el).querySelector('.entry-content') || '',
        relativeSelector: (el) => DomainRules.getPostArea(el).querySelector('div.message-header') || '',
    },
    'forumophilia\\.com': {
        selectors: {
            copyTitle: 'div.messageinfo div.message-header div div.post_subj div.postdetails > a.bold, .messageinfo div.message-header div div.post_subj span.postdetails',
            visitedLink: null,
        },
        getPostArea: (el) => el.closest('div.messageinfo'),
        GetInfo: (el) => {
            const rawTitle = DomainRules.relativeSelector(el)?.querySelector('div.post_subj span.postdetails span')?.textContent.trim() || '';
            const infoRaw = DomainRules.infoSelector(el)?.innerText || '';
            const infoLines = infoRaw.split(/\n+/).map(line => line.trim()).filter(Boolean);
            return parseForumTitle(infoLines, rawTitle, { preferJapanese: true })
        },
        getCopyID: (relativeArea) => relativeArea?.querySelector('div.post_subj a[href]').href || '',
        iconPosition: (iconSet) => {
            const relativeArea = DomainRules.relativeSelector(iconSet);
            const relativeAreaMetrics = getElementMetrics(relativeArea, { mode: 'relative' });
            const iconSetMetrics = getElementMetrics(iconSet, { mode: 'relative' });
            iconSet.style.setProperty('top', `${(relativeAreaMetrics.height / 5).toFixed(0)}px`);
            iconSet.style.setProperty('right', `${(-iconSetMetrics.width / 4).toFixed(0)}px`);
        },
        infoSelector: (el) => DomainRules.getPostArea(el).querySelector('.message-body') || '',
        relativeSelector: (el) => DomainRules.getPostArea(el).querySelector('div.message-header') || '',
    },
    'sexfetishforum\\.com': {
        selectors: {
            copyTitle: 'div.post_wrapper div.postarea div.flow_hidden div.keyinfo h5',
            visitedLink: null,
        },
        getPostArea: (el) => el.closest('div.postarea'),
        GetInfo: (el) => {
            const rawTitle = DomainRules.relativeSelector(el)?.querySelector('div.keyinfo h5')?.textContent.trim() || '';
            const infoRaw = DomainRules.infoSelector(el)?.innerText || '';
            const infoLines = infoRaw.split(/\n+/).map(line => line.trim()).filter(Boolean);
            return parseForumTitle(infoLines, rawTitle, { preferJapanese: true })
        },
        getCopyID: (relativeArea) => relativeArea.querySelector('div.keyinfo > [id^="subject_"] > a')?.href || '',
        iconPosition: (iconSet) => {
            const relativeArea = DomainRules.relativeSelector(iconSet)
            const relativeAreaMetrics = getElementMetrics(relativeArea, { mode: 'relative' });
            const iconSetMetrics = getElementMetrics(iconSet, { mode: 'bounding' });
            iconSet.style.setProperty('top', `${(relativeAreaMetrics.height / 2 - iconSetMetrics.height) / 2}px`);
            iconSet.style.setProperty('right', `${iconSetMetrics.width * 2}px`);
        },
        infoSelector: (el) => DomainRules.getPostArea(el).querySelector('.post') || '',
        relativeSelector: (el) => DomainRules.getPostArea(el).querySelector('.flow_hidden') || '',
    },
    'planetsuzy\\.org': {
        selectors: {
            copyTitle: 'table.tborder tbody tr td[id^="td_post_"].alt1 div.smallfont',
            visitedLink: null,
        },
        getPostArea: (el) => el.closest('table.tborder'),
        GetInfo: (el) => {
            const rawTitle = DomainRules.relativeSelector(el)?.textContent.trim() || '';
            const infoRaw = DomainRules.infoSelector(el)?.innerText || '';
            const infoLines = infoRaw.split(/\n+/).map(line => line.trim()).filter(Boolean);
            return parseForumTitle(infoLines, rawTitle, { preferJapanese: true })
        },
        getCopyID: (relativeArea) => relativeArea.closest('table.tborder').querySelector('td.thead a[id^="postcount')?.href,
        iconPosition: (iconSet) => {
            const iconSetMetrics = getElementMetrics(iconSet, { mode: 'bounding' });
            iconSet.style.setProperty('top', `0px`);
            iconSet.style.setProperty('right', `${iconSetMetrics.width}px`);
        },
        infoSelector: (el) => DomainRules.getPostArea(el)?.querySelector('div[id^="post_message_"]') || '',
        relativeSelector: (el) => DomainRules.getPostArea(el)?.querySelector('td.alt1 div.smallfont') || '',
    },
    'porn-w\\.org': {
        selectors: {
            copyTitle: 'div.row.list-row.genmed div.postdetails a.topictitle',
            visitedLink: null,
        },
        getPostArea: (el) => el.closest('div.row.list-row.genmed'),
        GetInfo: (el) => {
            const rawTitle = DomainRules.relativeSelector(el)?.querySelector('a.topictitle')?.textContent.trim() || '';
            const infoRaw = DomainRules.infoSelector(el)?.innerText || '';
            const infoLines = infoRaw.split(/\n+/).map(line => line.trim()).filter(Boolean);
            return parseForumTitle(infoLines, rawTitle, { preferJapanese: true })
        },
        getCopyID: (relativeArea) => relativeArea.querySelector('a.topictitle')?.href || '',
        iconPosition: (iconSet) => {
            const relativeArea = DomainRules.relativeSelector(iconSet);
            const relativeAreaMetrics = getElementMetrics(relativeArea, { mode: 'relative' });
            const iconSetMetrics = getElementMetrics(iconSet, { mode: 'relative' });
            iconSet.style.setProperty('top', `${(relativeAreaMetrics.height / 2 - iconSetMetrics.height / 2).toFixed(0)}px`);
            iconSet.style.setProperty('right', `${(-iconSetMetrics.width / 4).toFixed(0)}px`);
        },
        infoSelector: (el) => DomainRules.getPostArea(el).querySelector('.row.list-row') || '',
        relativeSelector: (el) => DomainRules.getPostArea(el).querySelector('div.row.list-row.genmed') || '',
    },
};

const getDomainConfig = (rootDomain) => {
    for (const [pattern, config] of Object.entries(DomainHandlers)) {
        if (new RegExp(pattern).test(rootDomain)) {
            return config;
        }
    }
    return null;
};

const DomainRules = getDomainConfig(RootDomain);
if (!DomainRules) {
    console.error("해당 도메인에 대한 설정이 없습니다.");
    return
}



function extractInfoFromText(infoLines, fallbackTitle, options = {}) {
    const {
        preferJapanese = false,
        skipKeywords = [],
        rawMode = false,
    } = options;

    let CopyTitle = fallbackTitle
        .replace(/^(UNCENSORED|CENSORED)\s/, '')
        .replace(/amp;|\(\)/g, '')
        .trim();

    if (rawMode) return CopyTitle;

    let Title = '';
    let ID = '';
    let Maker = '';
    let ModelName = '';
    let ReleaseDate = '';


    const FeaturingLine = infoLines.find(line => line.match(/특집\s*:/i));
    const Featuring = FeaturingLine ? FeaturingLine.replace(/Featuring\s*:/i, '').trim() : '';

    infoLines.some((line) => {
        if (!ID) {
            const idMatch = line.match(SearchID);
            if (idMatch && !line.match(SkipID)) {
                ID = idMatch[1];
            }
        }

        if (!Title) {
            const titleMatchRaw = line.match(SearchID);
            const copyMatchRaw = CopyTitle.match(SearchID);

            const titleMatch = titleMatchRaw ? titleMatchRaw.pop().trim() : null;
            const copyMatch = copyMatchRaw ? copyMatchRaw.pop().trim() : null;

            if (titleMatch && copyMatch) {
                if (preferJapanese) {
                    Title = compareJapaneseCharacters(titleMatch, copyMatch);
                } else {
                    Title = titleMatch || copyMatch;
                }
            } else if (titleMatch) {
                Title = titleMatch;
            } else if (copyMatch) {
                Title = copyMatch;
            }

            Title = Title ? Title.trim() + ' ' : '';
        }


        if (!Maker && /(Circle|Label)\s?:/.test(line)) {
            const raw = line.match(/(Circle|Label)\s?:(.*)/)[2].trim();
            const cleaned = SkipMakers.reduce((acc, keyword) => {
                return acc.replace(new RegExp(keyword, 'gi'), '');
            }, raw).trim();
            if (cleaned) Maker = `[${cleaned}] `;
        }

        if (!ModelName && /(Actress|Model|Author)\s?:/.test(line)) {
            ModelName = line.match(/(Actress|Model|Author)\s?:(.*)/)[2].trim();
        }

        if (!ReleaseDate) {
            ReleaseDate = DateRegEx.test(line) ? line.match(DateRegEx)[1].replace(/\/|-|_/g, '.') : '';
        }
        return ID && ModelName && ReleaseDate && Title && Maker;
    });

    console.log({ ID, ModelName, ReleaseDate, Title });

    if (ModelName) {
        let ModelNameList = ModelName.split(/[,|]/).map(s => s.trim()).filter(Boolean);

        ModelNameList = ModelNameList.filter(name => {
            if (name.length <= 1) return false;
            if (new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(Title)) return false;
            return true;
        });

        ModelName = ModelNameList.length ? `[${ModelNameList.join(' ')}]` : '';
    }
    if (Featuring) {
        Title = `${Featuring} - ${Title}`;
    }

    const cleanedinfoLines = infoLines.join('\n')
        .replace(/(Actress|Model|Label|Circle|Featuring)\s*:?/gi, '')
        .replace(/(?:(?:\r\n|\r|\n)\s*){2}/gm, '\n')
        .replace(/Actress\sand\sTitle\sVideo:|Details\s\/\sInformations|Thumbnails\s\/\sScreenshots|General\s\/\sNames|Asianmania_|New!.+[\d+]|Re:/gi, '')
        .replaceAll('"|：', '')
        .replace(/\*\*\*/g, '')
        .replace(/\n{2,}/g, '\n')
        .split('\n')
        .filter(line => line.trim() && !/^(http|Download|Duration|Resolution|Categories|About)/i.test(line));

    console.log({ infoLines, cleanedinfoLines });

    const infoLinesFinalTitle = Title ? `${Maker}${ID ? ID + ' ' : ''}${ReleaseDate}${Title}${ModelName}`.replace(/\s+/g, ' ').trim() : ''


    const InfofinalTitle = infoLinesFinalTitle ? compareSentencesByWordMatch(cleanedinfoLines[0], infoLinesFinalTitle) : cleanedinfoLines[0] || '';

    console.log({ CopyTitle, InfofinalTitle });
    //preferJapanese: true 일 때, 두 문장을 비교하여 일본어가 많이 포함된 경우 우선순위를 두고, 그렇지 않으면 원본 제목을 사용합니다.
    let preferText = ''
    let compareText = ''
    if (preferJapanese) {
        preferText = compareJapaneseCharacters(CopyTitle, InfofinalTitle);
    }
    compareText = compareSentencesByWordMatch(CopyTitle, InfofinalTitle);

    const compareLast = compareSentencesByWordMatch(preferText, compareText)
    if (ReleaseDate && (Maker || ID)) {
        return `${Maker}${ID ? ID + ' ' : ''}.${ReleaseDate}.${compareLast}`
    } else {
        return ReleaseDate ? `${compareLast}(${ReleaseDate})` : compareLast
    }
}


function parseForumTitle(infoLines, rawTitle, options = {}) {
    const {
        preferJapanese = false,
        skipKeywords = [],
        rawMode = false,
    } = options;
    //console.log('parseForumTitle:', { infoLines, rawTitle, options });
    rawTitle = rawTitle.replace(/amp;|\(\)/gi, '').replace(/^Re:|Subject:/i, '').trim();


    const finalTitle = extractInfoFromText(infoLines, rawTitle, options)
    const TitleID = finalTitle?.match(SearchID)?.[1] || '';
    const Title = finalTitle?.match(SearchID)?.pop()?.trim() || finalTitle;
    console.log({ finalTitle, TitleID, Title });

    return TitleID && Title ? `${TitleID} ${Title}` : finalTitle;
}

async function showCopyNotice(noticeArea, relativeArea, finalTitle, copyLinks) {
    console.log('finalTitle:', finalTitle, '\ncopyLinks:', copyLinks)
    GetDPI = window.devicePixelRatio;
    DefaultFontSize = getDefaultFontSize();
    const NFontSizeValue = ((1 / (GetDPI / 1.5)) * 0.6 * (16 / DefaultFontSize)).toFixed(2) + 'rem';
    const positionPoint = getElementMetrics(relativeArea, { mode: 'relative' });
    noticeArea.style.setProperty('--NFontSize', NFontSizeValue);
    noticeArea.style.top = `${positionPoint.height}px`;
    noticeArea.style.left = '0';

    if (copyLinks) {
        noticeArea.textContent = `${finalTitle}\n${copyLinks}`;
    } else {
        noticeArea.textContent = `Empty......`;
    }

    $(noticeArea).slideToggle('fast', 'linear');
    await sleep(750);
    $(noticeArea).slideToggle('slow');
    await sleep(1000);
    noticeArea.textContent = '';
}


function addEventListeners(container) {

    container.addEventListener('click', async function (event) {
        if (event.target.matches('.CopyIcon')) {
            event.preventDefault();

            const copyIcon = event.target;
            const copyId = copyIcon.getAttribute("id");
            const relativeArea = DomainRules.relativeSelector(copyIcon)?.querySelector('.noticeArea')
            const noticeArea = copyIcon.closest('article, .entry, .postbody, .messageinfo, .postrow, .inside-article')?.querySelector('.noticeArea') || relativeArea


            copyIcon.style.setProperty('color', 'Orange', 'important');
            copyIcon.classList.add('Copyed');

            const { finalTitle, copyLinks } = await CopyLink(copyIcon, noticeArea, copyId);

            await showCopyNotice(noticeArea, relativeArea, finalTitle, copyLinks);

            getNextSibling(copyIcon, '.Minus')?.classList.remove('NotCopyed');

            const addDate = new Date().toISOString().slice(0, 10);
            localStorage.setItem(copyId, addDate);

            if (DomainRules.selectors.visitedLink) {
                event.target.closest('article, .entry, .postbody, .messageinfo, .postrow, .inside-article')?.querySelector(DomainRules.selectors.visitedLink)?.classList.add('Copyed');
            }

            console.log('AddTitle: ', copyId, '\nAddDate: ', addDate);

        }

        else if (event.target.matches('.Minus')) {
            event.preventDefault();

            const minusIcon = event.target;
            const copyIcon = getPreviousSibling(minusIcon, '.CopyIcon');
            const copyId = copyIcon?.getAttribute("id");

            if (copyIcon) {
                minusIcon.classList.add('NotCopyed');
                copyIcon.style.removeProperty('color');
                copyIcon.classList.remove('Copyed');

                if (DomainRules.selectors.visitedLink) {
                    copyIcon.closest('article, .entry, .postbody, .messageinfo, .postrow, .inside-article')?.querySelector(DomainRules.selectors.visitedLink)?.classList.remove('Copyed');
                }

                localStorage.removeItem(copyId);
                RemoveDB(copyId);
                RootDomainDB = JSON.parse(localStorage.getItem(RootDomain)) || [];
                document.querySelector('.State').innerText = `${RootDomainDB?.length || 0} | ${PackageList(RootDomainDB)?.length || 0}`;
            }
        }
    });
}


async function CopyLink(el, noticeArea, CopyID) {
    console.groupCollapsed(`[CopyLink] Start`);
    console.log({ el, noticeArea, CopyID });
    console.groupEnd();

    // DomainHandlers에 relativeSelector가 정의되어 있으면 해당 선택자를 사용하고,
    // 그렇지 않으면 .IconSet의 부모 요소를 relativeArea로 설정
    const relativeArea = DomainRules.relativeSelector(el)
    console.log({ relativeArea })
    if (!relativeArea) return

    // relativeArea 내에서 infoSelector를 사용하여 downloadArea를 찾음
    const downloadArea = DomainRules.infoSelector(el)
    console.log({ downloadArea })
    if (!downloadArea) return

    const copyTitle = DomainRules.GetInfo(el);
    const coverImage = DomainRules.getCoverImage?.(downloadArea) || '';

    console.groupCollapsed(`[CopyLink] Processing: ${CopyID || 'No ID'}`);
    console.log({ downloadArea, copyTitle, coverImage, CopyID });
    console.groupEnd();

    const limitedCopyTitle = byteLengthOf(copyTitle.replace(/amp;/g, '').trim(), 240);
    let changedName = nameCorrection(limitedCopyTitle)
    let finalTitle = FilenameConvert(changedName);
    console.log({ changedName, finalTitle });

    const linkItems = querySelectorAllRegex(downloadArea, SkipFilter, 'href', { notMatch: true });
    console.log({ linkItems });
    let copyLinks = '';
    const duplicateLink = [];
    let urlTitle = finalTitle;

    if (!linkItems?.length) {
        return { finalTitle, copyLinks }
    } else {
        linkItems.forEach(async (linkEntry) => {
            const target = linkEntry.href.replace(/\?site=.+/, '');
            if (duplicateLink.indexOf(target) === -1) {
                duplicateLink.push(target);
                const isSkip = SkipClassNames.some(skip => linkEntry.classList.contains(skip));
                const hasChildrenImg = [...linkEntry.children].some(e => e.matches('img'));

                if (!isSkip && !hasChildrenImg) {
                    copyLinks += target + "\n";
                    await UpdateDB(target, urlTitle, linkEntry.getAttribute("id") || PageURL, CopyID);
                }
            }
        });
    }

    if (coverImage && !/imagetwist\.com/.test(coverImage) && duplicateLink.indexOf(coverImage) === -1) {
        copyLinks += coverImage;
        await UpdateDB(coverImage, urlTitle, el.getAttribute("id") || PageURL, CopyID);
    }

    localStorage.setItem(RootDomain, JSON.stringify(RootDomainDB))
    GetState = RootDomainDB
    document.querySelector('.State').innerText = GetState?.length + ' | ' + PackageList(RootDomainDB)?.length
    if (!JSON.parse(localStorage.getItem('NewAdded'))) {
        localStorage.setItem('NewAdded', JSON.stringify(true))
    }
    return { finalTitle, copyLinks };
}

function PackageList(LinksDB) {
    if (LinksDB?.length > 0) {
        let uniqueTitle = [...new Set(LinksDB.map(x => x.T))]
        return uniqueTitle
    }
    else {
        return []
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function SearchMatch(Array, Search, ReplaceSTR) {
    const SearchRegEx = new RegExp(Search, "i")
    const MatchItem = Array.find((e) => e.match(SearchRegEx))
    console.log('MatchItem:', MatchItem)
    if (MatchItem) {
        if (ReplaceSTR) {
            return MatchItem.match(SearchRegEx).pop().replace(ReplaceSTR).trim()
        }
        else {
            return MatchItem.match(SearchRegEx).pop().trim()
        }
    }
    else { return '' }
}


function UpdateDB(Target, UrlTitle, Source, CopyID) {
    searchDB = RootDomainDB.find(({ U }) => U === Target)
    if (searchDB) {
        searchDB.T = UrlTitle
    }
    else {
        RootDomainDB.push({ U: Target, T: UrlTitle, S: Source ? Source : '', I: CopyID ? CopyID : '' })
    }
    return RootDomainDB
}

function RemoveDB(CopyID) {
    RootDomainDB = RootDomainDB.filter(({ I }) => I !== CopyID)
    localStorage.setItem(RootDomain, JSON.stringify(RootDomainDB))
}

function applyClickEffect(selector) {
    const element = document.querySelector(selector);
    if (!element) return;

    const fontSize = ((1 / (GetDPI / 1.5)) * (16 / DefaultFontSize)).toFixed(2) + 'rem';
    element.style.setProperty('color', 'Purple', 'important');
    element.style.setProperty('font-size', fontSize, 'important');
}


async function clearDB() {
    applyClickEffect('.ClearButton');
    localStorage.removeItem(RootDomain)
    RootDomainDB = JSON.parse(localStorage.getItem(RootDomain)) || []
    GetState = RootDomainDB
    document.querySelector('.State').innerText = GetState?.length + ' | ' + PackageList(RootDomainDB)?.length
}

async function sendJD() {
    applyClickEffect('.CopyButton');
    var sendJDData = localStorage.getItem(RootDomain) ? JSON.parse(localStorage.getItem(RootDomain)) : []
    JDownloaderDB(sendJDData)
}

function MakeIcon() {
    const GetDPI = window.devicePixelRatio;
    const DefaultFontSize = parseInt(getComputedStyle(document.documentElement).fontSize);

    console.log('GetDPI: ', GetDPI, 'DefaultFontSize: ', DefaultFontSize);

    document.querySelector("body").insertAdjacentHTML('afterbegin', '<div class="CenterBox"></div>');
    const centerBox = document.querySelector("div.CenterBox");

    if (!centerBox) {
        throw new TypeError("CenterBox 요소를 찾을 수 없습니다.");
    }

    if (isElementCovered(centerBox)) {
        bringElementToFrontWithSteps(centerBox);
    }

    const baseFontSizeRem = (1 / (GetDPI / 1.5)) * (16 / DefaultFontSize);
    const stateFontSizeRem = (baseFontSizeRem * 0.65).toFixed(2) + 'rem';

    const icons = [
        { className: 'ToTop fa-solid fa-circle-chevron-up', event: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
        {
            className: 'ClearButton far fa-minus-square', event: (event) => {
                event.preventDefault();
                if (JSON.parse(localStorage.getItem('NewAdded')) && window.confirm("Not Yet Copy! Clear?")) {
                    localStorage.setItem('NewAdded', JSON.stringify(false));
                    clearDB();
                } else if (!JSON.parse(localStorage.getItem('NewAdded'))) {
                    clearDB();
                }
            }
        },
        {
            className: 'CopyButton fas fa-paste', event: (event) => {
                event.preventDefault();
                localStorage.setItem('NewAdded', JSON.stringify(false));
                sendJD();
            }
        },
        {
            className: 'AllCopy fa-solid fa-box', event: (event) => {
                event.preventDefault();
                AllCopy();
            }
        },
        { className: 'State', event: null },
        { className: 'AllCopyState', event: null }
    ];

    icons.forEach(icon => {
        centerBox.insertAdjacentHTML('beforeend', `<i class="${icon.className}"></i>`);
        if (icon.event) {
            centerBox.querySelector(`.${icon.className.split(' ')[0]}`).addEventListener('click', icon.event);
        }
    });

    centerBox.style.setProperty('font-size', baseFontSizeRem + 'rem', 'important');
    document.querySelector('.State').style.setProperty('font-size', stateFontSizeRem, 'important');
    document.querySelector('.AllCopyState').style.setProperty('font-size', stateFontSizeRem, 'important');
    RootDomainDB = localStorage.getItem(RootDomain) ? JSON.parse(localStorage.getItem(RootDomain)) : [];
    GetState = RootDomainDB;
    document.querySelector('.State').innerText = `${GetState?.length || 0} | ${PackageList(RootDomainDB)?.length || 0}`;
}

/**
 * 주어진 요소의 상위 요소 중 특정 selector에 해당하는 요소를 찾아 반환합니다.
 * @param {Element} el - 기준이 되는 요소
 * @param {string} selector - 찾고자 하는 상위 요소의 CSS 선택자
 * @returns {Element|null} - 조건에 맞는 상위 요소 또는 null
 */
function getParentWithSelector(el, selector) {
    if (!el || !selector) return null;
    let parent = el.closest(selector);
    return parent;
}

/**
 * 아이콘을 동적으로 생성하고, DOM에 추가하는 함수입니다.
 * @param {Element} relativeArea - 아이콘이 추가될 기준이 되는 요소
 * @param {string} copyId - 복사 기능에 사용될 고유 ID
 * @param {boolean} isCopied - 이미 복사된 상태인지 여부
 */
function createAndAddIcons(relativeArea, copyId, isCopied) {
    const iconBaseHtml = '<div class="IconSet" style="position: absolute;"></div>';
    const copyIconHtml = '<span class="CopyIcon fa-solid fa-clone"></span>';
    const minusIconHtml = '<span class="Minus fa-regular fa-square-minus"></span>';
    const noticeHtml = '<div class="noticeArea" style="display: none; position: absolute;"></div>';

    relativeArea.style.setProperty('position', 'relative');
    relativeArea.insertAdjacentHTML('beforeend', iconBaseHtml);
    const iconSet = relativeArea.querySelector('div.IconSet');

    if (!iconSet) return;

    iconSet.insertAdjacentHTML('beforeend', copyIconHtml);
    iconSet.style.setProperty('color', 'dodgerblue');
    iconSet.insertAdjacentHTML('afterend', noticeHtml);
    addEventListeners(iconSet);

    DomainRules.iconPosition(iconSet, relativeArea);

    if (copyId) {
        iconSet.insertAdjacentHTML('beforeend', minusIconHtml);
        const copyIcon = relativeArea.querySelector('.CopyIcon');
        const minusIcon = iconSet.querySelector('.Minus');

        copyIcon.setAttribute("id", copyId);
        minusIcon.classList.add('NotCopyed');

        if (isCopied) {
            copyIcon.classList.add('Copyed');
            minusIcon.classList.remove('NotCopyed');
        }
    }
}

async function AddCopyIcon(node) {

    if (!DomainRules || !DomainRules.selectors.copyTitle) return;

    const copyTitleAreas = node.querySelectorAll(DomainRules.selectors.copyTitle);


    if (!copyTitleAreas?.length) {
        throw new TypeError("CcopyTitleAreas가 존재하지 않거나 배열이 아닙니다.");
    }

    const copiedUrls = Object.keys(localStorage).filter(k => k.includes(RootDomain) && /\d{4}-\d{2}-\d{2}/.test(localStorage.getItem(k)));

    for (const el of copyTitleAreas) {
        const postArea = getParentWithSelector(el, '.postbody, .inside-article, .messageinfo, .postarea, .tborder, .list-row');

        if (!postArea) continue;

        const relativeArea = DomainRules.relativeSelector(el);
        console.log(relativeArea)
        if (!relativeArea) continue;

        const copyID = DomainRules.getCopyID?.(relativeArea, window.location.href) || null;
        const isCopied = copyID && copiedUrls.includes(copyID);

        createAndAddIcons(relativeArea, copyID, isCopied);
        console.log(relativeArea, copyID, isCopied)
    }
}

function JDownloader(JdownloaderData, PackageName, sourceURL) {
    console.log(PackageName + '\n' + JdownloaderData);
    if (JdownloaderData) {
        let data = new URLSearchParams();
        data.append(`urls`, JdownloaderData);
        if (sourceURL) {
            data.append(`source`, sourceURL);
        }
        data.append(`referer`, PageURL);
        if (PackageName) {
            data.append(`package`, PackageName);
        }
        fetch('http://localhost:9666/flash/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Access-Control-Allow-Origin': 'http://localhost:9666',
            },
            body: data,
        }).catch(error => {
            console.error("JDownloader 통신 오류:", error);
            alert("JDownloader 통신에 실패했습니다. JDownloader가 실행 중인지 확인하세요.");
        });
    }
}

function JDownloaderDB(LinksDB) {
    let uniqueTitle = [...new Set(LinksDB.map(x => x.T))] || [...new Set(LinksDB.map(x => x.U))]
    if (uniqueTitle?.length) {
        uniqueTitle.forEach(async x => {
            JDownloader(GetMatchLinks(x, LinksDB), x, GetMatchSource(x, LinksDB))
            await sleep(1000)
        })
    }
}

function GetMatchSource(text, LinksDB) {
    try {
        let S = LinksDB.find(u => text.includes(u.T) && u.S)
        return S ? S.S : false
    } catch (err) {
        console.log(err, text, LinksDB)
    }
}


function GetMatchLinks(text, LinksDB) {
    try {
        return LinksDB.filter(u => text.includes(u.T)).map(l => l.U).join('\n')
    } catch (err) {
        console.log(err, text, LinksDB)
    }
}

function getCookie(name) {
    var cookie = document.cookie;
    if (document.cookie != "") {
        var cookie_array = cookie.split("; ");
        for (var index in cookie_array) {
            var cookie_name = cookie_array[index].split("=")
            if (cookie_name[0] == name) {
                return cookie_name[1];
            }
        }
    }
    return null;
}

function RefreshIcon() {
    GetDPI = window.devicePixelRatio
    DefaultFontSize = parseInt(getComputedStyle(document.documentElement).fontSize)
    console.log('GetDPI: ', GetDPI, 'DefaultFontSize: ', DefaultFontSize)
    const centerBox = document.querySelector("div.CenterBox");
    centerBox.style.setProperty('font-size', ((1 / (GetDPI / 1.5)) * (16 / DefaultFontSize)) + 'rem', 'important');
    document.querySelector('.State').style.setProperty('font-size', ((1 / (GetDPI / 1.5)) * 0.65 * (16 / DefaultFontSize)).toFixed(2) + 'rem', 'important');
    document.querySelector('.AllCopyState').style.setProperty('font-size', ((1 / (GetDPI / 1.5)) * 0.65 * (16 / DefaultFontSize)).toFixed(2) + 'rem', 'important');
    document.querySelector(':root').style.setProperty('--IconSize', ((1 / (GetDPI / 1.5)) * (16 / DefaultFontSize)).toFixed(2) + 'rem')

}



async function AllCopy() {
    document.querySelector('.AllCopy').style = "color: White !important;";

    let AllItems = document.querySelectorAll('.CopyIcon')
    for (let i = 0; i < AllItems.length; i++) {
        AllItems[i].click()
        var d = new Date(Date.now())
        var n = d.toLocaleTimeString()
        document.querySelector('.AllCopyState').innerText = i + 1 + '/ ' + AllItems.length
        await sleep(100)
    }
}


function getNextSibling(elem, selector) {

    var sibling = elem.nextElementSibling;

    if (!selector) return sibling;

    while (sibling) {
        if (sibling.matches(selector)) return sibling;
        sibling = sibling.nextElementSibling
    }
}


function getPreviousSibling(elem, selector) {

    var sibling = elem.previousElementSibling;

    if (!selector) return sibling;

    while (sibling) {
        if (sibling.matches(selector)) return sibling;
        sibling = sibling.previousElementSibling;
    }

}