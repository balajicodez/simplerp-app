import {fetchWithAuth, postWithAuthAndBody, putWithAuthAndBody} from "../../../_utils/datasource-utils";


export async function fetchExpenses(page = 0, size = 20, expenseType, startDate, endDate, organizationId) {
    let url = `/expenses?page=${page}&size=${size}&expenseType=${expenseType}&startDate=${startDate}&endDate=${endDate}`;
    if (organizationId)
        url += `&organizationId=${organizationId}`;
    return fetchWithAuth(url);
}

export async function postExpenseTypeMaster(expenseTypeMaster) {
    return postWithAuthAndBody(`/expenseTypeMasters`, expenseTypeMaster);
}

export async function fetchExpense(id) {
    return fetchWithAuth(`/expenses/${id}`);
}