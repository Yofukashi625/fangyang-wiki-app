
import React from 'react';
import { View, School, WikiArticle } from '../types';
import { School as SchoolIcon, BookOpen, ExternalLink, ArrowRight } from 'lucide-react';

interface DashboardProps {
  schools: School[];
  wikiArticles: WikiArticle[];
  setCurrentView: (view: View) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ schools, wikiArticles, setCurrentView }) => {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-800">早安，歡迎回來</h2>
        <p className="text-gray-500 mt-2">歡迎回到 FangYang Connect。今天有什麼需要幫忙的嗎？</p>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
          className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
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
        
        {/* Placeholder for future expansion */}
        <div className="bg-gray-50 p-6 rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
          <p className="text-gray-400 text-sm mb-2">即將推出</p>
          <p className="font-semibold text-gray-500">學生進度追蹤系統</p>
        </div>
      </div>

      {/* Recent Updates */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4">最新更新</h3>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
          {schools.slice(0, 3).map((school) => (
            <div key={school.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-[#FF4B7D]"></div>
                <div>
                  <p className="font-medium text-gray-800 text-sm">{school.name}</p>
                  <p className="text-xs text-gray-500">更新了 2024 秋季入學要求</p>
                </div>
              </div>
              <span className="text-xs text-gray-400">{school.updatedAt}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
