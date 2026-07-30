import React, { useState } from 'react';
import { X, Quote, Copy, Check, BookOpen } from 'lucide-react';
import type { ResearchPaper } from '../types';

interface CitationModalProps {
  paper: ResearchPaper;
  onClose: () => void;
}

export const CitationModal: React.FC<CitationModalProps> = ({ paper, onClose }) => {
  const [activeStyle, setActiveStyle] = useState<'APA' | 'IEEE' | 'MLA' | 'BibTeX'>('APA');
  const [copiedStyle, setCopiedStyle] = useState<string | null>(null);

  const authorsList = paper.authors_list && paper.authors_list.length > 0 
    ? paper.authors_list 
    : (paper.authors_raw ? paper.authors_raw.split(',').map(s => s.trim()) : ['Anonymous Author']);

  // Format Generators
  const generateAPA = (): string => {
    const formattedAuthors = authorsList.length > 1
      ? `${authorsList.slice(0, -1).join(', ')} & ${authorsList[authorsList.length - 1]}`
      : authorsList[0];
    const doiStr = paper.doi ? ` https://doi.org/${paper.doi}` : '';
    const journalStr = paper.journal_or_conference ? ` *${paper.journal_or_conference}*.` : '';
    return `${formattedAuthors} (${paper.publication_year}). ${paper.title}.${journalStr}${doiStr}`;
  };

  const generateIEEE = (): string => {
    const formattedAuthors = authorsList.length > 1
      ? `${authorsList.slice(0, -1).join(', ')} and ${authorsList[authorsList.length - 1]}`
      : authorsList[0];
    const journalStr = paper.journal_or_conference ? `, *${paper.journal_or_conference}*` : '';
    const doiStr = paper.doi ? `, doi: ${paper.doi}` : '';
    return `${formattedAuthors}, "${paper.title}"${journalStr}, ${paper.publication_year}${doiStr}.`;
  };

  const generateMLA = (): string => {
    const formattedAuthors = authorsList.length > 1
      ? `${authorsList[0]}, et al`
      : authorsList[0];
    const journalStr = paper.journal_or_conference ? ` *${paper.journal_or_conference}*,` : '';
    return `${formattedAuthors}. "${paper.title}."${journalStr} ${paper.publication_year}.`;
  };

  const generateBibTeX = (): string => {
    const firstAuthorClean = authorsList[0].split(' ').pop()?.toLowerCase() || 'paper';
    const firstWordTitle = paper.title.split(' ')[0]?.toLowerCase().replace(/[^a-z0-9]/gi, '') || 'research';
    const citeKey = `${firstAuthorClean}${paper.publication_year}${firstWordTitle}`;
    const authorsBib = authorsList.join(' and ');
    const journalField = paper.journal_or_conference ? `  journal = {${paper.journal_or_conference}},\n` : '';
    const doiField = paper.doi ? `  doi = {${paper.doi}},\n` : '';

    return `@article{${citeKey},
  author = {${authorsBib}},
  title = {${paper.title}},
${journalField}  year = {${paper.publication_year}},
${doiField}  department = {${paper.department}}
}`;
  };

  const getCitationText = (style: 'APA' | 'IEEE' | 'MLA' | 'BibTeX'): string => {
    switch (style) {
      case 'APA': return generateAPA();
      case 'IEEE': return generateIEEE();
      case 'MLA': return generateMLA();
      case 'BibTeX': return generateBibTeX();
    }
  };

  const handleCopy = (style: 'APA' | 'IEEE' | 'MLA' | 'BibTeX') => {
    const text = getCitationText(style);
    navigator.clipboard.writeText(text);
    setCopiedStyle(style);
    setTimeout(() => setCopiedStyle(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl p-6 sm:p-8 relative shadow-2xl space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100">
              <Quote className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Cite Research Paper</span>
              </h3>
              <p className="text-xs text-slate-500 truncate max-w-md">{paper.title}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-50 text-slate-500 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Citation Format Tabs */}
        <div className="flex items-center space-x-2 border-b border-slate-200 pb-3 select-none overflow-x-auto">
          {(['APA', 'IEEE', 'MLA', 'BibTeX'] as const).map((style) => (
            <button
              key={style}
              onClick={() => setActiveStyle(style)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeStyle === style
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              {style} Format
            </button>
          ))}
        </div>

        {/* Citation Text Box - Pure White, Clean Neutral Border */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              <span>{activeStyle} Citation String</span>
            </span>

            <button
              onClick={() => handleCopy(activeStyle)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                copiedStyle === activeStyle
                  ? 'bg-emerald-600 text-white'
                  : 'watt-btn-secondary'
              }`}
            >
              {copiedStyle === activeStyle ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-3" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy {activeStyle}</span>
                </>
              )}
            </button>
          </div>

          <pre className="w-full p-4 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap font-mono leading-relaxed overflow-x-auto selection:bg-blue-600 selection:text-white shadow-2xs">
            {getCitationText(activeStyle)}
          </pre>
        </div>

        {/* Footer */}
        <div className="pt-2 flex items-center justify-end border-t border-slate-200">
          <button
            onClick={onClose}
            className="watt-btn-secondary"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
