// ==UserScript==
// @name        Torrent Sites - add magnet links
// @namespace   DandyClubs
// @version     2025.08.21
// @description Adds a column with magnet links in lists (multi-site support)
// @author      DandyClubs
// @license     MIT
// @include     https://xxxclub.to/torrents/*
// @include     https://therarbg.com/get-posts/*
// @grant       GM_addStyle
// @grant       GM_setClipboard
// @grant       GM_xmlhttpRequest
// @run-at      document-body
// @require     https://raw.githubusercontent.com/DandyClubs/RootDomain/main/RootDomain.js
// ==/UserScript==


const therarbgStyle = `

	main.container, div.container {
		max-width: 1600px;		
	}

    .container, .container-lg, .container-md, .container-sm, .container-xl, .container-xxl {
	    max-width: 1600px;
    }
	.GetMagnet {
		font-size: 13px;
		color: dodgerblue !important;
	}
    .visited {
        color: Orange !important;
    }
	table td.dl-buttons {
		padding-left: 2.5px;
		padding-right: 2.5px;
		text-align: center !important;
		position: relative;
		display: table-cell !important; /* proper height of cell on multiple row torrent name */
		width: 3%;
	}

	td.dl-buttons > a,
	td.dl-buttons > a:hover,	
	td.dl-buttons > a:link,
	td.dl-buttons > a:active {
		color: inherit;
		text-decoration: none;
		cursor: pointer;
		display: inline-block !important;
		/* margin: 0 1.5px; */
		margin: 0 2px;
	}

	table > thead > tr > th:nth-child(3),
	table > thead > tr > td:nth-child(3) {
		text-align: center;
	}

`;


const xxxclubStyle = `

	main.container, div.container {
		max-width: 1600px;
	}

    .container, .container-lg, .container-md, .container-sm, .container-xl, .container-xxl {
	    max-width: 1600px;
    }
	.GetMagnet, .GetTitle {
		font-size: 13px;
		color: dodgerblue !important;
        cursor: pointer;
	}
    .visited {
        color: Orange !important;
    }

	ul > li > span:nth-child(3) {
		text-align: center;
	}

`;



