import axios from 'axios';
export const API_BASE = 'http://localhost:3000/api';
function getErrorMessage(error) {
    const payload = error.response?.data;
    if (typeof payload === 'string') {
        const text = payload.trim();
        return text || error.message || '请求失败';
    }
    if (payload && typeof payload === 'object' && payload.message) {
        return payload.message;
    }
    return error.message || '请求失败';
}
export const http = axios.create({
    baseURL: API_BASE,
    timeout: 30000,
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
    },
});
http.interceptors.request.use((config) => config);
http.interceptors.response.use((response) => response, (error) => {
    return Promise.reject(new Error(getErrorMessage(error)));
});
