// ==UserScript==
// @name         Image Viewer MOD
// @version      1.3.2 2025.08.01
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
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_getResourceText
// @grant        GM_registerMenuCommand
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
        getURL: getURLFromPage,
    },
    {
        id: 'fastpicDirect',
        name: 'FastPic (direct link)',
        enabled: true,
        linkRegExp: /fastpic\.(?:ru|org)\/big/,
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
        linkRegExp: /img\.javstore\.net/,
        async getURL(link) { return link.thumbnailURL.replace('.th.', '.'); },
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

//================================================================================
// 2. 설정 및 메뉴 생성
//================================================================================
function setupMenu() {
    siteModules.forEach(module => {
        let isEnabled = GM_getValue(module.id, module.enabled);
        module.enabled = isEnabled;
        const menuText = `${isEnabled ? '✅' : '❌'} ${module.name}`;
        GM_registerMenuCommand(menuText, () => {
            GM_setValue(module.id, !isEnabled);
            window.location.reload();
        });
    });
}
setupMenu()

const viewerCSS = function () {
    let css = document.createElement('link')
    css.href = 'https://cdnjs.cloudflare.com/ajax/libs/viewerjs/1.11.7/viewer.css'
    css.rel = 'stylesheet'
    css.type = 'text/css'
    document.getElementsByTagName('head')[0].appendChild(css)
}

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
]

// 转为 Object
let lazyAttributesMap = []
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
`

function AddStyles(CSS, ID) {
    let styleSheet = document.createElement("style")
    styleSheet.textContent = CSS
    styleSheet.id = ID
    document.head.appendChild(styleSheet)
}



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
        if (this.isEmpty()) {
            return undefined;
        }
        const item = this.items[this.front];
        delete this.items[this.front];
        this.front++;
        return item;
    }

    peek() {
        if (this.isEmpty()) {
            return undefined;
        }
        return this.items[this.front];
    }

    get size() {
        return this.rear - this.front;
    }

    isEmpty() {
        return this.size === 0;
    }

    // UI 업데이트를 위해 큐의 모든 아이템을 배열로 반환하는 헬퍼 메서드
    getItemsArray() {
        const arr = [];
        for (let i = this.front; i < this.rear; i++) {
            arr.push(this.items[i]);
        }
        return arr;
    }
}


const queue = new Queue();


let ManagementWorking = false; // should be declared outside

function Management() {
    if (ManagementWorking) return; // prevent concurrent runs
    ManagementWorking = true;

    function processNext() {
        if (queue.isEmpty()) {
            ManagementWorking = false;
            return;
        }

        let Q = queue.peek();

        try {
            initViewer(Q);
            queue.dequeue();
        } catch (err) {
            console.error("Error in initViewer or dequeue:", err);
            throw new Error("Error RemoveTag");
        }

        // Process next item
        processNext();
    }

    processNext();
}



let viewer, AddStyleRun = true
let startTime, endTime


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



let ViewerList
let isWorking = false



// 이미지 URL을 저장할 대기열(큐) 인스턴스
const imageQueue = new Queue();

let isPreloading = false; // 중복 실행 방지를 위한 플래그

/**
         * 주어진 URL의 이미지를 미리 불러오기 위한 Promise를 반환합니다.
         * @param {string} url - 미리 불러올 이미지의 URL
         * @param {number} timeout - 타임아웃 시간 (밀리초)
         * @returns {Promise<Image>} - 로딩된 Image 객체로 해결되는 Promise
         */
function preloadImage(url, timeout = 10000) {
    return new Promise((resolve, reject) => {
        if (!url) return resolve();
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image at ${url}`));
        img.src = url;

        const timer = setTimeout(() => {
            reject(new Error(`Image load timed out for ${url}`));
        }, timeout);

        img.onload = img.onerror = () => {
            clearTimeout(timer);
            if (img.complete) {
                resolve(img);
            } else {
                reject(new Error(`Image load failed for ${url}`));
            }
        };
    });
}

