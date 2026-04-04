document.addEventListener('DOMContentLoaded', () => {
    // 主題切換邏輯
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    let isLightMode = localStorage.getItem('theme') === 'light';
    
    if (isLightMode) {
        document.body.setAttribute('data-theme', 'light');
        themeToggleBtn.textContent = '🌙';
        themeToggleBtn.setAttribute('title', '切換暗黑主題');
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            isLightMode = !isLightMode;
            if (isLightMode) {
                document.body.setAttribute('data-theme', 'light');
                themeToggleBtn.textContent = '🌙';
                themeToggleBtn.setAttribute('title', '切換暗黑主題');
                localStorage.setItem('theme', 'light');
            } else {
                document.body.removeAttribute('data-theme');
                themeToggleBtn.textContent = '🌞';
                themeToggleBtn.setAttribute('title', '切換亮色主題');
                localStorage.setItem('theme', 'dark');
            }
        });
    }


    // 佈局切換邏輯 (桌面版)
    const layoutToggleBtn = document.getElementById('layoutToggleBtn');
    let currentLayout = localStorage.getItem('preferredLayout') || 'dual';
    
    function applyLayout(layout) {
        if (layout === 'single') {
            document.body.classList.add('layout-single');
            document.body.classList.remove('layout-dual');
            if (layoutToggleBtn) {
                layoutToggleBtn.textContent = '🖥️';
                layoutToggleBtn.setAttribute('title', '切換為雙欄並排');
            }
        } else {
            document.body.classList.add('layout-dual');
            document.body.classList.remove('layout-single');
            if (layoutToggleBtn) {
                layoutToggleBtn.textContent = '📱';
                layoutToggleBtn.setAttribute('title', '切換為聚焦單欄');
            }
        }
        localStorage.setItem('preferredLayout', layout);
    }
    
    // 初始化佈局
    applyLayout(currentLayout);

    if (layoutToggleBtn) {
        layoutToggleBtn.addEventListener('click', () => {
            currentLayout = currentLayout === 'dual' ? 'single' : 'dual';
            applyLayout(currentLayout);
        });
    }

    // DOM 元素選取
    const requirementsContainer = document.getElementById('requirementsContainer');
    const addReqBtn = document.getElementById('addReqBtn');
    const removeReqBtn = document.getElementById('removeReqBtn');
    const calculateBtn = document.getElementById('calculateBtn');
    const resetBtn = document.getElementById('resetBtn');
    
    const template = document.getElementById('inputRowTemplate');
    const kerfInput = document.getElementById('kerfInput');
    
    const summaryStats = document.getElementById('summaryStats');
    const emptyState = document.getElementById('emptyState');
    const errorContainer = document.getElementById('errorContainer');
    
    // Plans
    const planTabs = document.getElementById('planTabs');
    const tabBtns = document.querySelectorAll('.plan-tab');
    const view6000 = document.getElementById('plan6000');
    const view6400 = document.getElementById('plan6400');
    const viewMixed = document.getElementById('planMixed');
    
    // Simple Report Mode
    const viewModeToggle = document.getElementById('viewModeToggle');
    const modeVisualBtn = document.getElementById('modeVisualBtn');
    const modeTextBtn = document.getElementById('modeTextBtn');
    const simpleReportContainer = document.getElementById('simpleReportContainer');
    const simpleReportText = document.getElementById('simpleReportText');
    const copyReportBtn = document.getElementById('copyReportBtn');
    const projectNameInput = document.getElementById('projectNameInput');
    const materialModelInputW = document.getElementById('materialModelInputW');
    const materialModelInputL = document.getElementById('materialModelInputL');
    const liveClock = document.getElementById('liveClock');
    const lastUpdateTime = document.getElementById('lastUpdateTime');
    
    // Floating Calc
    const calcToggleBtn = document.getElementById('calcToggleBtn');
    const calculatorWidget = document.getElementById('calculatorWidget');
    const closeCalcBtn = document.getElementById('closeCalcBtn');
    const calcToggleLabel = document.querySelector('.calc-toggle-label');

    // Mobile Nav
    const navInputBtn = document.getElementById('navInputBtn');
    const navReportBtn = document.getElementById('navReportBtn');
    const inputPanel = document.querySelector('.input-panel');
    const resultPanel = document.querySelector('.result-panel');

    // Setup Floating Calc
    if (calcToggleBtn && calculatorWidget) {
        calcToggleBtn.addEventListener('click', () => {
            calculatorWidget.classList.toggle('hidden');
        });
        if (closeCalcBtn) {
            closeCalcBtn.addEventListener('click', () => {
                calculatorWidget.classList.add('hidden');
            });
        }
    }

    // Mobile Nav - Vertical Sequential Scroll
    const contentWrapper = document.querySelector('.content-wrapper');

    function switchToInput() {
        if (!navInputBtn || !navReportBtn || !inputPanel) return;
        // 如果是單欄模式或手機模式，執行錨點跳轉
        if (document.body.classList.contains('layout-single') || window.innerWidth <= 800) {
            inputPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            // 雙欄模式下，僅確保頁面置頂或處理長內容滾動
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    function switchToReport() {
        if (!navInputBtn || !navReportBtn || !resultPanel) return;
        // 如果是單欄模式或手機模式，執行錨點跳轉
        if (document.body.classList.contains('layout-single') || window.innerWidth <= 800) {
            resultPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            // 雙欄模式下，報表通常就在右側，直接確保可見即可
            resultPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    if (navInputBtn && navReportBtn) {
        navInputBtn.addEventListener('click', switchToInput);
        navReportBtn.addEventListener('click', switchToReport);
    }

    // 當使用者滑動時，自動更新按鈕選取狀態 (IntersectionObserver)
    if (window.IntersectionObserver && navInputBtn && navReportBtn) {
        const observerOptions = {
            root: null,
            rootMargin: '-10% 0px -70% 0px', // 當面板進入畫面頂部 10% ~ 30% 區間時觸發
            threshold: 0
        };

        const navObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    if (entry.target.classList.contains('input-panel')) {
                        navInputBtn.classList.add('active');
                        navReportBtn.classList.remove('active');
                    } else if (entry.target.classList.contains('result-panel')) {
                        navReportBtn.classList.add('active');
                        navInputBtn.classList.remove('active');
                    }
                }
            });
        }, observerOptions);

        if (inputPanel) navObserver.observe(inputPanel);
        if (resultPanel) navObserver.observe(resultPanel);
    }

    // 獲取當前格式化時間 (YYYY/MM/DD (星期x) HH:mm:ss)
    function getNowString() {
        const now = new Date();
        const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        const dayName = days[now.getDay()];
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');
        return `${y}/${m}/${d} (${dayName}) ${hh}:${mm}:${ss}`;
    }

    // 獲取當前日期 (YYYY/MM/DD (星期x))
    function getDateString() {
        const now = new Date();
        const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        const dayName = days[now.getDay()];
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        return `${y}/${m}/${d} (${dayName})`;
    }

    // 更新即時時鐘
    function updateClock() {
        if (liveClock) {
            liveClock.textContent = getNowString();
        }
    }
    setInterval(updateClock, 1000);
    updateClock();

    // 獲取當地天氣
    async function updateWeather(forceGPS = false) {
        const weatherInfo = document.getElementById('weatherInfo');
        if (!weatherInfo) return;
        
        try {
            weatherInfo.title = '點擊使用 GPS 精確定位';
            weatherInfo.style.cursor = 'pointer';
            if (forceGPS) weatherInfo.textContent = '📍 定位中...';

            let lat = null, lon = null;
            let useGPS = forceGPS;

            // 檢查是否已授權 GPS
            if (!useGPS && navigator.permissions) {
                try {
                    const perm = await navigator.permissions.query({name: 'geolocation'});
                    if (perm.state === 'granted') useGPS = true;
                } catch(e) {}
            }

            // 取得 GPS 座標
            if (useGPS && navigator.geolocation) {
                const pos = await new Promise((resolve) => {
                    navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), {timeout: 8000});
                });
                if (pos) {
                    lat = pos.coords.latitude;
                    lon = pos.coords.longitude;
                }
            }

            let cityName = '';
            let weatherRes = '';

            if (lat && lon) {
                // 使用 GPS 座標查詢 wttr.in
                const gpsWRes = await fetch(`https://wttr.in/${lat},${lon}?format=%l:+%c+%C+%t&lang=zh-tw`).then(r => r.text()).catch(()=>'');
                if (gpsWRes && gpsWRes.includes(':')) {
                    const parts = gpsWRes.split(':');
                    cityName = parts[0].trim();
                    weatherRes = parts.slice(1).join(':').trim();
                } else {
                    weatherRes = gpsWRes;
                }
            } else {
                // 預設 IP 定位 (手機行動網路常會被導向台北)
                const [geoRes, wRes] = await Promise.all([
                    fetch('https://ipapi.co/json/').then(r => r.json()).catch(() => ({})),
                    fetch('https://wttr.in/?format=%c+%C+%t&lang=zh-tw').then(r => r.text()).catch(() => '')
                ]);
                cityName = geoRes.city || geoRes.region || '';
                weatherRes = wRes;
            }

            // 台灣地名與南部常見鄉鎮翻譯字典
            const cityTranslation = {
                'taipei': '台北', 'new taipei': '新北', 'taoyuan': '桃園',
                'taichung': '台中', 'tainan': '台南', 'kaohsiung': '高雄',
                'keelung': '基隆', 'hsinchu': '新竹', 'miaoli': '苗栗',
                'changhua': '彰化', 'nantou': '南投', 'yunlin': '雲林',
                'chiayi': '嘉義', 'pingtung': '屏東', 'yilan': '宜蘭',
                'hualien': '花蓮', 'taitung': '台東', 'penghu': '澎湖',
                'kinmen': '金門', 'matsu': '馬祖', 'lienchiang': '連江',
                // 屏東鄉鎮
                'neipu': '內埔', 'chaozhou': '潮州', 'donggang': '東港', 'hengchun': '恆春',
                'wandan': '萬丹', 'changzhi': '長治', 'linluo': '麟洛', 'jiuru': '九如',
                'ligang': '里港', 'gaoshu': '高樹', 'yanpu': '鹽埔', 'majia': '瑪家',
                'taiwu': '泰武', 'laiyi': '來義', 'chunri': '春日', 'shizi': '獅子',
                'mudan': '牡丹', 'checheng': '車城', 'manzhou': '滿州', 'fangshan': '枋山',
                'fangliao': '枋寮', 'jiadong': '佳冬', 'linbian': '林邊', 'nanzhou': '南州',
                'kanding': '崁頂', 'xinpi': '新埤', 'zhutian': '竹田', 'xinyuan': '新園',
                'sandimen': '三地門', 'wutai': '霧臺',
                // 高雄常見區
                'fengshan': '鳳山', 'daliao': '大寮', 'niaosong': '鳥松', 'renwu': '仁武',
                'dashe': '大社', 'gangshan': '岡山', 'qiaotou': '橋頭', 'nanzi': '楠梓'
            };
            
            function getChineseCity(enName) {
                if (!enName) return '';
                let clean = enName.split(',')[0].toLowerCase().replace(' city', '').replace(' county', '').replace(' township', '').replace(' district', '').trim();
                return cityTranslation[clean] || enName.split(',')[0];
            }

            const weatherCondMap = {
                'clear': '晴朗', 'sunny': '晴天', 'partly cloudy': '多雲時晴', 'cloudy': '多雲', 'overcast': '陰天',
                'mist': '薄霧', 'fog': '起霧', 'freezing fog': '冰霧',
                'patchy rain possible': '可能有零星降雨', 'patchy light drizzle': '零星小毛毛雨', 'light drizzle': '小毛毛雨',
                'freezing drizzle': '凍毛毛雨', 'heavy freezing drizzle': '強凍毛毛雨',
                'patchy light rain': '零星小雨', 'light rain': '綿綿細雨', 'moderate rain at times': '時有中雨',
                'moderate rain': '中雨', 'heavy rain at times': '時有大雨', 'heavy rain': '大雨',
                'light freezing rain': '小凍雨', 'moderate or heavy freezing rain': '中到大凍雨',
                'light sleet': '小冰霰', 'moderate or heavy sleet': '中到大冰霰',
                'patchy light snow': '零星小雪', 'light snow': '小雪', 'patchy moderate snow': '零星中雪',
                'moderate snow': '中雪', 'patchy heavy snow': '零星大雪', 'heavy snow': '大雪',
                'ice pellets': '冰雹', 'light rain shower': '局部陣雨', 'moderate or heavy rain shower': '中到大陣雨',
                'torrential rain shower': '暴雨', 'light sleet showers': '小陣冰霰', 'moderate or heavy sleet showers': '中到大陣冰霰',
                'light snow showers': '小陣雪', 'moderate or heavy snow showers': '中到大陣雪',
                'light showers of ice pellets': '小陣冰雹', 'moderate or heavy showers of ice pellets': '中到大陣冰雹',
                'patchy light rain with thunder': '零星雷陣雨', 'moderate or heavy rain with thunder': '中到大雷陣雨',
                'patchy light snow with thunder': '零星雷陣雪', 'moderate or heavy snow with thunder': '中到大雷陣雪'
            };

            function translateWeatherStr(str) {
                if (!str) return '';
                let result = str.replace(/\+/g, '');
                const sortedKeys = Object.keys(weatherCondMap).sort((a, b) => b.length - a.length);
                sortedKeys.forEach(enWord => {
                    const regex = new RegExp(enWord, 'gi');
                    result = result.replace(regex, weatherCondMap[enWord]);
                });
                result = result.replace(/[a-zA-Z]/g, '').trim(); 
                return result;
            }

            cityName = getChineseCity(cityName);
            weatherRes = translateWeatherStr(weatherRes);

            const isCoord = /^[0-9.,\s-]+$/.test(cityName);
            
            if (cityName && !isCoord && weatherRes && !weatherRes.includes('<html>')) {
                weatherInfo.textContent = `📍 ${cityName} : ${weatherRes}`;
                weatherInfo.style.display = 'inline-block';
            } else if (weatherRes && !weatherRes.includes('<html>')) {
                // 如果抓不到精確地名，預設為「屏東」
                weatherInfo.textContent = `📍 屏東 : ${weatherRes}`;
                weatherInfo.style.display = 'inline-block';
            } else {
                weatherInfo.style.display = 'none';
            }
        } catch (err) {
            weatherInfo.style.display = 'none';
        }
    }
    
    // 初始化天氣並設定 30 分鐘刷新
    updateWeather();
    setInterval(updateWeather, 30 * 60 * 1000);

    // 點擊觸發 GPS 精確定位
    const wInfo = document.getElementById('weatherInfo');
    if (wInfo) {
        wInfo.addEventListener('click', () => {
            if (wInfo.textContent.includes('定位中')) return;
            updateWeather(true);
        });
    } 
    
    // Live display
    const liveTotalQty = document.getElementById('liveTotalQty');
    const liveTotalLength = document.getElementById('liveTotalLength');
    
    // 狀態
    let currentResult = null;
    let currentViewMode = 'visual';
    let lengthColorMap = {};
    let currentDeduct = 0; // 全域扣除值

    // 全域扣除按鈕組
    const deductBtns = document.querySelectorAll('.deduct-btn');
    const deductLabel = document.getElementById('deductLabel');
    deductLabel.textContent = `(橫料標定扣除 −${currentDeduct}mm)`;
    deductBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentDeduct = parseFloat(btn.dataset.value) || 0;
            deductBtns.forEach(b => {
                const isActive = b === btn;
                b.style.background = isActive ? 'var(--accent-blue)' : 'var(--bg-tertiary)';
                b.style.color = isActive ? 'white' : 'var(--text-secondary)';
            });
            deductLabel.textContent = `(橫料標定扣除 −${currentDeduct}mm)`;
            // 更新所有列的完成尺寸
            document.querySelectorAll('.input-row').forEach(row => updateFinishedSize(row));
            handleLiveCalculate();
            
            // 實時連動：如果已經有輸入數據，則自動重新計算右側報表內容
            const reqData = collectData(requirementsContainer);
            if (reqData.length > 0) {
                handleCalculate();
            }
        });
    });

    // 顏色配置字典
    const colorPalette = [
        '#3b82f6', // blue
        '#8b5cf6', // purple
        '#10b981', // emerald
        '#f59e0b', // amber
        '#ec4899', // pink
        '#06b6d4', // cyan
        '#6366f1', // indigo
        '#14b8a6', // teal
        '#f43f5e', // rose
        '#84cc16'  // lime
    ];

    function prepareColorMap(reqData) {
        lengthColorMap = {};
        let uniqueLengths = [...new Set(reqData.map(r => r.length))].sort((a,b) => b-a);
        uniqueLengths.forEach((len, idx) => {
            lengthColorMap[len] = colorPalette[idx % colorPalette.length];
        });
    }
    
    addRow(requirementsContainer);

    // Tab Switch Logic
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            tabBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            updateDisplayView();
        });
    });

    // View Mode Switch Logic
    modeVisualBtn.addEventListener('click', () => {
        currentViewMode = 'visual';
        modeVisualBtn.style.background = 'var(--accent-blue)';
        modeVisualBtn.style.color = 'white';
        modeVisualBtn.style.borderColor = 'var(--accent-blue)';
        
        modeTextBtn.style.background = 'transparent';
        modeTextBtn.style.color = 'var(--text-secondary)';
        modeTextBtn.style.borderColor = 'rgba(255,255,255,0.1)';
        
        updateDisplayView();
    });

    modeTextBtn.addEventListener('click', () => {
        currentViewMode = 'text';
        modeTextBtn.style.background = 'var(--accent-blue)';
        modeTextBtn.style.color = 'white';
        modeTextBtn.style.borderColor = 'var(--accent-blue)';
        
        modeVisualBtn.style.background = 'transparent';
        modeVisualBtn.style.color = 'var(--text-secondary)';
        modeVisualBtn.style.borderColor = 'rgba(255,255,255,0.1)';
        
        updateDisplayView();
    });

    copyReportBtn.addEventListener('click', () => {
        simpleReportText.select();
        document.execCommand('copy');
        
        const oriText = copyReportBtn.textContent;
        copyReportBtn.textContent = '✅ 已成功複製到剪貼簿！';
        copyReportBtn.style.background = 'var(--accent-green)';
        setTimeout(() => {
            copyReportBtn.textContent = oriText;
            copyReportBtn.style.background = 'var(--accent-blue)';
        }, 2000);
    });

    // 另存為 Word 報表
    exportWordBtn.addEventListener('click', () => {
        if (!currentResult) {
            alert('請先產生採購報表！');
            return;
        }
        exportToWord();
    });

    function exportToWord() {
        const projectName = document.getElementById('projectNameInput').value || '未命名專案';
        const dateStr = new Date().toLocaleString('zh-TW');
        const wRes = currentResult.widthResult;
        const lRes = currentResult.lengthResult;
        const materialModelW = materialModelInputW.value.trim();
        const materialModelL = materialModelInputL.value.trim();
        
        // 取得當前所選方案 (plan6000 / plan6400 / planMixed)
        const activeTab = document.querySelector('.plan-tab.active');
        const planKey = activeTab ? activeTab.dataset.target : 'planMixed';
        const planNameMapping = {
            'plan6000': '方案 A: 純 6000mm',
            'plan6400': '方案 B: 純 6400mm',
            'planMixed': '方案 C: 混合雙料'
        };
        const planName = planNameMapping[planKey] || '裁切報表';

        function formatPlanCount(plan) {
            if (!plan) return '0';
            if (plan.totalSticks6000 !== undefined) {
                return `${plan.totalSticks6000} 支 (6M) + ${plan.totalSticks6400} 支 (6.4M)`;
            }
            return `${plan.totalSticks} 支`;
        }

        function generateTableFromPatterns(patterns) {
            if (!patterns || patterns.length === 0) return '<p style="color:#888;">無裁切數據</p>';
            let tableHtml = '<table style="width:100%; border-collapse:collapse; margin-bottom:20px; font-size:12px;">' +
                           '<thead><tr style="background-color:#f2f2f2;">' +
                           '<th style="border:1px solid #333; padding:6px; width:50px;">編號</th>' +
                           '<th style="border:1px solid #333; padding:6px; width:100px;">原始長度</th>' +
                           '<th style="border:1px solid #333; padding:6px;">裁切流明細 (淨長)</th>' +
                           '<th style="border:1px solid #333; padding:6px; width:80px;">剩餘廢料</th>' +
                           '</tr></thead><tbody>';
            
            patterns.forEach((p, i) => {
                let cutsSummary = {};
                p.cuts.forEach(c => { cutsSummary[c] = (cutsSummary[c] || 0) + 1; });
                let summaryStr = Object.keys(cutsSummary)
                    .sort((a,b) => Number(b) - Number(a))
                    .map(c => `${c}x${cutsSummary[c]}`)
                    .join('、');
                let detailText = `拿 <strong>${p.count} 支</strong> ${p.stock}mm 鋁料，裁切內容：${summaryStr}`;
                
                tableHtml += `<tr>
                    <td style="border:1px solid #333; padding:6px; text-align:center;">${i + 1}</td>
                    <td style="border:1px solid #333; padding:6px; text-align:center;">${p.stock} mm</td>
                    <td style="border:1px solid #333; padding:6px;">${detailText}</td>
                    <td style="border:1px solid #333; padding:6px; text-align:center; color:${p.waste > 100 ? '#e11d48' : '#333'}">${p.waste} mm</td>
                </tr>`;
            });
            tableHtml += '</tbody></table>';
            return tableHtml;
        }

        const html = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head><meta charset='utf-8'><title>裁切報表 - ${projectName}</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333; }
                .header-title { color: #2b579a; border-bottom: 2px solid #2b579a; padding-bottom: 10px; margin-bottom: 20px; text-align: center; }
                .info-grid { margin-bottom: 25px; }
                .section-header { background-color: #2b579a; color: white; padding: 8px 15px; margin: 30px 0 15px 0; font-weight: bold; border-radius: 4px; }
                .summary-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                .summary-table th, .summary-table td { border: 1px solid #ccc; padding: 10px; text-align: center; }
                .summary-table th { background-color: #f8f9fa; }
                .compact-list { background-color: #f1f1f1; padding: 15px; border: 1px solid #ddd; font-family: 'Consolas', monospace; white-space: pre-wrap; font-size: 11px; }
                .footer { margin-top: 50px; text-align: right; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
                .page-break { page-break-before: always; }
            </style>
            </head>
            <body>
                <div class="header-title">
                    <h1>德昌鋁計算機 - 專業裁切採購報表</h1>
                </div>

                <div class="info-grid">
                    <p><strong>專案名稱：</strong> ${projectName}</p>
                    <p><strong>產生日期：</strong> ${dateStr}</p>
                    <p><strong>選定方案：</strong> ${planName}</p>
                </div>

                <div class="section-header">一、 採購統計概覽</div>
                <table class="summary-table">
                    <thead>
                        <tr>
                            <th>項目類型</th>
                            <th>指定型號</th>
                            <th>所需總長 (含鋸片)</th>
                            <th>建議採購支數</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>橫料 (寬度)</strong></td>
                            <td>887 (8公分)</td>
                            <td>${wRes ? Math.round(wRes.totalLength) : 0} mm</td>
                            <td>${wRes ? formatPlanCount(wRes[planKey]) : 0}</td>
                        </tr>
                        <tr>
                            <td><strong>直料 (長度)</strong></td>
                            <td>1087 (10公分)</td>
                            <td>${lRes ? Math.round(lRes.totalLength) : 0} mm</td>
                            <td>${lRes ? formatPlanCount(lRes[planKey]) : 0}</td>
                        </tr>
                    </tbody>
                </table>

                <br clear="all" style="page-break-before:always" />

                <div class="section-header">二、 裁切流詳細清單 (正式表格)</div>
                <h3 style="color: #10b981;">↔️ 總橫料長 ${materialModelW ? '(' + materialModelW + ')' : ''}</h3>
                <p style="font-weight:bold; color:#10b981; margin-bottom:10px;">總計需採購：${wRes ? formatPlanCount(wRes[planKey]) : 0}</p>
                ${generateTableFromPatterns(wRes ? wRes[planKey].patterns : [])}
                
                <h3 style="color: #475569;">↕️ 總直料長 ${materialModelL ? '(' + materialModelL + ')' : ''}</h3>
                <p style="font-weight:bold; color:#475569; margin-bottom:10px;">總計需採購：${lRes ? formatPlanCount(lRes[planKey]) : 0}</p>
                ${generateTableFromPatterns(lRes ? lRes[planKey].patterns : [])}

                <br clear="all" style="page-break-before:always" />

                <div class="section-header">三、 精簡裁切清單 (一鍵複製專用格式)</div>
                <div class="compact-list">${simpleReportText.value.replace(/\n/g, '<br>')}</div>

                <div class="footer">
                    此報表由 德昌鋁計算機 (混合高規版) 自動生成。所有計算結果僅供參考，請於實際裁切前再次核對尺寸。
                </div>
            </body>
            </html>
        `;

        const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `裁切報表_${projectName}_${new Date().toLocaleDateString().replace(/\//g, '-')}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }


    addReqBtn.addEventListener('click', () => addRow(requirementsContainer));
    
    removeReqBtn.addEventListener('click', () => {
        if (requirementsContainer.children.length > 1) {
            const lastChild = requirementsContainer.lastElementChild;
            lastChild.classList.add('fade-out-up'); // 加入退出動畫
            setTimeout(() => {
                lastChild.remove();
                updateRowIndices();
                handleLiveCalculate();
            }, 250); // 等待動畫完成
        } else if (requirementsContainer.children.length === 1) {
            // Cannot remove the last standing row, just reset it
            const div = requirementsContainer.firstElementChild;
            div.querySelector('.input-width').value = '';
            div.querySelector('.input-len').value = '';
            div.querySelector('.input-qty').value = '';
            updateFinishedSize(div);
            handleLiveCalculate();
        }
    });
    
    resetBtn.addEventListener('click', () => {
        requirementsContainer.innerHTML = '';
        addRow(requirementsContainer);
        kerfInput.value = '5';
        // 重置全域扣除按鈕
        currentDeduct = 0;
        deductBtns.forEach(b => {
            const isZero = b.dataset.value === '0';
            b.style.background = isZero ? 'var(--accent-blue)' : 'var(--bg-tertiary)';
            b.style.color = isZero ? 'white' : 'var(--text-secondary)';
        });
        deductLabel.textContent = `(橫料標定扣除 −0mm)`;
        projectNameInput.value = '';
        materialModelInputW.value = '';
        materialModelInputL.value = '';
        updateModelLabels();
        hideResult();
        handleLiveCalculate();

        // 移除總和看板的發光特效
        const summaryBoard = document.getElementById('realtimeSummary');
        if (summaryBoard) summaryBoard.classList.remove('glow-effect');
    });
    
    calculateBtn.addEventListener('click', handleCalculate);
    kerfInput.addEventListener('input', handleLiveCalculate);
    requirementsContainer.addEventListener('input', handleLiveCalculate);
    projectNameInput.addEventListener('input', handleLiveCalculate);
    materialModelInputW.addEventListener('input', () => { handleLiveCalculate(); updateModelLabels(); });
    materialModelInputL.addEventListener('input', () => { handleLiveCalculate(); updateModelLabels(); });

    function updateModelLabels() {
        const valW = materialModelInputW.value.trim();
        const valL = materialModelInputL.value.trim();
        const labelW = valW ? `(${valW})` : '';
        const labelL = valL ? `(${valL})` : '';
        
        document.querySelectorAll('.label-model-w').forEach(el => el.textContent = labelW);
        document.querySelectorAll('.label-model-l').forEach(el => el.textContent = labelL);
    }

    function handleLiveCalculate() {
        if (errorContainer) errorContainer.classList.add('hidden');
        const reqData = collectData(requirementsContainer);
        const kerf = parseFloat(kerfInput.value) || 0;
        let sumW = 0;
        let sumL = 0;
        let totalW_kerf = 0;
        let totalL_kerf = 0;

        reqData.forEach(req => {
            if (req.type === '寬') {
                sumW += req.length * req.qty;
                totalW_kerf += (req.length + kerf) * req.qty;
            } else {
                sumL += req.length * req.qty;
                totalL_kerf += (req.length + kerf) * req.qty;
            }
        });

        const lw = document.getElementById('liveSumW');
        const ll = document.getElementById('liveSumL');
        const ltw = document.getElementById('liveTotalLengthW');
        const ltl = document.getElementById('liveTotalLengthL');
        
        if (lw) lw.textContent = Number.isInteger(sumW) ? sumW : sumW.toFixed(1);
        if (ll) ll.textContent = Number.isInteger(sumL) ? sumL : sumL.toFixed(1);
        if (ltw) ltw.textContent = Number.isInteger(totalW_kerf) ? totalW_kerf : totalW_kerf.toFixed(1);
        if (ltl) ltl.textContent = Number.isInteger(totalL_kerf) ? totalL_kerf : totalL_kerf.toFixed(1);
        
        // 實時連動：如果報表已產生，則即時更新顯示內容 (例如專案名稱或型號)
        updateDisplayView();
        
        // 顏色連動 (橫料看板)
        if (lw && ltw) {
            const boxW = document.getElementById('boxSumW');
            const boxRW = ltw.parentElement.parentElement; // 橫料鋁需容器
            
            if (currentDeduct === 0) {
                lw.style.color = '#10b981';
                ltw.style.color = '#10b981';
                if (boxW) {
                    boxW.style.borderColor = 'rgba(16,185,129,0.3)';
                    boxW.style.backgroundColor = 'rgba(0,0,0,0.2)';
                }
                if (boxRW) {
                    boxRW.style.borderColor = 'rgba(16,185,129,0.3)';
                    boxRW.style.backgroundColor = 'rgba(0,0,0,0.2)';
                }
            } else if (currentDeduct === 51) {
                lw.style.color = '#ff3333';
                ltw.style.color = '#ff3333';
                if (boxW) {
                    boxW.style.borderColor = 'rgba(255,51,51,0.4)';
                    boxW.style.backgroundColor = 'rgba(255,51,51,0.08)';
                }
                if (boxRW) {
                    boxRW.style.borderColor = 'rgba(255,51,51,0.4)';
                    boxRW.style.backgroundColor = 'rgba(255,51,51,0.08)';
                }
            } else {
                lw.style.color = '#f59e0b';
                ltw.style.color = '#f59e0b';
                if (boxW) {
                    boxW.style.borderColor = 'rgba(245,158,11,0.4)';
                    boxW.style.backgroundColor = 'rgba(245,158,11,0.08)';
                }
                if (boxRW) {
                    boxRW.style.borderColor = 'rgba(245,158,11,0.4)';
                    boxRW.style.backgroundColor = 'rgba(245,158,11,0.08)';
                }
            }
        }

        // --- 實時更新：採購需求與裁切建議 ---
        const summaryBoard = document.getElementById('realtimeSummary');
        if (reqData.length > 0) {
            if (summaryBoard) summaryBoard.classList.add('glow-effect');
            const widthReqs = reqData.filter(r => r.type === '寬');
            const lengthReqs = reqData.filter(r => r.type === '長');
            
            const liveResult = {
                widthResult: widthReqs.length > 0 ? window.calculateOptimization(widthReqs, kerf) : null,
                lengthResult: lengthReqs.length > 0 ? window.calculateOptimization(lengthReqs, kerf) : null,
                success: true
            };

            // 更新採購看板數字與 Tab 標記
            renderSummaryNumbers(liveResult);
            
            // 如果結果區域已經開啟(例如按過一次開始計算)，則同步更新詳細圖解/文字
            if (!summaryStats.classList.contains('hidden')) {
                prepareColorMap(reqData);
                currentResult = liveResult;
                planTabs.classList.remove('hidden');
                viewModeToggle.classList.remove('hidden');
                updateDisplayView();
            }
        } else {
            if (summaryBoard) summaryBoard.classList.remove('glow-effect');
            // 如果完全沒資料，隱藏結果
            if (!summaryStats.classList.contains('hidden')) {
                hideResult();
            }
        }
    }

    function handleCalculate() {
        errorContainer.classList.add('hidden');
        const reqData = collectData(requirementsContainer);
        const kerf = parseFloat(kerfInput.value) || 0;
        if (reqData.length === 0) {
            showError("請至少輸入一筆有效的「裁切寬度或長度」，並確認數量大於 0。");
            return;
        }
        prepareColorMap(reqData);
        
        const widthReqs = reqData.filter(r => r.type === '寬');
        const lengthReqs = reqData.filter(r => r.type === '長');
        
        currentResult = {
            widthResult: widthReqs.length > 0 ? window.calculateOptimization(widthReqs, kerf) : null,
            lengthResult: lengthReqs.length > 0 ? window.calculateOptimization(lengthReqs, kerf) : null,
            success: true
        };
        
        // Check successes
        if (currentResult.widthResult && !currentResult.widthResult.success) currentResult.success = false;
        if (currentResult.lengthResult && !currentResult.lengthResult.success) currentResult.success = false;
        
        renderSummaryNumbers(currentResult);
        
        // Ensure plan tabs and view mode toggles are visible
        planTabs.classList.remove('hidden');
        viewModeToggle.classList.remove('hidden');
        
        updateDisplayView();

        // 如果是手機版，自動切換至報表畫面
        if (window.innerWidth <= 800 && navReportBtn) {
            switchToReport();
        }

        if (!currentResult.success) {
            showError('警告：您的輸入包含大於鋁材原始長度 (6400) 的需求，因無法裁切已被略過！');
        }
    }
    
    function updateFinishedSize(div) {
        const wEl = div.querySelector('.input-width');
        const lEl = div.querySelector('.input-len');
        const finCont = div.querySelector('.input-finished-container');
        const fwEl = div.querySelector('.finish-w');
        const flEl = div.querySelector('.finish-l');
        
        if (!finCont) return;

        const w = parseFloat(wEl.value);
        const l = parseFloat(lEl.value);
        
        let hasData = false;

        // Width deducted
        if (!isNaN(w) && w > 0) {
            const fw = w - currentDeduct;
            fwEl.textContent = fw % 1 === 0 ? fw : fw.toFixed(1);
            hasData = true;
        } else {
            fwEl.textContent = '—';
        }

        // Length NOT deducted
        if (!isNaN(l) && l > 0) {
            flEl.textContent = l % 1 === 0 ? l : l.toFixed(1);
            hasData = true;
        } else {
            flEl.textContent = '—';
        }

        // Setup colors based on deduction
        if (currentDeduct === 51) {
            fwEl.style.color = '#ff3333';
            finCont.style.borderColor = 'rgba(255,51,51,0.5)';
            finCont.style.background = 'rgba(255,51,51,0.12)';
        } else if (currentDeduct > 0) {
            fwEl.style.color = '#f59e0b';
            finCont.style.borderColor = 'rgba(245,158,11,0.4)';
            finCont.style.background = 'rgba(245,158,11,0.1)';
        } else {
            fwEl.style.color = '#10b981';
            finCont.style.borderColor = 'rgba(16,185,129,0.35)';
            finCont.style.background = 'rgba(16,185,129,0.12)';
        }
        
        if(!hasData) {
            fwEl.style.color = 'var(--text-secondary)';
            flEl.style.color = 'var(--text-secondary)';
        }
    }

    function updateRowIndices() {
        const rows = document.querySelectorAll('#requirementsContainer .input-row');
        rows.forEach((row, index) => {
            const numEl = row.querySelector('.row-num');
            if (numEl) {
                numEl.textContent = index + 1;
            }
        });
    }

    function addRow(container) {
        const row = template.content.cloneNode(true);
        const div = row.querySelector('.input-row');
        const wInput = div.querySelector('.input-width');
        const lInput = div.querySelector('.input-len');
        const qtyInput = div.querySelector('.input-qty');

        const numContainer = div.querySelector('.row-num-container');
        numContainer.title = "點一下新增，連點兩下刪除";
        
        let clickTimer = null;
        numContainer.addEventListener('click', (e) => {
            if (clickTimer === null) {
                clickTimer = setTimeout(() => {
                    // 單擊：新增一行 (在末尾)
                    addRow(requirementsContainer);
                    clickTimer = null;
                }, 250); // 250ms 判斷延遲
            } else {
                clearTimeout(clickTimer);
                clickTimer = null;
                // 雙擊：刪除目前這一行
                if (requirementsContainer.children.length > 1) {
                    div.classList.add('fade-out-up');
                    setTimeout(() => {
                        div.remove();
                        updateRowIndices();
                        handleLiveCalculate();
                    }, 250);
                } else {
                    // 最後一行則清空
                    wInput.value = '';
                    lInput.value = '';
                    qtyInput.value = '';
                    updateFinishedSize(div);
                    handleLiveCalculate();
                }
            }
        });

        // --- 核心滑動與排序邏輯：支援觸控 (Touch) 與 滑鼠 (Mouse) ---
        let startX = 0, startY = 0, isDragging = false;
        let activeSwipe = false, activeReorder = false;
        let initialY = 0;

        const handleStart = (x, y) => {
            startX = x; startY = y;
            initialY = div.offsetTop;
            isDragging = true; 
            activeSwipe = false; activeReorder = false;
            div.style.transition = 'none';
        };

        const handleMove = (x, y, e) => {
            if (!isDragging) return;
            const diffX = x - startX;
            const diffY = y - startY;

            // 1. 方向判定：橫向滑動 vs 縱向排序
            if (!activeSwipe && !activeReorder) {
                if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
                    activeSwipe = true;
                } else if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 10) {
                    activeReorder = true;
                }
            }

            // 2. 模式 A：左右滑動 (套用視差特效 Option 2)
            if (activeSwipe) {
                if (e.cancelable) e.preventDefault();
                const moveAmount = diffX > 0 ? Math.pow(diffX, 0.95) : diffX;
                div.style.transform = `translateX(${moveAmount}px) scale(1.02)`;
                div.style.zIndex = '100';
                
                // --- 實作視差位移 (Parallax) ---
                const children = [
                    {el: div.querySelector('.row-num-container'), speed: 1.0},
                    {el: div.querySelector('.input-width'), speed: 0.85},
                    {el: div.querySelector('.separator'), speed: 0.8},
                    {el: div.querySelector('.input-len'), speed: 0.75},
                    {el: div.querySelector('.input-finished-container'), speed: 0.7},
                    {el: div.querySelector('.input-qty'), speed: 0.65}
                ];
                children.forEach(item => {
                    if (item.el) item.el.style.transform = `translateX(${(moveAmount * (item.speed - 1))}px)`;
                });

                if (diffX > 50) {
                    div.style.boxShadow = `-8px 0 20px rgba(239, 68, 68, ${Math.min(0.4, diffX/200)})`;
                    div.style.background = `linear-gradient(90deg, rgba(239, 68, 68, ${Math.min(0.25, (diffX-50)/400)}) 0%, transparent 100%)`;
                } else if (diffX < -50) {
                    div.style.boxShadow = `8px 0 20px rgba(16, 185, 129, ${Math.min(0.4, Math.abs(diffX)/200)})`;
                    div.style.background = `linear-gradient(-90deg, rgba(16, 185, 129, ${Math.min(0.25, (Math.abs(diffX)-50)/400)}) 0%, transparent 100%)`;
                } else {
                    div.style.boxShadow = ''; div.style.background = '';
                }
            }

            // 3. 模式 B：上下拖拽排序 (實作隨動排序 Option 1)
            if (activeReorder) {
                if (e.cancelable) e.preventDefault();
                div.style.transform = `translateY(${diffY}px) scale(1.03)`;
                div.style.zIndex = '1000';
                div.style.boxShadow = '0 10px 30px rgba(0,0,0,0.4)';
                div.style.background = 'var(--bg-tertiary)';
                
                // 碰撞檢查：檢查是否需要與鄰居交換位置
                const siblings = [...requirementsContainer.querySelectorAll('.input-row:not(.dragging)')];
                const nextSibling = siblings.find(sib => {
                    return (y > sib.getBoundingClientRect().top + sib.offsetHeight / 2);
                });
                
                // 這裡簡化邏輯：尋找目前 Y 座標對應的鄰居並移動 DOM
                const rect = div.getBoundingClientRect();
                const centerY = rect.top + rect.height / 2;
                
                const prev = div.previousElementSibling;
                const next = div.nextElementSibling;
                
                if (prev && centerY < prev.getBoundingClientRect().top + prev.offsetHeight / 2) {
                    requirementsContainer.insertBefore(div, prev);
                    startY = y; // 重置起點以維持平滑
                } else if (next && centerY > next.getBoundingClientRect().top + next.offsetHeight / 2) {
                    requirementsContainer.insertBefore(next, div);
                    startY = y; 
                }
            }
        };

        const handleEnd = (x, y) => {
            if (!isDragging) return;
            isDragging = false;
            const diffX = x - startX;
            
            div.style.transition = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            div.style.zIndex = '';
            div.style.transform = 'translate(0, 0) scale(1)';
            div.style.background = '';
            div.style.boxShadow = '';
            
            // 重置所有子元素的視差位移
            div.querySelectorAll('.row-num-container, .input-width, .separator, .input-len, .input-finished-container, .input-qty').forEach(el => {
                if (el) el.style.transform = '';
                el.style.transition = 'transform 0.4s ease';
            });

            if (activeSwipe && diffX > 120) {
                if (requirementsContainer.children.length > 1) {
                    div.style.transform = `translateX(${window.innerWidth}px)`;
                    div.style.opacity = '0';
                    setTimeout(() => {
                        div.remove(); updateRowIndices(); handleLiveCalculate();
                    }, 300);
                } else {
                    wInput.value = ''; lInput.value = ''; qtyInput.value = '';
                    updateFinishedSize(div); handleLiveCalculate();
                }
            } else if (activeSwipe && diffX < -120) {
                div.style.background = 'rgba(16, 185, 129, 0.3)';
                setTimeout(() => div.style.background = '', 400);
            }
            
            if (activeReorder) {
                updateRowIndices();
                handleLiveCalculate();
            }
        };

        // 監聽觸控與滑鼠
        div.addEventListener('touchstart', e => handleStart(e.touches[0].screenX, e.touches[0].screenY), {passive:true});
        div.addEventListener('touchmove', e => handleMove(e.touches[0].screenX, e.touches[0].screenY, e), {passive:false});
        div.addEventListener('touchend', e => handleEnd(e.changedTouches[0].screenX, e.changedTouches[0].screenY), {passive:true});

        div.addEventListener('mousedown', e => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
            handleStart(e.screenX, e.screenY);
            const mouseMove = ev => handleMove(ev.screenX, ev.screenY, ev);
            const mouseUp = ev => {
                handleEnd(ev.screenX, ev.screenY);
                window.removeEventListener('mousemove', mouseMove);
                window.removeEventListener('mouseup', mouseUp);
            };
            window.addEventListener('mousemove', mouseMove);
            window.addEventListener('mouseup', mouseUp);
        });
        
        div.style.cursor = 'grab';
        div.addEventListener('mousedown', (e) => {
            if (e.target.tagName !== 'INPUT') div.style.cursor = 'grabbing';
        });
        div.addEventListener('mouseup', () => div.style.cursor = 'grab');

        const triggerChange = () => { updateFinishedSize(div); handleLiveCalculate(); };
        wInput.addEventListener('input', triggerChange);
        lInput.addEventListener('input', triggerChange);
        qtyInput.addEventListener('input', triggerChange);

        container.appendChild(div);
        updateFinishedSize(div);
        updateRowIndices();
        handleLiveCalculate();
    }
    
    function collectData(container) {
        let data = [];
        const rows = container.querySelectorAll('.input-row');
        rows.forEach(row => {
            const wVal = parseFloat(row.querySelector('.input-width').value);
            const lVal = parseFloat(row.querySelector('.input-len').value);
            const qtyVal = parseInt(row.querySelector('.input-qty').value, 10);
            
            if (isNaN(qtyVal) || qtyVal <= 0) return;

            if (!isNaN(wVal) && wVal > 0) {
                const finishedW = wVal - currentDeduct;
                data.push({ length: finishedW, qty: qtyVal, displayLength: wVal, deduct: currentDeduct, type: '寬' });
            }
            if (!isNaN(lVal) && lVal > 0) {
                data.push({ length: lVal, qty: qtyVal, displayLength: lVal, deduct: 0, type: '長' });
            }
        });
        return data;
    }
    
    function showError(msg) {
        errorContainer.textContent = msg;
        errorContainer.classList.remove('hidden');
    }
    
    function hideResult() {
        summaryStats.classList.add('hidden');
        emptyState.classList.remove('hidden');
        planTabs.classList.add('hidden');
        viewModeToggle.classList.add('hidden');
        view6000.classList.add('hidden');
        view6400.classList.add('hidden');
        viewMixed.classList.add('hidden');
        simpleReportContainer.classList.add('hidden');
        errorContainer.classList.add('hidden');
        currentResult = null;
    }

    function renderSummaryNumbers(result) {
        emptyState.classList.add('hidden');
        summaryStats.classList.remove('hidden');
        
        const wRes = result.widthResult;
        const lRes = result.lengthResult;
        
        const totalWLength = wRes ? wRes.totalLength : 0;
        const totalLLength = lRes ? lRes.totalLength : 0;
        
        const valTotalW = document.getElementById('valTotalW');
        valTotalW.textContent = (Number.isInteger(totalWLength) ? totalWLength : totalWLength.toFixed(1)) + ' mm';
        
        // 顏色連動 (右側摘要)
        if (currentDeduct === 0) valTotalW.style.color = '#10b981';
        else if (currentDeduct === 51) valTotalW.style.color = '#ff3333';
        else valTotalW.style.color = '#f59e0b';

        document.getElementById('valTotalL').textContent = (Number.isInteger(totalLLength) ? totalLLength : totalLLength.toFixed(1)) + ' mm';

        const c6000w = wRes ? wRes.plan6000.totalSticks : 0;
        const c6000l = lRes ? lRes.plan6000.totalSticks : 0;
        const el6000 = document.getElementById('tabCnt6000');
        if (el6000) el6000.textContent = `橫 ${c6000w} / 直 ${c6000l}`;
        const elBtn6000 = document.getElementById('tabCntBtn6000');
        if (elBtn6000) elBtn6000.textContent = `橫 ${c6000w} / 直 ${c6000l}`;
        
        const c6400w = wRes ? wRes.plan6400.totalSticks : 0;
        const c6400l = lRes ? lRes.plan6400.totalSticks : 0;
        const el6400 = document.getElementById('tabCnt6400');
        if (el6400) el6400.textContent = `橫 ${c6400w} / 直 ${c6400l}`;
        const elBtn6400 = document.getElementById('tabCntBtn6400');
        if (elBtn6400) elBtn6400.textContent = `橫 ${c6400w} / 直 ${c6400l}`;
        
        const cmixedw = wRes ? wRes.planMixed.totalSticks : 0;
        const cmixedl = lRes ? lRes.planMixed.totalSticks : 0;
        const elBtnMixed = document.getElementById('tabCntBtnMixed');
        if (elBtnMixed) elBtnMixed.textContent = `橫 ${cmixedw} / 直 ${cmixedl}`;
    }

    // 更新顯示：決定顯示圖解還是文字報表
    function updateDisplayView() {
        if (!currentResult) return;
        
        const activeTab = document.querySelector('.plan-tab.active');
        const targetId = activeTab ? activeTab.getAttribute('data-target') : 'plan6000';

        const wRes = currentResult.widthResult;
        const lRes = currentResult.lengthResult;

        if (currentViewMode === 'visual') {
            simpleReportContainer.classList.add('hidden');
            
            view6000.classList.toggle('hidden', targetId !== 'plan6000');
            view6400.classList.toggle('hidden', targetId !== 'plan6400');
            viewMixed.classList.toggle('hidden', targetId !== 'planMixed');
            
            // 渲染 6000
            if (targetId === 'plan6000') {
                renderPlanPatterns(wRes ? wRes.plan6000.patterns : [], document.getElementById('patterns6000-w'));
                renderPlanPatterns(lRes ? lRes.plan6000.patterns : [], document.getElementById('patterns6000-l'));
                document.getElementById('count6000-w').textContent = `${wRes ? wRes.plan6000.totalSticks : 0} 支`;
                document.getElementById('count6000-l').textContent = `${lRes ? lRes.plan6000.totalSticks : 0} 支`;
            }
            
            // 渲染 6400
            if (targetId === 'plan6400') {
                renderPlanPatterns(wRes ? wRes.plan6400.patterns : [], document.getElementById('patterns6400-w'));
                renderPlanPatterns(lRes ? lRes.plan6400.patterns : [], document.getElementById('patterns6400-l'));
                document.getElementById('count6400-w').textContent = `${wRes ? wRes.plan6400.totalSticks : 0} 支`;
                document.getElementById('count6400-l').textContent = `${lRes ? lRes.plan6400.totalSticks : 0} 支`;
            }
            
            // 渲染 Mixed
            if (targetId === 'planMixed') {
                renderPlanPatterns(wRes ? wRes.planMixed.patterns : [], document.getElementById('patternsMixed-w'));
                renderPlanPatterns(lRes ? lRes.planMixed.patterns : [], document.getElementById('patternsMixed-l'));
                document.getElementById('mixedSum-w').innerHTML = `🛒 需買 <strong style="color:var(--text-primary);">${wRes ? wRes.planMixed.totalSticks6000 : 0}</strong> 支 6000 + <strong style="color:var(--text-primary);">${wRes ? wRes.planMixed.totalSticks6400 : 0}</strong> 支 6400`;
                document.getElementById('mixedSum-l').innerHTML = `🛒 需買 <strong style="color:var(--text-primary);">${lRes ? lRes.planMixed.totalSticks6000 : 0}</strong> 支 6000 + <strong style="color:var(--text-primary);">${lRes ? lRes.planMixed.totalSticks6400 : 0}</strong> 支 6400`;
            }
            
        } else {
            view6000.classList.add('hidden');
            view6400.classList.add('hidden');
            viewMixed.classList.add('hidden');
            
            simpleReportContainer.classList.remove('hidden');
            
            const projectName = projectNameInput.value.trim();
            const materialModelW = (materialModelInputW.value || '').trim();
            const materialModelL = (materialModelInputL.value || '').trim();
            let textRep = generateCombinedSimpleText(wRes, lRes, targetId, projectName, materialModelW, materialModelL);
            simpleReportText.value = textRep;
        }
    }

    function generateCombinedSimpleText(wRes, lRes, targetId, projectName, materialModelW, materialModelL) {
        let planName, stockLabel;
        if (targetId === 'plan6000') {
            planName = '方案 A (純 6000mm)'; stockLabel = 6000;
        } else if (targetId === 'plan6400') {
            planName = '方案 B (純 6400mm)'; stockLabel = 6400;
        } else {
            planName = '方案 C (混合雙料)'; stockLabel = -1;
        }

        const wPlan = wRes ? (targetId === 'plan6000' ? wRes.plan6000 : (targetId === 'plan6400' ? wRes.plan6400 : wRes.planMixed)) : null;
        const lPlan = lRes ? (targetId === 'plan6000' ? lRes.plan6000 : (targetId === 'plan6400' ? lRes.plan6400 : lRes.planMixed)) : null;
        
        const g6000 = (wPlan ? (wPlan.totalSticks6000 || 0) : 0) + (lPlan ? (lPlan.totalSticks6000 || 0) : 0);
        const g6400 = (wPlan ? (wPlan.totalSticks6400 || 0) : 0) + (lPlan ? (lPlan.totalSticks6400 || 0) : 0);
        const gTotal = (wPlan ? wPlan.totalSticks : 0) + (lPlan ? lPlan.totalSticks : 0);

        const titleProject = projectName ? ` - ${projectName}` : '';
        const suffixW = materialModelW ? ` (${materialModelW})` : '';
        const suffixL = materialModelL ? ` (${materialModelL})` : '';
        
        let text = `【德昌鋁材裁切報表${titleProject}】\n`;
        text += `【${planName}】\n`;
        
        text += `\n============================\n`;
        text += `📊 總計採購規模\n`;
        text += `============================\n`;
        if (stockLabel === -1) {
            text += `【橫】\n`;
            text += `採購數：6000:${wPlan ? wPlan.totalSticks6000 : 0}支 / 6400:${wPlan ? wPlan.totalSticks6400 : 0}支 (共${wPlan ? wPlan.totalSticks : 0}支)${suffixW}\n`;
            text += `【直】\n`;
            text += `採購數：6000:${lPlan ? lPlan.totalSticks6000 : 0}支 / 6400:${lPlan ? lPlan.totalSticks6400 : 0}支 (共${lPlan ? lPlan.totalSticks : 0}支)${suffixL}\n`;
            text += `【合計】\n`;
            text += `需買 6000mm：${g6000} 支\n`;
            text += `需買 6400mm：${g6400} 支\n`;
            text += `總計支數：${gTotal} 支\n`;
        } else {
            text += `【橫】：${wPlan ? wPlan.totalSticks : 0} 支${suffixW}\n`;
            text += `【直】：${lPlan ? lPlan.totalSticks : 0} 支${suffixL}\n`;
            text += `【合計】需買 ${stockLabel}mm：${gTotal} 支\n`;
        }
        
        text += `\n============================\n`;
        text += `↔️ 總橫料長 採購與裁切\n`;
        text += `============================\n`;
        text += formatSubplanText(wPlan, stockLabel, '橫', materialModelW);
        
        text += `\n============================\n`;
        text += `↕️ 總直料長 採購與裁切\n`;
        text += `============================\n`;
        text += formatSubplanText(lPlan, stockLabel, '直', materialModelL);
        
        // --- 懶人包區塊 ---
        text += `\n---懶人包--\n`;
        text += `裁切流 (單行精簡)：↔️ 橫料${suffixW}\n`;
        text += generateCompactLinesOnly(wPlan);
        text += `\n裁切流 (單行精簡)：↕️ 直料${suffixL}\n`;
        text += generateCompactLinesOnly(lPlan);

        text += `\n日期：${getDateString()}\n`;
        return text;
    }

    // 輔助函式：僅生成單行精簡裁切流內容
    function generateCompactLinesOnly(plan) {
        if (!plan || plan.patterns.length === 0) return "無裁切需求\n";
        let text = "";
        plan.patterns.forEach((pattern) => {
            let cutsSummary = {};
            pattern.cuts.forEach(c => { cutsSummary[c] = (cutsSummary[c] || 0) + 1; });
            let wasteVal = Number.isInteger(pattern.waste) ? pattern.waste : pattern.waste.toFixed(1);
            let cutsStr = Object.keys(cutsSummary).sort((a,b) => Number(b) - Number(a)).map(c => `${c}x${cutsSummary[c]}`).join(' ');
            text += `${pattern.stock}x${pattern.count}= ${cutsStr} 餘${wasteVal}\n`;
        });
        return text;
    }

    function formatSubplanText(plan, stockLabel, typeLabel, materialModel) {
        if(!plan || plan.patterns.length === 0) return "無裁切需求\n";
        
        let text = "";
        text += `採購數：`;
        if (stockLabel === -1) {
            text += `6000:${plan.totalSticks6000}支 / 6400:${plan.totalSticks6400}支 (共${plan.totalSticks}支)\n`;
        } else {
            text += `${plan.totalSticks} 支\n`;
        }
        
        const modelSuffix = materialModel ? ` (${materialModel})` : '';
        text += `\n裁切流：${typeLabel}料${modelSuffix}\n`;
        plan.patterns.forEach((pattern, i) => {
            let cutsSummary = {};
            pattern.cuts.forEach(c => { cutsSummary[c] = (cutsSummary[c] || 0) + 1; });
            let wasteVal = Number.isInteger(pattern.waste) ? pattern.waste : pattern.waste.toFixed(1);
            let summaryStr = Object.keys(cutsSummary)
                .sort((a,b) => Number(b) - Number(a))
                .map(c => `${c}mm x ${cutsSummary[c]}件`)
                .join('、');
            text += `${String(i + 1).padStart(2, ' ')}. [${pattern.count} 支 ${pattern.stock}] 切：${summaryStr} (餘 ${wasteVal})\n`;
        });
        
        text += `\n裁切流 (單行精簡)：${typeLabel}料${modelSuffix}\n`;
        plan.patterns.forEach((pattern) => {
            let cutsSummary = {};
            pattern.cuts.forEach(c => { cutsSummary[c] = (cutsSummary[c] || 0) + 1; });
            let wasteVal = Number.isInteger(pattern.waste) ? pattern.waste : pattern.waste.toFixed(1);
            let cutsStr = Object.keys(cutsSummary).sort((a,b) => Number(b) - Number(a)).map(c => `${c}x${cutsSummary[c]}`).join(' ');
            text += `${pattern.stock}x${pattern.count}= ${cutsStr} 餘${wasteVal}\n`;
        });
        
        return text;
    }

    function renderPlanPatterns(patterns, container) {
        container.innerHTML = '';
        if (patterns.length === 0) {
            container.innerHTML = '<p style="color:var(--text-secondary); text-align:center;">無可用排版</p>';
            return;
        }
        
        patterns.forEach((pattern, index) => {
            const block = document.createElement('div');
            block.className = 'section-block';
            block.style.background = 'var(--bg-tertiary)';
            block.style.padding = '1.25rem';
            block.style.borderRadius = 'var(--br-md)';
            block.style.marginBottom = '1rem';
            
            let stockLength = pattern.stock;
            let stockColor = stockLength === 6000 ? 'var(--accent-blue)' : 'var(--accent-purple)';

            let cutsSummary = {};
            pattern.cuts.forEach(c => {
                cutsSummary[c] = (cutsSummary[c] || 0) + 1;
            });
            let summaryText = Object.keys(cutsSummary)
                .sort((a,b)=> Number(b)-Number(a))
                .map(c => {
                    let bgCol = lengthColorMap[c] || 'var(--accent-blue)';
                    return `<span style="display:inline-block; background:${bgCol}; color:white; padding:0.1rem 0.5rem; border-radius:4px; margin-right:0.4rem; font-weight:500;">${c}mm x ${cutsSummary[c]}件</span>`;
                })
                .join('');

            let barHtml = '<div style="display: flex; align-items: center; gap: 8px; margin-top: 10px;">';
            barHtml += `<div class="stick-bar-container" style="height: 32px; border-radius: 4px; flex-grow: 1;">`;
            
            pattern.cuts.forEach(cutLen => {
                let pct = (cutLen / stockLength) * 100;
                let bgCol = lengthColorMap[cutLen] || 'var(--accent-blue)';
                barHtml += `<div class="cut-segment cut-used" style="width: ${pct}%; background-color: ${bgCol}; font-size: 0.8rem; font-weight:600;" data-tooltip="長度: ${cutLen}mm">${cutLen}</div>`;
            });
            
            if (pattern.waste > 0) {
                let pctWaste = (pattern.waste / stockLength) * 100;
                barHtml += `<div class="cut-segment cut-waste" style="width: ${pctWaste}%; font-size: 0.75rem;"></div>`;
            }
            barHtml += '</div>';
            
            if (pattern.waste > 0) {
                let wasteVal = Number.isInteger(pattern.waste) ? pattern.waste : pattern.waste.toFixed(1);
                barHtml += `<span style="font-size: 0.85rem; color: #a1a1aa; white-space: nowrap;">廢料 ${wasteVal}mm</span>`;
            }
            barHtml += '</div>';
            
            let html = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h4 style="color:var(--text-primary); margin:0; font-size: 1.1rem;">
                        👉 拿 <span style="font-size: 1.4rem; color: ${stockColor};"> ${pattern.count} </span> 支 <span style="font-size: 1.2rem; color: ${stockColor}; border-bottom: 2px solid ${stockColor};">${stockLength}</span> mm 鋁料，照以下圖解裁切：
                    </h4>
                </div>
                ${barHtml}
                <div style="margin-top: 0.75rem; font-size: 0.95rem; color: var(--text-secondary);">
                    依序出料：${summaryText}
                </div>
            `;
            block.innerHTML = html;
            container.appendChild(block);
        });
    }

    // ============================================
    // 計算機小工具 (Calculator Widget) 邏輯
    // ============================================
    const calcDisplay = document.getElementById('calcInput');
    const calcBtns = document.querySelectorAll('.calc-btn');

    let calcExpr = "";
    calcBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const val = e.target.textContent;
            if (val === 'C') {
                calcExpr = "";
                calcDisplay.value = "0";
            } else if (val === '⌫') {
                calcExpr = calcExpr.slice(0, -1);
                calcDisplay.value = calcExpr || "0";
            } else if (val === '=') {
                try {
                    let safeExpr = calcExpr.replace(/×/g, '*').replace(/÷/g, '/');
                    let res = new Function('return (' + safeExpr + ')')();
                    if (!Number.isInteger(res)) {
                        res = Math.round(res * 100) / 100;
                    }
                    calcExpr = String(res);
                    calcDisplay.value = calcExpr;
                } catch (err) {
                    calcDisplay.value = "運算錯誤";
                    calcExpr = "";
                }
            } else {
                calcExpr += val;
                calcDisplay.value = calcExpr;
            }
        });
    });

    // --- 背景落雪特效 ---
    function initSnowflakes() {
        const bgContainer = document.querySelector('.app-background');
        if (!bgContainer) return;

        const maxSnowflakes = 40; // 限制數量避免消耗過多效能
        let snowCount = 0;

        function createSnowflake() {
            if (snowCount >= maxSnowflakes) return;
            
            const snowflake = document.createElement('div');
            snowflake.className = 'snowflake';
            
            // 隨機化雪花屬性
            const size = (Math.random() * 6 + 4) + 'px'; // 4px - 10px
            const left = Math.random() * 100 + 'vw';     // 隨機水平位置
            const duration = (Math.random() * 7 + 8) + 's'; // 8s - 15s 落下時間
            const delay = (Math.random() * 5) + 's';      // 延遲出發
            const opacity = Math.random() * 0.5 + 0.3;    // 透明度

            snowflake.style.width = size;
            snowflake.style.height = size;
            snowflake.style.left = left;
            snowflake.style.animationDuration = duration;
            snowflake.style.animationDelay = delay;
            snowflake.style.opacity = opacity;

            document.body.appendChild(snowflake);
            snowCount++;

            // 動畫結束後移除元素回收記憶體
            const totalTime = (parseFloat(duration) + parseFloat(delay)) * 1000;
            setTimeout(() => {
                snowflake.remove();
                snowCount--;
            }, totalTime);
        }

        // 初始化時先產生一部分雪花，避免畫面空空的
        for (let i = 0; i < 15; i++) {
            createSnowflake();
        }

        // 定期產生新雪花
        setInterval(createSnowflake, 450);
    }

    initSnowflakes();
});
