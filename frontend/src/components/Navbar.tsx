import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, Layers, BookOpen, MessageSquare, BarChart3, Mail, ShieldAlert,
  Search, Bell, HelpCircle, User as UserIcon, 
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

  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Edit Profile Form State
  const [editName, setEditName] = useState(user?.full_name || '');
  const [editDept, setEditDept] = useState(user?.department || 'Computer Science');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Collapse profile dropdown when clicking anywhere outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

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
      <nav className="h-16 border-b border-slate-200 bg-white sticky top-0 z-40 select-none shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-4">
          
          {/* Left: Logo */}
          <div className="flex items-center space-x-2 shrink-0">
            <div 
              className="flex items-center space-x-2.5 cursor-pointer"
              onClick={() => { setActiveTab('dashboard'); setShowMobileMenu(false); }}
            >
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-base shrink-0 shadow-2xs">
                <Zap className="w-4.5 h-4.5 fill-white text-white" />
              </div>
              <span className="text-sm sm:text-base font-bold text-slate-900 tracking-tight font-display">
                promptFlow-AI
              </span>
            </div>
          </div>

          {/* Center: Vercel-style Flat Navigation Tabs */}
          <div className="hidden md:flex items-center h-full space-x-1.5">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative h-full px-4 flex items-center text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'text-slate-900 font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-slate-900'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right: Search & Actions */}
          <div className="flex items-center space-x-3 shrink-0">
            {/* Minimal Search bar with Ctrl+K shortcut */}
            <div className="hidden lg:block relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="navbar-search"
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder={searchPlaceholder}
                className="w-52 pl-9 pr-12 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 transition-all duration-200"
              />
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-mono text-slate-500 pointer-events-none select-none">
                ⌘K
              </kbd>
            </div>



            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => { setShowNotifications(!showNotifications); fetchUnreadCount(); }}
                title="Notifications"
                className="hidden sm:flex p-2 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all cursor-pointer relative"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 text-[10px] font-bold text-teal-700">{unreadCount}</span>
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
              title="Documentation & Help"
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-slate-500 hover:text-teal-700 transition-colors" />
            </button>

            {/* User Profile Avatar with Dropdown */}
            {user ? (
              <div ref={profileDropdownRef} className="relative">
                <div
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-2 p-1 rounded-xl hover:bg-slate-100 transition-all cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-2xs group-hover:brightness-105 transition-all">
                    {user.full_name.charAt(0)}
                  </div>
                  <span className="hidden xl:inline text-xs font-semibold text-slate-800 group-hover:text-slate-900 truncate max-w-[120px]">
                    {user.full_name.split(' ')[0]}
                  </span>
                </div>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <div className="absolute right-0 mt-3 w-72 sm:w-80 rounded-xl bg-white border border-slate-200 shadow-xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-3.5">
                    <div className="flex items-center space-x-3.5 pb-3 border-b border-slate-200">
                      <div className="w-11 h-11 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-2xs shrink-0">
                        {user.full_name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900 truncate leading-snug">{user.full_name}</p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-md bg-teal-50 text-teal-700 text-xs font-bold uppercase tracking-wider border border-teal-200">
                        {user.role}
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 truncate">
                        {user.department || 'General'}
                      </span>
                    </div>

                    <div className="space-y-1 pt-1 border-t border-slate-200">
                      <button
                        onClick={handleOpenEdit}
                        className="w-full px-3 py-2.5 rounded-lg text-left text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 flex items-center space-x-2.5 transition-colors cursor-pointer"
                      >
                        <UserCheck className="w-4 h-4 text-teal-700 shrink-0" />
                        <span>Edit Profile</span>
                      </button>
                    </div>

                    <div className="border-t border-slate-200 pt-2">
                      <button
                        onClick={() => { setShowDropdown(false); onLogout(); }}
                        className="w-full px-3 py-2.5 rounded-lg text-left text-sm font-semibold text-red-600 hover:bg-red-50 flex items-center space-x-2.5 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-red-600 shrink-0" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 pl-2 border-l border-slate-200">
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-500">Guest</span>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all cursor-pointer flex items-center justify-center"
              title="Toggle Menu"
            >
              {showMobileMenu ? <X className="w-4 h-4 text-teal-700" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>

        </div>
      </nav>

      {/* Mobile Drawer Menu overlay */}
      {showMobileMenu && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 py-3.5 space-y-3 z-30 relative animate-in fade-in slide-in-from-top-1 duration-150 shadow-md">
          {/* Mobile Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder={searchPlaceholder}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400"
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
                      ? 'bg-slate-100 text-slate-900 font-bold'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-700' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-6 sm:p-8 relative shadow-2xl space-y-4">
            
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute right-6 top-6 p-2 rounded-lg bg-slate-50 text-slate-500 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3.5 mb-5">
              <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center font-bold">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Profile Settings</h3>
                <p className="text-xs sm:text-sm text-slate-500">Update your academic department and credentials</p>
              </div>
            </div>

            {editError && (
              <div className="mb-4 bg-amber-50 text-amber-800 border border-amber-200 p-3.5 rounded-lg text-xs font-semibold">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address (Read Only)</label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-sm cursor-not-allowed font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 transition-all font-medium placeholder:text-slate-400"
                  placeholder="Dr. Jane Doe"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Academic Department</label>
                <select
                  value={editDept}
                  onChange={(e) => setEditDept(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 transition-all cursor-pointer font-medium"
                >
                  <option value="Computer Science" className="bg-white text-slate-900">Computer Science</option>
                  <option value="Physics" className="bg-white text-slate-900">Physics</option>
                  <option value="Chemistry" className="bg-white text-slate-900">Chemistry</option>
                  <option value="Biotechnology" className="bg-white text-slate-900">Biotechnology</option>
                  <option value="Mechanical Engineering" className="bg-white text-slate-900">Mechanical Engineering</option>
                  <option value="Electrical Engineering" className="bg-white text-slate-900">Electrical Engineering</option>
                  <option value="Mathematics" className="bg-white text-slate-900">Mathematics</option>
                  <option value="Economics & Finance" className="bg-white text-slate-900">Economics &amp; Finance</option>
                  <option value="General" className="bg-white text-slate-900">General / Administration</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="watt-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="watt-btn-primary"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
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