/**
         * 클릭된 이미지의 URL을 대기열에 추가하고 UI를 업데이트합니다.
         * @param {string} url - 대기열에 추가할 이미지 URL
         * @param {HTMLElement} element - 클릭된 이미지 요소
         */
function addToQueue(url) {
    // 이미 큐에 있는 이미지는 추가하지 않습니다.
    if (!imageQueue.getItemsArray().includes(url)) {
        imageQueue.enqueue(url);
        console.log(`대기열에 추가됨: ${url}`, imageQueue.getItemsArray());
    }
}

/**
         * 대기열에 있는 이미지를 순차적으로 미리 불러옵니다.
         */
async function processQueue() {
    if (imageQueue.isEmpty()) {
        return;
    }

    if (isPreloading) {
        console.log('이미지 로딩이 진행 중입니다. 잠시 기다려주세요.');
        return;
    }

    isPreloading = true;

    try {
        // 큐에 있는 모든 이미지를 처리
        while (!imageQueue.isEmpty()) {
            const url = imageQueue.peek(); // 현재 처리할 이미지 URL
            await preloadImage(url, 10000);
            imageQueue.dequeue(); // 로딩 완료 후 큐에서 제거
        }

    } catch (error) {
        console.error('이미지 로딩 중 오류 발생:', error);

    } finally {
        // 로딩 완료 후 큐 인스턴스를 재설정하고 UI 업데이트
        isPreloading = false;
    }
}

function CheckSize(Access, Target) {
    let SRC
    //console.log(document.querySelector('li.viewer-active').getAttribute('data-index'))
    if (ViewerList.length - 1 == document.querySelector('li.viewer-active').getAttribute('data-index')) {
        Access = 'JumpFirst'
        Target = ViewerList[0]
    }
    else if (document.querySelector('li.viewer-active').getAttribute('data-index') == 0) {
        Access = 'JumpLast'
        Target = ViewerList[ViewerList.length - 1]
    }
    switch (Access) {
        case "previousSibling":
            SRC = document.querySelector('li.viewer-active').previouselementsibling?.querySelector('img').getAttribute('data-original-url')
            break
        case "nextSibling":
            SRC = document.querySelector('li.viewer-active').nextElementSibling?.querySelector('img').getAttribute('data-original-url')
            break
        case "AccessTaget":
            SRC = Target.getAttribute('data-original-url')
            break
        case "JumpFirst":
            SRC = Target.querySelector('img').getAttribute('data-original-url')
            break
        case "JumpLast":
            SRC = Target.querySelector('img').getAttribute('data-original-url')
            break
    }

    let ATag = Array.prototype.slice.call(document.querySelectorAll('a.ViewerGallery')).find(function (el) {
        return el.getAttribute('data-iv-img-url') === SRC;
    })
    let isSize = ATag.hasAttribute('data-ivnatural-width')

    if (!isSize && SRC) {
        loadImage(SRC)
            .then((x) => {
                ATag.dataset.ivnaturalWidth = x.width.toString()
                ATag.dataset.ivnaturalHeight = x.height.toString()
            })
            .catch((err) => { console.log(err) })
    }
}

const imageFullSizeQueue = new Queue()
let isFullSizeProcessing = false
let pauseFullSizeProcessing = false; // 원하면 일시정지 기능 사용

function addToFullSizeQueue(imgEl, { autoStart = false } = {}) {
    if (!imgEl) return;
    const items = imageFullSizeQueue.getItemsArray();
    if (items.includes(imgEl)) return; // 중복 방지
    imageFullSizeQueue.enqueue(imgEl);

    // 자동 시작을 원하면 시작
    if (autoStart && !isFullSizeProcessing) {
        startFullSizeProcessing();
    }
}
/**
 * 큐 처리 시작
 */
function startFullSizeProcessing() {
    if (isFullSizeProcessing) return;
    isFullSizeProcessing = true;
    pauseFullSizeProcessing = false;
    processFullSizeQueue()
        .catch(err => console.error('processFullSizeQueue failed:', err))
        .finally(() => { isFullSizeProcessing = false; });
}

