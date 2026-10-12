// ==UserScript==
// @name         Forum Post Spacebar Scroller
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  포럼 게시판에서 스페이스바를 누를 때마다 다음 게시물(포스트)이 상단 10px 위치로 정확히 이동
// @author       User
// @match        https://www.forumophilia.com/*.html
// @match        http://www.planetsuzy.org/t*.html
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    // ==========================================
    // 1. 포럼 사이트별 게시물 요소 선택자(Selector) 설정
    // ==========================================
    const SITE_CONFIGS = [
        {         
            hostPattern: /forumophilia\.com$/,
            config: {
                postSelector: 'div.forumline div.row[data-post]', // 포럼 게시물 div 선택자
                topOffset: 10 // 상단 여백 (px)
            }
        },
        {            
            hostPattern: /planetsuzy\.org$/,
            config: {
                postSelector: 'div#posts [id^="post"]', // 포럼 게시물 div 선택자
                topOffset: 10 // 상단 여백 (px)
            }
        }
    ];

    // 기본(Fallback) 포럼 설정 (일반적인 게시판 구조 자동 대응)
    const DEFAULT_CONFIG = {
        postSelector: '.post, [id^="post-"]',
        topOffset: 10
    };

    // ==========================================
    // 2. Forum Scroller Engine Class
    // ==========================================
    class ForumScroller {
        constructor(config = {}) {
            this.postSelector = config.postSelector;
            this.topOffset = config.topOffset ?? 10;

            this.init();
        }

        init() {
            window.addEventListener('keydown', (e) => this.handleKeyDown(e), true);
        }

        // 화면에 실제로 보이고 공간을 차지하는 포스트만 필터링 (.hiddenbox 등 제외)
        getVisiblePosts() {
            const allPosts = Array.from(document.querySelectorAll(this.postSelector));
            return allPosts.filter(post => {
                if (post.classList.contains('hiddenbox') || post.classList.contains('hidden')) {
                    return false;
                }
                if (post.offsetParent === null) return false;

                const style = window.getComputedStyle(post);
                return style.display !== 'none' && style.visibility !== 'hidden';
            });
        }

        handleKeyDown(e) {
            // 스페이스바가 아니거나 입력창 내부이면 동작 안 함
            if (e.code !== 'Space' || 
                ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) || 
                document.activeElement.isContentEditable) {
                return;
            }

            const posts = this.getVisiblePosts();
            if (posts.length === 0) return;

            e.preventDefault();
            e.stopPropagation();

            const currentScrollTop = window.pageYOffset;
            const isShift = e.shiftKey; // Shift + Space (이전 게시물로 이동)

            if (!isShift) {
                this.scrollForward(posts, currentScrollTop);
            } else {
                this.scrollBackward(posts, currentScrollTop);
            }
        }

        // 정방향 스크롤: 다음 게시물을 상단으로 이동
        scrollForward(posts, currentScrollTop) {
            for (let i = 0; i < posts.length; i++) {
                const postTop = window.pageYOffset + posts[i].getBoundingClientRect().top;
                
                // 현재 화면 상단(여백 포함)보다 아래에 위치한 '첫 번째 게시물' 탐색
                if (postTop > currentScrollTop + this.topOffset + 10) {
                    window.scrollTo({
                        top: postTop - this.topOffset,
                        behavior: 'smooth'
                    });
                    return;
                }
            }

            // 만약 더 이상 아래에 게시물이 없다면 문서 맨 바닥으로 이동
            window.scrollTo({
                top: document.documentElement.scrollHeight,
                behavior: 'smooth'
            });
        }

        // 역방향 스크롤 (Shift + Space): 이전 게시물로 이동
        scrollBackward(posts, currentScrollTop) {
            for (let i = posts.length - 1; i >= 0; i--) {
                const postTop = window.pageYOffset + posts[i].getBoundingClientRect().top;

                // 현재 화면 상단보다 위에 위치한 게시물 탐색 (거꾸로 순회)
                if (postTop < currentScrollTop - 10) {
                    window.scrollTo({
                        top: postTop - this.topOffset,
                        behavior: 'smooth'
                    });
                    return;
                }
            }

            // 맨 위로 도달한 경우
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    }

    // ==========================================
    // 3. 초기화 및 실행부
    // ==========================================
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
            if (document.querySelector(finalConfig.postSelector)) {
                new ForumScroller(finalConfig);
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