import React, { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  FileText,
  FileUp,
  Layers,
  Radio,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import type {
  CarouselContent,
  ClaimRecord,
  EvidencePassage,
  PaperRecord,
  ReelContent,
  StaticPostContent,
} from '../types';
import type { ActiveTab } from './NavigationSidebar';

interface WorkspaceProps {
  papers: PaperRecord[];
  activePaper: PaperRecord | null;
  passages: EvidencePassage[];
  claims: ClaimRecord[];
  carousel: CarouselContent | null;
  staticPost: StaticPostContent | null;
  reel: ReelContent | null;
  onNavigate: (tab: ActiveTab) => void;
  onOpenDemo: () => void;
  onSwitchPaper: (paperId: string) => void;
  onSelectClaimForReview?: (claim: ClaimRecord) => void;
}

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  note: string;
  tone?: 'sage' | 'rust' | 'forest';
  prominent?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  icon: Icon,
  label,
  value,
  note,
  tone = 'forest',
  prominent = false,
}) => (
  <article className="motiva-metric-card" data-tone={tone} data-prominent={prominent}>
    <div className="motiva-metric-top">
      <span>{label}</span>
      <span className="motiva-metric-icon" data-tone={tone}>
        <Icon size={15} aria-hidden="true" />
      </span>
    </div>
    <div>
      <div className="motiva-metric-value">{value}</div>
      <div className="motiva-metric-note">{note}</div>
    </div>
  </article>
);

