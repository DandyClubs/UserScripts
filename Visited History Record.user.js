// ==UserScript==
// @name        Visited History Record
// @namespace   DandyClubs
// @version     2025.08.21
// @include     https://sis001.com/forum/forum*.html
// @match       https://sis001.com/forum/forumdisplay.php*
// @match       https://ultoporn.com/*
// @match       http://wetholefans.com/*
// @include     https://sehuatang.net/forum*
// @include     https://www.t66y.com/thread*
// @include     https://k2sporn.com/*
// @include     https://hidefporn.ws/*
// @include     https://everia.club/*
// @include     https://foamgirl.net/*
// @exclude     https://ultoporn.com/*.html
// @run-at      document-end
// @grant		GM_addStyle
// @grant		GM_registerMenuCommand
// @grant       GM_openInTab
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_deleteValue
// @grant       GM_listValues
// @grant       GM_addValueChangeListener
// @require     https://raw.githubusercontent.com/DandyClubs/RootDomain/main/RootDomain.js
// @require     https://raw.githubusercontent.com/DandyClubs/CopyLinksCommonJS/main/CopyLinksCommonJS.js
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
@import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@600&family=Noto+Sans+KR:wght@600&family=Noto+Sans:wght@600&display=swap');

:root {
  --bottom: -.75rem;
}

a.visited {
  color: #FF9800 !important;
  font-weight: 500;
}

#ct a.visited {
    color: #FF9800 !important;
    font-weight: 500;
}


.VisitedCenterBox {
    left: 55%;
    top: 30px;
    margin: 0 auto;
    max-width: max-content;
    min-width: 120px;
    position: fixed !important;
    word-spacing: .5rem;
    font-style: initial !important;
    text-align: center;
    color: dodgerblue !important;
    padding: 0 0.5rem 0 0.25rem !important;
    border-radius: .25rem !important;
    -webkit-box-sizing: border-box !important;
    box-sizing: border-box !important;
    z-index: 999999;
}


.OpenTab {
    word-spacing: .5rem;
    white-space : nowrap;
    padding: 0.25rem;
    margin: .5rem;
    border-radius: .25rem !important;
    -webkit-box-sizing: border-box !important;
    box-sizing: border-box !important;
    background-color: rgba(0,0,0,0.5) !important;
    cursor: pointer;
    text-shadow: 1px 1px 1px red, 0 0 2px blue, 0 0 1px black;
}

.VisitedState {
    font-weight: bold;
    text-align: center;
    vertical-align: middle;
    font-family: 'Noto Sans', sans-serif !important;
    padding: .25rem !important;
    font-style: italic !important;
    background-color:transparent !important;
}

.VisitedDay {
    position: absolute;
	font-size: .75rem;
	font-weight: 600;
    bottom: var(--bottom);
    right: .75rem;    
}

.VisitedDay.Today {
    animation: neon 2s ease infinite;
  -moz-animation: neon 2s ease infinite;
  -webkit-animation: neon 2s ease infinite;
}


@keyframes neon {
  0%,
  100% {
    color: #FED128;
  }
  50% {
    color: #806914;
  }
}


