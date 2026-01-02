import {fetchWithAuth, postWithAuthAndBody, putWithAuthAndBody} from "../../../_utils/datasource-utils";


export async function fetchExpenseMaterTypes(page = 0, size = 20) {
    return fetchWithAuth(`/expenseTypeMasters?page=${page}&size=${size}`);
}

export async function postExpenseTypeMaster(expenseTypeMaster) {
    return postWithAuthAndBody(`/expenseTypeMasters`, expenseTypeMaster);
}

export async function fetchExpenseMaster(id) {
    return fetchWithAuth(`/expenseTypeMasters/${id}`);
}