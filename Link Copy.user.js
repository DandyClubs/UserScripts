// ==UserScript==
// @name         Link Copy (indexedDB)
// @version      2025.10.08
// @description  링크 복사
// @author       DandyClubs
// @include      /naughtyblog\.(org|my)/
// @include      /(epicomg\.com|fapfiles\.org|teenbox\.org)/
// @include      /maxjav\.(com|xyz)/
// @include      /(8kcosplay\.com|blogjav\.net|thotsgirls\.com)/
// @include      /top-modelz\.org/
// @include      /wetholefans\.com/
// @include      /pornchil\.com\/.*/
// @include      /pornrips\.cc/
// @include      /javpink\.com/
// @include      /siteripbb\.org/
// @include      /freepornstreams\.org/
// @include      https://javfree.me/*
// @include      /pornobunny\.org/
// @include      /adult-porno\.org/
// @include      /pornrip\.cc/
// @include      /misskon\.com/
// @include      /fhdporn\.video/
// @include      /asianscan\.biz/
// @include      /sharepornlink\.com\/.*/
// @include      https://javarchive.com/*
// @include      /0xxx\.(ws|li)/
// @include      /(hpjav|hpav)\.tv/
// @include      /kbjme\.com\/\d+/
// @include      /(vipbj\.[a-zA-Z]+|avtv\..+)/
// @include      /av18plus\.com/
// @include      /all4jp\.com/
// @include      /jappydolls\.net/
// @include      /x-idol\.net/
// @include      https://nitroflareporn.com/*
// @include      https://xscandals.com/*
// @include      /javpop\.(link|mov)/
// @include      https://aincest.com/*
// @include      https://models-nudeteen.org/*
// @include      /(bestgirlsexy|bestvideosexy)\.com/
// @include      https://k2sporn.com/*
// @include      https://hidefporn.ws/*
// @include      https://ultoporn.com/*
// @include      https://3xplanet.net/*
// @include      https://jtiny.org/*
// @include      https://maddawgjav.net/*
// @include      /(clubwarp|downloaddex)\.com/
// @include      https://cosplay-jav.com/*
// @include      https://girlscanner.org/*
// @include      /cosplay\.jav\.pw/
// @include      https://fapit.org/*
// @include      https://pornofetishx.com/*
// @include      https://www.nicesss.com/*
// @include      https://www.nicewww.com/*
// @include      https://www.xtvtv.com/*
// @include      https://softmodels.net/*
// @exclude      https://x-idol.net/
// @exclude      https://x-idol.net/?paged=*
// @exclude      https://www.google.com/search*
// @require      https://raw.githubusercontent.com/DandyClubs/RootDomain/main/RootDomain.js
// @require      https://raw.githubusercontent.com/DandyClubs/CopyLinksCommonJS/main/CopyLinksCommonJS.js
// @require      https://raw.githubusercontent.com/DandyClubs/keyvent.js/master/keyvent.js
// @require      https://raw.githubusercontent.com/DandyClubs/Filter/main/Filters.js
// @grant		 GM_addStyle
// @grant        GM_setClipboard
// @grant        GM_xmlhttpRequest
// @grant        GM_openInTab
// @grant        GM_getResourceText
// @run-at       document-start
// @connect      *
// @noframes
// @license      MIT
// ==/UserScript==


if (window.top !== window.self) {
    // iframe 안이면 종료
    return;
}

const FontAwesomeCSS = function () {
    let css = document.createElement('link');
    css.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css';
    css.rel = 'stylesheet';
    css.type = 'text/css';
    document.getElementsByTagName('head')[0].appendChild(css);
};

GM_addStyle(`
@import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c&family=Nanum+Gothic&family=Nanum+Gothic+Coding&family=Noto+Sans&display=swap');



.CloseIcon, .CopyIcon, .Minus, .GetTitle, .IDSearch {
    text-align: center;
    cursor: pointer;
    margin: .25em;
    color: LimeGreen !important;
    font-style: initial !important;
    text-shadow: 1px 1px 1px red, 0 0 2px blue, 0 0 1px black;
}

.IconSet {
    word-spacing: .5em;
    white-space : nowrap;
    top: var(--SetTop);
    left: var(--SetLeft);
    position: fixed !important;
    padding: 0 .25em;
    margin: .25em;
    display: flex;
	flex-wrap: nowrap;
	justify-content: center;
	align-items: center;
	gap: 5px;
    border-radius: .25em !important;
    -webkit-box-sizing: border-box !important;
    box-sizing: border-box !important;
    background-color: rgba(0,0,0,0.5) !important;
    z-index: 999999;
}

.IconSet * {
margin: .25em;
}

.AutoClose. .AutoCopy {
	scale: 1.2;
    font-style: normal !important;
}

.AutoClose.On, .AutoCopy.On {
    color: LawnGreen !important;
    opacity: 1;
    font-style: normal !important;
}

.AutoClose.Off , .AutoCopy.Off{
    color: LightGrey !important;
    opacity: 0.25;
    font-style: normal !important;
}

.CopyNotice {
    font-family: 'Nanum Gothic', 'M PLUS Rounded 1c', 'Noto Sans', sans-serif !important;
    margin-left: auto;
    margin-right: auto;
    border-radius: .25em;
    color: white !important;
    background: rgba(255, 165, 0, .95) !important;
    position: fixed !important;
    white-space: pre;
 	text-shadow: initial !important;
    text-align: left;
    line-height: 1em;
	font-weight: 500 !important;
	font-style: initial !important;
    display: -webkit-box;
    -webkit-line-clamp: 15;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    z-index: 999999;
    height: 0;
    opacity: 0;
    transition: height 0.4s ease, opacity 0.4s ease;
}

.CopyNotice .copyText {
  padding: .25rem .5rem;
  z-index: 999999;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
    -webkit-line-clamp: 15;
    -webkit-box-orient: vertical;
}

.LinkCopyCenterBox {
	right: 50%;
	left: auto;
	top: 0;
	max-width: max-content;
	position: fixed !important;
	display: flex;
	flex-wrap: nowrap;
	justify-content: space-around;
	align-items: baseline;
	color: LimeGreen !important;
    padding: .25em;
    margin: .25em;
	border-radius: .25em !important;
	-webkit-box-sizing: border-box !important;
	box-sizing: border-box !important;
	background-color: rgba(0,0,0,0.5) !important;
    text-wrap: nowrap;
    z-index: 999999;
}
.LinkCopyCenterBox * {
	margin: 0 .25em;
	padding: 0 .25em;
}

.ToTop {
    font-style: initial !important;
    text-align: center;
    cursor: pointer;
    color: LimeGreen !important;
    background-color:transparent !important;
    text-shadow: 1px 1px 1px red, 0 0 2px blue, 0 0 1px black;
    padding: 0 .25em;
}

.State {
    display: inline-block;
    font-weight: bold;
    text-align: right;
    vertical-align: middle;
    font-family: 'Noto Sans', sans-serif !important;
    font-style: italic !important;
    max-width: 12ch;
    transform: scale(0.65);
    color: WhiteSmoke !important;
    background-color:transparent !important;
}

.CopyState {
	position: absolute;
	font-size: 1.5rem;
	font-weight: bold;
	vertical-align: middle;
	font-family: 'M PLUS Rounded 1c', 'Noto Sans', sans-serif !important;
	color: White !important;
	padding: .25em;
	max-width: max-content;
	border-radius: .25em !important;
	-webkit-box-sizing: border-box !important;
	box-sizing: border-box !important;	
	top: 100%;
	left: 25%;
}

.CopyState.innerText {
    background-color: rgba(0, 0, 0, 0.9) !important;
}

.CopyButton, .ClearButton {
    font-style: initial !important;
    word-spacing: .5rem;
    cursor: pointer;
    color: LimeGreen !important;
    background-color:transparent !important;
    text-shadow: 1px 1px 1px red, 0 0 2px blue, 0 0 1px black;
}


div.SearchBox {
	position: absolute;
	height: 1.13em;
	display: inline-flex;
    margin: .25em;
    gap: 5px;
}

img.Favicon {
    margin: .25em;
    cursor: pointer;
    box-shadow: rgba(0, 0, 0, 0.17) 0px -23px 25px 0px inset, rgba(0, 0, 0, 0.15) 0px -36px 30px 0px inset, rgba(0, 0, 0, 0.1) 0px -79px 40px 0px inset, rgba(0, 0, 0, 0.06) 0px 2px 1px, rgba(0, 0, 0, 0.09) 0px 4px 2px, rgba(0, 0, 0, 0.09) 0px 8px 4px, rgba(0, 0, 0, 0.09) 0px 16px 8px, rgba(0, 0, 0, 0.09) 0px 32px 16px;
    }

`);


/*
(function() {
    orig = $.fn.css;
    $.fn.css = function() {
        let result = orig.apply(this, arguments);
        $(this).trigger('stylechanged');
        return result;
    }
})();
*/


class LinkCopyDB {
    constructor() {
        this.dbName = 'LinkCopyDB';
        this.storeName = 'Links';
        this.db = null;

        // 이벤트 채널
        this.bc = new BroadcastChannel("LinkCopyDBChannel");
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);

            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'U' });
                }
            };

            request.onsuccess = (e) => {
                this.db = e.target.result;
                resolve();
            };

            request.onerror = (e) => reject(e.target.error);
        });
    }

    async add(data) {
        const result = await this._tx('readwrite', store => store.put(data));
        this._notify({ type: "add", data });
        return result;
    }

    async get(U) {
        return this._tx('readonly', store => store.get(U));
    }

    async getAll() {
        return this._tx('readonly', store => store.getAll());
    }

    async remove(U) {
        const result = await this._tx('readwrite', store => store.delete(U));
        this._notify({ type: "remove", U });
        return result;
    }

    async clearAll() {
        const result = await this._tx('readwrite', store => store.clear());
        this._notify({ type: "clear" });
        return result;
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

    // 내부 알림 → BroadcastChannel
    _notify(event) {
        this.bc.postMessage(event);
        if (this.onchange) this.onchange(event); // ★ 같은 탭 내부에서도 바로 콜백 실행
    }
}


const linkDB = new LinkCopyDB();
let indexedDBCache = [];

await linkDB.init();

// 외부에서 DB 변경 감지
linkDB.onchange = async (event) => {
    //console.log("로컬 DB 이벤트 발생:", event);
    indexedDBCache = await indexedDBUpdate();
};

linkDB.bc.onmessage = async (event) => {
    //console.log("멀티탭 DB 이벤트 발생:", event.data);
    indexedDBCache = await indexedDBUpdate();
};

let CopyLinks = [];
let AllCopyLinks = [];

let PackageName = '';
let AutoCopy = JSON.parse(localStorage.getItem('AutoCopy')) || false;
let AutoClose = JSON.parse(localStorage.getItem('AutoClose')) || false;
let userCopy = true;
let userClose = true;
let useResolution = true;

const PageURL = window.location !== window.parent.location ? document.referrer : document.location.href;
const RootDomain = extractRootDomain(PageURL);

const linkEreg = /(?:https|http|ftp|file):\/\/.+?(?=[,.]?(?:\s|$))/gi;


let pageLinksDB = [];

let GetState, PackageCount;
let Maker = '', ReleaseDate = '';
let SkipTitle = [];

let GetDPI, DefaultFontSize;
let Target, DownloadArea, CopyTitle = '', copyOffsetArea, InfoArea, Resolution = '', TitleLast = '', Series = '', Title, ID = '', TitleID, CopyTitleTmp, InfoTitleTmp, CoverImage, MatchWebRegExp, Gallery, DownloadAreaSelector;
const skipFilterPatterns = [
    /#$/i,
    /3xplanetpremium/i,
    /77file\.com/i,
    /adf\.ly/i,
    /anonfiles\.com/i,
    new RegExp(`^(?=.*${window.location.origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?!.*\\?site).*$`, 'i'),
    /^\//i,
    /clubwarp\.com/i,
    /clubwarp\.top/i,
    /facebook\.com/i,
    /fboom\.me\/code/i,
    /fireget\.com\/premium\.html/i,
    /goaibox\.com/i,
    /gofile\.io/i,
    /imgchili\.net\/show/i,
    /javascript/i,
    /k2s\.cc\/(pr|code)/i,
    /keep2share\.cc\/pr\//i,
    /magnet:/i,
    /niceff\.com/i,
    /nyaa\.si/i,
    /openload\.co/i,
    /ouo\.io/i,
    /ouo\.press/i,
    /pixhost\.to\/gallery\//i,
    /momerybox\.com\//i,
    /nephobox\.com\//i,
    /terabox\.(app|com)/i,
    /teraboxapp\.com/i,
    /tezfiles\.com\/.+\/premium/i,
    /tma\.cx/i,
    /turb\.cc/i,
    /turbobit\.net/i,
    /twitter\.com/i,
    /shink\.me/i,
    /xtvtv\.com\/explanation/i,
    /katfile\.com\/\?op=registration/i,
    /zippyshare\.com/i,
];
const DirectCopy = new RegExp('3xplanet|kbjme\\.com|hpav\\.tv|pornrips\\.cc|sharepornlink|javpop', 'i');
const WaitChangeLink = new RegExp('tma\\.cx\/', 'i');
//const WaitChangeLink = new RegExp('TestTest\\.cx\/', 'i')
const LAST_TAGS_REGEX = /\s*\[[^\]]+\][^\[]*$/;
const HexCode = /x([0-9A-Fa-f]{2})/g;   // xYY 타입

const SkipFileName = /demosaic|\.UMR|iris2/;



// Storage 이벤트 리스너
window.addEventListener('storage', async (e) => {
    // 토글 관련 이벤트 처리
    if (toggleConfigs[e.key]) {
        handleToggle(e.key, toggleConfigs[e.key]);
    }
});

let currentConfig = null;

document.addEventListener("DOMContentLoaded", async () => {
    console.log('Start Link Copy!');
    FontAwesomeCSS();
    FirstStep();
}, { once: true });


const RegexFrom = (strings, flags) =>
    new RegExp(
        strings
            .filter(e => e.trim())
            .map(t => t.replace(/\s+/g, '\\s'))
            // Escape special characters
            .join("|"),
        flags
    );


const SkipModelEx = RegexFrom(SkipModel.split(/\r?\n/), 'gi');
const SkipWordEx = RegexFrom(SkipWord.split(/\r?\n/), 'gi');


let ShortUrl;
let AllowDirect;

let CenterBoxFontSize, StateFontSize, StateLineHeight, LinkCopyCenterBox;

const SkipClassNames = ['adead_link', 'autohyperlink', 'social-icon'];
//const JapaneseChar = /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/g
const JapaneseChar = /[ぁ-んァ-ン一-龯]/;
const ThaiChar = /[ๅภถุึคตจขชๆไำพะัีรนยบลฃฟหกดเ้่าสวงผปแอิืทมใฝ๑๒๓๔ู฿๕๖๗๘๙๐ฎฑธํ๊ณฯญฐฅฤฆฏโฌ็๋ษศซฉฮฺ์ฒฬฦ]/;
const SearchID = /([a-zA-Z]{2,11}-?\d{2,6}[a-zA-Z]?|\d{2,4}[a-zA-Z]{2,7}-?\d{3,6}[a-zA-Z]?|[a-zA-Z]{1,2}-?\d{2}-?\d{2,3}|[a-zA-Z]{2,7}-?[a-zA-Z]{1,2}\d{2})(.*)/;
const MatchID = /^([a-zA-Z]{2,11}-?\d{2,6}[a-zA-Z]?|\d{2,4}[a-zA-Z]{2,7}-?\d{3,6}[a-zA-Z]?|[a-zA-Z]{1,2}-?\d{2}-?\d{2,3}|[a-zA-Z]{2,7}-?[a-zA-Z]{1,2}\d{2}|FC2.+\d{6.8})(.*)/;
const SearchFC2ID = /(^FC2.+\d{6})(.*)/;
const SearchIDRegExp = /^(\[\s?)?(?=([a-zA-Z]{2,11}-?\d{2,6}[a-zA-Z]?|\d{2,4}[a-zA-Z]{2,7}-?\d{3,6}[a-zA-Z]?|[a-zA-Z]{1,2}-?\d{2}-?\d{2}|[a-zA-Z]{2,7}-?[a-zA-Z]{1,2}\d{2})|T\d{2}-\d{3})(?!(C_\d+|file\d+))(.*)$/;
const K2SRegExp = /(.*k2s\.cc\/file\/)(.*\/?)/;
const DateRegEx = /((19|20)[0-9]{2}[.\/-]([1][0-2]|[0]?[1-9])[.\/-]([3][0|1]|[1|2][0-9]|[0]?[1-9])|([3][0|1]|[1|2][0-9]|[0]?[1-9])[.\/-]([1][0-2]|[0]?[1-9])[.\/-]((19|20)?[0-9]{2})).*/;
const extractID = /(\[\s?)?(?=([a-zA-Z]{2,11}-?\d{2,6}[a-zA-Z]?|\d{2,4}[a-zA-Z]{2,7}-?\d{3,6}[a-zA-Z]?|[a-zA-Z]{1,2}-?\d{2}-?\d{2}|[a-zA-Z]{2,7}-?[a-zA-Z]{1,2}\d{2})|T\d{2}-\d{3})(?!(C_\d+|file\d+))/;
const ID3D = /(MCB3DBD-\d+)(.*)$/i;



let GetDirect, AllCollectionLinks = [];

const DirectLink = (url) => {
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: "GET",
            url: url,
            onload: function (resp) {
                //console.log(resp.status)
                //console.log(resp.responseText)
                const Final = GetDirectLink(url, resp.finalUrl);
                resolve(Final);
            },
            onerror: function (error) {
                console.log(error);
                reject(null);
            }
        });
    });
};

