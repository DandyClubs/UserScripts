// ==UserScript==
// @name         Video Code Extractor
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  개수 표시 기능 추가 (선택/리스트/전체)
// @author       DancyClubs
// @match        https://video.dmm.co.jp/av/list/?maker=*
// @match        https://video.dmm.co.jp/av/maker/*
// @require      https://cdn.jsdelivr.net/npm/inko@1.1.1/inko.min.js
// @grant        GM_addStyle
// @run-at       document-body
// @noframes
// ==/UserScript==

(function () {
    'use strict';

    GM_addStyle(`
    .videocodeextractor {
        display: flex !important;
    }
    .videocodeextractor div::-webkit-scrollbar { width: 6px; }
    .videocodeextractor div::-webkit-scrollbar-thumb { background: #444; border-radius: 10px; }
    `);

    const PageURL = () => window.location !== window.parent.location ? document.referrer : document.location.href;
    const KEY_PREFIX = "DMM_";
    const imageSelector = 'main ul li a[href*="/av/content/?id="] picture source[srcset^="https://awsimgsrc.dmm.co.jp/pics_dig/digital/video/"]';
    let makerLabelCode = GetParam(PageURL(), 'maker');
    const makerSelector = `body div main a[href="/av/list/?maker=${makerLabelCode}"]`;
    const rawMediaType = GetParam(PageURL(), 'media_type');

    const PROCESSED_CLASS = 'processed-marker';
    const patternMemoryDB = new Set();

    let alertStatus = null; // 상태 메시지용 엘리먼트
    let pauseState = false; // 일시정지 상태

    let makerLabel = ""; // 전역 변수로 관리

    let listContainer = null;
    let countStatus = null; // 개수를 표시할 엘리먼트
    let currentSessionCodes = new Set();
    let isShowAllMode = false;
    let filterText = "";


    const mutCallback = () => {
        if (/video\.dmm\.co\.jp\/av\/list\/\?maker=\d+&media_type=2d/.test(PageURL())) {
            let hasNew = false;

            // 1. selector에 해당하면서 아직 처리되지 않은(:not) 요소들만 한 번에 가져옴
            // imageSelector가 img를 가리킨다면 해당 img들을, source를 가리킨다면 source들을 가져옵니다.
            const targets = document.querySelectorAll(`${imageSelector}:not(.${PROCESSED_CLASS})`);

            if (targets.length === 0) return;

            targets.forEach(el => {
                // 2. 즉시 마킹하여 다음 루프에서 중복 처리 방지
                el.classList.add(PROCESSED_CLASS);

                // 3. URL 추출 (img 태그는 src, source 태그는 srcset 우선)
                const targetUrl = el.getAttribute('srcset') || el.getAttribute('src');

                if (targetUrl && processUrl(targetUrl)) {
                    hasNew = true;
                }
            });
            // 4. 새로운 코드가 발견된 경우에만 UI 업데이트
            if (hasNew) {
                updateDisplayList();
            }
        }
    };

    const observer = new MutationObserver(mutCallback);

    function GetParam(url, paramName) {
        // 1. URL 객체를 사용하여 파라미터를 추출 (현대적인 방식)
        const urlObj = new URL(url);
        const params = new URLSearchParams(urlObj.search);
        const result = params.get(paramName);

        // 2. 결과값이 있으면 디코딩하여 반환
        return result?.toUpperCase() || '';
    }

    // --- 유틸리티: 개수 업데이트 함수 ---
    function updateCounts() {
        if (!countStatus || !listContainer) return;

        const selectedCount = listContainer.querySelectorAll('.item-check:checked').length;
        const currentListCount = listContainer.querySelectorAll('.item-check').length;
        const totalCount = Object.keys(localStorage).filter(k => k.startsWith(KEY_PREFIX)).length;

        countStatus.innerHTML = `
            <span style="color:#00FF41">선택: ${selectedCount}</span> |
            <span>목록: ${currentListCount}</span> |
            <span style="color:#2196F3">전체: ${totalCount}</span>
        `;

        if (alertStatus) {
            if (!rawMediaType && pauseState) {
                alertStatus.innerHTML = `<div style="color:#FF9800; margin-bottom:5px; font-weight:bold;">⚠️ 2D를 선택하세요!<br>❌ 페이지 주소가 맞지 않아 수집 중단.</div>`;
            } else if (!makerLabelCode || makerLabel === "Unknown") {
                alertStatus.innerHTML = `<div style="color:#F44336; margin-bottom:5px; font-weight:bold;">❌ 제작사 정보를 가져오지 못했습니다.</div>`;
            } else {
                alertStatus.innerHTML = ""; // 정상일 경우 메시지 숨김
            }
        }
    }

    const resetSessionCodes = () => {
        if (currentSessionCodes.size > 0) {
            currentSessionCodes.clear();
            updateDisplayList();
        }
        if (/video\.dmm\.co\.jp\/av\/list\/\?maker=\d+&media_type=2d/.test(PageURL())) {
            pauseState = true;
            observer.observe(document.body, { childList: true, subtree: true });
            makerLabelCode = GetParam(PageURL(), 'maker');
        } else if (/video\.dmm\.co\.jp\/av\/maker\//.test(PageURL())) {
            buildMakerMap();
            pauseState = false;            
        }else {
            observer.disconnect();
            pauseState = false;            
        } 
    };

    window.addEventListener('popstate', resetSessionCodes);
    window.addEventListener('hashchange', resetSessionCodes);

    const originalPush = history.pushState;
    history.pushState = function () {
        originalPush.apply(this, arguments);
        resetSessionCodes();        
    };
    const originalReplace = history.replaceState;
    history.replaceState = function () { 
        originalReplace.apply(this, arguments); 
        resetSessionCodes(); 
    };


    function initializeMakerLabel(retryCount = 0) {
        const el = document.querySelector(makerSelector);
        const label = el?.innerText.trim();

        if (label) {
            makerLabel = label;
            console.log(`[VCE] 메이커 확인 완료: ${makerLabel}`);
        } else if (retryCount < 2) {
            console.log(`[VCE] 메이커 라벨 대기 중... (${retryCount + 1}/10)`);
            setTimeout(() => initializeMakerLabel(retryCount + 1), 3000);
        } else {
            makerLabel = "Unknown"; // 결국 못 찾으면 기본값                        
        }
    }

    function processUrl(srcset) {
        if (!srcset || !srcset.includes('https://awsimgsrc.dmm.co.jp/pics_dig/digital/video/')) return false;
        const cleanUrl = srcset.split('?')[0];
        const majorsLabel = /digital\/video\/(.*?)([a-z]{3,7}\d{4,7}|[ts]{1,2}\d{2,7})[v]?(ps|pl|rai)/i;
        if (!majorsLabel.test(cleanUrl)) return false;

        const skipPatterns = [
            /digital\/video\/(h_[0-9]*?)([vpjg])(\d{3,})([a-z]*?)\//,
            /digital\/video\/\d+jdxa\d+/i, // 예: jdxa 관련 패턴 스킵
        ];

        for (const skipRegex of skipPatterns) {
            if (skipRegex.test(cleanUrl)) return false;
        }

        const pathSegments = cleanUrl.split('/');
        const contentId = pathSegments[pathSegments.length - 2];
        if (!contentId) return false;

        const maskedId = contentId.replace(/\d/g, '0');
        const currentPattern = `${maskedId}_${makerLabelCode}_${rawMediaType}`;
        if (patternMemoryDB.has(currentPattern)) return false;
        

        // --- 추출 패턴 (예제 주석 복구) ---
        const extractPatterns = [
            /digital\/video\/([a-z]*?)(dvaj|dvajbx)(\d{5,})(.*?)\//,                // DVAJ 패턴
            /digital\/video\/(\d{2})(kt)(\d{5,})(.*?)\//,              // 47kt00308
            /digital\/video\/(\d{2})([t]\d{1})(\d{5,})(.*?)\//,                           // 55t3800059 대응 (T+숫자2자리 고정)
            /digital\/video\/(h_[h0-9]*?)(ss)(\d{3,})([a-z]*?)\//,                  // h_113h113 + ss + 00003 + rai 대응
            /digital\/video\/(h_[h0-9]*?)([a-z]{3,})(\d{3,})([a-z]*?)\//,           // h_1515bggb00008 대응
            /digital\/video\/([0-9]*?)([a-z]+)(\d+)(.*?)\//,                         // 패턴 B: it001 또는 snos00136 형태
        ];

        let match = null;
        for (const regex of extractPatterns) { match = cleanUrl.match(regex); if (match) break; }
        if (match) {
            const prefixMatch = match[1];
            const code = match[2].toUpperCase();
            const padLen = `zero${match[3].length}`;
            const suffix = match[4];
            const displayCode = code;
            const uniqueKey = `${KEY_PREFIX}${displayCode}_${prefixMatch}_${padLen}_${suffix}_${makerLabelCode}_${rawMediaType}`;
            if (!makerLabel) {
                initializeMakerLabel();
                setTimeout(() => processUrl(srcset), 1000);
                return false;
            }


            if (!localStorage.getItem(uniqueKey)) {
                currentSessionCodes.add(uniqueKey);
                localStorage.setItem(uniqueKey, JSON.stringify({
                    displayCode: displayCode,
                    data: ["FANZA_DIGITAL", prefixMatch, padLen, suffix, makerLabel, rawMediaType],
                    origin: cleanUrl
                }));
                if (typeof currentPattern !== 'undefined') {
                    patternMemoryDB.add(currentPattern);
                }
                return true;
            }

        }
        return false;
    }

    function updateDisplayList(shouldScroll = false) {
        if (!listContainer) return;
        const currentScroll = listContainer.scrollTop;
        listContainer.innerHTML = "";

        let keys = isShowAllMode ?
            Object.keys(localStorage).filter(k => k.startsWith(KEY_PREFIX)).sort() :
            Array.from(currentSessionCodes).sort();

        if (filterText !== "") {
            let regex = null;
            if (filterText.startsWith('/') && filterText.endsWith('/')) {
                try { regex = new RegExp(filterText.slice(1, -1), 'i'); } catch (e) { }
            }
            keys = keys.filter(key => {
                const itemData = JSON.parse(localStorage.getItem(key));
                if (!itemData) return false;
                const code = itemData.displayCode.toUpperCase();
                return regex ? regex.test(code) : code === filterText.toUpperCase();
            });
        }

        if (keys.length === 0) {
            listContainer.innerHTML = `<div style='color:#888; font-size:11px; text-align:center; padding:20px 0;'>${isShowAllMode ? "저장된 데이터 없음" : "현재 페이지 추출 없음"}</div>`;
            updateCounts(); // 개수 업데이트
            return;
        }

        keys.forEach(key => {
            const itemData = JSON.parse(localStorage.getItem(key));
            const detailLabel = `${itemData.data[1] && itemData.data[3] ? itemData.data[1] + ', ' + itemData.data[3] : itemData.data[1] || itemData.data[3] || ''}`;
            const idMatch = itemData.origin.match(/digital\/video\/([^\/]+)\//i);
            const contentId = idMatch ? idMatch[1] : "";
            const itemPageUrl = contentId ? `https://video.dmm.co.jp/av/content/?id=${contentId}` : "#";
            const row = document.createElement('div');
            row.style = "display:flex; align-items:center; border-bottom:1px solid #333; padding:6px 0; gap:8px;";
            row.innerHTML = `
                <input type="checkbox" class="item-check" data-key="${key}" style="margin-left:5px; width:15px; height:15px; cursor:pointer; accent-color:#00FF41; appearance:auto;">
                <div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1; cursor:help;" title="${itemData.origin}">
                <a href="${itemPageUrl}" target="_blank"><span style="color:#00FF41; font-family:monospace; font-size:12px;">${itemData.displayCode}</span></a>
                    ${detailLabel ? `<span style="color:white; font-size:10px; margin-left:5px;">[</span><span style="color:#00FF41; font-size:10px;">${detailLabel}</span><span style="color:white; font-size:10px;">]</span>` : ''}
                </div>
                <button class="del-btn" style="background:none; border:none; color:#ff4d4d; cursor:pointer; font-weight:bold; font-size:16px; padding:0 5px;">×</button>
            `;

            // 체크박스 클릭 시 선택 개수 실시간 업데이트
            row.querySelector('.item-check').onchange = updateCounts;

            row.querySelector('.del-btn').onclick = () => {
                localStorage.removeItem(key);
                currentSessionCodes.delete(key);
                updateDisplayList(false);
            };
            listContainer.appendChild(row);
        });

        if (shouldScroll) listContainer.scrollTop = listContainer.scrollHeight;
        else listContainer.scrollTop = currentScroll;

        updateCounts(); // 리스트 생성 후 개수 업데이트
    }

    const makerMap = new Map();

    let currentMakerLabel = ""; // 전역 변수
    function buildMakerMap() {
        const makerNodes = document.querySelectorAll('a[href*="maker="]');

        makerNodes.forEach(node => {
            try {
                const url = new URL(node.href, window.location.origin);
                const makerId = url.searchParams.get('maker');
                // .line-clamp-2.text-ellipsis 클래스를 가진 텍스트 추출
                const makerName = node.querySelector('.line-clamp-2.text-ellipsis')?.innerText.trim();

                if (makerId && makerName) {
                    makerMap.set(makerId, makerName);
                }
            } catch (e) {
                // URL 파싱 에러 등 예외 처리
            }
        });

        console.log(`[VCE] 메이커 맵 구성 완료: ${makerMap.size}개 항목`);
    }

    /**
     * 현재 URL의 maker ID를 기반으로 이름을 반환합니다.
     */
    function getMakerNameById(currentMakerId) {
        if (makerMap.has(currentMakerId)) {
            return makerMap.get(currentMakerId);
        }

        // 만약 맵에 없다면 (리스트 페이지인 경우) 기존 selector로 시도
        return document.querySelector('.line-clamp-2.text-ellipsis')?.innerText.trim() || "Unknown";
    }
    
    function findMakerLabel(retryCount = 0) {
        // 1. 먼저 페이지 내 모든 메이커 정보를 맵으로 빌드
        buildMakerMap();

        // 2. 현재 페이지의 파라미터에서 maker ID 가져오기
        const urlParams = new URLSearchParams(window.location.search);
        const makerId = urlParams.get('maker');

        // 3. 맵에서 찾거나, 직접 셀렉터로 찾기
        const label = getMakerNameById(makerId);

        if (label && label !== "Unknown") {
            currentMakerLabel = label;
            console.log(`[VCE] 매칭된 메이커: ${currentMakerLabel}`);
        } else if (retryCount < 10) {
            console.log(`[VCE] 메이커 텍스트 추출 재시도 중... (${retryCount + 1}/10)`);
            setTimeout(() => findMakerLabel(retryCount + 1), 1000);
        }
    }

    function saveMakerMapToFile() {
        if (makerMap.size === 0) {
            alert("저장할 메이커 데이터가 없습니다. 먼저 맵을 빌드하세요.");
            return;
        }

        // 1. Map을 일반 Object로 변환 후 JSON 문자열화
        const obj = Object.fromEntries(makerMap);
        const jsonString = JSON.stringify(obj, null, 2); // 보기 좋게 들여쓰기 포함

        // 2. Blob 객체 생성
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        // 3. 가상 링크를 만들어 다운로드 실행
        const a = document.createElement('a');
        a.href = url;
        a.download = `DMM_MakerMap_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();

        // 4. 리소스 정리
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log(`[VCE] ${makerMap.size}개의 메이커 정보가 파일로 저장되었습니다.`);
    }

    function createUI() {
        const panel = document.createElement('div');
        panel.classList.add('videocodeextractor');
        panel.style = "position:fixed; bottom:20px; right:20px; z-index:9999; display:flex !important; flex-direction:column; background:rgba(15,15,15,0.95); padding:12px; border-radius:12px; width:260px; border:1px solid #444; box-shadow:0 8px 32px rgba(0,0,0,0.5); color:white; font-family:sans-serif; box-sizing:border-box;";
        panel.innerHTML = `<div style='font-weight:bold; font-size:13px; margin-bottom:5px; text-align:center; color:#2196F3;'>DMM CODE TRACKER</div>`;

        // --- 상태 메시지 알림 영역 추가 ---
        alertStatus = document.createElement('div');
        alertStatus.style = "font-size:11px; text-align:center; line-height:1.4;";
        panel.appendChild(alertStatus);

        // --- 개수 표시용 상태바 추가 ---
        countStatus = document.createElement('div');
        countStatus.style = "font-size:10px; color:#aaa; text-align:center; margin-bottom:8px; padding:4px; background:#222; border-radius:4px;";
        panel.appendChild(countStatus);

        const controlBar = document.createElement('div');
        controlBar.style = "display:flex; flex-direction:column; padding:8px; background:#222; border-bottom:1px solid #444; gap:8px; margin-bottom:10px; border-radius:4px; box-sizing:border-box;"; // box-sizing 추가
        controlBar.innerHTML = `
            <div style="display:flex; align-items:center; justify-content:space-between; width:100%; gap:5px;">
                <label style="color:#ccc; font-size:11px; cursor:pointer; display:flex; align-items:center; user-select:none; white-space:nowrap; flex-shrink:0;">
                    <input type="checkbox" id="selectAll" style="margin-right:5px; width:14px; height:14px; accent-color:#00FF41; cursor:pointer;"> 전체 선택
                </label>
                <button id="delSelected" style="background:#444; color:#ff4d4d; border:none; padding:4px 8px; font-size:11px; cursor:pointer; border-radius:3px; font-weight:bold; white-space:nowrap; flex-shrink:0;">선택 삭제</button>
            </div>
            <div style="display:flex; gap:5px; width:100%;">
                <input type="text" id="filterInput" placeholder="예: abc or /abc/" style="flex:1; min-width:0; background:#111; color:#00FF41; border:1px solid #444; padding:5px; font-size:12px; border-radius:3px; outline:none; font-family:monospace;">
                <button id="clearBtn" style="background:#666; color:#fff; border:none; padding:0 8px; font-size:11px; cursor:pointer; border-radius:3px; white-space:nowrap;">X</button>
                <button id="searchBtn" style="background:#00FF41; color:#000; border:none; padding:0 12px; font-size:11px; cursor:pointer; border-radius:3px; font-weight:bold; white-space:nowrap;">찾기</button>
            </div>
        `;
        panel.appendChild(controlBar);

        const saveBtn = document.createElement('button');
        saveBtn.innerText = "메이커 맵 저장";
        saveBtn.style = "margin-top:5px; padding:5px; background:#2196F3; color:white; border:none; border-radius:4px; cursor:pointer; font-size:11px;";
        saveBtn.onclick = saveMakerMapToFile;

        panel.appendChild(saveBtn);

        const filterInput = controlBar.querySelector('#filterInput');
        const searchBtn = controlBar.querySelector('#searchBtn');
        const inko = new Inko();
        searchBtn.onclick = () => { filterText = filterInput.value.trim(); controlBar.querySelector('#selectAll').checked = false; updateDisplayList(false); };

        filterInput.onkeydown = (e) => { if (e.key === 'Enter') searchBtn.click(); };

        filterInput.addEventListener('input', function (e) {
            const v = this.value;
            //const originalValue = e.target.value;

            // 1. 한글을 영문으로 변환 (예: "ㅁㅠㅊ" -> "abc", "가나" -> "rksk")
            let charEN = inko.ko2en(v);

            // 값이 바뀌었을 때만 업데이트
            if (v !== charEN) {
                e.target.value = charEN;
            }
        });
        controlBar.querySelector('#clearBtn').onclick = () => { filterInput.value = ""; filterText = ""; controlBar.querySelector('#selectAll').checked = false; updateDisplayList(false); };

        controlBar.querySelector('#selectAll').onclick = (e) => {
            const checkboxes = listContainer.querySelectorAll('.item-check');
            checkboxes.forEach(cb => cb.checked = e.target.checked);
            updateCounts(); // 전체 선택 시 개수 업데이트
        };

        controlBar.querySelector('#delSelected').onclick = () => {
            const selected = listContainer.querySelectorAll('.item-check:checked');
            if (selected.length === 0) return alert("삭제할 항목을 선택해주세요.");
            if (confirm(`${selected.length}개의 항목을 삭제하시겠습니까?`)) {
                selected.forEach(cb => { const key = cb.dataset.key; localStorage.removeItem(key); currentSessionCodes.delete(key); });
                updateDisplayList(false);
                controlBar.querySelector('#selectAll').checked = false;
            }
        };

        const tabBox = document.createElement('div');
        tabBox.style = "display:flex; margin-bottom:10px; border-bottom:1px solid #444; font-size:11px; cursor:pointer;";
        const sTab = document.createElement('div'); sTab.innerText = "현재 페이지"; sTab.style = "flex:1; text-align:center; padding:5px; color:#2196F3; border-bottom:2px solid #2196F3;";
        const aTab = document.createElement('div'); aTab.innerText = "전체 저장소"; aTab.style = "flex:1; text-align:center; padding:5px; color:#888;";
        tabBox.append(sTab, aTab);
        panel.appendChild(tabBox);

        sTab.onclick = () => { isShowAllMode = false; sTab.style.color = '#2196F3'; sTab.style.borderBottom = '2px solid #2196F3'; aTab.style.color = '#888'; aTab.style.borderBottom = 'none'; updateDisplayList(); };
        aTab.onclick = () => { isShowAllMode = true; aTab.style.color = '#2196F3'; aTab.style.borderBottom = '2px solid #2196F3'; sTab.style.color = '#888'; sTab.style.borderBottom = 'none'; updateDisplayList(); };

        listContainer = document.createElement('div');
        listContainer.style = "max-height:400px; overflow-y:auto; margin-bottom:10px; padding-right:5px;";
        panel.appendChild(listContainer);

        const btnContainer = document.createElement('div');
        btnContainer.style = "display:flex; gap:5px;";
        const dlBtn = document.createElement('button'); dlBtn.innerText = "다운로드"; dlBtn.style = "flex:2; padding:8px; background:#4CAF50; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px; font-weight:bold;";
        dlBtn.onclick = () => {
            let output = "";
            const allKeys = Object.keys(localStorage).filter(k => k.startsWith(KEY_PREFIX)).sort();
            const codeCounter = {};
            allKeys.forEach(key => {
                const obj = JSON.parse(localStorage.getItem(key));
                const codeOnly = obj.displayCode;
                codeCounter[codeOnly] = (codeCounter[codeOnly] === undefined) ? 0 : codeCounter[codeOnly] + 1;
                const finalData = [...obj.data, codeCounter[codeOnly]];
                output += `"${codeOnly}": ${JSON.stringify(finalData)}, // ${obj.origin}\n`;
            });
            if (!output) return alert("데이터가 없습니다.");
            const blob = new Blob([output], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `DMM_List_${new Date().toISOString().slice(0, 10)}.txt`;
            a.click();
            URL.revokeObjectURL(url);

        };
        const clBtn = document.createElement('button'); clBtn.innerText = "초기화"; clBtn.style = "flex:1; padding:8px; background:#F44336; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px; font-weight:bold;";
        clBtn.onclick = () => { if (confirm("모든 데이터를 삭제하시겠습니까?")) { Object.keys(localStorage).filter(k => k.startsWith(KEY_PREFIX)).forEach(k => localStorage.removeItem(k)); currentSessionCodes.clear(); updateDisplayList(); } };
        btnContainer.append(dlBtn, clBtn);
        panel.appendChild(btnContainer);
        document.body.appendChild(panel);
        updateDisplayList();        
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    window.addEventListener('load', async () => {
        await sleep(2000);
        createUI();
        
        if (/video\.dmm\.co\.jp\/av\/list\/\?maker=\d+&media_type=2d/.test(PageURL())) {
            initializeMakerLabel();
            pauseState = true;
            mutCallback();            
            observer.observe(document.body, { childList: true, subtree: true });
        }
        
    });
})();