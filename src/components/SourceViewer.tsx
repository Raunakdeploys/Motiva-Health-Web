import React, { useState, useMemo } from 'react';
import { EvidencePassage, PaperRecord } from '../types';
import {
  Search,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Info,
  Maximize2,
  Minimize2,
  Quote,
  Check,
} from 'lucide-react';

interface SourceViewerProps {
  paper: PaperRecord;
  passages: EvidencePassage[];
  selectedPassageId: string | null;
  onSelectPassage: (passage: EvidencePassage) => void;
  activeSearchQuery?: string;
  highlightText?: string;
  targetPage?: number;
}

export const SourceViewer: React.FC<SourceViewerProps> = ({
  paper,
  passages,
  selectedPassageId,
  onSelectPassage,
  activeSearchQuery = '',
  highlightText = '',
  targetPage,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(targetPage || 1);
  const [internalSearch, setInternalSearch] = useState<string>(activeSearchQuery);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('ALL');

  const paperPassages = useMemo(
    () => passages.filter((p) => p.paper_id === paper.paper_id),
    [passages, paper.paper_id]
  );

  const totalPages = Math.max(
    paper.total_pages || 1,
    ...paperPassages.map((p) => p.pdf_page_index)
  );

  // Sync when targetPage changes from parent
  React.useEffect(() => {
    if (targetPage && targetPage >= 1 && targetPage <= totalPages) {
      setCurrentPage(targetPage);
    }
  }, [targetPage, totalPages]);

  // Passages on current page
  const currentPagePassages = useMemo(() => {
    return paperPassages.filter((p) => p.pdf_page_index === currentPage);
  }, [paperPassages, currentPage]);

  const filteredPassages = useMemo(() => {
    return currentPagePassages.filter((p) => {
      const matchSection =
        selectedSectionFilter === 'ALL' || p.section === selectedSectionFilter;
      const matchQuery =
        !internalSearch.trim() ||
        p.verbatim_text.toLowerCase().includes(internalSearch.toLowerCase());
      return matchSection && matchQuery;
    });
  }, [currentPagePassages, selectedSectionFilter, internalSearch]);

  const sections = ['ALL', 'Abstract', 'Methods', 'Results', 'Discussion', 'Limitations'];

  // Helper to highlight matching keywords safely
  const renderHighlightedContent = (text: string) => {
    const term = internalSearch.trim() || highlightText.trim();
    if (!term || term.length < 3) {
      return text;
    }

    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark
          key={index}
          className="bg-[#BB4B2D]/20 text-[#391E1D] font-semibold px-0.5 rounded-2xs"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#FFFDF9] border border-[#DED2C5] overflow-hidden">
      {/* 01. Galley Document Ribbon & Controls */}
      <div className="p-3 bg-[#F5EFE6]/60 border-b border-[#DED2C5] flex flex-wrap items-center justify-between gap-2.5 text-xs">
        {/* Page Navigation */}
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] uppercase text-[#786A61] font-semibold">
            Page:
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1 border border-[#DED2C5] hover:bg-[#FFFDF9] disabled:opacity-30 rounded-xs cursor-pointer text-[#391E1D]"
              title="Previous page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-xs font-bold text-[#391E1D] px-1.5">
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1 border border-[#DED2C5] hover:bg-[#FFFDF9] disabled:opacity-30 rounded-xs cursor-pointer text-[#391E1D]"
              title="Next page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Page Picker Buttons */}
        <div className="hidden sm:flex items-center gap-1">
          {Array.from({ length: Math.min(8, totalPages) }).map((_, i) => {
            const pageNum = i + 1;
            const hasPassages = paperPassages.some((p) => p.pdf_page_index === pageNum);
            const isSelected = currentPage === pageNum;
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-6 h-6 text-[10px] font-mono rounded-xs border transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#74191D] text-[#FFFDF9] border-[#74191D] font-bold'
                    : hasPassages
                    ? 'bg-[#FFFDF9] text-[#391E1D] border-[#DED2C5] hover:bg-[#F5EFE6]'
                    : 'bg-transparent text-[#786A61]/40 border-transparent'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoomScale((z) => Math.max(0.8, z - 0.1))}
            className="p-1 border border-[#DED2C5] hover:bg-[#FFFDF9] rounded-xs text-[#786A61] cursor-pointer"
            title="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-mono text-[#786A61] px-1">
            {Math.round(zoomScale * 100)}%
          </span>
          <button
            onClick={() => setZoomScale((z) => Math.min(1.4, z + 0.1))}
            className="p-1 border border-[#DED2C5] hover:bg-[#FFFDF9] rounded-xs text-[#786A61] cursor-pointer"
            title="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 02. Search & Section Filter Bar */}
      <div className="p-2.5 border-b border-[#DED2C5] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-[#FFFDF9] text-xs">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-[#786A61] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={internalSearch}
            onChange={(e) => setInternalSearch(e.target.value)}
            placeholder="Search text on page..."
            className="w-full bg-[#FFFDF9] border border-[#DED2C5] text-xs py-1 pl-8 pr-3 text-[#391E1D] placeholder-[#786A61] rounded-xs focus:outline-none focus:border-[#74191D]"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto text-[10px] font-mono">
          {sections.map((sec) => (
            <button
              key={sec}
              onClick={() => setSelectedSectionFilter(sec)}
              className={`px-2 py-0.5 rounded-xs transition-colors cursor-pointer whitespace-nowrap ${
                selectedSectionFilter === sec
                  ? 'bg-[#391E1D] text-[#FFFDF9] font-semibold'
                  : 'text-[#786A61] hover:text-[#391E1D] hover:bg-[#F5EFE6]'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>
      </div>

      {/* 03. Galley Proof Reading Canvas */}
      <div
        className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F5EFE6]/30 divide-y divide-[#DED2C5]/70 space-y-4"
        style={{ fontSize: `${zoomScale * 0.875}rem` }}
      >
        {/* Source Authenticity Disclosure */}
        <div className="p-2 bg-[#F5EFE6] border border-[#DED2C5] text-[10px] font-mono text-[#786A61] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#74191D] shrink-0" />
            <span>
              SOURCE GALLEY · PAGE {currentPage} OF {totalPages}
            </span>
          </div>
          <span>Exact PDF text anchor (OCR bbox unavailable)</span>
        </div>

        {filteredPassages.length > 0 ? (
          filteredPassages.map((passage) => {
            const isSelected = selectedPassageId === passage.evidence_id;

            return (
              <div
                key={passage.evidence_id}
                id={passage.evidence_id}
                onClick={() => onSelectPassage(passage)}
                className={`pt-3 pb-4 transition-all cursor-pointer rounded-xs px-3 ${
                  isSelected
                    ? 'bg-[#F7E9DE] border-l-3 border-[#74191D] shadow-xs'
                    : 'hover:bg-[#FFFDF9]'
                }`}
              >
                {/* Section & Metadata Header */}
                <div className="flex items-center justify-between text-[10px] font-mono text-[#786A61] mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#74191D]">
                      Section: {passage.section}
                    </span>
                    <span>·</span>
                    <span>Page {passage.pdf_page_index}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[#391E1D] font-mono">
                      ID: {passage.evidence_id}
                    </span>
                    <span>·</span>
                    <span>{passage.char_count} chars</span>
                  </div>
                </div>

                {/* Verbatim Typography */}
                <div className="font-serif leading-relaxed text-[#391E1D] text-justify space-y-2">
                  <p>{renderHighlightedContent(passage.verbatim_text)}</p>
                </div>

                {isSelected && (
                  <div className="mt-2.5 pt-2 border-t border-[#DED2C5] flex items-center justify-between text-[10px] font-mono text-[#74191D] font-semibold">
                    <span className="flex items-center gap-1">
                      <Quote className="w-3 h-3 text-[#BB4B2D]" />
                      Active Evidence Anchor Selected
                    </span>
                    <span className="text-[#786A61] font-normal">
                      Click to formulate or review claim
                    </span>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="py-16 text-center text-[#786A61] space-y-2">
            <BookOpen className="w-6 h-6 mx-auto text-[#DED2C5]" />
            <p className="text-xs">No extracted passages found on Page {currentPage} matching this filter.</p>
            <button
              onClick={() => {
                setSelectedSectionFilter('ALL');
                setInternalSearch('');
              }}
              className="text-[11px] font-mono text-[#74191D] hover:underline cursor-pointer"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>

      {/* 04. Bottom Status & Ingestion Trace */}
      <div className="p-2.5 bg-[#FFFDF9] border-t border-[#DED2C5] flex items-center justify-between text-[10px] font-mono text-[#786A61]">
        <span className="truncate max-w-[280px]">
          {paper.filename} ({paper.journal})
        </span>
          <span className="text-[#786A61] font-medium">
            Source text · review status shown above
          </span>
      </div>
    </div>
  );
};
