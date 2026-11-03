import React, { useState } from 'react';
import {
  PaperRecord,
  ClaimRecord,
  EvidencePassage,
  CarouselContent,
  StaticPostContent,
  ReelContent,
} from '../types';
import {
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  FileText,
  Layers,
  Video,
  FileUp,
  Search,
  Filter,
  Calendar,
  Award,
  Zap,
  Sparkles,
  Radio,
} from 'lucide-react';

interface WorkspaceProps {
  papers: PaperRecord[];
  activePaper: PaperRecord | null;
  passages: EvidencePassage[];
  claims: ClaimRecord[];
  carousel: CarouselContent | null;
  staticPost: StaticPostContent | null;
  reel: ReelContent | null;
  onNavigate: (tab: any) => void;
  onOpenDemo: () => void;
  onSwitchPaper: (paperId: string) => void;
  onSelectClaimForReview?: (claim: ClaimRecord) => void;
}

export const Workspace: React.FC<WorkspaceProps> = ({
  papers,
  activePaper,
  passages,
  claims,
  carousel,
  staticPost,
  reel,
  onNavigate,
  onOpenDemo,
  onSwitchPaper,
  onSelectClaimForReview,
}) => {
  const [filterState, setFilterState] = useState<'ALL' | 'ATTENTION' | 'APPROVED'>('ATTENTION');

  const currentPassages = activePaper
    ? passages.filter((p) => p.paper_id === activePaper.paper_id)
    : [];
  const currentClaims = activePaper
    ? claims.filter((c) => c.paper_id === activePaper.paper_id)
    : [];

  const approvedClaims = currentClaims.filter((c) => c.review_status === 'HUMAN_APPROVED');
  const flaggedClaims = currentClaims.filter((c) => c.review_status === 'FLAGGED');
  const blockedClaims = currentClaims.filter((c) => c.review_status === 'BLOCKED');
  const pendingClaims = currentClaims.filter((c) => c.review_status === 'READY_FOR_HUMAN_REVIEW');

  const needsAttentionClaims = [...blockedClaims, ...flaggedClaims, ...pendingClaims];

  const displayedClaims =
    filterState === 'ATTENTION'
      ? needsAttentionClaims
      : filterState === 'APPROVED'
      ? approvedClaims
      : currentClaims;

  if (papers.length === 0) {
    return (
      <div className="max-w-3xl mx-auto py-20 px-4">
        <div className="bg-[#FFFDF9] border border-[#E6CBBD] p-10 md:p-14 text-center shadow-xs rounded-xs space-y-6">
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#B58777] font-bold block">
              STEER EVIDENCE STUDIO
            </span>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#351D1D] tracking-tight">
              Start with the evidence.
            </h1>
            <p className="text-sm text-[#786A61] max-w-lg mx-auto leading-relaxed">
              Transform published clinical research into evidence-backed Instagram Carousels, Statics, and AI Reels with 100% source traceability.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('papers')}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-[#FFFDF9] bg-[#661414] hover:bg-[#501010] rounded-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <FileUp className="w-3.5 h-3.5" />
              <span>Upload a research paper</span>
            </button>
            <button
              onClick={onOpenDemo}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-medium text-[#351D1D] bg-[#FFFDF9] hover:bg-[#F8F2EB] border border-[#E6CBBD] rounded-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C04E2A]" />
              <span>Load Metabolic Benchmark</span>
              <span className="text-[10px] font-mono text-[#C04E2A] font-bold">
                (DEMO)
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Determine Primary Next Action with clear contextual logic
  let primaryAction = {
    label: 'Open Investigation Desk',
    onClick: () => onNavigate('desk'),
  };
  if (flaggedClaims.length > 0 || blockedClaims.length > 0) {
    primaryAction = {
      label: `Investigate ${flaggedClaims.length + blockedClaims.length} Flagged Claims`,
      onClick: () => onNavigate('desk'),
    };
  } else if (pendingClaims.length > 0) {
    primaryAction = {
      label: `Review ${pendingClaims.length} Pending Claims in Gate`,
      onClick: () => onNavigate('review'),
    };
  } else if (approvedClaims.length > 0) {
    primaryAction = {
      label: 'Open Content Studio →',
      onClick: () => onNavigate('studio'),
    };
  }

  return (
    <div className="workspace-shell max-w-[1360px] mx-auto p-4 sm:p-6 md:p-8 space-y-8">
      {/* 01. Compact Research Document Masthead & Actions */}
      <section className="bg-[#FFFDF9] border border-[#E6CBBD] p-5 sm:p-6 space-y-4 shadow-xs rounded-xs">
        {/* Source Metadata Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-[#786A61] border-b border-[#E6CBBD] pb-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-semibold text-[#351D1D]">{activePaper?.journal || 'Journal'}</span>
            <span>·</span>
            <span>{activePaper?.year}</span>
            <span>·</span>
            <span>DOI: {activePaper?.doi || 'Not available'}</span>
            <span>·</span>
            <span>{activePaper?.total_pages} pages parsed</span>
            {activePaper?.is_demo && (
              <span className="text-[#C04E2A] font-bold border border-[#C04E2A]/30 px-1.5 py-0.2 rounded-xs bg-[#C04E2A]/5">
                DEMO BENCHMARK
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-[#786A61] font-semibold">STATUS:</span>
            <span className="text-[#416C49] font-medium flex items-center gap-1.5 font-mono text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#416C49]" />
              {currentPassages.length} passages extracted
            </span>
          </div>
        </div>

        {/* Paper Title & Primary Next Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-3xl">
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#351D1D] leading-snug tracking-tight">
              {activePaper?.title}
            </h2>
            <p className="text-xs text-[#786A61] font-mono">
              Authors: {activePaper?.authors || 'Not specified'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={primaryAction.onClick}
              className="px-4 py-2 text-xs font-semibold text-[#FFFDF9] bg-[#661414] hover:bg-[#501010] active:scale-98 rounded-xs transition-all flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <span>{primaryAction.label}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigate('provenance')}
              className="px-3.5 py-2 text-xs font-medium text-[#351D1D] bg-[#FFFDF9] hover:bg-[#F8F2EB] border border-[#E6CBBD] rounded-xs transition-colors cursor-pointer"
            >
              Provenance Graph
            </button>
          </div>
        </div>

        {/* Key Operational Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#E6CBBD]">
          <div className="p-3 bg-[#FAF6F0] border border-[#E6CBBD] rounded-xs">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#786A61] block">
              Extracted Claims
            </span>
            <span className="text-xl font-serif font-bold text-[#351D1D] mt-0.5 block">
              {currentClaims.length}
            </span>
          </div>

          <div className="p-3 bg-[#FAF6F0] border border-[#E6CBBD] rounded-xs">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#786A61] block">
              Doctor Approved
            </span>
            <span className="text-xl font-serif font-bold text-[#416C49] mt-0.5 block">
              {approvedClaims.length}
            </span>
          </div>

          <div className="p-3 bg-[#FAF6F0] border border-[#E6CBBD] rounded-xs">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#786A61] block">
              Needs Attention
            </span>
            <span className="text-xl font-serif font-bold text-[#C04E2A] mt-0.5 block">
              {needsAttentionClaims.length}
            </span>
          </div>

          <div className="p-3 bg-[#FAF6F0] border border-[#E6CBBD] rounded-xs">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#786A61] block">
              Deliverables
            </span>
            <span className="text-xs font-mono text-[#351D1D] mt-1.5 block font-semibold">
              {carousel ? 'Carousel Ready · Live' : 'Ready to Generate'}
            </span>
          </div>
        </div>
      </section>

      {/* 02. FLAGSHIP FEATURE SPOTLIGHT: STEER EVIDENCE RADAR */}
      <section className="bg-[#FFFDF9] border-2 border-[#C04E2A]/30 p-5 sm:p-6 rounded-xs shadow-xs hover:border-[#C04E2A] transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[#C04E2A] text-white text-[9px] font-mono uppercase font-bold rounded-xs flex items-center gap-1">
                <Radio className="w-3 h-3" />
                FLAGSHIP DISCOVERY ENGINE
              </span>
              <span className="text-xs font-mono font-bold text-[#661414]">STEER EVIDENCE RADAR</span>
            </div>
            <h3 className="font-serif text-lg sm:text-xl font-bold text-[#351D1D]">
              Audience Need → Scientific Evidence Gap → Responsible Instagram Content
            </h3>
            <p className="text-xs text-[#786A61] max-w-2xl leading-relaxed">
              Ingest real audience DMs, comments, and questions. Automatically cluster them into recurring metabolic misconceptions, audit the scientific literature gap against clinical trials, and generate doctor-approved briefs with zero medical clickbait.
            </p>
          </div>

          <button
            onClick={() => onNavigate('radar')}
            className="px-5 py-2.5 bg-[#661414] hover:bg-[#501010] text-white text-xs font-semibold rounded-xs transition-colors flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-xs"
          >
            <Radio className="w-3.5 h-3.5 text-[#C04E2A]" />
            <span>Launch Evidence Radar →</span>
          </button>
        </div>
      </section>

      {/* 03. Two Key Fast Paths: Hackathon PS2 Packet & 7-Day Instagram Cadence */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Hackathon Submission Center */}
        <div className="bg-[#661414] text-[#F5EBDF] p-5 sm:p-6 border border-[#351D1D] flex flex-col justify-between space-y-4 shadow-xs rounded-xs">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 bg-[#C04E2A] text-[#F5EBDF] text-[9px] font-mono uppercase font-bold rounded-xs flex items-center gap-1">
                <Award className="w-3 h-3" />
                HACKATHON SUBMISSION PACKET
              </span>
              <span className="text-[10px] font-mono text-[#E6CBBD]">Problem Statement 2</span>
            </div>
            <h3 className="font-serif text-lg sm:text-xl font-bold text-[#F5EBDF] leading-snug">
              3 Finished Posts, Architecture & Pitch
            </h3>
            <p className="text-xs text-[#E6CBBD] leading-relaxed">
              Examine the GLP-1 carousel, South Asian 3 PM crash reel, and metabolic adaptation static post with measured effort benchmarks and a 2-minute Loom script.
            </p>
          </div>

          <button
            onClick={() => onNavigate('submission')}
            className="w-full py-2.5 bg-[#F5EBDF] hover:bg-[#FFFDF9] text-[#661414] text-xs font-bold rounded-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
          >
            <span>Open Hackathon Submission Center</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#C04E2A]" />
          </button>
        </div>

        {/* Card 2: 7-Day Instagram Content Calendar */}
        <div className="bg-[#FFFDF9] border border-[#E6CBBD] p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-xs rounded-xs hover:border-[#C04E2A] transition-colors">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 bg-[#416C49]/15 text-[#416C49] text-[9px] font-mono uppercase font-bold rounded-xs flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                AUTOMATED WEEKLY ENGINE
              </span>
              <span className="text-[10px] font-mono text-[#786A61]">7-Day Cadence</span>
            </div>
            <h3 className="font-serif text-lg sm:text-xl font-bold text-[#351D1D] leading-snug">
              Instagram Calendar & Canva Automation
            </h3>
            <p className="text-xs text-[#786A61] leading-relaxed">
              Run the batch pipeline ("5 papers in, a week of content out"), export Canva Bulk Create CSVs, and inspect scheduled posts across prime Indian engagement windows.
            </p>
          </div>

          <button
            onClick={() => onNavigate('schedule')}
            className="w-full py-2.5 bg-[#FAF6F0] hover:bg-[#F8F2EB] border border-[#E6CBBD] text-[#351D1D] text-xs font-semibold rounded-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Calendar className="w-3.5 h-3.5 text-[#C04E2A]" />
            <span>View 7-Day Instagram Schedule</span>
          </button>
        </div>
      </section>

      {/* 03. Editorial Work Queue */}
      <section className="bg-[#FFFDF9] border border-[#E6CBBD] p-5 sm:p-6 space-y-4 shadow-xs rounded-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E6CBBD] pb-3">
          <div>
            <h3 className="text-base font-serif font-bold text-[#351D1D]">
              Editorial Work Queue
            </h3>
            <p className="text-xs text-[#786A61] mt-0.5">
              Claims requiring verification, source provenance check, or human approval.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-[#FAF6F0] p-1 border border-[#E6CBBD] rounded-xs">
            <button
              onClick={() => setFilterState('ATTENTION')}
              className={`px-3 py-1 text-xs font-medium rounded-xs transition-colors cursor-pointer ${
                filterState === 'ATTENTION'
                  ? 'bg-[#FFFDF9] text-[#661414] font-bold shadow-xs'
                  : 'text-[#786A61] hover:text-[#351D1D]'
              }`}
            >
              Needs Attention ({needsAttentionClaims.length})
            </button>
            <button
              onClick={() => setFilterState('APPROVED')}
              className={`px-3 py-1 text-xs font-medium rounded-xs transition-colors cursor-pointer ${
                filterState === 'APPROVED'
                  ? 'bg-[#FFFDF9] text-[#661414] font-bold shadow-xs'
                  : 'text-[#786A61] hover:text-[#351D1D]'
              }`}
            >
              Approved ({approvedClaims.length})
            </button>
            <button
              onClick={() => setFilterState('ALL')}
              className={`px-3 py-1 text-xs font-medium rounded-xs transition-colors cursor-pointer ${
                filterState === 'ALL'
                  ? 'bg-[#FFFDF9] text-[#661414] font-bold shadow-xs'
                  : 'text-[#786A61] hover:text-[#351D1D]'
              }`}
            >
              All ({currentClaims.length})
            </button>
          </div>
        </div>

        {/* Claim Items List */}
        <div className="space-y-2.5">
          {displayedClaims.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#786A61] font-mono bg-[#FAF6F0] border border-[#E6CBBD] rounded-xs">
              No claims in this queue. All items have been reviewed or approved.
            </div>
          ) : (
            displayedClaims.slice(0, 6).map((claim) => {
              const isFlagged = claim.review_status === 'FLAGGED' || claim.review_status === 'BLOCKED';
              const isApproved = claim.review_status === 'HUMAN_APPROVED';

              return (
                <div
                  key={claim.claim_id}
                  onClick={() => {
                    if (onSelectClaimForReview) onSelectClaimForReview(claim);
                    onNavigate('desk');
                  }}
                  className={`p-3.5 border rounded-xs transition-all cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
                    isFlagged
                      ? 'bg-[#C04E2A]/5 border-[#C04E2A]/30 hover:border-[#C04E2A]'
                      : isApproved
                      ? 'bg-[#416C49]/5 border-[#416C49]/25 hover:border-[#416C49]'
                      : 'bg-[#FAF6F0]/60 border-[#E6CBBD] hover:border-[#661414]'
                  }`}
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-[10px] font-mono">
                      <span
                        className={`px-1.5 py-0.2 rounded-xs font-bold uppercase ${
                          isFlagged
                            ? 'bg-[#C04E2A]/15 text-[#C04E2A]'
                            : isApproved
                            ? 'bg-[#416C49]/15 text-[#416C49]'
                            : 'bg-[#E6CBBD]/60 text-[#351D1D]'
                        }`}
                      >
                        {claim.review_status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[#786A61]">ID: {claim.claim_id}</span>
                      <span>·</span>
                      <span className="text-[#786A61]">Design: {claim.study_design}</span>
                    </div>

                    <p className="font-serif text-xs font-semibold text-[#351D1D] leading-snug">
                      {claim.claim_text}
                    </p>

                    {claim.exact_supporting_quote && (
                      <p className="text-[11px] text-[#786A61] italic font-serif line-clamp-1">
                        "{claim.exact_supporting_quote}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectClaimForReview) onSelectClaimForReview(claim);
                        onNavigate('desk');
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-[#661414] hover:bg-[#661414] hover:text-[#FFFDF9] border border-[#661414]/30 rounded-xs transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span>Investigate</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};
