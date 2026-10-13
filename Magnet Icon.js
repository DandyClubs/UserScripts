// ==UserScript==
// @name         Magnet Icon
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @include      https://www.t66y.com/htm_data/*.html
// @include      /t66y\.com\/htm_data\/.+\.html/
// @include      /t66y\.com\/read\.php\?tid=/
// @include      https://sehuatang.net/*.html
// @include      /trupornolabs\.org\/torrent\/\d+/
// @include      https://www.tanhuazu.com/threads/*
// @connect      *
// @grant        GM_xmlhttpRequest
// @grant        GM_setClipboard
// @grant		 GM_addStyle
// @run-at       document-end
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js
// @require      https://raw.githubusercontent.com/DandyClubs/CopyLinksCommonJS/main/CopyLinksCommonJS.js
// @require      https://raw.githubusercontent.com/DandyClubs/CopyLinksCommonJS/main/Masonry.js
// @require      https://cdn.jsdelivr.net/npm/viewerjs@1.15.2/dist/viewer.min.js
// @resource     VIEWER_CSS https://cdn.jsdelivr.net/npm/viewerjs@1.15.2/dist/viewer.min.css
// @require      https://raw.githubusercontent.com/DandyClubs/Filter/main/Filters.js
// @grant        GM_getResourceText
// ==/UserScript==

const FontAwesomeCSS = function () {
    let css = document.createElement('link');
    css.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css';
    css.rel = 'stylesheet';
    css.type = 'text/css';
    document.getElementsByTagName('head')[0].appendChild(css);
};

const viewerCss = GM_getResourceText("VIEWER_CSS");
GM_addStyle(viewerCss);

GM_addStyle(`
.GetMagnetIcon, .CloseIcon, .CopyItemIcon {
    cursor: pointer;
    margin: .5em;
}
.CenterBox {
    right: 30%;
    left: auto;    
    margin: 0 auto;
    top: var(--scroll-top, 120px);
    max-width: max-content;
    position: fixed !important;
    word-spacing: .5rem;
    font-style: initial !important;
    text-align: center;
    color: dodgerblue !important;
    border-radius: .25em !important;
    text-shadow: 2px 4px 4px rgba(0,0,0,0.2),
                 0px -5px 10px rgba(255,255,255,0.15);
}

.image-masonry {
    position: relative;
    width: 100%;
    background: rgba(0, 0, 0, 0.03);
    border-radius: 10px;
    transition: opacity 0.6s ease, height 0.3s ease;
    opacity: 0;
    visibility: hidden;
}

/* 완료 시 스피너 숨기기 및 본체 보이기 */
.image-masonry.layout-done {
    opacity: 1;
    visibility: visible;
    background: transparent;
    background: none !important;
}

.image-masonry-item {
	position: absolute;
	box-sizing: border-box;
	transition: all 0.4s cubic-bezier(0.25, 0.1, 0.25, 1);
	overflow: hidden !important;
}

.image-masonry-item img {
    width: 100%;
    height: 100%;
    object-fit: cover; /* 비율 유지하며 꽉 채우기 */
    border-radius: 8px;
    display: block;
}

.textblock {
	width: 100%;
}

.textblock > span[style*="display:inline-block"][style*="color:green"] {
    display:block !important;
}


.viewer-backdrop {
        background-color: rgba(0, 0, 0, 0.8) !important;
    }


.image-loader {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
    padding: 20px;
}

/* 원형 프로그레스 바 */
.progress-circle {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    /* --p 변수에 따라 채워짐 */
    background: radial-gradient(closest-side, white 80%, transparent 0),
                conic-gradient(#4da3ff calc(var(--p) * 1%), #d9e9ff 0);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: --p 0.3s ease; /* 부드러운 애니메이션 (브라우저 지원 필요) */
}
`);


const RegexFrom = (strings, flags) =>
    new RegExp(
        strings
            .filter(e => e)
            .map(t => t.replace(/\s+/g, '\\s'))
            .join("|"),
        flags
    );


