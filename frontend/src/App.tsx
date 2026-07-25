import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LoginModal } from './components/LoginModal';
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
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  // Sidebar collapsed state removed for horizontal navigation layout
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data state
  const [papers, setPapers] = useState<ResearchPaper[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [selectedPaper, setSelectedPaper] = useState<ResearchPaper | null>(null);
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);


  useEffect(() => {
    const savedTheme = localStorage.getItem('promptflow_theme') as 'dark' | 'light' | null;
    const initialTheme = savedTheme || 'light';
    setTheme(initialTheme);
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }

    // Handle deep link refresh on /login route
    if (window.location.pathname === '/login') {
      setShowLoginModal(true);
      window.history.replaceState({ page: 'login' }, '', '/login');
    } else {
      window.history.replaceState({ page: 'landing' }, '', window.location.pathname + window.location.search);
    }

    initAuthAndData();
  }, []);

  // Handle browser back/forward buttons (popstate events)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      if (state && state.page === 'login') {
        setShowLoginModal(true);
      } else {
        setShowLoginModal(false);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Clear URL hash fragment when navigating away from the landing page
  useEffect(() => {
    if (user || showLoginModal) {
      if (window.location.hash) {
        window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
      }
    }
  }, [user, showLoginModal]);

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('promptflow_theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }
  };

  const initAuthAndData = async () => {
    const token = localStorage.getItem('promptflow_token');
    if (token) {
      try {
        const u = await authService.getMe();
        setUser(u);
        setShowLoginModal(false);
      } catch (err) {
        localStorage.removeItem('promptflow_token');
        setShowLoginModal(false);
      }
    } else {
      setShowLoginModal(false);
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
    setShowLoginModal(false);
    fetchAllData();
  };

  const handleLogout = () => {
    localStorage.removeItem('promptflow_token');
    window.history.replaceState({ page: 'landing' }, '', '/');
    setUser(null);
    setActiveTab('landing');
    setShowLoginModal(false);
  };

  const handleSwitchRole = async () => {
    const targetEmail = user?.role === 'admin' ? 'faculty@college.edu' : 'admin@college.edu';
    const targetPass = user?.role === 'admin' ? 'faculty123' : 'admin123';
    try {
      const res = await authService.login(targetEmail, targetPass);
      localStorage.setItem('promptflow_token', res.access_token);
      setUser(res.user);
      if (res.user.role !== 'admin' && (activeTab === 'admin' || activeTab === 'simulation')) {
        setActiveTab('dashboard');
      }
      fetchAllData();
    } catch (err) {
      alert("Could not switch role. Please sign in via modal.");
      setShowLoginModal(true);
    }
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
      <div className="relative min-h-screen bg-brand-bg">
        <LandingPageView 
          papers={papers}
          analytics={analytics}
          onSignInClick={() => {
            window.history.pushState({ page: 'login' }, '', '/login');
            setShowLoginModal(true);
          }} 
          onGoToConsoleClick={() => {
            window.history.pushState({ page: 'login' }, '', '/login');
            setShowLoginModal(true);
          }} 
          isLoggedIn={false} 
        />
        {showLoginModal && (
          <LoginModal 
            onLoginSuccess={handleLoginSuccess}
            onClose={() => {
              window.history.replaceState({ page: 'landing' }, '', '/');
              setShowLoginModal(false);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-brand-bg text-white selection:bg-brand-cyan selection:text-white font-sans overflow-hidden">
      
      {/* Sleek Top Navigation Header */}
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onSwitchRole={handleSwitchRole}
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
              <AnalyticsView analytics={analytics} />
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
              <div className="bg-brand-card rounded-2xl p-8 text-center border border-brand-red/30 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-brand-red/10 text-brand-red flex items-center justify-center mx-auto mb-4">
                  <ShieldAlert className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="text-lg font-bold text-white">Access Denied (RBAC Protected)</h3>
                <p className="text-xs text-brand-gray mt-2 leading-relaxed">
                  You are currently signed in as a Faculty member without administrative privileges. Use the "Switch Role" button in the top header to switch to the Admin account.
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
