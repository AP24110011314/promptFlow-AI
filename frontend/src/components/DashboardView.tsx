import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Users, Building2, Award, Calendar, ArrowUpRight, 
  CheckCircle2, Download, Activity, TrendingUp
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
          <p className="text-sm font-semibold text-brand-gray">Loading promptFlow-AI Dashboard &amp; PyMuPDF Intelligence...</p>
        </div>
      </div>
    );
  }

  const COLORS = ['#0071E3', '#5856D6', '#34C759', '#FF9500', '#AF52DE'];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const formattedName = user ? user.full_name.split(' ')[0] : 'Faculty Member';

  return (
    <div className="flex flex-col lg:flex-row min-h-full bg-brand-bg text-white font-sans">
      
      {/* Center / Main Column: Analytics & KPI Grid */}
      <div className="flex-1 p-6 sm:p-8 space-y-8 min-w-0 overflow-hidden">
        
        {/* Title / Greetings & Action Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {getGreeting()}, {formattedName}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-brand-gray mt-1 font-medium">
              Welcome to the promptFlow-AI Research Hub. Here is what is happening across academic publications today.
            </p>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Date Range Pill */}
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

              {/* Export PDF Button */}
              <button
                onClick={() => exportService.downloadPdf()}
                className="px-3.5 py-2 rounded-xl bg-brand-cyan hover:brightness-110 text-real-white font-bold text-xs shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer"
                title="Download Formatted PDF Report (.pdf)"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Export PDF</span>
              </button>

              {/* Sync Emails Button */}
              <button
                onClick={handleSyncEmails}
                disabled={syncing}
                className="px-3.5 py-2 rounded-xl border border-brand-cyan/30 text-brand-cyan hover:bg-brand-cyan/10 font-bold text-xs shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                title="Poll inbox for new unseen publication announcement emails"
              >
                <Activity className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                <span>{syncing ? 'Syncing...' : 'Sync Emails'}</span>
              </button>
            </div>
            <span className="text-[10px] text-brand-gray/80 font-medium tracking-wide">
              {formatLastSync(lastSyncTime)}
            </span>
          </div>
        </div>

        {syncMessage && (
          <div className="p-3.5 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-xs font-semibold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-brand-cyan" />
            <span>{syncMessage}</span>
          </div>
        )}

        {/* 4 KPI Metric Cards Row (Fixed bubble overlap with gap and shrink-0) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="watt-card flex flex-col justify-between overflow-hidden">
            <div className="flex items-start justify-between gap-2 w-full">
              <span className="text-[11px] font-bold text-brand-gray uppercase tracking-wider leading-snug break-words">
                Total Publications
              </span>
              <span className="px-2 py-0.5 rounded-full bg-brand-green/10 text-brand-green border border-brand-green/20 text-[10px] font-extrabold shrink-0 whitespace-nowrap shadow-2xs">
                +12%
              </span>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="watt-metric">{analytics.total_papers}</span>
              <div className="p-2 rounded-xl bg-brand-cyan/10 text-brand-cyan shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div className="watt-card flex flex-col justify-between overflow-hidden">
            <div className="flex items-start justify-between gap-2 w-full">
              <span className="text-[11px] font-bold text-brand-gray uppercase tracking-wider leading-snug break-words">
                Active Faculty
              </span>
              <span className="px-2 py-0.5 rounded-full bg-brand-green/10 text-brand-green border border-brand-green/20 text-[10px] font-extrabold shrink-0 whitespace-nowrap shadow-2xs">
                +5%
              </span>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="watt-metric">{analytics.total_authors}</span>
              <div className="p-2 rounded-xl bg-brand-cyan/10 text-brand-cyan shrink-0">
                <Users className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div className="watt-card flex flex-col justify-between overflow-hidden">
            <div className="flex items-start justify-between gap-2 w-full">
              <span className="text-[11px] font-bold text-brand-gray uppercase tracking-wider leading-snug break-words">
                ML Accuracy Rate
              </span>
              <span className="px-2 py-0.5 rounded-full bg-brand-green/10 text-brand-green border border-brand-green/20 text-[10px] font-extrabold shrink-0 whitespace-nowrap shadow-2xs">
                +1.5%
              </span>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="watt-metric">{(analytics.avg_ml_confidence * 100).toFixed(1)}%</span>
              <div className="p-2 rounded-xl bg-brand-green/10 text-brand-green shrink-0">
                <Award className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div className="watt-card flex flex-col justify-between overflow-hidden">
            <div className="flex items-start justify-between gap-2 w-full">
              <span className="text-[11px] font-bold text-brand-gray uppercase tracking-wider leading-snug break-words">
                Departments
              </span>
              <span className="px-2 py-0.5 rounded-full bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20 text-[10px] font-extrabold shrink-0 whitespace-nowrap shadow-2xs">
                100%
              </span>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="watt-metric">{analytics.total_departments}</span>
              <div className="p-2 rounded-xl bg-brand-cyan/10 text-brand-cyan shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
          </div>

        </div>

        {/* Middle Section: Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Chart: Publication Output Stream */}
          <div className="watt-card lg:col-span-2 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-brand-cyan" />
                  <span>Publication Output Stream</span>
                </h3>
                <p className="text-xs text-brand-gray">Automated email ingestion &amp; repository growth</p>
              </div>
              <span className="text-xs font-semibold text-brand-cyan px-2.5 py-1 rounded-lg bg-brand-cyan/10 border border-brand-cyan/20">
                Live Feed
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.by_year} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0071E3" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0071E3" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="year" stroke="#86868B" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#86868B" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1C1C1E', borderColor: '#2C2C2E', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                    itemStyle={{ color: '#0071E3' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#0071E3" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Secondary Chart: Top Departments */}
          <div className="watt-card flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2 mb-1">
                <TrendingUp className="w-4 h-4 text-brand-cyan" />
                <span>Top Departments</span>
              </h3>
              <p className="text-xs text-brand-gray">Distribution by academic discipline</p>
            </div>

            <div className="h-48 w-full my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.by_department}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="department"
                  >
                    {analytics.by_department.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1C1C1E', borderColor: '#2C2C2E', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Custom Legend */}
            <div className="space-y-2 pt-2 border-t border-brand-border text-xs">
              {analytics.by_department.slice(0, 3).map((dept, index) => {
                const total = analytics.by_department.reduce((sum, item) => sum + item.count, 0);
                const pct = total > 0 ? ((dept.count / total) * 100).toFixed(0) : 0;
                return (
                  <div key={dept.department} className="flex items-center justify-between font-medium">
                    <div className="flex items-center space-x-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="truncate text-brand-gray">{dept.department}</span>
                    </div>
                    <span className="font-bold text-white shrink-0">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Bottom Section: Recent Ingestions & Activity Table */}
        <div className="watt-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Recent Ingestions &amp; Activity</h3>
              <p className="text-xs text-brand-gray">Real-time PyMuPDF parser and Scikit-Learn classifier feed</p>
            </div>
            <button
              onClick={onNavigateToRepo}
              className="text-xs font-semibold text-brand-cyan hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <span>View Full Repository</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-border text-[11px] font-bold text-brand-gray uppercase tracking-wider">
                  <th className="py-3 px-4">Research Publication Title</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Year</th>
                  <th className="py-3 px-4">ML Conf.</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border text-xs">
                {recentPapers.slice(0, 5).map((paper) => (
                  <tr
                    key={paper.id}
                    onClick={() => onSelectPaper(paper)}
                    className="hover:bg-brand-hover/50 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-semibold text-white group-hover:text-brand-cyan transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-brand-cyan/10 text-brand-cyan flex items-center justify-center font-bold text-xs shrink-0">
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
                            className="text-[11px] text-brand-gray hover:text-brand-cyan truncate font-normal transition-colors cursor-pointer"
                          >
                            {paper.authors_raw || 'College Faculty'}
                          </p>

                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-brand-bg border border-brand-border text-[11px] font-medium text-brand-gray whitespace-nowrap max-w-[150px] truncate" title={paper.department || 'General'}>
                        {paper.department || 'General'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-brand-gray font-medium">{paper.publication_year}</td>
                    <td className="py-3.5 px-4">
                      <span className="text-brand-green font-bold">
                        {(paper.ml_confidence * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-brand-green/10 text-brand-green border border-brand-green/20 text-[10px] font-bold uppercase tracking-wider">
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

      </div>

      {/* Right Column / Sidebar: Dedicated exclusively to Dashboard Page */}
      <aside className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-brand-border bg-brand-card/30 p-6 flex flex-col justify-between space-y-6 shrink-0">
        
        <div className="space-y-6">
          {/* Section 1: Live Report Card */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-gray flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse" />
                <span>Live Analytics Report</span>
              </h4>
              <span className="text-[10px] text-brand-gray font-mono">LIVE</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-2xl bg-brand-card border border-brand-border">
                <p className="text-[10px] text-brand-gray uppercase font-semibold">Citations</p>
                <p className="text-base font-bold text-white mt-0.5">
                  {recentPapers.reduce((acc, p) => acc + (p.citation_count || 0), 0)}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-brand-card border border-brand-border">
                <p className="text-[10px] text-brand-gray uppercase font-semibold">Indexed DOIs</p>
                <p className="text-base font-bold text-white mt-0.5">{analytics.total_papers}</p>
              </div>
              <div className="p-3 rounded-2xl bg-brand-card border border-brand-border">
                <p className="text-[10px] text-brand-gray uppercase font-semibold">Avg. Conf</p>
                <p className="text-base font-bold text-brand-green mt-0.5">
                  {(analytics.avg_ml_confidence * 100).toFixed(1)}%
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-brand-card border border-brand-border">
                <p className="text-[10px] text-brand-gray uppercase font-semibold">Categories</p>
                <p className="text-base font-bold text-white mt-0.5">{analytics.by_category.length}</p>
              </div>
            </div>
          </div>

          {/* Section 2: Weekly Ingestion Stream Bar Chart */}
          <div className="space-y-3 pt-4 border-t border-brand-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-gray">Weekly Ingestion</span>
              <span className="text-[10px] text-brand-cyan font-semibold">7 Days</span>
            </div>

            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.by_year.slice(-4)} margin={{ top: 5, right: 0, left: -30, bottom: 0 }}>
                  <XAxis dataKey="year" stroke="#86868B" fontSize={10} tickLine={false} axisLine={false} />
                  <Bar dataKey="count" fill="#0071E3" radius={[6, 6, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Section 3: Research Category Distribution */}
          <div className="space-y-3 pt-4 border-t border-brand-border">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-gray block">Top Research Areas</span>
            
            <div className="space-y-2.5">
              {analytics.by_category.slice(0, 4).map((cat, idx) => {
                const total = analytics.by_category.reduce((sum, item) => sum + item.count, 0);
                const pct = total > 0 ? ((cat.count / total) * 100).toFixed(0) : 0;
                return (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-white truncate max-w-[180px]">{cat.category}</span>
                      <span className="text-brand-gray font-mono">{pct}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-brand-bg overflow-hidden">
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

          {/* Section 4: Recent Ingested Publications */}
          <div className="space-y-3 pt-4 border-t border-brand-border">
            <div className="flex items-center justify-between text-xs font-bold text-brand-gray uppercase tracking-wider">
              <span>Recent Activity</span>
              <button onClick={onNavigateToRepo} className="text-[10px] text-brand-cyan font-bold hover:underline cursor-pointer">
                VIEW ALL
              </button>
            </div>

            <div className="space-y-2.5">
              {recentPapers.slice(0, 3).map((paper) => (
                <div key={paper.id} onClick={() => onSelectPaper(paper)} className="flex items-center justify-between p-2.5 rounded-2xl bg-brand-bg hover:bg-brand-hover transition-colors cursor-pointer group">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-brand-cyan/10 text-brand-cyan font-bold text-[11px] flex items-center justify-center shrink-0 group-hover:bg-brand-cyan group-hover:text-real-white transition-all">
                      {paper.title ? paper.title.charAt(0) : 'P'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate group-hover:text-brand-cyan transition-colors">{paper.title}</p>
                      <p className="text-[10px] text-brand-gray truncate">{paper.department || 'General'} • {paper.publication_year}</p>
                    </div>
                  </div>
                  <span className="ml-2 px-2 py-0.5 rounded text-[9px] font-extrabold bg-brand-green/10 text-brand-green border border-brand-green/20 shrink-0">
                    SUCCESS
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>



      </aside>

    </div>
  );
};
