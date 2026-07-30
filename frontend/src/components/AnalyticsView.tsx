import React from 'react';
import { TrendingUp, Network, Award } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from 'recharts';
import type { DashboardAnalytics } from '../types';

interface AnalyticsViewProps {
  analytics: DashboardAnalytics | null;
}

// Curated technical colors for graphs
const COLORS = ['#6366f1', '#38bdf8', '#34d399', '#fbbf24', '#a855f7', '#f43f5e', '#818cf8', '#2dd4bf'];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ analytics }) => {
  if (!analytics) return null;

  const { by_year, top_authors, collaboration_network } = analytics;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="watt-card relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Publications &amp; Collaboration Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Track publication trends, top researchers, and department collaboration networks.
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Publication Trend Over Years */}
        <div className="watt-card flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>Annual Publication Trajectory</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Volume of published papers indexed across recent calendar years
            </p>
          </div>
          <div className="h-64 mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={by_year} margin={{ top: 10, right: 20, left: -20, bottom: 10 }}>
                <XAxis dataKey="year" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: '#2563eb' }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Papers Indexed"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Faculty Authors */}
        <div className="watt-card flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Award className="w-4 h-4 text-blue-600" />
              <span>Top Prolific Faculty Researchers</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Professors with the highest indexed publication volume
            </p>
          </div>
          <div className="h-64 mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={top_authors.slice(0, 5)} margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                <XAxis type="number" stroke="#64748b" fontSize={11} allowDecimals={false} />
                <YAxis dataKey="author" type="category" stroke="#64748b" fontSize={11} width={110} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: '#2563eb' }}
                />
                <Bar dataKey="count" name="Publications" radius={[0, 4, 4, 0]}>
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
      <div className="watt-card space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Network className="w-4 h-4 text-blue-600" />
              <span>College Co-Authorship Collaboration Network</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Interactive visualization representing faculty members (nodes) and co-authorship links.
            </p>
          </div>
          <div className="flex items-center space-x-3 text-xs text-slate-500 font-medium">
            <span>CS</span>
            <span>•</span>
            <span>Sciences</span>
            <span>•</span>
            <span>Engineering</span>
          </div>
        </div>

        {/* Network Canvas Simulation UI */}
        <div className="relative w-full h-80 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

          {/* SVG Connecting Links */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {collaboration_network.links.map((link, idx) => {
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
                  stroke="rgba(37, 99, 235, 0.25)"
                  strokeWidth={Math.min(link.value * 1.5, 4)}
                  strokeDasharray={link.value > 1 ? "none" : "4 4"}
                />
              );
            })}
          </svg>

          {/* Rendered Faculty Nodes */}
          <div className="relative z-10 w-full max-w-4xl h-full flex flex-wrap items-center justify-around gap-4 p-4">
            {collaboration_network.nodes.map((node) => {
              return (
                <div
                  key={node.id}
                  className="flex flex-col items-center justify-center p-3 rounded-lg bg-white border border-slate-200 shadow-2xs transition-transform hover:scale-105 cursor-pointer"
                  style={{ minWidth: '105px' }}
                >
                  <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center font-mono font-bold text-xs mb-1 border border-blue-100">
                    {node.val}
                  </div>
                  <span className="text-xs font-bold text-slate-900 text-center max-w-[110px] truncate">{node.id}</span>
                  <span className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">Faculty Node</span>
                </div>
              );
            })}
          </div>

        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200">
          <span>Total Collaborators: <strong className="text-slate-900 font-mono">{collaboration_network.nodes.length}</strong> faculty</span>
          <span>Co-Authorship Pairs: <strong className="text-slate-900 font-mono">{collaboration_network.links.length}</strong> active connections</span>
        </div>
      </div>

    </div>
  );
};
