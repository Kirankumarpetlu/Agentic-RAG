import axios from 'axios';

// In production (Vercel), set VITE_API_URL to your backend URL (e.g. https://your-api.onrender.com/api)
// In local dev, it defaults to '/api' which is proxied by Vite to localhost:8000
const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' },
});

export async function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
}

export async function queryDocuments(question) {
    const res = await api.post('/query', { question });
    return res.data;
}

export default api;
