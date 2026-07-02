import React from 'react';
import { BookOpen, Users, Building2, Mail, Award, ArrowUpRight, Sparkles, Tag, Calendar, CheckCircle2, Zap } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import type { DashboardAnalytics, ResearchPaper } from '../types';

interface DashboardViewProps {
  analytics: DashboardAnalytics | null;
  recentPapers: ResearchPaper[];
  onSelectPaper: (paper: ResearchPaper) => void;
  onNavigateToRepo: () => void;
}

// Technical Color Palette matching the DESIGN.md spec
const COLORS = ['#00E5FF', '#32D74B', '#FF453A', '#98989D', '#BF5AF2', '#FF9F0A', '#64D2FF', '#FF375F'];

export const DashboardView: React.FC<DashboardViewProps> = ({
  analytics,
  recentPapers,
  onSelectPaper,
  onNavigateToRepo,
}) => {
  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center space-x-3 text-brand-cyan">
          <Sparkles className="w-6 h-6 animate-spin" />
          <span className="text-sm font-semibold">Loading CRD Research Intelligence Data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      
      {/* Welcome Banner - WattVision Theme */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-card border border-brand-border p-6 sm:p-8 shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-brand-cyan/5 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-xs font-semibold mb-3">
              <Zap className="w-3.5 h-3.5 fill-brand-cyan" />
              <span>AI & Machine Learning Powered Research Digest</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Academic Research Output Overview
            </h1>
            <p className="text-sm text-brand-gray mt-1 max-w-2xl font-sans">
              Automated email parsing, scikit-learn department classification, and extractive NLP summaries streamlining college publication tracking.
            </p>
          </div>
          <button
            onClick={onNavigateToRepo}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-cyan/80 text-brand-bg font-bold text-sm shadow-lg hover:brightness-110 transition-all flex items-center justify-center space-x-2 shrink-0 self-start md:self-center cursor-pointer"
          >
            <span>Explore Repository</span>
            <ArrowUpRight className="w-4 h-4 text-brand-bg stroke-[3]" />
          </button>
        </div>
      </div>

      {/* KPI Metric Cards using Fira Code / Mono spec */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="watt-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-brand-gray uppercase tracking-wider">Total Papers</span>
            <div className="p-2 rounded-xl bg-brand-cyan/10 text-brand-cyan">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="watt-metric">{analytics.total_papers}</span>
            <span className="text-xs text-brand-green font-semibold flex items-center">
              <Zap className="w-3.5 h-3.5 mr-0.5 fill-brand-green" /> 100%
            </span>
          </div>
        </div>

        <div className="watt-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-brand-gray uppercase tracking-wider">Faculty Authors</span>
            <div className="p-2 rounded-xl bg-brand-cyan/10 text-brand-cyan">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="watt-metric">{analytics.total_authors}</span>
            <span className="text-xs text-brand-gray font-semibold">Active</span>
          </div>
        </div>

        <div className="watt-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-brand-gray uppercase tracking-wider">Departments</span>
            <div className="p-2 rounded-xl bg-brand-cyan/10 text-brand-cyan">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="watt-metric">{analytics.total_departments}</span>
            <span className="text-xs text-brand-gray font-semibold">Faculties</span>
          </div>
        </div>

        <div className="watt-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-brand-gray uppercase tracking-wider">Emails Ingested</span>
            <div className="p-2 rounded-xl bg-brand-cyan/10 text-brand-cyan">
              <Mail className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="watt-metric">{analytics.total_emails_processed}</span>
            <span className="text-xs text-brand-green font-semibold">Processed</span>
          </div>
        </div>

        <div className="watt-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-brand-gray uppercase tracking-wider">ML Accuracy</span>
            <div className="p-2 rounded-xl bg-brand-green/10 text-brand-green glow-green">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="font-mono text-3xl font-bold tracking-tight text-brand-green">
              {(analytics.avg_ml_confidence * 100).toFixed(1)}%
            </span>
            <span className="text-[10px] text-brand-gray font-semibold">NB/RF</span>
          </div>
        </div>
      </div>

      {/* Interactive Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Department Output Bar Chart */}
        <div className="lg:col-span-2 watt-card flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-brand-cyan" />
              <span>Publications by Academic Department</span>
            </h3>
            <p className="text-xs text-brand-gray mt-0.5">
              Distribution of indexed research papers across college faculties
            </p>
          </div>
          <div className="h-64 mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.by_department} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="department" stroke="#98989D" fontSize={11} interval={0} angle={-15} textAnchor="end" />
                <YAxis stroke="#98989D" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#2C2C2E', borderRadius: '12px', fontSize: '12px', color: '#FFFFFF' }}
                  itemStyle={{ color: '#00E5FF' }}
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
        <div className="watt-card flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Tag className="w-4 h-4 text-brand-cyan" />
              <span>Top Research Categories</span>
            </h3>
            <p className="text-xs text-brand-gray mt-0.5">
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
                  innerRadius={42}
                  outerRadius={68}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="category"
                  label={({ x, y, textAnchor, name, percent }: any) => (
                    <text
                      x={x}
                      y={y}
                      fill="#98989D"
                      textAnchor={textAnchor}
                      dominantBaseline="central"
                      className="text-[9px] font-bold fill-brand-gray"
                    >
                      {`${name?.split(' ')[0]} (${((percent || 0) * 100).toFixed(0)}%)`}
                    </text>
                  )}
                  labelLine={{ stroke: '#2C2C2E', strokeWidth: 1 }}
                >
                  {analytics.by_category.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#2C2C2E', borderRadius: '12px', fontSize: '12px', color: '#FFFFFF' }}
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
              <Sparkles className="w-5 h-5 text-brand-cyan animate-pulse-slow" />
              <span>Recent Extracted Research Publications</span>
            </h2>
            <p className="text-xs text-brand-gray">
              Click any publication to view full metadata, AI extractive summary, and PDF report options.
            </p>
          </div>
          <button
            onClick={onNavigateToRepo}
            className="text-xs font-semibold text-brand-cyan hover:brightness-110 transition-colors flex items-center space-x-1 cursor-pointer"
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
              className="watt-card hover:border-brand-cyan cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <span className="px-2.5 py-1 rounded-lg bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20 text-[11px] font-semibold">
                    {paper.department || 'General'}
                  </span>
                  <div className="flex items-center space-x-1 text-[11px] text-brand-green bg-brand-green/10 px-2 py-0.5 rounded border border-brand-green/20">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>ML Conf: {(paper.ml_confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-white mt-3 group-hover:text-brand-cyan transition-colors line-clamp-2">
                  {paper.title}
                </h3>

                <p className="text-xs text-brand-gray mt-2 line-clamp-2 italic bg-brand-bg p-2.5 rounded-xl border border-brand-border">
                  “{paper.ai_summary || paper.abstract || 'No summary available.'}”
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-brand-border flex items-center justify-between text-xs text-brand-gray">
                <div className="flex items-center space-x-2 truncate max-w-[70%]">
                  <Users className="w-3.5 h-3.5 text-brand-gray shrink-0" />
                  <span className="truncate">{paper.authors_raw || 'College Faculty'}</span>
                </div>
                <div className="flex items-center space-x-1 text-brand-gray shrink-0">
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
