import React, { useState } from 'react';
import { Lock, Mail, ShieldAlert, UserCheck, ArrowRight, Zap, X } from 'lucide-react';
import { authService } from '../services/api';
import type { User } from '../types';

interface LoginModalProps {
  onLoginSuccess: (user: User, token: string) => void;
  onClose?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'faculty'>('admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await authService.login(email, password);
      localStorage.setItem('promptflow_token', res.access_token);
      onLoginSuccess(res.user, res.access_token);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setPreset = (role: 'admin' | 'faculty') => {
    setSelectedRole(role);
    setError(null);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-md bg-brand-card rounded-3xl p-8 relative overflow-hidden border border-brand-border shadow-2xl">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-brand-gray hover:text-white hover:bg-brand-hover transition-colors cursor-pointer"
            title="Back to Landing Page"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-brand-cyan text-real-white flex items-center justify-center shadow-md mb-3 font-bold">
            <Zap className="w-6 h-6 fill-real-white text-real-white" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Sign in to promptFlow-AI</h2>
          <p className="text-xs text-brand-gray mt-1 font-medium">
            College Research Publication Management
          </p>
        </div>

        {/* Preset Quick Switchers for Reviewers */}
        <div className="mb-6 bg-brand-bg p-3.5 rounded-2xl border border-brand-border">
          <p className="text-[10px] font-bold uppercase tracking-wider text-brand-gray mb-2">
            Quick Demo Credentials
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPreset('admin')}
              className={`p-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                selectedRole === 'admin'
                  ? 'bg-[#F4F0EB] text-[#1E1E1E] border border-amber-500/30 shadow-2xs'
                  : 'bg-brand-card text-brand-gray hover:bg-brand-hover border border-brand-border'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Admin Account</span>
            </button>

            <button
              type="button"
              onClick={() => setPreset('faculty')}
              className={`p-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                selectedRole === 'faculty'
                  ? 'bg-brand-green/15 text-brand-green border border-brand-green/30 shadow-2xs'
                  : 'bg-brand-card text-brand-gray hover:bg-brand-hover border border-brand-border'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Faculty Account</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-brand-alert-bg text-brand-red border border-brand-red/30 p-3 rounded-xl text-center text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brand-gray mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-brand-gray" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-brand-bg border border-brand-border text-white placeholder-brand-gray text-xs sm:text-sm focus:outline-none focus:border-brand-cyan transition-all"
                placeholder="you@college.edu"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-gray mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-brand-gray" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-brand-bg border border-brand-border text-white placeholder-brand-gray text-xs sm:text-sm focus:outline-none focus:border-brand-cyan transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-brand-cyan hover:brightness-110 text-real-white font-bold text-xs sm:text-sm shadow-sm focus:outline-none transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

      </div>
    </div>
  );
};