const ExcludeChar = /[&<\/:>*?"|\\]/g;
const JapaneseChar = /[ぁ-んァ-ン一-龯]/;
const cyrillicPattern = /[а-яА-ЯЁё]/g;
const englishPattern = /[A-Za-z0-9]/;
const titlePrefixRegex = /^【(?:影片标题|影片名称|影片名称代|影片名稱|檔案名稱|文件名称|资源名称|档案名称|影片名称代号|原文片名)】[：:]\s*/g;
const skipKeywords = ["最强優片", "最強國產專輯"];
const PageURL = window.location !== window.parent.location ? document.referrer : document.location.href;
const RemoveContentEX = RegexFrom(RemoveContentText.split(/\r?\n/), 'i');
let firstScrollPos = '';



let Title, MagnetLink, InfoArea, FindMagnetHash, GetData;

function onElementLoaded(elementToObserve, parentStaticElement) {
    const promise = new Promise((resolve, reject) => {
        try {
            if (document.querySelector(elementToObserve)) {
                console.log(`element already present: ${elementToObserve}`);
                resolve(true);
            }
            const parentElement = parentStaticElement
                ? document.querySelector(parentStaticElement)
                : document;

            const Onobserver = new MutationObserver((mutationList, obsrvr) => {
                const divToCheck = document.querySelector(elementToObserve);

                if (divToCheck) {
                    console.log(`element loaded: ${elementToObserve}`);
                    Onobserver.disconnect(); // stop observing
                    resolve(true);
                }
            });

            // start observing for dynamic div
            Onobserver.observe(parentElement, {
                childList: true,
                subtree: true,
            });
        } catch (e) {
            console.log(e);
            reject(Error("some issue... promise rejected"));
        }
    });
    return promise;
}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function copyToClipboard(text) {
    try {
        updateClipboard(text);
    } catch (err) {
        console.error("updateClipboard: ", err);
    }
}

function updateClipboard(CopyData) {
    if (!CopyData) throw new Error("updateClipboard CopyData가 없습니다.");
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(CopyData).then(() => {
            console.log('navigator.clipboard - Copying to clipboard was successful!');
        }).catch(() => {
            GM_setClipboard(CopyData);
            console.log('GM_setClipboard fallback - Copying to clipboard was successful!');
        });
    } else {
        GM_setClipboard(CopyData);
        console.log('GM_setClipboard - Copying to clipboard was successful!');
    }
}

function scrollToTitlePx(target, offset = 80) {
    if (!target) return;
    let spacer = document.getElementById('scroll-spacer');

    const currentSpacerHeight = spacer ? parseFloat(spacer.style.height) || 0 : 0;
    const top = target.getBoundingClientRect().top;
    const absoluteElementTop = top + window.pageYOffset;
    const finalPosition = absoluteElementTop - offset;

    const viewportHeight = window.innerHeight;
    const rawScrollHeight = document.documentElement.scrollHeight - currentSpacerHeight;
    const rawMaxScrollY = rawScrollHeight - viewportHeight;

    if (finalPosition > rawMaxScrollY) {
        const exactShortfall = Math.ceil(finalPosition - rawMaxScrollY + 120);

        if (!spacer) {
            spacer = document.createElement('div');
            spacer.id = 'scroll-spacer';
            spacer.style.pointerEvents = 'none';
            document.body.appendChild(spacer);
        }

        spacer.style.height = `${exactShortfall}px`;
        console.log(`[Scroll] 하단 공간 정확 보정: +${exactShortfall}px`);
    }

    window.scrollTo({
        top: Math.max(0, finalPosition),
        behavior: 'auto'
    });
}

const containerSelector = '.tpc_content.do_not_catch';

async function init() {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const wrappers = createSectionMasonry(container);

    if (!wrappers || wrappers.length === 0) {
        console.log("렌더링할 이미지 섹션이 없습니다.");
        if (firstScrollPos?.element) {
            scrollToTitlePx(firstScrollPos.element, 80);
        }
        return;
    }

    initImageGallery(wrappers);
    const loaders = new Map();

    for (const wrapper of wrappers) {
        wrapper.style.visibility = 'visible';
        wrapper.insertAdjacentHTML('beforebegin', `<div class="image-loader"><div class="progress-circle" style="--p: 0"></div></div>`);
        const loader = wrapper.previousElementSibling;
        loaders.set(wrapper, loader);
    }

    const concurrency = 3;
    const queue = [...wrappers];

    let resolveFirst;
    const firstPromise = new Promise(res => resolveFirst = res);
    const firstWrapper = wrappers[0];

    const processWrapper = async (wrapper) => {
        try {
            const currentLoader = loaders.get(wrapper);
            const imgCount = wrapper.querySelectorAll('img').length;

            if (imgCount === 0) {
                if (currentLoader) currentLoader.remove();
                wrapper.classList.add('layout-done');
                wrapper.style.visibility = '';

                if (wrapper === firstWrapper) {
                    resolveFirst();
                }
                return;
            }

            await smartImageLoader(wrapper, currentLoader);

            void wrapper.offsetWidth;
            const columnCount = imgCount > 2 ? 3 : 2;
            const maxHeight = imgCount > 2 ? 600 : 800;
            optimizeSingleLayout(wrapper, columnCount, maxHeight);

            if (currentLoader) currentLoader.remove();
            wrapper.classList.add('layout-done');
            wrapper.style.visibility = '';

        } catch (err) {
            console.error("Layout error:", err);
        } finally {
            if (wrapper === firstWrapper) {
                resolveFirst();
            }
        }
    };

    const workers = Array(concurrency).fill(null).map(async () => {
        while (queue.length > 0) {
            const wrapper = queue.shift();
            if (wrapper) {
                await processWrapper(wrapper);
            }
        }
    });

    await firstPromise;

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            console.log("첫 번째 섹션 처리 완료. 스크롤 위치 조정 중...", firstScrollPos?.element);
            if (firstScrollPos?.element) {
                scrollToTitlePx(firstScrollPos.element, 80);
            }
        });
    });

    await Promise.all(workers);
    console.log("모든 렌더링이 완료되었습니다.");
}

