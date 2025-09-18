// ==UserScript==
// @name         Remove Content
// @namespace    http://tampermonkey.net/
// @version      2025.09.13
// @description  try to take over the world!
// @author       You
// @match        https://blogjav.net/*
// @match        https://javarchive.com/*
// @match        https://maxjav.com/*
// @match        https://maxjav.xyz/*
// @match        https://javfree.me/*
// @match        http://wetholefans.com/*
// @match        https://therarbg.com/*
// @exclude      /javarchive\.com\/\d{4,6}/
// @match        https://sis001.com/forum/forum*.html
// @match        https://www.naughtyblog.org/*
// @match        https://sis001.com/forum/forumdisplay.php*
// @match        https://ultoporn.com/*
// @match        https://k2sporn.com/*
// @match        https://hidefporn.ws/*
// @match        https://misskon.com/*
// @match        https://www.t66y.com/thread*
// @match        https://eyny.com/forum.php?mod=forumdisplay*
// @match        https://bestgirlsexy.com/*
// @match        https://0xxx.ws/*
// @match        https://pornolab.net/forum/*
// @match        https://xxxclub.to/torrents/*
// @match        https://jappydolls.net/*
// @match        https://x-idol.net/*
// @match        https://allasiangirls.net/*
// @exclude      https://0xxx.ws/articles/*
// @exclude      /blogjav\.net\/\d+/
// @exclude      /maxjav\.com/\d+/
// @exclude      /maxjav\.xyz/\d+/
// @exclude      /javfree\.me/\d+/
// @exclude      /hidefporn\.ws\/\d+/
// @exclude      /misskon\.com\/\d+/
// @exclude      https://pornolab.net/forum/viewtopic*
// @require      https://raw.githubusercontent.com/DandyClubs/RootDomain/main/RootDomain.js
// @require      https://raw.githubusercontent.com/DandyClubs/Filter/main/Filters.js
// @run-at       document-body
// @grant		 GM_addStyle
// @noframes
// ==/UserScript==




