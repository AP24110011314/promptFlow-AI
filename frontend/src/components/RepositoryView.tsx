import React, { useState } from 'react';
import { Search, FileSpreadsheet, FileText, Upload, BookOpen, Users, X, AlertCircle } from 'lucide-react';
import type { ResearchPaper, Category, User } from '../types';
import { paperService, exportService } from '../services/api';
import { PaperDetailModal } from './PaperDetailModal';

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

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header & Export / Upload Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 watt-card">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center space-x-2.5">
            <BookOpen className="w-6 h-6 text-brand-cyan" />
            <span>Academic Research Repository</span>
          </h1>
          <p className="text-xs sm:text-sm text-brand-gray mt-1">
            Browse, filter, and export college research publications indexed by our automated ML extraction engine.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportExcel}
            title="Download Excel (.xlsx) Spreadsheet"
            className="px-4 py-2.5 rounded-xl bg-brand-green/10 text-brand-green hover:bg-brand-green/20 border border-brand-green/30 font-bold text-xs transition-all flex items-center space-x-2 shadow-sm cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel (.xlsx)</span>
          </button>

          <button
            onClick={handleExportPdf}
            title="Download Formatted PDF Report"
            className="px-4 py-2.5 rounded-xl bg-brand-cyan/15 text-brand-cyan hover:bg-brand-cyan/25 border border-brand-cyan/30 font-bold text-xs transition-all flex items-center space-x-2 shadow-sm cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Export PDF Report</span>
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-cyan/80 text-brand-bg font-bold text-xs shadow-lg hover:brightness-110 transition-all flex items-center space-x-2 cursor-pointer"
          >
            <Upload className="w-4 h-4 text-brand-bg stroke-[3]" />
            <span>Upload Research PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="watt-card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Search Bar */}
          <div className="md:col-span-1 relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-brand-gray" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, author, abstract..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-brand-bg border border-brand-border text-white placeholder-brand-gray text-xs focus:outline-none focus:border-brand-cyan transition-all"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-brand-bg border border-brand-border text-white text-xs focus:outline-none focus:border-brand-cyan transition-all cursor-pointer"
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
              className="w-full px-3.5 py-2.5 rounded-xl bg-brand-bg border border-brand-border text-white text-xs focus:outline-none focus:border-brand-cyan transition-all cursor-pointer"
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
              className="w-full px-3.5 py-2.5 rounded-xl bg-brand-bg border border-brand-border text-white text-xs focus:outline-none focus:border-brand-cyan transition-all cursor-pointer"
            >
              {years.map((year) => (
                <option key={year} value={year}>Year: {year}</option>
              ))}
            </select>
          </div>

        </div>

        <div className="flex items-center justify-between text-xs text-brand-gray pt-2 border-t border-brand-border">
          <span>Showing <strong className="text-white font-mono">{filteredPapers.length}</strong> research publications</span>
          {(searchQuery || selectedDept !== 'All' || selectedCat !== 'All' || selectedYear !== 'All') && (
            <button
              onClick={() => { setSearchQuery(''); setSelectedDept('All'); setSelectedCat('All'); setSelectedYear('All'); }}
              className="text-brand-cyan hover:brightness-110 font-semibold underline cursor-pointer"
            >
              Reset All Filters
            </button>
          )}
        </div>
      </div>

      {/* Papers Grid */}
      {filteredPapers.length === 0 ? (
        <div className="watt-card p-12 text-center">
          <BookOpen className="w-12 h-12 text-brand-gray mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No research papers match your query</h3>
          <p className="text-xs text-brand-gray mt-1">Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPapers.map((paper) => (
            <div
              key={paper.id}
              onClick={() => onSelectPaper(paper)}
              className="watt-card hover:border-brand-cyan cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20 text-[11px] font-semibold truncate">
                    {paper.department || 'General'}
                  </span>
                  <span className="text-[11px] font-mono font-medium text-brand-gray bg-brand-bg px-2 py-0.5 rounded border border-brand-border">
                    {paper.publication_year}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white mt-3 group-hover:text-brand-cyan transition-colors line-clamp-2">
                  {paper.title}
                </h3>

                <p className="text-xs text-brand-gray mt-2 line-clamp-3 italic bg-brand-bg p-2.5 rounded-xl border border-brand-border">
                  {paper.ai_summary || paper.abstract || 'No summary available.'}
                </p>

                {/* Category Tags */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {(paper.categories_list || []).slice(0, 3).map((tag, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md bg-brand-cyan/10 text-brand-cyan text-[10px] font-medium border border-brand-cyan/20 font-mono">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-brand-border flex items-center justify-between text-xs text-brand-gray">
                <div className="flex items-center space-x-1.5 truncate max-w-[65%]">
                  <Users className="w-3.5 h-3.5 text-brand-gray shrink-0" />
                  <span className="truncate">{paper.authors_raw || 'College Faculty'}</span>
                </div>
                <div className="flex items-center space-x-1 text-brand-cyan font-bold shrink-0">
                  <span>View Details</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detailed Paper Modal */}
      {selectedPaper && (
        <PaperDetailModal
          paper={selectedPaper}
          user={user}
          onClose={onCloseModal}
          onDeleteSuccess={onRefresh}
        />
      )}

      {/* Upload PDF Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-bg/85 backdrop-blur-md">
          <div className="w-full max-w-lg bg-brand-card border border-brand-border rounded-2xl p-6 sm:p-8 relative shadow-2xl">
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute right-5 top-5 p-2 rounded-xl bg-brand-bg text-brand-gray hover:text-white border border-brand-border cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white flex items-center space-x-2 mb-2">
              <Upload className="w-5 h-5 text-brand-cyan" />
              <span>Upload Research Publication PDF</span>
            </h3>
            <p className="text-xs text-brand-gray mb-6">
              Our backend ML & PyMuPDF extractor will automatically parse Title, Authors, Abstract, Year, and auto-tag categories!
            </p>

            {uploadError && (
              <div className="mb-4 watt-alert shadow-lg flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-brand-gray mb-1">Select PDF File</label>
                <input
                  type="file"
                  required
                  accept=".pdf"
                  onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full p-3 rounded-xl bg-brand-bg border border-brand-border text-white text-xs file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-brand-cyan/20 file:text-brand-cyan hover:file:bg-brand-cyan/30 transition-all cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-brand-gray mb-1">Academic Department Hint</label>
                <select
                  value={uploadDeptHint}
                  onChange={(e) => setUploadDeptHint(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-brand-bg border border-brand-border text-white text-xs focus:outline-none focus:border-brand-cyan transition-all cursor-pointer"
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
                  className="px-4 py-2.5 rounded-xl bg-brand-bg hover:bg-brand-hover text-white border border-brand-border font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !uploadFile}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-cyan/80 text-brand-bg font-bold text-xs shadow-lg hover:brightness-110 disabled:opacity-50 transition-all flex items-center space-x-2 cursor-pointer"
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
