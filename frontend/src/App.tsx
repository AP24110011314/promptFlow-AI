import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { LoginModal } from './components/LoginModal';
import { DashboardView } from './components/DashboardView';
import { RepositoryView } from './components/RepositoryView';
import { EmailSimulationView } from './components/EmailSimulationView';
import { AnalyticsView } from './components/AnalyticsView';
import { AdminPanelView } from './components/AdminPanelView';
import { ChatView } from './components/ChatView';
import { PaperDetailModal } from './components/PaperDetailModal';
import { authService, paperService, categoryService, emailService, analyticsService } from './services/api';
import type { User, ResearchPaper, Category, EmailLog, DashboardAnalytics } from './types';
import { ShieldAlert } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [showLoginModal, setShowLoginModal] = useState<boolean>(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data state
  const [papers, setPapers] = useState<ResearchPaper[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [selectedPaper, setSelectedPaper] = useState<ResearchPaper | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('crd_theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'light') {
        document.documentElement.classList.add('light-theme');
      } else {
        document.documentElement.classList.remove('light-theme');
      }
    }
    initAuthAndData();
  }, []);

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('crd_theme', nextTheme);
    if (nextTheme === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
  };

  const initAuthAndData = async () => {
    const token = localStorage.getItem('crd_token');
    if (token) {
      try {
        const u = await authService.getMe();
        setUser(u);
        setShowLoginModal(false);
      } catch (err) {
        localStorage.removeItem('crd_token');
        setShowLoginModal(true);
      }
    } else {
      setShowLoginModal(true);
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
      console.error("Error loading CRD data:", err);
    }
  };

  const handleLoginSuccess = (u: User, _token: string) => {
    setUser(u);
    setShowLoginModal(false);
    fetchAllData();
  };

  const handleLogout = () => {
    localStorage.removeItem('crd_token');
    setUser(null);
    setShowLoginModal(true);
  };

  const handleSwitchRole = async () => {
    const targetEmail = user?.role === 'admin' ? 'faculty@college.edu' : 'admin@college.edu';
    const targetPass = user?.role === 'admin' ? 'faculty123' : 'admin123';
    try {
      const res = await authService.login(targetEmail, targetPass);
      localStorage.setItem('crd_token', res.access_token);
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

  return (
    <div className="min-h-screen flex bg-brand-bg text-white selection:bg-brand-cyan selection:text-white font-sans">
      
      {/* Persistent Left Sidebar Navigation */}
      <Sidebar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        onSwitchRole={handleSwitchRole}
        onUserUpdate={(u) => setUser(u)}
      />

      {/* Main App Container (Center + Right Columns) */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Top Header with Search & User Badge */}
        <TopHeader
          user={user}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onSwitchRole={handleSwitchRole}
          onSearch={(q) => setSearchQuery(q)}
          onLogout={handleLogout}
          onUserUpdate={(u) => setUser(u)}
        />

        {/* Scrollable Content Area */}
        <main className={`flex-1 ${activeTab === 'chat' ? 'overflow-hidden flex flex-col' : 'overflow-y-auto'}`}>
          
          {/* Dashboard View (3-column layout inside!) */}
          {activeTab === 'dashboard' && (
            <DashboardView
              analytics={analytics}
              recentPapers={filteredPapers}
              onSelectPaper={(p) => setSelectedPaper(p)}
              onNavigateToRepo={() => setActiveTab('repository')}
              user={user}
              onRefresh={fetchAllData}
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
        />
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal onLoginSuccess={handleLoginSuccess} />
      )}

    </div>
  );
}
