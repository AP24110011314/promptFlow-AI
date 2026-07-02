import React from 'react';
import { BarChart3, TrendingUp, Network, Award } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from 'recharts';
import type { DashboardAnalytics } from '../types';

interface AnalyticsViewProps {
  analytics: DashboardAnalytics | null;
}

const COLORS = ['#6366f1', '#06b6d4', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#14b8a6'];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ analytics }) => {
  if (!analytics) return null;

  const { by_year, top_authors, collaboration_network } = analytics;

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header Banner */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800/80 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 w-72 h-72 bg-gradient-to-t from-violet-600/10 via-indigo-500/10 to-transparent blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold mb-3">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Research Intelligence & Collaboration Metrics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Deep Analytics & Co-Authorship Mapping
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Evaluate annual college research growth, identify prolific department researchers, and visualize inter-departmental co-authorship collaboration networks.
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Publication Trend Over Years */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800/80 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <span>Annual Publication Trajectory</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Volume of published papers indexed across recent calendar years
            </p>
          </div>
          <div className="h-64 mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={by_year} margin={{ top: 10, right: 20, left: -20, bottom: 10 }}>
                <XAxis dataKey="year" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Papers Indexed"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#06b6d4', strokeWidth: 2 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Faculty Authors */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800/80 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Award className="w-4 h-4 text-cyan-400" />
              <span>Top Prolific Faculty Researchers</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Professors with the highest indexed publication volume
            </p>
          </div>
          <div className="h-64 mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={top_authors.slice(0, 5)} margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                <XAxis type="number" stroke="#64748b" fontSize={11} allowDecimals={false} />
                <YAxis dataKey="author" type="category" stroke="#64748b" fontSize={11} width={110} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="count" name="Publications" radius={[0, 6, 6, 0]}>
                  {top_authors.slice(0, 5).map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Co-Authorship Collaboration Network */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800/80 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Network className="w-5 h-5 text-violet-400" />
              <span>College Co-Authorship Collaboration Network</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Interactive visualization representing faculty members (nodes) and co-authorship links (connecting lines). Larger nodes indicate higher research productivity.
            </p>
          </div>
          <div className="flex items-center space-x-3 text-xs text-slate-400">
            <span className="flex items-center space-x-1.5"><span className="w-3 h-3 rounded-full bg-indigo-500 inline-block" /> <span>Computer Science</span></span>
            <span className="flex items-center space-x-1.5"><span className="w-3 h-3 rounded-full bg-cyan-400 inline-block" /> <span>Physics & Chem</span></span>
            <span className="flex items-center space-x-1.5"><span className="w-3 h-3 rounded-full bg-violet-400 inline-block" /> <span>Biotech & Eng</span></span>
          </div>
        </div>

        {/* Network Canvas Simulation UI */}
        <div className="relative w-full h-80 rounded-2xl bg-slate-950/80 border border-slate-800/80 overflow-hidden flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

          {/* SVG Connecting Links */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {collaboration_network.links.map((link, idx) => {
              // Map sample coordinates for visualization aesthetics
              const srcIdx = collaboration_network.nodes.findIndex(n => n.id === link.source);
              const tgtIdx = collaboration_network.nodes.findIndex(n => n.id === link.target);
              if (srcIdx === -1 || tgtIdx === -1) return null;

              const angle1 = (srcIdx / collaboration_network.nodes.length) * 2 * Math.PI;
              const angle2 = (tgtIdx / collaboration_network.nodes.length) * 2 * Math.PI;
              const r = 110;
              const cx = 350;
              const cy = 160;

              const x1 = cx + r * Math.cos(angle1);
              const y1 = cy + r * Math.sin(angle1);
              const x2 = cx + r * Math.cos(angle2);
              const y2 = cy + r * Math.sin(angle2);

              return (
                <line
                  key={idx}
                  x1={`${50 + (x1 / 700) * 80}%`}
                  y1={`${y1}px`}
                  x2={`${50 + (x2 / 700) * 80}%`}
                  y2={`${y2}px`}
                  stroke="rgba(99, 102, 241, 0.3)"
                  strokeWidth={Math.min(link.value * 1.5, 4)}
                  strokeDasharray={link.value > 1 ? "none" : "4 4"}
                />
              );
            })}
          </svg>

          {/* Rended Faculty Nodes */}
          <div className="relative z-10 w-full max-w-4xl h-full flex flex-wrap items-center justify-around gap-6 p-4">
            {collaboration_network.nodes.map((node, idx) => {
              const nodeColors = ['bg-indigo-500 text-indigo-100 border-indigo-400', 'bg-cyan-500 text-cyan-100 border-cyan-400', 'bg-violet-500 text-violet-100 border-violet-400', 'bg-emerald-500 text-emerald-100 border-emerald-400', 'bg-amber-500 text-amber-100 border-amber-400'];
              const colorClass = nodeColors[idx % nodeColors.length];

              return (
                <div
                  key={node.id}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl backdrop-blur-md bg-slate-900/90 border shadow-lg transition-transform hover:scale-110 cursor-pointer ${colorClass} glow-indigo`}
                  style={{ minWidth: '110px' }}
                >
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-xs mb-1">
                    {node.val}
                  </div>
                  <span className="text-xs font-bold text-white text-center max-w-[120px] truncate">{node.id}</span>
                  <span className="text-[9px] text-slate-300 uppercase tracking-wider mt-0.5">Faculty Node</span>
                </div>
              );
            })}
          </div>

        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-800/80">
          <span>Total Collaborators: <strong className="text-slate-300">{collaboration_network.nodes.length}</strong> faculty</span>
          <span>Co-Authorship Pairs: <strong className="text-slate-300">{collaboration_network.links.length}</strong> active connections</span>
        </div>
      </div>

    </div>
  );
};
