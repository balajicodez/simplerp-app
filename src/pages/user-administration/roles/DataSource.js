import {deleteWithAuth, fetchWithAuth, postWithAuthAndBody, putWithAuthAndBody} from "../../../_utils/datasource-utils";

export async function fetchRoles(page, size) {
    return fetchWithAuth(`/roles?page=${page}&size=${size}`);
}


export async function fetchRoleById(id) {
    return fetchWithAuth(`/roles/${id}`);
}

export async function updateRole(id, record) {
    return putWithAuthAndBody(`/roles/${id}`, record);
}

export async function createRole(record) {
    return postWithAuthAndBody(`/roles`, record);
}

export async function deleteRole(id) {
    return deleteWithAuth(`/roles/${id}`);
}

export async function fetchRolePermissions(id) {
    return fetchWithAuth(`/roles/${id}/permissions`);
}

export async function updateRolePermissions(id, permissionIds) {
    return postWithAuthAndBody(`/roles/${id}/permissions`, {
        permissionIds: permissionIds
    });
}