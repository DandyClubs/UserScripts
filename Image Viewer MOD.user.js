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
// @grant        GM_getResourceText
// @require      https://cdnjs.cloudflare.com/ajax/libs/viewerjs/1.11.7/viewer.min.js
// @require      https://raw.githubusercontent.com/DandyClubs/RootDomain/main/RootDomain.js
// @noframes
// ==/UserScript==


const viewerCSS = function () {
    let css = document.createElement('link')
    css.href = 'https://cdnjs.cloudflare.com/ajax/libs/viewerjs/1.11.7/viewer.css'
    css.rel = 'stylesheet'
    css.type = 'text/css'
    document.getElementsByTagName('head')[0].appendChild(css)
}

const PageURL = window.location !== window.parent.location ? document.referrer : document.location.href;
const lazyAttributes = [
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

const enabledHosts = [
    "22pixx",
    "37xpics",
    "i14xpicsspace",
    "3xplanetimg",
    "adult-images",
    "clubwarp",
    "crazyimg",
    "dmm",
    "fastpic",
    "fastpicDirect",
    "javstore",
    "imagebam",
    "imagebamview",
    "imageban",
    "imagebanDirect",
    "imagecurl",
    "imagetwist",
    "imagetwistBased",
    "imagevenue",
    "imgadult",
    "imgbb",
    "imgbox",
    "imgbum",
    "imgcloud",
    "imgdrive",
    "imagehaha",
    "imgspice",
    "imgtaxi",
    "imgtraffic",
    "filesor",
    "piccash",
    "picforall",
    "pixhost",
    "picszone",
    "pornohosting",
    "postimg",
    "turboimagehost",
    "turboimg",
    "vfl",
    "picstate",
    "picstateDirect",
    "xxxwebdlxxx"
]



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
            initViewer(enabledHosts, Q);
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

const GM_METHOD_MAP = {
    GM_openInTab: 'openInTab',
    GM_xmlhttpRequest: 'xmlHttpRequest',
}

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



function getGM4PolyfilledMethod(methodName) {
    const gm4MethodName = GM_METHOD_MAP[methodName]

    if (GM !== undefined && gm4MethodName in GM) {
        return GM[gm4MethodName]
    } else if (methodName in window) {
        return function (...arguments_) {
            return new Promise((resolve, reject) => {
                try {
                    console.log(window[methodName], arguments_)
                    resolve(window[methodName].apply(null, arguments_))
                } catch (error) {
                    reject(error)
                }
            })
        }
    }

    return async function () {
        throw new Error(`Method ${methodName} is not available. Missing @grant?`)
    }
}


let request = (details) => {
    request = getGM4PolyfilledMethod('GM_xmlhttpRequest')

    return request(details)
}

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


//GetOnline('https://fastpic.org/view/124/2025/0330/02960b4a6091ebded4c046809d4f0629.jpeg.html')

async function getURLFromPage(link, extractor, requestDetails) {

    const html = await getPageHtml({ url: link.url, ...requestDetails })


    const match = extractor.imageURLRegExp?.exec(html)

    let url

    if (match) {
        url = match.groups ? match.groups.url : match[1]
    }

    if (!url) {
        console.error(
            `[image-viewer] Failed to get URL from page source: ${link.url}`
        )
    }

    return url
}


async function getPageHtml(requestDetails) {
    //console.log(requestDetails)
    const response = await request(requestDetails)
    //console.log('getPageHtml: ', response)
    return response.responseText
}

const imgbum = {
    id: 'imgbum',
    name: 'imgbum.ru',
    linkRegExp: /imgbum\.(net|ru)/,

    async getURL(link) {
        return link.thumbnailURL.replace('-thumb', '')
    },
}
const i3xplanetimg = {
    id: '3xplanetimg',
    name: '3xplanetimg.com',
    linkRegExp: /3xplanet\.net\/viewimage\/.*\.html/,

    async getURL(link) {
        return link.thumbnailURL.replace(/\/s200\//, '/s0/')
    },
}
const i22pixx = {
    id: '22pixx',
    name: '22pixx.xyz',
    linkRegExp: /22pixx\.xyz\/images\/.*\.html/,

    async getURL(link) {
        return link.thumbnailURL.replace(/\/os\//, '/o/')
    },
}

const i37xpics = {
    id: '37xpics',
    name: '37xpics.space',
    linkRegExp: /37xpics\.space\/image/,

    async getURL(link) {
        return link.thumbnailURL.replace('.th.', '.')
    },
}

const i14xpicsspace = {
    id: 'i14xpicsspace',
    name: '14xpics.space',
    linkRegExp: /14xpics\.space\/image/,

    async getURL(link) {
        return link.thumbnailURL.replace('.th.', '.')
    },
}

const imagecurl = {
    id: 'imagecurl',
    name: 'imagecurl.com',
    linkRegExp: /imagecurl\.com\/viewer\.php\?file/,

    async getURL(link) {
        const [, root, domain, filename, ext] =
            /(https?:\/\/).*(imagecurl\.com\/images\/)(.*)_thumb(\.jpg)/.exec(link.thumbnailURL) || []
        return `${root}cdn.${domain}${filename}${ext}`
    },
}

const adultImages = {
    id: 'adult-images',
    name: 'Adult-Images.ru',
    linkRegExp: /\/(adult-images|money-pic)\.ru/,

    getURL: imgbum.getURL,
}

const clubwarp = {
    id: 'clubwarp',
    name: 'clubwarp.com',
    linkRegExp: /i\.clubwarp\.com\/image/,

    getURL(link) {
        return link.thumbnailURL.replace('.th.', '.md.')
    },
}

const crazyimg = {
    id: 'crazyimg',
    name: 'crazyimg.com',
    linkRegExp: /crazyimg\.com\/images/,

    getURL(link) {
        return link.thumbnailURL.replace('_tn', '')
    },
}

const dmm = {
    id: 'dmm',
    name: 'dmm.co.jp',
    linkRegExp: /pics\.dmm\.co\.jp\/.+\.jpg/,
    getURL(link) {
        return link.url
    },
}

const picstateDirect = {
    id: 'picstateDirect',
    name: 'picstate.com',
    linkRegExp: /picstate\.com\/files\/.*\.jpg/,
    getURL(link) {
        return link.url
    },
}

const picstate = {
    id: 'picstate',
    name: 'picstate,com',
    linkRegExp: /picstate\.com\/view\/full/,
    getURL(link) {
        return link.thumbnailURL.replace('thumbs/small/', '')
    },
}

const imgcloud = {
    id: 'imgcloud',
    name: 'imgcloud.pw',
    linkRegExp: /imgcloud\.pw\/image/,

    getURL(link) {
        return link.thumbnailURL.replace('.md.', '.').replace('.th.', '.')
    },
}

const fastpic = {
    id: 'fastpic',
    name: 'FastPic',
    linkRegExp: /fastpic\.(?:ru|org)\/view/,
    imageURLRegExp: /src="(?<url>http[^"]+)" class="image img-fluid"/,
    getURL: getURLFromPage,
}

const URL_PARTS_REGEXP = /i(\d+).+\.(ru|org)\/big(\/\d+\/\d+\/).+\/([^\/]+)$/

const fastpicDirect = {
    id: 'fastpicDirect',
    name: 'FastPic (direct link)',
    linkRegExp: /fastpic\.(?:ru|org)\/big/,

    async getURL(link) {
        const [, index, domain, date, filename] =
            URL_PARTS_REGEXP.exec(link.url) || []

        const url = `https://fastpic.${domain}/view/${index}${date}${filename}.html`
        //console.log(url)
        return fastpic.getURL({ ...link, url }, fastpic)
    },
}

const javstore = {
    id: 'javstore',
    name: 'javstore',
    linkRegExp: /img\.javstore\.net/,

    async getURL(link) {
        return link.thumbnailURL.replace('.th.', '.')
    },
}

const imagebam = {
    id: 'imagebam',
    name: 'ImageBam',
    linkRegExp: /www\.imagebam\.com\//,
    imageURLRegExp: /src="(?<url>[^"]+)".+class="main-image/,

    async getURL(link, extractor) {
        return getURLFromPage(link, extractor, {
            cookie: 'nsfw_inter=1',
        })
    },
}

