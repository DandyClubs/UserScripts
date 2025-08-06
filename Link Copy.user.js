// ==UserScript==
// @name         Link Copy
// @version      1.02
// @description  링크 복사
// @author       DandyClubs
// @include      /naughtyblog\.org/
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
// @noframes
// @license      MIT
// ==/UserScript==


const FontAwesomeCSS = function () {
    let css = document.createElement('link')
    css.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css'
    css.rel = 'stylesheet'
    css.type = 'text/css'
    document.getElementsByTagName('head')[0].appendChild(css)
}

GM_addStyle(`
@import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c&family=Nanum+Gothic&family=Nanum+Gothic+Coding&family=Noto+Sans&display=swap');


:root {
  --dynamic-zindex: 0;
}

.dynamic-z {
  z-index: var(--dynamic-zindex);
}

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
	justify-content: space-around;
	align-items: baseline;
	gap: 5px;
    border-radius: .25em !important;
    -webkit-box-sizing: border-box !important;
    box-sizing: border-box !important;
    background-color: rgba(0,0,0,0.5) !important;
    z-index: var(--dynamic-zindex);
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
    z-index: var(--dynamic-zindex);
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
	background-color: rgba(0, 0, 0, 0.9) !important;
	top: 100%;
	left: 25%;

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


let CopyLinks = []
let AllCopyLinks = []
let TmpLinksDB = []
let DoCopied
let AutoCopy = JSON.parse(localStorage.getItem('AutoCopy')) || false
let AutoClose = JSON.parse(localStorage.getItem('AutoClose')) || false
let CopyLinksBackup
const PageURL = window.location !== window.parent.location ? document.referrer : document.location.href;
const RootDomain = extractRootDomain(PageURL)
//console.log('RootDomain: ', RootDomain)

const linkEreg = /(?:https|http|ftp|file):\/\/.+?(?=[,.]?(?:\s|$))/gi

let RootDomainDB
//console.log(RootDomainDB)

let GetState, searchDB, PackageCount
//console.log(GetState)
let MakerCfg = false
let CfgReleaseDate = false
let Maker = '', ReleaseDate = ''
let SkipTitle

let GetDPI, DefaultFontSize
let Target, DownloadArea, CopyTitle = '', CopyOffSetArea, InfoArea, Resolution = '', TitleLast = '', Series = '', Title, ID = '', TitleID, CopyTitleTmp, InfoTitleTmp, CoverImage, MatchWebRegExp, Gallery, DownloadAreaSelector
let UrlTitle = ''
const SkipFilter = new RegExp('katfile\\.com\/\?op=registration|77file\\.com|xtvtv\\.com\/explanation|niceff\.com|fboom\\.me\/code|k2s\\.cc\/(pr|code)|facebook\\.com|magnet:|fireget\\.com\/premium\\.html|tezfiles\\.com\/.+\/premium|nyaa\\.si|twitter\\.com|ouo\\.io|tma\\.cx|3xplanetpremium|clubwarp\\.com|clubwarp\\.top/|teraboxapp\\.com|turb\\.cc|turbobit\\.net|terabox\\.com|keep2share\\.cc\/pr\/|javascript|pixhost\\.to\/gallery\/|imgchili\\.net\/show|#$|^\/|^(?=.*' + window.location.origin + ')(?!.*\\?site).*$', 'i')
const DirectCopy = new RegExp('3xplanet|kbjme\\.com|hpav\\.tv|pornrips\\.cc|sharepornlink|javpop', 'i')
//const WaitChangeLink = new RegExp('tma\\.cx\/', 'i')
const WaitChangeLink = new RegExp('TestTest\\.cx\/', 'i')

const SkipFileName = /demosaic|\.UMR|iris2/



// Storage 이벤트 리스너
window.addEventListener('storage', (e) => {
    // 토글 관련 이벤트 처리
    if (toggleConfigs[e.key]) {
        handleToggle(e.key, toggleConfigs[e.key]);
    }
    // RootDomain 관련 이벤트 처리
    else if (e.key === RootDomain && (e.newValue || e.oldValue)) {
        RootDomainDB = localStorage.getItem(RootDomain) ? JSON.parse(localStorage.getItem(RootDomain)) : []

        if (DownloadArea?.length) {
            CheckDB(listToDo(DownloadArea));
        }

        const GetState = RootDomainDB;
        const PackageCount = PackageList(RootDomainDB);

        updateUI(GetState, PackageCount);
    }
});



document.addEventListener("DOMContentLoaded", () => {
    console.log('Start Link Copy!')
    FontAwesomeCSS()
    FirstStep()
}, { once: true })


const RegexFrom = (strings, flags) =>
    new RegExp(
        strings
            .filter(e => e.trim())
            .map(t => t.replace(/\s+/g, '\\s'))
            // Escape special characters
            .join("|"),
        flags
    )


const SkipModelEx = RegexFrom(SkipModel.split(/\r?\n/), 'gi')
const SkipWordEx = RegexFrom(SkipWord.split(/\r?\n/), 'gi')


let ShortUrl
let AllowDirect

let CenterBoxFontSize, StateFontSize, StateLineHeight, LinkCopyCenterBox

const SkipClassNames = ['adead_link', 'autohyperlink', 'social-icon']
//const JapaneseChar = /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/g
const JapaneseChar = /[ぁ-んァ-ン一-龯]/
const ThaiChar = /[ๅภถุึคตจขชๆไำพะัีรนยบลฃฟหกดเ้่าสวงผปแอิืทมใฝ๑๒๓๔ู฿๕๖๗๘๙๐ฎฑธํ๊ณฯญฐฅฤฆฏโฌ็๋ษศซฉฮฺ์ฒฬฦ]/
const SearchID = /([a-zA-Z]{2,11}-?\d{2,6}[a-zA-Z]?|\d{2,4}[a-zA-Z]{2,7}-?\d{3,6}[a-zA-Z]?|[a-zA-Z]{1,2}-?\d{2}-?\d{2,3}|[a-zA-Z]{2,7}-?[a-zA-Z]{1,2}\d{2})(.*)/
const MatchID = /^([a-zA-Z]{2,11}-?\d{2,6}[a-zA-Z]?|\d{2,4}[a-zA-Z]{2,7}-?\d{3,6}[a-zA-Z]?|[a-zA-Z]{1,2}-?\d{2}-?\d{2,3}|[a-zA-Z]{2,7}-?[a-zA-Z]{1,2}\d{2}|FC2.+\d{6.8})(.*)/
const SearchFC2ID = /(^FC2.+\d{6})(.*)/
const SearchIDRegExp = /^(\[\s?)?(?=([a-zA-Z]{2,11}-?\d{2,6}[a-zA-Z]?|\d{2,4}[a-zA-Z]{2,7}-?\d{3,6}[a-zA-Z]?|[a-zA-Z]{1,2}-?\d{2}-?\d{2}|[a-zA-Z]{2,7}-?[a-zA-Z]{1,2}\d{2})|T\d{2}-\d{3})(?!(C_\d+|file\d+))(.*)$/
const K2SRegExp = /(.*k2s\.cc\/file\/)(.*\/?)/
const DateRegEx = /((19|20)[0-9]{2}[.\/-]([1][0-2]|[0]?[1-9])[.\/-]([3][0|1]|[1|2][0-9]|[0]?[1-9])|([3][0|1]|[1|2][0-9]|[0]?[1-9])[.\/-]([1][0-2]|[0]?[1-9])[.\/-]((19|20)?[0-9]{2})).*/



let GetDirect, AllCollectionLinks = []

const DirectLink = (url) => {
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: "GET",
            url: url,
            onload: function (resp) {
                //console.log(resp.status)
                //console.log(resp.responseText)
                const Final = GetDirectLink(url, resp.finalUrl)
                resolve(Final)
            },
            onerror: function (error) {
                console.log(error)
                reject(null)
            }
        })
    })
}

const GetDirectLink = (url, data) => {
    //let match = /window\.location='(?<url>http[^']+)/?.exec(data)
    let match = data.replace(/\?site=.+/, '')
    if (match) {
        Array.from(document.querySelectorAll('a[href*="' + url + '"]')).forEach(T => {
            T.setAttribute('href', match)
        })
    }
    return match

}



const io = new IntersectionObserver((entries, self) => {
    for (const entry of entries) {
        if (entry.isIntersecting) {
            LinkCopyCenterBox = entry.target
            //console.log(LinkCopyCenterBox)

            if (entry.target.complete) {
                self.unobserve(entry.target)
            }
        }
    }

}, { root: null, rootMargin: "0px 0px 0px 0px" })


/**
* MutationObserver를 사용하여 특정 요소가 DOM에 나타날 때까지 기다립니다.
* @param {string} selector - 관찰할 HTML 요소의 선택자.
* @param {Element} [targetNode=document.body] - MutationObserver를 적용할 상위 요소.
* @returns {Promise<Element>} 요소가 발견되면 해결되는 프로미스.
*/
function waitElement(selector, targetNode = document.body) {
    return new Promise((resolve, reject) => {
        const element = targetNode.querySelector(selector);
        console.log('waitElement: ', selector, 'TargetNode: ', targetNode)
        if (element) {
            resolve(element);
        }
        const observer = new MutationObserver((mutations, obs) => {
            const found = targetNode.querySelector(selector);
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


const siteConfigs = [
    {
        regex: /naughtyblog\.org\//,
        condition: () => {
            // 이 사이트는 초기 로딩 시 다운로드 영역이 가려져 있습니다.
            // 따라서 MutationObserver를 통해 변경을 감지하고,
            // 다운로드 영역이 나타났을 때만 나머지 로직을 실행하도록 설정합니다.
            const WatchElementArea = document.querySelector('div.main-content-single');
            if (!WatchElementArea) {
                AutoClose = false;
                return false;
            }

            const observer = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    for (const removedNode of mutation.removedNodes) {
                        if (!(removedNode instanceof HTMLElement)) continue;
                        if (removedNode.classList.contains('passster-form')) {
                            // passster-form이 제거되면 다운로드 영역이 나타난 것으로 간주
                            observer.disconnect();
                            const newEvent = new CustomEvent('DownloadAreaUnlocked');
                            document.dispatchEvent(newEvent);
                            Start()
                            return
                        }
                    }
                }
            });

            observer.observe(WatchElementArea, { childList: true, subtree: true });

            // 페이지 로드 시 바로 다운로드 영역이 보이면 observer 없이 바로 진행
            const immediateDownloadArea = document.querySelectorAll('div#download, div#downloadhidden');
            if (immediateDownloadArea.length > 0) {
                return true;
            }

            // 다운로드 영역이 바로 보이지 않으면, 비동기 처리를 위해 false 반환
            return false;
        },
        config: {
            copyOffsetArea: '.post-title.entry-title',
            downloadAreaSelector: 'div#download, div#downloadhidden',
            coverImageSelector: 'div.post-content-single a > img',
            coverImageAttribute: 'src',
            postProcess: () => {
                // 이 함수는 'DownloadAreaUnlocked' 이벤트가 발생했을 때 호출될 것입니다.
                // 또는 페이지 로드 시 바로 다운로드 영역이 보일 때 호출됩니다.

                const CopyOffSetArea = document.querySelector('.post-title.entry-title');
                const DownloadArea = document.querySelectorAll('div#download, div#downloadhidden, div.DownloadArea');

                //Extracting Text Before Each <br> and the Last Line
                let EachTitle = getTextLinesWithIconTag('div.post-content-single p strong', 'br')
                console.log('EachTitle: ', EachTitle)

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
                InfoArea = info
                InfoAreaCast = cast
                console.log('InfoArea:', InfoArea, 'InfoAreaCast:', InfoAreaCast)

                // `CopyTitle`에서 `MatchWeb` 추출
                const CopyTitleRaw = CopyOffSetArea.innerText.trim();
                const MatchWebPoint = CopyTitleRaw.search(/\s-\s/);
                MatchWeb = MatchWebPoint !== -1 ? CopyTitleRaw.substring(0, MatchWebPoint).replace(/\s|\./g, '') : CopyTitleRaw;
                console.log('MatchWeb:', MatchWeb, 'MatchWebPoint:', MatchWebPoint)

                // CopyTitle에 'OnlyFans Mix'가 포함된 경우
                if (/OnlyFans\sMix/i.test(CopyTitleRaw)) {
                    AutoClose = false;
                    CoverImage = '';
                }
                // 그 외의 경우, 특정 키워드(Updates, SITERIP, Collection)가 포함되어 있고 InfoAreaCast의 길이가 1보다 클 때
                else if (/Updates|SITERIP|Collection/i.test(CopyTitleRaw)) {
                    console.log('Special case found:', CopyTitleRaw);
                    CoverImage = '';
                    MutilSubTitle(MatchWeb, MatchWebPoint, InfoAreaCast);
                } else {
                    // `Cast` 정보 찾기
                    const MatchTitle = MatchWebPoint !== -1 ? CopyTitleRaw.substring(MatchWebPoint + 3) : CopyTitleRaw;
                    const FindMatchCast = MatchTitle.split(/\s+/).filter(e => e && isNaN(e) && e.length > 1);
                    const rawCast = InfoArea.find(txt => /^Cast\s?:/.test(txt))?.match(/^Cast\s?:\s?(.+)/)?.[1]?.trim();
                    console.log('MatchTitle:', MatchTitle, 'FindMatchCast:', FindMatchCast, 'rawCast:', rawCast)
                    if (rawCast) {
                        MatchCast = rawCast;
                    } else {
                        const searchCastPoint = InfoArea.find(txt => txt.includes(' - '));
                        if (searchCastPoint) {
                            const rawSearchCast = searchCastPoint.split(' - ')[0];
                            const searchCasts = rawSearchCast.replace(/&|,/g, ' ').split(/\s+/).filter(Boolean);
                            MatchCast = searchCasts.find(name => FindMatchCast.includes(name)) || '';
                            InfoCast = MatchCast && searchCastPoint;
                            console.log('searchCasts:', searchCasts)
                        }
                    }

                    console.log('MatchCast:', MatchCast, 'InfoCast:', InfoCast)

                    // `Released` 날짜 추출
                    Released = InfoArea.find(txt => /(\.\d+\.\d+\.\d+\.)/.test(txt))?.match(/(\.\d+\.\d+\.\d+\.)/)?.[1] || '';
                    console.log('Released:', Released)
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
                    console.log('ReleasedEn:', ReleasedEn)

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

                }

                console.log('CopyTitle:', CopyTitle)

                // 다운로드 링크 추출 및 우선순위
                const getDownloadLinks = (areas) => {
                    const priorityPatterns = [/1080p|1080\.mp4/i, /2160p/i, /720p/i];
                    let finalLinks = [];

                    for (const area of areas) {
                        for (const pattern of priorityPatterns) {
                            const links = Array.from(area.querySelectorAll('a')).filter(a => pattern.test(a.href));
                            if (links.length > 0) {
                                finalLinks.push(...links);
                                break; // 가장 높은 해상도만 선택
                            }
                        }
                        if (finalLinks.length === 0) {
                            // 해상도 패턴에 매칭되는 링크가 없을 경우
                            finalLinks.push(...Array.from(area.querySelectorAll('a')));
                        }
                    }
                    return finalLinks;
                };

                const finalDownloadLinks = getDownloadLinks(DownloadArea);
                window.DownloadArea = createDownloadArea(finalDownloadLinks.map(link => link.outerHTML));

                if (!document.querySelector('div.SearchBox')) {

                    const titleEl = document.querySelector('.post-title.entry-title');
                    const searchTitle = titleEl ? searchTerms(titleEl.innerText) : '';
                    const offsetParent = CopyOffSetArea.parentElement;
                    offsetParent.style.position = 'relative';

                    // create SearchBox
                    const SearchBox = document.createElement('div');
                    SearchBox.className = 'SearchBox';
                    SearchBox.style.position = 'absolute';
                    offsetParent.insertBefore(SearchBox, CopyOffSetArea.nextSibling);


                    const baseScale = (1 / (GetDPI / 1.5)) * (16 / DefaultFontSize);
                    const rem = (value) => `${value.toFixed(2)}rem`;

                    SearchBox.style.maxWidth = rem(3);
                    SearchBox.style.top = `${Math.floor(CopyOffSetArea.offsetTop + (CopyOffSetArea.offsetHeight / 20))}px`;
                    SearchBox.style.left = `${Math.floor(CopyOffSetArea.offsetLeft + CopyOffSetArea.offsetWidth - baseScale * 16)}px`;
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
                                const strong = document.querySelector('div.post-content-single p strong');
                                const term = strong ? strong.innerText.replace(/^EARLY\sLEAK/, '').trim() : '';
                                openInNewTab(`https://www.pornbb.org/newsearch.php?search_keywords=${term}`);
                            }
                        },
                        {
                            class: 'BT4G',
                            domain: 'bt4g.org',
                            onClick: () => {
                                const strongEls = [...document.querySelectorAll('div.post-content-single p strong')];
                                let FindMatchWeb = strongEls.find(e => e.innerText.includes(MatchWeb));
                                if (FindMatchWeb) {
                                    let parts = FindMatchWeb.innerText.split('.');
                                    let cutIndex = parts.findIndex(e => /^(and|XXX|\d+p|mp4|mkv)$/i.test(e));
                                    let sliced = parts.slice(0, cutIndex > 0 ? cutIndex : parts.length).join(' ');
                                    openInNewTab(`https://bt4g.org/search/${sliced}`);
                                }
                            }
                        }
                    ];

                    const searchBoxStyle = SearchBox.style;
                    searchBoxStyle.maxWidth = rem(baseScale * 0.9 * 3);
                    searchBoxStyle.top = Math.floor(CopyOffSetArea.offsetTop + (CopyOffSetArea.offsetHeight / 20)) + 'px';
                    searchBoxStyle.left = Math.floor(CopyOffSetArea.offsetLeft + CopyOffSetArea.offsetWidth - SearchBox.offsetWidth * 1.5) + 'px';
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

                        SearchBox.appendChild(document.createTextNode('\u00A0\u00A0'));
                        SearchBox.appendChild(img);
                    }
                }

                if (finalDownloadLinks.some(link => /1080p|2160p/.test(link.href))) {
                    AutoCopy = true;
                } else {
                    AutoCopy = false;
                    AutoClose = false;
                }
            }
        }
    },
    {
        regex: /top-modelz\.org\/.+html/,
        config: {
            copyOffsetArea: '.news-detalis h2',
            downloadAreaSelector: 'div#content div#l-content div#dle-content div.news-block div.newspad div.quote, div#dle-content div.news-block div.newspad div div',
            coverImageSelector: 'div#dle-content div.news-block div.newspad div.news-text p img',
            coverImageAttribute: 'src',
            postProcess: (config) => {
                const CopyOffSetArea = document.querySelector(config.copyOffsetArea);
                const DownloadArea = document.querySelectorAll(config.downloadAreaSelector);

                if (!CopyOffSetArea) return;

                let Title = CopyOffSetArea.textContent.trim() || '';
                const SkipFilter = /SkipFilterPattern/; // 기존 코드에 정의된 SkipFilter 패턴을 사용해야 합니다.

                let LinkDBAll = [];
                DownloadArea.forEach(section => {
                    Array.from(section.querySelectorAll('a')).forEach(a => {
                        if (!a.href.match(SkipFilter)) {
                            LinkDBAll.push(a);
                        }
                    });
                });

                if (LinkDBAll.length === 0) {
                    AutoClose = false;
                    throw new Error('No Links found');
                }

                const uniqueTitle = [...new Set(
                    LinkDBAll.map(x => x.textContent.replace(/\d+p(?!x).*|(tezfiles\.com|k2s\.cc|rapidgator\.net)\s-\s|\s-\s\d+\.\d+\s(MB|GB)/g, ''))
                )];

                let SearchDB = [];
                const CheckDB = (url, DB) => DB.some(s => s.href.includes(url));

                for (const x of uniqueTitle) {
                    const linksForTitle = LinkDBAll.filter(t => t.textContent.includes(x));

                    let foundLink = linksForTitle.find(t => /2160p(?!x)/.test(t.textContent)) ||
                        linksForTitle.find(t => /1080p(?!x)/.test(t.textContent)) ||
                        linksForTitle.find(t => /720p(?!x)/.test(t.textContent)) ||
                        linksForTitle.find(t => !/(\d+p|zip|rar)/.test(t.textContent)) ||
                        linksForTitle.find(t => /(zip|rar)/.test(t.textContent));

                    if (foundLink && !CheckDB(foundLink.href, SearchDB)) {
                        SearchDB.push(foundLink);
                    }
                }

                if (SearchDB.length > 0) {
                    const LinkDB = SearchDB.map(entry => entry.outerHTML);
                    // createDownloadArea 함수가 정의되어 있다고 가정
                    DownloadArea = createDownloadArea(LinkDB);
                } else {
                    AutoClose = false;
                    throw new Error('No suitable links found after filtering');
                }

                CopyOffSetArea = CopyOffSetArea; // 이 부분은 선택한 요소를 다시 할당하는 용도로 유지
            }
        }
    },
    {
        regex: /8kcosplay\.com|blogjav\.net\/\d+|javfree\.me\/\d+/,
        config: {
            copyOffsetArea: '.entry-title',
            downloadAreaSelector: '.entry-content',
            postProcess: () => {
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

                let rawTitle = CopyOffSetArea?.textContent.trim() ?? '';
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
        regex: /nitroflareporn\.com/,
        config: {
            copyOffsetArea: 'div#dle-content article.singlecont.slideRight h1 span#news-title',
            downloadAreaSelector: 'article.singlecont.slideRight div.cont',
            postProcess: () => {
                document.querySelectorAll('a > img[src*="/uploads/download.gif"]').forEach((img) => {
                    const icon = document.createElement('i');
                    icon.classList.add('fa-solid', 'fa-link');
                    img.replaceWith(icon);
                });

                if (CopyOffSetArea) {
                    CopyTitle = CopyOffSetArea.innerText.replace(/\((UltraHD|Full|HD|SD).+/, '').replace(/\s+/g, ' ').trim();
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

                CopyOffSetArea = document.querySelector(config.copyOffsetArea);
                DownloadArea = document.querySelectorAll(config.downloadAreaSelector);

                if (CopyOffSetArea) {
                    CopyTitle = nameCorrection(CopyOffSetArea.textContent.replace(/amp;/g, '').trim());
                }
            }
        }
    },
    {
        regex: /^https?:\/\/wetholefans\.com\/.*\/\d+(?!.*page\/\d+)/,
        config: {
            copyOffsetArea: '.post-title #news-title h1',
            downloadAreaSelector: '.story .quote',
            postProcess: () => {
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

                if (!Resolution && CopyOffSetArea) {
                    const resMatch = CopyOffSetArea.innerText.match(/[0-9]{3,4}p/);
                    if (resMatch) Resolution = ' ' + resMatch[0];
                }

                console.log(CopyOffSetArea)
                if (CopyOffSetArea) {
                    let tempTitle = CopyOffSetArea.innerText.replace(/\((UltraHD|Full|HD|SD).+/i, '').replace(/\s+/g, ' ').trim();
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
            copyOffsetArea: '.inside-article > .entry-content strong > span',
            downloadAreaSelector: '.inside-article > div.entry-content'
        }
    },
    {
        regex: /(nicesss|nicewww)\.com\/archives.+\.html/,
        config: {
            copyOffsetArea: 'header.entry-header h1.entry-title a',
            downloadAreaSelector: 'article.article-content div.container div.entry-wrapper div.entry-content center'
        }
    },
    {
        regex: /tvtv\.com\/archives.+\.html/,
        config: {
            copyOffsetArea: 'div.single-center header.single-header .entry-title',
            downloadAreaSelector: 'div.entry-content center'
        }
    },
    {
        regex: /fapit\.org\/\d+/,
        config: {
            copyOffsetArea: '.entry-title',
            downloadAreaSelector: 'main#site-content article div.entry-content'
        }
    },
    {
        regex: /pornofetishx\.com\/\d+/,
        config: {
            copyOffsetArea: 'div.content-single h1.ftitle',
            downloadAreaSelector: 'div.content-single div.quote'
        }
    },
    {
        regex: /(clubwarp|downloaddex)\.com\/threads/,
        config: {
            copyOffsetArea: 'h1.p-title-value',
            downloadAreaSelector: 'article.message-body.js-selectToQuote div.bbWrapper'
        }
    },
    {
        regex: /jtiny\.org\/\?p=\d+/,
        config: {
            copyOffsetArea: 'div#container h2#titl a',
            downloadAreaSelector: 'div#container div.post div#entry center'
        }
    },
    {
        regex: /javarchive\.com\/\d{4,6}/,
        config: {
            copyOffsetArea: '.menudd > h1',
            downloadAreaSelector: '.link_archive_innew',
            coverImageSelector: 'div.category_news_phai_chinh > div.news > div > img:not([src^="data"])',
            coverImageAttribute: 'src',
            coverImageFallbackAttribute: 'data-src'
        }
    },
    {
        regex: /(k2sporn\.com|hidefporn\.ws)\/\d+/,
        config: {
            copyOffsetArea: 'div.story-head > h1.title',
            downloadAreaSelector: 'div.story-cont div.quote'
        }
    },
    {
        regex: /cosplay-jav\.com/,
        config: {
            copyOffsetArea: 'div.title h1.posttitle a.entry-title',
            downloadAreaSelector: 'div.entry-container div.entry p',
            coverImageSelector: 'div.entry-container div.entry p.first-para img.size-full',
            coverImageAttribute: 'src'
        }
    },
    {
        regex: /kbjme\.com\/\d+/,
        config: {
            copyOffsetArea: '.article_container h1',
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
            copyOffsetArea: 'div#dle-content article div.head h1.title',
            downloadAreaSelector: 'div#dle-content article div.story_cont .screenshots, div#dle-content article div.story_cont'
        }
    },
    {
        regex: /javpop\.(link|mov)/,
        config: {
            copyOffsetArea: 'main.detail article.post h2.post-title',
            downloadAreaSelector: 'main.detail article.post div div.text-center'
        }
    },
    {
        regex: /thotsgirls\.com\/(?!.*page)/,
        condition: () => document.querySelector('div#primary > div#content > article'),
        config: {
            copyOffsetArea: '.entry-title',
            downloadAreaSelector: 'div.entry-content'
        }
    },
    {
        regex: /fhdporn\.video\/.+/,
        config: {
            copyOffsetArea: 'h1.post-title',
            downloadAreaSelector: 'div.post-content'
        }
    },
    {
        regex: /(bestgirlsexy|bestvideosexy)\.com\/.+/,
        condition: () => document.querySelector('div#content.site-content div.elementor.elementor-location-single'),
        config: {
            copyOffsetArea: 'div#content.site-content div.elementor-widget-container h1.elementor-heading-title',
            downloadAreaSelector: 'div#content.site-content div.elementor-widget-container'
        }
    },
    {
        regex: /all4jp\.com/,
        config: {
            copyOffsetArea: 'article.post > h1#post-title',
            downloadAreaSelector: 'article p',
            getDownloadArea: (copyOffsetArea) => copyOffsetArea ? copyOffsetArea.closest('article').querySelectorAll('p') : null
        }
    },
    {
        regex: /av18plus\.com/,
        config: {
            copyOffsetArea: 'div#content div.post-single h2.title',
            downloadAreaSelector: 'div#content div.post-single div.entry p',
            getDownloadArea: () => document.querySelectorAll('div#content div.post-single div.entry p')
        }
    },
    {
        regex: /(siteripbb\.org|freepornstreams\.org)\/.+/,
        config: {
            copyOffsetArea: 'h1.entry-title',
            downloadAreaSelector: 'div.entry-content'
        }
    },
    {
        regex: /xscandals\.com/,
        condition: () => document.querySelector('div#page.site div#content.site-content div#primary.content-area main#main.site-main article header.entry-header h1.entry-title a'),
        config: {
            copyOffsetArea: 'div#page.site div#content.site-content div#primary.content-area main#main.site-main article header.entry-header h1.entry-title a',
            downloadAreaSelector: 'div#page.site div#content.site-content div#primary.content-area main#main.site-main article div.entry-content blockquote p'
        }
    },
    {
        regex: /asianscan\.biz\/.*\.html/,
        config: {
            copyOffsetArea: 'div div.content div#dle-content div.mainf3',
            downloadAreaSelector: 'div.content div#dle-content div.sscn div.quote'
        }
    },
    {
        regex: /adult-porno\.org\/.+/,
        config: {
            copyOffsetArea: 'div.full-in h1',
            downloadAreaSelector: 'div.quote',
            resolutionFromCopyOffset: true
        }
    },
    {
        regex: /aincest\.com\/.+/,
        condition: () => !document.querySelector('article'),
        config: {
            copyOffsetArea: 'div#main-content div#content div.entry-headline-wrapper div.entry-headline-wrapper-inner h1.entry-headline',
            downloadAreaSelector: 'div#main-content div#content div.entry-content div.entry-content-inner > p'
        }
    },
    {
        regex: /(sharepornlink\.com\/)(?!($|page))(.*)$/,
        config: {
            copyOffsetArea: 'div.wpb_wrapper div.td_block_wrap.tdb-single-title div.tdb-block-inner h1.tdb-title-text, article div.td-post-header header.td-post-title h1.entry-title',
            downloadAreaSelector: 'div.tdb_single_content div.tdb-block-inner.td-fix-index, article div.td-post-content',
            resolutionFromCopyOffset: true
        }
    },
    {
        regex: /(softmodels\.net\/)(?!($|page))(.*)$/,
        config: {
            copyOffsetArea: 'article div.story-head .title',
            downloadAreaSelector: 'article div.quote'
        }
    },
    {
        regex: /3xplanet\.net/,
        condition: () => document.querySelector('article'),
        config: {
            copyOffsetArea: 'article .entry-title',
            downloadAreaSelector: '.td-post-content'
        }
    },
    {
        regex: /girlscanner\.org/,
        condition: () => document.querySelector('div#content'),
        config: {
            copyOffsetArea: 'div#content div#full_post span.span_h2 h1',
            downloadAreaSelector: 'div#content div#full_post center'
        }
    },
    {
        regex: /epicomg\.com\/\?p/,
        config: {
            copyOffsetArea: 'a.title',
            downloadAreaSelector: 'div#cont > center'
        }
    },
    {
        regex: /vipbj\.[a-zA-Z]+\/.+|avtv\..+/,
        condition: () => {
            if (document.querySelector('article.hentry header.entry-header .entry-title')?.children?.length) {
                AutoClose = false;
                throw ('Not Single Post');
            }
            return true;
        },
        config: {
            copyOffsetArea: 'article.hentry header.entry-header > .entry-title',
            downloadAreaSelector: 'article.hentry div.entry-content.post_content figure a',
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
                AutoClose = false;
                throw ('Not Single Post');
            }
            return true;
        },
        config: {
            copyOffsetArea: 'article.hentry header.entry-header > h1.entry-title',
            downloadAreaSelector: 'article.hentry div.entry-content'
        }
    },
    {
        regex: /x-idol\.net\//,
        config: {
            copyOffsetArea: 'h1.post-title.entry-title',
            downloadAreaSelector: 'div.hentry div.entry-content'
        }
    },
    {
        regex: /maxjav\.(com|xyz)\/\d+/,
        condition: () => window.top === window.self,
        config: {
            copyOffsetArea: 'div#content > div > .title',
            downloadAreaSelector: 'div#content > div > div.entry p',
            postProcess: () => {
                let initialTitle = CopyOffSetArea.innerText;
                const subtitleMatch = initialTitle.match(/\[.+Subtitle\](.+)/);
                let Title = subtitleMatch ? subtitleMatch[1] : initialTitle;

                Title = Title
                    .replace(/amp;/g, '')
                    .replace(/(\s)?\/(\s)?/g, '／')
                    .replace(/(-|–)\sHD/, '')
                    .replace(/amp;|\(\s?ブルーレイ版\s?\)|\(ブルーレイディスク版\)|:/g, '')
                    .trim();

                if (!Title.match(/^Collection/)) {
                    const InfoArea = Array.from(document.querySelectorAll('div#content > div > .entry > p')).flatMap(p =>
                        p.innerText.replace(/(?:(?:\r\n|\r|\n)\s*){2}/gm, '\n').split(/\n\n|\n/).filter(Boolean)
                    );
                    console.log(InfoArea);

                    let IDMatch = Title.match(SearchIDRegExp)?.[1] ?? InfoArea.find(line => line.match(SearchIDRegExp))?.match(SearchIDRegExp)?.[1];
                    ID = IDMatch ? IDMatch.trim() : '';

                    let newTitle = InfoArea.find(line => line.match(SearchIDRegExp))?.replace(SearchIDRegExp, '').trim() ?? Title.replace(SearchIDRegExp, '').trim();
                    if (!newTitle || newTitle === 'No title') newTitle = Title.replace(SearchIDRegExp, '').trim();
                    Title = newTitle;

                    Title = mbConvertKana(Title.trim(), 'rans');

                    ReleaseDate = InfoArea.find(line => /Release Date:/.test(line))?.match(/Release Date:(.+)/)?.[1].replace(/\//g, '.').trim() ?? '';
                    Maker = InfoArea.find(line => /(Maker|Studio)\s?:/.test(line))?.match(/(Maker|Studio)\s?:(.+)/)?.[2].trim() ?? '';
                }

                CopyTitle = (Maker ? '[' + Maker + '] ' : '') + (ID ? ID + ' ' : '') + (ReleaseDate ? '(' + ReleaseDate + ') ' : '') + Title;
                CopyTitle = byteLengthOf(CopyTitle, 241).trim();
                CoverImage = DownloadArea?.[0]?.querySelector('p img')?.src || '';
                console.log({ CopyTitle, CoverImage, ID, ReleaseDate, Maker, DownloadArea });
            }
        }
    },
    {
        regex: /javpink\.com\/\?p/,
        config: {
            copyOffsetArea: '.item > .title',
            downloadAreaSelector: '.item > .content',
            postProcess: () => {
                let Title = CopyOffSetArea?.textContent.trim() || '';
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
            copyOffsetArea: 'div.entry > h2',
            downloadAreaSelector: 'div.entry > p',
            postProcess: () => {
                let Title = CopyOffSetArea?.textContent.trim() || '';
                DownloadArea = document.querySelectorAll('div.entry > p');
                CoverImage = DownloadArea?.[0]?.querySelector('img')?.src || '';
                Title = mbConvertKana(Title, 'rans');
                CopyTitle = byteLengthOf(Title, 241).trim();
            }
        }
    }
];
// 사이트별 특별 제목 처리 규칙을 정의하는 배열

const siteRules = [
    {
        regex: /epicomg\.com\/\?p/,
        handler: (title) => nameCorrection(title.replace(/amp;/g, '')),
    },
    {
        regex: /girlscanner\.org/,
        handler: (title) =>
            title
                .replace(/^(new|Watch\/Download:)/i, '')
                .replace(/\\’/, "'")
                .replace(/[[:blank:]]{3,}.+/i, '')
                .trim(),
    },
    {
        regex: /(clubwarp|downloaddex)\.com/,
        handler: (title, CopyOffSetArea) => {
            let cleanedTitle = Array.from(CopyOffSetArea.childNodes)
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
        handler: async (title, CopyOffSetArea, DownloadArea) => {
            const h3 = document.querySelector('div#content div.post_singular div.entry h3');
            let newTitle = h3 ? h3.textContent.trim() : title;

            const GetFileNameLink =
                DownloadArea[0].querySelector('a[href*="https://katfile.com/"]')?.href ||
                DownloadArea[0].querySelector('a[href*="https://ddownload.com/"]')?.href || '';

            const needsFilenameFetch =
                (!SearchIDRegExp.test(newTitle) && !/^\[.*?\]/.test(newTitle) && GetFileNameLink) ||
                (!SearchIDRegExp.test(newTitle) && !JapaneseChar.test(newTitle) && GetFileNameLink);

            if (needsFilenameFetch) {
                try {
                    const service = /katfile/.test(GetFileNameLink)
                        ? 'katfile'
                        : /ddownload/.test(GetFileNameLink)
                            ? 'ddl'
                            : null;
                    if (service) {
                        newTitle = await GetFileName(GetFileNameLink, service);
                        CopyOffSetArea.textContent = newTitle;
                        console.log('GetFileName :', newTitle);
                    }
                } catch (e) {
                    console.error('Request failed', e);
                }
            }
            return newTitle;
        },
    },
    {
        regex: /ultoporn\.com\/\d+/,
        handler: (title) => title.replace(', ', ' - ').replace(': ', ' - ').replace(/\[\d+.*\)/, ''),
    },
    {
        regex: /(bestgirlsexy|bestvideosexy)\.com\/.+/,
        handler: (title) => title.replace(/part\d+$/i, '').trim(),
    },
];

// 사이트별 다운로드 영역 처리 규칙을 정의하는 배열
const waitDownloadArea = [
    {
        regex: /ultoporn\.com\/\d+/,
        handler: async () => {
            CopyOffSetArea = document.querySelector('div.storyhead > h1.shead');
            Array.from(document.querySelectorAll('button.click_show')).forEach(element => element.click());

            const downloadContainer = await waitElement('div#dle-content');
            const observer = observeChanges('div#dle-content', (mutations, obs) => {
                const DownloadAreaSelector = 'div.quote:has(a)';
                DownloadArea = downloadContainer.querySelectorAll(DownloadAreaSelector);

                if (DownloadArea?.length >= 1) {
                    obs.disconnect();
                    RefreshIconSet();
                    const DoCopied = RootDomainDB.some(item => listToDo(DownloadArea, 'A').includes(item.U));
                    if (!DoCopied && document.querySelector(".Minus").style.visibility === "hidden") {
                        CopyGo();
                    }
                }
            });
        }
    },
    {
        regex: /(hpjav|hpav).tv\/(ja\/)?\d+/,
        handler: async () => {
            CopyOffSetArea = document.querySelector('section div ol li.active');
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
        }
    },
    {
        regex: /0xxx\.(ws|li)\/articles\/\d+/,
        handler: async () => {
            CopyOffSetArea = document.querySelector('div.container table#detail-table tbody tr td.taj:not(.levo)');

            if (await waitElement('form#captcha', document.body, { timeout: 1000 })) {
                // await sleep(5000);
                // document.querySelector('button.h-captcha')?.click();
                // await sleep(60000);
            } else {
                const downloadContainer = await waitElement('div.container table#detail-table tbody tr td.dlinks.taj');
                DownloadArea = [downloadContainer];
            }

            if (/#show$/.test(PageURL)) {
                window.addEventListener("scroll", () => {
                    window.scrollTo({
                        top: 0,
                        behavior: 'auto'
                    });
                }, {
                    once: true
                });
            }
        }
    },
    {
        regex: /cosplay\.jav\.pw\/\d+/,
        handler: async () => {
            CopyOffSetArea = document.querySelector('div#content div.post_singular .title');

            const checkRedirects = document.querySelectorAll('a[href*="https://cosplay.jav.pw/goto/"]');
            const allCollectionLinks = Array.from(checkRedirects).map(el => el.href);
            const uniqueLinks = [...new Set(allCollectionLinks)];

            if (uniqueLinks?.length) {
                await Promise.allSettled(uniqueLinks.map((x) => DirectLink(x)));
            }

            const downloadContainer = await waitElement('div#content div.post_singular div.entry');
            console.log({ downloadContainer });
            DownloadArea = [downloadContainer];

            CoverImage = document.querySelector('div.entry p a img')?.src || '';
            console.log('DownloadArea: ', DownloadArea, '\nCoverImage: ', CoverImage);
        }
    },
    {
        regex: /models-nudeteen\.org\/.*\.html/,
        handler: async () => {
            CopyOffSetArea = document.querySelector('div#dle-content article.full div.m-title h1');
            let DownloadAreaSelector;

            if (await waitElement('div.title_spoiler', document.querySelector('div#dle-content'), { timeout: 500 })) {
                DownloadAreaSelector = 'div#dle-content article.full .text_spoiler';
            } else {
                DownloadAreaSelector = 'div#dle-content article.full div.sub-wrap';
            }

            const downloadArea = await waitElement(DownloadAreaSelector);
            DownloadArea = [downloadArea];
            RefreshIconSet();
        }
    },
    {
        regex: /pornobunny\.org\/.+/,
        handler: async () => {
            CopyOffSetArea = document.querySelector('.titlesf');
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

            Resolution = !Resolution && CopyOffSetArea?.innerText.match(/[0-9]{3,4}p/) ? ' ' + CopyOffSetArea.innerText.match(/[0-9]{3,4}p/)[0] : '';
        }
    },
    {
        regex: /pornrip\.cc\/.+\.html/,
        handler: async () => {
            CopyOffSetArea = document.querySelector('.title.ularge');
            const downloadContainer = await waitElement('article.main-article section.post-content');

            const observer = observeChanges('article.main-article section.post-content', (mutations, obs) => {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeName === 'A') {
                            const DownloadAreaSelector = 'div.su-spoiler-content';
                            DownloadArea = downloadContainer.querySelectorAll(DownloadAreaSelector);
                            if (DownloadArea?.length) {
                                obs.disconnect();
                                Array.from(document.querySelectorAll('a')).forEach((aEntry) => {
                                    if (/\?site.+$/.test(aEntry.href)) {
                                        aEntry.setAttribute('href', aEntry.href.replace(/\?site.+$/, ''));
                                    }
                                });
                                scrollToTop();
                                RefreshIconSet();
                            }
                        }
                    });
                });
            });

            Resolution = !Resolution && CopyOffSetArea?.innerText.match(/[0-9]{3,4}p/) ? ' ' + CopyOffSetArea.innerText.match(/[0-9]{3,4}p/)[0] : '';
        }
    }
];
async function Start() {
    console.log('Link Copy Start!')
    let currentConfig = null;
    for (const site of siteConfigs) {
        if (site.regex.test(PageURL) && (!site.condition || site.condition())) {
            currentConfig = site.config;
            break;
        }
    }
    console.log('Current Config:', currentConfig);

    if (currentConfig) {

        // Step 1: `copyOffsetArea`가 이미 설정되지 않았으면 기본 셀렉터로 찾기
        if (!CopyOffSetArea && currentConfig.copyOffsetArea) {
            CopyOffSetArea = document.querySelector(currentConfig.copyOffsetArea);
            if (!CopyOffSetArea) {
                throw new Error('필수 요소 CopyOffSetArea를 찾을 수 없습니다.');
            }
        }
        // Step 2: `postProcess`에서 동적 셀렉터를 설정할 경우를 대비해 먼저 실행
        if (currentConfig.postProcess) {
            currentConfig.postProcess(currentConfig);
        }

        // Step 3: `DownloadArea`가 이미 설정되지 않았으면 기본 셀렉터나 동적 함수로 찾기
        if (!DownloadArea) {
            if (typeof currentConfig.getDownloadArea === 'function') {
                DownloadArea = currentConfig.getDownloadArea(CopyOffSetArea);
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
        if (!Resolution && currentConfig.resolutionFromCopyOffset && CopyOffSetArea) {
            const resMatch = CopyOffSetArea.innerText.match(/[0-9]{3,4}p/);
            if (resMatch) Resolution = ' ' + resMatch[0];
        }
    }
    console.log({ DownloadArea })
    console.log('Final CopyTitle:', CopyOffSetArea, CopyTitle);
    console.log('Final CoverImage:', CoverImage);
    console.log('Final DownloadArea:', DownloadArea);


    if (!DownloadArea || DownloadArea?.length === 0) {
        const matchingConfig = waitDownloadArea.find(config => config.regex.test(PageURL));
        if (matchingConfig) {
            await matchingConfig.handler();
        }
    }


    if (CopyOffSetArea) {
        // 메인 처리 로직 (비동기 함수로 변경)
        async function processCopyTitle(PageURL, CopyOffSetArea, DownloadArea) {
            console.log('processCopyTitle CopyTitle:', CopyTitle)
            CopyTitle = CopyTitle || CopyOffSetArea?.textContent.trim() || '';


            // 사이트별 특별 규칙 적용
            const rule = siteRules.find((r) => r.regex.test(PageURL));
            if (rule) {
                CopyTitle = await rule.handler(CopyTitle, CopyOffSetArea, DownloadArea);
            }

            // 공통 제목 정리 로직
            CopyTitle = CopyTitle.trim() || getDirectInnerText(CopyOffSetArea)?.trim()
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
            CopyTitle = /FC2/.test(CopyTitle) ? CopyTitle : nameCorrection(CopyTitle);

            // 길이 제한 및 ID 처리
            if (byteLengthOfCheck(CopyTitle) > 241) {
                const titleIdMatch = CopyTitle.match(MatchID);
                if (titleIdMatch) {
                    ID = titleIdMatch[0];
                    CopyTitle = CopyTitle.replace(ID, '').trim();
                }

                const titleLast = getLastText(CopyTitle);
                let finalTitle;

                if (!titleLast || !/[^\s]/.test(titleLast)) {
                    finalTitle = byteLengthOf(CopyTitle, 241 - (ID ? byteLengthOfCheck(ID) + 1 : 0)).trim();
                } else {
                    let tempTitle = CopyTitle.split(titleLast)[0].trim();
                    tempTitle = byteLengthOf(tempTitle, 241 - (ID ? byteLengthOfCheck(ID) + 1 : 0) - byteLengthOfCheck(titleLast));
                    finalTitle = (tempTitle + titleLast).trim();
                }
                CopyTitle = ID ? `${ID} ${finalTitle}`.trim() : finalTitle;
            }


            // 최종 공백 제거
            return CopyTitle.trim();
        }

        processCopyTitle(PageURL, CopyOffSetArea, DownloadArea)
    }

    console.log('Final CopyTitle:', CopyOffSetArea, CopyTitle);
    console.log('Final CoverImage:', CoverImage);
    console.log('Final DownloadArea:', DownloadArea);


    if (!CopyOffSetArea || !CopyTitle) {
        new Error('No CopyTitle')
    } else {
        SkipTitle = CheckSkipTitle();
        return { CopyOffSetArea, CopyTitle, DownloadArea }
    }
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
    let t
    while (/(?=(.*?)([a-z])([A-Z])(.+))(?!.*?(OnlyFans|DxD)).*$/.test(s)) {
        s = s.replace(/^(?=(.*?)([a-z])([A-Z])(.+))(?!.*?(OnlyFans|DxD)).*$/g, "$1$2 $3$4")
    }

    while (/([a-z])-([A-Z0-9])/.test(s)) {
        s = s.replace(/([a-z])-([A-Z0-9])/g, "$1 - $2")
    }
    t = pre + ' ' + s
    return t.replace(/\s{2,}/g, ' ')
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

        if (stateEl) {
            stateEl.textContent = `${GetState.length} | ${PackageCount.length}`;
            clearBtn.style.color = 'LimeGreen';
            copyBtn.style.color = 'LimeGreen';
        }

        if (GetState.length === 0) {
            clearBtn.style.opacity = '0.25';
            copyBtn.style.opacity = '0.25';
        } else {
            clearBtn.style.opacity = '1';
            copyBtn.style.opacity = '1';
        }
    } catch {
        // UI 요소가 없거나 오류가 발생했을 때 재시작 로직
        if (CopyOffSetArea && !LinkCopyCenterBox) {
            setTimeout(() => {
                document.location.reload();
            }, 60000);
        }
    }
}

// 토글 버튼의 상태를 업데이트하는 함수
function handleToggle(key, className) {
    const ev = document.querySelector(`.${className}`);
    if (!ev) return;

    const isEnabled = JSON.parse(localStorage.getItem(key));
    ev.classList.toggle('On', isEnabled);
    ev.classList.toggle('Off', !isEnabled);

    if (key === 'AutoCopy') {
        if (isEnabled) {
            // AutoCopy가 활성화되면 AutoClose 상태도 업데이트
            if (JSON.parse(localStorage.getItem('AutoClose'))) {
                AutoClose = JSON.parse(localStorage.getItem('AutoClose'))
            }
            const hasCopied = RootDomainDB.some(item => listToDo(DownloadArea, 'A').includes(item.U));
            if (hasCopied) {
                CheckDB(listToDo(DownloadArea));
            } else {
                FirstStep();
            }
        } else {
            // AutoCopy 비활성화 시 AutoClose도 비활성화
            localStorage.setItem('AutoClose', JSON.stringify('false'));
        }
    } else if (key === 'AutoClose' && isEnabled && JSON.parse(localStorage.getItem('AutoCopy'))) {
        // AutoClose가 활성화되고 AutoCopy가 켜져 있으면 추가 로직 실행
        const hasCopied = RootDomainDB.some(item => listToDo(DownloadArea, 'A').includes(item.U));
        AutoCopy = JSON.parse(localStorage.getItem('AutoCopy'))
        if (hasCopied) {
            CheckDB(listToDo(DownloadArea));
        } else {
            FirstStep();
        }
    }
}



function FirstStep() {
    Array.from(document.querySelectorAll('a')).forEach((aEntry) => {
        if (/(\/|=)(aHR0c[a-zA-z0-9]+={0,2})($|\/|\?|&|-?-?;?)/.test(aEntry.href)) {
            aEntry.setAttribute('href', atob(aEntry.href.match(/(\/|=)(aHR0c[a-zA-z0-9]+={0,2})($|\/|\?|&|-?-?;?)/)[2]).replace(/\?site=.+/, ''))
        }
        else if (/\?site.+$/.test(aEntry.href)) {
            aEntry.setAttribute('href', aEntry.href.replace(/\?site.+$/, ''))
        }
    })

    RootDomainDB = localStorage.getItem(RootDomain) ? JSON.parse(localStorage.getItem(RootDomain)) : []

    GetState = RootDomainDB
    PackageCount = PackageList(RootDomainDB)

    if (!LinkCopyCenterBox) {
        mainIcon('First Run')
    }

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

        if (isElementCovered(iconSet)) {
            bringElementToFrontWithSteps(iconSet);
        }
    }

    const searchBox = document.querySelector('div.SearchBox');
    if (searchBox && CopyOffSetArea) {
        // Get a reference to the SearchBox and Favicon elements

        const favicon = document.querySelector('img.Favicon');
        searchBox.style.maxWidth = rem(baseScale * 0.9 * 3);
        searchBox.style.top = `${Math.floor(CopyOffSetArea.offsetTop + (CopyOffSetArea.offsetHeight / 20))}px`;
        searchBox.style.left = `${Math.floor(CopyOffSetArea.offsetLeft + CopyOffSetArea.offsetWidth - searchBox.offsetWidth * 1.5)}px`;
        searchBox.style.height = rem(baseScale * 0.9);

        // Set styles for the Favicon
        if (favicon) {
            favicon.style.width = rem(baseScale * 0.9);
            favicon.style.height = rem(baseScale * 0.9);
        }
    }
}


function mainIcon(Run) {
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

    window.visualViewport.addEventListener('resize', () => {
        io.observe(LinkCopyCenterBox);
        RefreshIcon('Window Resize Event');
    });

    window.addEventListener('pageshow', () => {
        RefreshIcon('pageshow');
    });

    if (isElementCovered(LinkCopyCenterBox)) {
        bringElementToFrontWithSteps(LinkCopyCenterBox);
    }

    let lastExecutionTime = performance.now();
    const myObserver = new ResizeObserver(entries => {
        const now = performance.now();
        if (now - lastExecutionTime >= 1000) {
            io.observe(LinkCopyCenterBox);
            RefreshIcon('ResizeObserver');
            console.log(`Execution time: ${now - lastExecutionTime} ms`);
            lastExecutionTime = now;
        }
    });
    myObserver.observe(LinkCopyCenterBox.querySelector('.ToTop'));

    // Update State and button opacity
    const stateEl = LinkCopyCenterBox.querySelector('.State');
    const clearBtn = LinkCopyCenterBox.querySelector('.ClearButton');
    const copyBtn = LinkCopyCenterBox.querySelector('.CopyButton');

    stateEl.textContent = `${GetState?.length || 0} | ${PackageCount?.length || 0}`;

    if ((GetState?.length || 0) === 0) {
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

    AutoCloseIcon?.addEventListener('click', (e) => {
        e.preventDefault();
        if (AutoCloseIcon.classList.contains('Off')) {
            AutoCloseIcon.classList.replace('Off', 'On');
            localStorage.setItem('AutoClose', JSON.stringify(true));
            AutoCopyIcon.classList.replace('Off', 'On');
            localStorage.setItem('AutoCopy', JSON.stringify(true));
        } else {
            AutoCloseIcon.classList.replace('On', 'Off');
            localStorage.setItem('AutoClose', JSON.stringify(false));
        }
    });

    AutoCopyIcon?.addEventListener('click', (e) => {
        e.preventDefault();
        if (AutoCopyIcon.classList.contains('Off')) {
            AutoCopyIcon.classList.replace('Off', 'On');
            localStorage.setItem('AutoCopy', JSON.stringify(true));
            if (DownloadArea) {
                DoCopied = RootDomainDB.some(item => listToDo(DownloadArea, 'A').includes(item.U));
                if (DoCopied) {
                    AutoClose = true;
                    CheckDB(listToDo(DownloadArea));
                } else {
                    FirstStep();
                }
            }
        } else {
            AutoCopyIcon.classList.replace('On', 'Off');
            localStorage.setItem('AutoCopy', JSON.stringify(false));
            AutoCloseIcon.classList.replace('On', 'Off');
            localStorage.setItem('AutoClose', JSON.stringify(false));
        }
    });

    clearBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        if (JSON.parse(localStorage.getItem('NewAdded'))) {
            if (window.confirm("Not Yet Copy! Clear?")) {
                localStorage.setItem('NewAdded', JSON.stringify(false));
                ClearUrls();
                CopyLinks = []
            }
        } else {
            ClearUrls();
            CopyLinks = []
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


function SecondProcess() {
    return new Promise((resolve, reject) => {
        if (!CopyOffSetArea) {
            reject(new Error('No CopyOffSetArea'));
        }


        let IconSetBox = document.querySelector(".IconSet");

        if (!IconSetBox) {
            LinkCopyCenterBox.insertAdjacentHTML('afterend', `
            <div class="IconSet" style="max-width: max-content; visibility: hidden; position: fixed;">
                <i class="CopyIcon far fa-clone" style="color: goldenrod !important; visibility: hidden;"></i>
                <i class="CloseIcon fa-solid fa-square-xmark" style="color: goldenrod !important; visibility: hidden;"></i>
                <i class="Minus fa-solid fa-magnifying-glass-minus" style="color: goldenrod !important; visibility: hidden;"></i>
            </div>
        `);
            document.body.insertAdjacentHTML('beforeend', `<div class="CopyNotice" style="display: none;"><div class="copyText"></div></div>`);

            IconSetBox = document.querySelector(".IconSet");

            document.body.addEventListener('click', async function (e) {
                const target = e.target.closest('i');
                if (!target) return;

                try {
                    if (target.classList.contains('CopyIcon')) {
                        e.preventDefault();
                        SkipTitle = true;
                        AllowDirect = false;
                        if (DownloadArea?.length) {
                            CopyGo();
                        }
                    } else if (target.classList.contains('CloseIcon')) {
                        e.preventDefault();
                        self.close();
                    } else if (target.classList.contains('Minus')) {
                        e.preventDefault();
                        await RemoveDB(listToDo(DownloadArea, 'All'));
                        await CheckDB(listToDo(DownloadArea));
                        CopyLinks = []
                    }
                } catch (error) {
                    console.error('IconSet click handler error:', error);
                }
            });
        }

        if (/0xxx\.ws\/articles|pornrip\.cc\/download/.test(PageURL)) {
            RefreshIconSet();
        }

        RefreshIconSet();

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
                CopyGo();
            }
        } else if (/naughtyblog/.test(PageURL) && AutoCopy && JSON.parse(localStorage.getItem('AutoCopy'))) {
            CopyGo();
        }
        resolve({ CopyTitle, DownloadArea });
    })
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
        CheckDB(listToDo(DownloadArea));
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
    console.log('Check CheckSkipTitle:', CopyTitle)
    if (!CopyTitle) return false;  // Early exit if no title

    // Find skip word/model matches
    let WM = CopyTitle.match(SkipWordEx) || [];
    let MM = CopyTitle.match(SkipModelEx) || [];

    console.log('CopyTitle:', CopyTitle, 'Skip Words:', WM, 'Skip Models:', MM);

    // Unique values to avoid duplicates
    let W = [...new Set(WM)];
    let M = [...new Set(MM)];

    if (W.length || M.length) {
        // Create or update CopyState div for status
        if (!document.querySelector('.CopyState')) {
            LinkCopyCenterBox.insertAdjacentHTML('beforeend', '<div class="CopyState"></div>');
        }
        let copyStateEl = document.querySelector('.CopyState');
        let CopyStateFontSize = Number(((1 / (GetDPI / 1.5)) * 0.65 * (16 / DefaultFontSize)).toFixed(2))
        copyStateEl.style.setProperty('font-size', `${CopyStateFontSize}rem`, 'important')

        // Set flags indicating skip conditions
        AutoClose = false;
        AutoCopy = false;
        SkipTitle = false;

        // Show messages for skip words/models
        copyStateEl.innerText = '';
        if (W.length) copyStateEl.innerText += 'Skip Word: ' + W.join('/');
        if (M.length) copyStateEl.innerText += (W.length ? '\n' : '') + 'Skip Model: ' + M.join('/');
    } else {
        SkipTitle = true; // No skip words/models found
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


async function CopyGo() {
    if (!SkipTitle) return;

    const shortUrlExists = () =>
        Array.from(document.querySelectorAll("a")).some(a => WaitChangeLink.test(a.href));

    if (shortUrlExists()) {
        const observer = new MutationObserver(async (mutations, obs) => {
            // Check if short URLs still exist after mutation
            if (!shortUrlExists()) {
                console.log('No more short links. Proceeding with copy.');
                obs.disconnect();
                await CopyLink();
                DoCopied = RootDomainDB.some(item => listToDo(DownloadArea, 'A').includes(item.U));

                if (CopyLinks?.length > 0 && !DoCopied) {
                    console.log('Retrying CopyGo...');
                    await sleep(1000)
                    await CopyGo();  // Use await to avoid unbounded recursion
                } else {
                    console.log('Copied! DoCopied:', DoCopied, 'CopyLinks:', CopyLinks);
                }
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
        await CopyLink();

        DoCopied = RootDomainDB.some(item => listToDo(DownloadArea, 'A').includes(item.U));


        if (CopyLinks?.length > 0 && !DoCopied) {
            console.log('Retrying CopyGo...');
            await sleep(1000)
            await CopyGo();
        } else {
            console.log('Copied! DoCopied:', DoCopied, 'CopyLinks:', CopyLinks);
        }

    }

    // Update UI notification styles
    if (LinkCopyCenterBox) {
        // 대상 요소를 찾습니다.
        const copyNotice = document.querySelector('.CopyNotice');
        const copyText = document.querySelector('.CopyNotice .copyText');
        const linkCopyCenterBox = document.querySelector('.LinkCopyCenterBox'); // LinkCopyCenterBox는 기존 코드에 있는 변수라고 가정합니다.

        // 변수들을 미리 계산합니다.
        const fontSizeValue = Number(((1 / (GetDPI / 1.5)) * 0.6 * (16 / DefaultFontSize)).toFixed(2));
        const topValue = linkCopyCenterBox.offsetTop + linkCopyCenterBox.offsetHeight * 1.2;
        const leftValue = window.innerWidth / 2 - linkCopyCenterBox.offsetWidth;

        // 계산된 값을 요소의 style 속성에 직접 할당합니다.
        copyNotice.style.fontSize = `${fontSizeValue}rem`;
        copyNotice.style.top = `${topValue}px`;
        copyNotice.style.left = `${leftValue}px`;
        copyNotice.style.height = copyText.scrollHeight + "px";
    }

    const copyIcon = document.querySelector(".CopyIcon");
    if (copyIcon) copyIcon.style.color = "orange";

    if (!document.hidden) {
        const notice = document.querySelector('.CopyNotice');
        await showThenHide(notice, { duration: 800, pause: 2000 });
    }
    const closeIcon = document.querySelector(".CloseIcon");
    if (closeIcon) closeIcon.style.visibility = "visible";
}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


//Match
function MatchRegexElement(Taget, regex, attributeToSearch) {
    if (regex.test(Taget.getAttribute(attributeToSearch))) {
        return true
    }
    else {
        return false
    }
}

async function CollectionCoverImage(CoverImage) {
    let result = []

    CoverImage = /vpdmm\.cc/.test(CoverImage) ? CoverImage.replace('vpdmm.cc', 'dmm.co.jp') : CoverImage
    if (CoverImage && !/imagetwist\.com/.test(CoverImage)) {
        await UpdateDB(CoverImage, FilenameConvert(`${CopyTitle}${Resolution || ''}`))
    }
    result.push(CoverImage)
    return result
}



async function CollectionLinks(DownloadArea) {
    const CollectionATag = [];
    const shortLinkRegex = /(\/|=)(aHR0c[a-zA-Z0-9]+={0,2})(?=$|[\/?&;\-])/;
    const siteParamRegex = /\?site.+$/;
    const skipFilters = SkipFilter;        // your existing regex
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
    if (!CollectionATag.length) {
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
        .filter(a => !skipFilters.test(a.href))
        .filter(a => {
            const name = a.href.split('/').pop();
            return !(skipFileNameRegex.test(name) || skipFileNameRegex.test(a.textContent));
        });

    // 2c) Skip links whose children are images (unless they pass your emoji/class test)
    if (!/models-nudeteen\.org|girlscanner\.org/.test(PageURL)) {
        links = links.filter(a =>
            /uploadgig\.com\/file\/download|alfafile\.net\/file/.test(a.href) ||
            ![...a.children].some(img => img.tagName === 'IMG' && !MatchRegexElement(img, /emoji/, 'class'))
        );
    }

    // 2d) Optionally filter for quality (4K vs 1080p) if CopyTitle and not a “Collection”
    if (!/Collection|SITERIP|OnlyFans\sLeak/i.test(CopyTitle) && !/pornrips\.cc/.test(PageURL)) {
        const UHD = /4K-ARCHIVE-?|ARCHIVE-4K-?|(-|_)?4K$/i;
        const FHD = /\.1080p/i;
        const allNames = links.map(a => GetName(a.href));
        const uniqueBases = UHD.test(allNames.join(''))
            ? [...new Set(allNames.map(n => n.replace(UHD, '')))]
            : FHD.test(allNames.join(''))
                ? [...new Set(allNames.filter(n => FHD.test(n)).map(n => n.replace(FHD, '')))]
                : [];

        if (uniqueBases.length) {
            links = links.filter(a => {
                const nm = GetName(a.href);
                return UHD.test(nm)
                    ? uniqueBases.includes(nm.replace(UHD, ''))
                    : FHD.test(nm)
                        ? uniqueBases.includes(nm.replace(FHD, ''))
                        : false;
            });
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

    CopyLinks = CopyLinks || [];
    for (const a of links) {
        const href = a.href;
        if (CopyLinks.includes(href)) continue;

        CopyTitle = CopyTitle ? FilenameConvert(CopyTitle) : '';
        if (/naughtyblog/.test(RootDomain) && /[0-9]{3,4}p/.test(a.textContent)) {
            Resolution = `.XXX.${a.textContent.match(/[0-9]{3,4}p/)[0]}`;
        }

        CopyLinks.push(href);
        await UpdateDB(href, `${CopyTitle}${Resolution || ''}`);
    }

    // Dedupe and return as newline-separated string (or empty array)
    CopyLinks = [...new Set(CopyLinks)];
    return CopyLinks
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

    console.log(Target, UrlTitle)
    if (Target.match(K2SRegExp)) {
        Target = Target.match(K2SRegExp)[1] + Target.match(K2SRegExp)[2].slice(0, 18)
    }
    searchDB = RootDomainDB.find(({ U }) => U === Target)

    if (searchDB) {
        searchDB.T = UrlTitle
    }
    else {
        RootDomainDB.push({ U: Target, T: UrlTitle, S: PageURL })
        if (!JSON.parse(localStorage.getItem('NewAdded'))) {
            localStorage.setItem('NewAdded', JSON.stringify(true))
        }
    }
    //console.log(RootDomainDB)
    return RootDomainDB
}


async function RemoveDB(listToDelete) {
    RootDomainDB = RootDomainDB.filter(item => (!listToDelete.includes(item.U)));
    localStorage.setItem(RootDomain, JSON.stringify(RootDomainDB))
    //await GM_setValue(RootDomain, JSON.stringify(RootDomainDB))
    //RootDomainDB = JSON.parse(await GM_getValue(RootDomain, "[]"))
    //RootDomainDB = localStorage.getItem(RootDomain) ? JSON.parse(localStorage.getItem(RootDomain)) : []
    GetState = RootDomainDB
    PackageCount = PackageList(RootDomainDB)
    document.querySelector('.State').textContent = GetState?.length + ' | ' + PackageCount?.length
    if (GetState?.length == 0) {
        document.querySelector('.ClearButton').style = "opacity: 0.25;";
        document.querySelector('.CopyButton').style = "opacity: 0.25;";
    }
    else {
        document.querySelector('.ClearButton').style = "opacity: 0.25;";
        document.querySelector('.CopyButton').style = "opacity: 1;";
    }
    return RootDomainDB
}


async function CheckDB(listTo) {
    // `try-catch` 블록을 전체 함수가 아닌, 잠재적으로 오류가 발생할 수 있는 부분에만 적용합니다.
    try {
        // GetState 변수를 사용하여 로직의 흐름을 단순화합니다.
        const GetState = RootDomainDB;
        const minusElement = document.querySelector('.Minus');

        // `GetState`가 존재하고 길이가 0보다 클 때만 로직을 실행합니다.
        if (GetState?.length > 0) {
            // `some` 메서드를 사용하여 `listTo`의 항목이 `RootDomainDB`에 포함되는지 확인합니다.
            const isMatchFound = GetState.some(item => listTo.includes(item.U));

            if (minusElement) {
                // 매칭 여부에 따라 요소의 가시성을 설정합니다.
                minusElement.style.visibility = isMatchFound ? 'visible' : 'hidden';
            }

            // 매칭이 발견되었을 때만 AutoClose 로직을 실행합니다.
            if (isMatchFound) {
                setTimeout(() => {
                    const isAutoCloseEnabled = JSON.parse(localStorage.getItem('AutoClose'));
                    // AutoClose 변수와 localStorage 값을 모두 확인하여 실행합니다.
                    if (isAutoCloseEnabled) {
                        console.log('AutoClose: ', AutoClose, '\nlocalStorage: ', isAutoCloseEnabled);
                        self.close();
                    }
                }, 5000);
            }
        } else {
            // `GetState`가 없거나 비어 있을 경우, Minus 요소의 가시성을 숨깁니다.
            if (minusElement) {
                minusElement.style.visibility = 'hidden';
            }
        }
    } catch (err) {
        console.error('CheckDB 함수 실행 중 오류 발생:', err);
    }

    // 이 부분은 try-catch 블록과 별개로 항상 실행됩니다.
    PackageCount = PackageList(RootDomainDB);
    return RootDomainDB;
}

function PackageList(LinksDB) {
    if (LinksDB?.length > 0) {
        let uniqueTitle = [...new Set(LinksDB.map(x => x.T))]
        //console.log(uniqueTitle)
        return uniqueTitle
    }
    else {
        return []
    }
}

async function CopyLink() {
    console.log(CopyTitle, DownloadArea)
    // Ensure our DB array exists
    RootDomainDB = RootDomainDB || [];

    // Prepare notice text
    let noticeLines = [];
    let allLinks = [];


    // 1) If no temporary links waiting, gather fresh links
    if (TmpLinksDB.length === 0) {
        let collected = await CollectionLinks(DownloadArea) || '';
        if (collected) {
            // Optionally add cover image link
            if (CoverImage && !/imagetwist\.com/.test(CoverImage)) {
                const coverLink = await CollectionCoverImage(CoverImage);
                console.log(coverLink, collected.concat(coverLink))
                if (coverLink) {
                    collected = collected.concat(coverLink);
                }
            }
            console.log('collected : ', collected)
            allLinks = collected

            // Fire off JDownloader if allowed
            const directOK = DirectCopy.test(PageURL) || AllowDirect;
            if (directOK) {
                JDownloader(collected.join('\n'), `${CopyTitle}${Resolution || ''}`, PageURL);
            }
            noticeLines.push(`${CopyTitle}${Resolution || ''}`)
            noticeLines.push(collected.join('\n'));
        } else {
            noticeLines.push('Empty Links');
            AutoClose = false;
        }
    }
    // 2) Otherwise replay from TmpLinksDB
    else {
        // Group by title, then push URLs under each
        const uniqueTitles = [...new Set(TmpLinksDB.map(e => e.T))].sort();
        for (const t of uniqueTitles) {
            noticeLines.push(t);
            const urls = TmpLinksDB.filter(e => e.T === t).map(e => e.U);
            for (const u of urls) {
                await UpdateDB(u, t);
                allLinks.push(u);
            }
        }

        // Fire off JDownloader DB variant if allowed
        if (DirectCopy.test(PageURL) || AllowDirect) {
            JDownloaderDB(TmpLinksDB);
        }

        noticeLines = noticeLines.concat(allLinks);
    }

    // 3) Update UI notice
    const noticeEl = document.querySelector('.CopyNotice .copyText');
    noticeEl.textContent = noticeLines.join("\n");

    // 4) Persist state & refresh counters
    localStorage.setItem(RootDomain, JSON.stringify(RootDomainDB));
    await sleep(100);

    GetState = RootDomainDB;
    PackageCount = PackageList(RootDomainDB);
    const stateEl = document.querySelector('.State');
    stateEl.textContent = `${GetState.length} | ${PackageCount.length}`;

    const clearBtn = document.querySelector('.ClearButton');
    const copyBtn = document.querySelector('.CopyButton');
    if (GetState.length === 0) {
        clearBtn.style.opacity = '0.25';
        copyBtn.style.opacity = '0.25';
    } else {
        clearBtn.style.opacity = '0.25';
        copyBtn.style.opacity = '1';
    }

    // 5) Decide whether to auto-close
    if (allLinks.length && JSON.parse(localStorage.getItem('AutoClose'))) {
        if (/naughtyblog\.org/.test(RootDomain) &&
            CopyTitle.match(/SITERIP|OnlyFans|Collection|Updates/i)) {
            AutoClose = false;
        } else {
            AutoClose = true;
        }
    }

    // 6) Finally, re-check the DB and return its result
    return await CheckDB(listToDo(DownloadArea));
}



function listToDo(areas, type = 'Default') {
    const seenAnchors = new Set();
    const todo = [];

    // 1) Collect all unique <a> elements under each area
    areas.forEach(area => {
        area.querySelectorAll('a').forEach(a => seenAnchors.add(a));
    });

    // 2) Filter and normalize each link
    for (const a of seenAnchors) {
        const href = a.href.replace(/\?site.+/, '');
        // Skip filtering patterns
        if (SkipFilter.test(href)) continue;
        // Skip links with image children for certain hosts
        if (
            /(uploadgig\.com\/file\/download|alfafile\.net\/file)/.test(href) &&
            a.querySelector('img')
        ) continue;

        // Normalize K2S URLs
        let target = href;
        const k2s = href.match(K2SRegExp);
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
    AutoClose = false;
    AutoCopy = false;
    console.log('MutilSubTitle AutoCopy: ', AutoCopy);
    console.log('Mutil SubTitle.... ', MatchWeb, MatchWebPoint, InfoAreaCast);

    let Empty = [];
    let AllLinks = [];

    // Download areas to search for links
    DownloadArea = document.querySelectorAll('div#download, div#downloadhidden');
    if (!DownloadArea) throw new Error('No DownloadArea');

    // Collect all <a> elements inside DownloadArea
    for (let el of DownloadArea) {
        for (let x of el.querySelectorAll('a')) {
            AllLinks.push(x);
        }
    }
    console.log('AllLinks:', AllLinks);

    // You can sort InfoAreaCast if needed; here it's just used as-is
    let SortedInfoAreaCast = InfoAreaCast;
    console.log('SortedInfoAreaCast:', SortedInfoAreaCast);

    // Build a DB of filenames split into parts, mapped to their link elements
    let FileNameDB = [];
    for (let link of AllLinks) {
        // Remove quality/resolution suffix like ".xxx.1080p" then split into filename parts
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
            TmpLinksDB.push({ U, T, S });
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

            // Extract base filename without quality or resolution
            let LinkText = Links[0].innerText.replace(/\.xxx\.\d+p.*/i, '').split('/').pop().trim();
            console.log('LinkText: ', LinkText);

            // Extract release date or matching pattern based on MatchWeb
            let Released = '';
            if (LinkText.match(/(.+)(\.\d+\.\d+.\d+\.)(.+)/)) {
                Released = LinkText.match(/(\.\d+\.\d+.\d+\.)/)[0];
            } else if (LinkText.match(new RegExp(MatchWeb + '\\.\\d{4}\\.'))) {
                Released = LinkText.match(new RegExp(MatchWeb + '\\.\\d{4}\\.'))[0];
            }
            console.log('Released: ', Released);

            // Extract episode info if present
            let EpisodeMatch = LinkText.match(/E\d{2,5}/i);
            let Episode = EpisodeMatch ? '.' + EpisodeMatch[0] + '.' : '';
            console.log('Episode: ', Episode);

            // Extract resolution info (e.g., 1080p, 720p)
            Resolution = LinkText.match(/[0-9]{3,4}p/) ? '.XXX.' + LinkText.match(/[0-9]{3,4}p/)[0] : '';

            // Build cast title string with episode info removed
            let CastTitle = IAC && Episode
                ? '- ' + IAC.replace(/-\sE\d{2,5}/i, '').trim()
                : IAC && !Episode
                    ? '- ' + IAC
                    : '';
            console.log('CastTitle: ', CastTitle);

            // Compose full title string
            Title = (Episode || Released)
                ? MatchWeb + Episode + Released + IAC.replace(/(-\s)?E\d+/, '').trim()
                : MatchWeb + IAC;
            Title = Title.replace(/(S\d+):(E\d+)/i, '$1$2');
            Title = FilenameConvert(Title);

            // Store in TmpLinksDB for later processing
            let T = Title + Resolution;
            let S = PageURL;
            console.log('Title: ', Title, Links);

            for (let j of Links) {
                let U = j.href;
                TmpLinksDB.push({ U, T, S });
            }
        }
    }

    // Add cover image if present and allowed
    if (CoverImage && !/imagetwist\.com/.test(CoverImage)) {
        let U = CoverImage;
        let T = FilenameConvert(CopyTitle) + Resolution;
        let S = PageURL;
        TmpLinksDB.push({ U, T, S });
    }

    if (Empty.length) {
        console.log('Some Links Empty...');
        TmpLinksDB = [];
    }
}


async function ClearUrls() {
    document.querySelector('.ClearButton').style = "color: White !important;";
    //document.querySelector('.ClearButton').style.setProperty('font-size', Number(((1/(GetDPI/1.5))*(16/DefaultFontSize)).toFixed(2)) + 'rem', 'important');
    //GM_deleteValue(RootDomain)
    localStorage.removeItem(RootDomain)
    RootDomainDB = []
    //RootDomainDB = JSON.parse(await GM_getValue(RootDomain, "[]"))

    GetState = RootDomainDB
    PackageCount = PackageList(RootDomainDB)
    if (document.querySelector('.Minus')) {
        document.querySelector('.Minus').style.visibility = "hidden"
    }
    document.querySelector('.State').textContent = GetState?.length + ' | ' + PackageCount?.length
    if (GetState?.length == 0) {
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
    RootDomainDB = localStorage.getItem(RootDomain) ? JSON.parse(localStorage.getItem(RootDomain)) : []
    return JDownloaderDB(RootDomainDB).then(e => e)
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
        data.append(`referer`, PageURL)
        if (sourceURL) {
            data.append(`source`, sourceURL)
        }
        if (PackageName) {
            data.append(`package`, PackageName)
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
        })
        //console.log(data)
    }

}

async function JDownloaderDB(LinksDB) {
    console.log(LinksDB)
    let uniqueTitle = [...new Set(LinksDB.map(x => x.T))]
    console.log('uniqueTitle: ', uniqueTitle)
    uniqueTitle.forEach(x => {
        JDownloader(GetMatchLinks(x, LinksDB), x, GetMatchSource(x, LinksDB))
    })
    return true
}


function GetMatchSource(text, LinksDB) {
    try {
        let S = LinksDB.find(u => text.includes(u.T) && u.S)
        return S ? S.S : false
    } catch (err) {
        console.log(err, text, LinksDB)
    }
}



function GetMatchLinks(text, LinksDB) {
    try {
        return LinksDB.filter(u => text.includes(u.T)).map(l => l.U).join('\n')
    } catch (err) {
        console.log(err, text, LinksDB)
    }
}

async function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'auto' })
    AllowDirect = true
    DoCopied = RootDomainDB.some(item => (listToDo(DownloadArea, 'A').includes(item.U)))

    if (/^((?!(sharepornlink|0xxx|naughtyblog|hpav\.tv)).)*$/.test(PageURL)) {
        if (!DoCopied && document.querySelector(".Minus").style.visibility === "hidden") {
            CopyGo()
        }
    }
    window.removeEventListener('scroll', scrollToTop)
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


function querySelectorIncludesText(selector, text) {
    return Array.from(document.querySelectorAll(selector))
        .filter(el => el.textContent.includes(text));
}


function getTextLinesWithIconTag(selector, splitTag) {
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
            console.log(`Icon clicked for line ${index + 1}: "${lineText}"`);
            // You can add more functionality here, e.g.:
            // alert(`You clicked the icon for: ${lineText}`);
            event.target.style.setProperty('color', 'Orange', 'important')
            updateClipboard(lineText)
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
    let SearchWord = Text.replace(/\s&\s/g, ' ').split(/\s-\s/)
    SearchWord = SearchWord.map(e => e.replace(/\n/g, '').trim())
    SearchWord[0] = SearchWord[0].replace(/[^[:alnum:]]/g, '').replace(/\s/g, '')
    SearchWord[0] = /\s-\s/.test(Text) ? SearchWord[0] : Text
    return SearchWord.join(' ')
}


function openInNewTab(href) {
    Object.assign(document.createElement('a'), {
        target: '_blank',
        rel: 'noopener noreferrer',
        href: href,
    }).click();
}
