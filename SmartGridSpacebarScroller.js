// ==UserScript==
// @name         Smart Grid Spacebar Scroller
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Infy Scroll 등 무한 스크롤 확장과의 충돌 방지 및 최하단 자동 로딩 유도 기능 추가
// @author       User
// @match        https://k2sprn.com/*
// @match        https://hidefporn.ws/*
// @match        https://ultoporn.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    const SITE_CONFIGS = [
        {
            hostPattern: /(k2sprn\.com|hidefporn\.ws)$/,
            config: {
                itemSelector: '#dle-content .shortstory',
                topOffset: 10,
                threshold: 0.8
            }
        },
        {
            hostPattern: /ultoporn\.com$/,
            config: {
                itemSelector: 'div#dle-content div.story.box',
                topOffset: 10,
                threshold: 0.8
            }
        }
    ];

    const DEFAULT_CONFIG = {
        itemSelector: '.shortstory, .card, .post-item, .grid-item, .product-item',
        topOffset: 10,
        threshold: 0.8
    };

    class SmartGridScroller {
        constructor(config = {}) {
            this.itemSelector = config.itemSelector;
            this.topOffset = config.topOffset ?? 10;
            this.threshold = config.threshold ?? 0.8;
            this.containerSelector = config.containerSelector ?? null;
            this.cachedColumnsCount = 1;

            this.init();
        }

        init() {
            window.addEventListener('keydown', (e) => this.handleKeyDown(e), true);

            const resizeObserver = new ResizeObserver(() => {
                this.updateColumnsCount();
            });
            resizeObserver.observe(document.body);

            this.updateColumnsCount();
        }

        // ----------------------------------------------------
        // [핵심 해결책] 화면에 실제 보이는(공간을 차지하는) 요소만 필터링
        // ----------------------------------------------------
        getVisibleItems() {
            const allItems = Array.from(document.querySelectorAll(this.itemSelector));
            return allItems.filter(item => {
                // 1. [클래스 직접 검사] CSS 계산 이전이라도 hiddenbox 클래스가 들어갔다면 즉시 제외
                if (item.classList.contains('hiddenbox')) {
                    return false;
                }

                // 2. [DOM 렌더링 상태 검사] offsetParent가 null이거나 display/visibility 조건 확인
                if (item.offsetParent === null) return false;

                const style = window.getComputedStyle(item);
                return style.display !== 'none' && style.visibility !== 'hidden';
            });
        }

        // 창 크기 변경 시 보이는 요소들 기준으로만 열(Column) 개수 재계산
        updateColumnsCount() {
            const items = this.getVisibleItems();
            if (items.length === 0) return;

            const firstRowTop = items[0].offsetTop;
            let count = 0;

            for (let item of items) {
                if (Math.abs(item.offsetTop - firstRowTop) < 8) {
                    count++;
                } else {
                    break;
                }
            }
            this.cachedColumnsCount = Math.max(1, count);
        }

        handleKeyDown(e) {
            if (e.code !== 'Space' ||
                ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) ||
                document.activeElement.isContentEditable) {
                return;
            }

            // 숨겨진 요소(.hiddenbox 등)가 제거된 가시적인 아이템 배열만 가져옴
            const items = this.getVisibleItems();
            if (items.length === 0) return;

            e.preventDefault();
            e.stopPropagation();

            const columnsCount = this.cachedColumnsCount;
            const container = this.containerSelector
            ? document.querySelector(this.containerSelector)
            : null;

            const viewportHeight = container ? container.clientHeight : window.innerHeight;
            const containerTop = container ? container.getBoundingClientRect().top : 0;

            if (!e.shiftKey) {
                this.scrollForward(items, columnsCount, viewportHeight, containerTop, container);
            } else {
                this.scrollBackward(items, columnsCount, containerTop, container);
            }
        }

        // 정방향 스크롤 (Space)
        // 정방향 스크롤 (Space)
        scrollForward(items, columnsCount, viewportHeight, containerTop, container) {
            const scrollElement = container || document.documentElement;
            const currentScrollTop = container ? container.scrollTop : window.pageYOffset;
            const totalScrollHeight = scrollElement.scrollHeight;

            // 현재 스크롤바가 최하단까지 내려갈 수 있는 남은 총 여유 거리
            const remainingScroll = totalScrollHeight - (currentScrollTop + viewportHeight);

            // 1. 화면 하단 한계선에 걸쳐 있는 '가장 아래쪽 행' 탐색
            let targetRowIndex = -1;

            for (let i = 0; i < items.length; i += columnsCount) {
                const rect = items[i].getBoundingClientRect();
                const relativeTop = rect.top - containerTop;

                // 뷰포트 내에 일부라도 존재하는 행 탐색
                if (relativeTop < viewportHeight && (relativeTop + rect.height) > 15) {
                    targetRowIndex = i;
                }
            }

            if (targetRowIndex !== -1) {
                const i = targetRowIndex;
                const currentLineItems = items.slice(i, Math.min(i + columnsCount, items.length));

                // 행 내부의 최대 높이 카드를 기준으로 노출 비율 계산
                let maxHeightItem = currentLineItems[0];
                let maxRect = maxHeightItem.getBoundingClientRect();

                for (let item of currentLineItems) {
                    const itemRect = item.getBoundingClientRect();
                    if (itemRect.height > maxRect.height) {
                        maxHeightItem = item;
                        maxRect = itemRect;
                    }
                }

                const maxRelativeTop = maxRect.top - containerTop;
                const visibleRatio = (viewportHeight - maxRelativeTop) / maxRect.height;

                let targetIndex = i;

                // 노출 비율이 설정값(기본 80%) 이상이면 다음 라인으로 target 변경
                if (visibleRatio >= this.threshold && (i + columnsCount) < items.length) {
                    targetIndex = i + columnsCount;
                }

                const targetItem = items[targetIndex];
                const targetTop = container 
                ? targetItem.offsetTop - container.offsetTop - this.topOffset
                : window.pageYOffset + targetItem.getBoundingClientRect().top - this.topOffset;

                // ----------------------------------------------------
                // [동적 피치 계산] 목표 위치까지 이동하기 위해 필요한 실시간 스크롤 거리
                // ----------------------------------------------------
                const requiredScrollDistance = targetTop - currentScrollTop;

                // 남아있는 스크롤 가능 공간이 '실제 필요한 스크롤 거리'보다 작다면
                // (즉, 바닥에 막혀 목표 카드가 top: 10px 위치까지 못 올라오는 상황)
                if (remainingScroll < requiredScrollDistance || remainingScroll < 10) {
                    // 바닥으로 밀어서 Infy Scroll 2페이지 로딩 유도
                    if (container) {
                        container.scrollTo({ top: totalScrollHeight, behavior: 'smooth' });
                    } else {
                        window.scrollTo({ top: totalScrollHeight, behavior: 'smooth' });
                    }

                    // 로딩 후 원래 가려던 targetIndex 위치로 스크롤 이동
                    this.waitForNewContentAndScroll(items.length, targetIndex, container);
                    return;
                }

                // 이동 공간이 충분하면 목표 위치로 정렬 스크롤
                this.scrollToItem(targetItem, container);
                return;
            }

            // 바닥 근처에 있는 경우 Infy Scroll 유도
            if (remainingScroll < 50) {
                if (container) {
                    container.scrollTo({ top: totalScrollHeight, behavior: 'smooth' });
                } else {
                    window.scrollTo({ top: totalScrollHeight, behavior: 'smooth' });
                }
            }
        }

        // 다음 페이지 로딩 후 가시 요소 기준 정렬
        waitForNewContentAndScroll(prevItemCount, targetIndex, container) {
            let checks = 0;
            const checkInterval = setInterval(() => {
                const newItems = this.getVisibleItems();
                checks++;

                if (newItems.length > prevItemCount || checks > 15) {
                    clearInterval(checkInterval);
                    if (newItems[targetIndex]) {
                        this.scrollToItem(newItems[targetIndex], container);
                    }
                }
            }, 100);
        }

        scrollBackward(items, columnsCount, containerTop, container) {
            for (let i = items.length - 1; i >= 0; i--) {
                const rect = items[i].getBoundingClientRect();
                const relativeTop = rect.top - containerTop;

                if (relativeTop < -15) {
                    const targetIndex = Math.max(0, i - (i % columnsCount));
                    this.scrollToItem(items[targetIndex], container);
                    break;
                }
            }
        }

        scrollToItem(targetItem, container) {
            if (!targetItem) return;

            if (container) {
                const targetTop = targetItem.offsetTop - container.offsetTop - this.topOffset;
                container.scrollTo({ top: targetTop, behavior: 'smooth' });
            } else {
                const targetTop = window.pageYOffset + targetItem.getBoundingClientRect().top - this.topOffset;
                window.scrollTo({ top: targetTop, behavior: 'smooth' });
            }
        }
    }

    function init() {
        const currentHost = window.location.hostname;

        const matched = SITE_CONFIGS.find(site => {
            if (site.hostPattern instanceof RegExp) {
                return site.hostPattern.test(currentHost);
            }
            return currentHost.includes(site.hostPattern);
        });

        const finalConfig = matched ? matched.config : DEFAULT_CONFIG;

        const startScroller = () => {
            if (document.querySelector(finalConfig.itemSelector)) {
                new SmartGridScroller(finalConfig);
                return true;
            }
            return false;
        };

        if (!startScroller()) {
            const observer = new MutationObserver((mutations, obs) => {
                if (startScroller()) {
                    obs.disconnect();
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        }
    }

    init();
})();