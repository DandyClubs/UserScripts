// ==UserScript==
// @name         ADS Remover
// @namespace    http://tampermonkey.net/
// @version      2025.08.12
// @description  try to take over the world!
// @author       You
// @include      *
// @require      https://raw.githubusercontent.com/DandyClubs/RootDomain/main/RootDomain.js
// @grant		 GM_addStyle
// @run-at       document-start
// @noframes
// ==/UserScript==

const PageURL = window.location !== window.parent.location ? document.referrer : document.location.href;
const RootDomain = extractRootDomain(PageURL)


var ADLink = []

const adTagMap = {
    "naughtyblog.org": ['a[href*="https://k2s.cc/code/"]'],
    "blogjav.net": ['div:has(div .adblock_title)'],
    "justjavhd.com": ['a[href*="https://filejoker.net/w0zc3ehfs5o2"]'],
    "cosplayjav.pl": ['script[src*="vvqknwws"]', 'script[src*="belexglokmpld"]'],
    "javpink.com": ['script[src*="popcash"]'],
    "eporner.com": ['script[src*="pop4.php"]', 'div[class="ad300px-inner"]', '[class="movieplayer-box-adv-box"]'],
    "eyny.com": ['#stickthread_12029658', '#separatorline','[id^="ads_ads"]'],
    "jpavs.net": ['.mh-loop-excerpt'],
    "gomoviz.org": ['div#_atssh', 'iframe[src*="xxtxjxxvdnccc"]', 'script[src*="rndskittytor"]'],
    "pornobunny.org": ['a[href*="https://florenfile.com/free"]'],
    "xxxclub.to": ['a[href*="https://youradexchange.com/ad/visit.php"]'],
    "arcjav.com": ['.custom-header.header-media'],
    "kav.today": ['figure.wp-block-image:not(.size-large) a img'],
    "mybj.best": ['figure.wp-block-image:not(.size-large) a img'],
    "mybj.buzz": ['figure.wp-block-image:not(.size-large) a img'],
    "mybj.xyz": ['figure.wp-block-image:not(.size-large) a img'],
    "vipbj.club": ['figure.wp-block-image:not(.size-large) a img'],
    "vipbj.online": ['figure.wp-block-image:not(.size-large) a img'],
    "planetsuzy.org": ['table.ncode_imageresizer_warning'],
    "bestgirlsexy.com": ['#player-container', 'div.ipprtcnt'],
    "namethatporn.com": ['#fab_blacko'],
    "t66y.com": [`
    a[href*="av28.tv"],
    a[href*="dj134.com"],
    a[href*="337788.com"],
    a[href*="3y.ag"],
    a[href*="jbc568.com"],
    a[href*="iiggwwgg.xyz/index.html"],
    a[href*=".site"],
    a[href*=".xyz"],
    a[href*="o04y.com"],
    img[data-link*="av28.tv"],
    img[data-link*="3y.ag"],
    img[data-link*="51688.cc"],
    img[data-link*="vip0600.com"],
    img[data-link*=".xyz/index.html?mash"],
    img[data-link*="bvipsa.com"],
    img[data-link*=".site"],
    img[data-link*=".xyz"],
    img[data-link*="jbc568.com"]
  `],
    "sexy-egirls.com": ['li.g1-injected-unit'],
    "xchina.co": ['div.push-top', 'div.modal-overlay.modal-show']
};

const defaultADTag = ['.top-banner', 'script[src*="ethecountryw"]', '#popmagicldr'];

let ADTag = adTagMap[RootDomain] || defaultADTag;


function ADChange() {
    if (window.top !== window.self) return;  // iframe 내에서는 실행 안 하려면 추가 가능

    const url = window.location.href;
    const scripts = document.querySelectorAll('script');

    // 사이트별 스크립트 내부 문자열 패턴 리스트
    const sitePatterns = [
        { regex: /gm\d+\.xyz/, patterns: ['litespeed'] },
        { regex: /cyberleaks\.org/, patterns: ['crearCookie'] },
        { regex: /supjav\.com/, patterns: ['pcmload.load'] },
        { regex: /blogjav\.net/, patterns: ['termcolonialhedwig', 'earningskingdeliberately'] },
        { regex: /everia\.club/, patterns: ['adConfig'] },
        { regex: /xchina\.co/, patterns: ['AdProvider'] , closestSelectors: 'div.item'},        
        { regex: /t66y\.com/, patterns: ['var charset='] },
        { regex: /javarchive\.com/, patterns: ['//cse.google.com/adsense/search/async-ads.js'] },
        { regex: /bestvideosexy\.com/, patterns: [], iframeSandbox: true }
    ];

    // 사이트 매칭 & 처리
    for (const site of sitePatterns) {
        if (site.regex.test(url)) {
            // bestvideosexy는 iframe sandbox 처리
            if (site.iframeSandbox) {
                const iframes = document.querySelectorAll('iframe');
                for (const iframe of iframes) {
                    iframe.setAttribute('sandbox', 'allow-forms allow-pointer-lock allow-same-origin allow-scripts allow-top-navigation');
                    break;  // 첫번째 iframe만 처리
                }
                return;
            }
            if (site.closestSelectors) {
                for (const el of scripts) {
                    if (site.patterns.some(pat => el.outerHTML.includes(pat))) {
                        // console.log(el)
                        el.closest(site.closestSelectors).remove();
                    }
                }
                return;
            }

            for (const el of scripts) {
                if (site.patterns.some(pat => el.outerHTML.includes(pat))) {
                    // console.log(el)
                    el.remove();
                    break; // 해당 사이트에서 첫번째 매칭 스크립트만 삭제
                }
            }
            return;  // 사이트 처리 후 종료
        }
    }


    // 기본 fallback 처리 (기존 else 부분)
    for (const el of scripts) {
        if (el.outerHTML.includes('puURLstrpcht')) {
            // console.log(el)
            el.remove();
            break;
        }
    }

    const popMagicScripts = document.querySelectorAll('script#popmagicldr');
    for (const el of popMagicScripts) {
        // console.log(el);
        el.remove();
        break;
    }
}



