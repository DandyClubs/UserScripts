// ==UserScript==
// @name         Smart Grid Spacebar Scroller (No Reflow)
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  getBoundingClientRect 없이 offsetTop 및 offsetHeight 기반으로 그리드 스크롤 제어
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

    // 절대 Y 좌표 산출 유틸리티 함수
    function getAbsoluteTop(element) {
        let top = 0;
        let current = element;
        while (current) {
            top += current.offsetTop;
            current = current.offsetParent;
        }
        return top;
    }

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

            if (!e.shiftKey) {
                this.scrollForward(items, columnsCount, container);
            } else {
                this.scrollBackward(container);
            }
        }

        scrollForward(items, columnsCount, container) {
            const scrollElement = container || document.documentElement;
            const currentScrollTop = container ? container.scrollTop : window.pageYOffset;
            const viewportHeight = container ? container.clientHeight : window.innerHeight;
            const totalScrollHeight = scrollElement.scrollHeight;
            const remainingScroll = totalScrollHeight - (currentScrollTop + viewportHeight);
            const containerAbsoluteTop = container ? getAbsoluteTop(container) : 0;

            let targetRowIndex = -1;

            for (let i = 0; i < items.length; i += columnsCount) {
                const item = items[i];
                const absoluteTop = getAbsoluteTop(item);
                const relativeTop = absoluteTop - containerAbsoluteTop - currentScrollTop;

                if (relativeTop < viewportHeight && (relativeTop + item.offsetHeight) > 15) {
                    targetRowIndex = i;
                }
            }

            if (targetRowIndex !== -1) {
                const i = targetRowIndex;
                const currentLineItems = items.slice(i, Math.min(i + columnsCount, items.length));

                let maxHeightItem = currentLineItems[0];
                let maxHeight = maxHeightItem.offsetHeight;

                for (let item of currentLineItems) {
                    if (item.offsetHeight > maxHeight) {
                        maxHeightItem = item;
                        maxHeight = item.offsetHeight;
                    }
                }

                const maxAbsoluteTop = getAbsoluteTop(maxHeightItem);
                const maxRelativeTop = maxAbsoluteTop - containerAbsoluteTop - currentScrollTop;
                const visibleRatio = (viewportHeight - maxRelativeTop) / maxHeight;

                let targetIndex = i;

                if (visibleRatio >= this.threshold && (i + columnsCount) < items.length) {
                    targetIndex = i + columnsCount;
                }

                if (this.historyIndex < this.scrollHistory.length - 1) {
                    this.historyIndex++;
                } else {
                    this.scrollHistory.push(currentScrollTop);
                    this.historyIndex = this.scrollHistory.length - 1;
                }

                const targetItem = items[targetIndex];
                const targetTop = container
                    ? getAbsoluteTop(targetItem) - getAbsoluteTop(container) - this.topOffset
                    : getAbsoluteTop(targetItem) - this.topOffset;

                const requiredScrollDistance = targetTop - currentScrollTop;

                if (remainingScroll < requiredScrollDistance || remainingScroll < 10) {
                    if (container) {
                        container.scrollTo({ top: totalScrollHeight, behavior: 'smooth' });
                    } else {
                        window.scrollTo({ top: totalScrollHeight, behavior: 'smooth' });
                    }

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
                                    ? getAbsoluteTop(targetItem) - getAbsoluteTop(container) - this.topOffset
                                    : getAbsoluteTop(targetItem) - this.topOffset;

                                if (container) {
                                    container.scrollTo({ top: targetTop, behavior: 'smooth' });
                                } else {
                                    window.scrollTo({ top: targetTop, behavior: 'smooth' });
                                }

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
                    ? getAbsoluteTop(targetItem) - getAbsoluteTop(container) - this.topOffset
                    : getAbsoluteTop(targetItem) - this.topOffset;

                if (container) {
                    container.scrollTo({ top: targetTop, behavior: 'smooth' });
                } else {
                    window.scrollTo({ top: targetTop, behavior: 'smooth' });
                }
            };

            executeScroll();

            setTimeout(() => {
                const currentAbsoluteTop = getAbsoluteTop(targetItem);
                const currentContainerTop = container ? getAbsoluteTop(container) : 0;
                const currentRelativeTop = currentAbsoluteTop - currentContainerTop - (container ? container.scrollTop : window.pageYOffset);
                const currentDiff = Math.abs(currentRelativeTop - this.topOffset);

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