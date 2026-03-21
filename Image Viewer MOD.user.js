// ==UserScript==
// @name         Image Viewer MOD (Refactored)
// @version      2026.03.12
// @description  View full image without leaving the page or on a new tab without ads
// @namespace    https://github.com/nikolay-borzov
// @author       nikolay-borzov
// @license      MIT
// @icon         https://raw.githubusercontent.com/nikolay-borzov/user-scripts/master/image-viewer/icon.png
// @homepageURL  https://github.com/nikolay-borzov/user-scripts
// @homepage     https://github.com/nikolay-borzov/user-scripts
// @supportURL   https://github.com/nikolay-borzov/user-scripts/issues
// @match        https://*/*
// @match        http://*/*
// @exclude      https://www.google.com/search*
// @exclude      https://challenges.cloudflare.com/*
// @connect      *
// @run-at       document-start
// @grant        GM_xmlhttpRequest
// @grant        GM_openInTab
// @grant		 GM_addStyle
// @grant        GM_getResourceText
// @require      https://cdnjs.cloudflare.com/ajax/libs/viewerjs/1.11.7/viewer.min.js
// @require      https://raw.githubusercontent.com/DandyClubs/RootDomain/main/RootDomain.js
// @noframes
// ==/UserScript==




//================================================================================
// 1. 통합된 사이트 모듈 정의 (Single Source of Truth)
//================================================================================
const siteModules = [
    {
        id: 'i14xpicsspace',
        name: '14xpics.space',
        enabled: true,
        linkRegExp: /14xpics\.space\/image/,
        async getURL(link) { return link.thumbnailURL.replace('.th.', '.'); },
    },
    {
        id: '22pixx',
        name: '22pixx.xyz',
        enabled: true,
        linkRegExp: /22pixx\.xyz\/images\/.*\.html/,
        async getURL(link) { return link.thumbnailURL.replace(/\/os\//, '/o/'); },
    },
    {
        id: '37xpics',
        name: '37xpics.space',
        enabled: true,
        linkRegExp: /37xpics\.space\/image/,
        async getURL(link) { return link.thumbnailURL.replace('.th.', '.'); },
    },
    {
        id: '3xplanetimg',
        name: '3xplanetimg.com',
        enabled: true,
        linkRegExp: /3xplanet\.net\/viewimage\/.*\.html/,
        async getURL(link) { return link.thumbnailURL.replace(/\/s200\//, '/s0/'); },
    },
    {
        id: 'adult-images',
        name: 'Adult-Images.ru',
        enabled: true,
        linkRegExp: /\/(adult-images|money-pic)\.ru/,
        async getURL(link) { return link.thumbnailURL.replace('-thumb', ''); },
    },
    {
        id: 'clubwarp',
        name: 'clubwarp.com',
        enabled: true,
        linkRegExp: /i\.clubwarp\.com\/image/,
        getURL(link) { return link.thumbnailURL.replace('.th.', '.md.'); },
    },
    {
        id: 'crazyimg',
        name: 'crazyimg.com',
        enabled: true,
        linkRegExp: /crazyimg\.com\/images/,
        getURL(link) { return link.thumbnailURL.replace('_tn', ''); },
    },
    {
        id: 'dmm',
        name: 'dmm.co.jp',
        enabled: true,
        linkRegExp: /pics\.dmm\.co\.jp\/.+\.jpg/,
        getURL(link) { return link.url; },
    },
    {
        id: 'fastpic',
        name: 'FastPic',
        enabled: true,
        linkRegExp: /fastpic\.(?:ru|org)\/view/,
        imageURLRegExp: /src="(?<url>http[^"]+)" class="image img-fluid"/,
        getURL: (link, extractor) => { // 익명 함수로 변경
            const headers = {
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                "User-Agent": navigator.userAgent,
            };
            return getURLFromPage(link, extractor, { headers }); // headers 객체를 requestDetails에 추가
        },
    },
    {
        id: 'fastpicDirect',
        name: 'FastPic (direct link)',
        enabled: true,
        linkRegExp: /fastpic\.(?:ru|org)\/big/,
        imageURLRegExp: /src="(?<url>http[^"]+)" class="image img-fluid"/,
        async getURL(link) {
            const URL_PARTS_REGEXP = /i(\d+).+\.(ru|org)\/big(\/\d+\/\d+\/).+\/([^\/]+)$/;
            const [, index, domain, date, filename] = URL_PARTS_REGEXP.exec(link.url) || [];
            const url = `https://fastpic.${domain}/view/${index}${date}${filename}.html`;
            return getURLFromPage({ ...link, url }, this);
        },
    },
    {
        id: 'filesor',
        name: 'filesor / pimpandhost',
        enabled: true,
        linkRegExp: /pimpandhost\.com\/image/,
        async getURL(link) { return link.thumbnailURL.replace(/_(l|m|s)\./, '.'); },
    },
    {
        id: 'imagebam',
        name: 'ImageBam',
        enabled: true,
        linkRegExp: /www\.imagebam\.com\//,
        imageURLRegExp: /src="(?<url>[^"]+)".+class="main-image/,
        async getURL(link, extractor) { return getURLFromPage(link, extractor, { cookie: 'nsfw_inter=1' }); },
    },
    {
        id: 'imagebamview',
        name: 'ImageBamView',
        enabled: true,
        linkRegExp: /images\d\.imagebam\.com\//,
        getURL(link) { return link.url; },
    },
    {
        id: 'imageban',
        name: 'ImageBan.ru',
        enabled: true,
        linkRegExp: /imageban\.ru\/show/,
        async getURL(link) {
            const DATE_PATTERN = /(\d{4})\.(\d{2})\.(\d{2})/;
            return link.thumbnailURL.replace('thumbs', 'out').replace(DATE_PATTERN, '$1/$2/$3');
        },
    },
    {
        id: 'imagebanDirect',
        name: 'ImageBan.ru (direct link)',
        enabled: true,
        linkRegExp: /imageban\.ru\/out/,
        async getURL(link) { return link.url; },
    },
    {
        id: 'imagecurl',
        name: 'imagecurl.com',
        enabled: true,
        linkRegExp: /imagecurl\.com\/viewer\.php\?file/,
        async getURL(link) {
            const [, root, domain, filename, ext] = /(https?:\/\/).*(imagecurl\.com\/images\/)(.*)_thumb(\.jpg)/.exec(link.thumbnailURL) || [];
            return `${root}cdn.${domain}${filename}${ext}`;
        },
    },
    {
        id: 'imagehaha',
        name: 'imagehaha.com',
        enabled: true,
        linkRegExp: /imagehaha\.com\//,
        imageURLRegExp: /<img src="(?<url>[^"]*)/im,
        viewMode: 'origin-download',
        getURL: getURLFromPage,
    },
    {
        id: 'imagetwist',
        name: 'ImageTwist',
        enabled: true,
        linkRegExp: /imagetwist\.com/,
        viewMode: 'origin-download',
        async getURL(link) {
            const imageName = link.url.split('/').pop()?.replace('.html', '');
            const imageExtension = imageName?.split('.').pop()?.replace(/&.*/, '') ?? '';
            const thumbnailExtension = link.thumbnailURL.split('.').pop() ?? '';
            const imageUrl = link.thumbnailURL.replace('/th/', '/i/').slice(0, -thumbnailExtension.length);
            return `${imageUrl}${imageExtension}/${imageName}`;
        },
    },
    {
        id: 'imagetwistBased',
        name: 'ImageTwist based (legacy)',
        hosts: ['Picturelol.com', 'PicShick.com', 'Imageshimage.com'],
        enabled: true,
        linkRegExp: /(picturelol|picshick|imageshimage)\.com/,
        viewMode: 'origin-download',
        async getURL(link) {
            const HOST_REPLACE_REG_EXP = /(picturelol|picshick|imageshimage)/;
            const imageName = link.url.split('/').pop();
            const imageExtension = imageName?.split('.').pop()?.replace(/&.*/, '') ?? '';
            const thumbnailExtension = link.thumbnailURL.split('.').pop() ?? '';
            const imageUrl = link.thumbnailURL.replace('/th/', '/i/').slice(0, -thumbnailExtension.length).replace(HOST_REPLACE_REG_EXP, 'imagetwist');
            return `${imageUrl}${imageExtension}/${imageName}`;
        },
    },
    {
        id: 'imagevenue',
        name: 'ImageVenue.com',
        enabled: true,
        linkRegExp: /imagevenue\.com\//,
        imageURLRegExp: /<img src="(?<url>[^"]*).*id="main-image/im,
        getURL: getURLFromPage,
    },
    {
        id: 'imgadult',
        name: 'ImgAdult',
        enabled: true,
        linkRegExp: /imgadult\.com/,
        async getURL(link) { return link.thumbnailURL.replace('/small/', '/big/'); },
    },
    {
        id: 'imgbb',
        name: 'ImgBB',
        enabled: true,
        linkRegExp: /ibb\.co/,
        imageURLRegExp: /rel="image_src" href="(?<url>http[^"]+)"/,
        async getURL(link) {
            if (link.thumbnailURL.includes('//thumb')) return link.thumbnailURL.replace('//thumb', '//image');
            return getURLFromPage(link, this);
        },
    },
    {
        id: 'imgbox',
        name: 'imgbox.com',
        enabled: true,
        linkRegExp: /imgbox\.com/,
        async getURL(link) {
            if (link.thumbnailURL.includes('/thumbs')) return link.thumbnailURL.replace('/thumbs', '/images').replace('_t', '_o');
            return link.url;
        },
    },
    {
        id: 'imgbum',
        name: 'imgbum.ru',
        enabled: true,
        linkRegExp: /imgbum\.(net|ru)/,
        async getURL(link) { return link.thumbnailURL.replace('-thumb', ''); },
    },
    {
        id: 'imgcloud',
        name: 'imgcloud.pw',
        enabled: true,
        linkRegExp: /imgcloud\.pw\/image/,
        getURL(link) { return link.thumbnailURL.replace('.md.', '.').replace('.th.', '.'); },
    },
    {
        id: 'imgdrive',
        name: 'ImgDrive.net',
        enabled: true,
        linkRegExp: /imgdrive\.net/,
        viewMode: 'origin-download',
        async getURL(link) { return link.thumbnailURL.replace('/small/', '/big/').replace('/small-medium/', '/big/'); },
    },
    {
        id: 'imgspice',
        name: 'ImgSpice',
        enabled: true,
        linkRegExp: /imgspice\.com/,
        viewMode: 'origin-download',
        async getURL(link) { return link.thumbnailURL.replace(/_t\./, '.'); },
    },
    {
        id: 'imgtaxi',
        name: 'ImgTaxi.com',
        enabled: true,
        linkRegExp: /imgtaxi\.com/,
        viewMode: 'origin-download',
        async getURL(link) { return link.thumbnailURL.replace('/small/', '/big/').replace('/small-medium/', '/big/'); }
    },
    {
        id: 'imgtraffic',
        name: 'imgtraffic.com',
        enabled: true,
        linkRegExp: /imgtraffic\.com/,
        async getURL(link) { return link.thumbnailURL.replace('/1s/', '/1/'); },
    },
    {
        id: 'javstore',
        name: 'javstore.net',
        enabled: true,
        linkRegExp: /img\d+?\.javstore\.net/,
        async getURL(link) { return link.thumbnailURL.replace('.th.', '.'); },
    },
    {
        id: 'fc2',
        name: 'fc2.com',
        enabled: true,
        linkRegExp: /^https:\/\/storage\d+-cdn\.contents\.fc2\.com\/file/,
        viewMode: 'origin-download',
        async getURL(link) { return link.url; },
    },
    {
        id: 'fc2Direct',
        name: 'fc2.com',
        enabled: true,
        linkRegExp: /^https:\/\/contents-thumbnail2\.fc2\.com/,
        async getURL(link) { return link.url; },
    },
    {
        id: 'piccash',
        name: 'PicCash',
        enabled: true,
        linkRegExp: /piccash\.net/,
        async getURL(link) { return link.thumbnailURL.replace('_thumb', '_full').replace('-thumb', ''); },
    },
    {
        id: 'picforall',
        name: 'PicForAll',
        hosts: ['freescreens.ru', 'imgclick.ru', 'picclick.ru', 'payforpic.ru', 'picforall.ru', 'imgbase.ru'],
        enabled: true,
        linkRegExp: /(freescreens|imgclick|picclick|payforpic|picforall|imgbase)\.ru/,
        async getURL(link) { return link.thumbnailURL.replace('-thumb', ''); },
    },
    {
        id: 'picszone',
        name: 'PicsZone',
        enabled: true,
        linkRegExp: /picszone\.net\/viewer\.php\?file/,
        async getURL(link) { return link.thumbnailURL; },
    },
    {
        id: 'picstate',
        name: 'picstate.com',
        enabled: true,
        linkRegExp: /picstate\.com\/view\/full/,
        getURL(link) { return link.thumbnailURL.replace('thumbs/small/', ''); },
    },
    {
        id: 'picstateDirect',
        name: 'picstate.com (direct link)',
        enabled: true,
        linkRegExp: /picstate\.com\/files\/.*\.jpg/,
        getURL(link) { return link.url; },
    },
    {
        id: 'pixhost',
        name: 'PixHost',
        enabled: true,
        linkRegExp: /pixhost\.to\/(show|images)/,
        imageURLRegExp: /class="image-img"\ssrc="(?<url>[^"]+)"/,
        async getURL(link) {
            if (link.thumbnailURL.includes('pixhost')) return link.thumbnailURL.replace('//t', '//img').replace('/thumbs/', '/images/');
            return await getURLFromPage(link, this);
        },
    },
    {
        id: 'pornohosting',
        name: 'pornohosting.ru',
        enabled: true,
        linkRegExp: /pornohosting\.ru\/d\+/,
        async getURL(link) { return link.thumbnailURL.replace('-thumb', ''); },
    },
    {
        id: 'postimg',
        name: 'postimg.cc',
        enabled: true,
        linkRegExp: /postimg\.cc/,
        imageURLRegExp: /<a href="(?<url>[^"]+)"\sid="download"/,
        async getURL(link, extractor) { return await getURLFromPage(link, extractor); },
    },
    {
        id: 'turboimagehost',
        name: 'TurboImageHost',
        hosts: ['turboimagehost.com', 'turboimg.net'],
        enabled: true,
        linkRegExp: /turboimagehost\.com\/p/,
        imageURLRegExp: /rel="image_src" href="(?<url>http[^"]+)"/,
        getURL: getURLFromPage,
    },
    {
        id: 'vfl',
        name: 'VFL.Ru',
        enabled: true,
        linkRegExp: /^http:\/\/vfl\.ru/,
        async getURL(link) {
            const REMOVE_SUFFIX_REGEXP = /_.?(.+)$/;
            return link.thumbnailURL.replace(REMOVE_SUFFIX_REGEXP, '$1');
        },
    },
    {
        id: 'xxxwebdlxxx',
        name: 'xxxwebdlxxx.org',
        enabled: true,
        linkRegExp: /xxxwebdlxxx\.org/,
        async getURL(link) { return link.thumbnailURL.replace('/small/', '/big/'); },
    },
];

