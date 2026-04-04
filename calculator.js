/**
 * 德昌鋁材 主尺寸優先 + 餘料順利回收 演算法 (Scrap Recovery)
 */

function calculateScrapRecoveryPlan(requirementsData, kerf, stockLength) {
    let unplaced = [];
    requirementsData.forEach(req => {
        let q = Number(req.qty);
        let l = Number(req.length);
        for (let i = 0; i < q; i++) {
            unplaced.push(l);
        }
    });

    unplaced.sort((a, b) => b - a);

    let sticks = [];
    let unplacedErrors = [];

    while (unplaced.length > 0) {
        if (unplaced[0] > stockLength) {
            unplacedErrors.push(unplaced[0]);
            unplaced.shift();
            continue;
        }

        let stickRemaining = stockLength;
        let stickCuts = [];

        for (let i = 0; i < unplaced.length; i++) {
            let reqLength = unplaced[i];
            let requiredSpace = stickCuts.length === 0 ? reqLength : reqLength + kerf;

            if (stickRemaining >= requiredSpace) {
                stickCuts.push(reqLength);
                stickRemaining -= requiredSpace;
                unplaced.splice(i, 1);
                i--;
            }
        }

        if (stickCuts.length > 0) {
            sticks.push({
                stock: stockLength,
                cuts: stickCuts,
                waste: stickRemaining
            });
        }
    }

    return buildPlanResult(sticks, unplacedErrors);
}

function calculateMixedScrapRecoveryPlan(requirementsData, kerf, allowedStocks) {
    let unplaced = [];
    requirementsData.forEach(req => {
        let q = Number(req.qty);
        let l = Number(req.length);
        for (let i = 0; i < q; i++) {
            unplaced.push(l);
        }
    });

    unplaced.sort((a, b) => b - a);

    let sticks = [];
    let unplacedErrors = [];
    let maxStock = Math.max(...allowedStocks);

    while (unplaced.length > 0) {
        if (unplaced[0] > maxStock) {
            unplacedErrors.push(unplaced[0]);
            unplaced.shift();
            continue;
        }

        let bestStock = -1;
        let bestWaste = Infinity;
        let bestCuts = [];

        // 模擬所有的庫存長度，看哪種剩下的廢料最少
        for (let s of allowedStocks) {
            if (unplaced[0] > s) continue; 

            let tempUnplaced = [...unplaced];
            let stickRemaining = s;
            let stickCuts = [];

            for (let i = 0; i < tempUnplaced.length; i++) {
                let reqLength = tempUnplaced[i];
                let requiredSpace = stickCuts.length === 0 ? reqLength : reqLength + kerf;

                if (stickRemaining >= requiredSpace) {
                    stickCuts.push(reqLength);
                    stickRemaining -= requiredSpace;
                    tempUnplaced.splice(i, 1);
                    i--;
                }
            }

            // 選廢料最少的；或如果剛好 0 廢料，就是完美的
            if (stickRemaining < bestWaste) {
                bestWaste = stickRemaining;
                bestStock = s;
                bestCuts = stickCuts;
            }
        }

        sticks.push({
            stock: bestStock,
            cuts: bestCuts,
            waste: bestWaste
        });

        // 真實移除這些被選中切掉的需求量
        for (let cut of bestCuts) {
            let idx = unplaced.indexOf(cut);
            if (idx !== -1) {
                unplaced.splice(idx, 1);
            }
        }
    }

    return buildPlanResult(sticks, unplacedErrors);
}

function buildPlanResult(sticks, unplacedErrors) {
    let patternsMap = {};
    sticks.forEach(stick => {
        let key = `${stick.stock}-${stick.cuts.join(',')}`;
        if (!patternsMap[key]) {
            patternsMap[key] = {
                stock: stick.stock,
                cuts: stick.cuts,
                waste: stick.waste,
                count: 0
            };
        }
        patternsMap[key].count++;
    });

    let patterns = Object.values(patternsMap).sort((a,b) => b.stock - a.stock);

    return {
        totalSticks: sticks.length,
        totalSticks6000: sticks.filter(s => s.stock === 6000).length,
        totalSticks6400: sticks.filter(s => s.stock === 6400).length,
        totalWaste: sticks.reduce((sum, s) => sum + s.waste, 0),
        patterns: patterns,
        unplacedErrors: unplacedErrors
    };
}


function calculateMixedPlans(requirementsData, kerf) {
    let totalLength = 0;
    let totalQty = 0;
    requirementsData.forEach(req => {
        let l = Number(req.length);
        let q = Number(req.qty);
        totalQty += q;
        totalLength += (l + kerf) * q;
    });

    let plan6000 = calculateScrapRecoveryPlan(requirementsData, kerf, 6000);
    let plan6400 = calculateScrapRecoveryPlan(requirementsData, kerf, 6400);
    // 方案 C: 混合雙料
    let planMixed = calculateMixedScrapRecoveryPlan(requirementsData, kerf, [6000, 6400]);
    
    let theory6000 = Math.ceil(totalLength / 6000);
    let theory6400 = Math.ceil(totalLength / 6400);

    return {
        success: plan6000.unplacedErrors.length === 0 && plan6400.unplacedErrors.length === 0 && planMixed.unplacedErrors.length === 0,
        totalLength: totalLength,
        totalQty: totalQty,
        theory6000: theory6000,
        theory6400: theory6400,
        plan6000: plan6000,
        plan6400: plan6400,
        planMixed: planMixed
    };
}

// 掛載至全域
window.calculateOptimization = calculateMixedPlans;
