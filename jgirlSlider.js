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

(function() {
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

    // 2. 잠시 표시된 figure가 계속 활성화될 때만 이미지를 로드
    const loadTimers = new WeakMap();
    const loadDelay = 100;

    function scheduleImageLoad(figure) {
        const img = figure.querySelector('img.lazyload-preview');
        if (!img || !img.dataset.slider || img.getAttribute('src')) return;

        const existingTimer = loadTimers.get(figure);
        if (existingTimer) clearTimeout(existingTimer);

        const timer = setTimeout(() => {
            loadTimers.delete(figure);

            if (!(parseFloat(window.getComputedStyle(figure).opacity) >= 1)) return;
            if (img.getAttribute('src')) return;

            img.fetchPriority = 'high';
            img.src = img.dataset.slider;
            img.removeAttribute('data-slider');
        }, loadDelay);

        loadTimers.set(figure, timer);
    }

    // 3. figure의 style(opacity) 변화를 감지하는 Observer 설정
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                const figure = mutation.target;
                const opacity = window.getComputedStyle(figure).opacity;

                // opacity가 1(또는 100%)이 되었을 때
                if (parseFloat(opacity) >= 1) {
                    scheduleImageLoad(figure);
                } else {
                    const timer = loadTimers.get(figure);
                    if (timer) {
                        clearTimeout(timer);
                        loadTimers.delete(figure);
                    }
                }
            }
        });
    });

    // 4. .lazyload-poster가 아닌 figure 요소들만 관찰 등록
    document.querySelectorAll('.post-item .preview-container figure').forEach(figure => {
        // 포스터 figure인 경우 옵저버 대상에서 제외
        if (figure.querySelector('.lazyload-poster')) return;

        observer.observe(figure, { attributes: true, attributeFilter: ['style'] });

        // 페이지 로드 시 이미 opacity가 1인 상태인 슬라이드 이미지 체크
        const opacity = window.getComputedStyle(figure).opacity;
        if (parseFloat(opacity) >= 1) {
            scheduleImageLoad(figure);
        }
    });

})();