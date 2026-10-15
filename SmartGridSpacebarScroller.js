// ==UserScript==
// @name         Smart Grid Spacebar Scroller (No Reflow & Precise Backward)
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  getBoundingClientRect 없이 offsetTop 기반으로 상/하단 노출도를 완벽히 계산하는 스페이스바 스크롤러
// @author       User
// @match        https://k2sprn.com/*
// @match        https://hidefporn.ws/*
// @match        https://ultoporn.com/*
// @match        http://wetholefans.com/*
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
                    if (container) {
                        container.scrollTo({ top: totalScrollHeight, behavior: 'smooth' });
                    } else {
                        window.scrollTo({ top: totalScrollHeight, behavior: 'smooth' });
                    }

                    this.waitForNewContentAndScroll(items.length, targetIndex, container);
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

        // 역방향 스크롤 (Shift + Space): 상단 요소 노출도 체크 기반 정밀 보정
        scrollBackward(items, columnsCount, container) {
            const currentScrollTop = container ? container.scrollTop : window.pageYOffset;
            const viewportHeight = container ? container.clientHeight : window.innerHeight;
            const containerAbsoluteTop = container ? getAbsoluteTop(container) : 0;

            // 1. 현재 화면 상단(또는 뷰포트 내부 최상단 영역)에 걸쳐 있는 '첫 번째 행'의 시작 인덱스 찾기
            let topRowIndex = -1;

            for (let i = 0; i < items.length; i += columnsCount) {
                const item = items[i];
                const absoluteTop = getAbsoluteTop(item);
                const relativeTop = absoluteTop - containerAbsoluteTop - currentScrollTop;

                // 행의 높이 (해당 행 내 아이템 중 최대 높이)
                const lineItems = items.slice(i, Math.min(i + columnsCount, items.length));
                const maxHeight = Math.max(...lineItems.map(it => it.offsetHeight));

                // 만약 이 행이 화면 상단 부근에 걸쳐 있거나 아래에 있다면 (상단 잘림 여부 판단 대상)
                if (relativeTop + maxHeight > this.topOffset) {
                    topRowIndex = i;
                    break;
                }
            }

            // 만약 상단에 보일 만한 요소를 찾지 못했거나 맨 위에 도달한 경우 문서 최상단으로 이동
            if (topRowIndex === -1 || topRowIndex === 0) {
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

            // 상단 윗줄의 노출도 계산 (화면 상단 안에 얼마나 들어와 있는지)
            // 예컨대 topRelativeTop이 음수라면 그만큼 잘려 있는 상태입니다.
            const visibleHeight = Math.min(lineMaxHeight, Math.max(0, viewportHeight - topRelativeTop));
            const exposureRatio = visibleHeight / lineMaxHeight;

            let targetRowIndex = topRowIndex;

            // ⭐️ 규칙 적용:
            // 1. 제일 윗줄이 충분히 노출되어 있다면(예: 80% 이상 노출), 그 '위쪽 행'을 타겟으로 잡음
            // 2. 잘려 있거나 노출도가 부족하다면, 현재 윗줄 자체를 타겟으로 잡음
            if (exposureRatio >= 0.75 && topRowIndex >= columnsCount) {
                targetRowIndex = topRowIndex - columnsCount;
            }

            // 타겟 행이 화면 하단에 100% 온전하게 보이도록 스크롤 위치 계산
            // (타겟 행의 맨 아래가 뷰포트 하단에 안착하거나, 혹은 타겟 행이 화면에 완전히 들어오도록 설정)
            const targetItem = items[targetRowIndex];
            const targetLineItems = items.slice(targetRowIndex, Math.min(targetRowIndex + columnsCount, items.length));
            const targetMaxHeight = Math.max(...targetLineItems.map(it => it.offsetHeight));

            const targetAbsoluteTop = getAbsoluteTop(targetItem);

            // 타겟 행이 화면 아래쪽에 완전히 들어오도록 하는 스크롤 위치 산출:
            // 타겟의 절대 상단 좌표에서 (뷰포트 높이 - 타겟 행 높이 - 여백)을 빼면 
            // 타겟 행이 화면 하단에 100% 보이게 안착합니다.
            let targetTop = (container ? targetAbsoluteTop - containerAbsoluteTop : targetAbsoluteTop) - viewportHeight + targetMaxHeight + 15;

            // 만약 위 계산식보다 더 확실하게 위로 올려야 한다면 상단 기준 정렬과 비교하여 안전하게 처리
            const alternativeTop = (container ? targetAbsoluteTop - containerAbsoluteTop : targetAbsoluteTop) - this.topOffset;

            // 현재 스크롤보다 확실히 위로 가도록 보정
            if (targetTop >= currentScrollTop) {
                targetTop = Math.max(0, alternativeTop);
            }

            if (container) {
                container.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
            } else {
                window.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
            }
        }
        
        // 페이지 요소 로딩 감지 후 이동 (MutationObserver 활용)
        waitForNewContentAndScroll(prevItemCount, targetIndex, container) {
            const observerTarget = container || document.body;

            // DOM 변화를 실시간으로 감지하는 MutationObserver 생성
            const observer = new MutationObserver((mutations, obs) => {
                const newItems = this.getVisibleItems();

                // 새로운 아이템이 추가되었고, 목표로 하는 targetIndex 아이템이 DOM에 존재하는지 확인
                if (newItems.length > prevItemCount && newItems[targetIndex]) {
                    obs.disconnect(); // 감지 완료 즉시 옵저버 해제

                    // 레이아웃 안정화를 위한 짧은 지연 후 실행
                    setTimeout(() => {
                        requestAnimationFrame(() => {
                            const targetItem = newItems[targetIndex];

                            const executeScroll = () => {
                                const targetTop = container
                                    ? getAbsoluteTop(targetItem) - getAbsoluteTop(container) - this.topOffset
                                    : getAbsoluteTop(targetItem) - this.topOffset;

                                if (container) {
                                    container.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
                                } else {
                                    window.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
                                }
                            };

                            executeScroll();

                            // 스크롤 안착 후 topOffset 오차 실시간 재보정 및 히스토리 갱신
                            setTimeout(() => {
                                const currentAbsoluteTop = getAbsoluteTop(targetItem);
                                const currentContainerTop = container ? getAbsoluteTop(container) : 0;
                                const currentScrollTop = container ? container.scrollTop : window.pageYOffset;
                                const currentRelativeTop = currentAbsoluteTop - currentContainerTop - currentScrollTop;
                                const currentDiff = Math.abs(currentRelativeTop - this.topOffset);

                                if (currentDiff > 5) {
                                    executeScroll();
                                }
                                
                            }, 350);
                        });
                    }, 100);
                }
            });

            // 문서 또는 컨테이너 하위의 DOM 추가/변경 감지 시작
            observer.observe(observerTarget, {
                childList: true,
                subtree: true
            });

            // 안전장치: 네트워크 지연 등으로 일정 시간(예: 5초) 이상 새 콘텐츠가 안 들어올 경우 무한 대기 방지용 해제
            setTimeout(() => {
                observer.disconnect();
            }, 5000);
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
            observer.observe(document.body, { childList: true, subtree: `true` });
        }
    }

    init();
})();