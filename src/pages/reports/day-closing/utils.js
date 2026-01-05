// Safe number formatting function
export function safeToLocaleString(value) {
    if (value === null || value === undefined || isNaN(value)) {
        return "0.00";
    }
    return Number(value).toFixed(2).toLocaleString();
}