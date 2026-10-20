// ==UserScript==
// @name         Smart Grid Spacebar Scroller (No Reflow & Precise Backward)
// @namespace    http://tampermonkey.net/
// @version      2.2
// @description  offsetTop 기반으로 상/하단 노출도를 완벽히 계산하는 스페이스바 스크롤러
// @author       User
// @match        https://k2sprn.com/*
// @match        https://hidefporn.ws/*
// @match        https://ultoporn.com/*
// @match        http://wetholefans.com/*
// @match        https://www.naughtyblog.st/*
// @match        https://www.naughtyblog.org/*
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
        },        
        {
            hostPattern: /wetholefans\.com$/,
            config: {
                itemSelector: 'div#dle-content div.short-story',
                topOffset: 15,
                threshold: 0.85
            }
        },        
        {
            hostPattern: /naughtyblog\.(st|org)$/,
            config: {
                itemSelector: 'div#main-content > .post-overview',
                topOffset: 15,
                threshold: 0.85
            }
        }
    ];

    const DEFAULT_CONFIG = {
        itemSelector: '.shortstory, .card, .post-item, .grid-item, .product-item',
        topOffset: 10,
        threshold: 0.85
    };

    // 절대 Y 좌표 산출 유틸리티 함수 (getBoundingClientRect 미사용)
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
            
            // 연속 키 입력 중복 동작 방지 플래그
            this.isScrolling = false;

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

            // 이미 스크롤 애니메이션 또는 신규 콘텐츠 대기 중인 경우 중복 스페이스바 무시
            if (this.isScrolling) {
                e.preventDefault();
                e.stopPropagation();
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
                this.scrollBackward(items, columnsCount, container);
            }
        }

        // 정방향 스크롤 (Space)
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

                const targetItem = items[targetIndex];
                const targetTop = container
                    ? getAbsoluteTop(targetItem) - getAbsoluteTop(container) - this.topOffset
                    : getAbsoluteTop(targetItem) - this.topOffset;

                const requiredScrollDistance = targetTop - currentScrollTop;

                if (remainingScroll < requiredScrollDistance || remainingScroll < 10) {
                    this.isScrolling = true;
                    if (container) {
                        container.scrollTo({ top: totalScrollHeight, behavior: 'smooth' });
                    } else {
                        window.scrollTo({ top: totalScrollHeight, behavior: 'smooth' });
                    }

                    this.waitForNewContentAndScroll(targetIndex, container);
                    return;
                }

                this.scrollToItem(targetItem, container);
                return;
            }

            if (remainingScroll < 50) {
                this.isScrolling = true;
                if (container) {
                    container.scrollTo({ top: totalScrollHeight, behavior: 'smooth' });
                } else {
                    window.scrollTo({ top: totalScrollHeight, behavior: 'smooth' });
                }
                console.log('Waiting for scroll to complete before proceeding');
                // 스크롤 이동 완결 후 isScrolling 해제
                const scrollTarget = container || window;
                const releaseLock = () => {
                    scrollTarget.removeEventListener('scrollend', releaseLock);
                    this.isScrolling = false;
                };
                scrollTarget.addEventListener('scrollend', releaseLock);
            }
        }

        // 역방향 스크롤 (Shift + Space)
        scrollBackward(items, columnsCount, container) {
            const currentScrollTop = container ? container.scrollTop : window.pageYOffset;
            const viewportHeight = container ? container.clientHeight : window.innerHeight;
            const containerAbsoluteTop = container ? getAbsoluteTop(container) : 0;

            let topRowIndex = -1;

            for (let i = 0; i < items.length; i += columnsCount) {
                const item = items[i];
                const absoluteTop = getAbsoluteTop(item);
                const relativeTop = absoluteTop - containerAbsoluteTop - currentScrollTop;

                const lineItems = items.slice(i, Math.min(i + columnsCount, items.length));
                const maxHeight = Math.max(...lineItems.map(it => it.offsetHeight));

                if (relativeTop + maxHeight > this.topOffset) {
                    topRowIndex = i;
                    break;
                }
            }

            
            if (topRowIndex === -1 || topRowIndex === 0) {
                this.isScrolling = true;
                const scrollTarget = container || window;
                const handleEnd = () => {
                    scrollTarget.removeEventListener('scrollend', handleEnd);
                    this.isScrolling = false;
                };
                scrollTarget.addEventListener('scrollend', handleEnd);

                if (container) {
                    container.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
                return;
            }

            const topItem = items[topRowIndex];
            const topAbsoluteTop = getAbsoluteTop(topItem);
            const topRelativeTop = topAbsoluteTop - containerAbsoluteTop - currentScrollTop;
            const lineMaxHeight = Math.max(...items.slice(topRowIndex, Math.min(topRowIndex + columnsCount, items.length)).map(it => it.offsetHeight));

            const visibleHeight = Math.min(lineMaxHeight, Math.max(0, viewportHeight - topRelativeTop));
            const exposureRatio = visibleHeight / lineMaxHeight;

            let targetRowIndex = topRowIndex;

            if (exposureRatio >= 0.75 && topRowIndex >= columnsCount) {
                targetRowIndex = topRowIndex - columnsCount;
            }

            const targetItem = items[targetRowIndex];
            const targetLineItems = items.slice(targetRowIndex, Math.min(targetRowIndex + columnsCount, items.length));
            const targetMaxHeight = Math.max(...targetLineItems.map(it => it.offsetHeight));
            const targetAbsoluteTop = getAbsoluteTop(targetItem);

            let targetTop = (container ? targetAbsoluteTop - containerAbsoluteTop : targetAbsoluteTop) - viewportHeight + targetMaxHeight + 15;
            const alternativeTop = (container ? targetAbsoluteTop - containerAbsoluteTop : targetAbsoluteTop) - this.topOffset;

            if (targetTop >= currentScrollTop) {
                targetTop = Math.max(0, alternativeTop);
            }

            this.scrollToItemByPosition(Math.max(0, targetTop), container);
        }

        // 좌표 기준 스크롤 실행 (scrollend + requestAnimationFrame 적용)
        scrollToItemByPosition(targetTop, container) {
            this.isScrolling = true;
            const scrollTarget = container || window;

            const handleScrollEnd = () => {
                scrollTarget.removeEventListener('scrollend', handleScrollEnd);
                requestAnimationFrame(() => {
                    this.isScrolling = false;
                });
            };

            scrollTarget.addEventListener('scrollend', handleScrollEnd);

            if (container) {
                container.scrollTo({ top: targetTop, behavior: 'smooth' });
            } else {
                window.scrollTo({ top: targetTop, behavior: 'smooth' });
            }

            requestAnimationFrame(() => {
                const currentScrollTop = container ? container.scrollTop : window.pageYOffset;
                if (Math.abs(currentScrollTop - targetTop) < 2) {
                    handleScrollEnd();
                }
            });
        }

        // 요소 기준 정밀 스크롤 (scrollend + requestAnimationFrame 적용)
        scrollToItem(targetItem, container) {
            if (!targetItem) return;

            this.isScrolling = true;
            const scrollTarget = container || window;

            const targetTop = container
                ? getAbsoluteTop(targetItem) - getAbsoluteTop(container) - this.topOffset
                : getAbsoluteTop(targetItem) - this.topOffset;

            const handleScrollEnd = () => {
                scrollTarget.removeEventListener('scrollend', handleScrollEnd);

                requestAnimationFrame(() => {
                    const currentAbsoluteTop = getAbsoluteTop(targetItem);
                    const currentContainerTop = container ? getAbsoluteTop(container) : 0;
                    const currentScrollTop = container ? container.scrollTop : window.pageYOffset;
                    const currentRelativeTop = currentAbsoluteTop - currentContainerTop - currentScrollTop;
                    const currentDiff = Math.abs(currentRelativeTop - this.topOffset);

                    // 미세 위치 오차 발생 시 instant로 즉시 정밀 보정
                    if (currentDiff > 5) {
                        const finalTop = container
                            ? getAbsoluteTop(targetItem) - getAbsoluteTop(container) - this.topOffset
                            : getAbsoluteTop(targetItem) - this.topOffset;

                        if (container) {
                            container.scrollTo({ top: Math.max(0, finalTop), behavior: 'instant' });
                        } else {
                            window.scrollTo({ top: Math.max(0, finalTop), behavior: 'instant' });
                        }
                    }

                    this.isScrolling = false;
                });
            };

            scrollTarget.addEventListener('scrollend', handleScrollEnd);

            if (container) {
                container.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
            } else {
                window.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
            }

            requestAnimationFrame(() => {
                const currentScrollTop = container ? container.scrollTop : window.pageYOffset;
                if (Math.abs(currentScrollTop - Math.max(0, targetTop)) < 2) {
                    handleScrollEnd();
                }
            });
        }

        // 페이지 요소 로딩 감지 후 이동 (MutationObserver + 복합 조건 검증)
        waitForNewContentAndScroll(targetIndex, container) {
            this.isScrolling = true;

            const observerTarget = container || document.body;
            const scrollTarget = container || window;

            const observer = new MutationObserver((mutations, obs) => {
                const newItems = this.getVisibleItems();               

                if (newItems[targetIndex]) {
                    const scrollElement = container || document.documentElement;
                    const viewportHeight = container ? container.clientHeight : window.innerHeight;
                    const totalScrollHeight = scrollElement.scrollHeight;

                    const targetItem = newItems[targetIndex];
                    const targetTop = container
                        ? getAbsoluteTop(targetItem) - getAbsoluteTop(container) - this.topOffset
                        : getAbsoluteTop(targetItem) - this.topOffset;

                    const isEnoughScrollSpace = (totalScrollHeight - targetTop) >= viewportHeight;

                    
                    if (isEnoughScrollSpace) {
                        obs.disconnect();

                        requestAnimationFrame(() => {
                            const handleScrollEnd = () => {
                                scrollTarget.removeEventListener('scrollend', handleScrollEnd);

                                requestAnimationFrame(() => {
                                    const currentAbsoluteTop = getAbsoluteTop(targetItem);
                                    const currentContainerTop = container ? getAbsoluteTop(container) : 0;
                                    const currentScrollTop = container ? container.scrollTop : window.pageYOffset;
                                    const currentRelativeTop = currentAbsoluteTop - currentContainerTop - currentScrollTop;
                                    const currentDiff = Math.abs(currentRelativeTop - this.topOffset);

                                    if (currentDiff > 5) {
                                        const finalTop = container
                                            ? getAbsoluteTop(targetItem) - getAbsoluteTop(container) - this.topOffset
                                            : getAbsoluteTop(targetItem) - this.topOffset;

                                        if (container) {
                                            container.scrollTo({ top: Math.max(0, finalTop), behavior: 'instant' });
                                        } else {
                                            window.scrollTo({ top: Math.max(0, finalTop), behavior: 'instant' });
                                        }
                                    }

                                    this.isScrolling = false;
                                });
                            };

                            scrollTarget.addEventListener('scrollend', handleScrollEnd);

                            if (container) {
                                container.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
                            } else {
                                window.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
                            }

                            requestAnimationFrame(() => {
                                const currentScrollTop = container ? container.scrollTop : window.pageYOffset;
                                if (Math.abs(currentScrollTop - Math.max(0, targetTop)) < 2) {
                                    handleScrollEnd();
                                }
                            });
                        });
                    }
                }
            });

            observer.observe(observerTarget, {
                childList: true,
                subtree: true
            });            
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