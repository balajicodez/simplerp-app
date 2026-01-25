import {
    fetchWithAuth,
    postWithAuthAndFormData,
} from "../../../_utils/datasource-utils";


export async function fetchExpenses(page = 0, size = 20, expenseType, startDate, endDate, organizationId) {
    let url = `/expenses?page=${page}&size=${size}&expenseType=${expenseType}&startDate=${startDate}&endDate=${endDate}`;
    if (organizationId)
        url += `&organizationId=${organizationId}`;
    return fetchWithAuth(url);
}

export async function postExpenseFormData(expenseFormData) {
    return postWithAuthAndFormData(`/expenses`, expenseFormData, true);
}

export async function fetchExpense(id) {
    return fetchWithAuth(`/expenses/${id}`);
}

export async function fetchCurrentBalance(organizationId, expenseDate) {
    return fetchWithAuth(`/expenses/current_balance?organizationId=${organizationId}&createdDate=${expenseDate}`);
}