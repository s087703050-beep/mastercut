/**
 * 德昌鋁材 裁切最佳化演算法 v6
 *
 * 核心目標（依優先順序）：
 *  1. 【尺寸集中優先】同一尺寸盡量集中在「純單一尺寸 pattern」，方便工廠人員
 *     設定鋸片後一次切完同尺寸所有料，不需頻繁換鋸片設定。
 *  2. 【高填充率】每支鋁料利用率越高越好，避免孤立小件浪費整支料。
 *  3. 廢料 <= 300mm（廢料門檻）。
 *  4. 搬料次數少（批量重複）。
 *
 * 評分公式：
 *   purityFactor = 4（純單一尺寸）/ 2（兩種尺寸）/ 1（三種以上）
 *   score = repeats × (利用率²) × (每刀平均用量) × purityFactor
 *
 *   purityFactor 讓「純單一尺寸」方案得分最高，
 *   即使利用率稍低，也優先選純單尺寸 pattern，
 *   讓 814mm 先被集中切完，再用混合 pattern 收尾零頭。
 */

/**
 * 計算塞入 count 個 len 所需的總增加長度
 */
function calcAddedLength(currentLength, len, count, kerf) {
    let total = 0;
    for (let i = 0; i < count; i++) {
        total += (currentLength + total === 0) ? len : len + kerf;
    }
    return total;
}

/**
 * 主演算法
 */
function calculateAdvancedMixedPlan(requirementsData, kerf, allowedStocks, targetWaste = 300) {
    // 合並相同尺寸的需求數量
    const itemMap = {};
    requirementsData.forEach(req => {
        const q = Number(req.qty);
        const l = Number(req.length);
        if (q > 0 && l > 0) {
            itemMap[l] = (itemMap[l] || 0) + q;
        }
    });

    // 依「總需求量（qty × length）」由大到小排序，讓量多的尺寸優先被集中處理
    let items = Object.entries(itemMap)
        .map(([length, qty]) => ({ length: Number(length), qty }))
        .sort((a, b) => (b.qty * b.length) - (a.qty * a.length));

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

    /**
     * DFS 對單一鋁料長度搜索最佳 pattern
     *
     * 評分：
     *   purityFactor：尺寸種類越少，加成越大
     *     - 1 種尺寸 → ×4（純單尺寸，最利於工廠操作）
     *     - 2 種尺寸 → ×2（尚可接受）
     *     - 3 種以上 → ×1（無加成，作為最後手段）
     *
     *   score = repeats × (利用率²) × (每刀平均用量) × purityFactor
     */
    function dfsForStock(stockLength, maxWaste) {
        let bestPattern = null;
        let bestScore = -1;
        let fallbackPattern = null;
        let fallbackScore = -1;

        let iterations = 0;
        const MAX_ITER = 150000; // 平衡速度與最佳化品質

        function dfs(idx, cuts, usedLength) {
            if (iterations++ > MAX_ITER) return;

            if (idx >= items.length) {
                if (cuts.length === 0) return;

                const waste = stockLength - usedLength;
                if (waste < 0) return;

                // 計算每種尺寸的使用數量
                const counts = {};
                for (const c of cuts) counts[c] = (counts[c] || 0) + 1;

                // 計算可重複次數（受庫存數量限制）
                let repeats = Infinity;
                for (const len in counts) {
                    const item = items.find(i => i.length === Number(len));
                    if (!item) { repeats = 0; break; }
                    repeats = Math.min(repeats, Math.floor(item.qty / counts[len]));
                }
                if (!isFinite(repeats) || repeats <= 0) return;

                const cutsCount = cuts.length;
                const utilizationRate = usedLength / stockLength;
                const avgUsedPerCut = usedLength / cutsCount;

                // 【關鍵】純淨度加成：尺寸種類越少，加成越大
                const uniqueSizeCount = Object.keys(counts).length;
                const purityFactor = uniqueSizeCount === 1 ? 4.0
                                   : uniqueSizeCount === 2 ? 2.0
                                   : 1.0;

                // 最終評分
                const score = repeats * (utilizationRate * utilizationRate) * avgUsedPerCut * purityFactor;

                // fallback：不限 targetWaste
                if (score > fallbackScore) {
                    fallbackScore = score;
                    fallbackPattern = { stock: stockLength, cuts: [...cuts], counts, waste, repeats };
                }

                if (waste <= maxWaste) {
                    if (score > bestScore) {
                        bestScore = score;
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

            // 計算最多能放幾支
            let maxCount = 0;
            let tempLen = usedLength;
            while (maxCount < item.qty) {
                const space = (tempLen === 0) ? item.length : item.length + kerf;
                if (tempLen + space > stockLength) break;
                tempLen += space;
                maxCount++;
            }

            // 從多到少嘗試（優先大量）
            for (let count = maxCount; count >= 0; count--) {
                const added = calcAddedLength(usedLength, item.length, count, kerf);
                const addedCuts = new Array(count).fill(item.length);
                cuts.push(...addedCuts);
                dfs(idx + 1, cuts, usedLength + added);
                cuts.splice(cuts.length - count, count);
                if (iterations > MAX_ITER) break;
            }
        }

        dfs(0, [], 0);
        return bestPattern || fallbackPattern;
    }

    // 主迴圈
    while (items.length > 0) {
        let chosen = null;
        let bestGlobalScore = -1;

        for (const stockLength of allowedStocks) {
            const pattern = dfsForStock(stockLength, targetWaste);
            if (!pattern) continue;

            const isGood = pattern.waste <= targetWaste;
            const usedLen = pattern.stock - pattern.waste;
            const utilRate = usedLen / pattern.stock;
            const cutsCount = pattern.cuts.length;
            const avgUsedPerCut = cutsCount > 0 ? usedLen / cutsCount : 0;

            // 全域評分同樣加入純淨度加成
            const uniqueSizeCount = Object.keys(pattern.counts).length;
            const purityFactor = uniqueSizeCount === 1 ? 4.0
                               : uniqueSizeCount === 2 ? 2.0
                               : 1.0;

            const score = (isGood ? 1e12 : 0)
                        + pattern.repeats * (utilRate * utilRate) * avgUsedPerCut * purityFactor;

            if (score > bestGlobalScore) {
                bestGlobalScore = score;
                chosen = pattern;
            }
        }

        if (!chosen) break;

        for (let r = 0; r < chosen.repeats; r++) {
            sticks.push({ stock: chosen.stock, cuts: [...chosen.cuts], waste: chosen.waste });
        }

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

    /**
     * 排序規則（配合工廠操作邏輯）：
     * 1. 支數最多的 pattern 排最前（人員從最大批量開始作業）
     * 2. 同支數下，純單一尺寸的優先（設定鋸片後一次切完）
     * 3. 同支數同純淨度下，廢料少的在前
     */
    const getUniqueSizes = p => new Set(p.cuts).size;
    const patterns = Object.values(patternsMap).sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count; // 【主】支數多優先
        const ua = getUniqueSizes(a), ub = getUniqueSizes(b);
        if (ua !== ub) return ua - ub;        // 【次】純單尺寸優先
        return a.waste - b.waste;              // 【末】廢料少優先
    });

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

    const plan6000  = calculateAdvancedMixedPlan(requirementsData, kerf, [6000]);
    const plan6400  = calculateAdvancedMixedPlan(requirementsData, kerf, [6400]);
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
