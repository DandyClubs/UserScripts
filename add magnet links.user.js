// ==UserScript==
// @name        Torrent Sites - add magnet links
// @namespace   DandyClubs
// @version     2023.09.14
// @description Adds a column with magnet links in lists (multi-site support)
// @author      DandyClubs
// @license     MIT
// @include     https://xxxclub.to/torrents/*
// @include     https://therarbg.com/get-posts/*
// @grant       GM_addStyle
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_deleteValue
// @grant       GM_listValues
// @grant       GM_setClipboard
// @grant       GM_xmlhttpRequest
// @run-at      document-idle
// @require     https://raw.githubusercontent.com/DandyClubs/RootDomain/main/RootDomain.js
// ==/UserScript==

/* ----------------------------
   Site Configurations
----------------------------- */
const siteConfigs = {
    "xxxclub.to": {
        tableSelector: "div.browsetableinside",
        cellSelectorInitial: "ul > li > span:nth-child(2)",
        cellSelectorNew: "ul > li > span:nth-child(3)",
        getKey: (cell) => cell.querySelector('a[href*="/torrents/details/"]').textContent,
        getHref: (cell) => cell.querySelector('a[href*="/torrents/details/"]').href,
        extractMagnet: (doc) => doc.querySelector('div.detailsdescr ul li.downloadboxlist span a.mg-link[href^="magnet:"]'),
        hasTitleCopy: true
    },
    "therarbg.com": {
        tableSelector: "div.row.p-1",
        cellSelectorInitial: `table > thead > tr:not(.blank) > th:nth-child(2),
                          table > tbody > tr:not(.blank) > td:nth-child(2)`,
        cellSelectorNew: `table > thead > tr:not(.blank) > th:nth-child(3),
                      table > tbody > tr:not(.blank) > td:nth-child(3)`,
        getKey: (cell, href, RootDomain) => href.match(new RegExp(RootDomain + '(.*)')).pop(),
        getHref: (cell) => cell.querySelector('a').href,
        extractMagnet: (doc) => doc.querySelector('div.table-responsive a[href^="magnet:"]'),
        hasTitleCopy: false
    }
}

/* ----------------------------
   Common Utilities
----------------------------- */
function FontAwesomeCSS() {
    let css = document.createElement('link')
    css.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css'
    css.rel = 'stylesheet'
    css.type = 'text/css'
    document.head.appendChild(css)
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function updateClipboard(CopyData) {
    try {
        navigator.clipboard.writeText(CopyData)
    } catch {
        GM_setClipboard(CopyData)
    }
}

/* ----------------------------
   Main Script
----------------------------- */
const PageURL = location.href
const RootDomain = extractRootDomain(PageURL)
const config = siteConfigs[RootDomain]

if (!config) return  // not supported site

let JobList = []
let isProcessing = false
const oneDay = 1000 * 60 * 60 * 24
const Now = new Date().toISOString().slice(0, 10)

// cleanup old keys
for (let Key of GM_listValues()) {
    let v = GM_getValue(Key, "")
    if (v.includes("|")) {
        let AddedDay = v.split('|')[1]
        if (((new Date(Now) - new Date(AddedDay)) / oneDay) > 180) GM_deleteValue(Key)
    } else {
        GM_deleteValue(Key)
    }
}



function appendColumn() {
    const tables = document.querySelectorAll(config.tableSelector)
    const title = 'ML'

    tables.forEach((table) => {
        const headersCellsInitial = table.querySelectorAll(config.cellSelectorInitial)
        headersCellsInitial.forEach((cell, index) => {
            cell.insertAdjacentHTML('afterend', (index === 0 ? `<th>${title}</th>` : `<td>${title}</td>`))
        })

        const headersCellsNew = table.querySelectorAll(config.cellSelectorNew)
        headersCellsNew.forEach((cell, index) => {
            if (index === 0) {
                cell.innerHTML = title
            } else {
                let url = config.getHref(headersCellsInitial[index])
                let Key = config.getKey(headersCellsInitial[index], href, RootDomain)
                let Link = GM_getValue(Key, '|').split('|')
                let MagnetLink = Link[0] || ''

                cell.classList.add('dl-buttons')
                cell.innerHTML = `
          ${config.hasTitleCopy ? `<span><i class="GetTitle fa-solid fa-paste" data-key="${Key}"></i></span>` : ""}
          <span><i class="GetMagnet fa-solid fa-magnet ${MagnetLink ? 'visited' : 'not-processed'}" data-key="${Key}" data-url="${url}" href="${MagnetLink ? MagnetLink : '#unprocessed'}" title="ML"></i></span>`

                if (MagnetLink) {                    
                    cell.querySelector('.GetMagnet').style.setProperty('color', 'Orange', 'important')
                }

                if (config.hasTitleCopy) {
                    cell.querySelector('.GetTitle').addEventListener('click', (event) => {
                        updateClipboard(Key.replace(/(\[|\(|\d+p).*/i, '').trim())
                        event.target.style.setProperty('color', 'Orange', 'important')
                    })
                }
            }
        })
    })
}

/* ----------------------------
   Request Handler (fetch → GM_xmlhttpRequest)
----------------------------- */
async function requestPage(tLink) {
    try {
        return await fetch(tLink).then(r => {
            if (!r.ok) throw new Error("fetch failed")
            return r.text()
        })
    } catch {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: tLink,
                responseType: "text",
                onload: (resp) => resp.status === 200 ? resolve(resp.responseText) : reject(resp),
                onerror: reject
            })
        })
    }
}

