import {fetchWithAuth, postWithAuthAndBody, putWithAuthAndBody} from "../../../_utils/datasource-utils";

export async function fetchOrganizations(page, size) {
  return fetchWithAuth(`/organizations?page=${page}&size=${size}`);
}

export async function fetchOrganizationById(id) {
  return fetchWithAuth(`/organizations/${id}`);
}

export async function updateOrganization(id, organization) {
  return putWithAuthAndBody(`/organizations/${id}`, organization);
}

export async function createOrganization(organization) {
  return postWithAuthAndBody(`/organizations`, organization);
}