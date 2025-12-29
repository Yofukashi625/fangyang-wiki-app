
export enum View {
  DASHBOARD = 'DASHBOARD',
  ANNOUNCEMENTS = 'ANNOUNCEMENTS',
  SCHOOLS = 'SCHOOLS',
  WIKI = 'WIKI',
  AI_CHAT = 'AI_CHAT',
  ONBOARDING = 'ONBOARDING',
  RECOMMENDATION_GENERATOR = 'RECOMMENDATION_GENERATOR',
  SETTINGS = 'SETTINGS'
}

export interface School {
  id: string;
  name: string;
  location: string;
  country: string;
  type: 'Graduate School' | 'University' | 'High School' | 'Language School';
  programs: string[]; 
  department?: string; 
  qsRanking?: number;
  usNewsRanking?: number;
  tuitionRange: string; 
  requirements: {
    gpa?: string;
    toefl?: string;
    ielts?: string;
    sat?: string;
    other?: string;
  };
  tags: string[]; 
  description?: string; 
  isPartner?: boolean; 
  updatedAt: string;
}

export enum WikiCategory {
  PROCESS = 'PROCESS', 
  FAQ = 'FAQ', 
  GLOSSARY = 'GLOSSARY', 
  SALES = 'SALES', 
  CONTRACT = 'CONTRACT', 
  PARTNER = 'PARTNER' 
}

export interface WikiArticle {
  id: string;
  title: string;
  category: WikiCategory;
  content: string; 
  tags: string[];
  lastModified: string;
}

export enum AnnouncementCategory {
  PARTNER = 'PARTNER', // 合作廠商資訊
  INTERNAL = 'INTERNAL', // 公司內部公告
  RULES = 'RULES', // 申請規則異動
  ACTIVITIES = 'ACTIVITIES' // 放洋最新活動
}

export interface Announcement {
  id: string;
  title: string;
  category: AnnouncementCategory;
  content: string;
  author?: string;
  date: string;
  imageUrl?: string;
  tags: string[];
}

export interface Citation {
  id: string;
  title: string;
  type: 'SCHOOL' | 'WIKI' | 'ANNOUNCEMENT';
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
  day: number; 
  title: string;
  description: string; 
  isCompleted?: boolean; 
  role?: 'SALES' | 'ADMIN'; // 區分：前端招生顧問 | 後端行政顧問
}
