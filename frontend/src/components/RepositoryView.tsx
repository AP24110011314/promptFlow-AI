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
      year: selectedYear === 'All' ? undefined : parseInt(selectedYear),
      start_year: startYear === 'All' ? undefined : parseInt(startYear),
      end_year: endYear === 'All' ? undefined : parseInt(endYear),
      publication_type: selectedType,
      author: authorQuery,
      quartile: selectedQuartile,
      query: searchQuery
    });
  };

  const handleExportPdf = () => {
    exportService.downloadPdf({
      department: selectedDept,
      category: selectedCat,
      year: selectedYear === 'All' ? undefined : parseInt(selectedYear),
      start_year: startYear === 'All' ? undefined : parseInt(startYear),
      end_year: endYear === 'All' ? undefined : parseInt(endYear),
      publication_type: selectedType,
      author: authorQuery,
      quartile: selectedQuartile,
      query: searchQuery
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
      
      {/* Top Header & Export / Upload Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2.5">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <span>Faculty Research Publication Repository</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse, search, and download verified research papers ingested from professor emails.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportExcel}
            title="Download Excel (.xlsx) Spreadsheet"
            className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-white stroke-[2.5]" />
            <span>Excel Export</span>
          </button>

          <button
            onClick={handleExportPdf}
            title="Download Formatted PDF Report"
            className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4 text-white stroke-[2.5]" />
            <span>PDF Export</span>
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            className="watt-btn-primary"
          >
            <Upload className="w-3.5 h-3.5 text-white" />
            <span>Upload PDF</span>
          </button>
        </div>
      </div>

      {/* Unified Research Workspace */}
      <div className="watt-card p-0 rounded-xl overflow-hidden border border-slate-200/80 shadow-xs">
        
        {/* Filter Toolbar Section */}
        <div className="p-5 sm:p-6 space-y-4 bg-white">
          {/* Row 1: Core Search and Department / Category / Type / Quartile */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSetSearchQuery(e.target.value)}
                placeholder="Search title, abstract..."
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all"
              />
            </div>

            {/* Department Filter */}
            <div>
              <select
                value={selectedDept}
                onChange={(e) => handleSetSelectedDept(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all cursor-pointer"
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
                className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all cursor-pointer"
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
                className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all cursor-pointer"
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
                className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all cursor-pointer"
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 pt-2 border-t border-slate-200">
            {/* Author Specific Search */}
            <div className="relative">
              <Users className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={authorQuery}
                onChange={(e) => handleSetAuthorQuery(e.target.value)}
                placeholder="Search by Author Name..."
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all"
              />
            </div>

            {/* Single Year */}
            <div>
              <select
                value={selectedYear}
                onChange={(e) => handleSetSelectedYear(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all cursor-pointer"
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
                className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all cursor-pointer disabled:opacity-40"
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
                className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all cursor-pointer disabled:opacity-40"
              >
                <option value="All">End Year: All</option>
                {years.filter(y => y !== 'All').map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear / Showing stats */}
          <div className="flex items-center justify-between text-sm text-slate-500 pt-2 border-t border-slate-200">
            <span>Showing <strong className="text-slate-900 font-mono">{filteredPapers.length}</strong> research publications</span>
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
                className="text-blue-600 hover:underline font-semibold cursor-pointer text-sm"
              >
                Reset All Filters
              </button>
            )}
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-slate-200" />

        {/* Papers Grid Section */}
        <div className="p-5 sm:p-6 bg-slate-50/60">
          {filteredPapers.length === 0 ? (
            <div className="py-12 text-center">
              <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-900">No research papers match your query</h3>
              <p className="text-sm text-slate-500 mt-1">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPapers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((paper) => (
                <div
                  key={paper.id}
                  onClick={() => onSelectPaper(paper)}
                  className="watt-card p-6 cursor-pointer flex flex-col justify-between group bg-white border border-slate-200/80 hover:border-slate-300 hover:shadow-md transition-all"
                >
                  <div>
                    {/* Header Metadata Row: Clean Flat Text (No Pills) */}
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <div className="flex items-center space-x-2 truncate text-slate-700 font-semibold">
                        <span>{paper.department || 'General'}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500 font-normal">{paper.publication_type || 'Journal'}</span>
                      </div>
                      <span className="text-sm font-mono text-slate-500 font-semibold shrink-0">
                        {paper.publication_year}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-3 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                      {paper.title}
                    </h3>

                    <p className="text-sm text-slate-600 mt-2.5 line-clamp-3 bg-slate-50 p-3 rounded-lg border border-slate-200/80 leading-relaxed font-normal">
                      {paper.ai_summary || paper.abstract || 'No summary available.'}
                    </p>

                    {/* Category Tags: Clean Flat Metadata (No Pills) */}
                    <div className="flex flex-wrap gap-2 mt-3 text-xs text-slate-500 font-medium">
                      {(paper.categories_list || []).slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="text-slate-500 font-medium border border-slate-200 px-2 py-0.5 rounded-md">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3.5 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500">
                    <div 
                      onClick={(e) => {
                        if (onSelectAuthor && paper.authors_raw) {
                          e.stopPropagation();
                          const firstAuthor = paper.authors_raw.split(',')[0].trim();
                          onSelectAuthor(firstAuthor);
                        }
                      }}
                      className="flex items-center space-x-1.5 truncate max-w-[65%] hover:text-blue-600 transition-colors cursor-pointer"
                      title="View Author Profile & Analytics"
                    >
                      <Users className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="truncate hover:underline text-slate-700 font-medium">{paper.authors_raw || 'College Faculty'}</span>
                    </div>

                    <div className="flex items-center space-x-1 text-blue-600 font-semibold text-sm shrink-0 group-hover:translate-x-0.5 transition-transform">
                      <span>View Details</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination Section */}
        {filteredPapers.length > itemsPerPage && (
          <>
            <div className="border-t border-slate-200" />
            <div className="p-4 sm:px-6 bg-white flex items-center justify-between">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="watt-btn-secondary"
              >
                Previous
              </button>
              <span className="text-xs text-slate-500 font-medium">
                Page <strong className="text-slate-900 font-mono">{currentPage}</strong> of <strong className="text-slate-900 font-mono">{Math.ceil(filteredPapers.length / itemsPerPage)}</strong>
              </span>
              <button
                disabled={currentPage === Math.ceil(filteredPapers.length / itemsPerPage)}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredPapers.length / itemsPerPage)))}
                className="watt-btn-secondary"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl p-6 sm:p-8 relative shadow-2xl">
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute right-6 top-6 p-2 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2 mb-1">
              <Upload className="w-5 h-5 text-blue-600" />
              <span>Multi-PDF Batch Research Ingestion</span>
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Drag &amp; drop multiple research paper PDFs. PyMuPDF &amp; Scikit-Learn will extract metadata in batch!
            </p>            {uploadError && (
              <div className="mb-4 watt-alert shadow-sm flex items-center space-x-2 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleBatchUploadSubmit} className="space-y-4">
              
              {/* Drag & Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                onDrop={handleFileDrop}
                className={`p-6 rounded-lg border-2 border-dashed text-center transition-all cursor-pointer relative ${
                  isDragging
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-slate-300 bg-slate-50 hover:border-slate-400'
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
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-200">
                    <Upload className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-bold text-slate-900">
                    Drag &amp; Drop Research PDFs Here or <span className="text-blue-600 underline">Browse</span>
                  </p>
                  <p className="text-[10px] text-slate-500">Select one or multiple PDF papers simultaneously</p>
                </div>
              </div>

              {/* Selected Files Queue List */}
              {uploadFiles.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                    <span>Batch Queue ({uploadFiles.length} files)</span>
                    <button
                      type="button"
                      onClick={() => setUploadFiles([])}
                      className="text-[10px] text-slate-500 hover:text-red-600 cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>

                  {uploadFiles.map((file, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2 truncate">
                        <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="text-slate-800 truncate font-medium">{file.name}</span>
                        <span className="text-[10px] text-slate-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        className="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Batch Processing Progress Bar */}
              {batchProgress && (
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                    <span className="truncate">Processing {batchProgress.currentFileName}...</span>
                    <span className="text-blue-600">{batchProgress.current} / {batchProgress.total}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-md bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Academic Department Hint</label>
                <select
                  value={uploadDeptHint}
                  onChange={(e) => setUploadDeptHint(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all cursor-pointer"
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
                  className="watt-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || uploadFiles.length === 0}
                  className="watt-btn-primary"
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
