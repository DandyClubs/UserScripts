// ==UserScript==
// @name         Copy Title
// @version      2025.10.29
// @description  try to take over the world!
// @author       You
// @include      /javbus.com\/.+\/([a-zA-Z]{2,7}-?\d{2,6}[a-zA-Z]?|\d{2,4}[a-zA-Z]{2,7}-?\d{3,6}[a-zA-Z]?|[a-zA-Z]{1,2}-?\d+-?\d+|[a-zA-Z]{2,7}-?[a-zA-Z]{1,2}\d+)/
// @include      /javbus.com\/.+\/([a-zA-Z0-9]{1,7}-?\d{1,6}[a-zA-Z]?)/
// @include      /https?:\/\/(www.)?javlibrary\.com\/.*\?v=.*/
// @include      https://www.mgstage.com/product/product_detail/*
// @include      https://dl.getchu.com/i/item*
// @include      https://pornolab.net/forum/viewtopic.php?t=*
// @include      /kin8tengoku\.com\/moviepages\/.*\/index\.html/
// @include      https://av-wiki.net/*
// @include      /bestjavporn\.com\/ja\/video\//
// @include      https://allasiangirls.net/*
// @include      https://misskon.com/*
// @exclude      https://av-wiki.net/?s=*
// @grant		 GM_addStyle
// @grant		 GM_openInTab
// @run-at       document-start
// @grant        unsafeWindow
// @grant		 GM_xmlhttpRequest
// @connect      *
// @require      https://raw.githubusercontent.com/DandyClubs/RootDomain/main/RootDomain.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js
// @require      https://raw.githubusercontent.com/DandyClubs/CopyLinksCommonJS/main/CopyLinksCommonJS.js
// @noframes
// ==/UserScript==

const FontAwesomeCSS = function () {
    let css = document.createElement('link')
    css.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css'
    css.rel = 'stylesheet'
    css.type = 'text/css'
    document.head.appendChild(css)
}


GM_addStyle(`



.GetMaker, .GetLabel {
    text-align: center;
    cursor: pointer;
    color: LimeGreen !important;
    font-style: initial !important;
    font-size: 0.8rem;
    margin: .25rem;
}

.CopyTitle, .FullCopyTitle, .closeIcon {
    text-align: center;
    cursor: pointer;
    color: dodgerblue !important;    
    margin: .5em;
    position: relative;        
}

.CopyTitleCenterBox {
	right: 30%;
	left: auto;
	top: 25%;
	margin: 0 auto;
    display: flex;
	flex-wrap: nowrap;
    justify-content: center;
    align-items: center;
	gap: 2px;
	position: fixed !important;
	color: dodgerblue !important;
    border-radius: .25em !important;
    -webkit-box-sizing: border-box !important;
    box-sizing: border-box !important;
	text-shadow: 2px 4px 4px rgba(0,0,0,0.2),
                 0px -5px 10px rgba(255,255,255,0.15);    
    z-index: 99999;
}

.CopyTitleCenterBox i {
    flex-basis: auto;    
    cursor: pointer;
}

.CopyTitleIconSet {
	visibility: visible;
	position: absolute;
	scale: 1.2;
}

.Download, .ScrollDown {
    margin: .25rem;
    cursor: pointer;
}

.CoverDownload {
	cursor: pointer;
	text-shadow: 2px 4px 4px rgba(0,0,0,0.2),
                 0px -5px 10px rgba(255,255,255,0.15);    
	padding: .5rem;
	margin: .5rem;
}

`);


let getDPI, defaultFontSize

const PageURL = window.location !== window.parent.location ? document.referrer : document.location.href;
const RootDomain = extractRootDomain(PageURL)

let MakerCfg = false
let CfgReleaseDate = false
let Maker = '', ReleaseDate = '', BetweenYear = ''

let TitleArea, CopyTitle, FullCopyTitle, InfoArea, ID, CastArea, ModelName = '', AmatureName, byteCheck = 0, TitleLast = '', InfoSelector = '', Series = '', ModelNameDB
let CoverImage, FullCoverImage, OffSetArea, filename, extension


let toUpperCaseList = `
JVID
FC2(-)?PPV
`;

const LAST_TAGS_REGEX = /\s*\[[^\]]+\][^\[]*$/
const TAGS_REGEX = /\[[^\]]+]|\(,.*?[\)\]]/g

