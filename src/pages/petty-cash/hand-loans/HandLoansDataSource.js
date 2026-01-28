import {
    fetchWithAuth,
    postWithAuthAndFormData,
} from "../../../_utils/datasource-utils";


export async function fetchHandLoans(page = 0, size = 20, statuses, organizationId) {
    let url = `/handloans/getHandLoansByOrgIdAndStatus?page=${page}&size=${size}`;
    if (statuses && statuses.length > 0)
        url += `&status=${statuses.join(',')}`;
    if (organizationId)
        url += `&organizationId=${organizationId}`;
    return fetchWithAuth(url);
}

export async function postHomeLoanFormData(formData) {
    return postWithAuthAndFormData(`/handloans`, formData, true);
}

export async function fetchMainLoadByID(id) {
    return fetchWithAuth(`/handloans/getmainloanbyid/${id}`);
}

export async function fetchHandLoan(id) {
    return fetchWithAuth(`/handloans/${id}`);
}
