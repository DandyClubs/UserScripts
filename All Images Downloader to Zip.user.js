// ==UserScript==
// @name         All Images Downloader to Zip
// @namespace    nature grew
// @version      0.4
// @description  All Images Downloader to Zip
// @author       DandyClubs
// @include      /everia\.club\//
// @include      /ilovexs\.com\//
// @include      /foamgirl\.net\//
// @include      /1909\.me\/.*\.html/
// @include      /girlgirlgo\.org/
// @require      https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js
// @require      https://raw.githubusercontent.com/DandyClubs/RootDomain/main/RootDomain.js
// @require      https://raw.githubusercontent.com/DandyClubs/CopyLinksCommonJS/main/CopyLinksCommonJS.js
// @require      https://cdn.jsdelivr.net/npm/fflate@0.8.2/umd/index.min.js
// @require      https://cdn.jsdelivr.net/npm/streamsaver@2.0.6/StreamSaver.min.js
// @grant		 GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        GM_setClipboard
// @connect      *
// @run-at       document-body
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


.CenterBox {
    right: 50%;
    left: auto;
    top: 5px;    
    max-width: max-content;
    position: fixed !important;
    word-spacing: .5em;
    font-style: initial !important;
    text-align: center;
    color: dodgerblue !important;
    border-radius: .25em !important;
    -webkit-box-sizing: border-box !important;
    box-sizing: border-box !important;
    z-index: 999999;
    padding: 0 .25em;
    margin: 0 .25em;	
	background-color: rgba(0,0,0,0.5) !important;
}

.DownButton {
    text-align: center;
    cursor: pointer;
    padding: .5em;
    margin: .25em;
    background-color:transparent !important;
    z-index: 999999;
}


.ErrorImages {
    font-family: 'Nanum Gothic', 'M PLUS Rounded 1c', 'Noto Sans', sans-serif !important;
    margin-left: auto;
    margin-right: auto;
    border-radius: 4px;
    color: white !important;
    background: rgba(255, 110, 0, 0.75) !important;
    position: fixed !important;
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
    z-index: 999999;
}

.State {
    font-weight: bold;
    text-align: center;
    vertical-align: middle;
    font-family: 'Noto Sans', sans-serif !important;
    padding: .25em !important;
    font-style: italic !important;
    background-color:transparent !important;
    z-index: 999999;
}

.JobState {
    color: White;
    font-weight: bold;
    text-align: center;
    vertical-align: middle;
    padding: 0 .5em 0 0 !important;
    font-family: 'Noto Sans', sans-serif !important;
    z-index: 999999;
}

.ToTop, .AutoDownload {
    cursor: pointer;
    color: LawnGreen !important;
    z-index: 999999;
}

.AutoDownload.On {
    color: LawnGreen !important;
}

.AutoDownload.Off {
    color: LightGrey !important;
    opacity: 0.25;
}

