// ==UserScript==
// @name         jgirl slider
// @namespace    http://tampermonkey.net/
// @version      2026-11-13
// @description  try to take over the world!
// @author       You
// @match        https://jgirl.co/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=jgirl.co
// @grant        none
// @run-at       document-body
// ==/UserScript==

(function () {
    'use strict';

    // 1. 초기화: .lazyload-poster가 포함된 figure를 제외하고 이미지 주소 백업 및 src 제거
    document.querySelectorAll('.post-item').forEach(post => {
        const figures = post.querySelectorAll('.preview-container figure');

        figures.forEach((figure) => {
            // 포스터 figure인 경우 제외
            if (figure.querySelector('.lazyload-poster')) return;

            const img = figure.querySelector('img.lazyload-preview');
            if (!img) return;

            img.dataset.slider = img.dataset.src || img.src;
            img.removeAttribute('src');
            img.removeAttribute('data-src');
        });
    });

    // 2. opacity가 0에서 1로 바뀐 figure를 큐에 넣고 순차적으로 로드
    const loadQueue = [];
    const queuedFigures = new Set();
    let isProcessingQueue = false;

    function enqueueImageLoad(figure) {
        // 이미 완료된 요소이거나 이미 큐에 있는 경우 차단
        if (figure.dataset.lazyLoaded === 'true' || queuedFigures.has(figure)) return;

        const img = figure.querySelector('img.lazyload-preview');
        if (!img || !img.dataset.slider || img.getAttribute('src')) return;

        queuedFigures.add(figure);
        loadQueue.push(figure);
    }

    function processLoadQueue() {
        if (isProcessingQueue) return;

        while (loadQueue.length) {
            const activeIndex = loadQueue.findIndex(figure =>
                parseFloat(window.getComputedStyle(figure).opacity) >= 1
            );

            // 조건에 맞는 항목이 없으면 대기
            if (activeIndex < 0) break;

            const [figure] = loadQueue.splice(activeIndex, 1);
            queuedFigures.delete(figure);

            // 처리 전 완료 여부 재확인
            if (figure.dataset.observer === 'true') continue;

            const img = figure.querySelector('img.lazyload-preview');
            if (!img || !img.dataset.slider || img.getAttribute('src')) {
                figure.dataset.lazyLoaded = 'true';
                continue;
            }

            isProcessingQueue = true;

            const isActive = parseFloat(window.getComputedStyle(figure).opacity) >= 1;
            img.fetchPriority = isActive ? 'high' : 'low';
            img.src = img.dataset.slider;
            img.removeAttribute('data-slider');

            // 완료된 항목 마킹 (이후 Observer나 큐에서 완전히 배제됨)
            figure.dataset.observer = 'true';

            isProcessingQueue = false;
            // 루프를 계속 돌며 큐에 남은 항목 처리
        }
    }

    // 3. figure의 style(opacity) 변화를 감지하는 Observer 설정
    const observer = new MutationObserver((mutations) => {
        const changedFigures = new Set(mutations.map(mutation => mutation.target));

        for (const figure of changedFigures) {
            // 이미 완료된 figure는 감지해도 무시 (필터링)
            if (figure.dataset.observer === 'true') continue;

            const opacity = parseFloat(window.getComputedStyle(figure).opacity);

            if (opacity >= 1) {
                enqueueImageLoad(figure);
            }
        };
    processLoadQueue();
});

// 4. .lazyload-poster가 아닌 figure 요소들만 관찰 등록
document.querySelectorAll('.post-item .preview-container figure').forEach(figure => {
    // 포스터 figure인 경우 옵저버 대상에서 제외
    if (figure.querySelector('.lazyload-poster')) return;

    const opacity = parseFloat(window.getComputedStyle(figure).opacity);

    // 페이지 로드 시 이미 opacity가 1인 경우 곧바로 큐에 추가
    if (opacity >= 1) {
        enqueueImageLoad(figure);
    } else {
        // 아닐 경우에만 옵저버 감시 등록
        observer.observe(figure, { attributes: true, attributeFilter: ['style'] });
    }
});

processLoadQueue();

}) ();