import {fetchWithAuth} from "../../../_utils/datasource-utils";

export function fetchDayClosingData(organizationId, closingDate) {
    return fetchWithAuth(`/pettyCashDayClosings/search/findByClosingDateAndOrganizationId?closingDate=${closingDate}&organizationId=${organizationId}`);
}

export async function fetchExpenseReportData(organizationId, closingDate) {
    return fetchWithAuth(`/expenses/report?organizationId=${organizationId}&createdDate=${closingDate}`);
}

export async function fetchAllHandLoans(page, size) {
    return fetchWithAuth(`/handloans/all?page=${page}&size=${size}`);
}

export async function fetchHandLoans(page = 0, size = 20, statuses, organizationId) {
    let url = `/handloans/getHandLoansByOrgIdAndStatus?page=${page}&size=${size}`;
    if (statuses && statuses.length > 0)
        url += `&status=${statuses.join(',')}`;
    if (organizationId)
        url += `&organizationId=${organizationId}`;
    return fetchWithAuth(url);
}