import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LoginModal } from './components/LoginModal';
import { DashboardView } from './components/DashboardView';
import { RepositoryView } from './components/RepositoryView';
import { EmailSimulationView } from './components/EmailSimulationView';
import { AnalyticsView } from './components/AnalyticsView';
import { AdminPanelView } from './components/AdminPanelView';
import { authService, paperService, categoryService, emailService, analyticsService } from './services/api';
import type { User, ResearchPaper, Category, EmailLog, DashboardAnalytics } from './types';
import { Zap, ShieldAlert } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [showLoginModal, setShowLoginModal] = useState<boolean>(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Data state
  const [papers, setPapers] = useState<ResearchPaper[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [selectedPaper, setSelectedPaper] = useState<ResearchPaper | null>(null);

  useEffect(() => {
    // Load theme setting
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
    // Quick toggle between Admin and Faculty accounts for testing RBAC
    const targetEmail = user?.role === 'admin' ? 'faculty@college.edu' : 'admin@college.edu';
    const targetPass = user?.role === 'admin' ? 'faculty123' : 'admin123';
    try {
      const res = await authService.login(targetEmail, targetPass);
      localStorage.setItem('crd_token', res.access_token);
      setUser(res.user);
      if (res.user.role !== 'admin' && activeTab === 'admin') {
        setActiveTab('dashboard');
      }
      fetchAllData();
    } catch (err) {
      alert("Could not switch role. Please sign in via modal.");
      setShowLoginModal(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg text-white selection:bg-brand-cyan selection:text-brand-bg">
      
      {/* Navigation */}
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        onSwitchRole={handleSwitchRole}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* Quick System Status Bar */}
        <div className="mb-6 py-2.5 px-4 rounded-xl bg-brand-card border border-brand-border flex flex-wrap items-center justify-between gap-2 text-xs text-brand-gray">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-brand-green animate-ping inline-block" />
            <span className="font-semibold text-white">Live ML Ingestion Pipeline Active</span>
            <span>•</span>
            <span>FastAPI Backend Connected</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-brand-cyan font-semibold flex items-center">
              <Zap className="w-3.5 h-3.5 mr-1 fill-brand-cyan" /> Scikit-Learn TF-IDF + Naive Bayes / Random Forest
            </span>
          </div>
        </div>

        {/* Dynamic Views */}
        {activeTab === 'dashboard' && (
          <DashboardView
            analytics={analytics}
            recentPapers={papers}
            onSelectPaper={(p) => setSelectedPaper(p)}
            onNavigateToRepo={() => setActiveTab('repository')}
          />
        )}

        {activeTab === 'repository' && (
          <RepositoryView
            papers={papers}
            categories={categories}
            user={user}
            onRefresh={fetchAllData}
            onSelectPaper={(p) => setSelectedPaper(p)}
            selectedPaper={selectedPaper}
            onCloseModal={() => setSelectedPaper(null)}
          />
        )}

        {activeTab === 'simulation' && (
          <EmailSimulationView
            logs={logs}
            onRefreshLogs={async () => {
              const l = await emailService.getLogs(20);
              setLogs(l);
            }}
            onPaperIngested={fetchAllData}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView analytics={analytics} />
        )}

        {activeTab === 'admin' && user?.role === 'admin' && (
          <AdminPanelView
            categories={categories}
            onRefreshCategories={fetchAllData}
          />
        )}

        {activeTab === 'admin' && user?.role !== 'admin' && (
          <div className="bg-brand-card rounded-2xl p-12 text-center border border-brand-red/30 max-w-lg mx-auto my-12">
            <div className="w-12 h-12 rounded-xl bg-brand-red/10 text-brand-red flex items-center justify-center mx-auto mb-3">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-white">Access Denied (RBAC Protected)</h3>
            <p className="text-xs text-brand-gray mt-2 leading-relaxed">
              You are currently signed in as a Faculty member without administrative privileges. Click the "Switch Role" button in the top navbar to switch to the Admin account.
            </p>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-brand-border bg-brand-card/50 py-6 mt-12 text-center text-xs text-brand-gray">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <strong className="text-white font-semibold">CRD System</strong> — Automated Research Publication Tracking and Management System
          </div>
          <div className="flex items-center space-x-4">
            <span>FastAPI + Scikit-Learn</span>
            <span>•</span>
            <span>Vite + React 19 + Tailwind v4</span>
            <span>•</span>
            <span>PyMuPDF + Extractive NLP</span>
          </div>
        </div>
      </footer>

      {/* Login / Role Selection Modal */}
      {showLoginModal && (
        <LoginModal onLoginSuccess={handleLoginSuccess} />
      )}

    </div>
  );
}
