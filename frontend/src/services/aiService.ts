import { api } from './apiClient';

/**
 * aiService.ts
 * Unified service for all AI-powered features using the OpenAI backend.
 */

export const askNexus = async (
  prompt: string,
  _context?: string,
  mode: string = 'chat'
): Promise<string> => {
  // Use the new /api/chat endpoint which is mapped to OpenAI
  const response = await api.post<any>('/api/chat', { 
    message: prompt,
    mode 
  });
  return response.data?.reply || response.reply || "";
};

export const getChatHistory = async (): Promise<any[]> => {
  const response = await api.get<{ data: any[] }>('/api/chat/history');
  return response.data || [];
};

export const clearChatHistory = async (): Promise<void> => {
  await api.delete('/api/chat/history');
};

export const brainstormIdeas = async (
  topic: string
): Promise<string[]> => {
  const response = await api.post<any>('/api/ai/brainstorm', { topic });
  return response.data?.ideas || response.ideas || [];
};

export const analyzeDocumentTextOnly = async (
  text: string,
  filename?: string
): Promise<any> => {
  const response = await api.post<any>('/api/ai/analyze', { text, filename });
  return response.data || response.result || response;
};

export const generateTaskAnalysis = async (tasks: string): Promise<string> => {
  const response = await api.post<any>('/api/ai/tasks/ai', {
    action: 'analyze',
    tasks,
  });
  return response.data?.advice || response.advice || "";
};

export const decomposeTask = async (
  task: string
): Promise<{ title: string; priority: 'low' | 'medium' | 'high' }[]> => {
  const response = await api.post<any>('/api/ai/tasks/ai', {
    taskTitle: task,
  });
  return response.data || response;
};

export const saveLiveInteraction = async (
  transcript: string[],
  duration?: number
): Promise<void> => {
  await api.post('/api/ai/live-interaction/save', { transcript, duration });
};
