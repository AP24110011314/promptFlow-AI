import React from 'react';
import { TrendingUp, Network, Award } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from 'recharts';
import type { DashboardAnalytics } from '../types';

interface AnalyticsViewProps {
  analytics: DashboardAnalytics | null;
}

// Curated technical colors for graphs
const COLORS = ['#00E5FF', '#32D74B', '#FF453A', '#98989D', '#BF5AF2', '#FF9F0A', '#64D2FF', '#FF375F'];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ analytics }) => {
  if (!analytics) return null;

  const { by_year, top_authors, collaboration_network } = analytics;

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header Banner */}
      <div className="watt-card relative overflow-hidden">
        <div className="absolute right-0 bottom-0 w-72 h-72 bg-gradient-to-t from-brand-cyan/5 via-brand-green/5 to-transparent blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Publications &amp; Collaboration Analytics
          </h1>
          <p className="text-sm text-brand-gray mt-1 max-w-2xl">
            Track publication trends, top researchers, and department collaboration networks.
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Publication Trend Over Years */}
        <div className="watt-card flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-brand-cyan" />
              <span>Annual Publication Trajectory</span>
            </h3>
            <p className="text-xs text-brand-gray mt-0.5">
              Volume of published papers indexed across recent calendar years
            </p>
          </div>
          <div className="h-64 mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={by_year} margin={{ top: 10, right: 20, left: -20, bottom: 10 }}>
                <XAxis dataKey="year" stroke="#98989D" fontSize={11} />
                <YAxis stroke="#98989D" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#2C2C2E', borderRadius: '12px', fontSize: '12px', color: '#FFFFFF' }}
                  itemStyle={{ color: '#00E5FF' }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Papers Indexed"
                  stroke="#00E5FF"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#32D74B', strokeWidth: 2 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Faculty Authors */}
        <div className="watt-card flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Award className="w-4 h-4 text-brand-cyan" />
              <span>Top Prolific Faculty Researchers</span>
            </h3>
            <p className="text-xs text-brand-gray mt-0.5">
              Professors with the highest indexed publication volume
            </p>
          </div>
          <div className="h-64 mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={top_authors.slice(0, 5)} margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                <XAxis type="number" stroke="#98989D" fontSize={11} allowDecimals={false} />
                <YAxis dataKey="author" type="category" stroke="#98989D" fontSize={11} width={110} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#2C2C2E', borderRadius: '12px', fontSize: '12px', color: '#FFFFFF' }}
                  itemStyle={{ color: '#00E5FF' }}
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
      <div className="watt-card space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Network className="w-5 h-5 text-brand-cyan" />
              <span>College Co-Authorship Collaboration Network</span>
            </h3>
            <p className="text-xs text-brand-gray mt-1">
              Interactive visualization representing faculty members (nodes) and co-authorship links (connecting lines). Larger nodes indicate higher research productivity.
            </p>
          </div>
          <div className="flex items-center space-x-3 text-xs text-brand-gray">
            <span className="flex items-center space-x-1.5"><span className="w-3 h-3 rounded-full bg-brand-cyan inline-block" /> <span>Computer Science</span></span>
            <span className="flex items-center space-x-1.5"><span className="w-3 h-3 rounded-full bg-brand-green inline-block" /> <span>Physics & Chemistry</span></span>
            <span className="flex items-center space-x-1.5"><span className="w-3 h-3 rounded-full bg-brand-red inline-block" /> <span>Biotech & Engineering</span></span>
          </div>
        </div>

        {/* Network Canvas Simulation UI */}
        <div className="relative w-full h-80 rounded-2xl bg-brand-bg border border-brand-border overflow-hidden flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[radial-gradient(#2C2C2E_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

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
                  stroke="rgba(0, 229, 255, 0.25)"
                  strokeWidth={Math.min(link.value * 1.5, 4)}
                  strokeDasharray={link.value > 1 ? "none" : "4 4"}
                />
              );
            })}
          </svg>

          {/* Rendered Faculty Nodes */}
          <div className="relative z-10 w-full max-w-4xl h-full flex flex-wrap items-center justify-around gap-6 p-4">
            {collaboration_network.nodes.map((node, idx) => {
              const nodeColors = [
                'bg-brand-card text-brand-cyan border-brand-cyan/40 shadow-sm shadow-brand-cyan/5', 
                'bg-brand-card text-brand-green border-brand-green/40 shadow-sm shadow-brand-green/5', 
                'bg-brand-card text-brand-red border-brand-red/40 shadow-sm shadow-brand-red/5',
                'bg-brand-card text-white border-brand-border hover:border-brand-cyan'
              ];
              const colorClass = nodeColors[idx % nodeColors.length];

              return (
                <div
                  key={node.id}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border shadow-lg transition-transform hover:scale-110 cursor-pointer ${colorClass}`}
                  style={{ minWidth: '110px' }}
                >
                  <div className="w-8 h-8 rounded-full bg-brand-bg/60 flex items-center justify-center font-mono font-bold text-xs mb-1 border border-brand-border">
                    {node.val}
                  </div>
                  <span className="text-xs font-bold text-white text-center max-w-[120px] truncate">{node.id}</span>
                  <span className="text-[9px] text-brand-gray uppercase tracking-wider mt-0.5">Faculty Node</span>
                </div>
              );
            })}
          </div>

        </div>

        <div className="flex items-center justify-between text-xs text-brand-gray pt-2 border-t border-brand-border">
          <span>Total Collaborators: <strong className="text-white">{collaboration_network.nodes.length}</strong> faculty</span>
          <span>Co-Authorship Pairs: <strong className="text-white">{collaboration_network.links.length}</strong> active connections</span>
        </div>
      </div>

    </div>
  );
};
