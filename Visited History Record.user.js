// ==UserScript==
// @name        Visited History Record
// @namespace   DandyClubs
// @version     2025.09.11
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
// @include     https://misskon.com/*
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
  --top: 0;  
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
    top: var(--top);    
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



class VisitedManagerDB {
    constructor() {
        this.dbName = 'VisitedManager';
        this.storeName = 'VisitedStore';
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 3);

            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                // 스토어가 없다면 새로 만들고 인덱스를 생성합니다.
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'K' });
                    store.createIndex('dateIndex', 'D', { unique: false });
                }
                // 스토어는 있지만 인덱스가 없는 경우, 즉 기존에 있던 DB에 인덱스를 추가해야 하는 경우
                else {
                    const store = request.transaction.objectStore(this.storeName);
                    if (!store.indexNames.contains('dateIndex')) {
                        store.createIndex('dateIndex', 'D', { unique: false });
                    }
                }
            };

            request.onsuccess = (e) => {
                this.db = e.target.result;
                resolve();
            };

            request.onerror = (e) => reject(e.target.error);
        });
    }

    async add(K, D) {
        return this._tx('readwrite', store => store.put({ K: K, D: D }));
    }

    async remove(K) {
        // 짧은 URL을 키로 사용하여 삭제합니다.
        return this._tx('readwrite', store => store.delete(K));
    }

    async get(K) {
        // 짧은 URL을 키로 사용하여 특정 데이터를 가져옵니다.
        return this._tx('readonly', store => store.get(K));
    }

    async getAll() {
        // 모든 저장된 데이터를 배열로 가져옵니다.
        return this._tx('readonly', store => store.getAll());
    }

    async getAllKeys() {
        return this._tx('readonly', store => store.getAllKeys());
    }

    async clear() {
        return this._tx('readwrite', store => store.clear());
    }

    async getOldData(days) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([this.storeName], 'readonly');
            const store = tx.objectStore(this.storeName);

            // 'dateIndex' 인덱스를 사용합니다.
            const index = store.index('dateIndex');

            const oneDay = 1000 * 60 * 60 * 24;
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);

            // IndexedDB 키 범위(IDBKeyRange)를 사용하여 특정 날짜 이전의 데이터만 가져옵니다.
            // `upperBound`는 지정된 값보다 작은 모든 키를 포함합니다.
            const range = IDBKeyRange.upperBound(cutoffDate.toISOString().slice(0, 10));

            const request = index.getAll(range);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
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



const VisitedManager = new VisitedManagerDB();



/**
 * 로컬 스토리지의 모든 데이터를 IndexedDB로 마이그레이션합니다.
 * shortUrl이 'http'로 시작하는 항목만 마이그레이션합니다.
 * 마이그레이션이 성공한 항목은 로컬 스토리지에서 삭제합니다.
 * @returns {Promise<void>}
 */
async function migrateFromLocalStorage() {
    console.log("Starting data migration from localStorage to IndexedDB...");

    try {
        await VisitedManager.init();
        console.log("IndexedDB initialized.");
    } catch (e) {
        console.error("Failed to initialize IndexedDB:", e);
        return;
    }

    const migrationTasks = [];
    const visitedKeys = Object.entries(localStorage)
        .filter(([key, date]) => /\d{4}-\d{2}-\d{2}/.test(date))
        .map(([key, _]) => key);

    for (const key of visitedKeys) {
        try {
            const rawValue = localStorage.getItem(key);
            if (!rawValue) continue;

            const data = rawValue;

            if (data) {
                console.log(`Preparing to migrate: ${key}`);

                // Promise와 shortUrl을 함께 객체로 저장합니다.
                const promise = VisitedManager.add(key, data);
                migrationTasks.push({ promise, key });
            } else {
                console.warn(`Skipping invalid data for key: ${key}`);
            }
        } catch (e) {
            console.error(`Error parsing data for key ${key}:`, e);
        }
    }

    // 모든 Promise를 추출하여 Promise.all()로 기다립니다.
    const promises = migrationTasks.map(task => task.promise);
    await Promise.all(promises);

    console.log("All data successfully migrated to IndexedDB.");

    // 마이그레이션이 성공한 항목만 로컬 스토리지에서 삭제합니다.
    migrationTasks.forEach(task => {
        localStorage.removeItem(task.key);
        console.log(`Removed from localStorage: ${task.key}`);
    });

    console.log("All corresponding localStorage data cleared.");
}

//migrateFromLocalStorage();


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
    SaveMode: 'indexedDB',
    OpenTabCount: 30,
}

const sehuatang = {
    MatchUrl: 'sehuatang.net',
    root: document.querySelector('table#threadlisttableid:has(tbody[id^="normalthread"])'),
    exlink: 'tbody[id^="normalthread"] a[href*="thread"]',
    Class: 'xst',
    RegexElement: /thread.+\.html/,
    OpenTab: true,
    Get: 'GetTitle',
    SaveMode: 'indexedDB',
    OpenTabCount: 30,
}

