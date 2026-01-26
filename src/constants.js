// Use a relative prefix in development so the CRA dev server proxy can forward requests
// to the API and avoid CORS. In production this should be the real API origin.
export let APP_SERVER_URL_PREFIX = 'http://localhost:9090/simplerp/api';
export const DAY_CLOSING_WHATSAPP_NUMBERS_CSV = '9740665561,9866472624,9948011234,8985221844';


if (process.env.REACT_APP_API_URL) {
    // for production create .env file and place below value
    // REACT_APP_API_URL='http://simplerp.sridivyasarees.com:9090/simplerp/api'
    APP_SERVER_URL_PREFIX = process.env.REACT_APP_API_URL;
}
//export const DAY_CLOSING_WHATSAPP_NUMBERS_CSV = '9740665561';


export const DATE_DISPLAY_FORMAT = 'DD-MM-YYYY';
export const DATE_SYSTEM_FORMAT = 'YYYY-MM-DD';


export const APP_TITLE = 'SimplERP';
export const CUSTOMER_TITLE = 'Sri Divya Sarees Pvt Ltd';