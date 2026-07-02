import React, { useState } from 'react';
import { Lock, Mail, ShieldAlert, UserCheck, ArrowRight, Sparkles } from 'lucide-react';
import { authService } from '../services/api';
import type { User } from '../types';

interface LoginModalProps {
  onLoginSuccess: (user: User, token: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('admin@college.edu');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await authService.login(email, password);
      localStorage.setItem('crd_token', res.access_token);
      onLoginSuccess(res.user, res.access_token);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setPreset = (presetEmail: string, presetPass: string) => {
    setEmail(presetEmail);
    setPassword(presetPass);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-lg">
      <div className="w-full max-w-md glass-card rounded-2xl p-8 relative overflow-hidden border border-slate-800/80 shadow-2xl glow-indigo">
        
        {/* Background glow circle */}
        <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-gradient-to-br from-indigo-600/20 to-cyan-400/10 blur-3xl pointer-events-none" />

        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg mb-3">
            <Sparkles className="w-6 h-6 text-white animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Welcome to CRD System</h2>
          <p className="text-sm text-slate-400 mt-1">
            Automated Research Publication Tracking & Management
          </p>
        </div>

        {/* Preset Quick Switchers for Reviewers */}
        <div className="mb-6 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-1">
            <span>⚡ Quick Demo RBAC Access</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPreset('admin@college.edu', 'admin123')}
              className={`p-2 rounded-lg text-xs font-medium flex items-center justify-center space-x-1.5 transition-all ${
                email === 'admin@college.edu'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 border border-slate-700/50'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Admin Role</span>
            </button>

            <button
              type="button"
              onClick={() => setPreset('faculty@college.edu', 'faculty123')}
              className={`p-2 rounded-lg text-xs font-medium flex items-center justify-center space-x-1.5 transition-all ${
                email === 'faculty@college.edu'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 border border-slate-700/50'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Faculty Role</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                placeholder="you@college.edu"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-semibold text-sm shadow-lg hover:from-indigo-500 hover:to-cyan-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          Role-Based Access Control (RBAC) Enabled • ML Classification Powered
        </div>
      </div>
    </div>
  );
};