const imagebamview = {
    id: 'imagebamview',
    name: 'ImageBamView',
    linkRegExp: /images\d\.imagebam\.com\//,

    getURL(link) {
        console.log(link.url)
        return link.url
    },
}

const filesor = {
    id: 'filesor',
    name: 'filesor',
    linkRegExp: /pimpandhost\.com\/image/,

    async getURL(link) {
        return link.thumbnailURL.replace(/_(l|m|s)\./, '.')
    },
}

const DATE_PATTERN = /(\d{4})\.(\d{2})\.(\d{2})/

const imageban = {
    id: 'imageban',
    name: 'ImageBan.ru',
    linkRegExp: /imageban\.ru\/show/,

    async getURL(link) {
        return link.thumbnailURL
            .replace('thumbs', 'out')
            .replace(DATE_PATTERN, '$1/$2/$3')
    },
}

const imagebanDirect = {
    id: 'imagebanDirect',
    name: 'ImageBan.ru (direct link)',
    linkRegExp: /imageban\.ru\/out/,

    async getURL(link) {
        return link.url
    },
}

const imagetwist = {
    id: 'imagetwist',
    name: 'ImageTwist',
    linkRegExp: /imagetwist\.com/,
    viewMode: 'origin-download',

    async getURL(link) {
        const imageName = link.url.split('/').pop()?.replace('.html', '')
        const imageExtension = imageName?.split('.').pop()?.replace(/&.*/, '') ?? ''
        const thumbnailExtension = link.thumbnailURL.split('.').pop() ?? ''
        const imageUrl = link.thumbnailURL
            .replace('/th/', '/i/')
            .slice(0, -thumbnailExtension.length)
        //console.log(link.thumbnailURL, imageName, imageExtension, imageUrl, `${imageUrl}${imageExtension}/${imageName}`)

        return `${imageUrl}${imageExtension}/${imageName}`
    },
}

