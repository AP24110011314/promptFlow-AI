import React, { useState } from 'react';
import { 
  Layers, BookOpen, MessageSquare, Mail, BarChart3, ShieldAlert, Zap, 
  LogOut, UserCheck, RefreshCw, X, Check 
} from 'lucide-react';
import type { User } from '../types';
import { authService } from '../services/api';

interface SidebarProps {
  user: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  onSwitchRole?: () => void;
  onUserUpdate?: (updatedUser: User) => void;
  collapsed: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onLogout,
  onSwitchRole,
  onUserUpdate,
  collapsed,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Edit Profile Form State
  const [editName, setEditName] = useState(user?.full_name || '');
  const [editDept, setEditDept] = useState(user?.department || 'Computer Science');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

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
    <aside className={`shrink-0 bg-white border-r border-slate-200 flex flex-col justify-between h-screen sticky top-0 z-40 select-none transition-all duration-300 ${
      collapsed ? 'w-20' : 'w-64'
    }`}>
      
      {/* Top Branding */}
      <div>
        <div 
          className={`p-6 pb-4 flex items-center cursor-pointer ${
            collapsed ? 'justify-center px-2 space-x-0' : 'space-x-3'
          }`} 
          onClick={() => setActiveTab('dashboard')}
        >
          <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs font-bold text-lg tracking-tighter shrink-0">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          {!collapsed && (
            <div className="animate-in fade-in slide-in-from-left-2 duration-200">
              <h1 className="text-base font-bold text-slate-900 tracking-tight leading-tight font-display">
                promptFlow-AI
              </h1>
              <p className="text-[11px] text-slate-500 font-medium tracking-wider uppercase">
                Research Digest
              </p>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <div className="px-4 mt-6">
          <p className={`px-3 text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-2 ${
            collapsed ? 'text-center px-0' : ''
          }`}>
            {collapsed ? '•' : 'Main Menu'}
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center px-3 py-2 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
                    collapsed ? 'justify-center space-x-0' : 'space-x-2.5'
                  } ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-2xs font-bold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Section: User Profile */}
      <div className="p-4 border-t border-slate-200 mt-auto">
        
        {/* User Profile Footer with Interactive Dropdown */}
        {user && (
          <div className="relative">
            <div
              onClick={() => setShowDropdown(!showDropdown)}
              className={`flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer group ${
                collapsed ? 'justify-center' : ''
              }`}
            >
              <div className={`flex items-center truncate ${collapsed ? 'space-x-0' : 'space-x-2.5'}`}>
                <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center text-xs font-bold shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  {user.full_name.charAt(0)}
                </div>
                {!collapsed && (
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">{user.full_name}</p>
                    <p className="text-[10px] text-slate-500 truncate capitalize">{user.role} • {user.department || 'General'}</p>
                  </div>
                )}
              </div>
              {!collapsed && (
                <button
                  onClick={(e) => { e.stopPropagation(); onLogout(); }}
                  title="Sign Out"
                  className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Profile Dropdown Menu */}
            {showDropdown && (
              <div className={`absolute rounded-xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150 ${
                collapsed ? 'left-16 bottom-0 w-64 border border-slate-200 shadow-xl ml-2' : 'bottom-14 left-0 w-full'
              }`}>
                <div className="px-4 py-2.5 border-b border-slate-200">
                  <p className="text-xs font-bold text-slate-900 truncate">{user.full_name}</p>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">{user.email}</p>
                </div>

                <div className="py-1">
                  <button
                    onClick={handleOpenEdit}
                    className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 flex items-center space-x-2.5 transition-colors cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Edit Profile Settings</span>
                  </button>
                  {onSwitchRole && (
                    <button
                      onClick={() => { setShowDropdown(false); onSwitchRole(); }}
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 flex items-center space-x-2.5 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Switch Role ({user.role === 'admin' ? 'Faculty' : 'Admin'})</span>
                    </button>
                  )}
                </div>

                <div className="border-t border-slate-200 pt-1 mt-1">
                  <button
                    onClick={() => { setShowDropdown(false); onLogout(); }}
                    className="w-full px-4 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center space-x-2.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-red-600 shrink-0" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Edit Profile Modal */}
      {showEditModal && user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-200">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Edit Profile</h3>
                  <p className="text-[11px] text-slate-500">Update account details &amp; preferences</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Department</label>
                <select
                  value={editDept}
                  onChange={(e) => setEditDept(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all cursor-pointer"
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
                  <span>{saving ? 'Saving...' : 'Save Profile'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </aside>
  );
};