// ADRemover
const SiteHandlers = [
    {
        regex: /trupornolabs\.org/,
        handler: function(node) {
            Array.from(node.querySelectorAll('div#content > table a')).forEach((el) => {
                if(el && el.textContent.includes('[decen]')){
                    el.closest('tr.gai').remove()
                }
            })
        }
    },
    {
        regex: /maxjav\.com/,
        handler: function(node) {
            const DonationLink = node.querySelector('a[href*="DONATION"]')
            if (DonationLink) {
                DonationLink.setAttribute('href', "#")
            }
        }
    },
    {
        regex: /t66y\.com/,
        handler: function(node) {
            const adImg = node.querySelector('img[iyl-data="http://a.d/adblo_ck.jpg"]')
            if(adImg) adImg.removeAttribute('iyl-data')

            const Img = node.querySelector('div.image-big img')
            if(Img) Img.replaceWith(Img)

            const tableAd = node.querySelector('div.tips table.sptable_do_not_remove')
            if(tableAd) tableAd.closest('div.tips').remove()
        }
    },
    {
        regex: /xchina\.co|1909\.me/,
        handler: function(node) {
            Array.from(node.querySelectorAll('a[clickmode]')).forEach((el) => {
                el.closest('div.item') ? el.closest('div.item').remove() : el.remove()
            })

            Array.from(node.querySelectorAll('div.exoclick_300x250, div.item._300x250')).forEach((el) => {
                el.closest('div.item') ? el.closest('div.item').remove() : el.remove()
            })

            const btn = node.querySelector('div.swal2-actions > button')
            if(btn) btn.click()

            const modal = document.querySelector('body')
            if(modal && modal.classList.contains('modal-open')) {
                modal.classList.remove('modal-open')
            }
        }
    },
    {
        regex: /eyny\.com\/forum\.php\?mod=viewthread|eyny\.com\/thread.*\.html/,
        handler: function(node) {
            let MouseOver = [...node.querySelectorAll('img.zoom, span#visitedforums')]
            MouseOver.forEach(function (item) {
                item.removeAttribute('onmouseover')
            })
        }
    },
    {
        regex: /newtoki\d+\.com/,
        handler: function(node) {
            document.querySelector('div.id_bbn') ? document.querySelector('div.id_bbn').remove() : ''
            document.querySelector('div.board-tail-banner') ? document.querySelector('div.board-tail-banner').remove() : ''
            document.querySelector('div.basic-banner') ? document.querySelector('div.basic-banner').remove() : ''
        }
    },
    {
        regex: /namu\.wiki/,
        handler: function(node) {
            ADLink = document.querySelector('img[src*="ww.namu.la/s"]')
            if(ADLink){
                ADLink.closest('table').remove()
            }
        }
    },
    {
        regex: /jpavs\.net(?!.*\.html)/,
        handler: function(node) {
            ADLink = node.querySelectorAll('div.collapseomatic_content')
            if(!ADLink){ return }
            for(let i = 0; i < ADLink.length; i++){
                ADLink[i].style.setProperty('display', 'none')
            }
        }
    },
    {
        regex: /map\.naver\.com/,
        handler: function(node) {
            ADLink = document.querySelector('div.promotion_wrap')
            if(ADLink){
                ADLink.remove()
                //ADLink.closest('dynamic-content-outlet.ng-star-inserted') ? ADLink.closest('dynamic-content-outlet.ng-star-inserted').remove() : ''
            }
        }
    },
    {
        regex: /hpjav\.tv/,
        handler: function(node) {
            ADLink = node.querySelector('video#vplayer') || node.querySelector('div.bottom-ad')
            if(ADLink){
                ADLink.closest('div').remove()
            }
        }
    }
]

