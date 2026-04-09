// ==UserScript==
// @name        Torrent Sites - add magnet links (Readable CSS)
// @namespace   DandyClubs
// @version     2026.02.16
// @author      DandyClubs
// @match       https://xxxclub.to/*
// @match       https://rargb.to/*
// @grant       GM_addStyle
// @grant       GM_setClipboard
// @grant       GM_xmlhttpRequest
// @run-at      document-end
// @require     https://raw.githubusercontent.com/DandyClubs/RootDomain/main/RootDomain.js
// ==/UserScript==

/* ----------------------------
   Common Styles (Readable)
----------------------------- */
const commonStyle = `
    .DBCenterBox {
        top: 5px;
        position: fixed;
        max-width: max-content;
        font-style: initial !important;
        text-align: center;
        border-radius: .25em !important;
        box-sizing: border-box !important;
        background-color: rgba(0, 0, 0, 0.5) !important;
        display: flex;
        flex-wrap: nowrap;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        visibility: hidden;
    }

    .DBCenterBox .DownButton, 
    .DBCenterBox .UpButton {
        text-align: center;
        cursor: pointer;
        color: LimeGreen !important;
        padding: .25em !important;
        background-color: transparent !important;
        text-shadow: 2px 4px 4px rgba(0,0,0,0.2), 
                     0px -5px 10px rgba(255,255,255,0.15);
    }

    .DBCenterBox .State {
        display: inline-block;
        transform: scale(0.5);
        font-weight: bold;
        text-align: right;
        vertical-align: middle;
        font-family: 'Noto Sans', sans-serif !important;
        font-style: italic !important;
        max-width: 12ch;
        color: WhiteSmoke !important;
        background-color: transparent !important;
        text-shadow: 2px 4px 4px rgba(0,0,0,0.2), 
                     0px -5px 10px rgba(255,255,255,0.15);
    }

    .visited { 
        color: Orange !important; 
    }

    .GetMagnet, .GetTitle { 
        cursor: pointer; 
    }
`;

/* ----------------------------
   Site Specific Styles
----------------------------- */
const siteStyles = {
    "xxxclub.to": `
        main.container, .container, .container-lg, .container-md, 
        .container-sm, .container-xl, .container-xxl { 
            max-width: 1600px; 
        } 
        
        .GetMagnet, .GetTitle { 
            font-size: 13px; 
            color: dodgerblue !important; 
        } 
        
        ul > li > span:nth-child(3) { 
            text-align: center; 
        }
    `,
    "rargb.to": `
        .lista2t { 
            width: 100% !important; 
        } 
        
        .GetMagnet, .GetTitle { 
            font-size: 14px; 
            color: #38a1f3 !important; 
            padding: 2px; 
        } 
        
        table.lista2t td.dl-buttons { 
            text-align: center !important; 
            position: relative; 
            width: 40px; 
        } 
        
        body > table { 
            width: 70% !important; 
        }
    `
};

/* ----------------------------
   Database & Logic (이하 로직은 최적화 버전과 동일)
----------------------------- */
class MagnetManagerDB {
    constructor() {
        this.dbName = 'MagnetManager';
        this.storeName = 'MagnetStore';
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 3);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'S' });
                    store.createIndex('dateIndex', 'D', { unique: false });
                }
            };
            request.onsuccess = (e) => { this.db = e.target.result; resolve(); };
            request.onerror = (e) => reject(e.target.error);
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

    async add(S, M, D) { return this._tx('readwrite', s => s.put({ S, M, D })); }
    async get(S) { return this._tx('readonly', s => s.get(S)); }
    async remove(S) { return this._tx('readwrite', s => s.delete(S)); }
    async getAllKeys() { return this._tx('readonly', s => s.getAllKeys()); }

    async getOldData(days) {
        return new Promise((resolve) => {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            const range = IDBKeyRange.upperBound(cutoffDate.toISOString().slice(0, 10));
            this._tx('readonly', s => s.index('dateIndex').getAll(range)).then(resolve);
        });
    }

    async downloadDB() {
        const data = await this._tx('readonly', s => s.getAll());
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = Object.assign(document.createElement('a'), { href: url, download: `${this.dbName}_backup.json` });
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    async uploadDB(file) {
        const text = await file.text();
        const data = JSON.parse(text);
        const tx = this.db.transaction([this.storeName], 'readwrite');
        const store = tx.objectStore(this.storeName);
        data.forEach(item => store.put(item));
        return new Promise(resolve => { tx.oncomplete = () => resolve(true); });
    }
}

const magnetManager = new MagnetManagerDB();
let JobList = [];
let isProcessing = false;
let stateCounter;
let cachedFontSize = null;

