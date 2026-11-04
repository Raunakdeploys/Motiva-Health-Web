import React, { useState, useMemo } from 'react';
import {
  PaperRecord,
  EvidencePassage,
  ClaimRecord,
  CarouselContent,
  StaticPostContent,
  ReelContent,
} from '../types';
import { SourceViewer } from './SourceViewer';
import { runValidationEngine } from '../utils/validationEngine';
import { analyzeClaimImpact } from '../utils/impactAnalysis';
import { authenticatedApiFetch } from '../utils/sqlApiClient';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Edit3,
  Quote,
  ExternalLink,
  Plus,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  PanelRightClose,
  PanelRightOpen,
  History,
  Layers,
  ChevronDown,
  Check,
  X,
  BookOpen,
} from 'lucide-react';

interface InvestigationDeskProps {
  activePaper: PaperRecord | null;
  passages: EvidencePassage[];
  claims: ClaimRecord[];
  carousel: CarouselContent | null;
  staticPost: StaticPostContent | null;
  reel: ReelContent | null;
  onUpdateClaim: (claim: ClaimRecord, wasApprovedEdited: boolean) => void;
  onAddClaim: (claim: ClaimRecord) => void;
  onNavigateToStudio: () => void;
  initialSelectedClaimId?: string | null;
  initialSelectedEvidenceId?: string | null;
}

