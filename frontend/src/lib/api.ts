const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const api = {
    async get(endpoint: string) {
        const res = await fetch(`${API_BASE_URL}${endpoint}`);
        if (!res.ok) throw new Error(`API error: ${res.statusText}`);
        return res.json();
    },

    async post(endpoint: string, data: any) {
        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error(`API error: ${res.statusText}`);
        return res.json();
    }
};

export const registerUser = (data: { name: string; email: string; descriptor: number[] }) =>
    api.post('/register', data);

export const processAccess = (descriptor: number[]) =>
    api.post('/access', { descriptor });

export const getStats = () =>
    api.get('/stats');

export const getUsers = (page = 1, limit = 20) =>
    api.get(`/users?page=${page}&limit=${limit}`);
