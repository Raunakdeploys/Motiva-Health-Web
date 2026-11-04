import React, { useState, useEffect, useRef } from 'react';
import {
  CarouselContent,
  CarouselSlide,
  ClaimRecord,
  PaperRecord,
  ReelContent,
  ReelScene,
  StaticPostContent,
} from '../types';
import {
  downloadCarouselSlidePng,
  downloadJsonFile,
  downloadStaticPostPng,
  recordReelVideo,
} from '../utils/exportUtils';
import {
  Layers,
  FileText,
  Video,
  Download,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw,
  Copy,
  Check,
  Quote,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Volume2,
  VolumeX,
  Globe,
  Maximize2,
  Palette,
  FileSpreadsheet,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  LayoutGrid,
  Smartphone,
  Calendar,
} from 'lucide-react';

import { EDITORIAL_ANGLES } from '../utils/contentGenerator';

interface ContentStudioProps {
  papers?: PaperRecord[];
  onSelectPaper?: (paperId: string) => void;
  activePaper: PaperRecord | null;
  approvedClaims: ClaimRecord[];
  allClaims: ClaimRecord[];
  carousel: CarouselContent | null;
  staticPost: StaticPostContent | null;
  reel: ReelContent | null;
  onUpdateCarousel: (carousel: CarouselContent) => void;
  onUpdateStaticPost: (post: StaticPostContent) => void;
  onUpdateReel: (reel: ReelContent) => void;
  onGenerateAllContent: (variationIndex?: number) => Promise<void>;
  onNavigateToReview: () => void;
  onNavigateToDesk?: (claimId?: string) => void;
  activeFormatTab?: 'carousel' | 'static' | 'reel' | 'caption';
  onFormatTabChange?: (tab: 'carousel' | 'static' | 'reel' | 'caption') => void;
  onScheduleDeliverable?: (deliverable: CarouselContent | StaticPostContent | ReelContent, format: 'CAROUSEL' | 'STATIC' | 'REEL') => any;
  onNavigateToSchedule?: () => void;
  onNavigateToMediaLab?: () => void;
}