// 알파벳 순서로 모듈 정렬
siteModules.sort((a, b) => a.name.localeCompare(b.name));

const viewerCSS = function () {
    let css = document.createElement('link');
    css.href = 'https://cdnjs.cloudflare.com/ajax/libs/viewerjs/1.11.7/viewer.css';
    css.rel = 'stylesheet';
    css.type = 'text/css';
    document.getElementsByTagName('head')[0].appendChild(css);
};

const PageURL = window.location !== window.parent.location ? document.referrer : document.location.href;
const lazyAttributes = [
    "data-lazy-stored-src",
    "data-cover",
    "data-ks-lazyload",
    "data-lazyload",
    "data-src",
    "data-actualsrc",
    "data-defer-src",
    "data-imageurl",
    "data-ks-lazyload-custom",
    "data-lazy-load-src",
    "data-lazy-src",
    "data-lazyload-src",
    "data-original",
    "data-placeholder",
    "data-thumb_url",
    "data-url",
];

// 转为 Object
let lazyAttributesMap = [];
lazyAttributes.forEach(function (name) {
    lazyAttributesMap[name] = true;
});


function any(c, fn) {
    if (c.some) {
        return c.some(fn);
    }
    if (typeof c.length === 'number') {
        return Array.prototype.some.call(c, fn);
    }
    return Object.keys(c).some(function (k) {
        return fn(c[k], k, c);
    });
}