const siteConfigs = {
    "xxxclub.to": {
        tableSelector: "div.browsetableinside, div.similarinside, div.divtableinside",
        cellSelectorInitial: "ul > li > span:nth-child(2)",
        cellSelectorNew: "ul > li:not(:first-child) > span:nth-child(3)",
        observerTagName: "LI",
        insertHeadersCellsInitial: (cell, index, title) => {
            const html = index === 0 ? `<span>${title}</span>` : `<span class="dl-buttons"></span>`;
            cell.insertAdjacentHTML('afterend', html);
        },
        getKey: (cell) => cell.parentElement.querySelector('a[href*="/torrents/details"]').id,
        getHref: (cell) => cell.parentElement.querySelector('a[href*="/torrents/details"]').href,
        getTitle: (cell) => cell.parentElement.querySelector('a[href*="/torrents/details"]').textContent,
        extractMagnet: (doc) => doc.querySelector('a.mg-link[href^="magnet:"]'),
        hasTitleCopy: true,
        makeIconSelector: "div.page-header",
        deleteExtra: () => {
            document.querySelectorAll("div.browsetableinside ul li span a.page-link:not([data-no-instant]), div.browsepagination a.page-link:not([data-no-instant])")
                .forEach(el => el.remove());
        }
    },
    "rargb.to": {
        tableSelector: "table.lista2t",
        cellSelectorInitial: "tr > td:nth-child(2)",
        cellSelectorNew: "tr.lista2 > td:nth-child(3)",
        observerTagName: "TR",
        insertHeadersCellsInitial: (cell, index, title) => {
            const html = index === 0 ? `<td align="center" class="header6 header40" style="width:50px;">${title}</td>` : `<td align="center" class="lista"></td>`;
            cell.insertAdjacentHTML('afterend', html);
        },
        getKey: (cell, href) => href.split('/').pop(),
        getHref: (cell) => cell.parentElement.querySelector('a[href*="/torrent/"]').href,
        getTitle: (cell) => cell.parentElement.querySelector('a[href*="/torrent/"]').textContent,
        extractMagnet: (doc) => doc.querySelector('a[href^="magnet:?xt="]'),
        hasTitleCopy: true,
        makeIconSelector: "table.lista2t"
    }
};

const updateClipboard = (data) => {
    navigator.clipboard ? navigator.clipboard.writeText(data) : GM_setClipboard(data);
};

function getFontSize() {
    if (cachedFontSize) return cachedFontSize;
    const el = document.createElement('div');
    Object.assign(el.style, { width: '1rem', position: 'absolute', visibility: 'hidden' });
    document.body.appendChild(el);
    const size = parseFloat(getComputedStyle(el).width);
    el.remove();
    cachedFontSize = size || 16;
    return cachedFontSize;
}

async function modCell(cell) {
    if (!cell) return;
    const url = config.getHref(cell);
    const Key = config.getKey(cell, url);
    const stored = await magnetManager.get(Key);
    let magnet;
    if (stored) {
        if (stored?.M && typeof stored.M === "object" && Object.keys(stored.M).length === 0) {
            await magnetManager.remove(Key);
            magnetManager.getAllKeys().then(keys => stateCounter.textContent = keys.length);            
            magnet = '';
        }else{
            magnet = stored?.M;
        }                
    }
    

    cell.classList.add('dl-buttons');
    cell.innerHTML = `
        ${config.hasTitleCopy ? `<span><i class="GetTitle fa-solid fa-paste" data-key="${Key}"></i></span>` : ""}
        <span><a class="GetMagnet fa-solid fa-magnet ${magnet ? 'visited' : 'not-processed'}" 
                 data-key="${Key}" data-url="${url}" 
                 href="${magnet || '#unprocessed'}" title="ML"></a></span>`;

    const mgBtn = cell.querySelector('.GetMagnet');
    if (magnet) {
        mgBtn.style.setProperty('color', 'Orange', 'important');
    } else {
        mgBtn.addEventListener('click', handleMagnetClick);
    }

    if (config.hasTitleCopy) {
        cell.querySelector('.GetTitle').addEventListener('click', (e) => {
            mgBtn.click();
            const rawTitle = config.getTitle(cell);
            if (rawTitle) updateClipboard(rawTitle.replace(/^(.*?\d+p).*/, '$1').trim());
            e.target.style.setProperty('color', 'Orange', 'important');
        });
    }
}

async function processJob(el) {
    if (!el.classList.contains('not-processed')) return;
    const tLink = el.dataset.url;

    try {
        const resp = await fetch(tLink).then(r => r.text());
        const doc = new DOMParser().parseFromString(resp, 'text/html');
        const retrieved = config.extractMagnet(doc)?.href;

        if (retrieved) {
            const Key = el.dataset.key;
            await magnetManager.add(Key, retrieved, new Date().toISOString().slice(0, 10));
            updateCounter();

            el.href = retrieved;
            el.classList.replace('not-processed', 'visited');
            el.style.setProperty('color', 'Orange', 'important');
            el.removeEventListener('click', handleMagnetClick);
            el.click();
        }
    } catch (e) {
        console.error("Fetch error:", e);
        throw e;
    }
}

