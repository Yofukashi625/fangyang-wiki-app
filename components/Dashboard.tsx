import React from 'react';
import { View, School, WikiArticle, Announcement } from '../types';
import { School as SchoolIcon, BookOpen, ExternalLink, ArrowRight, Clock, Bell } from 'lucide-react';

interface DashboardProps {
  schools: School[];
  wikiArticles: WikiArticle[];
  announcements: Announcement[];
  setCurrentView: (view: View) => void;
  onNavigateSchool: (id: string) => void;
  onNavigateWiki: (id: string) => void;
  onNavigateAnnouncement?: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  schools, 
  wikiArticles, 
  announcements,
  setCurrentView, 
  onNavigateSchool, 
  onNavigateWiki,
  onNavigateAnnouncement
}) => {
  // Merge all types and sort strictly by date (descending) to ensure interspersion
  const recentItems = [
    ...schools.map(s => ({ ...s, itemType: 'SCHOOL' as const, date: s.updatedAt, displayTitle: s.name })),
    ...wikiArticles.map(w => ({ ...w, itemType: 'WIKI' as const, date: w.lastModified, displayTitle: w.title })),
    ...announcements.map(a => ({ ...a, itemType: 'ANNOUNCEMENT' as const, date: a.date, displayTitle: a.title }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
   .slice(0, 10);

  const getPreviewText = (item: any) => {
    let raw = "";
    if (item.itemType === 'SCHOOL') {
      raw = item.description || item.programs.join(', ') || "";
    } else {
      // Clean HTML tags and entities for Announcements and Wiki articles
      raw = (item.content || "")
        .replace(/<[^>]*>?/gm, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&[a-z0-9]+;/gi, '') || "";
    }
    return raw.slice(0, 70).trim() + (raw.length > 70 ? "..." : "");
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-800">早安，歡迎來到 FangYang Nexus</h2>
        <p className="text-gray-500 mt-2">您的全方位留學顧問中控台。今天有什麼需要幫忙的嗎？</p>
      </div>

      {/* Onboarding / Quick Start Section */}
      <div className="bg-gradient-to-br from-[#FF4B7D] to-rose-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
        <div className="relative z-10">
          <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-medium mb-4 backdrop-blur-sm">新人培訓 Onboarding</span>
          <h3 className="text-2xl font-bold mb-2">剛加入團隊嗎？從這裡開始</h3>
          <p className="text-rose-100 max-w-xl mb-6">
            我們整理了完整的申請流程圖、常見術語表以及合約規範。閱讀這些指南可以幫助你快速上手業務。
          </p>
          <button 
            onClick={() => setCurrentView(View.ONBOARDING)}
            className="bg-white text-[#FF4B7D] px-5 py-2 rounded-lg font-semibold hover:bg-rose-50 transition-colors inline-flex items-center gap-2 shadow-sm"
          >
            進入新人培訓 <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          onClick={() => setCurrentView(View.ANNOUNCEMENTS)}
          className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
            <Bell size={24} />
          </div>
          <h4 className="text-gray-500 text-sm font-medium">最新公告</h4>
          <p className="text-2xl font-bold text-gray-800 mt-1">{announcements.length} 則</p>
          <div className="mt-4 text-xs text-blue-500 flex items-center font-medium">
            檢視所有公告 <ExternalLink size={12} className="ml-1" />
          </div>
        </div>

        <div 
          onClick={() => setCurrentView(View.SCHOOLS)}
          className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 bg-[#FF4B7D]/10 text-[#FF4B7D] rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#FF4B7D]/20 transition-colors">
            <SchoolIcon size={24} />
          </div>
          <h4 className="text-gray-500 text-sm font-medium">合作院校資料庫</h4>
          <p className="text-2xl font-bold text-gray-800 mt-1">{schools.length} 所</p>
          <div className="mt-4 text-xs text-[#FF4B7D] flex items-center font-medium">
            檢視所有學校 <ExternalLink size={12} className="ml-1" />
          </div>
        </div>

        <div 
          onClick={() => setCurrentView(View.WIKI)}
          className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group md:col-span-2 lg:col-span-1"
        >
          <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-100 transition-colors">
            <BookOpen size={24} />
          </div>
          <h4 className="text-gray-500 text-sm font-medium">知識庫文章</h4>
          <p className="text-2xl font-bold text-gray-800 mt-1">{wikiArticles.length} 篇</p>
          <div className="mt-4 text-xs text-orange-500 flex items-center font-medium">
            檢視最新 SOP 指南 <ExternalLink size={12} className="ml-1" />
          </div>
        </div>
      </div>

      {/* Latest Announcements & Trends Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Clock size={18} className="text-gray-400" />
          <h3 className="text-lg font-bold text-gray-800">最新公告與動態</h3>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100 overflow-hidden">
          {recentItems.length > 0 ? (
            recentItems.map((item) => (
              <div 
                key={item.id} 
                onClick={() => {
                  if (item.itemType === 'SCHOOL') onNavigateSchool(item.id);
                  else if (item.itemType === 'WIKI') onNavigateWiki(item.id);
                  else if (onNavigateAnnouncement) onNavigateAnnouncement(item.id);
                  else setCurrentView(View.ANNOUNCEMENTS);
                }}
                className="p-5 flex items-center justify-between hover:bg-rose-50/20 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-5 flex-1 min-w-0">
                  {/* Icon Column */}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-105 ${
                    item.itemType === 'SCHOOL' ? 'bg-rose-50 text-[#FF4B7D]' : 
                    item.itemType === 'WIKI' ? 'bg-orange-50 text-orange-500' : 
                    'bg-blue-50 text-blue-500'
                  }`}>
                    {item.itemType === 'SCHOOL' ? <SchoolIcon size={22} /> : 
                     item.itemType === 'WIKI' ? <BookOpen size={22} /> : 
                     <Bell size={22} />}
                  </div>

                  {/* Text Content Column */}
                  <div className="flex-1 min-w-0 pr-4">
                    <h4 className="font-bold text-gray-800 text-[15px] truncate group-hover:text-[#FF4B7D] transition-colors">
                      {item.displayTitle}
                    </h4>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-1 font-medium leading-relaxed">
                      {getPreviewText(item)}
                    </p>
                  </div>
                </div>
                
                {/* Meta Information Column (Far Right, Replacing Arrow) */}
                <div className="flex items-center gap-4 flex-shrink-0">
                  <span className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider border transition-colors ${
                    item.itemType === 'SCHOOL' ? 'bg-rose-50 text-[#FF4B7D] border-rose-100 group-hover:bg-rose-100' : 
                    item.itemType === 'WIKI' ? 'bg-orange-50 text-orange-500 border-orange-100 group-hover:bg-orange-100' : 
                    'bg-blue-50 text-blue-600 border-blue-100 group-hover:bg-blue-100'
                  }`}>
                    {item.itemType === 'SCHOOL' ? '院校更新' : 
                     item.itemType === 'WIKI' ? '知識庫' : 
                     '最新公告'}
                  </span>
                  <span className="text-xs font-bold text-gray-300 tabular-nums min-w-[80px] text-right">
                    {item.date}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-gray-400">
              目前尚無任何更新紀錄
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;