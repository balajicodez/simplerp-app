import {
    fetchWithAuth,
    postWithAuthAndFormData,
} from "../../../_utils/datasource-utils";


export async function fetchDayClosingExpenses(page = 0, size = 20, createdDate, organizationId) {
    let url = `/expenses?page=${page}&size=${size}&createdDate=${createdDate}`;
    if (organizationId)
        url += `&organizationId=${organizationId}`;
    return fetchWithAuth(url);
}