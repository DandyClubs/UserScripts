// ==UserScript==
// @name         Preview & Post Image Slider Unified (Clean Observer Flow)
// @namespace    http://tampermonkey.net/
// @version      4.5
// @description  모달 등장과 원본 카드의 인디케이터 생성을 조건 만족할 때까지 정확하게 감시하여 동기화하는 스크립트입니다.
// @match        https://jgirl.co/*
// @run-at       document-end
// @grant        GM_xmlhttpRequest
// @connect      *
// ==/UserScript==

(function() {
    'use strict';

    const imageCache = {};
    let activePostObserver = null;
    let clickedPostItem = null;

    // --- [공통] GM_xmlhttpRequest 기반 이미지 유효성 검사 함수 ---
    function checkImage(url) {
        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method: 'HEAD',
                url: url,
                timeout: 5000,
                onload: (res) => {
                    resolve(res.status >= 200 && res.status < 300);
                },
                onerror: () => resolve(false),
                ontimeout: () => resolve(false)
            });
        });
    }

    async function filterValidImages(urls) {
        const validUrls = [];
        for (const url of urls) {
            const isValid = await checkImage(url);
            if (isValid) {
                validUrls.push(url);
            }
        }
        return validUrls;
    }

    // --- [공통] 인디케이터 닷(Dot) 생성 헬퍼 함수 ---
    function createIndicators(figure, imageUrls) {
        if (figure.querySelector('.preview-indicators')) return;

        const indicatorWrap = document.createElement('div');
        indicatorWrap.className = 'preview-indicators';
        indicatorWrap.style.cssText = `
            position: absolute;
            bottom: 8px;
            left: 0;
            right: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 5px;
            z-index: 10;
            pointer-events: auto;
        `;

        imageUrls.forEach((url, index) => {
            const isActive = index === 0;
            const dot = document.createElement('div');
            dot.className = 'indicator-dot';
            dot.dataset.index = index;
            dot.style.cssText = `
                height: 6px;
                border-radius: 3px;
                background-color: rgba(255, 255, 255, 0.6);
                cursor: pointer;
                transition: all 0.2s ease;
                width: ${isActive ? '20px' : '6px'};
            `;
            indicatorWrap.appendChild(dot);
        });

        figure.appendChild(indicatorWrap);
    }

    // --- [기능 1] /post/ 상세 페이지 본문 전용 로직 (최상단 메인 영역) ---
    async function transformPostPage() {
        const overlayContainer = document.querySelector('div.overlay-container');
        const previewParent = document.querySelector('.preview-parent:not(#modal .preview-parent)');
        if (!previewParent || previewParent.dataset.converted === 'true') return;

        let rawUrls = [];

        if (overlayContainer) {
            overlayContainer.querySelectorAll('img').forEach(img => {
                const src = img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('data-actualsrc');
                if (src) {
                    rawUrls.push(new URL(src, window.location.origin).href);
                }
            });
        }

        previewParent.querySelectorAll('img').forEach(img => {
            const src = img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('data-actualsrc');
            if (src) {
                rawUrls.push(new URL(src, window.location.origin).href);
            }
        });

        rawUrls = [...new Set(rawUrls)].filter(url => !url.includes('poster_s'));

        if (overlayContainer) {
            overlayContainer.remove();
        }

        if (rawUrls.length <= 1) return;
        
        previewParent.dataset.converted = 'true';

        const container = previewParent.querySelector('.preview-container');
        const figure = previewParent.querySelector('.figure');
        if (!container || !figure) return;

        const imageUrls = await filterValidImages(rawUrls);
        if (imageUrls.length <= 1) return;

        container.dataset.imageUrls = JSON.stringify(imageUrls);
        container.dataset.sliderInitialized = 'true';

        const mainImg = figure.querySelector('img');
        if (mainImg) {
            mainImg.setAttribute('src', imageUrls[0]);
            mainImg.style.objectFit = 'contain';
            mainImg.style.backgroundColor = '#111';
        }

        createIndicators(figure, imageUrls);
    }

    // --- [공통 컨테이너 처리 함수] 데이터 확인 및 인디케이터 부착 ---
    async function ensureContainerSlider(container, referenceScope) {
        if (!container) return;

        const figure = container.querySelector('.figure');
        const img = figure ? figure.querySelector('img') : null;
        if (!figure || !img) return;

        if (figure.querySelector('.preview-indicators')) return;

        let imageUrls = [];

        const rawDatasetUrls = container.dataset.imageUrl || container.dataset.imageUrls || container.getAttribute('data-image-urls');
        if (rawDatasetUrls) {
            try {
                imageUrls = typeof rawDatasetUrls === 'string' ? JSON.parse(rawDatasetUrls) : rawDatasetUrls;
            } catch (e) {}
        }

        if (imageUrls.length === 0 && referenceScope) {
            let targetA = referenceScope.querySelector('a[href*="/post/"]') || referenceScope.querySelector('a:has(.block-title)');
            let targetUrl = targetA ? targetA.getAttribute('href') : '';

            if (targetUrl) {
                targetUrl = new URL(targetUrl, window.location.origin).href;

                if (imageCache[targetUrl]) {
                    imageUrls = imageCache[targetUrl];
                } else {
                    try {
                        const response = await fetch(targetUrl);
                        const htmlText = await response.text();
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(htmlText, 'text/html');

                        let rawUrls = [];
                        doc.querySelectorAll('div.overlay-container div img').forEach(targetImg => {
                            let src = targetImg.getAttribute('src') || targetImg.getAttribute('data-src');
                            if (src) {
                                rawUrls.push(new URL(src, window.location.origin).href);
                            }
                        });

                        if (rawUrls.length === 0) {
                            doc.querySelectorAll('.overlay-container img').forEach(targetImg => {
                                let src = targetImg.getAttribute('src') || targetImg.getAttribute('data-src');
                                if (src) {
                                    rawUrls.push(new URL(src, window.location.origin).href);
                                }
                            });
                        }

                        imageUrls = await filterValidImages(rawUrls);
                        imageCache[targetUrl] = imageUrls;
                    } catch (err) {
                        console.error('Failed to fetch target page:', err);
                    }
                }
            }
        }

        if (imageUrls.length <= 1) return;

        container.dataset.imageUrls = JSON.stringify(imageUrls);
        container.dataset.sliderInitialized = 'true';

        img.style.objectFit = 'contain';
        img.style.backgroundColor = '#111';

        createIndicators(figure, imageUrls);
    }

    // --- [클릭 감지 및 모달 동기화 핵심 로직] ---
    document.addEventListener('click', function(event) {
        const postItem = event.target.closest('.post-item');
        if (!postItem) return;

        clickedPostItem = postItem;

        if (activePostObserver) {
            activePostObserver.disconnect();
            activePostObserver = null;
        }

        const originalContainer = postItem.querySelector('.preview-container');
        if (!originalContainer) return;

        // 모달과 원본 카드의 상태를 검사하여 동기화하는 함수
        const trySyncModal = () => {
            const modal = document.querySelector('#modal');
            if (!modal) return false; // 아직 모달이 안 뜸 -> 대기 필요

            const modalContainer = modal.querySelector('.preview-container');
            if (!modalContainer) return false; // 모달 내 컨테이너 대기

            const origUrls = originalContainer.dataset.imageUrls;
            const origIndicators = originalContainer.querySelector('.preview-indicators');

            // 이미 데이터와 인디케이터가 완성되어 있는 경우 즉시 반영 후 종료
            if (origUrls && origIndicators) {
                let parsedUrls;
                try { parsedUrls = JSON.parse(origUrls); } catch(e){}

                if (!parsedUrls || parsedUrls.length <= 1) return true; // 1개 이하면 동기화 중단

                modalContainer.dataset.imageUrls = origUrls;
                modalContainer.dataset.sliderInitialized = 'true';

                const modalFigure = modalContainer.querySelector('.figure');
                const modalImg = modalContainer.querySelector('img');
                if (modalImg) {
                    modalImg.style.objectFit = 'contain';
                    modalImg.style.backgroundColor = '#111';
                }
                if (modalFigure) {
                    createIndicators(modalFigure, parsedUrls);
                }
                return true; // 동기화 완료 -> 옵저버 해제 가능
            }

            return false; // 아직 인디케이터 생성 전 -> 대기 지속
        };

        // 1. 클릭 직후 이미 모달과 데이터가 준비되어 있다면 즉시 반영
        if (trySyncModal()) return;

        // 2. 모달이 늦게 뜨거나 원본 카드의 비동기 작업이 아직 끝내지 않은 경우 조건을 만족할 때까지 관찰
        activePostObserver = new MutationObserver(() => {
            if (trySyncModal()) {
                activePostObserver.disconnect();
                activePostObserver = null;
            }
        });

        // body 전체 혹은 postItem/document를 관찰하여 모달 등장과 인디케이터 생성을 모두 포착
        activePostObserver.observe(document.body, { childList: true, subtree: true });

    }, true);

    // --- [기능 2] 호버 슬라이더 로직 (일반 리스트 목록용) ---
    document.addEventListener('mouseenter', async function(event) {
        const parent = event.target.closest('.preview-parent');
        if (!parent || parent.closest('#modal')) return;

        const container = parent.querySelector('.preview-container');
        if (!container) return;

        const postItem = parent.closest('.post-item');
        await ensureContainerSlider(container, postItem);
    }, true);

    // --- [공통] 인디케이터 마우스 오버 시 이미지 교체 이벤트 (전역 위임) ---
    document.addEventListener('mouseenter', function(event) {
        const dot = event.target.closest('.indicator-dot');
        if (!dot) return;

        const container = dot.closest('.preview-container');
        if (!container || !container.dataset.imageUrls) return;

        const img = container.querySelector('.figure img');
        if (!img) return;

        let imageUrls;
        try {
            imageUrls = JSON.parse(container.dataset.imageUrls);
        } catch (e) {
            return;
        }

        const index = parseInt(dot.dataset.index, 10);
        if (isNaN(index) || !imageUrls[index]) return;

        const indicatorWrap = dot.closest('.preview-indicators');
        if (indicatorWrap) {
            indicatorWrap.querySelectorAll('.indicator-dot').forEach(d => {
                d.style.width = '6px';
                d.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
            });
        }
        dot.style.width = '20px';
        dot.style.backgroundColor = 'rgba(255, 255, 255, 1)';

        img.setAttribute('src', imageUrls[index]);
        img.style.objectFit = 'contain';
        img.style.backgroundColor = '#111';
    }, true);

    // --- 초기 실행 분기 (/post/ 상세 페이지 본문 영역 변환) ---
    if (window.location.pathname.startsWith('/post/')) {
        if (document.readyState === 'loading') {
            window.addEventListener('DOMContentLoaded', transformPostPage);
        } else {
            transformPostPage();
        }
    }

})();