const getClaimStatus = (claim: ClaimRecord) => {
  if (claim.review_status === 'HUMAN_APPROVED') return { label: 'Approved', tone: 'sage' };
  if (claim.review_status === 'FLAGGED' || claim.review_status === 'BLOCKED') {
    return { label: claim.review_status === 'BLOCKED' ? 'Blocked' : 'Flagged', tone: 'rust' };
  }
  return { label: 'Needs review', tone: 'forest' };
};

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
    ? passages.filter((passage) => passage.paper_id === activePaper.paper_id)
    : [];
  const currentClaims = activePaper
    ? claims.filter((claim) => claim.paper_id === activePaper.paper_id)
    : [];

  const approvedClaims = currentClaims.filter((claim) => claim.review_status === 'HUMAN_APPROVED');
  const flaggedClaims = currentClaims.filter((claim) => claim.review_status === 'FLAGGED');
  const blockedClaims = currentClaims.filter((claim) => claim.review_status === 'BLOCKED');
  const pendingClaims = currentClaims.filter((claim) => claim.review_status === 'READY_FOR_HUMAN_REVIEW');
  const attentionClaims = [...blockedClaims, ...flaggedClaims, ...pendingClaims];
  const deliverableCount = [carousel, staticPost, reel].filter(Boolean).length;
  const displayedClaims =
    filterState === 'ATTENTION'
      ? attentionClaims
      : filterState === 'APPROVED'
      ? approvedClaims
      : currentClaims;
  const totalClaimCount = currentClaims.length || 1;

  const primaryAction: { label: string; tab: ActiveTab } =
    flaggedClaims.length + blockedClaims.length > 0
      ? { label: `Investigate ${flaggedClaims.length + blockedClaims.length} claims`, tab: 'desk' }
      : pendingClaims.length > 0
      ? { label: `Review ${pendingClaims.length} claims`, tab: 'review' }
      : approvedClaims.length > 0
      ? { label: 'Open content studio', tab: 'studio' }
      : { label: 'Open research library', tab: 'papers' };

  const pipeline: {
    label: string;
    detail: string;
    complete: boolean;
    tab: ActiveTab;
    icon: LucideIcon;
  }[] = [
    { label: 'Research', detail: `${papers.length} in library`, complete: !!activePaper, tab: 'papers', icon: BookOpen },
    { label: 'Evidence', detail: `${currentPassages.length} passages`, complete: currentPassages.length > 0, tab: 'source', icon: FileText },
    { label: 'Claims', detail: `${currentClaims.length} identified`, complete: currentClaims.length > 0, tab: 'desk', icon: Layers },
    { label: 'Review', detail: `${approvedClaims.length} approved`, complete: currentClaims.length > 0 && attentionClaims.length === 0, tab: 'review', icon: ShieldCheck },
    { label: 'Publish', detail: `${deliverableCount} formats ready`, complete: deliverableCount > 0, tab: 'studio', icon: Sparkles },
  ];
  const currentStepIndex = pipeline.findIndex((step) => !step.complete);

  if (papers.length === 0) {
    return (
      <div className="motiva-dashboard">
        <section className="motiva-empty-state" aria-labelledby="workspace-empty-title">
          <div className="motiva-empty-mark">
            <BookOpen size={28} aria-hidden="true" />
          </div>
          <div className="motiva-dashboard-eyebrow">MOTIVA evidence workspace</div>
          <h2 id="workspace-empty-title">Turn health research into responsible content.</h2>
          <p>
            MOTIVA turns clinical papers into source-linked claim drafts, checks them with transparent
            rules, and keeps human approval in the loop before content generation.
          </p>
          <div className="motiva-dashboard-actions">
            <button
              type="button"
              className="motiva-dashboard-button motiva-dashboard-button-primary"
              onClick={() => onNavigate('papers')}
            >
              <FileUp size={15} aria-hidden="true" />
              Upload a research paper
            </button>
            <button type="button" className="motiva-dashboard-button" onClick={onOpenDemo}>
              <Sparkles size={15} aria-hidden="true" />
              Load interactive sample
            </button>
          </div>
          <section className="motiva-value-card" aria-labelledby="motiva-value-title">
            <div className="motiva-value-card-heading">
              <span className="motiva-value-kicker">The evidence trail is the product</span>
              <h3 id="motiva-value-title">Not another paper summarizer</h3>
            </div>
            <ol className="motiva-value-flow">
              <li><strong>Start with a study</strong><span>Upload a paper or choose a sample.</span></li>
              <li><strong>Trace every claim</strong><span>Keep the supporting passage attached.</span></li>
              <li><strong>Review like a human</strong><span>Rule checks surface issues; people decide.</span></li>
              <li><strong>Create from approvals</strong><span>Only human-approved claims enter content.</span></li>
            </ol>
            <p className="motiva-value-note">AI can speed up a draft. It cannot approve one.</p>
          </section>
        </section>
      </div>
    );
  }

  return (
    <div className="motiva-dashboard">
      <section className="motiva-dashboard-heading" aria-labelledby="workspace-title">
        <div>
          <div className="motiva-dashboard-eyebrow">
            <span className="motiva-source-state" aria-hidden="true" />
            Evidence workspace
          </div>
          <h2 id="workspace-title">One clear view from paper to publish.</h2>
          <p>
            Every claim stays linked to its source passage. MOTIVA runs rule checks, then waits for a
            human approval before that claim can enter content generation.
          </p>
        </div>
        <div className="motiva-dashboard-actions">
          <button
            type="button"
            className="motiva-dashboard-button"
            onClick={() => onNavigate('papers')}
          >
            <FileUp size={15} aria-hidden="true" />
            Add research
          </button>
          <button
            type="button"
            className="motiva-dashboard-button motiva-dashboard-button-primary"
            onClick={() => onNavigate(primaryAction.tab)}
          >
            {primaryAction.label}
            <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
      </section>

      {activePaper && (
        <section className="motiva-active-study" aria-label="Active study">
          <div className="motiva-active-study-info">
            <span className="motiva-active-study-label">Currently working on</span>
            <span className="motiva-active-study-title" title={activePaper.title}>
              {activePaper.title}
            </span>
            <span className="motiva-active-study-meta">
              <span>{activePaper.journal || 'Journal not specified'}</span>
              <span aria-hidden="true">·</span>
              <span>{activePaper.year}</span>
              <span aria-hidden="true">·</span>
              <span>{currentPassages.length} passages</span>
              {activePaper.is_demo && <span className="motiva-status-badge">Sample study</span>}
            </span>
          </div>
          <div className="motiva-active-study-controls">
            {papers.length > 1 && (
              <label className="relative flex items-center">
                <span className="sr-only">Switch active study</span>
                <select
                  className="motiva-source-select appearance-none"
                  value={activePaper.paper_id}
                  onChange={(event) => onSwitchPaper(event.target.value)}
                >
                  {papers.map((paper) => (
                    <option key={paper.paper_id} value={paper.paper_id}>
                      {paper.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 text-[#77776f]" size={13} aria-hidden="true" />
              </label>
            )}
            <button
              type="button"
              className="motiva-dashboard-button"
              onClick={() => onNavigate('source')}
            >
              <FileText size={14} aria-hidden="true" />
              Open source
            </button>
          </div>
        </section>
      )}

      <section className="motiva-dashboard-kpis" aria-label="Active study metrics">
        <MetricCard
          icon={BookOpen}
          label="Research sources"
          value={papers.length}
          note="Papers in your library"
          tone="forest"
        />
        <MetricCard
          icon={Layers}
          label="Extracted claims"
          value={currentClaims.length}
          note={`${currentPassages.length} supporting passages`}
          tone="forest"
        />
        <MetricCard
          icon={AlertTriangle}
          label="Needs attention"
          value={attentionClaims.length}
          note={`${flaggedClaims.length + blockedClaims.length} flagged · ${pendingClaims.length} pending`}
          tone="rust"
          prominent={attentionClaims.length > 0}
        />
        <MetricCard
          icon={ShieldCheck}
          label="Human approved"
          value={approvedClaims.length}
          note="Ready for content production"
          tone="sage"
          prominent={attentionClaims.length === 0 && approvedClaims.length > 0}
        />
      </section>

      <div className="motiva-dashboard-grid">
        <div className="motiva-dashboard-column">
          <section className="motiva-panel" aria-labelledby="pipeline-heading">
            <div className="motiva-panel-heading">
              <div>
                <h3 id="pipeline-heading">Evidence pipeline</h3>
                <p>Every deliverable stays connected to its original research.</p>
              </div>
              <button type="button" className="motiva-inline-link" onClick={() => onNavigate('provenance')}>
                View provenance <ArrowRight size={13} aria-hidden="true" />
              </button>
            </div>

            <div className="motiva-pipeline-steps" role="group" aria-label="Evidence workflow stages">
              {pipeline.map((step, index) => {
                const Icon = step.icon;
                const isCurrent = index === currentStepIndex;

                return (
                  <button
                    type="button"
                    className="motiva-pipeline-step"
                    data-complete={step.complete}
                    data-current={isCurrent}
                    key={step.label}
                    onClick={() => onNavigate(step.tab)}
                    aria-current={isCurrent ? 'step' : undefined}
                    aria-label={`${step.label}: ${step.detail}. Open ${step.label.toLowerCase()} workspace.`}
                  >
                    <span className="motiva-pipeline-dot" aria-hidden="true">
                      {step.complete ? <CheckCircle2 size={15} /> : <Icon size={14} />}
                    </span>
                    <strong>{step.label}</strong>
                    <small>{step.detail}</small>
                  </button>
                );
              })}
            </div>

            <div className="motiva-claim-breakdown" aria-label="Claim review status">
              <div className="motiva-claim-breakdown-title">
                <span>Claim review status</span>
                <span>{currentClaims.length} total</span>
              </div>
              {[
                { label: 'Approved', count: approvedClaims.length, tone: 'sage' },
                { label: 'Needs review', count: pendingClaims.length, tone: 'forest' },
                { label: 'Flagged or blocked', count: flaggedClaims.length + blockedClaims.length, tone: 'rust' },
              ].map((status) => (
                <div className="motiva-status-row" key={status.label}>
                  <span>{status.label}</span>
                  <div
                    className="motiva-status-track"
                    role="progressbar"
                    aria-label={`${status.label} claims`}
                    aria-valuemin={0}
                    aria-valuemax={currentClaims.length}
                    aria-valuenow={status.count}
                  >
                    <div
                      className="motiva-status-fill"
                      data-tone={status.tone}
                      style={{ width: `${(status.count / totalClaimCount) * 100}%` }}
                    />
                  </div>
                  <span className="motiva-status-count">{status.count}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="motiva-panel" aria-labelledby="queue-heading">
            <div className="motiva-panel-heading">
              <div>
                <h3 id="queue-heading">Editorial work queue</h3>
                <p>Focus on the claims that need a human decision next.</p>
              </div>
              <div className="motiva-queue-filters" role="group" aria-label="Filter claims">
                <button
                  type="button"
                  className="motiva-queue-filter"
                  aria-pressed={filterState === 'ATTENTION'}
                  onClick={() => setFilterState('ATTENTION')}
                >
                  To review {attentionClaims.length}
                </button>
                <button
                  type="button"
                  className="motiva-queue-filter"
                  aria-pressed={filterState === 'APPROVED'}
                  onClick={() => setFilterState('APPROVED')}
                >
                  Approved {approvedClaims.length}
                </button>
                <button
                  type="button"
                  className="motiva-queue-filter"
                  aria-pressed={filterState === 'ALL'}
                  onClick={() => setFilterState('ALL')}
                >
                  All {currentClaims.length}
                </button>
              </div>
            </div>

            {displayedClaims.length === 0 ? (
              <div className="motiva-empty-inline">
                <CheckCircle2 size={18} aria-hidden="true" />
                <span>
                  {filterState === 'ATTENTION'
                    ? 'Nothing is waiting for review. Your queue is clear.'
                    : 'No claims appear in this view yet.'}
                </span>
              </div>
            ) : (
              <div className="motiva-queue-list">
                {displayedClaims.slice(0, 5).map((claim) => {
                  const status = getClaimStatus(claim);

                  return (
                    <article className="motiva-queue-item" key={claim.claim_id}>
                      <div className="motiva-queue-item-main">
                        <div className="motiva-queue-item-meta">
                          <span className="motiva-status-badge" data-tone={status.tone}>
                            {status.label}
                          </span>
                          <span>{claim.study_design}</span>
                        </div>
                        <button
                          type="button"
                          className="motiva-queue-claim"
                          onClick={() => {
                            onSelectClaimForReview?.(claim);
                            onNavigate('desk');
                          }}
                        >
                          {claim.claim_text}
                        </button>
                      </div>
                      <button
                        type="button"
                        className="motiva-queue-action"
                        onClick={() => {
                          onSelectClaimForReview?.(claim);
                          onNavigate('desk');
                        }}
                        aria-label={`Investigate claim: ${claim.claim_text}`}
                      >
                        Investigate <ArrowRight size={12} aria-hidden="true" />
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <aside className="motiva-dashboard-rail" aria-label="Workspace actions and library">
          <section className="motiva-panel">
            <div className="motiva-panel-heading">
              <div>
                <h3>Next in your workflow</h3>
                <p>Useful actions based on this study.</p>
              </div>
            </div>
            <div className="motiva-next-steps">
              <button
                type="button"
                className="motiva-next-step"
                data-recommended={primaryAction.tab === 'review'}
                onClick={() => onNavigate('review')}
              >
                <span className="motiva-next-step-icon"><ShieldCheck size={15} aria-hidden="true" /></span>
                <span className="motiva-next-step-copy">
                  <strong>Review claims</strong>
                  <small>{pendingClaims.length} waiting for approval</small>
                </span>
                <ArrowRight size={13} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="motiva-next-step"
                data-recommended={primaryAction.tab === 'studio'}
                onClick={() => onNavigate('studio')}
              >
                <span className="motiva-next-step-icon"><Sparkles size={15} aria-hidden="true" /></span>
                <span className="motiva-next-step-copy">
                  <strong>Create content</strong>
                  <small>{approvedClaims.length} approved claims available</small>
                </span>
                <ArrowRight size={13} aria-hidden="true" />
              </button>
              <button type="button" className="motiva-next-step" onClick={() => onNavigate('schedule')}>
                <span className="motiva-next-step-icon"><Calendar size={15} aria-hidden="true" /></span>
                <span className="motiva-next-step-copy">
                  <strong>Plan publishing</strong>
                  <small>Review the 7-day calendar</small>
                </span>
                <ArrowRight size={13} aria-hidden="true" />
              </button>
              <button type="button" className="motiva-next-step" onClick={() => onNavigate('radar')}>
                <span className="motiva-next-step-icon"><Radio size={15} aria-hidden="true" /></span>
                <span className="motiva-next-step-copy">
                  <strong>Find a new angle</strong>
                  <small>Explore audience questions</small>
                </span>
                <ArrowRight size={13} aria-hidden="true" />
              </button>
            </div>
          </section>

          <section className="motiva-panel" aria-labelledby="library-heading">
            <div className="motiva-panel-heading">
              <div>
                <h3 id="library-heading">Research library</h3>
                <p>{papers.length} {papers.length === 1 ? 'study' : 'studies'} in this workspace</p>
              </div>
              <button type="button" className="motiva-inline-link" onClick={() => onNavigate('papers')}>
                Manage <ArrowRight size={13} aria-hidden="true" />
              </button>
            </div>
            <div className="motiva-library-list">
              {papers.slice(0, 4).map((paper) => (
                <button
                  type="button"
                  className="motiva-library-item"
                  data-active={paper.paper_id === activePaper?.paper_id}
                  key={paper.paper_id}
                  onClick={() => onSwitchPaper(paper.paper_id)}
                >
                  <span className="motiva-library-item-icon"><BookOpen size={14} aria-hidden="true" /></span>
                  <span className="motiva-library-item-copy">
                    <strong>{paper.title}</strong>
                    <small>{paper.year} · {paper.journal || 'Research paper'}</small>
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="motiva-panel">
            <div className="motiva-panel-heading">
              <div>
                <h3>Trust, built in</h3>
                <p>Keep every published statement grounded in evidence.</p>
              </div>
            </div>
            <button type="button" className="motiva-inline-link" onClick={() => onNavigate('report')}>
              <ShieldCheck size={14} aria-hidden="true" />
              Open evidence report <ArrowRight size={13} aria-hidden="true" />
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
};
