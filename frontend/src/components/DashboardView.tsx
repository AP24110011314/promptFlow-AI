import React from 'react';
import { BookOpen, Users, Building2, Mail, Award, ArrowUpRight, Sparkles, Tag, Calendar, CheckCircle2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import type { DashboardAnalytics, ResearchPaper } from '../types';

interface DashboardViewProps {
  analytics: DashboardAnalytics | null;
  recentPapers: ResearchPaper[];
  onSelectPaper: (paper: ResearchPaper) => void;
  onNavigateToRepo: () => void;
}

const COLORS = ['#6366f1', '#06b6d4', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#14b8a6'];

export const DashboardView: React.FC<DashboardViewProps> = ({
  analytics,
  recentPapers,
  onSelectPaper,
  onNavigateToRepo,
}) => {
  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center space-x-3 text-indigo-400">
          <Sparkles className="w-6 h-6 animate-spin" />
          <span className="text-sm font-semibold">Loading CRD Research Intelligence Data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900/40 via-slate-900/80 to-cyan-900/30 border border-slate-800/80 p-6 sm:p-8 shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI & Machine Learning Powered Research Digest</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Academic Research Output Overview
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Automated email parsing, scikit-learn department classification, and extractive NLP summaries streamlining college publication tracking.
            </p>
          </div>
          <button
            onClick={onNavigateToRepo}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-semibold text-sm shadow-lg hover:from-indigo-500 hover:to-cyan-400 transition-all flex items-center justify-center space-x-2 shrink-0 self-start md:self-center"
          >
            <span>Explore Repository</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Papers</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white">{analytics.total_papers}</span>
            <span className="text-xs text-indigo-400 font-semibold flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> 100% indexed
            </span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Faculty Authors</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white">{analytics.total_authors}</span>
            <span className="text-xs text-cyan-400 font-semibold">Active Contributors</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Departments</span>
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white">{analytics.total_departments}</span>
            <span className="text-xs text-violet-400 font-semibold">Across College</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Emails Ingested</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Mail className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white">{analytics.total_emails_processed}</span>
            <span className="text-xs text-blue-400 font-semibold">Auto-parsed</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">ML Accuracy</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-400">
              {(analytics.avg_ml_confidence * 100).toFixed(1)}%
            </span>
            <span className="text-xs text-slate-400 font-semibold">Scikit-Learn NB/RF</span>
          </div>
        </div>
      </div>

      {/* Interactive Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Department Output Bar Chart */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-slate-800/80 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-indigo-400" />
              <span>Publications by Academic Department</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Distribution of indexed research papers across college faculties
            </p>
          </div>
          <div className="h-64 mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.by_department} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="department" stroke="#64748b" fontSize={11} interval={0} angle={-15} textAnchor="end" />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  itemStyle={{ color: '#818cf8' }}
                />
                <Bar dataKey="count" name="Publications" radius={[6, 6, 0, 0]}>
                  {analytics.by_department.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Pie Chart */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800/80 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Tag className="w-4 h-4 text-cyan-400" />
              <span>Top Research Categories</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Automatically tagged by NLP keyword heuristics
            </p>
          </div>
          <div className="h-64 mt-4 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.by_category}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="category"
                  label={({ name, percent }: any) => `${name?.split(' ')[0]} (${((percent || 0) * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {analytics.by_category.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Recent AI-Summarized Publications Feed */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span>Recent Extracted Research Publications</span>
            </h2>
            <p className="text-xs text-slate-400">
              Click any publication to view full metadata, AI extractive summary, and PDF report options.
            </p>
          </div>
          <button
            onClick={onNavigateToRepo}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center space-x-1"
          >
            <span>View All Papers</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentPapers.slice(0, 4).map((paper) => (
            <div
              key={paper.id}
              onClick={() => onSelectPaper(paper)}
              className="glass-card rounded-2xl p-5 border border-slate-800/80 hover:border-indigo-500/40 cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[11px] font-semibold">
                    {paper.department || 'General'}
                  </span>
                  <div className="flex items-center space-x-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>ML Conf: {(paper.ml_confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-white mt-3 group-hover:text-indigo-300 transition-colors line-clamp-2">
                  {paper.title}
                </h3>

                <p className="text-xs text-slate-400 mt-2 line-clamp-2 italic bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
                  “{paper.ai_summary || paper.abstract || 'No summary available.'}”
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center space-x-2 truncate max-w-[70%]">
                  <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{paper.authors_raw || 'College Faculty'}</span>
                </div>
                <div className="flex items-center space-x-1 text-slate-500 shrink-0">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{paper.publication_year}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
