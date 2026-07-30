import React, { useState, useMemo } from 'react';
import { TrendingUp, Network, Search, Users, ExternalLink, ChevronLeft, ChevronRight, ArrowUpRight, Award } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell, LabelList } from 'recharts';
import type { DashboardAnalytics, CollaborationNode } from '../types';

interface AnalyticsViewProps {
  analytics: DashboardAnalytics | null;
  onSelectAuthor?: (authorName: string) => void;
}

// Curated corporate technical colors for graphs & department groups
const COLORS = ['#2563eb', '#0284c7', '#0d9488', '#f59e0b', '#0369a1', '#10b981', '#3b82f6', '#06b6d4'];

const GROUP_COLORS: Record<number, { stroke: string; fill: string; bg: string }> = {
  1: { stroke: '#2563eb', fill: '#eff6ff', bg: 'bg-blue-50 text-blue-700 border-blue-200' }, // CS
  2: { stroke: '#0284c7', fill: '#f0f9ff', bg: 'bg-sky-50 text-sky-700 border-sky-200' },   // Sciences
  3: { stroke: '#0d9488', fill: '#f0fdf4', bg: 'bg-teal-50 text-teal-700 border-teal-200' }, // Engineering
  4: { stroke: '#f59e0b', fill: '#fffbeb', bg: 'bg-amber-50 text-amber-700 border-amber-200' }, // Math/Econ
};

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ analytics, onSelectAuthor }) => {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  if (!analytics) return null;

  const { by_year, top_authors, collaboration_network } = analytics;

  // Calculate trajectory metrics
  const totalTrajectoryPapers = useMemo(() => {
    return (by_year || []).reduce((acc, curr) => acc + curr.count, 0);
  }, [by_year]);

  const trajectoryGrowth = useMemo(() => {
    if (!by_year || by_year.length < 2) return null;
    const prev = by_year[by_year.length - 2].count || 1;
    const latest = by_year[by_year.length - 1].count;
    const diff = latest - prev;
    const pct = ((diff / prev) * 100).toFixed(0);
    return { diff, pct: Number(pct) };
  }, [by_year]);



  // Compute 2D coordinates for all nodes in the SVG canvas (viewBox="0 0 900 520")
  const canvasWidth = 900;
  const canvasHeight = 520;
  const cx = canvasWidth / 2;
  const cy = canvasHeight / 2;

  const nodePositions = useMemo(() => {
    const posMap = new Map<string, { x: number; y: number; node: CollaborationNode }>();
    const nodes = collaboration_network?.nodes || [];
    if (nodes.length === 0) return posMap;

    if (nodes.length <= 12) {
      const rx = 340;
      const ry = 190;
      nodes.forEach((n, idx) => {
        const angle = (idx / nodes.length) * 2 * Math.PI - Math.PI / 2;
        posMap.set(n.id, {
          x: cx + rx * Math.cos(angle),
          y: cy + ry * Math.sin(angle),
          node: n,
        });
      });
    } else {
      // Multi-ring concentric distribution
      const innerCount = Math.min(6, Math.floor(nodes.length / 3));
      const outerCount = nodes.length - innerCount;

      const sorted = [...nodes].sort((a, b) => b.val - a.val);
      const innerNodes = sorted.slice(0, innerCount);
      const outerNodes = sorted.slice(innerCount);

      innerNodes.forEach((n, idx) => {
        const angle = (idx / innerCount) * 2 * Math.PI - Math.PI / 2;
        posMap.set(n.id, {
          x: cx + 160 * Math.cos(angle),
          y: cy + 105 * Math.sin(angle),
          node: n,
        });
      });

      outerNodes.forEach((n, idx) => {
        const angle = (idx / outerCount) * 2 * Math.PI - Math.PI / 2;
        posMap.set(n.id, {
          x: cx + 360 * Math.cos(angle),
          y: cy + 215 * Math.sin(angle),
          node: n,
        });
      });
    }

    return posMap;
  }, [collaboration_network, cx, cy]);

  // Set of active co-author IDs connected to hovered node
  const activeConnectedNodeIds = useMemo(() => {
    if (!hoveredNodeId) return new Set<string>();
    const connected = new Set<string>();
    connected.add(hoveredNodeId);
    (collaboration_network?.links || []).forEach((link) => {
      if (link.source === hoveredNodeId) connected.add(link.target);
      if (link.target === hoveredNodeId) connected.add(link.source);
    });
    return connected;
  }, [hoveredNodeId, collaboration_network]);

  // Filtered links for table
  const filteredLinks = useMemo(() => {
    const links = collaboration_network?.links || [];
    if (!searchQuery.trim()) return links;
    const q = searchQuery.toLowerCase().trim();
    return links.filter(
      (l) => l.source.toLowerCase().includes(q) || l.target.toLowerCase().includes(q)
    );
  }, [collaboration_network, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredLinks.length / pageSize));

  const paginatedLinks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLinks.slice(start, start + pageSize);
  }, [filteredLinks, currentPage, pageSize]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="watt-card relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Publications &amp; Collaboration Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Track annual publication growth, top faculty researchers, and inter-departmental co-authorship networks.
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Annual Publication Trajectory Card */}
        <div className="watt-card flex flex-col justify-between p-6">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-blue-600 shrink-0" />
                  <span>Annual Publication Trajectory</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Indexed paper output trajectory across calendar years
                </p>
              </div>

              {/* Trajectory KPI Metrics Badge */}
              <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-right">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Indexed</span>
                  <span className="text-sm font-extrabold text-blue-700 font-mono">{totalTrajectoryPapers} papers</span>
                </div>
                {trajectoryGrowth && (
                  <div className="px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-right">
                    <span className="text-[10px] text-emerald-600 uppercase tracking-wider font-bold block">YoY Growth</span>
                    <span className="text-xs font-bold text-emerald-700 font-mono inline-flex items-center gap-0.5">
                      <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                      +{trajectoryGrowth.pct}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="h-64 mt-6 relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={by_year} margin={{ top: 15, right: 20, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPublicationTrajectory" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.28}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="year" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '10px', fontSize: '12px', color: '#0f172a', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  formatter={(val: any) => [`${val} indexed publications`, 'Volume']}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Publications"
                  stroke="#2563eb"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorPublicationTrajectory)"
                  dot={{ r: 5, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: '#10b981', stroke: '#ffffff', strokeWidth: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Prolific Faculty Researchers Bar Chart Card */}
        <div className="watt-card flex flex-col justify-between p-6">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Award className="w-5 h-5 text-blue-600 shrink-0" />
                  <span>Top Prolific Faculty Researchers</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Professors with the highest verified indexed publication volume
                </p>
              </div>

              {top_authors.length > 0 && (
                <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold shrink-0 font-mono">
                  Max: {top_authors[0].count} papers
                </span>
              )}
            </div>
          </div>

          <div className="h-64 mt-6 relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={top_authors.slice(0, 5)}
                margin={{ top: 5, right: 65, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" stroke="#64748b" fontSize={11} allowDecimals={false} tickLine={false} />
                <YAxis
                  dataKey="author"
                  type="category"
                  stroke="#334155"
                  fontSize={11}
                  fontWeight="600"
                  width={140}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '10px', fontSize: '12px', color: '#0f172a', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  formatter={(val: any) => [`${val} indexed papers`, 'Volume']}
                />
                <Bar
                  dataKey="count"
                  name="Publications"
                  radius={[0, 6, 6, 0]}
                  barSize={22}
                  onClick={(entry: any) => {
                    if (onSelectAuthor && entry && entry.author) {
                      onSelectAuthor(entry.author);
                    }
                  }}
                  className="cursor-pointer hover:opacity-90 transition-opacity"
                >
                  {top_authors.slice(0, 5).map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                  <LabelList
                    dataKey="count"
                    position="right"
                    fill="#0f172a"
                    fontSize={11}
                    fontWeight="bold"
                    formatter={(v: any) => `${v} ${v === 1 ? 'paper' : 'papers'}`}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Interactive Co-Authorship Collaboration Network */}
      <div className="watt-card space-y-6">
        
        {/* Header & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Network className="w-5 h-5 text-blue-600" />
              <span>College Co-Authorship Network Topology</span>
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">
              Interactive node-edge graph visualizing joint faculty publications and co-author relationships.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Highlight professor..."
                className="pl-8 pr-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 w-44 sm:w-56"
              />
            </div>
          </div>
        </div>

        {/* Dynamic SVG Network Visualization Canvas */}
        <div className="relative w-full rounded-xl bg-slate-50 border border-slate-200 overflow-hidden p-2 sm:p-4 select-none">
          <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

          <svg
            viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
            className="w-full h-auto max-h-[550px] relative z-10"
          >
            {/* Render Connecting Edges (Co-Authorship Links) */}
            {collaboration_network?.links.map((link, idx) => {
              const src = nodePositions.get(link.source);
              const tgt = nodePositions.get(link.target);
              if (!src || !tgt) return null;

              const isHighlighted =
                hoveredNodeId === link.source ||
                hoveredNodeId === link.target ||
                (searchQuery &&
                  (link.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    link.target.toLowerCase().includes(searchQuery.toLowerCase())));

              const isDimmed =
                (hoveredNodeId && !isHighlighted) ||
                (searchQuery && !isHighlighted);

              const strokeWidth = isHighlighted ? Math.max(link.value * 2.5, 3) : Math.max(link.value * 1.5, 1.5);
              const strokeColor = isHighlighted ? '#2563eb' : '#94a3b8';
              const strokeOpacity = isDimmed ? 0.12 : isHighlighted ? 0.9 : 0.45;

              return (
                <g key={`edge-${idx}`}>
                  <line
                    x1={src.x}
                    y1={src.y}
                    x2={tgt.x}
                    y2={tgt.y}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeOpacity={strokeOpacity}
                    strokeDasharray={link.value > 1 ? 'none' : '4 4'}
                    className="transition-all duration-200"
                  />
                  {/* Mid-point badge for high-volume co-authorship */}
                  {link.value > 1 && (
                    <g transform={`translate(${(src.x + tgt.x) / 2}, ${(src.y + tgt.y) / 2})`}>
                      <circle r="8" fill="#ffffff" stroke={strokeColor} strokeWidth="1.5" />
                      <text
                        textAnchor="middle"
                        dy="3"
                        fontSize="9"
                        fontWeight="bold"
                        fill="#0f172a"
                      >
                        {link.value}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Render Faculty Nodes */}
            {Array.from(nodePositions.values()).map(({ x, y, node }) => {
              const isHovered = hoveredNodeId === node.id;
              const isConnected = activeConnectedNodeIds.has(node.id);
              const isSearched =
                searchQuery && node.id.toLowerCase().includes(searchQuery.toLowerCase());

              const isDimmed =
                (hoveredNodeId && !isConnected) ||
                (searchQuery && !isSearched);

              const colorConfig = GROUP_COLORS[node.group % 4 + 1] || GROUP_COLORS[1];

              // Clean display name (First name + Last name)
              const nameParts = node.id.split(' ');
              const shortName = nameParts.length > 1 ? `${nameParts[0]} ${nameParts[nameParts.length - 1]}` : node.id;

              return (
                <g
                  key={node.id}
                  transform={`translate(${x}, ${y})`}
                  className="cursor-pointer transition-transform duration-200"
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  onClick={() => { if (onSelectAuthor) onSelectAuthor(node.id); }}
                  style={{ opacity: isDimmed ? 0.25 : 1 }}
                >
                  {/* Outer pulse/glow on hover or search match */}
                  {(isHovered || isSearched) && (
                    <circle
                      r="34"
                      fill={colorConfig.stroke}
                      fillOpacity="0.2"
                      className="animate-ping"
                    />
                  )}

                  {/* Node Circle */}
                  <circle
                    r="24"
                    fill={isHovered ? '#2563eb' : colorConfig.fill}
                    stroke={isHovered ? '#1d4ed8' : colorConfig.stroke}
                    strokeWidth={isHovered ? '3' : '2'}
                    className="shadow-md transition-all duration-200"
                  />

                  {/* Node Paper Count Badge */}
                  <circle
                    cx="16"
                    cy="-16"
                    r="10"
                    fill="#2563eb"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  <text
                    x="16"
                    y="-12"
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="bold"
                    fill="#ffffff"
                    fontFamily="mono"
                  >
                    {node.val}
                  </text>

                  {/* Faculty Initial */}
                  <text
                    textAnchor="middle"
                    dy="4"
                    fontSize="13"
                    fontWeight="800"
                    fill={isHovered ? '#ffffff' : colorConfig.stroke}
                  >
                    {node.id.charAt(0)}
                  </text>

                  {/* Faculty Full Name Label */}
                  <text
                    textAnchor="middle"
                    dy="40"
                    fontSize="11"
                    fontWeight={isHovered ? 'bold' : '600'}
                    fill={isHovered ? '#2563eb' : '#0f172a'}
                    className="select-none"
                  >
                    {shortName}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Network Metrics Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200 gap-2">
          <div className="flex items-center space-x-4">
            <span>Total Collaborators: <strong className="text-slate-900 font-mono">{collaboration_network.nodes.length}</strong> faculty</span>
            <span>Co-Authorship Pairs: <strong className="text-slate-900 font-mono">{collaboration_network.links.length}</strong> connections</span>
          </div>
          <span className="text-slate-400 italic">Hover node to inspect connected co-authors</span>
        </div>

      </div>

      {/* Co-Authorship Pair Leaderboard & Matrix Table */}
      <div className="watt-card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Co-Authorship Pair Details ({filteredLinks.length})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified collaborative research partnerships and joint publication counts
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 uppercase font-bold text-xs">
                <th className="py-3 px-3">Faculty Researcher 1</th>
                <th className="py-3 px-3">Faculty Researcher 2</th>
                <th className="py-3 px-3">Joint Papers</th>
                <th className="py-3 px-3">Collaboration Level</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-900">
              {paginatedLinks.map((link, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  onClick={() => { if (onSelectAuthor) onSelectAuthor(link.source); }}
                >
                  <td className="py-3.5 px-3">
                    <span className="font-bold text-slate-900 flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs border border-blue-100 shrink-0">
                        {link.source.charAt(0)}
                      </span>
                      <span>{link.source}</span>
                    </span>
                  </td>

                  <td className="py-3.5 px-3">
                    <span className="font-bold text-slate-900 flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-md bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-xs border border-sky-100 shrink-0">
                        {link.target.charAt(0)}
                      </span>
                      <span>{link.target}</span>
                    </span>
                  </td>

                  <td className="py-3.5 px-3 font-mono font-bold text-blue-600">
                    {link.value} {link.value === 1 ? 'paper' : 'papers'}
                  </td>

                  <td className="py-3.5 px-3">
                    {link.value >= 3 ? (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                        High Interdisciplinary
                      </span>
                    ) : link.value === 2 ? (
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md">
                        Active Co-Authors
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-md">
                        Joint Publication
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectAuthor) onSelectAuthor(link.source);
                      }}
                      className="px-2.5 py-1 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-blue-600 text-xs font-semibold transition-all inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>View Profile</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {filteredLinks.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 text-xs">
            <span className="text-slate-500 font-medium">
              Showing <strong className="text-slate-900 font-mono">{(currentPage - 1) * pageSize + 1}</strong> to{' '}
              <strong className="text-slate-900 font-mono">
                {Math.min(currentPage * pageSize, filteredLinks.length)}
              </strong>{' '}
              of <strong className="text-slate-900 font-mono">{filteredLinks.length}</strong> co-authorship pairs
            </span>

            <div className="flex items-center space-x-1.5 select-none">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold transition-all cursor-pointer disabled:cursor-not-allowed flex items-center space-x-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <span className="px-3 py-1.5 font-semibold text-slate-700">
                Page <strong className="text-slate-900 font-mono">{currentPage}</strong> of{' '}
                <strong className="text-slate-900 font-mono">{totalPages}</strong>
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold transition-all cursor-pointer disabled:cursor-not-allowed flex items-center space-x-1"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
