import { api } from './apiClient';

export interface DashboardStats {
  chats: number;
  docs: number;
  tasks: number;
  goals: number;
  emails: number;
  meetings: number;
  resumes: number;
}


export interface SystemLog {
  _id: string;
  event: string;
  level: 'info' | 'success' | 'warning' | 'error';
  createdAt: string;
  user_id?: {
    email: string;
    full_name: string;
  };
}

export interface HistoryItem {
  _id: string;
  type: 'chat' | 'doc' | 'brainstorm' | 'live' | 'writing' | 'task';
  title: string;
  content: string;
  response: string;
  createdAt: string;
}

export interface Session {
  _id: string;
  title: string;
  type: 'chat' | 'email' | 'meeting' | 'resume' | 'doc' | 'writing' | 'brainstorm';
  content: any;
  updatedAt: string;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.get<{ data: DashboardStats }>('/api/dashboard/stats');
  return response.data;
};

export const getSystemLogs = async (): Promise<SystemLog[]> => {
  const response = await api.get<{ data: SystemLog[] }>('/api/dashboard/logs');
  return response.data || [];
};

export const getHistory = async (): Promise<HistoryItem[]> => {
  const response = await api.get<{ data: HistoryItem[] }>('/api/history');
  return response.data || [];
};

export const getSessions = async (limit: number = 10, type?: string): Promise<Session[]> => {
  const url = type ? `/api/sessions?limit=${limit}&type=${type}` : `/api/sessions?limit=${limit}`;
  const response = await api.get<{ data: Session[] }>(url);
  return response.data || [];
};


export const getSessionById = async (id: string): Promise<Session> => {
  const response = await api.get<{ data: Session }>(`/api/sessions/${id}`);
  return response.data;
};

export const dashboardService = {
  getDashboardStats,
  getSystemLogs,
  getHistory,
  getSessions,
  getSessionById
};
