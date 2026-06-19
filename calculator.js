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
/**
 * 全新動態餘料回流演算法 (Best-Fit Decreasing with Scrap Flowback)
 */
function calculateScrapFlowbackPlan(requirementsData, kerf, allowedStocks) {
    // 1. 合併相同尺寸需求
    const itemMap = {};
    requirementsData.forEach(req => {
        const q = Number(req.qty);
        const l = Number(req.length);
        if (q > 0 && l > 0) {
            itemMap[l] = (itemMap[l] || 0) + q;
        }
    });

    // 2. 將需求尺寸由大到小展開成扁平陣列 (大尺寸先切才流暢)
    let allCuts = [];
    for (const [lengthStr, qty] of Object.entries(itemMap)) {
        const len = Number(lengthStr);
        for (let i = 0; i < qty; i++) {
            allCuts.push(len);
        }
    }
    allCuts.sort((a, b) => b - a);

    const sticks = [];
    const unplacedErrors = [];
    const maxStock = Math.max(...allowedStocks);
    const sortedStocks = [...allowedStocks].sort((a, b) => a - b); // 升序：6000, 6400

    // 3. 開始逐刀進行 Best-Fit 計算
    allCuts.forEach(cutLen => {
        if (cutLen > maxStock) {
            unplacedErrors.push(cutLen);
            return;
        }

        let bestStickIdx = -1;
        let minRemainingSpaceAfter = Infinity;

        // 【核心改良】：先回頭檢查現有的每一隻料，看誰剩餘的空間塞得下這一刀，且塞完後剩的空間最小 (Best-Fit)
        for (let i = 0; i < sticks.length; i++) {
            const stick = sticks[i];
            const neededSpace = cutLen + (stick.cuts.length > 0 ? kerf : 0);
            
            // 計算目前該支料已用的總長度
            const currentUsed = stick.cuts.reduce((sum, c) => sum + c, 0) + (stick.cuts.length > 0 ? (stick.cuts.length - 1) * kerf : 0);
            const remainingSpace = stick.stock - currentUsed;

            if (remainingSpace >= neededSpace) {
                const spaceAfter = remainingSpace - neededSpace;
                if (spaceAfter < minRemainingSpaceAfter) {
                    minRemainingSpaceAfter = spaceAfter;
                    bestStickIdx = i;
                }
            }
        }

        if (bestStickIdx !== -1) {
            // 找到了！這就是您說的「回頭去用第一隻（或之前的某支）剩餘空間去切」
            sticks[bestStickIdx].cuts.push(cutLen);
            // 更新廢料長度
            const newUsed = sticks[bestStickIdx].cuts.reduce((sum, c) => sum + c, 0) + (sticks[bestStickIdx].cuts.length - 1) * kerf;
            sticks[bestStickIdx].waste = sticks[bestStickIdx].stock - newUsed;
        } else {
            // 如果之前的舊料通通都塞不下了，才依序去開「新的一隻」
            // 選擇能容納該尺寸的最小鋁材原料
            let chosenStock = null;
            for (const stock of sortedStocks) {
                if (stock >= cutLen) {
                    chosenStock = stock;
                    break;
                }
            }
            if (chosenStock === null) {
                unplacedErrors.push(cutLen);
            } else {
                sticks.push({
                    stock: chosenStock,
                    cuts: [cutLen],
                    waste: chosenStock - cutLen
                });
            }
        }
    });

    return buildPlanResult(sticks, unplacedErrors);
}

/**
 * 主演算法
 */
/**
 * 主演算法 - 統一採用「極致省料 (餘料回流)」最佳適應遞減演算法 (Best-Fit Decreasing with Scrap Flowback)
 */
function calculateAdvancedMixedPlan(requirementsData, kerf, allowedStocks, targetWaste = 300) {
    return calculateScrapFlowbackPlan(requirementsData, kerf, allowedStocks);
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
     * 1. 優先按裁切圖解中包含的最大尺寸降序排序 (讓相同最大尺寸的裁切優先集中處理，如所有包含 959mm 的圖解排在最前)
     * 2. 同最大尺寸下，支數最多的 pattern 排最前
     * 3. 同支數下，純單一尺寸的優先
     * 4. 同純淨度下，廢料少的在前
     */
    const getUniqueSizes = p => new Set(p.cuts).size;
    const getMaxCut = p => p.cuts.length > 0 ? Math.max(...p.cuts) : 0;
    const patterns = Object.values(patternsMap).sort((a, b) => {
        const maxA = getMaxCut(a), maxB = getMaxCut(b);
        if (maxB !== maxA) return maxB - maxA;             // 【主】最大尺寸降序
        if (b.count !== a.count) return b.count - a.count; // 【次】支數多優先
        const ua = getUniqueSizes(a), ub = getUniqueSizes(b);
        if (ua !== ub) return ua - ub;                     // 【參】純單尺寸優先
        return a.waste - b.waste;                          // 【末】廢料少優先
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

function calculateMixedPlans(requirementsData, kerf, algo = 'dfs') {
    let totalLength = 0;
    let totalQty = 0;
    requirementsData.forEach(req => {
        const l = Number(req.length);
        const q = Number(req.qty);
        totalQty += q;
        totalLength += (l + kerf) * q;
    });

    const plan6000  = calculateAdvancedMixedPlan(requirementsData, kerf, [6000], 300, algo);
    const plan6400  = calculateAdvancedMixedPlan(requirementsData, kerf, [6400], 300, algo);
    const planMixed = calculateAdvancedMixedPlan(requirementsData, kerf, [6000, 6400], 300, algo);

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
