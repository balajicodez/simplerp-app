import {deleteWithAuth, fetchWithAuth, postWithAuthAndBody, putWithAuthAndBody} from "../../../_utils/datasource-utils";

export async function fetchPermissions(page, size) {
    return fetchWithAuth(`/permissions?page=${page}&size=${size}`);
}


export async function fetchPermissionById(id) {
    return fetchWithAuth(`/permissions/${id}`);
}

export async function updatePermission(id, organization) {
    return putWithAuthAndBody(`/permissions/${id}`, organization);
}

export async function createPermission(organization) {
    return postWithAuthAndBody(`/permissions`, organization);
}

export async function deletePermission(permissionId) {
    return deleteWithAuth(`/permissions/${permissionId}`);
}
