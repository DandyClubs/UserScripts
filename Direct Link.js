// ==UserScript==
// @name         Direct Link (Refactored)
// @description  Strips jump page.
// @namespace    sandbox
// @include      *
// @version      2
// @include      https://araishi.com/redirect-check/*
// @exclude      /feimaoyun\.com/
// @connect      *
// @grant        GM_xmlhttpRequest
// @grant        GM_log
// @run-at       document-body
// @noframes
// ==/UserScript==

// 전역 상수 및 변수 정의
const PageURL = window.location !== window.parent.location ? document.referrer : document.location.href;
const araishiURL = "https://araishi.com/redirect-check/?submit=&url=";
const ExcludeChar = /[<\/:>*?"|\\]/g;

// 도메인별 실패 링크를 수집하는 저장소
const failedLinksMap = new Map();
// 현재 인증 대기 중인 도메인 셋
const pendingAuthDomains = new Set();

/**
 * GM_xmlhttpRequest 래퍼 (Cloudflare 및 403 에러 감지 포함)
 */
function gmRequest(options) {
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            ...options,
            onload: function (response) {
                // Cloudflare 브라우저 확인 페이지 또는 403 Forbidden 감지
                if (response.responseText.includes('cf-browser-verification') ||
                    response.responseText.includes('id="cf-wrapper"')) {
                    reject(new Error('CF_OR_FORBIDDEN'));
                    return;
                } else if (response.status === 403) {
                    reject(new Error(response.status));
                }
                resolve(response);
            },
            onerror: (err) => reject(err),
            ontimeout: () => reject(new Error('Timeout'))
        });
    });
}


if (window.location.hostname === 'araishi.com') {
    // 팝업 내부의 로딩 표시 (선택 사항: 사용자에게 상황 인지 시킴)
    document.addEventListener('DOMContentLoaded', () => {
        if (!document.querySelector('#challenge-running')) {
            const loader = document.createElement('div');
            loader.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(255,255,255,0.8); display:flex; align-items:center; justify-content:center; z-index:999999; font-family:sans-serif;";
            loader.innerHTML = "<div><b>분석 중입니다...</b><br>결과가 나오면 창이 자동으로 닫힙니다.</div>";
            document.body.appendChild(loader);
        }
    });

    const araishiObserver = new MutationObserver(() => {
        // 결과 확인
        checkResult();
    });

    araishiObserver.observe(document.documentElement, { childList: true, subtree: true });
    checkResult();

    function checkResult() {
        const rows = document.querySelectorAll('.table tbody tr');
        if (rows.length > 0) {
            const lastRow = rows[rows.length - 1];
            const cells = lastRow.querySelectorAll('td');
            if (cells.length >= 2 && cells[1].textContent.includes('http')) {
                const finalUrl = cells[1].textContent.trim();
                // 부모 창으로 데이터 전송
                window.opener.postMessage({ type: 'ARAISHI_RESULT', url: finalUrl }, "*");
                araishiObserver.disconnect();
                window.close(); // 분석 완료 시 즉시 닫기
            }
        }
    }
    return;
}

// -----------------------------------------------------------------------------
// [파트 2] 메인 페이지 로직
// -----------------------------------------------------------------------------
let currentResolver = null;

window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'ARAISHI_RESULT' && currentResolver) {
        currentResolver(event.data.url);
        currentResolver = null;
    }
});

/**
 * Firefox 보안 정책에 맞춰 처음부터 중앙에 팝업을 생성
 */
