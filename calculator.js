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
function calcUsedSpace(cuts, kerf) {
    if (!cuts || cuts.length === 0) return 0;
    const sum = cuts.reduce((a, b) => a + b, 0);
    return sum + (cuts.length - 1) * kerf;
}

/**
 * 全新動態餘料回流演算法 (Best-Fit Decreasing with Remnant Consolidation & Length Maximization)
 * 第一優先：極大化最後一支料的「連續剩餘完整長料長度」（保留最長完整可用剩料，供後續備用/補料）。
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

    // Stage 1: 逐刀進行 Best-Fit 初始分配
    allCuts.forEach(cutLen => {
        if (cutLen > maxStock) {
            unplacedErrors.push(cutLen);
            return;
        }

        let bestStickIdx = -1;
        let minRemainingSpaceAfter = Infinity;

        // 回頭檢查現有的每一隻料 (Best-Fit)
        for (let i = 0; i < sticks.length; i++) {
            const stick = sticks[i];
            const currentUsed = calcUsedSpace(stick.cuts, kerf);
            const remainingSpace = stick.stock - currentUsed;
            const neededSpace = cutLen + (stick.cuts.length > 0 ? kerf : 0);

            if (remainingSpace >= neededSpace) {
                const spaceAfter = remainingSpace - neededSpace;
                if (spaceAfter < minRemainingSpaceAfter) {
                    minRemainingSpaceAfter = spaceAfter;
                    bestStickIdx = i;
                }
            }
        }

        if (bestStickIdx !== -1) {
            sticks[bestStickIdx].cuts.push(cutLen);
            sticks[bestStickIdx].waste = sticks[bestStickIdx].stock - calcUsedSpace(sticks[bestStickIdx].cuts, kerf);
        } else {
            let chosenStock = sortedStocks.find(s => s >= cutLen);
            if (!chosenStock) {
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

    // Stage 2: 全面性動態餘料回流與剩料長度極大化 (Remnant Consolidation & Length Maximization)
    // 核心目標：將所有中後段料支上的切塊，盡可能向前填補至前段料支的任何微小縫隙中。
    // 這能確保前段料支被完全填滿（微小廢料極小化），使【最後一支料保留長度最長、最完整的連續可用剩料】！
    let improved = true;
    while (improved && sticks.length > 1) {
        improved = false;

        // 從最後一支料一路向前掃描至第 2 支料
        for (let sIdx = sticks.length - 1; sIdx >= 1; sIdx--) {
            const currentStick = sticks[sIdx];

            // 針對該料支上的每一切塊（由小至大嘗試移回前段）
            for (let cIdx = currentStick.cuts.length - 1; cIdx >= 0; cIdx--) {
                const cutToMove = currentStick.cuts[cIdx];

                let targetIdx = -1;
                let minSpaceAfter = Infinity;

                // 搜尋位於其前面的所有料支 (0 到 sIdx - 1)
                for (let i = 0; i < sIdx; i++) {
                    const targetStick = sticks[i];
                    const currentUsed = calcUsedSpace(targetStick.cuts, kerf);
                    const remainingSpace = targetStick.stock - currentUsed;
                    const neededSpace = cutToMove + (targetStick.cuts.length > 0 ? kerf : 0);

                    if (remainingSpace >= neededSpace) {
                        const spaceAfter = remainingSpace - neededSpace;
                        if (spaceAfter < minSpaceAfter) {
                            minSpaceAfter = spaceAfter;
                            targetIdx = i;
                        }
                    }
                }

                if (targetIdx !== -1) {
                    // 執行移料：將切塊移至前段目標料支
                    sticks[targetIdx].cuts.push(cutToMove);
                    sticks[targetIdx].waste = sticks[targetIdx].stock - calcUsedSpace(sticks[targetIdx].cuts, kerf);

                    currentStick.cuts.splice(cIdx, 1);
                    currentStick.waste = currentStick.cuts.length > 0
                        ? currentStick.stock - calcUsedSpace(currentStick.cuts, kerf)
                        : currentStick.stock;

                    improved = true;

                    // 若該料支已完全被清空，從陣列中移除該料支
                    if (currentStick.cuts.length === 0) {
                        sticks.splice(sIdx, 1);
                        break; // 跳出此料支迴圈，重新進行整體掃描
                    }
                }
            }
            if (improved) break;
        }
    }

    // 將每支料內部的裁切尺寸統一按由大到小排序
    sticks.forEach(s => {
        s.cuts.sort((a, b) => b - a);
        s.waste = s.stock - calcUsedSpace(s.cuts, kerf);
    });

    return buildPlanResult(sticks, unplacedErrors);
}

/**
 * 主演算法
 */
function calculateAdvancedMixedPlan(requirementsData, kerf, allowedStocks, targetWaste = 300) {
    return calculateScrapFlowbackPlan(requirementsData, kerf, allowedStocks);
}

function buildPlanResult(sticks, unplacedErrors) {
    const patternsMap = {};
    sticks.forEach(stick => {
        const sortedCuts = stick.cuts.slice().sort((a, b) => b - a);
        const key = `${stick.stock}-${sortedCuts.join(',')}`;
        if (!patternsMap[key]) {
            patternsMap[key] = { stock: stick.stock, cuts: sortedCuts, waste: stick.waste, count: 0 };
        }
        patternsMap[key].count++;
    });

    /**
     * 智慧出料排序規則（配合工廠現場操作）：
     * 1. 優先按裁切圖解中包含的最大尺寸降序排序 (如所有包含 959mm 的圖解排在最前)
     * 2. 同最大尺寸下，支數最多的 pattern 排最前
     * 3. 同支數下，純單一尺寸的優先
     * 4. 同純淨度下，廢料少的在前
     */
    const getUniqueSizes = p => new Set(p.cuts).size;
    const getMaxCut = p => p.cuts.length > 0 ? Math.max(...p.cuts) : 0;
    const patterns = Object.values(patternsMap).sort((a, b) => {
        const maxA = getMaxCut(a), maxB = getMaxCut(b);
        if (maxB !== maxA) return maxB - maxA;             // 【第一優先】最大尺寸降序
        if (b.count !== a.count) return b.count - a.count; // 【第二優先】支數多優先
        const ua = getUniqueSizes(a), ub = getUniqueSizes(b);
        if (ua !== ub) return ua - ub;                     // 【第三優先】純單尺寸優先
        return a.waste - b.waste;                          // 【第四優先】廢料少優先
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
