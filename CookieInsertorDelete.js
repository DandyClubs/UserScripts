// ==UserScript==
// @name         Cookie Insert or Delete
// @version      0.1
// @include      *.xxx-av.com/*
// @include      *://www.reddit.com/*
// @include      *.street-gals.com/*
// @include      *.naughtyblog.org/*
// @include      *://www.dhlottery.co.kr/*
// @include      *://wetholefans.com/*
// @include      /getchu.com/
// @include      /teenpornb.com/
// @include      https://misskon.com/
// @include      https://xchina.co/*
// @include      https://www.eporner.com/*
// @include      https://www.mgstage.com/*
// @include      https://www.dmm.co.jp/*
// @include      https://hpav.tv/*
// @include      https://xchina.co/*
// @include      /xhamster\.com/
// @include      /1pondo\.tv/
// @include      /faphouse\.com/
// @match        https://erodouga-beam.com/*
// @match        https://www.minnano-av.com/*
// @match        https://thotsbay.co/*
// @match        https://namethatporn.com/*
// @match        https://everia.club/*
// @match        https://theleaksbay.com/*
// @match        https://www.pornhub.com/*
// @match        https://sexyforums.com/*
// @match        https://faphouse.com/*
// @run-at       document-start
// @grant        none
// @require      https://cdn.jsdelivr.net/npm/js-cookie@3.0.5/dist/js.cookie.min.js
// @require      https://cdn.jsdelivr.net/npm/tldts@7.4.19/dist/index.umd.min.js
// ==/UserScript==

const PageURL = window.location !== window.parent.location ? document.referrer : document.location.href;
const extractRootDomain = (url) => tldts.getDomain(url, { allowPrivateDomains: true }) || new URL(url).hostname.toLowerCase();
const RootDomain = extractRootDomain(PageURL)

switch (RootDomain) {
    case "minnano-av.com":
        Cookies.set('age_verified', 'true', { domain: '.minnano-av.com', expires: 7, path: '/' })
        break;
    case "erodouga-beam.com":
        Cookies.set('age_gate', '18', { domain: '.erodouga-beam.com', expires: 7, path: '/' })
        break;
    case "xxx-av.com":
        //document.cookie = 'acc_accept_lang=japanese;domain=.xxx-av.com;path=/';
        Cookies.set('acc_accept_lang', 'japanese', { domain: '.xxx-av.com', expires: 7, path: '/' })
        break;
    case "everia.club":        
        Cookies.set('zone-cap-3576187', '1%3B1728041726', { domain: '.everia.club', expires: 7, path: '/' })
        break;

    case "thotsbay.co":
        Cookies.set('googtrans', '/en', { domain: '.thotsbay.co', expires: 7, path: '/' })
        break;

    case "sexyforums.com":
        Cookies.set('googtrans', '/en', { domain: '.sexyforums.com', expires: 7, path: '/' })
        break;
    case "faphouse.com":
        Cookies.set('locale', 'en', { domain: '.faphouse.com', expires: 7, path: '/' })
        break;
    case "namethatporn.com":        
        Cookies.set('BetterJsPop0', '1', { domain: '.namethatporn.com', expires: 7, path: '/' })
        break;
    case "street-gals.com":
        document.cookie = 'accept_lang=japanese;domain=.street-gals.com;path=/';
        break;
    case "reddit.com":
        document.cookie = 'over18=1;domain=.reddit.com;path=/';
        break;
    case "xhamster.com":
        document.cookie = 'lang=en;domain=.xhamster.com;path=/';
        document.cookie = 'parental-control=yes;domain=.xhamster.com;path=/';
        document.cookie = 'ts_popunder=true;domain=.xhamster.com;path=/';
        break;
    case "naughtyblog.org":
        //document.cookie = 'prpopundr=1;path=/';
        Cookies.set('prpopundr', '1')
        break;
    case "theleaksbay.com":
        Cookies.set('aawsmackeroo0', '1')
        Cookies.set('BetterJsPop_pop_0', '0')
        break;
    case "eporner.com":
        //document.cookie = 'prpopundr=1;path=/';
        Cookies.set('ADBp', 'yes', { domain: 'www.eporner.com' })
        break;
    case "pornhub.com":
        Cookies.set('accessAgeDisclaimerPH', '1', { domain: '.pornhub.com', expires: 7, path: '/' });
        break;
    case "dhlottery.co.kr":
        Cookies.set('pop13798', 'done')
        Cookies.set('pop13867', 'done')
        Cookies.set('pop13887', 'done')
        break;
    case "wetholefans.com":
        Cookies.set('_7096ebc73ma', '1')
        break;
    case "getchu.com":
        Cookies.set('getchu_adalt_flag', 'getchu.com')
        break;
    case "xchina.co":
        Cookies.set('clicked_modal', '1', { domain: '.xchina.co', expires: 7, path: '/' })
        break;
    case "mgstage.com":
        Cookies.set('adc', '1', { domain: '.mgstage.com', expires: 7, path: '/' })
        break;
    case "teenpornb.com":
        Cookies.set('popundr', '1', { domain: 'teenpornb.com', expires: 7, path: '/' })
        break;
    case "dmm.co.jp":
        Cookies.set('age_check_done', '1', { domain: '.dmm.co.jp', expires: 7, path: '/' })
        break;
    case "hpav.tv":
        document.cookie = 'evadavpop=1;domain=hpav.tv;path=/';
        break;
    case "xchina.co":
        document.cookie = 'adClosed_modal=1;domain=.xchina.co;path=/;max-age=86400;';
        break;
    case "1pondo.tv":
        document.cookie = 'ageCheck=1;domain=.1pondo.tv;path=/;max-age=86400;';
        break;
    case "pornhub.com":
        document.cookie = 'accessAgeDisclaimerPH=2;domain=.pornhub.com;path=/;max-age=86400;';
        break;
    case "misskon.com":
        Cookies.set('avg_gate', 'yes', { domain: 'misskon.com', expires: 7, path: '/' })
        break;
}