`);


const PageURL = window.location !== window.parent.location ? document.referrer : document.location.href
const RootDomain = extractRootDomain(PageURL)

function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
const skipWordsList = /sis001\.com/.test(PageURL)
    ? [
        '中字高清',
        '经典酒店偷拍',
        '桃花主题房偷拍',
        'HEYZO',
        '1Pondo',
        '1PON',
    ]
    : [
        '中字高清',
        '经典酒店偷拍',
        '桃花主题房偷拍',
        '酒店偷拍',
    ];

// Escape each keyword, join with OR '|', and make spaces optional
const SkipWorld = new RegExp(
    skipWordsList
        .map(word => escapeRegExp(word))
        .join('|')
        .replace(/\s/g, '\\s?'),
    'gi'
);

console.log(SkipWorld);


const sis001 = {
    MatchUrl: 'sis001.com',
    root: document.querySelector('div.mainbox.threadlist table:has(tbody[id^="normalthread"])'),
    exlink: 'th span:not(.threadpages) a[href*="thread"], th span:not(.threadpages) a[href*="viewthread.php"]',
    Class: null,
    ID: /normalthread/,
    RegexElement: /thread.+\.html|viewthread\.php/i,
    OpenTab: true,
    Get: 'GetTitle',
    SaveMode: 'localStorage',
}

const sehuatang = {
    MatchUrl: 'sehuatang.net',
    root: document.querySelector('table#threadlisttableid:has(tbody[id^="normalthread"])'),
    exlink: 'tbody[id^="normalthread"] a[href*="thread"]',
    Class: 'xst',
    RegexElement: /thread.+\.html/,
    OpenTab: true,
    Get: 'GetTitle',
    SaveMode: 'localStorage',
}

const t66y = {
    MatchUrl: 't66y.com',
    root: document.querySelector('div#main'),
    exlink: 'tbody#tbody tr.t_one.tac td.tal h3 a[href*="htm_data"]',
    Class: null,
    RegexElement: /htm_data.+\.html/,
    OpenTab: true,
    Get: 'GetID',
    SaveMode: 'localStorage',
}


const k2sporn = {
    MatchUrl: 'k2sporn.com',
    root: document.querySelector('div.side_main'),
    exlink: 'div.story-head a',
    Class: null,
    RegexElement: /\/\d{3,}.*.html/,
    OpenTab: false,
    Get: 'GetTitle',
    SaveMode: 'ScriptStorage',
}

const ultoporn = {
    MatchUrl: 'ultoporn.com',
    root: document.querySelector('div#midside'),
    exlink: 'div.storyhead h3.shead a',
    Class: null,
    RegexElement: /\/\d{3,}.*.html/,
    OpenTab: false,
    Get: 'GetTitle',
    SaveMode: 'ScriptStorage',
}

const hidefporn = {
    MatchUrl: 'hidefporn.ws',
    root: document.querySelector('div.side_main'),
    exlink: 'div.story-head h2.title a',
    Class: null,
    RegexElement: /\/\d{3,}.*.html/,
    OpenTab: false,
    Get: 'GetTitle',
    SaveMode: 'ScriptStorage',
}

const wetholefans = {
    MatchUrl: 'wetholefans.com',
    root: document.querySelector('div#middle'),
    exlink: 'div.short-title a',
    Class: null,
    RegexElement: /\/\d{3,}.*.html/,
    OpenTab: false,
    Get: 'GetTitle',
    SaveMode: 'ScriptStorage',
}

const foamgirl = {
    MatchUrl: 'foamgirl.net',
    root: document.querySelector('div.update_area'),
    exlink: 'div.case_info a.meta-title',
    Class: null,
    RegexElement: /\d+\.html/,
    OpenTab: false,
    Get: 'GetTitle',
    SaveMode: 'ScriptStorage',
}

const everia = {
    MatchUrl: 'everia.club',
    root: document.querySelector('main#main.site-main'),
    exlink: '.blog-entry-title.entry-title a',
    Class: null,
    RegexElement: /\/\d+\/\d+\/\d+\//,
    OpenTab: false,
    Get: 'GetTitle',
    SaveMode: 'ScriptStorage',
}



const hostExtractors = /* #__PURE__ */ Object.freeze({
    __proto__: null,
    sehuatang,
    sis001,
    t66y,
    k2sporn,
    ultoporn,
    hidefporn,
    wetholefans,
    foamgirl,
    everia,
})


class Queue {
    constructor() {
        this.items = {};
        this.front = 0;
        this.rear = 0;
    }
    enqueue(item) {
        this.items[this.rear] = item;
        this.rear++;
    }
    dequeue() {
        const item = this.items[this.front];
        delete this.items[this.front];
        this.front++;
        return item;
    }
    peek() {
        return this.items[this.front];
    }
    get size() {
        return this.rear - this.front;
    }
    isEmpty() {
        return this.front === this.rear
    }
}

const queue = new Queue();


const extractors = Object.values(hostExtractors).filter(Boolean)
const Active = extractors.find((extractor) => PageURL.includes(extractor.MatchUrl))
if (!Active) { return }


let visited

async function Management(x) {
    while (x) {
        await initVisitedListeners(x);  // initVisitedListeners가 async라면 await
        queue.dequeue();
        x = queue.peek();
    }
}



// c.f. MutationObserver
// https://developer.mozilla.org/ja/docs/Web/API/MutationObserver
const observer = new MutationObserver(mutations => {
    for (const { addedNodes } of mutations) {
        for (const node of addedNodes) {
            // Only care about real elements…
            if (!(node instanceof HTMLElement)) continue;

            // Skip any “junk” text or ads
            if (SkipWorld.test(node.textContent)) continue;

            // Does this new subtree contain one of our target links?
            const link = node.querySelector(Active.exlink);
            if (!link) continue;

            // Enqueue and kick off processing if this is the head of the queue
            queue.enqueue(node);
            if (queue.peek() === node) {
                Management(node);
            }
        }
    }
});


async function OpenTab(A) {
    GM_openInTab(A.href, { active: false, insert: false })

    if (A.classList.contains('RecordHistory')) {
        SaveVisited(A)
    }
}


let AddNodes = [], VisitedState

function RefreshItems() {
    return new Promise((resolve) => {
        const nodes = [...new Set(Active.root.querySelectorAll(Active.exlink))];
        AddNodes = nodes.filter(a =>
            !SkipWorld.test(a.textContent) &&
            !a.classList?.contains('visited') &&
            MatchRegexElement(a, Active.RegexElement, 'href', Active.Class)
        );
        resolve(AddNodes);
    });
}

function MakeIcon() {
    let GetDPI = window.devicePixelRatio
    let DefaultFontSize = getDefaultFontSize()
    console.log('GetDPI: ', GetDPI, 'DefaultFontSize: ', DefaultFontSize)
    let CenterBoxZIndex = 99999
    let CenterBoxFontSize = Number(((1 / (GetDPI / 1.5)) * 0.9 * (16 / DefaultFontSize)).toFixed(2)) + 'rem'

    if (document.querySelector("div.VisitedCenterBox")) { return }
    document.querySelector("body").insertAdjacentHTML('afterbegin', '<div class="VisitedCenterBox" style="max-width: max-content; position: fixed;"></div>')

    if (Active.OpenTab) {
        let VisitedCenterBox = document.querySelector("div.VisitedCenterBox")
        VisitedCenterBox.insertAdjacentHTML('afterbegin', '<div class="OpenTab fa-solid fa-arrow-up-right-from-square"></div>')
        VisitedCenterBox.insertAdjacentHTML('beforeend', '&emsp;<i class="VisitedState"></i>')
        VisitedState = document.querySelector('.VisitedState')

        document.querySelector(".OpenTab").addEventListener('click', async function (e) {
            e.preventDefault()
            document.querySelector('.OpenTab').style.visibility = "hidden"
            let OpenCount = AddNodes?.length <= 40 ? AddNodes : AddNodes.slice(0, 30)
            let Index = 1
            while (OpenCount.length >= Index) {
                await OpenTab(OpenCount[Index - 1])
                VisitedState.innerText = OpenCount.length - Index
                if (Index > 10) {
                    await sleep(1500);
                } else if (Index > 5) {
                    await sleep(1000);
                } else {
                    await sleep(250);
                }
                Index++
            }
            await sleep(1000)
            RefreshItems().then(() => {
                VisitedState.innerText = AddNodes.length
            })
            document.querySelector('.OpenTab').style.visibility = "visible"
            VisitedCenterBox.style.cssText = `font-size: ${CenterBoxFontSize}; z-index: ${CenterBoxZIndex}; display: block;`
            VisitedState.style.cssText = `font-size: ${Number(((1 / (GetDPI / 1.5)) * 0.75 * (16 / DefaultFontSize)).toFixed(2))}rem;`
        })
    }
}


function MatchRegexElement(Taget, regex, attributeToSearch, ClassName) {
    if (ClassName) {
        return regex.test(Taget.getAttribute(attributeToSearch)) && Taget.classList.contains(ClassName)
    }
    else {
        return regex.test(Taget.getAttribute(attributeToSearch))
    }
}



const GetTitle = el => el.textContent.trim()
    .replace(/\(\d+P\)$/, '')
    .replace(/\[\d.+\]$/, '')
    .replace('(MP4@RF@無碼)', '')
    .replace(/\(.+?\)\s?$/, '')
    .replace(/\[.+?\]\s?$/, '')
    .replace(/\.mp4-\w+/i, '')
    .replace(/\s-\s/g, ' ')
    .replace(/^.+\.(com|net)(:|\s-)\s/, '')
    .replace(/\s+/, ' ')
    .replace(/^Nude\sLeaked\s-/i, '')
    .replace(/\s(\[|])[UltraHD|UHD|FullHD|HD|SD|2K].+$/i, '')
    .trim();

const GetID = el => {
    const parts = el.href.split('/');
    return parts.length ? parts.pop().replace('.html', '') : '';
}


let listenerId = GM_addValueChangeListener('NewItem', function (key, oldValue, newValue, remote) {
    if (remote) {
        let el = querySelectorIncludesText(Active.exlink, newValue)
        VisitedCSS(el, GM_getValue(newValue))
        //console.log("The value of the '" + key + "' key has changed from '" + oldValue + "' to '" + newValue + "'");
    }
});


function querySelectorIncludesText(selector, text) {
    return Array.from(document.querySelectorAll(selector))
        .find(el => el.textContent.includes(text));
}

const initVisitedListeners = async (node) => {
    //console.log('Start check Visited!')
    //console.log(node)

    if (Active.SaveMode === 'localStorage') {
        visited = Object.entries(localStorage)
            .filter(([key, date]) => /\d{4}-\d{2}-\d{2}/.test(date))
            .map(([key]) => key);
    } else {
        visited = await GM_listValues();
        if (!visited.length) {
            Object.entries(localStorage).forEach(([key, date]) => {
                if (/\d{4}-\d{2}-\d{2}/.test(date)) {
                    GM_setValue(key, date);
                }
            });
            visited = await GM_listValues();
        }
    }

    let HistoryFilter = [...node.querySelectorAll(Active.exlink)].filter(a =>
        MatchRegexElement(a, Active.RegexElement, "href", Active.Class) && !a.classList?.contains('visited')
    );

    for (let el of HistoryFilter) {
        let linkInfo;
        el.classList.add('RecordHistory');
        if (Active.Get === 'GetID') {
            linkInfo = GetID(el);
        } else {
            linkInfo = GetTitle(el);
        }
        const linkInfoLower = linkInfo.toLowerCase();
        let T = visited.find(e => e.toLowerCase().includes(linkInfoLower));

        if (T) {
            let X;
            //console.log('Visited: ', linkInfo, T)
            if (Active.SaveMode === 'localStorage') {
                X = localStorage.getItem(T);
            } else {
                X = GM_getValue(T);
            }

            if (X) {
                VisitedCSS(el, X);
            }
        }
    }

    if (VisitedState) {
        RefreshItems().then(() => {
            VisitedState.innerText = AddNodes.length;
        });
    }
};


function VisitedCSS(el, X) {
    const todayStr = new Date().toISOString().slice(0, 10);
    const xDateStr = new Date(X).toISOString().slice(0, 10);

    switch (Active.MatchUrl) {
        case 't66y.com':
        case 'sis001.com':
        case 'foamgirl.net':
            if (el.parentElement?.parentElement) {
                el.parentElement.parentElement.style.setProperty('position', 'relative');
            }
            break;
        case 'everia.club': {
            const article = el.closest('article.blog-entry');
            if (article) {
                article.style.setProperty('position', 'relative');
            }
            break;
        }
        default:
            if (el.parentElement) {
                el.parentElement.style.setProperty('position', 'relative');
            }
    }

    el.classList.add('visited');
    X = todayStr === xDateStr ? 'Today' : X
    if (el.nextElementSibling?.matches('i.VisitedDay')) {
        el.nextElementSibling.innerText = X;
    } else {
        const className = (todayStr === xDateStr) ? 'VisitedDay Today' : 'VisitedDay';
        el.insertAdjacentHTML('afterend', `<i class="${className}"> ${X}</i>`);
    }
}


async function ClearVisited() {
    console.log('Start Delete Visited!');

    let visitedKeys;
    if (Active.SaveMode === 'localStorage') {
        visitedKeys = Object.entries(localStorage)
            .filter(([key, date]) => /\d{4}-\d{2}-\d{2}/.test(date))
            .map(([key, _]) => key);
    } else {
        const allKeys = await GM_listValues();
        visitedKeys = allKeys.filter(key => {
            const val = GM_getValue(key);
            return /\d{4}-\d{2}-\d{2}/.test(val);
        });
    }

    const now = new Date();
    const oneDayMs = 1000 * 60 * 60 * 24;

    for (let key of visitedKeys) {
        let storedDateStr;
        if (Active.SaveMode === 'localStorage') {
            storedDateStr = localStorage.getItem(key);
        } else {
            storedDateStr = GM_getValue(key);
        }

        if (storedDateStr && !isNaN(Date.parse(storedDateStr))) {
            const storedDate = new Date(storedDateStr);
            const diffDays = (now - storedDate) / oneDayMs;

            if (diffDays > 30) {
                if (Active.SaveMode === 'localStorage') {
                    localStorage.removeItem(key);
                } else {
                    await GM_deleteValue(key);
                }
                console.log('Deleted item:', key, storedDateStr);
            }
        }
    }
}



function setClearVisited(name, value) {
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

function SaveVisited(el) {
    const AddDate = new Date().toISOString().slice(0, 10);
    let linkInfo;

    if (Active.Get === 'GetID') {
        linkInfo = GetID(el);
    } else {
        linkInfo = GetTitle(el)
    }

    el.classList.add('visited');

    if (typeof linkInfo === 'string' && linkInfo.trim() !== '') {
        if (Active.SaveMode === 'localStorage') {
            localStorage.setItem(linkInfo, AddDate);
        } else {
            GM_setValue(linkInfo, AddDate);
            // 불필요한 중복 설정 방지 (옵션)
            const currentNewItem = GM_getValue('NewItem');
            if (currentNewItem !== linkInfo) {
                GM_setValue('NewItem', linkInfo);
            }
        }
        console.log('linkInfo:', linkInfo, '\nAddDate:', AddDate);
        VisitedCSS(el, AddDate);
    } else {
        console.warn('Invalid linkInfo:', linkInfo);
    }
}


function Start() {
    if (!Active.root) return;

    MakeIcon();

    initVisitedListeners(Active.root);

    const cookieCheck = getCookie("ClearVisited");
    if (!cookieCheck || cookieCheck !== "Y") {
        console.log('ClearVisited');
        ClearVisited();
        setClearVisited("ClearVisited", "Y");
    }

    observer.observe(document.body, { childList: true, subtree: true });

    Active.root.addEventListener('click', function (e) {
        if (!e.target) return;

        let target = e.target;

        if (!target.classList.contains('RecordHistory')) {
            switch (Active.MatchUrl) {
                case 'k2sporn.com': {
                    const closestShortStoryImg = e.target.closest('.shortstory-img');
                    if (closestShortStoryImg) {
                        target = closestShortStoryImg.closest('.shortstory').querySelector(Active.exlink);
                    }
                    break;
                }
                case 'wetholefans.com': {
                    if (e.target.matches('h2') || e.target.matches('div.short-story center a img')) {
                        const closestShortStory = e.target.closest('.short-story');
                        target = closestShortStory.querySelector(Active.exlink);
                    }
                    break;
                }
                case 'foamgirl.net': {
                    if (e.target.matches('a img.waitpic')) {
                        const closestListItem = e.target.closest('li.i_list');
                        target = closestListItem.querySelector(Active.exlink);
                    }
                    break;
                }
                case 'everia.club': {
                    if (e.target.matches('span.overlay')) {
                        const closestEntryInner = e.target.closest('div.blog-entry-inner');
                        target = closestEntryInner.querySelector(Active.exlink);
                    }
                    break;
                }
                default:
                    target = e.target.closest('a');
            }
        }

        if (target && target.classList.contains('RecordHistory')) {
            SaveVisited(target);
        }
    });

    // Adjust bottom offset for some sites to prevent UI overlap or for styling purposes
    switch (Active.MatchUrl) {
        case 'sehuatang.net':
        case 'sis001.com':
        case 't66y.com':
        case 'everia.club':
        case 'foamgirl.net':
            document.documentElement.style.setProperty('--bottom', '.25rem');
            break;
        default:
            document.documentElement.style.setProperty('--bottom', '-.75rem');
    }
}


FontAwesomeCSS()

Start()

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
