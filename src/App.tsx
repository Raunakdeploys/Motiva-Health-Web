import React, { useState, useEffect } from 'react';
import {
  CarouselContent,
  ClaimRecord,
  EvidencePassage,
  PaperRecord,
  ReelContent,
  ScheduledPost,
  StaticPostContent,
} from './types';
import {
  ALL_CAROUSELS,
  ALL_CLAIMS,
  ALL_PAPERS,
  ALL_PASSAGES,
  ALL_REELS,
  ALL_STATIC_POSTS,
  DEFAULT_SCHEDULED_POSTS,
  saveCarousels,
  saveClaims,
  savePapers,
  savePassages,
  saveReels,
  saveScheduledPosts,
  saveStaticPosts,
  setActivePaperId,
} from './utils/storage';
import type { AuditLogEntry } from './utils/storage';
import { runValidationEngine } from './utils/validationEngine';
import { generateClientMotivaContent } from './utils/contentGenerator';
import { useAuth } from './context/AuthContext';
import {
  authenticatedApiFetch,
  fetchUserDataFromSql,
  savePaperToSql,
  deletePaperFromSql,
  saveClaimToSql,
  deleteClaimFromSql,
  saveDeliverableToSql,
  saveScheduledPostsToSql,
  seedDemoToSql,
} from './utils/sqlApiClient';
import { NavigationSidebar, type ActiveTab } from './components/NavigationSidebar';
import { TopBar } from './components/TopBar';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { ContextInspector } from './components/ContextInspector';
import { Workspace } from './components/Workspace';
import { InvestigationDesk } from './components/InvestigationDesk';
import { ProvenanceGraph } from './components/ProvenanceGraph';
import { AuditLogView } from './components/AuditLogView';
import { PaperIntake } from './components/PaperIntake';
import { EvidenceViewer } from './components/EvidenceViewer';
import { ClaimLedger } from './components/ClaimLedger';
import { ContentStudio } from './components/ContentStudio';
import { PostScheduler } from './components/PostScheduler';
import { SubmissionPacket } from './components/SubmissionPacket';
import { EvidenceReportView } from './components/EvidenceReportView';
import { SelfTestRunner } from './components/SelfTestRunner';
import { GoogleAuthModal } from './components/GoogleAuthModal';
import { ClinicalTrialSimulator } from './components/ClinicalTrialSimulator';
import { AiMediaStudio } from './components/AiMediaStudio';
import { EvidenceRadar } from './components/EvidenceRadar';
import { IntroExperience } from './components/IntroExperience';
import { ContentBrief } from './types';
import { propagateClaimChange } from './utils/impactAnalysis';

