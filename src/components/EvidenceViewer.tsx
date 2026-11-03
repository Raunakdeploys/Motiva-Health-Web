import React, { useState } from 'react';
import { EvidencePassage, PaperRecord, ClaimRecord } from '../types';
import {
  Search,
  BookOpen,
  Plus,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Quote,
  CheckCircle2,
  FileText,
  ExternalLink,
} from 'lucide-react';

interface EvidenceViewerProps {
  activePaper: PaperRecord | null;
  passages: EvidencePassage[];
  claims: ClaimRecord[];
  highlightEvidenceId?: string | null;
  onFormulateClaim: (passage: EvidencePassage) => void;
  onNavigateToReview: () => void;
}

export const EvidenceViewer: React.FC<EvidenceViewerProps> = ({
  activePaper,
  passages,
  claims,
  highlightEvidenceId,
  onFormulateClaim,
  onNavigateToReview,
}) => {
  const [selectedPageIndex, setSelectedPageIndex] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [selectedPassageId, setSelectedPassageId] = useState<string | null>(
    highlightEvidenceId || null
  );

  if (!activePaper) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-full bg-[#E6CBBD]/40 flex items-center justify-center text-[#661414]">
          <BookOpen className="w-7 h-7" />
        </div>
        <h3 className="font-serif text-xl font-bold text-[#351D1D]">No Active Scientific Paper</h3>
        <p className="text-xs text-[#786A61] max-w-md mx-auto leading-relaxed">
          Please ingest or select a scientific paper in the library to inspect verbatim evidence passages and verify source provenance.
        </p>
      </div>
    );
  }

  const paperPassages = passages.filter((p) => p.paper_id === activePaper.paper_id);
  const totalPages = Math.max(
    activePaper.total_pages || 1,
    ...paperPassages.map((p) => p.pdf_page_index)
  );

  // Filter passages for current page
  const pagePassages = paperPassages.filter((p) => p.pdf_page_index === selectedPageIndex);
  const filteredPassages = (
    selectedSection === 'ALL'
      ? pagePassages
      : pagePassages.filter((p) => p.section === selectedSection)
  ).filter((p) =>
    searchQuery === ''
      ? true
      : p.verbatim_text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activePassage =
    paperPassages.find((p) => p.evidence_id === selectedPassageId) ||
    filteredPassages[0] ||
    paperPassages[0] ||
    null;

  const linkedClaimsToActive = activePassage
    ? claims.filter((c) => c.evidence_ids.includes(activePassage.evidence_id))
    : [];

  const sections = ['ALL', 'Abstract', 'Methods', 'Results', 'Discussion', 'Limitations', 'Other'];

  return (
    <div className="max-w-[1500px] mx-auto p-4 sm:p-6 space-y-6">
      {/* 01. Desk Header & Toolbar */}
      <div className="bg-[#FFFDF9] border border-[#E6CBBD] p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xs shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#661414] text-[#F5EBDF] text-[10px] font-mono font-bold uppercase rounded-xs">
              EVIDENCE STITCH
            </span>
            <h2 className="font-serif text-lg font-bold text-[#351D1D] tracking-tight">
              Verbatim Evidence & Source Provenance
            </h2>
          </div>
          <p className="text-xs text-[#786A61] leading-relaxed">
            Examine verbatim document passages extracted page by page from{' '}
            <span className="font-semibold text-[#351D1D]">{activePaper.title}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToReview}
            className="px-4 py-2 text-xs font-semibold bg-[#661414] hover:bg-[#501010] text-[#FFFDF9] rounded-xs flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
          >
            <span>Proceed to Doctor Review</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 02. Two-Column Workspace: Left Page & Passages Explorer, Right Passage Provenance Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Galley Proof Document View (7 Cols) */}
        <div className="lg:col-span-7 bg-[#FFFDF9] border border-[#E6CBBD] rounded-xs shadow-xs flex flex-col overflow-hidden">
          {/* Page Pagination Strip */}
          <div className="p-3 border-b border-[#E6CBBD] flex flex-wrap items-center justify-between gap-2 bg-[#FAF6F0]">
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
              <span className="text-[10px] font-mono uppercase text-[#786A61] font-bold mr-1 shrink-0">
                PDF Page:
              </span>
              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                const isSelected = selectedPageIndex === pageNum;
                const pageCount = paperPassages.filter((p) => p.pdf_page_index === pageNum).length;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setSelectedPageIndex(pageNum)}
                    className={`w-7 h-7 text-xs font-mono font-medium rounded-xs border transition-colors cursor-pointer flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-[#661414] text-[#FFFDF9] border-[#661414] font-bold shadow-xs'
                        : pageCount > 0
                        ? 'bg-[#FFFDF9] text-[#351D1D] border-[#E6CBBD] hover:bg-[#F8F2EB]'
                        : 'bg-transparent text-[#786A61]/40 border-transparent hover:border-[#E6CBBD]'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                disabled={selectedPageIndex <= 1}
                onClick={() => setSelectedPageIndex((prev) => Math.max(1, prev - 1))}
                className="p-1.5 border border-[#E6CBBD] bg-[#FFFDF9] hover:bg-[#F8F2EB] disabled:opacity-30 rounded-xs cursor-pointer text-[#351D1D]"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                disabled={selectedPageIndex >= totalPages}
                onClick={() => setSelectedPageIndex((prev) => Math.min(totalPages, prev + 1))}
                className="p-1.5 border border-[#E6CBBD] bg-[#FFFDF9] hover:bg-[#F8F2EB] disabled:opacity-30 rounded-xs cursor-pointer text-[#351D1D]"
                aria-label="Next page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Section Filter and Search */}
          <div className="p-3 border-b border-[#E6CBBD] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 text-xs bg-[#FFFDF9]">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-[#786A61] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search verbatim text on this page..."
                className="w-full bg-[#FAF6F0] border border-[#E6CBBD] text-xs py-1.5 pl-8 pr-3 text-[#351D1D] rounded-xs focus:outline-hidden focus:border-[#661414]"
              />
            </div>

            <div className="flex items-center gap-1 text-[10px] font-mono overflow-x-auto py-0.5">
              {sections.map((sec) => (
                <button
                  key={sec}
                  onClick={() => setSelectedSection(sec)}
                  className={`px-2 py-1 rounded-xs transition-colors cursor-pointer whitespace-nowrap font-medium ${
                    selectedSection === sec
                      ? 'bg-[#661414] text-[#FFFDF9] font-bold shadow-xs'
                      : 'text-[#786A61] hover:text-[#351D1D] hover:bg-[#FAF6F0]'
                  }`}
                >
                  {sec}
                </button>
              ))}
            </div>
          </div>

          {/* Verbatim Passages List on Selected Page */}
          <div className="divide-y divide-[#E6CBBD] max-h-[680px] overflow-y-auto">
            {filteredPassages.length > 0 ? (
              filteredPassages.map((passage) => {
                const isSelected = activePassage?.evidence_id === passage.evidence_id;
                const linkedCount = claims.filter((c) =>
                  c.evidence_ids.includes(passage.evidence_id)
                ).length;

                return (
                  <div
                    key={passage.evidence_id}
                    id={passage.evidence_id}
                    onClick={() => setSelectedPassageId(passage.evidence_id)}
                    className={`p-4 transition-colors cursor-pointer space-y-2 ${
                      isSelected
                        ? 'bg-[#FAF6F0] border-l-3 border-[#661414]'
                        : 'hover:bg-[#FAF6F0]/60'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#786A61]">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#661414]">
                          Page {passage.pdf_page_index}
                        </span>
                        <span>·</span>
                        <span className="text-[#351D1D] font-bold uppercase tracking-wider">
                          {passage.section}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {linkedCount > 0 ? (
                          <span className="text-[#416C49] font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            {linkedCount} claim{linkedCount === 1 ? '' : 's'} linked
                          </span>
                        ) : (
                          <span className="text-[#786A61]">Unlinked</span>
                        )}
                        <span>·</span>
                        <span>{passage.char_count} chars</span>
                      </div>
                    </div>

                    <p className="font-serif text-xs leading-relaxed text-[#351D1D]">
                      {passage.verbatim_text}
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="p-10 text-center text-[#786A61] text-xs">
                No extracted passages found on Page {selectedPageIndex} matching this filter.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Passage Detail & Claims Formulation Desk (5 Cols) */}
        <div className="lg:col-span-5 bg-[#FFFDF9] border border-[#E6CBBD] p-5 sm:p-6 space-y-5 rounded-xs shadow-xs sticky top-20">
          {activePassage ? (
            <>
              <div className="flex items-center justify-between border-b border-[#E6CBBD] pb-3 text-xs">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#786A61] font-bold">
                  EVIDENCE PROVENANCE
                </span>
                <span className="font-mono text-[10px] text-[#786A61]">
                  ID: {activePassage.evidence_id.substring(0, 16)}...
                </span>
              </div>

              {/* Passage Verbatim Quotation */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#786A61] font-bold flex items-center gap-1">
                    <Quote className="w-3.5 h-3.5 text-[#C04E2A]" />
                    VERBATIM PASSAGE TEXT
                  </span>
                  <span className="text-[10px] font-mono text-[#786A61]">
                    p. {activePassage.pdf_page_index} ({activePassage.section})
                  </span>
                </div>

                <div className="p-4 bg-[#FAF6F0] border-l-3 border-[#661414] font-serif text-xs italic leading-relaxed text-[#351D1D] rounded-r-xs">
                  "{activePassage.verbatim_text}"
                </div>
              </div>

              {/* Formulate Action Button */}
              <button
                onClick={() => onFormulateClaim(activePassage)}
                className="w-full py-2.5 px-3 text-xs font-semibold bg-[#661414] hover:bg-[#501010] text-[#FFFDF9] rounded-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 text-[#FFFDF9]" />
                <span>Formulate Health Claim from this Passage</span>
              </button>

              {/* Linked Claims List */}
              <div className="border-t border-[#E6CBBD] pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#786A61] font-bold">
                    DERIVED HEALTH CLAIMS ({linkedClaimsToActive.length})
                  </span>
                </div>

                {linkedClaimsToActive.length > 0 ? (
                  <div className="space-y-2">
                    {linkedClaimsToActive.map((claim) => (
                      <div
                        key={claim.claim_id}
                        className="p-3 border border-[#E6CBBD] bg-[#FAF6F0] text-xs space-y-1.5 rounded-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded-xs font-bold uppercase ${
                              claim.review_status === 'HUMAN_APPROVED'
                                ? 'bg-[#416C49]/15 text-[#416C49]'
                                : 'bg-[#E6CBBD]/60 text-[#351D1D]'
                            }`}
                          >
                            {claim.review_status.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[10px] font-mono text-[#786A61]">
                            {claim.study_design}
                          </span>
                        </div>
                        <p className="font-serif font-semibold text-[#351D1D] leading-snug">
                          {claim.claim_text}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-[#786A61] text-xs bg-[#FAF6F0] border border-dashed border-[#E6CBBD] rounded-xs">
                    No claims have been formulated from this specific passage yet.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-[#786A61] text-xs">
              Select an extracted passage to inspect provenance.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