async function jobWorker() {
    if (isProcessing || !JobList.length) return;
    isProcessing = true;

    while (JobList.length > 0) {
        const job = JobList[0];
        try {
            await processJob(job.el);
            JobList.shift();
        } catch (e) {
            if (++job.retries >= 2) JobList.shift();
            else await new Promise(r => setTimeout(r, 1000));
        }
        await new Promise(r => setTimeout(r, 250));
    }
    isProcessing = false;
}

function handleMagnetClick(e) {
    e.preventDefault();
    if (!JobList.some(j => j.el === this)) {
        JobList.push({ el: this, retries: 0 });
        jobWorker();
    }
}

async function updateCounter() {
    if (stateCounter) {
        const keys = await magnetManager.getAllKeys();
        stateCounter.textContent = keys.length;
    }
}

async function makeUI() {
    if (document.querySelector(".DBCenterBox")) return;

    document.body.insertAdjacentHTML('afterbegin', `
        <div class="DBCenterBox">
            <i class="DownButton fa-solid fa-file-arrow-down" title="Backup DB"></i>
            <i class="UpButton fa-solid fa-file-arrow-up" title="Restore DB"></i>
            <i class="State"></i>
        </div>`);

    const box = document.querySelector('.DBCenterBox');
    stateCounter = box.querySelector('.State');
    updateCounter();

    const adjust = () => {
        const header = document.querySelector(config.makeIconSelector);
        if (!header) return;
        const rect = header.getBoundingClientRect();
        const dpi = window.devicePixelRatio || 1;
        const fontSize = getFontSize();

        box.style.left = `${rect.left + header.offsetWidth - box.offsetWidth * 2 - 16}px`;
        box.style.fontSize = `${(1.5 / dpi) * (16 / fontSize)}rem`;
        box.style.visibility = "visible";
    };

    window.addEventListener("resize", adjust);
    adjust();

    box.querySelector(".DownButton").addEventListener('click', () => magnetManager.downloadDB());
    box.querySelector(".UpButton").addEventListener('click', () => {
        const input = Object.assign(document.createElement("input"), { type: "file", accept: "application/json" });
        input.onchange = async (e) => {
            try {
                await magnetManager.uploadDB(e.target.files[0]);
                alert('Success!');
                updateCounter();
            } catch (err) { alert('Fail: ' + err.message); }
            input.remove();
        };
        input.click();
    });
}

const PageURL = location.href;
const RootDomain = extractRootDomain(PageURL);
const config = siteConfigs[RootDomain];

if (config) {
    (async () => {
        await magnetManager.init();
        const fa = Object.assign(document.createElement('link'), {
            href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css',
            rel: 'stylesheet'
        });
        document.head.appendChild(fa);
        const lastCleanup = localStorage.getItem('lastMagnetCleanup');
        const today = new Date().toISOString().slice(0, 10);
        if (lastCleanup !== today) {
            const old = await magnetManager.getOldData(180);
            for (const d of old) await magnetManager.remove(d.S);
            localStorage.setItem('lastMagnetCleanup', today);
        }

        GM_addStyle(commonStyle);
        GM_addStyle(siteStyles[RootDomain] || "");

        makeUI();
        if (config.deleteExtra) config.deleteExtra();

        const processTable = (root) => {
            const tables = root.querySelectorAll(config.tableSelector);
            tables.forEach(table => {
                table.querySelectorAll(config.cellSelectorInitial).forEach((c, i) => config.insertHeadersCellsInitial(c, i, 'ML'));
                table.querySelectorAll(config.cellSelectorNew).forEach(modCell);
            });
        };
        processTable(document);

        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        if (node.tagName === config.observerTagName && node.id !== 'infy-scroll-bottom') {
                            const targetCell = node.querySelector('td:nth-child(2), span:nth-child(2)');
                            if (targetCell) {
                                config.insertHeadersCellsInitial(targetCell, 999, 'ML');
                                modCell(targetCell.nextElementSibling);
                            }
                        } else {
                            const nested = node.querySelectorAll(config.observerTagName);
                            nested.forEach(n => {
                                if (n.id !== 'infy-scroll-bottom') {
                                    const targetCell = n.querySelector('td:nth-child(2), span:nth-child(2)');
                                    if (targetCell) {
                                        config.insertHeadersCellsInitial(targetCell, 999, 'ML');
                                        modCell(targetCell.nextElementSibling);
                                    }
                                }
                            });
                        }
                    }
                });                
            }
            if (config.deleteExtra) config.deleteExtra();
        });
        observer.observe(document.body, { childList: true, subtree: true });

        window.addEventListener("beforeunload", (e) => {
            if (JobList.length) { e.preventDefault(); e.returnValue = true; }
        });
    })();
}