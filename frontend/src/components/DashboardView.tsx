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

  const COLORS = ['#4f46e5', '#38BDF8', '#34d399', '#f59e0b', '#af52de'];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const formattedName = user ? user.full_name.split(' ')[0] : 'Faculty';

  return (
    <div className="min-h-screen w-full bg-brand-bg text-white font-sans selection:bg-brand-cyan selection:text-white p-6 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER SECTION: Workspace Greeting & Filter controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-brand-border/40 pb-5">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-extrabold tracking-tight text-white leading-tight">
              {getGreeting()}, {formattedName}! 👋
            </h1>
            <p className="text-[14px] text-brand-gray mt-1.5 font-medium">
              Research Operations Workspace &amp; Ingestion Pipeline
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {/* Range selection */}
            <div className="inline-flex items-center bg-brand-card border border-brand-border rounded-xl p-1 shadow-2xs">
              <button
                onClick={() => setDateRange('30d')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
                  dateRange === '30d' ? 'bg-brand-cyan text-real-white shadow-2xs' : 'text-brand-gray hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Last 30 Days</span>
              </button>
              <button
                onClick={() => setDateRange('90d')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  dateRange === '90d' ? 'bg-brand-cyan text-real-white shadow-2xs' : 'text-brand-gray hover:text-white'
                }`}
              >
                <span>Quarter</span>
              </button>
            </div>
          </div>
        </div>

        {syncMessage && (
          <div className="p-3.5 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-xs font-semibold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-brand-cyan" />
            <span>{syncMessage}</span>
          </div>
        )}

        {/* 
          1. VISUAL JOURNEY PIPELINE RIBBON:
          Explains core app functions in 5 seconds without reading text!
        */}
        <div className="bg-brand-card/45 border border-brand-border/40 rounded-[24px] p-5 shadow-2xs">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-6 md:gap-4 items-center relative">
            
            {/* Node 1: Faculty Email */}
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-10 h-10 rounded-full bg-brand-cyan/10 text-brand-cyan flex items-center justify-center border border-brand-cyan/20 shadow-2xs">
                <Mail className="w-5 h-5 animate-pulse" />
              </div>
              <span className="text-[12px] font-bold text-white mt-2">Faculty Email</span>
              <span className="text-[10px] text-brand-gray mt-0.5 uppercase tracking-widest font-bold">Inbound</span>
            </div>

            {/* Connector Line 1 */}
            <div className="hidden md:block absolute left-[8.33%] right-[75%] top-5 h-[1.5px] bg-brand-border/50 z-0" />

            {/* Node 2: AI Classification */}
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-10 h-10 rounded-full bg-brand-cyan/10 text-brand-cyan flex items-center justify-center border border-brand-cyan/20 shadow-2xs">
                <Activity className="w-5 h-5" />
              </div>
              <span className="text-[12px] font-bold text-white mt-2">AI Classification</span>
              <span className="text-[10px] text-brand-green mt-0.5 font-bold">{(analytics.avg_ml_confidence * 100).toFixed(0)}% accuracy</span>
            </div>

            {/* Connector Line 2 */}
            <div className="hidden md:block absolute left-[25%] right-[58.33%] top-5 h-[1.5px] bg-brand-border/50 z-0" />

            {/* Node 3: Metadata Extraction */}
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-10 h-10 rounded-full bg-brand-cyan/10 text-brand-cyan flex items-center justify-center border border-brand-cyan/20 shadow-2xs">
                <Cpu className="w-5 h-5" />
              </div>
              <span className="text-[12px] font-bold text-white mt-2">Metadata Extract</span>
              <span className="text-[10px] text-brand-gray mt-0.5 font-mono">PyMuPDF parser</span>
            </div>

            {/* Connector Line 3 */}
            <div className="hidden md:block absolute left-[41.66%] right-[41.66%] top-5 h-[1.5px] bg-brand-border/50 z-0" />

            {/* Node 4: Repository Indexing */}
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-10 h-10 rounded-full bg-brand-cyan/10 text-brand-cyan flex items-center justify-center border border-brand-cyan/20 shadow-2xs">
                <Database className="w-5 h-5" />
              </div>
              <span className="text-[12px] font-bold text-white mt-2">Repository Index</span>
              <span className="text-[10px] text-brand-gray mt-0.5 font-bold">Database Store</span>
            </div>

            {/* Connector Line 4 */}
            <div className="hidden md:block absolute left-[58.33%] right-[25%] top-5 h-[1.5px] bg-brand-border/50 z-0" />

            {/* Node 5: Analytics */}
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-10 h-10 rounded-full bg-brand-cyan/10 text-brand-cyan flex items-center justify-center border border-brand-cyan/20 shadow-2xs">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-[12px] font-bold text-white mt-2">Analytics</span>
              <span className="text-[10px] text-brand-gray mt-0.5 font-bold">{analytics.total_departments} disciplines</span>
            </div>

            {/* Connector Line 5 */}
            <div className="hidden md:block absolute left-[75%] right-[8.33%] top-5 h-[1.5px] bg-brand-border/50 z-0" />

            {/* Node 6: Recent Publications */}
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-10 h-10 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center border border-brand-green/20 shadow-2xs">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="text-[12px] font-bold text-white mt-2">Recent Pubs</span>
              <span className="text-[10px] text-brand-green mt-0.5 uppercase tracking-widest font-extrabold shadow-2xs">Live feed</span>
            </div>

          </div>
        </div>

        {/* 2. OPERATIONS ROW 1: Asymmetrical Composition */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column (Wider, lg:col-span-2): Publication growth index curves (White Card) */}
          <div className="watt-card p-5 bg-brand-card border border-brand-border rounded-[28px] shadow-sm flex flex-col justify-between lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[18px] font-bold text-white flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-brand-cyan shrink-0" />
                  <span>Publication Growth Index</span>
                </h3>
                <p className="text-[14px] text-brand-gray mt-0.5">Database storage indices and chronological extraction curves</p>
              </div>
              <span className="text-[12px] font-semibold text-brand-cyan px-2.5 py-1 rounded-lg bg-brand-cyan/10 border border-brand-cyan/20 shrink-0">
                Active Repository
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.by_year} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="year" stroke="#86868B" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#86868B" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1C1C1E', borderColor: '#2C2C2E', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                    itemStyle={{ color: '#4f46e5' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right Column (Narrower, lg:col-span-1): Ingestion Operations Console (Warm-Grey Card) */}
          <div className="p-5 bg-brand-card/45 border border-brand-border/40 rounded-[28px] shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold uppercase tracking-wider text-brand-gray">Weekly Inbound Stream</span>
                <span className="text-[10px] text-brand-green font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
                  ONLINE
                </span>
              </div>

              {/* Sync Trigger button */}
              <div className="mt-4">
                <button
                  onClick={handleSyncEmails}
                  disabled={syncing}
                  className="w-full py-2.5 rounded-xl bg-brand-cyan hover:brightness-110 text-real-white font-bold text-xs shadow-sm transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  title="Poll inbox for new unseen publication announcement emails"
                >
                  <Activity className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                  <span>{syncing ? 'Ingestion Sync Active...' : 'Poll Inbound Email Gate'}</span>
                </button>
                <p className="text-[10px] text-brand-gray/80 mt-1.5 font-medium text-center">
                  {formatLastSync(lastSyncTime)}
                </p>
              </div>

              {/* Ingestion stats */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-brand-border/40">
                <div className="p-2.5 rounded-xl bg-brand-card/90 border border-brand-border/40">
                  <p className="text-[11px] text-brand-gray uppercase font-semibold">Total Papers</p>
                  <p className="text-lg font-extrabold text-white mt-0.5">{analytics.total_papers}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-brand-card/90 border border-brand-border/40">
                  <p className="text-[11px] text-brand-gray uppercase font-semibold">Citations</p>
                  <p className="text-lg font-extrabold text-white mt-0.5">
                    {recentPapers.reduce((acc, p) => acc + (p.citation_count || 0), 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Small bar chart */}
            <div className="mt-4 pt-4 border-t border-brand-border/40">
              <p className="text-[11px] font-bold text-brand-gray uppercase tracking-wider mb-2">Ingestion Flow Volume</p>
              <div className="h-24 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.by_year.slice(-4)} margin={{ top: 5, right: 0, left: -30, bottom: 0 }}>
                    <XAxis dataKey="year" stroke="#86868B" fontSize={9} tickLine={false} axisLine={false} />
                    <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>

        {/* 3. OPERATIONS ROW 2: Asymmetrical Composition */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column (Wider, lg:col-span-2): Ingestions Table (White Card) */}
          <div className="watt-card p-5 bg-brand-card border border-brand-border rounded-[28px] shadow-sm flex flex-col justify-between lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg sm:text-xl lg:text-[22px] font-bold text-white tracking-tight">Recent Ingestions &amp; Activity Log</h3>
                <p className="text-[14px] text-brand-gray mt-0.5">Real-time database index logs and parser states</p>
              </div>
              <button
                onClick={onNavigateToRepo}
                className="text-[12px] font-semibold text-brand-cyan hover:underline flex items-center space-x-1 cursor-pointer"
              >
                <span>View Full Repository</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-brand-border/40 text-[12px] font-bold text-brand-gray uppercase tracking-wider">
                    <th className="py-2.5 px-4 pl-0">Research Publication Title</th>
                    <th className="py-2.5 px-4">Department</th>
                    <th className="py-2.5 px-4">Year</th>
                    <th className="py-2.5 px-4">ML Conf.</th>
                    <th className="py-2.5 px-4 text-right pr-0">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/40 text-[12px]">
                  {recentPapers.slice(0, 5).map((paper) => (
                    <tr
                      key={paper.id}
                      onClick={() => onSelectPaper(paper)}
                      className="hover:bg-brand-hover/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-2 px-4 pl-0 font-semibold text-white group-hover:text-brand-cyan transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-brand-cyan/10 text-brand-cyan flex items-center justify-center font-bold text-[12px] shrink-0">
                            {paper.authors_raw ? paper.authors_raw.charAt(0) : 'P'}
                          </div>
                          <div className="truncate max-w-xs sm:max-w-md">
                            <p className="truncate text-sm font-bold text-white">{paper.title}</p>
                            <p 
                              onClick={(e) => {
                                if (onSelectAuthor && paper.authors_raw) {
                                  e.stopPropagation();
                                  const firstAuthor = paper.authors_raw.split(',')[0].trim();
                                  onSelectAuthor(firstAuthor);
                                }
                              }}
                              className="text-[12px] text-brand-gray hover:text-brand-cyan truncate font-normal transition-colors cursor-pointer mt-0.5"
                            >
                              {paper.authors_raw || 'College Faculty'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-4 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-brand-bg border border-brand-border text-[12px] font-medium text-brand-gray whitespace-nowrap max-w-37.5 truncate" title={paper.department || 'General'}>
                          {paper.department || 'General'}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-brand-gray font-medium">{paper.publication_year}</td>
                      <td className="py-2 px-4">
                        <span className="text-brand-green font-bold">
                          {(paper.ml_confidence * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="py-2 px-4 text-right pr-0">
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-brand-green/10 text-brand-green border border-brand-green/20 text-[12px] font-bold uppercase tracking-wider">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>SUCCESS</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column (Narrower, lg:col-span-1): Clusters & PDF Exports (White Card) */}
          <div className="watt-card p-5 bg-brand-card border border-brand-border rounded-[28px] shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-[18px] font-bold text-white flex items-center space-x-2 mb-1">
                <TrendingUp className="w-4 h-4 text-brand-cyan shrink-0" />
                <span>Academic Categories</span>
              </h3>
              <p className="text-[14px] text-brand-gray">Publication distribution by departments</p>

              {/* Small Pie Chart */}
              <div className="h-32 w-full my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.by_department}
                      cx="50%"
                      cy="50%"
                      innerRadius={36}
                      outerRadius={50}
                      paddingAngle={4}
                      dataKey="count"
                      nameKey="department"
                      stroke="var(--card-bg)"
                      strokeWidth={3}
                    >
                      {analytics.by_department.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Research progress clusters */}
              <div className="space-y-2 pt-2 border-t border-brand-border/40 text-[12px]">
                {analytics.by_category.slice(0, 3).map((cat, idx) => {
                  const total = analytics.by_category.reduce((sum, item) => sum + item.count, 0);
                  const pct = total > 0 ? ((cat.count / total) * 100).toFixed(0) : 0;
                  return (
                    <div key={cat.category} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-medium">
                        <span className="text-white truncate max-w-45">{cat.category}</span>
                        <span className="text-brand-gray font-mono">{pct}%</span>
                      </div>
                      <div className="w-full h-1 rounded-full bg-brand-bg overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
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
            <div className="mt-4 pt-4 border-t border-brand-border/40">
              <button
                onClick={() => exportService.downloadPdf()}
                className="w-full py-2.5 rounded-xl bg-brand-cyan hover:brightness-110 text-real-white font-bold text-xs shadow-sm transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                title="Download Formatted PDF Ingestion Report"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Operations Report</span>
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
