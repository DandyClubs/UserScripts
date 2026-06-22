// ==UserScript==
// @name         Universal Image Previewer (CORS Bypass)
// @grant        GM_xmlhttpRequest
// @connect      *
// @match        https://sukebei.nyaa.si/view/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=nyaa.si
// @grant		 GM_addStyle
// ==/UserScript==
(function () {
    'use strict';

    GM_addStyle(`
.image-masonry {
    display: flex;
    align-items: flex-start;
    box-sizing: border-box;
    flex-wrap: wrap;
    gap: 5px;
}

.image-masonry > a,
.image-masonry > img {
    width: auto;
    max-width: calc(40% - 10px) !important;
    height: auto;
    display: block;
    border-radius: 5px;
}

.image-masonry img {
   border-radius: 5px;
}

#img-zoom-container {
    position: fixed;
    top: 0; left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.85);
    z-index: 10000;
    display: none; /* 기본 숨김 */
    overflow-y: auto; /* 세로 스크롤 허용 */
    cursor: zoom-out;
    text-align: center; /* 이미지 중앙 정렬 */
    padding: 20px 0;
}

/* 확대된 이미지 스타일 */
#img-zoom-container img {
    display: inline-block;
    vertical-align: middle;
    max-width: 95%; /* 가로 너비는 화면에 맞춤 */
    height: auto !important; /* 세로는 원본 비율 유지 (스크롤 생김) */
    box-shadow: 0 0 30px rgba(0,0,0,0.5);
    border-radius: 5px;
    cursor: zoom-out;
}

/* 배경 뒤쪽 본문 스크롤 방지용 클래스 */
body.modal-open {
    overflow: hidden;
}


/* CSS 부분 */
.pending-deep-preview {
    display: block !important;
    width: 100%;
    min-height: 200px;
    background: #f0f0f0 url('https://i.gifer.com/ZKZg.gif') no-repeat center !important;
    background-size: 50px 50px !important;
}

`);


    // ... SITE_CONFIGS 및 기타 변수는 동일 ...
    const SITE_CONFIGS = [
        {
            id: 'imagetwist',
            domains: ['imagetwist.com', 'picturelol.com', 'picshick.com', 'imageshimage.com'],
            pathPattern: /^https:\/\/imagetwist\.com/i,
            imageSourceRegExp: /src="([^"]+?\.imagetwist\.com\/i\/[^"]+)"/i,
            getReferer: (url) => url,
            directLoad: false // Blob 없이 src에 직접 대입하기 위한 커스텀 플래그
        },
        {
            id: 'xxxwebdlxxx',
            domains: ['xxxwebdlxxx.top', 'xxxwebdlxxx.org'],
            pathPattern: /^https:\/\/xxxwebdlxxx\.(top|org)\/.*\.html/i,
            imageSourceRegExp: /img class='centred_resized' src='([^"]+?)'/i,
            getReferer: (url) => url,
            directLoad: true // Blob 없이 src에 직접 대입하기 위한 커스텀 플래그
        },
        {
            id: 'pixhost',
            domains: ['pixhost.to'],
            pathPattern: /\/upload\/(?!ib\/)/i,
            imageSourceRegExp: /img id="image" src="([^"]+)"/i,
            getReferer: (url) => url,
            directLoad: true // Blob 없이 src에 직접 대입하기 위한 커스텀 플래그
        },
        {
            id: 'imagevenue',
            domains: ['imagevenue.com'],
            pathPattern: /\/upload\/(?!ib\/)/i,
            imageSourceRegExp: /<img src="([^"]+)" class="img-fluid"/i,
            getReferer: (url) => url,
            directLoad: true // Blob 없이 src에 직접 대입하기 위한 커스텀 플래그
        },
        {
            id: 'cosplay18',
            domains: ['cosplay18.pics', 'pig69.com'],
            pathPattern: /\/upload\/(?!ib\/)/i,
            transform: (url) => {
                if (url.includes('/upload/') && !url.includes('/upload/ib/')) {
                    return url.replace('/upload/', '/upload/ib/');
                }
                return url; // 이미 ib/가 있거나 형식이 다르면 그대로 반환
            },
            directLoad: true // Blob 없이 src에 직접 대입하기 위한 커스텀 플래그
        },
        {
            id: 'papakatsu',
            domains: ['papakatsu.co'],
            pathPattern: /papakatsu\.co\/upload\/image/i,
            imageSourceRegExp: /<img src="([^"]+?\.papakatsu\.co\/upload\/uploads\/[^"]+)"/i,
            getReferer: (url) => url,
            directLoad: true // Blob 없이 src에 직접 대입하기 위한 커스텀 플래그
        },
        {
            id: 'krav',
            domains: ['kr-av.com', 'xxpics.org'],
            pathPattern: /\/upload/i,
            imageSourceRegExp: /<img src="([^"]+?\/upload\/Application[^"]+)"/i,
            getReferer: (url) => url,
            directLoad: true // Blob 없이 src에 직접 대입하기 위한 커스텀 플래그
        },
        {
            id: 'anime-jav',
            domains: ['anime-jav.com', 'javbee.vip', 'chinese-pics.com', 'kin8-jav.com', 'porn-pig.com', 'hentaicovid.org', 's-porn.com', '3minx.com', 'gofile.download'],
            pathPattern: /\/upload\/(?!Application\/)/i,
            // HTML 내부에서 주소를 캐낼 경우 (Blob 미사용 설정)
            imageSourceRegExp: /class="fileviewer-file"[\s\S]*?<img src="([^"]+)"/i,
            directLoad: true // Blob 없이 src에 직접 대입하기 위한 커스텀 플래그
        },
        {
            id: 'imagehaha',
            domains: ['imagehaha.com'],
            // /8xkrqn72zq5m/ 처럼 12자리 내외의 영문/숫자 경로가 포함된 경우
            pathPattern: /\/[a-z0-9]{8,15}\//i,
            // class="pic img img-responsive"를 가진 img 태그의 src를 추출
            imageSourceRegExp: /<img[^>]+src="([^"]+)"[^>]+class="pic img img-responsive"/i,
            directLoad: true, // 이 사이트는 이미지 주소 직접 대입으로 작동할 가능성이 높습니다.
            getReferer: (url) => url
        },
    ];

    const skipTags = new Set(['script', 'style', 'textarea', 'code', 'pre']);
    const urlRegex = /https?:\/\/[^\s<>"'\[\]()]+(?:\([^\s<>"'\[\]()]+\)|[^\s<>"'\[\]().,?!:;\"'\]\)])/gi;
    const imageRegex = /\.(jpg|jpeg|png|gif|webp|bmp)(?:\?.*)?$/i;
    const getConfig = (url) => {
        return SITE_CONFIGS.find(cfg => {
            const domainMatch = cfg.domains.some(d => url.includes(d));
            // 패턴이 없으면 도메인만 체크, 패턴이 있으면 패턴까지 체크
            const pathMatch = cfg.pathPattern ? cfg.pathPattern.test(url) : true;
            return domainMatch && pathMatch;
        });
    };

    async function loadDeepPreview(pageUrl, imgElement) {
        const config = getConfig(pageUrl);
        if (!config) return;

        GM_xmlhttpRequest({
            method: "GET",
            url: pageUrl,
            onload: function (res) {

                const match = res.responseText.match(config.imageSourceRegExp);
                if (match && match[1]) {
                    const finalUrl = match[1];

                    // ✅ 이미지가 실제로 로드되었을 때 실행될 로직을 미리 정의
                    imgElement.onload = () => {
                        imgElement.classList.remove('pending-deep-preview');
                        imgElement.style.minHeight = "auto";
                        imgElement.style.background = "none";
                        imgElement.style.opacity = "1";
                    };

                    if (config.directLoad) {
                        // ✅ anime-jav 처럼 직접 로드하는 경우
                        imgElement.src = finalUrl;
                    } else {
                        // ✅ Blob으로 우회해서 로드하는 경우
                        GM_xmlhttpRequest({
                            method: "GET",
                            url: finalUrl,
                            responseType: "blob",
                            headers: { "Referer": config.getReferer ? config.getReferer(pageUrl) : "" },
                            onload: function (imgRes) {
                                if (imgRes.status === 200) {
                                    imgElement.src = URL.createObjectURL(imgRes.response);
                                }
                            }
                        });
                    }
                } else {
                    // 매칭 실패 시 로딩 표시 제거 및 에러 처리
                    imgElement.classList.remove('pending-deep-preview');
                    imgElement.alt = "Image not found";
                }
            }
        });
    }

    function createImgTag(url) {
        const config = getConfig(url);
        console.log(url);

        if (config) {
            // 1. 단순 URL 치환(Transform)이 가능한 경우 (예: cosplay18)
            if (typeof config.transform === 'function') {
                const transformedUrl = config.transform(url);
                // 만약 변환 결과가 원본과 다르다면 변환된 이미지 태그 반환
                if (transformedUrl !== url) {
                    return `<img src="${transformedUrl}">`;
                }
            }

            // 2. HTML 파싱(Deep Preview)이 필요한 경우 (예: anime-jav, imagetwist)
            if (config.imageSourceRegExp) {
                // 투명 픽셀을 넣는 이유는 '엑박(깨진 이미지)' 아이콘을 방지하기 위함입니다.
                return `<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
                 class="pending-deep-preview"
                 data-url="${url}">`;
            }
        }

        // 3. 일반 이미지 확장자 링크인 경우
        if (imageRegex.test(url)) {
            return `<img src="${url}">`;
        }

        return null;
    }

    function createFullLinkHTML(url) {
        const imgTag = createImgTag(url);
        if (imgTag) {
            // 처리 완료 표시를 위해 'processed-link' 클래스 추가            
            return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="processed-link">${imgTag}</a>`;
        }
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="processed-link">${url}</a>`;
    }

    function processNodes(root = document.body) {
        // 이미 처리된 부모 내부라면 중단
        if (root.classList && root.classList.contains('processed-link')) return;

        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, null, false);
        let currentNode;
        const nodesToProcess = [];

        while (currentNode = walker.nextNode()) {
            const tagName = currentNode.nodeType === 1 ? currentNode.tagName.toLowerCase() : "";

            // 중복 처리 방지: 이미 'processed-link' 클래스가 있다면 건너뜀
            if (currentNode.nodeType === 1 && currentNode.classList.contains('processed-link')) continue;

            if (currentNode.nodeType === 1 && tagName === 'a') {
                if (skipTags.has(currentNode.parentNode?.tagName.toLowerCase())) continue;
                if (currentNode.querySelectorAll('img').length === 0) {
                    if (imageRegex.test(currentNode.href) || getConfig(currentNode.href)) {
                        nodesToProcess.push({ type: 'existing-link', node: currentNode });
                    }
                }
            }
            else if (currentNode.nodeType === 3 && !skipTags.has(currentNode.parentNode?.tagName.toLowerCase())) {
                if (currentNode.parentNode?.tagName.toLowerCase() !== 'a' && urlRegex.test(currentNode.nodeValue)) {
                    nodesToProcess.push({ type: 'text', node: currentNode });
                }
            }
        }

        nodesToProcess.forEach(item => {
            const { type, node } = item;
            if (!node || !node.parentNode) return;
            console.log(type)

            try {
                if (type === 'existing-link') {
                    const imgHtml = createImgTag(node.href);
                    if (imgHtml) {
                        node.classList.add('processed-link'); // 마킹
                        node.innerHTML = imgHtml;
                    }
                } else if (type === 'text') {
                    const text = node.nodeValue;
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = text.replace(urlRegex, url => createFullLinkHTML(url));

                    const fragment = document.createDocumentFragment();
                    while (tempDiv.firstChild) {
                        fragment.appendChild(tempDiv.firstChild);
                    }
                    node.replaceWith(fragment);
                }
            } catch (err) { console.warn(err); }
        });

        root.querySelectorAll('.pending-deep-preview').forEach(img => {
            loadDeepPreview(img.dataset.url, img);
        });
    }

    function splitImageParagraphs() {
        const container = document.querySelector('#torrent-description');
        if (!container) return;

        const paragraphs = Array.from(container.querySelectorAll('p'));

        paragraphs.forEach(p => {
            // ✅ img만 찾는 것이 아니라, 이미지가 포함된 processed-link(a태그)를 찾습니다.
            const processedLinks = Array.from(p.querySelectorAll('a.processed-link')).filter(a => a.querySelector('img'));

            // 만약 링크 형태가 아닌 일반 img가 있다면 그것도 포함시킵니다.
            const soloImages = Array.from(p.querySelectorAll('img')).filter(img => !img.closest('a.processed-link'));

            const itemsToMove = [...processedLinks, ...soloImages];

            if (itemsToMove.length === 0) return;

            const masonry = document.createElement('div');
            masonry.className = 'image-masonry';

            itemsToMove.forEach(item => {
                masonry.appendChild(item); // ✅ a 태그(또는 solo img) 통째로 masonry로 이동
            });

            // 불필요한 줄바꿈 제거
            p.querySelectorAll('br').forEach(br => br.remove());

            // p 태그가 비었으면 교체, 내용이 있으면 뒤에 배치
            if (!p.textContent.trim()) {
                p.replaceWith(masonry);
            } else {
                p.after(masonry);
            }
        });
    }


    processNodes();
    splitImageParagraphs();

    // 1. 확대용 컨테이너 생성 (한 번만 실행)
    const zoomContainer = document.createElement('div');
    zoomContainer.id = 'img-zoom-container';
    document.body.appendChild(zoomContainer);

    const zoomImg = document.createElement('img');
    zoomContainer.appendChild(zoomImg);

    // 2. 닫기 로직 (배경이나 이미지 클릭 시)
    zoomContainer.onclick = () => {
        zoomContainer.style.display = 'none';
        document.body.classList.remove('modal-open');
        zoomImg.src = ''; // 메모리 해제 및 다음 로딩 대기
    };

    // 3. 클릭 이벤트 등록
    document.addEventListener('click', (e) => {
        const clickedImg = e.target.closest('.image-masonry img');
        if (!clickedImg) return;

        e.preventDefault();

        const originalUrl = clickedImg.src;

        // 모달에 이미지 넣고 표시
        zoomImg.src = originalUrl;
        zoomContainer.style.display = 'block';
        document.body.classList.add('modal-open');

        // 스크롤을 맨 위로 초기화
        zoomContainer.scrollTop = 0;
    });

    // ESC 키를 누르면 닫히는 기능 추가 (편의성)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const expandedImg = document.querySelector('img.expanded');
            if (expandedImg) {
                expandedImg.classList.remove('expanded');
                document.body.classList.remove('img-zoomed');
            }
        }
    });

    const observer = new MutationObserver((mutations) => {
        // 중복 처리를 방지하기 위해 고유한 부모 노드만 담을 Set 생성
        const parentsToProcess = new Set();

        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                // 1. 자기 자신이 이미 스크립트에 의해 처리된 링크라면 건너뜁니다.
                if (node.nodeType === 1 && node.classList.contains('processed-link')) {
                    continue;
                }

                // 2. 부모 노드가 올바른 Element 노드인지 확인합니다.
                const parent = node.parentNode;
                if (parent && parent.nodeType === 1) {
                    // 부모가 이미 처리된 링크 내부라면 건너뜁니다.
                    if (parent.classList.contains('processed-link')) {
                        continue;
                    }
                    // 처리할 부모 노드 목록에 추가 (Set이라서 자동 중복 제거됨)
                    parentsToProcess.add(parent);
                }
            }
        }

        // 수집된 고유 부모 노드가 있을 때만 실행
        if (parentsToProcess.size > 0) {
            parentsToProcess.forEach(parent => {
                processNodes(parent);
            });
            
            // 모든 노드 변환이 끝난 후, 레이아웃 정리는 딱 한 번만 수행 (성능 최적화)
            splitImageParagraphs();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    
    observer.observe(document.body, { childList: true, subtree: true });

})();