function initImageGallery(wrappers) {
    wrappers.forEach(wrapper => {
        const viewer = new Viewer(wrapper, {
            url: (img) => {
                return img.getAttribute("ess-data") || img.getAttribute("data-src") || img.src;
            },
            title: true,
            toolbar: true,
            navbar: true,
            tooltip: true,
            movable: true,
            zoomable: true,
            transition: true,
            fullscreen: true,
            keyboard: true,
            viewed() {}
        });

        wrapper.querySelectorAll('img').forEach(img => {
            img.style.cursor = 'pointer';
            img.addEventListener('click', (e) => {});
        });
    });
}

function linkifyNodes(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    const nodes = [];

    while (walker.nextNode()) {
        const node = walker.currentNode;
        if (node.parentNode.tagName === 'A' || node.parentNode.closest('a')) {
            if (node.textContent.startsWith('[url]http')) {
                nodes.push(node);
            } else {
                continue;
            }
        }
        nodes.push(node);
    }

    const urlRegex = /(https?:\/\/[^\s()<>]+\b)/gi;

    nodes.forEach(node => {
        const text = node.textContent.replace(/\[\/?url\]/gi, '');
        const parentA = node.parentNode?.closest('a');
        if (parentA) {
            const matches = text.match(urlRegex);
            if (matches) {
                matches.forEach(url => {
                    node.textContent = node.textContent
                        .replace(/\[\/?url\]/gi, '')
                        .replace(url, '')
                        .trim();

                    const newA = document.createElement('a');
                    newA.href = url;
                    newA.textContent = url;
                    newA.target = "_blank";
                    newA.rel = "noopener noreferrer";

                    parentA.parentNode.insertBefore(newA, parentA.nextSibling);
                });
            }
        } else {
            if (urlRegex.test(text)) {
                const fragment = document.createDocumentFragment();
                let lastIndex = 0;

                urlRegex.lastIndex = 0;
                let match;
                while ((match = urlRegex.exec(text)) !== null) {
                    if (match.index > lastIndex) {
                        fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
                    }

                    const url = match[0];
                    const a = document.createElement('a');
                    a.href = url;
                    a.textContent = url;
                    a.target = "_blank";
                    a.rel = "noopener noreferrer";
                    fragment.appendChild(a);

                    lastIndex = urlRegex.lastIndex;
                }

                if (lastIndex < text.length) {
                    fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
                }
                node.parentNode.replaceChild(fragment, node);
            }
        }
    });
}

const useWsrvDomains = [
    'i.11img.com',
];

