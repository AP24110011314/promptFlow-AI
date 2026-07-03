import React, { useState } from 'react';
import { 
  Layers, BookOpen, MessageSquare, Mail, BarChart3, ShieldAlert, Zap, 
  ArrowRight, LogOut, UserCheck, RefreshCw, X, Check 
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
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onLogout,
  onSwitchRole,
  onUserUpdate,
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
    <aside className="w-64 shrink-0 bg-brand-card border-r border-brand-border flex flex-col justify-between h-screen sticky top-0 z-40 select-none">
      
      {/* Top Branding */}
      <div>
        <div className="p-6 pb-4 flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <div className="w-10 h-10 rounded-2xl bg-brand-cyan text-white flex items-center justify-center shadow-md font-bold text-xl tracking-tighter">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight leading-tight">
              CRD System
            </h1>
            <p className="text-[11px] text-brand-gray font-medium tracking-wider uppercase">
              Research Digest
            </p>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="px-4 mt-6">
          <p className="px-3 text-[10px] font-bold text-brand-gray tracking-wider uppercase mb-2">
            Main Menu
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all cursor-pointer ${
                    isActive
                      ? 'bg-brand-cyan text-white shadow-sm font-bold'
                      : 'text-brand-gray hover:bg-brand-hover hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-brand-gray'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Section: ML Engine Status & User Profile */}
      <div className="p-4 space-y-4 border-t border-brand-border mt-auto">
        
        {/* ML Engine Status Card */}
        <div className="p-4 rounded-2xl bg-brand-bg border border-brand-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-brand-cyan uppercase tracking-wider">
              ML Engine Live
            </span>
            <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
          </div>
          <p className="text-xs text-white font-semibold leading-snug">
            Scikit-Learn Classifier
          </p>
          <p className="text-[11px] text-brand-gray leading-relaxed">
            Automated TF-IDF parsing with &gt;95% accuracy.
          </p>
          {user?.role === 'admin' ? (
            <button
              onClick={() => setActiveTab('simulation')}
              className="w-full mt-2 py-2 px-3 rounded-xl bg-brand-card hover:bg-brand-hover border border-brand-border text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <span>Simulate Email</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="w-full mt-2 py-1.5 px-3 rounded-xl bg-brand-green/10 border border-brand-green/20 text-brand-green text-[11px] font-bold text-center flex items-center justify-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
              <span>Live Ingestion Active</span>
            </div>
          )}
        </div>

        {/* User Profile Footer with Interactive Dropdown */}
        {user && (
          <div className="relative pt-2 border-t border-brand-border">
            <div
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center justify-between p-1.5 rounded-xl hover:bg-brand-hover transition-colors cursor-pointer group"
            >
              <div className="flex items-center space-x-2.5 truncate">
                <div className="w-8 h-8 rounded-full bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/20 flex items-center justify-center text-xs font-bold shrink-0 group-hover:bg-brand-cyan group-hover:text-white transition-all">
                  {user.full_name.charAt(0)}
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-white truncate group-hover:text-brand-cyan transition-colors">{user.full_name}</p>
                  <p className="text-[10px] text-brand-gray truncate capitalize">{user.role} • {user.department || 'General'}</p>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onLogout(); }}
                title="Sign Out"
                className="p-1.5 rounded-lg text-brand-gray hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Dropdown Menu */}
            {showDropdown && (
              <div className="absolute bottom-16 left-0 w-full rounded-2xl bg-brand-card border border-brand-border shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                <div className="px-4 py-2.5 border-b border-brand-border">
                  <p className="text-xs font-bold text-white truncate">{user.full_name}</p>
                  <p className="text-[10px] text-brand-gray truncate mt-0.5">{user.email}</p>
                </div>

                <div className="py-1">
                  <button
                    onClick={handleOpenEdit}
                    className="w-full px-4 py-2.5 text-left text-xs font-semibold text-brand-gray hover:text-white hover:bg-brand-hover flex items-center space-x-2.5 transition-colors cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4 text-brand-cyan shrink-0" />
                    <span>Edit Profile Settings</span>
                  </button>
                  {onSwitchRole && (
                    <button
                      onClick={() => { setShowDropdown(false); onSwitchRole(); }}
                      className="w-full px-4 py-2.5 text-left text-xs font-semibold text-brand-gray hover:text-white hover:bg-brand-hover flex items-center space-x-2.5 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Switch Role ({user.role === 'admin' ? 'Faculty' : 'Admin'})</span>
                    </button>
                  )}
                </div>

                <div className="border-t border-brand-border pt-1 mt-1">
                  <button
                    onClick={() => { setShowDropdown(false); onLogout(); }}
                    className="w-full px-4 py-2.5 text-left text-xs font-semibold text-amber-500 hover:bg-amber-500/10 flex items-center space-x-2.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    <span>Log Out of CRD</span>
                  </button>
                </div>
              </div>
            )}
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
                  className="px-5 py-2.5 rounded-xl bg-brand-cyan hover:brightness-110 text-white font-bold text-xs shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
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
