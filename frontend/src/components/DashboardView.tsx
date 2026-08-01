import React, { useState, useEffect } from 'react';
import { 
  Calendar, ArrowUpRight, 
  CheckCircle2, Download, Activity, TrendingUp,
  Mail, Cpu, Database
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { exportService, emailService } from '../services/api';
import type { DashboardAnalytics, ResearchPaper, User } from '../types';

interface DashboardViewProps {
  analytics: DashboardAnalytics | null;
  recentPapers: ResearchPaper[];
  onSelectPaper: (paper: ResearchPaper) => void;
  onNavigateToRepo: () => void;
  user?: User | null;
  onRefresh?: () => void;
  onSelectAuthor?: (authorName: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  analytics,
  recentPapers,
  onSelectPaper,
  onNavigateToRepo,
  user,
  onRefresh,
  onSelectAuthor,
}) => {
  const [dateRange, setDateRange] = useState('30d');
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => localStorage.getItem('promptflow_last_sync_time'));

  useEffect(() => {
    if (!lastSyncTime) {
      emailService.getLogs(1)
        .then(logs => {
          if (logs && logs.length > 0) {
            const latestLogTime = logs[0].received_at;
            if (latestLogTime) {
              setLastSyncTime(latestLogTime);
              localStorage.setItem('promptflow_last_sync_time', latestLogTime);
            }
          }
        })
        .catch(err => console.error("Error fetching latest log for sync time:", err));
    }
  }, [lastSyncTime]);

  const handleSyncEmails = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await emailService.sync();
      setSyncMessage(res.message || "Email synchronization completed successfully.");
      const now = new Date().toISOString();
      localStorage.setItem('promptflow_last_sync_time', now);
      setLastSyncTime(now);
      if (onRefresh) onRefresh();
      setTimeout(() => setSyncMessage(null), 4000);
    } catch (err: any) {
      setSyncMessage(err.response?.data?.detail || "Failed to synchronize emails.");
      setTimeout(() => setSyncMessage(null), 5000);
    } finally {
      setSyncing(false);
    }
  };

  const formatLastSync = (timeStr: string | null) => {
    if (!timeStr) return "Never synced";
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) return "Never synced";
    
    return `Last synced: ${date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })}`;
  };

  if (!analytics) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-brand-cyan border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-brand-gray">Loading promptFlow-AI Workspace &amp; PyMuPDF Intelligence...</p>
        </div>
      </div>
    );
  }

  const COLORS = ['#0d9488', '#f59e0b', '#34d399', '#64748b', '#b45309'];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const formattedName = user ? user.full_name.split(' ')[0] : 'Faculty';

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 font-sans selection:bg-slate-200 selection:text-slate-900 p-6 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
              {getGreeting()}, {formattedName}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
              Research Operations Workspace &amp; Ingestion Pipeline
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {/* Range selection */}
            <div className="inline-flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-2xs">
              <button
                onClick={() => setDateRange('30d')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
                  dateRange === '30d' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Last 30 Days</span>
              </button>
              <button
                onClick={() => setDateRange('90d')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  dateRange === '90d' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Quarter</span>
              </button>
            </div>
          </div>
        </div>

        {syncMessage && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{syncMessage}</span>
          </div>
        )}

        {/* 
          1. VISUAL JOURNEY PIPELINE RIBBON
        */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-6 md:gap-4 items-center relative">
            
            {/* Node 1: Faculty Email */}
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200 shadow-2xs">
                <Mail className="w-4 h-4 text-teal-700" />
              </div>
              <span className="text-xs font-bold text-slate-900 mt-2">Faculty Email</span>
              <span className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider font-semibold">Inbound</span>
            </div>

            {/* Connector Line 1 */}
            <div className="hidden md:block absolute left-[8.33%] right-[75%] top-4.5 h-[1.5px] bg-slate-200 z-0" />

            {/* Node 2: AI Classification */}
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200 shadow-2xs">
                <Activity className="w-4 h-4 text-teal-700" />
              </div>
              <span className="text-xs font-bold text-slate-900 mt-2">AI Classification</span>
              <span className="text-[10px] text-emerald-600 mt-0.5 font-bold">{(analytics.avg_ml_confidence * 100).toFixed(0)}% accuracy</span>
            </div>

            {/* Connector Line 2 */}
            <div className="hidden md:block absolute left-[25%] right-[58.33%] top-4.5 h-[1.5px] bg-slate-200 z-0" />

            {/* Node 3: Metadata Extraction */}
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200 shadow-2xs">
                <Cpu className="w-4 h-4 text-teal-700" />
              </div>
              <span className="text-xs font-bold text-slate-900 mt-2">Metadata Extract</span>
              <span className="text-[10px] text-slate-500 mt-0.5 font-mono">PyMuPDF parser</span>
            </div>

            {/* Connector Line 3 */}
            <div className="hidden md:block absolute left-[41.66%] right-[41.66%] top-4.5 h-[1.5px] bg-slate-200 z-0" />

            {/* Node 4: Repository Indexing */}
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200 shadow-2xs">
                <Database className="w-4 h-4 text-teal-700" />
              </div>
              <span className="text-xs font-bold text-slate-900 mt-2">Repository Index</span>
              <span className="text-[10px] text-slate-500 mt-0.5 font-semibold">Database Store</span>
            </div>

            {/* Connector Line 4 */}
            <div className="hidden md:block absolute left-[58.33%] right-[25%] top-4.5 h-[1.5px] bg-slate-200 z-0" />

            {/* Node 5: Analytics */}
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200 shadow-2xs">
                <TrendingUp className="w-4 h-4 text-teal-700" />
              </div>
              <span className="text-xs font-bold text-slate-900 mt-2">Analytics</span>
              <span className="text-[10px] text-slate-500 mt-0.5 font-semibold">{analytics.total_departments} disciplines</span>
            </div>

            {/* Connector Line 5 */}
            <div className="hidden md:block absolute left-[75%] right-[8.33%] top-4.5 h-[1.5px] bg-slate-200 z-0" />

            {/* Node 6: Recent Publications */}
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-xs font-bold text-slate-900 mt-2">Recent Pubs</span>
              <span className="text-[10px] text-emerald-600 mt-0.5 uppercase tracking-wider font-bold">Live feed</span>
            </div>

          </div>
        </div>

        {/* 2. OPERATIONS ROW 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Publication growth index curves */}
          <div className="watt-card p-5 bg-white border border-slate-200/80 rounded-xl flex flex-col justify-between lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-teal-700 shrink-0" />
                  <span>Publication Growth Index</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Database storage indices and chronological extraction curves</p>
              </div>
              <span className="text-xs font-semibold text-slate-700">
                Active Repository
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.by_year} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f766e" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#0f766e" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="year" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    itemStyle={{ color: '#0f766e' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#0f766e" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right Column: Ingestion Operations Console */}
          <div className="watt-card p-5 bg-white border border-slate-200/80 rounded-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Weekly Inbound Stream</span>
                <span className="text-xs text-emerald-600 font-semibold">
                  ONLINE
                </span>
              </div>

              {/* Sync Trigger button */}
              <div className="mt-4">
                <button
                  onClick={handleSyncEmails}
                  disabled={syncing}
                  className="w-full watt-btn-primary"
                  title="Poll inbox for new unseen publication announcement emails"
                >
                  <Activity className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                  <span>{syncing ? 'Ingestion Sync Active...' : 'Poll Inbound Email Gate'}</span>
                </button>
                <p className="text-[10px] text-slate-500 mt-1.5 font-medium text-center">
                  {formatLastSync(lastSyncTime)}
                </p>
              </div>

              {/* Ingestion stats */}
              <div className="grid grid-cols-2 gap-2.5 mt-4 pt-4 border-t border-slate-200">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Total Papers</p>
                  <p className="text-base font-extrabold text-slate-900 mt-0.5 font-mono">{analytics.total_papers}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Citations</p>
                  <p className="text-base font-extrabold text-slate-900 mt-0.5 font-mono">
                    {recentPapers.reduce((acc, p) => acc + (p.citation_count || 0), 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Small bar chart */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Ingestion Flow Volume</p>
              <div className="h-24 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.by_year.slice(-4)} margin={{ top: 5, right: 0, left: -30, bottom: 0 }}>
                    <XAxis dataKey="year" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                    <Bar dataKey="count" fill="#0f766e" radius={[4, 4, 0, 0]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>

        {/* 3. OPERATIONS ROW 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Ingestions Table */}
          <div className="watt-card p-5 bg-white border border-slate-200/80 rounded-xl flex flex-col justify-between lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Recent Ingestions &amp; Activity Log</h3>
                <p className="text-xs text-slate-500 mt-0.5">Real-time database index logs and parser states</p>
              </div>
              <button
                onClick={onNavigateToRepo}
                className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center space-x-1 cursor-pointer"
              >
                <span>View Full Repository</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4 pl-0">Research Publication Title</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Year</th>
                    <th className="py-3 px-4">ML Conf.</th>
                    <th className="py-3 px-4 text-right pr-0">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {recentPapers.slice(0, 5).map((paper) => (
                    <tr
                      key={paper.id}
                      onClick={() => onSelectPaper(paper)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 pl-0 font-semibold text-slate-900 group-hover:text-teal-700 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-200">
                            {paper.authors_raw ? paper.authors_raw.charAt(0) : 'P'}
                          </div>
                          <div className="truncate max-w-xs sm:max-w-md">
                            <p className="truncate text-sm font-bold text-slate-900">{paper.title}</p>
                            <p 
                              onClick={(e) => {
                                if (onSelectAuthor && paper.authors_raw) {
                                  e.stopPropagation();
                                  const firstAuthor = paper.authors_raw.split(',')[0].trim();
                                  onSelectAuthor(firstAuthor);
                                }
                              }}
                              className="text-xs text-slate-500 hover:text-teal-700 truncate font-normal transition-colors cursor-pointer mt-0.5"
                            >
                              {paper.authors_raw || 'College Faculty'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-slate-700">
                          {paper.department || 'General'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">{paper.publication_year}</td>
                      <td className="py-3.5 px-4">
                        <span className="text-emerald-600 font-mono font-bold text-sm">
                          {(paper.ml_confidence * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right pr-0">
                        <span className="text-xs font-bold text-emerald-600">
                          INDEXED
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column: Categories */}
          <div className="watt-card p-5 bg-white border border-slate-200/80 rounded-xl flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2 mb-1">
                <TrendingUp className="w-4 h-4 text-teal-700 shrink-0" />
                <span>Academic Categories</span>
              </h3>
              <p className="text-xs text-slate-500">Publication distribution by departments</p>

              {/* Expanded Pie Chart with Tooltip */}
              <div className="h-48 w-full my-3">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', fontSize: '12px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                      formatter={(val: any, name: any) => [`${val} papers`, name]}
                    />
                    <Pie
                      data={analytics.by_department}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={4}
                      dataKey="count"
                      nameKey="department"
                      stroke="#ffffff"
                      strokeWidth={3}
                    >
                      {analytics.by_department.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Expanded Research Category Bars */}
              <div className="space-y-3 pt-3 border-t border-slate-200 text-xs">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Top Field Categories</span>
                  <span>Volume Distribution</span>
                </div>
                {analytics.by_category.slice(0, 5).map((cat, idx) => {
                  const total = analytics.by_category.reduce((sum, item) => sum + item.count, 0);
                  const pct = total > 0 ? ((cat.count / total) * 100).toFixed(0) : 0;
                  return (
                    <div key={cat.category} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-800 truncate max-w-48">{cat.category}</span>
                        <span className="text-slate-600 font-mono flex items-center gap-1.5">
                          <span className="text-slate-400 font-normal">({cat.count})</span>
                          <strong className="text-slate-900">{pct}%</strong>
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-md bg-slate-100 overflow-hidden border border-slate-200/50">
                        <div 
                          className="h-full rounded-md transition-all duration-500"
                          style={{ 
                            width: `${pct}%`,
                            backgroundColor: COLORS[idx % COLORS.length]
                          }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Export pdf action */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <button
                onClick={() => exportService.downloadPdf()}
                className="w-full px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-2"
                title="Download Formatted PDF Ingestion Report"
              >
                <Download className="w-4 h-4 text-white stroke-[2.5]" />
                <span>Export Operations Report (PDF)</span>
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
