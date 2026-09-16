import { api } from './apiClient';

export const ACCESS_TOKEN_KEY = 'access-token';

type RegisterPayload = {
    email: string;
    password?: string;
    full_name?: string;
};

type LoginPayload = {
    email: string;
    password?: string;
};

export const authService = {
    me: () => api.get('/api/auth/me'),
};

