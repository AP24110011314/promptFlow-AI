import React from 'react';
import { BookOpen, BarChart3, Mail, ShieldAlert, Layers, LogOut, User as UserIcon, RefreshCw } from 'lucide-react';
import type { User } from '../types';

interface NavbarProps {
  user: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  onSwitchRole: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onLogout,
  onSwitchRole,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Layers },
    { id: 'repository', label: 'Research Repository', icon: BookOpen },
    { id: 'simulation', label: 'ML Email Ingestion', icon: Mail },
    { id: 'analytics', label: 'Analytics & Network', icon: BarChart3 },
  ];

  if (user?.role === 'admin') {
    navItems.push({ id: 'admin', label: 'Admin Control Panel', icon: ShieldAlert });
  }

  return (
    <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg glow-indigo">
              <BookOpen className="w-6 h-6 text-white animate-pulse-slow" />
            </div>
            <div>
              <span className="text-lg font-bold bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                CRD System
              </span>
              <span className="block text-[10px] uppercase tracking-wider text-indigo-400 font-semibold">
                College Research Digest
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600/30 to-cyan-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm glow-indigo'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Status & Role Switcher */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="hidden lg:block text-right">
                  <div className="text-xs font-semibold text-slate-200 flex items-center justify-end space-x-1.5">
                    <span>{user.full_name}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${
                        user.role === 'admin'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 block">{user.department}</span>
                </div>

                <button
                  onClick={onSwitchRole}
                  title="Switch Role (Test RBAC Admin vs Faculty)"
                  className="p-2 rounded-lg bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700/80 border border-slate-700/60 transition-all duration-200 flex items-center space-x-1 text-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline font-medium">Switch Role</span>
                </button>

                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all duration-200"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <UserIcon className="w-5 h-5 text-slate-400" />
                <span className="text-sm text-slate-400">Not signed in</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
