import React, { useState } from 'react';
import { X, Users, Sparkles, Trash2, ExternalLink, Edit, Quote } from 'lucide-react';
import type { ResearchPaper, User } from '../types';
import { paperService, SERVER_BASE_URL } from '../services/api';
import { CitationModal } from './CitationModal';


interface PaperDetailModalProps {
  paper: ResearchPaper;
  user: User | null;
  onClose: () => void;
  onDeleteSuccess?: () => void;
  onSelectAuthor?: (authorName: string) => void;
}

export const PaperDetailModal: React.FC<PaperDetailModalProps> = ({
  paper,
  user,
  onClose,
  onDeleteSuccess,
  onSelectAuthor,
}) => {

  const [currentPaper, setCurrentPaper] = useState<ResearchPaper>(paper);
  const [isEditing, setIsEditing] = useState(false);
  const [showCitationModal, setShowCitationModal] = useState(false);

  
  // Edit Form Fields
  const [editTitle, setEditTitle] = useState(paper.title);
  const [editAuthors, setEditAuthors] = useState(paper.authors_raw || "");
  const [editAbstract, setEditAbstract] = useState(paper.abstract || "");
  const [editJournal, setEditJournal] = useState(paper.journal_or_conference || "");
  const [editDoi, setEditDoi] = useState(paper.doi || "");
  const [editDept, setEditDept] = useState(paper.department);
  const [editType, setEditType] = useState(paper.publication_type || "Journal");
  const [editYear, setEditYear] = useState(paper.publication_year);
  const [editPaperUrl, setEditPaperUrl] = useState(paper.paper_url || "");
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state if prop changes
  React.useEffect(() => {
    setCurrentPaper(paper);
    setEditTitle(paper.title);
    setEditAuthors(paper.authors_raw || "");
    setEditAbstract(paper.abstract || "");
    setEditJournal(paper.journal_or_conference || "");
    setEditDoi(paper.doi || "");
    setEditDept(paper.department);
    setEditType(paper.publication_type || "Journal");
    setEditYear(paper.publication_year);
    setEditPaperUrl(paper.paper_url || "");
  }, [paper]);

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

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updated = await paperService.update(currentPaper.id, {
        title: editTitle,
        authors_raw: editAuthors,
        abstract: editAbstract,
        journal_or_conference: editJournal,
        doi: editDoi,
        department: editDept,
        publication_type: editType,
        publication_year: editYear,
        paper_url: editPaperUrl || ""
      });
      setCurrentPaper(updated);
      setIsEditing(false);
      if (onDeleteSuccess) onDeleteSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to update publication details.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-xl p-6 sm:p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto">
        
        <button
          onClick={onClose}
          className="absolute right-6 top-6 p-2 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {isEditing ? (
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2.5">
              <Edit className="w-5 h-5 text-blue-600" />
              <span>Edit Publication Metadata</span>
            </h3>
            
            {error && (
              <div className="p-3 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Title</label>
              <input
                type="text"
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Authors (Comma separated)</label>
                <input
                  type="text"
                  value={editAuthors}
                  onChange={(e) => setEditAuthors(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Journal or Conference</label>
                <input
                  type="text"
                  value={editJournal}
                  onChange={(e) => setEditJournal(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Department</label>
                <select
                  value={editDept}
                  onChange={(e) => setEditDept(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all cursor-pointer"
                >
                  {['Computer Science', 'Physics', 'Chemistry', 'Biotechnology', 'Mechanical Engineering', 'Electrical Engineering', 'Mathematics', 'Economics & Finance'].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Pub Type</label>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all cursor-pointer"
                >
                  {['Journal', 'Conference', 'Patent', 'Preprint'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Pub Year</label>
                <input
                  type="number"
                  value={editYear}
                  onChange={(e) => setEditYear(parseInt(e.target.value) || 2026)}
                  className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">DOI</label>
                <input
                  type="text"
                  value={editDoi}
                  onChange={(e) => setEditDoi(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">External Publication URL</label>
              <input
                type="url"
                value={editPaperUrl}
                onChange={(e) => setEditPaperUrl(e.target.value)}
                placeholder="https://doi.org/10.1007/..."
                className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Abstract</label>
              <textarea
                value={editAbstract}
                onChange={(e) => setEditAbstract(e.target.value)}
                rows={4}
                className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all resize-none"
              />
            </div>

            <div className="pt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="watt-btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="watt-btn-primary"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-700 mb-3">
              <span>{currentPaper.department}</span>
              <span>•</span>
              <span className="text-slate-500 font-normal">Published {currentPaper.publication_year}</span>
              <span>•</span>
              <span className="text-emerald-600 font-semibold">ML Conf: {(currentPaper.ml_confidence * 100).toFixed(1)}%</span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1 pr-10 leading-snug">
              {currentPaper.title}
            </h2>

            {/* Author List */}
            <div className="mt-5 p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-start space-x-3">
              <Users className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1.5 flex-1">
                <span className="text-slate-500 block font-bold uppercase text-[10px] tracking-wider">Authors &amp; Affiliation</span>
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {((currentPaper.authors_list && currentPaper.authors_list.length > 0)
                    ? currentPaper.authors_list
                    : (currentPaper.authors_raw ? currentPaper.authors_raw.split(',').map(s => s.trim()) : ['Faculty Author'])
                  ).map((author, idx) => (
                    <button
                      key={idx}
                      onClick={() => { if (onSelectAuthor) onSelectAuthor(author); }}
                      className="px-2.5 py-1 rounded-md bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-600 border border-slate-200 text-xs font-medium transition-all cursor-pointer flex items-center space-x-1.5"
                      title={`View ${author}'s Profile & Analytics`}
                    >
                      <span>{author}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>


            {/* AI Summary - Clean Box (No Left Glow Border) */}
            <div className="mt-5 p-4.5 rounded-lg bg-white border border-slate-200">
              <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 mb-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>AI Extractive Summary (NLP Sentence Scoring)</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed italic font-sans">
                “{currentPaper.ai_summary || currentPaper.abstract}”
              </p>
            </div>

            {/* Full Abstract */}
            <div className="mt-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Full Abstract</h4>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-200 font-sans">
                {currentPaper.abstract || 'No abstract text available for this paper.'}
              </p>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Journal / Conference</span>
                <span className="text-slate-900 font-semibold truncate block mt-1">{currentPaper.journal_or_conference || 'N/A'}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">DOI / Identifier</span>
                <span className="text-slate-900 font-semibold truncate block mt-1">{currentPaper.doi || 'N/A'}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">External Link</span>
                {currentPaper.paper_url ? (
                  <a
                    href={currentPaper.paper_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline font-semibold truncate block mt-1 flex items-center space-x-1"
                  >
                    <span>Visit Publication</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-slate-500 hover:text-blue-600 font-semibold block mt-1 text-left transition-colors cursor-pointer"
                  >
                    + Add paper link
                  </button>
                )}
              </div>
            </div>

            {/* Tags - Flat Metadata Text (No Pills) */}
            <div className="mt-5">
              <span className="text-xs font-semibold text-slate-500 block mb-2">Assigned Research Categories:</span>
              <div className="flex flex-wrap gap-2 text-xs">
                {(currentPaper.categories_list || []).map((tag, idx) => (
                  <span key={idx} className="text-slate-600 font-normal">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 pt-5 border-t border-slate-200 flex items-center justify-between">
              {user?.role === 'admin' ? (
                <button
                  onClick={() => handleDeletePaper(currentPaper.id)}
                  className="px-3.5 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Paper (Admin)</span>
                </button>
              ) : <div />}

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowCitationModal(true)}
                  className="watt-btn-secondary"
                  title="Generate APA, IEEE, MLA, or BibTeX citation"
                >
                  <Quote className="w-3.5 h-3.5 text-blue-600" />
                  <span>Cite Paper</span>
                </button>

                <button
                  onClick={() => setIsEditing(true)}
                  className="watt-btn-secondary"
                >
                  <Edit className="w-3.5 h-3.5 text-slate-600" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={onClose}
                  className="watt-btn-secondary"
                >
                  Close
                </button>
                {currentPaper.pdf_url && (
                  <a
                    href={`${SERVER_BASE_URL}${currentPaper.pdf_url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="watt-btn-primary"
                  >
                    <span>View PDF</span>
                    <ExternalLink className="w-3.5 h-3.5 text-white" />
                  </a>
                )}
              </div>
            </div>

            {/* Citation Exporter Modal */}
            {showCitationModal && (
              <CitationModal
                paper={currentPaper}
                onClose={() => setShowCitationModal(false)}
              />
            )}
          </>
        )}


      </div>
    </div>
  );
};
