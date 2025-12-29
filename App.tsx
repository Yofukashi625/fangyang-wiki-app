
import React, { useState, useEffect } from 'react';
import { View, School, WikiArticle, OnboardingTask, Announcement } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import SchoolDatabase from './components/SchoolDatabase';
import Wiki from './components/Wiki';
import AIAssistant from './components/AIAssistant';
import Onboarding from './components/Onboarding';
import Announcements from './components/Announcements';
import RecommendationGenerator from './components/RecommendationGenerator';
import { getWikiArticles, getSchools, getOnboardingTasks, getAnnouncements } from './services/firebase';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  
  // Deep linking state
  const [initialSchoolId, setInitialSchoolId] = useState<string | null>(null);
  const [initialWikiId, setInitialWikiId] = useState<string | null>(null);
  const [initialAction, setInitialAction] = useState<string | null>(null);

  // Lifted state to share data between components
  const [schools, setSchools] = useState<School[]>([]);
  const [wikiArticles, setWikiArticles] = useState<WikiArticle[]>([]); 
  const [onboardingTasks, setOnboardingTasks] = useState<OnboardingTask[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Load All Data from Firebase
  useEffect(() => {
    const loadData = async () => {
      try {
        const [wikiData, schoolData, taskData, announcementData] = await Promise.all([
          getWikiArticles(),
          getSchools(),
          getOnboardingTasks(),
          getAnnouncements()
        ]);

        setWikiArticles(wikiData);
        setSchools(schoolData.length > 0 ? schoolData : []);
        setOnboardingTasks(taskData.length > 0 ? taskData : []);
        setAnnouncements(announcementData.length > 0 ? announcementData : []);
      } catch (e) {
        console.error("Failed to load data", e);
      }
    };
    loadData();
  }, []);

  const handleNavigateToSchool = (id: string) => {
    setInitialSchoolId(id);
    setCurrentView(View.SCHOOLS);
  };

  const handleNavigateToWiki = (id: string) => {
    setInitialWikiId(id);
    setCurrentView(View.WIKI);
  };

  const handleTriggerAction = (action: 'WIKI' | 'ANNOUNCEMENT') => {
    setInitialAction(`CREATE_${action}`);
    if (action === 'WIKI') setCurrentView(View.WIKI);
    if (action === 'ANNOUNCEMENT') setCurrentView(View.ANNOUNCEMENTS);
  };

  const renderContent = () => {
    switch (currentView) {
      case View.DASHBOARD:
        return (
          <Dashboard 
            schools={schools} 
            wikiArticles={wikiArticles} 
            announcements={announcements}
            setCurrentView={setCurrentView} 
            onNavigateSchool={handleNavigateToSchool}
            onNavigateWiki={handleNavigateToWiki}
            onNavigateAnnouncement={() => setCurrentView(View.ANNOUNCEMENTS)}
          />
        );
      case View.ANNOUNCEMENTS:
        return (
          <Announcements 
            announcements={announcements} 
            setAnnouncements={setAnnouncements}
            initialAction={initialAction}
            onClearAction={() => setInitialAction(null)}
          />
        );
      case View.SCHOOLS:
        return (
          <SchoolDatabase 
            schools={schools} 
            setSchools={setSchools} 
            initialSchoolId={initialSchoolId}
            onClearInitialId={() => setInitialSchoolId(null)}
          />
        );
      case View.WIKI:
        return (
          <Wiki 
            articles={wikiArticles} 
            setArticles={setWikiArticles} 
            initialWikiId={initialWikiId}
            onClearInitialId={() => setInitialWikiId(null)}
            initialAction={initialAction}
            onClearAction={() => setInitialAction(null)}
          />
        );
      case View.ONBOARDING:
        return <Onboarding tasks={onboardingTasks} setTasks={setOnboardingTasks} />;
      case View.RECOMMENDATION_GENERATOR:
        return <RecommendationGenerator />;
      case View.AI_CHAT:
        return (
          <AIAssistant 
            wikiArticles={wikiArticles} 
            schools={schools} 
            announcements={announcements} 
            onTriggerCreate={handleTriggerAction}
            onNavigate={setCurrentView}
          />
        );
      case View.SETTINGS:
        return (
          <div className="p-8 text-center text-gray-500">
            <h2 className="text-2xl font-bold mb-2">設定</h2>
            <p>系統設定與權限管理 (功能開發中)</p>
          </div>
        );
      default:
        return <Dashboard schools={schools} wikiArticles={wikiArticles} announcements={announcements} setCurrentView={setCurrentView} onNavigateSchool={handleNavigateToSchool} onNavigateWiki={handleNavigateToWiki} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      
      <main className="ml-64 flex-1 overflow-hidden">
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