let styles = `
.ViewerGallery img:hover {
transform: scale(1.025);
filter: alpha(opacity=80);
    -moz-opacity: .8;
    -khtml-opacity: .8;
    opacity: .8;
    -webkit-transition: all .3s ease;
    -moz-transition: all .3s ease;
    -o-transition: all .3s ease;
    transition: all .3s ease;
    cursor: pointer;
    }


.ViewerGallery img {
-webkit-box-shadow: 2px 4px 10px 0 rgba(0, 0, 0, .5);
    -moz-box-shadow: 2px 4px 10px 0 rgba(0, 0, 0, .5);
    box-shadow: 2px 4px 10px 0 rgba(0, 0, 0, .5);
    border-radius: .5em;
}
`;

function AddStyles(CSS, ID) {
    let styleSheet = document.createElement("style");
    styleSheet.textContent = CSS;
    styleSheet.id = ID;
    document.head.appendChild(styleSheet);
}

class Queue {
    constructor() {
        this.items = []; // 객체 대신 배열 사용 (현대 브라우저에서는 배열 최적화가 더 잘 됨)
    }
    enqueue(item) { this.items.push(item); }
    dequeue() { return this.items.shift(); }
    isEmpty() { return this.items.length === 0; }
    get size() { return this.items.length; }
}