async function processJob(el) {
    let check = el.classList.contains('not-processed')
    if (!check) return

    let tLink = el.getAttribute('data-url')
    let responseText
    try {
        responseText = await requestPage(tLink)
    } catch (e) {
        console.log("request failed, retry later", e)
        return
    }

    let container = document.implementation.createHTMLDocument().documentElement
    container.innerHTML = responseText
    let retrievedLink = config.extractMagnet(container)

    if (retrievedLink) {
        let Key = el.getAttribute('data-key')
        GM_setValue(Key, retrievedLink + '|' + new Date().toISOString().slice(0, 10))
        el.setAttribute('href', retrievedLink)
        el.classList.add('visited')
        el.classList.remove('not-processed')        
        el.style.setProperty('color', 'Orange', 'important')
        el.removeEventListener('click', GetMagnet)
        el.click()
        JobList = JobList.filter(job => job.el !== el)   // ✅ 정상 응답일 때만 제거
    }
}


const beforeUnloadHandler = (event) => {
    if (JobList.length) {
        event.preventDefault();
        console.log('JobList is not Empty!', JobList.length)
        // Included for legacy support, e.g. Chrome/Edge < 119
        event.returnValue = true;
    }
    else {
        window.removeEventListener("beforeunload", beforeUnloadHandler);
    }
};

window.addEventListener("beforeunload", beforeUnloadHandler)

async function jobWorker() {
    if (isProcessing) return;
    isProcessing = true;

    while (true) {
        // Find the first pending job that hasn't exceeded its retry limit
        const jobIndex = JobList.findIndex(job => job.status === 'pending' && job.retries < 1) || JobList.findIndex(job => job.status === 'failed' && job.retries === 1);

        if (jobIndex === -1) {
            // No more pending jobs to process
            break;
        }

        const job = JobList[jobIndex];
        const el = job.el;

        try {
            await processJob(el);
            job.status = 'completed'; // Mark as completed on success

        } catch (e) {
            console.error("Failed to process job:", e);
            job.retries += 1; // Increment the retry count
            if (job.retries >= 1) {
                job.status = 'failed'; // Mark as failed after one retry
            }
        }

        await sleep(2000); // Wait between requests
    }

    isProcessing = false;
}

function addClickListeners(links) {
    links.forEach((link) => {
        link.addEventListener('click', function GetMagnet(event) {
            event.preventDefault();

            // Check if this element is already a job in the list
            if (!JobList.some(job => job.el === link)) {                
                // Add a new job object to the list
                JobList.push({
                    el: link,
                    status: 'pending',
                    retries: 0
                });

                jobWorker(); // Start the worker
            }
        }, false);
    });
}

async function createColumn() {
    appendColumn()
    addClickListeners(document.querySelectorAll('a.GetMagnet.not-processed'))
}

/* ----------------------------
   Run
----------------------------- */
FontAwesomeCSS()
createColumn()