const HOST_REPLACE_REG_EXP = /(picturelol|picshick|imageshimage)/

const imagetwistBased = {
    id: 'imagetwistBased',
    name: 'ImageTwist based (legacy)',
    hosts: ['Picturelol.com', 'PicShick.com', 'Imageshimage.com'],
    linkRegExp: /(picturelol|picshick|imageshimage)\.com/,
    viewMode: 'origin-download',

    async getURL(link) {
        const imageName = link.url.split('/').pop()
        const imageExtension = imageName?.split('.').pop()?.replace(/&.*/, '') ?? ''
        const thumbnailExtension = link.thumbnailURL.split('.').pop() ?? ''
        const imageUrl = link.thumbnailURL
            .replace('/th/', '/i/')
            .slice(0, -thumbnailExtension.length)
            .replace(HOST_REPLACE_REG_EXP, 'imagetwist')

        return `${imageUrl}${imageExtension}/${imageName}`
    },
}

const imagevenue = {
    id: 'imagevenue',
    name: 'ImageVenue.com',
    linkRegExp: /imagevenue\.com\//,
    imageURLRegExp: /<img src="(?<url>[^"]*).*id="main-image/im,
    getURL: getURLFromPage,
}

const imgadult = {
    id: 'imgadult',
    name: 'ImgAdult',
    linkRegExp: /imgadult\.com/,

    async getURL(link) {
        return link.thumbnailURL.replace('/small/', '/big/')
    },
}


const xxxwebdlxxx = {
    id: 'xxxwebdlxxx',
    name: 'xxxwebdlxxx',
    linkRegExp: /xxxwebdlxxx\.org/,

    async getURL(link) {
        return link.thumbnailURL.replace('/small/', '/big/')
    },
}

const imgbb = {
    id: 'imgbb',
    name: 'ImgBB',
    linkRegExp: /ibb\.co/,
    imageURLRegExp: /rel="image_src" href="(?<url>http[^"]+)"/,

    async getURL(link) {
        if (link.thumbnailURL.includes('//thumb')) {
            return link.thumbnailURL.replace('//thumb', '//image')
        }

        return getURLFromPage(link, imgbb)
    },
}

const imgbox = {
    id: 'imgbox',
    name: 'imgbox',
    linkRegExp: /imgbox\.com/,

    async getURL(link) {
        if (link.thumbnailURL.includes('/thumbs')) {
            return link.thumbnailURL.replace('/thumbs', '/images').replace('_t', '_o')
        }
        else {
            return link.url
        }
    },
}

