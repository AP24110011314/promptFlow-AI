import React from 'react';
import { BookOpen, BarChart3, Mail, ShieldAlert, Layers, LogOut, User as UserIcon, RefreshCw, Zap, Sun, Moon } from 'lucide-react';
import type { User } from '../types';

interface NavbarProps {
  user: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  onSwitchRole: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onLogout,
  onSwitchRole,
  theme,
  onToggleTheme,
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
    <header className="sticky top-0 z-50 bg-brand-card/90 backdrop-blur-md border-b border-brand-border shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-cyan to-brand-green/70 flex items-center justify-center shadow-lg glow-cyan">
              <Zap className="w-5 h-5 text-brand-bg fill-brand-bg animate-pulse-slow" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white">
                CRD System
              </span>
              <span className="block text-[10px] uppercase tracking-wider text-brand-cyan font-semibold">
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
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
                    isActive
                      ? 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/35 shadow-sm shadow-brand-cyan/5'
                      : 'text-brand-gray border-transparent hover:text-white hover:bg-brand-hover'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-cyan' : 'text-brand-gray'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Theme & User Status & Role Switcher */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle Button */}
            <button
              onClick={onToggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              className="p-2 rounded-lg bg-brand-hover text-brand-gray hover:text-white border border-brand-border transition-all duration-200 cursor-pointer flex items-center justify-center"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-brand-cyan" />
              ) : (
                <Moon className="w-4 h-4 text-brand-cyan" />
              )}
            </button>

            {user ? (
              <div className="flex items-center space-x-3">
                <div className="hidden lg:block text-right">
                  <div className="text-xs font-semibold text-white flex items-center justify-end space-x-1.5">
                    <span>{user.full_name}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${
                        user.role === 'admin'
                          ? 'bg-brand-red/20 text-brand-red border-brand-red/30'
                          : 'bg-brand-green/20 text-brand-green border-brand-green/30'
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>
                  <span className="text-[11px] text-brand-gray block">{user.department}</span>
                </div>

                <button
                  onClick={onSwitchRole}
                  title="Switch Role (Test RBAC Admin vs Faculty)"
                  className="p-2 rounded-lg bg-brand-hover text-brand-gray hover:text-white hover:bg-brand-border border border-brand-border transition-all duration-200 flex items-center space-x-1 text-xs cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-brand-cyan" />
                  <span className="hidden sm:inline font-medium">Switch Role</span>
                </button>

                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-2 rounded-lg bg-brand-red/10 text-brand-red hover:bg-brand-red/20 border border-brand-red/20 transition-all duration-200 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <UserIcon className="w-5 h-5 text-brand-gray" />
                <span className="text-sm text-brand-gray">Not signed in</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
