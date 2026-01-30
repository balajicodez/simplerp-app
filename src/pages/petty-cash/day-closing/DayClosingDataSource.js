import {
    fetchWithAuth, postWithAuthAndBody,
    postWithAuthAndFormData,
} from "../../../_utils/datasource-utils";


export async function fetchDayClosingExpenses(page = 0, size = 20, createdDate, organizationId) {
    let url = `/expenses?page=${page}&size=${size}&createdDate=${createdDate}`;
    if (organizationId)
        url += `&organizationId=${organizationId}`;
    return fetchWithAuth(url);
}

export async function fetchInitBalanceDate(closingDate, organizationId) {
    return fetchWithAuth(`/petty-cash/day-closing/init?closingDate=${closingDate}&organizationId=${organizationId}`);
}

export async function postDayClosingFormData(formData) {
    return postWithAuthAndFormData(`/petty-cash/day-closing`, formData, true);
}

export async function postWhatsappReport(data) {
    return postWithAuthAndBody(`/wapp/api/v2/send/bytemplate/json`, data)
}