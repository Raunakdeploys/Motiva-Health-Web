import React, { useState } from 'react';
import {
  ClaimRecord,
  EvidencePassage,
  PaperRecord,
} from '../types';
import { runValidationEngine } from '../utils/validationEngine';
import { authenticatedApiFetch } from '../utils/sqlApiClient';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Edit3,
  ExternalLink,
  Sparkles,
  Plus,
  RefreshCw,
  Check,
  X,
  ArrowRight,
  ShieldCheck,
  Quote,
  Search,
} from 'lucide-react';

interface ClaimLedgerProps {
  activePaper: PaperRecord | null;
  passages: EvidencePassage[];
  claims: ClaimRecord[];
  onUpdateClaim: (claim: ClaimRecord, wasApprovedEdited: boolean) => void;
  onAddClaim: (claim: ClaimRecord) => void;
  onDeleteClaim: (claimId: string) => void;
  onBatchAddClaims: (claims: ClaimRecord[]) => void;
  onBatchUpdateClaims?: (claims: ClaimRecord[]) => void;
  onViewSourcePassage: (evidenceId: string) => void;
  onNavigateToStudio: () => void;
  selectedClaimId?: string | null;
  onSelectClaim?: (claim: ClaimRecord) => void;
  onResumeContentGeneration?: () => void;
}

