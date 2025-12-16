
export enum View {
  DASHBOARD = 'DASHBOARD',
  SCHOOLS = 'SCHOOLS',
  WIKI = 'WIKI',
  AI_CHAT = 'AI_CHAT',
  ONBOARDING = 'ONBOARDING',
  PLACEMENT = 'PLACEMENT',
  SETTINGS = 'SETTINGS'
}

export interface School {
  id: string;
  name: string;
  location: string;
  country: string;
  type: 'Graduate School' | 'University' | 'High School' | 'Language School';
  programs: string[]; // General popular programs
  department?: string; // Specific department or faculty focus
  qsRanking?: number;
  usNewsRanking?: number;
  tuitionRange: string; // e.g., "$30,000 - $45,000"
  requirements: {
    gpa?: string;
    toefl?: string;
    ielts?: string;
    sat?: string;
    other?: string;
  };
  tags: string[]; // e.g., "STEM", "Downtown", "Co-op"
  description?: string; // Full text description, hidden in card view
  isPartner?: boolean; // If true, show badge on card
  updatedAt: string;
}

export enum WikiCategory {
  PROCESS = 'PROCESS', // 申請流程
  FAQ = 'FAQ', // 常見 Q&A
  GLOSSARY = 'GLOSSARY', // 專有名詞
  SALES = 'SALES', // 銷售話術
  CONTRACT = 'CONTRACT', // 合約條款
  PARTNER = 'PARTNER' // 合作廠商資訊
}

export interface WikiArticle {
  id: string;
  title: string;
  category: WikiCategory;
  content: string; // Markdown supported
  tags: string[];
  lastModified: string;
}

export interface Citation {
  id: string;
  title: string;
  type: 'SCHOOL' | 'WIKI';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  sources?: Citation[];
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
  feedback?: 'positive' | 'negative';
}

export interface OnboardingTask {
  id: string;
  day: number; // 1 to 10+
  title: string;
  description: string; // Markdown supported content
  isCompleted?: boolean; // Local state for user tracking
}