`);

let AutoClose = true
let areadyDownloaded = false
// 전역 또는 UI 이벤트 핸들러가 접근 가능한 위치에 선언
let userAbortController = null;

const PageURL = window.location !== window.parent.location ? document.referrer : document.location.href;
const RootDomain = extractRootDomain(PageURL)

let GetDPI, DefaultFontSize, CneterBoxFontSize, StateFontSize, StateLineHeight, maxLength, minLength


let JobList = []
let ImagesDB = []
let DownloadImagesDB = []
let Title, Author, Images, ZipFileName, ArchivesFileName, Tag
let AddCount = 0
let ErrorImages = []


class JobQueueDB {
    constructor() {
        this.dbName = 'AllImagesJobQueueDB';
        this.storeName = 'AllImagesStore';
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);

            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'url' });
                }
            };

            request.onsuccess = (e) => {
                this.db = e.target.result;
                resolve();
            };

            request.onerror = (e) => reject(e.target.error);
        });
    }

    async addJob(url) {
        return this._tx('readwrite', store => store.put({ url }));
    }

    async removeJob(url) {
        return this._tx('readwrite', store => store.delete(url));
    }

    async getAllJobs() {
        return this._tx('readonly', store => store.getAll());
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


const jobDB = new JobQueueDB();

const bc = new BroadcastChannel('AllImagesChannel');


document.addEventListener("readystatechange", async (event) => {
    if (event.target.readyState === "complete") {
        console.log('All Images Download Zip!')
        FontAwesomeCSS();
        MakeIcon();
        AddDBResetButton()

        await jobDB.init();

        bc.onmessage = (e) => {
            if (e.data === 'refresh-jobs') {
                updateJobUI();
                checkAndStartJob();
            }
        };

        updateJobUI();
        window.addEventListener('storage', (e) => {
            if (e.key === 'AutoDownload') {
                let ev = document.querySelector(".AutoDownload")
                if (!ev) { return }
                if (localStorage.getItem('AutoDownload') == 1) {
                    ev.classList.replace('Off', 'On')
                }
                else {
                    ev.classList.replace('On', 'Off')
                }
            }
        })


        Start().then(Title => {
            if (Title) {
                secondStep(Title)
            }
        });
    }
});


function AddDBResetButton() {
    const btn = document.createElement('button');
    btn.textContent = '🧹 Reset Job DB';
    btn.style = 'position:fixed;bottom:10px;right:10px;z-index:9999;';
    btn.onclick = () => {
        indexedDB.deleteDatabase('AllImagesJobQueueDB');
        alert('JobQueue DB가 삭제되었습니다. 페이지를 새로고침하세요.');
    };
    document.body.appendChild(btn);
}

async function updateJobUI() {
    const jobs = await jobDB.getAllJobs();
    JobList = jobs.map(j => j.url);

    const jobStateEl = document.querySelector('.JobState');
    if (jobStateEl) jobStateEl.textContent = JobList.length;

    const autoBtn = document.querySelector('.AutoDownload');
    if (autoBtn) {
        const isOn = localStorage.getItem('AutoDownload') == '1';
        autoBtn.classList.toggle('On', isOn);
        autoBtn.classList.toggle('Off', !isOn);
    }
}


async function checkAndStartJob() {
    if (!isAutoDownload()) return;

    const jobs = await jobDB.getAllJobs();
    JobList = jobs.map(j => j.url);

    updateJobUI();

    if (JobList.length === 0 || JobList[0] !== PageURL || areadyDownloaded) return;

    try {
        await navigator.locks.request('AllImagesJobLock', { mode: 'exclusive' }, async () => {
            console.log('🚀 Lock 확보 - 다운로드 시작:', PageURL);
            await downloadPhotosWithRetry(ImagesDB);
        });
    } catch (err) {
        console.warn('🔒 Lock 실패 또는 이미 다른 탭에서 실행 중');
    }
}

// JobQueue 변경 발생 시 Broadcast
function broadcastJobChange() {
    bc.postMessage('refresh-jobs');
}

/**
 * Job을 Job Queue에 추가하거나 제거합니다.
 * 실패 시 재시도합니다.
 * @param {string} url - 추가하거나 제거할 Job의 URL
 * @param {'add' | 'remove'} action - 수행할 작업 ('add' 또는 'remove')
 */
async function UpdateJobQueue(url, action) {
    const isAdding = action === 'add';
    const methodName = isAdding ? 'addJob' : 'removeJob';
    const actionName = isAdding ? '추가' : '제거';


    // 자동 다운로드 조건 확인 (탭 1번만)
    const allJobs = await jobDB.getAllJobs();
    JobList = allJobs.map(j => j.url);
    let JobState = document.querySelector('.JobState')
    if (JobState) {
        JobState.innerText = JobList?.length
    }

    if (localStorage.getItem('AutoDownload') == 1) {
        if (localStorage.getItem('AutoDownload') == 1 && JobList[0] === PageURL && !areadyDownloaded) {
            downloadPhotosWithRetry(ImagesDB)
        }
    }

    try {
        // Call the method directly on the jobDB object inside the retry function.
        await retry(() => jobDB[methodName](url));
        broadcastJobChange();
        console.log(`✅ Job ${actionName} 성공: ${url}`);
    } catch (err) {
        console.error(`❌ Job ${actionName} 실패 (재시도 후): ${url}`, err);
        alert(`Job ${actionName}에 최종적으로 실패했습니다. 잠시 후 다시 시도해주세요.`);
    }
}

/**
 * 주어진 함수가 성공할 때까지 최대 횟수만큼 재시도합니다.
 * @param {() => Promise<any>} fn - 재시도할 비동기 함수
 * @param {number} [max=3] - 최대 재시도 횟수
 * @param {number} [delay=500] - 재시도 간의 대기 시간 (ms)
 * @returns {Promise<any>} 함수가 성공하면 결과값을 반환합니다.
 */
async function retry(fn, max = 5, delay = 1000) {
    for (let i = 0; i < max; i++) {
        try {
            return await fn(); // 함수 실행 시도
        } catch (err) {
            if (i === max - 1) {
                // 마지막 시도였다면 에러를 다시 던짐
                throw err;
            }
            console.warn(`Retry attempt ${i + 1} failed:`, err);
            await sleep(delay); // 잠시 대기 후 재시도
        }
    }
}

// === UI 생성 ===
function createProgressUI() {
    if (window.ProgressUI) return;

    const style = document.createElement('style');
    style.textContent = `
    .ProgressWrapper {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(20, 20, 20, 0.85);
      padding: 12px 16px;
      border-radius: 14px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
      color: #fff;
      font-family: system-ui, sans-serif;
      backdrop-filter: blur(6px);
      transition: opacity 0.3s ease, transform 0.3s ease;
    }
    .ProgressMain {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .ProgressBar {
      width: 180px;
      height: 10px;
      background: #444;
      border-radius: 5px;
      overflow: hidden;
    }
    .ProgressFill {
      height: 100%;
      width: 0%;
      background: linear-gradient(90deg, #00e0ff, #00ff95);
      transition: width 0.2s ease-out;
    }
    .ProgressStats {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
    }
    .ProgressActions {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .ProgressActions button {
      all: unset;
      color: #ccc;
      background: #333;
      border-radius: 4px;
      width: 24px;
      height: 24px;
      font-size: 14px;
      text-align: center;
      line-height: 24px;
      cursor: pointer;
      transition: background 0.2s;
    }
    .ProgressActions button:hover {
      background: #555;
      color: #fff;
    }
    .ProgressWrapper[hidden] {
      opacity: 0;
      pointer-events: none;
      transform: translateY(-10px);
    }
  `;
    document.head.appendChild(style);

    const wrapper = document.createElement('div');
    wrapper.className = 'ProgressWrapper';
    wrapper.hidden = true;

    wrapper.innerHTML = `
    <div class="ProgressMain">
      <div class="ProgressBar"><div class="ProgressFill"></div></div>
      <div class="ProgressStats">
        <span class="ProgressText">0%</span>
        <span class="ProgressStatus">0 / 0</span>
        <span class="ProgressErrors">❌ 0</span>
      </div>
    </div>
    <div class="ProgressActions">
      <button class="RetryFailed" title="Retry Failed">↻</button>
      <button class="StopAll" title="Stop All">⏹</button>
    </div>
  `;
    document.body.appendChild(wrapper);

    window.ProgressUI = {
        wrapper,
        fill: wrapper.querySelector('.ProgressFill'),
        percentText: wrapper.querySelector('.ProgressText'),
        statusText: wrapper.querySelector('.ProgressStatus'),
        errorText: wrapper.querySelector('.ProgressErrors'),
        retryBtn: wrapper.querySelector('.RetryFailed'),
        stopBtn: wrapper.querySelector('.StopAll'),
        total: 0,
        done: 0,
        failed: 0,
        visible: false,
        show() {
            this.wrapper.hidden = false;
            this.visible = true;
        },
        hide() {
            this.wrapper.hidden = true;
            this.visible = false;
        },
        reset(totalCount) {
            this.total = totalCount;
            this.done = 0;
            this.failed = 0;
            this.update();
            this.show();
        },
        success() {
            this.done++;
            this.update();
        },
        error() {
            this.failed++;
            this.update();
        },
        update() {
            const percent = this.total ? Math.floor((this.done / this.total) * 100) : 0;
            this.fill.style.width = percent + '%';
            this.percentText.textContent = percent + '%';
            this.statusText.textContent = `${this.done} / ${this.total}`;
            this.errorText.textContent = `❌ ${this.failed}`;
        }
    };

}



// === 사용 함수 ===
function updateProgressUI(done, total) {
    if (!window.ProgressUI) return;
    ProgressUI.done = done;
    ProgressUI.total = total;
    ProgressUI.update();
}

function injectGraphicProgressLayer() {
    if (!window.ProgressUI) createProgressUI();
    ProgressUI.reset(0); // 초기화된 상태
}

function updateStateText(text) {
    if (ProgressUI) ProgressUI.statusText.textContent = text;
}

function showErrorPanel() {
    ProgressUI.errorText.style.color = 'red';
}

// UI 숨기기 함수 예시
function hideProgressUI() {
    const progressWrapper = document.querySelector('.ProgressWrapper');
    if (progressWrapper) {
        progressWrapper.style.display = 'none';
    }
    const errorPanel = document.querySelector('.ErrorPanel'); // 오류 패널도 숨기고 싶으면
    if (errorPanel) {
        errorPanel.style.display = 'none';
    }
}

//window.setImmediate = (fn) => {fn()}

async function Xfetch(url, fetchInit = {}) {
    const defaultFetchInit = { method: "GET" };
    const { headers, method } = { ...defaultFetchInit, ...fetchInit };
    const isStreamSupported = GM_xmlhttpRequest?.RESPONSE_TYPE_STREAM;
    const HEADERS_RECEIVED = 2;

    // Utility to parse raw response headers string into an object
    function parseHeaders(rawHeaders) {
        const headers = {};
        rawHeaders.split(/\r?\n/).forEach(line => {
            const [key, ...vals] = line.split(':');
            if (key) headers[key.trim().toLowerCase()] = vals.join(':').trim();
        });
        return headers;
    }

    if (!isStreamSupported) {
        // Fallback for browsers/userscript engines without streaming support
        return new Promise((resolve, reject) => {
            const blobPromise = new Promise((res, rej) => {
                GM_xmlhttpRequest({
                    url,
                    method,
                    headers,
                    responseType: "blob",
                    onload: (response) => {
                        // Check if response is successful and not an empty file
                        if (response.status === 200 && response.response.byteLength > 0) {
                            res(response.response)
                        } else {
                            rej(new Error(`Status ${response.status} or empty response`));
                        }
                    },
                    onerror: rej,
                    onreadystatechange: onHeadersReceived,
                });
            });

            blobPromise.catch(reject);

            function onHeadersReceived(gmResponse) {
                const { readyState, responseHeaders, status, statusText } = gmResponse;
                if (readyState === HEADERS_RECEIVED) {
                    const hdrs = parseHeaders(responseHeaders);
                    resolve({
                        headers: hdrs,
                        status,
                        statusText,
                        arrayBuffer: () => blobPromise.then(blob => blob.arrayBuffer()),
                        blob: () => blobPromise,
                        json: () => blobPromise.then(blob => blob.text()).then(text => JSON.parse(text)),
                        text: () => blobPromise.then(blob => blob.text()),
                    });
                }
            }
        });
    } else {
        // Streaming supported
        return new Promise((resolve, reject) => {
            const responsePromise = new Promise((res, rej) => {
                GM_xmlhttpRequest({
                    url,
                    method,
                    headers,
                    responseType: "stream",
                    onerror: rej,
                    onreadystatechange: onHeadersReceived,
                });
            });

            responsePromise.catch(reject);

            function onHeadersReceived(gmResponse) {
                const { readyState, responseHeaders, status, statusText, response: readableStream } = gmResponse;
                if (readyState === HEADERS_RECEIVED) {
                    const hdrs = parseHeaders(responseHeaders);
                    let responseInit = { headers: hdrs, status, statusText };

                    // Special case: status 0 might happen in some contexts
                    if (status === 0) {
                        console.warn("status is 0!", { status, statusText });
                        delete responseInit.status;
                        delete responseInit.statusText;
                    }

                    resolve(new Response(readableStream, responseInit));
                }
            }
        });
    }
}



function ImageToBlob(url) {
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: "GET",
            url: url,
            headers: { referer: url, origin: url },
            responseType: 'blob',
            onload: function (resp) {
                const blob = resp.response;

                if (!blob || !blob.type.startsWith("image/")) {
                    console.warn("Received non-image blob for:", url);
                    return reject(new Error("Not an image"));
                }

                const blobUrl = window.URL.createObjectURL(blob);

                // You can decide to store the blob URL here
                UpdateDB(url, blobUrl);

                resolve({ url, blobUrl });
            },
            onerror: function (error) {
                console.error("ImageToBlob failed:", error);
                reject(error);
            }
        });
    });
}

function onElementLoaded(elementToObserve, parentStaticElement) {
    const promise = new Promise((resolve, reject) => {
        try {
            if (document.querySelector(elementToObserve)) {
                console.log(`element already present: ${elementToObserve}`);
                resolve(true);
                //return;
            }
            else {
                const parentElement = parentStaticElement
                    ? document.querySelector(parentStaticElement)
                    : document;

                const Onobserver = new MutationObserver((mutationList, obsrvr) => {
                    const divToCheck = document.querySelector(elementToObserve);

                    if (divToCheck) {
                        console.log(`element loaded: ${elementToObserve}`);
                        Onobserver.disconnect(); // stop observing
                        resolve(true)
                        //return;
                    }
                })


                // start observing for dynamic div
                Onobserver.observe(parentElement, {
                    childList: true,
                    subtree: true,
                })
            }
        } catch (e) {
            console.log(e);
            reject(Error("some issue... promise rejected"));
        }
    });
    return promise;
}

function MakeIcon() {
    GetDPI = window.devicePixelRatio || 1;
    DefaultFontSize = getDefaultFontSize() || 16; // fallback 16px
    console.log('GetDPI:', GetDPI, 'DefaultFontSize:', DefaultFontSize);

    // CenterBox가 이미 존재하면 함수 실행 중단
    if (document.querySelector("div.CenterBox")) {
        return console.warn('CenterBox already exists, skipping MakeIcon()');
    }

    // 모든 요소를 한 번에 생성
    document.body.insertAdjacentHTML('beforeend',
        `
        <div class="CenterBox" style="max-width: max-content; position: fixed;">            
            <i class="ToTop fa-solid fa-circle-chevron-up"></i>
            <i class="State"></i>        
            <div class="ErrorImages" style="display:none;"></div>                       
        </div>
        `
    );
    console.log('MakeIcon() 실행됨')

    // DOM 요소를 한 번만 선택하고 변수에 할당
    const centerBox = document.querySelector(".CenterBox");
    const toTopEl = document.querySelector(".ToTop");
    const stateEl = document.querySelector('.State');

    // ToTop 버튼 클릭 이벤트
    toTopEl.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });

    // 폰트 사이즈 계산
    const baseRem = 16 / DefaultFontSize;
    const scaleFactor = 1 / (GetDPI / 1.5);
    const CenterBoxFontSize = (scaleFactor * baseRem).toFixed(2) + 'rem';
    const StateFontSize = (scaleFactor * 0.65 * baseRem).toFixed(2) + 'rem';
    const StateLineHeight = (scaleFactor * baseRem).toFixed(2) + 'rem';

    // 폰트 사이즈 스타일 적용
    centerBox.style.setProperty('font-size', CenterBoxFontSize, 'important');
    stateEl.style.fontSize = StateFontSize;
    stateEl.style.lineHeight = StateLineHeight;

    // AutoDownload 상태 토글 UI 설정
    const isAutoDownload = localStorage.getItem('AutoDownload') == 1;
    const iconClass = isAutoDownload ? 'On' : 'Off';
    centerBox.insertAdjacentHTML(
        'beforeend',
        `&emsp;<i class="AutoDownload ${iconClass} fa-solid fa-square-check"></i>`
    );

    // JobState indicator
    const jobStateHTML = `&emsp;<i class="JobState" style="font-size: ${StateFontSize};"></i>`;
    centerBox.insertAdjacentHTML('beforeend', jobStateHTML);
    const jobStateEl = document.querySelector('.JobState');

    // JobList 초기화 및 텍스트 설정
    jobStateEl.textContent = JobList.length || 0;


    if (centerBox.offsetLeft > 0) {
        centerBox.style.cssText = `--SetLeft: ${Math.floor(centerBox.offsetLeft - centerBox.offsetHeight * 2.5)}px; font-size: ${CenterBoxFontSize};`;
    }

    // ResizeObserver 설정
    const myObserver = new ResizeObserver(() => {
        if (centerBox.offsetLeft > 0) {
            centerBox.style.cssText = `--SetLeft: ${Math.floor(centerBox.offsetLeft - centerBox.offsetHeight * 2.5)}px; font-size: ${CenterBoxFontSize};`;
        }
    });
    myObserver.observe(centerBox);

    // AutoDownload 토글 클릭 이벤트
    centerBox.addEventListener('click', function (e) {
        if (e.target.classList.contains("AutoDownload")) {
            const isOff = e.target.classList.contains("Off");
            e.target.classList.replace(isOff ? 'Off' : 'On', isOff ? 'On' : 'Off');
            localStorage.setItem('AutoDownload', isOff ? 1 : 0);
        }
    });
}

function GetRequiredElement(selector, label = 'Element') {
    let el = document.querySelector(selector)
    if (!el) {
        console.warn(`${label} Not Found!`)
        return null
    }
    return el
}


async function Start() {
    await jobDB.init();

    window.addEventListener('beforeunload', async () => {
        await UpdateJobQueue(PageURL, 'remove');
    });

    let Title, Images, Author;

    if (/everia\.club/.test(PageURL)) {
        Title = GetRequiredElement("article header.entry-header .single-post-title.entry-title", "Title");
        if (!Title) return console.warn('Title not found for everia.club');
        Images = Array.from(document.querySelectorAll('article > div.entry-content img'));
        Images.forEach(img => UpdateDB(img.getAttribute('data-src') || img.src, ''));
    } else if (/ilovexs\.com/.test(PageURL)) {
        Title = GetRequiredElement("#content.site-content h4.entry-title", "Title");
        if (!Title) return console.warn('Title not found for ilovexs.com');
        Images = Array.from(document.querySelectorAll('#content.site-content .entry-content img'));
        Images.forEach(img => UpdateDB(img.src, ''));
    } else if (/girlgirlgo\.org/.test(PageURL)) {
        await onElementLoaded('article div.post-body h1.post-title.entry-title');
        Title = GetRequiredElement("article div.post-body h1.post-title.entry-title", "Title");
        if (!Title) return console.warn('Title not found for girlgirlgo.org');
        Author = document.querySelector('article div.post-body div.post-meta-top.entry-meta div.post-author strong.author.vcard a.on-popunder');
        Images = Array.from(document.querySelectorAll('article div.post-body div.post-media-body img'));
        Images.forEach(img => UpdateDB(img.getAttribute('data-src')));
        if (/girlgirlgo\.org\/random/.test(PageURL)) return console.log('Random images - no processing');
    } else if (/foamgirl\.net\/\d+\.html/.test(PageURL)) {
        Title = GetRequiredElement(".single_mianimage .item_title h1", "Title");
        if (!Title) return console.warn('Title not found for foamgirl.net');
        Images = Array.from(document.querySelectorAll('.single_mianimage #content img'));
        Images.forEach(img => UpdateDB(img.src, ''));

        const navRight = document.querySelector('.mbx-nav-right');
        const maxPage = Number(navRight?.innerText.replace(/^.*[\\/]/, '')) || 1;
        const baseUrl = PageURL.replace(/\.html$/, '');

        for (let i = 2; i <= maxPage; i++) {
            try {
                console.log('Max Page:', maxPage, 'Base URL:', baseUrl);
                await NextPage(`${baseUrl}_${i}.html`);
                navRight.innerText = `Page Load ${i}/${maxPage}`;
            } catch (e) {
                console.error('Failed loading page', i, e);
                break;
            }
        }
    }

    if ((!/\/page/.test(PageURL) && /\/(\d+|id-.+)\.html/.test(PageURL)) ||
        /everia\.club\/\d+/.test(PageURL) ||
        /girlgirlgo\.org\/a\/.+/.test(PageURL)) {
        await UpdateJobQueue(PageURL, 'add');
    }

    if (!Title) return console.warn('Title not found');
    document.querySelector('.CenterBox').insertAdjacentHTML('afterbegin', '<i class="DownButton fas fa-download"></i>');
    return Title
}


async function secondStep(Title) {

    document.querySelector('.CenterBox').style.visibility = 'visible';

    Title = Title.textContent.trim();
    Title = Title.endsWith(`(${ImagesDB.length}P)`) ? Title : `${Title}(${ImagesDB.length}P)`;
    ZipFileName = byteLengthOf(FilenameConvert(Author ? `[${Author.innerText.trim()}] ${Title}` : Title), 240);
    if (!ZipFileName) {
        await UpdateJobQueue(PageURL, 'remove')
        throw new Error('ZipFileName is empty')
    }

    const nameLengths = ImagesDB.filter(e => getExtensionOfFilename(e.U) !== '.webp').map(x => GetFileName(x.U).length);
    maxLength = Math.max(...nameLengths);
    minLength = Math.min(...nameLengths);

    console.log('ZipFileName:', ZipFileName, '\nnameLengths:', nameLengths, '\nmaxLength:', maxLength, '\nminLength:', minLength);

    const allJobs = await jobDB.getAllJobs();
    JobList = allJobs.map(j => j.url);
    checkAndStartJob();

    document.querySelector('.DownButton').addEventListener('click', e => {
        e.preventDefault();
        navigator.locks.request('AllImagesJobLock', { mode: 'exclusive' }, async () => {
            await downloadPhotosWithRetry(ImagesDB);
        });
    });

    // ✅ 여기서도 lock을 얻은 탭만 자동 시작하도록
    console
    if (isAutoDownload() && JobList[0] === PageURL && !areadyDownloaded) {
        try {
            await navigator.locks.request('AllImagesJobLock', { mode: 'exclusive' }, async () => {
                await downloadPhotosWithRetry(ImagesDB);
            });
        } catch (e) {
            console.log("다른 탭이 다운로드 중이거나 Lock 실패");
        }
    }


    await onElementLoaded('.StopAll').then(() => {
        console.log('StopAll 버튼이 로드되었습니다.');

        document.querySelector('.StopAll').addEventListener('click', () => {
            navigator.locks.request('AllImagesJobLock', { mode: 'exclusive' }, () => {

            });
            if (userAbortController) {
                console.log("⏹ 다운로드 중지 요청");
                userAbortController.abort();
            }
        });

        document.querySelector('.RetryFailed').addEventListener('click', () => {
            navigator.locks.request('AllImagesJobLock', { mode: 'exclusive' }, () => {
                if (ErrorImages.length > 0) {
                    console.log("🔄 실패한 이미지 재시도");
                    downloadPhotosWithRetry(ImagesDB)
                } else {
                    console.log("❌ 재시도할 실패 이미지 없음");
                }
            });
        });
    })
}



// Helper functions used in Start()
function isAutoDownload() {
    return localStorage.getItem('AutoDownload') == 1;
}

/*
function showCopyNotice(text) {
    const notice = document.querySelector('.CopyNotice');
    const box = document.querySelector('.CenterBox');
    if (!notice || !box) return;

    notice.textContent = text;

    const baseFontSize = typeof getDefaultFontSize === 'function' ? getDefaultFontSize() : 16;
    const scale = 0.6;
    const dpi = window.devicePixelRatio || 1;

    $('.CopyNotice')
        .stop(true, true)
        .css({
            fontSize: `${((1 / (dpi / 1.5)) * scale * (16 / baseFontSize)).toFixed(2)}rem`,
            top: box.offsetTop + box.offsetHeight * 1.2,
            left: window.innerWidth / 2 - box.offsetWidth,
            display: 'none' // ensure toggle works as expected
        })
        .fadeIn(200)
        .delay(1000)
        .fadeOut(400);
}
*/

function byteLengthOf(TitleText, maxByte) {
    console.log(TitleText, maxByte)
    let result = '';
    let lineByte = 0;

    for (let i = 0, l = TitleText.length; i < l; i++) {
        const code = TitleText.charCodeAt(i);
        let charByte = 0;

        if (code < 0x0080) {
            charByte = 1;
        } else if (code < 0x0800) {
            charByte = 2;
        } else if (code < 0xD800) {
            charByte = 3;
        } else if (code < 0xDC00) {
            const lo = TitleText.charCodeAt(i + 1);
            if (i + 1 < l && lo >= 0xDC00 && lo <= 0xDFFF) {
                charByte = 4;
                i++; // skip surrogate pair
            } else {
                throw new Error("UCS-2 String malformed");
            }
        } else if (code < 0xE000) {
            throw new Error("UCS-2 String malformed");
        } else {
            charByte = 3;
        }

        if (lineByte + charByte >= maxByte) {
            const truncated = TitleText.slice(0, i).replace(/(、|,)$/, '').trim();
            return truncated + '…';
        }

        lineByte += charByte;
    }

    return TitleText;
}


function GetFileName(url) {
    let name = url.split('/').pop()?.replace('.html', '')
    return name.substring(0, name.lastIndexOf('.'))
}

const downloadedFiles = new Set();




function activityTimeoutSignal(ms) {
    const controller = new AbortController();
    let timeoutId = null;

    // 타임아웃을 설정/재설정하는 함수
    const resetTimeout = () => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => controller.abort(), ms);
    };

    // 타임아웃을 즉시 시작
    resetTimeout();

    // fetch가 진행될 때마다 타임아웃을 재설정하는 기능 추가
    // 이 부분은 fetch의 'signal'이 아닌, 다운로드 루프 내에서 처리해야 합니다.
    // 여기서는 컨트롤러 객체에 이 함수를 추가하여 외부에서 호출할 수 있도록 합니다.
    controller.resetTimeout = resetTimeout;

    // 다운로드가 완료되거나 취소되면 타임아웃을 정리하는 함수
    controller.clearTimeout = () => {
        if (timeoutId) clearTimeout(timeoutId);
    };

    return controller;
}


async function downloadPhotosWithRetry(ImagesDB) {
    // 다운로드 시작 시 새로운 AbortController 생성
    userAbortController = new AbortController();
    areadyDownloaded = true;
    const { signal: userSignal } = userAbortController;
    const maxRetries = 3;
    let errorList = [];
    const DB = await generateZIP(ImagesDB)
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        console.log(`[Attempt ${attempt}] 시작`);
        if (userSignal.aborted) {
            console.log("🚫 다운로드가 사용자 요청에 의해 중단되었습니다.");
            break;
        }

        try {
            // downloadPhotosAttempt에 사용자 취소 신호 전달
            const result = await downloadPhotosAttempt(DB, userSignal, attempt > 1);
            errorList = result.failed;

            if (errorList.length === 0) break;

            console.warn(`[Attempt ${attempt}] 실패 항목 ${errorList.length}개, 재시도 준비`);


        } catch (fatalErr) {
            if (fatalErr.name === 'AbortError') {
                console.log("🚫 다운로드가 사용자 요청 또는 타임아웃으로 취소되었습니다.");
                updateStateText("🚫 다운로드 취소됨");
            } else {
                console.error("⛔ 치명적 오류:", fatalErr);
                AutoClose = false
            }
            // IndexedDB 임시 데이터 제거 (streamSaver 버퍼 제거)
            /*
            if (typeof cleanupStreamSaverTempFiles === 'function') {
                await cleanupStreamSaverTempFiles();
            }
            */
            break;
        }
    }

    // 다운로드 종료 후 AbortController 초기화
    userAbortController = null;

    if (errorList.length) {
        updateStateText(`❌ 최종 실패 ${errorList.length} 항목`);
        showErrorPanel(errorList);
        AutoClose = false
        areadyDownloaded = false
    } else if (userSignal.aborted) {
        UpdateJobQueue(PageURL, 'remove'); // ✅ JobQueue에서 제거
        await sleep(5000);
        UpdateJobQueue(PageURL, 'add'); // ✅ JobQueue에 다시 추가
        areadyDownloaded = false
    } else {
        updateStateText(`✅ 전체 성공`);
        UpdateJobQueue(PageURL, 'remove'); // ✅ JobQueue에서 제거
        areadyDownloaded = true
        await sleep(2500)
        hideProgressUI()
        await sleep(2500)
        if (localStorage.getItem('AutoDownload') == "1" && AutoClose) {
            self.close();
        }
    }
}


async function downloadPhotosAttempt(DB, userSignal, isRetry = false) {
    injectGraphicProgressLayer();
    let failed = [];
    const zip = new fflate.Zip();
    let addCount = 0;
    // streamSaver에도 사용자 취소 신호 전달
    const fileStream = streamSaver.createWriteStream(ArchivesFileName, { signal: userSignal });

    const rs = new ReadableStream({
        start(controller) {
            zip.ondata = (err, chunk, final) => {
                if (err) return controller.error(err);
                controller.enqueue(chunk);
                if (final) controller.close();
            };
        }
    });

    const pipePromise = rs.pipeTo(fileStream).catch(err => {
        if (err.name !== 'AbortError') {
            console.error("❌ 저장 스트림 오류", err);
        }
        throw err;
    });

    for (const meta of DB) {

        // 루프 시작 시 사용자 취소 신호 확인
        if (userSignal.aborted) {
            zip.terminate();
            break;
        }
        if (downloadedFiles.has(meta.F)) continue;

        // 개별 다운로드에 대한 타임아웃 컨트롤러 생성 (30초로 설정)
        const activityController = activityTimeoutSignal(30000);

        try {
            // 사용자 취소 신호와 활동 감지 타임아웃 신호를 결합
            const combinedSignal = AbortSignal.any([userSignal, activityController.signal]);


            const useRoot = extractRootDomain(meta.P) === RootDomain;
            const response = useRoot
                ? await fetch(meta.P, { signal: combinedSignal })
                : await Xfetch(meta.P, { signal: combinedSignal });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const file = new fflate.ZipPassThrough(`${ArchivesFileName}/${meta.F}`);
            zip.add(file);
            downloadedFiles.add(meta.F);

            const reader = response.body.getReader();
            while (true) {
                // 데이터를 읽을 때마다 활동 타임아웃을 재설정
                const { value, done } = await reader.read();
                if (done) break;

                // 데이터 수신 시 타임아웃 재설정
                activityController.resetTimeout();
                file.push(value);
            }
            file.push(new Uint8Array(0), true);

            // 다운로드 완료 시 타임아웃 정리
            activityController.clearTimeout();

            addCount++;
            updateProgressUI(addCount, DB.length);
        } catch (err) {
            if (err.name === 'AbortError') {
                zip.terminate();
                throw err;
            }
            console.warn(`[실패] ${meta.P}`, err);
            failed.push(meta);
            updateProgressUI(addCount, DB.length);
        }
    }

    if (userSignal.aborted || failed.length) {
        zip.terminate(); // 불완전 ZIP 종료
    } else {
        zip.end(); // 완전한 종료
    }

    await pipePromise; // 스트림 저장 완료 대기

    return { failed };
}

async function cleanupStreamSaverTempFiles() {
    // IndexedDB에서 streamSaver 저장소 제거
    try {
        const req = indexedDB.deleteDatabase('streamsaver');
        req.onsuccess = () => console.log("🧹 streamSaver 임시 파일 제거 완료");
        req.onerror = () => console.warn("⚠️ 임시 파일 제거 실패 (무시 가능)");
    } catch (e) {
        console.warn("streamSaver cleanup error:", e);
    }
}

function NextPage(url) {
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: "GET",
            url: url,
            headers: {
                Referer: document.location.href,
                Origin: new URL(url).origin
            },
            onload: function (resp) {
                const html = document.createElement('html')
                html.innerHTML = resp.responseText

                const container = html.querySelector("div.single_mianimage div.content div#content div#image_div.image_div")
                if (!container) {
                    console.warn(`[NextPage] No image container found on ${url}`)
                    return resolve(html)
                }

                const images = [...container.querySelectorAll('img')]
                images.forEach(entry => {
                    UpdateDB(entry.src, '')
                })

                resolve(html)
            },
            onerror: function (error) {
                console.error(`[NextPage] Failed to load ${url}:`, error)
                reject(error)
            }
        })
    })
}


function GetUrl(url) {
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: "GET",
            url: url,
            headers: {
                Referer: document.location.href,
                Origin: new URL(url).origin
            },
            onload: function (resp) {
                try {
                    const html = document.createElement('html')
                    html.innerHTML = resp.responseText
                    const container = html.querySelector("div._download")
                    const anchor = container?.querySelector('a[href*="http"]')
                    if (anchor) {
                        resolve(anchor.href)
                    } else {
                        reject(new Error("No download link found in response."))
                    }
                } catch (err) {
                    reject(err)
                }
            },
            onerror: function (error) {
                reject(error)
            }
        })
    })
}



function CheckOnline(url) {
    return new Promise((resolve) => {
        GM_xmlhttpRequest({
            method: "GET",
            url: url,
            onload: function (resp) {
                console.log(`[CheckOnline] ${url} -> Status: ${resp.status}`)
                resolve(resp.status >= 200 && resp.status < 400) // success range
            },
            onerror: function (error) {
                console.warn(`[CheckOnline] Error fetching ${url}:`, error)
                resolve(false)
            }
        })
    })
}



function UpdateDB(Target, DownloadUrl) {
    let searchDB = ImagesDB.find(({ U }) => U === Target)
    if (searchDB) {
        searchDB.T = DownloadUrl
    }
    else {
        ImagesDB.push({ U: Target, T: DownloadUrl })
    }
    //console.log(ImagesDB)
    return ImagesDB
}



async function mergeZips(sources) {
    const zip = new JSZip()
    try {
        await readSources(sources, zip)
        return zip
    } catch (err) {
        console.error("Failed to merge ZIPs:", err)
        throw err
    }
}


// generate an array of promises for each zip we're reading in and combine them
// into a single promise with Promise.all()
function readSources(files, zip) {
    return Promise.allSettled(
        files.map(function (file) {
            return readSource(file, zip);
        })
    );
}

function readSource(file, zip) {
    return new Promise((resolve, reject) => {
        JSZipUtils.getBinaryContent(file.P, (err, data) => {
            if (err) {
                console.warn(`Failed to load: ${file.P}`, err)
                if (typeof ErrorImages !== 'undefined') {
                    ErrorImages.push(file.P)
                }
                return reject(err) // no need to throw
            }

            if (typeof AddCount !== 'undefined') {
                AddCount++
                if (document.querySelector('.State')) {
                    document.querySelector('.State').innerText = ` ${AddCount}/${ImagesDB?.length ?? '?'}`
                }
            }

            try {
                zip.file(file.F, data, { binary: true })
                resolve()
            } catch (zipErr) {
                console.error(`Failed to add to zip: ${file.F}`, zipErr)
                reject(zipErr)
            }
        })
    })
}



async function generateZIP(DB) {
    console.log('Download to Zip')

    const DownloadImagesDB = []
    ArchivesFileName = ZipFileName + ".zip"

    let CutPoint
    const Deff = GetFileName(DB[DB.length - 1].U).length - GetFileName(DB[0].U).length

    await Promise.allSettled(DB.map(async (el, i) => {
        let filename = ''
        let Extension = getExtensionOfFilename(el.U) || '.jpg'
        let indexNumber = (i + 1).toString().padStart(3, '0')

        let base = GetFileName(el.U)

        if (/blogger\.googleusercontent\.com/.test(el.U)) {
            filename = `${ZipFileName} ${indexNumber}.jpg`
        } else if (/cdn\.foamgirl\.net/.test(el.U)) {
            if (minLength !== maxLength && !CutPoint) {
                const FindLast = DB.findLast(t => GetFileName(t.U).length === minLength)
                const FindCompare = DB.find(t => GetFileName(t.U).length === maxLength)
                const findLast = GetFileName(FindLast.U)
                const compare = GetFileName(FindCompare.U)
                for (let j = 0; j < maxLength; j++) {
                    if (findLast.charCodeAt(j) !== compare.charCodeAt(j)) {
                        CutPoint = j
                        break
                    }
                }
            }
            if (CutPoint) {
                const prefix = base.substring(0, CutPoint)
                const padded = base.substring(CutPoint).padStart(maxLength - CutPoint + (Deff - 1), '0')
                filename = `${prefix}${padded}${Extension}`
            } else {
                filename = `${base}${Extension}`
            }

        } else if (/%/.test(base) || /girlgirlgo\.org/.test(el.U)) {
            filename = `${ZipFileName.replace(/\(\d+P\)$/, '')}-${indexNumber}${Extension}`
        } else if (/_/.test(base)) {
            const last = base.lastIndexOf('_') + 1
            const padded = base.substring(last).padStart(maxLength - last + 1, '0')
            filename = `${base.substring(0, last).replace('_', ' ')}${padded}${Extension}`
        } else {
            filename = base.padStart(maxLength, '0') + Extension
        }

        DownloadImagesDB.push({ P: el.U, F: filename })
    }))

    return DownloadImagesDB
}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getExtensionOfFilename(filename) {
    const lastDot = filename.lastIndexOf('.');
    return lastDot !== -1 ? filename.slice(lastDot).toLowerCase() : '';
}