export const ClaimLedger: React.FC<ClaimLedgerProps> = ({
  activePaper,
  passages,
  claims,
  onUpdateClaim,
  onAddClaim,
  onDeleteClaim,
  onViewSourcePassage,
  onNavigateToStudio,
  selectedClaimId: externalSelectedClaimId,
  onSelectClaim,
  onResumeContentGeneration,
}) => {
  const [internalSelectedClaimId, setInternalSelectedClaimId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isGeneratingAiClaims, setIsGeneratingAiClaims] = useState(false);
  const [isAuditingClaims, setIsAuditingClaims] = useState(false);
  const [auditSummary, setAuditSummary] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Edit claim modal state
  const [editingClaim, setEditingClaim] = useState<ClaimRecord | null>(null);

  // New manual claim modal
  const [showNewClaimModal, setShowNewClaimModal] = useState(false);
  const [newClaimText, setNewClaimText] = useState('');
  const [newSelectedEvidenceId, setNewSelectedEvidenceId] = useState('');
  const [newQuote, setNewQuote] = useState('');
  const [newPopulation, setNewPopulation] = useState('NOT REPORTED');
  const [newStudyDesign, setNewStudyDesign] = useState('NOT REPORTED');
  const [newNumbers, setNewNumbers] = useState('NOT REPORTED');
  const [newLimitations, setNewLimitations] = useState('NOT REPORTED');

  if (!activePaper) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center text-[#786A61]">
        Please ingest a scientific paper to inspect its claim ledger.
      </div>
    );
  }

  const paperPassages = passages.filter((p) => p.paper_id === activePaper.paper_id);
  const paperClaims = claims.filter((c) => c.paper_id === activePaper.paper_id);

  // Re-run validation engine deterministically
  const validatedClaims = paperClaims.map((claim) => {
    const { findings, calculatedStatus } = runValidationEngine(claim, paperPassages, paperClaims);
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
      review_status: resolvedStatus,
    };
  });

  const filteredClaims = validatedClaims.filter((claim) => {
    // In ALL filter, exclude REJECTED claims from the active review view
    if (statusFilter === 'ALL' && claim.review_status === 'REJECTED') {
      return false;
    }
    const matchesFilter = statusFilter === 'ALL' || claim.review_status === statusFilter;
    const matchesSearch =
      searchQuery === '' ||
      claim.claim_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.exact_supporting_quote.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.population.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const activeClaimId = externalSelectedClaimId || internalSelectedClaimId;
  const activeClaim =
    validatedClaims.find((c) => c.claim_id === activeClaimId) ||
    filteredClaims[0] ||
    validatedClaims[0] ||
    null;

  const linkedPassage = activeClaim
    ? paperPassages.find((p) => activeClaim.evidence_ids.includes(p.evidence_id))
    : null;

  const approvedCount = validatedClaims.filter((c) => c.review_status === 'HUMAN_APPROVED').length;
  const blockedCount = validatedClaims.filter((c) => c.review_status === 'BLOCKED').length;
  const flaggedCount = validatedClaims.filter((c) => c.review_status === 'FLAGGED').length;

  const handleSelectClaimRecord = (claim: ClaimRecord) => {
    setInternalSelectedClaimId(claim.claim_id);
    if (onSelectClaim) onSelectClaim(claim);
  };

  // Server-side AI Claim Drafting
  const handleDraftClaimsViaGemini = async () => {
    if (paperPassages.length === 0) {
      alert('No readable extracted passages found for this paper.');
      return;
    }

    setIsGeneratingAiClaims(true);
    setAiError(null);

    try {
      const response = await authenticatedApiFetch('/api/generate-claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paper_id: activePaper.paper_id,
          paper_title: activePaper.title,
          passages: paperPassages.map((p) => ({
            evidence_id: p.evidence_id,
            pdf_page_index: p.pdf_page_index,
            verbatim_text: p.verbatim_text,
            section: p.section,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract claims.');
      }

      if (data.claims && Array.isArray(data.claims)) {
        for (const claim of data.claims) {
          onAddClaim(claim);
        }
        setAuditSummary(`Successfully extracted ${data.claims.length} structured clinical claims.`);
        setTimeout(() => setAuditSummary(null), 5000);
      }
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'AI claim generation encountered an error.');
    } finally {
      setIsGeneratingAiClaims(false);
    }
  };

  // Full Clinical Auto-Audit with Gemini
  const handleAutoAuditClaimsViaGemini = async () => {
    if (paperClaims.length === 0) return;
    setIsAuditingClaims(true);
    setAiError(null);

    try {
      const response = await authenticatedApiFetch('/api/audit-claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paper_title: activePaper.title,
          claims: paperClaims,
          passages: paperPassages,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to auto-audit claims.');
      }

      if (data.audited_claims && Array.isArray(data.audited_claims)) {
        for (const audited of data.audited_claims) {
          onUpdateClaim(audited, false);
        }
        setAuditSummary(
          `AI review complete: checked ${data.audited_claims.length} claims against source text. Final approval remains with your human reviewer.`
        );
        setTimeout(() => setAuditSummary(null), 6000);
      }
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Auto-audit encountered an error.');
    } finally {
      setIsAuditingClaims(false);
    }
  };

  const handleAuditSingleClaimViaGemini = async (claim: ClaimRecord) => {
    setIsAuditingClaims(true);
    setAiError(null);

    try {
      const response = await authenticatedApiFetch('/api/audit-claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paper_title: activePaper.title,
          claims: [claim],
          passages: paperPassages,
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
      console.error(err);
      setAiError(err.message || 'Failed to audit single claim.');
    } finally {
      setIsAuditingClaims(false);
    }
  };

  // Human Review Actions
  const handleApprove = (claim: ClaimRecord) => {
    const hasBlockers = claim.validation_findings?.some((f) => f.severity === 'BLOCKER');
    if (hasBlockers) {
      alert('Cannot approve claim: It contains blocking validation errors that must be resolved first.');
      return;
    }

    const updated: ClaimRecord = {
      ...claim,
      review_status: 'HUMAN_APPROVED',
      approved_version: {
        claim_text: claim.claim_text,
        approved_at: new Date().toISOString(),
        approved_by: 'Editorial Research Reviewer',
      },
      updated_at: new Date().toISOString(),
    };
    onUpdateClaim(updated, false);
  };

  const handleFlag = (claim: ClaimRecord, note: string) => {
    const wasApproved = claim.review_status === 'HUMAN_APPROVED';
    const updated: ClaimRecord = {
      ...claim,
      review_status: 'FLAGGED',
      reviewer_note: note,
      updated_at: new Date().toISOString(),
    };
    onUpdateClaim(updated, wasApproved);
    setAuditSummary('Claim flagged with caveat note & isolated from active generation.');
    setTimeout(() => setAuditSummary(null), 5000);

    // Select next pending claim if available
    const remainingPending = validatedClaims.filter(
      (c) => c.claim_id !== claim.claim_id && c.review_status === 'READY_FOR_HUMAN_REVIEW'
    );
    if (remainingPending.length > 0) {
      handleSelectClaimRecord(remainingPending[0]);
    }

    if (onResumeContentGeneration) {
      onResumeContentGeneration();
    }
  };

  const handleReject = (claim: ClaimRecord) => {
    if (confirm(`Reject and remove "${claim.claim_text.substring(0, 45)}..." from the editorial pipeline?`)) {
      if (onDeleteClaim) {
        onDeleteClaim(claim.claim_id);
      } else {
        const updated: ClaimRecord = {
          ...claim,
          review_status: 'REJECTED',
          updated_at: new Date().toISOString(),
        };
        onUpdateClaim(updated, claim.review_status === 'HUMAN_APPROVED');
      }
      setAuditSummary('Claim rejected & removed from editorial pipeline.');
      setTimeout(() => setAuditSummary(null), 5000);

      // Select next available claim
      const remaining = validatedClaims.filter(
        (c) => c.claim_id !== claim.claim_id && c.review_status !== 'REJECTED'
      );
      if (remaining.length > 0) {
        handleSelectClaimRecord(remaining[0]);
      } else {
        setInternalSelectedClaimId(null);
      }

      if (onResumeContentGeneration) {
        onResumeContentGeneration();
      }
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClaim) return;

    const wasApproved = editingClaim.review_status === 'HUMAN_APPROVED';
    const updated: ClaimRecord = {
      ...editingClaim,
      updated_at: new Date().toISOString(),
    };

    onUpdateClaim(updated, wasApproved);
    setEditingClaim(null);
  };

  const handleCreateManualClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClaimText.trim() || !newSelectedEvidenceId) {
      alert('Claim statement and linked evidence passage are required.');
      return;
    }

    const newClaim: ClaimRecord = {
      claim_id: `claim_${activePaper.paper_id}_manual_${Date.now().toString(36)}`,
      paper_id: activePaper.paper_id,
      claim_text: newClaimText.trim(),
      evidence_ids: [newSelectedEvidenceId],
      exact_supporting_quote: newQuote.trim(),
      population: newPopulation.trim() || 'NOT REPORTED',
      study_design: newStudyDesign.trim() || 'NOT REPORTED',
      intervention_or_exposure: 'NOT REPORTED',
      comparison: 'NOT REPORTED',
      outcome: 'NOT REPORTED',
      numbers_and_units: newNumbers.trim() || 'NOT REPORTED',
      limitations: newLimitations.trim() || 'NOT REPORTED',
      certainty_notes: 'Formulated manually from verbatim passage.',
      risk_flags: [],
      review_status: 'READY_FOR_HUMAN_REVIEW',
      reviewer_note: 'Manually drafted claim.',
      updated_at: new Date().toISOString(),
    };

    onAddClaim(newClaim);
    setShowNewClaimModal(false);
    setNewClaimText('');
    setNewQuote('');
    handleSelectClaimRecord(newClaim);
  };

  return (
    <div className="max-w-[1500px] mx-auto p-4 sm:p-6 space-y-6">
      {/* 01. Desk Action Header & Filter Bar */}
      <div className="bg-[#FFFDF9] border border-[#E6CBBD] p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs rounded-xs">
        {/* Left: Metrics & Status */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#661414] text-[#F5EBDF] text-[10px] font-mono font-bold uppercase rounded-xs">
              STAGE 02
            </span>
            <h2 className="font-serif font-bold text-lg text-[#351D1D] tracking-tight">
              Human Review Gate (12-Rule Clinical Audit)
            </h2>
          </div>
          <p className="text-xs text-[#786A61] leading-relaxed">
            Deterministic rule engine checks verbatim quotes, study design, and sample sizes before content generation.
          </p>
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] pt-1">
            <span className="text-[#416C49] font-semibold bg-[#416C49]/15 px-2 py-0.5 rounded-xs">
              ✓ {approvedCount} Human Approved
            </span>
            <span className="text-[#C04E2A] font-semibold bg-[#C04E2A]/15 px-2 py-0.5 rounded-xs">
              ⚠ {flaggedCount} Flagged
            </span>
            {blockedCount > 0 && (
              <span className="text-[#661414] font-semibold bg-[#661414]/15 px-2 py-0.5 rounded-xs">
                ✕ {blockedCount} Blocked
              </span>
            )}
            <span className="text-[#786A61] font-mono">
              ({validatedClaims.length} Claims Total)
            </span>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setShowNewClaimModal(true)}
            className="px-3 py-1.5 bg-[#FFFDF9] hover:bg-[#F8F2EB] text-[#351D1D] border border-[#E6CBBD] rounded-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[#661414]" />
            <span>Formulate Claim</span>
          </button>

          <button
            onClick={handleDraftClaimsViaGemini}
            disabled={isGeneratingAiClaims}
            className="px-3.5 py-1.5 bg-[#FFFDF9] hover:bg-[#F8F2EB] disabled:opacity-50 text-[#351D1D] border border-[#E6CBBD] rounded-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            {isGeneratingAiClaims ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#C04E2A]" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-[#C04E2A]" />
            )}
            <span>{isGeneratingAiClaims ? 'Extracting...' : 'Extract Claims (AI Draft)'}</span>
          </button>

          <button
            onClick={handleAutoAuditClaimsViaGemini}
            disabled={isAuditingClaims || paperClaims.length === 0}
            className="px-4 py-1.5 bg-[#661414] hover:bg-[#501010] disabled:opacity-50 text-[#FFFDF9] rounded-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
            title="Cross-reference all claims against source passages with Gemini Flash and auto-approve verified claims"
          >
            {isAuditingClaims ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#C04E2A]" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-[#C04E2A]" />
            )}
            <span>{isAuditingClaims ? 'Auditing...' : 'Auto-Audit All (Gemini Flash)'}</span>
          </button>

          {approvedCount > 0 && (
            <button
              onClick={onNavigateToStudio}
              className="px-3.5 py-1.5 bg-[#416C49] hover:bg-[#325438] text-[#FFFDF9] rounded-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
            >
              <span>Content Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {auditSummary && (
        <div className="p-3.5 bg-[#416C49]/15 border border-[#416C49]/30 text-[#416C49] text-xs flex items-center justify-between gap-2 rounded-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#416C49]" />
            <span>{auditSummary}</span>
          </div>
          <button
            onClick={() => setAuditSummary(null)}
            className="text-[11px] font-mono hover:text-[#351D1D] cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {aiError && (
        <div className="p-3.5 bg-[#661414]/10 border border-[#661414]/30 text-[#661414] text-xs rounded-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{aiError}</span>
        </div>
      )}

      {/* 02. Two-Column Review Layout: Left Claims List, Right Interactive Verification Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Claims Ledger Table (7 Cols) */}
        <div className="lg:col-span-7 bg-[#FFFDF9] border border-[#E6CBBD] rounded-xs flex flex-col shadow-xs overflow-hidden">
          {/* Filter and Search Sub-bar */}
          <div className="p-3 border-b border-[#E6CBBD] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-[#FAF6F0]">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-[#786A61] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search claims, populations, quotes..."
                className="w-full bg-[#FFFDF9] border border-[#E6CBBD] text-xs py-1.5 pl-8 pr-3 text-[#351D1D] placeholder-[#786A61] rounded-xs focus:outline-hidden focus:border-[#661414]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1 text-[11px] font-mono">
              {['ALL', 'READY_FOR_HUMAN_REVIEW', 'HUMAN_APPROVED', 'FLAGGED', 'BLOCKED', 'REJECTED'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-2.5 py-1 rounded-xs transition-colors cursor-pointer ${
                    statusFilter === status
                      ? 'bg-[#661414] text-[#FFFDF9] font-semibold shadow-xs'
                      : 'text-[#786A61] hover:text-[#351D1D] hover:bg-[#F8F2EB]'
                  }`}
                >
                  {status === 'READY_FOR_HUMAN_REVIEW'
                    ? 'Pending'
                    : status === 'HUMAN_APPROVED'
                    ? 'Approved'
                    : status === 'REJECTED'
                    ? 'Rejected'
                    : status}
                </button>
              ))}
            </div>
          </div>

          {/* Claims List Rows */}
          <div className="divide-y divide-[#E6CBBD] max-h-[750px] overflow-y-auto">
            {filteredClaims.length > 0 ? (
              filteredClaims.map((claim) => {
                const isSelected = activeClaim?.claim_id === claim.claim_id;
                const hasBlockers = claim.validation_findings?.some((f) => f.severity === 'BLOCKER');
                const hasFlags = claim.validation_findings?.some((f) => f.severity === 'FLAG');

                return (
                  <div
                    key={claim.claim_id}
                    onClick={() => handleSelectClaimRecord(claim)}
                    className={`p-4 transition-colors cursor-pointer text-xs space-y-2 ${
                      isSelected
                        ? 'bg-[#FAF6F0] border-l-3 border-[#661414]'
                        : 'hover:bg-[#FAF6F0]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.2 rounded-xs font-semibold ${
                            claim.review_status === 'HUMAN_APPROVED'
                              ? 'bg-[#416C49]/15 text-[#416C49]'
                              : claim.review_status === 'FLAGGED'
                              ? 'bg-[#C04E2A]/15 text-[#C04E2A]'
                              : claim.review_status === 'BLOCKED'
                              ? 'bg-[#661414]/15 text-[#661414]'
                              : 'bg-[#E6CBBD]/60 text-[#351D1D]'
                          }`}
                        >
                          {claim.review_status.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] font-mono text-[#786A61]">
                          ID: {claim.claim_id.substring(0, 16)}...
                        </span>
                      </div>

                      <span className="text-[10px] font-mono text-[#786A61]">
                        {claim.study_design}
                      </span>
                    </div>

                    <p className="font-serif text-sm font-semibold text-[#351D1D] leading-snug">
                      {claim.claim_text}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-[#786A61]">
                      <span className="truncate max-w-[260px]">
                        Pop: {claim.population}
                      </span>

                      {hasBlockers ? (
                        <span className="text-[#661414] font-mono text-[10px] flex items-center gap-1 font-semibold">
                          <XCircle className="w-3 h-3" /> Blocker Detected
                        </span>
                      ) : hasFlags ? (
                        <span className="text-[#C04E2A] font-mono text-[10px] flex items-center gap-1 font-semibold">
                          <AlertTriangle className="w-3 h-3" /> Flagged Finding
                        </span>
                      ) : (
                        <span className="text-[#416C49] font-mono text-[10px] flex items-center gap-1">
                          <Check className="w-3 h-3" /> Verified
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-[#786A61]">
                No claims match the selected filter.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Detailed Evidence Verification Deck (5 Cols) */}
        <div className="lg:col-span-5 bg-[#FFFDF9] border border-[#E6CBBD] rounded-xs p-5 space-y-4 sticky top-20 shadow-xs">
          {activeClaim ? (
            <>
              {/* Header: Title and Status */}
              <div className="flex items-center justify-between border-b border-[#E6CBBD] pb-3">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#786A61] font-bold">
                  EVIDENCE VERIFICATION DECK
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-xs font-semibold ${
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
              </div>

              {/* Claim Statement */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#786A61] font-semibold block">
                  ACTIVE CLAIM STATEMENT
                </span>
                <div className="p-3 bg-[#F8F2EB] border-l-3 border-[#661414] font-serif text-sm font-semibold text-[#351D1D] leading-snug rounded-r-xs">
                  {activeClaim.claim_text}
                </div>
              </div>

              {/* Verbatim Supporting Passage */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#786A61] font-semibold flex items-center gap-1">
                    <Quote className="w-3 h-3 text-[#C04E2A]" />
                    VERBATIM SOURCE EVIDENCE
                  </span>
                  {linkedPassage && (
                    <button
                      onClick={() => onViewSourcePassage(linkedPassage.evidence_id)}
                      className="text-[10px] font-mono text-[#661414] hover:underline flex items-center gap-0.5 cursor-pointer font-medium"
                    >
                      <span>p. {linkedPassage.pdf_page_index} ({linkedPassage.section})</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>

                <div className="p-3 bg-[#FAF6F0] border border-[#E6CBBD] rounded-xs font-serif text-xs italic text-[#351D1D] leading-relaxed">
                  "{activeClaim.exact_supporting_quote || linkedPassage?.verbatim_text || 'No verbatim quote found.'}"
                </div>
              </div>

              {/* Methodology Matrix */}
              <div className="border-t border-[#E6CBBD] pt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 border border-[#E6CBBD] bg-[#F8F2EB] rounded-xs">
                  <span className="text-[9px] font-mono uppercase text-[#786A61] block">Cohort / Population</span>
                  <span className="font-medium text-[#351D1D] block mt-0.5">{activeClaim.population}</span>
                </div>
                <div className="p-2 border border-[#E6CBBD] bg-[#F8F2EB] rounded-xs">
                  <span className="text-[9px] font-mono uppercase text-[#786A61] block">Study Design</span>
                  <span className="font-medium text-[#351D1D] block mt-0.5">{activeClaim.study_design}</span>
                </div>
              </div>

              {/* Deterministic Validation Engine Findings */}
              <div className="border-t border-[#E6CBBD] pt-3 space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#786A61] font-semibold block">
                  12-RULE VALIDATION STATUS
                </span>

                {activeClaim.validation_findings && activeClaim.validation_findings.length > 0 ? (
                  <div className="space-y-1.5">
                    {activeClaim.validation_findings.map((f, i) => (
                      <div
                        key={i}
                        className={`p-2.5 text-xs rounded-xs border space-y-1 ${
                          f.severity === 'BLOCKER'
                            ? 'bg-[#661414]/5 border-[#661414]/30 text-[#661414]'
                            : 'bg-[#C04E2A]/5 border-[#C04E2A]/30 text-[#C04E2A]'
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono text-[9px] font-bold uppercase">
                          <span>{f.rule_id}</span>
                          <span>{f.severity}</span>
                        </div>
                        <p className="text-[#391E1D] font-medium leading-snug">{f.reason}</p>
                        <p className="text-[10px] font-mono text-[#786A61]">
                          Fix: {f.recommended_action}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-2.5 bg-[#416C49]/10 border border-[#416C49]/30 text-[#416C49] text-xs flex items-center gap-2 font-medium rounded-xs">
                    <Check className="w-3.5 h-3.5" />
                    <span>All deterministic checks passed cleanly.</span>
                  </div>
                )}
              </div>

              {/* Human Editorial Decision Bar */}
              <div className="border-t border-[#E6CBBD] pt-3 space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#786A61] font-semibold block">
                  REVIEWER DECISION
                </span>

                <div className="flex flex-col gap-2">
                  {activeClaim.review_status !== 'HUMAN_APPROVED' && (
                    <button
                      onClick={() => handleApprove(activeClaim)}
                      className="w-full py-2.5 px-3 text-xs font-semibold bg-[#416C49] hover:bg-[#34583b] text-[#FFFDF9] rounded-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Sign Off & Approve Claim (Doctor Verified)</span>
                    </button>
                  )}

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => {
                        const note = prompt(
                          'Enter reviewer flag note:',
                          activeClaim.reviewer_note || ''
                        );
                        if (note !== null) handleFlag(activeClaim, note);
                      }}
                      className="py-1.5 px-2 bg-[#FFFDF9] hover:bg-[#F8F2EB] border border-[#E6CBBD] text-[#C04E2A] text-xs font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors rounded-xs"
                    >
                      <AlertTriangle className="w-3 h-3" />
                      <span>Flag</span>
                    </button>

                    <button
                      onClick={() => setEditingClaim(activeClaim)}
                      className="py-1.5 px-2 bg-[#FFFDF9] hover:bg-[#F8F2EB] border border-[#E6CBBD] text-[#351D1D] text-xs font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors rounded-xs"
                    >
                      <Edit3 className="w-3 h-3 text-[#786A61]" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => handleReject(activeClaim)}
                      className="py-1.5 px-2 bg-[#FFFDF9] hover:bg-[#F8F2EB] border border-[#E6CBBD] text-[#661414] text-xs font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors rounded-xs"
                    >
                      <X className="w-3 h-3" />
                      <span>Reject</span>
                    </button>
                  </div>

                  <button
                    onClick={() => handleAuditSingleClaimViaGemini(activeClaim)}
                    disabled={isAuditingClaims}
                    className="w-full py-2 px-3 text-xs font-semibold bg-[#FFFDF9] hover:bg-[#F8F2EB] border border-[#E6CBBD] text-[#661414] rounded-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                    title="Audit this individual claim with Gemini Flash against verbatim source passages"
                  >
                    {isAuditingClaims ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#C04E2A]" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-[#C04E2A]" />
                    )}
                    <span>Audit This Claim (Gemini Flash)</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-[#786A61]">
              Select a claim to inspect evidence.
            </div>
          )}
        </div>
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
                  Save & Re-validate
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
                Formulate New Factual Claim
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
                  value={newSelectedEvidenceId}
                  onChange={(e) => {
                    setNewSelectedEvidenceId(e.target.value);
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
                  Factual Health Claim Statement
                </label>
                <textarea
                  value={newClaimText}
                  onChange={(e) => setNewClaimText(e.target.value)}
                  placeholder="e.g. In resistance-trained young men, 14 days of supplementation was associated with a 28% lower CK..."
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
