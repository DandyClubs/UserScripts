// ==UserScript==
// @name         ClcikAble Image
// @namespace    http://tampermonkey.net/
// @version      2025.08.29
// @description  try to take over the world!
// @author       You
// @match        https://maxjav.com/*
// @match        https://maxjav.xyz/*
// @match        https://blogjav.net/*
// @match        https://jappydolls.net/*
// @match        https://ultoporn.com/*
// @match        https://top-modelz.org/*
// @match        https://av18plus.com/*
// @match        https://x-idol.net/*
// @match        https://misskon.com/*
// @exclude      /maxjav\.com/\d+/
// @exclude      /maxjav\.xyz/\d+/
// @exclude      /blogjav\.net\/\d+/
// @exclude      /jappydolls\.net\/\d+/
// @exclude      https://x-idol.net/?p*
// @exclude      https://top-modelz.org/*.html
// @exclude      /misskon\.com\/\d+/
// @run-at       document-body
// @grant        none
// @noframes
// ==/UserScript==


const PageURL = window.location !== window.parent.location ? document.referrer : document.location.href;


let ClickAbleStyles = `
img.ClickAbleItem:hover {
	filter: alpha(opacity=80);
    -moz-opacity: .8;
    -khtml-opacity: .8;
    opacity: .8;
    -webkit-transition: all .3s ease;
    -moz-transition: all .3s ease;
    -o-transition: all .3s ease;
    transition: all .3s ease;
    cursor: pointer;
}

img.ClickAbleItem {
-webkit-box-shadow: 2px 4px 10px 0 rgba(0, 0, 0, .5);
    -moz-box-shadow: 2px 4px 10px 0 rgba(0, 0, 0, .5);
    box-shadow: 2px 4px 10px 0 rgba(0, 0, 0, .5);
    border-radius: .5em;
    }
`


const maxjav = {
    MatchUrl: 'maxjav',
    MakeClickImage: 'div.hentry div.entry p img',
    closestTag: 'div.hentry',
    Approach: 'closest',
    SearchATag: '.title a',
}
const xidol = {
    MatchUrl: 'x-idol.net',
    MakeClickImage: 'div.entries-wrapper div.post.hentry div.entry div.entry-content p a img',
    closestTag: '.post.hentry',
    Approach: 'AReplace',
    SearchATag: '.post-title.entry-title a',
}

const jappydolls = {
    MatchUrl: 'jappydolls.net',
    MakeClickImage: 'article.hentry div.entry-content a img',
    Approach: 'AReplace',
    closestTag: 'article.hentry',
    SearchATag: 'header.entry-header h1.entry-title a',
}

const av18plus = {
    MatchUrl: 'av18plus.com',
    MakeClickImage: 'div.entry p img:first-child',
    Approach: 'closest',
    closestTag: 'div.post',
    SearchATag: 'h2.title a',
}

const blogjav = {
    MatchUrl: 'blogjav.net',
    MakeClickImage: 'div.ast-blog-single-element p > img',
    Approach: 'closest',
    closestTag: 'div.post-content',
    SearchATag: 'h2.entry-title.ast-blog-single-element a',
}

const ultoporn = {
    MatchUrl: 'ultoporn.com',
    MakeClickImage: 'div.story div.oblozhka img',
    Approach: 'closest',
    closestTag: 'div.story',
    SearchATag: 'h3.shead a',
}

const topmodelz = {
    MatchUrl: 'top-modelz.org',
    MakeClickImage: 'div.news-text div img',
    Approach: 'closest',
    closestTag: 'div.newspad',
    SearchATag: 'div.news-detalis h2 a',
}

const misskon = {
    MatchUrl: 'misskon.com',
    MakeClickImage: 'article.item-list div.post-thumbnail a img',
    Approach: 'closest',
    closestTag: 'article.item-list',
    SearchATag: 'div.post-thumbnail a',
}

const ChostExtractors = /* #__PURE__ */ Object.freeze({
    __proto__: null,
    maxjav,
    blogjav,
    jappydolls,
    ultoporn,
    topmodelz,
    av18plus,
    xidol,
    misskon,
})


class Queue {
    constructor() {
        this.items = {};
        this.front = 0;
        this.rear = 0;
    }

    enqueue(item) {
        // 큐의 모든 요소를 순회하며 현재 추가하려는 item이 이미 존재하는지 확인합니다.
        for (let i = this.front; i < this.rear; i++) {
            if (this.items[i] === item) {
                console.log(`'${item}'은(는) 이미 큐에 존재합니다. 추가되지 않습니다.`);
                return; // 중복 값이므로 함수를 종료합니다.
            }
        }

        // 중복이 아닐 경우에만 큐에 추가합니다.        
        this.items[this.rear] = item;
        this.rear++;
    }

