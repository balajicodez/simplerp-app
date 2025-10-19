// Use a relative prefix in development so the CRA dev server proxy can forward requests
// to the API and avoid CORS. In production this should be the real API origin.
export const APP_SERVER_URL_PREFIX = 'http://localhost:9090/simplerp/api';