const GetDirectLink = (url, data) => {
    //let match = /window\.location='(?<url>http[^']+)/?.exec(data)
    let match = data.replace(/\?site=.+/, '');
    if (match) {
        Array.from(document.querySelectorAll('a[href*="' + url + '"]')).forEach(T => {
            T.setAttribute('href', match);
        });
    }
    return match;

};


const io = new IntersectionObserver((entries, self) => {
    for (const entry of entries) {
        if (entry.isIntersecting) {
            LinkCopyCenterBox = entry.target;
            //console.log(LinkCopyCenterBox)

            if (entry.target.complete) {
                self.unobserve(entry.target);
            }
        }
    }

}, { root: null, rootMargin: "0px 0px 0px 0px" });


/**
* MutationObserver를 사용하여 특정 요소가 DOM에 나타날 때까지 기다립니다.
* @param {string} selector - 관찰할 HTML 요소의 선택자.
* @param {Element} [targetNode=document.body] - MutationObserver를 적용할 상위 요소.
* @returns {Promise<Element>} 요소가 발견되면 해결되는 프로미스.
*/
function waitElement(selector, targetNode = document.body) {
    return new Promise((resolve, reject) => {
        const element = targetNode.querySelector(selector)?.querySelector('a');
        console.log('waitElement: ', selector, 'TargetNode: ', targetNode);
        if (element) {
            resolve(element);
        }
        const observer = new MutationObserver((mutations, obs) => {
            const found = targetNode.querySelector(selector)?.querySelector('a');
            if (found) {
                obs.disconnect();
                resolve(found);
            }
        });

        observer.observe(targetNode, {
            childList: true,
            subtree: true
        });
    });
}



function observeDownloadArea(WatchArea, downloadAreaSelector) {
    return new Promise((resolve, reject) => {
        const condition = document.querySelector('downloadAreaSelector');
        if (!condition) return;

        // MutationObserver로 aria-modal 속성 변화를 감지
        const downloadAreaOpen = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                const isOpen = document.querySelector(downloadAreaSelector);
                if (isOpen) {
                    Start();
                    return;
                }
            }
        });

        downloadAreaOpen.observe(WatchArea, {
            attributes: true,
            childList: true,
            subtree: true
        });
    });
}


function indexedDBUpdate() {
    return new Promise((resolve, reject) => {
        linkDB.getAll().then((result) => {
            indexedDBCache = result;
            GetState = indexedDBCache.length;
            PackageCount = PackageList(indexedDBCache).length;
            updateUI(GetState, PackageCount);
            resolve(indexedDBCache);
        }).catch(error => {
            console.error("Failed get data:", error);
        });
    });
}


// MutationObserver가 종료될 때까지 기다리는 함수
function waitForObserver(targetElement) {
    return new Promise((resolve, reject) => {
        // 1. MutationObserver 생성
        const observer = new MutationObserver((mutations, obs) => {
            // 2. 타겟의 값이 바뀌면 옵저버 종료
            // 여기서는 'href' 속성이 변경되었는지 확인합니다.
            // 실제 구현에 맞게 조건문을 수정할 수 있습니다.
            const hasHrefChanged = mutations.some(mutation => mutation.type === 'attributes' && mutation.attributeName === 'href');

            if (hasHrefChanged) {
                // 옵저버 종료
                obs.disconnect();

                // 3. Promise 해결 (resolve)
                resolve("Observer disconnected successfully.");
            }
        });

        // 4. 관찰 시작
        observer.observe(targetElement, {
            attributes: true,
            attributeFilter: ['href']
        });
    });
}

/**
* 특정 영역에 변경이 발생하면 콜백 함수를 실행합니다.
* @param {string} targetSelector - 관찰할 HTML 요소의 선택자.
* @param {Function} callback - 변경이 발생했을 때 실행할 콜백 함수.
* @returns {MutationObserver} 생성된 옵저버 인스턴스.
*/
function observeChanges(targetSelector, callback) {
    const targetElement = document.querySelector(targetSelector);
    if (!targetElement) {
        console.warn(`Target element not found: ${targetSelector}`);
        return null;
    }

    const observer = new MutationObserver((mutations) => {
        callback(mutations, observer);
    });

    observer.observe(targetElement, {
        attributes: true,
        childList: true,
        subtree: true
    });
    return observer;
}

function makeSearch() {
    let SearchBox = document.querySelector('div.SearchBox');
    let searchTitle;
    if (!SearchBox) {
        const titleEl = document.querySelector('.post-title.entry-title');
        searchTitle = titleEl ? searchTerms(titleEl.innerText) : '';
        const offsetParent = copyOffsetArea.parentElement;
        offsetParent.style.position = 'relative';

        // create SearchBox
        SearchBox = document.createElement('div');
        SearchBox.className = 'SearchBox';
        SearchBox.style.position = 'absolute';
        offsetParent.insertBefore(SearchBox, copyOffsetArea.nextSibling);
    }

    const baseScale = (1 / (GetDPI / 1.5)) * (16 / DefaultFontSize);
    const rem = (value) => `${value.toFixed(2)}rem`;

    SearchBox.style.maxWidth = rem(3);
    SearchBox.style.top = `${Math.floor(copyOffsetArea.offsetTop + (copyOffsetArea.offsetHeight / 20))}px`;
    SearchBox.style.left = `${Math.floor(copyOffsetArea.offsetLeft + copyOffsetArea.offsetWidth - baseScale * 16)}px`;
    SearchBox.style.height = rem(1);

    const ICONS = [
        {
            class: 'TheRarBG',
            domain: 'therarbg.com',
            onClick: () => openInNewTab(`https://therarbg.com/get-posts/keywords:${searchTitle}/`)
        },
        {
            class: 'Zeroxxx',
            domain: '0xxx.ws',
            onClick: () => openInNewTab(`https://0xxx.ws/index.php?s="${searchTitle}"`)
        },
        {
            class: 'PornBB',
            domain: 'pornbb.org',
            onClick: () => {
                const strong = document.querySelector('div.post-content-single.clearfix p strong span');
                const term = strong ? strong.innerText.replace(/^EARLY\sLEAK/, '').trim() : '';
                openInNewTab(`https://www.pornbb.org/newsearch.php?search_keywords=${term}`);
            }
        },
        {
            class: 'BT4G',
            domain: 'bt4g.org',
            onClick: () => {
                const strong = document.querySelector('div.post-content-single.clearfix p strong span');
                const term = strong ? strong.innerText.replace(/^EARLY\sLEAK/, '').replace(/\s-\s/, ' ').trim() : '';
                openInNewTab(`https://bt4g.org/search/${term}`);
            }
        }
    ];

    const searchBoxStyle = SearchBox.style;
    searchBoxStyle.maxWidth = rem(baseScale * 0.9 * 3);
    searchBoxStyle.top = Math.floor(copyOffsetArea.offsetTop + (copyOffsetArea.offsetHeight / 20)) + 'px';
    searchBoxStyle.left = Math.floor(copyOffsetArea.offsetLeft + copyOffsetArea.offsetWidth - SearchBox.offsetWidth * 1.5) + 'px';
    searchBoxStyle.height = rem(baseScale * 0.9);

    // img.Favicon 모두 선택
    const faviconImgs = document.querySelectorAll('img.Favicon');
    faviconImgs.forEach(img => {
        img.style.width = rem(baseScale * 0.9);
        img.style.height = rem(baseScale * 0.9);
    });

    for (const { class: className, domain, onClick } of ICONS) {
        const img = document.createElement('img');
        img.className = `Favicon ${className}`;
        img.src = `https://www.google.com/s2/favicons?sz=32&domain=${domain}`;
        img.style.width = rem(1);
        img.style.height = rem(1);
        img.style.cursor = 'pointer';
        img.addEventListener('click', (e) => {
            e.preventDefault();
            onClick();
        });
        SearchBox.appendChild(img);
    }

}