/**
 * 큐 처리 일시정지 후, 사용자 활동 감지해서 3초 뒤 재개
 */
function pauseFullSizeProcessingNow() {
    pauseFullSizeProcessing = true;

    let idleTimer;
    function onUserActivity() {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
            pauseFullSizeProcessing = false;
            startFullSizeProcessing();
            // 한 번만 동작시키고 이벤트 핸들러 제거
            ['mousemove', 'scroll', 'keydown', 'touchstart'].forEach(ev =>
                document.removeEventListener(ev, onUserActivity)
            );
        }, 10000);
    }

    // 사용자 활동 감지 시작
    ['mousemove', 'scroll', 'keydown', 'touchstart'].forEach(ev =>
        document.addEventListener(ev, onUserActivity)
    );
}


/**
 * 큐 처리 재개
 */
function resumeFullSizeProcessing() {
    if (!isFullSizeProcessing) startFullSizeProcessing();
}

/**
 * 실제 큐 처리 루프 (비동기)
 */
async function processFullSizeQueue() {
    while (!imageFullSizeQueue.isEmpty()) {
        if (pauseFullSizeProcessing) break;

        const imgEl = imageFullSizeQueue.peek();

        // 안전 검사: DOM에서 사라졌거나 유효하지 않으면 건너뜀
        if (!imgEl || !(imgEl instanceof HTMLElement)) {
            imageFullSizeQueue.dequeue();
            continue;
        }

        const link = imgEl.closest && imgEl.closest('a.ivChecked');
        if (!link || imgEl.matches('.ClickAbleItem')) {
            imageFullSizeQueue.dequeue();
            continue;
        }

        try {
            // getSize는 {width, height, isLoaded} 반환을 가정
            await image.getSize(imgEl);

            if (ImageExists(imgEl) && !ImageBigSize(imgEl)) {
                // 실제로 full-size url 얻어오기
                await image.getFullSizeURL(link);
            }
        } catch (err) {
            console.error('Error while processing full-size for', imgEl, err);
            // 에러가 나도 큐는 다음으로 진행
        } finally {
            imageFullSizeQueue.dequeue();
        }

        // 부담을 줄이기 위한 짧은 딜레이 (네트워크 과부하 방지)
        await new Promise(r => setTimeout(r, 100));
    }
}

let container = document.querySelector('#ViewerJS');

function AddViewer() {
    container = document.querySelector('#ViewerJS');
    if (!container) return;

    // Initialize the Viewer instance once
    viewer = new Viewer(container, {

        // Only include images whose ancestor <a.ViewerGallery> has an ivImgUrl
        filter(img) {
            const link = img.closest('a.ViewerGallery');
            if (!link) return false;
            img.onclick = null;                // disable default click
            //return Boolean(link.dataset.ivImgUrl);
            return Boolean(link);
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
            bindKeyboardNavigation(viewer);
            bindArrowNavHandlers(viewer);
        },

        viewed({ detail: { image } }) {
            autoFitImage(viewer, image);
        },
        shown() {
            bindImagePreloadHandlers(viewer);
        }

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
    });
}


function bindImagePreloadHandlers(viewer) {
    const imgs = container.querySelectorAll('ul.viewer-list li img');
    imgs.forEach(img => {
        ['click', 'mouseover'].forEach(evt =>
            img.addEventListener(evt, () => addToQueue(img.getAttribute('data-original-url')), { once: true })
        );
    });
}

