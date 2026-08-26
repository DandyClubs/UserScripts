// ==UserScript==
// @name         Universal Image Previewer (CORS Bypass)
// @grant        GM_xmlhttpRequest
// @connect      *
// @match        https://sukebei.nyaa.si/view/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=nyaa.si
// @grant        GM_addStyle
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
    display: none;
    overflow-y: auto;
    cursor: zoom-out;
    text-align: center;
    padding: 20px 0;
}

#img-zoom-container img {
    display: inline-block;
    vertical-align: middle;
    max-width: 95%;
    height: auto !important;
    box-shadow: 0 0 30px rgba(0,0,0,0.5);
    border-radius: 5px;
    cursor: zoom-out;
}

body.modal-open {
    overflow: hidden;
}

.pending-deep-preview {
    display: block !important;
    width: 100%;
    min-height: 200px;
    background: #f0f0f0 url('https://i.gifer.com/ZKZg.gif') no-repeat center !important;
    background-size: 50px 50px !important;
}
`);

    const SITE_CONFIGS = [
        {
            id: 'imagetwist',
            domains: ['imagetwist.com', 'picturelol.com', 'picshick.com', 'imageshimage.com'],
            pathPattern: /^https:\/\/imagetwist\.com/i,
            imageSourceRegExp: /src="([^"]+?\.imagetwist\.com\/i\/[^"]+)"/i,
            getReferer: (url) => url,
            directLoad: false
        },
        {
            id: 'xxxwebdlxxx',
            domains: ['xxxwebdlxxx.top', 'xxxwebdlxxx.org'],
            pathPattern: /^https:\/\/xxxwebdlxxx\.(top|org)\/.*\.html/i,
            imageSourceRegExp: /img class='centred_resized' src='([^"]+?)'/i,
            getReferer: (url) => url,
            directLoad: true
        },
        {
            id: 'pixhost',
            domains: ['pixhost.to'],
            pathPattern: /\/upload\/(?!ib\/)/i,
            imageSourceRegExp: /img id="image" src="([^"]+)"/i,
            getReferer: (url) => url,
            directLoad: true
        },
        {
            id: 'imagevenue',
            domains: ['imagevenue.com'],
            pathPattern: /\/upload\/(?!ib\/)/i,
            imageSourceRegExp: /<img src="([^"]+)" class="img-fluid"/i,
            getReferer: (url) => url,
            directLoad: true
        },
        {
            id: 'cosplay18',
            domains: ['cosplay18.pics', 'pig69.com'],
            pathPattern: /\/upload\/(?!ib\/)/i,
            transform: (url) => {
                if (url.includes('/upload/') && !url.includes('/upload/ib/')) {
                    return url.replace('/upload/', '/upload/ib/');
                }
                return url;
            },
            directLoad: true
        },
        {
            id: 'papakatsu',
            domains: ['papakatsu.co'],
            pathPattern: /papakatsu\.co\/upload\/image/i,
            imageSourceRegExp: /<img src="([^"]+?\.papakatsu\.co\/upload\/uploads\/[^"]+)"/i,
            getReferer: (url) => url,
            directLoad: true
        },
        {
            id: 'krav',
            domains: ['kr-av.com', 'xxpics.org'],
            pathPattern: /\/upload/i,
            imageSourceRegExp: /<img src="([^"]+?\/upload\/Application[^"]+)"/i,
            getReferer: (url) => url,
            directLoad: true
        },
        {
            id: 'anime-jav',
            domains: [
                'anime-jav.com', 'javbee.vip', 'chinese-pics.com', 'chinese-pics.vip',
                'kin8-jav.com', 'porn-pig.com', 'hentaicovid.org', 's-porn.com',
                '3minx.com', 'gofile.download', 'hentaicovid.vip', 'fc2ppv.stream', 'hentaicovid.com',
                'javtele.net', 'hentai4f.com', 'cnpics.org'
            ],
            pathPattern: /\/uploads?\/(?!Application\/)/i,
            imageSourceRegExp: /class="fileviewer-file"[\s\S]*?<img src="([^"]+)"/i,
            directLoad: true
        },
        {
            id: '4up',
            domains: ['4up.pics'],
            pathPattern: /4up\.pics\/.+\.jpg/i,
            imageSourceRegExp: /class="fileviewer-file"[\s\S]*?<img src="([^"]+)"/i,
            directLoad: true
        },
        {
            id: 'javball',
            domains: ['javball.com'],
            pathPattern: /\/upload\/(?!Application\/)/i,
            imageSourceRegExp: /class="fileviewer-file"[\s\S]*?<img src="([^"]+)"/i,
            directLoad: true
        },
        {
            id: 'imagehaha',
            domains: ['imagehaha.com'],
            pathPattern: /\/[a-z0-9]{8,15}\//i,
            imageSourceRegExp: /<img[^>]+src="([^"]+)"[^>]+class="pic img img-responsive"/i,
            directLoad: true,
            getReferer: (url) => url
        }
    ];

    // ==========================================
    // ⚡ 1. getConfig 빠른 조회를 위한 Domain Map 인덱싱 (O(1))
    // ==========================================
    const configDomainMap = new Map();
    SITE_CONFIGS.forEach(cfg => {
        cfg.domains.forEach(domain => {
            const lowerDomain = domain.toLowerCase();
            if (!configDomainMap.has(lowerDomain)) {
                configDomainMap.set(lowerDomain, []);
            }
            configDomainMap.get(lowerDomain).push(cfg);
        });
    });

    const getConfig = (url) => {
        try {
            const hostname = new URL(url).hostname.toLowerCase();
            
            // Map에서 해당 도메인을 정확히 매칭하거나, 서브도메인을 포함하는 설정 검색
            for (const [domain, configs] of configDomainMap.entries()) {
                if (hostname === domain || hostname.endsWith('.' + domain)) {
                    const matchedConfig = configs.find(cfg => 
                        !cfg.pathPattern || cfg.pathPattern.test(url)
                    );
                    if (matchedConfig) return matchedConfig;
                }
            }
        } catch (e) {
            // 잘못된 URL 형태일 경우 예외 처리
            return null;
        }
        return null;
    };

    // 중복 요청 방지를 위한 실행 중인 URL Map
    const activeRequests = new Set();

    const skipTags = new Set(['script', 'style', 'textarea', 'code', 'pre']);
    const urlRegex = /https?:\/\/[^\s<>"'\[\]()]+(?:\([^\s<>"'\[\]()]+\)|[^\s<>"'\[\]().,?!:;\"'\]\)])/gi;
    const imageRegex = /\.(jpg|jpeg|png|gif|webp|bmp)(?:\?.*)?$/i;

    // ==========================================
    // ⚡ 2. loadDeepPreview 중복 실행 완전 방지
    // ==========================================
    async function loadDeepPreview(pageUrl, imgElement) {
        // 이미 완료되었거나 요청 중인 Element는 즉시 반환
        if (imgElement.dataset.status === 'loading' || imgElement.dataset.status === 'done') {
            return;
        }

        const config = getConfig(pageUrl);
        if (!config) return;

        // 동일 URL로 이미 진행 중인 network call이 있다면 element 상태만 지정 후 대기
        imgElement.dataset.status = 'loading';

        function fetchPage(currentUrl) {
            // 리다이렉트 중복 추적 방지
            if (activeRequests.has(currentUrl)) return;
            activeRequests.add(currentUrl);

            GM_xmlhttpRequest({
                method: "GET",
                url: currentUrl,
                onload: function (res) {
                    activeRequests.delete(currentUrl);

                    const refreshMatch = res.responseText.match(/<meta\s+http-equiv=["']refresh["']\s+content=["']\d+;\s*url=['"]?([^'"]+?)['"]?["']/i);

                    if (refreshMatch && refreshMatch[1]) {
                        let redirectUrl = refreshMatch[1];
                        if (!redirectUrl.startsWith('http://') && !redirectUrl.startsWith('https://')) {
                            try {
                                redirectUrl = new URL(redirectUrl, currentUrl).href;
                            } catch (e) {
                                console.error("URL 변환 실패:", e);
                            }
                        }
                        fetchPage(redirectUrl);
                        return;
                    }

                    const match = res.responseText.match(config.imageSourceRegExp);
                    if (match && match[1]) {
                        const finalUrl = match[1];

                        imgElement.onload = () => {
                            imgElement.dataset.status = 'done';
                            imgElement.classList.remove('pending-deep-preview');
                            imgElement.style.minHeight = "auto";
                            imgElement.style.background = "none";
                            imgElement.style.opacity = "1";
                        };

                        if (config.directLoad) {
                            imgElement.src = finalUrl;
                        } else {
                            GM_xmlhttpRequest({
                                method: "GET",
                                url: finalUrl,
                                responseType: "blob",
                                headers: { "Referer": config.getReferer ? config.getReferer(pageUrl) : "" },
                                onload: function (imgRes) {
                                    if (imgRes.status === 200) {
                                        imgElement.src = URL.createObjectURL(imgRes.response);
                                    } else {
                                        imgElement.dataset.status = 'failed';
                                    }
                                },
                                onerror: () => { imgElement.dataset.status = 'failed'; }
                            });
                        }
                    } else {
                        imgElement.dataset.status = 'failed';
                        imgElement.classList.remove('pending-deep-preview');
                        imgElement.alt = "Image not found";
                    }
                },
                onerror: () => {
                    activeRequests.delete(currentUrl);
                    imgElement.dataset.status = 'failed';
                }
            });
        }

        fetchPage(pageUrl);
    }

    function createImgTag(url) {
        const config = getConfig(url);        

        if (config) {
            if (typeof config.transform === 'function') {
                const transformedUrl = config.transform(url);
                if (transformedUrl !== url) {
                    return `<img src="${transformedUrl}">`;
                }
            }

            if (config.imageSourceRegExp) {
                return `<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
                 class="pending-deep-preview"
                 data-status="pending"
                 data-url="${url}">`;
            }
        }

        else if (imageRegex.test(url)) {
            return `<img src="${url}">`;
        }

        return null;
    }

    function createFullLinkHTML(url) {
        const imgTag = createImgTag(url);
        if (imgTag) {
            return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="processed-link">${imgTag}</a>`;
        }
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="processed-link">${url}</a>`;
    }

    function processNodes(root = document.body) {
        if (root.classList && root.classList.contains('processed-link')) return;

        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, null, false);
        let currentNode;
        const nodesToProcess = [];

        while (currentNode = walker.nextNode()) {
            const tagName = currentNode.nodeType === 1 ? currentNode.tagName.toLowerCase() : "";

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

            try {
                if (type === 'existing-link') {
                    const imgHtml = createImgTag(node.href);
                    if (imgHtml) {
                        node.classList.add('processed-link');
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

        // ⚡ pending 상태인 img 태그들만 구별하여 호출
        root.querySelectorAll('.pending-deep-preview[data-status="pending"]').forEach(img => {
            loadDeepPreview(img.dataset.url, img);
        });
    }

    function splitImageParagraphs() {
        const container = document.querySelector('#torrent-description');
        if (!container) return;

        const paragraphs = Array.from(container.querySelectorAll('p'));

        paragraphs.forEach(p => {
            const processedLinks = Array.from(p.querySelectorAll('a.processed-link')).filter(a => a.querySelector('img'));
            const soloImages = Array.from(p.querySelectorAll('img')).filter(img => !img.closest('a.processed-link'));
            const itemsToMove = [...processedLinks, ...soloImages];

            if (itemsToMove.length === 0) return;

            const masonry = document.createElement('div');
            masonry.className = 'image-masonry';

            itemsToMove.forEach(item => {
                masonry.appendChild(item);
            });

            p.querySelectorAll('br').forEach(br => br.remove());

            if (!p.textContent.trim()) {
                p.replaceWith(masonry);
            } else {
                p.after(masonry);
            }
        });
    }

    processNodes();
    splitImageParagraphs();

    // Zoom 모달 생성
    const zoomContainer = document.createElement('div');
    zoomContainer.id = 'img-zoom-container';
    document.body.appendChild(zoomContainer);

    const zoomImg = document.createElement('img');
    zoomContainer.appendChild(zoomImg);

    zoomContainer.onclick = () => {
        zoomContainer.style.display = 'none';
        document.body.classList.remove('modal-open');
        zoomImg.src = '';
    };

    document.addEventListener('click', (e) => {
        const clickedImg = e.target.closest('.image-masonry img');
        if (!clickedImg) return;

        e.preventDefault();
        zoomImg.src = clickedImg.src;
        zoomContainer.style.display = 'block';
        document.body.classList.add('modal-open');
        zoomContainer.scrollTop = 0;
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            zoomContainer.style.display = 'none';
            document.body.classList.remove('modal-open');
            zoomImg.src = '';
        }
    });

    // ⚡ Observer 중복 바인딩 제거 및 최적화
    const observer = new MutationObserver((mutations) => {
        const parentsToProcess = new Set();

        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === 1 && node.classList.contains('processed-link')) continue;

                const parent = node.parentNode;
                if (parent && parent.nodeType === 1) {
                    if (parent.classList.contains('processed-link')) continue;
                    parentsToProcess.add(parent);
                }
            }
        }

        if (parentsToProcess.size > 0) {
            parentsToProcess.forEach(parent => processNodes(parent));
            splitImageParagraphs();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();