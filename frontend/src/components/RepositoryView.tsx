import React, { useState } from 'react';
import { Search, FileSpreadsheet, FileText, Upload, BookOpen, Users, ExternalLink, Trash2, X, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import type { ResearchPaper, Category, User } from '../types';
import { paperService, exportService, SERVER_BASE_URL } from '../services/api';

interface RepositoryViewProps {
  papers: ResearchPaper[];
  categories: Category[];
  user: User | null;
  onRefresh: () => void;
  onSelectPaper: (paper: ResearchPaper) => void;
  selectedPaper: ResearchPaper | null;
  onCloseModal: () => void;
}

export const RepositoryView: React.FC<RepositoryViewProps> = ({
  papers,
  categories,
  user,
  onRefresh,
  onSelectPaper,
  selectedPaper,
  onCloseModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedCat, setSelectedCat] = useState('All');
  const [selectedYear, setSelectedYear] = useState<string>('All');
  
  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDeptHint, setUploadDeptHint] = useState('Computer Science');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const departments = ['All', 'Computer Science', 'Physics', 'Chemistry', 'Biotechnology', 'Mechanical Engineering', 'Electrical Engineering', 'Mathematics', 'Economics & Finance'];
  const years = ['All', '2026', '2025', '2024', '2023'];

  // Filter logic
  const filteredPapers = papers.filter((p) => {
    const matchesQuery = !searchQuery || 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.abstract && p.abstract.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.authors_raw && p.authors_raw.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesDept = selectedDept === 'All' || p.department === selectedDept;
    const matchesCat = selectedCat === 'All' || (p.categories_list && p.categories_list.includes(selectedCat));
    const matchesYear = selectedYear === 'All' || p.publication_year.toString() === selectedYear;

    return matchesQuery && matchesDept && matchesCat && matchesYear;
  });

  const handleExportExcel = () => {
    exportService.downloadExcel({
      department: selectedDept,
      category: selectedCat,
      year: selectedYear === 'All' ? undefined : parseInt(selectedYear)
    });
  };

  const handleExportPdf = () => {
    exportService.downloadPdf({
      department: selectedDept,
      category: selectedCat,
      year: selectedYear === 'All' ? undefined : parseInt(selectedYear)
    });
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;
    setUploading(true);
    setUploadError(null);
    try {
      const newPaper = await paperService.uploadPdf(uploadFile, uploadDeptHint);
      setShowUploadModal(false);
      setUploadFile(null);
      onRefresh();
      onSelectPaper(newPaper);
    } catch (err: any) {
      setUploadError(err.response?.data?.detail || 'Failed to upload and parse PDF file.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePaper = async (id: number) => {
    if (!window.confirm("Are you sure you want to remove this research paper from the repository?")) return;
    try {
      await paperService.delete(id);
      onCloseModal();
      onRefresh();
    } catch (err) {
      alert("Error deleting paper. Admin role required.");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header & Export / Upload Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card rounded-2xl p-6 border border-slate-800/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center space-x-2.5">
            <BookOpen className="w-6 h-6 text-indigo-400" />
            <span>Academic Research Repository</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Browse, filter, and export college research publications indexed by our automated ML extraction engine.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportExcel}
            title="Download Excel (.xlsx) Spreadsheet"
            className="px-4 py-2.5 rounded-xl bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/30 font-semibold text-xs transition-all flex items-center space-x-2 shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export Excel (.xlsx)</span>
          </button>

          <button
            onClick={handleExportPdf}
            title="Download Formatted PDF Report"
            className="px-4 py-2.5 rounded-xl bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 border border-blue-500/30 font-semibold text-xs transition-all flex items-center space-x-2 shadow-sm"
          >
            <FileText className="w-4 h-4 text-blue-400" />
            <span>Export PDF Report</span>
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-semibold text-xs shadow-lg hover:from-indigo-500 hover:to-cyan-400 transition-all flex items-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Research PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card rounded-2xl p-5 border border-slate-800/80 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Search Bar */}
          <div className="md:col-span-1 relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, author, abstract..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>Dept: {dept}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all"
            >
              <option value="All">Category: All Topics</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>Tag: {cat.name}</option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all"
            >
              {years.map((year) => (
                <option key={year} value={year}>Year: {year}</option>
              ))}
            </select>
          </div>

        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
          <span>Showing <strong className="text-white">{filteredPapers.length}</strong> research publications</span>
          {(searchQuery || selectedDept !== 'All' || selectedCat !== 'All' || selectedYear !== 'All') && (
            <button
              onClick={() => { setSearchQuery(''); setSelectedDept('All'); setSelectedCat('All'); setSelectedYear('All'); }}
              className="text-indigo-400 hover:text-indigo-300 font-semibold underline"
            >
              Reset All Filters
            </button>
          )}
        </div>
      </div>

      {/* Papers Grid */}
      {filteredPapers.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-slate-800/80">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No research papers match your query</h3>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPapers.map((paper) => (
            <div
              key={paper.id}
              onClick={() => onSelectPaper(paper)}
              className="glass-card rounded-2xl p-5 border border-slate-800/80 hover:border-indigo-500/40 cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[11px] font-semibold truncate">
                    {paper.department || 'General'}
                  </span>
                  <span className="text-[11px] font-medium text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
                    {paper.publication_year}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white mt-3 group-hover:text-indigo-300 transition-colors line-clamp-2">
                  {paper.title}
                </h3>

                <p className="text-xs text-slate-400 mt-2 line-clamp-3 italic bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
                  {paper.ai_summary || paper.abstract || 'No summary available.'}
                </p>

                {/* Category Tags */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {(paper.categories_list || []).slice(0, 3).map((tag, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 text-[10px] font-medium border border-cyan-500/20">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center space-x-1.5 truncate max-w-[65%]">
                  <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{paper.authors_raw || 'College Faculty'}</span>
                </div>
                <div className="flex items-center space-x-1 text-indigo-400 font-semibold shrink-0">
                  <span>View Details</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detailed Paper Modal */}
      {selectedPaper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-3xl glass-card rounded-2xl p-6 sm:p-8 relative border border-slate-800/80 shadow-2xl max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={onCloseModal}
              className="absolute right-5 top-5 p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-2">
              <span className="px-2.5 py-1 rounded bg-indigo-500/10 border border-indigo-500/20">
                {selectedPaper.department}
              </span>
              <span>•</span>
              <span>Published {selectedPaper.publication_year}</span>
              <span>•</span>
              <span className="text-emerald-400 flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> ML Confidence: {(selectedPaper.ml_confidence * 100).toFixed(1)}%
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white mt-2 pr-8 leading-snug">
              {selectedPaper.title}
            </h2>

            {/* Author List */}
            <div className="mt-4 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center space-x-3">
              <Users className="w-5 h-5 text-indigo-400 shrink-0" />
              <div className="text-xs">
                <span className="text-slate-400 block font-semibold uppercase text-[10px]">Authors & Affiliation</span>
                <span className="text-slate-200 font-medium">{selectedPaper.authors_raw || selectedPaper.authors_list.join(", ")}</span>
              </div>
            </div>

            {/* AI Summary */}
            <div className="mt-5 p-4 rounded-xl bg-gradient-to-r from-indigo-950/40 via-slate-900/80 to-cyan-950/30 border border-indigo-500/30">
              <div className="flex items-center space-x-2 text-xs font-bold text-indigo-300 mb-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>AI Extractive Summary (NLP Sentence Scoring)</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed italic">
                “{selectedPaper.ai_summary || selectedPaper.abstract}”
              </p>
            </div>

            {/* Full Abstract */}
            <div className="mt-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Full Abstract</h4>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
                {selectedPaper.abstract || 'No abstract text available for this paper.'}
              </p>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Journal / Conference</span>
                <span className="text-slate-200 font-medium truncate block mt-0.5">{selectedPaper.journal_or_conference || 'N/A'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">DOI / Identifier</span>
                <span className="text-slate-200 font-medium truncate block mt-0.5">{selectedPaper.doi || 'N/A'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Citations</span>
                <span className="text-emerald-400 font-bold block mt-0.5">{selectedPaper.citation_count} citations</span>
              </div>
            </div>

            {/* Tags */}
            <div className="mt-5">
              <span className="text-xs font-semibold text-slate-400 block mb-2">Assigned Research Categories:</span>
              <div className="flex flex-wrap gap-2">
                {(selectedPaper.categories_list || []).map((tag, idx) => (
                  <span key={idx} className="px-3 py-1 rounded-lg bg-indigo-500/15 text-indigo-300 text-xs font-medium border border-indigo-500/30">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-between">
              {user?.role === 'admin' ? (
                <button
                  onClick={() => handleDeletePaper(selectedPaper.id)}
                  className="px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 text-xs font-semibold transition-all flex items-center space-x-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Paper (Admin)</span>
                </button>
              ) : <div />}

              <div className="flex items-center space-x-3">
                <button
                  onClick={onCloseModal}
                  className="px-5 py-2.5 rounded-xl bg-slate-800/80 text-slate-300 hover:bg-slate-700 font-semibold text-xs transition-all"
                >
                  Close View
                </button>
                {selectedPaper.pdf_url && (
                  <a
                    href={`${SERVER_BASE_URL}${selectedPaper.pdf_url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-semibold text-xs shadow-lg hover:from-indigo-500 hover:to-cyan-400 transition-all flex items-center space-x-2"
                  >
                    <span>View Full PDF</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Upload PDF Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg glass-card rounded-2xl p-6 sm:p-8 relative border border-slate-800/80 shadow-2xl glow-indigo">
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute right-5 top-5 p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white flex items-center space-x-2 mb-2">
              <Upload className="w-5 h-5 text-indigo-400" />
              <span>Upload Research Publication PDF</span>
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Our backend ML & PyMuPDF extractor will automatically parse Title, Authors, Abstract, Year, and auto-tag categories!
            </p>

            {uploadError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Select PDF File</label>
                <input
                  type="file"
                  required
                  accept=".pdf"
                  onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full p-3 rounded-xl bg-slate-900/80 border border-slate-700/80 text-slate-200 text-xs file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-500/20 file:text-indigo-300 hover:file:bg-indigo-500/30 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Academic Department Hint</label>
                <select
                  value={uploadDeptHint}
                  onChange={(e) => setUploadDeptHint(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all"
                >
                  {departments.filter(d => d !== 'All').map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !uploadFile}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-semibold text-xs shadow-lg hover:from-indigo-500 hover:to-cyan-400 disabled:opacity-50 transition-all flex items-center space-x-2"
                >
                  <span>{uploading ? 'Extracting & Parsing with ML...' : 'Upload & Parse PDF'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