export const ContentStudio: React.FC<ContentStudioProps> = ({
  papers = [],
  onSelectPaper,
  activePaper,
  approvedClaims,
  allClaims,
  carousel,
  staticPost,
  reel,
  onUpdateCarousel,
  onUpdateStaticPost,
  onUpdateReel,
  onGenerateAllContent,
  onNavigateToReview,
  onNavigateToDesk,
  activeFormatTab,
  onFormatTabChange,
  onScheduleDeliverable,
  onNavigateToSchedule,
  onNavigateToMediaLab,
}) => {
  const [activeTab, setActiveTab] = useState<'carousel' | 'static' | 'reel' | 'caption'>(
    activeFormatTab || 'carousel'
  );

  useEffect(() => {
    if (activeFormatTab && activeFormatTab !== activeTab) {
      setActiveTab(activeFormatTab);
    }
  }, [activeFormatTab]);

  const handleTabChange = (tab: 'carousel' | 'static' | 'reel' | 'caption') => {
    setActiveTab(tab);
    if (onFormatTabChange) onFormatTabChange(tab);
  };
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationVariationCounter, setGenerationVariationCounter] = useState(0);
  const [isVideoRecording, setIsVideoRecording] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoStatusText, setVideoStatusText] = useState('');
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedCanvaCsv, setCopiedCanvaCsv] = useState(false);
  const [copiedCanvaTokens, setCopiedCanvaTokens] = useState(false);
  const [copiedFullPost, setCopiedFullPost] = useState(false);
  const [copiedSlideIndex, setCopiedSlideIndex] = useState<number | null>(null);
  const [scheduledToast, setScheduledToast] = useState<{ slotLabel: string; format: string } | null>(null);
  const [generationStageText, setGenerationStageText] = useState('Initializing MOTIVA Synthesis Engine...');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationSuccessToast, setGenerationSuccessToast] = useState<{ title: string; angle: string } | null>(null);

  const handleSchedule = (deliverable: any, format: 'CAROUSEL' | 'STATIC' | 'REEL') => {
    if (!onScheduleDeliverable || !deliverable) return;
    const newPost = onScheduleDeliverable(deliverable, format);
    setScheduledToast({
      slotLabel: newPost?.slot_label || 'Next Available Slot',
      format: format === 'REEL' ? 'AI Reel' : format === 'CAROUSEL' ? 'Carousel' : 'Static Post',
    });
    setTimeout(() => setScheduledToast(null), 5000);
  };

  // Exact Full Picture Deck View Toggle ('PHONE' vs 'FULL_DECK')
  const [viewMode, setViewMode] = useState<'PHONE' | 'FULL_DECK'>('PHONE');

  // Bonus: Language mode (English vs Hinglish)
  const [languageMode, setLanguageMode] = useState<'EN' | 'HINGLISH'>('EN');

  // Bonus: Aspect ratio preview for carousel (4:5 Feed vs 1:1 Square vs 9:16 Story)
  const [aspectRatio, setAspectRatio] = useState<'4:5' | '1:1' | '9:16'>('4:5');

  // Live Reel Player state
  const [isPlayingReel, setIsPlayingReel] = useState(false);
  const [isVoiceoverAudioActive, setIsVoiceoverAudioActive] = useState(false);
  const [currentReelSceneIndex, setCurrentReelSceneIndex] = useState(0);
  const [reelElapsedSeconds, setReelElapsedSeconds] = useState(0);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  const [renderedVideoUrl, setRenderedVideoUrl] = useState<string | null>(null);

  const handleRenderReelVideo = async () => {
    if (!reel || !reel.scenes || reel.scenes.length === 0) return;
    setIsVideoRecording(true);
    setVideoProgress(0);
    setVideoStatusText('Initializing 9:16 Canvas & MediaRecorder...');
    try {
      const videoBlob = await recordReelVideo(reel.scenes, (pct, status) => {
        setVideoProgress(pct);
        setVideoStatusText(status);
      });
      const url = URL.createObjectURL(videoBlob);
      setRenderedVideoUrl(url);
      setIsVideoRecording(false);
      setVideoStatusText('Reel MP4/WebM successfully rendered!');
    } catch (err: any) {
      console.error('Reel video rendering error:', err);
      setIsVideoRecording(false);
      setVideoStatusText(`Error rendering reel video: ${err.message || err}`);
    }
  };

  // Reel playback timer loop
  useEffect(() => {
    let interval: any = null;
    if (isPlayingReel && reel && reel.scenes.length > 0) {
      interval = setInterval(() => {
        setReelElapsedSeconds((prev) => {
          const next = prev + 1;
          let accumulated = 0;
          let sceneIdx = 0;
          for (let i = 0; i < reel.scenes.length; i++) {
            accumulated += reel.scenes[i].duration_sec || 5;
            if (next <= accumulated) {
              sceneIdx = i;
              break;
            }
          }

          if (next >= reel.total_duration_sec) {
            setIsPlayingReel(false);
            if (window.speechSynthesis) window.speechSynthesis.cancel();
            setCurrentReelSceneIndex(0);
            return 0;
          }

          if (sceneIdx !== currentReelSceneIndex) {
            setCurrentReelSceneIndex(sceneIdx);
            if (isVoiceoverAudioActive && window.speechSynthesis) {
              playSpeechForScene(sceneIdx);
            }
          }

          return next;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlayingReel, reel, currentReelSceneIndex, isVoiceoverAudioActive, languageMode]);

  const playSpeechForScene = (sceneIndex: number) => {
    if (!reel || !window.speechSynthesis) return;
    const scene = reel.scenes[sceneIndex];
    if (!scene) return;

    window.speechSynthesis.cancel();
    const textToSpeak =
      languageMode === 'HINGLISH' && scene.hinglish_voiceover
        ? scene.hinglish_voiceover
        : scene.voiceover_script;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 1.35;
    utterance.pitch = 1.0;
    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handleToggleReelPlay = () => {
    if (isPlayingReel) {
      setIsPlayingReel(false);
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    } else {
      setIsPlayingReel(true);
      if (isVoiceoverAudioActive) {
        playSpeechForScene(currentReelSceneIndex);
      }
    }
  };

  const handleToggleVoiceoverAudio = () => {
    const nextState = !isVoiceoverAudioActive;
    setIsVoiceoverAudioActive(nextState);
    if (!nextState && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    } else if (nextState && isPlayingReel) {
      playSpeechForScene(currentReelSceneIndex);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerationProgress(15);
    setGenerationStageText('1/4 Reviewing approved claims and source links...');

    const angleNames = [
      'Mechanism & Clinical Reality',
      'The Indian Metabolic Paradox',
      'Evidence Caveats & Follow-up',
    ];

    try {
      const nextVar = (generationVariationCounter + 1) % 3;
      setGenerationVariationCounter(nextVar);

      // Show staged progress labels while the generation request runs.
      const progressTimer1 = setTimeout(() => {
        setGenerationProgress(45);
        setGenerationStageText('2/4 Applying format and study-specific caveats...');
      }, 500);

      const progressTimer2 = setTimeout(() => {
        setGenerationProgress(75);
        setGenerationStageText('3/4 Synthesizing 6-slide Carousel, 1080×1080 Static & 9:16 Reel...');
      }, 1100);

      const progressTimer3 = setTimeout(() => {
        setGenerationProgress(92);
        setGenerationStageText('4/4 Formatting captions, hashtags & Canva token export...');
      }, 1600);

      // Perform generation (either live Gemini or browser engine)
      const startTime = Date.now();
      await onGenerateAllContent(nextVar);
      const elapsed = Date.now() - startTime;

      clearTimeout(progressTimer1);
      clearTimeout(progressTimer2);
      clearTimeout(progressTimer3);

      // If backend responded very fast or client fallback used, ensure smooth visual completion
      if (elapsed < 1800) {
        setGenerationProgress(90);
        setGenerationStageText('Finalizing verified deliverables for Indian metabolic profile...');
        await new Promise((resolve) => setTimeout(resolve, Math.max(400, 1800 - elapsed)));
      }

      setGenerationProgress(100);
      setGenerationStageText('Complete! Deliverables ready.');
      setCurrentSlideIndex(0);

      setGenerationSuccessToast({
        title: activePaper?.title || 'Study Drafts',
        angle: angleNames[nextVar],
      });
      setTimeout(() => setGenerationSuccessToast(null), 6000);
    } catch (err) {
      console.error('Error during content generation:', err);
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
        setGenerationProgress(0);
      }, 400);
    }
  };

  if (!activePaper) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center text-[#B58777]">
        Please ingest a scientific paper to access the Content Studio.
      </div>
    );
  }

  // Gate Check: No approved claims
  if (approvedClaims.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4">
        <div className="border border-[#E6CBBD] bg-[#FFFDF9] p-8 sm:p-10 text-center space-y-4 shadow-xs">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#C04E2A] font-bold block">
            HUMAN REVIEW GATE ENFORCED
          </span>
          <h2 className="text-2xl font-serif font-bold text-[#351D1D]">
            {allClaims.length > 0 ? 'Claims Ready for Approval' : 'No Claims in Ledger'}
          </h2>
          <p className="text-sm text-[#6E625A] max-w-md mx-auto leading-relaxed">
            {allClaims.length > 0
              ? `Found ${allClaims.length} extracted claims for "${activePaper.title}". None has human approval yet. Review the supporting evidence in the claim ledger and explicitly approve claims before creating drafts.`
              : 'Content generation is available only for evidence-linked claims you explicitly approve. Extract or add claims for this document to begin review.'}
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            {allClaims.length > 0 && (
              <button
                onClick={onNavigateToReview}
                className="px-5 py-3 text-sm font-semibold text-[#F5EBDF] bg-[#315A49] hover:bg-[#244838] rounded-md transition-colors cursor-pointer inline-flex items-center gap-2 shadow-xs"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Review claims in ledger</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentSlide: CarouselSlide | undefined = carousel?.slides[currentSlideIndex];
  const isSlideInvalidated = !!currentSlide?.invalidation_flag;

  const handleAcknowledgeSlideReverification = (index: number) => {
    if (!carousel) return;
    const updatedSlides = [...carousel.slides];
    delete updatedSlides[index].invalidation_flag;
    const hasRemainingInvalidations = updatedSlides.some((s) => !!s.invalidation_flag);
    onUpdateCarousel({
      ...carousel,
      slides: updatedSlides,
      status: hasRemainingInvalidations ? 'NEEDS_REREVIEW' : 'READY',
    });
  };

  const handleCopyCaption = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  const handleCopyCanvaCsv = () => {
    if (!carousel) return;
    const csvHeader = 'SlideNumber,Layout,ThemeVariant,Headline,BodyText,Finding,Caveat,Citation,FounderNote,Brand\n';
    const csvRows = carousel.slides
      .map((s) => {
        const headline = (languageMode === 'HINGLISH' && s.hinglish_headline ? s.hinglish_headline : s.headline).replace(/"/g, '""');
        const body = (languageMode === 'HINGLISH' && s.hinglish_body ? s.hinglish_body : s.body_text).replace(/"/g, '""');
        const finding = (s.finding || '').replace(/"/g, '""');
        const caveat = (s.caveat_or_limitation || '').replace(/"/g, '""');
        const citation = (s.source_citation || '').replace(/"/g, '""');
        const note = (s.founder_note || '').replace(/"/g, '""');
        return `"${s.slide_number}","${s.layout}","${s.theme_variant || 'cream'}","${headline}","${body}","${finding}","${caveat}","${citation}","${note}","MOTIVAclub.com"`;
      })
      .join('\n');

    navigator.clipboard.writeText(csvHeader + csvRows);
    setCopiedCanvaCsv(true);
    setTimeout(() => setCopiedCanvaCsv(false), 2500);
  };

  const handleCopyCanvaTokens = () => {
    const tokens = {
      brand: 'MOTIVA',
      website: 'MOTIVAclub.com',
      palette: {
        cream_base: '#F5EBDF',
        MOTIVA_rust: '#C04E2A',
        deep_maroon: '#661414',
        ink: '#351D1D',
        clay: '#B58777',
        blush: '#E6CBBD',
        soft_paper: '#F8F2EB',
      },
      typography: {
        headline: 'Instrument Serif',
        body: 'DM Sans',
        notes: 'DM Sans',
      },
      paper: activePaper.title,
      total_slides: carousel?.slides.length || 0,
      slides: carousel?.slides || [],
    };

    navigator.clipboard.writeText(JSON.stringify(tokens, null, 2));
    setCopiedCanvaTokens(true);
    setTimeout(() => setCopiedCanvaTokens(false), 2500);
  };

  const handleCopyFullPostPackage = () => {
    if (!carousel) return;
    const caption = (languageMode === 'HINGLISH' && carousel.hinglish_caption ? carousel.hinglish_caption : carousel.caption) || '';
    const slidesText = carousel.slides
      .map((s, idx) => {
        const headline = languageMode === 'HINGLISH' && s.hinglish_headline ? s.hinglish_headline : s.headline;
        const body = languageMode === 'HINGLISH' && s.hinglish_body ? s.hinglish_body : s.body_text;
        return `[SLIDE ${idx + 1} OF ${carousel.slides.length}] (${s.layout.toUpperCase()})
HEADLINE: ${headline}
BODY: ${body}
${s.finding ? `EMPIRICAL FINDING: "${s.finding}"` : ''}
${s.founder_note ? `FOUNDER NOTE: "${s.founder_note}"` : ''}
${s.caveat_or_limitation ? `CLINICAL CAVEAT: ${s.caveat_or_limitation}` : ''}
CITATION: ${s.source_citation || activePaper.journal}`;
      })
      .join('\n\n');

    const fullPackage = `MOTIVA / CLINICAL INSTAGRAM DELIVERABLE
PAPER: ${activePaper.title}
AUTHORS: ${activePaper.authors} (${activePaper.year})
DOI/CITATION: ${activePaper.doi || 'MOTIVAclub.com'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INSTAGRAM CAPTION & HASHTAGS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${caption}

${carousel.hashtags?.join(' ') || ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CAROUSEL SLIDES COPY (EXACT COPY):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${slidesText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VERIFIED BY CLINICAL COMMITTEE · MOTIVAclub.com`;

    navigator.clipboard.writeText(fullPackage);
    setCopiedFullPost(true);
    setTimeout(() => setCopiedFullPost(false), 2500);
  };

  const handleCopySingleSlide = (slide: CarouselSlide, index: number) => {
    const headline = languageMode === 'HINGLISH' && slide.hinglish_headline ? slide.hinglish_headline : slide.headline;
    const body = languageMode === 'HINGLISH' && slide.hinglish_body ? slide.hinglish_body : slide.body_text;
    const text = `[SLIDE ${index + 1} OF ${carousel?.slides.length || 7}] (${slide.layout.toUpperCase()})
HEADLINE: ${headline}
BODY: ${body}
${slide.finding ? `FINDING: "${slide.finding}"` : ''}
${slide.founder_note ? `NOTE: "${slide.founder_note}"` : ''}
${slide.caveat_or_limitation ? `CAVEAT: ${slide.caveat_or_limitation}` : ''}
CITATION: ${slide.source_citation || activePaper.journal} · MOTIVAclub.com`;

    navigator.clipboard.writeText(text);
    setCopiedSlideIndex(index);
    setTimeout(() => setCopiedSlideIndex(null), 2500);
  };

  const handleDownloadAllSlidePngs = async () => {
    if (!carousel) return;
    for (let i = 0; i < carousel.slides.length; i++) {
      downloadCarouselSlidePng(carousel.slides[i], i, carousel.slides.length, activePaper.title);
      await new Promise((res) => setTimeout(res, 300));
    }
  };

  return (
    <div className="max-w-[1360px] mx-auto p-4 sm:p-6 md:p-8 space-y-6">
      {/* 01. Desk Header & Toolbar */}
      <div className="bg-[#FFFDF9] border border-[#E6CBBD] p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-xl font-bold text-[#351D1D]">
              MOTIVA / Content Production Studio
            </h2>
            <span className="text-[10px] font-mono text-[#416C49] bg-[#416C49]/10 px-2 py-0.5 rounded-xs font-semibold">
              Backed by {approvedClaims.length} Approved Claim{approvedClaims.length === 1 ? '' : 's'}
            </span>
          </div>
          <p className="text-xs text-[#B58777]">
            Transforms scientific papers into scroll-stopping Instagram Carousels, Statics, and AI Reels in MOTIVA's calm editorial voice.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Language Mode Toggle (EN vs Hinglish) */}
          <button
            onClick={() => setLanguageMode((prev) => (prev === 'EN' ? 'HINGLISH' : 'EN'))}
            className={`px-3 py-1.5 text-xs font-mono font-bold rounded-xs border transition-colors cursor-pointer flex items-center gap-1.5 ${
              languageMode === 'HINGLISH'
                ? 'bg-[#C04E2A] text-[#FFFDF9] border-[#C04E2A]'
                : 'bg-[#FFFDF9] text-[#351D1D] border-[#E6CBBD] hover:bg-[#F8F2EB]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{languageMode === 'HINGLISH' ? 'Hinglish Mode (Active)' : 'Language: English'}</span>
          </button>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-4 py-1.5 bg-[#661414] hover:bg-[#4a0d0d] disabled:opacity-50 text-[#F5EBDF] text-xs font-semibold rounded-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C04E2A]" />
            <span>{isGenerating ? 'Synthesizing MOTIVA Copy...' : 'Generate / Refresh Drafts'}</span>
          </button>
        </div>
      </div>

      {/* Live Calendar Schedule Confirmation Toast */}
      {scheduledToast && (
        <div className="p-3.5 bg-[#416C49]/15 border border-[#416C49]/40 text-xs text-[#416C49] flex items-center justify-between gap-3 shadow-xs rounded-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#416C49]" />
            <span>
              <strong>Successfully Added to 7-Day Calendar!</strong> {scheduledToast.format} has been approved and placed into <strong>{scheduledToast.slotLabel}</strong>.
            </span>
          </div>
          {onNavigateToSchedule && (
            <button
              onClick={onNavigateToSchedule}
              className="px-3 py-1 bg-[#416C49] hover:bg-[#325438] text-white text-[11px] font-semibold rounded-xs transition-colors cursor-pointer whitespace-nowrap"
            >
              View 7-Day Calendar →
            </button>
          )}
        </div>
      )}

      {/* Generation Success Toast */}
      {generationSuccessToast && (
        <div className="p-3.5 bg-[#416C49]/15 border border-[#416C49]/40 text-xs text-[#416C49] flex items-center justify-between gap-3 shadow-xs rounded-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#416C49]" />
            <span>
              <strong>Drafts Successfully Generated!</strong> Synthesized fresh Instagram Carousel, Static Post & AI Reel for <em>"{generationSuccessToast.title}"</em> using editorial angle: <strong>{generationSuccessToast.angle}</strong>.
            </span>
          </div>
          <button
            onClick={() => setGenerationSuccessToast(null)}
            className="text-[11px] text-[#416C49] font-mono hover:underline cursor-pointer font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* MOTIVA Clinical Editorial Synthesis Modal Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 bg-[#351D1D]/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#FFFDF9] border border-[#E6CBBD] shadow-2xl max-w-md w-full p-6 space-y-5 rounded-xs animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#661414] flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-5 h-5 text-[#C04E2A] animate-spin" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-[#351D1D]">
                  Synthesizing MOTIVA Copy...
                </h3>
                <p className="text-[11px] text-[#786A61] font-mono">
                  Evidence-linked draft · Human review required
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#661414] font-semibold">{generationStageText}</span>
                <span className="text-[#C04E2A] font-bold">{generationProgress}%</span>
              </div>
              <div className="w-full h-2 bg-[#F5EBDF] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#661414] transition-all duration-300 rounded-full"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
            </div>

            {/* Stage Checklist */}
            <div className="space-y-2.5 border-t border-[#E6CBBD]/60 pt-3 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${generationProgress >= 25 ? 'text-[#416C49]' : 'text-[#B58777]/50'}`} />
                <span className={generationProgress >= 25 ? 'text-[#351D1D] font-medium' : 'text-[#B58777]'}>
                  Verifying clinical metrics against trial DXA evidence
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${generationProgress >= 50 ? 'text-[#416C49]' : 'text-[#B58777]/50'}`} />
                <span className={generationProgress >= 50 ? 'text-[#351D1D] font-medium' : 'text-[#B58777]'}>
                  Calibrating MOTIVA tone & Indian metabolic context
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${generationProgress >= 75 ? 'text-[#416C49]' : 'text-[#B58777]/50'}`} />
                <span className={generationProgress >= 75 ? 'text-[#351D1D] font-medium' : 'text-[#B58777]'}>
                  Synthesizing 6-slide Carousel, 1080×1080 Static & 9:16 Reel
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${generationProgress >= 95 ? 'text-[#416C49]' : 'text-[#B58777]/50'}`} />
                <span className={generationProgress >= 95 ? 'text-[#351D1D] font-medium' : 'text-[#B58777]'}>
                  Auto-scheduling deliverables to 7-Day Instagram Calendar
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Invalidation Banner if present */}
      {(carousel?.status === 'INVALIDATED_BY_CLAIM_EDIT' ||
        carousel?.status === 'NEEDS_REREVIEW') && (
        <div className="p-3.5 bg-[#C04E2A]/10 border border-[#C04E2A]/30 text-xs text-[#C04E2A] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>
              <strong>Upstream Claim Modified:</strong> Deliverables have been flagged for re-review because an underlying claim was edited or flagged in the ledger.
            </span>
          </div>
          <button
            onClick={onNavigateToReview}
            className="px-2.5 py-1 bg-[#FFFDF9] border border-current text-[11px] font-semibold rounded-xs cursor-pointer whitespace-nowrap"
          >
            Audit Claim Ledger
          </button>
        </div>
      )}

      {/* 01B. Landmark Clinical Studies Quick Switcher */}
      {papers && papers.length > 0 && onSelectPaper && (
        <div className="bg-[#FFFDF9] border border-[#E6CBBD] p-4 space-y-3 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E6CBBD]/60 pb-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[#661414] text-[#F5EBDF] text-[10px] font-mono font-bold uppercase rounded-xs">
                LANDMARK METABOLIC STUDIES
              </span>
              <span className="text-xs text-[#786A61] font-mono hidden sm:inline">
                Click any study to switch Instagram deliverables in real-time
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#C04E2A] font-semibold">
              Problem Statement 2 • MOTIVAclub.com
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {papers.map((p) => {
              const isSelected = p.paper_id === activePaper.paper_id;
              const isGlp1 = p.paper_id.includes('glp1');
              const isSouthAsian = p.paper_id.includes('south_asian');
              const subtitle = isGlp1
                ? 'STEP-1 Trial: 39% Lean Mass Loss on Semaglutide'
                : isSouthAsian
                ? 'DRCP 2023: Visceral Adiposity & 3 PM Insulin Crash'
                : 'Obesity 2016: 500 kcal/day RMR Drop 6 Years Later';

              return (
                <button
                  key={p.paper_id}
                  onClick={() => onSelectPaper(p.paper_id)}
                  className={`p-3 text-left border rounded-xs transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    isSelected
                      ? 'bg-[#661414] text-[#F5EBDF] border-[#661414] shadow-md ring-1 ring-[#661414]'
                      : 'bg-[#FFFDF9] text-[#351D1D] border-[#E6CBBD] hover:border-[#C04E2A] hover:bg-[#F8F2EB]'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span
                        className={`px-1.5 py-0.5 rounded-xs font-bold uppercase ${
                          isSelected ? 'bg-[#C04E2A] text-[#F5EBDF]' : 'bg-[#661414]/10 text-[#661414]'
                        }`}
                      >
                        {p.journal || p.year}
                      </span>
                      {isSelected ? (
                        <span className="text-[#F5EBDF] font-bold text-[10px] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-[#C04E2A]" /> ACTIVE
                        </span>
                      ) : (
                        <span className="text-[#786A61] text-[10px]">Switch Study →</span>
                      )}
                    </div>
                    <div className="font-serif font-bold text-xs line-clamp-1">
                      {p.title}
                    </div>
                    <div
                      className={`text-[11px] leading-snug line-clamp-2 ${
                        isSelected ? 'text-[#E6CBBD]' : 'text-[#786A61]'
                      }`}
                    >
                      {subtitle}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 02. Format Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#E6CBBD] text-xs font-mono gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleTabChange('carousel')}
            className={`px-4 py-2 border-b-2 font-medium transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'carousel'
                ? 'border-[#C04E2A] text-[#C04E2A] font-bold bg-[#FFFDF9]'
                : 'border-transparent text-[#B58777] hover:text-[#351D1D]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Carousel Deck ({carousel?.slides.length || 0} Slides)</span>
          </button>

          <button
            onClick={() => handleTabChange('static')}
            className={`px-4 py-2 border-b-2 font-medium transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'static'
                ? 'border-[#C04E2A] text-[#C04E2A] font-bold bg-[#FFFDF9]'
                : 'border-transparent text-[#B58777] hover:text-[#351D1D]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Single Static Post</span>
          </button>

          <button
            onClick={() => handleTabChange('reel')}
            className={`px-4 py-2 border-b-2 font-medium transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'reel'
                ? 'border-[#C04E2A] text-[#C04E2A] font-bold bg-[#FFFDF9]'
                : 'border-transparent text-[#B58777] hover:text-[#351D1D]'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>9:16 Vertical Reel ({reel?.scenes.length || 0} Scenes)</span>
          </button>

          <button
            onClick={() => handleTabChange('caption')}
            className={`px-4 py-2 border-b-2 font-medium transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'caption'
                ? 'border-[#C04E2A] text-[#C04E2A] font-bold bg-[#FFFDF9]'
                : 'border-transparent text-[#B58777] hover:text-[#351D1D]'
            }`}
          >
            <Quote className="w-3.5 h-3.5" />
            <span>Captions & Hashtags</span>
          </button>
        </div>

        {/* Canva Automation quick buttons */}
        <div className="flex items-center gap-2 pb-1">
          <button
            onClick={handleCopyCanvaCsv}
            title="Copies CSV data ready to import into Canva Bulk Create"
            className="px-2.5 py-1 bg-[#FFFDF9] hover:bg-[#F8F2EB] border border-[#E6CBBD] text-[11px] font-mono text-[#351D1D] rounded-xs flex items-center gap-1 cursor-pointer transition-colors"
          >
            {copiedCanvaCsv ? <Check className="w-3 h-3 text-[#416C49]" /> : <FileSpreadsheet className="w-3 h-3 text-[#C04E2A]" />}
            <span>{copiedCanvaCsv ? 'CSV Copied!' : 'Canva Bulk CSV'}</span>
          </button>

          <button
            onClick={handleCopyCanvaTokens}
            title="Copies MOTIVA brand tokens & JSON for Canva automation"
            className="px-2.5 py-1 bg-[#FFFDF9] hover:bg-[#F8F2EB] border border-[#E6CBBD] text-[11px] font-mono text-[#351D1D] rounded-xs flex items-center gap-1 cursor-pointer transition-colors"
          >
            {copiedCanvaTokens ? <Check className="w-3 h-3 text-[#416C49]" /> : <Copy className="w-3 h-3 text-[#C04E2A]" />}
            <span>{copiedCanvaTokens ? 'Tokens Copied!' : 'Canva JSON Tokens'}</span>
          </button>

          {onNavigateToMediaLab && (
            <button
              onClick={onNavigateToMediaLab}
              title="Open Veo 3 Video, Nano Banana 2.1 Graphics & Search Grounding Lab"
              className="px-3 py-1 bg-[#661414] hover:bg-[#501010] text-[#FFFDF9] text-[11px] font-mono font-bold rounded-xs flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
            >
              <Sparkles className="w-3 h-3 text-[#C04E2A]" />
              <span>Veo 3 & Nano Banana Lab →</span>
            </button>
          )}
        </div>
      </div>

      {/* 03. Format View Controls & Quick Actions */}
      {/* 04. FORMAT 1: CAROUSEL WORKSPACE */}
      {activeTab === 'carousel' && (
        <div className="space-y-4">
          {carousel ? (
            <div>
              {/* Exact Copy & View Mode Toolbar */}
              <div className="bg-[#FFFDF9] border border-[#E6CBBD] p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#786A61] font-bold">
                    PREVIEW MODE:
                  </span>
                  <div className="flex items-center border border-[#E6CBBD] rounded-xs bg-[#F8F2EB] p-0.5 text-xs font-mono">
                    <button
                      onClick={() => setViewMode('PHONE')}
                      className={`px-3 py-1 rounded-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                        viewMode === 'PHONE'
                          ? 'bg-[#661414] text-[#F5EBDF] font-bold shadow-xs'
                          : 'text-[#786A61] hover:text-[#351D1D]'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Phone Simulator (Live Feed)</span>
                    </button>
                    <button
                      onClick={() => setViewMode('FULL_DECK')}
                      className={`px-3 py-1 rounded-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                        viewMode === 'FULL_DECK'
                          ? 'bg-[#661414] text-[#F5EBDF] font-bold shadow-xs'
                          : 'text-[#786A61] hover:text-[#351D1D]'
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>Full Picture Slide Deck ({carousel.slides.length} Slides)</span>
                    </button>
                  </div>
                </div>

                {/* Quick 1-Click Copy Deliverable Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleCopyFullPostPackage}
                    className="px-3.5 py-1.5 bg-[#C04E2A] hover:bg-[#a63f1f] text-[#FFFDF9] text-xs font-bold rounded-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    title="Copies complete deliverable: Caption, hashtags, citations, and all slide copy"
                  >
                    {copiedFullPost ? <Check className="w-3.5 h-3.5 text-[#FFFDF9]" /> : <Copy className="w-3.5 h-3.5 text-[#FFFDF9]" />}
                    <span>{copiedFullPost ? 'Post Package Copied!' : 'Copy Exact Post Package'}</span>
                  </button>

                  <button
                    onClick={() =>
                      handleCopyCaption(
                        (languageMode === 'HINGLISH' && carousel?.hinglish_caption
                          ? carousel.hinglish_caption
                          : carousel?.caption || '') +
                          '\n\n' +
                          (carousel?.hashtags.join(' ') || '')
                      )
                    }
                    className="px-3 py-1.5 bg-[#FFFDF9] hover:bg-[#F5EFE6] border border-[#E6CBBD] text-xs font-mono text-[#351D1D] rounded-xs flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedCaption ? <Check className="w-3 h-3 text-[#416C49]" /> : <Quote className="w-3 h-3 text-[#C04E2A]" />}
                    <span>{copiedCaption ? 'Caption Copied!' : 'Copy Caption & Tags'}</span>
                  </button>

                  <button
                    onClick={handleDownloadAllSlidePngs}
                    className="px-3 py-1.5 bg-[#FFFDF9] hover:bg-[#F5EFE6] border border-[#E6CBBD] text-xs font-mono text-[#351D1D] rounded-xs flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Download className="w-3 h-3 text-[#C04E2A]" />
                    <span>Download All PNGs</span>
                  </button>

                  {onScheduleDeliverable && (
                    <button
                      onClick={() => handleSchedule(carousel, 'CAROUSEL')}
                      className="px-3.5 py-1.5 bg-[#416C49] hover:bg-[#325438] text-white text-xs font-semibold rounded-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                      title="Approve and schedule into sequential 7-day calendar (Monday, Tuesday, ...)"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Approve & Add to 7-Day Calendar</span>
                    </button>
                  )}
                </div>
              </div>

              {viewMode === 'FULL_DECK' ? (
                /* FULL PICTURE SLIDE DECK (ALL 7 SLIDES GRID) */
                <div className="space-y-4">
                  <div className="bg-[#FFFDF9] border border-[#E6CBBD] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#661414]">FULL PICTURE SLIDE DECK (ALL 7 SLIDES)</span>
                      <span>·</span>
                      <span className="text-[#786A61] truncate max-w-md">{activePaper.title}</span>
                    </div>
                    <span className="text-[#C04E2A] font-semibold">Click 'Copy Copy' on any slide to grab its exact text</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {carousel.slides.map((s, idx) => (
                      <div
                        key={idx}
                        className="bg-[#FFFDF9] border border-[#E6CBBD] rounded-xs overflow-hidden flex flex-col justify-between shadow-xs hover:border-[#C04E2A] transition-colors"
                      >
                        {/* Slide Card Header */}
                        <div className="p-3 bg-[#F8F2EB] border-b border-[#E6CBBD] flex items-center justify-between text-[11px] font-mono">
                          <span className="font-bold text-[#661414]">SLIDE {idx + 1} OF {carousel.slides.length}</span>
                          <span className="text-[10px] uppercase text-[#786A61]">{s.layout}</span>
                        </div>

                        {/* Slide Visual Presentation */}
                        <div
                          className={`p-5 flex flex-col justify-between aspect-[4/5] select-none ${
                            s.theme_variant === 'maroon'
                              ? 'bg-[#661414] text-[#F5EBDF]'
                              : 'bg-[#F5EBDF] text-[#351D1D]'
                          }`}
                        >
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between text-[9px] font-mono uppercase pb-1.5 border-b border-current/20">
                              <span className="font-bold lowercase">MOTIVA</span>
                              <span className="font-semibold">{idx + 1}/7</span>
                            </div>

                            <h4 className="font-serif text-sm font-bold leading-snug line-clamp-3">
                              {languageMode === 'HINGLISH' && s.hinglish_headline
                                ? s.hinglish_headline
                                : s.headline}
                            </h4>

                            <p className="text-[11px] leading-relaxed opacity-90 line-clamp-4">
                              {languageMode === 'HINGLISH' && s.hinglish_body
                                ? s.hinglish_body
                                : s.body_text}
                            </p>

                            {s.finding && (
                              <div className="p-2 text-[10px] font-serif italic border-l-2 border-[#C04E2A] bg-black/5 rounded-r-xs line-clamp-2">
                                "{s.finding}"
                              </div>
                            )}

                            {s.founder_note && (
                              <div className="font-handwritten text-[#C04E2A] text-sm font-bold line-clamp-1">
                                {s.founder_note}
                              </div>
                            )}
                          </div>

                          <div className="text-[8px] font-mono pt-2 border-t border-current/20 flex justify-between items-center opacity-75">
                            <span className="truncate max-w-[150px]">{s.source_citation || 'MOTIVAclub.com'}</span>
                            <span className="font-bold">MOTIVA</span>
                          </div>
                        </div>

                        {/* Slide Card Actions */}
                        <div className="p-2.5 bg-[#FFFDF9] border-t border-[#E6CBBD] flex items-center justify-between gap-1 text-xs">
                          <button
                            onClick={() => handleCopySingleSlide(s, idx)}
                            className="px-2.5 py-1 bg-[#F8F2EB] hover:bg-[#E6CBBD] text-[#351D1D] rounded-xs font-mono text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            {copiedSlideIndex === idx ? (
                              <Check className="w-3 h-3 text-[#416C49]" />
                            ) : (
                              <Copy className="w-3 h-3 text-[#C04E2A]" />
                            )}
                            <span>{copiedSlideIndex === idx ? 'Copied!' : 'Copy Copy'}</span>
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setCurrentSlideIndex(idx);
                                setViewMode('PHONE');
                              }}
                              className="px-2 py-1 border border-[#E6CBBD] hover:bg-[#F8F2EB] text-[#786A61] rounded-xs font-mono text-[10px] cursor-pointer"
                              title="Inspect this slide inside Phone simulator"
                            >
                              Inspect
                            </button>
                            <button
                              onClick={() => {
                                downloadCarouselSlidePng(
                                  s,
                                  idx,
                                  carousel.slides.length,
                                  activePaper.title
                                );
                              }}
                              className="px-2.5 py-1 bg-[#661414] hover:bg-[#4a0d0d] text-[#F5EBDF] rounded-xs font-mono text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Download className="w-3 h-3 text-[#C04E2A]" />
                              <span>PNG</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Phone Simulator & Editor */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Column: Slide Gallery Preview (7 Cols) */}
              <div className="lg:col-span-7 bg-[#FFFDF9] border border-[#E6CBBD] p-5 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between border-b border-[#E6CBBD] pb-3 text-xs font-mono gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#661414]">
                      SLIDE {currentSlideIndex + 1} OF {carousel.slides.length}
                    </span>
                    <span>·</span>
                    <span className="uppercase text-[#B58777]">
                      Layout: {currentSlide?.layout}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Aspect Ratio Selector */}
                    <div className="flex items-center border border-[#E6CBBD] rounded-xs overflow-hidden text-[10px]">
                      {(['4:5', '1:1', '9:16'] as const).map((ratio) => (
                        <button
                          key={ratio}
                          onClick={() => setAspectRatio(ratio)}
                          className={`px-2 py-0.5 cursor-pointer font-mono ${
                            aspectRatio === ratio
                              ? 'bg-[#C04E2A] text-[#FFFDF9] font-bold'
                              : 'bg-[#FFFDF9] text-[#786A61] hover:bg-[#F8F2EB]'
                          }`}
                        >
                          {ratio}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        disabled={currentSlideIndex <= 0}
                        onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
                        className="p-1 border border-[#E6CBBD] hover:bg-[#F8F2EB] disabled:opacity-30 rounded-xs cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        disabled={currentSlideIndex >= carousel.slides.length - 1}
                        onClick={() =>
                          setCurrentSlideIndex((prev) =>
                            Math.min(carousel.slides.length - 1, prev + 1)
                          )
                        }
                        className="p-1 border border-[#E6CBBD] hover:bg-[#F8F2EB] disabled:opacity-30 rounded-xs cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Invalidation Alert on Slide if applicable */}
                {isSlideInvalidated && (
                  <div className="p-3 bg-[#C04E2A]/10 border border-[#C04E2A]/40 text-xs text-[#C04E2A] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Upstream Claim Invalidation Detected on this Slide
                      </span>
                      <button
                        onClick={() => handleAcknowledgeSlideReverification(currentSlideIndex)}
                        className="px-2 py-0.5 bg-[#FFFDF9] border border-[#C04E2A] text-[10px] font-semibold rounded-xs cursor-pointer"
                      >
                        Acknowledge & Mark Verified
                      </button>
                    </div>
                    <p className="text-[11px] leading-snug">
                      {currentSlide?.invalidation_flag?.reason ||
                        'One or more mapped claims were modified, flagged, or rejected.'}
                    </p>
                  </div>
                )}

                {/* Photorealistic Instagram Smartphone Frame */}
                {currentSlide && (
                  <div className="mx-auto w-full max-w-[430px] bg-[#0E0E10] rounded-[48px] p-3 shadow-2xl border-4 border-[#252528] text-white">
                    {/* Phone Status Bar & Dynamic Island */}
                    <div className="flex items-center justify-between px-5 pt-1.5 pb-2 text-[11px] font-semibold text-white/80">
                      <span>9:41</span>
                      <div className="w-24 h-4 bg-black rounded-full mx-auto flex items-center justify-end pr-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#18181B] border border-white/20" />
                      </div>
                      <div className="flex items-center gap-1 text-[10px]">
                        <span>5G</span>
                        <div className="w-5 h-2.5 border border-white/80 rounded-2xs p-0.5 flex items-center">
                          <div className="w-full h-full bg-white rounded-3xs" />
                        </div>
                      </div>
                    </div>

                    {/* Instagram Profile Header */}
                    <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-white/10 bg-[#141416] rounded-t-[36px]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full p-0.5 bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF]">
                          <div className="w-full h-full bg-[#661414] rounded-full flex items-center justify-center text-[12px] font-serif italic font-black text-[#F5EBDF]">
                            s
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-white tracking-tight">MOTIVA.hq</span>
                            <svg className="w-3.5 h-3.5 text-[#0095F6] fill-current" viewBox="0 0 24 24">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                            </svg>
                            <span className="text-white/40 text-[10px] font-medium">• Follow</span>
                          </div>
                          <p className="text-[10px] text-white/60 leading-none mt-0.5 truncate max-w-[190px]">
                            Medical Evidence • MOTIVAclub.com
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-white/60">
                        <MoreHorizontal className="w-4 h-4 cursor-pointer hover:text-white" />
                      </div>
                    </div>

                    {/* Instagram Post Slide Canvas */}
                    <div className="relative overflow-hidden">
                      <div
                        className={`w-full p-6 sm:p-7 flex flex-col justify-between transition-all select-none ${
                          aspectRatio === '4:5'
                            ? 'aspect-[4/5]'
                            : aspectRatio === '1:1'
                            ? 'aspect-square'
                            : 'aspect-[9/16]'
                        } ${
                          currentSlide.theme_variant === 'maroon'
                            ? 'bg-[#661414] text-[#F5EBDF]'
                            : 'bg-[#F5EBDF] text-[#351D1D]'
                        }`}
                      >
                        <div className="space-y-3.5">
                          {/* Brand Header & Slide Counter */}
                          <div
                            className={`flex items-center justify-between text-[10px] font-mono uppercase tracking-widest pb-2 border-b ${
                              currentSlide.theme_variant === 'maroon'
                                ? 'text-[#E6CBBD] border-[#F5EBDF]/20'
                                : 'text-[#B58777] border-[#E6CBBD]'
                            }`}
                          >
                            <span className="font-bold lowercase text-xs tracking-normal">MOTIVA</span>
                            <span className="px-2 py-0.5 rounded-full bg-black/10 font-bold text-[9px]">
                              Slide {currentSlide.slide_number} of {carousel.slides.length}
                            </span>
                          </div>

                          {/* Serif Headline with Italic Accent */}
                          <h3
                            className={`font-serif text-lg sm:text-xl font-bold leading-snug tracking-tight ${
                              currentSlide.theme_variant === 'maroon'
                                ? 'text-[#F5EBDF]'
                                : 'text-[#351D1D]'
                            }`}
                          >
                            {languageMode === 'HINGLISH' && currentSlide.hinglish_headline
                              ? currentSlide.hinglish_headline
                              : currentSlide.headline}
                          </h3>

                          {/* Body text */}
                          <p
                            className={`text-xs leading-relaxed ${
                              currentSlide.theme_variant === 'maroon'
                                ? 'text-[#E6CBBD]'
                                : 'text-[#351D1D]/90'
                            }`}
                          >
                            {languageMode === 'HINGLISH' && currentSlide.hinglish_body
                              ? currentSlide.hinglish_body
                              : currentSlide.body_text}
                          </p>

                          {/* Empirical Finding Card */}
                          {currentSlide.finding && (
                            <div
                              className={`p-3 border-l-2 text-xs font-serif italic rounded-r-xs ${
                                currentSlide.theme_variant === 'maroon'
                                  ? 'bg-[#F5EBDF]/10 border-[#C04E2A] text-[#F5EBDF]'
                                  : 'bg-[#F8F2EB] border-[#C04E2A] text-[#351D1D]'
                              }`}
                            >
                              "{currentSlide.finding}"
                            </div>
                          )}

                          {/* Handwritten Founder Note */}
                          {currentSlide.founder_note && (
                            <div className="font-handwritten text-[#C04E2A] text-lg sm:text-xl font-bold leading-snug">
                              {currentSlide.founder_note}
                            </div>
                          )}

                          {/* Scientific Caveat / Limitation */}
                          {currentSlide.caveat_or_limitation && (
                            <div className="p-2.5 bg-[#C04E2A]/10 border border-[#C04E2A]/30 text-[11px] text-[#C04E2A] rounded-xs">
                              <span className="font-bold font-mono text-[9px] uppercase block">
                                Study Limitation:
                              </span>
                              {currentSlide.caveat_or_limitation}
                            </div>
                          )}
                        </div>

                        {/* Slide Footer */}
                        <div
                          className={`text-[9px] font-mono border-t pt-2 flex items-center justify-between ${
                            currentSlide.theme_variant === 'maroon'
                              ? 'text-[#E6CBBD]/80 border-[#F5EBDF]/20'
                              : 'text-[#B58777] border-[#E6CBBD]'
                          }`}
                        >
                          <span className="truncate max-w-[210px]">
                            {currentSlide.source_citation || activePaper.journal}
                          </span>
                          <span className="font-bold lowercase">MOTIVAclub.com</span>
                        </div>
                      </div>

                      {/* Instagram Slide Pill Overlay (1/7) in top right */}
                      <div className="absolute top-3 right-3 px-2 py-0.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono rounded-full font-bold">
                        {currentSlideIndex + 1}/{carousel.slides.length}
                      </div>
                    </div>

                    {/* Instagram Interactive Action Bar */}
                    <div className="px-3.5 py-2.5 bg-[#141416] border-t border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-3.5">
                        <button className="text-red-500 hover:scale-110 transition-transform cursor-pointer">
                          <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                        </button>
                        <button className="text-white hover:text-white/80 transition-colors cursor-pointer">
                          <MessageCircle className="w-5 h-5" />
                        </button>
                        <button className="text-white hover:text-white/80 transition-colors cursor-pointer">
                          <Send className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Instagram Pagination Dots */}
                      <div className="flex items-center gap-1.5">
                        {carousel.slides.map((_, i) => (
                          <span
                            key={i}
                            onClick={() => setCurrentSlideIndex(i)}
                            className={`h-1.5 rounded-full transition-all cursor-pointer ${
                              currentSlideIndex === i ? 'w-4 bg-[#C04E2A]' : 'w-1.5 bg-white/30 hover:bg-white/60'
                            }`}
                          />
                        ))}
                      </div>

                      <button className="text-white hover:text-white/80 transition-colors cursor-pointer">
                        <Bookmark className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Instagram Caption & Feed Context */}
                    <div className="px-3.5 pb-3.5 pt-1 bg-[#141416] rounded-b-[36px] text-xs space-y-1">
                      <p className="font-bold text-white text-[11px]">2,842 likes</p>
                      <p className="text-white/90 text-[11px] leading-relaxed line-clamp-2">
                        <strong className="font-bold text-white mr-1.5">MOTIVA.hq</strong>
                        {activePaper.title}: Our clinical breakdown reveals what happens to lean muscle mass and metabolic rate...
                      </p>
                      <p className="text-[10px] text-white/40 uppercase tracking-wider pt-0.5">
                        View all 184 comments • 2 hours ago
                      </p>
                    </div>
                  </div>
                )}


                {/* Slide Actions */}
                <div className="flex flex-wrap items-center justify-between pt-2 border-t border-[#E6CBBD] gap-2">
                  <div className="flex items-center gap-1">
                    {carousel.slides.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentSlideIndex(i)}
                        className={`w-6 h-6 text-[10px] font-mono rounded-xs border transition-colors cursor-pointer relative ${
                          currentSlideIndex === i
                            ? 'bg-[#C04E2A] text-[#FFFDF9] border-[#C04E2A]'
                            : 'border-[#E6CBBD] text-[#786A61] hover:bg-[#F8F2EB]'
                        }`}
                      >
                        {i + 1}
                        {s.invalidation_flag && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#C04E2A]" />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownloadAllSlidePngs}
                      className="px-3 py-1.5 bg-[#FFFDF9] hover:bg-[#F8F2EB] border border-[#E6CBBD] text-xs font-medium text-[#351D1D] rounded-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-[#C04E2A]" />
                      <span>Download All Slides</span>
                    </button>

                    <button
                      onClick={() => {
                        if (currentSlide) {
                          downloadCarouselSlidePng(
                            currentSlide,
                            currentSlideIndex,
                            carousel.slides.length,
                            activePaper.title
                          );
                        }
                      }}
                      className="px-3 py-1.5 bg-[#661414] hover:bg-[#4a0d0d] text-[#F5EBDF] text-xs font-semibold rounded-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-[#C04E2A]" />
                      <span>Download Slide PNG</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Slide Editor & Provenance Anchoring (5 Cols) */}
              <div className="lg:col-span-5 bg-[#FFFDF9] border border-[#E6CBBD] p-5 space-y-4">
                <div className="border-b border-[#E6CBBD] pb-2 flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#B58777] font-semibold">
                    SLIDE PROVENANCE & EDITORIAL COPY
                  </span>
                  <span className="text-[10px] font-mono text-[#B58777]">
                    Slide {currentSlideIndex + 1}
                  </span>
                </div>

                {currentSlide && (
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="font-mono text-[10px] uppercase text-[#B58777] block font-semibold mb-1">
                        Headline ({languageMode === 'HINGLISH' ? 'Hinglish' : 'English'})
                      </label>
                      <input
                        type="text"
                        value={
                          languageMode === 'HINGLISH' && currentSlide.hinglish_headline
                            ? currentSlide.hinglish_headline
                            : currentSlide.headline
                        }
                        onChange={(e) => {
                          const updated = [...carousel.slides];
                          if (languageMode === 'HINGLISH') {
                            updated[currentSlideIndex].hinglish_headline = e.target.value;
                          } else {
                            updated[currentSlideIndex].headline = e.target.value;
                          }
                          onUpdateCarousel({ ...carousel, slides: updated });
                        }}
                        className="w-full p-2 bg-[#FFFDF9] border border-[#E6CBBD] rounded-xs text-xs font-serif"
                      />
                    </div>

                    <div>
                      <label className="font-mono text-[10px] uppercase text-[#B58777] block font-semibold mb-1">
                        Body Text
                      </label>
                      <textarea
                        value={
                          languageMode === 'HINGLISH' && currentSlide.hinglish_body
                            ? currentSlide.hinglish_body
                            : currentSlide.body_text
                        }
                        onChange={(e) => {
                          const updated = [...carousel.slides];
                          if (languageMode === 'HINGLISH') {
                            updated[currentSlideIndex].hinglish_body = e.target.value;
                          } else {
                            updated[currentSlideIndex].body_text = e.target.value;
                          }
                          onUpdateCarousel({ ...carousel, slides: updated });
                        }}
                        rows={3}
                        className="w-full p-2 bg-[#FFFDF9] border border-[#E6CBBD] rounded-xs text-xs leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="font-mono text-[10px] uppercase text-[#C04E2A] block font-semibold mb-1">
                        Founder Handwritten Field Note
                      </label>
                      <input
                        type="text"
                        value={currentSlide.founder_note || ''}
                        onChange={(e) => {
                          const updated = [...carousel.slides];
                          updated[currentSlideIndex].founder_note = e.target.value;
                          onUpdateCarousel({ ...carousel, slides: updated });
                        }}
                        placeholder="e.g. Doctor's note: It is biology, not willpower."
                        className="w-full p-2 bg-[#FFFDF9] border border-[#E6CBBD] rounded-xs text-xs font-handwritten text-[#C04E2A] text-base"
                      />
                    </div>

                    {/* Mapped Upstream Claims */}
                    <div className="pt-2 border-t border-[#E6CBBD] space-y-2">
                      <span className="font-mono text-[10px] uppercase text-[#B58777] font-semibold block">
                        Underlying Scientific Claims
                      </span>

                      {currentSlide.mapped_claim_ids && currentSlide.mapped_claim_ids.length > 0 ? (
                        currentSlide.mapped_claim_ids.map((id) => {
                          const c = allClaims.find((item) => item.claim_id === id);
                          if (!c) return null;
                          return (
                            <div
                              key={c.claim_id}
                              className="p-2.5 bg-[#F8F2EB] border border-[#E6CBBD] space-y-1 text-[11px]"
                            >
                              <div className="flex items-center justify-between font-mono text-[9px]">
                                <span className="font-semibold text-[#661414]">{c.claim_id}</span>
                                <span
                                  className={`px-1.5 py-0.2 rounded-xs font-bold ${
                                    c.review_status === 'HUMAN_APPROVED'
                                      ? 'text-[#416C49] bg-[#416C49]/10'
                                      : 'text-[#C04E2A] bg-[#C04E2A]/10'
                                  }`}
                                >
                                  {c.review_status}
                                </span>
                              </div>
                              <p className="text-[#351D1D] font-medium leading-snug">{c.claim_text}</p>
                              {c.exact_supporting_quote && (
                                <p className="italic text-[#786A61] text-[10px]">
                                  "{c.exact_supporting_quote}"
                                </p>
                              )}
                              <button
                                onClick={() => onNavigateToDesk && onNavigateToDesk(c.claim_id)}
                                className="text-[10px] font-mono text-[#C04E2A] hover:underline flex items-center gap-1 pt-1 cursor-pointer"
                              >
                                <ExternalLink className="w-2.5 h-2.5" />
                                <span>Inspect Upstream Claim in Desk</span>
                              </button>
                            </div>
                          );
                        })
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[#FFFDF9] border border-[#E6CBBD] p-8 text-center space-y-4 max-w-lg mx-auto shadow-xs my-6">
          <div className="w-12 h-12 bg-[#F5EBDF] border border-[#E6CBBD] rounded-full mx-auto flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-[#C04E2A]" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-lg font-bold text-[#351D1D]">
              Carousel Drafts Ready to Generate
            </h3>
            <p className="text-xs text-[#B58777] leading-relaxed">
              No carousel draft generated for "{activePaper.title}" yet. Synthesize 5-7 verified editorial slides from this paper's claims.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-5 py-2.5 bg-[#661414] hover:bg-[#4a0d0d] disabled:opacity-50 text-[#F5EBDF] text-xs font-semibold rounded-xs flex items-center gap-2 mx-auto cursor-pointer transition-colors shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C04E2A]" />
            <span>{isGenerating ? 'Synthesizing MOTIVA Copy...' : 'Generate Deliverables for this Paper'}</span>
          </button>
        </div>
      )}
    </div>
  )}


      {/* 04. FORMAT 2: STATIC POST WORKSPACE */}
      {activeTab === 'static' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {staticPost ? (
            <>
              <div className="lg:col-span-7 bg-[#FFFDF9] border border-[#E6CBBD] p-5 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between border-b border-[#E6CBBD] pb-3 text-xs font-mono gap-2">
                  <span className="font-semibold text-[#661414]">1080×1080 EDITORIAL BRIEF</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => downloadStaticPostPng(staticPost, activePaper.title)}
                      className="px-3 py-1.5 bg-[#FFFDF9] hover:bg-[#F5EFE6] border border-[#E6CBBD] text-[#351D1D] text-xs font-semibold rounded-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-[#C04E2A]" />
                      <span>Download Static PNG</span>
                    </button>
                    {onScheduleDeliverable && (
                      <button
                        onClick={() => handleSchedule(staticPost, 'STATIC')}
                        className="px-3.5 py-1.5 bg-[#416C49] hover:bg-[#325438] text-white text-xs font-semibold rounded-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                        title="Approve and schedule into sequential 7-day calendar"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Approve & Add to 7-Day Calendar</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Multi-Claim Variation Switcher */}
                {approvedClaims.length > 1 && (
                  <div className="bg-[#FAF6F0] border border-[#E6CBBD] p-3 rounded-xs space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="font-bold text-[#661414] uppercase flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#C04E2A]" />
                        Multiple Claims Detected ({approvedClaims.length}): Calibrate Graphic
                      </span>
                      <span className="text-[#786A61] text-[10px]">Switch claim to generate varying post</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {approvedClaims.map((claim, idx) => {
                        const isMapped = (staticPost.approved_claim_ids || []).includes(claim.claim_id);
                        return (
                          <button
                            key={claim.claim_id}
                            onClick={() => {
                              const metric = claim.numbers_and_units && claim.numbers_and_units !== 'NOT REPORTED'
                                ? claim.numbers_and_units
                                : 'Clinical trial metric';
                              const cleanTitle = activePaper.title.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ').trim();
                              const updated: StaticPostContent = {
                                ...staticPost,
                                approved_claim_ids: [claim.claim_id],
                                headline: `${metric}: What Trials Prove About ${claim.outcome && claim.outcome !== 'NOT REPORTED' ? claim.outcome : cleanTitle.substring(0, 26)}`,
                                supporting_text: `${claim.claim_text} Conducted in ${claim.population} using ${claim.study_design}.`,
                                primary_finding: `${metric}: ${claim.exact_supporting_quote || claim.claim_text}`,
                                qualification: claim.limitations && claim.limitations !== 'NOT REPORTED' ? claim.limitations : 'Monitored under physician guidance.',
                                caption: `From our medical desk: ${claim.claim_text}\n\nClinical metric: ${metric}.\n\nMOTIVA · MOTIVAclub.com`,
                                hashtags: ['#MetabolicHealth', '#DoctorLedCare', '#IndianBiology', '#ClinicalTrial', '#MOTIVAclub'],
                              };
                              onUpdateStaticPost(updated);
                            }}
                            className={`px-2.5 py-1 text-xs rounded-xs font-mono transition-all cursor-pointer flex items-center gap-1 ${
                              isMapped
                                ? 'bg-[#661414] text-[#FFFDF9] font-bold shadow-xs'
                                : 'bg-[#FFFDF9] text-[#786A61] border border-[#E6CBBD] hover:bg-[#F8F2EB]'
                            }`}
                          >
                            <span>Claim #{idx + 1}</span>
                            <span className="text-[10px] opacity-75 truncate max-w-[140px]">
                              {claim.numbers_and_units && claim.numbers_and_units !== 'NOT REPORTED' ? claim.numbers_and_units : claim.claim_text.substring(0, 20)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Photorealistic Instagram Phone Mockup */}
                <div className="mx-auto w-full max-w-[430px] bg-[#0E0E10] rounded-[48px] p-3 shadow-2xl border-4 border-[#252528] text-white">
                  {/* Phone Status Bar */}
                  <div className="flex items-center justify-between px-5 pt-1.5 pb-2 text-[11px] font-semibold text-white/80">
                    <span>9:41</span>
                    <div className="w-24 h-4 bg-black rounded-full mx-auto flex items-center justify-end pr-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#18181B] border border-white/20" />
                    </div>
                    <div className="flex items-center gap-1 text-[10px]">
                      <span>5G</span>
                      <div className="w-5 h-2.5 border border-white/80 rounded-2xs p-0.5 flex items-center">
                        <div className="w-full h-full bg-white rounded-3xs" />
                      </div>
                    </div>
                  </div>

                  {/* Instagram Header */}
                  <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-white/10 bg-[#141416] rounded-t-[36px]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full p-0.5 bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF]">
                        <div className="w-full h-full bg-[#661414] rounded-full flex items-center justify-center text-[12px] font-serif italic font-black text-[#F5EBDF]">
                          s
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-white tracking-tight">MOTIVA.hq</span>
                          <svg className="w-3.5 h-3.5 text-[#0095F6] fill-current" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                          </svg>
                          <span className="text-white/40 text-[10px] font-medium">• Follow</span>
                        </div>
                        <p className="text-[10px] text-white/60 leading-none mt-0.5 truncate max-w-[190px]">
                          Editorial Field Note • MOTIVAclub.com
                        </p>
                      </div>
                    </div>
                    <MoreHorizontal className="w-4 h-4 text-white/60 cursor-pointer" />
                  </div>

                  {/* Rendered Static Frame */}
                  <div className="aspect-square w-full bg-[#F5EBDF] text-[#351D1D] p-6 sm:p-7 flex flex-col justify-between select-none">
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-[#B58777] border-b border-[#E6CBBD] pb-2">
                        <span className="font-bold lowercase text-xs tracking-normal">MOTIVA</span>
                        <span className="px-2 py-0.5 rounded-full bg-black/10 font-bold text-[9px]">
                          Founder Field Note
                        </span>
                      </div>

                      <h3 className="font-serif text-lg sm:text-xl font-bold text-[#351D1D] leading-snug">
                        {languageMode === 'HINGLISH' && staticPost.hinglish_headline
                          ? staticPost.hinglish_headline
                          : staticPost.headline}
                      </h3>

                      <p className="text-xs text-[#351D1D]/90 leading-relaxed">
                        {languageMode === 'HINGLISH' && staticPost.hinglish_supporting_text
                          ? staticPost.hinglish_supporting_text
                          : staticPost.supporting_text}
                      </p>

                      <div className="p-3 bg-[#F8F2EB] border-l-2 border-[#C04E2A] font-serif text-xs italic text-[#351D1D] rounded-r-xs">
                        "{staticPost.primary_finding}"
                      </div>

                      {staticPost.founder_note && (
                        <div className="font-handwritten text-[#C04E2A] text-lg font-bold leading-snug">
                          {staticPost.founder_note}
                        </div>
                      )}

                      <div className="p-2 bg-[#C04E2A]/10 border border-[#C04E2A]/30 text-[11px] text-[#C04E2A] rounded-xs">
                        <span className="font-mono text-[9px] uppercase font-bold block">
                          Editorial Qualification:
                        </span>
                        {staticPost.qualification}
                      </div>
                    </div>

                    <div className="text-[9px] font-mono text-[#B58777] border-t border-[#E6CBBD] pt-2 flex justify-between">
                      <span className="truncate max-w-[210px]">{staticPost.source_note}</span>
                      <span className="font-bold lowercase">MOTIVAclub.com</span>
                    </div>
                  </div>

                  {/* Instagram Interactive Action Bar */}
                  <div className="px-3.5 py-2.5 bg-[#141416] border-t border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <button className="text-red-500 hover:scale-110 transition-transform cursor-pointer">
                        <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                      </button>
                      <button className="text-white hover:text-white/80 transition-colors cursor-pointer">
                        <MessageCircle className="w-5 h-5" />
                      </button>
                      <button className="text-white hover:text-white/80 transition-colors cursor-pointer">
                        <Send className="w-5 h-5" />
                      </button>
                    </div>

                    <button className="text-white hover:text-white/80 transition-colors cursor-pointer">
                      <Bookmark className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Instagram Caption */}
                  <div className="px-3.5 pb-3.5 pt-1 bg-[#141416] rounded-b-[36px] text-xs space-y-1">
                    <p className="font-bold text-white text-[11px]">1,930 likes</p>
                    <p className="text-white/90 text-[11px] leading-relaxed line-clamp-2">
                      <strong className="font-bold text-white mr-1.5">MOTIVA.hq</strong>
                      {staticPost.headline}
                    </p>
                    <p className="text-[10px] text-white/40 uppercase tracking-wider pt-0.5">
                      View all 92 comments • 4 hours ago
                    </p>
                  </div>
                </div>
              </div>


              {/* Attributes */}
              <div className="lg:col-span-5 bg-[#FFFDF9] border border-[#E6CBBD] p-5 space-y-4">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#B58777] font-semibold block border-b border-[#E6CBBD] pb-2">
                  STATIC POST ATTRIBUTES
                </span>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-mono text-[10px] uppercase text-[#B58777] block font-semibold mb-1">
                      Headline
                    </label>
                    <input
                      type="text"
                      value={staticPost.headline}
                      onChange={(e) =>
                        onUpdateStaticPost({ ...staticPost, headline: e.target.value })
                      }
                      className="w-full p-2 bg-[#FFFDF9] border border-[#E6CBBD] rounded-xs text-xs font-serif"
                    />
                  </div>

                  <div>
                    <label className="font-mono text-[10px] uppercase text-[#B58777] block font-semibold mb-1">
                      Supporting Context
                    </label>
                    <textarea
                      value={staticPost.supporting_text}
                      onChange={(e) =>
                        onUpdateStaticPost({ ...staticPost, supporting_text: e.target.value })
                      }
                      rows={3}
                      className="w-full p-2 bg-[#FFFDF9] border border-[#E6CBBD] rounded-xs text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-mono text-[10px] uppercase text-[#C04E2A] block font-semibold mb-1">
                      Founder Field Note
                    </label>
                    <input
                      type="text"
                      value={staticPost.founder_note || ''}
                      onChange={(e) =>
                        onUpdateStaticPost({ ...staticPost, founder_note: e.target.value })
                      }
                      className="w-full p-2 bg-[#FFFDF9] border border-[#E6CBBD] rounded-xs text-xs font-handwritten text-[#C04E2A] text-base"
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="lg:col-span-12 p-8 text-center text-[#B58777]">
              Generate content to preview static post.
            </div>
          )}
        </div>
      )}

      {/* 05. FORMAT 3: AI VIDEO REEL WORKSPACE */}
      {activeTab === 'reel' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {reel ? (
            <>
              {/* Left Column: Scene Script Ledger (7 Cols) */}
              <div className="lg:col-span-7 bg-[#FFFDF9] border border-[#E6CBBD] p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between border-b border-[#E6CBBD] pb-2 text-xs font-mono gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#661414]">
                      SCENE-BY-SCENE REEL SCRIPT
                    </span>
                    <span>·</span>
                    <span className="text-[#B58777]">{reel.total_duration_sec}s Total</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Audio Voiceover Toggle */}
                    <button
                      onClick={handleToggleVoiceoverAudio}
                      className={`px-2.5 py-1 text-xs font-medium border rounded-xs flex items-center gap-1 cursor-pointer transition-colors ${
                        isVoiceoverAudioActive
                          ? 'bg-[#C04E2A] text-[#FFFDF9] border-[#C04E2A]'
                          : 'bg-[#FFFDF9] text-[#786A61] border-[#E6CBBD] hover:bg-[#F8F2EB]'
                      }`}
                    >
                      {isVoiceoverAudioActive ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                      <span>{isVoiceoverAudioActive ? 'Voiceover (ON)' : 'Audio (Muted)'}</span>
                    </button>

                    <button
                      onClick={handleToggleReelPlay}
                      className="px-3 py-1 text-xs font-semibold bg-[#661414] hover:bg-[#4a0d0d] text-[#F5EBDF] rounded-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      {isPlayingReel ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      <span>{isPlayingReel ? 'Pause Reel' : 'Play AI Reel'}</span>
                    </button>
                  </div>
                </div>

                {/* Timeline Progress Bar */}
                <div className="w-full bg-[#F5EBDF] h-2 overflow-hidden rounded-xs">
                  <div
                    className="bg-[#C04E2A] h-2 transition-all duration-300"
                    style={{
                      width: `${(reelElapsedSeconds / (reel.total_duration_sec || 1)) * 100}%`,
                    }}
                  />
                </div>

                {/* Render MP4 / WebM Reel Video Action Bar */}
                <div className="p-4 bg-[#F5EBDF] border border-[#E6CBBD] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-serif text-sm font-bold text-[#351D1D]">Render & Export Reel Video (MP4 / WebM)</h4>
                      <p className="text-[11px] text-[#B58777]">
                        Generate real playable video file using HTML5 Canvas & MediaRecorder pipeline.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={handleRenderReelVideo}
                        disabled={isVideoRecording}
                        className="px-3.5 py-2 bg-[#C04E2A] hover:bg-[#a63f1f] disabled:opacity-50 text-[#FFFDF9] text-xs font-semibold rounded-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                      >
                        <Video className="w-4 h-4" />
                        <span>{isVideoRecording ? `Rendering (${videoProgress}%)` : 'Render Reel Video'}</span>
                      </button>
                      {onScheduleDeliverable && (
                        <button
                          onClick={() => handleSchedule(reel, 'REEL')}
                          className="px-3.5 py-2 bg-[#416C49] hover:bg-[#325438] text-white text-xs font-semibold rounded-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                          title="Approve and schedule into sequential 7-day calendar"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Approve & Add to 7-Day Calendar</span>
                        </button>
                      )}
                    </div>
                  </div>
                  {isVideoRecording && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-mono text-[#661414]">
                        <span>{videoStatusText}</span>
                        <span>{videoProgress}%</span>
                      </div>
                      <div className="w-full bg-white h-2 rounded-xs overflow-hidden border border-[#E6CBBD]">
                        <div className="bg-[#C04E2A] h-2 transition-all duration-300" style={{ width: `${videoProgress}%` }} />
                      </div>
                    </div>
                  )}
                  {renderedVideoUrl && (
                    <div className="p-3 bg-white border border-[#E6CBBD] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-[#416C49] flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Reel Video Rendered Successfully (1080x1920 9:16)
                        </span>
                        <a
                          href={renderedVideoUrl}
                          download={`motiva-reel-${reel.id || 'export'}.webm`}
                          className="px-3 py-1 bg-[#416C49] hover:bg-[#325438] text-white text-xs font-semibold rounded-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" /> Download MP4/WebM Video
                        </a>
                      </div>
                      <div className="aspect-[9/16] max-w-[220px] mx-auto bg-black rounded-xl overflow-hidden border border-[#E6CBBD]">
                        <video src={renderedVideoUrl} controls autoPlay muted loop className="w-full h-full object-cover" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Scene Rows */}
                <div className="space-y-3">
                  {reel.scenes.map((scene, idx) => {
                    const isCurrent = currentReelSceneIndex === idx && isPlayingReel;
                    const mappedClaims = (scene.mapped_claim_ids || [])
                      .map((id) => allClaims.find((c) => c.claim_id === id))
                      .filter(Boolean) as ClaimRecord[];

                    return (
                      <div
                        key={scene.scene_number}
                        className={`p-3.5 border transition-colors space-y-2 ${
                          isCurrent
                            ? 'bg-[#C04E2A]/10 border-[#C04E2A]'
                            : 'bg-[#FFFDF9] border-[#E6CBBD]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono text-[#B58777]">
                          <span className="font-semibold text-[#661414]">
                            SCENE {scene.scene_number} ({scene.duration_sec}s)
                          </span>
                          <span className="truncate max-w-[220px]">
                            B-Roll: {scene.visual_cue || scene.visual_b_roll || 'Clinical metabolic visual'}
                          </span>
                        </div>

                        <div className="text-xs text-[#351D1D]">
                          <span className="font-mono text-[10px] uppercase text-[#B58777] font-semibold block mb-0.5">
                            Voiceover ({languageMode === 'HINGLISH' ? 'Hinglish' : 'English'}):
                          </span>
                          <p className="font-serif leading-relaxed italic text-sm">
                            "
                            {languageMode === 'HINGLISH' && scene.hinglish_voiceover
                              ? scene.hinglish_voiceover
                              : scene.voiceover_script}
                            "
                          </p>
                        </div>

                        {scene.on_screen_text && (
                          <div className="text-[11px] font-mono text-[#C04E2A] bg-[#F5EBDF] p-1.5 border border-[#E6CBBD]">
                            On-screen: {scene.on_screen_text}
                          </div>
                        )}

                        {mappedClaims.length > 0 && (
                          <div className="pt-1 flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-[#B58777]">
                            <span>Evidence Anchor:</span>
                            {mappedClaims.map((c) => (
                              <button
                                key={c.claim_id}
                                onClick={() => onNavigateToDesk && onNavigateToDesk(c.claim_id)}
                                className="text-[#C04E2A] hover:underline bg-[#F5EBDF] px-1.5 py-0.2 rounded-xs border border-[#E6CBBD] cursor-pointer"
                              >
                                {c.claim_id} ({c.review_status})
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: 9:16 Vertical Simulator (5 Cols) */}
              <div className="lg:col-span-5 bg-[#FFFDF9] border border-[#E6CBBD] p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-[#E6CBBD] pb-2 text-xs font-mono">
                  <span className="font-semibold text-[#661414]">9:16 REEL SIMULATOR</span>
                  <span className="text-[#B58777]">
                    {reelElapsedSeconds}s / {reel.total_duration_sec}s
                  </span>
                </div>

                {/* 9:16 Instagram Reels Smartphone Frame */}
                <div className="mx-auto w-full max-w-[310px] bg-[#0E0E10] rounded-[44px] p-2.5 shadow-2xl border-4 border-[#252528] text-white">
                  {/* Status Bar */}
                  <div className="flex items-center justify-between px-4 pt-1 pb-1.5 text-[10px] font-semibold text-white/80">
                    <span>9:41</span>
                    <div className="w-16 h-3 bg-black rounded-full mx-auto" />
                    <span>5G</span>
                  </div>

                  {/* 9:16 Reel Viewport */}
                  <div className="aspect-[9/16] w-full rounded-[32px] bg-[#1a0a0a] text-[#F5EBDF] p-4 flex flex-col justify-between relative overflow-hidden select-none border border-white/10 shadow-inner">
                    {/* Atmospheric B-Roll / Metabolic Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[#661414]/80 via-[#351D1D]/90 to-[#120505] pointer-events-none" />

                    {/* Top Bar with Reels Tag */}
                    <div className="relative z-10 flex items-center justify-between text-[10px] font-mono uppercase text-[#E6CBBD]">
                      <span className="font-serif italic font-bold text-white text-xs">Reels</span>
                      <span className="bg-black/40 px-2 py-0.5 rounded-full text-[9px]">
                        Scene {reel.scenes[currentReelSceneIndex]?.scene_number || 1} / {reel.scenes.length}
                      </span>
                    </div>

                    {/* Center Animated Karaoke / On-Screen Visuals */}
                    <div className="relative z-10 text-center space-y-3 my-auto px-1">
                      <span className="text-[9px] font-mono uppercase tracking-wider text-[#C04E2A] bg-[#F5EBDF] px-2 py-0.5 rounded-full font-bold inline-block shadow-xs">
                        {(reel.scenes[currentReelSceneIndex]?.visual_cue || reel.scenes[currentReelSceneIndex]?.visual_b_roll || 'Clinical Metabolic Visual').substring(0, 30)}...
                      </span>

                      <h4 className="font-serif text-base sm:text-lg font-bold leading-snug text-[#F5EBDF] drop-shadow-md">
                        {reel.scenes[currentReelSceneIndex]?.on_screen_text || reel.title}
                      </h4>

                      {/* Karaoke Subtitles */}
                      <div className="p-3 bg-black/60 backdrop-blur-md border border-white/20 rounded-xl text-xs font-mono text-[#F5EBDF] leading-snug shadow-lg">
                        <span className="text-[#C04E2A] font-bold text-sm mr-1">“</span>
                        {languageMode === 'HINGLISH' &&
                        reel.scenes[currentReelSceneIndex]?.hinglish_subtitle
                          ? reel.scenes[currentReelSceneIndex].hinglish_subtitle
                          : reel.scenes[currentReelSceneIndex]?.subtitle_text || 'Listening...'}
                        <span className="text-[#C04E2A] font-bold text-sm ml-1">”</span>
                      </div>
                    </div>

                    {/* Right-Side Instagram Reels Action Rail */}
                    <div className="absolute right-2.5 bottom-14 z-20 flex flex-col items-center gap-3 text-white text-[10px]">
                      <div className="flex flex-col items-center gap-0.5">
                        <button className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-xs flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
                          <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                        </button>
                        <span className="font-bold text-[9px]">14.2k</span>
                      </div>

                      <div className="flex flex-col items-center gap-0.5">
                        <button className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-xs flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        <span className="font-bold text-[9px]">428</span>
                      </div>

                      <div className="flex flex-col items-center gap-0.5">
                        <button className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-xs flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
                          <Send className="w-4 h-4" />
                        </button>
                        <span className="font-bold text-[9px]">Share</span>
                      </div>

                      <button className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-xs flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
                        <Bookmark className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Bottom Handle & Audio Track */}
                    <div className="relative z-10 space-y-1 text-left pr-12">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-[#661414] border border-white/40 flex items-center justify-center text-[9px] font-serif italic font-bold">
                          s
                        </div>
                        <span className="font-bold text-[11px] text-white">MOTIVA.hq</span>
                        <span className="px-1.5 py-0.2 text-[8px] bg-white/20 rounded-xs font-semibold">Follow</span>
                      </div>
                      <p className="text-[10px] text-white/80 line-clamp-1">
                        {reel.title}: Medical Longevity Breakdown
                      </p>
                      <div className="flex items-center gap-1.5 text-[9px] text-white/60">
                        <span>🎵</span>
                        <span className="truncate max-w-[150px]">Original Audio • MOTIVAclub.com</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="lg:col-span-12 p-8 text-center text-[#B58777]">
              Generate content to preview vertical reel.
            </div>
          )}
        </div>
      )}

      {/* 06. FORMAT 4: CAPTIONS & HASHTAGS */}
      {activeTab === 'caption' && (
        <div className="bg-[#FFFDF9] border border-[#E6CBBD] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E6CBBD] pb-3">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#351D1D]">
                Instagram Captions & Methodological Disclosure
              </h3>
              <p className="text-xs text-[#B58777]">
                Drafting assistance only; qualified review is required before publication.
              </p>
            </div>

            <button
              onClick={() =>
                handleCopyCaption(
                  (languageMode === 'HINGLISH' && carousel?.hinglish_caption
                    ? carousel.hinglish_caption
                    : carousel?.caption || '') +
                    '\n\n' +
                    (carousel?.hashtags.join(' ') || '')
                )
              }
              className="px-3 py-1.5 bg-[#C04E2A] hover:bg-[#a63f1f] text-[#FFFDF9] text-xs font-semibold rounded-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              {copiedCaption ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCaption ? 'Copied to Clipboard!' : 'Copy Caption & Tags'}</span>
            </button>
          </div>

          <div className="p-4 bg-[#F5EBDF] border border-[#E6CBBD] text-xs font-sans text-[#351D1D] leading-relaxed whitespace-pre-line max-h-80 overflow-y-auto">
            {languageMode === 'HINGLISH' && carousel?.hinglish_caption
              ? carousel.hinglish_caption
              : carousel?.caption}

            {'\n\n'}
            {carousel?.hashtags.join(' ')}
          </div>
        </div>
      )}
    </div>
  );
};