function getUrlViaSmartPopup(targetUrl) {
    return new Promise((resolve) => {
        currentResolver = resolve;

        const w = 600, h = 600;
        // Firefox에서 중앙 좌표 계산
        const left = window.screenX + (window.outerWidth - w) / 2;
        const top = window.screenY + (window.outerHeight - h) / 2;

        const popup = window.open(
            araishiURL + encodeURIComponent(targetUrl),
            'araishi_worker',
            `width=${w},height=${h},left=${left},top=${top},scrollbars=no,resizable=yes`
        );

        if (!popup) {
            alert("팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.");
            resolve(null);
            return;
        }

        // 사용자가 수동으로 창을 닫았는지 감시
        const timer = setInterval(() => {
            if (popup.closed) {
                clearInterval(timer);
                if (currentResolver) {
                    resolve(null);
                    currentResolver = null;
                }
            }
        }, 1000);
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * 동일 도메인 링크를 큐에서 빼내어 보관하고 알림을 띄움
 */
function isolateDomainAndAlert(domain, triggerUrl) {
    if (pendingAuthDomains.has(domain)) return;
    pendingAuthDomains.add(domain);

    if (!failedLinksMap.has(domain)) failedLinksMap.set(domain, []);

    // 큐 순회하며 동일 도메인 격리
    for (let i = requestQueue.length - 1; i >= 0; i--) {
        try {
            if (new URL(requestQueue[i].href).hostname === domain) {
                failedLinksMap.get(domain).push(requestQueue[i]);
                requestQueue.splice(i, 1);
            }
        } catch (e) { }
    }

    showCloudflareAlert(triggerUrl, domain);
}

/**
 * 수동 인증 알림 및 실제 성공 여부 검증(Ping)
 */
function showCloudflareAlert(url, domain) {
    const alertId = `cf-alert-${domain.replace(/\./g, '-')}`;
    if (document.getElementById(alertId)) return;

    const box = document.createElement('div');
    box.id = alertId;
    box.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: #fff;
        border: 1px solid #e0e0e0;
        padding: 20px;
        border-radius: 12px;
        font-family: 'Inter', sans-serif;
        z-index: 9999;
        box-shadow: 0 8px 20px rgba(0,0,0,0.1);
        max-width: 400px;
        color: #333;
        line-height: 1.5;
        display: flex;
        align-items: center;
        gap: 16px;
    `;
    box.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-alert"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
        <div>
            <div style="font-weight: bold; font-size: 1.2em; color: #2563eb; margin-bottom: 4px;">Cloudflare 보안 챌린지</div>
            <div>
                새 창이 열립니다. 보안 확인을 수동으로 완료해주세요.
                그 후 스크립트가 자동으로 다시 작동합니다.
            </div>
            <button id="btn-${alertId}" style="
                margin-top: 12px;
                padding: 8px 16px;
                background-color: #2563eb;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 500;
                transition: background-color 0.2s;
            ">확인 창 열기</button>
        </div>
    `;
    document.body.appendChild(box);

    document.getElementById(`btn-${alertId}`).onclick = () => {
        const authWin = window.open(url, '_blank', 'width=1000,height=800');

        const checkTimer = setInterval(async () => {
            if (authWin.closed) {
                clearInterval(checkTimer);
                console.log(`[검증] ${domain} 인증 상태 확인 중...`);

                try {
                    // 실제로 뚫렸는지 HEAD 요청으로 확인 (200 OK 여부)
                    const check = await gmRequest({ method: "HEAD", url: url, timeout: 5000 });
                    if (check.status === 200) {
                        console.log(`[복구] ${domain} 인증 성공! 작업을 재개합니다.`);
                        box.remove();
                        pendingAuthDomains.delete(domain);
                        resumeLinks(domain);
                    } else {
                        alert("인증이 완료되지 않은 것 같습니다. 다시 시도해주세요.");
                    }
                } catch (e) {
                    console.error("검증 요청 실패 (여전히 차단 상태)");
                }
            }
        }, 1000);
    };
}


async function getFinalUrl(startUrl) {
    const domain = new URL(startUrl).hostname;

    // 이미 인증 대기 중인 도메인이라면 즉시 중단 (큐에서 격리될 예정)
    if (pendingAuthDomains.has(domain)) {
        throw new Error('DOMAIN_LOCKED');
    }
    try {
        console.log(`추적 시작: ${startUrl}`);

        // 1. 일차적으로 HTTP 리다이렉션을 따라감
        const response = await gmRequest({
            method: "GET",
            url: startUrl,
            // anonymous: true, // 필요 시 쿠키 없이 요청
        });

        let finalUrl = response.finalUrl || startUrl;

        // 2. HTML 내부에 자바스크립트나 Meta Refresh 리다이렉션이 있는지 확인 (심화)
        // 일부 광고 사이트나 리다이렉트 페이지는 200 OK를 띄우고 내부 스크립트로 이동시킵니다.
        const html = response.responseText;

        // Meta Refresh 체크: <meta http-equiv="refresh" content="0;url=...">
        const metaMatch = html.match(/<meta[^>]*http-equiv=["']refresh["'][^>]*url=([^"'>]+)["']/i);
        if (metaMatch && metaMatch[1]) {
            const nextUrl = new URL(metaMatch[1].trim(), finalUrl).href;
            if (nextUrl !== startUrl) {
                console.log(`Meta Refresh 감지 -> 다음 단계로 이동: ${nextUrl}`);
                return await getFinalUrl(nextUrl); // 재귀 호출
            }

        }
        /*
        // 자바스크립트 location.href 체크 (단순 패턴)
        if (html.includes("window.location.href") || html.includes("location.replace")) {
            const jsMatch = html.match(/location\.(?:href|replace)\s*=\s*['"]([^'"]+)['"]/);
            if (jsMatch && jsMatch[1]) {
                const nextUrl = new URL(jsMatch[1], finalUrl).href;
                if(nextUrl !== startUrl){
                    console.log(`JS 리다이렉션 감지 -> 다음 단계로 이동: ${nextUrl}`);
                    return await getFinalUrl(nextUrl); // 재귀 호출
                }
            }
        }
        */

        console.log(`최종 목적지 도착: ${finalUrl}`);
        return finalUrl;

    } catch (error) {
        if (error.message === '403') {
            console.warn("[직접 추적 실패] Araishi 백그라운드 분석기를 가동합니다.");
            const result = await getUrlViaSmartPopup(startUrl);
            if (result) return result;
            throw error;
        } else if (error.message === 'CF_OR_FORBIDDEN') {
            // 2단계: Araishi 우회 시도
            const araishiResult = await getUrlViaSmartPopup(startUrl);
            if (araishiResult && araishiResult !== startUrl) {
                return araishiResult;
            }
            // 3단계: 모두 실패 시 패턴 격리 및 수동 인증 유도
            isolateDomainAndAlert(domain, startUrl);
        }
        throw error;
    }
}

function traceRedirect(url, maxRedirect = 10) {
    return new Promise(resolve => {
        const steps = [];
        function request(currentUrl, depth) {
            GM_xmlhttpRequest({
                method: "GET",
                url: currentUrl,
                redirect: "manual",
                onload: function (res) {
                    const status = res.status;
                    // Location 헤더 찾기
                    const locationMatch = res.responseHeaders.match(/location:\s*(.*)/i);
                    const nextUrl = locationMatch ? locationMatch[1].trim() : null;

                    steps.push({
                        url: currentUrl,
                        status: status,
                        next: nextUrl
                    });

                    if (nextUrl && status >= 300 && status < 400 && depth < maxRedirect) {
                        request(nextUrl, depth + 1);
                    } else {
                        resolve(steps);
                    }
                },

                onerror: function () {
                    resolve(steps);
                }

            });

        }
        request(url, 0);
    });
}

async function analyzeClearTv(url) {
    const chain = await traceRedirect(url);
    const finalUrl = chain[chain.length - 1].url;
    console.log("Final Page:", finalUrl);
    return finalUrl;
}

/**
 * URL을 요청하고 응답의 HTML에서 <meta http-equiv="refresh"> 태그의 URL을 추출합니다.
 * @param {string} url - 요청할 URL
 * @returns {Promise<string|null>} 추출된 URL 또는 null
 */
async function getUrlFromMetaRefresh(url) {
    try {
        const response = await gmRequest({ url: url, method: 'GET' });
        const parser = new DOMParser();
        const doc = parser.parseFromString(response.responseText, 'text/html');
        const refreshMeta = doc.querySelector('meta[http-equiv="refresh"]');
        if (refreshMeta) {
            const content = refreshMeta.content;
            const match = content.match(/url=(.*)/i);
            if (match && match[1]) {
                return match[1];
            }
        }
    } catch (e) {
        console.error("meta refresh URL을 가져오는 데 실패했습니다:", e);
    }
    return null;
}

// =============================================================================
// 기존 헬퍼 함수 (변경 없음)
// =============================================================================

function removeUriWithParam(baseUrl, key) {
    try {
        const Url = new URL(baseUrl);
        const urlParams = new URLSearchParams(Url.search);
        const keys = Array.isArray(key) ? key : [key];

        keys.forEach(k => urlParams.delete(k));
        Url.search = urlParams.toString() ? `?${urlParams.toString()}` : '';
        return Url.toString();
    } catch (err) {
        console.error(err);
        return baseUrl;
    }
}

function UpdateParam(baseUrl, key, val) {
    try {
        const Url = new URL(baseUrl);
        const urlParams = new URLSearchParams(Url.search);
        urlParams.set(key, val);
        Url.search = urlParams.toString();
        return Url.toString();
    } catch (err) {
        console.error(err);
        return baseUrl;
    }
}

function getRedirectUrl(url, paramName) {
    try {
        // 1. URL 객체를 사용하여 파라미터를 추출 (현대적인 방식)
        const urlObj = new URL(url);
        const params = new URLSearchParams(urlObj.search);
        const redirectUrl = params.get(paramName);

        // 2. 결과값이 있으면 디코딩하여 반환, 없으면 원본 URL 반환
        return redirectUrl ? decodeURIComponent(redirectUrl) : url;
    } catch (e) {
        console.error("Error_getRedirectUrl: " + e);
        return url;
    }
}

function createParamArray(url) {
    try {
        var params = {};
        var tmp = url.replace(/.*?\?/, "");
        var tmpAry = tmp.replace("?", "&").split("&");

        for (var prm = 0; prm < tmpAry.length; prm++) {
            if (!tmpAry[prm].match("=")) { continue; }
            params[tmpAry[prm].split("=")[0]] = tmpAry[prm].replace(/.*?=/, "");
        }
        return params;

    } catch (e) {
        console.error("Error_createParamArray:" + e);
        return {};
    }
}

function getNextSibling(el, selector) {
    let sibling = el.nextElementSibling;
    while (sibling) {
        if (sibling.matches(selector)) {
            return sibling;
        }
        sibling = sibling.nextElementSibling;
    }
    return null;
}

function safeDecodeURIComponent(uriComponent) {
    if (!uriComponent.includes('%')) {
        return uriComponent;
    }

    try {
        return decodeURIComponent(uriComponent);
    } catch (e) {
        console.error("URI 디코딩 오류:", e);
        return uriComponent;
    }
}

// =============================================================================
// 메인 로직 함수
// =============================================================================

/**
 * URL 패턴에 따른 처리 로직을 정의한 객체입니다.
 * key는 URL을 검사할 정규식, value는 처리 함수입니다.
 */
// -------------------------------------------------------------------------
// [1] 핸들러 데이터 구조화 (사이트/패턴별 분리)
// -------------------------------------------------------------------------

// A. 특정 사이트 전용 핸들러 (Page-specific)
const urlHandlers = {
    'google\\.com/search': {
        selector: 'a[data-jsarwt], a[href*="url?q="]',
        run: (link) => { if (link.getAttribute('data-jsarwt')) link.setAttribute('data-jsarwt', ''); }
    },
    't66y|xyz|eyny\\.com': {
        selector: 'a[href*="redircdn.com"]',
        run: (link) => {
            let m = link.href.match(/redircdn.com\/\?magnet:\?xt=urn:btih:(.+)&z$/);
            if (m) { link.href = 'magnet:?xt=urn:btih:' + m[1]; return; }
            m = link.href.match(/redircdn.com\/\?(.+)&z$/);
            if (m) link.href = m[1].replaceAll('______', '.');
        }
    },
    'javlibrary': {
        selector: 'a[href*="redirect.php?url="]',
        run: (link) => {
            const m = link.href.match(/redirect\.php\?url=(.*)/);
            if (m) link.href = decodeURIComponent(m[1]).replace(/\&ver.*/, '');
        }
    },
    'xhamster\\.com': {
        selector: 'a[href*="xhlive.cam/goto/"]',
        run: (link) => {
            const m = link.href.match(/(.+xhlive\.cam\/)goto\/(.+)\?/);
            if (m) link.href = m[1] + m[2];
        }
    },
    'trupornolabs\\.org': {
        selector: 'a[href^="magnet:?xt=urn:btih"]',
        run: (link) => {
            let Title = getNextSibling(link, 'a[href^="/torrent/"]') || getNextSibling(link, 'a[href*="trupornolabs.org/download"]');
            if (Title) {
                Title = Title.innerText.replace('Скачать ', '').replace(/\.torrent$/, '');
                link.href = UpdateParam(link.href, 'dn', Title);
            }
        }
    },
    'xchina\\.co': {
        selector: 'a[href*="/torrent/id"]',
        isAsync: true,
        run: async (link) => {
            try {
                const res = await gmRequest({ url: link.href.replace('torrent', 'download'), method: 'GET' });
                const match = /\<div class="_download"\>\<div\>\<a href="(?<url>http[^']+?)"/.exec(res.responseText);
                if (match) {
                    const finalUrl = match.groups ? match.groups.url : match[1];
                    link.href = finalUrl;
                    if (link.textContent.match(/\/torrent\/id.*\.html$/)) link.textContent = finalUrl;
                }
            } catch (e) { }
        }
    },
    'sexfetishforum': {
        selector: 'a[href*="go.sexfetishforum.com"], a[href*="go.xxxfetishforum.com"], a[href*="go.sexandfetishforum.com"]',
        run: (link) => {
            const m = /go.(sexfetishforum|xxxfetishforum|sexandfetishforum).com\/\?(.+)$/.exec(link.href);
            if (m) link.href = decodeURIComponent(m[2]);
        }
    },
    'k2sporn': {
        selector: 'a[href*="k2sporn.com"]',
        run: (link) => {
            link.href = link.href.replace('k2sporn.com', 'k2sprn.com');
            const m = link.href.match(/.+page\/[\-0-9]+\.[0-9]+/);
            if (m) {
                const num = m[0].match(/[\-0-9]+\.[0-9]+$/)[0];
                link.href = link.href.replace(num, Math.ceil(num));
            }
        }
    },    
};

// B. 범용 링크 핸들러 (Generic-link)
const genericHandlers = {
    'elsbdown': {
        selector: 'a[href*="data.elsbdown.com/list.php?name="]',
        run: (link) => {
            const m = link.href.match(/data.elsbdown.com\/list.php\?name=(.+)/);
            if (m) link.href = 'http://data.elsbdown.com/down.php/' + m[1] + '.torrent';
        }
    },
    'turbobit': {
        selector: 'a[href*="turb.cc"], a[href*="turb.pw"]',
        run: (link) => { link.href = link.href.replace(/turb\.(cc|pw)/, 'turbobit.net'); }
    },
    'dmm': {
        selector: 'a[href*="al.dmm.co.jp/"], a[href*="al.fanza.co.jp/"]',
        run: (link) => {
            const url = getRedirectUrl(link.href, "lurl");
            link.href = removeUriWithParam(url, ['ch', 'ch_id', 'af_id']);
        }
    },
    'affiliate_clean': {
        selector: 'a[href*="?aff"], a[href*="?ref="], a[href*="&affuid="]',
        run: (link) => {
            link.href = link.href.replace(/(\?ref=|\&affuid=).*/, '');
            if (link.href.includes('aff')) link.href = removeUriWithParam(link.href, ['affi', 'aff']);
        }
    },
    'duga': {
        selector: 'a[href*="click.duga.jp/ppv/"]',
        run: (link) => {
            const m = link.href.split('/').pop();
            link.href = link.href.replace(m, '').replace('click.', '');
        }
    },
    'imgblaze': {
        selector: 'a[href*="imgblaze.net"]',
        run: (link) => {
            const img = link.querySelector('img[src*="imgblaze.net/"]');
            if (img) {
                const m = /(https?:\/\/.*)\/small\/small_(.+\.jpg)/.exec(img.src);
                if (m) link.href = `${m[1]}/big/${m[2]}`;
            }
        }
    },
    'ddl_to': {
        selector: 'a[href*="ddl.to"]',
        run: (link) => { link.href = link.href.replace(/ddl\.to/, 'ddownload.com'); }
    },
    'nitroflare': {
        selector: 'a[href*="nitro.download"]',
        run: (link) => { link.href = link.href.replace('nitro.download', 'nitroflare.com'); }
    },
    'jskypro': {
        selector: 'a[href*="jskypro.com/affiliate"]',
        isAsync: true,
        run: async (link) => { const f = await getFinalUrl(link.href); if (f) link.href = f; }
    },
    'dacload': {
        selector: 'a[href*="dacload.com"], a[href*="dacdate.com"]',
        isAsync: true,
        run: async (link) => { const f = await getUrlFromMetaRefresh(link.href); if (f) link.href = f; }
    },
    'final_url_jumps': {
        selector: 'a[href*="click.dtiserv2.com/Direct"], a[href*="clear-tv.com/Direct"], a[href*="tiny.cc/"], a[href*="tma.cx"]',
        isAsync: true,
        run: async (link) => { const f = await getFinalUrl(link.href); if (f) link.href = f; }
    },
    'sendurl': {
        selector: 'a[href*="sendurl.me/"]',
        isAsync: true,
        run: async (link) => {
            const f = await getFinalUrl(link.href);
            if (f) { link.href = f; link.textContent = f; }
        }
    },
    'safedl': {
        selector: 'a[href*="safedl.net/dl/"]',
        isAsync: true,
        run: async (link) => {
            try {
                const res = await gmRequest({ url: link.href, method: 'GET' });
                const m = /window\.location='(?<url>http[^']+)/.exec(res.responseText);
                if (m) {
                    link.href = m.groups?.url || m[1];
                    if (link.textContent.includes('safedl.net')) link.textContent = link.href;
                }
            } catch (e) { }
        }
    },
    'ccbill_direct': {
        selector: 'a[href*="refer.ccbill.com"][href*="HTML=http"]',
        run: (link) => { link.href = getRedirectUrl(link.href, "HTML"); }
    },
    'ccbill_async': {
        selector: 'a[href*="refer.ccbill.com/cgi-bin/clicks.cgi?CA="]',
        isAsync: true,
        run: async (link) => { const f = await getFinalUrl(link.href); if (f) link.href = f; }
    },
    'base64_jump': {
        selector: 'a[href*="/aHR0c"], a[href*="=aHR0c"]',
        run: (link) => {
            const m = link.href.match(/(\/|=)(aHR0c[a-zA-z0-9]+={0,2})($|\/|\?|&|-?-?;?)/);
            if (m) link.href = atob(m[2]).replace(/\?site=.+/, '');
        }
    }
};
/**
 * 주어진 링크(a 태그)의 href 속성을 조건에 따라 변경하는 메인 함수입니다.
 * 이 함수는 실제로 링크를 처리하는 로직을 수행합니다.
 * @param {HTMLAnchorElement} link - 변경할 링크(a 태그) 객체
 */

// -------------------------------------------------------------------------
// [2] 실행 환경 설정 및 선택자 생성 (Pre-Optimization)
// -------------------------------------------------------------------------

const pageMatchEntry = Object.entries(urlHandlers).find(([p]) => new RegExp(p).test(PageURL));
let activeHandler = null;
let finalSelector = "";
const requestQueue = [];
let isProcessing = false;

if (pageMatchEntry) {
    // 특정 페이지 모드: 해당 사이트용 선택자만 사용
    activeHandler = pageMatchEntry[1];
    finalSelector = activeHandler.selector;
} else {
    // 일반 페이지 모드: 모든 generic 핸들러의 선택자를 합쳐서 사용
    finalSelector = Object.values(genericHandlers).map(h => h.selector).join(', ');
}

/**
 * 작업 큐에 있는 링크들을 순차적으로 처리하는 비동기 함수.
 */
async function startQueueProcessor() {
    if (isProcessing || requestQueue.length === 0) return;
    isProcessing = true;

    while (requestQueue.length > 0) {
        const item = requestQueue.shift();
        try {
            await item.handler.run(item.link);
            item.link.setAttribute('Direct', 'true');
        } catch (e) {
            console.error('Async task failed:', e);
        }
    }
    isProcessing = false;
}

function collectAndProcess(root = document) {
    if (!finalSelector) return;
    const targets = root.querySelectorAll(finalSelector);
    targets.forEach(link => processLink(link));
}

function processLink(link) {
    if (!link.href || link.getAttribute('Direct') === 'true') return;

    let handler = activeHandler;

    // 일반 페이지인 경우 링크에 맞는 핸들러 매칭
    if (!handler) {
        handler = Object.values(genericHandlers).find(h => link.matches(h.selector));
    }

    if (!handler) return;

    if (handler.isAsync) {
        requestQueue.push({ link, handler });
        startQueueProcessor();
    } else {
        handler.run(link);
        link.setAttribute('Direct', 'true');
    }
}


/**
 * 실패했던 도메인의 링크들을 다시 큐에 넣고 재시도합니다.
 */
function resumeLinks(domain) {
    const links = failedLinksMap.get(domain);
    if (!links) return;

    links.forEach(link => {
        // 1. 기존 'Direct' 상태와 속성을 초기화하여 재처리가 가능하게 만듭니다.
        link.removeAttribute('Direct');

        // 2. 현재 페이지 모드에 맞는 핸들러를 다시 찾아서 실행합니다.
        let handler = activeHandler;
        if (!handler) {
            handler = Object.values(genericHandlers).find(h => link.matches(h.selector));
        }

        if (handler) {
            // 3. 비동기/동기 여부에 따라 적절히 처리 (processLink 로직 활용)
            if (handler.isAsync) {
                requestQueue.push({ link, handler });
            } else {
                handler.run(link);
                link.setAttribute('Direct', 'true');
            }
        }
    });

    // 4. 해당 도메인의 실패 목록을 비우고 큐 프로세서를 가동합니다.
    failedLinksMap.delete(domain);
    startQueueProcessor();
}
// =============================================================================
// 메인 스크립트 실행 부분
// =============================================================================

// DOMContentLoaded 이벤트 발생 시, 페이지의 모든 링크를 큐에 추가합니다.
document.addEventListener('DOMContentLoaded', () => {
    console.log(`Start Direct Link`);
    collectAndProcess();
});

// MutationObserver를 사용하여 동적으로 추가된 링크를 감지하고 큐에 추가합니다.
const observer = new MutationObserver(mutations => {
    if (!finalSelector) return;
    mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) { // ELEMENT_NODE
                if (node.tagName === 'A' && node.matches(finalSelector)) {
                    processLink(node);
                } else if (node.querySelectorAll) {
                    collectAndProcess(node);
                }
            }
        });
    });
});

// 문서 본문 전체를 관찰하여 변경 사항을 감지합니다.
observer.observe(document.body, { childList: true, subtree: true });
