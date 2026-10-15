// ==UserScript==
// @name         Forum Post Spacebar Scroller (No Reflow)
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  getBoundingClientRect 없이 offsetTop 기반으로 포럼 게시물 간 스페이스바 이동
// @author       User
// @match        https://www.forumophilia.com/*.html
// @match        http://www.planetsuzy.org/t*.html
// @match        https://www.pornbb.org/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    const SITE_CONFIGS = [
        {
            hostPattern: /forumophilia\.com$/,
            config: {
                postSelector: 'div.forumline div.row[data-post]',
                topOffset: 15
            }
        },
        {
            hostPattern: /planetsuzy\.org$/,
            config: {
                postSelector: 'div#posts table[id^="post"]',
                topOffset: 15
            }
        },
        {
            hostPattern: /pornbb\.org$/,
            config: {
                postSelector: 'div.forumline > div:has(div.post-head)',
                topOffset: 15
            }
        }
    ];

    const DEFAULT_CONFIG = {
        postSelector: '.post, [id^="post-"]',
        topOffset: 10
    };

    // 문서 최상단 기준 절대 Y 좌표를 구하는 유틸리티 함수 (getBoundingClientRect 대체)
    function getAbsoluteTop(element) {
        let top = 0;
        let current = element;
        while (current) {
            top += current.offsetTop;
            current = current.offsetParent;
        }
        return top;
    }

    class ForumScroller {
        constructor(config = {}) {
            this.postSelector = config.postSelector;
            this.topOffset = config.topOffset ?? 10;
            this.init();
        }

        init() {
            window.addEventListener('keydown', (e) => this.handleKeyDown(e), true);
        }

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
            const isShift = e.shiftKey;

            if (!isShift) {
                this.scrollForward(posts, currentScrollTop);
            } else {
                this.scrollBackward(posts, currentScrollTop);
            }
        }

        scrollForward(posts, currentScrollTop) {
            // 페이지 최상단 부근에 있고 게시물이 2개 이상인 경우, 첫 스크롤 시 무조건 두 번째 요소(posts[1])로 이동
            if (currentScrollTop < 100 && posts.length > 1) {
                const postTop = getAbsoluteTop(posts[1]);
                window.scrollTo({
                    top: postTop - this.topOffset,
                    behavior: 'smooth'
                });
                return;
            }

            for (let i = 0; i < posts.length; i++) {
                const postTop = getAbsoluteTop(posts[i]); // getBoundingClientRect 제거

                if (postTop > currentScrollTop + this.topOffset + 10) {
                    window.scrollTo({
                        top: postTop - this.topOffset,
                        behavior: 'smooth'
                    });
                    return;
                }
            }

            window.scrollTo({
                top: document.documentElement.scrollHeight,
                behavior: 'smooth'
            });
        }

        scrollBackward(posts, currentScrollTop) {
            for (let i = posts.length - 1; i >= 0; i--) {
                const postTop = getAbsoluteTop(posts[i]); // getBoundingClientRect 제거

                if (postTop < currentScrollTop - 10) {
                    window.scrollTo({
                        top: postTop - this.topOffset,
                        behavior: 'smooth'
                    });
                    return;
                }
            }

            window.scrollTo({
                top: 0,
                behavior: 'smooth'
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