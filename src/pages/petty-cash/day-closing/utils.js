export const DENOMINATION_OPTIONS = [
    {id: "note_500", label: "₹500 Note", denominationValue: 500, type: "note"},
    {id: "note_200", label: "₹200 Note", denominationValue: 200, type: "note"},
    {id: "note_100", label: "₹100 Note", denominationValue: 100, type: "note"},
    {id: "note_50", label: "₹50 Note", denominationValue: 50, type: "note"},
    {id: "note_20", label: "₹20 Note", denominationValue: 20, type: "note"},
    {id: "note_10", label: "₹10 Note", denominationValue: 10, type: "note"},
    {id: "coin_20", label: "₹20 (Coin)", denominationValue: 20, type: "coin"},
    {id: "coin_10", label: "₹10 (Coin)", denominationValue: 10, type: "coin"},
    {id: "coin_5", label: "₹5 (Coin)", denominationValue: 5, type: "coin"},
    {id: "coin_1", label: "₹1 (Coin)", denominationValue: 1, type: "coin"},
];

export function getDenominationTotals(denominationEntries) {
    let totalGood = 0;
    let totalBad = 0;
    let totalAmount = 0;

    denominationEntries.forEach((entry) => {
        totalGood += entry.goodCount * entry.denominationRecord.denominationValue;
        totalBad += entry.badCount * entry.denominationRecord.denominationValue;
    });

    totalAmount += totalGood + totalBad;

    return {totalGood, totalBad, totalAmount};
}

export function parseDenominations(denominationEntries) {

    const denominationMap = {
        tenNoteCount:  0,
        twentyNoteCount:  0,
        fiftyNoteCount:0,
        hundredNoteCount:  0,
        twoHundredNoteCount: 0,
        fiveHundredNoteCount: 0,
        tenSoiledNoteCount: 0,
        twentySoiledNoteCount:0,
        fiftySoiledNoteCount:  0,
        hundredSoiledNoteCount:  0,
        twoHundredSoiledNoteCount:  0,
        fiveHundredSoiledNoteCount:  0,
        oneCoinCount:  0,
        fiveCoinCount: 0,
        tenCoinCount:  0,
        twentyCoinCount:  0
    }
    denominationEntries.forEach((entry) => {
        if (entry.id === "note_500") {
            denominationMap.fiveHundredNoteCount = entry.goodCount;
            denominationMap.fiveHundredSoiledNoteCount = entry.badCount;
        }
        else if (entry.id === "note_200") {
            denominationMap.twoHundredNoteCount = entry.goodCount;
            denominationMap.twoHundredSoiledNoteCount = entry.badCount;
        }
        else if (entry.id === "note_100") {
            denominationMap.hundredNoteCount = entry.goodCount;
            denominationMap.hundredSoiledNoteCount = entry.badCount;
        }
        else if (entry.id === "note_50") {
            denominationMap.fiftyNoteCount = entry.goodCount;
            denominationMap.fiftySoiledNoteCount = entry.badCount;
        }
        else if (entry.id === "note_20") {
            denominationMap.twentyNoteCount = entry.goodCount;
            denominationMap.twentySoiledNoteCount = entry.badCount;
        }
        else if (entry.id === "note_10") {
            denominationMap.tenNoteCount = entry.goodCount;
            denominationMap.tenSoiledNoteCount = entry.badCount;
        } else if (entry.id === "coin_20") {
            denominationMap.twentyCoinCount = entry.goodCount;
        } else if (entry.id === "coin_10") {
            denominationMap.tenCoinCount = entry.goodCount;
        } else if (entry.id === "coin_5") {
            denominationMap.fiveCoinCount = entry.goodCount;
        } else if (entry.id === "coin_1") {
            denominationMap.oneCoinCount = entry.goodCount;
        }
    })
    return denominationMap;
}