const queue = new Queue();
const queued = new WeakSet();
const getFullSizeQueue = new Queue();

// 중복 처리 방지를 위한 Set 추가
const processedElements = new Set();

const TASK_TIMEOUT_MS = 10000;
const processCount = 5; // 👈 동시에 처리할 최대 작업 수
let activeWorkerCount = 0; // 현재 작동 중인 워커의 수
let isSpawning = false; // 워커가 생성 중인지 확인하는 플래그

async function getFullSizeManagement() {
    if (isSpawning || activeWorkerCount >= processCount || getFullSizeQueue.isEmpty()) return;

    isSpawning = true;

    async function worker() {
        activeWorkerCount++;
        while (!getFullSizeQueue.isEmpty()) {
            const linkElement = getFullSizeQueue.dequeue();
            if (!linkElement) continue;

            // 이미 처리 중이거나 완료된 링크 건너뛰기
            if (processedElements.has(linkElement.href)) continue;
            processedElements.add(linkElement.href);

            try {
                // 비동기 작업 레이싱 (타임아웃 적용)
                await Promise.race([
                    image.getFullSizeURL(linkElement),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), TASK_TIMEOUT_MS))
                ]);
            } catch (error) {
                console.warn(`[Queue] Failed: ${linkElement.href}`, error.message);
                processedElements.delete(linkElement.href); // 실패 시 재시도 가능하도록 제거
            }

            // UI 스레드 점유 방지 (최소한의 micro-task 지연)
            await new Promise(resolve => requestAnimationFrame(resolve));
        }
        activeWorkerCount--;
    }

    // 워커 병렬 가동
    while (activeWorkerCount < processCount && !getFullSizeQueue.isEmpty()) {
        worker();
        if (activeWorkerCount < processCount) {
            await new Promise(resolve => setTimeout(resolve, 500)); // 워커 간 간격 단축 (1s -> 0.5s)
        }
    }
    isSpawning = false;
}


let ManagementWorking = false; // should be declared outside

function Management() {
    if (ManagementWorking) return; // prevent concurrent runs
    ManagementWorking = true;

    function processNext() {
        if (queue.isEmpty()) {
            ManagementWorking = false;
            return;
        }

        let Q = queue.dequeue();

        try {
            initViewer(Q);
        } catch (err) {
            console.error("Error in initViewer or dequeue:", err);
            throw new Error("Error RemoveTag");
        }

        // Process next item
        setTimeout(processNext, 10);
    }

    processNext();
}



let viewer = null, AddStyleRun = true;
let startTime, endTime;

const loadImage = (imageSrc) => new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
        resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };

    image.onerror = () => {
        reject(new Error("Failed to load image: " + imageSrc));
    };

    image.src = imageSrc;

    // Handle cached image that loads instantly
    if (image.complete && image.naturalWidth !== 0) {
        resolve({ width: image.naturalWidth, height: image.naturalHeight });
    }
});



let ViewerList = new Set();
let isWorking = false;

let lastViewerUpdated = performance.now();

let viewerPending = false;

function viewerUpdate() {

    if (viewerPending) return;

    viewerPending = true;

    requestAnimationFrame(() => {
        viewer.update();
        ViewerList.clear();
        viewerPending = false;
    });

}
/*
let viewerUpdateTimer = null;
function viewerUpdate() {
    if (viewerUpdateTimer) {
        return;
    }
    // viewerList의 크기가 0보다 클 때만 타이머를 설정합니다.
    if (ViewerList.size > 0) {
        if (ViewerList.size >= 10) {
            viewer.update();
            ViewerList.clear();
            clearTimeout(viewerUpdateTimer);
            viewerUpdateTimer = null; // 타이머 실행 후 초기화
        }
        else {
            viewerUpdateTimer = setTimeout(() => {
                viewer.update();
                ViewerList.clear();
                clearTimeout(viewerUpdateTimer);
                viewerUpdateTimer = null; // 타이머 실행 후 초기화
            }, 5000);
        }
    }
}
*/
let container = document.querySelector('#ViewerJS');

function AddViewer() {
    container = document.querySelector('#ViewerJS');
    if (!container) return;

    // Initialize the Viewer instance once
    viewer = new Viewer(container, {

        // Only include images whose ancestor <a.ViewerGallery> has an ivImgUrl
        filter(img) {
            if (img.closest('.image-masonry')) return false;
            const link = img.closest('a.ViewerGallery');
            if (!link) return false;
            img.onclick = null;                // disable default click
            return Boolean(link.dataset.ivImgUrl);
        },

        // Provide the real “large” URL from the link’s data attribute,
        // falling back to the src if already a real URL
        url(img) {
            const link = img.closest('a.ViewerGallery');
            const src = img.src.startsWith('data:') ? img.dataset.src : img.src;
            return link?.dataset.ivImgUrl || src;
        },

        ready() {
            // Only bind these handlers once
            //bindKeyboardNavigation(viewer);
            //bindArrowNavHandlers(viewer);
        },

        viewed({ detail: { image } }) {
            autoFitImage(viewer, image);
        },
        shown() {
            //bindImagePreloadHandlers(viewer);
        },
    });
}

// ————— Helpers ————— //

function bindKeyboardNavigation(viewer) {
    document.addEventListener('keydown', e => {
        if (!document.querySelector('div.viewer-in')) return;
        switch (e.key) {
            case 'ArrowLeft': viewer.prev(); break;
            case 'ArrowRight': viewer.next(); break;
        }
    }, { once: true });
}


