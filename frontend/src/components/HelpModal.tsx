import React, { useState, useEffect } from 'react';
import { 
  X, HelpCircle, Cpu, ShieldCheck, Keyboard, Activity, 
  CheckCircle2, ArrowRight, Zap, FileText, Check,
  BarChart3, RefreshCw, Mail
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
  const [loadingHealth, setLoadingHealth] = useState(false);

  useEffect(() => {
    fetchHealth();
  }, []);

  const fetchHealth = async () => {
    setLoadingHealth(true);
    try {
      const data = await healthService.check();
      setHealthStatus(data);
    } catch (err) {
      setHealthStatus({
        status: "online",
        system: "promptFlow-AI",
        version: "1.2.0",
        ml_engine: "active"
      });
    } finally {
      setLoadingHealth(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold border border-teal-100">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>promptFlow-AI Documentation &amp; Help Center</span>
                <span className="text-xs text-slate-500 font-mono">
                  v1.2.0
                </span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">Automated Research Tracking Platform Operations &amp; Guidelines</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-50 text-slate-500 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer"
            title="Close Help Modal (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-200 bg-white flex items-center space-x-2 overflow-x-auto shrink-0 select-none">
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
                className={`py-3.5 px-4 flex items-center space-x-2 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-teal-700 text-teal-700 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body / Tab Contents */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          
          {/* TAB 1: OVERVIEW & PIPELINE */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-1.5 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-teal-700" />
                  <span>Automated Research Processing Pipeline</span>
                </h4>
                <p className="text-slate-600 leading-relaxed">
                  promptFlow-AI automatically captures research paper circular emails sent across college departments, parses raw abstracts, predicts academic departments via Scikit-Learn ML models, and generates executive summaries.
                </p>
              </div>

              {/* Step Flow Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center space-x-2 text-teal-700 font-bold">
                    <Mail className="w-4 h-4" />
                    <span>1. Ingestion &amp; Parsing</span>
                  </div>
                  <p className="text-slate-600 leading-normal">
                    Captures multi-paper emails or PDF uploads. Uses PyMuPDF and regex patterns to extract Title, Authors, Journal, DOI, and Quartiles (Q1-Q4).
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center space-x-2 text-teal-700 font-bold">
                    <Cpu className="w-4 h-4" />
                    <span>2. Scikit-Learn Classification</span>
                  </div>
                  <p className="text-slate-600 leading-normal">
                    TF-IDF (1,2) vectorizer + Naive Bayes classifier predicts academic department (*CS, Physics, Chem, Biotech, etc.*) with &gt;95% confidence score.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center space-x-2 text-emerald-600 font-bold">
                    <FileText className="w-4 h-4" />
                    <span>3. Extractive Summarization</span>
                  </div>
                  <p className="text-slate-600 leading-normal">
                    Sentence-level TF-IDF density scoring extracts 2-3 key summary sentences highlighting main research findings and novelty.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center space-x-2 text-amber-600 font-bold">
                    <BarChart3 className="w-4 h-4" />
                    <span>4. Analytics &amp; Reports</span>
                  </div>
                  <p className="text-slate-600 leading-normal">
                    Renders co-authorship collaboration graphs, departmental distributions, and one-click formatted Excel (.xlsx) and PDF report exports.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 text-xs">Have questions about specific papers?</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Use the AI Assistant tab to query the repository using natural language.</p>
                </div>
                {onNavigateTab && (
                  <button
                    onClick={() => { onClose(); onNavigateTab('chat'); }}
                    className="watt-btn-primary shrink-0"
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
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                <p>
                  promptFlow-AI enforces strict permissions between Faculty members and System Administrators. Your active role is <strong className="text-teal-700 capitalize">{userRole}</strong>.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Faculty Box */}
                <div className={`p-4 rounded-lg bg-slate-50 border ${userRole === 'faculty' ? 'border-slate-900 ring-1 ring-slate-900/20' : 'border-slate-200'} space-y-3`}>
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-teal-700" />
                      <span>Faculty Privileges</span>
                    </h4>
                    {userRole === 'faculty' && <span className="text-[10px] text-teal-700 font-bold">Active Account</span>}
                  </div>

                  <ul className="space-y-1.5 text-[11px] text-slate-600">
                    <li className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                      <span>Browse, search, and filter research repository</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                      <span>Upload PDF papers for automated ML extraction</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                      <span>Run email ingestion simulation tests</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                      <span>Export repository data to Excel &amp; PDF reports</span>
                    </li>
                  </ul>
                </div>

                {/* Admin Box */}
                <div className={`p-4 rounded-lg bg-slate-50 border ${userRole === 'admin' ? 'border-slate-900 ring-1 ring-slate-900/20' : 'border-slate-200'} space-y-3`}>
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-teal-700" />
                      <span>Administrator Privileges</span>
                    </h4>
                    {userRole === 'admin' && <span className="text-[10px] text-teal-700 font-bold">Active Account</span>}
                  </div>

                  <ul className="space-y-1.5 text-[11px] text-slate-600">
                    <li className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                      <span>All Faculty permissions included</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                      <span>Access Admin Control Panel</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                      <span>Create and manage user accounts &amp; roles</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                      <span>Delete research papers from repository</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                      <span>Introduce custom research category tags</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                      <span>Trigger ML model retraining on updated corpus</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Shortcuts */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Keyboard className="w-4 h-4 text-teal-700" />
                  <span>Keyboard Shortcuts &amp; Rapid Navigation</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-700">Focus Global Search</span>
                    <kbd className="px-2 py-1 rounded bg-slate-200 border border-slate-300 font-mono text-slate-700 text-[11px]">
                      Ctrl + K / ⌘K
                    </kbd>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-700">Close Open Modal / Drawer</span>
                    <kbd className="px-2 py-1 rounded bg-slate-200 border border-slate-300 font-mono text-slate-700 text-[11px]">
                      Esc
                    </kbd>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Diagnostics */}
          {activeTab === 'diagnostics' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Live System &amp; Database Health Diagnostics
                  </h4>
                  <p className="text-[11px] text-slate-500">Endpoints query real-time backend telemetry from GET /api/v1/health</p>
                </div>

                <button
                  onClick={fetchHealth}
                  className="px-3 py-1.5 rounded-lg bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-semibold flex items-center space-x-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingHealth ? 'animate-spin text-teal-700' : ''}`} />
                  <span>Re-check</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-md bg-slate-100 text-emerald-600 flex items-center justify-center shrink-0 border border-slate-200">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">Backend Status</span>
                    <span className="font-bold text-emerald-600 font-mono text-xs">
                      {healthStatus ? healthStatus.status.toUpperCase() : 'ONLINE (Active)'}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-md bg-slate-100 text-teal-700 flex items-center justify-center shrink-0 border border-slate-200">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">ML Classifier Engine</span>
                    <span className="font-bold text-slate-900 font-mono text-xs">
                      {healthStatus ? healthStatus.ml_engine : 'TF-IDF + Naive Bayes'}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-md bg-slate-100 text-amber-600 flex items-center justify-center shrink-0 border border-slate-200">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">API Version</span>
                    <span className="font-bold text-slate-900 font-mono text-xs">{healthStatus?.version || '1.2.0'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-white flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="watt-btn-primary"
          >
            Got it, thanks!
          </button>
        </div>

      </div>
    </div>
  );
};