const siteConfigs = [
    {
        regex: /naughtyblog\.(org|my)\//,
        config: {
            copyOffsetAreaSelector: '.post-title.entry-title',
            downloadAreaSelector: 'div#download, div#downloadhidden',
            coverImageSelector: 'div.post-content-single a > img',
            coverImageAttribute: 'src',
            postProcess: async (config) => {

                copyOffsetArea = document.querySelector(config.copyOffsetAreaSelector);
                if (!copyOffsetArea) return;
                DownloadArea = document.querySelectorAll('div#download, div#downloadhidden, div.DownloadArea');

                //Extracting Text Before Each <br> and the Last Line
                let EachTitle = getTextLinesWithIconTag('div.post-content-single p strong', 'br');
                console.log('EachTitle: ', EachTitle);

                let MatchWeb, InfoCast, InfoAreaCast, SearchWebPoint, FirstMatchWeb, Released, ReleasedEn, Episode, SearchTitle, MatchCast;
                function getInfoArea() {
                    const postContent = document.querySelector('div.post-content-single');
                    if (!postContent) {
                        return {
                            info: [],
                            cast: []
                        };
                    }

                    // Helper function to clean text content
                    const cleanText = (text) => {
                        return text
                            .replace(/(?:(?:\r\n|\r|\n)\s*){2}/gm, '\n') // Replace multiple newlines with a single newline
                            .replace(/^(\s?(UPDATED|EARLY LEAK)|All\sPreviews\s?)/gim, '') // Remove specific prefixes
                            .split(/\n/) // Split into an array of lines
                            .map(line => line.trim()) // Trim whitespace from each line
                            .filter(line => line); // Filter out empty lines
                    };

                    // Process the main info area
                    let info = cleanText(postContent.innerText);
                    info = info.filter(element => !/^(http|Size|Download|Watch\sonline|Spare\slinks)/i.test(element));

                    // Process the cast information
                    let cast = [];
                    const strongElements = postContent.querySelectorAll('p > strong');

                    // Get cast from the first strong element
                    if (strongElements.length > 0) {
                        cast = cleanText(strongElements[0].innerText);
                    }

                    // Check for a second strong element and a specific span
                    const moreSpan = postContent.querySelector('p span[id^="more-"]');
                    if (moreSpan && strongElements.length > 1 &&
                        !/^(Preview|All\sPreviews)/i.test(strongElements[0].innerText) &&
                        !/^(Preview|All\sPreviews)/i.test(strongElements[1].innerText)) {

                        cast = cast.concat(cleanText(strongElements[1].innerText));
                    }

                    // Final filtering for the cast array
                    cast = cast.filter(e => e !== '... and more!' && !/Full\sSiterip|Download\sAll\sVideos\sfrom|Mega\sCollection/i.test(e));

                    // Remove duplicates from cast array
                    cast = [...new Set(cast)];

                    return {
                        info,
                        cast
                    };
                }

                const { info, cast } = getInfoArea();
                InfoArea = info;
                InfoAreaCast = cast;
                console.log('InfoArea:', InfoArea, 'InfoAreaCast:', InfoAreaCast);

                // `CopyTitle`에서 `MatchWeb` 추출
                const CopyTitleRaw = copyOffsetArea.innerText.trim();
                const MatchWebPoint = CopyTitleRaw.search(/\s-\s/);
                MatchWeb = MatchWebPoint !== -1 ? CopyTitleRaw.substring(0, MatchWebPoint).replace(/\s|\./g, '') : CopyTitleRaw;
                console.log('MatchWeb:', MatchWeb, 'MatchWebPoint:', MatchWebPoint);

                // CopyTitle에 'OnlyFans Mix'가 포함된 경우
                if (/OnlyFans\sMix/i.test(CopyTitleRaw)) {
                    userClose = false;
                    CoverImage = '';
                }
                // 그 외의 경우, 특정 키워드(Updates, SITERIP, Collection)가 포함되어 있고 InfoAreaCast의 길이가 1보다 클 때
                else if (/Updates|SITERIP|Collection/i.test(CopyTitleRaw)) {
                    userClose = false;
                    console.log('Special case found:', CopyTitleRaw);
                    CoverImage = '';
                    if (EachTitle.length > 1) {
                        pageLinksDB = await MutilSubTitle(MatchWeb, MatchWebPoint, InfoAreaCast);
                    }else{
                        useResolution = false;
                    }
                } else {
                    // `Cast` 정보 찾기
                    const MatchTitle = MatchWebPoint !== -1 ? CopyTitleRaw.substring(MatchWebPoint + 3) : CopyTitleRaw;
                    const FindMatchCast = MatchTitle.split(/\s+/).filter(e => e && isNaN(e) && e.length > 1);
                    const rawCast = InfoArea.find(txt => /^Cast\s?:/.test(txt))?.match(/^Cast\s?:\s?(.+)/)?.[1]?.trim();
                    console.log('MatchTitle:', MatchTitle, 'FindMatchCast:', FindMatchCast, 'rawCast:', rawCast);
                    if (rawCast) {
                        MatchCast = rawCast;
                    } else {
                        const searchCastPoint = InfoArea.find(txt => txt.includes(' - '));
                        if (searchCastPoint) {
                            const rawSearchCast = searchCastPoint.split(' - ')[0];
                            const searchCasts = rawSearchCast.replace(/&|,/g, ' ').split(/\s+/).filter(Boolean);
                            MatchCast = searchCasts.find(name => FindMatchCast.includes(name)) || '';
                            InfoCast = MatchCast && searchCastPoint;
                            console.log('searchCasts:', searchCasts);
                        }
                    }

                    console.log('MatchCast:', MatchCast, 'InfoCast:', InfoCast);

                    // `Released` 날짜 추출
                    Released = InfoArea.find(txt => /(\.\d+\.\d+\.\d+\.)/.test(txt))?.match(/(\.\d+\.\d+\.\d+\.)/)?.[1] || '';
                    console.log('Released:', Released);
                    // `Episode` 추출
                    const epMatch = InfoArea.find(txt => /^(?!.*S\d+)(?=.*E\d{2,5}).*$/.test(txt));
                    Episode = epMatch ? '.' + epMatch.match(/E\d{2,5}/)[0] : '';

                    // `ReleasedEn` 추출
                    const relEnMatch = InfoArea.find(txt => /Released:(.+)/i)?.match(/Released:(.+)/i)?.[1];
                    if (!Released && relEnMatch) {
                        const parts = relEnMatch.trim().replace(/,/g, '').replace(/\s/g, '.').split('.');
                        if (/^[a-zA-Z]/.test(parts[1])) {
                            parts[1] = getNumericMonth(parts[1]); // getNumericMonth 함수는 별도로 정의되어 있어야 함
                        }
                        ReleasedEn = '.' + parts.join('.') + '.';
                    }
                    console.log('ReleasedEn:', ReleasedEn);

                    // 최종 `CopyTitle` 조합
                    if (!/SITERIP|OnlyFans|Collection|Updates/i.test(CopyTitleRaw)) {
                        const releaseDate = Released || ReleasedEn || '';
                        const castText = MatchCast ? ` (${MatchCast})` : '';
                        CopyTitle = `${MatchWeb}${Episode}${releaseDate || '.'}${InfoCast || InfoAreaCast[0]}`;
                    }

                    // 후처리 및 최종 정리
                    CopyTitle = CopyTitle
                        .replace(/SexArt\(SArt\)/i, 'SexArt')
                        .replace(/(S\d+):(E\d+)/i, '$1$2')
                        .replace(/\s+/g, ' ').trim(); // 다중 공백 제거



                    console.log('CopyTitle:', CopyTitle);

                    // 다운로드 링크 추출 및 우선순위
                    if (!/OnlyFans|Updates|SITERIP|Collection/i.test(CopyTitleRaw)) {
                        const getDownloadLinks = (areas) => {
                            const priorityPatterns = [/1080p|1080\.mp4/i, /2160p/i];
                            let finalLinks = [];

                            for (const area of areas) {
                                for (const pattern of priorityPatterns) {
                                    const links = Array.from(area.querySelectorAll('a')).filter(a => pattern.test(a.href));
                                    if (links.length > 0) {
                                        finalLinks.push(...links);
                                        break; // 가장 높은 해상도만 선택
                                    }
                                }
                                /*                                
                                if (finalLinks.length === 0) {
                                    // 해상도 패턴에 매칭되는 링크가 없을 경우
                                    finalLinks.push(...Array.from(area.querySelectorAll('a')));
                                } 
                                    */
                            }
                            return finalLinks;
                        };

                        const finalDownloadLinks = getDownloadLinks(DownloadArea);
                        console.log('finalDownloadLinks:', finalDownloadLinks);
                        if (finalDownloadLinks.length > 0) {
                            DownloadArea = createDownloadArea(finalDownloadLinks.map(link => link.outerHTML));

                            if (finalDownloadLinks.some(link => /1080p|1080\.mp4|2160p/i.test(link.href))) {
                                userCopy = true;
                            } else {
                                userCopy = false;
                                userClose = false;
                            }
                        } else {
                            userCopy = false;
                            userClose = false;
                        }
                    }
                }

                makeSearch();
            }
        }
    },
    {
        regex: /top-modelz\.org\/.+html/,
        config: {
            copyOffsetAreaSelector: '.news-detalis h2',
            downloadAreaSelector: 'div#content div#l-content div#dle-content div.news-block div.newspad div.quote, div#dle-content div.news-block div.newspad div div',
            coverImageSelector: 'div#dle-content div.news-block div.newspad div.news-text p img',
            coverImageAttribute: 'src',
            postProcess: (config) => {
                copyOffsetArea = document.querySelector(config.copyOffsetAreaSelector);
                DownloadArea = document.querySelectorAll(config.downloadAreaSelector);

                if (!copyOffsetArea) return;

                let Title = copyOffsetArea.textContent.trim() || '';

                let LinkDBAll = [];
                DownloadArea.forEach(section => {
                    Array.from(section.querySelectorAll('a')).forEach(a => {
                        if (!checkSkipFilter(a) && !/top-modelz\.org/.test(a.href)) {
                            LinkDBAll.push(a);
                        }
                    });
                });

                if (LinkDBAll.length === 0) {
                    userClose = false;
                    throw new Error('No Links found');
                }

                const uniqueTitle = [...new Set(
                    LinkDBAll.map(x => x.textContent.replace(/\d+p(?!x).*|(tezfiles\.com|k2s\.cc|rapidgator\.net)\s-\s|\s-\s\d+\.\d+\s(MB|GB)/ig, ''))
                )];

                let SearchDB = [];
                const CheckDB = (url, DB) => DB.some(s => s.href.includes(url));


                for (const x of uniqueTitle) {
                    const linkGroups = {
                        '2160p': [],
                        '1080p': [],
                        '720p': [],
                        'Other': [],
                        'Photos': []
                    };
                    const linksForTitle = LinkDBAll.filter(t => t.textContent.includes(x));


                    // 링크들을 우선순위에 따라 각 그룹에 할당합니다.
                    // Assign links to each group based on priority.
                    for (const link of linksForTitle) {
                        if (/2160p(?!x)/.test(link.textContent)) {
                            linkGroups['2160p'].push(link);
                        } else if (/1080p(?!x)/.test(link.textContent)) {
                            linkGroups['1080p'].push(link);
                        } else if (/720p(?!x)/.test(link.textContent)) {
                            linkGroups['720p'].push(link);
                        } else if (/\d+px\.(zip|rar)/.test(link.textContent)) {
                            linkGroups['Photos'].push(link);
                        } else {
                            linkGroups['Other'].push(link);
                        }
                    }
                    console.log('linkGroups:', linkGroups);

                    const priorityOrder = ['2160p', '1080p', '720p', 'Photos', 'Other'];

                    for (const groupName of priorityOrder) {
                        // 그룹에 링크가 하나라도 있다면
                        if (linkGroups[groupName].length > 0) {
                            // 해당 그룹의 모든 링크를 추가합니다.
                            for (const foundLink of linkGroups[groupName]) {
                                if (!CheckDB(foundLink.href, SearchDB)) {
                                    SearchDB.push(foundLink);
                                }
                            }
                            // 그리고 루프를 즉시 멈춥니다.
                            break;
                        }
                    }
                }
                console.log('SearchDB:', SearchDB);

                if (SearchDB.length > 0) {
                    const LinkDB = SearchDB.map(entry => entry.outerHTML);
                    // createDownloadArea 함수가 정의되어 있다고 가정
                    DownloadArea = createDownloadArea(LinkDB);
                } else {
                    userClose = false;
                    throw new Error('No suitable links found after filtering');
                }

            }
        }
    },
    {
        regex: /8kcosplay\.com|blogjav\.net\/\d+|javfree\.me\/\d+/,
        config: {
            copyOffsetAreaSelector: '.entry-title',
            downloadAreaSelector: '.entry-content',
            postProcess: (config) => {
                copyOffsetArea = document.querySelector(config.copyOffsetAreaSelector);
                const is8kcosplay = /8kcosplay\.com/.test(PageURL);
                const isBlogjav = /blogjav\.net/.test(PageURL);
                const isJavfree = /javfree\.me/.test(PageURL);

                if (isBlogjav) {
                    document.querySelectorAll('p > a[href*="_s.jpg"], p > a[href*=".mp4.jpg"]').forEach(tag => {
                        const img = document.createElement('img');
                        img.setAttribute('src', tag.href);
                        tag.parentNode.replaceChild(img, tag);
                    });
                }
                if (isJavfree) DownloadArea = document.querySelectorAll('.entry-content');
                else if (is8kcosplay) DownloadArea = document.querySelectorAll('.entry-content > p');
                else DownloadArea = document.querySelectorAll('.entry-content > p');

                if (is8kcosplay) CoverImage = '';
                else {
                    const imgTag = DownloadArea[0]?.querySelector('p > img');
                    CoverImage = imgTag?.getAttribute('data-lazy-src') ?? imgTag?.src ?? '';
                }

                let rawTitle = copyOffsetArea?.textContent.trim() ?? '';
                rawTitle = rawTitle
                    .replace(/amp;|\(\s?ブルーレイ版\s?\)|\(ブルーレイディスク版\)|（ブルーレイディスク）/g, '')
                    .replace('***y*xjyyqxn', '')
                    .replace(/\*\*[a-z]+/, '')
                    .replace('[FHD/4K]', '')
                    .replace(/^\[4K(UHD)?\]/i, '')
                    .replace('[KBJ]', '')
                    .replace('CNAV', '')
                    .replace('[FHD/SD]', '')
                    .replace('[SD/FHD]', '')
                    .replace('– Uncensored Japanese AV Free Download', '')
                    .replace(/\[([a-zA-Z]{2,11}-?\d{2,6}[a-zA-Z]?|\d{2,4}[a-zA-Z]{2,7}-?\d{3,6}[a-zA-Z]?|[a-zA-Z]{1,2}-?\d{2}-?\d{2,3}|[a-zA-Z]{2,7}-?[a-zA-Z]{1,2}\d{2}|T\d{2}-?\d{3})\]/, '$1')
                    .trim();

                ID = rawTitle.match(MatchID)?.[1] ?? rawTitle.match(SearchFC2ID)?.[1] ?? '';
                if (ID) rawTitle = rawTitle.replace(ID, '').trim();

                let TitleArr = rawTitle.split(/\s+/).filter(Boolean);
                if (TitleArr[0]?.match(/UNCENSORED|CENSORED/)) TitleArr.shift();
                let Title = TitleArr.join(' ').replace(/^\[FHD\]/, '');

                let InfoArea = [];
                if (DownloadArea) {
                    DownloadArea.forEach(el => {
                        const lines = el.innerText.replace(/(?:(?:\r\n|\r|\n)\s*){2}/gm, '\n').split(/\n\n|\n/);
                        InfoArea.push(...lines);
                    });
                    InfoArea = InfoArea.filter(e => e.trim());
                }
                Series = InfoArea.find(e => /^シリーズ：?/.test(e))?.replace(/^シリーズ：?/, '').trim() ?? '';
                Title = mbConvertKana(Title, 'rans');

                const IDLength = byteLengthOfCheck(ID);
                const TitleLength = byteLengthOfCheck(Title);
                const maxTotal = 241;

                if (TitleLength > maxTotal - IDLength) {
                    let TitleLast = getLastText(Title);
                    if (!TitleLast || /^\s*$/.test(TitleLast) || TitleLast.replace(/\s/g, '') === '') {
                        CopyTitle = (ID ? ID + ' ' : '') + byteLengthOf(Title, maxTotal - IDLength).trim();
                    } else {
                        const base = Title.split(TitleLast)[0].trim();
                        const baseTrimmed = byteLengthOf(base, maxTotal - IDLength - byteLengthOfCheck(TitleLast));
                        CopyTitle = (ID ? ID + ' ' : '') + (baseTrimmed + TitleLast).trim();
                    }
                } else {
                    CopyTitle = (ID ? ID + ' ' : '') + Title.trim();
                }
            }
        }
    },
    {
        regex: /0xxx\.(ws|li)\/articles\/\d+/,
        config: {
            copyOffsetAreaSelector: 'div.container table#detail-table tbody tr.gore th h1',
            downloadAreaSelector: 'div.container table#detail-table tbody tr td.dlinks.taj',
            postProcess: (config) => {
                copyOffsetArea = document.querySelector('div.container table#detail-table tbody tr td.taj:not(.levo)');
                //const downloadContainer = await waitElement('div.container table#detail-table tbody tr td.dlinks.taj a[href*="https://rapidgator.net/file/"]');
                DownloadArea = document.querySelectorAll('div.container table#detail-table tbody tr td.dlinks.taj');
                if (/#show$/.test(PageURL)) {
                    window.addEventListener("scroll", () => {
                        window.scrollTo({ top: 0, behavior: 'auto' });
                    }, { once: true });
                }
            },
        },
    },
    {
        regex: /nitroflareporn\.com/,
        config: {
            copyOffsetAreaSelector: 'div#dle-content article.singlecont.slideRight h1 span#news-title',
            downloadAreaSelector: 'article.singlecont.slideRight div.cont',
            postProcess: (config) => {
                copyOffsetArea = document.querySelector(config.copyOffsetAreaSelector);
                document.querySelectorAll('a > img[src*="/uploads/download.gif"]').forEach((img) => {
                    const icon = document.createElement('i');
                    icon.classList.add('fa-solid', 'fa-link');
                    img.replaceWith(icon);
                });

                if (copyOffsetArea) {
                    CopyTitle = copyOffsetArea.innerText.replace(/\((UltraHD|Full|HD|SD).+/, '').replace(/\s+/g, ' ').trim();
                    CopyTitle = capitalize(CopyTitle);
                    CopyTitle = CopyTitle.replace(/\*/g, '＊').replace(/\?/g, '？');
                }
            }
        }
    },
    {
        regex: /fapfiles\.org\/\d+|teenbox\.org\/\?p=\d+/,
        config: {
            postProcess: (config) => {
                if (/fapfiles\.org\/\d+/.test(PageURL)) {
                    config.copyOffsetArea = 'div#title_post';
                    config.downloadAreaSelector = 'div#content';
                } else if (/teenbox\.org\/\?p=\d+/.test(PageURL)) {
                    config.copyOffsetArea = 'table tbody tr td div#menu_t h2';
                    config.downloadAreaSelector = 'div#entry';
                }

                copyOffsetArea = document.querySelector(config.copyOffsetAreaSelector);
                DownloadArea = document.querySelectorAll(config.downloadAreaSelector);

                if (copyOffsetArea) {
                    CopyTitle = nameCorrection(copyOffsetArea.textContent.replace(/amp;/g, '').trim());
                }
            }
        }
    },
    {
        regex: /^https?:\/\/wetholefans\.com\/.*\/\d+(?!.*page\/\d+)/,
        config: {
            copyOffsetAreaSelector: '.post-title #news-title h1',
            downloadAreaSelector: '.story .quote',
            postProcess: (config) => {
                copyOffsetArea = document.querySelector(config.copyOffsetAreaSelector);
                let SearchLinks = [];
                if (DownloadArea) {
                    Array.from(DownloadArea).forEach((LinkEntry) => {
                        SearchLinks.push(...LinkEntry.querySelectorAll('a'));
                    });
                }

                if (!ReleaseDate) {
                    const match = SearchLinks[0]?.textContent.match(/(\.\d+\.\d+\.\d+\.)/);
                    ReleaseDate = match ? match[1] : '';
                }

                if (!Resolution && copyOffsetArea) {
                    const resMatch = copyOffsetArea.innerText.match(/[0-9]{3,4}p/);
                    if (resMatch) Resolution = ' ' + resMatch[0];
                }

                console.log(copyOffsetArea);
                if (copyOffsetArea) {
                    let tempTitle = copyOffsetArea.innerText.replace(/\((UltraHD|Full|HD|SD).+/i, '').replace(/\s+/g, ' ').trim();
                    tempTitle = capitalize(tempTitle);
                    const MatchWebPoint = tempTitle.indexOf(' - ');
                    const MatchWeb = MatchWebPoint !== -1 ? tempTitle.substring(0, MatchWebPoint).replace(/\s/g, '') : tempTitle;

                    CopyTitle = ReleaseDate ? MatchWeb + ReleaseDate + tempTitle.substring(MatchWebPoint + 3) : tempTitle;
                    CopyTitle = CopyTitle.replace(/\*/g, '＊').replace(/\?/g, '？');
                }
            }
        }
    },
    {
        regex: /(pornchil\.com\/)(?!$).*$/,
        config: {
            copyOffsetAreaSelector: '.inside-article > .entry-content strong > span',
            downloadAreaSelector: '.inside-article > div.entry-content'
        }
    },
    {
        regex: /cosplay\.jav\.pw\/\d+/,
        config: {
            copyOffsetAreaSelector: 'div.post_singular.hentry .entry h3, div.post_singular.hentry .title',
            downloadAreaSelector: 'div.post_singular.hentry div.entry',
        },
    },
    {
        regex: /(nicesss|nicewww)\.com\/archives.+\.html/,
        config: {
            copyOffsetAreaSelector: 'header.entry-header h1.entry-title a',
            downloadAreaSelector: 'article.article-content div.container div.entry-wrapper div.entry-content center'
        }
    },
    {
        regex: /tvtv\.com\/archives.+\.html/,
        config: {
            copyOffsetAreaSelector: 'div.single-center header.single-header .entry-title',
            downloadAreaSelector: 'div.entry-content center'
        }
    },
    {
        regex: /fapit\.org\/\d+/,
        config: {
            copyOffsetAreaSelector: '.entry-title',
            downloadAreaSelector: 'main#site-content article div.entry-content'
        }
    },
    {
        regex: /pornofetishx\.com\/\d+/,
        config: {
            copyOffsetAreaSelector: 'div.content-single h1.ftitle',
            downloadAreaSelector: 'div.content-single div.quote'
        }
    },
    {
        regex: /(clubwarp|downloaddex)\.com\/threads/,
        config: {
            copyOffsetAreaSelector: 'h1.p-title-value',
            downloadAreaSelector: 'article.message-body.js-selectToQuote div.bbWrapper'
        }
    },
    {
        regex: /jtiny\.org\/\?p=\d+/,
        config: {
            copyOffsetAreaSelector: 'div#container h2#titl a',
            downloadAreaSelector: 'div#container div.post div#entry center'
        }
    },
    {
        regex: /javarchive\.com\/\d{4,6}/,
        config: {
            copyOffsetAreaSelector: '.menudd h1 a, div.news div.first_des',
            downloadAreaSelector: '.link_archive_innew',
            coverImageSelector: 'div.category_news_phai_chinh > div.news > div > img:not([src^="data"])',
            coverImageAttribute: 'src',
            coverImageFallbackAttribute: 'data-src'
        }
    },
    {
        regex: /(k2sporn\.com|hidefporn\.ws)\/\d+/,
        config: {
            copyOffsetAreaSelector: 'div.story-head .title',
            downloadAreaSelector: 'div.story-cont div.quote'
        }
    },
    {
        regex: /cosplay-jav\.com/,
        config: {
            copyOffsetAreaSelector: 'div.title h1.posttitle a.entry-title',
            downloadAreaSelector: 'div.entry-container div.entry p',
            coverImageSelector: 'div.entry-container div.entry p.first-para img.size-full',
            coverImageAttribute: 'src'
        }
    },
    {
        regex: /kbjme\.com\/\d+/,
        config: {
            copyOffsetAreaSelector: '.article_container h1',
            downloadAreaSelector: 'div.article_container div.context div#post_content',
            postProcess: () => {
                const link = document.querySelector('.article_container a');
                if (link) {
                    link.href = '#';
                    link.removeAttribute('target');
                }
            }
        }
    },
    {
        regex: /pornrips\.cc\/.+/,
        config: {
            copyOffsetAreaSelector: 'div#dle-content article div.head h1.title',
            downloadAreaSelector: 'div#dle-content article div.story_cont .screenshots, div#dle-content article div.story_cont'
        }
    },
    {
        regex: /pornrip\.cc\/.+\.html/,
        config: {
            copyOffsetAreaSelector: 'div.meta .title.ularge',
        }
    },
    {
        regex: /javpop\.(link|mov)/,
        config: {
            copyOffsetAreaSelector: 'main.detail article.post h2.post-title',
            downloadAreaSelector: 'main.detail article.post div div.text-center'
        }
    },
    {
        regex: /thotsgirls\.com\/(?!.*page)/,
        condition: () => document.querySelector('div#primary > div#content > article'),
        config: {
            copyOffsetAreaSelector: '.entry-title',
            downloadAreaSelector: 'div.entry-content'
        }
    },
    {
        regex: /fhdporn\.video\/.+/,
        config: {
            copyOffsetAreaSelector: 'h1.post-title',
            downloadAreaSelector: 'div.post-content'
        }
    },
    {
        regex: /(bestgirlsexy|bestvideosexy)\.com\/.+/,
        condition: () => document.querySelector('div#content.site-content div.elementor.elementor-location-single'),
        config: {
            copyOffsetAreaSelector: 'div#content.site-content div.elementor-widget-container h1.elementor-heading-title',
            downloadAreaSelector: 'div#content.site-content div.elementor-widget-container'
        }
    },
    {
        regex: /all4jp\.com/,
        config: {
            copyOffsetAreaSelector: 'article.post > h1#post-title',
            downloadAreaSelector: 'article p',
            getDownloadArea: (copyOffsetArea) => copyOffsetArea ? copyOffsetArea.closest('article').querySelectorAll('p') : null
        }
    },
    {
        regex: /av18plus\.com/,
        config: {
            copyOffsetAreaSelector: 'div#content div.post-single h2.title',
            downloadAreaSelector: 'div#content div.post-single div.entry p',
            getDownloadArea: () => document.querySelectorAll('div#content div.post-single div.entry p')
        }
    },
    {
        regex: /(siteripbb\.org|freepornstreams\.org)\/.+/,
        config: {
            copyOffsetAreaSelector: 'h1.entry-title',
            downloadAreaSelector: 'div.entry-content'
        }
    },
    {
        regex: /xscandals\.com/,
        condition: () => document.querySelector('div#page.site div#content.site-content div#primary.content-area main#main.site-main article header.entry-header h1.entry-title a'),
        config: {
            copyOffsetAreaSelector: 'div#page.site div#content.site-content div#primary.content-area main#main.site-main article header.entry-header h1.entry-title a',
            downloadAreaSelector: 'div#page.site div#content.site-content div#primary.content-area main#main.site-main article div.entry-content blockquote p'
        }
    },
    {
        regex: /asianscan\.biz\/.*\.html/,
        config: {
            copyOffsetAreaSelector: 'div div.content div#dle-content div.mainf3',
            downloadAreaSelector: 'div.content div#dle-content div.sscn div.quote'
        }
    },
    {
        regex: /adult-porno\.org\/.+/,
        config: {
            copyOffsetAreaSelector: 'div.full-in h1',
            downloadAreaSelector: 'div.quote',
            resolutionFromCopyOffset: true
        }
    },
    {
        regex: /aincest\.com\/.+/,
        condition: () => !document.querySelector('article'),
        config: {
            copyOffsetAreaSelector: 'div#main-content div#content div.entry-headline-wrapper div.entry-headline-wrapper-inner h1.entry-headline',
            downloadAreaSelector: 'div#main-content div#content div.entry-content div.entry-content-inner > p'
        }
    },
    {
        regex: /(sharepornlink\.com\/)(?!($|page))(.*)$/,
        config: {
            copyOffsetAreaSelector: 'div.wpb_wrapper div.td_block_wrap.tdb-single-title div.tdb-block-inner h1.tdb-title-text, article div.td-post-header header.td-post-title h1.entry-title',
            downloadAreaSelector: 'div.tdb_single_content div.tdb-block-inner.td-fix-index, article div.td-post-content',
            resolutionFromCopyOffset: true
        }
    },
    {
        regex: /(softmodels\.net\/)(?!($|page))(.*)$/,
        config: {
            copyOffsetAreaSelector: 'article div.story-head .title',
            downloadAreaSelector: 'article div.quote'
        }
    },
    {
        regex: /3xplanet\.net/,
        condition: () => document.querySelector('article'),
        config: {
            copyOffsetAreaSelector: 'div.tdb-single-title div.tdb-block-inner.td-fix-index .tdb-title-text',
            downloadAreaSelector: 'div.td_block_wrap.tdb_single_content.td-post-content div.tdb-block-inner'
        }
    },
    {
        regex: /girlscanner\.org/,
        condition: () => document.querySelector('div#content'),
        config: {
            copyOffsetAreaSelector: 'div#content div#full_post span.span_h2 h1',
            downloadAreaSelector: 'div#content div#full_post center'
        }
    },
    {
        regex: /epicomg\.com\/\?p/,
        config: {
            copyOffsetAreaSelector: 'a.title',
            downloadAreaSelector: 'div#cont > center'
        }
    },
    {
        regex: /vipbj\.[a-zA-Z]+\/.+|avtv\..+/,
        condition: () => {
            if (document.querySelector('article.hentry header.entry-header .entry-title')?.children?.length) {
                userClose = false;
                throw ('Not Single Post');
            }
            return true;
        },
        config: {
            copyOffsetAreaSelector: 'article.hentry header.entry-header > .entry-title',
            downloadAreaSelector: 'article.hentry div.entry-content.post_content',
            getDownloadArea: () => {
                const figureLinks = document.querySelectorAll('article.hentry div.entry-content.post_content figure a');
                if (figureLinks?.length > 0) {
                    return document.querySelectorAll('article.hentry div.entry-content.post_content figure');
                }
                return document.querySelectorAll('article.hentry div.entry-content.post_content');
            }
        }
    },
    {
        regex: /jappydolls\.net/,
        condition: () => {
            const copyOffsetArea = document.querySelector('article.hentry header.entry-header > h1.entry-title');
            if (!copyOffsetArea || copyOffsetArea.children[0]) {
                userClose = false;
                throw ('Not Single Post');
            }
            return true;
        },
        config: {
            copyOffsetAreaSelector: 'article.hentry header.entry-header > h1.entry-title',
            downloadAreaSelector: 'article.hentry div.entry-content'
        }
    },
    {
        regex: /x-idol\.net\//,
        config: {
            copyOffsetAreaSelector: 'h1.post-title.entry-title',
            downloadAreaSelector: 'div.hentry div.entry-content'
        }
    },
    {
        regex: /ultoporn\.com\/\d+/,
        config: {
            copyOffsetAreaSelector: 'div.storyhead > .shead',
            downloadAreaSelector: 'div.quote'
        }
    },
    {
        regex: /maxjav\.(com|xyz)\/\d+/,
        condition: () => window.top === window.self,
        config: {
            copyOffsetAreaSelector: '.post-single h2.title',
            downloadAreaSelector: 'div.post-single.hentry:first-child div.entry p',
            postProcess: (config) => {
                copyOffsetArea = document.querySelector(config.copyOffsetAreaSelector);
                DownloadArea = document.querySelectorAll(config.downloadAreaSelector);
                let initialTitle = copyOffsetArea.innerText;
                const subtitleMatch = initialTitle.match(/\[.+Subtitle\](.+)/);

                let Title = subtitleMatch ? subtitleMatch[1] : initialTitle;

                Title = Title
                    .replace(/amp;/g, '')
                    .replace(/(\s)?\/(\s)?/g, '／')
                    .replace(/(-|–)\sHD/, '')
                    .replace(/amp;|\(\s?ブルーレイ版\s?\)|\(ブルーレイディスク版\)|:/g, '')
                    .trim();

                if (!/Collection/i.test(Title)) {
                    const InfoArea = Array.from(document.querySelectorAll('.post-single div.entry p')).flatMap(p =>
                        p.innerText.replace(/(?:(?:\r\n|\r|\n)\s*){2}/gm, '\n').split(/\n\n|\n/).filter(Boolean)
                    );

                    let fc = SearchFC2ID?.exec(Title);
                    if (fc) {
                        let fcId = fc.groups ? fc.groups[1] : fc[1];
                        Title = `${fcId} ${InfoArea[0]}`;
                    } else {
                        let cleanIDTitle, cleanIDInfoTitle, compareInfoAreaID, newTitle;
                        let infoTitle = InfoArea.find(line => line.match(SearchIDRegExp)) || '';
                        let entryID = Title.match(SearchIDRegExp)?.[2] || '';
                        let infoAreaID;
                        if (infoTitle && entryID) {
                            infoAreaID = infoTitle?.match(SearchIDRegExp)?.[2] || '';
                            cleanIDTitle = Title.replace(entryID, '').trim();
                            cleanIDInfoTitle = infoTitle.replace(infoAreaID, '').trim();
                        } else {
                            infoTitle = InfoArea.find(line => line.match(ID3D));
                            infoAreaID = infoTitle?.match(ID3D)?.[1] || '';
                            entryID = Title.match(ID3D)?.[1] || '';
                            if (infoAreaID && entryID) {
                                cleanIDTitle = Title.replace(entryID, '').trim();
                                cleanIDInfoTitle = infoTitle.replace(infoAreaID, '').trim();
                            }
                        }
                        if (entryID && infoAreaID) {
                            let IDMatch = entryID ?? infoAreaID;
                            let ID = IDMatch ? IDMatch.trim() : '';
                            if (ID) {
                                ID = ID ? ID + ' ' : '';
                            }
                            compareInfoAreaID = entryID === infoAreaID ? infoAreaID : /-/.test(entryID) ? entryID.replace(/-/g, '') : '';
                            newTitle = `${entryID} ${compareJapaneseCharacters(cleanIDTitle, cleanIDInfoTitle)}`;
                        } else if (entryID || infoAreaID) {
                            newTitle = `${entryID || infoAreaID} ${compareJapaneseCharacters(cleanIDTitle, cleanIDInfoTitle)}`;
                        }
                        console.log({ newTitle });
                        Title = newTitle ? newTitle : Title;

                    }
                    Title = mbConvertKana(Title.trim(), 'rans');
                }

                //ReleaseDate = InfoArea.find(line => /Release Date:/.test(line))?.match(/Release Date:(.+)/)?.[1].replace(/\//g, '.').trim() ?? '';
                //ReleaseDate = ReleaseDate ? '(' + ReleaseDate + ') ' : ''

                //Maker = InfoArea.find(line => /(Maker|Studio)\s?:/.test(line))?.match(/(Maker|Studio)\s?:(.+)/)?.[2].trim() ?? '';
                //Maker = Maker ? '[' + Maker + '] ' : ''


                CopyTitle = Title;
                CopyTitle = byteLengthOf(CopyTitle, 241).trim();
                CoverImage = DownloadArea?.[0]?.querySelector('p img')?.src || '';
                console.log({ CopyTitle, CoverImage, ID, ReleaseDate, Maker, DownloadArea });
            }
        }
    },
    {
        regex: /javpink\.com\/\?p/,
        config: {
            copyOffsetAreaSelector: '.item > .title',
            downloadAreaSelector: '.item > .content',
            postProcess: () => {
                let Title = copyOffsetArea?.textContent.trim() || '';
                DownloadArea = document.querySelectorAll('.item > .content');
                CoverImage = DownloadArea?.[0]?.querySelector('p img')?.src || '';

                const InfoArea = Array.from(DownloadArea).flatMap(block =>
                    block.innerText.replace(/(?:(?:\r\n|\r|\n)\s*){2}/gm, '\n').split(/\n\n|\n/).filter(Boolean)
                );
                Series = InfoArea.find(line => /^シリーズ：?.*/.test(line))?.replace(/^シリーズ：?/, '').trim() || '';
                Title = mbConvertKana(Title, 'rans');
                CopyTitle = byteLengthOf(Title, 241).trim();
            }
        }
    },
    {
        regex: /maddawgjav.net\/.+/,
        condition: () => document.querySelector('div#content div.post-single'),
        config: {
            copyOffsetAreaSelector: 'div.entry > h2',
            downloadAreaSelector: 'div.entry > p',
            postProcess: () => {
                let Title = copyOffsetArea?.textContent.trim() || '';
                DownloadArea = document.querySelectorAll('div.entry > p');
                CoverImage = DownloadArea?.[0]?.querySelector('img')?.src || '';
                Title = mbConvertKana(Title, 'rans');
                CopyTitle = byteLengthOf(Title, 241).trim();
            }
        }
    },
    {
        regex: /misskon\.com\/.+/,
        config: {
            copyOffsetAreaSelector: 'article#the-post .post-title.entry-title',
            postProcess: async () => {
                let Title = copyOffsetArea?.textContent.trim() || '';
                Title = Title.replace(/(\d+)\sphotos/i, `$1P`).replace(/(\d+)\svideos?/i, `$1V`).replace(/P(\s\+\s)/, 'P');
                Title = mbConvertKana(Title, 'rans');
                CopyTitle = byteLengthOf(Title, 241).trim();
            }
        }
    },

];
// 사이트별 특별 제목 처리 규칙을 정의하는 배열

const siteRules = [
    {
        regex: /k2sporn\.com\/\d{4,6}/,
        handler: (title) => {

            const cleanText = (text) => {
                return text
                    .replace(/(?:(?:\r\n|\r|\n)\s*){2}/gm, '\n') // Replace multiple newlines with a single newline
                    .replace(/^(\s?(UPDATED|EARLY LEAK)|All\sPreviews\s?)/gim, '') // Remove specific prefixes
                    .split(/\n/) // Split into an array of lines
                    .map(line => line.trim()) // Trim whitespace from each line
                    .filter(line => line); // Filter out empty lines
            };

            let Resolution = '';
            const bodyContentText = document.querySelector('div.body-content');
            if (bodyContentText) {
                let info = cleanText(document.querySelector('div.body-content')?.innerText);
                const subTitle = info.find(txt => /^Name\s?:/.test(txt))?.match(/^Name\s?:\s?(.+)/)?.[1]?.trim().replace(/\.?mp4$/i, '');
                const compareText = compareSentencesByWordMatch(subTitle, title);


                Resolution = /[0-9]{3,4}p/.test(title)
                    ? title.match(/[0-9]{3,4}p/)[0]
                    : /[0-9]{3,4}p/.test(subTitle)
                        ? subTitle.match(/[0-9]{3,4}p/)[0]
                        : '';
                title = compareText.replace(/^Nude\sLeaked\s-/i, '').replace(/\s[\[|\(].*?[UltraHD|UHD|FullHD|HD|SD|2K 1080p].+$/i, '').replace(Resolution, '').replace(/\[\]/g, '').replace("Let s ", "Let's ").trim();
            }
            else {
                Resolution = /[0-9]{3,4}p/.test(title);
                title = title.replace(/^Nude\sLeaked\s-/i, '').replace(/\s[\[|\(].*?[UltraHD|UHD|FullHD|HD|SD|2K 1080p].+$/i, '').replace(Resolution, '').replace(/\[\]/g, '').replace("Let s ", "Let's ").trim();
            }
            return `${title} ${Resolution}`;
        },
    },
    {
        regex: /epicomg\.com\/\?p/,
        handler: (title) => nameCorrection(title.replace(/amp;/g, '')),
    },
    {
        regex: /girlscanner\.org/,
        handler: (title) => title.replace(/^(new|Watch\/Download:)/i, '')
            .replace(/\\’/, "'")
            .replace(/[[:blank:]]{3,}.+/gi, '')
            .replace(/[\s]{3,}.+/gi, '')
            .trim(),
    },
    {
        regex: /(clubwarp|downloaddex)\.com/,
        handler: (title, copyOffsetArea) => {
            let cleanedTitle = Array.from(copyOffsetArea.childNodes)
                .reduce((acc, node) => acc + (node.nodeType === 3 ? node.textContent : ''), '')
                .trim()
                .replace(/[ๅภถุึคตจขชๆไำพะัีรนยบลฃฟหกดเ้่าสวงผปแอิืทมใฝ๑๒๓๔ู฿๕๖๗๘๙๐ฎฑธํ๊ณฯญฐฅฤฆฏโฌ็๋ษศซฉฮฺ์ฒฬฦ]/g, '')
                .replace(/\s+/g, ' ');
            return /^fc2/.test(cleanedTitle) ? cleanedTitle.toUpperCase() : cleanedTitle;
        },
    },
    {
        // cosplay.jav.pw 규칙 추가
        regex: /cosplay\.jav\.pw\/\d+/,
        handler: async (title, copyOffsetArea, DownloadArea) => {
            let rebuildedText;
            const h3 = document.querySelector('div.post_singular.hentry .entry h3');
            const rawTitle = h3 ? h3.textContent.trim() : title;


            const checkRedirects = document.querySelectorAll('a[href*="https://cosplay.jav.pw/goto/"]');
            const allCollectionLinks = Array.from(checkRedirects).map(el => el.href);
            const uniqueLinks = [...new Set(allCollectionLinks)];

            if (uniqueLinks?.length) {
                await Promise.allSettled(uniqueLinks.map((x) => DirectLink(x)));
            }

            CoverImage = document.querySelector('div.entry p a img')?.src || '';


            console.log('파일명 찾기"', { DownloadArea });
            console.log(DownloadArea[0].querySelector('a[href*="https://katfile.com/"]'));
            const GetFileNameLink =
                DownloadArea[0].querySelector('a[href*="https://katfile.com/"]')?.href ||
                DownloadArea[0].querySelector('a[href*="https://ddownload.com/"]')?.href || '';

            const needsFilenameFetch =
                (!SearchIDRegExp.test(rawTitle) && !/^\[.*?\]/.test(rawTitle) && GetFileNameLink) ||
                (!SearchIDRegExp.test(rawTitle) && !JapaneseChar.test(rawTitle) && GetFileNameLink);

            console.log({ needsFilenameFetch });

            const rawIDMatch = SearchIDRegExp.exec(rawTitle) || '';
            const rawID = rawIDMatch ? (rawIDMatch.groups ? rawIDMatch.groups[1] : rawIDMatch[1]) : '';
            if (needsFilenameFetch) {
                try {
                    const service = /katfile/.test(GetFileNameLink)
                        ? 'katfile'
                        : /ddownload/.test(GetFileNameLink)
                            ? 'ddl'
                            : null;
                    if (service) {
                        const newTitle = await GetFileName(GetFileNameLink, service);
                        console.log('GetFileName :', newTitle);
                        const newIDMatch = SearchIDRegExp.exec(newTitle) || '';
                        const newID = newIDMatch
                            ? (newIDMatch.groups ? newIDMatch.groups[1] : newIDMatch.filter(Boolean)[1])
                            : '';

                        const cleandedRawTitle = rawTitle.replace(rawID, '').trim();
                        const cleandedNewTitle = newTitle.replace(newID, '').trim();
                        rebuildedText = `${rawID || newID} ${compareJapaneseCharacters(cleandedRawTitle, cleandedNewTitle)}`;
                        const Maker = /^\[.*?\]\s/.exec(rebuildedText) || /^\[.*?\]\s/.exec(newTitle);
                        if (Maker?.length) {
                            rebuildedText = Maker + rebuildedText.replace(Maker[0], '');
                        }
                        copyOffsetArea.textContent = rebuildedText.trim();
                        console.log('Rebuilded Text:', rebuildedText);
                    }
                } catch (e) {
                    console.error('Request failed', e);
                }
            } else {
                return rawTitle;
            }

            return rebuildedText;
        },
    },
    {
        regex: /ultoporn\.com\/\d+/,
        handler: (title) => {
            const Resolution = /[0-9]{3,4}p/.test(title) ? title.match(/[0-9]{3,4}p/)[0] : '';
            title = title.replace(/^Nude\sLeaked\s-/i, '').replace(/\s[\[|\(].*?[UltraHD|UHD|FullHD|HD|SD|2K 1080p].+$/i, '').replace(Resolution, '').replace(/\[\]/g, '').replace("Let s ", "Let's ").trim();
            return `${title} ${Resolution}`;
        },
    },
    {
        regex: /hidefporn\.ws\/\d+/,
        handler: (title) => {
            const Resolution = /[0-9]{3,4}p/.test(title) ? title.match(/[0-9]{3,4}p/)[0] : '';
            title = title.replace(/^Nude\sLeaked\s-/i, '').replace(/\s[\[|\(].*?[UltraHD|UHD|FullHD|HD|SD|2K 1080p].+$/i, '').replace(Resolution, '').replace(/\[\]/g, '').replace("Let s ", "Let's ").trim();
            return `${title} ${Resolution}`;
        },
    },
    {
        regex: /(bestgirlsexy|bestvideosexy)\.com\/.+/,
        handler: (title) => title.replace(/part\d+$/i, '').trim(),
    },
];

// 사이트별 다운로드 영역 처리 규칙을 정의하는 배열
const waitDownloadArea = [
    {
        regex: /misskon\.com\/.+/,
        handler: async () => {

            const checkRedirects = document.querySelectorAll('a.shortc-button[href*="ouo.io/"], a.shortc-button[href*="shink.me/"]');
            const mediafire = 'MediaFire';
            const filteredLinks = Array.from(checkRedirects).filter(el => el.textContent.toLowerCase().includes(mediafire.toLowerCase()));
            const uniqueLinks = [...new Set(filteredLinks)];
            if (uniqueLinks.length) {
                await Promise.allSettled(uniqueLinks.map((x) => waitForObserver(x)));
            }
            DownloadArea = document.querySelectorAll('article#the-post div.entry p');
        },
    },
    {
        regex: /ultoporn\.com\/\d+/,
        handler: async () => {
            copyOffsetArea = document.querySelector('div.storyhead > h1.shead');
            Array.from(document.querySelectorAll('button.click_show')).forEach(element => element.click());
            const downloadContainer = await waitElement('div.quote');
            DownloadArea = [downloadContainer];
        },
    },
    {
        regex: /(hpjav|hpav).tv\/(ja\/)?\d+/,
        handler: async () => {
            copyOffsetArea = document.querySelector('section div ol li.active');
            CoverImage = document.querySelector('#JKDiv_0') ? GetBackGroundUrl(document.querySelector('#JKDiv_0')) : '';

            await sleep(1000);
            document.querySelector('#download_div.btn.btn-info')?.click();

            const downloadContainer = await waitElement('div#down_server');
            const downloadList = await waitElement('ul.pricing-table', downloadContainer);

            DownloadArea = [downloadList];
            Array.from(DownloadArea).forEach((linkEntry) => {
                Array.from(linkEntry.querySelectorAll('a')).forEach((aEntry) => {
                    if (RootDomain !== extractRootDomain(aEntry.href)) {
                        aEntry.classList.remove("dbtn");
                        aEntry.removeAttribute('type');
                        aEntry.textContent = aEntry.href;
                        aEntry.insertAdjacentHTML('beforebegin', '<img src=https://www.google.com/s2/favicons?domain=' + extractRootDomain(aEntry.href) + ' >');
                    }
                });
            });
            scrollToTop();
            RefreshIconSet();
        },
    },
    {
        regex: /models-nudeteen\.org\/.*\.html/,
        handler: async () => {
            copyOffsetArea = document.querySelector('div#dle-content article.full div.m-title h1');
            let DownloadAreaSelector;
            const waiting = await waitElement('div.title_spoiler', document.querySelector('div#dle-content'), { timeout: 500 });
            if (waiting) {
                DownloadAreaSelector = 'div#dle-content article.full .text_spoiler';
            } else {
                DownloadAreaSelector = 'div#dle-content article.full div.sub-wrap';
            }

            const downloadArea = await waitElement(DownloadAreaSelector);
            DownloadArea = [downloadArea];
            RefreshIconSet();
        },
    },
    {
        regex: /pornobunny\.org\/.+/,
        handler: async () => {
            copyOffsetArea = document.querySelector('.titlesf');
            document.querySelector('a.quote-hider-trigger')?.click();

            const downloadContainer = await waitElement('div.sstory');
            const observer = observeChanges('div.sstory', (mutations, obs) => {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('quote')) {
                            const DownloadAreaSelector = 'div.quote';
                            DownloadArea = downloadContainer.querySelectorAll(DownloadAreaSelector);
                            if (DownloadArea?.length) {
                                obs.disconnect();
                                scrollToTop();
                                RefreshIconSet();
                            }
                        }
                    });
                });
            });

            Resolution = !Resolution && copyOffsetArea?.innerText.match(/[0-9]{3,4}p/) ? ' ' + copyOffsetArea.innerText.match(/[0-9]{3,4}p/)[0] : '';
        },
    },
    {
        regex: /pornrip\.cc\/.+\.html/,
        handler: async () => {
            copyOffsetArea = document.querySelector('.title.ularge');
            const downloadContainer = await waitElement('section.post-content div.su-spoiler-content');
            const DownloadAreaSelector = 'section.post-content div.su-spoiler-content';
            DownloadArea = document.querySelectorAll(DownloadAreaSelector);
            if (downloadContainer) {
                for (const Area of DownloadArea) {
                    Array.from(Area.querySelectorAll('a')).forEach((aEntry) => {
                        if (/\?site.+$/.test(aEntry.href)) {
                            aEntry.setAttribute('href', aEntry.href.replace(/\?site.+$/, ''));
                        }
                    });
                }
                scrollToTop();
                RefreshIconSet();
            }
            Resolution = !Resolution && copyOffsetArea?.innerText.match(/[0-9]{3,4}p/) ? ' ' + copyOffsetArea.innerText.match(/[0-9]{3,4}p/)[0] : '';
        },
    },
];


async function Start() {
    console.log('Link Copy Start!');

    if (currentConfig) {

        // Step 1: `copyOffsetArea`가 이미 설정되지 않았으면 기본 셀렉터로 찾기

        if (!copyOffsetArea && currentConfig.copyOffsetAreaSelector) {
            copyOffsetArea = document.querySelector(currentConfig.copyOffsetAreaSelector);
            if (!copyOffsetArea) {
                throw new Error('필수 요소 copyOffsetArea를 찾을 수 없습니다.');
            }
        }

        // Step 2: `postProcess`에서 동적 셀렉터를 설정할 경우를 대비해 먼저 실행
        if (currentConfig.postProcess) {
            currentConfig.postProcess(currentConfig);
        }



        // Step 3: `DownloadArea`가 이미 설정되지 않았으면 기본 셀렉터나 동적 함수로 찾기
        if (!DownloadArea) {
            if (typeof currentConfig.getDownloadArea === 'function') {
                DownloadArea = currentConfig.getDownloadArea(copyOffsetArea);
            } else if (currentConfig.downloadAreaSelector) {
                DownloadArea = document.querySelectorAll(currentConfig.downloadAreaSelector);
            }

        }

        // Step 4: `CoverImage` 결정
        if (!CoverImage && currentConfig.coverImageSelector) {
            const imgEl = document.querySelector(currentConfig.coverImageSelector);
            if (imgEl) {
                CoverImage = imgEl.getAttribute(currentConfig.coverImageAttribute) ||
                    imgEl.getAttribute(currentConfig.coverImageFallbackAttribute || currentConfig.coverImageAttribute) ||
                    imgEl.src;
            }
        }

        // Step 5: `Resolution` 결정
        if (!Resolution && currentConfig.resolutionFromCopyOffset && copyOffsetArea) {
            const resMatch = copyOffsetArea.innerText.match(/[0-9]{3,4}p/);
            if (resMatch) Resolution = ' ' + resMatch[0];
        }

        // Step 6: DownloadArea 기다림
        if (!DownloadArea || DownloadArea?.length === 0) {
            const matchingConfig = waitDownloadArea.find(config => config.regex.test(PageURL));
            if (matchingConfig) {
                await matchingConfig.handler();

            }
        }

    }
    if (!copyOffsetArea) {
        throw new Error('No CopyTitle');
    }

    console.log('Start:', { copyOffsetArea, DownloadArea, CoverImage });
    return { copyOffsetArea, DownloadArea, CoverImage };
}




async function processCopyTitle(currentConfig) {
    console.log(`Start processCopyTitle`, currentConfig);

    CopyTitle = CopyTitle || copyOffsetArea?.textContent.trim() || '';
    if (/naughtyblog\.(org|my)/.test(PageURL) && /SITERIP|OnlyFans|Collection|Updates/i.test(CopyTitle)) {
        CopyTitle = getDirectInnerText(copyOffsetArea)?.trim();
    }

    // 사이트별 특별 규칙 적용
    const rule = siteRules.find((r) => r.regex.test(PageURL));
    if (rule) {
        console.log(rule);
        CopyTitle = await rule.handler(CopyTitle, copyOffsetArea, DownloadArea);
    }


    console.log({ CopyTitle });


    // 공통 제목 정리 로직
    CopyTitle = CopyTitle
        .replace('–', '-')
        .replace('[KBJ]', '')
        .replace(/\s+/g, ' ')
        .replace(/(?!^)\[(UltraHD|FullHD|HD).+\].*/, '')
        .replace(/^\[(UltraHD|FullHD|HD).+\]/, '')
        .replace(/^(Japanese\sporn\s-|6000Kbps\sFHD|4K\sFHD|Download)/, '')
        .replace('[FHD/4K]', '')
        .replace('[4K/FHD]', '')
        .replace(/^\[4K\]/i, '')
        .replace(/^6000KbpsFHD/i, '')
        .replace('[FHD/SD]', '')
        .replace('[FHD-SD]', '')
        .replace(/^\[FHD\]/, '')
        .replace(/\[SD\s\d+p\]/, '')
        .replace(/^(FC2-PPV-|FC2\sPPV-|FC2PPV-)/i, 'FC2 PPV ')
        .trim();



    // 모든 사이트에 공통으로 적용되는 최종 정리
    CopyTitle = /(–\sSiterip)\s–.+/.test(CopyTitle) ? CopyTitle.match(/(.+Siterip)\s–.+/)[1] : CopyTitle;
    CopyTitle = CopyTitle.replace(/\.mp4-\w+/i, '');
    CopyTitle = nameCorrection(CopyTitle);

    // 길이 제한 및 ID 처리
    if (byteLengthOfCheck(CopyTitle) > 241) {
        const titleLast = getLastText(CopyTitle);
        console.log({ titleLast });
        let finalTitle;
        const limitText = 240;
        if (!titleLast || !/[^\s]/.test(titleLast)) {
            finalTitle = byteLengthOf(CopyTitle, limitText).trim();
        } else {
            let tempTitle = CopyTitle.split(titleLast)[0].trim();
            tempTitle = byteLengthOf(tempTitle, limitText - byteLengthOfCheck(titleLast));
            finalTitle = (tempTitle + titleLast).trim();
        }
        CopyTitle = finalTitle;
    }



    //【 로 시작하고 】로 끝나지 않는 경우
    if (CopyTitle.lastIndexOf('】')) {
        const closingBracketIndexEndPoint = CopyTitle.lastIndexOf('】');
        const closingBracketIndexStartPoint = CopyTitle.lastIndexOf('【');
        if (closingBracketIndexEndPoint < closingBracketIndexStartPoint) {
            CopyTitle = CopyTitle.substring(0, closingBracketIndexStartPoint).trim();
        }
    }

    if (CopyTitle) {
        SkipTitle = CheckSkipTitle();
    }
    return CopyTitle;
}

function createDownloadArea(DB) {
    // Remove existing DownloadArea container if present
    const existing = document.querySelector('div.DownloadArea');
    if (existing) {
        existing.remove();
    }

    // Create a container div
    const container = document.createElement("div");
    container.classList.add("DownloadArea");

    // Use a document fragment to minimize reflows
    const fragment = document.createDocumentFragment();

    DB.forEach((htmlString) => {
        if (typeof htmlString !== 'string') return; // skip invalid entries

        // Create nodes from the HTML string
        const tempFragment = document.createRange().createContextualFragment(htmlString);

        // Append all top-level nodes from tempFragment into fragment
        // (not just first child, in case multiple siblings)
        tempFragment.childNodes.forEach(node => fragment.appendChild(node));
    });

    // Append the whole fragment at once to container
    container.appendChild(fragment);

    // Append container to body
    document.body.appendChild(container);

    // Update global DownloadArea variable to the new NodeList
    DownloadArea = document.querySelectorAll('div.DownloadArea');

    console.log('DownloadArea: ', DownloadArea);

    return DownloadArea;
}

// 파일명을 추출할 각 호스트에 대한 설정 객체
const hostConfigs = {
    katfile: {
        selector: 'form#btn_download .container.hidden-xs.visible h2.text-left span',
        // 추후 필요시 추가적인 로직을 handler 함수로 정의할 수 있습니다.
    },
    ddl: {
        selector: 'div.name-info .name.position-relative h4',
    },
};

/**
 * 주어진 링크에서 파일 이름을 비동기적으로 가져옵니다.
 * @param {string} targetLink - 파일 이름을 가져올 웹페이지의 URL.
 * @param {string} host - 호스트 이름 (예: 'katfile', 'ddl').
 * @returns {Promise<string>} 정리된 파일 이름을 반환하는 Promise.
 */
async function GetFileName(targetLink, host) {
    // 호스트 설정이 존재하지 않으면 오류를 반환합니다.
    const config = hostConfigs[host];
    if (!config) {
        throw new Error(`Unknown host: ${host}`);
    }

    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: 'GET',
            mozAnon: true,
            url: targetLink,
            responseType: 'text',
            onload: (res) => {
                if (res.status !== 200) {
                    return reject(new Error(`Failed to fetch filename. HTTP status: ${res.status}`));
                }

                // HTML 파싱
                const doc = document.implementation.createHTMLDocument();
                doc.documentElement.innerHTML = res.responseText;

                // 설정된 선택자를 사용하여 파일명 요소 찾기
                const filenameElement = doc.querySelector(config.selector);

                if (!filenameElement || !filenameElement.textContent) {
                    return reject(new Error('Filename element not found or is empty.'));
                }

                // 파일명 정리: '.partN' 또는 '.rar' 이후의 문자열 제거
                const cleanedTitle = filenameElement.textContent
                    .replace(/\.(part\d+|rar).*/i, '')
                    .replace(/^\//, '')
                    .trim();

                resolve(cleanedTitle);
            },
            onerror: (err) => {
                reject(new Error(`Network request failed: ${err.message}`));
            },
        });
    });
}


function AddSpaceUpperCaseText(pre, s) {
    let t;
    while (/(?=(.*?)([a-z])([A-Z])(.+))(?!.*?(OnlyFans|DxD)).*$/.test(s)) {
        s = s.replace(/^(?=(.*?)([a-z])([A-Z])(.+))(?!.*?(OnlyFans|DxD)).*$/g, "$1$2 $3$4");
    }

    while (/([a-z])-([A-Z0-9])/.test(s)) {
        s = s.replace(/([a-z])-([A-Z0-9])/g, "$1 - $2");
    }
    t = pre + ' ' + s;
    return t.replace(/\s{2,}/g, ' ');
}

// 외부 모듈에서 필요한 함수와 변수를 가져온다고 가정합니다.
// import { listToDo, CheckDB, FirstStep, PackageList } from './utils.js';

// 토글 설정을 한 곳에 모아 관리
const toggleConfigs = {
    AutoClose: 'AutoClose',
    AutoCopy: 'AutoCopy',
};

// UI 상태를 업데이트하는 함수
function updateUI(GetState, PackageCount) {
    try {
        const stateEl = document.querySelector('.State');
        const clearBtn = document.querySelector('.ClearButton');
        const copyBtn = document.querySelector('.CopyButton');
        const minusElement = document.querySelector('.Minus');

        if (stateEl) {
            stateEl.textContent = `${GetState} | ${PackageCount}`;
            clearBtn.style.color = 'LimeGreen';
            copyBtn.style.color = 'LimeGreen';
        }

        if (GetState === 0) {
            clearBtn.style.opacity = '0.25';
            copyBtn.style.opacity = '0.25';
            if (minusElement) {
                minusElement.style.visibility = 'hidden';
            }
        } else {
            clearBtn.style.opacity = '1';
            copyBtn.style.opacity = '1';
        }
    } catch {
        // UI 요소가 없거나 오류가 발생했을 때 재시작 로직
        if (copyOffsetArea && !LinkCopyCenterBox) {
            setTimeout(() => {
                document.location.reload();
            }, 60000);
        }
    }
}

// 토글 버튼의 상태를 업데이트하는 함수
async function handleToggle(key, className) {
    const ev = document.querySelector(`.${className}`);
    if (!ev) return;

    const isEnabled = JSON.parse(localStorage.getItem(key));
    ev.classList.toggle('On', isEnabled);
    ev.classList.toggle('Off', !isEnabled);

    if (key === 'AutoCopy') {
        const hasCopied = await CheckDB(listToDo(DownloadArea), 'handleToggle');
        if (hasCopied.length === 0) {
            CopyGo(SkipTitle);
        }

    } else if (key === 'AutoClose') {
        if (isEnabled) {
            const hasCopied = await CheckDB(listToDo(DownloadArea), 'handleToggle');
            if (hasCopied.length === 0) {
                CopyGo(SkipTitle);
            }
        }
    }
}



async function FirstStep() {

    if (!LinkCopyCenterBox) {
        await mainIcon('First Run');
        indexedDBCache = await indexedDBUpdate();
    }
    for (const site of siteConfigs) {
        if (site.regex.test(PageURL) && (!site.condition || site.condition())) {
            currentConfig = site.config;
            break;
        }
    }
    if (!currentConfig) return console.log(`currentConfig not found`);
    Array.from(document.querySelectorAll('a')).forEach((aEntry) => {
        if (/(\/|=)(aHR0c[a-zA-z0-9]+={0,2})($|\/|\?|&|-?-?;?)/.test(aEntry.href)) {
            aEntry.setAttribute('href', atob(aEntry.href.match(/(\/|=)(aHR0c[a-zA-z0-9]+={0,2})($|\/|\?|&|-?-?;?)/)[2]).replace(/\?site=.+/, ''));
        }
        else if (/\?site.+$/.test(aEntry.href)) {
            aEntry.setAttribute('href', aEntry.href.replace(/\?site.+$/, ''));
        }
    });


    Start()
        .then((e) => {
            console.log('First Step OK: ', e);
            return SecondProcess();
        })
        .then((result) => {
            console.log('Second Process OK', result);
        })
        .catch((err) => {
            console.error(err.message);
        });

}


function RefreshIcon(Run) {
    GetDPI = window.devicePixelRatio;
    DefaultFontSize = getDefaultFontSize();

    console.log('GetDPI:', GetDPI, 'DefaultFontSize:', DefaultFontSize, Run);

    const baseScale = (1 / (GetDPI / 1.5)) * (16 / DefaultFontSize);
    const rem = (value) => `${value.toFixed(2)}rem`;

    CenterBoxFontSize = rem(baseScale);
    StateFontSize = rem(baseScale * 0.65);
    StateLineHeight = rem(baseScale);
    if (!LinkCopyCenterBox) return;  // safety check
    LinkCopyCenterBox.style.setProperty('font-size', CenterBoxFontSize, 'important');

    const iconSet = document.querySelector('.IconSet');
    if (iconSet) {
        const iconSetFontSize = rem(baseScale * 0.95);
        Object.assign(iconSet.style, { fontSize: iconSetFontSize });

        iconSet.style.setProperty('--SetTop', `${Math.floor(LinkCopyCenterBox.offsetTop + (LinkCopyCenterBox.offsetHeight - iconSet.offsetHeight) / 2)}px`);
        iconSet.style.setProperty('--SetLeft', `${Math.floor(LinkCopyCenterBox.offsetLeft + LinkCopyCenterBox.offsetWidth + LinkCopyCenterBox.offsetHeight)}px`);

    }

    const searchBox = document.querySelector('div.SearchBox');
    if (searchBox && copyOffsetArea) {
        // Get a reference to the SearchBox and Favicon elements

        const favicon = document.querySelector('img.Favicon');
        searchBox.style.maxWidth = rem(baseScale * 0.9 * 3);
        searchBox.style.top = `${Math.floor(copyOffsetArea.offsetTop + (copyOffsetArea.offsetHeight / 20))}px`;
        searchBox.style.left = `${Math.floor(copyOffsetArea.offsetLeft + copyOffsetArea.offsetWidth - searchBox.offsetWidth * 1.5)}px`;
        searchBox.style.height = rem(baseScale * 0.9);

        // Set styles for the Favicon
        if (favicon) {
            favicon.style.width = rem(baseScale * 0.9);
            favicon.style.height = rem(baseScale * 0.9);
        }
    }
}


async function mainIcon(Run) {
    GetDPI = window.devicePixelRatio;
    DefaultFontSize = getDefaultFontSize();
    console.log('GetDPI:', GetDPI, 'DefaultFontSize:', DefaultFontSize, Run);

    // Avoid duplicate insertion
    if (!document.querySelector('.LinkCopyCenterBox')) {
        document.body.insertAdjacentHTML('beforeend', `
            <div class="LinkCopyCenterBox">
                <i class="ToTop fa-solid fa-circle-chevron-up"></i>
                <i class="ClearButton far fa-minus-square"></i>
                <i class="CopyButton fas fa-paste"></i>
                <i class="State"></i>
            </div>
        `);
    }

    LinkCopyCenterBox = document.querySelector('.LinkCopyCenterBox');
    if (!LinkCopyCenterBox) return; // safety
    LinkCopyCenterBox.style.setProperty('font-size', ((1 / (GetDPI / 1.5)) * (16 / DefaultFontSize)) + 'rem', 'important');
    io.observe(LinkCopyCenterBox);

    // Scroll to top button
    LinkCopyCenterBox.querySelector('.ToTop').onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    let lastExecutionTime = performance.now();
    window.visualViewport.addEventListener('resize', () => {
        const now = performance.now();
        if (now - lastExecutionTime >= 500) {
            io.observe(LinkCopyCenterBox);
            RefreshIcon(performance.now());
        }
        lastExecutionTime = now;
    });

    window.addEventListener('pageshow', () => {
        const now = performance.now();
        if (now - lastExecutionTime >= 2000) {
            RefreshIcon(performance.now());
        }
        lastExecutionTime = now;
    });


    const myObserver = new ResizeObserver(entries => {
        const now = performance.now();
        if (now - lastExecutionTime >= 5000) {
            io.observe(LinkCopyCenterBox);
            RefreshIcon(performance.now());
            console.log(`Execution time: ${now - lastExecutionTime} ms`);
            lastExecutionTime = now;
        }
    });
    myObserver.observe(LinkCopyCenterBox.querySelector('.ToTop'));

    // Update State and button opacity    
    const clearBtn = LinkCopyCenterBox.querySelector('.ClearButton');
    const copyBtn = LinkCopyCenterBox.querySelector('.CopyButton');


    if ((GetState || 0) === 0) {
        clearBtn.style.opacity = '0.25';
        copyBtn.style.opacity = '0.25';
    } else {
        clearBtn.style.opacity = '0.25';
        copyBtn.style.opacity = '1';
    }

    // Insert AutoClose and AutoCopy icons only once
    if (!LinkCopyCenterBox.querySelector('.AutoClose')) {
        const autoCloseOn = JSON.parse(localStorage.getItem('AutoClose'));
        LinkCopyCenterBox.insertAdjacentHTML('afterbegin', `<i class="AutoClose ${autoCloseOn ? 'On' : 'Off'} fa-solid fa-square-check"></i>`);
    }
    if (!LinkCopyCenterBox.querySelector('.AutoCopy')) {
        const autoCopyOn = JSON.parse(localStorage.getItem('AutoCopy'));
        LinkCopyCenterBox.insertAdjacentHTML('afterbegin', `<i class="AutoCopy ${autoCopyOn ? 'On' : 'Off'} fa-solid fa-paste"></i>`);
    }

    const AutoCopyIcon = LinkCopyCenterBox.querySelector('.AutoCopy');
    const AutoCloseIcon = LinkCopyCenterBox.querySelector('.AutoClose');

    AutoCloseIcon?.addEventListener('click', async (e) => {
        e.preventDefault();
        if (AutoCloseIcon.classList.contains('Off')) {
            AutoCloseIcon.classList.remove('Off');
            AutoCloseIcon.classList.add('On');
            AutoCopyIcon.classList.remove('Off');
            AutoCopyIcon.classList.add('On');
            localStorage.setItem('AutoClose', JSON.stringify(true));
            localStorage.setItem('AutoCopy', JSON.stringify(true));
            if (DownloadArea?.length > 0) {
                const hasCopied = await CheckDB(listToDo(DownloadArea), 'click');
                if (hasCopied.length === 0) {
                    CopyGo(SkipTitle);
                }
            }
        } else {
            AutoCloseIcon.classList.remove('On');
            AutoCloseIcon.classList.add('Off');
            localStorage.setItem('AutoClose', JSON.stringify(false));
        }
    });

    AutoCopyIcon?.addEventListener('click', async (e) => {
        e.preventDefault();
        if (AutoCopyIcon.classList.contains('Off')) {
            AutoCopyIcon.classList.remove('Off');
            AutoCopyIcon.classList.add('On');
            localStorage.setItem('AutoCopy', JSON.stringify(true));
            if (DownloadArea?.length > 0) {
                const hasCopied = await CheckDB(listToDo(DownloadArea), 'click');
                if (hasCopied.length === 0) {
                    CopyGo(SkipTitle);
                }
            }
        } else {
            AutoCopyIcon.classList.remove('On');
            AutoCopyIcon.classList.add('Off');
            AutoCloseIcon.classList.remove('On');
            AutoCloseIcon.classList.add('Off');
            localStorage.setItem('AutoCopy', JSON.stringify(false));
            localStorage.setItem('AutoClose', JSON.stringify(false));
        }
    });

    clearBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        if (JSON.parse(localStorage.getItem('NewAdded'))) {
            if (window.confirm("Not Yet Copy! Clear?")) {
                localStorage.setItem('NewAdded', JSON.stringify(false));
                ClearUrls();
                CopyLinks = [];
            }
        } else {
            ClearUrls();
            CopyLinks = [];
        }
    });

    copyBtn?.addEventListener('click', async (e) => {
        e.preventDefault();
        clearBtn.style.visibility = 'hidden';
        localStorage.setItem('NewAdded', JSON.stringify(false));
        await ClipPaste();
        await sleep(1000);
        clearBtn.style.visibility = 'visible';
        clearBtn.style.opacity = '1';
    });
}





