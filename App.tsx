
import React, { useState } from 'react';
import { View, School, WikiArticle, OnboardingTask } from './types';
import { INITIAL_SCHOOLS, INITIAL_WIKI_ARTICLES, INITIAL_ONBOARDING_DATA } from './constants';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import SchoolDatabase from './components/SchoolDatabase';
import Wiki from './components/Wiki';
import AIAssistant from './components/AIAssistant';
import Onboarding from './components/Onboarding';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  
  // Lifted state to share data between components (and potentially context for AI)
  const [schools, setSchools] = useState<School[]>(INITIAL_SCHOOLS);
  const [wikiArticles, setWikiArticles] = useState<WikiArticle[]>(INITIAL_WIKI_ARTICLES);
  const [onboardingTasks, setOnboardingTasks] = useState<OnboardingTask[]>(INITIAL_ONBOARDING_DATA);

  const renderContent = () => {
    switch (currentView) {
      case View.DASHBOARD:
        return <Dashboard schools={schools} wikiArticles={wikiArticles} setCurrentView={setCurrentView} />;
      case View.SCHOOLS:
        return <SchoolDatabase schools={schools} setSchools={setSchools} />;
      case View.WIKI:
        return <Wiki articles={wikiArticles} setArticles={setWikiArticles} />;
      case View.ONBOARDING:
        return <Onboarding tasks={onboardingTasks} setTasks={setOnboardingTasks} />;
      case View.AI_CHAT:
        return <AIAssistant wikiArticles={wikiArticles} schools={schools} />;
      case View.SETTINGS:
        return (
          <div className="p-8 text-center text-gray-500">
            <h2 className="text-2xl font-bold mb-2">設定</h2>
            <p>系統設定與權限管理 (功能開發中)</p>
          </div>
        );
      default:
        return <Dashboard schools={schools} wikiArticles={wikiArticles} setCurrentView={setCurrentView} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      
      {/* Main Content Area - Offset by Sidebar width */}
      <main className="ml-64 flex-1 overflow-hidden">
        {/* Wrap content with key and animation class for fade in/out */}
        <div 
          key={currentView} 
          className="h-full animate-in fade-in duration-300 slide-in-from-bottom-2"
        >
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