export default function App() {
  const { user, idToken } = useAuth();

  const [currentTab, setCurrentTab] = useState<ActiveTab>('workspace');
  const [studioTab, setStudioTab] = useState<'carousel' | 'static' | 'reel' | 'caption'>('carousel');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [hasEnteredWorkspace, setHasEnteredWorkspace] = useState(false);

  // Persistence State
  const [papers, setPapers] = useState<PaperRecord[]>([]);
  const [activePaperId, setActivePaperIdState] = useState<string>('');
  const [passages, setPassages] = useState<EvidencePassage[]>([]);
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [carousels, setCarousels] = useState<CarouselContent[]>([]);
  const [staticPosts, setStaticPosts] = useState<StaticPostContent[]>([]);
  const [reels, setReels] = useState<ReelContent[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loadedUserId, setLoadedUserId] = useState('');

  // Selection & Inspector State
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [highlightEvidenceId, setHighlightEvidenceId] = useState<string | null>(null);
  const [sqlSyncStatus, setSqlSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('synced');

  const performSqlSync = React.useCallback(async (token: string) => {
    setSqlSyncStatus('syncing');
    try {
      const data = await fetchUserDataFromSql(token);
      const loadedPapers = data.papers || [];
      const loadedPassages = data.passages || [];
      const loadedClaims = data.claims || [];

      setPapers(loadedPapers);
      setPassages(loadedPassages);
      setClaims(loadedClaims);
      setCarousels(data.carousels || []);
      setStaticPosts(data.staticPosts || []);
      setReels(data.reels || []);
      setScheduledPosts(data.scheduledPosts || []);
      setAuditLogs(data.auditLogs || []);
      setActivePaperIdState((current) =>
        loadedPapers.some((paper) => paper.paper_id === current) ? current : (loadedPapers[0]?.paper_id || '')
      );
      setSelectedClaimId(loadedClaims[0]?.claim_id || null);
      setLoadedUserId(user?.uid || '');
      setSqlSyncStatus('synced');
    } catch (error) {
      console.warn('Could not load account data:', error instanceof Error ? error.message : 'Unknown error');
      setSqlSyncStatus('error');
    }
  }, [user?.uid]);

  useEffect(() => {
    setLoadedUserId('');
    setPapers([]);
    setPassages([]);
    setClaims([]);
    setCarousels([]);
    setStaticPosts([]);
    setReels([]);
    setScheduledPosts([]);
    setAuditLogs([]);
    setActivePaperIdState('');
    setSelectedClaimId(null);
  }, [user?.uid]);

  useEffect(() => {
    if (!idToken) {
      setSqlSyncStatus('offline');
      return;
    }
    void performSqlSync(idToken);
  }, [idToken, performSqlSync]);

  useEffect(() => {
    if (!idToken || !user?.uid || loadedUserId !== user.uid) return;
    saveScheduledPostsToSql(idToken, scheduledPosts).catch((error) => {
      console.error('Could not save the editorial plan:', error instanceof Error ? error.message : 'Unknown error');
      setSqlSyncStatus('error');
    });
  }, [idToken, loadedUserId, scheduledPosts, user?.uid]);

  const activePaper = papers.find((p) => p.paper_id === activePaperId) || papers[0] || null;

  // Active deliverables strictly scoped to active paper
  const activeCarousel =
    carousels.find((c) => c.paper_id === activePaper?.paper_id) || null;
  const activeStaticPost =
    staticPosts.find((s) => s.paper_id === activePaper?.paper_id) || null;
  const activeReel =
    reels.find((r) => r.paper_id === activePaper?.paper_id) || null;

  const currentPaperClaims = activePaper
    ? claims.filter((c) => c.paper_id === activePaper.paper_id)
    : [];
  const currentPaperPassages = activePaper
    ? passages.filter((p) => p.paper_id === activePaper.paper_id)
    : [];

  const approvedClaims = currentPaperClaims.filter((c) => c.review_status === 'HUMAN_APPROVED');
  const flaggedClaims = currentPaperClaims.filter((c) => c.review_status === 'FLAGGED');

  // Currently inspected claim and evidence passage
  const inspectedClaim =
    currentPaperClaims.find((c) => c.claim_id === selectedClaimId) ||
    currentPaperClaims[0] ||
    null;

  const inspectedPassage =
    currentPaperPassages.find((p) =>
      highlightEvidenceId
        ? p.evidence_id === highlightEvidenceId
        : inspectedClaim?.evidence_ids.includes(p.evidence_id)
    ) ||
    currentPaperPassages[0] ||
    null;

  // Handlers
  const handleAddPaper = async (
    newPaper: PaperRecord,
    newPassages: EvidencePassage[]
  ): Promise<string> => {
    const updatedPapers = [newPaper, ...papers.filter((paper) => paper.paper_id !== newPaper.paper_id)];
    const updatedPassages = [
      ...newPassages,
      ...passages.filter((passage) => passage.paper_id !== newPaper.paper_id),
    ];

    setPapers(updatedPapers);
    setPassages(updatedPassages);
    setActivePaperIdState(newPaper.paper_id);
    setActivePaperId(newPaper.paper_id);
    savePapers(updatedPapers);
    savePassages(updatedPassages);
    setCurrentTab('source');

    if (idToken) {
      savePaperToSql(idToken, newPaper, newPassages).catch((error) =>
        console.error('Failed to save paper to Cloud SQL:', error)
      );
    }

    const usablePassages = newPassages.filter(
      (passage) => passage.extraction_status !== 'NO_TEXT' && passage.char_count > 0
    );
    if (usablePassages.length === 0) {
      return 'Document added, but no searchable text was found. Add excerpts manually or re-upload with AI OCR enabled.';
    }

    try {
      const response = await authenticatedApiFetch('/api/generate-claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paper_id: newPaper.paper_id,
          paper_title: newPaper.title,
          passages: usablePassages.map((passage) => ({
            evidence_id: passage.evidence_id,
            pdf_page_index: passage.pdf_page_index,
            verbatim_text: passage.verbatim_text,
            section: passage.section,
            extraction_status: passage.extraction_status,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Claim drafting returned ${response.status}.`);
      }

      const claimsData = await response.json();
      if (!Array.isArray(claimsData?.claims) || claimsData.claims.length === 0) {
        return 'Document saved. No draft claims were returned; nothing was fabricated or marked approved.';
      }

      const draftedClaims: ClaimRecord[] = claimsData.claims.map((claim: ClaimRecord) => {
        const draft = {
          ...claim,
          paper_id: newPaper.paper_id,
          review_status: 'DRAFT' as const,
        };
        const validation = runValidationEngine(draft, newPassages, claims);
        return {
          ...draft,
          validation_findings: validation.findings,
          validation_checks: validation.checks,
          review_status: validation.calculatedStatus,
        };
      });
      const updatedClaims = [
        ...draftedClaims,
        ...claims.filter((claim) => claim.paper_id !== newPaper.paper_id),
      ];
      setClaims(updatedClaims);
      saveClaims(updatedClaims);
      setSelectedClaimId(draftedClaims[0]?.claim_id || null);

      if (idToken) {
        draftedClaims.forEach((claim) => {
          saveClaimToSql(idToken, claim).catch((error) =>
            console.error('Failed to persist AI-drafted claim:', error)
          );
        });
      }

      return `${draftedClaims.length} evidence-linked draft claim${draftedClaims.length === 1 ? '' : 's'} created. A clinician must review them before content generation.`;
    } catch (error) {
      console.warn('Claim drafting unavailable:', error);
      return 'Document saved. AI claim drafting is unavailable right now; no synthetic claims or content were created.';
    }
  };

  const handleVerifyPassage = (passage: EvidencePassage) => {
    const verifiedPassage: EvidencePassage = {
      ...passage,
      extraction_status: 'OCR_VERIFIED',
      reviewed_at: new Date().toISOString(),
      reviewed_by: user?.displayName || 'Local reviewer',
    };
    const updatedPassages = passages.map((item) =>
      item.evidence_id === passage.evidence_id ? verifiedPassage : item
    );
    setPassages(updatedPassages);
    savePassages(updatedPassages);

    if (idToken) {
      const paper = papers.find((item) => item.paper_id === passage.paper_id);
      if (paper) {
        savePaperToSql(
          idToken,
          paper,
          updatedPassages.filter((item) => item.paper_id === paper.paper_id)
        ).catch((err) => console.error('Failed to persist OCR review:', err));
      }
    }
  };

  const handleUpdatePaper = (updatedPaper: PaperRecord) => {
    const updated = papers.map((p) => (p.paper_id === updatedPaper.paper_id ? updatedPaper : p));
    setPapers(updated);
    savePapers(updated);

    if (idToken) {
      const relatedPassages = passages.filter((p) => p.paper_id === updatedPaper.paper_id);
      savePaperToSql(idToken, updatedPaper, relatedPassages).catch((err) =>
        console.error('Failed to update paper in Cloud SQL:', err)
      );
    }
  };

  const handleDeletePaper = (paperId: string) => {
    const remaining = papers.filter((p) => p.paper_id !== paperId);
    const remainingPassages = passages.filter((p) => p.paper_id !== paperId);
    const remainingClaims = claims.filter((c) => c.paper_id !== paperId);

    setPapers(remaining);
    setPassages(remainingPassages);
    setClaims(remainingClaims);

    savePapers(remaining);
    savePassages(remainingPassages);
    saveClaims(remainingClaims);

    if (idToken) {
      deletePaperFromSql(idToken, paperId).catch((err) =>
        console.error('Failed to delete paper in Cloud SQL:', err)
      );
    }

    if (activePaperId === paperId && remaining.length > 0) {
      setActivePaperIdState(remaining[0].paper_id);
      setActivePaperId(remaining[0].paper_id);
    }
  };

  const handleSwitchPaper = (paperId: string) => {
    setActivePaperIdState(paperId);
    setActivePaperId(paperId);
    const paperClms = claims.filter((c) => c.paper_id === paperId);
    if (paperClms.length > 0) {
      setSelectedClaimId(paperClms[0].claim_id);
    }
  };

  const handleUpdateClaim = (updatedClaim: ClaimRecord, wasApprovedEdited: boolean) => {
    const { findings, checks, calculatedStatus } = runValidationEngine(
      updatedClaim,
      passages.filter((p) => p.paper_id === updatedClaim.paper_id),
      claims
    );

    let resolvedStatus: ClaimRecord['review_status'] = updatedClaim.review_status;
    if (updatedClaim.review_status === 'HUMAN_APPROVED') {
      if (findings.some((f) => f.severity === 'BLOCKER') || wasApprovedEdited) {
        resolvedStatus = calculatedStatus;
      } else {
        resolvedStatus = 'HUMAN_APPROVED';
      }
    } else if (updatedClaim.review_status === 'FLAGGED' || updatedClaim.review_status === 'REJECTED') {
      resolvedStatus = updatedClaim.review_status;
    } else {
      resolvedStatus = calculatedStatus;
    }

    const revalidated: ClaimRecord = {
      ...updatedClaim,
      validation_findings: findings,
      validation_checks: checks,
      review_status: resolvedStatus,
    };

    const previousClaim = claims.find((c) => c.claim_id === updatedClaim.claim_id);

    const updatedClaims = claims.map((c) =>
      c.claim_id === updatedClaim.claim_id ? revalidated : c
    );
    setClaims(updatedClaims);
    saveClaims(updatedClaims);

    if (idToken) {
      saveClaimToSql(idToken, revalidated).catch((err) =>
        console.error('Failed to update claim in Cloud SQL:', err)
      );
    }

    // Change impact analysis: propagate invalidations to downstream deliverables
    const { updatedCarousels, updatedStaticPosts, updatedReels } = propagateClaimChange(
      revalidated,
      previousClaim,
      {
        carousels,
        staticPosts,
        reels,
      }
    );

    setCarousels(updatedCarousels);
    setStaticPosts(updatedStaticPosts);
    setReels(updatedReels);

    saveCarousels(updatedCarousels);
    saveStaticPosts(updatedStaticPosts);
    saveReels(updatedReels);

    if (idToken && activePaper) {
      const affectedC = updatedCarousels.find((c) => c.paper_id === activePaper.paper_id);
      if (affectedC) {
        saveDeliverableToSql(idToken, activePaper.paper_id, 'CAROUSEL', affectedC.id, affectedC).catch(console.error);
      }
      const affectedS = updatedStaticPosts.find((s) => s.paper_id === activePaper.paper_id);
      if (affectedS) {
        saveDeliverableToSql(idToken, activePaper.paper_id, 'STATIC', affectedS.id, affectedS).catch(console.error);
      }
      const affectedR = updatedReels.find((r) => r.paper_id === activePaper.paper_id);
      if (affectedR) {
        saveDeliverableToSql(idToken, activePaper.paper_id, 'REEL', affectedR.id, affectedR).catch(console.error);
      }
    }
  };

  const handleAddClaim = (newClaim: ClaimRecord) => {
    const { findings, checks, calculatedStatus } = runValidationEngine(
      newClaim,
      passages.filter((p) => p.paper_id === newClaim.paper_id),
      claims
    );

    const validated: ClaimRecord = {
      ...newClaim,
      validation_findings: findings,
      validation_checks: checks,
      review_status: calculatedStatus,
    };

    const updated = [validated, ...claims];
    setClaims(updated);
    saveClaims(updated);
    setSelectedClaimId(validated.claim_id);

    if (idToken) {
      saveClaimToSql(idToken, validated).catch((err) =>
        console.error('Failed to save claim in Cloud SQL:', err)
      );
    }
  };

  const handleBatchAddClaims = (newClaims: ClaimRecord[]) => {
    const validatedBatch = newClaims.map((claim) => {
      const { findings, checks, calculatedStatus } = runValidationEngine(
        claim,
        passages.filter((p) => p.paper_id === claim.paper_id),
        claims
      );
      return {
        ...claim,
        validation_findings: findings,
        validation_checks: checks,
        review_status: calculatedStatus,
      };
    });

    const updated = [...validatedBatch, ...claims];
    setClaims(updated);
    saveClaims(updated);
    if (validatedBatch.length > 0) {
      setSelectedClaimId(validatedBatch[0].claim_id);
    }

    if (idToken) {
      for (const c of validatedBatch) {
        saveClaimToSql(idToken, c).catch((err) =>
          console.error('Failed to batch save claim in Cloud SQL:', err)
        );
      }
    }
  };

  const handleDeleteClaim = (claimId: string) => {
    const previousClaim = claims.find((c) => c.claim_id === claimId);
    const updated = claims.filter((c) => c.claim_id !== claimId);
    setClaims(updated);
    saveClaims(updated);
    if (selectedClaimId === claimId) {
      setSelectedClaimId(updated[0]?.claim_id || null);
    }

    if (idToken) {
      deleteClaimFromSql(idToken, claimId).catch((err) =>
        console.error('Failed to delete claim from Cloud SQL:', err)
      );
    }

    // Change impact analysis: propagate claim deletion to deliverables
    if (previousClaim) {
      const rejectedClaim: ClaimRecord = {
        ...previousClaim,
        review_status: 'REJECTED',
        updated_at: new Date().toISOString(),
      };
      const { updatedCarousels, updatedStaticPosts, updatedReels } = propagateClaimChange(
        rejectedClaim,
        previousClaim,
        {
          carousels,
          staticPosts,
          reels,
        }
      );
      setCarousels(updatedCarousels);
      setStaticPosts(updatedStaticPosts);
      setReels(updatedReels);
      saveCarousels(updatedCarousels);
      saveStaticPosts(updatedStaticPosts);
      saveReels(updatedReels);
    }
  };

  const handleBatchUpdateClaims = (updatedBatch: ClaimRecord[]) => {
    const updatedMap = new Map(updatedBatch.map((c) => [c.claim_id, c]));
    const updated = claims.map((c) => updatedMap.get(c.claim_id) || c);
    setClaims(updated);
    saveClaims(updated);

    if (idToken) {
      for (const c of updatedBatch) {
        saveClaimToSql(idToken, c).catch((err) =>
          console.error('Failed to update claim in Cloud SQL:', err)
        );
      }
    }
  };

  const handleGenerateAllContent = async (variationIndex?: number): Promise<void> => {
    if (!activePaper) return;
    
    const claimsToUse = approvedClaims;
    if (claimsToUse.length === 0) return;

    const variationSeed = typeof variationIndex === 'number' 
      ? variationIndex 
      : Math.floor(Date.now() / 1000) % 3;

    let deliverables: { carousel: CarouselContent; static_post: StaticPostContent; reel: ReelContent } | null = null;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      const response = await authenticatedApiFetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paper_id: activePaper.paper_id,
          paper_title: activePaper.title,
          approved_claims: claimsToUse,
          variation: variationSeed,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.carousel && data.static_post && data.reel) {
          deliverables = data;
        }
      }
    } catch (fetchErr) {
      console.warn('Backend API /api/generate-content notice:', fetchErr);
    }

    // Resilient fallback: If server unavailable or failed in deployment, generate verified MOTIVA content right in browser
    if (!deliverables) {
      deliverables = generateClientMotivaContent(activePaper, claimsToUse, variationSeed);
    }

    if (!deliverables) {
      console.error('Failed to generate deliverables even after fallback.');
      return;
    }

    const { carousel: newCarousel, static_post: newStatic, reel: newReel } = deliverables;

    // Directly update state & storage with functional state updates to avoid stale closures
    setCarousels((prev) => {
      const updated = [newCarousel, ...prev.filter((c) => c.paper_id !== activePaper.paper_id)];
      saveCarousels(updated);
      return updated;
    });

    setStaticPosts((prev) => {
      const updated = [newStatic, ...prev.filter((s) => s.paper_id !== activePaper.paper_id)];
      saveStaticPosts(updated);
      return updated;
    });

    setReels((prev) => {
      const updated = [newReel, ...prev.filter((r) => r.paper_id !== activePaper.paper_id)];
      saveReels(updated);
      return updated;
    });

    if (idToken) {
      saveDeliverableToSql(idToken, activePaper.paper_id, 'CAROUSEL', newCarousel.id, newCarousel).catch(console.error);
      saveDeliverableToSql(idToken, activePaper.paper_id, 'STATIC', newStatic.id, newStatic).catch(console.error);
      saveDeliverableToSql(idToken, activePaper.paper_id, 'REEL', newReel.id, newReel).catch(console.error);
    }
  };

  /**
   * Schedules a generated deliverable sequentially into the 7-day calendar
   * e.g., Item 1 -> Mon, Item 2 -> Tue, ... Item 8 -> Mon, Item 9 -> Tue, etc.
   */
  const handleScheduleDeliverable = (
    deliverable: CarouselContent | StaticPostContent | ReelContent,
    format: 'CAROUSEL' | 'STATIC' | 'REEL'
  ) => {
    const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const timeSlots = [
      '11:30 AM IST · Educational Feed',
      '7:00 PM IST · Prime-Time Reel',
      '1:00 PM IST · Clinical Deep-Dive',
      '11:30 AM IST · Biomarker Breakdown',
      '7:30 PM IST · Weekend Prime-Time',
      '11:00 AM IST · Long-Form Weekend',
      '6:00 PM IST · Doctor Field Note',
    ];

    const nextIndex = scheduledPosts.length;
    const dayName = daysOrder[nextIndex % 7];
    const timeSlot = timeSlots[nextIndex % 7];
    const itemNumber = nextIndex + 1;

    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + (nextIndex % 7) + 1);

    const title = 'title' in deliverable ? deliverable.title : ('headline' in deliverable ? deliverable.headline : 'Post');
    const hook = 'headline' in deliverable ? deliverable.headline : ('title' in deliverable ? deliverable.title : '');
    const formatLabel = format === 'REEL' ? 'Reel' : format === 'CAROUSEL' ? 'Carousel' : 'Post';

    const newPost: ScheduledPost = {
      id: `scheduled_${Date.now()}_${itemNumber}`,
      paper_id: deliverable.paper_id,
      paper_title: activePaper?.title || 'Metabolic Research',
      title: `${formatLabel} ${itemNumber}: ${title.substring(0, 36)}`,
      format,
      scheduled_for: baseDate.toISOString(),
      slot_label: `${dayName} ${timeSlot}`,
    status: 'SCHEDULED',
    caption: deliverable.caption,
      hashtags: deliverable.hashtags,
      deliverable_id: deliverable.id,
      hook: hook || title,
      language: 'EN',
    };

    const updated = [...scheduledPosts, newPost];
    setScheduledPosts(updated);
    saveScheduledPosts(updated);

    return newPost;
  };

  const handleResetDemo = async () => {
    if (!idToken) {
      const mergeById = <T,>(current: T[], incoming: T[], getId: (item: T) => string): T[] => {
        const records = new Map<string, T>(current.map((item) => [getId(item), item] as const));
        incoming.forEach((item) => records.set(getId(item), item));
        return Array.from(records.values());
      };
      const nextPapers = mergeById(papers, ALL_PAPERS, (paper) => paper.paper_id);
      const nextPassages = mergeById(passages, ALL_PASSAGES, (passage) => passage.evidence_id);
      const nextClaims = mergeById(claims, ALL_CLAIMS, (claim) => claim.claim_id);
      const nextCarousels = mergeById(carousels, ALL_CAROUSELS, (item) => item.id);
      const nextStaticPosts = mergeById(staticPosts, ALL_STATIC_POSTS, (item) => item.id);
      const nextReels = mergeById(reels, ALL_REELS, (item) => item.id);
      const nextScheduledPosts = mergeById(scheduledPosts, DEFAULT_SCHEDULED_POSTS, (item) => item.id);
      const samplePaperId = ALL_PAPERS.find((paper) => paper.is_demo)?.paper_id || '';

      setPapers(nextPapers);
      setPassages(nextPassages);
      setClaims(nextClaims);
      setCarousels(nextCarousels);
      setStaticPosts(nextStaticPosts);
      setReels(nextReels);
      setScheduledPosts(nextScheduledPosts);
      setActivePaperIdState(samplePaperId);
      setActivePaperId(samplePaperId);
      setSelectedClaimId(ALL_CLAIMS.find((claim) => claim.paper_id === samplePaperId)?.claim_id || null);
      savePapers(nextPapers);
      savePassages(nextPassages);
      saveClaims(nextClaims);
      saveCarousels(nextCarousels);
      saveStaticPosts(nextStaticPosts);
      saveReels(nextReels);
      saveScheduledPosts(nextScheduledPosts);
      setCurrentTab('workspace');
      return;
    }

    setSqlSyncStatus('syncing');
    try {
      await seedDemoToSql(idToken);
      await performSqlSync(idToken);
      setCurrentTab('workspace');
    } catch (error) {
      console.error('Could not load benchmark data:', error instanceof Error ? error.message : 'Unknown error');
      setSqlSyncStatus('error');
    }
  };

  /**
   * Seamlessly deploys generated deliverables from Evidence Radar into Content Studio and database
   */
  const handleDeployFromRadar = (deliverables: {
    carousel: CarouselContent;
    staticPost: StaticPostContent;
    reel: ReelContent;
    newClaims: ClaimRecord[];
    brief: ContentBrief;
  }) => {
    // 1. Merge new audited claims
    const updatedClaims = [
      ...deliverables.newClaims,
      ...claims.filter((c) => !deliverables.newClaims.some((nc) => nc.claim_id === c.claim_id)),
    ];
    setClaims(updatedClaims);
    saveClaims(updatedClaims);
    if (deliverables.newClaims.length > 0) {
      setSelectedClaimId(deliverables.newClaims[0].claim_id);
    }

    // 2. Insert or replace carousel
    const updatedCarousels = [
      deliverables.carousel,
      ...carousels.filter((c) => c.paper_id !== deliverables.carousel.paper_id),
    ];
    setCarousels(updatedCarousels);
    saveCarousels(updatedCarousels);

    // 3. Insert or replace static post
    const updatedStatic = [
      deliverables.staticPost,
      ...staticPosts.filter((s) => s.paper_id !== deliverables.staticPost.paper_id),
    ];
    setStaticPosts(updatedStatic);
    saveStaticPosts(updatedStatic);

    // 4. Insert or replace reel
    const updatedReels = [
      deliverables.reel,
      ...reels.filter((r) => r.paper_id !== deliverables.reel.paper_id),
    ];
    setReels(updatedReels);
    saveReels(updatedReels);

    // 6. Persist to the signed-in account
    if (idToken && activePaper) {
      for (const clm of deliverables.newClaims) {
        saveClaimToSql(idToken, clm).catch(console.error);
      }
      saveDeliverableToSql(idToken, activePaper.paper_id, 'CAROUSEL', deliverables.carousel.id, deliverables.carousel).catch(console.error);
      saveDeliverableToSql(idToken, activePaper.paper_id, 'STATIC', deliverables.staticPost.id, deliverables.staticPost).catch(console.error);
      saveDeliverableToSql(idToken, activePaper.paper_id, 'REEL', deliverables.reel.id, deliverables.reel).catch(console.error);
    }

    // 7. Route user directly into Content Studio to inspect the generated assets
    setCurrentTab('studio');
  };

  const handleViewSourcePassage = (evidenceId: string) => {
    setHighlightEvidenceId(evidenceId);
    setCurrentTab('source');
    setTimeout(() => {
      const el = document.getElementById(evidenceId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleSelectClaim = (claim: ClaimRecord) => {
    setSelectedClaimId(claim.claim_id);
    setIsInspectorOpen(true);
  };

  if (!hasEnteredWorkspace) {
    return <IntroExperience onEnter={() => setHasEnteredWorkspace(true)} />;
  }

  return (
    <div className="motiva-app-shell flex">
      <NavigationSidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        activePaper={activePaper}
        papers={papers}
        onSwitchPaper={handleSwitchPaper}
        approvedClaimsCount={approvedClaims.length}
        totalClaimsCount={currentPaperClaims.length}
        flaggedClaimsCount={flaggedClaims.length}
        sqlSyncStatus={sqlSyncStatus}
        onOpenDemo={handleResetDemo}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />
      {isMobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/25 md:hidden"
        />
      )}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col md:ml-[232px]">
        <TopBar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          activePaper={activePaper}
          isMobileSidebarOpen={isMobileSidebarOpen}
          onToggleSidebarMobile={() => setIsMobileSidebarOpen((open) => !open)}
          isInspectorOpen={isInspectorOpen}
          onToggleInspector={() => setIsInspectorOpen(!isInspectorOpen)}
          sqlSyncStatus={sqlSyncStatus}
          quickActionLabel={
            currentTab === 'radar'
              ? 'Content Studio →'
              : currentTab === 'papers'
              ? 'Human Review Gate →'
              : currentTab === 'review' || currentTab === 'desk' || currentTab === 'provenance'
              ? 'Content Studio →'
              : currentTab === 'studio'
              ? '7-Day Calendar →'
              : currentTab === 'schedule'
              ? 'Pitch Packet →'
              : currentTab === 'submission'
              ? 'Content Studio'
              : undefined
          }
          onQuickAction={
            currentTab === 'radar'
              ? () => setCurrentTab('studio')
              : currentTab === 'papers'
              ? () => setCurrentTab('review')
              : currentTab === 'review' || currentTab === 'desk' || currentTab === 'provenance'
              ? () => setCurrentTab('studio')
              : currentTab === 'studio'
              ? () => setCurrentTab('schedule')
              : currentTab === 'schedule'
              ? () => setCurrentTab('submission')
              : currentTab === 'submission'
              ? () => setCurrentTab('studio')
              : undefined
          }
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onOpenSimulator={() => setIsSimulatorOpen(true)}
        />

        {/* Main content canvas with contextual inspector */}
        <div className="flex-1 flex overflow-hidden">
          {/* CENTER: The Dominant Working Canvas */}
          <main className="motiva-route-canvas flex-1 min-w-0 overflow-y-auto pb-16" data-active-page={currentTab}>
            {/* Async Sync Status Banner with Retry & Loading States */}
            {sqlSyncStatus === 'error' && (
              <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-xs text-red-800">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Neon is unavailable. Changes may not have been saved; retry after storage reconnects.</span>
                </div>
                {idToken && (
                  <button
                    onClick={() => performSqlSync(idToken)}
                    className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-900 rounded-md font-semibold flex items-center gap-1 transition-colors cursor-pointer text-[11px]"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Retry Sync</span>
                  </button>
                )}
              </div>
            )}

            {sqlSyncStatus === 'syncing' && (
              <div className="mx-6 mt-4 p-2.5 bg-amber-50/80 border border-amber-200 rounded-lg flex items-center gap-2 text-xs text-amber-800 animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                <span>Synchronizing your account-scoped research records with Neon...</span>
              </div>
            )}

            {activePaper?.is_demo && (
              <div className="mx-4 mt-4 flex items-start gap-3 rounded-xs border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950 sm:mx-6" role="note">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <p className="leading-relaxed">
                  <strong>Synthetic benchmark data.</strong> This sample paper, passages, claims, approvals, and publishing plan are illustrative only—not verified clinical evidence or real clinician sign-off. Do not use them for health decisions or publication.
                </p>
              </div>
            )}

            {currentTab === 'workspace' && (
              <Workspace
                papers={papers}
                activePaper={activePaper}
                passages={passages}
                claims={claims}
                carousel={activeCarousel}
                staticPost={activeStaticPost}
                reel={activeReel}
                onNavigate={setCurrentTab}
                onOpenDemo={handleResetDemo}
                onSwitchPaper={handleSwitchPaper}
                onSelectClaimForReview={handleSelectClaim}
              />
            )}

            {currentTab === 'radar' && (
              <EvidenceRadar
                papers={papers}
                activePaper={activePaper}
                passages={passages}
                claims={claims}
                onSwitchPaper={handleSwitchPaper}
                onDeployToStudio={handleDeployFromRadar}
                onNavigateToStudio={() => setCurrentTab('studio')}
                onNavigateToReview={() => setCurrentTab('review')}
                onNavigateToDesk={(claimId) => {
                  if (claimId) setSelectedClaimId(claimId);
                  setCurrentTab('desk');
                }}
              />
            )}

            {currentTab === 'desk' && (
              <InvestigationDesk
                activePaper={activePaper}
                passages={passages}
                claims={claims}
                carousel={activeCarousel}
                staticPost={activeStaticPost}
                reel={activeReel}
                onUpdateClaim={handleUpdateClaim}
                onAddClaim={handleAddClaim}
                onNavigateToStudio={() => setCurrentTab('studio')}
                initialSelectedClaimId={selectedClaimId}
                initialSelectedEvidenceId={highlightEvidenceId}
              />
            )}

            {currentTab === 'provenance' && (
              <ProvenanceGraph
                activePaper={activePaper}
                passages={passages}
                claims={claims}
                carousel={activeCarousel}
                staticPost={activeStaticPost}
                reel={activeReel}
                onNavigateToDesk={(claimId, evidenceId) => {
                  if (claimId) setSelectedClaimId(claimId);
                  if (evidenceId) setHighlightEvidenceId(evidenceId);
                  setCurrentTab('desk');
                }}
                onNavigateToStudio={() => setCurrentTab('studio')}
              />
            )}

            {currentTab === 'papers' && (
              <PaperIntake
                papers={papers}
                activePaper={activePaper}
                passages={passages}
                onAddPaper={handleAddPaper}
                onUpdatePaper={handleUpdatePaper}
                onDeletePaper={handleDeletePaper}
                onSelectPaper={handleSwitchPaper}
                onNavigateToEvidence={() => setCurrentTab('desk')}
              />
            )}

            {currentTab === 'source' && (
              <EvidenceViewer
                activePaper={activePaper}
                passages={passages}
                claims={claims}
                highlightEvidenceId={highlightEvidenceId}
                onFormulateClaim={(passage) => {
                  setHighlightEvidenceId(passage.evidence_id);
                  setCurrentTab('desk');
                }}
  onNavigateToReview={() => setCurrentTab('review')}
  onVerifyPassage={handleVerifyPassage}
  />
            )}

            {currentTab === 'review' && (
              <ClaimLedger
                activePaper={activePaper}
                passages={passages}
                claims={claims}
                selectedClaimId={selectedClaimId}
                onSelectClaim={handleSelectClaim}
                onUpdateClaim={handleUpdateClaim}
                onAddClaim={handleAddClaim}
                onDeleteClaim={handleDeleteClaim}
                onBatchAddClaims={handleBatchAddClaims}
                onBatchUpdateClaims={handleBatchUpdateClaims}
                onViewSourcePassage={handleViewSourcePassage}
                onNavigateToStudio={() => setCurrentTab('studio')}
                onResumeContentGeneration={handleGenerateAllContent}
              />
            )}

            {currentTab === 'studio' && (
              <ContentStudio
                activePaper={activePaper}
                approvedClaims={approvedClaims}
                allClaims={currentPaperClaims}
                carousel={activeCarousel}
                staticPost={activeStaticPost}
                reel={activeReel}
                onUpdateCarousel={(updated) => {
                  const updatedCarousels = carousels.map((c) =>
                    c.id === updated.id ? updated : c
                  );
                  setCarousels(updatedCarousels);
                  saveCarousels(updatedCarousels);

                  // Keep 7-day Instagram content calendar synchronized
                  setScheduledPosts((prev) => {
                    const next = prev.map((post) => {
                      if (post.deliverable_id === updated.id || (post.format === 'CAROUSEL' && post.paper_id === updated.paper_id)) {
                        return {
                          ...post,
                          title: updated.title,
                          caption: updated.caption,
                          hashtags: updated.hashtags,
                          hook: updated.slides[0]?.headline || updated.title,
                        };
                      }
                      return post;
                    });
                    saveScheduledPosts(next);
                    return next;
                  });

                  if (idToken && activePaper) {
                    saveDeliverableToSql(
                      idToken,
                      activePaper.paper_id,
                      'CAROUSEL',
                      updated.id,
                      updated
                    ).catch((err) => console.error(err));
                  }
                }}
                onUpdateStaticPost={(updated) => {
                  const updatedPosts = staticPosts.map((s) =>
                    s.id === updated.id ? updated : s
                  );
                  setStaticPosts(updatedPosts);
                  saveStaticPosts(updatedPosts);

                  // Keep 7-day Instagram content calendar synchronized
                  setScheduledPosts((prev) => {
                    const next = prev.map((post) => {
                      if (post.deliverable_id === updated.id || (post.format === 'STATIC' && post.paper_id === updated.paper_id)) {
                        return {
                          ...post,
                          title: updated.headline,
                          caption: updated.caption,
                          hashtags: updated.hashtags,
                          hook: updated.headline,
                        };
                      }
                      return post;
                    });
                    saveScheduledPosts(next);
                    return next;
                  });

                  if (idToken && activePaper) {
                    saveDeliverableToSql(
                      idToken,
                      activePaper.paper_id,
                      'STATIC',
                      updated.id,
                      updated
                    ).catch((err) => console.error(err));
                  }
                }}
                onUpdateReel={(updated) => {
                  const updatedReels = reels.map((r) => (r.id === updated.id ? updated : r));
                  setReels(updatedReels);
                  saveReels(updatedReels);

                  // Keep 7-day Instagram content calendar synchronized
                  setScheduledPosts((prev) => {
                    const next = prev.map((post) => {
                      if (post.deliverable_id === updated.id || (post.format === 'REEL' && post.paper_id === updated.paper_id)) {
                        return {
                          ...post,
                          title: updated.title,
                          caption: updated.caption,
                          hashtags: updated.hashtags,
                          hook: updated.scenes[0]?.voiceover_script || updated.title,
                        };
                      }
                      return post;
                    });
                    saveScheduledPosts(next);
                    return next;
                  });

                  if (idToken && activePaper) {
                    saveDeliverableToSql(
                      idToken,
                      activePaper.paper_id,
                      'REEL',
                      updated.id,
                      updated
                    ).catch((err) => console.error(err));
                  }
                }}
                onGenerateAllContent={handleGenerateAllContent}
                onNavigateToReview={() => setCurrentTab('review')}
                onNavigateToDesk={(claimId) => {
                  if (claimId) setSelectedClaimId(claimId);
                  setCurrentTab('desk');
                }}
                activeFormatTab={studioTab}
                onFormatTabChange={setStudioTab}
                papers={papers}
                onSelectPaper={handleSwitchPaper}
                onScheduleDeliverable={handleScheduleDeliverable}
                onNavigateToSchedule={() => setCurrentTab('schedule')}
                onNavigateToMediaLab={() => setCurrentTab('media')}
              />
            )}

            {currentTab === 'schedule' && (
            <PostScheduler
              scheduledPosts={scheduledPosts}
              onNavigateToStudio={(tab, targetPaperId) => {
                  if (tab) setStudioTab(tab);
                  if (targetPaperId) {
                    setActivePaperIdState(targetPaperId);
                    setActivePaperId(targetPaperId);
                  }
                  setCurrentTab('studio');
                }}
              />
            )}

            {currentTab === 'submission' && (
              <SubmissionPacket
                papers={papers}
                carousels={carousels}
                staticPosts={staticPosts}
                reels={reels}
                onNavigateToStudio={(tab, targetPaperId) => {
                  if (tab) setStudioTab(tab);
                  if (targetPaperId) {
                    setActivePaperIdState(targetPaperId);
                    setActivePaperId(targetPaperId);
                  }
                  setCurrentTab('studio');
                }}
                onNavigateToDesk={(claimId) => {
                  if (claimId) setSelectedClaimId(claimId);
                  setCurrentTab('desk');
                }}
                onNavigateToSchedule={() => setCurrentTab('schedule')}
              />
            )}

            {currentTab === 'report' && (
              <EvidenceReportView
                activePaper={activePaper}
                passages={passages}
                claims={claims}
                carousel={activeCarousel}
                staticPost={activeStaticPost}
                reel={activeReel}
              />
            )}

            {currentTab === 'selftest' && <SelfTestRunner />}
            {currentTab === 'audit' && <AuditLogView logs={auditLogs} onRefresh={() => idToken && void performSqlSync(idToken)} />}
            {currentTab === 'media' && (
              <AiMediaStudio
                activePaper={activePaper}
                onAddClaim={handleAddClaim}
                onNavigateToStudio={() => setCurrentTab('studio')}
                onNavigateToDesk={() => setCurrentTab('desk')}
              />
            )}
          </main>

          {/* 04. RIGHT: Contextual Inspector (310px where viewport allows) */}
          {['workspace', 'source', 'review'].includes(currentTab) && isInspectorOpen && (
            <div className="hidden xl:block">
              <ContextInspector
                selectedClaim={inspectedClaim}
                evidencePassage={inspectedPassage}
                activePaper={activePaper}
                isOpen={isInspectorOpen}
                onClose={() => setIsInspectorOpen(false)}
                onApproveClaim={(c) => {
                  handleUpdateClaim(
                    {
                      ...c,
                      review_status: 'HUMAN_APPROVED',
                      approved_version: {
                        claim_text: c.claim_text,
                        approved_at: new Date().toISOString(),
                        approved_by: 'Inspector Reviewer',
                      },
                    },
                    false
                  );
                }}
                onFlagClaim={(c, note) => {
                  handleUpdateClaim({ ...c, review_status: 'FLAGGED', reviewer_note: note }, c.review_status === 'HUMAN_APPROVED');
                }}
                onRejectClaim={(c) => {
                  handleUpdateClaim({ ...c, review_status: 'REJECTED' }, c.review_status === 'HUMAN_APPROVED');
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Global Google Authentication Modal */}
      <GoogleAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        sqlSyncStatus={sqlSyncStatus}
      />

      {/* Illustrative scenario sandbox */}
      <ClinicalTrialSimulator
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
      />
    </div>
  );
}
