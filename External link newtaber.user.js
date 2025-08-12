// ==UserScript==
// @name            External link newtaber MOD (Pipeline Refactored)
// @version         2025.08.12
// @description     Fully refactored with a rule pipeline for maximum clarity and maintainability.
// @icon            https://cdn1.iconfinder.com/data/icons/feather-2/24/external-link-32.png
// @icon64          https://cdn1.iconfinder.com/data/icons/feather-2/24/external-link-128.png
// @run-at          document-start
// @include         *
// @exclude         /qqupload.com/
// @exclude         /drive.google.com/
// @exclude         /fruitpan.com/
// @exclude         /feimaoyun.com/
// @exclude         *.jpg
// @exclude         /bbs\/mypost\.php/
// @require         https://raw.githubusercontent.com/DandyClubs/RootDomain/main/RootDomain.js
// @grant           GM_openInTab
// ==/UserScript==

(function () {

    function removeGscHash() {
        if (location.hash && location.hash.startsWith('#gsc.tab=')) {
            history.replaceState(null, '', location.pathname + location.search);
        }
    }

    // 페이지 로드 전에도 한번 제거
    if (location.hash && location.hash.startsWith('#gsc.tab=')) {
        removeGscHash();
    }

    // 해시 변경 시 제거
    window.addEventListener('hashchange', removeGscHash, false);

    // 혹시 로드 완료 후 붙는 경우를 위해 딜레이 체크
    window.addEventListener('load', () => {
        if (location.hash && location.hash.startsWith('#gsc.tab=')) {
            setTimeout(removeGscHash, 50);
        }
    }, { once: true });


    // --- 전역 변수 ---
    const PageURL = window.location !== window.parent.location ? document.referrer : document.location.href;
    const RootDomain = extractRootDomain(PageURL);

    // --- 재사용 가능한 행동(Action) 정의 ---
    const RuleActions = {
        NEW_TAB: (el) => el.setAttribute('target', '_blank'),
        SAME_TAB: (el) => el.setAttribute('target', '_self'),
        REMOVE_TARGET: (el) => el.removeAttribute('target'),
        NEW_TAB_NO_HASH: (el) => {
            el.href = el.href.replace(/#.*/, '');
            el.setAttribute('target', '_blank');
        },
    };
    // --- 규칙 데이터 ---
    const alwaysNewTabPatterns = [
        // 개별 사이트 및 패턴 규칙
        /20pie\.com.*\.html/,
        /avcensdownload.pro\/video(?!tag)/,
        /.\/viewtopic.php\?(f|t|id)/,
        /forum\/viewtopic\.php\?t/,
        /hdreactor\.club.*\.html/,
        /hiderefer/,
        /itorrents.+torrent$/,
        /javarchive\.com\/\d{6}.*\.html/,
        /javfree\.me\/\d+/,
        /javpink\.com\/\?p=/,
        /jpavs.net\/.+htm/,
        /justjavhd\.com\/\d{4}\//,
        /k2sporn\.com\/\d+.*\.html/,
        /littlecaprice-dreams\.com\/project/,
        /namethatporn\.com\/post\/\d+/,
        /porndoe\.com\/watch\//,
        /pornrips\.cc.*\.html/,
        /showthread\.php\?(p|t)\d+/,
        /sukebei.nyaa.si\/view/,
        /teenpornb.com\/.+.html$/,
        /top-modelz\.org.*\.html/,
        /trupornolabs.org\/torrent\/\d/,
        /ultoporn\.com\/\d+.*\.html/,
        /wdupload.com/,
        /xxxclub\.to\/torrents\/details\//,
        /\/torrent\/.+/,
        /cosplay\.jav\.pw\/\d{4,5}/,
        /pornofetishx\.com\/\d+.+\.html$/,
    ];

    const sameNewTabPatterns = [
        // 특정 프로토콜 및 파일 확장자
        /^javascript/,
        /^magnet:/,
        /attachments\/.*torrent/,

        // 다운로드 및 리디렉션 사이트
        /bdzone.xyz/,
        /busdisk.net\/dl.php/,
        /filecrypt.cc\/Container\/.+\.html/,
        /gomoviz/,
        /hentaiprn/,
        /rosefile.net\/d/,
        /viewtopic.php.+&start/,

        // 페이지네이션
        /\/page\/\d+/,

        // 광고 또는 링크 단축 서비스
        /destyy/,
        /ecotechi/,
        /infotaxco/,
        /indian4uh/,
        /keettech/,
        /newsteez/,
        /parentingss/,
        /pustkala/,
        /sankakucomplex/,
        /shrtfly/,
        /slink/,
        /smwebs/,
        /techgul/,
        /techodrop/,
        /trendlouds/,
        /wikiall/,
    ];

    const specializedRulesData = [
        { site: /allasiangirls\.net/, c: el => el.classList.contains('plain'), a: 'NEW_TAB' },
        { site: /asianscan\.biz/, c: el => el.closest('div.mainf'), a: 'NEW_TAB' },
        { site: /bo_table=(AVSubs_E|AVSubs_M|AVSubs_S|AVSubs_C)/, c: el => /bo_table=(AVSubs_E|AVSubs_M|AVSubs_S|AVSubs_C)&wr_id/.test(el.href), a: 'NEW_TAB' },
        { site: /eyny\.com/, c: el => /圖片模式/.test(el.textContent), a: 'SAME_TAB' },
        { site: /porndude\.tv/, c: el => el.closest('article.movie-item'), a: 'NEW_TAB' },
        { site: /thotsbay|cyberleaks/, c: el => el.parentElement.classList.contains('structItem-title'), a: 'NEW_TAB' },
        { site: /theleaksbay\.com/, c: el => el.classList.contains('image-link'), a: 'NEW_TAB' },
        { site: /xxx-sharing\.net/, c: el => el.getAttribute('id')?.match(/thread_title/), a: 'NEW_TAB' },
        { site: /yandex\.com\/search/, c: el => el.classList.contains('OrganicTitle-Link') || el.closest('a.OrganicTitle-Link'), a: 'NEW_TAB' },
        { site: /.*/, c: el => el.closest('.infy-scroll-divider'), a: 'SAME_TAB' },
        { site: /.*/, c: (el, ctx) => !/google\.com\/search/.test(ctx.PageURL) && /\/bbs\/board\.php.*wr_id|category\/movie\/av/.test(el.href), a: 'REMOVE_TARGET' },
        { site: /^https:\/\/section\.cafe\.naver\.com\/ca-fe\/home\/search\/articles/, c: el => /cafe\.naver\.com\/.+\?iframe_url/.test(el.href), a: 'SAME_TAB' },
    ];

    const classBasedNewTabPatterns = {
        class: [
            /edn/,
            /entry-title/,
            /item_media/,
            /item_title/,
            /more-link/,
            /ou_item/,
            /PreviewTooltip/,
            /preview_post/,
            /rel-link/,
            /screenshot/,
            /td-image-wrap/,
            /th-title/,
            /title.threadtitle/,
            /xst/,
        ],
        id: [
            /js-XFUniqueId/,
            /thread_title/,
        ],
        parentClass: [
            /article/,
            /ast-blog-single-element/,
            /elementor-post/,
            /entry-featured-media/,
            /entry-title/,
            /featured-image/,
            /post-content/,
            /post-thumbnail/,
            /post-title/,
            /post_category/,
            /post_thumb_top/,
            /short-title/,
            /structItem-iconContainer/,
            /td-image-wrap/,
            /topnews-x/,
            /thumbnail-link/,
            /thumbnail/,
        ]
    };

    const classBasedBlockPatterns = [
        /btn-success/,
        /down_now/,
        /page/,
    ];

    const downloadLinkPatterns = [
        /\.(?:zip|rar|7z|torrent|exe)$/i
    ];

    const newTabNoHashPatterns = [
        /edn/,
        /entry-title/,
        /item_media/,
        /item_title/,
        /more-link/,
        /ou_item/,
        /PreviewTooltip/,
        /preview_post/,
        /rel-link/,
        /screenshot/,
        /td-image-wrap/,
        /th-title/,
        /title.threadtitle/,
        /xst/,
    ];


    function findLinkElement(target) {
        let currentElement = target;
        let depth = 0;
        const maxDepth = 5;

        while (currentElement && depth < maxDepth) {
            if (currentElement.nodeName === "BUTTON" || currentElement.nodeName === "INPUT" || currentElement.nodeName === "BODY") {
                console.log(`Clicked on a button or input, returning ${currentElement.nodeName}`)
                return null;
            }
            if (currentElement.nodeName === 'A') {
                return currentElement;
            }
            currentElement = currentElement.parentElement;
            depth++;
        }

        return null;
    }

    // --- ✨ 통합 규칙 파이프라인 ✨ ---
    const rulePipeline = [
        // 1. 최우선: 항상 새 탭 규칙
        {
            name: 'Always New Tab',
            condition: (el) => alwaysNewTabPatterns.some(rx => rx.test(el.href)),
            action: RuleActions.NEW_TAB,
        },
        // 2. 차단 규칙
        {
            name: 'Block New Tab',
            condition: (el) => sameNewTabPatterns.some(rx => rx.test(el.href)),
            action: RuleActions.REMOVE_TARGET,
        },

        // 3. 사이트별 특수 규칙
        ...specializedRulesData.map(rule => ({
            name: `Specialized: ${rule.site.toString().slice(1, 20)}...`,
            condition: (el, context) => rule.site.test(context.PageURL) && rule.c(el, context),
            action: RuleActions[rule.a],
        })),

        // --- ✨ 규칙 재구성 ✨ ---
        // 4. 다운로드 링크 규칙
        {
            name: 'Download Link',
            condition: (el) => downloadLinkPatterns.some(rx => rx.test(el.href)) && !/nitroflare|rapidgator|k2s\.cc/.test(el.href),
            action: RuleActions.REMOVE_TARGET,
        },
        // 5. 클래스 기반 차단 규칙
        {
            name: 'Class: Download/Page Button',
            condition: (el) => Array.from(el.classList).some(cls => classBasedBlockPatterns.some(rx => rx.test(cls))),
            action: RuleActions.REMOVE_TARGET,
        },
        // 6. 클래스/ID 기반 새 탭 규칙
        {
            name: 'Class/ID: Thread Title & Preview Post',
            condition: (el) =>
                (classBasedNewTabPatterns.id.some(rx => MatchRegexElement(el, rx, 'id'))) ||
                (classBasedNewTabPatterns.class.some(rx => MatchRegexElement(el, rx, 'class'))) ||
                (classBasedNewTabPatterns.parentClass.some(rx => {
                    // 정규식의 소스를 사용하여 CSS 선택자를 만듭니다 (예: "/post-title/" -> ".post-title")
                    const selector = '.' + rx.source.replace(/\\/g, '');
                    // closest()를 사용하여 가장 가까운 조상 요소가 선택자와 일치하는지 확인합니다.
                    return el.closest(selector) !== null;
                })),
            action: RuleActions.NEW_TAB,
        },
        // 7. 해시(#) 제거 규칙
        {
            name: 'Class: Preview Post with no hash',
            condition: (el) => Array.from(el.classList).some(cls => newTabNoHashPatterns.some(rx => rx.test(cls))),
            action: RuleActions.NEW_TAB_NO_HASH,
        },
        // --- ✨ 규칙 재구성 끝 ✨ ---


        // 8. 최후 규칙: 도메인이 다를 경우
        {
            name: 'Different Domain',
            condition: (el, context) => extractRootDomain(el.host) !== context.RootDomain,
            action: RuleActions.NEW_TAB,
        },
    ];

    /**
     * 규칙 파이프라인을 실행하여 링크에 적용합니다.
     * @param {HTMLAnchorElement} el - 클릭된 앵커(<a>) 태그 요소
     */
    function applyLinkRules(el, isAltKeyPressed) {
        const context = { PageURL, RootDomain };

        for (const rule of rulePipeline) {
            if (rule.condition(el, context)) {
                if (isAltKeyPressed) {
                    return rule.name;
                }
                // console.log(`Rule Matched: ${rule.name}`); // 디버깅 시 이 줄의 주석을 해제하세요.
                rule.action(el);
                return; // 첫 번째 일치하는 규칙을 적용하고 즉시 종료
            }
        }
        return 'No Matching Rule';
    }


    // --- 이벤트 리스너 및 헬퍼 함수 (이전과 동일) ---
    document.addEventListener('click', (event) => {
        const isAltKeyPressed = event.altKey
        if (event.target.nodeName === "BUTTON" || event.target.nodeName === "INPUT" || event.target.nodeName === "BODY") {
            return;
        }
        const linkElement = findLinkElement(event.target);
        if (event.altKey) {
            event.preventDefault();
            const ruleName = applyLinkRules(linkElement, isAltKeyPressed)
            console.log(`[ALT 클릭]`, {
                '링크 요소': event.target,
                '링크 URL': linkElement.href,
                '적용된 규칙': ruleName
            });
            return
        }
        ;
        if (linkElement && linkElement.href && !linkElement.href.startsWith(location.href + '#')) {
            applyLinkRules(linkElement);
        }
    });

    function MatchRegexElement(target, regex, attributeToSearch) {
        if (attributeToSearch === 'class') {
            return Array.from(target.classList).some(className => regex.test(className));
        } else {
            const attributeValue = target.getAttribute(attributeToSearch);
            return attributeValue ? regex.test(attributeValue) : false;
        }
    }

})();
