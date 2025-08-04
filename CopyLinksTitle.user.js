// ==UserScript==
// @name         Copy Links & Title
// @namespace    http://tampermonkey.net/
// @version      1.2.1
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
    top: var(--SetTop, auto);
    left: var(--SetLeft, auto);
    right: var(--SetRight, auto);
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
let CopyLinks = ''
let Copyed = ''

let RootDomainDB = JSON.parse(localStorage.getItem(RootDomain) || '[]');

let MakerCfg = false
let Maker
let UrlTitle = ''
let DirectCopy = true


let Target, DownloadArea, CopyTitle, CopyTitleArea, noticeArea, CopyTitleSelector, Series, TitleID, ID, CoverImage
const SkipFilter = new RegExp('filejoker\\.net\/file\/q25fhzi4k86y|sendurl\\.me|xufile\\.com|pixhost\\.to|imgbox\\.com|utm_source|safedl\\.net|upgrade|\\.jpg$|javascript|SKIP|#|^\/|^(?=.*' + window.location.origin + ')(?!.*\\?site).*$')
const SkipID = /C_\d+/i
const JapaneseChar = /[ぁ-んァ-ン一-龯]/
const SkipClassNames = ['adead_link', 'autohyperlink', 'social-icon', 'postdetails']
const SearchID = /^([a-zA-Z]{2,11}-?\d{2,6}[a-zA-Z]?|\d{2,4}[a-zA-Z]{2,7}-?\d{3,6}[a-zA-Z]?|[a-zA-Z]{1,2}-?\d{2}-?\d{2}|[a-zA-Z]{2,7}-?[a-zA-Z]{1,2}\d{2})(.*)/
const SearchFC2ID = /(^FC2.+\d{6})(.*)/
const SearchIDRegExp = /^(\[\s?)?(?=([a-zA-Z]{2,11}-?\d{2,6}[a-zA-Z]?|\d{2,4}[a-zA-Z]{2,7}-?\d{3,6}[a-zA-Z]?|[a-zA-Z]{1,2}-?\d{2}-?\d{2}|[a-zA-Z]{2,7}-?[a-zA-Z]{1,2}\d{2}))(?!(C_\d+|file\d+))(.*)$/
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

const ReleaseDateRegex = /((19|20)[0-9]{2}[.\/-]([1][0-2]|[0]?[1-9])[.\/-]([3][0|1]|[1|2][0-9]|[0]?[1-9])|([3][0|1]|[1|2][0-9]|[0]?[1-9])[.\/-]([1][0-2]|[0]?[1-9])[.\/-]((19|20)?[0-9]{2})).*/;


const DomainHandlers = {
    'gm\\d+\\.xyz': {
        selectors: {
            copyTitle: '.entry-title a',
            visitedLink: 'h2.entry-title a',
        },
        getTitleArea: (el) => el.closest('.inside-article'),
        getCopyTitle: (area, selector) => area.querySelector(selector)?.textContent.trim(),
        getCoverImage: (area) => area.querySelector('p img')?.getAttribute('data-src') || '',
        getCopyID: (modArea) => modArea.href,
        iconPosition: (iconSet, modArea) => {
            const offset = getRelativeOffset(modArea);
            const iconSetOffset = getRelativeOffset(iconSet);
            iconSet.style.setProperty('top', `${(offset.height / 2 - iconSetOffset.height / 2).toFixed(0)}px`);
            iconSet.style.setProperty('right', `${(-iconSetOffset.width / 4).toFixed(0)}px`);
        },
        infoSelector: 'div.inside-article',
    },
    'pornbb\\.org': {
        selectors: {
            copyTitle: 'div.search-post-subj a.postdetails, span.postdetails.subject',
            visitedLink: null,
        },
        getTitleArea: (el) => el.closest('div.postbody'),
        getCopyTitle: (el, selector) => parseForumTitle(el.closest('div.messageinfo'), selector),
        getCopyID: (modArea, pageURL) => {
            if (/newsearch\.php/.test(pageURL)) return window.location.origin + '/' + modArea.querySelector('a')?.href;
            if (/\.html#\d+/.test(pageURL)) return pageURL;
            return window.location.origin + '/' + modArea.querySelector('a.inl-bl')?.href;
        },
        iconPosition: (iconSet) => {
            iconSet.style.setProperty('z-index', '99999');
        },
        infoSelector: '.content',
    },
    'x-idol\\.net': {
        selectors: {
            copyTitle: 'h2.post-title.entry-title a',
            visitedLink: 'h2.post-title.entry-title a',
        },
        getTitleArea: (el) => el.closest('div.post.hentry:not(.sticky)')?.querySelector('div.entry') || el.closest('div.post.hentry:not(.sticky)'),
        getCopyTitle: (area, selector) => {
            const rawTitle = area.closest('div.post.hentry:not(.sticky)')?.querySelector(selector)?.textContent.trim() || '';
            const infoRaw = area.closest('div.post.hentry:not(.sticky)')?.querySelector('div.entry-content')?.innerText || '';
            const infoLines = infoRaw.split(/\n+/).map(line => line.trim()).filter(Boolean);
            return extractInfoFromText(infoLines, rawTitle, { rawMode: true });
        },
        getCopyID: (modArea) => modArea?.getAttribute('href'),
        iconPosition: (iconSet, modArea) => {
            const offset = getRelativeOffset(modArea);
            const iconSetOffset = getRelativeOffset(iconSet);
            iconSet.style.setProperty('vertical-align', window.getComputedStyle(modArea).getPropertyValue('vertical-align'));
            iconSet.style.setProperty('line-height', window.getComputedStyle(modArea).getPropertyValue('line-height'));
            iconSet.style.setProperty('top', `${(offset.height / 2 - iconSetOffset.height / 2).toFixed(0)}px`);
            iconSet.style.setProperty('right', `${(-iconSetOffset.width / 5).toFixed(0)}px`);
        },
        infoSelector: '.entry-content',
    },
    'forumophilia\\.com': {
        selectors: {
            copyTitle: 'div.messageinfo div.message-header div div.post_subj div.postdetails > a.bold, .messageinfo div.message-header div div.post_subj span.postdetails',
            visitedLink: null,
        },
        getTitleArea: (el) => el.closest('div.messageinfo'),
        getCopyTitle: (area, selector) => parseForumTitle(area, selector),
        getCopyID: (modArea) => {
            const anchor = modArea.closest('.postdetails')?.querySelector('a.bold');
            return anchor ? window.location.origin + '/' + anchor.getAttribute('href') : null;
        },
        iconPosition: (iconSet, modArea) => {
            const titleArea = modArea.closest('.message-header');
            const offset = getRelativeOffset(titleArea);
            iconSet.style.setProperty('top', `${(offset.height / 5).toFixed(0)}px`);
            iconSet.style.setProperty('right', `${(-getRelativeOffset(iconSet).width / 4).toFixed(0)}px`);
        },
        infoSelector: '.postbody',
    },
    'sexfetishforum\\.com': {
        selectors: {
            copyTitle: 'div.post_wrapper div.postarea div.flow_hidden div.keyinfo h5',
            visitedLink: null,
        },
        getTitleArea: (el) => el.closest('div.postarea'),
        getCopyTitle: (area, selector) => parseForumTitle(area.closest('div.messageinfo'), selector),
        getCopyID: (modArea) => modArea.closest('div.post')?.id || '',
        iconPosition: (iconSet) => {
            const titleArea = iconSet.closest('.postarea');
            iconSet.style.setProperty('top', `${getRelativeOffset(iconSet).height}px`);
            iconSet.style.setProperty('left', `${getRelativeOffset(titleArea.querySelector('.keyinfo')).width}px`);
        },
        infoSelector: '.post',
    },
    'planetsuzy\\.org': {
        selectors: {
            copyTitle: 'table.tborder > tbody > tr > td > div.smallfont > img.inlineimg',
            visitedLink: null,
        },
        getTitleArea: (el) => el.closest('table.tborder'),
        getCopyTitle: (area, selector) => parseForumTitle(area, selector),
        getCopyID: (modArea) => window.location.origin + '/' + /t(=)?\d+/.exec(window.location.href)[0] + '-' + modArea.closest('table.tborder').id,
        iconPosition: (iconSet) => {
            const modArea = iconSet.closest('.tborder').querySelector('td.alt1 > div');
            const offset = getRelativeOffset(modArea);
            const iconSetOffset = getRelativeOffset(iconSet);
            iconSet.style.setProperty('--SetTop', `${(offset.height / 2 - iconSetOffset.height / 2).toFixed(0)}px`);
            iconSet.style.setProperty('--SetRight', `${(-iconSetOffset.width / 4).toFixed(0)}px`);
        },
        infoSelector: 'div.alt1',
    },
    'porn-w\\.org': {
        selectors: {
            copyTitle: 'div.row.list-row.genmed div.postdetails a.topictitle',
            visitedLink: null,
        },
        getTitleArea: (el) => el.closest('div.row.list-row.genmed'),
        getCopyTitle: (area, selector) => parseForumTitle(area.closest('div.row.list-row'), selector),
        getCopyID: (modArea) => modArea.closest('div.row.list-row.genmed')?.querySelector('a.topictitle')?.href || '',
        iconPosition: (iconSet, modArea) => {
            const offset = getRelativeOffset(modArea);
            const iconSetOffset = getRelativeOffset(iconSet);
            iconSet.style.setProperty('top', `${(offset.height / 2 - iconSetOffset.height / 2).toFixed(0)}px`);
            iconSet.style.setProperty('right', `${(-iconSetOffset.width / 4).toFixed(0)}px`);
        },
        infoSelector: '.row.list-row',
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


function extractInfoFromText(infoLines, fallbackTitle, options = {}) {
    const {
        preferJapanese = false,
        skipKeywords = [],
        rawMode = false,
    } = options;

    let CopyTitle = fallbackTitle
        .replace(/^(UNCENSORED|CENSORED)\s/, '')
        .replace(/amp;/g, '')
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
                    const titleJapaneseCount = (titleMatch.match(JapaneseChar) || []).length;
                    const copyJapaneseCount = (copyMatch.match(JapaneseChar) || []).length;

                    Title = titleJapaneseCount >= copyJapaneseCount ? titleMatch : copyMatch;
                } else {
                    Title = titleMatch || copyMatch;
                }
            } else if (titleMatch) {
                Title = titleMatch;
            } else if (copyMatch) {
                Title = copyMatch;
            } else {
                Title = line;
            }

            Title = Title.trim() + ' ';
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
            const dateMatch = line.match(ReleaseDateRegex);
            console.log('ReleaseDate Match:', dateMatch);

            if (dateMatch) {
                const ymdMatch = dateMatch[0].match(/(19|20)?\d{2}[.\/-]([0]?[1-9]|1[0-2])[.\/-]([0]?[1-9]|[12][0-9]|3[01])/);
                if (ymdMatch) {
                    const year = ymdMatch[0].slice(0, 4);
                    const month = ymdMatch[0].slice(5, 7).replace(/^0/, '');
                    const day = ymdMatch[0].slice(8, 10).replace(/^0/, '');
                    ReleaseDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} `;
                } else {
                    ReleaseDate = dateMatch[0].trim() + ' ';
                }
            }
        }
        console.log('ID:', ID, 'ModelName:', ModelName, 'ReleaseDate:', ReleaseDate, 'Title:', Title);
        return ID && ModelName && ReleaseDate;
    });

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

    const FinalTitle = `${Maker}${ID ? ID + ' ' : ''}${ReleaseDate}${Title}${ModelName}`.replace(/\s+/g, ' ').trim();
    return FinalTitle;
}


function parseForumTitle(downloadArea, selector) {
    const hostname = location.hostname;
    const domainKey = Object.keys(DomainHandlers).find(pattern => new RegExp(pattern).test(PageURL));
    const domainConfig = DomainHandlers[domainKey] || {};

    let titleText = downloadArea.querySelector(selector)?.textContent || '';
    titleText = titleText.replace(/amp;/gi, '').trim();

    const infoSelector = domainConfig.infoSelector || 'div';
    const rawText = downloadArea.closest(infoSelector)?.innerText || '';

    const cleaned = rawText
        .replace(/(Actress|Model|Label|Circle|Featuring)\s*:?/gi, '')
        .replace(/(?:(?:\r\n|\r|\n)\s*){2}/gm, '\n')
        .replace(/Actress\sand\sTitle\sVideo:|Details\s\/\sInformations|Thumbnails\s\/\sScreenshots|General\s\/\sNames|Asianmania_|New!.+[\d+]/gi, '')
        .replaceAll('"|：', '')
        .replace(/\n{2,}/g, '\n')
        .split('\n')
        .filter(line => line.trim() && !/^(http|Download|Duration|Resolution|Categories|About)/i.test(line));

    const finalTitle = extractInfoFromText(cleaned, titleText);
    const TitleID = finalTitle?.match(SearchID)?.[1] || '';
    const Title = finalTitle?.match(SearchID)?.pop()?.trim() || finalTitle;

    return TitleID && Title ? `${TitleID} ${Title}` : finalTitle;
}

async function showCopyNotice(noticeArea, copyTitleArea, finalTitle, copyLinks) {
    console.log('finalTitle:', finalTitle, '\ncopyLinks:', copyLinks)
    GetDPI = window.devicePixelRatio;
    DefaultFontSize = getDefaultFontSize();
    const isCospl = /cospl\.net/.test(RootDomain);

    $(noticeArea).css({
        "--NFontSize": ((1 / (GetDPI / 1.5)) * 0.6 * (16 / DefaultFontSize)).toFixed(2) + 'rem',
        "top": isCospl ? getRelativeOffset(copyTitleArea).top + getRelativeOffset(copyTitleArea).height : getRelativeOffset(copyTitleArea).height,
        "left": 0,
    });

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
            noticeArea = copyIcon.closest('article, .entry, .postbody, .messageinfo, .postrow, .inside-article')?.querySelector('.noticeArea') || copyIcon.parentElement.parentElement.querySelector('.noticeArea');
            const copyTitleArea = copyIcon.parentElement;

            copyIcon.style.setProperty('color', 'Orange', 'important');
            copyIcon.classList.add('Copyed');

            const CopyTitleSelector = DomainRules.selectors.copyTitle;
            console.log(copyIcon, CopyTitleSelector, noticeArea, copyId)
            const { finalTitle, copyLinks } = await CopyLink(copyIcon, CopyTitleSelector, noticeArea, copyId);

            await showCopyNotice(noticeArea, copyTitleArea, finalTitle, copyLinks);

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
            event.stopPropagation();
            event.stopImmediatePropagation();

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


async function CopyLink(el, CopyTitleSelector, noticeArea, CopyID) {
    console.groupCollapsed(`[CopyLink] Start`);
    console.log({ el, CopyTitleSelector, noticeArea, CopyID });
    console.groupEnd();
    const downloadArea = DomainRules.getTitleArea?.(el);
    const titleArea = DomainRules.getTitleArea?.(el);
    let copyTitle = DomainRules.getCopyTitle?.(titleArea, DomainRules.selectors.copyTitle);
    const coverImage = DomainRules.getCoverImage?.(downloadArea) || '';
    // The line above was removed because 'CopyID' is already passed as a parameter,
    // and 'el' is the icon element, which is the wrong argument for getCopyID.
    console.groupCollapsed(`[CopyLink] Processing: ${CopyID || 'No ID'}`);
    console.log({ downloadArea, copyTitle, coverImage, CopyID });
    console.groupEnd();

    copyTitle = byteLengthOf(copyTitle.replace(/amp;/g, '').trim(), 250);
    let changedName = nameCorrection(copyTitle)
    let finalTitle = FilenameConvert(changedName);
    console.log(changedName, finalTitle);

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


async function ClearUrls() {
    applyClickEffect('.ClearButton');
    localStorage.removeItem(RootDomain)
    RootDomainDB = JSON.parse(localStorage.getItem(RootDomain)) || []
    GetState = RootDomainDB
    document.querySelector('.State').innerText = GetState?.length + ' | ' + PackageList(RootDomainDB)?.length
}

async function ClipPaste() {
    applyClickEffect('.CopyButton');
    var ClipPasteData = localStorage.getItem(RootDomain) ? JSON.parse(localStorage.getItem(RootDomain)) : []
    JDownloaderDB(ClipPasteData)
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
                event.stopPropagation();
                event.stopImmediatePropagation();
                if (JSON.parse(localStorage.getItem('NewAdded')) && window.confirm("Not Yet Copy! Clear?")) {
                    localStorage.setItem('NewAdded', JSON.stringify(false));
                    ClearUrls();
                } else if (!JSON.parse(localStorage.getItem('NewAdded'))) {
                    ClearUrls();
                }
            }
        },
        {
            className: 'CopyButton fas fa-paste', event: (event) => {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                localStorage.setItem('NewAdded', JSON.stringify(false));
                ClipPaste();
            }
        },
        {
            className: 'AllCopy fa-solid fa-box', event: (event) => {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
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


async function AddCopyIcon(node) {

    const CopyTitleArea = node.querySelectorAll(DomainRules.selectors.copyTitle);

    if (!CopyTitleArea?.length) {
        throw new TypeError("CopyTitleArea가 존재하지 않거나 배열이 아닙니다.");
    }

    const copiedUrls = Object.keys(localStorage).filter(k => k.includes(RootDomain) && /\d{4}-\d{2}-\d{2}/.test(localStorage.getItem(k)));
    const iconBaseHtml = '<div class="IconSet" style="position: absolute;"></div>';
    const copyIconHtml = '<span class="CopyIcon fa-solid fa-clone"></span>';
    const minusIconHtml = '<span class="Minus fa-regular fa-square-minus"></span>';
    const noticeHtml = '<div class="noticeArea" style="display: none; position: absolute;"></div>';


    for (const el of CopyTitleArea) {
        const modArea = el;
        const titleArea = DomainRules.titleAreaSelector
            ? modArea.closest(DomainRules.titleAreaSelector)
            : modArea.parentElement;

        if (!titleArea) continue;

        if (titleArea.closest('div.post.hentry.sticky')) continue

        titleArea.style.setProperty('position', 'relative');
        titleArea.insertAdjacentHTML('beforeend', iconBaseHtml);
        const iconSet = titleArea.querySelector('div.IconSet');

        if (!iconSet) continue;

        iconSet.insertAdjacentHTML('beforeend', copyIconHtml);
        iconSet.style.setProperty('color', 'dodgerblue');
        modArea.insertAdjacentHTML('afterend', noticeHtml);
        addEventListeners(iconSet)

        DomainRules.iconPosition(iconSet, modArea);

        let copyID = DomainRules.getCopyID?.(modArea, window.location.href) || null;
        if (!copyID) {
            console.log('copyID이 없습니다.', copyID)
        }
        if (copyID) {
            iconSet.insertAdjacentHTML('beforeend', minusIconHtml);
            const copyIcon = titleArea.querySelector('.CopyIcon');
            const minusIcon = iconSet.querySelector('.Minus');

            copyIcon.setAttribute("id", copyID);
            minusIcon.classList.add('NotCopyed');

            if (copiedUrls.includes(copyID)) {
                copyIcon.classList.add('Copyed');
                minusIcon.classList.remove('NotCopyed');
                if (DomainRules.selectors.visitedLink) {
                    titleArea.querySelector(DomainRules.selectors.visitedLink)?.classList.add('Copyed');
                }
            }
        }
    }
}

function JDownloader(JdownloaderData, PackageName, sourceURL) {
    console.log(PackageName + '\n' + JdownloaderData)
    if (JdownloaderData) {
        let data = new URLSearchParams();
        data.append(`urls`, JdownloaderData);
        if (sourceURL) {
            data.append(`source`, sourceURL)
        }
        data.append(`referer`, PageURL)
        if (PackageName) {
            data.append(`package`, PackageName)
        }
        fetch('http://localhost:9666/flash/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Access-Control-Allow-Origin': 'http://localhost:9666',
            },
            body: data
        })
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

let DomainRules
document.addEventListener("DOMContentLoaded", () => {
    let cookieCheck = getCookie("ClearCopyed")
    if (!cookieCheck || cookieCheck != "Y") {
        console.log('ClearCopyed')
        ClearCopyed()
        setClearCopyed("ClearCopyed", "Y", 1)
    }

    DomainRules = getDomainConfig(RootDomain);
    if (!DomainRules) {
        console.error("해당 도메인에 대한 설정이 없습니다.");
        return
    }


    FontAwesomeCSS()

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
};


function getPreviousSibling(elem, selector) {

    var sibling = elem.previousElementSibling;

    if (!selector) return sibling;

    while (sibling) {
        if (sibling.matches(selector)) return sibling;
        sibling = sibling.previousElementSibling;
    }

};
