import React from 'react';
import { X, BookOpen, Award, TrendingUp, Users, ExternalLink, FileText } from 'lucide-react';

import type { ResearchPaper } from '../types';

interface AuthorProfileDrawerProps {
  authorName: string;
  allPapers: ResearchPaper[];
  onClose: () => void;
  onSelectPaper: (paper: ResearchPaper) => void;
  onSelectAuthor?: (authorName: string) => void;
}

export const AuthorProfileDrawer: React.FC<AuthorProfileDrawerProps> = ({
  authorName,
  allPapers,
  onClose,
  onSelectPaper,
  onSelectAuthor,
}) => {

  // Filter papers authored by authorName (fuzzy match case-insensitive)
  const cleanAuthorName = authorName.trim();
  const authorPapers = allPapers.filter((p) => {
    if (p.authors_list && p.authors_list.length > 0) {
      return p.authors_list.some((a) => a.toLowerCase().includes(cleanAuthorName.toLowerCase()));
    }
    return p.authors_raw?.toLowerCase().includes(cleanAuthorName.toLowerCase());
  });

  // Calculate dynamic metrics
  const totalPubs = authorPapers.length;
  const totalCitations = authorPapers.reduce((sum, p) => sum + (p.citation_count || 0), 0);
  
  // Calculate h-index approximation
  const citationCounts = authorPapers.map((p) => p.citation_count || 0).sort((a, b) => b - a);
  let hIndex = 0;
  for (let i = 0; i < citationCounts.length; i++) {
    if (citationCounts[i] >= i + 1) {
      hIndex = i + 1;
    } else {
      break;
    }
  }

  // Primary department estimation
  const deptCounts: Record<string, number> = {};
  authorPapers.forEach((p) => {
    if (p.department) {
      deptCounts[p.department] = (deptCounts[p.department] || 0) + 1;
    }
  });
  const primaryDept = Object.entries(deptCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Academic Research';

  // Co-authors computation
  const coAuthorMap: Record<string, number> = {};
  authorPapers.forEach((p) => {
    const list = p.authors_list && p.authors_list.length > 0
      ? p.authors_list
      : (p.authors_raw ? p.authors_raw.split(',').map((s) => s.trim()) : []);

    list.forEach((co) => {
      if (!co.toLowerCase().includes(cleanAuthorName.toLowerCase()) && co.length > 2) {
        coAuthorMap[co] = (coAuthorMap[co] || 0) + 1;
      }
    });
  });
  const topCoAuthors = Object.entries(coAuthorMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // Top publication venues
  const venueMap: Record<string, number> = {};
  authorPapers.forEach((p) => {
    if (p.journal_or_conference) {
      venueMap[p.journal_or_conference] = (venueMap[p.journal_or_conference] || 0) + 1;
    }
  });
  const topVenues = Object.entries(venueMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">

      <div className="w-full max-w-2xl bg-brand-card border-l border-brand-border h-full shadow-2xl overflow-y-auto flex flex-col">
        
        {/* Drawer Header */}
        <div className="px-6 py-6 border-b border-brand-border bg-brand-bg/60 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-brand-cyan text-real-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
              {cleanAuthorName.charAt(0)}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white leading-tight">{cleanAuthorName}</h3>
              <p className="text-xs text-brand-cyan font-medium mt-0.5">{primaryDept}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-brand-bg text-brand-gray hover:text-white border border-brand-border transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto text-xs">
          
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-brand-bg/60 border border-brand-border space-y-1">
              <span className="text-brand-gray text-[10px] font-bold uppercase tracking-wider block">Publications</span>
              <p className="text-lg font-extrabold text-white">{totalPubs}</p>
            </div>

            <div className="p-4 rounded-2xl bg-brand-bg/60 border border-brand-border space-y-1">
              <span className="text-brand-gray text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Award className="w-3 h-3 text-amber-400" />
                <span>Est. h-index</span>
              </span>
              <p className="text-lg font-extrabold text-amber-400">{hIndex}</p>
            </div>

            <div className="p-4 rounded-2xl bg-brand-bg/60 border border-brand-border space-y-1">
              <span className="text-brand-gray text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                <span>Citations</span>
              </span>
              <p className="text-lg font-extrabold text-emerald-400">{totalCitations}</p>
            </div>
          </div>

          {/* Top Venues */}
          {topVenues.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-gray flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-brand-cyan" />
                <span>Frequent Publication Venues</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {topVenues.map(([venue, count], idx) => (
                  <span key={idx} className="px-3 py-1.5 rounded-xl bg-brand-bg border border-brand-border text-white text-xs font-medium flex items-center space-x-1.5">
                    <span className="truncate max-w-[200px]">{venue}</span>
                    <span className="px-1.5 py-0.5 rounded bg-brand-cyan/20 text-brand-cyan text-[10px] font-bold">{count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Frequent Collaborators */}
          {topCoAuthors.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-gray flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-purple-400" />
                <span>Frequent Co-Authors</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {topCoAuthors.map(([coAuthor, count], idx) => (
                  <div 
                    key={idx}
                    onClick={() => { if (onSelectAuthor) onSelectAuthor(coAuthor); }}
                    className="p-3 rounded-xl bg-brand-bg/50 border border-brand-border hover:border-purple-500/50 flex items-center justify-between transition-all cursor-pointer group"
                    title={`View ${coAuthor}'s author profile`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                        {coAuthor.charAt(0)}
                      </div>
                      <span className="text-white font-medium truncate group-hover:text-purple-400 transition-colors">{coAuthor}</span>
                    </div>
                    <span className="text-brand-gray text-[11px] shrink-0">{count} papers</span>
                  </div>
                ))}

              </div>
            </div>
          )}

          {/* Publication History List */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-gray flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-brand-cyan" />
              <span>Publications in Repository ({totalPubs})</span>
            </h4>

            {totalPubs === 0 ? (
              <div className="p-6 text-center text-brand-gray bg-brand-bg/40 rounded-2xl border border-brand-border">
                No publications found for this author in repository.
              </div>
            ) : (
              <div className="space-y-2.5">
                {authorPapers.map((paper) => (
                  <div
                    key={paper.id}
                    onClick={() => { onSelectPaper(paper); onClose(); }}
                    className="p-4 rounded-2xl bg-brand-bg/60 border border-brand-border hover:border-brand-cyan/50 hover:bg-brand-hover/40 transition-all cursor-pointer space-y-2 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="font-bold text-white text-xs group-hover:text-brand-cyan transition-colors leading-snug">
                        {paper.title}
                      </h5>
                      <span className="px-2 py-0.5 rounded bg-brand-cyan/15 text-brand-cyan text-[10px] font-bold shrink-0">
                        {paper.publication_year}
                      </span>
                    </div>

                    <p className="text-[11px] text-brand-gray line-clamp-2 leading-relaxed">
                      {paper.abstract || 'No abstract preview available.'}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-brand-gray pt-1">
                      <span className="truncate max-w-[260px] font-medium">{paper.journal_or_conference || paper.department}</span>
                      <span className="text-brand-cyan font-semibold flex items-center space-x-1 group-hover:underline">
                        <span>View Details</span>
                        <ExternalLink className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
