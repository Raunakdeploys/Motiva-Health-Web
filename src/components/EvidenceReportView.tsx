import React from 'react';
import {
  CarouselContent,
  ClaimRecord,
  EvidenceAuditReport,
  EvidencePassage,
  PaperRecord,
  ReelContent,
  StaticPostContent,
} from '../types';
import { downloadJsonFile } from '../utils/exportUtils';
import {
  Download,
  FileCheck,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Printer,
  Quote,
  BookOpen,
} from 'lucide-react';

interface EvidenceReportViewProps {
  activePaper: PaperRecord | null;
  passages: EvidencePassage[];
  claims: ClaimRecord[];
  carousel: CarouselContent | null;
  staticPost: StaticPostContent | null;
  reel: ReelContent | null;
}

export const EvidenceReportView: React.FC<EvidenceReportViewProps> = ({
  activePaper,
  passages,
  claims,
  carousel,
  staticPost,
  reel,
}) => {
  if (!activePaper) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-full bg-[#E6CBBD]/40 flex items-center justify-center text-[#661414]">
          <BookOpen className="w-7 h-7" />
        </div>
        <h3 className="font-serif text-xl font-bold text-[#351D1D]">No Paper Selected for Report</h3>
        <p className="text-xs text-[#786A61] max-w-md mx-auto leading-relaxed">
          Please select or ingest a scientific paper to generate a clinical traceability and evidence audit report.
        </p>
      </div>
    );
  }

  const paperPassages = passages.filter((p) => p.paper_id === activePaper.paper_id);
  const paperClaims = claims.filter((c) => c.paper_id === activePaper.paper_id);

  const approvedClaims = paperClaims.filter((c) => c.review_status === 'HUMAN_APPROVED');
  const flaggedClaims = paperClaims.filter((c) => c.review_status === 'FLAGGED');
  const blockedClaims = paperClaims.filter((c) => c.review_status === 'BLOCKED');

  const overallStatus =
    blockedClaims.length > 0
      ? 'CONTAINS_BLOCKERS'
      : approvedClaims.length > 0
      ? 'VERIFIED_READY'
      : 'PENDING_HUMAN_APPROVAL';

  const reportData: EvidenceAuditReport = {
    generated_at: new Date().toISOString(),
    paper: activePaper,
    total_claims: paperClaims.length,
    approved_claims_count: approvedClaims.length,
    flagged_claims_count: flaggedClaims.length,
    blocked_claims_count: blockedClaims.length,
    claims: paperClaims,
    evidence_passages: paperPassages,
    generated_deliverables: {
      carousel: carousel || undefined,
      static_post: staticPost || undefined,
      reel: reel || undefined,
    },
    overall_status: overallStatus,
    disclaimer:
      'steer / Evidence Studio is an editorial research instrument for scientific content verification. It does not provide clinical certification, medical diagnoses, or treatment recommendations. Automated checks establish evidence traceability, not clinical truth.',
  };

  const handleDownloadReport = () => {
    downloadJsonFile(
      `steer-evidence-report-${activePaper.paper_id}.json`,
      reportData
    );
  };

  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-6 space-y-6">
      {/* 01. Desk Header & Print Actions */}
      <div className="bg-[#FFFDF9] border border-[#E6CBBD] p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xs shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#661414] text-[#F5EBDF] text-[10px] font-mono font-bold uppercase rounded-xs">
              REPORT EXPORT
            </span>
            <h2 className="font-serif text-lg font-bold text-[#351D1D] tracking-tight">
              Evidence Traceability Report
            </h2>
          </div>
          <p className="text-xs text-[#786A61] leading-relaxed">
            Complete audit trail connecting published text, page citations, validation findings, and approved assets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 text-xs font-medium text-[#351D1D] bg-[#FFFDF9] hover:bg-[#F8F2EB] border border-[#E6CBBD] rounded-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-[#786A61]" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleDownloadReport}
            className="px-4 py-2 text-xs font-semibold text-[#FFFDF9] bg-[#661414] hover:bg-[#501010] rounded-xs flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-[#FFFDF9]" />
            <span>Export JSON Audit Package</span>
          </button>
        </div>
      </div>

      {/* 02. Report Body Document Frame */}
      <div className="border border-[#E6CBBD] bg-[#FFFDF9] p-6 sm:p-10 space-y-8 rounded-xs shadow-xs">
        {/* Document Masthead */}
        <div className="pb-6 border-b border-[#E6CBBD] flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2 font-mono text-[10px] text-[#786A61]">
              <span>AUDIT ID: {activePaper.paper_id}</span>
              <span>·</span>
              <span>DATE: {new Date().toLocaleDateString()}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#351D1D] leading-snug">
              {activePaper.title}
            </h1>
            <p className="text-xs text-[#786A61]">
              {activePaper.authors} · {activePaper.journal} ({activePaper.year}) · DOI: {activePaper.doi}
            </p>
          </div>

          <div className="text-right shrink-0">
            <span
              className={`inline-block text-[10px] font-mono font-bold px-2.5 py-1 rounded-xs uppercase ${
                overallStatus === 'VERIFIED_READY'
                  ? 'bg-[#416C49]/15 text-[#416C49] border border-[#416C49]/30'
                  : overallStatus === 'CONTAINS_BLOCKERS'
                  ? 'bg-[#661414]/15 text-[#661414] border border-[#661414]/30'
                  : 'bg-[#C04E2A]/15 text-[#C04E2A] border border-[#C04E2A]/30'
              }`}
            >
              STATUS: {overallStatus.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* Audit Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
          <div className="p-3.5 bg-[#FAF6F0] border border-[#E6CBBD] rounded-xs">
            <span className="text-[9px] uppercase text-[#786A61] font-bold block">Parsed Passages</span>
            <span className="text-xl font-bold text-[#351D1D] block mt-1">{paperPassages.length}</span>
          </div>
          <div className="p-3.5 bg-[#FAF6F0] border border-[#E6CBBD] rounded-xs">
            <span className="text-[9px] uppercase text-[#786A61] font-bold block">Total Extracted Claims</span>
            <span className="text-xl font-bold text-[#351D1D] block mt-1">{paperClaims.length}</span>
          </div>
          <div className="p-3.5 bg-[#FAF6F0] border border-[#E6CBBD] rounded-xs">
            <span className="text-[9px] uppercase text-[#416C49] font-bold block">Human Approved</span>
            <span className="text-xl font-bold text-[#416C49] block mt-1">{approvedClaims.length}</span>
          </div>
          <div className="p-3.5 bg-[#FAF6F0] border border-[#E6CBBD] rounded-xs">
            <span className="text-[9px] uppercase text-[#C04E2A] font-bold block">Flagged / Blocked</span>
            <span className="text-xl font-bold text-[#C04E2A] block mt-1">
              {blockedClaims.length + flaggedClaims.length}
            </span>
          </div>
        </div>

        {/* Claims Audit Table */}
        <div className="space-y-4">
          <h3 className="font-serif font-bold text-base text-[#351D1D] border-b border-[#E6CBBD] pb-2">
            Claim-by-Claim Verification Ledger
          </h3>

          <div className="space-y-4">
            {paperClaims.map((claim, idx) => {
              const linkedP = paperPassages.filter((p) => claim.evidence_ids.includes(p.evidence_id));

              return (
                <div
                  key={claim.claim_id}
                  className="border border-[#E6CBBD] p-4 sm:p-5 space-y-3 bg-[#FFFDF9] rounded-xs shadow-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#661414]">CLAIM #{idx + 1}</span>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-xs font-bold uppercase ${
                          claim.review_status === 'HUMAN_APPROVED'
                            ? 'bg-[#416C49]/15 text-[#416C49]'
                            : claim.review_status === 'BLOCKED'
                            ? 'bg-[#661414]/15 text-[#661414]'
                            : claim.review_status === 'FLAGGED'
                            ? 'bg-[#C04E2A]/15 text-[#C04E2A]'
                            : 'bg-[#E6CBBD]/60 text-[#351D1D]'
                        }`}
                      >
                        {claim.review_status}
                      </span>
                    </div>

                    <span className="text-[10px] text-[#786A61]">
                      Updated: {new Date(claim.updated_at).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="font-serif text-sm font-semibold text-[#351D1D] leading-snug">
                    {claim.claim_text}
                  </p>

                  <div className="bg-[#FAF6F0] p-3 text-xs border-l-3 border-[#661414] space-y-1 rounded-r-xs">
                    <span className="text-[9px] font-mono uppercase text-[#C04E2A] font-bold block">
                      VERBATIM QUOTE (Page {linkedP[0]?.pdf_page_index || 'N/A'})
                    </span>
                    <blockquote className="italic font-serif text-[#351D1D] leading-relaxed">
                      "{claim.exact_supporting_quote}"
                    </blockquote>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-[#FAF6F0] p-3 border border-[#E6CBBD] font-mono rounded-xs">
                    <div>
                      <span className="text-[9px] text-[#786A61] font-bold block">POPULATION:</span>
                      <span className="text-[#351D1D] font-medium block truncate">{claim.population}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#786A61] font-bold block">DESIGN:</span>
                      <span className="text-[#351D1D] font-medium block truncate">{claim.study_design}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#786A61] font-bold block">OUTCOME:</span>
                      <span className="text-[#351D1D] font-medium block truncate">{claim.outcome || 'General'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#786A61] font-bold block">METRICS:</span>
                      <span className="text-[#351D1D] font-medium block truncate">{claim.numbers_and_units}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="pt-4 border-t border-[#E6CBBD] text-[11px] text-[#786A61] leading-relaxed font-mono">
          {reportData.disclaimer}
        </div>
      </div>
    </div>
  );
};
