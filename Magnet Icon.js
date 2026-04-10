// ==UserScript==
// @name         Magnet Icon
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @include      https://www.t66y.com/htm_data/*.html
// @include      /t66y\.com\/htm_data\/.+\.html/
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
// @require      https://cdnjs.cloudflare.com/ajax/libs/viewerjs/1.11.6/viewer.min.js
// @resource     VIEWER_CSS https://cdnjs.cloudflare.com/ajax/libs/viewerjs/1.11.6/viewer.min.css
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
    top: 40%;
    margin: 0 auto;
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

const ExcludeChar = /[&<\/:>*?"|\\]/g;
const JapaneseChar = /[ぁ-んァ-ン一-龯]/;
const cyrillicPattern = /[а-яА-ЯЁё]/g;
const englishPattern = /[A-Za-z0-9]/;
const PageURL = window.location !== window.parent.location ? document.referrer : document.location.href;
let firstScrollPos = '';


let Title, MagnetLink, InfoArea, FindMagnetHash, GetData, FindMagnetHashCounts;

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


function extractMagnetAndTitles(data) {
    const matchesTitle = data.map((value, index) => ({ value, index })).filter(item => /【影片标题】：|【影片名称】：|影片名称：|【影片名称代号】 :/.test(item.value));
    const isMagnet = (e) => /rmdown.com\/link.php\?hash=\d{3}(.+)/.test(e);
    for (let i = 0; i < matchesTitle.length; i++) {
        let title = matchesTitle[i].value.replace(/【影片标题】：|【影片名称】：|影片名称：|【影片名称代号】 :/, '').replace(/^\s?\[MP4.*?\]/, '').replace(/\[[a-zA-Z0-9\.\/]+\]/, '').trim();
        if (title.match(ExcludeChar)) {
            //console.log(Title.match(ExcludeChar))
            title = FilenameConvert(title);
            title = mbConvertKana(title, 'rans');
        }
        let link;
        if (matchesTitle[i + 1]) {
            link = data.slice(matchesTitle[i].index + 1, matchesTitle[i + 1].index).find(isMagnet);
        } else {
            link = data.slice(matchesTitle[i].index + 1).find(isMagnet);
        }
        const selector = `a[href^="${link}"]`;
        const matchingElement = document.querySelector(selector);
        if (matchingElement) {
            const magnetLink = 'magnet:?xt=urn:btih:' + /hash=\d{3}(.+)/.exec(link)[1];
            const updates = {
                dn: title,               // 기존 dn이 "New_File_Name"으로 바뀜
            };
            matchingElement.setAttribute('href', updateMagnetParams(MagnetLink, updates));
        }
    }
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

function scrollToTitlePx(target, offset = 150) {
    if (!target) return;

    // 1. 요소의 절대 위치 (문서 최상단 기준)
    const rect = target.getBoundingClientRect();
    const absoluteElementTop = rect.top + window.pageYOffset;

    // 2. 우리가 도달하고 싶은 최종 스크롤 위치
    const finalPosition = absoluteElementTop - offset;

    // 3. 현재 문서에서 스크롤 가능한 최대 높이 계산
    // (전체 문서 높이 - 뷰포트 높이)
    const scrollHeight = document.documentElement.scrollHeight;
    const viewportHeight = window.innerHeight;
    const maxScrollY = scrollHeight - viewportHeight;

    // 4. 부족한 공간 계산
    // 목표 위치가 최대 스크롤 가능 범위를 넘어선다면?
    if (finalPosition > maxScrollY) {
        const shortfall = finalPosition - maxScrollY; // 부족한 픽셀 수

        let spacer = document.getElementById('scroll-spacer');
        if (!spacer) {
            spacer = document.createElement('div');
            spacer.id = 'scroll-spacer';
            spacer.style.pointerEvents = 'none'; // 클릭 방해 금지
            document.body.appendChild(spacer);
        }

        // 부족한 만큼 + 여유분(선택사항)을 높이로 설정
        spacer.style.height = `${shortfall + 10}px`;

        console.log(`[Scroll] 하단 공간 부족 (${shortfall}px). 스페이서 추가.`);
    }

    // 5. 스크롤 실행
    window.scrollTo({
        top: Math.max(0, finalPosition), // 0보다 작아지지 않게 방어
        behavior: 'auto'
    });
}

/* ============================================================
   1. 초기화 및 실행 제어 (비동기 및 Lazy Loading 대응)
   ============================================================ */
const containerSelector = '.tpc_content.do_not_catch';

async function init() {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const wrappers = createSectionMasonry(container);
    initImageGallery(wrappers);
    const loaders = new Map();

    for (const wrapper of wrappers) {
        wrapper.style.visibility = 'visible';       

        // 첨부파일 이미지 형태의 로더 생성
        wrapper.insertAdjacentHTML('beforebegin', `<div class="image-loader"><div class="progress-circle" style="--p: 0"></div></div>`);
        const loader = wrapper.previousElementSibling;
        loaders.set(wrapper, loader);
    }

    // --- 3개 병렬 처리 로직 시작 ---
    const concurrency = 3; // 동시 실행 개수
    const queue = [...wrappers]; // 복사본 생성

    let resolveFirst;
    const firstPromise = new Promise(res => resolveFirst = res);
    const firstWrapper = wrappers[0];

    // 개별 wrapper를 처리하는 핵심 로직을 별도 함수로 분리
    const processWrapper = async (wrapper) => {
        try {
            const currentLoader = loaders.get(wrapper);

            // 1. 이미지 프리로딩
            await smartImageLoader(wrapper, currentLoader);

            void wrapper.offsetWidth;
            // 2. 레이아웃 최적화 (scaleMap 및 minHeightMap 적용)
            const imgCount = wrapper.querySelectorAll('img').length;
            const columnCount = imgCount > 2 ? 3 : 2; 
            const maxHeight = imgCount > 2 ? 500 : 800;           
            optimizeSingleLayout(wrapper, columnCount, maxHeight);

            // 3. UI 정리
            if (currentLoader) currentLoader.remove();
            wrapper.classList.add('layout-done');
            wrapper.style.visibility = '';

            if (wrapper === firstWrapper) {
                resolveFirst();
            }

        } catch (err) {
            console.error("Layout error:", err);
        }
    };

    // 일꾼(Worker) 생성: 큐가 빌 때까지 계속해서 processWrapper를 실행
    const workers = Array(concurrency).fill(null).map(async () => {
        while (queue.length > 0) {
            const wrapper = queue.shift(); // 큐에서 맨 앞의 wrapper를 꺼냄
            if (wrapper) {
                await processWrapper(wrapper);
            }
        }
    });

    
    
    await firstPromise;
    scrollToTitlePx(firstScrollPos.element, 80);

    // 전체 완료는 따로
    await Promise.all(workers);
    

    console.log("모든 렌더링이 완료되었습니다.");
}


function initImageGallery(wrappers) {
    wrappers.forEach(wrapper => {
        // Viewer.js 인스턴스 생성
        const viewer = new Viewer(wrapper, {
            url: (img) => {
                // 원본 이미지가 data-src 등에 있다면 해당 주소를 리턴
                return img.getAttribute("ess-data") || img.getAttribute("data-src") || img.src;
            },
            title: true,       // 이미지 제목 표시
            toolbar: true,     // 하단 툴바 (확대, 축소, 회전 등)
            navbar: true,      // 하단 썸네일 리스트 (요청하신 미리보기 목록)
            tooltip: true,     // 확대 비율 표시
            movable: true,     // 이미지 이동 가능
            zoomable: true,    // 확대 가능
            transition: true,  // 부드러운 전환 효과
            fullscreen: true,  // 전체화면 지원
            keyboard: true,    // 키보드 화살표 지원

            // 화면보다 큰 경우 자동으로 화면에 맞춤 (기본값)
            viewed() {

            }
        });

        // Masonry 아이템 내의 이미지 클릭 시 이벤트 전파를 통해 Viewer 실행
        wrapper.querySelectorAll('img').forEach(img => {
            img.style.cursor = 'pointer';
            img.addEventListener('click', (e) => {
                // Viewer.js가 내부적으로 클릭을 감지하지만,
                // 명시적으로 실행하고 싶을 때 사용
            });
        });
    });
}

/* =========================
       4. START
    ========================== */


/* ===============================
   1️⃣ DOM 정리 (수정된 부분)
=============================== */

function handleCleaning(container) {

    // 1️⃣ 빈 span 제거 + processed 부여 (필터링 추가)
    container.querySelectorAll('span:not(.processed)').forEach(span => {

        // 🔥 제외 조건 --------------------------

        // title-row 직접 포함한 span 제외
        const hasDirectTitle =
            [...span.children].some(el =>
                el.classList.contains('title-row')
            );
        if (hasDirectTitle) return;

        // inline-block 스타일 span 제외
        if (span.style.display === 'inline-block') return;

        // textblock 바로 아래 span만 처리 (선택적 안정장치)
        if (!span.closest('.textblock')) return;

        // ---------------------------------------

        const text = span.textContent
            .replace(/\u00a0/g, ' ')
            .trim();

        if (!text) {
            span.remove();
        } else {
            span.classList.add('processed');
        }
    });

    // 2️⃣ URL 자동 링크 변환
    linkifyNodes(container);

    // 3️⃣ 텍스트 그룹화
    //groupBareText(container);
}

function linkifyNodes(root) {
    // TreeWalker를 사용하여 실제 텍스트 노드만 골라냅니다.
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    const nodes = [];

    while (walker.nextNode()) {
        const node = walker.currentNode;
        // 이미 <a> 태그 안에 있는 텍스트는 건너뜁니다.
        if (node.parentNode.tagName === 'A' || node.parentNode.closest('a')) {
            if (node.textContent.startsWith('[url]http')) {
                nodes.push(node);
            } else {
                continue;
            }
        }
        nodes.push(node);
    }

    // URL 정규식 (http/https로 시작하는 문자열)
    const urlRegex = /(https?:\/\/[^\s()<>]+\b)/gi;

    nodes.forEach(node => {
        const text = node.textContent.replace(/\[\/?url\]/gi, '');
        const parentA = node.parentNode?.closest('a');
        if (parentA) {
            /**
             * CASE 1: 기존 <a> 태그 내부에 URL 텍스트가 중첩된 경우
             * 기존 <a>의 텍스트를 청소하고, 새 <a>를 형제로 삽입합니다.
             */
            const matches = text.match(urlRegex);
            if (matches) {
                matches.forEach(url => {
                    // (1) 기존 노드에서 [url], [/url] 및 해당 URL 주소 텍스트 제거
                    node.textContent = node.textContent
                        .replace(/\[\/?url\]/gi, '')
                        .replace(url, '')
                        .trim();

                    // (2) 새로운 <a> 태그 생성
                    const newA = document.createElement('a');
                    newA.href = url;
                    newA.textContent = url;
                    newA.target = "_blank";
                    newA.rel = "noopener noreferrer";

                    // (3) 기존 <a> 태그의 바로 뒤에 삽입 (이웃 노드화)
                    parentA.parentNode.insertBefore(newA, parentA.nextSibling);
                });
            }
        } else {
            if (urlRegex.test(text)) {
                const fragment = document.createDocumentFragment();
                let lastIndex = 0;

                // 정규식을 초기화하고 매칭되는 모든 URL 처리
                urlRegex.lastIndex = 0;
                let match;
                while ((match = urlRegex.exec(text)) !== null) {
                    // URL 이전의 일반 텍스트 추가
                    if (match.index > lastIndex) {
                        fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
                    }

                    // <a> 태그 생성 및 추가
                    const url = match[0];
                    const a = document.createElement('a');
                    a.href = url;
                    a.textContent = url;
                    a.target = "_blank"; // 새창 열기
                    a.rel = "noopener noreferrer";
                    fragment.appendChild(a);

                    lastIndex = urlRegex.lastIndex;
                }

                // 남은 뒷부분 텍스트 추가
                if (lastIndex < text.length) {
                    fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
                }
                node.parentNode.replaceChild(fragment, node);
            }
        }
    });
}

function unwrapBoldText(container) {

    const bold = container.querySelector(':scope > b');
    if (!bold) return;

    const wrapper = document.createElement('div');


    // b 안의 모든 노드를 wrapper로 이동
    while (bold.firstChild) {
        wrapper.appendChild(bold.firstChild);
    }

    // b를 wrapper로 교체
    bold.replaceWith(wrapper);
}

function groupBareText(container) {

    unwrapBoldText(container);

    const nodes = Array.from(container.childNodes);
    let group = [];

    nodes.forEach((node, i) => {

        const isImage = node.nodeName === 'IMG';
        const isBlock = node.nodeType === 1 && node.classList.contains('textblock');
        const isLike = node.nodeType === 1 && node.classList.contains('t_like');

        if (!isImage && !isBlock && !isLike) {
            group.push(node);
        } else {
            commit(group);
            group = [];
        }

        if (i === nodes.length - 1) commit(group);
    });
}

function commit(group) {

    if (!group.length) return;

    const hasContent = group.some(node =>
        (node.nodeType === 3 && node.textContent.trim()) ||
        node.nodeName === 'A'
    );

    if (!hasContent) {
        group.forEach(n => n.nodeName === 'BR' && n.remove());
        return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'textblock';

    group[0].parentNode.insertBefore(wrapper, group[0]);
    group.forEach(n => wrapper.appendChild(n));
}

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
        /* ===============================
       1️⃣ DOM 정리
    =============================== */
        /*
        const observer = new MutationObserver(() => {
            handleCleaning(container);
        });

        observer.observe(container, {
            childList: true,
            subtree: true
        });

        handleCleaning(container);
        */

        // 실행
        init();
        linkifyNodes(container);

        const titlePrefixRegex = /【影片标题】|【影片名称】|影片名称|【影片名称代호】|【影片名稱】|【檔案名稱】|【新片】|【资源名称】/;
        const skipKeywords = ["最强優片", "最強國產專輯"];

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

                // 1. 접두사를 먼저 검사하여 타겟 노드인지 확인
                if (!titlePrefixRegex.test(raw)) continue;

                // 2. 접두사 제거 및 1차 정제
                let cleanTitle = raw.replace(titlePrefixRegex, '').trim().replace(/^(:|：)/, '').trim();

                // [핵심 수정] cleanTitle이 비어 있거나, 제외 키워드가 포함된 경우
                const isTargetEmpty = cleanTitle.length === 0;
                const containsSkip = skipKeywords.some(keyword => cleanTitle.includes(keyword));

                if (isTargetEmpty || containsSkip) {
                    // 다음 유효한 텍스트 노드로 이동 (실제 제목 추출)
                    if (walker.nextNode()) {
                        currentNode = walker.currentNode;
                        raw = currentNode.textContent;

                        // 다음 행의 텍스트를 제목으로 채택 (앞뒤 공백만 제거)
                        cleanTitle = raw.trim();
                    }
                }

                // 3. 최종 정제 (숫자 접두어, MP4 태그 등 제거)
                // 위에서 새로 가져온 제목에도 동일하게 적용됩니다.
                cleanTitle = cleanTitle
                    .replace(/^(\d{3,4}[_-]|(?<!\d)\d{1,2}(?!\d))/, '')
                    .replace(/^\s?\[MP4.*?\]/, '')
                    .replace(/\[[a-zA-Z0-9\.\/]+\]/, '')
                    .trim();

                // 최종 결과가 여전히 비어있지 않은 경우에만 배열에 추가
                if (cleanTitle) {
                    titles.push({
                        textNode: currentNode,
                        rawText: raw,
                        title: cleanTitle
                    });
                }
            }

            return titles;
        }

        /* ==========================================
       2️⃣ rmdown 링크 추출
    ========================================== */

        function extractRmdownLinks(root) {
            return [
                ...root.querySelectorAll(
                    'a[href*="rmdown.com/link.php?hash="]'
                )
            ];
        }

        /* ==========================================
       3️⃣ Magnet 매칭 (Title ↔ rmdown 순서 기반)
    ========================================== */

        function buildMagnetPairs(root) {

            const titles = extractTitles(root);
            const rmdownLinks = extractRmdownLinks(root);

            const count = Math.min(titles.length, rmdownLinks.length);
            const result = [];

            for (let i = 0; i < count; i++) {

                const link = rmdownLinks[i];

                const match = link.href.match(
                    /hash=\d{3}([a-f0-9]{40})/i
                );

                if (!match) continue;

                const hash = match[1].toLowerCase();

                const magnet =
                    `magnet:?xt=urn:btih:${hash}&dn=${encodeURIComponent(titles[i].title)}`;

                // rmdown → magnet 교체
                if (!link.href.startsWith('magnet:?')) {
                    link.href = magnet;
                }

                result.push({
                    textNode: titles[i].textNode,
                    rawText: titles[i].rawText,
                    title: titles[i].title,
                    magnet
                });
            }
            return result;
        }

        const titles = buildMagnetPairs(container);

        if (!titles.length) return;
        firstScrollPos = titles[0];

        const total = titles.length;

        /* ===============================
       4️⃣ UI 삽입
    =============================== */

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

            //console.log(item,span);
            span.insertAdjacentHTML('beforeend', `
            <i class="title-ui"
                  data-index="${index}"
                  style="position:absolute;
                         left:85%;
                         top: 17.6px; /* line-height(35.2px)의 딱 절반 위치 */
                         transform: translateY(-50%); /* 자기 자신의 높이 절반만큼 보정 */
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

        /* ===============================
       5️⃣ 이벤트 처리
    =============================== */

        document.addEventListener('click', e => {

            const ui = e.target.closest('.title-ui');
            if (!ui) return;

            const index = Number(ui.dataset.index);
            const current = titles[index];

            if (e.target.classList.contains('copy-icon')) {
                //ui.querySelector('.magnet-link').click();
                ui.querySelector('.magnet-link').style.setProperty('color', 'Orange', 'important');
                window.location.href = current.magnet;
                navigator.clipboard.writeText(current.title)
                    .catch(() => { });
                e.target.style.setProperty('color', 'Orange', 'important');

            }

            else if (e.target.classList.contains('close-icon')) {
                window.close();
            }
            else if (e.target.classList.contains('prev-icon')) {
                const prev = titles[(index - 1 + titles.length) % titles.length];
                scrollToTitlePx(prev.element, 80);
            }
            else if (e.target.classList.contains('next-icon')) {
                const next = titles[(index + 1) % titles.length];
                scrollToTitlePx(next.element, 80);
            }


        });
        return;
    }


    else if (/sehuatang\.net/.test(PageURL) && document.querySelector('div#postlist div tbody tr td.plc div.pct div.pcb div.t_fsz table tbody tr td')) {
        InfoArea = document.querySelector('div#postlist div tbody tr td.plc div.pct div.pcb div.t_fsz table tbody tr td').innerText.replace(/(?:(?:\r\n|\r|\n)\s*){2}/gm, '\n').replace(/\t/g, '').trim().split(/\n/);
        InfoArea = InfoArea.filter(function (e) { return e; });//빈 배열값 제거
        Title = InfoArea.find(element => element.match(/(【影片名称】：|影片名称：)(.*)/));
        Title = Title ? Title.replace(/(【影片名称】：|影片名称：)/, '').replace(/^\s?\[MP4.*?\]/, '').replace(/\[[a-zA-Z0-9\.\/]+\]/, '').trim() : '';
        console.log(InfoArea);
        MagnetLink = InfoArea.find(element => /magnet:\?xt=urn:btih:[0-9a-zA-Z]+/.test(element));
        if (MagnetLink) {
            MagnetLink = /magnet:\?xt=urn:btih:[0-9a-zA-Z]+/.exec(MagnetLink)[0];
        }
        console.log(Title, MagnetLink);



        Array.from(document.querySelectorAll('IMG')).forEach(el => {
            if (el.getAttribute('onmouseover')) {
                el.removeAttribute('onmouseover');
            }
        });

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


        //console.log(MagnetLink)
        if (!/^magnet/.test(MagnetLink)) { return; }
        InfoArea = document.querySelector('article.message-body div.bbWrapper').innerText.replace(/(?:(?:\r\n|\r|\n)\s*){2}/gm, '\n').replace(/\t/g, '').trim().split(/\n/);
        InfoArea = InfoArea.filter(function (e) { return e; });//빈 배열값 제거
        Title = InfoArea.find(element => element.match(/(【影片名称】：|影片名称：|\[影片名称\]：|【檔案名稱】:)(.*)(.*)/));
        Title = Title ? Title.replace(/(【影片名称】：|影片名称：|\[影片名称\]：|【檔案名稱】:)/, '').replace(/\[[a-zA-Z0-9\.\/]+\]/, '').trim() : '';
        let TopTitle = document.querySelector('div.p-title h1.p-title-value').innerText;
        Title = Title.includes(TopTitle) || !Title ? TopTitle : Title;
        //console.log(Title, MagnetLink)
    }

    else if (/trupornolabs\.org\/torrent\/\d+/.test(document.location)) {
        let link = document.querySelector('div#content div#download a[href^="magnet:"]');
        Title = getNextSibling(link, 'a[href^="/torrent/"]') ?? getNextSibling(link, 'a[href*="trupornolabs.org/download"]');
        Title = Title.innerText.replace('Скачать ', '').replace(/\.torrent$/, '');
        //console.log(document.querySelector('table#details'))
        if (document.querySelector('table#details')) {

            InfoArea = document.querySelector('table#details').innerText.replace(/(?:(?:\r\n|\r|\n)\s*){2}/gm, '\n').split(/\n/);
            console.log(InfoArea);
            let ID = InfoArea.find((el) => el.match(/Студийный\sкод\sфильма:/));
            if (ID) {
                let TmpTitle = InfoArea.find((el, i) => {
                    if (JapaneseChar.test(el) && i < 2) {
                        return el;
                    }
                });
                Title = TmpTitle || Title;
                console.log(Title);
                ID = ID.replace("Студийный код фильма:", '').trim();
                Title = ID + ' ' + Title;
            }
            if (link && Title) {
                if (englishPattern.test(Title)) {
                    let TmpTitle = Title.split('/');
                    Title = TmpTitle.filter(e => !cyrillicPattern.test(e)).join(' ');
                }
                MagnetLink = removeUriWithParam(link.href, 'dn');
                //console.log(MagnetLink)
            }
        }
    }

    if (Title) {
        if (Title.match(ExcludeChar)) {
            //console.log(Title.match(ExcludeChar))
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

    console.log({ MagnetLink });

    if (MagnetLink && Title) {
        const updates = {
            dn: Title,               // 기존 dn이 "New_File_Name"으로 바뀜
        };

        document.querySelector('.GetMagnetIcon').setAttribute('href', updateMagnetParams(MagnetLink, updates));
    }

    else if (MagnetLink) {
        document.querySelector('.GetMagnetIcon').setAttribute('href', MagnetLink);
    }

}

function MakeIcon() {
    document.querySelector("body").insertAdjacentHTML('beforeend', '<div class="CenterBox"></>');
    let CenterBox = document.querySelector('.CenterBox');
    if (MagnetLink) {
        CenterBox.insertAdjacentHTML('beforeend', '<a class="GetMagnetIcon fa-solid fa-magnet" style="color: dodgerblue !important;"></>');
        document.querySelector('.GetMagnetIcon').addEventListener("click", function (e) {
            document.querySelector('.GetMagnetIcon').style.setProperty('color', 'Orange', 'important');
        });
    }
    if (/t66y\.com/.test(PageURL)) {
        CenterBox.insertAdjacentHTML('beforeend', '<i class="CopyItemIcon fa-regular fa-clipboard"></>');
    }

    if (FindMagnetHashCounts.length > 1) {
        CenterBox.insertAdjacentHTML('beforeend', '<i class="fa-solid fa-plus"></i>');
    }
    CenterBox.insertAdjacentHTML('beforeend', '<i class="CloseIcon fa-solid fa-square-xmark" style ="color: red !important;"></>');

    var GetDPI = window.devicePixelRatio;
    var DefaultFontSize = getDefaultFontSize();
    var CneterBoxFontSize = Number(((1 / (GetDPI / 1.5)) * (16 / DefaultFontSize)).toFixed(2)) + 'rem';
    document.querySelector('.CenterBox').style.cssText = `font-size: ${CneterBoxFontSize}; display: block;`;
}

FontAwesomeCSS();
Main();

document.addEventListener("click", async (event) => {
    //console.log(event.target)

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
                //console.log(resp)
                if (resp.status == 200) {
                    Magnet = resp.response.querySelector('a[href^="magnet:"]');
                    if (Magnet) {
                        resolve([resp.status, Magnet.href]);
                    }
                }
                else {
                    console.log(resp);
                    resolve([resp.status]);
                    //reject(resp.response);
                }
            },
            onerror: function (error) {
                console.log(error, error.status, url);
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




function SendWebUI(url) {
    let data = new FormData();
    data.append(`urls`, url);
    //fetch("https://dandyclubs.chaos.usbx.me/qbittorrent/api/v2/torrents/add", {method: "POST", body: data})

    GM_xmlhttpRequest({
        method: 'POST',
        url: "http://dandyclubs.chaos.usbx.me/qbittorrent/api/v2/torrents/add",
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        },
        body: data,
        onload: function (resp) {
            console.log(resp);
            if (resp.status == 200) {

            }
            else {
                console.log(resp);
            }
        },
        onerror: function (error) {
            console.log(error, error.status, url);
        }
    });

}

function removeUriWithParam(baseUrl, key) {
    //console.log(baseUrl)
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
    // 1. 마그넷 링크 구조 분리 (프로토콜 부분과 데이터 부분)
    const [protocol, queryString] = magnet.split('?');

    // 2. URLSearchParams 객체 생성
    const searchParams = new URLSearchParams(queryString || "");

    // 3. 파라미터 순회하며 업데이트
    for (const [key, value] of Object.entries(params)) {
        if (key === 'tr') {
            // 트래커(tr)는 중복 허용이 일반적이므로,
            // 여기서는 기존 tr을 유지하면서 새 값을 추가하거나,
            // 필요 시 완전히 새로 정의할 수 있습니다.
            if (Array.isArray(value)) {
                // 기존 tr 제거 후 새로 추가 (덮어쓰기 모드)
                searchParams.delete('tr');
                value.forEach(v => searchParams.append('tr', v));
            } else {
                searchParams.set('tr', value);
            }
        } else {
            // 일반 파라미터 (dn, comment 등)는 덮어쓰기(set)
            searchParams.set(key, value);
        }
    }

    // 4. 최종 마그넷 링크 조합 및 디코딩 처리
    // URLSearchParams는 기본적으로 URL 인코딩을 수행하므로,
    // 마그넷 가독성을 위해 적절히 반환합니다.
    return `${protocol}?${decodeURIComponent(searchParams.toString())}`;
}


//파일명 사용불가 문자 전각문자로 변환
function FilenameConvert(text) {
    var result = text.replace(ExcludeChar, function (elem) {
        return String.fromCharCode(parseInt(elem.charCodeAt(0)) + 65248);
    });
    return result;
}


/**
 * 해당 함수는
 * php의 mb_convert_kana의 Javascript 버전이다.
 * 히라가나는 반각이 없음.
 */

function mbConvertKana(text, option) {
    var katahan, kanazen, hirazen, mojilength, i, re;
    katahan = ["ｶﾞ", "ｷﾞ", "ｸﾞ", "ｹﾞ", "ｺﾞ", "ｻﾞ", "ｼﾞ", "ｽﾞ", "ｾﾞ", "ｿﾞ", "ﾀﾞ", "ﾁﾞ", "ﾂﾞ", "ﾃﾞ", "ﾄﾞ", "ﾊﾞ", "ﾊﾟ", "ﾋﾞ", "ﾋﾟ", "ﾌﾞ", "ﾌﾟ", "ﾍﾞ", "ﾍﾟ", "ﾎﾞ", "ﾎﾟ", "ｳﾞ", "ｰ", "ｧ", "ｱ", "ｨ", "ｲ", "ｩ", "ｳ", "ｪ", "ｴ", "ｫ", "ｵ", "ｶ", "ｷ", "ｸ", "ｹ", "ｺ", "ｻ", "ｼ", "ｽ", "ｾ", "ｿ", "ﾀ", "ﾁ", "ｯ", "ﾂ", "ﾃ", "ﾄ", "ﾅ", "ﾆ", "ﾇ", "ﾈ", "ﾉ", "ﾊ", "ﾋ", "ﾌ", "ﾍ", "ﾎ", "ﾏ", "ﾐ", "ﾑ", "ﾒ", "ﾓ", "ｬ", "ﾔ", "ｭ", "ﾕ", "ｮ", "ﾖ", "ﾗ", "ﾘ", "ﾙ", "ﾚ", "ﾛ", "ﾜ", "ｦ", "ﾝ", "ｶ", "ｹ", "ﾜ", "ｲ", "ｴ", "ﾞ", "ﾟ"];
    kanazen = ["ガ", "ギ", "グ", "ゲ", "ゴ", "ザ", "ジ", "ズ", "ゼ", "ゾ", "ダ", "ヂ", "ヅ", "デ", "ド", "バ", "パ", "ビ", "ピ", "ブ", "プ", "ベ", "ペ", "ボ", "ポ", "ヴ", "ー", "ァ", "ア", "ィ", "イ", "ゥ", "ウ", "ェ", "エ", "ォ", "オ", "カ", "キ", "ク", "ケ", "コ", "サ", "シ", "ス", "セ", "ソ", "タ", "チ", "ッ", "ツ", "テ", "ト", "ナ", "ニ", "ヌ", "ネ", "ノ", "ハ", "ヒ", "フ", "ヘ", "ホ", "マ", "ミ", "ム", "メ", "モ", "ャ", "ヤ", "ュ", "ユ", "ョ", "ヨ", "ラ", "リ", "ル", "レ", "ロ", "ワ", "ヲ", "ン", "ヵ", "ヶ", "ヮ", "ヰ", "ヱ", "゛", "゜"];
    hirazen = ["が", "ぎ", "ぐ", "げ", "ご", "ざ", "じ", "ず", "ぜ", "ぞ", "だ", "ぢ", "づ", "で", "ど", "ば", "ぱ", "び", "ぴ", "ぶ", "ぷ", "べ", "ぺ", "ぼ", "ぽ", "ヴ", "ー", "ぁ", "あ", "ぃ", "い", "ぅ", "う", "ぇ", "え", "ぉ", "お", "か", "き", "く", "け", "こ", "さ", "し", "す", "せ", "そ", "た", "ち", "っ", "つ", "て", "と", "な", "に", "ぬ", "ね", "の", "は", "ひ", "ふ", "へ", "ほ", "ま", "み", "む", "め", "も", "ゃ", "や", "ゅ", "ゆ", "ょ", "よ", "ら", "り", "る", "れ", "ろ", "わ", "を", "ん", "か", "け", "ゎ", "ゐ", "ゑ", "゛", "゜"];
    mojilength = katahan.length;
    // r: 전각문자를 반각으로 변환
    // a: 전각영문자를 반각으로 변환
    if (option.match(/[ra]/)) {
        text = text.replace(/[Ａ-ｚ]/g, function (elem) {
            return String.fromCharCode(parseInt(elem.charCodeAt(0)) - 65248);
        });
    }
    // R: 반각문자를 전각으로 변환
    // A: 반각영문자를 전각으로 변환
    if (option.match(/[RA]/)) {
        text = text.replace(/[A-z]/g, function (elem) {
            return String.fromCharCode(parseInt(elem.charCodeAt(0)) + 65248);
        });
    }
    // n: 전각숫자를 반각으로 변환
    // a: 전각 영숫자를 반각으로 변환
    if (option.match(/[na]/)) {
        text = text.replace(/[０-９]/g, function (elem) {
            return String.fromCharCode(parseInt(elem.charCodeAt(0)) - 65248);
        });
    }
    // N: 반각숫자를 전각으로 변환
    // A: 반각영숫자를 전각으로 변환
    if (option.match(/[NA]/)) {
        text = text.replace(/[0-9]/g, function (elem) {
            return String.fromCharCode(parseInt(elem.charCodeAt(0)) + 65248);
        });
    }
    // s: 전각스페이스를 반각으로 변환
    if (option.match(/s/)) {
        text = text.replace(/　/g, " ");
    }
    // S: 반각스페이스를 전각으로 변환
    if (option.match(/S/)) {
        text = text.replace(/ /g, "　");
    }
    // k: 전각카타카나를 반각 카타카타로 변환
    if (option.match(/k/)) {
        for (i = 0; i < mojilength; i++) {
            re = new RegExp(kanazen[i], "g");
            text = text.replace(re, katahan[i]);
        }
    }
    // K: 반각카타카타를 전각카타카타로 변환
    // V: 탁점사용중인 문자를 글자로 변환
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
    // h: 전각히라가나를 반각카타카나로 변환
    if (option.match(/h/)) {
        for (i = 0; i < mojilength; i++) {
            re = new RegExp(hirazen[i], "g");
            text = text.replace(re, katahan[i]);
        }
    }
    // H: 반각카타카나를 전각히라가라로 변환
    // V: 탁점사용중인 문자를 글자로 변환
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
    // c: 전각카타카나를 전각히라가나로 변환
    if (option.match(/c/)) {
        for (i = 0; i < mojilength; i++) {
            re = new RegExp(kanazen[i], "g");
            text = text.replace(re, hirazen[i]);
        }
    }
    // C: 전각히라가나를 전각카타카나로 변환
    if (option.match(/C/)) {
        for (i = 0; i < mojilength; i++) {
            re = new RegExp(hirazen[i], "g");
            text = text.replace(re, kanazen[i]);
        }
    }
    return text;
}







function getNextSibling(elem, selector) {

    // Get the next sibling element
    var sibling = elem.nextElementSibling;

    // If there's no selector, return the first sibling
    if (!selector) return sibling;

    // If the sibling matches our selector, use it
    // If not, jump to the next sibling and continue the loop
    while (sibling) {
        if (sibling.matches(selector)) return sibling;
        sibling = sibling.nextElementSibling;
    }
};


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
