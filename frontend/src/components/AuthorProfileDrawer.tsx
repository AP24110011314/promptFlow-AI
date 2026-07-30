import React from 'react';
import { X, BookOpen, Award, TrendingUp, Users, FileText } from 'lucide-react';

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

  // Normalize author names by stripping honorific titles and special chars
  const normalizeAuthorName = (name: string): string => {
    if (!name) return '';
    return name
      .replace(/\b(dr|prof|professor|doctor|phd|ph\.d|mr|mrs|ms|er|eng|sir)\b\.?/gi, '')
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  };

  const cleanAuthorName = authorName.trim();
  const normSearchName = normalizeAuthorName(authorName);
  const searchTokens = normSearchName.split(' ').filter((t) => t.length > 1);

  // Filter papers authored by authorName
  const authorPapers = allPapers.filter((p) => {
    const candidates: string[] = [];
    if (p.authors_list && p.authors_list.length > 0) {
      candidates.push(...p.authors_list);
    }
    if (p.authors_raw) {
      candidates.push(...p.authors_raw.split(/[,;&]/));
    }

    return candidates.some((cand) => {
      const normCand = normalizeAuthorName(cand);
      if (!normCand || !normSearchName) return false;

      // 1. Direct bidirectional substring match
      if (normCand.includes(normSearchName) || normSearchName.includes(normCand)) {
        return true;
      }

      // 2. Token-level overlap matching (e.g. Sangeeta Saha)
      const candTokens = normCand.split(' ').filter((t) => t.length > 1);
      if (searchTokens.length > 0 && candTokens.length > 0) {
        const matches = searchTokens.filter((t) => candTokens.includes(t));
        if (matches.length >= Math.min(2, searchTokens.length)) {
          return true;
        }
      }

      return false;
    });
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
      const normCo = normalizeAuthorName(co);
      if (normCo && normCo !== normSearchName && !normSearchName.includes(normCo) && !normCo.includes(normSearchName) && co.length > 2) {
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
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">

      <div className="w-full max-w-2xl bg-white border-l border-slate-200 h-full shadow-2xl overflow-y-auto flex flex-col">
        
        {/* Drawer Header */}
        <div className="px-6 py-5 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-2xs shrink-0">
              {cleanAuthorName.charAt(0)}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">{cleanAuthorName}</h3>
              <p className="text-xs text-blue-600 font-medium mt-0.5">{primaryDept}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-50 text-slate-500 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto text-xs">
          
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Publications</span>
              <p className="text-base sm:text-lg font-extrabold text-slate-900 font-mono">{totalPubs}</p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Award className="w-3 h-3 text-amber-600" />
                <span>Est. h-index</span>
              </span>
              <p className="text-base sm:text-lg font-extrabold text-amber-700 font-mono">{hIndex}</p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-600" />
                <span>Citations</span>
              </span>
              <p className="text-base sm:text-lg font-extrabold text-emerald-700 font-mono">{totalCitations}</p>
            </div>
          </div>

          {/* Top Venues */}
          {topVenues.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                <span>Frequent Publication Venues</span>
              </h4>
              <div className="flex flex-wrap gap-3">
                {topVenues.map(([venue, count], idx) => (
                  <span key={idx} className="text-xs text-slate-700 font-semibold flex items-center space-x-1.5">
                    <span className="truncate max-w-[200px]">{venue}</span>
                    <span className="text-slate-500 font-mono text-[11px]">({count})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Frequent Collaborators */}
          {topCoAuthors.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>Frequent Co-Authors</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {topCoAuthors.map(([coAuthor, count], idx) => (
                  <div 
                    key={idx}
                    onClick={() => { if (onSelectAuthor) onSelectAuthor(coAuthor); }}
                    className="p-3 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 flex items-center justify-between transition-all cursor-pointer group"
                    title={`View ${coAuthor}'s author profile`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[10px] shrink-0 border border-blue-100">
                        {coAuthor.charAt(0)}
                      </div>
                      <span className="text-slate-900 font-medium truncate group-hover:text-blue-600 transition-colors">{coAuthor}</span>
                    </div>
                    <span className="text-slate-500 text-[11px] shrink-0 font-mono">{count} papers</span>
                  </div>
                ))}

              </div>
            </div>
          )}

          {/* Publication History List */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Publications in Repository ({totalPubs})</span>
            </h4>

            {totalPubs === 0 ? (
              <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
                No publications found for this author in repository.
              </div>
            ) : (
              <div className="space-y-2.5">
                {authorPapers.map((paper) => (
                  <div
                    key={paper.id}
                    onClick={() => { onSelectPaper(paper); onClose(); }}
                    className="p-4 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100/50 transition-all cursor-pointer space-y-2 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="font-bold text-slate-900 text-xs group-hover:text-blue-600 transition-colors leading-snug">
                        {paper.title}
                      </h5>
                      <span className="text-[11px] font-mono text-slate-500 font-semibold shrink-0">
                        {paper.publication_year}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {paper.abstract || 'No abstract preview available.'}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                      <span>{paper.department}</span>
                      <span className="font-mono text-emerald-600 font-bold">{paper.citation_count} citations</span>
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
