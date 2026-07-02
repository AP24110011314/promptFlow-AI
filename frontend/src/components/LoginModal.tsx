import React, { useState } from 'react';
import { Lock, Mail, ShieldAlert, UserCheck, ArrowRight, Zap } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-bg/85 backdrop-blur-md">
      <div className="w-full max-w-md bg-brand-card rounded-2xl p-8 relative overflow-hidden border border-brand-border shadow-2xl">
        
        {/* Background glow circle */}
        <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-brand-cyan/5 blur-3xl pointer-events-none" />

        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-tr from-brand-cyan to-brand-green/70 flex items-center justify-center shadow-lg mb-3 glow-cyan">
            <Zap className="w-6 h-6 text-brand-bg fill-brand-bg animate-pulse-slow" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Welcome to CRD System</h2>
          <p className="text-sm text-brand-gray mt-1 font-sans">
            Automated Research Publication Tracking & Management
          </p>
        </div>

        {/* Preset Quick Switchers for Reviewers */}
        <div className="mb-6 bg-brand-bg p-3.5 rounded-xl border border-brand-border">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-gray mb-2 flex items-center space-x-1">
            <span>⚡ Quick Demo RBAC Access</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPreset('admin@college.edu', 'admin123')}
              className={`p-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                email === 'admin@college.edu'
                  ? 'bg-brand-red/20 text-brand-red border border-brand-red/40 shadow-sm'
                  : 'bg-brand-bg text-brand-gray hover:bg-brand-hover border border-brand-border'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Admin Role</span>
            </button>

            <button
              type="button"
              onClick={() => setPreset('faculty@college.edu', 'faculty123')}
              className={`p-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                email === 'faculty@college.edu'
                  ? 'bg-brand-green/20 text-brand-green border border-brand-green/40 shadow-sm'
                  : 'bg-brand-bg text-brand-gray hover:bg-brand-hover border border-brand-border'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Faculty Role</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 watt-alert text-center text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-brand-gray mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-brand-gray" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-brand-bg border border-brand-border text-white placeholder-brand-gray text-sm focus:outline-none focus:border-brand-cyan transition-all"
                placeholder="you@college.edu"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-brand-gray mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-brand-gray" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-brand-bg border border-brand-border text-white placeholder-brand-gray text-sm focus:outline-none focus:border-brand-cyan transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-cyan/80 text-brand-bg font-bold text-sm shadow-lg hover:brightness-110 focus:outline-none transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
            {!loading && <ArrowRight className="w-4 h-4 text-brand-bg stroke-[3]" />}
          </button>
        </form>

        <div className="mt-6 text-center text-[10px] text-brand-gray uppercase font-mono tracking-wider">
          Role-Based Access Control (RBAC) Enabled • ML Classification Powered
        </div>
      </div>
    </div>
  );
};