function bindImagePreloadHandlers(viewer) {
    const imgs = container.querySelectorAll('ul.viewer-list li img');
    imgs.forEach(img => {
        ['mouseover'].forEach(evt =>
            img.addEventListener(evt, () => loadImage(img.getAttribute('data-original-url')), { once: true })
        );
    });
}

function bindArrowNavHandlers(viewer) {
    ['prev', 'next'].forEach(dir => {
        const btn = document.querySelector(`li.viewer-${dir}`);
        if (!btn) return;
        ['click'].forEach(evt =>
            btn.addEventListener(evt, () => dir === 'prev' ? viewer.prev() : viewer.next(), { once: true })
        );
    });
}

function autoFitImage(viewer, img) {
    const oW = img.naturalWidth, oH = img.naturalHeight;
    const vW = img.offsetParent.clientWidth, vH = img.offsetParent.clientHeight;
    let ratio;

    if (oW > vW) {
        ratio = vW / oW;
    } else if (oH > 1600 && oW * 3 < oH) {
        ratio = 0.95;
    } else if (oH > vH && oW >= 1200) {
        ratio = 1200 / oW;
    } else {
        viewer.scale(1.1, 1.1);
        return;
    }

    // Center vertically if letterboxed
    const yOffset = (oH * ratio - vH) / 2 + (vH - img.clientHeight) / 4;
    viewer.zoomTo(ratio).move(0, yOffset);
}



const request = (details) => new Promise((resolve, reject) => {
    details.onload = resolve;
    details.onerror = reject;
    details.ontimeout = reject;
    GM_xmlhttpRequest(details);
});

let openInTab = (url, openInBackground) => {
    return GM_openInTab(url, openInBackground);
};


function GetOnline(details) {
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: "GET",
            url: details.url,
            headers: {
                "User-Agent": navigator.userAgent, // 현재 브라우저의 User-Agent
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                "Referer": details.url, // 이전 페이지 정보
            },
            responseType: 'text',
            timeout: 60000,
            onload: function (resp) {
                //let container = document.implementation.createHTMLDocument().documentElement;
                //container.innerHTML = resp.responseText;
                resolve(resp);
            },
            onerror: function (err) {
                reject(err);
            },
            ontimeout: function (err) {
                reject(err);
            },
        });
    });
}

async function getURLFromPage(link, extractor, requestDetails) {
    const html = await getPageHtml({ url: link.url, ...requestDetails });
    //console.log({html})
    const match = extractor.imageURLRegExp?.exec(html);
    let url = match ? (match.groups ? match.groups.url : match[1]) : null;
    if (!url) {
        console.error(`[Image Viewer] Failed to get URL from page source: ${link.url}`);
    }
    return url;
}


// // 헤더 추가 코드
// async function NewgetURLFromPage(link, extractor, requestDetails = {}) {
//     // headers가 없으면 기본값으로 설정
//     const finalRequestDetails = {
//         ...requestDetails,
//         headers: {
//             "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
//             "User-Agent": navigator.userAgent,
//             ...(requestDetails.headers || {}) // 기존 headers가 있다면 병합
//         }
//     };

//     const html = await getPageHtml({ url: link.url, ...finalRequestDetails });
//     const match = extractor.imageURLRegExp?.exec(html);
//     let url = match ? (match.groups ? match.groups.url : match[1]) : null;
//     if (!url) {
//         console.error(`[Image Viewer] Failed to get URL from page source: ${link.url}`);
//     }
//     return url;
// }




async function getPageHtml(requestDetails) {
    //console.log(requestDetails)
    const response = await request(requestDetails);
    //console.log('getPageHtml: ', response)
    return response.responseText;
}


//================================================================================
// 3. 동적 데이터 생성 및 전역 변수
//================================================================================
const extractorsActive = siteModules.filter(module => module.enabled);
const extractorsByID = extractorsActive.reduce((result, extractor) => {
    result[extractor.id] = extractor;
    return result;
}, {});


const urlExtractor = {
    async getImageURL(link) {
        const extractor = extractorsByID[link.host];
        if (!extractor) {
            console.error(`[Image Viewer] No active extractor found for host: ${link.host}`);
            return null;
        }
        const imageURL = await extractor.getURL(link, extractor);
        if (!imageURL) {
            console.error(`[Image Viewer] Failed to get URL for ${link.host}:${link.url}`);
        }
        return imageURL;
    },
    getExtractorByHost(hostId) {
        return extractorsByID[hostId];
    },
    getHostExtractorMatcher() {
        let previousExtractor;
        return (url) => {
            if (previousExtractor && previousExtractor.linkRegExp.test(url)) {
                return previousExtractor;
            }
            const extractor = extractorsActive.find((e) => e.linkRegExp.test(url));
            if (extractor) {
                previousExtractor = extractor;
                return extractor;
            }
            return null;
        };
    },
};

const getExtractor = urlExtractor.getHostExtractorMatcher();

function sortCaseInsensitive(items, getValue) {
    return items
        .map((value, index) => ({ index, value: getValue(value).toLowerCase() }))
        .sort((a, b) => {
            if (a.value > b.value) {
                return 1;
            }
            if (a.value < b.value) {
                return -1;
            }

            return 0;
        })
        .map((m) => items[m.index]);
}


const CLASSES = {
    imageLink: 'js-image-link',
    imageLinkOpenInNew: 'js-image-link-open-in-new',
    zoomIcon: 'iv-icon--type-zoom',
    openInNewIcon: 'iv-icon--type-open-in-new',
    imageLinkHover: 'iv-icon--hover',
    brokenImageIcon: 'iv-icon--type-image-broken',
    loadingIcon: 'iv-icon--type-loading',
    loading: 'iv-image-view__image--loading',
    thumbnail: 'iv-image-view__image--thumbnail',
    open: 'iv-image-view--open',
    single: 'iv-image-view--single',
    fullHeight: 'iv-image-view--full-height',
    iconExpand: 'iv-icon--type-expand',
    iconShrink: 'iv-icon--type-shrink',
    grabbing: 'iv-image--grabbing',
    buttonActive: 'iv-icon-button--active',
    imageView: 'ViewerImage',
};

