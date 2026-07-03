import React from 'react';
import { X, Users, CheckCircle2, Sparkles, Trash2, ExternalLink } from 'lucide-react';
import type { ResearchPaper, User } from '../types';
import { paperService, SERVER_BASE_URL } from '../services/api';

interface PaperDetailModalProps {
  paper: ResearchPaper;
  user: User | null;
  onClose: () => void;
  onDeleteSuccess?: () => void;
}

export const PaperDetailModal: React.FC<PaperDetailModalProps> = ({
  paper,
  user,
  onClose,
  onDeleteSuccess,
}) => {
  const handleDeletePaper = async (id: number) => {
    if (!window.confirm("Are you sure you want to remove this research paper from the repository?")) return;
    try {
      await paperService.delete(id);
      if (onDeleteSuccess) onDeleteSuccess();
      onClose();
    } catch (err) {
      alert("Error deleting paper. Admin role required.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-bg/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-3xl bg-brand-card border border-brand-border rounded-2xl p-6 sm:p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto">
        
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-xl bg-brand-bg text-brand-gray hover:text-white border border-brand-border transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-cyan mb-2">
          <span className="px-2.5 py-1 rounded bg-brand-cyan/10 border border-brand-cyan/20">
            {paper.department}
          </span>
          <span>•</span>
          <span className="font-mono">Published {paper.publication_year}</span>
          <span>•</span>
          <span className="text-brand-green flex items-center">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> ML Conf: {(paper.ml_confidence * 100).toFixed(1)}%
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-white mt-2 pr-8 leading-snug">
          {paper.title}
        </h2>

        {/* Author List */}
        <div className="mt-4 p-3.5 rounded-xl bg-brand-bg border border-brand-border flex items-center space-x-3">
          <Users className="w-5 h-5 text-brand-cyan shrink-0" />
          <div className="text-xs">
            <span className="text-brand-gray block font-semibold uppercase text-[10px]">Authors & Affiliation</span>
            <span className="text-white font-medium">{paper.authors_raw || paper.authors_list.join(", ")}</span>
          </div>
        </div>

        {/* AI Summary */}
        <div className="mt-5 p-4 rounded-xl bg-brand-bg border-l-4 border-brand-cyan shadow-lg">
          <div className="flex items-center space-x-2 text-xs font-bold text-brand-cyan mb-2">
            <Sparkles className="w-4 h-4 text-brand-cyan" />
            <span>AI Extractive Summary (NLP Sentence Scoring)</span>
          </div>
          <p className="text-xs sm:text-sm text-white leading-relaxed italic font-sans">
            “{paper.ai_summary || paper.abstract}”
          </p>
        </div>

        {/* Full Abstract */}
        <div className="mt-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-brand-gray mb-2">Full Abstract</h4>
          <p className="text-xs sm:text-sm text-brand-gray leading-relaxed bg-brand-bg p-4 rounded-xl border border-brand-border font-sans">
            {paper.abstract || 'No abstract text available for this paper.'}
          </p>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5 text-xs">
          <div className="p-3 rounded-xl bg-brand-bg border border-brand-border">
            <span className="text-brand-gray block text-[10px] uppercase font-semibold">Journal / Conference</span>
            <span className="text-white font-medium truncate block mt-0.5">{paper.journal_or_conference || 'N/A'}</span>
          </div>
          <div className="p-3 rounded-xl bg-brand-bg border border-brand-border">
            <span className="text-brand-gray block text-[10px] uppercase font-semibold">DOI / Identifier</span>
            <span className="text-white font-mono font-medium truncate block mt-0.5">{paper.doi || 'N/A'}</span>
          </div>
          <div className="p-3 rounded-xl bg-brand-bg border border-brand-border">
            <span className="text-brand-gray block text-[10px] uppercase font-semibold">Citations</span>
            <span className="text-brand-green font-mono font-bold block mt-0.5">{paper.citation_count} citations</span>
          </div>
        </div>

        {/* Tags */}
        <div className="mt-5">
          <span className="text-xs font-semibold text-brand-gray block mb-2">Assigned Research Categories:</span>
          <div className="flex flex-wrap gap-2">
            {(paper.categories_list || []).map((tag, idx) => (
              <span key={idx} className="px-3 py-1 rounded-lg bg-brand-cyan/15 text-brand-cyan text-xs font-medium border border-brand-cyan/30 font-mono">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 pt-4 border-t border-brand-border flex items-center justify-between">
          {user?.role === 'admin' ? (
            <button
              onClick={() => handleDeletePaper(paper.id)}
              className="px-4 py-2.5 rounded-xl bg-brand-red/10 text-brand-red hover:bg-brand-red/20 border border-brand-red/20 text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Paper (Admin)</span>
            </button>
          ) : <div />}

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-brand-bg hover:bg-brand-hover text-white border border-brand-border font-semibold text-xs transition-all cursor-pointer"
            >
              Close View
            </button>
            {paper.pdf_url && (
              <a
                href={`${SERVER_BASE_URL}${paper.pdf_url}`}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-cyan/80 text-brand-bg font-bold text-xs shadow-lg hover:brightness-110 transition-all flex items-center space-x-2 cursor-pointer"
              >
                <span>View Full PDF</span>
                <ExternalLink className="w-4 h-4 text-brand-bg stroke-[3]" />
              </a>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
