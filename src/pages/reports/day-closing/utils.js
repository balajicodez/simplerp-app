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

export function getOrganizationAddressText(organization){
    if (!organization?.address) return "";

    const { address, city, pincode } = organization.address;

    return [address, city, pincode].filter(Boolean).join(", ");
};

export function convertDenominationsToRecords(dayClosingData) {
    const cashDenominationRecords = [];

    if (!dayClosingData) return cashDenominationRecords;

    if (dayClosingData._500NoteCount > 0 || dayClosingData._500SoiledNoteCount > 0) {
        cashDenominationRecords.push({
            denomination: '500',
            goodNotes: dayClosingData._500NoteCount || 0,
            soiledNotes: dayClosingData._500SoiledNoteCount || 0,
            type: 'note',
            amount: calculateDenominationAmount(500, dayClosingData._500NoteCount, dayClosingData._500SoiledNoteCount),
        });
    }
    if (dayClosingData._200NoteCount > 0 || dayClosingData._200SoiledNoteCount > 0) {
        cashDenominationRecords.push({
            denomination: '200',
            goodNotes: dayClosingData._200NoteCount || 0,
            soiledNotes: dayClosingData._200SoiledNoteCount || 0,
            type: 'note',
            amount: calculateDenominationAmount(200, dayClosingData._200NoteCount, dayClosingData._200SoiledNoteCount),
        });
    }
    if (dayClosingData._100NoteCount > 0 || dayClosingData._100SoiledNoteCount > 0) {
        cashDenominationRecords.push({
            denomination: '100',
            goodNotes: dayClosingData._100NoteCount || 0,
            soiledNotes: dayClosingData._100SoiledNoteCount || 0,
            type: 'note',
            amount: calculateDenominationAmount(100, dayClosingData._100NoteCount, dayClosingData._100SoiledNoteCount),
        });
    }
    if (dayClosingData._50NoteCount > 0 || dayClosingData._50SoiledNoteCount > 0) {
        cashDenominationRecords.push({
            denomination: '50',
            goodNotes: dayClosingData._50NoteCount || 0,
            soiledNotes: dayClosingData._50SoiledNoteCount || 0,
            type: 'note',
            amount: calculateDenominationAmount(50, dayClosingData._50NoteCount, dayClosingData._50SoiledNoteCount),
        });
    }
    if (dayClosingData._20NoteCount > 0 || dayClosingData._20SoiledNoteCount > 0) {
        cashDenominationRecords.push({
            denomination: '20',
            goodNotes: dayClosingData._20NoteCount || 0,
            soiledNotes: dayClosingData._20SoiledNoteCount || 0,
            type: 'note',
            amount: calculateDenominationAmount(20, dayClosingData._20NoteCount, dayClosingData._20SoiledNoteCount),
        });
    }
    if (dayClosingData._10NoteCount > 0 || dayClosingData._10SoiledNoteCount > 0) {
        cashDenominationRecords.push({
            denomination: '10',
            goodNotes: dayClosingData._10NoteCount || 0,
            soiledNotes: dayClosingData._10SoiledNoteCount || 0,
            type: 'note',
            amount: calculateDenominationAmount(10, dayClosingData._10NoteCount, dayClosingData._10SoiledNoteCount),
        });
    }
    if (dayClosingData._1CoinCount > 0) {
        cashDenominationRecords.push({
            denomination: '1',
            goodNotes: dayClosingData._1CoinCount || 0,
            soiledNotes: 0,
            type: 'coin',
            amount: calculateDenominationAmount(1, dayClosingData._1CoinCount, 0),
        });
    }
    if (dayClosingData._5CoinCount > 0) {
        cashDenominationRecords.push({
            denomination: '5',
            goodNotes: dayClosingData._5CoinCount || 0,
            soiledNotes: 0,
            type: 'coin',
            amount: calculateDenominationAmount(5, dayClosingData._5CoinCount, 0),
        });
    }
    if (dayClosingData._10CoinCount > 0) {
        cashDenominationRecords.push({
            denomination: '10',
            goodNotes: dayClosingData._10CoinCount || 0,
            soiledNotes: 0,
            type: 'coin',
            amount: calculateDenominationAmount(10, dayClosingData._10CoinCount, 0),
        });
    }
    if (dayClosingData._20CoinCount > 0) {
        cashDenominationRecords.push({
            denomination: '20',
            goodNotes: dayClosingData._20CoinCount || 0,
            soiledNotes: 0,
            type: 'coin',
            amount: calculateDenominationAmount(20, dayClosingData._20CoinCount, 0),
        });
    }
    return cashDenominationRecords;
}