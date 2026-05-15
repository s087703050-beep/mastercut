/**
 * 德昌鋁材 裁切最佳化演算法 v3
 * 改進點：
 *  1. 評分改為「總消耗量最大」，避免高重複低效益組合勝出
 *  2. DFS 閉包 bug 修正：iterations 移出迴圈範圍
 *  3. 貪婪 fallback repeats 邊界值修正
 *  4. 廢料容忍度動態放寬：若找不到 <=300mm 則逐步放寬至最佳解
 */

/**
 * 計算一根鋁料在指定已用長度後，塞入 count 個 len 所需空間
 */
function calcAddedLength(currentLength, len, count, kerf) {
    let total = 0;
    for (let i = 0; i < count; i++) {
        total += (currentLength + total === 0) ? len : len + kerf;
    }
    return total;
}

/**
 * 主演算法：DFS 尋找最大化「總消耗量」且廢料<=targetWaste 的批量模組
 */
function calculateAdvancedMixedPlan(requirementsData, kerf, allowedStocks, targetWaste = 300) {
    // 先按長度分組合計數量，避免相同尺寸多行導致計算錯誤
    const itemMap = {};
    requirementsData.forEach(req => {
        const q = Number(req.qty);
        const l = Number(req.length);
        if (q > 0 && l > 0) {
            itemMap[l] = (itemMap[l] || 0) + q;
        }
    });

    let items = Object.entries(itemMap)
        .map(([length, qty]) => ({ length: Number(length), qty }))
        .sort((a, b) => b.length - a.length);

    const sticks = [];
    const unplacedErrors = [];
    const maxStock = Math.max(...allowedStocks);

    // 過濾超長需求
    items = items.filter(item => {
        if (item.length > maxStock) {
            for (let i = 0; i < item.qty; i++) unplacedErrors.push(item.length);
            return false;
        }
        return true;
    });

    // 對單一鋁料長度做 DFS，回傳在 waste <= maxWaste 條件下，
    // 「重複次數 × 每根已用量」最大的組合
    function dfsForStock(stockLength, maxWaste) {
        let bestPattern = null;
        let bestConsumed = -1;    // 評分：repeats × usedLength（總消耗量）
        let fallbackPattern = null;
        let fallbackWaste = Infinity;

        let iterations = 0;
        const MAX_ITER = 150000;

        function dfs(idx, cuts, usedLength) {
            if (iterations++ > MAX_ITER) return;

            if (idx >= items.length) {
                if (cuts.length === 0) return;

                const waste = stockLength - usedLength;
                if (waste < 0) return;

                // 計算可重複次數
                const counts = {};
                for (const c of cuts) counts[c] = (counts[c] || 0) + 1;

                let repeats = Infinity;
                for (const len in counts) {
                    const item = items.find(i => i.length === Number(len));
                    if (!item) { repeats = 0; break; }
                    repeats = Math.min(repeats, Math.floor(item.qty / counts[len]));
                }
                if (!isFinite(repeats) || repeats <= 0) return;

                // 保底：記錄廢料最少的組合（不限 targetWaste）
                if (waste < fallbackWaste) {
                    fallbackWaste = waste;
                    fallbackPattern = { stock: stockLength, cuts: [...cuts], counts, waste, repeats };
                }

                // 主目標：廢料 <= targetWaste，評分 = repeats × usedLength
                if (waste <= maxWaste) {
                    const score = repeats * usedLength;
                    if (score > bestConsumed) {
                        bestConsumed = score;
                        bestPattern = { stock: stockLength, cuts: [...cuts], counts, waste, repeats };
                    }
                }
                return;
            }

            const item = items[idx];
            if (item.qty === 0 || item.length > stockLength) {
                dfs(idx + 1, cuts, usedLength);
                return;
            }

            // 計算最多能放幾支（受 qty 和空間雙重限制）
            let maxCount = 0;
            let tempLen = usedLength;
            while (maxCount < item.qty) {
                const space = (tempLen === 0) ? item.length : item.length + kerf;
                if (tempLen + space > stockLength) break;
                tempLen += space;
                maxCount++;
            }

            for (let count = maxCount; count >= 0; count--) {
                const added = calcAddedLength(usedLength, item.length, count, kerf);
                const addedCuts = new Array(count).fill(item.length);
                cuts.push(...addedCuts);
                dfs(idx + 1, cuts, usedLength + added);
                cuts.splice(cuts.length - count, count); // 回溯
                if (iterations > MAX_ITER) break;
            }
        }

        dfs(0, [], 0);

        // 優先回傳達到廢料目標的組合；若無，回傳廢料最少的
        return bestPattern || fallbackPattern;
    }

    // 主迴圈：每輪找最佳批量模組並消耗掉
    while (items.length > 0) {
        let chosen = null;
        let bestScore = -1;

        for (const stockLength of allowedStocks) {
            // 先用 targetWaste=300 找；若找不到則不限制（由 fallback 處理）
            const pattern = dfsForStock(stockLength, targetWaste);
            if (!pattern) continue;

            // 評分：優先廢料<=300，其次總消耗量大
            const isGood = pattern.waste <= targetWaste;
            const score = (isGood ? 1e12 : 0) + pattern.repeats * (stockLength - pattern.waste);
            if (score > bestScore) {
                bestScore = score;
                chosen = pattern;
            }
        }

        if (!chosen) break; // 完全無法裁切（所有尺寸都超長）

        // 提交這批結果
        for (let r = 0; r < chosen.repeats; r++) {
            sticks.push({ stock: chosen.stock, cuts: [...chosen.cuts], waste: chosen.waste });
        }

        // 扣除已分配數量
        for (const len in chosen.counts) {
            const item = items.find(i => i.length === Number(len));
            if (item) item.qty -= chosen.counts[len] * chosen.repeats;
        }
        items = items.filter(i => i.qty > 0);
    }

    return buildPlanResult(sticks, unplacedErrors);
}

