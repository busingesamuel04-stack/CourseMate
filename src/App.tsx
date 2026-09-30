import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { TopBar } from './components/navigation/TopBar';
import { BottomNav } from './components/navigation/BottomNav';
import { Sidebar } from './components/navigation/Sidebar';
import { HomeScreen } from './components/home/HomeScreen';
import { PlannerScreen } from './components/planner/PlannerScreen';
import { CoursesScreen } from './components/courses/CoursesScreen';
import { StudyScreen } from './components/study/StudyScreen';
import { CampusScreen } from './components/campus/CampusScreen';
import { ProfileScreen } from './components/profile/ProfileScreen';

// Modals
import { FocusSessionModal } from './components/modals/FocusSessionModal';
import { AddTaskModal } from './components/modals/AddTaskModal';
import { AddEventModal } from './components/modals/AddEventModal';
import { AssignmentDetailModal } from './components/modals/AssignmentDetailModal';
import { ExamConflictModal } from './components/modals/ExamConflictModal';
import { CourseDetailModal } from './components/modals/CourseDetailModal';
import { MaterialViewerModal } from './components/modals/MaterialViewerModal';
import { SourceConnectModal } from './components/modals/SourceConnectModal';
import { OpportunityModal } from './components/modals/OpportunityModal';
import { MarketplaceModal } from './components/modals/MarketplaceModal';
import { CampusServiceModal } from './components/modals/CampusServiceModal';
import { NotificationsDrawer } from './components/notifications/NotificationsDrawer';
import { InformationFlowBanner } from './components/common/InformationFlowBanner';
import { AIAssistantModal } from './components/modals/AIAssistantModal';
import { CreateStudyGroupModal } from './components/modals/CreateStudyGroupModal';
import { AskQuestionModal } from './components/modals/AskQuestionModal';
import { CampusEventModal } from './components/modals/CampusEventModal';
import { CommunityDetailModal } from './components/modals/CommunityDetailModal';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { registerServiceWorker } from './services/notifications';

const MainLayout: React.FC = () => {
  const { currentTab, setCurrentTab, activeModal, viewportMode, setViewportMode, isOnboarded } = useApp();

  React.useEffect(() => {
    // 1. Register service worker for Web Push & PWA
    registerServiceWorker();

    // 2. Listen for deep-link messages from service worker notificationclick
    const handleSwMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NOTIFICATION_ROUTE' && event.data?.routeHint) {
        const hint = event.data.routeHint;
        if (['planner', 'courses', 'profile', 'campus', 'study', 'home'].includes(hint)) {
          setCurrentTab(hint as any);
        }
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSwMessage);
    }
    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSwMessage);
      }
    };
  }, [setCurrentTab]);

  if (!isOnboarded) {
    return <OnboardingFlow />;
  }

  const renderActiveTab = () => {
    switch (currentTab) {
      case 'home':
        return <HomeScreen />;
      case 'planner':
        return <PlannerScreen />;
      case 'courses':
        return <CoursesScreen />;
      case 'study':
        return <StudyScreen />;
      case 'campus':
        return <CampusScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <HomeScreen />;
    }
  };

  const renderActiveModal = () => {
    switch (activeModal) {
      case 'focus-session':
        return <FocusSessionModal />;
      case 'add-task':
        return <AddTaskModal />;
      case 'add-event':
        return <AddEventModal />;
      case 'assignment-detail':
        return <AssignmentDetailModal />;
      case 'exam-conflict':
        return <ExamConflictModal />;
      case 'course-detail':
        return <CourseDetailModal />;
      case 'material-viewer':
        return <MaterialViewerModal />;
      case 'source-connect':
        return <SourceConnectModal />;
      case 'opportunity-detail':
        return <OpportunityModal />;
      case 'marketplace-detail':
        return <MarketplaceModal />;
      case 'campus-service-detail':
        return <CampusServiceModal />;
      case 'notifications':
        return <NotificationsDrawer />;
      case 'ai-assistant':
        return <AIAssistantModal />;
      case 'create-study-group':
        return <CreateStudyGroupModal />;
      case 'ask-question':
        return <AskQuestionModal />;
      case 'event-detail':
        return <CampusEventModal />;
      case 'community-detail':
        return <CommunityDetailModal />;
      default:
        return null;
    }
  };

  // If the user selected "Mobile Mockup" frame on desktop:
  if (viewportMode === 'mobile-mockup') {
    return (
      <div className="min-h-screen bg-[#000000] text-white font-sans antialiased flex flex-col items-center justify-start pt-20 pb-12 px-4">
        <TopBar />

        <div className="mb-3 mt-2 flex items-center justify-between w-full max-w-[400px] text-xs text-zinc-400">
          <span className="font-semibold text-zinc-300">iPhone 15 Simulator (390px)</span>
          <button
            onClick={() => setViewportMode('responsive')}
            className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
          >
            Exit to Desktop ↗
          </button>
        </div>

        {/* Smartphone Hardware Frame */}
        <div className="relative w-full max-w-[400px] h-[844px] rounded-[48px] bg-[#090A0E] border-[6px] border-[#222430] shadow-2xl overflow-hidden flex flex-col">
          {/* Dynamic Island / Notch */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-5 bg-[#141520] rounded-full z-40 pointer-events-none" />

          {/* Internal App Canvas */}
          <div className="flex-1 overflow-y-auto pt-6 px-4 pb-20 scrollbar-none bg-[#090A0E]">
            {renderActiveTab()}
          </div>

          {/* Mobile Bottom Navigation */}
          <BottomNav />
        </div>

        <InformationFlowBanner />
        {renderActiveModal()}
      </div>
    );
  }

  // Fullscreen Responsive Desktop & Native Mobile View
  return (
    <div className="min-h-screen bg-[#090A0E] text-white font-sans antialiased transition-colors">
      <TopBar />

      <Sidebar />

      <div className="lg:pl-64">
        <div className="mx-auto max-w-7xl">
          <main className={`flex-1 min-w-0 pb-24 md:pb-12 ${currentTab === 'home' ? 'pt-0 px-0' : 'pt-20 px-4 sm:px-6 py-6'}`}>
            {renderActiveTab()}
          </main>
        </div>
      </div>

      <BottomNav />
      <InformationFlowBanner />
      {renderActiveModal()}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
