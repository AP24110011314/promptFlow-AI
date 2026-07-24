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
  onSelectAuthor?: (authorName: string) => void;
}

export const RepositoryView: React.FC<RepositoryViewProps> = ({
  papers,
  categories,
  user,
  onRefresh,
  onSelectPaper,
  selectedPaper,
  onCloseModal,
  onSelectAuthor,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedCat, setSelectedCat] = useState('All');
  const [selectedYear, setSelectedYear] = useState<string>('All');
  
  // Advanced filters state
  const [selectedType, setSelectedType] = useState('All');
  const [authorQuery, setAuthorQuery] = useState('');
  const [startYear, setStartYear] = useState('All');
  const [endYear, setEndYear] = useState('All');
  const [selectedQuartile, setSelectedQuartile] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Multi-PDF Batch Upload State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadDeptHint, setUploadDeptHint] = useState('Computer Science');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; currentFileName: string } | null>(null);

  // Helpers to update filter and reset page
  const handleSetSearchQuery = (val: string) => { setSearchQuery(val); setCurrentPage(1); };
  const handleSetSelectedDept = (val: string) => { setSelectedDept(val); setCurrentPage(1); };
  const handleSetSelectedCat = (val: string) => { setSelectedCat(val); setCurrentPage(1); };
  const handleSetSelectedYear = (val: string) => { setSelectedYear(val); setCurrentPage(1); };
  const handleSetSelectedType = (val: string) => { setSelectedType(val); setCurrentPage(1); };
  const handleSetAuthorQuery = (val: string) => { setAuthorQuery(val); setCurrentPage(1); };
  const handleSetStartYear = (val: string) => { setStartYear(val); setCurrentPage(1); };
  const handleSetEndYear = (val: string) => { setEndYear(val); setCurrentPage(1); };
  const handleSetSelectedQuartile = (val: string) => { setSelectedQuartile(val); setCurrentPage(1); };


  const departments = ['All', 'Computer Science', 'Physics', 'Chemistry', 'Biotechnology', 'Mechanical Engineering', 'Electrical Engineering', 'Mathematics', 'Economics & Finance'];
  const years = ['All', '2026', '2025', '2024', '2023'];
  const pubTypes = ['All', 'Journal', 'Conference', 'Patent', 'Preprint'];

  // Filter logic
  const filteredPapers = papers.filter((p) => {
    const matchesQuery = !searchQuery || 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.abstract && p.abstract.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.authors_raw && p.authors_raw.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesDept = selectedDept === 'All' || p.department === selectedDept;
    const matchesCat = selectedCat === 'All' || (p.categories_list && p.categories_list.includes(selectedCat));
    
    // Type filter
    const paperType = p.publication_type || 'Journal';
    const matchesType = selectedType === 'All' || paperType.toLowerCase() === selectedType.toLowerCase();
    
    // Author search
    const matchesAuthor = !authorQuery || (p.authors_raw && p.authors_raw.toLowerCase().includes(authorQuery.toLowerCase()));
    
    // Time period filter
    let matchesTimePeriod = true;
    if (selectedYear !== 'All') {
      matchesTimePeriod = p.publication_year.toString() === selectedYear;
    } else {
      const yearVal = p.publication_year;
      const startVal = startYear !== 'All' ? parseInt(startYear) : -Infinity;
      const endVal = endYear !== 'All' ? parseInt(endYear) : Infinity;
      matchesTimePeriod = yearVal >= startVal && yearVal <= endVal;
    }

    // Quartile filter
    const matchesQuartile = selectedQuartile === 'All' || 
      (p.abstract && p.abstract.toLowerCase().includes(selectedQuartile.toLowerCase()));

    return matchesQuery && matchesDept && matchesCat && matchesType && matchesAuthor && matchesTimePeriod && matchesQuartile;
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

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files).filter(
        (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
      );
      if (droppedFiles.length > 0) {
        setUploadFiles((prev) => [...prev, ...droppedFiles]);
      }
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleBatchUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadFiles.length === 0) return;
    setUploading(true);
    setUploadError(null);

    let lastIngestedPaper: ResearchPaper | null = null;

    for (let i = 0; i < uploadFiles.length; i++) {
      const file = uploadFiles[i];
      setBatchProgress({ current: i + 1, total: uploadFiles.length, currentFileName: file.name });
      try {
        const newPaper = await paperService.uploadPdf(file, uploadDeptHint);
        lastIngestedPaper = newPaper;
      } catch (err: any) {
        console.error(`Error uploading ${file.name}:`, err);
        setUploadError(err.response?.data?.detail || `Failed to process ${file.name}`);
      }
    }

    setUploading(false);
    setBatchProgress(null);
    setShowUploadModal(false);
    setUploadFiles([]);
    onRefresh();

    if (lastIngestedPaper) {
      onSelectPaper(lastIngestedPaper);
    }
  };


  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header & Export / Upload Actions (Border-bottom instead of Card wrapper) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-brand-border/30">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center space-x-2.5 font-display">
            <BookOpen className="w-5.5 h-5.5 text-brand-cyan" />
            <span>Academic Research Repository</span>
          </h1>
          <p className="text-xs text-brand-gray mt-1">
            Browse, filter, and export college research publications indexed by our automated ML extraction engine.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportExcel}
            title="Download Excel (.xlsx) Spreadsheet"
            className="px-3 py-2 rounded-xl bg-brand-green/10 text-brand-green hover:bg-brand-green/20 border border-brand-green/30 font-semibold text-xs transition-all flex items-center space-x-1.5 shadow-xs cursor-pointer whitespace-nowrap"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>

          <button
            onClick={handleExportPdf}
            title="Download Formatted PDF Report"
            className="px-3 py-2 rounded-xl bg-brand-cyan/10 text-brand-cyan hover:bg-brand-cyan/20 border border-brand-cyan/30 font-semibold text-xs transition-all flex items-center space-x-1.5 shadow-xs cursor-pointer whitespace-nowrap"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            className="px-3.5 py-2 rounded-xl bg-brand-cyan hover:brightness-105 text-real-white font-bold text-xs shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer whitespace-nowrap"
          >
            <Upload className="w-3.5 h-3.5 text-real-white stroke-[2.5]" />
            <span>Upload PDF</span>
          </button>
        </div>
      </div>

      {/* Unified Research Workspace */}
      <div className="bg-brand-card rounded-2xl border border-brand-border shadow-sm overflow-hidden">
        
        {/* Filter Toolbar Section */}
        <div className="p-5 sm:p-6 space-y-4 bg-brand-card">
          {/* Row 1: Core Search and Department / Category / Type / Quartile */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-brand-gray" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSetSearchQuery(e.target.value)}
                placeholder="Search title, abstract..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-brand-bg border border-brand-border text-white placeholder-brand-gray text-xs focus:outline-none focus:border-brand-cyan transition-all"
              />
            </div>

            {/* Department Filter */}
            <div>
              <select
                value={selectedDept}
                onChange={(e) => handleSetSelectedDept(e.target.value)}
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
                onChange={(e) => handleSetSelectedCat(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-brand-bg border border-brand-border text-white text-xs focus:outline-none focus:border-brand-cyan transition-all cursor-pointer"
              >
                <option value="All">Category: All Topics</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>Tag: {cat.name}</option>
                ))}
              </select>
            </div>

            {/* Publication Type Filter */}
            <div>
              <select
                value={selectedType}
                onChange={(e) => handleSetSelectedType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-brand-bg border border-brand-border text-white text-xs focus:outline-none focus:border-brand-cyan transition-all cursor-pointer"
              >
                {pubTypes.map((type) => (
                  <option key={type} value={type}>Type: {type}</option>
                ))}
              </select>
            </div>

            {/* Journal Quartile Filter */}
            <div>
              <select
                value={selectedQuartile}
                onChange={(e) => handleSetSelectedQuartile(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-brand-bg border border-brand-border text-white text-xs focus:outline-none focus:border-brand-cyan transition-all cursor-pointer"
              >
                <option value="All">Quartile: All</option>
                <option value="Q1">Quartile: Q1</option>
                <option value="Q2">Quartile: Q2</option>
                <option value="Q3">Quartile: Q3</option>
                <option value="Q4">Quartile: Q4</option>
              </select>
            </div>

          </div>

          {/* Row 2: Advanced Author & Year Range (Time Period) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 border-t border-brand-border/40">
            {/* Author Specific Search */}
            <div className="relative">
              <Users className="absolute left-3.5 top-3 w-4 h-4 text-brand-gray" />
              <input
                type="text"
                value={authorQuery}
                onChange={(e) => handleSetAuthorQuery(e.target.value)}
                placeholder="Search by Author Name..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-brand-bg border border-brand-border text-white placeholder-brand-gray text-xs focus:outline-none focus:border-brand-cyan transition-all"
              />
            </div>

            {/* Single Year (Specific Year Override) */}
            <div>
              <select
                value={selectedYear}
                onChange={(e) => handleSetSelectedYear(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-brand-bg border border-brand-border text-white text-xs focus:outline-none focus:border-brand-cyan transition-all cursor-pointer"
              >
                <option value="All">Specific Year: All</option>
                {years.filter(y => y !== 'All').map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Start Year */}
            <div>
              <select
                disabled={selectedYear !== 'All'}
                value={startYear}
                onChange={(e) => handleSetStartYear(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-brand-bg border border-brand-border text-white text-xs focus:outline-none focus:border-brand-cyan transition-all cursor-pointer disabled:opacity-40"
              >
                <option value="All">Start Year: All</option>
                {years.filter(y => y !== 'All').slice().reverse().map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* End Year */}
            <div>
              <select
                disabled={selectedYear !== 'All'}
                value={endYear}
                onChange={(e) => handleSetEndYear(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-brand-bg border border-brand-border text-white text-xs focus:outline-none focus:border-brand-cyan transition-all cursor-pointer disabled:opacity-40"
              >
                <option value="All">End Year: All</option>
                {years.filter(y => y !== 'All').map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear / Showing stats */}
          <div className="flex items-center justify-between text-xs text-brand-gray pt-3 border-t border-brand-border/40">
            <span>Showing <strong className="text-white font-mono">{filteredPapers.length}</strong> research publications</span>
            {(searchQuery || authorQuery || selectedDept !== 'All' || selectedCat !== 'All' || selectedYear !== 'All' || selectedType !== 'All' || startYear !== 'All' || endYear !== 'All' || selectedQuartile !== 'All') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedDept('All');
                  setSelectedCat('All');
                  setSelectedYear('All');
                  setSelectedType('All');
                  setAuthorQuery('');
                  setStartYear('All');
                  setEndYear('All');
                  setSelectedQuartile('All');
                  setCurrentPage(1);
                }}
                className="text-brand-cyan hover:brightness-110 font-semibold underline cursor-pointer text-xs"
              >
                Reset All Filters
              </button>
            )}
          </div>
        </div>

        {/* Separator between filters and content */}
        <div className="border-t border-brand-border" />

        {/* Papers Grid Section */}
        <div className="p-5 sm:p-6 bg-brand-bg/15">
          {filteredPapers.length === 0 ? (
            <div className="py-12 text-center">
              <BookOpen className="w-12 h-12 text-brand-gray mx-auto mb-3" />
              <h3 className="text-base font-semibold text-white">No research papers match your query</h3>
              <p className="text-xs text-brand-gray mt-1">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPapers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((paper) => (
                <div
                  key={paper.id}
                  onClick={() => onSelectPaper(paper)}
                  className="bg-brand-card rounded-2xl p-5 border border-brand-border hover:border-brand-cyan transition-all flex flex-col justify-between group cursor-pointer shadow-2xs hover:shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-1.5 truncate max-w-[75%]">
                        <span className="px-2.5 py-1 rounded-lg bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20 text-[11px] font-semibold truncate">
                          {paper.department || 'General'}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-brand-green/10 text-brand-green border border-brand-green/20 text-[10px] font-bold truncate font-mono">
                          {paper.publication_type || 'Journal'}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono font-medium text-brand-gray bg-brand-bg px-2 py-0.5 rounded border border-brand-border shrink-0">
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
                    <div 
                      onClick={(e) => {
                        if (onSelectAuthor && paper.authors_raw) {
                          e.stopPropagation();
                          const firstAuthor = paper.authors_raw.split(',')[0].trim();
                          onSelectAuthor(firstAuthor);
                        }
                      }}
                      className="flex items-center space-x-1.5 truncate max-w-[65%] hover:text-brand-cyan transition-colors cursor-pointer"
                      title="View Author Profile & Analytics"
                    >
                      <Users className="w-3.5 h-3.5 text-brand-cyan shrink-0" />
                      <span className="truncate hover:underline">{paper.authors_raw || 'College Faculty'}</span>
                    </div>

                    <div className="flex items-center space-x-1 text-brand-cyan font-bold shrink-0">
                      <span>View Details</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination Section (Integrated at bottom of the unified card) */}
        {filteredPapers.length > itemsPerPage && (
          <>
            <div className="border-t border-brand-border" />
            <div className="p-4 sm:px-6 bg-brand-card flex items-center justify-between">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="px-4 py-2 rounded-xl bg-brand-bg text-white hover:bg-brand-hover hover:border-brand-cyan border border-brand-border text-xs font-bold transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                Previous
              </button>
              <span className="text-xs text-brand-gray font-medium">
                Page <strong className="text-white font-mono">{currentPage}</strong> of <strong className="text-white font-mono">{Math.ceil(filteredPapers.length / itemsPerPage)}</strong>
              </span>
              <button
                disabled={currentPage === Math.ceil(filteredPapers.length / itemsPerPage)}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredPapers.length / itemsPerPage)))}
                className="px-4 py-2 rounded-xl bg-brand-bg text-white hover:bg-brand-hover hover:border-brand-cyan border border-brand-border text-xs font-bold transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                Next
              </button>
            </div>
          </>
        )}

      </div>

      {/* Detailed Paper Modal */}
      {selectedPaper && (
        <PaperDetailModal
          paper={selectedPaper}
          user={user}
          onClose={onCloseModal}
          onDeleteSuccess={onRefresh}
          onSelectAuthor={onSelectAuthor}
        />
      )}


      {/* Upload PDF Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-lg bg-brand-card border border-brand-border rounded-3xl p-6 sm:p-8 relative shadow-2xl">
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute right-6 top-6 p-2 rounded-xl bg-brand-bg text-brand-gray hover:text-white border border-brand-border cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white flex items-center space-x-2 mb-1">
              <Upload className="w-5 h-5 text-brand-cyan" />
              <span>Multi-PDF Batch Research Ingestion</span>
            </h3>
            <p className="text-xs text-brand-gray mb-5">
              Drag &amp; drop multiple research paper PDFs. PyMuPDF &amp; Scikit-Learn will extract metadata in batch!
            </p>

            {uploadError && (
              <div className="mb-4 watt-alert shadow-lg flex items-center space-x-2 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleBatchUploadSubmit} className="space-y-4">
              
              {/* Drag & Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                onDrop={handleFileDrop}
                className={`p-6 rounded-2xl border-2 border-dashed text-center transition-all cursor-pointer relative ${
                  isDragging
                    ? 'border-brand-cyan bg-brand-cyan/10'
                    : 'border-brand-border bg-brand-bg/60 hover:border-brand-cyan/50'
                }`}
              >
                <input
                  type="file"
                  multiple
                  accept=".pdf"
                  onChange={(e) => {
                    if (e.target.files) {
                      const selected = Array.from(e.target.files).filter(
                        (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
                      );
                      setUploadFiles((prev) => [...prev, ...selected]);
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />

                <div className="space-y-2 pointer-events-none">
                  <div className="w-10 h-10 rounded-2xl bg-brand-cyan/15 text-brand-cyan flex items-center justify-center mx-auto">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-white">
                    Drag &amp; Drop Research PDFs Here or <span className="text-brand-cyan underline">Browse</span>
                  </p>
                  <p className="text-[10px] text-brand-gray">Select one or multiple PDF papers simultaneously</p>
                </div>
              </div>

              {/* Selected Files Queue List */}
              {uploadFiles.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <span>Batch Queue ({uploadFiles.length} files)</span>
                    <button
                      type="button"
                      onClick={() => setUploadFiles([])}
                      className="text-[10px] text-brand-gray hover:text-brand-red cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>

                  {uploadFiles.map((file, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-brand-bg border border-brand-border flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2 truncate">
                        <FileText className="w-3.5 h-3.5 text-brand-cyan shrink-0" />
                        <span className="text-white truncate font-medium">{file.name}</span>
                        <span className="text-[10px] text-brand-gray">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        className="p-1 text-brand-gray hover:text-brand-red transition-colors cursor-pointer shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Batch Processing Progress Bar */}
              {batchProgress && (
                <div className="p-3.5 rounded-2xl bg-brand-cyan/10 border border-brand-cyan/30 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <span className="truncate">Processing {batchProgress.currentFileName}...</span>
                    <span className="text-brand-cyan">{batchProgress.current} / {batchProgress.total}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-brand-bg overflow-hidden">
                    <div
                      className="h-full bg-brand-cyan transition-all duration-300"
                      style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

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

              <div className="pt-3 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => { setShowUploadModal(false); setUploadFiles([]); }}
                  className="px-4 py-2.5 rounded-xl bg-brand-bg hover:bg-brand-hover text-white border border-brand-border font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || uploadFiles.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-brand-cyan text-real-white font-bold text-xs shadow-md hover:brightness-110 disabled:opacity-50 transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <span>
                    {uploading
                      ? `Batch Ingesting (${batchProgress?.current || 1}/${uploadFiles.length})...`
                      : `Ingest ${uploadFiles.length} PDF${uploadFiles.length === 1 ? '' : 's'}`}
                  </span>
                </button>
              </div>
            </form>


          </div>
        </div>
      )}

    </div>
  );
};
