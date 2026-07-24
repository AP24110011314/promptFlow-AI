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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-brand-card border border-brand-border rounded-3xl p-6 sm:p-8 relative shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-border pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-cyan/15 text-brand-cyan flex items-center justify-center font-bold">
              <Quote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Cite Research Paper</span>
              </h3>
              <p className="text-xs text-brand-gray truncate max-w-md">{paper.title}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-brand-bg text-brand-gray hover:text-white border border-brand-border transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Citation Format Tabs */}
        <div className="flex items-center space-x-2 border-b border-brand-border pb-2 select-none overflow-x-auto">
          {(['APA', 'IEEE', 'MLA', 'BibTeX'] as const).map((style) => (
            <button
              key={style}
              onClick={() => setActiveStyle(style)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeStyle === style
                  ? 'bg-brand-cyan text-real-white shadow-xs'
                  : 'bg-brand-bg text-brand-gray hover:text-white border border-brand-border'
              }`}
            >
              {style} Format
            </button>
          ))}
        </div>

        {/* Citation Text Box */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-gray flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-brand-cyan" />
              <span>{activeStyle} Citation String</span>
            </span>

            <button
              onClick={() => handleCopy(activeStyle)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                copiedStyle === activeStyle
                  ? 'bg-emerald-500 text-real-white'
                  : 'bg-brand-cyan/15 text-brand-cyan hover:bg-brand-cyan/25 border border-brand-cyan/30'
              }`}
            >
              {copiedStyle === activeStyle ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy {activeStyle}</span>
                </>
              )}
            </button>
          </div>

          <pre className="w-full p-4 rounded-2xl bg-brand-bg border border-brand-border text-xs text-white whitespace-pre-wrap font-mono leading-relaxed overflow-x-auto selection:bg-brand-cyan selection:text-white">
            {getCitationText(activeStyle)}
          </pre>
        </div>

        {/* Footer */}
        <div className="pt-2 flex items-center justify-end border-t border-brand-border">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-brand-bg hover:bg-brand-hover text-white border border-brand-border text-xs font-bold transition-all cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