function buildPlanResult(sticks, unplacedErrors) {
    const patternsMap = {};
    sticks.forEach(stick => {
        const key = `${stick.stock}-${stick.cuts.slice().sort((a,b)=>b-a).join(',')}`;
        if (!patternsMap[key]) {
            patternsMap[key] = { stock: stick.stock, cuts: stick.cuts, waste: stick.waste, count: 0 };
        }
        patternsMap[key].count++;
    });

    const patterns = Object.values(patternsMap).sort((a, b) => b.stock - a.stock || b.count - a.count);

    return {
        totalSticks: sticks.length,
        totalSticks6000: sticks.filter(s => s.stock === 6000).length,
        totalSticks6400: sticks.filter(s => s.stock === 6400).length,
        totalWaste: sticks.reduce((sum, s) => sum + s.waste, 0),
        patterns,
        unplacedErrors
    };
}

function calculateMixedPlans(requirementsData, kerf) {
    let totalLength = 0;
    let totalQty = 0;
    requirementsData.forEach(req => {
        const l = Number(req.length);
        const q = Number(req.qty);
        totalQty += q;
        totalLength += (l + kerf) * q;
    });

    const plan6000 = calculateAdvancedMixedPlan(requirementsData, kerf, [6000]);
    const plan6400 = calculateAdvancedMixedPlan(requirementsData, kerf, [6400]);
    const planMixed = calculateAdvancedMixedPlan(requirementsData, kerf, [6000, 6400]);

    return {
        success: plan6000.unplacedErrors.length === 0 &&
                 plan6400.unplacedErrors.length === 0 &&
                 planMixed.unplacedErrors.length === 0,
        totalLength,
        totalQty,
        theory6000: Math.ceil(totalLength / 6000),
        theory6400: Math.ceil(totalLength / 6400),
        plan6000,
        plan6400,
        planMixed
    };
}

// 掛載至全域
window.calculateOptimization = calculateMixedPlans;