class ContentDB {
    constructor() {
        this.dbName = 'ContentManager';
        this.storeName = 'ContentStore';
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



const contentManager = new ContentDB();

let contentCache = [];

function contentDBUpdate() {
    return new Promise((resolve, reject) => {
        contentManager.getAll().then((result) => {
            contentCache = result;
            resolve(contentCache);
        }).catch(error => {
            console.error("Failed get data:", error);
        });
    });
}



// 페이지 URL을 가져오는 부분은 동일합니다.
const PageURL = window.location !== window.parent.location ? document.referrer : document.location.href;
const RootDomain = extractRootDomain(PageURL);

// 정규식 관련 헬퍼 함수는 그대로 유지합니다.
const RegexFrom = (strings, flags) =>
    new RegExp(
        strings
            .filter(e => e)
            .map(t => t.replace(/\s+/g, '\\s'))
            .join("|"),
        flags
    );

const escapeRegExp = (value) => value.replace(/[.*+?^${}()<>|[\]\\]/gi, "\\$&");

const RemoveContentEX = RegexFrom(RemoveContentText.split(/\r?\n/), 'i');
const MREX = /\bMR\b/;
const SkipModelEX = RegexFrom(SkipModel.split(/\r?\n/), 'gi');
const WarningEX = RegexFrom(WarningText.split(/\r?\n/), 'gi');
const AddDate = new Date().toISOString().slice(0, 10);

console.log('RemoveContentEX: ', RemoveContentEX, '\nSkipModelEX: ', SkipModelEX, '\nWarningEX: ', WarningEX);

// ----------------------------------------------------
// 💡 개선된 부분: 사이트별 설정을 하나의 객체로 통합
// ----------------------------------------------------

// 모든 사이트 설정을 하나의 'siteConfigs' 객체에 정의하여 관리 용이성을 높였습니다.
const siteConfigs = {
    'blogjav.net': {
        linkSelector: '.entry-title a',
        removeTagSelector: 'article.hentry',
    },
    'bestgirlsexy.com': {
        linkSelector: 'div.elementor-post__text h3.elementor-post__title a',
        removeTagSelector: 'div.elementor-post__card',
    },
    'jappydolls.net': {
        linkSelector: 'header.entry-header .entry-title a',
        removeTagSelector: 'article.hentry',
    },
    'x-idol.net': {
        linkSelector: 'div.entry .post-title.entry-title a',
        removeTagSelector: 'div.entry.item-wrap',
    },
    'eyny.com': {
        linkSelector: 'tr th.common a.xst',
        removeTagSelector: 'tbody',
    },
    'javarchive.com': {
        linkSelector: 'ul li h3 a',
        removeTagSelector: 'li',
    },
    'javfree.me': {
        linkSelector: 'h2.entry-title a',
        removeTagSelector: 'div.hentry',
    },
    'maxjav': {
        linkSelector: 'div.post.hentry h2.title a',
        extraSelector: 'div.post.hentry .entry p:first-child',
        removeTagSelector: 'div.hentry',
    },
    'k2sporn.com': {
        linkSelector: 'div.story-head h2.title a',
        removeTagSelector: 'div.story.shortstory',
    },
    'hidefporn.ws': {
        linkSelector: 'div.story-head h2.title a',
        removeTagSelector: 'div.story.shortstory',
    },
    'ultoporn.com': {
        linkSelector: 'div.storyhead h3.shead a',
        extraSelector: 'div.storyhead p.link-cat',
        removeTagSelector: 'div.story.box',
    },
    'wetholefans.com': {
        linkSelector: 'div.short-title a',
        extraSelector: 'div.short-story div.short-cat',
        removeTagSelector: 'div.short-story',
    },
    'naughtyblog.com': {
        linkSelector: 'div.post-header-overview h2.post-title a',
        removeTagSelector: 'div.post-overview',
    },
    '0xxx.ws': {
        linkSelector: 'table#home-table tbody tr td.title a.screenshot',
        removeTagSelector: 'tr',
    },
    'pornolab.net': {
        linkSelector: 'div.torTopic a.torTopic, td a.gen, td div a.med.tLink',
        removeTagSelector: 'tr',
    },
    'xxxclub.to': {
        linkSelector: 'div.browsetableinside ul li span a[id^="#"]',
        removeTagSelector: 'li',
    },
    'therarbg.com': {
        linkSelector: 'td.cellName div.wrapper a',
        removeTagSelector: 'tr',
    },
    'sis001.com': {
        linkSelector: 'th span a[href*="thread"], th span a[href*="viewthread.php?tid"]',
        extraSelector: 'th em a',
        removeTagSelector: 'tbody',
        rootSelector: 'div.mainbox.threadlist form table:last-child',
    },
    't66y.com': {
        linkSelector: 'tr.t_one.tac td.tal h3 a[href*="htm_data"]',
        extraSelector: 'tr.tr3.t_one.tac td a',
        removeTagSelector: 'tr',
    },
    'misskon.com': {
        linkSelector: 'article.item-list .post-box-title a',
        removeTagSelector: 'article.item-list',
    },
    'allasiangirls.net': {
        linkSelector: 'div.box-text.text-center div.box-text-inner.blog-post-inner .post-title a',
        removeTagSelector: 'div.post-item',
    },
};

GM_addStyle(`
span.Warning, span.SkipModel {
	background-color: rgba(138, 43, 226, .5);
	color: rgba(138, 43, 226, 1);
	border-radius: .25em;
	padding: .25em 0;
}
`);

// 현재 페이지 URL과 일치하는 설정 객체를 찾습니다.
const activeConfigKey = Object.keys(siteConfigs).find(key => PageURL.includes(key));
const Active = activeConfigKey ? siteConfigs[activeConfigKey] : null;

// 일치하는 설정이 없으면 스크립트 실행을 중단합니다.
if (!Active) {
    console.log('No matching site configuration found.');
    return;
}

// ----------------------------------------------------
// 💡 개선된 부분: Queue 클래스 유지보수
// ----------------------------------------------------
// Queue 클래스는 그대로 유지하되, 주석을 추가하여 역할을 명확히 했습니다.
class Queue {
    constructor() {
        this.items = {};
        this.front = 0;
        this.rear = 0;
    }

    enqueue(item) {
        this.items[this.rear++] = item;
    }

    dequeue() {
        if (this.isEmpty()) return null;
        const item = this.items[this.front];
        delete this.items[this.front++];
        return item;
    }

    peek() {
        if (this.isEmpty()) return null;
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
let managementWorking = false;


async function ClearTitle() {
    console.log('Start Delete Title!');
    const oldDay = 5;
    const oldData = await contentManager.getOldData(oldDay);

    for (const data of oldData) {
        contentManager.remove(data.K);
    }
}

function getCookie(name) {
    let cookie = document.cookie;
    if (document.cookie != "") {
        let cookie_array = cookie.split("; ");
        for (var index in cookie_array) {
            var cookie_name = cookie_array[index].split("=");
            if (cookie_name[0] == name) {
                return cookie_name[1];
            }
        }
    }
    return null;
}

// ----------------------------------------------------
// 💡 개선된 부분: 함수 역할 분리 및 명확화
// ----------------------------------------------------

/**
 * 특정 콘텐츠를 포함하는 요소를 찾아 제거하거나 텍스트를 대체합니다.
 * @param {HTMLElement} node - 탐색을 시작할 DOM 요소
 * @param {string} selector - 요소를 찾는 CSS 선택자
 * @param {boolean} isExtra - 추가 선택자인지 여부
 */
async function processContent(node, selector, isExtra = false) {
    const items = [...node.querySelectorAll(selector)];
    for (const item of items) {
        let textContent = item.textContent;

        // 추가 선택자의 경우 특정 단어로 제거
        if (isExtra) {
            if (RemoveContentEX.test(textContent) || /femdom/i.test(textContent) || MREX.test(textContent)) {
                console.log('Extra content removed:', textContent.match(RemoveContentEX) || textContent.match(/femdom/i) || textContent.match(MREX), textContent);
                item.closest(Active.removeTagSelector)?.remove();
                continue;
            }
        }
        // 일반 링크의 경우 URL 또는 텍스트로 제거

        if (/\/(femdom|transsexuals)\//i.test(item.href)) {
            console.log('Link content removed:', item.href.match(/\/(femdom|transsexuals)\//i));
            item.closest(Active.removeTagSelector)?.remove();
            continue;
        }

        if (RemoveContentEX.test(textContent) || MREX.test(textContent)) {
            console.log('Keyword content removed:', textContent.match(RemoveContentEX) || textContent.match(MREX), textContent);
            item.closest(Active.removeTagSelector)?.remove();
            continue;
        }

        if (/hidefporn\.ws|ultoporn\.com|k2sporn\.com|wetholefans\.com/.test(PageURL)) {
            const resolutionMatch = textContent.match(/(\d{3,4})p/);
            const resolution = resolutionMatch ? parseInt(resolutionMatch[1]) : 0;
            if (resolution) {
                const Title = textContent.replace(/^Nude\sLeaked\s-/i, '').replace(/\s[\[|\(].*?[UltraHD|UHD|FullHD|HD|SD|2K 1080p].+$/i, '').replace(resolutionMatch[0], '').replace(/^(.*?)(?<=:)/gi, '').trim().toLowerCase();
                const CheckDB = (text, DB) => DB.some(s => s.K.toLowerCase().includes(text.toLowerCase()));
                if (resolution >= 1080 && !CheckDB(Title, contentCache)) {
                    console.log('Title:', Title, '\nResolution:', resolution);
                    await contentManager.add(Title, AddDate);
                    contentCache = await contentDBUpdate();
                }
                else if (resolution <= 720 && CheckDB(Title, contentCache)) {
                    console.log('Low resolution content removed:', resolution, Title);
                    item.closest(Active.removeTagSelector)?.remove();                    
                    continue;
                }
            }
        }

        // 제거되지 않은 경우 텍스트 대체
        replaceText(item);
    }
}


/**
 * 텍스트 노드에서 특정 단어를 찾아 클래스Span으로 감싸줍니다.
 * @param {HTMLElement} node - 텍스트 노드를 포함하는 DOM 요소
 */
function replaceText(node) {
    const textNodes = [...node.childNodes]
        .filter(child => child.nodeType === 3 && child.textContent.trim())
        .map(child => ({ text: child.textContent.trim(), node: child }));

    for (const { text, node: textNode } of textNodes) {
        const matches = [...(text.match(SkipModelEX) || []), ...(text.match(WarningEX) || [])];
        const uniqueMatches = [...new Set(matches)];

        if (uniqueMatches.length) {
            let tempHtml = text;

            const skipModelMatches = [...new Set(text.match(SkipModelEX) || [])];
            if (skipModelMatches.length) {
                const skipModelRegex = RegexFrom(skipModelMatches.map(e => /^\[.+\]$/.test(e) ? escapeRegExp(e) : e), 'gi');
                tempHtml = tempHtml.replaceAll(skipModelRegex, `<span class="SkipModel">$&</span>`);
            }

            const warningMatches = [...new Set(text.match(WarningEX) || [])];
            if (warningMatches.length) {
                const warningRegex = RegexFrom(warningMatches.map(e => /^\[.+\]$/.test(e) ? escapeRegExp(e) : e), 'gi');
                tempHtml = tempHtml.replaceAll(warningRegex, `<span class="Warning">$&</span>`);
            }

            const wrapper = document.createElement('div');
            wrapper.innerHTML = tempHtml;
            textNode.replaceWith(...wrapper.childNodes);
            //console.log(`Text replaced: ${text} -> ${tempHtml}`);
        }
    }
}


/**
 * 큐에 있는 모든 작업을 순차적으로 처리합니다.
 */
function processQueue() {
    managementWorking = true;
    while (!queue.isEmpty()) {
        const item = queue.dequeue();
        if (Active.extraSelector) {
            processContent(item, Active.extraSelector, true);
        }
        processContent(item, Active.linkSelector);
    }
    managementWorking = false;
}

// ----------------------------------------------------
// 💡 개선된 부분: 메인 로직 및 MutationObserver
// ----------------------------------------------------

function setClearTitle(name, value) {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    // 현재 시간과 내일 00:00:00 사이의 차이를 초 단위로 계산
    const diffInSeconds = Math.floor((tomorrow - now) / 1000);

    // Max-Age를 사용하여 쿠키 생성    
    document.cookie = `${name}=${value}; max-age=${diffInSeconds}; domain=${RootDomain}; path=/;`;
}


window.addEventListener("DOMContentLoaded", async () => {
    await contentManager.init();    
    console.log('Start Remove Content!');
    const rootElement = Active.rootSelector ? document.querySelector(Active.rootSelector) : document.body;

    const cookieCheck = getCookie("ClearTitle");
    if (!cookieCheck || cookieCheck !== "Y") {
        console.log('ClearTitle');
        ClearTitle();
        setClearTitle("ClearTitle", "Y");
    }

    contentCache = await contentDBUpdate();

    // 초기 페이지 콘텐츠 처리
    if (rootElement) {
        if (Active.extraSelector) {
            processContent(rootElement, Active.extraSelector, true);
        }
        processContent(rootElement, Active.linkSelector);

        // 동적 콘텐츠를 위한 MutationObserver 설정
        const observer = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE && (node.querySelector(Active.linkSelector) || (Active.extraSelector && node.querySelector(Active.extraSelector)))) {
                            queue.enqueue(node);
                        }
                    }
                }
            }
            if (!managementWorking && !queue.isEmpty()) {
                processQueue();
            }
        });

        observer.observe(rootElement, { childList: true, subtree: true });
    }
}, { once: true });