async function Main() {

    if (/t66y\.com/.test(location.href)) {

        const container = document.querySelector('.tpc_content');
        if (!container) return;

        container.querySelectorAll('p[align="center"]').forEach(p => {
            if (p.innerText.includes('請遵守當地律法')) {
                p.remove();
            }
        });

        const spanWidth = container.querySelector('b span[style*="color:green"]');
        if (spanWidth) {
            spanWidth.style.width = '100%';
        }

        const selector = useWsrvDomains
            .map(domain => `img[ess-data*="${domain}"]:not([src^="https://wsrv.nl/"]:not([ess-data^="https://wsrv.nl/"])`)
            .join(', ');

        const images = document.querySelectorAll(selector);

        images.forEach(img => {
            console.log('지역 제한 wsrv.nl 프록시 서비스 적용:', img.getAttribute('ess-data'));
            img.setAttribute('ess-data', `https://wsrv.nl/?url=${encodeURIComponent(img.getAttribute('ess-data'))}`);
        });

        linkifyNodes(container);

        function extractTitles(root) {
            const walker = document.createTreeWalker(
                root,
                NodeFilter.SHOW_TEXT,
                null,
                false
            );

            const titles = [];

            while (walker.nextNode()) {
                let currentNode = walker.currentNode;
                let raw = currentNode.textContent;

                if (!titlePrefixRegex.test(raw)) continue;

                let cleanTitle = raw.replace(titlePrefixRegex, '').trim().replace(/^(:|：)/, '').trim();

                const isTargetEmpty = cleanTitle.length === 0;
                const containsSkip = skipKeywords.some(keyword => cleanTitle.includes(keyword));

                if (isTargetEmpty || containsSkip) {
                    if (walker.nextNode()) {
                        currentNode = walker.currentNode;
                        raw = currentNode.textContent;
                        cleanTitle = raw.trim();
                    }
                }

                cleanTitle = cleanTitle
                    .replace(/^\d{3,4}[_-]/, '')
                    .replace(/^(?!91YCM)\d{1,2}/, '')
                    .replace(/^\s?\[MP4.*?\]/, '')
                    .replace(/\[[a-zA-Z0-9\.\/]+\]/, '')
                    .trim();

                if (cleanTitle) {
                    titles.push({
                        textNode: currentNode,
                        rawText: raw,
                        title: cleanTitle
                    });
                }
            }

            for (const { title } of titles) {
                if (RemoveContentEX.test(title)) {
                    console.log(`제외 키워드 발견: ${title}`);
                    if (titles.length === 1) {
                        console.log("제외 키워드만 존재하여 창을 닫습니다.");
                        self.close();
                    }
                }
            }
            console.log("추출된 제목 목록:", titles.map(t => t.title));
            return titles;
        }

        function buildMagnetPairs(root) {
            const titles = extractTitles(root);
            if (!titles.length) return [];

            const result = [];

            titles.forEach((currentTitleObj, i) => {
                const currentTitleNode = currentTitleObj.textNode;
                const nextTitleNode = titles[i + 1] ? titles[i + 1].textNode : null;

                const allLinks = Array.from(root.querySelectorAll('a[href]')).filter(link => {
                    const isAfterCurrent = (currentTitleNode.compareDocumentPosition(link) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
                    const isBeforeNext = nextTitleNode
                        ? (link.compareDocumentPosition(nextTitleNode) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
                        : true;

                    return isAfterCurrent && isBeforeNext;
                });

                let magnet = null;

                const directMagnet = allLinks.find(link => link.href.startsWith('magnet:?'));
                if (directMagnet) {
                    magnet = updateMagnetParams(directMagnet.href, { dn: currentTitleObj.title });
                    directMagnet.href = magnet;
                } else {
                    const rmdownLink = allLinks.find(link => /rmdown\.com\/link\.php\?hash=/i.test(link.href));
                    if (rmdownLink) {
                        const match = rmdownLink.href.match(/hash=\d{3}([a-f0-9]{40})/i);
                        if (match) {
                            const hash = match[1].toLowerCase();
                            magnet = `magnet:?xt=urn:btih:${hash}&dn=${encodeURIComponent(currentTitleObj.title)}`;
                            rmdownLink.href = magnet;
                        }
                    }
                }

                if (magnet) {
                    result.push({
                        textNode: currentTitleObj.textNode,
                        rawText: currentTitleObj.rawText,
                        title: currentTitleObj.title,
                        magnet
                    });
                }
            });

            return result;
        }

        const titles = buildMagnetPairs(container);

        if (!titles.length) return;

        const total = titles.length;
        let currentIndex = 0; // 🛠️ 현재 선택된 인덱스를 관리하는 변수 추가

        titles.forEach((item, index) => {

            const span = document.createElement('span');
            span.className = 'title-row';
            span.textContent = item.rawText;
            span.style.position = 'relative';
            span.style.display = 'inline-block';
            span.style.width = '100%';
            span.style.whiteSpace = 'normal';
            span.style.minHeight = '1.2em';
            span.style.boxSizing = 'border-box';
            span.style.paddingRight = '180px';
            span.style.minHeight = '1.4em';

            item.textNode.parentNode.replaceChild(span, item.textNode);

            const numbering = total > 1
                ? `[ ${index + 1}/${total} ]`
                : '';

            span.insertAdjacentHTML('beforeend', `
            <i class="title-ui"
                  data-index="${index}"
                  style="position:absolute;
                         left:85%;
                         top: 17.6px;
                         transform: translateY(-50%);
                         display:flex;
                         color: dodgerblue !important;
                         align-items:center;
                         gap:10px;
                         font-size:12px;">

                <a href="${item.magnet}"
                   class="magnet-link fa-solid fa-magnet"
                   title="Magnet"
                   style="text-decoration:none;color: dodgerblue !important;font-size:16px;"></a>

                <i class="copy-icon fa-regular fa-clipboard"
                      title="Copy + Magnet"
                      style="cursor:pointer;color: dodgerblue !important;font-size:16px;"></i>

                <i class="close-icon fa-solid fa-square-xmark"
                      title="Close"
                      style="cursor:pointer;color: dodgerblue !important;font-size:16px;"></i>

                ${total > 1
                    ? `<i>&nbsp;</i><i class="prev-icon fa-solid fa-circle-chevron-left"
                             title="Prev"
                             style="cursor:pointer;color: dodgerblue !important;font-size:16px;"></i>
                             <i class="next-icon fa-solid fa-circle-chevron-right"
                             title="Next"
                             style="cursor:pointer;color: dodgerblue !important;font-size:16px;"></i>
                             <i>${numbering}</i>`
                    : ''}
            </i>
        `);
            item.element = span;
        });

        firstScrollPos = titles[0];
        init();

        // 🛠️ 클릭 이벤트: 클릭한 항목의 인덱스로 currentIndex 동기화
        document.addEventListener('click', e => {
            const ui = e.target.closest('.title-ui');
            if (!ui) return;

            const index = Number(ui.dataset.index);
            currentIndex = index; // 인덱스 업데이트
            const current = titles[index];

            if (e.target.classList.contains('copy-icon')) {
                ui.querySelector('.magnet-link').style.setProperty('color', 'Orange', 'important');
                window.location.href = current.magnet;
                navigator.clipboard.writeText(current.title)
                    .catch(() => { });
                e.target.style.setProperty('color', 'Orange', 'important');
            }
            else if (e.target.classList.contains('magnet-link')) {
                e.target.style.setProperty('color', 'Orange', 'important');
            }
            else if (e.target.classList.contains('close-icon')) {
                window.close();
            }
            else if (e.target.classList.contains('prev-icon')) {
                currentIndex = (currentIndex - 1 + titles.length) % titles.length;
                const prev = titles[currentIndex];
                scrollToTitlePx(prev.element, 80);
            }
            else if (e.target.classList.contains('next-icon')) {
                currentIndex = (currentIndex + 1) % titles.length;
                const next = titles[currentIndex];
                scrollToTitlePx(next.element, 80);
            }
        });

        // 🛠️ 스페이스바 키다운 이벤트: 정의된 currentIndex를 기반으로 안전하게 순환
        if(total > 1) {
        document.addEventListener('keydown', e => {
            if (e.code !== 'Space' ||
                ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) ||
                document.activeElement.isContentEditable) {
                return;
            }
            e.preventDefault();
            e.stopPropagation();

            if (!e.shiftKey) {
                currentIndex = (currentIndex + 1) % titles.length;
                const next = titles[currentIndex];
                scrollToTitlePx(next.element, 80);
            } else {
                currentIndex = (currentIndex - 1 + titles.length) % titles.length;
                const prev = titles[currentIndex];
                scrollToTitlePx(prev.element, 80);
            }
        });
    }
        
        return;
    }

    else if (/sehuatang\.net/.test(PageURL) && document.querySelector('div#postlist div tbody tr td.plc div.pct div.pcb div.t_fsz table tbody tr td')) {
        InfoArea = document.querySelector('div#postlist div tbody tr td.plc div.pct div.pcb div.t_fsz table tbody tr td').innerText.replace(/(?:(?:\r\n|\r|\n)\s*){2}/gm, '\n').replace(/\t/g, '').trim().split(/\n/);
        InfoArea = InfoArea.filter(function (e) { return e; });
        Title = InfoArea.find(element => element.match(/(【影片名称】：|影片名称：)(.*)/));
        Title = Title ? Title.replace(/(【影片名称】：|影片名称：)/, '').replace(/^\s?\[MP4.*?\]/, '').replace(/\[[a-zA-Z0-9\.\/]+\]/, '').trim() : '';
        MagnetLink = InfoArea.find(element => element.match(/magnet:\?xt=urn:btih:[0-9a-zA-Z]+/));
        if (MagnetLink) {
            MagnetLink = MagnetLink.match(/magnet:\?xt=urn:btih:[0-9a-zA-Z]+/)[0];
        }

        Array.from(document.querySelectorAll('IMG')).forEach(el => {
            if (el.getAttribute('onmouseover')) {
                el.removeAttribute('onmouseover');
            }
        });

        firstScrollPos = document.querySelector('div#postlist table tbody tr td h1 span#thread_subject');
        scrollToTitlePx(firstScrollPos, 120);
    }
    else if (/tanhuazu\.com/.test(PageURL)) {
        if (document.querySelector('a[href^="https://s1.obdown.com/do.php?filename="]')) {
            for (let step = 0; step < 5; step++) {
                GetData = await CheckMagnet(document.querySelector('a[href^="https://s1.obdown.com/do.php?filename="]').href);
                if (GetData[0] == 200 || GetData[0] == 404) {
                    break;
                }
            }
            MagnetLink = GetData[1];
        }
        else if (document.querySelector('div.bbCodeBlock-content pre.bbCodeCode code')) {
            MagnetLink = document.querySelector('div.bbCodeBlock-content pre.bbCodeCode code').innerText;
        }

        if (!/^magnet/.test(MagnetLink)) { return; }
        InfoArea = document.querySelector('article.message-body div.bbWrapper').innerText.replace(/(?:(?:\r\n|\r|\n)\s*){2}/gm, '\n').replace(/\t/g, '').trim().split(/\n/);
        InfoArea = InfoArea.filter(function (e) { return e; });
        Title = InfoArea.find(element => element.match(/(【影片名称】：|影片名称：|[影片名称]：|【檔案名稱】:)(.*)(.*)/));
        Title = Title ? Title.replace(/(【影片名称】：|影片名称：|[影片名称]：|【檔案名稱】:)/, '').replace(/\[[a-zA-Z0-9\.\/]+\]/, '').trim() : '';
        let TopTitle = document.querySelector('div.p-title h1.p-title-value').innerText;
        Title = Title.includes(TopTitle) || !Title ? TopTitle : Title;
    }
    else if (/trupornolabs\.org\/torrent\/\d+/.test(document.location)) {
        let link = document.querySelector('div#content div#download a[href^="magnet:"]');
        Title = getNextSibling(link, 'a[href^="/torrent/"]') ?? getNextSibling(link, 'a[href*="trupornolabs.org/download"]');
        Title = Title.innerText.replace('Скачать ', '').replace(/\.torrent$/, '');
        if (document.querySelector('table#details')) {
            InfoArea = document.querySelector('table#details').innerText.replace(/(?:(?:\r\n|\r|\n)\s*){2}/gm, '\n').split(/\n/);
            let ID = InfoArea.find((el) => el.match(/Студийный\sкод\sфильма:/));
            if (ID) {
                let TmpTitle = InfoArea.find((el, i) => {
                    if (JapaneseChar.test(el) && i < 2) {
                        return el;
                    }
                });
                Title = TmpTitle || Title;
                ID = ID.replace("Студийный код фильма:", '').trim();
                Title = ID + ' ' + Title;
            }
            if (link && Title) {
                if (englishPattern.test(Title)) {
                    let TmpTitle = Title.split('/');
                    Title = TmpTitle.filter(e => !cyrillicPattern.test(e)).join(' ');
                }
                MagnetLink = removeUriWithParam(link.href, 'dn');
            }
        }
    }

    if (Title) {
        if (Title.match(ExcludeChar)) {
            Title = FilenameConvert(Title);
            Title = mbConvertKana(Title, 'rans');
        }
    }

    if (!MagnetLink) {
        if (FindMagnetHash) {
            MagnetLink = 'magnet:?xt=urn:btih:' + /hash=\d{3}(.+)/.exec(FindMagnetHash)[1];
        }
    }

    MakeIcon();

    document.querySelector('.CopyItemIcon')?.addEventListener("click", function (e) {
        e.preventDefault();
        document.querySelector('.CopyItemIcon').style.setProperty('color', 'Orange', 'important');
        document.querySelector('.GetMagnetIcon').click();
        copyToClipboard(Title);
    });

    if (MagnetLink && Title) {
        const updates = {
            dn: Title,
        };
        document.querySelector('.GetMagnetIcon').setAttribute('href', updateMagnetParams(MagnetLink, updates));
    }
    else if (MagnetLink) {
        document.querySelector('.GetMagnetIcon').setAttribute('href', MagnetLink);
    }
}

function MakeIcon() {
    document.querySelector("body").insertAdjacentHTML('beforeend', '<div class="CenterBox"></>');
    const CenterBox = document.querySelector('.CenterBox');
    if (MagnetLink) {
        CenterBox.insertAdjacentHTML('beforeend', '<a class="GetMagnetIcon fa-solid fa-magnet" style="color: dodgerblue !important;"></>');
        document.querySelector('.GetMagnetIcon').addEventListener("click", function (e) {
            document.querySelector('.GetMagnetIcon').style.setProperty('color', 'Orange', 'important');
        });
    }
    if (/t66y\.com/.test(PageURL)) {
        CenterBox.insertAdjacentHTML('beforeend', '<i class="CopyItemIcon fa-regular fa-clipboard"></>');
    } else {
        if (firstScrollPos) {
            CenterBox.style.setProperty('--scroll-top', `${firstScrollPos.getBoundingClientRect().top}px`);
        }
    }

    CenterBox.insertAdjacentHTML('beforeend', '<i class="CloseIcon fa-solid fa-square-xmark" style ="color: red !important;"></>');

    const GetDPI = window.devicePixelRatio;
    const DefaultFontSize = getDefaultFontSize();
    const CneterBoxFontSize = Number(((1 / (GetDPI / 1.5)) * (16 / DefaultFontSize)).toFixed(2)) + 'rem';
    document.querySelector('.CenterBox').style.cssText = `font-size: ${CneterBoxFontSize}; display: block;`;
}

FontAwesomeCSS();
Main();

document.addEventListener("click", async (event) => {
    if (event.target.classList.contains('CloseIcon')) {
        window.close();
    }
});

function CheckMagnet(url) {
    let Magnet;
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: "GET",
            url: url,
            responseType: 'document',
            headers: { referer: document.location.href, origin: document.location.href },
            onload: async function (resp) {
                if (resp.status == 200) {
                    Magnet = resp.response.querySelector('a[href^="magnet:"]');
                    if (Magnet) {
                        resolve([resp.status, Magnet.href]);
                    }
                }
                else {
                    resolve([resp.status]);
                }
            },
            onerror: function (error) {
                if (error.status == 0) {
                    resolve([error.status]);
                }
                else {
                    reject(['404']);
                }
            }
        });
    });
}

