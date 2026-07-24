import React, { useState, useEffect } from 'react';
import { 
  Zap, Layers, BookOpen, MessageSquare, BarChart3, Mail, ShieldAlert,
  Search, Bell, HelpCircle, Sun, Moon, RefreshCw, User as UserIcon, 
  LogOut, UserCheck, X, Check, Menu
} from 'lucide-react';
import type { User } from '../types';
import { authService, notificationService } from '../services/api';
import { HelpModal } from './HelpModal';
import { NotificationDrawer } from './NotificationDrawer';

interface NavbarProps {
  user: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onSwitchRole: () => void;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  onLogout: () => void;
  onUserUpdate?: (updatedUser: User) => void;
  onSelectPaperId?: (paperId: number) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  theme,
  onToggleTheme,
  onSwitchRole,
  onSearch,
  searchPlaceholder = 'Search papers...',
  onLogout,
  onUserUpdate,
  onSelectPaperId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Edit Profile Form State
  const [editName, setEditName] = useState(user?.full_name || '');
  const [editDept, setEditDept] = useState(user?.department || 'Computer Science');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Fetch unread notifications count
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      // Ignore background errors
    }
  };



  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Layers },
    { id: 'repository', label: 'Repository', icon: BookOpen },
    { id: 'chat', label: 'AI Assistant', icon: MessageSquare },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  if (user?.role === 'admin') {
    navItems.push({ id: 'simulation', label: 'Simulation', icon: Mail });
    navItems.push({ id: 'admin', label: 'Admin Panel', icon: ShieldAlert });
  }

  // Keyboard shortcut listener for search focus (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('navbar-search') as HTMLInputElement;
        searchInput?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (onSearch) {
      onSearch(e.target.value);
    }
  };

  const handleOpenEdit = () => {
    if (user) {
      setEditName(user.full_name);
      setEditDept(user.department || 'Computer Science');
    }
    setShowDropdown(false);
    setShowMobileMenu(false);
    setShowEditModal(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setEditError(null);
    try {
      const updated = await authService.updateMe({ full_name: editName, department: editDept });
      if (onUserUpdate) onUserUpdate(updated);
      setShowEditModal(false);
    } catch (err: any) {
      setEditError(err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <nav className="h-14 border-b border-brand-border bg-brand-card sticky top-0 z-40 select-none shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-4">
          
          {/* Left: Logo */}
          <div className="flex items-center space-x-2 shrink-0">
            <div 
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => { setActiveTab('dashboard'); setShowMobileMenu(false); }}
            >
              <div className="w-7 h-7 rounded-lg bg-brand-cyan text-real-white flex items-center justify-center font-bold text-sm shrink-0">
                <Zap className="w-4 h-4 fill-real-white text-real-white" />
              </div>
              <span className="text-xs font-bold text-white tracking-tight font-display">
                promptFlow-AI
              </span>
            </div>
          </div>

          {/* Center: Vercel-style Flat Navigation Tabs */}
          <div className="hidden md:flex items-center h-full space-x-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative h-full px-3.5 flex items-center text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'text-brand-cyan font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-brand-cyan'
                      : 'text-brand-gray hover:text-white'
                  }`}
                >
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right: Search & Actions */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Minimal Search bar with Ctrl+K shortcut */}
            <div className="hidden lg:block relative">
              <Search className="w-3.5 h-3.5 text-brand-gray absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="navbar-search"
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder={searchPlaceholder}
                className="w-48 pl-8 pr-12 py-1.5 rounded-xl bg-brand-bg border border-brand-border text-xs text-white placeholder-brand-gray focus:outline-none focus:border-brand-cyan transition-all duration-200"
              />
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-brand-card border border-brand-border text-[9px] font-mono text-brand-gray pointer-events-none select-none">
                ⌘K
              </kbd>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              className="p-2 rounded-xl hover:bg-brand-hover text-brand-gray hover:text-white transition-all cursor-pointer flex items-center justify-center"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-brand-cyan" />
              ) : (
                <Moon className="w-4 h-4 text-brand-cyan" />
              )}
            </button>

            {/* Switch Role Button */}
            {user && (
              <button
                onClick={onSwitchRole}
                title={`Switch Role (Current: ${user.role})`}
                className="hidden sm:flex p-2 rounded-xl hover:bg-brand-hover text-brand-gray hover:text-white transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-brand-cyan" />
              </button>
            )}

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => { setShowNotifications(!showNotifications); fetchUnreadCount(); }}
                title="Notifications"
                className="hidden sm:flex p-2 rounded-xl hover:bg-brand-hover text-brand-gray hover:text-white transition-all cursor-pointer relative"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand-cyan animate-pulse" />
                )}
              </button>

              <NotificationDrawer
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                onSelectPaperId={onSelectPaperId}
              />
            </div>

            {/* Help Icon */}
            <button 
              onClick={() => setShowHelpModal(true)}
              title="Help & Platform Documentation" 
              className="hidden sm:flex p-2 rounded-xl hover:bg-brand-hover text-brand-gray hover:text-white transition-all cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-brand-gray hover:text-brand-cyan transition-colors" />
            </button>


            {/* User Dropdown */}
            {user ? (
              <div className="relative">
                <div
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center pl-2 border-l border-brand-border cursor-pointer group select-none"
                >
                  <div className="w-7 h-7 rounded-full bg-brand-cyan text-real-white flex items-center justify-center font-bold text-xs shadow-xs group-hover:brightness-105 transition-all">
                    {user.full_name.charAt(0)}
                  </div>
                </div>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <div className="absolute right-0 mt-3 w-60 rounded-2xl bg-brand-card border border-brand-border shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2.5 border-b border-brand-border">
                      <p className="text-xs font-bold text-white truncate">{user.full_name}</p>
                      <p className="text-[10px] text-brand-gray truncate mt-0.5">{user.email}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <span className="px-1.5 py-0.5 rounded bg-brand-cyan/10 text-brand-cyan text-[8px] font-bold uppercase tracking-wider">
                          {user.role}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-brand-bg text-brand-gray border border-brand-border text-[8px] font-medium truncate max-w-[120px]">
                          {user.department || 'General'}
                        </span>
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={handleOpenEdit}
                        className="w-full px-4 py-2 text-left text-xs font-semibold text-brand-gray hover:text-white hover:bg-brand-hover flex items-center space-x-2 transition-colors cursor-pointer"
                      >
                        <UserCheck className="w-4 h-4 text-brand-cyan shrink-0" />
                        <span>Profile Settings</span>
                      </button>
                      <button
                        onClick={() => { setShowDropdown(false); onSwitchRole(); }}
                        className="w-full px-4 py-2 text-left text-xs font-semibold text-brand-gray hover:text-white hover:bg-brand-hover flex items-center space-x-2 transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-4 h-4 text-brand-green shrink-0" />
                        <span>Switch to {user.role === 'admin' ? 'Faculty' : 'Admin'}</span>
                      </button>
                    </div>

                    <div className="border-t border-brand-border pt-1.5 mt-1">
                      <button
                        onClick={() => { setShowDropdown(false); onLogout(); }}
                        className="w-full px-4 py-2 text-left text-xs font-semibold text-brand-red hover:bg-brand-red/5 flex items-center space-x-2 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 shrink-0" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 pl-2 border-l border-brand-border">
                <UserIcon className="w-3.5 h-3.5 text-brand-gray" />
                <span className="text-xs text-brand-gray">Guest</span>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 rounded-xl hover:bg-brand-hover text-brand-gray hover:text-white transition-all cursor-pointer flex items-center justify-center"
              title="Toggle Menu"
            >
              {showMobileMenu ? <X className="w-4 h-4 text-brand-cyan" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>

        </div>
      </nav>

      {/* Mobile Drawer Menu overlay */}
      {showMobileMenu && (
        <div className="md:hidden border-b border-brand-border bg-brand-card px-4 py-3.5 space-y-3 z-30 relative animate-in fade-in slide-in-from-top-1 duration-150 shadow-md">
          {/* Mobile Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-brand-gray absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder={searchPlaceholder}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-brand-bg border border-brand-border text-xs text-white placeholder-brand-gray focus:outline-none focus:border-brand-cyan"
            />
          </div>

          {/* Mobile Tabs */}
          <div className="grid grid-cols-2 gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setShowMobileMenu(false); }}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-brand-cyan/10 text-brand-cyan font-bold'
                      : 'text-brand-gray hover:bg-brand-hover hover:text-white'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-brand-cyan' : 'text-brand-gray'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Mobile Settings */}
          <div className="pt-3 border-t border-brand-border space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-brand-gray font-semibold">Theme</span>
              <button
                onClick={onToggleTheme}
                className="px-3 py-1.5 rounded-xl bg-brand-bg border border-brand-border flex items-center space-x-1.5 font-semibold text-white"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-brand-cyan" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-brand-cyan" />
                    <span>Dark Mode</span>
                  </>
                )}
              </button>
            </div>

            {user && (
              <div className="flex items-center justify-between">
                <span className="text-brand-gray font-semibold">Active: {user.role}</span>
                <button
                  onClick={() => { setShowMobileMenu(false); onSwitchRole(); }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-brand-bg border border-brand-border text-brand-gray font-semibold"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-brand-cyan" />
                  <span>Switch Role</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-brand-card border border-brand-border rounded-2xl p-6 sm:p-8 relative shadow-xl">
            
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute right-6 top-6 p-1.5 rounded-xl bg-brand-bg text-brand-gray hover:text-white border border-brand-border transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-brand-cyan/10 text-brand-cyan flex items-center justify-center font-bold">
                <UserCheck className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Profile Settings</h3>
                <p className="text-xs text-brand-gray">Update your academic department and credentials</p>
              </div>
            </div>

            {editError && (
              <div className="mb-4 bg-brand-red/10 text-brand-red border border-brand-red/25 p-3 rounded-xl text-xs font-semibold">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-gray mb-1.5">Email Address (Read Only)</label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full px-3 py-2 rounded-xl bg-brand-bg/50 border border-brand-border text-brand-gray text-xs cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-gray mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-brand-bg border border-brand-border text-white text-xs sm:text-sm focus:outline-none focus:border-brand-cyan transition-all"
                  placeholder="Dr. Jane Doe"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-gray mb-1.5">Academic Department</label>
                <select
                  value={editDept}
                  onChange={(e) => setEditDept(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-brand-bg border border-brand-border text-white text-xs sm:text-sm focus:outline-none focus:border-brand-cyan transition-all cursor-pointer"
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Biotechnology">Biotechnology</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Economics & Finance">Economics &amp; Finance</option>
                  <option value="General">General / Administration</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl bg-brand-bg hover:bg-brand-hover text-brand-gray hover:text-white border border-brand-border text-xs font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-brand-cyan hover:brightness-105 text-real-white font-bold text-xs shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Help & Documentation Modal */}
      {showHelpModal && (
        <HelpModal
          onClose={() => setShowHelpModal(false)}
          userRole={user?.role}
          onNavigateTab={setActiveTab}
        />
      )}
    </>
  );
};