const SELECTORS = {
    imageLink: `.${CLASSES.imageLink}`,
    imageOpenInNewLink: `.${CLASSES.imageLinkOpenInNew}`,
};

const EMPTY_SRC =
    'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEAAAAALAAAAAABAAEAAAI=';

const TRANSITION_DURATION = 350;

let PreLoadDB = [];


const ExpandTag = new IntersectionObserver(entries => {

    for (const entry of entries) {
        const el = entry.target;
        if (el.classList.contains('unfolded')) continue;
        el.click();
        const P = entry.target.nextElementSibling;
        if (P.querySelectorAll('a img').length) {
            queue.enqueue(P);
        }
        ExpandTag.unobserve(el);
    }

    if (!ManagementWorking && !queue.isEmpty()) {
        Management();
    }

}, {
    root: null,
    rootMargin: "0px 0px 500px 0px",
    threshold: 0
});

function AtoBLinks(link) {
    let linkAtoB = /(\/|=)(aHR0c[a-zA-z0-9]+={0,2})($|\/|\?|&|-?-?;?)/.exec(link.href);
    console.log(linkAtoB);
    link.href = atob(linkAtoB[2]).replace(/\?site=.+/, '');
    return link;
}



const linkCommonClasses = [
    'iv-image-link',
    //'iv-icon--hover',
    //'iv-icon--size-button',
];



/**
 * Returns an array of { link, img, thumbnailUrl } for every candidate image
 * under `root` that hasn’t been marked with `processedClass` yet.
 */
function collectImageLinks(root, processedClass = 'ivChecked') {
    const items = [];

    root.querySelectorAll(`a:not(.${processedClass}) > img:not(.Error), a:not(.${processedClass}) > * > img:not(.Error)`)
        .forEach(img => {
            if (img.matches('.ClickAbleItem')) return;

            const link = img.closest('a');
            if (!link) return;

            // 1) Unwrap base64 redirect links
            const m = link.href.match(/redirect\.php\?url=(.*)/);
            if (m) {
                link.href = decodeURIComponent(m[1]).replace(/\&ver.*/, '');
            }

            /*
            // 2) Force HTTPS on known hosts
            ['fastpic', 'imagebam'].forEach(host => {
                if (link.href.startsWith(`http://${host}`)) {
                    link.href = link.href.replace(/^http:/, 'https:');
                }
                if (img.src.startsWith(`http://${host}`)) {
                    img.src = img.src.replace(/^http:/, 'https:');
                }
            });
            */

            // 3) Resolve a “real” thumbnail URL:
            let thumb = img.src;
            if (thumb.startsWith('data:image') ||
                extractRootDomain(thumb) !== extractRootDomain(link.href)) {
                // look for lazy attributes
                for (const attr of img.attributes) {
                    if (lazyAttributesMap[attr.name]) {
                        thumb = attr.value;
                        break;
                    }
                }
            }

            items.push({ link, img, thumbnailUrl: thumb });
        });

    return items;
}


function CheckViewerList(node) {
    const items = collectImageLinks(node);
    // Filter by extractor availability:
    return items.some(({ link }) => Boolean(getExtractor(link.href)));
}

async function initViewer(node) {
    // 1) Collect & filter
    const items = collectImageLinks(node)
        .filter(({ link }) => getExtractor(link.href));

    if (items.length === 0) {
        return items;  // nothing to initialize
    }

    // 2) Annotate each link + start IO
    for (const { link, thumbnailUrl, img } of items) {
        link.classList.add('ivChecked');

        const extractor = getExtractor(link.href);
        link.dataset.ivHost = extractor.id;
        link.dataset.ivThumbnail = thumbnailUrl;

        const isNewTab = extractor.viewMode === 'new-tab';
        link.setAttribute('title', isNewTab ? 'Open in new tab' : 'Open viewer');
        link.classList.add(
            ...linkCommonClasses,
            ...(isNewTab
                ? [CLASSES.imageLinkOpenInNew, CLASSES.openInNewIcon]
                : [CLASSES.imageLink])
        );
        if (!img.matches('.ClickAbleItem')) {
            if (img.src.startsWith('blob:')) {
                link.dataset.ivThumbnail = link.href;
            } else if (!img.complete) {
                image.getSize(img).then(() => {
                    if (ImageExists(img) && !ImageBigSize(img)) {
                        getFullSizeQueue.enqueue(link);
                        if (!isSpawning) {
                            getFullSizeManagement();
                        }
                    }
                }).catch(e => console.error(e));
            } else {
                if (ImageExists(img) && !ImageBigSize(img)) {
                    getFullSizeQueue.enqueue(link);
                    if (!isSpawning) {
                        getFullSizeManagement();
                    }
                }
            }
        }
    }
    // 3) Return the items for any further use
    return items;
}

function AddEvent(el) {
    el.addEventListener('click', (event) => {
        const clicked = event.target.closest('.ViewerGallery');
        if (clicked) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            viewer.update();
            ViewerList.clear();
            const galleries = document.querySelectorAll('.ViewerGallery');
            const index = Array.from(galleries).indexOf(clicked); // ← 현재 클릭한 것의 인덱스
            viewer.view(index);  // el 대신 index 사용
        }
    }, true);
}


function ImageBigSize(image) {
    if (/contents\.fc2\.com|blob:/.test(image.src)) return false;
    let big = false;
    let W = image.naturalWidth;
    let H = image.naturalHeight;

    if (W >= 800) {
        big = true;
    }
    else if (W >= 600 && H >= 800) {
        big = true;
    }
    return big;
}