const t66y = {
    MatchUrl: 't66y.com',
    root: document.querySelector('div#main'),
    exlink: 'tbody#tbody tr.t_one.tac td.tal h3 a[href*="htm_data"]',
    Class: null,
    RegexElement: /htm_data.+\.html/,
    OpenTab: true,
    Get: 'GetID',
    SaveMode: 'indexedDB',
    OpenTabCount: 30,
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
    OpenTabCount: 30,
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
    OpenTabCount: 30,
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
    OpenTabCount: 30,
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
    OpenTabCount: 30,
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
    OpenTabCount: 30,
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
    OpenTabCount: 30,
}

const misskon = {
    MatchUrl: 'misskon.com',
    root: document.querySelector('body:not(.single-post) div#main-content'),
    exlink: 'article.item-list .post-box-title a',
    extraLink: 'article.item-list div.post-thumbnail a img',
    closestTag: 'article.item-list',
    SearchATag: '.post-box-title a',
    Class: null,
    RegexElement: null,
    OpenTab: true,
    Get: 'textContent',
    SaveMode: 'indexedDB',
    OpenTabCount: 20,
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
    misskon,
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
    //GM_openInTab(A.href, { active: false, insert: false })
    A.click();
    /*
        if (A.classList.contains('RecordHistory')) {
            SaveVisited(A)
        }
            */
}


const addNodesSet = new Set();
let VisitedState;
const processedLinks = new Set();


const mutCallback = (mutationsList, observer) => {
    for (const { addedNodes } of mutationsList) {
        for (const node of addedNodes) {
            if (!(node instanceof HTMLElement)) continue;

            if (node.nodeType == Node.ELEMENT_NODE && node.childNodes.length > 0 && node.querySelector(Active.exlink)) {
                checkVisited(node).then((Lists) => {
                    Lists.forEach(a => {
                        const href = a.href;
                        if (
                            !SkipWorld.test(a.textContent) &&
                            !a.classList?.contains('visited') &&
                            MatchRegexElement(a, Active.RegexElement, 'href', Active.Class) &&
                            !processedLinks.has(href) // <--- 중복 방지 로직 추가
                        ) {
                            addNodesSet.add(a);
                        }
                    });
                })
            }
        }
    }
}

const linksObserver = new MutationObserver(mutCallback)


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
            const AddNodes = Array.from(addNodesSet);
            let OpenCount = AddNodes?.length <= Active.OpenTabCount + 5 ? AddNodes : AddNodes.slice(0, Active.OpenTabCount)
            let Index = 1
            while (OpenCount.length >= Index) {
                const a = OpenCount[Index - 1]
                await OpenTab(OpenCount[Index - 1])
                VisitedState.innerText = OpenCount.length - Index
                addNodesSet.delete(a)
                processedLinks.add(a.href);
                await sleep(500);
                Index++
            }
            await sleep(1000)
            VisitedState.innerText = addNodesSet.size;
            document.querySelector('.OpenTab').style.visibility = "visible"
            VisitedCenterBox.style.cssText = `font-size: ${CenterBoxFontSize}; z-index: ${CenterBoxZIndex}; display: block;`
            VisitedState.style.cssText = `font-size: ${Number(((1 / (GetDPI / 1.5)) * 0.75 * (16 / DefaultFontSize)).toFixed(2))}rem;`
        })
    }
}