/* ----------------------------
   Site Configurations
----------------------------- */
const siteConfigs = {
    "xxxclub.to": {
        tableSelector: "div.browsetableinside",
        cellSelectorInitial: "ul > li > span:nth-child(2)",
        cellSelectorNew: "ul > li > span:nth-child(3)",
        insertHeadersCellsInitial: (cell, index, title) => cell.insertAdjacentHTML('afterend', (index === 0 ? `<span>${title}</span>` : `<span>${title}</span>`)),
        getKey: (cell) => cell.querySelector('a[href*="/torrents/details/"]').textContent,
        getHref: (cell) => cell.querySelector('a[href*="/torrents/details/"]').href,
        extractMagnet: (doc) => doc.querySelector('div.detailsdescr ul li.downloadboxlist span a.mg-link[href^="magnet:"]'),
        hasTitleCopy: true,
        style: xxxclubStyle,
    },
    "therarbg.com": {
        tableSelector: "div.row.p-1",
        cellSelectorInitial: `table > thead > tr:not(.blank) > th:nth-child(2),
                          table > tbody > tr:not(.blank) > td:nth-child(2)`,
        cellSelectorNew: `table > thead > tr:not(.blank) > th:nth-child(3),
                      table > tbody > tr:not(.blank) > td:nth-child(3)`,
        insertHeadersCellsInitial : (cell, index, title) => cell.insertAdjacentHTML('afterend', (index === 0 ? `<th>${title}</th>` : `<td>${title}</td>`)),
        getKey: (cell, href, RootDomain) => href.match(new RegExp(RootDomain + '(.*)')).pop(),
        getHref: (cell) => cell.querySelector('a').href,
        extractMagnet: (doc) => doc.querySelector('div.table-responsive a[href^="magnet:"]'),
        hasTitleCopy: false,
        style: therarbgStyle,
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


function AddStyles(CSS, ID) {
    let styleSheet = document.createElement("style")
    styleSheet.textContent = CSS
    styleSheet.id = ID
    document.head.appendChild(styleSheet)
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
let isProcessing = false;


function setClearList(name, value) {
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


const cookieCheck = getCookie("ClearList");
if (!cookieCheck || cookieCheck !== "Y") {    
    // cleanup old keys
    const oneDay = 1000 * 60 * 60 * 24
    const Now = new Date().toISOString().slice(0, 10)
    for (const [Key] of Object.entries(localStorage)) {        
        const AddedDay = JSON.parse(localStorage.getItem(Key)).D
        if (((new Date(Now) - new Date(AddedDay)) / oneDay) > 180) {
            localStorage.removeItem(Key)
        }
        let data = JSON.parse(localStorage.getItem(Key));
        if (data?.M && typeof data.M === "object" && Object.keys(data.M).length === 0) {
            localStorage.removeItem(Key);
        }
    }
    setClearList("ClearList", "Y");
}


function appendColumn() {
    const tables = document.querySelectorAll(config.tableSelector)
    const title = 'ML'

    tables.forEach((table) => {
        const headersCellsInitial = table.querySelectorAll(config.cellSelectorInitial)
        headersCellsInitial.forEach((cell, index) => {
            config.insertHeadersCellsInitial(cell, index, title)
        })

        const headersCellsNew = table.querySelectorAll(config.cellSelectorNew)
        headersCellsNew.forEach((cell, index) => {
            cell.classList.add('hideCell');
            if (index === 0) {
                cell.innerHTML = title
            } else {
                let url = config.getHref(headersCellsInitial[index])
                let Key = config.getKey(headersCellsInitial[index], url, RootDomain)
                let MagnetLink = JSON.parse(localStorage.getItem(Key))?.M || ''                            

                cell.classList.add('dl-buttons')
                cell.innerHTML = `
          ${config.hasTitleCopy ? `<span><i class="GetTitle fa-solid fa-paste" data-key="${Key}"></i></span>` : ""}
          <span><a class="GetMagnet fa-solid fa-magnet ${MagnetLink ? 'visited' : 'not-processed'}" data-key="${Key}" data-url="${url}" href="${MagnetLink ? MagnetLink : '#unprocessed'}" title="ML"></a></span>`

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
    let retrievedLink = config.extractMagnet(container)?.href;

    if (retrievedLink) {
        let Key = el.getAttribute('data-key')    
        if (retrievedLink && typeof retrievedLink === "string" && retrievedLink.trim()) {
            localStorage.setItem(Key, JSON.stringify({
                M: retrievedLink,
                D: new Date().toISOString().slice(0, 10)
            }));
        }         
        el.setAttribute('href', retrievedLink)
        el.classList.add('visited')
        el.classList.remove('not-processed')        
        el.style.setProperty('color', 'Orange', 'important')
        el.removeEventListener('click', GetMagnet, false);
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
        const jobIndex = JobList.findIndex(job => job.status === 'pending' && job.retries < 1)
        const failedJobIndex = JobList.findIndex(job => job.status === 'failed' && job.retries === 1);

        if (jobIndex === -1 && failedJobIndex === -1) {
            // No more pending jobs to process
            isProcessing = false;
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


function GetMagnet(event) {
    event.preventDefault();
    const link = this; // 'this' refers to the element the listener is on.
    if (!JobList.some(job => job.el === link)) {
        // Add a new job object to the list
        JobList.push({
            el: link,
            status: 'pending',
            retries: 0
        });

        jobWorker(); // Start the worker
    }
}


function addClickListeners(links) {
    links.forEach((link) => {
        link.addEventListener('click', GetMagnet, false)     
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
AddStyles(config.style, config.style)
createColumn()