async function SecondProcess() {
    console.log('before processCopyTitle CopyTitle:', CopyTitle, copyOffsetArea, DownloadArea);
    if (copyOffsetArea && DownloadArea && pageLinksDB.length === 0) {
        await processCopyTitle(currentConfig);
    }
    console.log('after processCopyTitle CopyTitle:', CopyTitle);

    console.log('Start SecondProcess!');

    return new Promise((resolve, reject) => {
        if (!copyOffsetArea) {
            reject(new Error('No copyOffsetArea'));
        }


        if (!document.querySelector(".IconSet")) {
            LinkCopyCenterBox.insertAdjacentHTML('afterend', `
            <div class="IconSet" style="max-width: max-content; visibility: hidden; position: fixed;">
                <i class="CopyIcon far fa-clone" style="color: goldenrod !important; visibility: hidden;"></i>
                <i class="CloseIcon fa-solid fa-square-xmark" style="color: goldenrod !important; visibility: hidden;"></i>
                <i class="Minus fa-solid fa-magnifying-glass-minus" style="color: goldenrod !important; visibility: hidden;"></i>
            </div>
        `);
            document.body.insertAdjacentHTML('beforeend', `<div class="CopyNotice" style="display: none;"><div class="copyText"></div></div>`);

            const IconSetBox = document.querySelector(".IconSet");
            const copyIcon = IconSetBox.querySelector('.CopyIcon');
            const closeIcon = IconSetBox.querySelector('.CloseIcon');
            const Minus = IconSetBox.querySelector('.Minus');

            copyIcon.addEventListener('click', function (e) {
                e.preventDefault();
                CopyLinks = [];

                if (pageLinksDB.length === 0 && currentConfig.downloadAreaSelector) {
                    DownloadArea = document.querySelectorAll(currentConfig.downloadAreaSelector);
                }
                userClose = true;
                userCopy = true;

                const SkipTitle = [];
                AllowDirect = false;
                if (DownloadArea?.length) {
                    userClose = JSON.parse(localStorage.getItem('AutoClose'));
                    CopyGo(SkipTitle);
                }
            });
            closeIcon.addEventListener('click', function (e) {
                e.preventDefault();
                self.close();
            });
            Minus.addEventListener('click', async function (e) {
                e.preventDefault();
                await RemoveDB(listToDo(DownloadArea, 'All'), 'SecondProcess RemoveDB');
                await CheckDB(listToDo(DownloadArea), 'SecondProcess CheckDB');
                CopyLinks = [];
            });
        }

        if (/0xxx\.ws\/articles|pornrip\.cc\/download/.test(PageURL)) {
            RefreshIconSet();
        }

        for (const NodeArea of DownloadArea) {
            Array.from(NodeArea.querySelectorAll('a')).forEach((aEntry) => {
                const match = aEntry.href.match(/(\/|=)(aHR0c[a-zA-Z0-9]+={0,2})($|\/|\?|&|-?-?;?)/);
                if (match) {
                    aEntry.href = atob(match[2]).replace(/\?site=.+/, '');
                }
            });
        }

        console.log('AutoCopy:', AutoCopy, 'localStorage AutoCopy:', JSON.parse(localStorage.getItem('AutoCopy')));

        if (/^((?!(sharepornlink|hpav\.tv|pornrips\.cc|naughtyblog)).)*$/.test(PageURL)) {
            if (document.querySelector(".Minus").style.visibility === "hidden" && AutoCopy && JSON.parse(localStorage.getItem('AutoCopy'))) {
                console.log('CopyGo');
                CopyGo(SkipTitle);
            }
        } else if (/naughtyblog/.test(PageURL) && AutoCopy && JSON.parse(localStorage.getItem('AutoCopy'))) {
            console.log('CopyGo');
            CopyGo(SkipTitle);
        }
        RefreshIconSet();
        resolve({ CopyTitle, DownloadArea });
    });
}


