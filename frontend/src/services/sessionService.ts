import { api } from './apiClient';

export interface Session {
    _id: string;
    user: string;
    title: string;
    type: 'chat' | 'email' | 'meeting' | 'resume' | 'doc' | 'writing' | 'brainstorm' | 'tasks';
    content: any;
    metadata: any;
    updatedAt: string;
    createdAt: string;
}

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export const sessionService = {
    async createSession(sessionData: Partial<Session>): Promise<Session> {
        const response = await api.post<ApiResponse<Session>>('/api/sessions', sessionData);
        return response.data;
    },

    async getSessions(type?: string, limit: number = 20): Promise<Session[]> {
        let path = `/api/sessions?limit=${limit}`;
        if (type) path += `&type=${type}`;
        
        const response = await api.get<ApiResponse<Session[]>>(path);
        return response.data || [];
    },

    async getSessionById(id: string): Promise<Session> {
        const response = await api.get<ApiResponse<Session>>(`/api/sessions/${id}`);
        return response.data;
    },

    async updateSession(id: string, sessionData: Partial<Session>): Promise<Session> {
        const response = await api.put<ApiResponse<Session>>(`/api/sessions/${id}`, sessionData);
        return response.data;
    }
};