function ImageExists(image) {
    const W = image.naturalWidth;
    const H = image.naturalHeight;
    const RootDomain = extractRootDomain(image.src);

    const noImageDimensions = {
        'imagetwist.com': [{ w: 177, h: 142 }],
        'pimpandhost.com': [{ w: 200, h: 200 }],
        'filesor.com': [{ w: 200, h: 200 }],
        'pixhost.to': [{ w: 257, h: 126 }],
        'pixroute.com': [{ w: 350, h: 337 }],
        'imagevenue.com': [{ w: 150, h: 150 }, { w: 180, h: 150 }],
        'imgclick.com': [{ w: 362, h: 70 }],
        'imgur.com': [{ w: 161, h: 81 }],
        'postimg.cc': [{ w: 320, h: 320 }],
        'fastpic.org': [{ w: 150, h: 113 }, { w: 150, h: 150 }],
        'fastpic.ru': [{ w: 150, h: 113 }, { w: 150, h: 150 }]
    };

    const dimensions = noImageDimensions[RootDomain];
    if (!dimensions) return true; // no known "no image" dimensions for this domain

    // Check if image size matches any known "no image" dimension
    const result = dimensions.some(dim => dim.w === W && dim.h === H);

    if (result) {
        const link = image.closest('a');
        link.classList.remove('ViewerGallery');
        //viewer.update()
        ViewerList.delete(link);
        viewerUpdate();
    }
    return !result;
}


const image = {
    async getFullSizeURL(link) {
        let imageURL = link.dataset.ivImgUrl;
        let img = link.querySelector('img');

        if (imageURL) {
            link.dataset.ivImgUrl = imageURL;
            link.classList.add('ViewerGallery');
            return imageURL;
        }


        const thumbnailURL = link.dataset.ivThumbnail;
        const imageHost = link.dataset.ivHost;

        if (!thumbnailURL || !imageHost) {
            throw new Error(
                '[image-viewer] Either thumbnail URL or host is not set'
            );
        }

        imageURL = await urlExtractor.getImageURL({
            url: link.href,
            thumbnailURL,
            host: imageHost,
        });


        if (!imageURL) {
            image.markAsBroken(link);
            link.classList.remove('ViewerGallery');
            //viewer.update()
            ViewerList.delete(link);
            viewerUpdate();
            return;
        }

        try {
            const extractor = urlExtractor.getExtractorByHost(imageHost);
            if (extractor.viewMode === 'origin-download') {
                if (img.src.startsWith('blob:')) {
                    imageURL = img.src;
                } else {
                    imageURL = await image.loadAsBlob(imageURL);
                }
            }

        } catch {
            console.log(imageURL);
            image.markAsBroken(link);
            link.setAttribute('target', '_blank');
        }



        link.dataset.ivImgUrl = imageURL;
        link.classList.add('ViewerGallery');
        AddEvent(img);
        //viewer.update()
        ViewerList.add(link);
        viewerUpdate();
        return imageURL;
    },

    preload(url, onSizeGet) {
        return new Promise((resolve, reject) => {
            const imageObject = new Image();

            imageObject.addEventListener('load', () => resolve());
            imageObject.addEventListener('error', reject);

            imageObject.src = url;

            if (onSizeGet) {
                image.getSize(imageObject).then(onSizeGet);
            }
        });
    },


    CheckOnline(url) {
        return new Promise((resolve, reject) => {
            console.log(url);
            GM_xmlhttpRequest({
                method: "GET",
                url: url,
                responseType: 'blob',
                timeout: 600000,
                onload: function (resp) {
                    console.log(url, resp.status);
                    //resolve(resp.status)
                    if (resp.status == 200) {
                        resolve(window.URL.createObjectURL(resp.response));
                    }
                    else {
                        console.log(url, resp.status);
                        reject(resp.status);
                    }
                },
                onerror: function (error) {
                    console.log(url, error.status);
                    reject(error);
                },
                ontimeout: function (error) {
                    console.log(url, 'timeout');
                    reject(error);
                }
            });
        });
    },

    async loadAsBlob(url) {
        const origin = new URL(url).origin;

        const response = await request({
            url,
            headers: {
                referer: origin,
                origin,
            },
            responseType: 'blob',
        });
        console.log(response, response.status);
        return URL.createObjectURL(response.response);
    },

    getSize(img) {
        img.removeAttribute('loading'); // 오타 수정 (removetAttribute -> removeAttribute)
        return new Promise((resolve) => {
            if (img.complete) {
                resolve({ width: img.naturalWidth, height: img.naturalHeight, isLoaded: img.complete });
            } else {
                // onload 덮어쓰기 방지
                const onImgLoad = () => {
                    img.removeEventListener('load', onImgLoad);
                    resolve({ width: img.naturalWidth, height: img.naturalHeight, isLoaded: img.complete });
                };
                const onImgError = () => {
                    img.removeEventListener('error', onImgError);
                    console.log('이미지 로딩 에러!');
                    resolve({ width: 0, height: 0, isLoaded: false }); // 에러 시 처리
                };
                img.addEventListener('load', onImgLoad);
                img.addEventListener('error', onImgError);
            }
        });
    },
    markAsBroken(link) {
        link.classList.remove('js-image-link');
        link.removeAttribute('title');
    },
};

const mutCallback = (mutationsList) => {

    const addSet = new Set();
    for (const { addedNodes } of mutationsList) {
        for (const node of addedNodes) {
            if (!(node instanceof HTMLElement)) continue;
            const skip = node.closest('div.sp-body.inited');

            if (skip) continue;

            let imgs = [];

            // 1️⃣ node 자체가 img
            if (node.tagName === 'IMG') {
                imgs = [node];
            }
            // 2️⃣ node 안에 img 포함
            else {
                imgs = node.querySelectorAll?.('a img:not(.Error)') || [];
            }

            for (const img of imgs) {
                if (/faleno\.jp\/top\/wp-content\/uploads/.test(img.src)) {
                    convertImages([img]);
                }
                const link = img.closest('a');
                if (!link || link.classList.contains('ivChecked')) continue;
                const P = link.closest('div, section, article') || link.parentElement?.parentElement;
                if (P && P.nodeName !== 'BODY') {
                    addSet.add(P);
                }
            }
        }
    }

    if (addSet.size) {
        for (const el of addSet) {
            queue.enqueue(el);
        }
        if (!ManagementWorking && !queue.isEmpty()) {
            Management();
        }
    }
};
// 옵저버 설정 (기존과 동일하지만, 대상 범위가 중요합니다)
const attributesobserver = new MutationObserver(mutCallback);

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

