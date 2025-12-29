
import React from 'react';
import { View } from '../types';
import { LayoutDashboard, BookOpen, School, MessageSquareText, Settings, Flag, Bell, Wand2, Calculator } from 'lucide-react';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  const menuItems = [
    { id: View.DASHBOARD, label: '總覽 Dashboard', icon: LayoutDashboard },
    { id: View.ANNOUNCEMENTS, label: '最新公告', icon: Bell },
    { id: View.SCHOOLS, label: '合作院校資料庫', icon: School },
    { id: View.WIKI, label: '員工知識庫 & SOP', icon: BookOpen },
    { id: View.ONBOARDING, label: '新人培訓', icon: Flag },
    { id: View.TRANSCRIPT_CONVERTER, label: '成績單換算器', icon: Calculator },
    { id: View.RECOMMENDATION_GENERATOR, label: '選校推薦產生器', icon: Wand2 },
    { id: View.AI_CHAT, label: 'AI 智能助教', icon: MessageSquareText },
  ];

  return (
    <div className="w-64 bg-white h-screen border-r border-gray-200 flex flex-col fixed left-0 top-0 shadow-sm z-10">
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-lg font-bold text-[#FF4B7D] flex items-center gap-2 whitespace-nowrap overflow-hidden">
          <span className="text-xl">⚛️</span> FangYang Nexus
        </h1>
        <p className="text-xs text-gray-500 mt-1">顧問資訊整合中心</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-[#FF4B7D]/10 text-[#FF4B7D] font-medium shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button 
          onClick={() => setCurrentView(View.SETTINGS)}
          className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-gray-800 w-full rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Settings size={20} />
          <span>設定</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
