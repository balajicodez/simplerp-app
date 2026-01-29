// Safe number formatting function
export function safeToLocaleString(value) {
    if (value === null || value === undefined || isNaN(value)) {
        return "0.00";
    }
    return Number(value).toFixed(2).toLocaleString();
}


export function calculateDenominationAmount(
    denominationValue,
    goodCount,
    soiledCount
) {
    const good = Number(goodCount) || 0;
    const soiled = Number(soiledCount) || 0;
    const netNotes = good + soiled;
    return netNotes * denominationValue;
}

export function convertDenominationsToRecords(reportData) {
    const cashDenominationRecords = [];
    if (reportData._500NoteCount > 0 || reportData._500SoiledNoteCount > 0) {
        cashDenominationRecords.push({
            denomination: '₹500',
            goodNotes: reportData._500NoteCount,
            soiledNotes: reportData._500SoiledNoteCount,
            amount: calculateDenominationAmount(500, reportData._500NoteCount, reportData._500SoiledNoteCount),
        });
    }
    if (reportData._200NoteCount > 0 || reportData._200SoiledNoteCount > 0) {
        cashDenominationRecords.push({
            denomination: '₹200',
            goodNotes: reportData._200NoteCount,
            soiledNotes: reportData._200SoiledNoteCount,
            amount: calculateDenominationAmount(200, reportData._200NoteCount, reportData._200SoiledNoteCount),
        });
    }
    if (reportData._100NoteCount > 0 || reportData._100SoiledNoteCount > 0) {
        cashDenominationRecords.push({
            denomination: '₹100',
            goodNotes: reportData._100NoteCount,
            soiledNotes: reportData._100SoiledNoteCount,
            amount: calculateDenominationAmount(100, reportData._100NoteCount, reportData._100SoiledNoteCount),
        });
    }
    if (reportData._50NoteCount > 0 || reportData._50SoiledNoteCount > 0) {
        cashDenominationRecords.push({
            denomination: '₹50',
            goodNotes: reportData._50NoteCount,
            soiledNotes: reportData._50SoiledNoteCount,
            amount: calculateDenominationAmount(50, reportData._50NoteCount, reportData._50SoiledNoteCount),
        });
    }
    if (reportData._20NoteCount > 0 || reportData._20SoiledNoteCount > 0) {
        cashDenominationRecords.push({
            denomination: '₹20',
            goodNotes: reportData._20NoteCount,
            soiledNotes: reportData._20SoiledNoteCount,
            amount: calculateDenominationAmount(20, reportData._20NoteCount, reportData._20SoiledNoteCount),
        });
    }
    if (reportData._10NoteCount > 0 || reportData._10SoiledNoteCount > 0) {
        cashDenominationRecords.push({
            denomination: '₹10',
            goodNotes: reportData._10NoteCount,
            soiledNotes: reportData._10SoiledNoteCount,
            amount: calculateDenominationAmount(10, reportData._10NoteCount, reportData._10SoiledNoteCount),
        });
    }
    if (reportData._1CoinCount > 0) {
        cashDenominationRecords.push({
            denomination: '₹1 (Coin)',
            goodNotes: reportData._1CoinCount,
            soiledNotes: 0,
            amount: calculateDenominationAmount(1, reportData._1CoinCount, 0),
        });
    }
    if (reportData._5CoinCount > 0) {
        cashDenominationRecords.push({
            denomination: '₹5 (Coin)',
            goodNotes: reportData._5CoinCount,
            soiledNotes: 0,
            amount: calculateDenominationAmount(5, reportData._5CoinCount, 0),
        });
    }
    if (reportData._10CoinCount > 0) {
        cashDenominationRecords.push({
            denomination: '₹10 (Coin)',
            goodNotes: reportData._10CoinCount,
            soiledNotes: 0,
            amount: calculateDenominationAmount(10, reportData._10CoinCount, 0),
        });
    }
    if (reportData._20CoinCount > 0) {
        cashDenominationRecords.push({
            denomination: '₹20 (Coin)',
            goodNotes: reportData._20CoinCount,
            soiledNotes: 0,
            amount: calculateDenominationAmount(20, reportData._20CoinCount, 0),
        });
    }
    return cashDenominationRecords;
}