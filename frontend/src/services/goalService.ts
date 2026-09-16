import { api } from './apiClient';

export interface Goal {
  _id: string;
  title: string;
  category: 'Work' | 'Personal' | 'Health' | 'Learning' | 'Other';
  status: 'active' | 'completed' | 'on-hold';
  progress: number;
  deadline?: string;
  description?: string;
  neural_milestones?: Record<string, { tip: string; motivation: string; generatedAt: string }>;
  createdAt: string;
}

export const getGoals = async (): Promise<Goal[]> => {
  const response = await api.get<{ data: Goal[] }>('/api/goals');
  return response.data || [];
};

export const createGoal = async (goalData: Partial<Goal>): Promise<Goal> => {
  const response = await api.post<{ data: Goal }>('/api/goals', goalData);
  return response.data;
};

export const updateGoal = async (id: string, goalData: Partial<Goal>): Promise<Goal> => {
  const response = await api.put<{ data: Goal }>(`/api/goals/${id}`, goalData);
  return response.data;
};

export const deleteGoal = async (id: string): Promise<void> => {
  await api.delete(`/api/goals/${id}`);
};