async function RefreshIconSet() {
    GetDPI = window.devicePixelRatio;
    DefaultFontSize = getDefaultFontSize();

    const iconSet = document.querySelector(".IconSet");
    if (iconSet) {
        iconSet.style.visibility = "visible";

        const closeIcon = document.querySelector(".CloseIcon");
        if (closeIcon) closeIcon.style.visibility = "visible";

        const iconSetFontSize = Number(((1 / (GetDPI / 1.5)) * (16 / DefaultFontSize) * 0.95).toFixed(2)) + 'rem';
        Object.assign(iconSet.style, { fontSize: iconSetFontSize });

        // Wait for position info to stabilize (max 1.25 seconds)
        let waitTime = 0;
        while (LinkCopyCenterBox.offsetLeft === 0 && waitTime <= 5) {
            await sleep(250);
            waitTime++;
        }

        iconSet.style.setProperty('--SetTop', `${Math.floor(LinkCopyCenterBox.offsetTop + (LinkCopyCenterBox.offsetHeight - iconSet.offsetHeight) / 2)}px`);
        iconSet.style.setProperty('--SetLeft', `${Math.floor(LinkCopyCenterBox.offsetLeft + LinkCopyCenterBox.offsetWidth + LinkCopyCenterBox.offsetHeight)}px`);
    }

    if (DownloadArea?.length && iconSet) {
        const copyIcon = document.querySelector('.CopyIcon');
        if (copyIcon) copyIcon.style.visibility = "visible";
    }
}