export const InvestigationDesk: React.FC<InvestigationDeskProps> = ({
  activePaper,
  passages,
  claims,
  carousel,
  staticPost,
  reel,
  onUpdateClaim,
  onAddClaim,
  onNavigateToStudio,
  initialSelectedClaimId,
  initialSelectedEvidenceId,
}) => {
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(
    initialSelectedClaimId || null
  );
  const [selectedPassageId, setSelectedPassageId] = useState<string | null>(
    initialSelectedEvidenceId || null
  );
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [isAuditing, setIsAuditing] = useState(false);
  const [mobileTab, setMobileTab] = useState<'source' | 'claim' | 'inspector'>('claim');

  // Edit modal
  const [editingClaim, setEditingClaim] = useState<ClaimRecord | null>(null);

  // New claim modal
  const [showNewClaimModal, setShowNewClaimModal] = useState(false);
  const [newClaimText, setNewClaimText] = useState('');
  const [newEvidenceId, setNewEvidenceId] = useState('');
  const [newQuote, setNewQuote] = useState('');

  // Target page for SourceViewer
  const [targetPage, setTargetPage] = useState<number>(1);

  if (!activePaper) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center text-[#786A61]">
        Please ingest a scientific paper to enter the Investigation Desk.
      </div>
    );
  }

  const paperPassages = passages.filter((p) => p.paper_id === activePaper.paper_id);
  const paperClaims = claims.filter((c) => c.paper_id === activePaper.paper_id);

  // Validated claims with explicit 12-rule results
  const validatedClaims = useMemo(() => {
    return paperClaims.map((claim) => {
      const { findings, checks, calculatedStatus } = runValidationEngine(
        claim,
        paperPassages,
        paperClaims
      );
      let resolvedStatus: ClaimRecord['review_status'] = claim.review_status;
      if (claim.review_status === 'HUMAN_APPROVED') {
        if (findings.some((f) => f.severity === 'BLOCKER')) {
          resolvedStatus = 'BLOCKED';
        } else {
          resolvedStatus = 'HUMAN_APPROVED';
        }
      } else if (claim.review_status === 'FLAGGED' || claim.review_status === 'REJECTED') {
        resolvedStatus = claim.review_status;
      } else {
        resolvedStatus = calculatedStatus;
      }
      return {
        ...claim,
        validation_findings: findings,
        validation_checks: checks,
        review_status: resolvedStatus,
      };
    });
  }, [paperClaims, paperPassages]);

  // Active claim selection
  const activeClaim =
    validatedClaims.find((c) => c.claim_id === selectedClaimId) ||
    validatedClaims[0] ||
    null;

  // Active passage selection
  const activePassage =
    paperPassages.find((p) =>
      selectedPassageId
        ? p.evidence_id === selectedPassageId
        : activeClaim?.evidence_ids.includes(p.evidence_id)
    ) ||
    paperPassages[0] ||
    null;

  // Supporting passages
  const supportingPassages = useMemo(() => {
    if (!activeClaim) return [];
    return paperPassages.filter((p) => activeClaim.evidence_ids.includes(p.evidence_id));
  }, [activeClaim, paperPassages]);

  // Impact analysis report
  const impactReport = useMemo(() => {
    if (!activeClaim) return null;
    return analyzeClaimImpact(
      activeClaim.claim_id,
      activeClaim.review_status,
      {
        carousels: carousel ? [carousel] : [],
        staticPosts: staticPost ? [staticPost] : [],
        reels: reel ? [reel] : [],
      }
    );
  }, [activeClaim, carousel, staticPost, reel]);

  const handleSelectClaim = (c: ClaimRecord) => {
    setSelectedClaimId(c.claim_id);
    if (c.evidence_ids && c.evidence_ids.length > 0) {
      setSelectedPassageId(c.evidence_ids[0]);
      const matched = paperPassages.find((p) => p.evidence_id === c.evidence_ids[0]);
      if (matched) {
        setTargetPage(matched.pdf_page_index);
      }
    }
  };

  const handleSelectPassage = (p: EvidencePassage) => {
    setSelectedPassageId(p.evidence_id);
    setTargetPage(p.pdf_page_index);
  };

  // Human Review Actions
  const handleApprove = (claim: ClaimRecord) => {
    const hasBlockers = claim.validation_findings?.some((f) => f.severity === 'BLOCKER');
    if (hasBlockers) {
      alert('Cannot approve claim: It contains blocking validation errors that must be resolved first.');
      return;
    }

    const now = new Date().toISOString();
    const historyEntry = {
      id: `rev_${Date.now()}`,
      timestamp: now,
      action: 'APPROVE' as const,
      reviewer: 'Lead Editorial Scientist',
      previous_status: claim.review_status,
      new_status: 'HUMAN_APPROVED' as const,
      note: 'Verified against source evidence passages and methodology bounds.',
    };

    const updated: ClaimRecord = {
      ...claim,
      review_status: 'HUMAN_APPROVED',
      approved_version: {
        claim_text: claim.claim_text,
        approved_at: now,
        approved_by: 'Lead Editorial Scientist',
      },
      review_history: [historyEntry, ...(claim.review_history || [])],
      updated_at: now,
    };

    onUpdateClaim(updated, false);
  };

  const handleAuditSingleClaimViaGemini = async (claim: ClaimRecord) => {
    setIsAuditing(true);
    try {
      const response = await authenticatedApiFetch('/api/audit-claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paper_title: activePaper?.title || '',
          claims: [claim],
          passages,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to audit claim.');
      }

      if (data.audited_claims && data.audited_claims[0]) {
        onUpdateClaim(data.audited_claims[0], false);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to audit claim with Gemini.');
    } finally {
      setIsAuditing(false);
    }
  };

  const handleFlag = (claim: ClaimRecord, note: string) => {
    const now = new Date().toISOString();
    const historyEntry = {
      id: `rev_${Date.now()}`,
      timestamp: now,
      action: 'FLAG' as const,
      reviewer: 'Editorial Reviewer',
      previous_status: claim.review_status,
      new_status: 'FLAGGED' as const,
      note: note || 'Flagged for source verification or caveat qualification.',
    };

    const updated: ClaimRecord = {
      ...claim,
      review_status: 'FLAGGED',
      reviewer_note: note,
      review_history: [historyEntry, ...(claim.review_history || [])],
      updated_at: now,
    };

    onUpdateClaim(updated, claim.review_status === 'HUMAN_APPROVED');
  };

  const handleReject = (claim: ClaimRecord) => {
    const now = new Date().toISOString();
    const historyEntry = {
      id: `rev_${Date.now()}`,
      timestamp: now,
      action: 'REJECT' as const,
      reviewer: 'Editorial Reviewer',
      previous_status: claim.review_status,
      new_status: 'REJECTED' as const,
      note: 'Rejected from publication dataset.',
    };

    const updated: ClaimRecord = {
      ...claim,
      review_status: 'REJECTED',
      review_history: [historyEntry, ...(claim.review_history || [])],
      updated_at: now,
    };

    onUpdateClaim(updated, claim.review_status === 'HUMAN_APPROVED');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClaim) return;

    const now = new Date().toISOString();
    const wasApproved = editingClaim.review_status === 'HUMAN_APPROVED';

    const historyEntry = {
      id: `rev_${Date.now()}`,
      timestamp: now,
      action: 'EDIT' as const,
      reviewer: 'Editorial Scientist',
      previous_status: editingClaim.review_status,
      new_status: wasApproved ? 'READY_FOR_HUMAN_REVIEW' : editingClaim.review_status,
      previous_claim_text: activeClaim?.claim_text,
      note: 'Claim text or methodology amended. Triggered re-validation.',
    };

    const updated: ClaimRecord = {
      ...editingClaim,
      review_status: wasApproved ? 'READY_FOR_HUMAN_REVIEW' : editingClaim.review_status,
      review_history: [historyEntry, ...(editingClaim.review_history || [])],
      updated_at: now,
    };

    onUpdateClaim(updated, wasApproved);
    setEditingClaim(null);
  };

  const handleCreateManualClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClaimText.trim() || !newEvidenceId) {
      alert('Claim text and linked passage are required.');
      return;
    }

    const now = new Date().toISOString();
    const newClaim: ClaimRecord = {
      claim_id: `claim_${activePaper.paper_id}_${Date.now().toString(36)}`,
      paper_id: activePaper.paper_id,
      claim_text: newClaimText.trim(),
      evidence_ids: [newEvidenceId],
      exact_supporting_quote: newQuote.trim(),
      population: 'NOT REPORTED',
      study_design: 'NOT REPORTED',
      intervention_or_exposure: 'NOT REPORTED',
      comparison: 'NOT REPORTED',
      outcome: 'NOT REPORTED',
      numbers_and_units: 'NOT REPORTED',
      limitations: 'NOT REPORTED',
      certainty_notes: 'Drafted from source passage in Investigation Desk.',
      risk_flags: [],
      review_status: 'READY_FOR_HUMAN_REVIEW',
      reviewer_note: 'Formulated in investigation desk.',
      review_history: [
        {
          id: `rev_init_${Date.now()}`,
          timestamp: now,
          action: 'RESET',
          reviewer: 'Researcher',
          previous_status: 'DRAFT',
          new_status: 'READY_FOR_HUMAN_REVIEW',
          note: 'Initial formulation.',
        },
      ],
      updated_at: now,
    };

    onAddClaim(newClaim);
    setShowNewClaimModal(false);
    setNewClaimText('');
    setNewQuote('');
    handleSelectClaim(newClaim);
  };

  return (
    <div className="max-w-[1600px] mx-auto p-3 sm:p-5 space-y-4">
      {/* 01. Desk Subhead Bar */}
      <div className="bg-[#FFFDF9] border border-[#E6CBBD] p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-xs shadow-xs">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="font-serif text-base sm:text-lg font-bold text-[#351D1D] tracking-tight">
              Investigation Desk
            </h2>
            <div className="flex items-center gap-2 text-xs text-[#786A61] font-mono">
              <span className="font-medium text-[#351D1D] truncate max-w-[280px]">
                {activePaper.title}
              </span>
              <span>·</span>
              <span>{paperPassages.length} passages</span>
              <span>·</span>
              <span>{paperClaims.length} claims</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Mobile view selector */}
          <div className="flex lg:hidden items-center border border-[#E6CBBD] bg-[#FAF6F0] p-0.5 rounded-xs">
            <button
              onClick={() => setMobileTab('source')}
              className={`px-2 py-1 text-xs font-medium rounded-xs transition-colors cursor-pointer ${
                mobileTab === 'source' ? 'bg-[#FFFDF9] text-[#661414] font-bold shadow-xs' : 'text-[#786A61]'
              }`}
            >
              Source
            </button>
            <button
              onClick={() => setMobileTab('claim')}
              className={`px-2 py-1 text-xs font-medium rounded-xs transition-colors cursor-pointer ${
                mobileTab === 'claim' ? 'bg-[#FFFDF9] text-[#661414] font-bold shadow-xs' : 'text-[#786A61]'
              }`}
            >
              Claim
            </button>
            <button
              onClick={() => setMobileTab('inspector')}
              className={`px-2 py-1 text-xs font-medium rounded-xs transition-colors cursor-pointer ${
                mobileTab === 'inspector' ? 'bg-[#FFFDF9] text-[#661414] font-bold shadow-xs' : 'text-[#786A61]'
              }`}
            >
              Inspector
            </button>
          </div>

          <button
            onClick={() => setShowNewClaimModal(true)}
            className="px-3 py-1.5 bg-[#FFFDF9] hover:bg-[#F8F2EB] text-[#351D1D] border border-[#E6CBBD] rounded-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[#661414]" />
            <span>Formulate Claim</span>
          </button>

          <button
            onClick={() => setIsInspectorOpen(!isInspectorOpen)}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFDF9] hover:bg-[#F8F2EB] border border-[#E6CBBD] text-xs font-medium text-[#351D1D] rounded-xs cursor-pointer transition-colors"
            title={isInspectorOpen ? 'Collapse Context Inspector' : 'Expand Context Inspector'}
          >
            {isInspectorOpen ? (
              <PanelRightClose className="w-3.5 h-3.5 text-[#661414]" />
            ) : (
              <PanelRightOpen className="w-3.5 h-3.5 text-[#786A61]" />
            )}
            <span>{isInspectorOpen ? 'Collapse Inspector' : 'Inspector'}</span>
          </button>
        </div>
      </div>

      {/* Downstream Impact Alert Banner */}
      {impactReport && impactReport.has_impact && (
        <div
          className={`p-3.5 border rounded-xs text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            impactReport.affected_deliverables.some((d) => d.severity === 'HIGH_BLOCKER')
              ? 'bg-[#661414]/10 border-[#661414]/30 text-[#661414]'
              : 'bg-[#C04E2A]/10 border-[#C04E2A]/30 text-[#C04E2A]'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{impactReport.summary}</span>
          </div>

          <button
            onClick={onNavigateToStudio}
            className="px-3 py-1 bg-[#FFFDF9] border border-current text-xs font-semibold rounded-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap self-start sm:self-auto shadow-xs"
          >
            <span>Review Affected Deliverables</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* 02. Three-Pane Investigation Environment */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Pane A: Source Viewer (5 Cols) */}
        <div
          className={`lg:col-span-5 h-[760px] ${
            mobileTab === 'source' ? 'block' : 'hidden lg:block'
          }`}
        >
          <SourceViewer
            paper={activePaper}
            passages={paperPassages}
            selectedPassageId={activePassage?.evidence_id || null}
            onSelectPassage={handleSelectPassage}
            highlightText={activeClaim?.exact_supporting_quote || ''}
            targetPage={targetPage}
          />
        </div>

        {/* Pane B: Claim & Evidence Workspace */}
        <div
          className={`${
            isInspectorOpen ? 'lg:col-span-4' : 'lg:col-span-7'
          } bg-[#FFFDF9] border border-[#E6CBBD] rounded-xs flex flex-col h-[760px] overflow-hidden shadow-xs ${
            mobileTab === 'claim' ? 'block' : 'hidden lg:flex'
          }`}
        >
          {/* Claims Selector Header */}
          <div className="p-3 bg-[#FAF6F0] border-b border-[#E6CBBD] flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#786A61] font-bold">
              CLAIMS ({validatedClaims.length})
            </span>

            <div className="relative">
              <select
                value={activeClaim?.claim_id || ''}
                onChange={(e) => {
                  const c = validatedClaims.find((item) => item.claim_id === e.target.value);
                  if (c) handleSelectClaim(c);
                }}
                className="bg-[#FFFDF9] border border-[#E6CBBD] text-[#351D1D] text-xs py-1 pl-2 pr-6 rounded-xs max-w-[240px] truncate focus:outline-hidden focus:border-[#661414] cursor-pointer appearance-none font-medium"
              >
                {validatedClaims.map((c, i) => (
                  <option key={c.claim_id} value={c.claim_id}>
                    #{i + 1} [{c.review_status}]: {c.claim_text.substring(0, 36)}...
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-[#786A61] absolute right-2 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Active Claim Detail Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
            {activeClaim ? (
              <>
                {/* Status & Review Pill */}
                <div className="flex items-center justify-between border-b border-[#E6CBBD] pb-2.5">
                  <span
                    className={`text-[9px] font-mono px-2 py-0.5 rounded-xs font-bold uppercase ${
                      activeClaim.review_status === 'HUMAN_APPROVED'
                        ? 'bg-[#416C49]/15 text-[#416C49]'
                        : activeClaim.review_status === 'FLAGGED'
                        ? 'bg-[#C04E2A]/15 text-[#C04E2A]'
                        : activeClaim.review_status === 'BLOCKED'
                        ? 'bg-[#661414]/15 text-[#661414]'
                        : 'bg-[#E6CBBD]/60 text-[#351D1D]'
                    }`}
                  >
                    {activeClaim.review_status.replace(/_/g, ' ')}
                  </span>

                  <span className="text-[10px] font-mono text-[#786A61]">
                    ID: {activeClaim.claim_id.substring(0, 18)}...
                  </span>
                </div>

                {/* Claim Statement */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#786A61] font-semibold">
                      CLAIM STATEMENT
                    </span>
                    <button
                      onClick={() => setEditingClaim(activeClaim)}
                      className="text-[10px] font-mono text-[#661414] hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </div>

                  <div className="p-3 bg-[#F8F2EB] border-l-3 border-[#661414] font-serif text-sm font-semibold text-[#351D1D] leading-snug rounded-r-xs">
                    {activeClaim.claim_text}
                  </div>
                </div>

                {/* Supporting Source Passages */}
                <div className="space-y-2 border-t border-[#E6CBBD] pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#786A61] font-semibold flex items-center gap-1">
                      <Quote className="w-3 h-3 text-[#C04E2A]" />
                      SUPPORTING EVIDENCE ({supportingPassages.length})
                    </span>
                    <span className="text-[10px] font-mono text-[#786A61]">
                      Click to highlight
                    </span>
                  </div>

                  {supportingPassages.length > 0 ? (
                    supportingPassages.map((p) => (
                      <div
                        key={p.evidence_id}
                        onClick={() => handleSelectPassage(p)}
                        className="p-3 bg-[#FAF6F0] border border-[#E6CBBD] rounded-xs cursor-pointer hover:border-[#661414] transition-colors space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono text-[#661414] font-semibold">
                          <span>
                            Page {p.pdf_page_index} · {p.section}
                          </span>
                          <span className="text-[#786A61] font-normal flex items-center gap-0.5">
                            <span>Locate</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </span>
                        </div>
                        <p className="font-serif italic text-xs leading-relaxed text-[#351D1D]">
                          "{p.verbatim_text}"
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 bg-[#661414]/5 border border-[#661414]/30 text-[#661414] text-xs rounded-xs">
                      No supporting evidence passages linked to this claim. (Rule 1 Blocker)
                    </div>
                  )}
                </div>

                {/* Methodology Anchors */}
                <div className="border-t border-[#E6CBBD] pt-3 space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#786A61] font-semibold block">
                    METHODOLOGICAL ANCHORS
                  </span>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 bg-[#F8F2EB] border border-[#E6CBBD] rounded-xs">
                      <span className="text-[9px] font-mono uppercase text-[#786A61] block">Population</span>
                      <span className="font-medium text-[#351D1D] block mt-0.5">{activeClaim.population}</span>
                    </div>
                    <div className="p-2 bg-[#F8F2EB] border border-[#E6CBBD] rounded-xs">
                      <span className="text-[9px] font-mono uppercase text-[#786A61] block">Study Design</span>
                      <span className="font-medium text-[#351D1D] block mt-0.5">{activeClaim.study_design}</span>
                    </div>
                  </div>

                  {activeClaim.numbers_and_units && activeClaim.numbers_and_units !== 'NOT REPORTED' && (
                    <div className="p-2 bg-[#F8F2EB] border border-[#E6CBBD] rounded-xs text-[11px]">
                      <span className="text-[9px] font-mono uppercase text-[#786A61] block">Reported Metric / Units</span>
                      <span className="font-mono text-[#391E1D] block mt-0.5">{activeClaim.numbers_and_units}</span>
                    </div>
                  )}

                  {activeClaim.limitations && activeClaim.limitations !== 'NOT REPORTED' && (
                    <div className="p-2.5 bg-[#F8F2EB] border border-[#E6CBBD] rounded-xs text-[11px]">
                      <span className="text-[9px] font-mono uppercase text-[#786A61] block font-semibold">Disclosed Limitations</span>
                      <span className="italic text-[#553636] block mt-0.5">{activeClaim.limitations}</span>
                    </div>
                  )}
                </div>

                {/* Human Editorial Decisions */}
                <div className="border-t border-[#E6CBBD] pt-4 space-y-2.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#786A61] font-semibold block">
                    EDITORIAL DECISION ACTION
                  </span>

                  {activeClaim.review_status !== 'HUMAN_APPROVED' && (
                    <button
                      onClick={() => handleApprove(activeClaim)}
                      className="w-full py-2 px-3 text-xs font-semibold bg-[#416C49] hover:bg-[#34583b] text-[#FFFDF9] rounded-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve Claim for Content Studio</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleAuditSingleClaimViaGemini(activeClaim)}
                    disabled={isAuditing}
                    className="w-full py-1.5 px-3 text-xs font-semibold bg-[#FFFDF9] hover:bg-[#F8F2EB] border border-[#E6CBBD] text-[#661414] rounded-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                    title="Audit this claim against evidence passages with Gemini Flash"
                  >
                    {isAuditing ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#C04E2A]" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-[#C04E2A]" />
                    )}
                    <span>Audit with Gemini Flash</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        const note = prompt('Reason for flagging this claim:', activeClaim.reviewer_note || '');
                        if (note !== null) handleFlag(activeClaim, note);
                      }}
                      className="py-1.5 px-2 bg-[#FFFDF9] hover:bg-[#F8F2EB] border border-[#E6CBBD] text-[#C04E2A] text-xs font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors rounded-xs"
                    >
                      <AlertTriangle className="w-3 h-3" />
                      <span>Flag Claim</span>
                    </button>

                    <button
                      onClick={() => handleReject(activeClaim)}
                      className="py-1.5 px-2 bg-[#FFFDF9] hover:bg-[#F8F2EB] border border-[#E6CBBD] text-[#661414] text-xs font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors rounded-xs"
                    >
                      <XCircle className="w-3 h-3" />
                      <span>Reject Claim</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-[#786A61]">
                No claims available. Ingest a paper or click "Formulate Claim" to add one.
              </div>
            )}
          </div>
        </div>

        {/* Pane C: Context Inspector */}
        {isInspectorOpen && (
          <div
            className={`lg:col-span-3 bg-[#FFFDF9] border border-[#E6CBBD] rounded-xs flex flex-col h-[760px] overflow-hidden shadow-xs ${
              mobileTab === 'inspector' ? 'block' : 'hidden lg:flex'
            }`}
          >
            {/* Inspector Header */}
            <div className="p-3 bg-[#FAF6F0] border-b border-[#E6CBBD] flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#786A61] font-bold">
                AUDIT TRAIL & DEPENDENCIES
              </span>
              <button
                onClick={() => setIsInspectorOpen(false)}
                className="text-[#786A61] hover:text-[#351D1D] p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Inspector Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {activeClaim ? (
                <>
                  {/* 12-Rule Verification Summary */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#786A61] font-semibold block">
                      12-RULE VALIDATION ENGINE
                    </span>

                    {activeClaim.validation_checks && activeClaim.validation_checks.length > 0 ? (
                      <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
                        {activeClaim.validation_checks.map((chk) => (
                          <div
                            key={chk.rule_id}
                            className={`p-2 rounded-xs border text-[11px] leading-snug space-y-0.5 ${
                              chk.outcome === 'FAIL'
                                ? 'bg-[#661414]/5 border-[#661414]/30 text-[#661414]'
                                : chk.outcome === 'NEEDS_REVIEW'
                                ? 'bg-[#C04E2A]/5 border-[#C04E2A]/30 text-[#C04E2A]'
                                : 'bg-[#416C49]/5 border-[#416C49]/20 text-[#416C49]'
                            }`}
                          >
                            <div className="flex items-center justify-between font-mono text-[9px] font-bold">
                              <span>Rule {chk.rule_number}: {chk.rule_name}</span>
                              <span className="uppercase">{chk.outcome}</span>
                            </div>
                            <p className="text-[#351D1D]">{chk.reason}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-2.5 bg-[#416C49]/10 border border-[#416C49]/30 text-[#416C49] flex items-center gap-1.5 font-medium rounded-xs">
                        <Check className="w-3.5 h-3.5" />
                        <span>All deterministic checks passed.</span>
                      </div>
                    )}
                  </div>

                  {/* Review Decision History Timeline */}
                  <div className="border-t border-[#E6CBBD] pt-3 space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#786A61] font-semibold flex items-center gap-1">
                      <History className="w-3 h-3 text-[#661414]" />
                      REVIEW DECISION HISTORY
                    </span>

                    {activeClaim.review_history && activeClaim.review_history.length > 0 ? (
                      <div className="space-y-2 relative pl-2.5 border-l border-[#E6CBBD]">
                        {activeClaim.review_history.map((entry) => (
                          <div key={entry.id} className="relative text-[11px] space-y-0.5">
                            <div className="flex items-center justify-between font-mono text-[9px] text-[#786A61]">
                              <span className="font-bold text-[#661414]">{entry.action}</span>
                              <span>{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="text-[#351D1D] font-medium">
                              By {entry.reviewer}: {entry.note || 'Status updated'}
                            </div>
                            <div className="text-[10px] font-mono text-[#786A61]">
                              {entry.previous_status} → {entry.new_status}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-2.5 bg-[#FAF6F0] border border-[#E6CBBD] text-[#786A61] text-[11px] rounded-xs">
                        No review actions recorded yet.
                      </div>
                    )}
                  </div>

                  {/* Downstream Deliverables Dependent on This Claim */}
                  <div className="border-t border-[#E6CBBD] pt-3 space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#786A61] font-semibold flex items-center gap-1">
                      <Layers className="w-3 h-3 text-[#416C49]" />
                      DOWNSTREAM DELIVERABLES
                    </span>

                    {impactReport && impactReport.affected_deliverables.length > 0 ? (
                      <div className="space-y-1.5">
                        {impactReport.affected_deliverables.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-2 bg-[#FAF6F0] border border-[#E6CBBD] text-[11px] space-y-1 rounded-xs"
                          >
                            <div className="flex items-center justify-between font-mono text-[9px] font-bold">
                              <span className="text-[#351D1D]">{item.deliverable_type}</span>
                              <span
                                className={
                                  item.severity === 'HIGH_BLOCKER'
                                    ? 'text-[#661414]'
                                    : 'text-[#C04E2A]'
                                }
                              >
                                {item.severity === 'HIGH_BLOCKER' ? 'Blocked' : 'Requires Re-review'}
                              </span>
                            </div>
                            <p className="text-[#351D1D] font-medium leading-snug">
                              {item.item_label}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-2.5 bg-[#FAF6F0] border border-[#E6CBBD] text-[#786A61] text-[11px] rounded-xs">
                        No public content deliverables currently rely on this claim.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="p-6 text-center text-[#786A61]">
                  Select a claim to inspect audit trail.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 03. Edit Claim Statement Modal */}
      {editingClaim && (
        <div className="fixed inset-0 z-50 bg-[#351D1D]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF9] border border-[#E6CBBD] max-w-lg w-full p-6 space-y-4 shadow-xl rounded-xs animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E6CBBD] pb-3">
              <h3 className="font-serif font-bold text-base text-[#351D1D]">
                Edit Claim Statement
              </h3>
              <button
                onClick={() => setEditingClaim(null)}
                className="text-[#786A61] hover:text-[#351D1D] p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-mono text-[10px] uppercase text-[#786A61] block font-semibold">
                  Claim Text
                </label>
                <textarea
                  value={editingClaim.claim_text}
                  onChange={(e) =>
                    setEditingClaim({ ...editingClaim, claim_text: e.target.value })
                  }
                  rows={3}
                  className="w-full p-2 bg-[#FAF6F0] border border-[#E6CBBD] text-xs rounded-xs focus:outline-hidden focus:border-[#661414] leading-relaxed"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[10px] uppercase text-[#786A61] block font-semibold">
                  Exact Supporting Quote
                </label>
                <textarea
                  value={editingClaim.exact_supporting_quote}
                  onChange={(e) =>
                    setEditingClaim({
                      ...editingClaim,
                      exact_supporting_quote: e.target.value,
                    })
                  }
                  rows={2}
                  className="w-full p-2 bg-[#FAF6F0] border border-[#E6CBBD] text-xs rounded-xs focus:outline-hidden focus:border-[#661414] italic font-serif"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-[10px] uppercase text-[#786A61] block font-semibold">
                    Population
                  </label>
                  <input
                    type="text"
                    value={editingClaim.population}
                    onChange={(e) =>
                      setEditingClaim({ ...editingClaim, population: e.target.value })
                    }
                    className="w-full p-2 bg-[#FAF6F0] border border-[#E6CBBD] text-xs rounded-xs focus:outline-hidden focus:border-[#661414]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[10px] uppercase text-[#786A61] block font-semibold">
                    Study Design
                  </label>
                  <input
                    type="text"
                    value={editingClaim.study_design}
                    onChange={(e) =>
                      setEditingClaim({ ...editingClaim, study_design: e.target.value })
                    }
                    className="w-full p-2 bg-[#FAF6F0] border border-[#E6CBBD] text-xs rounded-xs focus:outline-hidden focus:border-[#661414]"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-[#E6CBBD]">
                <button
                  type="button"
                  onClick={() => setEditingClaim(null)}
                  className="px-3.5 py-1.5 border border-[#E6CBBD] hover:bg-[#F8F2EB] text-xs font-medium cursor-pointer rounded-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#661414] hover:bg-[#501010] text-[#FFFDF9] text-xs font-semibold cursor-pointer rounded-xs shadow-xs"
                >
                  Save & Trigger Re-audit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 04. Formulate Manual Claim Modal */}
      {showNewClaimModal && (
        <div className="fixed inset-0 z-50 bg-[#351D1D]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF9] border border-[#E6CBBD] max-w-lg w-full p-6 space-y-4 shadow-xl rounded-xs animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E6CBBD] pb-3">
              <h3 className="font-serif font-bold text-base text-[#351D1D]">
                Formulate New Empirical Claim
              </h3>
              <button
                onClick={() => setShowNewClaimModal(false)}
                className="text-[#786A61] hover:text-[#351D1D] p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateManualClaim} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-mono text-[10px] uppercase text-[#786A61] block font-semibold">
                  Source Evidence Passage
                </label>
                <select
                  value={newEvidenceId}
                  onChange={(e) => {
                    setNewEvidenceId(e.target.value);
                    const selected = paperPassages.find((p) => p.evidence_id === e.target.value);
                    if (selected) {
                      setNewQuote(selected.verbatim_text.substring(0, 180));
                    }
                  }}
                  className="w-full p-2 bg-[#FAF6F0] border border-[#E6CBBD] text-xs rounded-xs focus:outline-hidden focus:border-[#661414]"
                  required
                >
                  <option value="">Select source passage...</option>
                  {paperPassages.map((p) => (
                    <option key={p.evidence_id} value={p.evidence_id}>
                      Page {p.pdf_page_index} ({p.section}): {p.verbatim_text.substring(0, 50)}...
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[10px] uppercase text-[#786A61] block font-semibold">
                  Empirical Claim Statement
                </label>
                <textarea
                  value={newClaimText}
                  onChange={(e) => setNewClaimText(e.target.value)}
                  placeholder="e.g. In resistance-trained young men, semaglutide was associated with lean mass reduction..."
                  rows={3}
                  className="w-full p-2 bg-[#FAF6F0] border border-[#E6CBBD] text-xs rounded-xs focus:outline-hidden focus:border-[#661414] leading-relaxed"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[10px] uppercase text-[#786A61] block font-semibold">
                  Verbatim Source Quote
                </label>
                <textarea
                  value={newQuote}
                  onChange={(e) => setNewQuote(e.target.value)}
                  rows={2}
                  className="w-full p-2 bg-[#FAF6F0] border border-[#E6CBBD] text-xs rounded-xs focus:outline-hidden focus:border-[#661414] italic font-serif"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-[#E6CBBD]">
                <button
                  type="button"
                  onClick={() => setShowNewClaimModal(false)}
                  className="px-3.5 py-1.5 border border-[#E6CBBD] hover:bg-[#F8F2EB] text-xs font-medium cursor-pointer rounded-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#661414] hover:bg-[#501010] text-[#FFFDF9] text-xs font-semibold cursor-pointer rounded-xs shadow-xs"
                >
                  Create & Run Validation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
