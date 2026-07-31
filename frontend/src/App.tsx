import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LoginPage } from './components/LoginPage';
import { motion, AnimatePresence } from 'framer-motion';
import { LandingPageView } from './components/LandingPageView';
import { DashboardView } from './components/DashboardView';
import { RepositoryView } from './components/RepositoryView';
import { EmailSimulationView } from './components/EmailSimulationView';
import { AnalyticsView } from './components/AnalyticsView';
import { AdminPanelView } from './components/AdminPanelView';
import { ChatView } from './components/ChatView';
import { PaperDetailModal } from './components/PaperDetailModal';
import { AuthorProfileDrawer } from './components/AuthorProfileDrawer';
import { authService, paperService, categoryService, emailService, analyticsService } from './services/api';
import type { User, ResearchPaper, Category, EmailLog, DashboardAnalytics } from './types';
import { ShieldAlert } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentRoute, setCurrentRoute] = useState<string>(window.location.pathname);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data state
  const [papers, setPapers] = useState<ResearchPaper[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [selectedPaper, setSelectedPaper] = useState<ResearchPaper | null>(null);
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);

  useEffect(() => {
    // Handle deep link refresh on /login route
    if (window.location.pathname === '/login') {
      setCurrentRoute('/login');
      window.history.replaceState({ page: 'login' }, '', '/login');
    } else {
      setCurrentRoute('/');
      window.history.replaceState({ page: 'landing' }, '', '/');
    }

    initAuthAndData();
  }, []);

  const initAuthAndData = async () => {
    const token = localStorage.getItem('promptflow_token');
    if (token) {
      try {
        const u = await authService.getMe();
        setUser(u);
        if (window.location.pathname === '/login') {
          window.history.replaceState({ page: 'landing' }, '', '/');
          setCurrentRoute('/');
        }
      } catch (err) {
        localStorage.removeItem('promptflow_token');
      }
    }
    fetchAllData();
  };

  const fetchAllData = async () => {
    try {
      const [pData, cData, lData, aData] = await Promise.all([
        paperService.list(),
        categoryService.list(),
        emailService.getLogs(20),
        analyticsService.getDashboardData(),
      ]);
      setPapers(pData);
      setCategories(cData);
      setLogs(lData);
      setAnalytics(aData);
    } catch (err) {
      console.error("Error loading promptFlow-AI data:", err);
    }
  };

  const handleLoginSuccess = (u: User, _token: string) => {
    window.history.replaceState({ page: 'landing' }, '', '/');
    setUser(u);
    setActiveTab('dashboard');
    setCurrentRoute('/');
    fetchAllData();
  };

  const handleLogout = () => {
    localStorage.removeItem('promptflow_token');
    window.history.replaceState({ page: 'landing' }, '', '/');
    setUser(null);
    setActiveTab('landing');
    setCurrentRoute('/');
  };

  // Filter papers if searchQuery is entered
  const filteredPapers = searchQuery.trim()
    ? papers.filter((p) =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.authors_raw && p.authors_raw.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.department && p.department.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : papers;

  if (!user) {
    return (
      <AnimatePresence mode="wait">
        {currentRoute === '/login' ? (
          <motion.div
            key="login-page"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="w-full min-h-screen"
          >
            <LoginPage
              onLoginSuccess={handleLoginSuccess}
              onBackToLanding={() => {
                window.history.pushState({ page: 'landing' }, '', '/');
                setCurrentRoute('/');
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="landing-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="w-full min-h-screen"
          >
            <LandingPageView 
              papers={papers}
              analytics={analytics}
              onSignInClick={() => {
                window.history.pushState({ page: 'login' }, '', '/login');
                setCurrentRoute('/login');
              }} 
              onGoToConsoleClick={() => {
                window.history.pushState({ page: 'login' }, '', '/login');
                setCurrentRoute('/login');
              }} 
              isLoggedIn={false} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-slate-200 selection:text-slate-900 font-sans overflow-hidden">
      
      {/* Sleek Top Navigation Header */}
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSearch={(q) => setSearchQuery(q)}
        onLogout={handleLogout}
        onUserUpdate={(u) => setUser(u)}
        onSelectPaperId={(id) => {
          const p = papers.find((paper) => paper.id === id);
          if (p) setSelectedPaper(p);
        }}
      />


      {/* Main Content Area */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Scrollable Content Area */}
        <main className={`flex-1 min-h-0 ${activeTab === 'chat' ? 'overflow-hidden flex flex-col' : 'overflow-y-auto'}`}>
          
          {/* Dashboard View (3-column layout inside!) */}
          {activeTab === 'dashboard' && (
            <DashboardView
              analytics={analytics}
              recentPapers={filteredPapers}
              onSelectPaper={(p) => setSelectedPaper(p)}
              onNavigateToRepo={() => setActiveTab('repository')}
              user={user}
              onRefresh={fetchAllData}
              onSelectAuthor={(author) => setSelectedAuthor(author)}
            />
          )}

          {/* Repository View */}
          {activeTab === 'repository' && (
            <div className="p-6 sm:p-8 max-w-7xl mx-auto">
              <RepositoryView
                papers={filteredPapers}
                categories={categories}
                user={user}
                onRefresh={fetchAllData}
                onSelectPaper={(p) => setSelectedPaper(p)}
                selectedPaper={selectedPaper}
                onCloseModal={() => setSelectedPaper(null)}
                onSelectAuthor={(author) => setSelectedAuthor(author)}
              />
            </div>
          )}


          {/* AI Assistant Chat View */}
          {activeTab === 'chat' && (
            <ChatView
              user={user}
              onSelectPaper={(p) => setSelectedPaper(p)}
            />
          )}

          {/* Email Simulation View (Admin Only) */}
          {activeTab === 'simulation' && user?.role === 'admin' && (
            <div className="p-6 sm:p-8 max-w-7xl mx-auto">
              <EmailSimulationView
                logs={logs}
                onRefreshLogs={async () => {
                  const l = await emailService.getLogs(20);
                  setLogs(l);
                }}
                onPaperIngested={fetchAllData}
              />
            </div>
          )}

          {/* Analytics View */}
          {activeTab === 'analytics' && (
            <div className="p-6 sm:p-8 max-w-7xl mx-auto">
              <AnalyticsView
                analytics={analytics}
                onSelectAuthor={(author) => setSelectedAuthor(author)}
              />
            </div>
          )}

          {/* Admin Panel View */}
          {activeTab === 'admin' && user?.role === 'admin' && (
            <div className="p-6 sm:p-8 max-w-7xl mx-auto">
              <AdminPanelView
                categories={categories}
                onRefreshCategories={fetchAllData}
              />
            </div>
          )}

          {activeTab === 'admin' && user?.role !== 'admin' && (
            <div className="p-6 sm:p-8 max-w-xl mx-auto my-12">
              <div className="bg-white rounded-2xl p-8 text-center border border-red-200 shadow-xs">
                <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-100">
                  <ShieldAlert className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Access Denied (RBAC Protected)</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  You are currently signed in as a Faculty member without administrative privileges. To access administrative settings, please log in with an Administrator account.
                </p>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Global Paper Detail Modal */}
      {selectedPaper && activeTab !== 'repository' && (
        <PaperDetailModal
          paper={selectedPaper}
          user={user}
          onClose={() => setSelectedPaper(null)}
          onDeleteSuccess={fetchAllData}
          onSelectAuthor={(author) => setSelectedAuthor(author)}
        />
      )}

      {/* Faculty Author Profile Drawer */}
      {selectedAuthor && (
        <AuthorProfileDrawer
          authorName={selectedAuthor}
          allPapers={papers}
          onClose={() => setSelectedAuthor(null)}
          onSelectPaper={(p) => setSelectedPaper(p)}
          onSelectAuthor={(author) => setSelectedAuthor(author)}
        />
      )}

    </div>
  );
}