function MatchRegexElement(Taget, regex, attributeToSearch, ClassName) {
    if (regex && ClassName) {
        return regex.test(Taget.getAttribute(attributeToSearch)) && Taget.classList.contains(ClassName);
    }
    else if (regex) {
        return regex.test(Taget.getAttribute(attributeToSearch));
    } else {
        return Taget;
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


function checkVisited(node = Active.root) {
    const newItems = new Set();

    return new Promise(async (resolve) => {
        //console.log('Start check Visited!')
        if (Active.SaveMode === 'indexedDB') {
            visited = await VisitedManager.getAllKeys();
        } else if (Active.SaveMode === 'ScriptStorage') {
            visited = await GM_listValues();
        }

        let checkLists = [...node.querySelectorAll(Active.exlink)].filter(a =>
            MatchRegexElement(a, Active.RegexElement, "href", Active.Class) && !a.classList?.contains('visited')
        );

        for (let el of checkLists) {
            let linkInfo;
            el.classList.add('RecordHistory');
            if (Active.Get === 'GetID') {
                linkInfo = GetID(el);
            } else if (Active.Get === 'textContent') {
                linkInfo = el.textContent.trim();
            } else {
                linkInfo = GetTitle(el);
            }
            const linkInfoLower = linkInfo.toLowerCase();
            let T = visited.find(e => e.toLowerCase().includes(linkInfoLower));

            if (T) {
                let X;
                //console.log('Visited: ', linkInfo, T)
                if (Active.SaveMode === 'indexedDB') {
                    const stored = await VisitedManager.get(T);
                    if (stored) {
                        X = stored.D;
                    }
                } else if (Active.SaveMode === 'ScriptStorage') {
                    X = GM_getValue(T);
                }

                if (X) {
                    VisitedCSS(el, X);
                }
            } else {
                newItems.add(el);
            }

        }
        resolve(Array.from(newItems));
    })
}

const initVisitedListeners = async (node) => {

    checkVisited(node).then((Lists) => {
        Lists.forEach(a => {
            const href = a.href;
            if (
                !SkipWorld.test(a.textContent) &&
                !a.classList?.contains('visited') &&
                MatchRegexElement(a, Active.RegexElement, 'href', Active.Class) &&
                !processedLinks.has(href) // <--- 중복 방지 로직 추가
            ) {
                addNodesSet.add(a);
            }
        });

        if (VisitedState) {
            VisitedState.innerText = addNodesSet.size;
        }
    })
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
        case 'misskon.com': {
            const article = el.closest('article.item-list');
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
    const now = new Date();
    const oneDayMs = 1000 * 60 * 60 * 24;
    const oldDay = 180;

    if (Active.SaveMode === 'indexedDB') {
        const oldData = await VisitedManager.getOldData(oldDay);

        for (const data of oldData) {
            VisitedManager.remove(data.S);
        }
    } else if (Active.SaveMode === 'ScriptStorage') {
        const allKeys = await GM_listValues();
        allKeys.filter(key => {
            const storedDateValue = GM_getValue(key);
            if (storedDateValue && /\d{4}-\d{2}-\d{2}/.test(storedDateValue) && !isNaN(Date.parse(storedDateValue))) {
                const storedDate = new Date(storedDateValue);
                const diffDays = (now - storedDate) / oneDayMs;
                if (diffDays > oldDay) {
                    GM_deleteValue(key);
                    console.log('Deleted item:', key, storedDateValue);
                }
            }
        })
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

async function SaveVisited(el) {
    const AddDate = new Date().toISOString().slice(0, 10);
    let linkInfo;

    if (Active.Get === 'GetID') {
        linkInfo = GetID(el);
    } else if (Active.Get === 'textContent') {
        linkInfo = el.textContent.trim();
    } else {
        linkInfo = GetTitle(el)
    }

    el.classList.add('visited');

    if (typeof linkInfo === 'string' && linkInfo.trim() !== '') {
        if (Active.SaveMode === 'indexedDB') {
            await VisitedManager.add(linkInfo, AddDate);
        } else if (Active.SaveMode === 'ScriptStorage') {
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


async function Start() {
    if (!Active.root) return;

    if (Active.SaveMode === 'indexedDB') {
        await VisitedManager.init();
    };

    MakeIcon();

    initVisitedListeners(Active.root);

    const cookieCheck = getCookie("ClearVisited");
    if (!cookieCheck || cookieCheck !== "Y") {
        console.log('ClearVisited');
        ClearVisited();
        setClearVisited("ClearVisited", "Y");
    }

    observer.observe(document.body, { childList: true, subtree: true });

    linksObserver.observe(document.body, { subtree: true, childList: true });

    Active.root.addEventListener('click', function (e) {
        if (!e.target) return;

        let target = e.target;

        if (!target.classList.contains('RecordHistory')) {
            if (Active.extraLink && target.nodeName === 'IMG') {
                target = e.target.closest(Active.closestTag).querySelector(Active.SearchATag);
            } else {
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
        }

        if (target && target.classList.contains('RecordHistory')) {
            addNodesSet.delete(target)
            SaveVisited(target);
            if (VisitedState) {
                VisitedState.innerText = addNodesSet.size;
            }
        }
    });

    // Adjust bottom offset for some sites to prevent UI overlap or for styling purposes
    switch (Active.MatchUrl) {
        case 'sehuatang.net':
        case 'sis001.com':
        case 't66y.com':
        case 'everia.club':
        case 'foamgirl.net':
            document.documentElement.style.setProperty('--top', '.5rem');
            break;
        case 'misskon.com': {
            const T = getElementMetrics(document.querySelector('.post-thumbnail'), { mode: 'relative' });
            const off = T.height + 48;
            document.documentElement.style.setProperty('--top', `${off}px`);
            break;
        }
        case 'k2sporn.com':
            document.documentElement.style.setProperty('--top', '-1rem');
            break;        
        default:
            document.documentElement.style.setProperty('--top', '1.5rem');
    }
}


FontAwesomeCSS()

Start()

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
