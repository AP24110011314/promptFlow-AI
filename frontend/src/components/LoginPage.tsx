import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { authService } from '../services/api';
import type { User } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: User, token: string) => void;
  onBackToLanding: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onBackToLanding }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'faculty'>('admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear errors when selectedRole changes
  useEffect(() => {
    setError(null);
  }, [selectedRole]);

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

  // Easing curve: premium ease-out with no bounce or overshoot
  const easeCurve = [0.16, 1, 0.3, 1] as [number, number, number, number];

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-10 bg-[#FDFDFD] font-sans selection:bg-[#F4F0EB] selection:text-[#1E1E1E] overflow-hidden">
      
      {/* Background Soft Mesh Glow Accents */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Soft Warm Glow (Top Left) */}
        <div 
          className="absolute top-[-20%] left-[-10%] w-[60%] h-[70%] rounded-full bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-[#F4F0EB]/60 via-[#F4F0EB]/20 to-transparent blur-[90px]" 
        />
        {/* Subtle Light Cyan Glow (Center) */}
        <div 
          className="absolute top-[30%] left-[40%] w-[45%] h-[55%] rounded-full bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-[#EBF3F4]/50 via-[#EBF3F4]/10 to-transparent blur-[110px]" 
        />
        {/* Soft Warm Glow (Bottom Right) */}
        <div 
          className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[80%] rounded-full bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-[#F4F0EB]/50 via-[#F4F0EB]/10 to-transparent blur-[110px]" 
        />
      </div>

      {/* Back to Home Button */}
      <motion.button
        onClick={onBackToLanding}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease: easeCurve }}
        className="absolute top-6 left-6 sm:top-8 sm:left-8 z-30 flex items-center gap-2 text-xs font-bold text-[#6E6E73] hover:text-[#1E1E1E] transition-colors cursor-pointer group"
        title="Back to Landing Page"
      >
        <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
        <span>Back to home</span>
      </motion.button>

      {/* Centered Swapping Login Card */}
      <motion.div
        layout
        transition={{ duration: 0.5, ease: easeCurve }}
        className={`w-full max-w-5xl min-h-145 lg:h-155 bg-real-white/90 border border-black/5 rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col relative z-10 backdrop-blur-md ${
          selectedRole === 'admin' ? 'lg:flex-row' : 'lg:flex-row-reverse'
        }`}
      >
        
        {/* PANEL A: Dedicated Visual Product Showcase */}
        <motion.div
          layout
          key="illustration-panel"
          transition={{ type: 'spring', stiffness: 220, damping: 28 }}
          className="w-full lg:w-[52%] bg-[#F5F5F7]/30 flex items-center justify-center relative overflow-hidden min-h-87.5 lg:min-h-0"
        >
          {/* Image Showcase Container covering 100% of the pane */}
          <div className="absolute inset-0 w-full h-full">
            <AnimatePresence mode="wait">
              {selectedRole === 'admin' ? (
                <motion.div
                  key="admin-illustration"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.45, ease: easeCurve }}
                  className="w-full h-full absolute inset-0"
                >
                  <img
                    src="/Admin-login.png"
                    alt="Admin login illustration"
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="faculty-illustration"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.45, ease: easeCurve }}
                  className="w-full h-full absolute inset-0"
                >
                  <img
                    src="/Faculty login.png"
                    alt="Faculty login illustration"
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* PANEL B: Authentication Form */}
        <motion.div
          layout
          key="form-panel"
          transition={{ type: 'spring', stiffness: 220, damping: 28 }}
          className="w-full lg:w-[48%] flex flex-col justify-center p-8 sm:p-12 md:p-14 bg-real-white"
        >
          <div className="w-full max-w-90 mx-auto flex flex-col">
            
            {/* Header */}
            <div className="text-center lg:text-left mb-6">
              <h2 className="text-2xl font-display font-bold text-[#1E1E1E] tracking-tight">
                Sign in to promptFlow-AI
              </h2>
              
              <p className="text-xs text-[#6E6E73] mt-1.5 font-medium">
                College Research Publication Management
              </p>
            </div>

            {/* Segmented Control Selector */}
            <div className="p-1 bg-[#F4F0EB]/65 border border-black/5 rounded-lg flex relative w-full mb-6">
              {/* Sliding Active Indicator */}
              <div className="absolute inset-1 flex w-full pointer-events-none">
                <motion.div
                  className="bg-real-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-black/5 rounded-md w-[calc(50%-8px)] h-full"
                  animate={{
                    x: selectedRole === 'admin' ? '0%' : '100%',
                  }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              </div>

              {/* Admin Button */}
              <button
                type="button"
                onClick={() => setSelectedRole('admin')}
                className={`flex-1 text-center py-2 text-xs font-bold rounded-md relative z-10 transition-colors duration-200 cursor-pointer ${
                  selectedRole === 'admin' ? 'text-[#1E1E1E]' : 'text-[#6E6E73] hover:text-[#1E1E1E]'
                }`}
              >
                Admin Portal
              </button>

              {/* Faculty Button */}
              <button
                type="button"
                onClick={() => setSelectedRole('faculty')}
                className={`flex-1 text-center py-2 text-xs font-bold rounded-md relative z-10 transition-colors duration-200 cursor-pointer ${
                  selectedRole === 'faculty' ? 'text-[#1E1E1E]' : 'text-[#6E6E73] hover:text-[#1E1E1E]'
                }`}
              >
                Faculty Portal
              </button>
            </div>

            {/* Error message display */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4 bg-[#FDF0ED] text-[#C13515] border border-[#F5C9C0] px-4 py-2.5 rounded-lg text-center text-xs font-semibold"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login Inputs form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#8E8E93] tracking-widest uppercase mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-[#8E8E93]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-lg bg-[#F5F5F7]/80 hover:bg-[#F5F5F7] focus:bg-real-white border border-transparent focus:border-black/10 text-[#1E1E1E] placeholder-[#8E8E93] text-sm focus:outline-none transition-all duration-200"
                    placeholder="you@college.edu"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#8E8E93] tracking-widest uppercase mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-[#8E8E93]" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-full h-11 pl-10 pr-4 rounded-lg bg-[#F5F5F7]/80 hover:bg-[#F5F5F7] focus:bg-real-white border border-transparent focus:border-black/10 text-[#1E1E1E] placeholder-[#8E8E93] text-sm focus:outline-none transition-all duration-200"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Sign In CTA Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 mt-2 rounded-lg bg-[#1E1E1E] hover:bg-[#2E2E2E] text-real-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer group"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-real-white" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>
            
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
};