window.addEventListener("DOMContentLoaded", () => {
    viewerCSS();
    Start();
}, { once: true });


async function convertImages(list) {
    await Promise.all(list.map(async (el) => {
        try {
            const blobSrc = await image.loadAsBlob(el.src);
            el.src = blobSrc;
        } catch (e) {
            console.warn('이미지 실패:', el.src);
        }
    }));
}

async function Start() {
    startTime = performance.now();
    let ImageLinks = [];

    const falenoImages = document.querySelectorAll('img[src*="faleno.jp/top/wp-content/uploads/"]');

    Array.from(falenoImages).forEach(async (el) => {
        convertImages([el]);
    });

    if (/javarchive\.com\/.*\.html/.test(PageURL)) {
        ImageLinks = document.querySelectorAll('a[href*="https://pixhost.to/show"]');
        Array.from(ImageLinks).forEach(async (el) => {
            if (el.innerText === 'CLICK HERE!') {
                el.children[0].remove();
                const ImageTag = document.createElement('img');
                ImageTag.src = await CheckThumbnail(el.href);
                el.appendChild(ImageTag);
            }
        });
        ImageLinks = document.querySelectorAll('a[href*="javstore.net/images"]');
        Array.from(ImageLinks).forEach(el => {
            if (el.innerText === 'CLICK HERE!') {
                el.children[0].remove();
                const ImageTag = document.createElement('img');
                const thumbnailExtension = el.href.split('.').pop() ?? '';
                ImageTag.src = el.href.replace('.' + thumbnailExtension, '.th.' + thumbnailExtension);
                el.appendChild(ImageTag);
            }
        });

        const container = document.getElementById('lightgallery');

        if (!container) return;

        // 1️⃣ 이벤트 제거 (clone)
        const newContainer = container.cloneNode(true);
        container.replaceWith(newContainer);

        // 2️⃣ 링크 변환 + img 수집 동시에 처리
        const imageLinks = [];

        newContainer.querySelectorAll('li').forEach(li => {
            const a = li.querySelector('a');
            const img = li.querySelector('img');

            if (!img) return;

            const original = li.dataset.src || img.src;

            // 링크 설정
            if (a) {
                a.href = original;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
            }

            // 변환 대상 필터
            if (/^https:\/\/storage\d+-cdn\.contents\.fc2\.com\/file/i.test(img.src)) {
                imageLinks.push(img);
            }
        });

        if (imageLinks.length > 0) {
            convertImages(imageLinks).then(() => {
                console.log('이미지 변환 완료!');
                newContainer.querySelectorAll('li').forEach(li => {
                    li.querySelector('a').classList.remove('ivChecked');
                });
                initViewer(newContainer);
            });
        }
    }

    let Ex = [];
    if (/(rutracker\.org|pornolab\.net|trupornolabs.org)/.test(PageURL)) {
        let AutoExpandTag = '.sp-head.folded.clickable:not(.unfolded)';
        Ex = [...document.querySelectorAll(AutoExpandTag)];
        Ex.forEach(el => {
            ExpandTag.observe(el);
            //el.click()
        });
    }

    if (!/javarchive\.com\/.*\.html/.test(PageURL) && !Ex?.length && !CheckViewerList(document.body)) {
        return (`No Image Viewer Item`);
    }

    console.log('Start Image Viewer!!!!!!');

    AddStyles(styles, 'Viewer');


    document.body.setAttribute('id', 'ViewerJS');

    AddViewer();

    Array.from(document.querySelectorAll('img[src*="filesor.com"]')).forEach((el) => {
        el.replaceWith(el);
    });

    initViewer(document.body)
        .then(async e => {
            if (e.length) {
                attributesobserver.observe(document.body, { subtree: true, childList: true });
            }
            else if (Ex?.length) {
                attributesobserver.observe(document.body, { subtree: true, childList: true });
            }
        })
        .catch(() => {

        });



    console.log(`Start Logic time: ${performance.now() - startTime} ms`);

}


function CheckThumbnail(url) {
    let Thumbnail, imageName;
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: "GET",
            url: url,
            responseType: 'document',
            headers: { referer: document.location.href, origin: document.location.href },
            onload: async function (resp) {
                if (resp.response) {
                    imageName = url.split('/').pop()?.replace('.html', '');
                    Thumbnail = resp.response.querySelector('img[src*="' + imageName + '"]');
                    if (Thumbnail) {
                        resolve(Thumbnail.src.replace('//img', '//t').replace('/images/', '/thumbs/'));
                    }
                }
                else {
                    console.log(resp);
                    reject(resp.response);
                }
            },
            onerror: function (error) {
                console.log(error);
                CheckThumbnail(url);
                //reject(resp.response);
            }
        });
    });
}



//Mutil images preload
function PreloadImages(PreLoadDB) {
    //console.log(PreLoadDB)
    if (PreLoadDB?.length > 0) {
        new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = function () {
                resolve(img);
            };
            img.onerror = img.onabort = function () {
                reject(img);
            };
            img.src = PreLoadDB[0];
        }).then(() => {
            PreLoadDB.shift();
            if (PreLoadDB?.length > 0) {
                PreloadImages(PreLoadDB);
            }
        })
            .catch((img) => {
                console.log(img);
                img.style.backgroundImage = "url(" + PreLoadDB[0] + ")";
            });
    }
}