const imgdrive = {
    id: 'imgdrive',
    name: 'ImgDrive.net',
    linkRegExp: /imgdrive\.net/,
    viewMode: 'origin-download',

    async getURL(link) {
        return link.thumbnailURL
            .replace('/small/', '/big/')
            .replace('/small-medium/', '/big/')
    },
}

const imagehaha = {
    id: 'imagehaha',
    name: 'imagehaha.com',
    linkRegExp: /imagehaha\.com\//,
    imageURLRegExp: /<img src="(?<url>[^"]*)/im,
    viewMode: 'origin-download',
    getURL: getURLFromPage,
}

const imgspice = {
    id: 'imgspice',
    name: 'ImgSpice',
    linkRegExp: /imgspice\.com/,
    viewMode: 'origin-download',

    async getURL(link) {
        return link.thumbnailURL
            .replace(/_t\./, '.')
    },
}
const imgtaxi = {
    id: 'imgtaxi',
    name: 'ImgTaxi.com',
    linkRegExp: /imgtaxi\.com/,
    viewMode: 'origin-download',
    getURL: imgdrive.getURL,
}


const imgtraffic = {
    id: 'imgtraffic',
    name: 'imgtraffic.com',
    linkRegExp: /imgtraffic\.com/,
    async getURL(link) {
        return link.thumbnailURL.replace('/1s/', '/1/')
    },
}

const piccash = {
    id: 'piccash',
    name: 'PicCash',
    linkRegExp: /piccash\.net/,

    async getURL(link) {
        return link.thumbnailURL.replace('_thumb', '_full').replace('-thumb', '')
    },
}

const picforall = {
    id: 'picforall',
    name: 'PicForAll',
    hosts: [
        'freescreens.ru',
        'imgclick.ru',
        'picclick.ru',
        'payforpic.ru',
        'picforall.ru',
        'imgbase.ru',
    ],
    linkRegExp: /(freescreens|imgclick|picclick|payforpic|picforall|imgbase)\.ru/,
    getURL: imgbum.getURL,
}

const pixhost = {
    id: 'pixhost',
    name: 'PixHost',
    linkRegExp: /pixhost\.to\/(show|images)/,
    imageURLRegExp: /class="image-img"\ssrc="(?<url>[^"]+)"/,

    async getURL(link) {
        if (link.thumbnailURL.includes('pixhost')) {
            return link.thumbnailURL.replace('//t', '//img').replace('/thumbs/', '/images/')
        }
        else {
            return await getURLFromPage(link, pixhost)
        }
    },
}
const picszone = {
    id: 'picszone',
    name: 'PicsZone',
    linkRegExp: /picszone\.net\/viewer\.php\?file/,
    imageURLRegExp: /class="image-img"\ssrc="(?<url>[^"]+)"/,

    async getURL(link) {
        if (link.thumbnailURL.includes('picszone')) {
            return link.thumbnailURL
        }
    },
}

const pornohosting = {
    id: 'pornohosting',
    name: 'pornohosting',
    linkRegExp: /pornohosting\.ru\/d\+/,

    async getURL(link) {
        return link.thumbnailURL.replace('-thumb', '')
    },
}


const postimg = {
    id: 'postimg',
    name: 'postimg',
    linkRegExp: /postimg\.cc/,
    imageURLRegExp: /<a href="(?<url>[^"]+)"\sid="download"/,
    async getURL(link, extractor) {
        return await getURLFromPage(link, extractor)
    },
}

const turboimagehost = {
    id: 'turboimagehost',
    name: 'TurboImageHost',
    hosts: [
        'turboimagehost.com',
        'turboimg.net',
    ],
    linkRegExp: /turboimagehost\.com\/p/,
    imageURLRegExp: /rel="image_src" href="(?<url>http[^"]+)"/,
    //viewMode: 'new-tab',
    getURL: getURLFromPage,
}

const REMOVE_SUFFIX_REGEXP = /_.?(.+)$/

const vfl = {
    id: 'vfl',
    name: 'VFL.Ru',
    linkRegExp: /^http:\/\/vfl\.ru/,

    async getURL(link) {
        return link.thumbnailURL.replace(REMOVE_SUFFIX_REGEXP, '$1')
    },
}

