import {fetchWithAuth, postWithAuthAndBody} from "../../../_utils/datasource-utils";


export async function fetchExpenseMaterTypes(page = 0) {
    return fetchWithAuth(`/expenseTypeMasters?page=${page}&size=50`);
}

export async function createExpenseTypeMaster(expenseTypeMaster) {
    return postWithAuthAndBody(`/expenseTypeMasters`, expenseTypeMaster);
}