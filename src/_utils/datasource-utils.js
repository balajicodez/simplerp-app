import {APP_SERVER_URL_PREFIX} from "../constants";

// Simple in-flight request cache to dedupe identical GET requests
// This is useful in development where React.StrictMode mounts components twice
// and can cause duplicate network calls for the same resource.
const inFlightRequests = new Map();



export async function fetchWithAuth(url) {
    let fullUrl;
    if (url.startsWith('http:') || url.startsWith('https:')) fullUrl = url;
    else fullUrl = `${APP_SERVER_URL_PREFIX}${url}`;

    const key = `GET:${fullUrl}`;

    // If there's already an in-flight request for the same URL, return it
    if (inFlightRequests.has(key)) {
        // Return the existing promise so callers share the same response
        return inFlightRequests.get(key);
    }

    // Create the actual fetch promise and store it in the cache
    const fetchPromise = (async () => {
        const bearerToken = localStorage.getItem('token');

        if (!bearerToken) {
            throw new Error("NO_TOKEN");
        }

        // Await the fetch call to get the Response object
        const response = await fetch(fullUrl, {
            headers: {'Authorization': `Bearer ${bearerToken}`}
        });

        // Check if the request was successful (status in the range 200-299)
        if (!response.ok) {
            const message = `An error occurred: ${response.status}`;
            throw new Error(message);
        }

        // Await the response.json() call to parse the body as a JSON object
        return await response.json();
    })();

    inFlightRequests.set(key, fetchPromise);

    try {
        const data = await fetchPromise;

        // console.log(data); // The fetched data

        return data;
    } finally {
        // Clean up the cache entry so subsequent requests will re-fetch
        inFlightRequests.delete(key);
    }
}

export async function postWithAuthAndBody(url, body, isTextResponse = false) {
    const bearerToken = localStorage.getItem('token');

    // Await the fetch call to get the Response object
    const response = await fetch(`${APP_SERVER_URL_PREFIX}${url}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${bearerToken}`},
        body: JSON.stringify(body)
    });

    // Check if the request was successful (status in the range 200-299)
    if (!response.ok) {
        const text = await response.text();
        if (text) {
            throw new Error(text);
        } else {
            const message = `An error occurred: ${response.status}`;
            throw new Error(message);
        }
    }

    let data;

    if (isTextResponse) data = await response.text();
    else
        data = await response.json(); // Await the response.json() call to parse the body as a JSON object

    // console.log(data); // The fetched data

    return data;
}

export async function postWithAuthAndFormData(url, formData, isTextResponse = false) {
    const bearerToken = localStorage.getItem('token');

    // Await the fetch call to get the Response object
    const response = await fetch(`${APP_SERVER_URL_PREFIX}${url}`, {
        method: 'POST',
        headers: {'Authorization': `Bearer ${bearerToken}`},
        body: formData
    });

    // Check if the request was successful (status in the range 200-299)
    if (!response.ok) {
        const text = await response.text();
        if (text) {
            throw new Error(text);
        } else {
            const message = `An error occurred: ${response.status}`;
            throw new Error(message);
        }
    }

    let data;

    if (isTextResponse) data = await response.text();
    else
        data = await response.json(); // Await the response.json() call to parse the body as a JSON object

    // console.log(data); // The fetched data

    return data;
}



export async function putWithAuthAndBody(url, body) {
    const bearerToken = localStorage.getItem('token');

    // Await the fetch call to get the Response object
    const response = await fetch(`${APP_SERVER_URL_PREFIX}${url}`, {
        method: 'PUT',
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

export async function deleteWithAuth(url) {
    const bearerToken = localStorage.getItem('token');

    // Await the fetch call to get the Response object
    const response = await fetch(`${APP_SERVER_URL_PREFIX}${url}`, {
        method: 'DELETE',
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