const hostExtractors = /* #__PURE__ */ Object.freeze({
    __proto__: null,
    i22pixx,
    i37xpics,
    i14xpicsspace,
    i3xplanetimg,
    adultImages,
    clubwarp,
    crazyimg,
    dmm,
    fastpic,
    fastpicDirect,
    javstore,
    imagebam,
    imagebamview,
    imageban,
    imagebanDirect,
    imagetwist,
    imagetwistBased,
    imagevenue,
    imagehaha,
    imgadult,
    imgbb,
    imgbox,
    imgbum,
    imgcloud,
    imagecurl,
    imgdrive,
    imgspice,
    imgtaxi,
    imgtraffic,
    filesor,
    piccash,
    picforall,
    pixhost,
    picszone,
    pornohosting,
    postimg,
    turboimagehost,
    vfl,
    picstate,
    picstateDirect,
    xxxwebdlxxx,
})

let extractorsActive = []

const extractors = Object.values(hostExtractors).filter(Boolean)

const extractorsByID = extractors.reduce((result, extractor) => {
    result[extractor.id] = extractor
    return result
}, {})

const urlExtractor = {
    getImageHostsMetadata() {
        const result = extractors.map(({ id, name, hosts }) => ({
            id,
            name,
            description: hosts ? hosts.join(', ') : '',
        }))

        return sortCaseInsensitive(result, ({ name }) => name)
    },

    async getImageURL(link) {
        const extractor = extractorsByID[link.host]

        const imageURL = await extractor.getURL(link, extractor)

        if (!imageURL) {
            console.error(
                `[image-viewer] Failed to get URL for ${link.host}:${link.url}`
            )
        }
        //console.log('getImageURL: ', imageURL)
        return imageURL
    },

    getExtractorByHost(hostId) {
        return extractorsByID[hostId]
    },

    getHostExtractorMatcher(enabledHosts) {
        extractorsActive = extractors.filter((extractor) =>
            enabledHosts.includes(extractor.id)
        )
        let previousExtractor

        return (url) => {
            if (previousExtractor && previousExtractor.linkRegExp.test(url)) {
                return previousExtractor
            }

            const extractor = extractorsActive.find((extractor) =>
                extractor.linkRegExp.test(url)
            )

            if (extractor) {
                previousExtractor = extractor

                return extractor
            }
        }
    },
}

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

const currentHost = unsafeWindow.location.host
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
        //if (entry.isIntersecting) {
        let Image = entry.target
        let Link = Image.closest('a.ivChecked')
        if (!Image.matches('.ClickAbleItem')) {
            image.getSize(Image).then(async (re) => {
                //console.log(ImageExists(Image) , ImageBigSize(Image))
                if (ImageExists(Image) && !ImageBigSize(Image)) {
                    await image.getFullSizeURL(Link)
                    self.unobserve(entry.target)
                }
            })
        }
        //}
    }

}, { root: null, rootMargin: "0px 0px", threshold: 0 })

function AtoBLinks(link) {
    let linkAtoB = /(\/|=)(aHR0c[a-zA-z0-9]+={0,2})($|\/|\?|&|-?-?;?)/.exec(link.href)
    console.log(linkAtoB)
    link.href = atob(linkAtoB[2]).replace(/\?site=.+/, '')
    return link
}

const getExtractor = urlExtractor.getHostExtractorMatcher(enabledHosts)
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


function CheckViewerList(enabledHosts, node) {
    const items = collectImageLinks(node);
    // Filter by extractor availability:
    return items.some(({ link }) => Boolean(getExtractor(link.href)));
}

async function initViewer(enabledHosts, node) {
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
            //event.stopPropagation()
            viewer.update()
            //loadImage(event.target.closest('.ViewerGallery').getAttribute('data-iv-img-url'))
            viewer.view(event.target.getAttribute('ViewIndex'))
        }
    }, true)

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
    return !dimensions.some(dim => dim.w === W && dim.h === H);
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

        if (imageURL) {
            link.classList.add('ViewerGallery')
        }



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


    if (!Ex?.length && !CheckViewerList(enabledHosts, document.body)) {
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

    initViewer(enabledHosts, document.body)
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