function CheckOnline(TargetLink) {
    let Selector;
    let Host = extractRootDomain(TargetLink);

    switch (Host) {
        case 'rapidgator.net':
            Selector = 'div.text-block.file-descr div.btm p a';
            break;
        case 'k2s.cc':
            Selector = 'div#current-file.file-box div.download-box div.download-body span.name-file';
            break;
        case 'mexa.sh':
            Selector = 'div#page table tbody tr td table tbody tr th a';
            break;
        case 'uploadgig.com':
            Selector = 'div.panel-heading span.filename';
            break;
        case 'subyshare.com':
            Selector = 'div.container h3';
            break;
        default:
            // Unknown host, return false immediately
            return Promise.resolve(false);
    }

    return new Promise((resolve) => {
        GM_xmlhttpRequest({
            method: 'GET',
            mozAnon: true,
            url: TargetLink,
            onload: function (result) {
                let container = document.implementation.createHTMLDocument().documentElement;
                container.innerHTML = result.responseText;
                if (container.querySelector(Selector)) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            },
            onerror: function (error) {
                // If no response or network failure, treat as offline
                resolve(false);
            }
        });
    });
}



function CheckSkipTitle() {
    console.log(`Check CheckSkipTitle: ${CopyTitle}`);
    if (!CopyTitle) return false;  // Early exit if no title

    // Find skip word/model matches
    let WM = CopyTitle.match(SkipWordEx) || [];
    let MM = CopyTitle.match(SkipModelEx) || [];

    console.log('CopyTitle:', CopyTitle, 'Skip Words:', WM, 'Skip Models:', MM);

    // Unique values to avoid duplicates
    let W = [...new Set(WM)];
    let M = [...new Set(MM)];

    if (W.length || M.length) {
        SkipTitle = [...W, ...M];

        // Create or update CopyState div for status
        if (!document.querySelector('.CopyState')) {
            LinkCopyCenterBox.insertAdjacentHTML('beforeend', '<div class="CopyState"></div>');
        }
        let copyStateEl = document.querySelector('.CopyState');
        let CopyStateFontSize = Number(((1 / (GetDPI / 1.5)) * 0.65 * (16 / DefaultFontSize)).toFixed(2));
        copyStateEl.style.setProperty('font-size', `${CopyStateFontSize}rem`, 'important');

        // Set flags indicating skip conditions
        userClose = false;
        userCopy = false;

        // Show messages for skip words/models
        copyStateEl.innerText = '';
        if (W.length) copyStateEl.innerText += 'Skip Word: ' + W.join('/');
        if (M.length) copyStateEl.innerText += (W.length ? '\n' : '') + 'Skip Model: ' + M.join('/');
        if (copyStateEl.innerText.trim()) {
            copyStateEl.classList.add('innerText');
        }
    }

    // Special handling for titles starting with [Cospuri]
    let TempTitle = CopyTitle.match(/(^\[?Cospuri\]?)?(.*?-.*)/);
    if (/^\[?Cospuri/i.test(CopyTitle) && TempTitle && TempTitle[2] && /[a-zA-Z]+/.test(TempTitle[2])) {
        CopyTitle = AddSpaceUpperCaseText(TempTitle[1], TempTitle[2]);
        console.log('Final CopyTitle:', CopyTitle);
    }

    console.log('SkipTitle:', SkipTitle);
    return SkipTitle;
}


async function CopyGo(SkipTitle) {

    console.log(`CopyGo! ${SkipTitle}`, SkipTitle.length);
    if (!Array.isArray(SkipTitle)) {
        throw new Error('No Array SkipTitle');
    }
    if (Array.isArray(SkipTitle) && SkipTitle.length !== 0) return console.log(`SkipTitle: ${SkipTitle}`);

    const shortUrlExists = () =>
        Array.from(document.querySelectorAll("a")).some(a => WaitChangeLink.test(a.href));

    if (shortUrlExists()) {
        const observer = new MutationObserver(async (mutations, obs) => {
            // Check if short URLs still exist after mutation
            if (!shortUrlExists()) {
                console.log('No more short links. Proceeding with copy.');
                obs.disconnect();
            }
        });

        observer.observe(document.body, {
            attributes: true,
            childList: true,
            subtree: true,
            attributeFilter: ['href']
        });
    } else {
        console.log('No short links detected. Starting copy.');

    }
    if (!userCopy) return;
    Promise.resolve(CopyLink())
        .then(() => {
            // Update UI notification styles
            const copyNotice = document.querySelector('.CopyNotice');
            const copyText = document.querySelector('.CopyNotice .copyText');
            const linkCopyCenterBox = document.querySelector('.LinkCopyCenterBox');

            // 변수들을 미리 계산합니다.
            const fontSizeValue = Number(((1 / (GetDPI / 1.5)) * 0.6 * (16 / DefaultFontSize)).toFixed(2));
            const topValue = linkCopyCenterBox.offsetTop + linkCopyCenterBox.offsetHeight * 1.2;
            const leftValue = linkCopyCenterBox.offsetLeft - linkCopyCenterBox.offsetWidth / 5;

            // 계산된 값을 요소의 style 속성에 직접 할당합니다.
            copyNotice.style.fontSize = `${fontSizeValue}rem`;
            copyNotice.style.top = `${topValue}px`;
            copyNotice.style.left = `${leftValue}px`;
            copyNotice.style.height = copyText.scrollHeight + "px";


            const copyIcon = document.querySelector(".CopyIcon");
            if (copyIcon) copyIcon.style.color = "orange";
            const closeIcon = document.querySelector(".CloseIcon");
            if (closeIcon) closeIcon.style.visibility = "visible";
            console.log(copyText, copyText.innerText);
            if (copyText.innerText.trim()) {
                //await showThenHide(notice, { duration: 800, pause: 2000 });
                fadeSlideToggle(copyNotice, 1000);
            }
            // 6) Finally, re-check the DB and return its result
            CheckDB(listToDo(DownloadArea), 'CopyGo');
        });
}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


//Match
function MatchRegexElement(Taget, regex, attributeToSearch) {
    if (regex.test(Taget.getAttribute(attributeToSearch))) {
        return true;
    }
    else {
        return false;
    }
}


async function CollectionCoverImage(CoverImage) {
    let result = [];

    CoverImage = /vpdmm\.cc/.test(CoverImage) ? CoverImage.replace('vpdmm.cc', 'dmm.co.jp') : CoverImage;
    if (CoverImage && !/imagetwist\.com/.test(CoverImage)) {
        await UpdateDB(CoverImage, FilenameConvert(`${CopyTitle}${Resolution || ''}`));
    }
    result.push(CoverImage);
    return result;
}



async function CollectionLinks(DownloadArea) {
    const CollectionATag = [];
    const shortLinkRegex = /(\/|=)(aHR0c[a-zA-Z0-9]+={0,2})(?=$|[\/?&;\-])/;
    const siteParamRegex = /\?site.+$/;
    const skipFileNameRegex = SkipFileName;

    // 1) Gather all <a> elements and normalize their hrefs
    for (let i = 0; i < DownloadArea.length; i++) {
        // For xscandals.com, only process the first paragraph
        if (/xscandals\.com/.test(PageURL) && i > 0) break;

        const anchors = Array.from(DownloadArea[i].querySelectorAll('a'));
        for (const a of anchors) {
            let href = a.href;

            // Decode “aHR0c…” short links
            const m = href.match(shortLinkRegex);
            if (m) {
                href = atob(m[2]).replace(/\?site=.+/, '');
            }
            // Strip trailing “?site=…”
            else if (siteParamRegex.test(href)) {
                href = href.replace(siteParamRegex, '');
            }

            a.setAttribute('href', href);
            CollectionATag.push(a);
        }
    }

    // 1a) If still no links, try auto-injecting from plain text then re-run
    if (CollectionATag.length === 0) {
        let injected = 0;
        for (const node of DownloadArea) {
            const text = node.textContent;
            const fullMatch = linkEreg.exec(text);
            if (fullMatch) {
                injected++;
                node.innerHTML = node.innerHTML.replace(
                    fullMatch[0],
                    `<a href="${fullMatch[0]}">${fullMatch[0]}</a>`
                );
            }
        }
        if (injected) {
            // Recurse once after injection
            return CollectionLinks(DownloadArea);
        }
    }

    // 2) Apply skip-class filter
    let links = CollectionATag.filter(a =>
        !SkipClassNames.some(cls => a.classList.contains(cls))
    );

    // 2a) If special nicesss/nicewww/xtvtv pattern and a “short” link found, open in background
    const shortCandidate = links.find(a =>
        /(ouo\.|katfile\.com\/users|77file\.com)/.test(a.href)
    );
    if (/(nicesss|nicewww|xtvtv)\.com\/archives/.test(PageURL) && shortCandidate) {
        GM_openInTab(shortCandidate.href, { active: false });
        return;
    }

    // 2b) Otherwise apply the rest of your skip/quality filters:
    links = links
        .filter(a => !checkSkipFilter(a))
        .filter(a => {
            const name = a.href.split('/').pop();
            return !(skipFileNameRegex.test(name) || skipFileNameRegex.test(a.textContent));
        });

    // 2c) Skip links whose children are images (unless they pass your emoji/class test)
    if (!/models-nudeteen\.org|girlscanner\.org|avtv\./.test(PageURL)) {
        links = links.filter(a =>
            ![...a.children].some(img => img.tagName === 'IMG' && !MatchRegexElement(img, /emoji/, 'class'))
        );
    }

    // 2d) Optionally filter for quality (4K vs 1080p) if CopyTitle and not a “Collection”
    if (!/Collection|SITERIP|OnlyFans\sLeak/i.test(CopyTitle) && !/pornrips\.cc|naughtyblog/.test(PageURL)) {
        const UHD = /4K-ARCHIVE-?|ARCHIVE-4K-?|(-|_|\.)?4K$/i;
        const FHD = /\.(1080p|HD)/i;
        const allNames = links.map(a => GetName(a.href));
        const UHDLinks = [...new Set(allNames.filter(f => UHD.test(f)).map(n => n.replace(UHD, '')))];
        const FHDlinks = [...new Set(allNames.filter(f => FHD.test(f)).map(n => n.replace(FHD, '')))];
        const uniqueBases = [...new Set([...UHDLinks, ...FHDlinks])];

        const resultLinks = [];
        if (uniqueBases.length) {
            for (const base of uniqueBases) {
                const group = links.filter(l => GetName(l.href).includes(base));
                const uhd = group.filter(l => UHD.test(GetName(l.href)));
                const fhd = group.filter(l => FHD.test(GetName(l.href)));
                resultLinks.push(...(uhd.length > 0 ? uhd : fhd.length > 0 ? fhd : group));
            }
            links = resultLinks;
        }
    }

    // 2e) Additional site-specific tweaks (blogjav, javarchive, etc.)
    if (/blogjav/.test(RootDomain)) {
        links = links.filter(a => !/\.(mp4|mkv)$/i.test(a.textContent));
    } else if (/javarchive/.test(RootDomain)) {
        const noSuby = links.filter(a => !/subyshare\.com/i.test(a.textContent));
        const parts = noSuby.filter(a => /part\d+\.rar/i.test(a.textContent));
        if (noSuby.length >= 3) {
            links = noSuby.filter(a => !/part\d+\.rar/i.test(a.textContent));
        } else if (parts.length >= 2) {
            links = parts;
        } else {
            links = noSuby;
        }
    }

    // 3) Finally, process each remaining link into CopyLinks and DB

    for (const a of links) {
        const href = a.href;
        if (CopyLinks.includes(href)) continue;

        CopyTitle = CopyTitle ? FilenameConvert(CopyTitle) : '';
        if (/naughtyblog/.test(RootDomain) && useResolution) {
            if (/[0-9]{3,4}p/.test(a.textContent)) {
                Resolution = `.XXX.${a.textContent.match(/[0-9]{3,4}p/)[0]}`;
            } else {
                Resolution = '';
            };
        }
        CopyLinks.push(href);
        await UpdateDB(href, `${CopyTitle}${Resolution || ''}`);
    }

    // Dedupe and return as newline-separated string (or empty array)
    CopyLinks = [...new Set(CopyLinks)];
    return CopyLinks;
}


function GetName(url) {
    let name = url.split('/').pop() || '';
    name = name.replace(/\.html$/, '').replace(/\.part\d+/, '');
    const lastDot = name.lastIndexOf('.');
    if (lastDot === -1) {
        return name; // no dot, return full name
    }
    return name.substring(0, lastDot);
}

async function UpdateDB(Target, UrlTitle) {
    PackageName = UrlTitle || '';
    //console.log(`UpdateDB ${Target} ${UrlTitle}`)
    if (Target.match(K2SRegExp)) {
        Target = Target.match(K2SRegExp)[1] + Target.match(K2SRegExp)[2].slice(0, 18);
    }
    console.log({ Target, UrlTitle });
    /*
        if (navigator.locks) {
            // HTTPS 환경일 때만 락 요청 로직 실행
            try {
                await navigator.locks.request('LinkCopyLock', { mode: 'exclusive' }, async () => {
                    await linkDB.add({ U: Target, T: UrlTitle, S: PageURL });
                });
            } catch (err) {
                console.warn('🔒 Lock 실패 또는 이미 다른 탭에서 실행 중');
            }
        } else {
            // HTTP 환경이거나 API를 지원하지 않을 때의 대체 로직
            console.log('경고: navigator.locks API는 현재 환경에서 지원되지 않습니다.');
            await linkDB.add({ U: Target, T: UrlTitle, S: PageURL });
        }
            */

    await linkDB.add({ U: Target, T: UrlTitle, S: PageURL });


    if (!JSON.parse(localStorage.getItem('NewAdded'))) {
        localStorage.setItem('NewAdded', JSON.stringify(true));
    }
    return indexedDBCache;
}

async function RemoveDB(listToDelete) {
    //console.log(`RemoveDB ${listToDelete}`)    
    for (const list of listToDelete) {
        /*
        if (navigator.locks) {
            // HTTPS 환경일 때만 락 요청 로직 실행
            try {
                await navigator.locks.request('LinkCopyLock', { mode: 'exclusive' }, async () => {
                    await linkDB.remove(list);
                });
            } catch (err) {
                console.warn('🔒 Lock 실패 또는 이미 다른 탭에서 실행 중');
            }
        } else {
            // HTTP 환경이거나 API를 지원하지 않을 때의 대체 로직
            console.log('경고: navigator.locks API는 현재 환경에서 지원되지 않습니다.');
            await linkDB.remove(list);
        }
            */
        await linkDB.remove(list);
    }

    indexedDBCache = await indexedDBUpdate();

    document.querySelector('.State').textContent = GetState + ' | ' + PackageCount;
    if (GetState == 0) {
        document.querySelector('.ClearButton').style = "opacity: 0.25;";
        document.querySelector('.CopyButton').style = "opacity: 0.25;";
    }
    else {
        document.querySelector('.ClearButton').style = "opacity: 0.25;";
        document.querySelector('.CopyButton').style = "opacity: 1;";
    }
    return indexedDBCache;
}


async function CheckDB(listTo, fromStep) {
    console.log(`CheckDB:`, listTo, fromStep);
    let isMatchFound = [];

    const minusElement = document.querySelector('.Minus');

    if (listTo.length === 0) {
        console.warn('No links to check in CheckDB');
        if (!document.querySelector('.CopyState')) {
            LinkCopyCenterBox.insertAdjacentHTML('beforeend', '<div class="CopyState"></div>');
        }
        let copyStateEl = document.querySelector('.CopyState');
        let CopyStateFontSize = Number(((1 / (GetDPI / 1.5)) * 0.65 * (16 / DefaultFontSize)).toFixed(2));
        copyStateEl.style.setProperty('font-size', `${CopyStateFontSize}rem`, 'important');

        // Set flags indicating skip conditions
        userClose = false;
        userCopy = false;

    }

    //console.log(indexedDBCache);
    if (indexedDBCache?.length > 0) {
        for (let link of listTo) {
            const searchDB = await indexedDBCache.find(({ U }) => U === link);
            if (searchDB) {
                isMatchFound.push(link);
                if (pageLinksDB.length > 0) {
                    const entry = pageLinksDB.find(item => item.U === link);
                    if (entry && entry.T !== searchDB.T) {
                        await linkDB.add({ U: link, T: entry.T, S: PageURL });
                    }
                }
                else if (PackageName && searchDB.T !== PackageName) {
                    /*
                    if (navigator.locks) {
                        // HTTPS 환경일 때만 락 요청 로직 실행
                        try {
                            await navigator.locks.request('LinkCopyLock', { mode: 'exclusive' }, async () => {
                                await linkDB.add({ U: Target, T: UrlTitle, S: PageURL });
                            });
                        } catch (err) {
                            console.warn('🔒 Lock 실패 또는 이미 다른 탭에서 실행 중');
                        }
                    } else {
                        // HTTP 환경이거나 API를 지원하지 않을 때의 대체 로직
                        console.log('경고: navigator.locks API는 현재 환경에서 지원되지 않습니다.');
                        await linkDB.add({ U: Target, T: UrlTitle, S: PageURL });
                    }
                        */
                    await linkDB.add({ U: link, T: PackageName, S: PageURL });
                }
            }
        }

        console.log('isMatchFound:', isMatchFound, isMatchFound.length);
        if (minusElement) {
            // 매칭 여부에 따라 요소의 가시성을 설정합니다.
            minusElement.style.visibility = isMatchFound.length > 0 ? 'visible' : 'hidden';
        }

        // 매칭이 발견되었을 때만 AutoClose 로직을 실행합니다.
        if (isMatchFound.length > 0) {
            await sleep(5000);
            const isAutoCloseEnabled = JSON.parse(localStorage.getItem('AutoClose'));
            console.log({ isAutoCloseEnabled, userClose });
            await sleep(1000);
            // AutoClose 변수와 localStorage 값을 모두 확인하여 실행합니다.
            if (isAutoCloseEnabled && userClose) {
                self.close();
            }
        }
    } else {

        if (minusElement) {
            minusElement.style.visibility = 'hidden';
        }


    }
    return isMatchFound;
}

function PackageList(LinksDB) {
    if (LinksDB?.length > 0) {
        let uniqueTitle = [...new Set(LinksDB.map(x => x.T))];
        //console.log(uniqueTitle)
        return uniqueTitle;
    }
    else {
        return [];
    }
}

async function CopyLink() {
    //console.log('Step CopyLink:', { CopyTitle, DownloadArea })        

    // Prepare notice text
    let noticeLines = [];
    let allLinks = [];
    SkipTitle = [];


    console.log('CopyLink: ', { pageLinksDB });
    // 1) If no temporary links waiting, gather fresh links
    if (pageLinksDB.length === 0) {
        let collected = await CollectionLinks(DownloadArea) || [];
        if (collected.length > 0) {
            // Optionally add cover image link
            if (CoverImage && !/imagetwist\.com/.test(CoverImage)) {
                const coverLink = await CollectionCoverImage(CoverImage);
                //console.log(coverLink, collected.concat(coverLink))
                if (coverLink) {
                    collected = collected.concat(coverLink);
                }
            }
            //console.log('collected : ', collected)
            allLinks = collected;

            // Fire off JDownloader if allowed
            const directOK = DirectCopy.test(PageURL) || AllowDirect;
            if (directOK) {
                JDownloader(collected.join('\n'), `${CopyTitle}${Resolution || ''}`, PageURL);
            }
            noticeLines.push(`${CopyTitle}${Resolution || ''}`);
            noticeLines.push(collected.join('\n'));
        } else {
            noticeLines.push('Empty Links');
            userClose = false;
        }
    }
    // 2) Otherwise replay from pageLinksDB
    else {
        // Group by title, then push URLs under each

        console.log('Use pageLinksDB: ', pageLinksDB);
        const uniqueTitles = [...new Set(pageLinksDB.map(e => e.T))].sort();
        for (const t of uniqueTitles) {
            noticeLines.push(t);
            const urls = pageLinksDB.filter(e => e.T === t).map(e => e.U);
            for (const u of urls) {
                await UpdateDB(u, t);
                allLinks.push(u);
                noticeLines.push(u);
            }
        }

        // Fire off JDownloader DB variant if allowed
        if (DirectCopy.test(PageURL) || AllowDirect) {
            JDownloaderDB(pageLinksDB);
        }
    }

    if (allLinks.length === 0) {
        SkipTitle = ['Link is Empty'];
        return allLinks;
    }
    // 3) Update UI notice
    const noticeEl = document.querySelector('.CopyNotice .copyText');
    noticeEl.textContent = noticeLines.join("\n");

    console.log('CopyLink: ', { indexedDBCache });

    await sleep(100);

    const stateEl = document.querySelector('.State');
    stateEl.textContent = `${GetState} | ${PackageCount}`;


    const clearBtn = document.querySelector('.ClearButton');
    const copyBtn = document.querySelector('.CopyButton');
    if (GetState === 0) {
        clearBtn.style.opacity = '0.25';
        copyBtn.style.opacity = '0.25';
    } else {
        clearBtn.style.opacity = '0.25';
        copyBtn.style.opacity = '1';
    }

    // 5) Decide whether to auto-close
    if (allLinks.length && JSON.parse(localStorage.getItem('AutoClose'))) {
        if (/naughtyblog\.(org|my)/.test(RootDomain) &&
            CopyTitle.match(/SITERIP|OnlyFans|Collection|Updates/i)) {
            userClose = false;
        } else {
            AutoClose = true;
        }
    }
    return allLinks;
}

function checkSkipFilter(el) {
    return skipFilterPatterns.some(rx => el.href && rx.test(el.href));
}

function listToDo(areas, type = 'Default') {
    if (!areas) return [];
    const seenAnchors = new Set();
    const todo = [];

    // 1) Collect all unique <a> elements under each area
    areas.forEach(area => {
        area.querySelectorAll('a').forEach(a => seenAnchors.add(a));
    });

    // 2) Filter and normalize each link
    for (const el of seenAnchors) {
        //el.href = el.href.replace(/\?site.+/, '');
        el.setAttribute('href', el.getAttribute('href').replace(/\?site.+/, ''));
        // Skip filtering patterns
        if (checkSkipFilter(el)) continue;
        // Skip links with image children for certain hosts
        if (/(uploadgig\.com\/file\/download|alfafile\.net\/file)/.test(el.href)) {
            const image = el.querySelector('img');
            if (image) {
                image?.remove();
                el.textContent = 'Download';
                el.parentElement.style.cssText += `
                                    white-space: nowrap;
                                    overflow: hidden;
                                    text-overflow: ellipsis;
                                    `;
            }

        }
        // Normalize K2S URLs
        let target = el.href;
        const k2s = el.href.match(K2SRegExp);
        if (k2s) {
            target = k2s[1] + k2s[2].slice(0, 18);
        }

        if (!todo.includes(target)) {
            todo.push(target);
        }
    }

    // 3) Optionally include the cover image
    if (type === 'All' && CoverImage) {
        todo.push(CoverImage);
    }

    return todo;
}


async function MutilSubTitle(MatchWeb, MatchWebPoint, InfoAreaCast) {
    userClose = false;
    userCopy = false;
    console.log('MutilSubTitle AutoCopy: ', AutoCopy);
    console.log('Mutil SubTitle.... ', MatchWeb, MatchWebPoint, InfoAreaCast);
    let Empty = [];
    let AllLinks = [];
    pageLinksDB = [];
    SkipTitle = [];
    let pauseButton = false;
    const WatchElementArea = document.querySelector('div#downloadhidden');


    DownloadArea = document.querySelectorAll('div#download, div#downloadhidden');
    // Collect all <a> elements inside DownloadArea
    let filteredLinks = [];
    for (let el of DownloadArea) {
        for (let x of el.querySelectorAll('a')) {
            if (!checkSkipFilter(x)) {
                filteredLinks.push(x);
            }
        }
    }

    const downloadhiddenobserver = new MutationObserver((mutations, obs) => {
        const newLinkItems = Array.from(WatchElementArea.querySelectorAll('a')).filter(l => !checkSkipFilter(l));
        if (newLinkItems.length > 0) {
            obs.disconnect();
            const cs = document.querySelector('.CopyState');
            if (cs) {
                cs.remove();
            }
            DownloadArea = document.querySelectorAll('div#download, div#downloadhidden');
        }
    });
    downloadhiddenobserver.observe(WatchElementArea, { childList: true, subtree: true });



    if (DownloadArea.length === 0) {
        console.log('DownloadArea is empty');
        return;
    }
    // Collect all <a> elements inside DownloadArea
    // Collect all <a> elements inside DownloadArea
    for (let el of DownloadArea) {
        for (let x of el.querySelectorAll('a')) {
            if (!checkSkipFilter(x)) {
                AllLinks.push(x);
            }
        }
    }
    console.log('AllLinks:', AllLinks);

    // You can sort InfoAreaCast if needed; here it's just used as-is
    let SortedInfoAreaCast = InfoAreaCast;
    console.log('SortedInfoAreaCast:', SortedInfoAreaCast);

    // Build a DB of filenames split into parts, mapped to their link elements
    let FileNameDB = [];
    for (let link of AllLinks) {
        let fileNameParts = link.innerText
            .replace(/\.xxx\.\d+p.*/i, '')
            .split('/')
            .pop()
            .split(/\./)
            .filter(e => e.trim());

        FileNameDB.push({ fileName: fileNameParts, link });
    }

    // Helper: intersection of two arrays
    let intersect = (a1, a2) => a1.filter(v => a2.includes(v));

    const AllLinksCount = AllLinks.length;
    const SortedInfoAreaCastCount = SortedInfoAreaCast.length;
    if (SortedInfoAreaCastCount <= 1) {
        for (let link of AllLinks) {
            let U = link.href;
            let T = FilenameConvert(CopyTitle);
            let S = PageURL;
            pageLinksDB.push({ U, T, S });
        }
    }
    else {
        const CompareCount = AllLinksCount / SortedInfoAreaCastCount;

        // Process each InfoAreaCast string (usually cast or subtitle info)
        for (let IAC of SortedInfoAreaCast) {
            let compareDB = [];
            // Split InfoAreaCast string into parts by whitespace, dash, or ampersand
            let IACParts = IAC.split(/\s|-|&/).filter(e => e.replace(/'/g, '').trim());

            // Compute intersection counts against each filename
            for (let file of FileNameDB) {
                compareDB.push(intersect(IACParts, file.fileName).length);
            }

            // Find all filenames with the max intersection count
            let maxCount = Math.max(...compareDB);
            let Maxcompare = FileNameDB.filter((_, idx) => compareDB[idx] === maxCount);

            // If there are more matching links than expected, reduce by sampling evenly
            if (Maxcompare.length > CompareCount) {
                Maxcompare = Maxcompare.filter((_, i) => i % Math.floor(Maxcompare.length / CompareCount) === 0);
            }

            // Collect matched links and remove them from the main pools to avoid duplicates
            let Links = [];
            for (const { link } of Maxcompare) {
                Links.push(link);
                AllLinks = AllLinks.filter(e => e !== link);
                FileNameDB = FileNameDB.filter(f => f.link !== link);
            }

            console.log(AllLinks, Links);

            if (!Links.length) {
                Empty.push(true);
                continue; // Skip this IAC if no matches found
            }

            // Extract resolution info (e.g., 1080p, 720p)
            const Resolution = /[0-9]{3,4}p/.test(Links[0].innerText) ? '.XXX.' + Links[0].innerText.match(/[0-9]{3,4}p/)[0] : '';
            // Extract base filename without quality or resolution
            const LinkText = Links[0].innerText.replace(/\.xxx\.\d+p.*/i, '').split('/').pop().trim();


            console.log('LinkText: ', LinkText);
            console.log(MatchWeb, IAC);

            const compareT = compareSentencesByWordMatch(`${MatchWeb} ${IAC}`, LinkText);
            if (compareT === LinkText) {
                Title = LinkText;
            } else {
                // Extract release date or matching pattern based on MatchWeb
                let Released = '';
                if (LinkText.match(/(\.\d+\.\d+.\d+)/)) {
                    Released = LinkText.match(/(\d+\.\d+.\d+)/)[0];
                } else if (LinkText.match(new RegExp(MatchWeb + '\\d{4}'))) {
                    Released = LinkText.match(new RegExp(MatchWeb + '\\d{4}'))[0];
                }
                console.log('Released: ', Released);

                // Extract episode info if present
                let EpisodeMatch = LinkText.match(/E\d{2,5}/i);
                let Episode = EpisodeMatch ? '.' + EpisodeMatch[0] + '.' : '';
                console.log('Episode: ', Episode);


                // Build cast title string with episode info removed
                let CastTitle = IAC && Released
                    ? IAC.replace(/-\sE\d{2,5}/i, '').trim()
                    : IAC && Episode
                        ? '- ' + IAC.replace(/-\sE\d{2,5}/i, '').trim()
                        : IAC && !Episode
                            ? '- ' + IAC
                            : '';
                console.log('CastTitle: ', CastTitle);

                // Compose full title string                

                console.log(MatchWeb, Episode, Released, IAC);
                Title = `${MatchWeb}${Episode}${Released ? '.' + Released + '.' : ''}${CastTitle}${IAC.replace(Released, '').trim()}`;

                Title = Title.replace(/(S\d+):(E\d+)/i, '$1$2');
                console.log({ Title });
            }

            Title = FilenameConvert(Title);

            // Store in pageLinksDB for later processing
            let T = Title + Resolution;
            let S = PageURL;
            console.log('Title: ', Title, Links);

            for (let j of Links) {
                let U = j.href;
                pageLinksDB.push({ U, T, S });
            }
        }
    }

    // Add cover image if present and allowed
    if (pageLinksDB.length > 0 && CoverImage && !/imagetwist\.com|thumbs/.test(CoverImage)) {
        let U = CoverImage;
        let T;
        if (/SITERIP|Collection/i.test(CopyTitleRaw)) {
            T = FilenameConvert(CopyTitle);
        } else {
            T = FilenameConvert(CopyTitle) + Resolution;
        }
        let S = PageURL;
        pageLinksDB.push({ U, T, S });
    }

    if (Empty.length) {
        console.log('Some Links Empty...');
        pageLinksDB = [];
    }
    if (pageLinksDB.length === 0) {
        SkipTitle = ['Link is Empty'];
    }
    console.log('MutilSubTitle Final pageLinksDB:', pageLinksDB);
    return pageLinksDB;
}


async function ClearUrls() {
    document.querySelector('.ClearButton').style = "color: White !important;";
    //document.querySelector('.ClearButton').style.setProperty('font-size', Number(((1/(GetDPI/1.5))*(16/DefaultFontSize)).toFixed(2)) + 'rem', 'important');
    //GM_deleteValue(RootDomain)
    /*
    if (navigator.locks) {
        // HTTPS 환경일 때만 락 요청 로직 실행
        try {
            await navigator.locks.request('LinkCopyLock', { mode: 'exclusive' }, async () => {
                await linkDB.clearAll();
            });
        } catch (err) {
            console.warn('🔒 Lock 실패 또는 이미 다른 탭에서 실행 중');
        }
    } else {
        // HTTP 환경이거나 API를 지원하지 않을 때의 대체 로직
        console.log('경고: navigator.locks API는 현재 환경에서 지원되지 않습니다.');
        await linkDB.clearAll()
    }
*/
    await linkDB.clearAll();

    if (document.querySelector('.Minus')) {
        document.querySelector('.Minus').style.visibility = "hidden";
    }
    document.querySelector('.State').textContent = GetState + ' | ' + PackageCount;
    if (GetState == 0) {
        document.querySelector('.ClearButton').style = "opacity: 0.25;";
        document.querySelector('.CopyButton').style = "opacity: 0.25;";
    }
    else {
        document.querySelector('.ClearButton').style = "opacity: .25;";
        document.querySelector('.CopyButton').style = "opacity: 1;";
    }
}

async function ClipPaste() {
    document.querySelector('.CopyButton').style = "color: White !important;";
    //document.querySelector('.CopyButton').style.setProperty('font-size', Number(((1/(GetDPI/1.5))*(16/DefaultFontSize)).toFixed(2)) + 'rem', 'important');
    //let ClipPasteData = JSON.parse(await GM_getValue(RootDomain, '[]'))
    indexedDBCache = await linkDB.getAll();
    return JDownloaderDB(indexedDBCache).then(e => e);
    //updateClipboard(ClipPasteData)
}

function JDownloader(JdownloaderData, PackageName, sourceURL) {
    //console.log(PackageName + '\n' + JdownloaderData)
    /*
if(JdownloaderData){
    $.post("http://127.0.0.1:9666/flash/add", {
        urls: JdownloaderData,
        referer: PageURL,
        package: PackageName
    })
}
*/
    if (JdownloaderData) {

        let data = new URLSearchParams();
        data.append(`urls`, JdownloaderData);
        data.append(`referer`, PageURL);
        if (sourceURL) {
            data.append(`source`, sourceURL);
        }
        if (PackageName) {
            data.append(`package`, PackageName);
        }
        /*
    if(Comment){
        data.append(`comment`, Comment)
    }
    */
        fetch('http://localhost:9666/flash/add', {
            method: 'POST',
            //mode: 'no-cors',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Access-Control-Allow-Origin': 'http://localhost:9666',
            },
            body: data
        }).then((response) => {
            //console.log(response.ok)
        });
        //console.log(data)
    }

}

async function JDownloaderDB(LinksDB) {
    console.log({ LinksDB });
    let uniqueTitle = [...new Set(LinksDB.map(x => x.T))];
    console.log('uniqueTitle: ', uniqueTitle);
    uniqueTitle.forEach(x => {
        JDownloader(GetMatchLinks(x, LinksDB), x, GetMatchSource(x, LinksDB));
    });
    return true;
}


function GetMatchSource(text, LinksDB) {
    try {
        let S = LinksDB.find(u => text.includes(u.T) && u.S);
        return S ? S.S : false;
    } catch (err) {
        console.log(err, text, LinksDB);
    }
}



function GetMatchLinks(text, LinksDB) {
    try {
        return LinksDB.filter(u => text.includes(u.T)).map(l => l.U).join('\n');
    } catch (err) {
        console.log(err, text, LinksDB);
    }
}

async function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'auto' });
    AllowDirect = true;
    window.removeEventListener('scroll', scrollToTop);
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
                        resolve(true);
                        //return;
                    }
                });


                // start observing for dynamic div
                Onobserver.observe(parentElement, {
                    childList: true,
                    subtree: true,
                });
            }
        } catch (e) {
            console.log(e);
            reject(Error("some issue... promise rejected"));
        }
    });
    return promise;
}


