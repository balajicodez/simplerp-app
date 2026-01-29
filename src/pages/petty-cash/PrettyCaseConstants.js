import React from "react";

export const PRETTY_CASE_TYPES = {
    "CASH-IN": {
        label: "CASH IN",
        value: "CASH-IN",
        color: 'green'
    },
    "CASH-OUT": {
        label: "CASH OUT",
        value: "CASH-OUT",
        color: 'volcano'
    }
}

export const PRETTY_CASE_PAGE_TITLE = <span>Petty Cash</span>;


export const getExpenseColor = (expenseType) => {
   return PRETTY_CASE_TYPES[expenseType]?.color || 'green';
};