function removeUriWithParam(baseUrl, key) {
    try {
        const Url = new URL(baseUrl);
        const urlParams = new URLSearchParams(Url.search);
        urlParams.delete(key);
        Url.search = urlParams.toString();
        return Url.toString();
    } catch (err) {
        console.log(err);
    }
};

function updateMagnetParams(magnet, params) {
    const [protocol, queryString] = magnet.split('?');
    const searchParams = new URLSearchParams(queryString || "");

    for (const [key, value] of Object.entries(params)) {
        if (key === 'tr') {
            if (Array.isArray(value)) {
                searchParams.delete('tr');
                value.forEach(v => searchParams.append('tr', v));
            } else {
                searchParams.set('tr', value);
            }
        } else {
            searchParams.set(key, value);
        }
    }
    return `${protocol}?${decodeURIComponent(searchParams.toString())}`;
}

function FilenameConvert(text) {
    var result = text.replace(ExcludeChar, function (elem) {
        return String.fromCharCode(parseInt(elem.charCodeAt(0)) + 65248);
    });
    return result;
}

function mbConvertKana(text, option) {
    var katahan, kanazen, hirazen, mojilength, i, re;
    katahan = ["ｶﾞ", "ｷﾞ", "ｸﾞ", "ｹﾞ", "ｺﾞ", "ｻﾞ", "ｼﾞ", "ｽﾞ", "ｾﾞ", "ｿﾞ", "ﾀﾞ", "ﾁﾞ", "ﾂﾞ", "ﾃﾞ", "ﾄﾞ", "ﾊﾞ", "ﾊﾟ", "ﾋﾞ", "ﾋﾟ", "ﾌﾞ", "ﾌﾟ", "ﾍﾞ", "ﾍﾟ", "ﾎﾞ", "ﾎﾟ", "ｳﾞ", "ｰ", "ｧ", "ｱ", "ｨ", "ｲ", "ｩ", "ｳ", "ｪ", "ｴ", "ｫ", "ｵ", "ｶ", "ｷ", "ｸ", "ｹ", "ｺ", "ｻ", "ｼ", "ｽ", "ｾ", "ｿ", "ﾀ", "ﾁ", "ｯ", "ﾂ", "ﾃ", "ﾄ", "ﾅ", "ﾆ", "ﾇ", "ﾈ", "ﾉ", "ﾊ", "ﾋ", "ﾌ", "ﾍ", "ﾎ", "ﾏ", "ﾐ", "ﾑ", "ﾒ", "ﾓ", "ｬ", "ﾔ", "ｭ", "ﾕ", "ｮ", "ﾖ", "ﾗ", "ﾘ", "ﾙ", "ﾚ", "ﾛ", "ﾜ", "ｦ", "ﾝ", "ｶ", "ｹ", "ﾜ", "ｲ", "ｴ", "ﾞ", "ﾟ"];
    kanazen = ["ガ", "ギ", "グ", "ゲ", "ゴ", "ザ", "ジ", "ズ", "ゼ", "ゾ", "ダ", "ヂ", "ヅ", "デ", "ド", "バ", "パ", "ビ", "ピ", "ブ", "プ", "ベ", "ペ", "ボ", "ポ", "ヴ", "ー", "ァ", "ア", "ィ", "イ", "ゥ", "ウ", "ェ", "エ", "ォ", "オ", "カ", "キ", "ク", "ケ", "コ", "サ", "シ", "ス", "セ", "ソ", "タ", "チ", "ッ", "ツ", "テ", "ト", "ナ", "ニ", "ヌ", "ネ", "ノ", "ハ", "ヒ", "フ", "ヘ", "ホ", "マ", "ミ", "ム", "메", "모", "ャ", "ヤ", "ュ", "ユ", "ョ", "ヨ", "ラ", "リ", "ル", "레", "로", "ワ", "ヲ", "ン", "ヵ", "ヶ", "ヮ", "ヰ", "ヱ", "゛", "゜"];
    hirazen = ["が", "ぎ", "ぐ", "げ", "ご", "ざ", "じ", "ず", "ぜ", "ぞ", "だ", "ぢ", "づ", "で", "ど", "ば", "ぱ", "び", "ぴ", "ぶ", "ぷ", "べ", "ぺ", "ぼ", "ぽ", "ヴ", "ー", "ぁ", "あ", "ぃ", "い", "ぅ", "う", "ぇ", "え", "ぉ", "お", "か", "き", "く", "け", "こ", "さ", "し", "す", "せ", "そ", "た", "ち", "っ", "つ", "て", "と", "な", "に", "ぬ", "ね", "の", "は", "ひ", "ふ", "へ", "ほ", "ま", "み", "む", "め", "も", "ゃ", "や", "ゅ", "ゆ", "ょ", "よ", "ら", "り", "る", "れ", "ろ", "わ", "を", "ん", "か", "け", "ゎ", "ゐ", "ゑ", "゛", "゜"];
    mojilength = katahan.length;
    if (option.match(/[ra]/)) {
        text = text.replace(/[Ａ-ｚ]/g, function (elem) {
            return String.fromCharCode(parseInt(elem.charCodeAt(0)) - 65248);
        });
    }
    if (option.match(/[RA]/)) {
        text = text.replace(/[A-z]/g, function (elem) {
            return String.fromCharCode(parseInt(elem.charCodeAt(0)) + 65248);
        });
    }
    if (option.match(/[na]/)) {
        text = text.replace(/[０-９]/g, function (elem) {
            return String.fromCharCode(parseInt(elem.charCodeAt(0)) - 65248);
        });
    }
    if (option.match(/[NA]/)) {
        text = text.replace(/[0-9]/g, function (elem) {
            return String.fromCharCode(parseInt(elem.charCodeAt(0)) + 65248);
        });
    }
    if (option.match(/s/)) {
        text = text.replace(/ /g, " ");
    }
    if (option.match(/S/)) {
        text = text.replace(/ /g, " ");
    }
    if (option.match(/k/)) {
        for (i = 0; i < mojilength; i++) {
            re = new RegExp(kanazen[i], "g");
            text = text.replace(re, katahan[i]);
        }
    }
    if (option.match(/K/)) {
        if (!option.match(/V/)) {
            text = text.replace(/ﾞ/g, "゛");
            text = text.replace(/ﾟ/g, "゜");
        }
        for (i = 0; i < mojilength; i++) {
            re = new RegExp(katahan[i], "g");
            text = text.replace(re, kanazen[i]);
        }
    }
    if (option.match(/h/)) {
        for (i = 0; i < mojilength; i++) {
            re = new RegExp(hirazen[i], "g");
            text = text.replace(re, katahan[i]);
        }
    }
    if (option.match(/H/)) {
        if (!option.match(/V/)) {
            text = text.replace(/ﾞ/g, "゛");
            text = text.replace(/ﾟ/g, "゜");
        }
        for (i = 0; i < mojilength; i++) {
            re = new RegExp(katahan[i], "g");
            text = text.replace(re, hirazen[i]);
        }
    }
    if (option.match(/c/)) {
        for (i = 0; i < mojilength; i++) {
            re = new RegExp(kanazen[i], "g");
            text = text.replace(re, hirazen[i]);
        }
    }
    if (option.match(/C/)) {
        for (i = 0; i < mojilength; i++) {
            re = new RegExp(hirazen[i], "g");
            text = text.replace(re, kanazen[i]);
        }
    }
    return text;
}

function getNextSibling(elem, selector) {
    var sibling = elem.nextElementSibling;
    if (!selector) return sibling;
    while (sibling) {
        if (sibling.matches(selector)) return sibling;
        sibling = sibling.nextElementSibling;
    }
};

function getPreviousSibling(elem, selector) {
    var sibling = elem.previousElementSibling;
    if (!selector) return sibling;
    while (sibling) {
        if (sibling.matches(selector)) return sibling;
        sibling = sibling.previousElementSibling;
    }
};