function querySelectorIncludesText(selector, text) {
    return Array.from(document.querySelectorAll(selector))
        .filter(el => el.textContent.toLowerCase().includes(text.toLowerCase()));
}

function getTextLines(selector) {
    const exceptLine = `
    Preview
    Size
    Duration
    Video
    Audio
    Download
    Watch online
    Spare links    
    `.split('\n')
        .map(line => line.replace(/\.XXX\.\d+p.+/i, '').trim())
        .filter(Boolean)
        .join('|');

    const exceptLineRegEx = new RegExp(`^(${exceptLine})`, 'i');

    let currentLineBuffer = [];
    const container = document.querySelectorAll(selector);
    Array.from(container).slice(1).forEach(area => {
        area.childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                const trimmedText = node.textContent.replace(/\.XXX\.\d+p.+/i, '').trim();
                if (trimmedText && !exceptLineRegEx.test(trimmedText)) {
                    currentLineBuffer.push(trimmedText);
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const elementText = node.textContent.replace(/\.XXX\.\d+p.+/i, '').trim();
                if (elementText && !exceptLineRegEx.test(elementText)) {
                    currentLineBuffer.push(elementText);
                }
            }
        });
    });
    console.log({ currentLineBuffer });
    return currentLineBuffer;
}


function getTextLinesWithIconTag(selector, splitTag) {
    const fileNames = getTextLines(selector);
    const container = document.querySelector(selector);
    if (!container) {
        console.warn(`Container with ID "${selector}" not found.`);
        return [];
    }

    const lines = [];
    let currentLineBuffer = [];

    // First, extract the lines as before (without adding the <i> tag yet)
    container.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
            const trimmedText = node.textContent.trim();
            if (trimmedText) {
                currentLineBuffer.push(trimmedText);
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName.toLowerCase() === splitTag) {
                if (currentLineBuffer.length > 0) {
                    lines.push(currentLineBuffer.join(' '));
                    currentLineBuffer = [];
                }
            } else {
                const elementText = node.textContent.trim();
                if (elementText) {
                    currentLineBuffer.push(elementText);
                }
            }
        }
    });

    // Handle the last line
    if (currentLineBuffer.length > 0) {
        lines.push(currentLineBuffer.join(' '));
    }

    // Now, clear the container and reconstruct its content with icons and events
    container.innerHTML = ''; // Clear existing content

    lines.forEach((lineText, index) => {
        // Create a span to hold the line text
        const lineSpan = document.createElement('span');
        lineSpan.textContent = lineText; // Use textContent to prevent XSS issues

        // Create the <i> tag for the icon
        const iconElement = document.createElement('i');
        // Add classes for Font Awesome or your preferred icon library
        // Using 'fa-arrow-right' and 'fas' (solid icon style) as an example
        iconElement.classList.add('GetTitle', 'fas', 'fa-paste', `line-icon-${index}`);
        iconElement.style.marginLeft = '5px'; // Add a little space
        iconElement.style.cursor = 'pointer'; // Indicate it's clickable

        // Add the click event listener to the icon
        iconElement.addEventListener('click', (event) => {
            const firstLineWord = lineText.split(' ')[0];
            const findIndex = fileNames[index].indexOf(firstLineWord);
            let prefix = '';
            if (findIndex !== -1) {
                prefix = fileNames[index].substring(0, findIndex);
            }
            console.log(`Icon clicked for line ${index + 1}: "${lineText}"`);
            // You can add more functionality here, e.g.:
            // alert(`You clicked the icon for: ${lineText}`);
            event.target.style.setProperty('color', 'Orange', 'important');
            updateClipboard(`${prefix}${lineText}`);
        });

        // Append the line text and the icon to the container
        container.appendChild(lineSpan);
        container.appendChild(iconElement);

        // Add a <br> tag after each line, except the very last one
        if (index < lines.length - 1) {
            container.appendChild(document.createElement(splitTag));
        }
    });

    console.log("Lines processed and icons added with click events:", lines);
    return lines; // Return the array of original line texts if needed
}

function attrPromise(element, attributeName, attributeValue) {
    return new Promise((resolve, reject) => {
        const observerConfig = { attributes: true, childList: true, subtree: true, };
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName == attributeName && mutation.getAttribute(attributeName) == attributeValue) {
                    observer.disconnect();
                    resolve(element);
                }
            });
        });
        observer.observe(element, observerConfig);
    });
}

function searchTerms(Text) {
    let SearchWord = Text.replace(/\s&\s/g, ' ').split(/\s-\s/);
    SearchWord = SearchWord.map(e => e.replace(/\n/g, '').trim());
    SearchWord[0] = SearchWord[0].replace(/[^[:alnum:]]/g, '').replace(/\s/g, '');
    SearchWord[0] = /\s-\s/.test(Text) ? SearchWord[0] : Text;
    return SearchWord.join(' ');
}


function openInNewTab(href) {
    Object.assign(document.createElement('a'), {
        target: '_blank',
        rel: 'noopener noreferrer',
        href: href,
    }).click();
}