function bindArrowNavHandlers(viewer) {
    ['prev', 'next'].forEach(dir => {
        const btn = document.querySelector(`li.viewer-${dir}`);
        if (!btn) return;
        ['click', 'mouseover'].forEach(evt =>
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
    return GM_openInTab(url, openInBackground)
}


function GetOnline(url) {
    let el = url;
    console.log(el)

    GM_xmlhttpRequest({
        method: "GET",
        url: el,
        headers: { referer: el, origin: el },
        responseType: 'text',
        onload: function (resp) {
            let container = document.implementation.createHTMLDocument().documentElement;
            container.innerHTML = resp.responseText;
            console.log(container.querySelector('img.image.img-fluid'))
        }
    })

}

async function getURLFromPage(link, extractor, requestDetails) {
    const html = await getPageHtml({ url: link.url, ...requestDetails });
    const match = extractor.imageURLRegExp?.exec(html);
    let url = match ? (match.groups ? match.groups.url : match[1]) : null;
    if (!url) {
        console.error(`[Image Viewer] Failed to get URL from page source: ${link.url}`);
    }
    return url;
}


async function getPageHtml(requestDetails) {
    //console.log(requestDetails)
    const response = await request(requestDetails)
    //console.log('getPageHtml: ', response)
    return response.responseText
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

const getExtractor = urlExtractor.getHostExtractorMatcher()

function sortCaseInsensitive(items, getValue) {
    return items
        .map((value, index) => ({ index, value: getValue(value).toLowerCase() }))
        .sort((a, b) => {
            if (a.value > b.value) {
                return 1
            }
            if (a.value < b.value) {
                return -1
            }

            return 0
        })
        .map((m) => items[m.index])
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
}

const SELECTORS = {
    imageLink: `.${CLASSES.imageLink}`,
    imageOpenInNewLink: `.${CLASSES.imageLinkOpenInNew}`,
}

const EMPTY_SRC =
    'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEAAAAALAAAAAABAAEAAAI='

const TRANSITION_DURATION = 350

let PreLoadDB = []


const ExpandTag = new IntersectionObserver((entries, self) => {
    for (const entry of entries) {
        if (entry.isIntersecting) {
            if (entry.target.nodeName.toLowerCase() === 'div' && !entry.target.classList?.contains('unfolded')) {
                entry.target.click()
                self.unobserve(entry.target)
            }
        }
    }

}, { root: null, rootMargin: "0px 0px 500px 0px", threshold: 0.5 })


const IO = new IntersectionObserver((entries, self) => {
    for (const entry of entries) {
        const imgEl = entry.target;
        const link = imgEl.closest && imgEl.closest('a.ivChecked');

        if (entry.isIntersecting) {
            if (!imgEl.matches('.ClickAbleItem')) {
                image.getSize(imgEl).then(async () => {
                    if (ImageExists(imgEl) && !ImageBigSize(imgEl)) {
                        await image.getFullSizeURL(link);
                        self.unobserve(imgEl);
                    }
                }).catch(e => console.error(e));
            }
        } else {
            // 페이지 상에 보이지 않는 이미지는 큐로 대기(자동 시작 원하면 {autoStart:true})
            addToFullSizeQueue(imgEl, { autoStart: false });
            self.unobserve(imgEl);
        }
    }
}, { root: null, rootMargin: "500px 0px", threshold: 0 });


function AtoBLinks(link) {
    let linkAtoB = /(\/|=)(aHR0c[a-zA-z0-9]+={0,2})($|\/|\?|&|-?-?;?)/.exec(link.href)
    console.log(linkAtoB)
    link.href = atob(linkAtoB[2]).replace(/\?site=.+/, '')
    return link
}



const linkCommonClasses = [
    'iv-image-link',
    //'iv-icon--hover',
    //'iv-icon--size-button',
]



/**
 * Returns an array of { link, img, thumbnailUrl } for every candidate image
 * under `root` that hasn’t been marked with `processedClass` yet.
 */
function collectImageLinks(root, processedClass = 'ivChecked') {
    const items = [];

    root.querySelectorAll(`a:not(.${processedClass}) > img:not(.Error), a:not(.${processedClass}) > * > img:not(.Error)`)
        .forEach(img => {
            const link = img.closest('a');
            if (!link) return;

            // 1) Unwrap base64 redirect links
            const m = link.href.match(/redirect\.php\?url=(.*)/);
            if (m) {
                link.href = decodeURIComponent(m[1]).replace(/\&ver.*/, '');
            }

            // 2) Force HTTPS on known hosts
            ['fastpic', 'imagebam'].forEach(host => {
                if (link.href.startsWith(`http://${host}`)) {
                    link.href = link.href.replace(/^http:/, 'https:');
                }
                if (img.src.startsWith(`http://${host}`)) {
                    img.src = img.src.replace(/^http:/, 'https:');
                }
            });

            // 3) Resolve a “real” thumbnail URL:
            let thumb = img.src;
            if (thumb.startsWith('data:image') ||
                extractRootDomain(thumb) !== extractRootDomain(link.href)) {
                // look for lazy attributes
                Array.from(img.attributes).some(attr => {
                    if (lazyAttributesMap[attr.name]) {
                        thumb = img.getAttribute(attr.name);
                        return true;
                    }
                });
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


        link.classList.add('ViewerGallery')
        IO.observe(img);
    }

    // 3) Return the items for any further use
    return items;
}

function AddEvent() {
    document.addEventListener('click', (event) => {
        //console.log(event.target.nodeName.toLowerCase() === 'figcaption' , event.target.nodeName.toLowerCase())
        //console.log(event.target)
        if (event.target.closest('.ViewerGallery')) {
            event.preventDefault()
            // 페이지 로드 후 시작
            document.addEventListener('DOMContentLoaded', watchForViewerContainer);

            //event.stopPropagation()
            viewer.update()
            //loadImage(event.target.closest('.ViewerGallery').getAttribute('data-iv-img-url'))
            viewer.view(event.target.getAttribute('ViewIndex'))
        }
    }, true)

}


function watchForViewerContainer() {
    const checkExisting = document.querySelector('.viewer-container');
    if (checkExisting) {
        observeViewerModal(checkExisting);
        return;
    }

    // 아직 없으면 DOM 변화를 감시해서 생성될 때까지 대기
    const bodyObserver = new MutationObserver((mutations, obs) => {
        const viewer = document.querySelector('.viewer-container');
        if (viewer) {
            observeViewerModal(viewer);
            obs.disconnect(); // 찾았으니 감시 중단
        }
    });

    bodyObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
}

function observeViewerModal(viewer) {
    console.log('Viewer container found, observing aria-modal changes');

    const modalObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'aria-modal') {
                const isOpen = viewer.getAttribute('aria-modal') === 'true';
                if (isOpen) {
                    console.log('뷰어 열림 → 큐 처리 재개');
                    pauseFullSizeProcessing = false;
                    startFullSizeProcessing();
                } else {
                    console.log('뷰어 닫힘 → 큐 처리 일시정지');
                    pauseFullSizeProcessingNow();
                }
            }
        }
    });

    modalObserver.observe(viewer, {
        attributes: true,
        attributeFilter: ['aria-modal']
    });
}




function ImageBigSize(image) {
    let big = false
    let W = image.naturalWidth;
    let H = image.naturalHeight;

    if (W >= 800) {
        big = true;
    }
    else if (W >= 600 && H >= 800) {
        big = true;
    }
    return big
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
    const result = dimensions.some(dim => dim.w === W && dim.h === H)

    if (result) {
        const link = image.closest('a');
        link.classList.remove('ViewerGallery')
        viewer.update()
    }
    return !result;
}



function MakeIndexAll() {
    console.log('Start All Making Index')
    let figureTag = document.querySelectorAll('.GridBox figure.effect-layla')
    Array.from(figureTag).forEach((e, index) => {
        e.querySelector('figcaption').setAttribute('ViewIndex', index)
    })
}





function CSSfigure(el, Image) {
    let ViewerTag = document.createElement('div')
    let figureTag = document.createElement('figure')
    let figcaptionTag = document.createElement('figcaption')
    Image.removeAttribute('height')
    Image.removeAttribute('width')
    //Image.style.cssText = `min-width: 100px; min-height: 100px;`
    ViewerTag.classList.add('GridBox')
    figureTag.classList.add('effect-layla')
    ViewerTag.appendChild(figureTag)
    Image.parentNode.replaceChild(ViewerTag, Image)
    figureTag.appendChild(Image)
    Image.closest('figure').insertAdjacentHTML('beforeend', '<figcaption></>')
    return ViewerTag
}



const image = {
    async getFullSizeURL(link) {
        let imageURL = link.dataset.ivImgUrl

        if (imageURL) {
            link.dataset.ivImgUrl = imageURL
            return imageURL
        }

        const thumbnailURL = link.dataset.ivThumbnail
        const imageHost = link.dataset.ivHost

        if (!thumbnailURL || !imageHost) {
            throw new Error(
                '[image-viewer] Either thumbnail URL or host is not set'
            )
        }

        imageURL = await urlExtractor.getImageURL({
            url: link.href,
            thumbnailURL,
            host: imageHost,
        })

        //console.log('urlExtractor: ', imageURL)

        if (!imageURL) {
            image.markAsBroken(link)
            link.classList.remove('ViewerGallery')
            viewer.update()
            return
        }

        try {
            const extractor = urlExtractor.getExtractorByHost(imageHost)
            if (extractor.viewMode === 'origin-download') {
                //imageURL = await image.CheckOnline(imageURL)
                //console.log(imageURL)
                imageURL = await image.loadAsBlob(imageURL)
                //console.log(imageURL)
            }

        } catch {
            console.log(imageURL)
            image.markAsBroken(link)
            link.setAttribute('target', '_blank')
        }

        link.dataset.ivImgUrl = imageURL
        return imageURL
    },

    preload(url, onSizeGet) {
        return new Promise((resolve, reject) => {
            const imageObject = new Image()

            imageObject.addEventListener('load', () => resolve())
            imageObject.addEventListener('error', reject)

            imageObject.src = url

            if (onSizeGet) {
                image.getSize(imageObject).then(onSizeGet)
            }
        })
    },


    CheckOnline(url) {
        return new Promise((resolve, reject) => {
            console.log(url)
            GM_xmlhttpRequest({
                method: "GET",
                url: url,
                headers: { referer: url, origin: url },
                responseType: 'blob',
                timeout: 600000,
                onload: function (resp) {
                    console.log(url, resp.status)
                    //resolve(resp.status)
                    if (resp.status == 200) {
                        resolve(window.URL.createObjectURL(resp.response))
                    }
                    else {
                        console.log(url, resp.status)
                        reject(resp.status)
                    }
                },
                onerror: function (error) {
                    console.log(url, error.status)
                    reject(error);
                },
                ontimeout: function (error) {
                    console.log(url, 'timeout')
                    reject(error);
                }
            })
        })
    },

    async loadAsBlob(url) {
        const origin = new URL(url).origin

        const response = await request({
            url,
            headers: {
                referer: origin,
                origin,
            },
            responseType: 'blob',
        })
        //console.log(response, response.status)
        return URL.createObjectURL(response.response)
    },

    getSize(img) {
        return new Promise((resolve) => {
            if (img.complete) {
                resolve({ width: img.naturalWidth, height: img.naturalHeight, isLoaded: img.complete })
            }
            else {
                img.onload = () => {
                    resolve({ width: img.naturalWidth, height: img.naturalHeight, isLoaded: img.complete })
                }
            }
        })
    },

    markAsBroken(link) {
        link.classList.remove('js-image-link')
        link.removeAttribute('title')
    },
}


const mutCallback = (mutationsList, observer) => {
    let AddList = []
    for (const { addedNodes } of mutationsList) {
        for (const node of addedNodes) {
            if (!(node instanceof HTMLElement)) continue;
            if (node.nodeType == Node.ELEMENT_NODE && node.nodeName && node.parentNode?.querySelector('img')) {

                //console.log(node, node.nodeName, node.parentNode?.querySelector('img'))
                for (const e of node.parentNode?.querySelectorAll('img:not(.Error)')) {
                    if (e.closest('a') && !e.closest('a').classList?.contains('ivChecked')) {
                        let P = e.closest('a').parentElement.parentElement
                        if (P.nodeName !== 'BODY') {
                            AddList.push(P)
                        }
                    }
                }
            }
        }
    }

    if (AddList.length) {
        let unique = [...new Set(AddList)]

        for (let x of unique) {
            queue.enqueue(x)
        }
        //console.log(ManagementWorking , queue.peek())
        if (!ManagementWorking && queue.peek()) {
            Management()
        }
    }
}

const attributesobserver = new MutationObserver(mutCallback)

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

document.addEventListener("readystatechange", () => {
    console.log("Current state:", document.readyState);

    if (document.readyState === "complete") {
        viewerCSS()
        Start()
    }
});

async function Start() {
    startTime = performance.now()
    let ImageLinks = []
    if (/javarchive\.com\/.*\.html/.test(PageURL)) {
        ImageLinks = document.querySelectorAll('a[href*="https://pixhost.to/show"]')
        Array.from(ImageLinks).forEach(async (el) => {
            if (el.innerText === 'CLICK HERE!') {
                el.children[0].remove()
                const ImageTag = document.createElement('img')
                ImageTag.src = await CheckThumbnail(el.href)
                el.appendChild(ImageTag)
            }
        })
        ImageLinks = document.querySelectorAll('a[href*="img.javstore.net/images"]')
        Array.from(ImageLinks).forEach(el => {
            if (el.innerText === 'CLICK HERE!') {
                el.children[0].remove()
                const ImageTag = document.createElement('img')
                const thumbnailExtension = el.href.split('.').pop() ?? ''
                ImageTag.src = el.href.replace('.' + thumbnailExtension, '.th.' + thumbnailExtension)
                el.appendChild(ImageTag)
            }
        })
    }

    let Ex = []
    if (/(rutracker\.org|pornolab\.net|trupornolabs.org)/.test(PageURL)) {
        let AutoExpandTag = '.sp-head.folded.clickable:not(.unfolded)'
        Ex = [...document.querySelectorAll(AutoExpandTag)]
        Ex.forEach(el => {
            //ExpandTag.observe(el)
            el.click()
        })
    }


    if (!Ex?.length && !CheckViewerList(document.body)) {
        return (`No Image Viewer Item`)
    }

    console.log('Start Image Viewer!!!!!!')

    AddStyles(styles, 'Viewer')


    document.body.setAttribute('id', 'ViewerJS')

    AddViewer()

    AddEvent()


    Array.from(document.querySelectorAll('img[src*="filesor.com"]')).forEach((el) => {
        el.replaceWith(el)
    })

    initViewer(document.body)
        .then(async e => {
            if (e.length) {
                attributesobserver.observe(document.body, { subtree: true, childList: true })
            }
            else if (Ex?.length) {
                attributesobserver.observe(document.body, { subtree: true, childList: true })
            }
        })
        .catch(() => {

        });

    console.log(`Start Logic time: ${performance.now() - startTime} ms`);

}


function CheckThumbnail(url) {
    let Thumbnail, imageName
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: "GET",
            url: url,
            responseType: 'document',
            headers: { referer: document.location.href, origin: document.location.href },
            onload: async function (resp) {
                if (resp.response) {
                    imageName = url.split('/').pop()?.replace('.html', '')
                    Thumbnail = resp.response.querySelector('img[src*="' + imageName + '"]')
                    if (Thumbnail) {
                        resolve(Thumbnail.src.replace('//img', '//t').replace('/images/', '/thumbs/'))
                    }
                }
                else {
                    console.log(resp)
                    reject(resp.response);
                }
            },
            onerror: function (error) {
                console.log(error)
                CheckThumbnail(url)
                //reject(resp.response);
            }
        })
    })
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
            img.src = PreLoadDB[0]
        }).then(() => {
            PreLoadDB.shift()
            if (PreLoadDB?.length > 0) {
                PreloadImages(PreLoadDB)
            }
        })
            .catch((img) => {
                console.log(img)
                img.style.backgroundImage = "url(" + PreLoadDB[0] + ")"
            })
    }
}
