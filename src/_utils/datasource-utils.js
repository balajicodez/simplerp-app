import {APP_SERVER_URL_PREFIX} from "../constants";

export async function fetchWithAuth(url) {
    const bearerToken = localStorage.getItem('token');

    // Await the fetch call to get the Response object
    const response = await fetch(`${APP_SERVER_URL_PREFIX}${url}`,
        {
            headers: {'Authorization': `Bearer ${bearerToken}`}
        });

    // Check if the request was successful (status in the range 200-299)
    if (!response.ok) {
        const message = `An error occurred: ${response.status}`;
        throw new Error(message);
    }

    // Await the response.json() call to parse the body as a JSON object
    const data = await response.json();

   // console.log(data); // The fetched data

    return data;
}

export async function postWithAuthAndBody(url, body) {
    const bearerToken = localStorage.getItem('token');

    // Await the fetch call to get the Response object
    const response = await fetch(`${APP_SERVER_URL_PREFIX}${url}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${bearerToken}`},
        body: JSON.stringify(body)
    });

    // Check if the request was successful (status in the range 200-299)
    if (!response.ok) {
        const message = `An error occurred: ${response.status}`;
        throw new Error(message);
    }

    // Await the response.json() call to parse the body as a JSON object
    const data = await response.json();

    // console.log(data); // The fetched data

    return data;
}