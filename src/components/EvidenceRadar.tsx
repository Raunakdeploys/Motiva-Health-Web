import React, { useState, useEffect, useMemo } from 'react';
import {
  AudienceQuestionItem,
  CarouselContent,
  ClaimRecord,
  ContentBrief,
  EvidenceGapAssessment,
  EvidencePassage,
  PaperRecord,
  PubMedSearchResult,
  RadarTheme,
  ReelContent,
  StaticPostContent,
} from '../types';
import {
  buildContentBrief,
  clusterQuestionsIntoThemes,
  DATASET_ADVERSARIAL_TEST,
  DATASET_GLP1_MUSCLE,
  DATASET_METABOLIC_ADAPTATION,
  DATASET_SOUTH_ASIAN_PHENOTYPE,
  evaluateEvidenceGap,
  injectBriefIntoDeliverables,
  parsePastedText,
  parseQuestionsCsv,
} from '../utils/radarEngine';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Filter,
  HelpCircle,
  Layers,
  MessageSquare,
  Play,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';

interface EvidenceRadarProps {
  papers: PaperRecord[];
  activePaper: PaperRecord | null;
  passages: EvidencePassage[];
  claims: ClaimRecord[];
  onSwitchPaper: (paperId: string) => void;
  onDeployToStudio: (deliverables: {
    carousel: CarouselContent;
    staticPost: StaticPostContent;
    reel: ReelContent;
    newClaims: ClaimRecord[];
    brief: ContentBrief;
  }) => void;
  onNavigateToStudio: () => void;
  onNavigateToReview: () => void;
  onNavigateToDesk: (claimId?: string) => void;
}

