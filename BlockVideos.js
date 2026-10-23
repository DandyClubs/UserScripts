// ==UserScript==
// @name         동영상 사이트 채널 및 제목 필터 (사이트별 분리 관리)
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  동영상 마우스 오버 시 블럭 아이콘을 추가하여 사이트별로 채널명 및 제목 필터를 개별 설정하고 해당 동영상을 제거합니다.
// @match        https://www.pornhub.com/*
// @match        https://www.xvideos.com/*
// @match        https://xhamster.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function () {
    'use strict';

    // 1. 사이트별 선택자 설정
    const SITE_CONFIGS = [
        {
            host: 'pornhub.com',
            cardSelector: '#singleFeedSection .pcVideoListItem, ul li.pcVideoListItem',
            titleSelector: 'div.vidTitleWrapper span.title a, div.thumbnail-info span.title a',
            channelSelector: 'div.usernameWrap a',
            insertSelector: 'div.vidTitleWrapper, div.thumbnail-info',
            className: 'hidden'
        },
        {
            host: 'xvideos.com',
            cardSelector: 'div.mozaique div.thumb-block',
            titleSelector: 'div.thumb-under p.title a',
            channelSelector: 'p.metadata span.bg span a span.name',
            insertSelector: 'p.metadata',
            className: 'hidden'
        },
        {
            host: 'xhamster.com',
            cardSelector: 'div.mixed-section div.thumb-list div.video-thumb',
            titleSelector: 'div.video-thumb-info > div > a.video-thumb-info__name',
            channelSelector: 'div.video-uploader-data a.video-uploader__name',
            insertSelector: 'div.video-thumb-info',
            className: 'hiddenbox'
        }
    ];

    const currentConfig = SITE_CONFIGS.find(cfg => location.hostname.includes(cfg.host));
    if (!currentConfig) return;

    const STORAGE_KEY = `video_filters_${currentConfig.host}`;
    let filters = GM_getValue(STORAGE_KEY, { channels: [], titles: [] });
    


    // 새로 추가되어 처리가 필요한 요소들을 모아두는 큐(Set)
    const pendingNodes = new Set();
    let idleHandle = null;

    // requestIdleCallback 호환성 폴리필 (지원하지 않는 브라우저 대응)
    const scheduleIdle = window.requestIdleCallback || function (cb) {
        return setTimeout(() => {
            cb({ timeRemaining: () => 50 });
        }, 50);
    };

    const cancelIdle = window.cancelIdleCallback || function (id) {
        clearTimeout(id);
    };

    // 새 필터는 기존 카드에만 따로 적용해 전체 필터를 반복 비교하지 않는다.
    function saveFilters(addedFilter) {
        GM_setValue(STORAGE_KEY, filters);
        scanAllExistingCards(addedFilter);
    }


    // 카드를 숨기는 공통 처리 함수
    function hideCard(card) {
        if (!card) return;
        const className = currentConfig.className || 'hiddenbox';
        card.classList.add(className);
        console.log('Card hidden:', card);

    }

    // 뷰포트 하단 200px 감지 Observer
    
    function processCard(card, addedFilter = null) {
        if (!card || !(card instanceof HTMLElement)) return;
        if (
            card.classList.contains(currentConfig.className) ||
            card.style.display === 'none' ||
            (!addedFilter && (card.offsetParent === null || card.dataset.tmProcessed === 'true'))
        ) {
            return;
        }

        const titleEl = card.querySelector(currentConfig.titleSelector);
        const channelEl = card.querySelector(currentConfig.channelSelector);
        const titleText = titleEl ? titleEl.textContent.trim() : '';
        const channelText = channelEl ? channelEl.textContent.trim() : '';

        let isBlocked = addedFilter
            ? addedFilter.type === 'channel'
                ? channelText.toLowerCase() === addedFilter.value.toLowerCase()
                : titleText.toLowerCase().includes(addedFilter.value.toLowerCase())
            : filters.channels.some(ch =>
                ch && channelText.toLowerCase() === ch.toLowerCase()
            ) || filters.titles.some(keyword =>
                keyword && titleText.toLowerCase().includes(keyword.toLowerCase())
            );

        if (!isBlocked && addedFilter && card.dataset.tmProcessed !== 'true') {
            isBlocked = filters.channels.some(ch =>
                ch && channelText.toLowerCase() === ch.toLowerCase()
            ) || filters.titles.some(keyword =>
                keyword && titleText.toLowerCase().includes(keyword.toLowerCase())
            );
        }

        if (isBlocked) {
            hideCard(card);
            return;
        }

        if (card.dataset.tmProcessed === 'true' || card.style.display === 'none' || card.offsetParent === null) {
            return;
        }

        card.dataset.tmProcessed = 'true';

        // 마우스가 카드에 들어올 때 (mouseenter) 버튼 및 데이터 동적 확인
        card.addEventListener('mouseenter', () => {
            handleCardHover(card);
        });
    }

    // 3. 카드 mouseenter 시 실행할 동적 검사 및 버튼 주입
    function handleCardHover(card) {
        // 이미 차단된 요소거나 버튼이 이미 존재하는 경우 스킵
        if (card.classList.contains('hidden') || card.querySelector('.tm-block-btn-container')) return;

        const titleEl = card.querySelector(currentConfig.titleSelector);
        const channelEl = card.querySelector(currentConfig.channelSelector);
        const titleText = titleEl ? titleEl.textContent.trim() : '';
        const channelText = channelEl ? channelEl.textContent.trim() : '';

        // 지연 로딩된 insertEl 동적 재탐색
        const insertEl = card.querySelector(currentConfig.insertSelector);
        if (insertEl) {
            injectBlockButton(card, insertEl, channelText, titleText);
        }
    }

    // 3. Idle 상태일 때 큐에 쌓인 요소 일괄 처리
    function processBatchInIdle(deadline) {
        // 브라우저의 여유 시간이 남아있거나, 대기 시간이 만료(didTimeout)되었을 때 실행
        while ((deadline.timeRemaining() > 0 || deadline.didTimeout) && pendingNodes.size > 0) {
            const node = pendingNodes.values().next().value;
            pendingNodes.delete(node);

            if (!node || !node.isConnected) continue;

            if (node.matches && node.matches(currentConfig.cardSelector)) {
                processCard(node);
            } else if (node.querySelectorAll) {
                const cards = node.querySelectorAll(currentConfig.cardSelector);
                cards.forEach(card => processCard(card));
            }
        }

        // 아직 처리할 항목이 남아있다면 다음 Idle 타임에 이어서 실행
        if (pendingNodes.size > 0) {
            idleHandle = scheduleIdle(processBatchInIdle, { timeout: 1000 });
        } else {
            idleHandle = null;
        }
    }

    // 3. 기존 전체 요소 스캔 (초기 실행 및 필터 추가 시에만 호출)
    function scanAllExistingCards(addedFilter = null) {
        const cards = document.querySelectorAll(currentConfig.cardSelector);        
        cards.forEach(card => processCard(card, addedFilter));
    }

    // 4. 차단 버튼 삽입
    function injectBlockButton(card, insertEl, channelName, videoTitle) {
        if (card.querySelector('.tm-block-btn-container')) return;

        const pos = getComputedStyle(card).position;
        if (pos === 'static') {
            card.style.position = 'relative';
        }

        const container = document.createElement('div');
        container.className = 'tm-block-btn-container';

        const btn = document.createElement('button');
        btn.className = 'tm-block-btn';
        btn.innerHTML = '🚫';
        btn.title = `${currentConfig.host} 차단 설정`;

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();

            const oldPopup = container.querySelector('.tm-block-popup');
            if (oldPopup) {
                oldPopup.remove();
                return;
            }

            const popup = createPopup(card, channelName, videoTitle);
            container.appendChild(popup);
        });

        container.appendChild(btn);
        insertEl.appendChild(container);
    }

    // 5. 차단 옵션 팝업 생성
    function createPopup(card, channelName, videoTitle) {
        const popup = document.createElement('div');
        popup.className = 'tm-block-popup';

        // 채널 차단 버튼
        if (channelName) {
            const chBtn = document.createElement('button');
            chBtn.className = 'tm-popup-btn';
            chBtn.textContent = `채널 차단: "${channelName}"`;
            chBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!filters.channels.includes(channelName)) {
                    filters.channels.push(channelName);
                    popup.remove();
                    saveFilters({ type: 'channel', value: channelName });
                } else {
                    popup.remove();
                    hideCard(card);
                }
            });
            popup.appendChild(chBtn);
        }

        // 제목 키워드 입력 필터
        const inputContainer = document.createElement('div');
        inputContainer.className = 'tm-input-container';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'tm-popup-input';
        input.placeholder = '제목 필터 단어 입력...';
        if (videoTitle) input.value = videoTitle;

        const titleBtn = document.createElement('button');
        titleBtn.className = 'tm-popup-btn tm-add-btn';
        titleBtn.textContent = '제목 키워드 추가';

        const addTitleFilter = (e) => {
            e.stopPropagation();
            const val = input.value.trim();
            if (val) {
                if (!filters.titles.includes(val)) {
                    filters.titles.push(val);
                    popup.remove();
                    saveFilters({ type: 'title', value: val });
                } else {
                    popup.remove();
                    hideCard(card);
                }
            }
        };

        titleBtn.addEventListener('click', addTitleFilter);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') addTitleFilter(e);
        });

        inputContainer.appendChild(input);
        inputContainer.appendChild(titleBtn);
        popup.appendChild(inputContainer);

        return popup;
    }

    // 6. CSS 스타일
    const style = document.createElement('style');
    style.textContent = `
        .tm-block-btn-container {
            position: absolute !important;
            top: 10px !important;
            right: 10px !important;
            z-index: 999999 !important;
            opacity: 0;
            transition: opacity 0.2s ease-in-out;
            pointer-events: auto !important;
        }
        ${currentConfig.cardSelector}:hover .tm-block-btn-container {
            opacity: 1 !important;
        }
        .tm-block-btn {
            background: transparent !important;
            border: none !important;
            border-radius: 0 !important;
            width: 20px !important;
            height: 20px !important;
            cursor: pointer !important;
            font-size: 16px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            color: white !important;
            padding: 0 !important;
            filter: drop-shadow(-1px -1px 1px rgba(255, 255, 255, 0.6)) 
                    drop-shadow(2px 2px 2px rgba(0, 0, 0, 0.9)) !important;
            transition: transform 0.15s ease, filter 0.15s ease !important;
        }
        .tm-block-btn:hover {
            transform: scale(1.15) !important;
            filter: drop-shadow(-1px -1px 2px rgba(255, 255, 255, 0.9)) 
                    drop-shadow(2px 2px 3px rgba(0, 0, 0, 0.9)) !important;
        }
        .tm-block-btn:active {
            transform: scale(0.95) !important;
            filter: drop-shadow(0px 0px 1px rgba(0, 0, 0, 0.8)) !important;
        }
        .tm-block-popup {
            position: absolute !important;
            bottom: 40px !important;
            right: 0 !important;
            background: #1f1f23 !important;
            border: 1px solid #3a3a3d !important;
            border-radius: 8px !important;
            padding: 10px !important;
            box-shadow: 0 4px 16px rgba(0,0,0,0.7) !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 8px !important;
            min-width: 220px !important;
            z-index: 1000000 !important;
        }
        .tm-popup-btn {
            background: #2f2f35 !important;
            color: #fff !important;
            border: none !important;
            padding: 8px 12px !important;
            border-radius: 4px !important;
            cursor: pointer !important;
            text-align: left !important;
            font-size: 12px !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
        }
        .tm-popup-btn:hover {
            background: #3f3f46 !important;
        }
        .tm-input-container {
            display: flex !important;
            flex-direction: column !important;
            gap: 6px !important;
        }
        .tm-popup-input {
            background: #0f0f12 !important;
            color: #fff !important;
            border: 1px solid #3a3a3d !important;
            padding: 6px 10px !important;
            border-radius: 4px !important;
            font-size: 12px !important;
        }
        .tm-add-btn {
            background: #e50914 !important;
            text-align: center !important;
            font-weight: bold !important;
        }
        .tm-add-btn:hover {
            background: #b80710 !important;
        } 
            .hiddenbox{
                display: none !important;
                }
            
    `;
    document.head.appendChild(style);

    // 8. MutationObserver에서 Idle 콜백 스케줄링
    const observer = new MutationObserver((mutations) => {
        let hasNewNodes = false;

        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    pendingNodes.add(node);
                    hasNewNodes = true;
                }
            }
        }

        // 새로운 노드가 들어왔고, 등록된 idle 콜백이 없다면 예약 (타임아웃 1초 제한)
        if (hasNewNodes && !idleHandle) {
            idleHandle = scheduleIdle(processBatchInIdle, { timeout: 1000 });
        }
    });

    // Observer 관찰 시작
    observer.observe(document.body, { childList: true, subtree: true });

    // 초기 실행
    scanAllExistingCards();


    // 메뉴 등록
    GM_registerMenuCommand(`현재 사이트(${currentConfig.host}) 필터 초기화`, () => {
        if (confirm(`[${currentConfig.host}]의 모든 필터를 초기화하시겠습니까?`)) {
            GM_setValue(STORAGE_KEY, { channels: [], titles: [] });
            location.reload();
        }
    });
})();
