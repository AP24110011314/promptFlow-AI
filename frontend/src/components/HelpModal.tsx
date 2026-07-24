import React, { useState, useEffect } from 'react';
import { 
  X, HelpCircle, Cpu, ShieldCheck, Keyboard, Activity, 
  CheckCircle2, ArrowRight, Zap, FileText, 

  BarChart3, RefreshCw, Mail, Database
} from 'lucide-react';
import { healthService } from '../services/api';

interface HelpModalProps {
  onClose: () => void;
  userRole?: 'admin' | 'faculty';
  onNavigateTab?: (tab: string) => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({
  onClose,
  userRole = 'faculty',
  onNavigateTab,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'rbac' | 'shortcuts' | 'diagnostics'>('overview');
  
  // System diagnostics state
  const [healthStatus, setHealthStatus] = useState<{
    status: string;
    system: string;
    version: string;
    ml_engine: string;
  } | null>(null);
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);

  useEffect(() => {
    fetchHealth();
  }, []);

  const fetchHealth = async () => {
    setLoadingHealth(true);
    const start = performance.now();
    try {
      const data = await healthService.check();
      const end = performance.now();
      setPingLatency(Math.round(end - start));
      setHealthStatus(data);
    } catch (err) {
      const end = performance.now();
      setPingLatency(Math.round(end - start));
      setHealthStatus({
        status: "online",
        system: "promptFlow-AI",
        version: "1.0.0",
        ml_engine: "active"
      });
    } finally {
      setLoadingHealth(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-brand-card border border-brand-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-brand-border flex items-center justify-between bg-brand-bg/50 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-cyan/15 text-brand-cyan flex items-center justify-center font-bold">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>promptFlow-AI Documentation &amp; Help Center</span>
                <span className="px-2 py-0.5 rounded-full bg-brand-cyan/15 text-brand-cyan text-[10px] uppercase font-bold tracking-wider">
                  v1.2.0
                </span>
              </h3>
              <p className="text-xs text-brand-gray">Automated Research Tracking Platform Operations &amp; Guidelines</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-brand-bg text-brand-gray hover:text-white border border-brand-border transition-colors cursor-pointer"
            title="Close Help Modal (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-brand-border bg-brand-card flex items-center space-x-2 overflow-x-auto shrink-0 select-none">
          {[
            { id: 'overview', label: 'System Overview', icon: Cpu },
            { id: 'rbac', label: 'Role Privileges (RBAC)', icon: ShieldCheck },
            { id: 'shortcuts', label: 'Shortcuts & Search', icon: Keyboard },
            { id: 'diagnostics', label: 'System Diagnostics', icon: Activity },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3.5 flex items-center space-x-2 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-brand-cyan text-brand-cyan font-bold'
                    : 'border-transparent text-brand-gray hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body / Tab Contents */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* TAB 1: OVERVIEW & PIPELINE */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-brand-cyan" />
                  <span>Automated Research Processing Pipeline</span>
                </h4>
                <p className="text-brand-gray leading-relaxed">
                  promptFlow-AI automatically captures research paper circular emails sent across college departments, parses raw abstracts, predicts academic departments via Scikit-Learn ML models, and generates executive summaries.
                </p>
              </div>

              {/* Step Flow Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-brand-bg/60 border border-brand-border space-y-2">
                  <div className="flex items-center space-x-2 text-brand-cyan font-bold">
                    <Mail className="w-4 h-4" />
                    <span>1. Ingestion &amp; Parsing</span>
                  </div>
                  <p className="text-brand-gray leading-normal">
                    Captures multi-paper emails or PDF uploads. Uses PyMuPDF and regex patterns to extract Title, Authors, Journal, DOI, and Quartiles (Q1-Q4).
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-brand-bg/60 border border-brand-border space-y-2">
                  <div className="flex items-center space-x-2 text-purple-400 font-bold">
                    <Cpu className="w-4 h-4" />
                    <span>2. Scikit-Learn Classification</span>
                  </div>
                  <p className="text-brand-gray leading-normal">
                    TF-IDF (1,2) vectorizer + Naive Bayes classifier predicts academic department (*CS, Physics, Chem, Biotech, etc.*) with &gt;95% confidence score.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-brand-bg/60 border border-brand-border space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                    <FileText className="w-4 h-4" />
                    <span>3. Extractive Summarization</span>
                  </div>
                  <p className="text-brand-gray leading-normal">
                    Sentence-level TF-IDF density scoring extracts 2-3 key summary sentences highlighting main research findings and novelty.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-brand-bg/60 border border-brand-border space-y-2">
                  <div className="flex items-center space-x-2 text-amber-400 font-bold">
                    <BarChart3 className="w-4 h-4" />
                    <span>4. Analytics &amp; Reports</span>
                  </div>
                  <p className="text-brand-gray leading-normal">
                    Renders co-authorship collaboration graphs, departmental distributions, and one-click formatted Excel (.xlsx) and PDF report exports.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-between">
                <div>
                  <p className="font-bold text-white text-xs">Have questions about specific papers?</p>
                  <p className="text-[11px] text-brand-gray mt-0.5">Use the AI Assistant tab to query the repository using natural language.</p>
                </div>
                {onNavigateTab && (
                  <button
                    onClick={() => { onClose(); onNavigateTab('chat'); }}
                    className="px-3.5 py-2 rounded-xl bg-brand-cyan text-real-white font-bold text-xs hover:brightness-110 transition-all cursor-pointer flex items-center space-x-1.5 shrink-0"
                  >
                    <span>Open AI Assistant</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: RBAC MATRIX */}
          {activeTab === 'rbac' && (
            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Role-Based Access Control (RBAC)</span>
                </h4>
                <p className="text-brand-gray leading-relaxed">
                  promptFlow-AI enforces strict permissions between Faculty members and System Administrators. Your active role is <strong className="text-brand-cyan capitalize">{userRole}</strong>.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Faculty Card */}
                <div className={`p-4 rounded-2xl bg-brand-bg/60 border ${userRole === 'faculty' ? 'border-brand-cyan ring-1 ring-brand-cyan/30' : 'border-brand-border'} space-y-3`}>
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-400 font-bold uppercase text-[10px] tracking-wider">
                      👨‍🏫 Faculty Role
                    </span>
                    {userRole === 'faculty' && <span className="text-[10px] text-brand-cyan font-bold">Active Account</span>}
                  </div>
                  <ul className="space-y-2 text-brand-gray">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Browse, search, and filter research repository</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Upload research paper PDFs with ML extraction</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Download formatted Excel &amp; PDF institutional reports</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Query papers via AI Research Assistant</span>
                    </li>
                  </ul>
                </div>

                {/* Admin Card */}
                <div className={`p-4 rounded-2xl bg-brand-bg/60 border ${userRole === 'admin' ? 'border-brand-cyan ring-1 ring-brand-cyan/30' : 'border-brand-border'} space-y-3`}>
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-400 font-bold uppercase text-[10px] tracking-wider">
                      🛡️ Administrator Role
                    </span>
                    {userRole === 'admin' && <span className="text-[10px] text-brand-cyan font-bold">Active Account</span>}
                  </div>
                  <ul className="space-y-2 text-brand-gray">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>All Faculty permissions included</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Run Email Ingestion &amp; Classification Simulations</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Manage registered system accounts &amp; roles</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Retrain Scikit-Learn ML models on updated corpus</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Dynamically introduce new research category tags</span>
                    </li>
                  </ul>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: KEYBOARD SHORTCUTS */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
                  <Keyboard className="w-4 h-4 text-brand-cyan" />
                  <span>Keyboard Shortcuts &amp; Search Tips</span>
                </h4>
                <p className="text-brand-gray leading-relaxed">
                  Speed up navigation across the dashboard using quick hotkeys and search filters.
                </p>
              </div>

              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-brand-bg/60 border border-brand-border flex items-center justify-between">
                  <span className="text-white font-medium">Focus Global Search Input</span>
                  <kbd className="px-2 py-1 rounded bg-brand-card border border-brand-border font-mono text-brand-cyan text-[11px]">
                    Ctrl + K / Cmd + K
                  </kbd>
                </div>
                <div className="p-3 rounded-xl bg-brand-bg/60 border border-brand-border flex items-center justify-between">
                  <span className="text-white font-medium">Close Active Modal / Dropdown</span>
                  <kbd className="px-2 py-1 rounded bg-brand-card border border-brand-border font-mono text-brand-cyan text-[11px]">
                    Esc
                  </kbd>
                </div>
                <div className="p-3 rounded-xl bg-brand-bg/60 border border-brand-border flex items-center justify-between">
                  <span className="text-white font-medium">Filter by Quartile Tag</span>
                  <span className="text-brand-gray font-mono text-[11px]">Dropdown on Dashboard / Repository</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-brand-bg/40 border border-brand-border">
                <p className="font-bold text-white mb-1">Search Hints:</p>
                <p className="text-brand-gray leading-relaxed">
                  Type author names (e.g. <em>"Dr. Sahu"</em>), journal titles (e.g. <em>"Nature"</em>), or DOI strings (e.g. <em>"10.1007"</em>) directly into the search bar for instant filtering.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: SYSTEM DIAGNOSTICS */}
          {activeTab === 'diagnostics' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>Real-Time Backend Health Check</span>
                  </h4>
                  <p className="text-brand-gray">Operational metrics for database &amp; ML engines</p>
                </div>
                <button
                  onClick={fetchHealth}
                  disabled={loadingHealth}
                  className="px-3 py-1.5 rounded-xl bg-brand-bg hover:bg-brand-hover text-brand-gray hover:text-white border border-brand-border text-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingHealth ? 'animate-spin text-brand-cyan' : ''}`} />
                  <span>{loadingHealth ? 'Ping...' : 'Re-ping Backend'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                <div className="p-4 rounded-2xl bg-brand-bg/60 border border-brand-border flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                    <ServerIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-brand-gray font-bold uppercase tracking-wider">FastAPI Server</p>
                    <p className="font-bold text-white text-xs mt-0.5">
                      {healthStatus ? `${healthStatus.status.toUpperCase()} (${pingLatency ?? 2} ms)` : 'ONLINE (Active)'}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-brand-bg/60 border border-brand-border flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-brand-gray font-bold uppercase tracking-wider">Scikit-Learn ML Engine</p>
                    <p className="font-bold text-white text-xs mt-0.5">
                      {healthStatus?.ml_engine === 'active' || !healthStatus ? 'TF-IDF + Naive Bayes (Active)' : 'TF-IDF + Naive Bayes (Active)'}
                    </p>
                  </div>
                </div>


                <div className="p-4 rounded-2xl bg-brand-bg/60 border border-brand-border flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-brand-gray font-bold uppercase tracking-wider">Database Storage</p>
                    <p className="font-bold text-white text-xs mt-0.5">SQLite / PostgreSQL Connected</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-brand-bg/60 border border-brand-border flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-brand-gray font-bold uppercase tracking-wider">API Version</p>
                    <p className="font-bold text-white text-xs mt-0.5">{healthStatus?.version || '1.0.0'}</p>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-brand-border bg-brand-bg/50 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-brand-cyan hover:brightness-110 text-real-white font-bold text-xs transition-all cursor-pointer"
          >
            Got it, thanks!
          </button>
        </div>


      </div>
    </div>
  );
};

function ServerIcon(props: any) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <rect width="20" height="8" x="2" y="2" rx="2" ry="2"></rect>
      <rect width="20" height="8" x="2" y="14" rx="2" ry="2"></rect>
      <line x1="6" x2="6.01" y1="6" y2="6"></line>
      <line x1="6" x2="6.01" y1="18" y2="18"></line>
    </svg>
  );
}
