import React, { useState, useEffect } from 'react';
import { Search, Bell, HelpCircle, Sun, Moon, RefreshCw, User as UserIcon, LogOut, UserCheck, X, Check, PanelLeft, PanelLeftClose } from 'lucide-react';
import type { User } from '../types';
import { authService, notificationService } from '../services/api';
import { HelpModal } from './HelpModal';
import { NotificationDrawer } from './NotificationDrawer';

interface TopHeaderProps {
  user: User | null;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onSwitchRole: () => void;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  onLogout?: () => void;
  onUserUpdate?: (updatedUser: User) => void;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onSelectPaperId?: (paperId: number) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  user,
  theme,
  onToggleTheme,
  onSwitchRole,
  onSearch,
  searchPlaceholder = 'Search research papers, authors, departments...',
  onLogout,
  onUserUpdate,
  sidebarCollapsed,
  onToggleSidebar,
  onSelectPaperId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    fetchUnreadCount();
  }, []);

      const notifs = await notificationService.list(true, 100);
      setUnreadCount(notifs.length);
      // Ignore background error
    }
  };


  // Edit Profile Form State
  const [editName, setEditName] = useState(user?.full_name || '');
  const [editDept, setEditDept] = useState(user?.department || 'Computer Science');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

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
    <header className="h-16 border-b border-brand-border bg-brand-bg px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
      
      {/* Sidebar Collapse Toggle Button */}
      <button
        onClick={onToggleSidebar}
        title={sidebarCollapsed ? "Expand Navigation Sidebar" : "Collapse Navigation Sidebar"}
        className="p-2.5 rounded-xl bg-brand-card hover:bg-brand-hover border border-brand-border text-brand-gray hover:text-white transition-colors cursor-pointer flex items-center justify-center shrink-0"
      >
        {sidebarCollapsed ? (
          <PanelLeft className="w-4 h-4 text-brand-cyan" />
        ) : (
          <PanelLeftClose className="w-4 h-4 text-brand-cyan" />
        )}
      </button>

      {/* Search Input Bar */}
      <div className="flex-1 max-w-xl relative">
        <Search className="w-4 h-4 text-brand-gray absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder={searchPlaceholder}
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-brand-card border border-brand-border text-xs sm:text-sm text-white placeholder-brand-gray focus:outline-none focus:border-brand-cyan transition-all"
        />
      </div>

      {/* Right Actions & User Profile */}
      <div className="flex items-center space-x-3">
        
        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          className="p-2 rounded-xl bg-brand-card hover:bg-brand-hover border border-brand-border text-brand-gray hover:text-white transition-colors cursor-pointer flex items-center justify-center"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-brand-cyan" />
          ) : (
            <Moon className="w-4 h-4 text-brand-cyan" />
          )}
        </button>

        {/* Quick RBAC Switcher */}
        {user && (
          <button
            onClick={onSwitchRole}
            title="Switch Role (Test Admin vs Faculty)"
            className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-brand-card hover:bg-brand-hover border border-brand-border text-xs font-medium text-brand-gray hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-brand-cyan" />
            <span>Switch Role</span>
          </button>
        )}

        {/* Notifications & Help */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifications(!showNotifications); fetchUnreadCount(); }}
            title="Notifications"
            className="p-2 rounded-xl bg-brand-card hover:bg-brand-hover border border-brand-border text-brand-gray hover:text-white transition-colors cursor-pointer relative"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-cyan animate-pulse" />
            )}
          </button>
          <NotificationDrawer
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
            onSelectPaperId={onSelectPaperId}
          />
        </div>

        <button
          onClick={() => setShowHelpModal(true)}
          title="Help & Platform Documentation"
          className="p-2 rounded-xl bg-brand-card hover:bg-brand-hover border border-brand-border text-brand-gray hover:text-white transition-colors cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 text-brand-gray hover:text-brand-cyan transition-colors" />
        </button>


        {/* User Profile Badge & Dropdown */}
        {user ? (
          <div className="relative">
            <div
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-2.5 pl-3 border-l border-brand-border cursor-pointer group select-none"
            >
              <div className="text-right hidden md:block">
                <p className="text-xs font-bold text-white leading-tight group-hover:text-brand-cyan transition-colors">{user.full_name}</p>
                <p className="text-[10px] text-brand-gray capitalize font-medium">{user.role}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-brand-cyan text-real-white flex items-center justify-center font-bold text-xs shadow-sm group-hover:brightness-110 transition-all">
                {user.full_name.charAt(0)}
              </div>
            </div>

            {/* Profile Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-3 w-64 rounded-2xl bg-brand-card border border-brand-border shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-3 border-b border-brand-border">
                  <p className="text-xs font-bold text-white truncate">{user.full_name}</p>
                  <p className="text-[10px] text-brand-gray truncate mt-0.5">{user.email}</p>
                  <div className="mt-2 flex items-center space-x-1.5">
                    <span className="px-2 py-0.5 rounded bg-brand-cyan/15 text-brand-cyan text-[9px] font-bold uppercase tracking-wider">
                      {user.role}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-brand-bg text-brand-gray border border-brand-border text-[9px] font-medium truncate">
                      {user.department || 'General'}
                    </span>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={handleOpenEdit}
                    className="w-full px-4 py-2.5 text-left text-xs font-semibold text-brand-gray hover:text-white hover:bg-brand-hover flex items-center space-x-2.5 transition-colors cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4 text-brand-cyan shrink-0" />
                    <span>Edit Profile Settings</span>
                  </button>
                  <button
                    onClick={() => { setShowDropdown(false); onSwitchRole(); }}
                    className="w-full px-4 py-2.5 text-left text-xs font-semibold text-brand-gray hover:text-white hover:bg-brand-hover flex items-center space-x-2.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Switch Role ({user.role === 'admin' ? 'Faculty' : 'Admin'})</span>
                  </button>
                </div>

                <div className="border-t border-brand-border pt-1 mt-1">
                  <button
                    onClick={() => { setShowDropdown(false); if (onLogout) onLogout(); }}
                    className="w-full px-4 py-2.5 text-left text-xs font-semibold text-amber-500 hover:bg-amber-500/10 flex items-center space-x-2.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    <span>Log Out of promptFlow-AI</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center space-x-2 pl-3 border-l border-brand-border">
            <UserIcon className="w-4 h-4 text-brand-gray" />
            <span className="text-xs text-brand-gray">Guest</span>
          </div>
        )}

      </div>

      {/* Edit Profile Modal */}
      {showEditModal && user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-md bg-brand-card border border-brand-border rounded-3xl p-6 sm:p-8 relative shadow-2xl">
            
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute right-6 top-6 p-2 rounded-xl bg-brand-bg text-brand-gray hover:text-white border border-brand-border transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-brand-cyan/15 text-brand-cyan flex items-center justify-center font-bold">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Edit Profile</h3>
                <p className="text-xs text-brand-gray">Update your academic credentials &amp; department</p>
              </div>
            </div>

            {editError && (
              <div className="mb-4 bg-amber-500/10 text-amber-500 border border-amber-500/20 p-3 rounded-xl text-xs font-semibold">
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
                  className="w-full px-3 py-2.5 rounded-xl bg-brand-bg border border-brand-border text-white text-xs sm:text-sm focus:outline-none focus:border-brand-cyan transition-all"
                  placeholder="Dr. Jane Doe"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-gray mb-1.5">Primary Academic Department</label>
                <select
                  value={editDept}
                  onChange={(e) => setEditDept(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-brand-bg border border-brand-border text-white text-xs sm:text-sm focus:outline-none focus:border-brand-cyan transition-all"
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

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-brand-bg hover:bg-brand-hover text-brand-gray hover:text-white border border-brand-border text-xs font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-brand-cyan hover:brightness-110 text-real-white font-bold text-xs shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{saving ? 'Saving...' : 'Save Profile'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Help Modal */}
      {showHelpModal && (
        <HelpModal
          onClose={() => setShowHelpModal(false)}
          userRole={user?.role}
        />
      )}

    </header>
  );
};