    dequeue() {
        if (this.isEmpty()) {
            return undefined; // or throw error
        }
        const item = this.items[this.front];
        delete this.items[this.front];
        this.front++;
        return item;
    }

    peek() {
        if (this.isEmpty()) {
            return undefined;
        }
        return this.items[this.front];
    }

    get size() {
        return this.rear - this.front;
    }

    isEmpty() {
        return this.size === 0;
    }
}


const queue = new Queue();

let ManagementWorking = false

async function Management() {
    if (ManagementWorking) return;    // guard against re-entry
    ManagementWorking = true;

    try {
        while (!queue.isEmpty()) {
            const node = queue.peek();
            if (node) node.click();
            await sleep(1000);
            queue.dequeue();
        }
    } catch (err) {
        console.error('Error in Management:', err);
    } finally {
        ManagementWorking = false;
    }
}



const extractors = Object.values(ChostExtractors).filter(Boolean)
const Active = extractors.find((extractor) => PageURL.includes(extractor.MatchUrl))
if (!Active) { return }


function MakeClickAble(e) {
    return new Promise((resolve, reject) => {
        let el, aTag, aTagURL;

        if (Active.Approach === 'AReplace') {
            el = e.closest(Active.closestTag);
            aTag = e.closest('a');
            aTagURL = el?.querySelector(Active.SearchATag)?.getAttribute('href');
            if (aTag && aTagURL) {
                aTag.setAttribute('href', aTagURL);
            }
        } else {
            if (Active.Approach === 'NextSibling') {
                let nextSibling = e.nextElementSibling;
                while (nextSibling) {
                    if (nextSibling.nodeType === Node.ELEMENT_NODE &&
                        nextSibling.tagName === 'A' &&
                        nextSibling.href) {
                        aTag = nextSibling;
                        break;
                    }
                    nextSibling = nextSibling.nextElementSibling;
                }
            } else if (Active.Approach === 'closest') {
                el = e.closest(Active.closestTag);
                aTag = el?.querySelector(Active.SearchATag);
            }
        }

        if (!aTag) {
            // If no anchor found, resolve immediately or reject?
            return resolve(e);
        }

        aTag.classList.add('ivChecked');
        e.classList.add('ClickAbleItem');

        if (/^data:image/.test(e.getAttribute('src')) && e.getAttribute('data-src')) {
            e.setAttribute('src', e.getAttribute('data-src'));
        }

        aTag.setAttribute('target', '_blank');

        e.addEventListener('click', (event) => {
            event.preventDefault();

            queue.enqueue(aTag);

            if (!ManagementWorking && queue.size) {
                Management();
            }
        });

        resolve(e);
    });
}



const mutCallback = (mutationsList, observer) => {
    for (const { addedNodes } of mutationsList) {
        for (const node of addedNodes) {
            if (!(node instanceof HTMLElement)) continue;
            //console.log(node, node.matches(Active.ObserverTag))
            if (node.nodeType == Node.ELEMENT_NODE && node.childNodes.length > 0 && node.querySelector(Active.MakeClickImage)) {
                //if(WatchTag === node.nodeName.toLowerCase() && ((node.id.includes(WatchID) || node.classList?.contains(WatchClass)) || (WatchID === null && !node.classList?.length))){                
                const NeedImages = [...node.querySelectorAll(Active.MakeClickImage)]
                    .filter((img) => img.closest(Active.closestTag))
                for (let x of NeedImages) {
                    MakeClickAble(x)
                }
            }
        }
    }
}

const attributesobserver = new MutationObserver(mutCallback)


function AddStyles(CSS, ID) {
    let styleSheet = document.createElement("style")
    styleSheet.textContent = CSS
    styleSheet.id = ID
    document.head.appendChild(styleSheet)
}

window.addEventListener("DOMContentLoaded", () => {
    FirstStep()
});


async function FirstStep() {
    console.log('Start ClickAble Maker');
    AddStyles(ClickAbleStyles, 'ClickAbleStyle');

    const NeedImages = [...document.querySelectorAll(Active.MakeClickImage)]
        .filter(img => img.closest(Active.closestTag));

    await Promise.all(NeedImages.map(x => MakeClickAble(x)));

    attributesobserver.observe(document.body, { subtree: true, childList: true });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/*

document.addEventListener("AutoPagerize_DOMNodeInserted", function (event) {
    const node = event.target;
    console.log(event)
    const detail = event.detail;
    console.log("AutoPagerize_DOMNodeInserted - A new node was inserted. Its type is: " + node.nodeName);
    //console.log("And the node is from the URL: " + detail.url);
    // Do something with this specific node, e.g. fix lazy loading or make it have a border:
    //node.style.setProperty("border", "4px solid purple", "important");
}, false);

*/