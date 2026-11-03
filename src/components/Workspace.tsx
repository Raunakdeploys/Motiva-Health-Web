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

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  note: string;
  tone?: 'sage' | 'rust' | 'blue';
}

const MetricCard: React.FC<MetricCardProps> = ({ icon: Icon, label, value, note, tone = 'blue' }) => (
  <article className="steer-metric-card">
    <div className="steer-metric-top">
      <span>{label}</span>
      <span className="steer-metric-icon" data-tone={tone}>
        <Icon size={15} aria-hidden="true" />
      </span>
    </div>
    <div>
      <div className="steer-metric-value">{value}</div>
      <div className="steer-metric-note">{note}</div>
    </div>
  </article>
);

const getClaimStatus = (claim: ClaimRecord) => {
  if (claim.review_status === 'HUMAN_APPROVED') return { label: 'Approved', tone: 'sage' };
  if (claim.review_status === 'FLAGGED' || claim.review_status === 'BLOCKED') {
    return { label: claim.review_status === 'BLOCKED' ? 'Blocked' : 'Flagged', tone: 'rust' };
  }
  return { label: 'Needs review', tone: 'blue' };
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

  const primaryAction =
    flaggedClaims.length + blockedClaims.length > 0
      ? { label: `Investigate ${flaggedClaims.length + blockedClaims.length} claims`, tab: 'desk' }
      : pendingClaims.length > 0
      ? { label: `Review ${pendingClaims.length} claims`, tab: 'review' }
      : approvedClaims.length > 0
      ? { label: 'Open content studio', tab: 'studio' }
      : { label: 'Open research library', tab: 'papers' };

  const pipeline = [
    { label: 'Research', detail: `${papers.length} in library`, complete: !!activePaper },
    { label: 'Evidence', detail: `${currentPassages.length} passages`, complete: currentPassages.length > 0 },
    { label: 'Claims', detail: `${currentClaims.length} identified`, complete: currentClaims.length > 0 },
    { label: 'Review', detail: `${approvedClaims.length} approved`, complete: currentClaims.length > 0 && attentionClaims.length === 0 },
    { label: 'Publish', detail: `${deliverableCount} formats ready`, complete: deliverableCount > 0 },
  ];

  if (papers.length === 0) {
    return (
      <div className="steer-dashboard">
        <section className="steer-empty-state" aria-labelledby="workspace-empty-title">
          <div className="steer-empty-mark">
            <BookOpen size={28} aria-hidden="true" />
          </div>
          <div className="steer-dashboard-eyebrow">Steer evidence workspace</div>
          <h2 id="workspace-empty-title">Start with a source you trust.</h2>
          <p>
            Bring in a clinical paper to trace its evidence, review claims, and shape them into
            clear, responsible content.
          </p>
          <div className="steer-dashboard-actions">
            <button
              type="button"
              className="steer-dashboard-button steer-dashboard-button-primary"
              onClick={() => onNavigate('papers')}
            >
              <FileUp size={15} aria-hidden="true" />
              Upload a research paper
            </button>
            <button type="button" className="steer-dashboard-button" onClick={onOpenDemo}>
              <Sparkles size={15} aria-hidden="true" />
              Explore the sample workspace
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="steer-dashboard">
      <section className="steer-dashboard-heading" aria-labelledby="workspace-title">
        <div>
          <div className="steer-dashboard-eyebrow">
            <span className="steer-source-state" aria-hidden="true" />
            Evidence workspace
          </div>
          <h2 id="workspace-title">One clear view from paper to publish.</h2>
          <p>
            Follow the evidence, keep review moving, and turn approved research into content your
            audience can trust.
          </p>
        </div>
        <div className="steer-dashboard-actions">
          <button
            type="button"
            className="steer-dashboard-button"
            onClick={() => onNavigate('papers')}
          >
            <FileUp size={15} aria-hidden="true" />
            Add research
          </button>
          <button
            type="button"
            className="steer-dashboard-button steer-dashboard-button-primary"
            onClick={() => onNavigate(primaryAction.tab)}
          >
            {primaryAction.label}
            <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
      </section>

      {activePaper && (
        <section className="steer-active-study" aria-label="Active study">
          <div className="steer-active-study-info">
            <span className="steer-active-study-label">Currently working on</span>
            <span className="steer-active-study-title" title={activePaper.title}>
              {activePaper.title}
            </span>
            <span className="steer-active-study-meta">
              <span>{activePaper.journal || 'Journal not specified'}</span>
              <span aria-hidden="true">·</span>
              <span>{activePaper.year}</span>
              <span aria-hidden="true">·</span>
              <span>{currentPassages.length} passages</span>
              {activePaper.is_demo && <span className="steer-status-badge">Sample study</span>}
            </span>
          </div>
          <div className="steer-active-study-controls">
            {papers.length > 1 && (
              <label className="relative flex items-center">
                <span className="sr-only">Switch active study</span>
                <select
                  className="steer-source-select appearance-none"
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
              className="steer-dashboard-button"
              onClick={() => onNavigate('source')}
            >
              <FileText size={14} aria-hidden="true" />
              Open source
            </button>
          </div>
        </section>
      )}

      <section className="steer-dashboard-kpis" aria-label="Active study metrics">
        <MetricCard
          icon={BookOpen}
          label="Research sources"
          value={papers.length}
          note="Papers in your library"
          tone="blue"
        />
        <MetricCard
          icon={Layers}
          label="Extracted claims"
          value={currentClaims.length}
          note={`${currentPassages.length} supporting passages`}
          tone="blue"
        />
        <MetricCard
          icon={AlertTriangle}
          label="Needs attention"
          value={attentionClaims.length}
          note={`${flaggedClaims.length + blockedClaims.length} flagged · ${pendingClaims.length} pending`}
          tone="rust"
        />
        <MetricCard
          icon={ShieldCheck}
          label="Doctor approved"
          value={approvedClaims.length}
          note="Ready for content production"
          tone="sage"
        />
      </section>

      <div className="steer-dashboard-grid">
        <div className="steer-dashboard-column">
          <section className="steer-panel" aria-labelledby="pipeline-heading">
            <div className="steer-panel-heading">
              <div>
                <h3 id="pipeline-heading">Evidence pipeline</h3>
                <p>Every deliverable stays connected to its original research.</p>
              </div>
              <button type="button" className="steer-inline-link" onClick={() => onNavigate('provenance')}>
                View provenance <ArrowRight size={13} aria-hidden="true" />
              </button>
            </div>

            <div className="steer-pipeline-steps" role="list" aria-label="Research workflow progress">
              {pipeline.map((step) => (
                <div className="steer-pipeline-step" data-complete={step.complete} key={step.label} role="listitem">
                  <span className="steer-pipeline-dot">
                    {step.complete ? <CheckCircle2 size={13} aria-hidden="true" /> : <span aria-hidden="true">·</span>}
                  </span>
                  <strong>{step.label}</strong>
                  <small>{step.detail}</small>
                </div>
              ))}
            </div>

            <div className="steer-claim-breakdown" aria-label="Claim review status">
              <div className="steer-claim-breakdown-title">
                <span>Claim review status</span>
                <span>{currentClaims.length} total</span>
              </div>
              {[
                { label: 'Approved', count: approvedClaims.length, tone: 'sage' },
                { label: 'Needs review', count: pendingClaims.length, tone: 'blue' },
                { label: 'Flagged or blocked', count: flaggedClaims.length + blockedClaims.length, tone: 'rust' },
              ].map((status) => (
                <div className="steer-status-row" key={status.label}>
                  <span>{status.label}</span>
                  <div
                    className="steer-status-track"
                    role="progressbar"
                    aria-label={`${status.label} claims`}
                    aria-valuemin={0}
                    aria-valuemax={currentClaims.length}
                    aria-valuenow={status.count}
                  >
                    <div
                      className="steer-status-fill"
                      data-tone={status.tone}
                      style={{ width: `${(status.count / totalClaimCount) * 100}%` }}
                    />
                  </div>
                  <span className="steer-status-count">{status.count}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="steer-panel" aria-labelledby="queue-heading">
            <div className="steer-panel-heading">
              <div>
                <h3 id="queue-heading">Editorial work queue</h3>
                <p>Focus on the claims that need a human decision next.</p>
              </div>
              <div className="steer-queue-filters" role="group" aria-label="Filter claims">
                <button
                  type="button"
                  className="steer-queue-filter"
                  aria-pressed={filterState === 'ATTENTION'}
                  onClick={() => setFilterState('ATTENTION')}
                >
                  To review {attentionClaims.length}
                </button>
                <button
                  type="button"
                  className="steer-queue-filter"
                  aria-pressed={filterState === 'APPROVED'}
                  onClick={() => setFilterState('APPROVED')}
                >
                  Approved {approvedClaims.length}
                </button>
                <button
                  type="button"
                  className="steer-queue-filter"
                  aria-pressed={filterState === 'ALL'}
                  onClick={() => setFilterState('ALL')}
                >
                  All {currentClaims.length}
                </button>
              </div>
            </div>

            {displayedClaims.length === 0 ? (
              <div className="steer-empty-inline">
                <CheckCircle2 size={18} aria-hidden="true" />
                <span>
                  {filterState === 'ATTENTION'
                    ? 'Nothing is waiting for review. Your queue is clear.'
                    : 'No claims appear in this view yet.'}
                </span>
              </div>
            ) : (
              <div className="steer-queue-list">
                {displayedClaims.slice(0, 5).map((claim) => {
                  const status = getClaimStatus(claim);

                  return (
                    <article className="steer-queue-item" key={claim.claim_id}>
                      <div className="steer-queue-item-main">
                        <div className="steer-queue-item-meta">
                          <span className="steer-status-badge" data-tone={status.tone}>
                            {status.label}
                          </span>
                          <span>{claim.study_design}</span>
                        </div>
                        <button
                          type="button"
                          className="steer-queue-claim"
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
                        className="steer-queue-action"
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

        <aside className="steer-dashboard-rail" aria-label="Workspace actions and library">
          <section className="steer-panel">
            <div className="steer-panel-heading">
              <div>
                <h3>Next in your workflow</h3>
                <p>Useful actions based on this study.</p>
              </div>
            </div>
            <div className="steer-next-steps">
              <button type="button" className="steer-next-step" onClick={() => onNavigate('review')}>
                <span className="steer-next-step-icon"><ShieldCheck size={15} aria-hidden="true" /></span>
                <span className="steer-next-step-copy">
                  <strong>Review claims</strong>
                  <small>{pendingClaims.length} waiting for approval</small>
                </span>
                <ArrowRight size={13} aria-hidden="true" />
              </button>
              <button type="button" className="steer-next-step" onClick={() => onNavigate('studio')}>
                <span className="steer-next-step-icon"><Sparkles size={15} aria-hidden="true" /></span>
                <span className="steer-next-step-copy">
                  <strong>Create content</strong>
                  <small>{approvedClaims.length} approved claims available</small>
                </span>
                <ArrowRight size={13} aria-hidden="true" />
              </button>
              <button type="button" className="steer-next-step" onClick={() => onNavigate('schedule')}>
                <span className="steer-next-step-icon"><Calendar size={15} aria-hidden="true" /></span>
                <span className="steer-next-step-copy">
                  <strong>Plan publishing</strong>
                  <small>Review the 7-day calendar</small>
                </span>
                <ArrowRight size={13} aria-hidden="true" />
              </button>
              <button type="button" className="steer-next-step" onClick={() => onNavigate('radar')}>
                <span className="steer-next-step-icon"><Radio size={15} aria-hidden="true" /></span>
                <span className="steer-next-step-copy">
                  <strong>Find a new angle</strong>
                  <small>Explore audience questions</small>
                </span>
                <ArrowRight size={13} aria-hidden="true" />
              </button>
            </div>
          </section>

          <section className="steer-panel" aria-labelledby="library-heading">
            <div className="steer-panel-heading">
              <div>
                <h3 id="library-heading">Research library</h3>
                <p>{papers.length} {papers.length === 1 ? 'study' : 'studies'} in this workspace</p>
              </div>
              <button type="button" className="steer-inline-link" onClick={() => onNavigate('papers')}>
                Manage <ArrowRight size={13} aria-hidden="true" />
              </button>
            </div>
            <div className="steer-library-list">
              {papers.slice(0, 4).map((paper) => (
                <button
                  type="button"
                  className="steer-library-item"
                  data-active={paper.paper_id === activePaper?.paper_id}
                  key={paper.paper_id}
                  onClick={() => onSwitchPaper(paper.paper_id)}
                >
                  <span className="steer-library-item-icon"><BookOpen size={14} aria-hidden="true" /></span>
                  <span className="steer-library-item-copy">
                    <strong>{paper.title}</strong>
                    <small>{paper.year} · {paper.journal || 'Research paper'}</small>
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="steer-panel">
            <div className="steer-panel-heading">
              <div>
                <h3>Trust, built in</h3>
                <p>Keep every published statement grounded in evidence.</p>
              </div>
            </div>
            <button type="button" className="steer-inline-link" onClick={() => onNavigate('report')}>
              <ShieldCheck size={14} aria-hidden="true" />
              Open evidence report <ArrowRight size={13} aria-hidden="true" />
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
};
