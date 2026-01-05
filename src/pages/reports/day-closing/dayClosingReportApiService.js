import {fetchWithAuth} from "../../../_utils/datasource-utils";

export function fetchDayClosingData(organizationId, closingDate) {
    return fetchWithAuth(`/pettyCashDayClosings/search/findByClosingDateAndOrganizationId?closingDate=${closingDate}&organizationId=${organizationId}`);
}

export async function fetchOrganizations() {
    return fetchWithAuth("/organizations");
}

export async function fetchExpenseReportData(organizationId, closingDate) {
    return fetchWithAuth(`/expenses/report?organizationId=${organizationId}&createdDate=${closingDate}`);
}

export async function fetchHandloansData(page, size) {
    return fetchWithAuth(`/handloans/all?page=${page}&size=${size}`);
}