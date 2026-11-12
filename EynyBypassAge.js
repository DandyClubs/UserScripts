// ==UserScript==
// @name        Eyny Bypass Age
// @namespace   yanagiragi
// @include     /eyny.com/
// @version     2.4
// @run-at      document-start
// @grant		GM_addStyle
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_deleteValue
// @grant       GM_listValues
// @grant		GM_registerMenuCommand
// @description Simple Enhanced Feature of eyny.com
// @noframes
// ==/UserScript==
GM_addStyle (`
a.visited, #ct a.visited {
    color: #FF9800 !important;
}
`);

const PageURL = window.location !== window.parent.location ? document.referrer : document.location.href;

function ByPassR18Authentication() {
    const cookieArray = document.cookie.split('; ').filter(x => x.includes('lastvisit=') && !x.includes('forum_lastvisit='));
    if (cookieArray?.length) {
        const cookiePrefix = cookieArray[cookieArray.length-1].match(/(.*)_lastvisit/)?.[1];        
        if (cookiePrefix) {
            const otherCookiePrefixes = cookieArray
                .map(cookie => cookie.match(/(.*)_lastvisit/)?.[1])
                .filter(prefix => prefix && prefix !== cookiePrefix);
            const cookieNames = document.cookie
                .split(';')
                .map(cookie => cookie.trim().split('=', 1)[0]);

            otherCookiePrefixes.forEach(prefix => {
                cookieNames
                    .filter(name => name.startsWith(`${prefix}_`))
                    .forEach(name => {
                        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; Domain=.eyny.com; path=/`;
                    });
            });

            if (!getCookie(`${cookiePrefix}_agree`)) {
                document.cookie = `${cookiePrefix}_agree=576; Domain=.eyny.com; path=/`;
                document.cookie = `${cookiePrefix}_atarget=1; Domain=.eyny.com; path=/`;
            }
        }
    }
}

function getCookie(cName) {
    cName = cName + '=';
    var cookieData = document.cookie;
    var start = cookieData.indexOf(cName);
    var cValue = '';
    if(start != -1){
        start += cName.length;
        var end = cookieData.indexOf(';', start);
        if(end == -1)end = cookieData.length;
        cValue = cookieData.substring(start, end);
    }
    return unescape(cValue);
}

function getUriWithParam(baseUrl, params) {
    try {
        const url = new URL(baseUrl);
        const urlParams = new URLSearchParams(url.search);
        for (const key in params) {
            if (Object.prototype.hasOwnProperty.call(params, key) && params[key] !== undefined) {
                urlParams.set(key, params[key]);
            }
        }
        url.search = urlParams.toString();
        return url.toString();
    } catch (err) {
        console.error("Error in getUriWithParam:", err);
        return baseUrl;
    }
}



function GetFileName(path) {
    // 경로 구분자 무시하고 파일명만 추출
    const p = path.split(/[\\/]/).pop()?.replace('.html', '');
    const i = p.lastIndexOf('.');
    return i > 0 ? p.slice(0, i) : p;
}

// 1. 이미지 ID에서 숫자만 추출하는 함수
const GetPostIdFromImg = (el, viewMode = null) => {
    let img, row
    if(viewMode === 'G'){
        row = el.closest('li')
        img = row.querySelector('img.p_cover');
        if(img){
            return GetFileName(img.src);
        }
    }else{
        row = el.closest('tr');
        img = row.querySelector('td.p_pre_td img[id^="pic_"]');
        if (img) {
            // "pic_14412895" -> "14412895" 추출
            return img.id.replace('pic_', '');
        }
    }
    if(row){
        const threadLink = row.querySelector('a[href^="thread-"]');
        if (threadLink) {
            const match = threadLink.href.match(/thread-(\d+)/);
            if (match) return match[1];
        }
    }

    return null;
};

async function OrderbyDate(element) {
    element.href = await getUriWithParam(element.href, {filter: "author"});
    element.href = await getUriWithParam(element.href, {orderby: "dateline"});
}

const initVisitedListeners = (node) => {
    //console.log('Start check Visited!');
    const visitedKeys = GM_listValues().filter(e => /\d{4}-\d{2}-\d{2}/.test(GM_getValue(e)));

    let selectors = [];
    let viewMode;

    if (/forumdisplay|forum.*\.html/.test(PageURL)) {
        viewMode = document.querySelector('form#moderate ul.ml.mlt.mtw') ? 'G' : 'L';
        if (viewMode === 'L') {
            selectors.push('a.xst');
        } else {
            selectors.push('h3.ptn a, div.c.cl a.z');
        }
    } else if (PageURL.includes('home.php?mod=space')) {
        selectors.push('form#delform > table > tbody > tr > th > a');
    }else if (PageURL.includes('eyny.com/search.php?mod=forum')) {
        selectors.push('tbody tr th.common a.xst');
    }

    if (selectors.length > 0) {
        Array.from(node.querySelectorAll(selectors)).forEach((el) => {
            el.classList.add('RecordHistory');
            const postId = GetPostIdFromImg(el, viewMode);
            if (!postId) return;
            el.setAttribute('data-post-id', postId); // 요소에 ID 저장
            // 방문 여부 확인
            if (GM_getValue(postId)) {
                el.classList.add('visited');
            }

        });
    }

    Array.from(node.querySelectorAll('a.RecordHistory')).forEach((el) => {
        el.addEventListener('click', function(e) {
            let addTitle = '';
            const target = e.target.closest('a.RecordHistory') || e.target;
            if (target && target.tagName === 'A') {
                const postId = target.getAttribute('data-post-id');
                if (postId) {
                    const addDate = new Date().toISOString().slice(0, 10);
                    target.classList.add('visited');
                    GM_setValue(postId, addDate); // ID를 키로 저장
                    console.log('방문 기록 완료 (ID): ', postId, '\nAddDate: ', addDate);
                }
            }
        });
    });
};

function ClearVisited() {
    console.log('Start Delete Visited!');
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90);

    GM_listValues().forEach(key => {
        const addedDay = GM_getValue(key);
        if (addedDay && /\d{4}-\d{2}-\d{2}/.test(addedDay)) {
            const addedDate = new Date(addedDay);
            if (addedDate < ninetyDaysAgo) {
                GM_deleteValue(key);
                console.log('Delete Item: ', key, addedDay);
            }
        }
    });
}

function setClearVisited(name, value, expiresDay) {
    const NowTime = new Date();
    const MidNight = new Date(NowTime.getFullYear(), NowTime.getMonth(), NowTime.getDate() + expiresDay, 9);
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${MidNight.toUTCString()}`;
}


ByPassR18Authentication();

document.addEventListener("DOMContentLoaded", function() {    

    Array.from(document.querySelectorAll('a[href*="forumdisplay&fid"]')).forEach((el) => {
        OrderbyDate(el);
    });

    if (/viewthread/.test(PageURL)) {
        return;
    }

    const cookieCheck = getCookie("ClearVisited");
    if (!cookieCheck || cookieCheck !== "Y") {
        console.log('ClearVisited');
        ClearVisited();
        setClearVisited("ClearVisited", "Y", 1);
    }

    initVisitedListeners(document);
}, { once: true });


var onEventAutoPagerize, node;
document.addEventListener('AutoPagerize_DOMNodeInserted',onEventAutoPagerize = function(e){
    node = e.target;
    initVisitedListeners(node);
}, false);

var onEventAutoPager;
document.addEventListener('AutoPagerAfterInsert', onEventAutoPager = function(e){
    node = e.target;
    initVisitedListeners(node);
}, false);

var onEventAutoPatchWork;
document.addEventListener('AutoPatchWork.DOMNodeInserted', onEventAutoPatchWork = function(e){
    node = e.target;
    initVisitedListeners(node);
}, false);