function ADRemover(node) {
    const url = window.location.href
    let TextRegex
    let nodes

    for (const { regex, handler } of SiteHandlers) {
        if (regex.test(url)) {
            handler(node)
            break
        }
    }

    if(ADTag){
        ADTag.forEach(function (item) {
            var removeDoms = [...node.querySelectorAll(item)]
            removeDoms.forEach(function (removeDom) {
                // console.log('Remove Element: ', removeDom)
                if(removeDom.closest('div.image-big')){
                    // console.log(removeDom)
                    removeDom.closest('div.image-big').remove()
                }
                else if(removeDom.tagName === 'A' && removeDom.closest('b')){
                    // console.log(removeDom)
                    removeDom.closest('b').remove()
                }
                else{
                    // console.log(removeDom)
                    removeDom.remove()
                }
            })
        })
    }
}

// c.f. MutationObserver
// https://developer.mozilla.org/ja/docs/Web/API/MutationObserver
const SiteMutationHandlers = [
    {
        regex: /sexy-egirls\.com/,
        handler: () => {
            document.querySelectorAll('li.g1-injected-unit').forEach(el => el.remove())
        }
    },
    {
        regex: /youtube\.com/,
        handler: () => {
            if (window.top !== window.self) return

            document.querySelectorAll('ytd-ad-slot-renderer').forEach(el => {
                const container = el.closest('ytd-rich-item-renderer')
                if (container) container.remove()
                else el.remove()
            })

            document.querySelectorAll('ytd-companion-slot-renderer, div#player-ads').forEach(el => el.remove())
        }
    },
    {
        regex: /sehuatang\.net/,
        handler: () => {
            document.querySelectorAll('div[style*="static/image/common/loading.gif"]').forEach(el => el.remove())
            document.querySelectorAll('img.zoom').forEach(el => el.removeAttribute("style"))
        }
    },
    {
        regex: /sis001\.com\/forum\/forum.+/,
        handler: () => {
            MatchRegex(document, /thread/, 'id').forEach(el => {
                if (/人妖|厕拍|T娘|CR成人频道源码录影|女如厕|印地语热门/.test(el.innerText)) {
                    el.remove()
                } else {
                    const match = /(\[|【)(\d+\.?\d+)MB?\//.exec(el.innerText)
                    if (match && parseFloat(match[2]) < 100) el.remove()
                }
            })
        }
    },
        {
        regex: /xchina\.co/,
        handler: () => {
            document.querySelectorAll('div.content-box div.list.photo-list div.item div.tag div.series').forEach(el => {
                if (/广告/.test(el.innerText)) {
                    el.closest('div.item').remove()
                }
            })
        }
    },
    {
        regex: /sis001\.com\/forum\/thread.+/,
        handler: () => {
            document.querySelectorAll('img[src*="attachments"]').forEach(el => {
                el.removeAttribute("onmouseover")
            })
        }
    },
    {
        regex: /t66y\.com\/thread.+/,
        handler: () => {
            document.querySelectorAll('table#ajaxtable tbody#tbody tr.t_one.tac td.tal h3 a[href*=".html"]').forEach(el => {
                if (/人妖|厕拍|T娘|CR成人频道源码录影|女如厕|印地语热门|VIP8852|女厕/.test(el.innerText)) {
                    el.closest('tr.tr3.t_one.tac').remove()
                }
            })
        }
    }
]

const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        for (const added of mutation.addedNodes) {
            if (added.nodeType === Node.ELEMENT_NODE) {
                ADRemover(added)  // 기존 광고 제거 함수
            }
        }
    })

    const currentURL = window.location.href
    for (const { regex, handler } of SiteMutationHandlers) {
        if (regex.test(currentURL)) {
            handler()
            break
        }
    }
})


document.addEventListener("DOMContentLoaded", function(event) {
    ADChange()
    ADRemover(document)
    observer.observe(document, {childList: true, subtree: true})
})

function getElementsByTextContent(node, tag, regex) {
    const results = Array.from(node.querySelectorAll(tag))
    .reduce((acc, el) => {
        if (el.textContent && el.textContent.match(regex) !== null) {
            acc.push(el);
        }
        return acc;
    }, []);
    return results;
}



//Match
function MatchRegex(Area, regex, attributeToSearch) {
    //// console.log(Area, regex, attributeToSearch)
    const output = [];
    if (attributeToSearch) {
        for (let element of Area.querySelectorAll(`[${attributeToSearch}]`)) {
            //// console.log(regex.test(element.getAttribute(attributeToSearch)), element)
            if (regex.test(element.getAttribute(attributeToSearch))) {
                //// console.log(element)
                output.push(element);
            }
        }
    } else {
        for (let element of Area.querySelectorAll('*')) {
            for (let attribute of element.attributes) {
                if (regex.test(attribute.value)) {
                    //// console.log(element)
                    output.push(element);
                }
            }
        }
    }
    return output;
}