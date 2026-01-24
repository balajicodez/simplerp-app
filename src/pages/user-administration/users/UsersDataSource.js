import {deleteWithAuth, fetchWithAuth, postWithAuthAndBody, putWithAuthAndBody} from "../../../_utils/datasource-utils";


export async function fetchUsers(page, size) {
    return fetchWithAuth(`/users?page=${page}&size=${size}&sort=username`);
}

export async function fetchUserById(id) {
    return fetchWithAuth(`/users/${id}`);
}
export async function createUser(record) {
    return postWithAuthAndBody(`/auth/register`, record, true);
}

export async function updateUser(id, user) {
    return putWithAuthAndBody(`/users/${id}`, user);
}

export async function deleteUser(id) {
    return deleteWithAuth(`/users/${id}`);
}

export async function fetchUserRoles(id) {
    return fetchWithAuth(`/users/${id}/roles`);
}