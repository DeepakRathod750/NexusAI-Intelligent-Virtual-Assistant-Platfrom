
export enum AppView {
  // Core Views
  DASHBOARD = 'dashboard',
  CHAT = 'chat',
  DOC_ANALYZER = 'docs',
  BRAINSTORMER = 'brainstorm',
  WRITING_STUDIO = 'writing-studio',
  FOCUS_SESSION = 'focus-session',
  
  // Management
  GOAL_TRACKER = 'goal-tracker',
  EMAIL_ASSISTANT = 'email-assistant',
  MEETING_NOTES = 'meeting-notes',
  RESUME_GENERATOR = 'resume-generator',
  KNOWLEDGE_BASE = 'knowledge',
  SETTINGS = 'settings'
}

export interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  deadline?: string;
}
export interface BrainstormIdea {
  title: string;
  description: string;
  category: string;
}

export interface AnalysisResult {
  summary: string;
  keyPoints: string[];
  actionItems: string[];
}

export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'research' | 'meeting';
  tags?: string[];
  dateAdded: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  sources?: GroundingSource[];
}
