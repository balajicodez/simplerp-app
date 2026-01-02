import {APP_SERVER_URL_PREFIX} from "../../constants";

export async function loginApiCall(username, password) {

    // Await the fetch call to get the Response object
    const response = await fetch(APP_SERVER_URL_PREFIX + '/auth/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            username: username,
            password: password
        }),
    });

    // Check if the request was successful (status in the range 200-299)
    if (!response.ok) {
        const message = `An error occurred: ${response.status}`;
        throw new Error(message);
    }

    // Await the response.json() call to parse the body as a JSON object
    return await response.json();
}