const SearchID = /^【?([a-zA-Z]{2,7}-?\d{2,6}[a-zA-Z]?|\d{2,4}[a-zA-Z]{2,7}-?\d{3,6}[a-zA-Z]?|[a-zA-Z]{1,2}-?\d+-?\d+|[a-zA-Z]{2,7}-?[a-zA-Z]{1,2}\d+)】?/
const SearchFC2ID = /(^FC2.+\d{6})(.*)/
const ChinaID = /^(?=.*([a-zA-Z]{2,11}-?\d{2,6}[a-zA-Z]?|\d{2,4}[a-zA-Z]{2,7}-?\d{3,6}[a-zA-Z]?|[a-zA-Z]{1,2}-?\d{2}-?\d{2}|[a-zA-Z]{2,7}-?[a-zA-Z]{1,2}\d{2}))(?!.*\d+p).*$/i
const JapaneseChar = /[ぁ-んァ-ン一-龯]/g
const ExcludeChar = /[<\/:>*?"|\\]/g
const SKIPMGSID = /(START)-/
//YYYY-MM-DD or MM-DD-YYYY
const DateRegEx = /((19|20)[0-9]{2}[.\/-]([1][0-2]|[0]?[1-9])[.\/-]([3][0|1]|[1|2][0-9]|[0]?[1-9])|([3][0|1]|[1|2][0-9]|[0]?[1-9])[.\/-]([1][0-2]|[0]?[1-9])[.\/-]((19|20)?[0-9]{2})).*/
const BetweenRegEx = /\d{2,4}[\/\.-]\d{2}[\/\.-]\d{2,4}\s?-\s?\d{2,4}[\/\.-]\d{2}[\/\.-]\d{2,4}|\d{4}([\/\.-]\d{1,2})\s?-\s?\d{4}([\/\.-]\d{1,2})|\d{4}\s?-\s?\d{4}/
const UPDateRegEx = /(Оновление|UPDATE|Обновление)\D+(?=((19|20)[0-9]{2}[.\/-]([1][0-2]|[0]?[1-9])[.\/-]([3][0|1]|[1|2][0-9]|[0]?[1-9])|([3][0|1]|[1|2][0-9]|[0]?[1-9])[.\/-]([1][0-2]|[0]?[1-9])[.\/-]((19|20)?[0-9]{2}))).*/
const chineseRegex = /[\u4e00-\u9fff]/g;

const myObserver = new ResizeObserver(entries => {
    MakeDownloadIcon()
});


function RefreshImages() {
    let Images = document.querySelectorAll('img')
    for (const img of Images) {
        if (!img.complete) {
            img.src = getUriWithParam(img.src, { Reload: new Date().getTime() })
        }
    }
}

function getUriWithParam(baseUrl, params) {
    try {
        const Url = new URL(baseUrl)
        const urlParams = new URLSearchParams(Url.search);
        for (const key in params) {
            if (params[key] !== undefined) {
                urlParams.set(key, params[key]);
            }
        }
        Url.search = urlParams.toString();
        return Url.toString()
    } catch (err) {
        console.log(err)
    }
};


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


async function Start() {
    const siteConfigs = {
        'javbus.com': {
            titleSelector: 'div.container',
            infoSelector: 'div.info',
            castSelector: "div.container > div.movie > div.info > p.star-show",
            castProcessor: (element) => {
                const castArea = getNextSibling(element, 'p') ? getNextSibling(element, 'p').querySelectorAll('span.genre') : '';
                const cast = new Set();
                if (castArea) {
                    castArea.forEach((entry) => {
                        cast.add(entry.innerText?.replace(/（.*）/, '').trim());
                    });
                    ModelName = [...cast].join(',');
                }
            },
            postProcessing: () => {
                if (TitleArea && TitleArea.firstElementChild) { // For cases like javbus where firstElementChild is needed
                    TitleArea = TitleArea.firstElementChild;
                }
            }
        },
        'javlibrary.com': {
            titleSelector: '#video_title .text',
            infoSelector: 'div#video_info',
            castSelector: 'div#video_info #video_cast',
            castProcessor: (element) => {
                const castArea = element ? element.querySelectorAll('.star') : '';
                const cast = new Set();
                if (castArea) {
                    castArea.forEach((entry) => {
                        cast.add(entry.innerText?.replace(/（.*）/, '').trim());
                    });
                    ModelName = [...cast].join(',');
                }
            },
            postProcessing: () => {
                document.querySelector('#video_jacket').insertAdjacentHTML('beforeend', '<div class="CopyTitleIconSet" style="visibility: hidden; position: absolute;"></div>');
                document.querySelector('.CopyTitleIconSet').insertAdjacentHTML('beforeend', '<i class="CoverDownload fa-regular fa-image" style="color: dodgerblue !important;"></i>');
                OffSetArea = document.querySelector('#video_jacket');
                OffSetArea.style.setProperty('position', 'relative');
                CoverImage = document.querySelector('div#video_jacket img#video_jacket_img');
                let DetectMaker = document.querySelector("div#video_info div#video_maker span.maker");
                if (DetectMaker) {
                    DetectMaker.insertAdjacentHTML('beforeend', '&nbsp;&nbsp;<i class="GetMaker fas fa-paste"></i>');
                    document.querySelector('.GetMaker').addEventListener("click", function (event) {
                        event.preventDefault();
                        event.target.style.setProperty('color', 'Orange', 'important');
                        updateClipboard(DetectMaker.innerText.trim());
                    });
                }
                let DetectLabel = document.querySelector("div#video_info div#video_label span.label");
                if (DetectLabel) {
                    DetectLabel.insertAdjacentHTML('beforeend', '&nbsp;&nbsp;<i class="GetLabel fas fa-paste"></i>');
                    document.querySelector('.GetLabel').addEventListener("click", async function (event) {
                        event.preventDefault();
                        event.target.style.setProperty('color', 'Orange', 'important');
                        updateClipboard(DetectLabel.innerText.trim());
                    });
                }
                document.querySelector('.CopyTitle').insertAdjacentHTML('afterend', '<i class="FullCopyTitle fa-solid fa-expand"></i>');
                document.querySelector('.FullCopyTitle').addEventListener("click", async function (e) {
                    e.preventDefault();
                    e.target.style.setProperty("color", "Orange", "important");
                    updateClipboard(FullCopyTitle);
                });
            }
        },
        'mgstage.com': {
            titleSelector: 'div#container article#center_column div.common_detail_cover h1.tag',
            infoSelector: 'div#container article#center_column div.common_detail_cover div.detail_left div.detail_data',
            infoProcessor: (element) => element.innerText.replace(/(?:(?:\r\n|\r|\n|\t)\s*){2}/gm, '\n').replaceAll('\t', '').split(/\n/),
            coverImageSelector: 'article#center_column div.common_detail_cover div.detail_left div.detail_data div h2 img.enlarge_image'
        },
        'allasiangirls.net': {
            titleSelector: 'body.single.single-post div.page-title div.page-title-inner .entry-title'
        },
        'misskon.com': {
            titleSelector: 'article#the-post div.post-inner .post-title.entry-title'
        },
        'av-wiki.net': {
            titleSelector: 'article.article section.article-body div.blockquote-like p',
            infoSelector: 'article.article section.article-body dl.dltable',
            coverImageSelector: 'article.article div.article-thumbnail a.image-link-border img',
            infoProcessor: (element) => element,
            postProcessing: () => {
                document.querySelector('.CopyTitle').insertAdjacentHTML('afterend', '<i class="FullCopyTitle fa-solid fa-expand"></i>');
                document.querySelector('.FullCopyTitle').addEventListener("click", async function (e) {
                    e.preventDefault();
                    e.target.style.setProperty("color", "Orange", "important");
                    updateClipboard(FullCopyTitle);
                });
                OffSetArea = document.querySelector('article.article div.article-thumbnail');
                OffSetArea.insertAdjacentHTML('beforeend', '<div class="CopyTitleIconSet" style="visibility: hidden; position: absolute;"></div>');
                document.querySelector('.CopyTitleIconSet').insertAdjacentHTML('beforeend', '<i class="CoverDownload fa-regular fa-image" style="color: dodgerblue !important;"></i>');
                OffSetArea.style.setProperty('position', 'relative');
            }
        },
        'bestjavporn.com': {
            titleSelector: 'article.post div.entry-content div#video-infos.tab-content div#video-about div.video-description div.desc.more p',
            coverImageSelector: 'article.post header.entry-header div#video-player-area div#video-player div.responsive-player',
            postProcessing: () => {
                OffSetArea = document.querySelector('article.post header.entry-header div#video-player-area div#video-player');
                OffSetArea.insertAdjacentHTML('beforeend', '<div class="CopyTitleIconSet" style="visibility: hidden; position: absolute;"></div>');
                document.querySelector('.CopyTitleIconSet').insertAdjacentHTML('beforeend', '<i class="CoverDownload fa-regular fa-image" style="color: dodgerblue !important;"></i>');
                OffSetArea.style.setProperty('position', 'relative');
            }
        },
        'kin8tengoku.com': {
            titleSelector: 'div#sub_main p.sub_title',
            postProcessing: async () => {
                await onElementLoaded('div.vjs-poster', 'div#movie').then(() => {
                    CoverImage = document.querySelector('div.vjs-poster');
                    CoverImage.insertAdjacentHTML('beforeend', '<div class="CopyTitleIconSet" style="visibility: hidden; position: absolute;"></div>');
                }).catch(() => { });
                document.querySelector('.CopyTitleIconSet').insertAdjacentHTML('beforeend', '<i class="CoverDownload fa-regular fa-image" style="color: dodgerblue !important;"></i>');
                OffSetArea = document.querySelector('div#mediaspace.video-js');
                OffSetArea.style.setProperty('position', 'relative');
            }
        },
        'getchu.com': {
            titleSelector: 'form div table tbody tr td div.bold',
            infoSelector: 'form div table tbody tr td table tbody',
            infoProcessor: (element) => element.innerText.replace(/(?:(?:\r\n|\r|\n|\t)\s*){2}/gm, '\n').replaceAll('\t', ' ').split(/\n/),
            makerCfg: true,
            coverImageSelector: 'table.m_border tbody tr td table tbody tr td.m_main_c table tbody tr td img[src*="/data/item_img"]',
            postProcessing: () => {
                OffSetArea = CoverImage.closest('table');
                OffSetArea.insertAdjacentHTML('beforeend', '<div class="CopyTitleIconSet" style="visibility: hidden; position: absolute;"></div>');
                document.querySelector('.CopyTitleIconSet').insertAdjacentHTML('beforeend', '<i class="CoverDownload fa-regular fa-image" style="color: dodgerblue !important;"></i>');
                OffSetArea.style.setProperty('position', 'relative');
                document.querySelector('.CopyTitle').insertAdjacentHTML('afterend', '<i class="FullCopyTitle fa-solid fa-expand"></i>');
                document.querySelector('.FullCopyTitle').addEventListener("click", async function (e) {
                    e.preventDefault();
                    e.target.style.setProperty("color", "Orange", "important");
                    updateClipboard(FullCopyTitle);
                });
            }
        },
        'pornolab.net': {
            titleSelector: '.maintitle',
            infoSelector: 'div.post-user-message',
        }
    };

    let currentSiteConfig = null;
    for (const domain in siteConfigs) {
        if (new RegExp(domain.replace(/\./g, '\\.')).test(RootDomain)) {
            currentSiteConfig = siteConfigs[domain];
            break;
        }
    }

    if (!currentSiteConfig) {
        return; // No matching configuration found
    }

    TitleArea = document.querySelector(currentSiteConfig.titleSelector);
    
    if (!TitleArea) {
        return;
    }

    if (currentSiteConfig.infoSelector) {
        const element = document.querySelector(currentSiteConfig.infoSelector)
        if (element) {
            if (currentSiteConfig.infoProcessor) {
                InfoArea = currentSiteConfig.infoProcessor(element);
            } else {
                InfoArea = getInfoArea(element)
            }
        }
    }

    if (currentSiteConfig.castSelector) {
        const castElement = document.querySelector(currentSiteConfig.castSelector);
        if (castElement && currentSiteConfig.castProcessor) {
            currentSiteConfig.castProcessor(castElement);
        }
    }

    if (currentSiteConfig.coverImageSelector) {
        CoverImage = document.querySelector(currentSiteConfig.coverImageSelector);
    }

    if (currentSiteConfig.makerCfg) {
        MakerCfg = currentSiteConfig.makerCfg;
    }

    if (TitleArea && !document.querySelector('.CopyTitle')) {
        MakeIcon()

        if (currentSiteConfig.postProcessing) {
            await currentSiteConfig.postProcessing();
        }
    }
    SecondStep()
}


function MakeIcon() {
    // 1. CenterBox 요소를 한 번만 찾아서 변수에 할당
    document.querySelector("body").insertAdjacentHTML('afterbegin', '<div class="CopyTitleCenterBox"></div>');
    const centerBox = document.querySelector('.CopyTitleCenterBox');

    // centerBox가 없으면 함수 종료
    if (!centerBox) {
        console.error("CopyTitleCenterBox element not found.");
        return;
    }

    // 2. 아이콘 생성 함수
    const addIconToCenterBox = (className, html, color) => {
        const iconHTML = `<i class="${className}" style="color: ${color} !important;">${html}</i>`;
        centerBox.insertAdjacentHTML('beforeend', iconHTML);
    };

    // 3. 아이콘에 클릭 이벤트 추가 함수
    const addEventToIcon = (className, eventCallback) => {
        // setTimeout을 사용하여 DOM이 업데이트될 시간을 줍니다.
        setTimeout(() => {
            const iconElement = centerBox.querySelector(`.${className}`);
            if (iconElement && eventCallback) {
                iconElement.addEventListener('click', eventCallback);
            } else {
                console.warn(`Icon with class "${className}" not found for event listener.`);
            }
        }, 0); // 0ms delay gives the browser time to process the DOM changes
    };

    // 4. pornolab.net 도메인에 따라 아이콘 생성 및 이벤트 추가
    if (/pornolab\.net/.test(RootDomain)) {
        let TorrentFile = document.querySelector('table.attach a.dl-stub.dl-link');
        let relatedTopics = document.querySelector('div.thx-container div.related-topics');

        if (TorrentFile) {
            addIconToCenterBox("Download fa-regular fa-circle-down", "", "dodgerblue");
            addEventToIcon("Download", function (e) {
                e.preventDefault();
                //window.open(TorrentFile.href, '_blank');
                //TorrentFile.click();
                forceDownload(TorrentFile.href, CopyTitle)
                e.target.style.setProperty("color", "Orange", "important");
            });
        }

        if (relatedTopics) {
            addIconToCenterBox("ScrollDown fa-solid fa-turn-down", "", "dodgerblue");
            addEventToIcon("ScrollDown", function (e) {
                e.preventDefault();
                relatedTopics.scrollIntoView({
                    behavior: 'smooth'
                });
            });
        }
    }

    // 5. 공통 아이콘 생성 및 이벤트 추가
    addIconToCenterBox("CopyTitle fas fa-code", "", "");
    addEventToIcon("CopyTitle", async function (e) {
        e.preventDefault();
        e.target.style.setProperty("color", "Orange", "important");
        updateClipboard(CopyTitle);
    });

    addIconToCenterBox("closeIcon fa-solid fa-square-xmark", "", "red");
    const closeIcon = document.querySelector('.closeIcon');

    if (document.visibilityState === 'hidden') {
        closeIcon.style.visibility = 'hidden';
    }

    document.addEventListener('visibilitychange', async () => {
        if (document.visibilityState === 'hidden') {
            closeIcon.style.visibility = 'hidden';
        } else {
            await sleep(500);
            closeIcon.style.visibility = 'visible';
        }
    });
    
    addEventToIcon("closeIcon", function () {
        self.close();
    });

    
    // 6. 스타일 및 기타 로직
    getDPI = window.devicePixelRatio;
    defaultFontSize = getDefaultFontSize();
    const centerBoxFontSize = Number(((1 / (getDPI / 1.5)) * (16 / defaultFontSize)).toFixed(2)) + 'rem';

    centerBox.style.cssText = `font-size: ${centerBoxFontSize};`;

    const coverDownload = document.querySelector('.CoverDownload');
    if (coverDownload) {
        coverDownload.style.setProperty('font-size', centerBoxFontSize, 'important');
    }
}



let Title, BTS, Remastered, TitleText

let TitleDB

const regExp = {
    getMatchGroups(regExp, string) {
        const matches = []
        let match

        while ((match = regExp.exec(string)) !== null) {
            if (match.index === regExp.lastIndex) {
                regExp.lastIndex++
            }

            const groups = match.slice(1)

            if (groups.some(Boolean)) {
                matches.push(groups)
            }
        }

        return matches
    }
}

const padZero = (num, length) => {
    return String(num).padStart(length, '0');
};


const formatSentences = s => {
    const [first, ...rest] = [...new Set(s.split('/').map(t => t.trim()).filter(Boolean))];
    return rest.length ? `${first}[${rest.join(' ')}]` : first;
};


function removeParts(A, B) {
    // B의 각 문장을 trim 후 빈 값 제거
    const partsToRemove = B.split('/')
        .map(s => s.trim())
        .filter(Boolean);
    let result = A;
    // 각 문장을 A에서 제거
    for (const part of partsToRemove) {
        result = result.replaceAll(part, '');
    }
    // 공백 정리
    return result.replace(/\s+/g, ' ').trim();
}
/**
 * 각 도메인별 타이틀 파싱 및 메타데이터 추출 로직을 담고 있는 객체입니다.
 * 'default' 키는 어떤 도메인에도 해당하지 않을 경우를 처리합니다.
 */
const SiteParsers = {
    'pornolab\\.net': {
        parse: () => {

            const searchRegex = (p) => new RegExp(`(?:${p.join('|')})\\s*[:\\-]\\s*(.+)$`);
            let titleText = TitleArea.textContent.replace('[uncen]', '');

            console.log({ titleText })

            // 러시아어 단어 및 날짜 형식 정리
            titleText = titleText
                .replace(/ролика|роликов|ролик|клипов/g, 'Video Clips')
                .replace('Удаленные видео', 'Deleted Videos')
                .replace('видео', 'Videos')
                .replace(/ч(\.\d+)/g, 'Part$1')
                .replace(/часть|Часть/g, 'Part')
                .replace(/(\d+)\/(\d+)\/(\d+)/g, '$1.$2.$3')
                .replace(/обновление от|Обновление|Обновлено/g, 'UPDATE')
                .replace(/эпизодов|эпизод/g, 'episode')
                .replace(/сцена из|Сцена из фильма/i, 'Scene from')
                .replace(/(\/|-)\s(?=[а-яА-ЯЁё]).*?(?:\/)/, '')
                .replace(/(\/|-)\s(?=[а-яА-ЯЁё]).*?(?=[\(|\[])/gi, '')
                .trim();

            const extractText = titleText.match(/\([\w,\s]*\)/g) || []

            for (const t of extractText) {
                let count = (t.match(/,/g) || []).length
                if (count >= 10) {
                    titleText = titleText.replace(t, '')
                }
            }
            const searchModelPatterns = `
            В ролях
            Погоняло бесстыдницы
            Имя актрисы
            Имя модели
            Погоняло принцессы
            Погоняло волшебницы
            Истинное имя бесстыдницы
            Название Белоснежки
            Название девки
            Погоняло курицы с кривыми лапами
            `.trim().split(/\r?\n/).map(e => e.trim()).filter(Boolean);



            const findModelName = InfoArea.map(line => {
                const m = line.match(searchRegex(searchModelPatterns));
                return m ? m[1].trim() : null;
            }).filter(Boolean);

            const extractedModelName = findModelName.map(e => e.replace(/Amateur.*/i, '').trim()).filter(Boolean).join(',');
            let cleanedModelName = extractedModelName.split(/,|\saka\s/g).filter(element => !new RegExp(escapeRegExp(element), 'i').test(titleText)).join(' ').trim()
            console.log({ findModelName, extractedModelName, cleanedModelName })

            // 리마스터 및 BTS 플래그 추출
            const remastered = /Remastered/.test(titleText);
            const bts = /Behind\s?The\s?Scenes/.test(titleText);

            if (remastered) {
                titleText = titleText.replace('[Remastered]', '').replace(' - Remastered', '');
            }


            const resolutionMatch = titleText.match(/\d+p/g);
            let resolution
            if (resolutionMatch) {
                const uniqueMatch = [...new Set(resolutionMatch)]
                resolution = uniqueMatch?.length === 1 ? uniqueMatch[0] : '';
                titleText = titleText.replaceAll(resolution, '').trim()
            }


            // 날짜 범위 및 제작자 추출
            const betweenMatch = BetweenRegEx.exec(titleText);
            const betweenYear = betweenMatch ? ` [${betweenMatch[0].replace(/(\d+)\/(\d+)\/(\d+)/g, '$1.$2.$3')}]` : '';
            if (betweenMatch) {
                titleText = titleText.replace(betweenMatch[1], '').replace(/\(\s?\)/g, '').trim();
            }

            // 릴리즈 날짜 추출 및 제거
            const releaseDate = DateRegEx.test(titleText) && !BetweenRegEx.test(titleText) && !UPDateRegEx.test(titleText) ? titleText.match(DateRegEx)[1].trim() : '';
            let FixreleaseDate = ''
            if (releaseDate) {
                titleText = titleText.replace(releaseDate, '').replace(/\s?\/\)/g, '').replace(/\s?\/ (\.|-)/, '').replace(' / )', ')').replace('(г.) ', '').trim();
                FixreleaseDate = releaseDate.replace(/-|\//g, '.');
            } else {
                const infoAreaReleaseDate = SearchMatch(InfoArea, "(Дата релиза|Дата выхода)\s?(:|：)?(.+)", "/\/|-/g, '.'");
                if (infoAreaReleaseDate) {
                    FixreleaseDate = infoAreaReleaseDate.replace(/-|\//g, '.');
                }
            }

            // 제작자 추출            

            const makerSearchPatterns = `
            Выпущено
            Подсайт и сайт
            Издатель
            `.trim().split(/\r?\n/).map(e => e.trim()).filter(Boolean);


            let maker;
            if (/^\[.*?\]/.test(titleText)) {
                const makerMatch = /^\[(.*?)\]/.exec(titleText);
                if (makerMatch && makerMatch.length) {
                    titleText = titleText.replace(makerMatch[0], '');
                    maker = formatSentences(makerMatch[1].replace(/(\.(com|net))/gi, ''));
                }
            } else {
                const makerSearch = InfoArea.map(line => {
                    const m = line.match(searchRegex(makerSearchPatterns));
                    return m ? m[1].trim() : null;
                }).filter(Boolean).join(' ');


                if (makerSearch) {
                    titleText = titleText.replace(makerSearch, '').replace(/\(\s+\)/, '').trim()
                    const rebuildMaker = formatSentences(makerSearch.replace(/\.(com|net)/gi, ''));
                    maker = rebuildMaker;
                }
            }

            // ID
            const IDSearch = SearchMatch(InfoArea, "Студийный код фильма\s?(:|：)?(.+)", "/\/|-/g, '.'");
            let ID = IDSearch ? IDSearch.trim() : ''

            if (ID) {
                titleText = titleText.replace(ID, '').replace(/\[\]/g, '').replace(/\(\)/g, '');
            }
            let FC2ID = titleText.match(/FC2.+\d{6}/)
            if (FC2ID?.length > 0 && FC2ID[0]) {
                ID = FC2ID[0];
                titleText = titleText.replace('-', ' ');
                titleText = titleText.replace(/^FC2.+\s/, ' ');
                maker = ''
            }
            let codeID
            if (!ID) {
                const extracodeID = titleText.split(' ').find(e => e.match(ChinaID))
                if (extracodeID && !extractedModelName.includes(extracodeID)) {
                    titleText = `${titleText.replace(extracodeID, '').replace(/\[\]/g, '').replace(/\(|\)/g, '').trim()}`;
                    codeID = extracodeID;
                }
            }


            titleText = titleText.replace(TAGS_REGEX, '').trim();

            const titleDB = titleText
                .replace(/(\/|-)\s(?=[а-яА-ЯЁё]).*?(?:\/)/, '')
                .replace(/(\/|-)\s(?=[а-яА-ЯЁё]).*?(?=[\(|\[])/gi, '')
                .replace(/\[.*г.*?\]/, '')
                .replace(/\s?\/\s?\)$/, ')')
                .replace(/\s?\/\s?$/, '')
                .replace(/ч(\.\d+)/g, 'Part$1')
                .replace(/\(Split\s?Scenes\)/i, '')
                .replace(/часть|Часть/g, 'Part')
                .replace(/\|/g, '')
                .replace(/—/g, '-')
                .replace(/\.(com|net)/gi, '')
                .split(/\s/)
                .map(e => e.trim())
                .filter(Boolean);

            titleText = titleDB.join(' ')

            const checkLang = detectJaZh(InfoArea[0])
            if (checkLang.lang === 'ja' || checkLang.lang === 'zh') {
                if (checkLang.lang === 'ja') {
                    titleText = InfoArea[0]
                }
                else if (byteLengthOfCheck(titleText) + byteLengthOfCheck(InfoArea[0]) <= 240) {
                    titleText = `${titleText}(${InfoArea[0]})`
                }
            }

            if (byteLengthOfCheck(titleText) + byteLengthOfCheck(cleanedModelName) <= 240) {
                cleanedModelName = ''
            }


            return {
                TitleText: titleText,
                Remastered: remastered,
                BTS: bts,
                BetweenYear: betweenYear,
                ReleaseDate: FixreleaseDate,
                Maker: maker,
                TitleDB: titleDB,
                extractedId: ID,
                extractedcodeID: codeID,
                extractedResolution: resolution,
                extractedModelName: cleanedModelName,
            };
        },
        refine: (parsedData) => {
            const { TitleText, TitleDB, Remastered, BTS, BetweenYear, ReleaseDate, Maker, extractedId, extractedcodeID, extractedResolution, cleanedModelName } = parsedData;

            return {
                ...parsedData,
                extractedId,
                extractedModelName: cleanedModelName
            };
        }
    },
    'kin8tengoku\\.com': {
        parse: () => {
            const seriesMatch = /moviepages\/(\d+)\/index\.html/.exec(PageURL);
            const series = seriesMatch ? seriesMatch[1] : '';
            const titleText = `金8天国 ${series} ${TitleArea?.innerText.trim() || ''}`;
            const titleDB = titleText.split(/\s/);
            return {
                Series: series,
                TitleText: titleText,
                TitleDB: titleDB
            };
        },
        refine: (parsedData) => {
            // kin8tengoku.com의 경우 추가 ID 추출 없음
            const extractedId = '';
            return {
                ...parsedData,
                extractedId
            };
        }
    },
    'av-wiki\\.net': {
        parse: () => {
            let titleText = TitleArea.innerText.trim();
            const ID = extractAvWikiId() || '';
            if (ID) {
                titleText = titleText.replace(ID, '').replace('【】', '').trim();
            }
            const extractedModelName = getNextSibling(querySelectorIncludesText(InfoArea, 'dt', 'AV女優名'), 'dd')?.innerText.trim() || '';
            let cleanedModelName = ''
            if (extractedModelName){
                cleanedModelName = extractedModelName.split(/,/g).filter(element => !new RegExp(escapeRegExp(element), 'i').test(titleText)).join('\n').trim();
            }
            cleanedModelName = cleanedModelName.split('\n').filter(element => !/^#|\(≥o≤\)|＊＊＊/.test(element)).join(' ').trim();
            const titleDB = titleText.replace(/\s?\/\s?$/, '').split(/\s/);
            return {
                TitleText: titleText,
                TitleDB: titleDB,
                ID,
                cleanedModelName
            };
        },
        refine: (parsedData) => {
            const { TitleText, TitleDB, ID, cleanedModelName } = parsedData;            
            const extractedAmatureName = getNextSibling(querySelectorIncludesText(InfoArea, 'dt', '素人名義'), 'dd')?.innerText.trim() || '';
            
            return {
                ...parsedData,
                extractedId: ID,
                extractedAmatureName,
                extractedModelName: cleanedModelName
            };
        }
    },
    'bestjavporn\\.com|allasiangirls\\.net': {
        parse: () => {
            const titleText = TitleArea.innerText
                .replace(/–/g, '-')
                .replace(/(.+)(「|【)/, '$1 $2')
                .replace(/(NO|#)(\d+)/g, (match, prefix, number) => {
                    // 숫자와 접두어를 캡쳐하고, padZero를 사용하여 숫자를 3자리로 채웁니다.
                    return prefix === '#' ? `${prefix}${padZero(number, 3)}` : `${prefix}.${padZero(number, 3)}`
                })
                .normalize('NFC')
                .trim();
            const titleDB = titleText.split(/\s/);
            return {
                TitleText: titleText,
                TitleDB: titleDB
            };
        },
        refine: (parsedData) => {
            // bestjavporn.com, allasiangirls.net의 경우 추가 ID 추출 없음
            const extractedId = '';
            return {
                ...parsedData,
                extractedId
            };
        }
    },
    'getchu\\.com': {
        parse: () => {
            const titleText = TitleArea.innerText.trim();
            const titleDB = titleText.split(/\s/);
            return {
                TitleText: titleText,
                TitleDB: titleDB
            };
        },
        refine: (parsedData) => {
            const extractedId = extractGetchuId();
            return {
                ...parsedData,
                extractedId
            };
        }
    },
    'misskon\\.com': {
        parse: () => {
            let titleText = TitleArea.innerText.trim();
            titleText = titleText.replace(/(\d+)\sphotos/i, `$1P`).replace(/(\d+)\svideos?/i, `$1V`).replace(/P(\s\+\s)/, 'P')
            const titleDB = titleText.split(/\s/);
            return {
                TitleText: titleText,
                TitleDB: titleDB
            };
        },
        refine: (parsedData) => {            
            return {
                ...parsedData,
            };
        }
    },
    'default': {
        parse: () => {
            const titleText = TitleArea.innerText;            
            const titleDB = titleText
                .replace(/amp;|\(\s?ブルーレイ版\s?\)|\(ブルーレイディスク版\)|（ブルーレイディスク）/g, '')
                .replace(/（/g, '(')
                .replace(/）/g, ')')
                .split(/\s/);
            return {
                TitleText: titleText,
                TitleDB: titleDB
            };
        },
        refine: (parsedData) => {
            const { TitleText, TitleDB } = parsedData;
            const extractedId = extractDefaultId(TitleDB);
            let extractedSeries = (InfoArea.find(info => info.match(/シリーズ：?.*/)) || '').replace(/シリーズ：?/, '').trim();
            let extractedReleaseDate = CfgReleaseDate && !parsedData.ReleaseDate ? SearchMatch(InfoArea, "(発売日|Release Date|配信開始日)\s?(:|：)?(.+)", '/', '-') || '' : parsedData.ReleaseDate;
            let extractedMaker = MakerCfg && !parsedData.Maker ? SearchMatch(InfoArea, "(シリーズ|メーカー|Maker|サークル)\s?(:|：)?(.+)") || '' : parsedData.Maker;
            let extractedModelName = ModelName ? ModelName : SearchMatch(InfoArea, "^(Actress|Model|Author|Parody|出演者?)\s?(:|：)?(.*)")?.replace('(仮名)', '') || '';
            let cleanedModelName = extractedModelName.split(',').filter(element => !new RegExp(escapeRegExp(element), 'i').test(TitleText)).join(' ').trim()

            return {
                ...parsedData,
                extractedId,
                extractedSeries,
                ReleaseDate: extractedReleaseDate,
                Maker: extractedMaker,
                extractedModelName: cleanedModelName,
            };
        }
    }
};


/**
 * 웹사이트 도메인에 따라 타이틀 처리 로직을 호출하는 메인 함수입니다.
 * SiteParsers 객체에서 현재 도메인에 맞는 파서를 찾아 실행합니다.
 */
function SecondStep() {
    const siteKey = Object.keys(SiteParsers).find(key => new RegExp(key).test(RootDomain)) || 'default';
    const parsedData = SiteParsers[siteKey].parse();

    // GetTitle 함수는 이제 파싱된 데이터를 인자로 받습니다.
    console.log('parsedData:', parsedData)
    GetTitle(parsedData);
}

/**
 * 이 함수는 이제 SecondStep에서 파싱된 데이터를 인자로 받아 처리합니다.
 * 이 함수는 TitleText, Remastered, BTS, BetweenYear, ReleaseDate, Maker, TitleDB 전역 변수를 설정합니다.
 * 이 변수들은 GetTitle() 함수에서 사용됩니다.
 *
 * @param {object} parsedData SecondStep에서 파싱된 메타데이터 객체
 */
function GetTitle(parsedData) {
    const siteKey = Object.keys(SiteParsers).find(key => new RegExp(key).test(RootDomain)) || 'default';
    const refinedData = SiteParsers[siteKey].refine(parsedData);
    console.log('refinedData:', refinedData)
    console.log('ID:', refinedData.extractedId);

    addToPreserveList(refinedData.extractedId, toUpperCaseList, false)
    
    try {
        const finalTitle = assembleFinalTitle(refinedData);
        
        handleCoverImageDownload(finalTitle);
        console.log('최종 타이틀:', finalTitle);
        CopyTitle = nameCorrection(finalTitle).replace(/\.com/i, '.com').replace(/\.net/i, '.net');
        console.log('CopyTitle:', CopyTitle);
        CopyTitle = FilenameConvert(CopyTitle);
        CopyTitle = mbConvertKana(CopyTitle, 'rans');
        FullCopyTitle = nameCorrection(FullCopyTitle).replace(/\.com/i, '.com').replace(/\.net/i, '.net');
        FullCopyTitle = FilenameConvert(FullCopyTitle);
        FullCopyTitle = mbConvertKana(FullCopyTitle, 'rans');
        const copyTitle = document.querySelector('.CopyTitle');
        const fullCopyTitle = document.querySelector('.FullCopyTitle');
        if (copyTitle && CopyTitle) {
            copyTitle.setAttribute('title', CopyTitle);
        }

        if (fullCopyTitle && FullCopyTitle) {
            fullCopyTitle.setAttribute('title', FullCopyTitle);
        }

        console.log('정리된 최종 타이틀', '\nCopyTitle: ' + CopyTitle, byteLengthOfCheck(CopyTitle), '\nFullCopyTitle: ' + FullCopyTitle, byteLengthOfCheck(FullCopyTitle));
    } catch (err) {
        console.error("최종 타이틀 생성 실패:", err);
        throw new Error("assembleFinalTitle: data가 없습니다.");
    }   
}

/**
 * av-wiki.net에서 ID를 추출하는 헬퍼 함수
 */
function extractAvWikiId() {
    // MGS品番 또는 メーカー品番을 기준으로 ID 추출
    let id;
    if ((/[0-9]{3}[A-Z]{2,5}/.test(ID?.[0]) && !SKIPMGSID.test(ID?.[0])) || querySelectorIncludesText(InfoArea, 'dt', 'MGS品番')) {
        id = getNextSibling(querySelectorIncludesText(InfoArea, 'dt', 'MGS品番'), 'dd')?.innerText.trim();
    } else {
        id = getNextSibling(querySelectorIncludesText(InfoArea, 'dt', 'メーカー品番'), 'dd')?.innerText.trim();
    }
    return id || '';
}

/**
 * getchu.com에서 ID를 추출하는 헬퍼 함수
 */
function extractGetchuId() {
    const match = PageURL.match(/i\/item(\d+)?/);
    return match?.[1] || '';
}

/**
 * 기본 방식(SearchID 정규식)으로 ID를 추출하는 헬퍼 함수
 * @param {Array} titleDB - ID를 찾을 문자열 배열
 */
function extractDefaultId(titleDB) {
    const id = titleDB.find(entry => entry.match(SearchID)) || '';
    if (id) {
        // ID가 추출되면 TitleDB에서 제거
        const index = titleDB.findIndex(entry => entry === id);
        if (index > -1) {
            titleDB.splice(index, 1);
        }
    }
    return id;
}
/**
 * 파싱된 메타데이터를 사용하여 최종 파일 이름을 조립하는 함수입니다.
 *
 * @param {object} data - refine 단계에서 정리된 메타데이터 객체
 * @returns {string} - 파일 이름으로 사용할 수 있도록 정리된 최종 제목
 */
function assembleFinalTitle(data) {    
    // Destructuring을 사용하여 필요한 모든 데이터를 추출합니다.
    // NOTE: refine 단계에서 반환된 객체의 키와 일치하도록 변수명을 수정했습니다.
    let { extractedcodeID, extractedId, Maker, ReleaseDate, extractedModelName, TitleText, BetweenYear, Remastered, BTS, extractedResolution } = data;

    // 기본값 설정: 값이 없으면 빈 문자열을 할당하여 undefined 오류를 방지합니다.
    TitleText = extractedId ? TitleText.replace(extractedId, '').trim() : TitleText
    const formattedId = extractedId && extractedcodeID ? `${extractedId} ${extractedcodeID} ` : extractedId || extractedcodeID ? `${extractedId || extractedcodeID} ` : '';
    const formattedMaker = Maker && ReleaseDate ? `${Maker}` : Maker ? `${Maker} ` : '';
    const formattedReleaseDate = ReleaseDate ? `.${ReleaseDate}.` : ''
    let formattedModelName = extractedModelName ? `(${extractedModelName})` : '';
    const formattedResolution = extractedResolution ? ` ${extractedResolution}` : '';
    const formattedBTS = BTS ? ' [Behind The Scenes]' : '';
    const formattedRemastered = Remastered ? ' [Remastered]' : '';


    const byteLimit = 238;
    if (formattedModelName && byteLengthOfCheck(TitleText + formattedModelName) >= byteLimit) {
        formattedModelName = ''
    }

    if (byteLengthOfCheck(TitleText) >= byteLimit) {
        let TitleLast = getLastText(TitleText)
        let tempTitle = TitleText
        if (typeof TitleLast == 'undefined' || !TitleLast || TitleLast.length === 0 || TitleLast === "" || !/[^\s]/.test(TitleLast) || /^\s*$/.test(TitleLast) || TitleLast.replace(/\s/g, "") === "") {
            TitleText = TitleText.trim()
        }
        else {
            tempTitle = tempTitle.split(TitleLast)[0].trim()
            tempTitle = byteLengthOf(tempTitle, byteLimit - (byteLengthOfCheck(TitleLast)))
            TitleText = tempTitle + TitleLast.trim()
        }
    }

    console.log('TitleText: ', TitleText, byteLengthOfCheck(TitleText))

    let finalTitle = '';
    if (/pornolab\.net/.test(RootDomain)) {
        finalTitle = `${formattedMaker}${formattedId}${formattedReleaseDate}${TitleText}${formattedModelName}${BetweenYear}${formattedBTS}${formattedRemastered}${formattedResolution}`;
    } else if (/bestjavporn\.com|allasiangirls\.net/.test(RootDomain)) {
        finalTitle = `${TitleText}${formattedModelName}`;
    }
    else {
        finalTitle = `${formattedMaker}${formattedId}${formattedReleaseDate}${TitleText}${formattedModelName}`;
    }

    // 이중 공백 제거, 선행 하이픈 제거 후 트림
    finalTitle = finalTitle.replace(/^\s?-\s/, '').replace(/\((\s+)?\)/g, '').replace(/\[(\s+)?\]/g, '').replace(/\.(\s+)?$/, '').replace(/\s+/g, ' ').trim();
    FullCopyTitle = finalTitle
    // 최종 길이 제한 및 추가 태그
   

    const finalByteCheck = byteLengthOfCheck(finalTitle);

    if (finalByteCheck >= byteLimit) {
        finalTitle = byteLengthOf(finalTitle, byteLimit).trim();
    }
    
    // BTS 및 Remastered 태그 추가
    //if (BTS) finalTitle += ' [Behind The Scenes]';
    //if (Remastered) finalTitle += ' [Remastered]';

    // 외부 함수를 호출하여 최종 정리 후 반환합니다.
    return finalTitle;    
}

/**
 * 커버 이미지 다운로드 로직을 처리하는 함수
 */
function handleCoverImageDownload(title) {
    if (CoverImage && document.querySelector('.CoverDownload')) {
        let fullCoverImageUrl = CoverImage.src || (CoverImage.style.backgroundImage.slice(4, -1).replace(/["']/g, ""));
        const extension = fullCoverImageUrl?.split('.').pop() || '';
        const filename = `${title}.${extension}`;

        if (/image\.mgstage\.com\/images\/.*pb_p.*/.test(fullCoverImageUrl)) {
            fullCoverImageUrl = fullCoverImageUrl.replace('/pb_p_', '/pb_e_');
        }

        loadImage(fullCoverImageUrl, 10000).then(async () => {
            await sleep(1000)
            MakeDownloadIcon();
            document.querySelector('.CoverDownload').addEventListener("click", function (e) {
                e.preventDefault();
                forceDownload(fullCoverImageUrl, filename);
            });
        }).catch(error => {
            console.error("이미지 로딩 실패:", error);
        });
    }
}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 주어진 텍스트를 포함하는 DOM 요소를 찾습니다.
 * @param {HTMLElement} element - 검색을 시작할 요소
 * @param {string} tag - 찾을 요소의 태그 이름
 * @param {string} text - 찾을 텍스트
 * @returns {HTMLElement | undefined} - 일치하는 요소, 또는 undefined
 */
function querySelectorIncludesText(element, tag, text) {
    return Array.from(element.querySelectorAll(tag))
        .find(el => el.innerText.includes(text));
}

/**
 * 주어진 요소의 다음 형제 요소를 찾습니다.
 * @param {HTMLElement} element - 시작 요소
 * @param {string} tag - 찾을 형제 요소의 태그 이름
 * @returns {HTMLElement | undefined} - 일치하는 형제 요소, 또는 undefined
 */
function getNextSibling(element, tag) {
    let sibling = element?.nextElementSibling;
    while (sibling) {
        if (sibling.tagName.toLowerCase() === tag.toLowerCase()) {
            return sibling;
        }
        sibling = sibling.nextElementSibling;
    }
    return undefined;
}




document.addEventListener("DOMContentLoaded", () => {
    FontAwesomeCSS()    
    Start()
}, { once: true })





function removeHTML(str) {
    var tmp = document.createElement("DIV");
    tmp.innerHTML = str;
    return tmp.textContent || tmp.innerText || "";
}

function FixLink(str) {
    let tmp = document.createElement("a");
    tmp.href = str;
    return tmp.href
}

function MakeDownloadIcon() {
    if (!OffSetArea) return;

    const iconSet = document.querySelector('.CopyTitleIconSet');
    if (!iconSet) return;

    const iconHeight = iconSet.offsetHeight;
    const iconWidth = iconSet.offsetWidth;
    const areaHeight = OffSetArea.offsetHeight;
    const areaWidth = OffSetArea.offsetWidth;

    // 위치 계산
    let top, left;

    if (/kin8tengoku\.com/.test(RootDomain)) {
        top = areaHeight - iconHeight;
        left = areaWidth - iconWidth;
    } else if (/av-wiki\.net/.test(RootDomain)) {
        top = areaHeight - iconHeight / 2;
        left = areaWidth - iconWidth * 1.25;
    } else {
        top = areaHeight - iconHeight / 2;
        left = areaWidth - iconWidth / 2;
    }

    // 위치 적용
    iconSet.style.top = `${top}px`;
    iconSet.style.left = `${left}px`;

    // CoverDownload의 폰트 크기 조정
    const coverDownload = document.querySelector('.CoverDownload');
    if (coverDownload) {
        const scale = (1 / (getDPI / 1.5)) * (16 / defaultFontSize);
        const remSize = Number(scale.toFixed(2));
        coverDownload.style.setProperty('font-size', `${remSize}rem`, 'important');
    }

    iconSet.style.visibility = 'visible';
}


function SearchMatch(Array, Search, SearchReplace, ReplaceSTR) {
    console.log(Array, Search, SearchReplace, ReplaceSTR)
    const SearchRegEx = new RegExp(Search)
    const SearchReplaceRegEx = SearchReplace ? new RegExp(SearchReplace, 'g') : ''
    console.log(SearchRegEx, SearchReplaceRegEx)
    const MatchItem = Array.find((e) => SearchRegEx.test(e) && !/http/.test(e))
    console.log('MatchItem:', MatchItem)
    if (MatchItem) {
        //console.log(SearchReplaceRegEx, ReplaceSTR)
        if (SearchReplace) {
            //console.log(MatchItem.match(SearchRegEx).pop())
            return MatchItem.match(SearchRegEx).pop().trim().replace(SearchReplaceRegEx, ReplaceSTR).trim()
        }
        else {
            return MatchItem.match(SearchRegEx).pop().trim()
        }
    }
    else { return '' }
}

function loadImage(path, timeout = 10000) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        const timer = setTimeout(() => {
            image.onload = null;
            image.onerror = null;
            reject(new Error("timeout"));
        }, timeout);

        image.onload = () => {
            clearTimeout(timer);
            console.log('Cover Image Loaded!');
            resolve(true);
        };

        image.onerror = (error) => {
            clearTimeout(timer);
            console.error("load error", error);
            reject(new Error("load error " + path));
        };

        image.src = path;
    });
}

function forceDownload(url, fileName) {
    if (/^(\/\/|\.\/|\/)/.test(url)) {
        url = FixLink(url)
    }
    GM_xmlhttpRequest({
        method: "GET",
        url: url,
        responseType: "blob",
        onload: function (res) {
            if (res.status == 200) {
                const matchContentType = res.responseHeaders.match(/content-type: (.*?)(;|$)/i);                
                const contentType = matchContentType ? matchContentType[1] : null;
                console.log({ matchContentType, contentType })                
                if (contentType && contentType === 'text/html') throw new Error(`파일이 없거나 다운로드 횟수를 초과하였습니다!`)
                if (contentType) {
                    const extension = getExtensionFromContentType(contentType);
                    saveAs(res.response, fileName + extension)
                } else {
                    saveAs(res.response, fileName)
                }
            }
        },
        onerror: (err) => {
            console.log("Error:", err);
        },
    })
}

/**
 * HTML 요소를 <br> 태그를 기준으로 분리한 후,
 * 각 분리된 요소의 innerText에서 줄바꿈을 처리하여 최종 배열을 생성합니다.
 * <br> 태그가 연속으로 나오는 경우에도 빈 줄을 깔끔하게 처리합니다.
 * @param {HTMLElement} InfoSelector - 텍스트를 추출할 HTML 요소.
 * @returns {Array<string>} - 줄 단위로 분리되고 정리된 순수한 텍스트 배열.
 */
function getInfoArea(InfoSelector) {

    // sp-wrap 요소를 제거한 후 innerHTML을 사용합니다.
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = InfoSelector.innerHTML;

    // 모든 .sp-wrap 클래스를 가진 요소를 찾습니다.
    const spWraps = tempDiv.querySelectorAll('.sp-wrap');
    spWraps.forEach(wrap => {
        // 찾은 요소를 부모 노드에서 제거합니다.
        wrap.parentNode.removeChild(wrap);
    });

    // innerHTML을 가져와 <br> 태그를 기준으로 문자열을 분리합니다.
    const tempArray = tempDiv.innerHTML.split(/<br\s*\/?>/)
        .map(line => line.trim()) // 각 줄의 앞뒤 공백 제거
        .filter(Boolean)
        .slice(0, 20); // 빈 문자열 제거;

    // 각 분리된 아이템을 임시 div에 넣고 innerText를 추출하여 배열을 만듭니다.
    const infoArray = tempArray.flatMap(item => {
        // 임시 div 요소를 생성합니다.
        const tempDiv = document.createElement('div');
        // 분리된 HTML 조각을 임시 div의 innerHTML에 넣습니다.
        tempDiv.innerHTML = item;

        // innerText가 있는 경우에만 처리합니다.
        if (tempDiv.innerText.trim() !== '') {
            // 임시 div의 innerText를 가져와 줄바꿈을 기준으로 배열을 생성합니다.
            return tempDiv.innerText
                .split(/(?:(?:\r\n|\r|\n))/)
                .map(line => line.trim()) // 각 줄의 앞뒤 공백 제거
                .filter(Boolean); // 빈 문자열 제거
        } else {
            return []; // innerText가 비어 있으면 빈 배열을 반환하여 flatMap이 건너뛰도록 합니다.
        }
    });

    console.log('Info: ', infoArray);
    return infoArray.slice(0, 20); // 처음 20개 항목만 가져옵니다.
}


function getPreviousSibling(elem, selector) {

    // Get the next sibling element
    var sibling = elem.previousElementSibling;

    // If there's no selector, return the first sibling
    if (!selector) return sibling;

    // If the sibling matches our selector, use it
    // If not, jump to the next sibling and continue the loop
    while (sibling) {
        if (sibling.matches(selector)) return sibling;
        sibling = sibling.previousElementSibling;
    }

};


function getExtensionFromContentType(contentType) {
    const mimeTypeMap = {
        // Common image types
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'image/svg+xml': '.svg',
        'image/webp': '.webp',
        'image/bmp': '.bmp',

        // Common audio and video types
        'audio/mpeg': '.mp3',
        'audio/wav': '.wav',
        'video/mp4': '.mp4',
        'video/webm': '.webm',

        // Common types
        'application/pdf': '.pdf',
        'application/msword': '.doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
        'application/vnd.ms-excel': '.xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
        'application/vnd.ms-powerpoint': '.ppt',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
        'text/plain': '.txt',
        'text/html': '.html',
        'application/json': '.json',
        'application/xml': '.xml',
        'application/zip': '.zip',
        'application/gzip': '.gz',
        'application/x-tar': '.tar',
        'application/x-rar-compressed': '.rar',
        'application/x-7z-compressed': '.7z',
        'application/x-bittorrent': '.torrent',

        // Default or unknown type
        'default': '.bin'
    };

    // The Content-Type header might contain charset information (e.g., 'text/html; charset=utf-8').
    // We need to split and take only the MIME type.
    const mimeType = contentType.split(';')[0].trim().toLowerCase();

    // Return the mapped extension, or a default extension if not found
    return mimeTypeMap[mimeType] || mimeTypeMap['default'];
}