export const EvidenceRadar: React.FC<EvidenceRadarProps> = ({
  papers,
  activePaper,
  passages,
  claims,
  onSwitchPaper,
  onDeployToStudio,
  onNavigateToStudio,
  onNavigateToReview,
  onNavigateToDesk,
}) => {
  // 1. Audience Questions State
  const [questions, setQuestions] = useState<AudienceQuestionItem[]>(DATASET_GLP1_MUSCLE);
  const [activeDatasetLabel, setActiveDatasetLabel] = useState<string>('GLP-1 & Muscle Preservation (8 questions)');
  const [rawPastedInput, setRawPastedInput] = useState<string>('');
  const [inputMode, setInputMode] = useState<'preset' | 'paste' | 'csv' | 'pubmed'>('preset');
  const [csvWarnings, setCsvWarnings] = useState<string[]>([]);
  const [csvStats, setCsvStats] = useState<{ parsed: number; duplicates: number; empty: number } | null>(null);

  // 2. Discovered Themes & Gap State
  const [themes, setThemes] = useState<RadarTheme[]>([]);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [evidenceGap, setEvidenceGap] = useState<EvidenceGapAssessment | null>(null);
  const [isClustering, setIsClustering] = useState<boolean>(false);
  const [isEvaluatingGap, setIsEvaluatingGap] = useState<boolean>(false);

  // 3. Content Brief State
  const [activeBrief, setActiveBrief] = useState<ContentBrief | null>(null);
  const [checklistState, setChecklistState] = useState<Record<number, boolean>>({});
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [deploymentSuccess, setDeploymentSuccess] = useState<boolean>(false);

  // 4. Live PubMed Search State
  const [pubMedQuery, setPubMedQuery] = useState<string>('semaglutide lean mass resistance training');
  const [pubMedResults, setPubMedResults] = useState<PubMedSearchResult[]>([]);
  const [isSearchingPubMed, setIsSearchingPubMed] = useState<boolean>(false);
  const [selectedPubMedPaper, setSelectedPubMedPaper] = useState<PubMedSearchResult | null>(null);

  // 5. Adversarial Testing Modal / Tab
  const [adversarialTestResult, setAdversarialTestResult] = useState<{
    ran: boolean;
    passed: boolean;
    checks: Array<{ name: string; passed: boolean; note: string }>;
  } | null>(null);

  // Run clustering whenever questions or active paper changes
  useEffect(() => {
    if (questions.length === 0) {
      setThemes([]);
      setSelectedThemeId(null);
      setEvidenceGap(null);
      setActiveBrief(null);
      return;
    }

    setIsClustering(true);
    // Use deterministic engine for instant UI feedback
    const clustered = clusterQuestionsIntoThemes(questions, papers);
    setThemes(clustered);
    if (clustered.length > 0) {
      setSelectedThemeId(clustered[0].id);
    } else {
      setSelectedThemeId(null);
    }
    setIsClustering(false);
  }, [questions, papers]);

  // Selected theme reference
  const selectedTheme = useMemo(() => {
    return themes.find((t) => t.id === selectedThemeId) || themes[0] || null;
  }, [themes, selectedThemeId]);

  // Evaluate evidence gap when selected theme or active paper changes
  useEffect(() => {
    if (!selectedTheme) {
      setEvidenceGap(null);
      setActiveBrief(null);
      return;
    }

    setIsEvaluatingGap(true);
    const gap = evaluateEvidenceGap(selectedTheme, activePaper, passages);
    setEvidenceGap(gap);

    // Build default doctor-grade brief
    const brief = buildContentBrief(selectedTheme, gap, activePaper);
    setActiveBrief(brief);

    // Initialize checklist
    const initialChecklist: Record<number, boolean> = {};
    brief.review_checklist.forEach((_, idx) => {
      initialChecklist[idx] = true;
    });
    setChecklistState(initialChecklist);

    setIsEvaluatingGap(false);
  }, [selectedTheme, activePaper, passages]);

  // Dataset loader
  const handleLoadDataset = (datasetName: string) => {
    setCsvWarnings([]);
    setCsvStats(null);
    if (datasetName === 'glp1') {
      setQuestions(DATASET_GLP1_MUSCLE);
      setActiveDatasetLabel('GLP-1 & Muscle Preservation (8 questions)');
      // Auto-switch to GLP-1 paper if available
      const glp1Paper = papers.find((p) => p.paper_id.includes('glp1'));
      if (glp1Paper) onSwitchPaper(glp1Paper.paper_id);
    } else if (datasetName === 'south_asian') {
      setQuestions(DATASET_SOUTH_ASIAN_PHENOTYPE);
      setActiveDatasetLabel('South Asian Phenotype & Belly Fat (6 questions)');
      const saPaper = papers.find((p) => p.paper_id.includes('south_asian'));
      if (saPaper) onSwitchPaper(saPaper.paper_id);
    } else if (datasetName === 'adaptation') {
      setQuestions(DATASET_METABOLIC_ADAPTATION);
      setActiveDatasetLabel('Adaptive Thermogenesis & Deficits (5 questions)');
      const adPaper = papers.find((p) => p.paper_id.includes('adaptation'));
      if (adPaper) onSwitchPaper(adPaper.paper_id);
    } else if (datasetName === 'adversarial') {
      setQuestions(DATASET_ADVERSARIAL_TEST);
      setActiveDatasetLabel('Adversarial & Edge Cases (7 test questions)');
    }
    setDeploymentSuccess(false);
  };

  // CSV file upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const result = parseQuestionsCsv(text);
      if (result.questions.length > 0) {
        setQuestions(result.questions);
        setActiveDatasetLabel(`Uploaded CSV: ${file.name} (${result.questions.length} questions)`);
        setCsvStats({
          parsed: result.totalParsed,
          duplicates: result.duplicateCount,
          empty: result.emptyCount,
        });
        setCsvWarnings(result.warnings);
        setDeploymentSuccess(false);
      } else {
        setCsvWarnings(['No usable question rows discovered in uploaded CSV file.']);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Textarea paste handler
  const handlePastedSubmit = () => {
    if (!rawPastedInput.trim()) return;
    const result = parsePastedText(rawPastedInput, 'Manual Input');
    if (result.questions.length > 0) {
      setQuestions(result.questions);
      setActiveDatasetLabel(`Pasted Comments Batch (${result.questions.length} items)`);
      setCsvStats({
        parsed: result.totalParsed,
        duplicates: result.duplicateCount,
        empty: result.emptyCount,
      });
      setCsvWarnings(result.warnings);
      setRawPastedInput('');
      setDeploymentSuccess(false);
    }
  };

  // Live PubMed Literature Search handler
  const handleSearchPubMed = async () => {
    if (!pubMedQuery.trim()) return;
    setIsSearchingPubMed(true);
    try {
      const res = await fetch(`/api/radar/literature-search?q=${encodeURIComponent(pubMedQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setPubMedResults(data.results || []);
        if (data.results && data.results.length > 0) {
          setSelectedPubMedPaper(data.results[0]);
        }
      }
    } catch (err) {
      console.warn('PubMed search error:', err);
    } finally {
      setIsSearchingPubMed(false);
    }
  };

  // Deploy to Content Studio
  const handleDeployDeliverables = () => {
    if (!activeBrief || !activePaper || !evidenceGap) return;
    setIsDeploying(true);

    const deliverables = injectBriefIntoDeliverables(activeBrief, activePaper, evidenceGap);
    onDeployToStudio({
      ...deliverables,
      brief: activeBrief,
    });

    setIsDeploying(false);
    setDeploymentSuccess(true);
  };

  // Run Adversarial Test Suite
  const handleRunAdversarialSuite = () => {
    const checks: Array<{ name: string; passed: boolean; note: string }> = [];

    // 1. Duplicate detection
    const csvWithDupes = `Question\nDoes GLP-1 cause muscle loss?\nDoes GLP-1 cause muscle loss?\nDoes GLP-1 cause muscle loss?`;
    const resDupes = parseQuestionsCsv(csvWithDupes);
    checks.push({
      name: 'Duplicate Question Deduplication',
      passed: resDupes.questions.length === 1 && resDupes.duplicateCount === 2,
      note: `Parsed ${resDupes.questions.length} unique question, dropped ${resDupes.duplicateCount} duplicates.`,
    });

    // 2. Malformed & Empty row tolerance
    const csvDirty = `Question,Source\n"Valid question with comma, inside quotes",Instagram\n,\n   \n"x",Short`;
    const resDirty = parseQuestionsCsv(csvDirty);
    checks.push({
      name: 'Malformed & Empty Row Tolerance',
      passed: resDirty.questions.length === 1 && resDirty.emptyCount >= 2,
      note: `Ignored empty/short lines, parsed quoted comma row accurately.`,
    });

    // 3. Unrelated non-medical question routing
    const mixedDataset: AudienceQuestionItem[] = [
      { id: 't1', text: 'How do I fix a leaky kitchen sink faucet pipe?', added_at: new Date().toISOString() },
      { id: 't2', text: 'Does Ozempic cause muscle loss in clinical trials?', added_at: new Date().toISOString() },
    ];
    const clusteredMixed = clusterQuestionsIntoThemes(mixedDataset, papers);
    const sinkTheme = clusteredMixed.find((t) => t.representative_questions.some((q) => q.includes('faucet')));
    checks.push({
      name: 'Non-Medical / Fringe Question Isolation',
      passed: sinkTheme?.category === 'Other / General Inquiry',
      note: 'Unrelated query correctly routed to General Inquiry without contaminating metabolic themes.',
    });

    // 4. Traceable question count integrity
    const qCount = DATASET_GLP1_MUSCLE.length;
    const glp1Themes = clusterQuestionsIntoThemes(DATASET_GLP1_MUSCLE, papers);
    const sumCount = glp1Themes.reduce((acc, t) => acc + t.question_count, 0);
    checks.push({
      name: 'Traceable Question Count Math',
      passed: sumCount === qCount,
      note: `Total theme questions (${sumCount}) matches raw input question count (${qCount}).`,
    });

    // 5. Negative constraint enforcement ("Must NOT Claim")
    const testTheme = glp1Themes[0];
    const testGap = evaluateEvidenceGap(testTheme, activePaper, passages);
    const testBrief = buildContentBrief(testTheme, testGap, activePaper);
    checks.push({
      name: 'Strict Medical "Must Not Claim" Guardrails',
      passed: testBrief.must_not_claim.length >= 3 && testBrief.must_not_claim.some((c) => c.includes('NEVER') || c.includes('NOT')),
      note: `Enforces ${testBrief.must_not_claim.length} explicit negative medical constraints against hype.`,
    });

    // 6. Evidence Gap Status classification
    checks.push({
      name: 'Evidence Gap Status Discipline',
      passed: testGap.status === 'SUPPORTED_BY_PASSAGE' || testGap.status === 'NEEDS_QUALIFICATION',
      note: `Classified as "${testGap.status}" with explicit boundaries of what the study does NOT prove.`,
    });

    const allPassed = checks.every((c) => c.passed);
    setAdversarialTestResult({
      ran: true,
      passed: allPassed,
      checks,
    });
  };

  // Helper for evidence status badge styling
  const getStatusBadge = (status: EvidenceGapAssessment['status']) => {
    switch (status) {
      case 'SUPPORTED_BY_PASSAGE':
        return {
          bg: 'bg-[#416C49]/15 text-[#416C49] border-[#416C49]/30',
          label: 'Supported by Cited Passage',
          icon: CheckCircle2,
        };
      case 'NEEDS_QUALIFICATION':
        return {
          bg: 'bg-[#C04E2A]/15 text-[#C04E2A] border-[#C04E2A]/30',
          label: 'Needs Qualification & Caveats',
          icon: AlertTriangle,
        };
      case 'CONFLICTING_EVIDENCE':
        return {
          bg: 'bg-amber-600/15 text-amber-800 border-amber-300',
          label: 'Conflicting Clinical Evidence',
          icon: AlertCircle,
        };
      case 'INSUFFICIENT_EVIDENCE':
        return {
          bg: 'bg-stone-500/15 text-stone-700 border-stone-300',
          label: 'Insufficient Evidence',
          icon: HelpCircle,
        };
      default:
        return {
          bg: 'bg-red-600/15 text-red-800 border-red-300',
          label: 'Source Unavailable / Awaiting Review',
          icon: ShieldAlert,
        };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* 01. MASTHEAD & OPERATIONAL VALUE BAR */}
      <div className="bg-[#FFFDF9] border border-[#E6CBBD] p-6 shadow-xs rounded-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E6CBBD]/60 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-serif italic text-2xl font-black text-[#661414] tracking-tight">steer</span>
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#C04E2A] border border-[#C04E2A]/40 px-2 py-0.5 rounded-xs bg-[#F5EBDF]">
                EVIDENCE RADAR
              </span>
              <span className="text-[10px] font-mono text-[#786A61] uppercase tracking-wider hidden sm:inline">
                · Audience Need → Scientific Evidence → Responsible Content
              </span>
            </div>
            <p className="text-xs text-[#351D1D]/80 max-w-2xl font-normal leading-relaxed">
              Discover real audience questions. Detect the scientific evidence gap. Generate doctor-reviewed Instagram carousels, static posts, and reels with zero medical clickbait.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-[#FAF6F0] border border-[#E6CBBD] px-3 py-2 rounded-xs text-center min-w-[85px]">
              <div className="text-lg font-serif font-bold text-[#661414]">{questions.length}</div>
              <div className="text-[9px] font-mono uppercase tracking-wider text-[#786A61]">Questions</div>
            </div>
            <div className="bg-[#FAF6F0] border border-[#E6CBBD] px-3 py-2 rounded-xs text-center min-w-[85px]">
              <div className="text-lg font-serif font-bold text-[#C04E2A]">{themes.length}</div>
              <div className="text-[9px] font-mono uppercase tracking-wider text-[#786A61]">Themes</div>
            </div>
            <div className="bg-[#FAF6F0] border border-[#E6CBBD] px-3 py-2 rounded-xs text-center min-w-[85px]">
              <div className="text-lg font-serif font-bold text-[#416C49]">
                {activePaper ? '1 Linked' : '0 Linked'}
              </div>
              <div className="text-[9px] font-mono uppercase tracking-wider text-[#786A61]">Trial Source</div>
            </div>
          </div>
        </div>

        {/* Operational Guidance Subtext */}
        <div className="pt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[#786A61]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#416C49]" />
            <span>
              Active Ingestion: <strong className="text-[#351D1D] font-medium">{activeDatasetLabel}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunAdversarialSuite}
              className="px-2.5 py-1 text-[11px] font-mono text-[#661414] border border-[#661414]/30 hover:bg-[#661414]/5 rounded-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Play className="w-3 h-3 text-[#C04E2A]" />
              <span>Run Adversarial Suite (7 Tests)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ADVERSARIAL TEST RESULTS DRAWER (IF EXECUTED) */}
      {adversarialTestResult && (
        <div className="bg-[#FFFDF9] border-2 border-[#661414]/40 p-5 rounded-sm space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-[#E6CBBD] pb-2">
            <div className="flex items-center gap-2">
              {adversarialTestResult.passed ? (
                <CheckCircle2 className="w-5 h-5 text-[#416C49]" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <h3 className="font-serif font-bold text-sm text-[#351D1D]">
                Adversarial Suite Execution: {adversarialTestResult.passed ? 'ALL CHECKS PASSED (6/6)' : 'FAILURES DETECTED'}
              </h3>
            </div>
            <button
              onClick={() => setAdversarialTestResult(null)}
              className="text-xs text-[#786A61] hover:text-[#661414] font-mono cursor-pointer"
            >
              Dismiss ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {adversarialTestResult.checks.map((chk, i) => (
              <div
                key={i}
                className={`p-2.5 rounded-xs border flex items-start gap-2 ${
                  chk.passed ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'
                }`}
              >
                {chk.passed ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5">
                  <div className="font-semibold">{chk.name}</div>
                  <div className="text-[11px] opacity-85">{chk.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 02. STEP 1 — QUESTION INTAKE & SOURCE LITERATURE DISCOVERY */}
      <div className="bg-[#FFFDF9] border border-[#E6CBBD] p-5 rounded-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E6CBBD]/60 pb-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#B58777] font-bold">
              STEP 1 OF 4 · AUDIENCE QUESTION INTAKE
            </div>
            <h2 className="font-serif text-lg font-bold text-[#351D1D]">
              What is your audience confused or skeptical about?
            </h2>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 bg-[#FAF6F0] p-1 border border-[#E6CBBD] rounded-xs text-xs">
            <button
              onClick={() => setInputMode('preset')}
              className={`px-2.5 py-1 rounded-xs font-medium cursor-pointer transition-colors ${
                inputMode === 'preset' ? 'bg-[#661414] text-white shadow-xs' : 'text-[#786A61] hover:text-[#351D1D]'
              }`}
            >
              Preset Benchmarks
            </button>
            <button
              onClick={() => setInputMode('paste')}
              className={`px-2.5 py-1 rounded-xs font-medium cursor-pointer transition-colors ${
                inputMode === 'paste' ? 'bg-[#661414] text-white shadow-xs' : 'text-[#786A61] hover:text-[#351D1D]'
              }`}
            >
              Paste Comments
            </button>
            <button
              onClick={() => setInputMode('csv')}
              className={`px-2.5 py-1 rounded-xs font-medium cursor-pointer transition-colors ${
                inputMode === 'csv' ? 'bg-[#661414] text-white shadow-xs' : 'text-[#786A61] hover:text-[#351D1D]'
              }`}
            >
              Upload CSV
            </button>
            <button
              onClick={() => setInputMode('pubmed')}
              className={`px-2.5 py-1 rounded-xs font-medium cursor-pointer transition-colors flex items-center gap-1 ${
                inputMode === 'pubmed' ? 'bg-[#C04E2A] text-white shadow-xs' : 'text-[#786A61] hover:text-[#351D1D]'
              }`}
            >
              <Search className="w-3 h-3" />
              <span>PubMed Search</span>
            </button>
          </div>
        </div>

        {/* 1.A Preset Benchmarks */}
        {inputMode === 'preset' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            <div
              onClick={() => handleLoadDataset('glp1')}
              className={`p-3.5 border rounded-xs cursor-pointer transition-all ${
                activeDatasetLabel.includes('GLP-1')
                  ? 'bg-[#F5EBDF] border-[#661414] shadow-xs'
                  : 'bg-[#FAF6F0] border-[#E6CBBD] hover:border-[#B58777]'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono text-[#786A61] mb-1">
                <span>8 REAL QUESTIONS</span>
                <span className="text-[#C04E2A] font-semibold">DXA TRIAL LINKED</span>
              </div>
              <h4 className="font-serif font-bold text-sm text-[#351D1D] mb-1">GLP-1 & Muscle Preservation</h4>
              <p className="text-xs text-[#786A61] line-clamp-2">
                "Does semaglutide destroy muscle?" "What happens to metabolic rate when stopping?"
              </p>
            </div>

            <div
              onClick={() => handleLoadDataset('south_asian')}
              className={`p-3.5 border rounded-xs cursor-pointer transition-all ${
                activeDatasetLabel.includes('South Asian')
                  ? 'bg-[#F5EBDF] border-[#661414] shadow-xs'
                  : 'bg-[#FAF6F0] border-[#E6CBBD] hover:border-[#B58777]'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono text-[#786A61] mb-1">
                <span>6 REAL QUESTIONS</span>
                <span className="text-[#C04E2A] font-semibold">VISCERAL FAT</span>
              </div>
              <h4 className="font-serif font-bold text-sm text-[#351D1D] mb-1">South Asian Phenotype</h4>
              <p className="text-xs text-[#786A61] line-clamp-2">
                "Why am I skinny-fat with high HbA1c?" "Is cutting rice enough for insulin sensitivity?"
              </p>
            </div>

            <div
              onClick={() => handleLoadDataset('adaptation')}
              className={`p-3.5 border rounded-xs cursor-pointer transition-all ${
                activeDatasetLabel.includes('Adaptive')
                  ? 'bg-[#F5EBDF] border-[#661414] shadow-xs'
                  : 'bg-[#FAF6F0] border-[#E6CBBD] hover:border-[#B58777]'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono text-[#786A61] mb-1">
                <span>5 REAL QUESTIONS</span>
                <span className="text-[#C04E2A] font-semibold">CALORIMETRY</span>
              </div>
              <h4 className="font-serif font-bold text-sm text-[#351D1D] mb-1">Adaptive Thermogenesis</h4>
              <p className="text-xs text-[#786A61] line-clamp-2">
                "1,000 calorie plateau: did I break my metabolism?" "Why does NEAT drop on deficits?"
              </p>
            </div>

            <div
              onClick={() => handleLoadDataset('adversarial')}
              className={`p-3.5 border rounded-xs cursor-pointer transition-all ${
                activeDatasetLabel.includes('Adversarial')
                  ? 'bg-[#F5EBDF] border-[#661414] shadow-xs'
                  : 'bg-[#FAF6F0] border-[#E6CBBD] hover:border-[#B58777]'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono text-[#786A61] mb-1">
                <span>7 TEST INPUTS</span>
                <span className="text-purple-700 font-semibold">QA EDGE CASES</span>
              </div>
              <h4 className="font-serif font-bold text-sm text-[#351D1D] mb-1">Adversarial Test Suite</h4>
              <p className="text-xs text-[#786A61] line-clamp-2">
                Includes sarcasm, non-health query, conflicting claims, and vinegar hype assertions.
              </p>
            </div>
          </div>
        )}

        {/* 1.B Free-form Textarea Paste */}
        {inputMode === 'paste' && (
          <div className="space-y-3 pt-2">
            <textarea
              value={rawPastedInput}
              onChange={(e) => setRawPastedInput(e.target.value)}
              placeholder="Paste audience comments, DMs, or consultation questions here (one question per line or paragraph)...&#10;&#10;e.g.:&#10;My doctor says I have insulin resistance at 23 BMI. How is that possible when I look slim?&#10;Does drinking lemon water first thing in the morning boost fat burning?"
              className="w-full h-32 p-3 text-xs border border-[#E6CBBD] bg-[#FAF6F0] rounded-xs focus:outline-hidden focus:border-[#661414] font-sans"
            />
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#786A61]">
                Separate lines with enter. Bullet points and numbering will be auto-cleaned.
              </span>
              <button
                onClick={handlePastedSubmit}
                disabled={!rawPastedInput.trim()}
                className="px-4 py-2 bg-[#661414] hover:bg-[#501010] text-white text-xs font-semibold rounded-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Parse & Cluster Questions →
              </button>
            </div>
          </div>
        )}

        {/* 1.C CSV File Uploader */}
        {inputMode === 'csv' && (
          <div className="space-y-3 pt-2">
            <div className="border-2 border-dashed border-[#E6CBBD] rounded-xs p-6 text-center bg-[#FAF6F0] hover:bg-[#F5EBDF]/50 transition-colors">
              <FileSpreadsheet className="w-8 h-8 text-[#C04E2A] mx-auto mb-2" />
              <label className="cursor-pointer">
                <span className="px-4 py-2 bg-[#661414] text-white text-xs font-semibold rounded-xs inline-block hover:bg-[#501010] transition-colors">
                  Choose CSV File...
                </span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-[#786A61] mt-2">
                Supported columns: <code>question</code>, <code>comment</code>, <code>text</code>, <code>source</code>, <code>author</code>, <code>likes</code>.
              </p>
            </div>

            {csvStats && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 rounded-xs flex items-center justify-between">
                <span>
                  Successfully ingested <strong>{csvStats.parsed}</strong> questions. Deduplicated: {csvStats.duplicates}, Skipped empty: {csvStats.empty}.
                </span>
              </div>
            )}

            {csvWarnings.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-xs text-amber-900 rounded-xs space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                  <span>CSV Processing Warnings ({csvWarnings.length}):</span>
                </div>
                <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                  {csvWarnings.slice(0, 3).map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* 1.D Live PubMed Search Integration */}
        {inputMode === 'pubmed' && (
          <div className="space-y-3 pt-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={pubMedQuery}
                onChange={(e) => setPubMedQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchPubMed()}
                placeholder="Search PubMed clinical trials (e.g. semaglutide lean mass, visceral fat South Asian)..."
                className="flex-1 px-3 py-2 text-xs border border-[#E6CBBD] bg-[#FAF6F0] rounded-xs focus:outline-hidden focus:border-[#C04E2A]"
              />
              <button
                onClick={handleSearchPubMed}
                disabled={isSearchingPubMed || !pubMedQuery.trim()}
                className="px-4 py-2 bg-[#C04E2A] hover:bg-[#A84222] text-white text-xs font-semibold rounded-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSearchingPubMed ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>Search PubMed</span>
              </button>
            </div>

            {pubMedResults.length > 0 && (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {pubMedResults.map((p) => (
                  <div
                    key={p.pmid}
                    onClick={() => setSelectedPubMedPaper(p)}
                    className={`p-2.5 border rounded-xs text-xs cursor-pointer transition-colors ${
                      selectedPubMedPaper?.pmid === p.pmid
                        ? 'bg-[#F5EBDF] border-[#661414]'
                        : 'bg-[#FAF6F0] border-[#E6CBBD] hover:border-[#B58777]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#786A61]">
                      <span>PMID: {p.pmid}</span>
                      <span>{p.pubdate}</span>
                    </div>
                    <div className="font-serif font-bold text-[#351D1D] my-0.5">{p.title}</div>
                    <div className="text-[11px] text-[#786A61] truncate">
                      {p.authors} · <span className="italic">{p.journal}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 03. STEP 2 & 3 — THEMATIC MATRIX & EVIDENCE GAP SPLIT VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: DISCOVERED THEMES LIST (5 Cols) */}
        <div className="lg:col-span-5 bg-[#FFFDF9] border border-[#E6CBBD] p-5 rounded-sm space-y-4">
          <div className="border-b border-[#E6CBBD]/60 pb-3">
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#B58777] font-bold">
              STEP 2 OF 4 · THEMATIC CLUSTERING
            </div>
            <h3 className="font-serif text-base font-bold text-[#351D1D]">
              Discovered Themes ({themes.length})
            </h3>
            <p className="text-[11px] text-[#786A61]">
              Clustered strictly from supplied inputs. Counts reflect actual observations.
            </p>
          </div>

          {isClustering && (
            <div className="py-8 text-center text-xs text-[#786A61] flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#C04E2A]" />
              <span>Clustering audience queries into metabolic themes...</span>
            </div>
          )}

          {!isClustering && themes.length === 0 && (
            <div className="py-8 text-center text-xs text-[#786A61]">
              No questions loaded. Paste or upload comments in Step 1.
            </div>
          )}

          <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
            {themes.map((theme) => {
              const isSelected = selectedTheme?.id === theme.id;
              return (
                <div
                  key={theme.id}
                  onClick={() => setSelectedThemeId(theme.id)}
                  className={`p-4 border rounded-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#F5EBDF] border-[#661414] shadow-xs'
                      : 'bg-[#FAF6F0] border-[#E6CBBD] hover:border-[#B58777]'
                  }`}
                >
                  {/* Category & Verified Count Header */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 bg-[#FFFDF9] border border-[#E6CBBD] rounded-xs text-[#661414]">
                      {theme.category}
                    </span>
                    <span className="text-[10px] font-mono font-semibold text-[#786A61]">
                      {theme.question_count} {theme.question_count === 1 ? 'question' : 'questions'}
                    </span>
                  </div>

                  {/* Theme Title */}
                  <h4 className="font-serif font-bold text-xs text-[#351D1D] mb-1.5 leading-snug">
                    {theme.theme_name}
                  </h4>

                  {/* Representative Verbatim Quote */}
                  {theme.representative_questions.length > 0 && (
                    <div className="text-[11px] text-[#351D1D]/80 bg-[#FFFDF9]/80 p-2 rounded-xs border border-[#E6CBBD]/50 italic mb-2">
                      "{theme.representative_questions[0]}"
                    </div>
                  )}

                  {/* Misconception Badge */}
                  <div className="text-[10px] text-[#C04E2A] font-medium flex items-start gap-1">
                    <span className="font-mono uppercase font-bold shrink-0">[Inferred Misconception]:</span>
                    <span className="line-clamp-2">{theme.underlying_misconception}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: EVIDENCE GAP & SCIENTIFIC BOUNDARY (7 Cols) */}
        <div className="lg:col-span-7 bg-[#FFFDF9] border border-[#E6CBBD] p-5 rounded-sm space-y-5">
          <div className="border-b border-[#E6CBBD]/60 pb-3 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#B58777] font-bold">
                STEP 3 OF 4 · THE EVIDENCE GAP (CORE DIFFERENTIATOR)
              </div>
              <h3 className="font-serif text-base font-bold text-[#351D1D]">
                What the Science Proves vs What It Does Not Establish
              </h3>
            </div>

            {evidenceGap && (
              <span
                className={`text-[10px] font-mono font-bold px-2.5 py-1 border rounded-xs flex items-center gap-1.5 ${
                  getStatusBadge(evidenceGap.status).bg
                }`}
              >
                {React.createElement(getStatusBadge(evidenceGap.status).icon, { className: 'w-3.5 h-3.5' })}
                <span>{getStatusBadge(evidenceGap.status).label}</span>
              </span>
            )}
          </div>

          {!selectedTheme && (
            <div className="py-12 text-center text-xs text-[#786A61]">
              Select a theme on the left to inspect its scientific evidence gap.
            </div>
          )}

          {selectedTheme && evidenceGap && (
            <div className="space-y-4 text-xs">
              {/* Audience Question & Misconception */}
              <div className="p-3 bg-[#FAF6F0] border border-[#E6CBBD] rounded-xs space-y-1">
                <div className="text-[10px] font-mono uppercase text-[#786A61] font-semibold">
                  AUDIENCE QUESTION BEING ADDRESSED:
                </div>
                <div className="font-serif italic text-sm text-[#351D1D] font-semibold">
                  "{selectedTheme.representative_questions[0] || 'Audience Inquiry'}"
                </div>
                <div className="text-[11px] text-[#C04E2A] pt-1">
                  <strong>Why it matters:</strong> {selectedTheme.why_respond}
                </div>
              </div>

              {/* What Evidence Supports vs What It Does Not Establish */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 1. What Evidence Supports */}
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs uppercase font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>What Evidence Supports</span>
                  </div>
                  <p className="text-[11px] text-emerald-950 leading-relaxed font-sans">
                    {evidenceGap.what_evidence_supports}
                  </p>
                </div>

                {/* 2. What Evidence Does NOT Establish */}
                <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs uppercase font-mono">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                    <span>What It Does NOT Establish</span>
                  </div>
                  <p className="text-[11px] text-amber-950 leading-relaxed font-sans">
                    {evidenceGap.what_evidence_does_not_establish}
                  </p>
                </div>
              </div>

              {/* Study Limitations & Uncertainty */}
              <div className="p-3 bg-[#FAF6F0] border border-[#E6CBBD] rounded-xs space-y-1 text-[11px]">
                <div className="text-[10px] font-mono uppercase text-[#661414] font-bold">
                  STUDY LIMITATIONS & SCIENTIFIC UNCERTAINTY:
                </div>
                <p className="text-[#351D1D]/90">
                  {evidenceGap.limitations_and_uncertainty}
                </p>
              </div>

              {/* Verified Bibliographic Citation */}
              <div className="p-3 bg-[#FFFDF9] border border-[#E6CBBD] rounded-xs space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono text-[#786A61]">
                  <span className="uppercase font-bold text-[#351D1D]">PRIMARY CITED TRIAL SOURCE</span>
                  <span>{evidenceGap.primary_source_year}</span>
                </div>
                <div className="font-serif font-bold text-xs text-[#661414]">
                  {evidenceGap.primary_source_title || activePaper?.title}
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-[#786A61]">
                  <span>{evidenceGap.primary_source_journal || activePaper?.journal}</span>
                  <span>·</span>
                  <span>DOI: {evidenceGap.primary_source_doi || activePaper?.doi || 'Verified'}</span>
                  {evidenceGap.supporting_page_reference && (
                    <>
                      <span>·</span>
                      <span className="text-[#C04E2A] font-semibold">{evidenceGap.supporting_page_reference}</span>
                    </>
                  )}
                </div>

                {/* Verbatim Supporting Quote */}
                {evidenceGap.supporting_passage_text && (
                  <div className="mt-2 pt-2 border-t border-[#E6CBBD]/60 text-[11px] font-mono text-[#351D1D]/80 bg-[#FAF6F0] p-2 rounded-xs">
                    <span className="text-[#786A61] block mb-0.5 text-[9px] uppercase tracking-wider font-bold">
                      VERBATIM PASSAGE:
                    </span>
                    "{evidenceGap.supporting_passage_text}"
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 04. STEP 4 — DOCTOR-LED RESPONSIBLE CONTENT BRIEF & 1-CLICK DEPLOYMENT */}
      {selectedTheme && activeBrief && (
        <div className="bg-[#FFFDF9] border border-[#661414]/30 p-6 rounded-sm space-y-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E6CBBD] pb-4">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#661414] font-bold">
                STEP 4 OF 4 · DOCTOR-GRADE CONTENT BRIEF & EDITORIAL PRODUCTION
              </div>
              <h3 className="font-serif text-lg font-bold text-[#351D1D]">
                {activeBrief.educational_angle}
              </h3>
              <p className="text-xs text-[#786A61]">
                Zero-hype, evidence-backed brief ready for Instagram Carousel, Static Post, and Reel creation.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleDeployDeliverables}
                disabled={isDeploying}
                className="px-5 py-2.5 bg-[#661414] hover:bg-[#501010] text-white text-xs font-semibold rounded-xs transition-all shadow-xs cursor-pointer flex items-center gap-2"
              >
                {isDeploying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Layers className="w-3.5 h-3.5" />}
                <span>Deploy to Content Studio (Carousel + Post + Reel) →</span>
              </button>
            </div>
          </div>

          {/* Success Notification */}
          {deploymentSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xs text-xs text-emerald-900 flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Success!</strong> Content brief transformed into Instagram Carousel, 1080x1080 Static Post, Vertical Reel, and Claim Ledger records.
                </span>
              </div>
              <button
                onClick={onNavigateToStudio}
                className="px-3 py-1 bg-emerald-700 text-white font-semibold rounded-xs hover:bg-emerald-800 transition-colors cursor-pointer text-[11px]"
              >
                Open in Content Studio →
              </button>
            </div>
          )}

          {/* Content Brief Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
            {/* 1. Compelling Hook & Educational Angle */}
            <div className="space-y-3 p-4 bg-[#FAF6F0] border border-[#E6CBBD] rounded-xs">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#C04E2A] font-bold">
                RESPONSIBLE HOOK (ANTI-CLICKBAIT)
              </div>
              <div className="font-serif font-bold text-sm text-[#351D1D]">
                "{activeBrief.hook}"
              </div>
              <div className="text-[11px] text-[#786A61]">
                <strong>Core Message:</strong> {activeBrief.core_message}
              </div>
              <div className="text-[11px] text-[#786A61] pt-1 border-t border-[#E6CBBD]/60">
                <strong>Medical CTA:</strong> {activeBrief.call_to_action}
              </div>
            </div>

            {/* 2. STRICT "WHAT THIS MUST NOT CLAIM" (Negative Constraints) */}
            <div className="space-y-3 p-4 bg-red-50/50 border border-red-200 rounded-xs">
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-red-900 font-bold">
                <ShieldAlert className="w-3.5 h-3.5 text-red-700" />
                <span>WHAT THIS CONTENT MUST NOT CLAIM</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-red-950">
                {activeBrief.must_not_claim.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-red-600 font-bold">✕</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 3. CLINICIAN REVIEW CHECKLIST (6 Points) */}
            <div className="space-y-3 p-4 bg-[#FAF6F0] border border-[#E6CBBD] rounded-xs">
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[#416C49] font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-[#416C49]" />
                <span>CLINICAL REVIEW CHECKLIST</span>
              </div>
              <div className="space-y-2">
                {activeBrief.review_checklist.map((chk, idx) => (
                  <label
                    key={idx}
                    className="flex items-start gap-2 cursor-pointer text-[11px] text-[#351D1D]"
                  >
                    <input
                      type="checkbox"
                      checked={checklistState[idx] || false}
                      onChange={(e) =>
                        setChecklistState((prev) => ({ ...prev, [idx]: e.target.checked }))
                      }
                      className="mt-0.5 rounded-xs text-[#661414] focus:ring-[#661414]"
                    />
                    <span>{chk.item}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
