// ==UserScript==
// @name         Smart Grid Spacebar Scroller
// @namespace    http://tampermonkey.net/
// @version      1.9
// @description  Infy Scroll 로딩 후 최종 안착 위치의 스크롤 값을 히스토리에 정확히 동기화하도록 개선
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
                threshold: 0.85
            }
        },
        {
            hostPattern: /ultoporn\.com$/,
            config: {
                itemSelector: 'div#dle-content div.story.box',
                topOffset: 10,
                threshold: 0.85
            }
        }
    ];

    const DEFAULT_CONFIG = {
        itemSelector: '.shortstory, .card, .post-item, .grid-item, .product-item',
        topOffset: 10,
        threshold: 0.85
    };

    class SmartGridScroller {
        constructor(config = {}) {
            this.itemSelector = config.itemSelector;
            this.topOffset = config.topOffset ?? 10;
            this.threshold = config.threshold ?? 0.8;
            this.containerSelector = config.containerSelector ?? null;
            this.cachedColumnsCount = 1;

            const container = this.containerSelector ? document.querySelector(this.containerSelector) : null;
            const initialScrollTop = container ? container.scrollTop : window.pageYOffset;

            this.scrollHistory = [initialScrollTop];
            this.historyIndex = 0;

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

        getVisibleItems() {
            const allItems = Array.from(document.querySelectorAll(this.itemSelector));
            return allItems.filter(item => {
                if (item.classList.contains('hiddenbox')) {
                    return false;
                }
                if (item.offsetParent === null) return false;

                const style = window.getComputedStyle(item);
                return style.display !== 'none' && style.visibility !== 'hidden';
            });
        }

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
                this.scrollBackward(container);
            }
        }

        // 정방향 스크롤 (Space)
        scrollForward(items, columnsCount, viewportHeight, containerTop, container) {
            const scrollElement = container || document.documentElement;
            const currentScrollTop = container ? container.scrollTop : window.pageYOffset;
            const totalScrollHeight = scrollElement.scrollHeight;
            const remainingScroll = totalScrollHeight - (currentScrollTop + viewportHeight);

            let targetRowIndex = -1;

            for (let i = 0; i < items.length; i += columnsCount) {
                const rect = items[i].getBoundingClientRect();
                const relativeTop = rect.top - containerTop;

                if (relativeTop < viewportHeight && (relativeTop + rect.height) > 15) {
                    targetRowIndex = i;
                }
            }

            if (targetRowIndex !== -1) {
                const i = targetRowIndex;
                const currentLineItems = items.slice(i, Math.min(i + columnsCount, items.length));

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

                if (visibleRatio >= this.threshold && (i + columnsCount) < items.length) {
                    targetIndex = i + columnsCount;
                }

                // 히스토리 포인터 제어 및 자리 확보
                if (this.historyIndex < this.scrollHistory.length - 1) {
                    this.historyIndex++;
                } else {
                    this.scrollHistory.push(currentScrollTop);
                    this.historyIndex = this.scrollHistory.length - 1;
                }

                const targetItem = items[targetIndex];
                const targetTop = container
                    ? targetItem.offsetTop - container.offsetTop - this.topOffset
                    : window.pageYOffset + targetItem.getBoundingClientRect().top - this.topOffset;

                const requiredScrollDistance = targetTop - currentScrollTop;

                // 바닥 공간이 부족하여 무한 스크롤 로딩이 필요한 경우
                if (remainingScroll < requiredScrollDistance || remainingScroll < 10) {
                    if (container) {
                        container.scrollTo({ top: totalScrollHeight, behavior: 'smooth' });
                    } else {
                        window.scrollTo({ top: totalScrollHeight, behavior: 'smooth' });
                    }

                    // 로딩 대기 후 새 콘텐츠 위치로 이동하면서 최종 안착된 스크롤 값을 히스토리에 반영
                    this.waitForNewContentAndScroll(items.length, targetIndex, container, this.historyIndex);
                    return;
                }

                this.scrollToItem(targetItem, container);
                return;
            }

            if (remainingScroll < 50) {
                if (container) {
                    container.scrollTo({ top: totalScrollHeight, behavior: 'smooth' });
                } else {
                    window.scrollTo({ top: totalScrollHeight, behavior: 'smooth' });
                }
            }
        }

        // 페이지 요소 로딩 감지 후 이동 및 실제 안착된 스크롤 값을 히스토리에 갱신
        waitForNewContentAndScroll(prevItemCount, targetIndex, container, historyTargetIndex) {
            let checks = 0;
            const checkInterval = setInterval(() => {
                const newItems = this.getVisibleItems();
                checks++;

                if (newItems.length > prevItemCount || checks > 15) {
                    clearInterval(checkInterval);

                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            const latestItems = this.getVisibleItems();
                            if (latestItems[targetIndex]) {
                                const targetItem = latestItems[targetIndex];
                                const targetTop = container
                                    ? targetItem.offsetTop - container.offsetTop - this.topOffset
                                    : window.pageYOffset + targetItem.getBoundingClientRect().top - this.topOffset;

                                if (container) {
                                    container.scrollTo({ top: targetTop, behavior: 'smooth' });
                                } else {
                                    window.scrollTo({ top: targetTop, behavior: 'smooth' });
                                }

                                // 스크롤이 최종 안착된 시점의 실제 위치를 해당 히스토리 인덱스에 정확히 갱신
                                setTimeout(() => {
                                    const finalScrollTop = container ? container.scrollTop : window.pageYOffset;
                                    this.scrollHistory[historyTargetIndex] = finalScrollTop;
                                }, 350);
                            }
                        });
                    });
                }
            }, 100);
        }

        // 역방향 스크롤 (Shift + Space)
        scrollBackward(container) {
            if (this.historyIndex > 0) {
                this.historyIndex--;
                const targetScrollTop = this.scrollHistory[this.historyIndex];

                if (container) {
                    container.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
                } else {
                    window.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
                }
            } else if (this.historyIndex === 0) {
                const targetScrollTop = this.scrollHistory[0];
                if (container) {
                    container.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
                } else {
                    window.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
                }
            }
        }

        scrollToItem(targetItem, container) {
            if (!targetItem) return;

            const executeScroll = () => {
                const targetTop = container
                    ? targetItem.offsetTop - container.offsetTop - this.topOffset
                    : window.pageYOffset + targetItem.getBoundingClientRect().top - this.topOffset;

                if (container) {
                    container.scrollTo({ top: targetTop, behavior: 'smooth' });
                } else {
                    window.scrollTo({ top: targetTop, behavior: 'smooth' });
                }
            };

            executeScroll();

            setTimeout(() => {
                const currentRect = targetItem.getBoundingClientRect();
                const containerTop = container ? container.getBoundingClientRect().top : 0;
                const currentDiff = Math.abs((currentRect.top - containerTop) - this.topOffset);

                if (currentDiff > 5) {
                    executeScroll();
                }
            }, 300);
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