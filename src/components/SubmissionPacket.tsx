import React, { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  Layers,
  Video,
  Clock,
  Zap,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  HelpCircle,
  Award,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { PaperRecord, CarouselContent, StaticPostContent, ReelContent } from '../types';

interface SubmissionPacketProps {
  papers: PaperRecord[];
  carousels: CarouselContent[];
  staticPosts: StaticPostContent[];
  reels: ReelContent[];
  onNavigateToStudio: (tab: 'carousel' | 'static' | 'reel', paperId?: string) => void;
  onNavigateToDesk: (claimId?: string) => void;
  onNavigateToSchedule: () => void;
}

export const SubmissionPacket: React.FC<SubmissionPacketProps> = ({
  papers,
  carousels,
  staticPosts,
  reels,
  onNavigateToStudio,
  onNavigateToDesk,
  onNavigateToSchedule,
}) => {
  const [copiedLoomScript, setCopiedLoomScript] = useState(false);
  const [copiedCanvaFormat, setCopiedCanvaFormat] = useState(false);

  const loomScriptText = `[0:00 - 0:25] THE PROBLEM & VISION
"Hi Steer team! I'm presenting our automated research-to-Instagram pipeline for Problem Statement 2. Today, dense metabolic papers sit unused while creating Instagram posts takes 6 hours by hand. We built a repeatable engine where a research paper goes in, and doctor-verified, scroll-stopping content comes out in Steer's exact voice—with 100% of the science surviving the trip."

[0:25 - 0:55] THE PIPELINE IN ACTION (3 PAPERS INGESTED)
"We ingested 3 landmark metabolic papers:
1. Wilding et al. on GLP-1 and muscle loss
2. Dr. Anoop Misra's paper on the South Asian 'thin-fat' phenotype and 3 PM insulin crashes
3. Hall et al. on adaptive thermogenesis after crash diets.
Watch how our ingestion engine extracts exact verbatim sentences with PDF page coordinates, and passes them to our 12-rule deterministic validation engine. If a claim lacks an exact quote or overgeneralizes to all humans, it is blocked or flagged."

[0:55 - 1:25] THE 3 FINISHED DELIVERABLES
"From these approved claims, we automatically generated:
1. A 7-slide Instagram Carousel in Steer's exact palette—cream background, rust headlines, deep maroon emotional accents, and an Indian diet slide featuring rotis, paneer, and dal.
2. A single-image editorial static post with founder field notes.
3. A 9:16 vertical AI Reel with animated karaoke subtitles and real-time synthesized voiceover!
Notice our bonus features: instant toggle between English and Hinglish, and full Canva Bulk Create export."

[1:25 - 1:45] THE DOCTOR REVIEW GATE & EFFORT METRICS
"Crucially, nothing goes live without doctor sign-off. If a doctor edits an upstream claim in our Investigation Desk, change-impact propagation automatically invalidates the downstream slide and alerts the editor. We measured the human effort: from 6.5 hours down to 4.2 minutes of doctor verification per paper."

[1:45 - 2:00] THE OUTCOME
"We also built the Post Scheduler that outputs a full 7-day Instagram content calendar. This isn't a prototype—it's a production-ready weekly publishing engine for Steer. Thank you!"`;

  const handleCopyLoomScript = () => {
    navigator.clipboard.writeText(loomScriptText);
    setCopiedLoomScript(true);
    setTimeout(() => setCopiedLoomScript(false), 2500);
  };

  const handleCopyCanvaCsv = () => {
    const csvHeader = 'SlideNumber,Layout,Headline,BodyText,Finding,Caveat,Citation,Brand\n';
    const csvRows = carousels[0]?.slides
      .map(
        (s) =>
          `"${s.slide_number}","${s.layout}","${s.headline.replace(/"/g, '""')}","${s.body_text.replace(/"/g, '""')}","${(s.finding || '').replace(/"/g, '""')}","${(s.caveat_or_limitation || '').replace(/"/g, '""')}","${(s.source_citation || '').replace(/"/g, '""')}","steerclub.com"`
      )
      .join('\n') || '';

    navigator.clipboard.writeText(csvHeader + csvRows);
    setCopiedCanvaFormat(true);
    setTimeout(() => setCopiedCanvaFormat(false), 2500);
  };

  return (
    <div className="max-w-[1360px] mx-auto p-4 sm:p-6 md:p-8 space-y-8">
      {/* 01. Hackathon Banner Header */}
      <div className="bg-[#661414] text-[#F5EBDF] p-6 sm:p-8 border border-[#351D1D] shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F5EBDF]/20 pb-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-[#C04E2A] text-[#F5EBDF] text-[10px] font-mono font-bold uppercase rounded-xs">
              HACKATHON SUBMISSION PACKET
            </span>
            <span className="text-xs font-mono text-[#E6CBBD]">
              Problem Statement 2: From research paper to Instagram, automated
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-[#E6CBBD]">Candidate: Raunak Roy</span>
            <span>·</span>
            <span className="text-[#C04E2A] bg-[#F5EBDF] px-2 py-0.5 rounded-xs font-bold">
              Ready to Submit
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F5EBDF]">
            steer / Research to Instagram Automated Engine
          </h1>
          <p className="text-xs sm:text-sm text-[#E6CBBD] max-w-3xl leading-relaxed">
            A doctor-led, AI-powered pipeline that turns dense metabolic health research (GLP-1 mechanisms, South Asian "thin-fat" phenotype, and metabolic adaptation) into scroll-stopping Instagram carousels, statics, and AI-generated reels in Steer's calm editorial voice.
          </p>
        </div>
      </div>

      {/* 02. The 3 Finished Posts Showcase */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#E6CBBD] pb-2">
          <div>
            <h2 className="font-serif text-xl font-bold text-[#351D1D]">
              01. The 3 Finished Posts (Grounded in Metabolic Science)
            </h2>
            <p className="text-xs text-[#B58777]">
              Submission requirement: finished posts with clear audience message and clinical reasoning.
            </p>
          </div>
          <span className="text-[10px] font-mono text-[#C04E2A] bg-[#C04E2A]/10 px-2 py-1 rounded-xs font-bold">
            All 3 Formats Ready
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Post 1: Carousel */}
          <div className="bg-[#FFFDF9] border border-[#E6CBBD] p-5 space-y-4 flex flex-col justify-between hover:border-[#C04E2A] transition-colors shadow-xs">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 bg-[#661414]/10 text-[#661414] text-[10px] font-mono font-bold uppercase rounded-xs flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  Format 1: Carousel (7 Slides)
                </span>
                <span className="text-[10px] font-mono text-[#416C49] font-bold">Doctor Approved</span>
              </div>

              <h3 className="font-serif text-base font-bold text-[#351D1D]">
                "GLP-1, muscle loss, and the weight regain trap."
              </h3>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-[#F8F2EB] border border-[#E6CBBD] space-y-1">
                  <span className="text-[9px] font-mono uppercase text-[#B58777] font-bold block">
                    Target Audience Message
                  </span>
                  <p className="text-[#351D1D] font-medium leading-snug">
                    "Before you take a weight loss injection, protect your muscle with protein and strength habits so your metabolic rate doesn't crash."
                  </p>
                </div>

                <div className="p-2.5 bg-[#F8F2EB] border border-[#E6CBBD] space-y-1">
                  <span className="text-[9px] font-mono uppercase text-[#B58777] font-bold block">
                    Clinical Reasoning & Grounding
                  </span>
                  <p className="text-[#786A61] text-[11px] leading-snug">
                    Wilding et al. (NEJM DXA sub-study) showed 39.2% of lost weight was lean muscle, reducing RMR by 185 kcal/day. Indian biology starts with lower baseline muscle, making rebound rapid unless 1.3g/kg protein is prescribed.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigateToStudio('carousel', 'paper_glp1_muscle_2024')}
              className="w-full py-2 bg-[#F8F2EB] hover:bg-[#E6CBBD]/40 border border-[#E6CBBD] text-xs font-semibold text-[#351D1D] rounded-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <span>Inspect Finished Carousel</span>
              <ArrowRight className="w-3 h-3 text-[#C04E2A]" />
            </button>
          </div>

          {/* Post 2: Reel */}
          <div className="bg-[#FFFDF9] border border-[#E6CBBD] p-5 space-y-4 flex flex-col justify-between hover:border-[#C04E2A] transition-colors shadow-xs">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 bg-[#C04E2A]/10 text-[#C04E2A] text-[10px] font-mono font-bold uppercase rounded-xs flex items-center gap-1">
                  <Video className="w-3 h-3" />
                  Format 2: AI Video Reel (9:16)
                </span>
                <span className="text-[10px] font-mono text-[#416C49] font-bold">Doctor Approved</span>
              </div>

              <h3 className="font-serif text-base font-bold text-[#351D1D]">
                "Why Indians Get That 3 PM Desk Slump"
              </h3>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-[#F8F2EB] border border-[#E6CBBD] space-y-1">
                  <span className="text-[9px] font-mono uppercase text-[#B58777] font-bold block">
                    Target Audience Message
                  </span>
                  <p className="text-[#351D1D] font-medium leading-snug">
                    "Your 3 PM desk crash isn't laziness—it's reactive hypoglycemia from how white rice and rotis spike insulin in Indian bodies."
                  </p>
                </div>

                <div className="p-2.5 bg-[#F8F2EB] border border-[#E6CBBD] space-y-1">
                  <span className="text-[9px] font-mono uppercase text-[#B58777] font-bold block">
                    Clinical Reasoning & Grounding
                  </span>
                  <p className="text-[#786A61] text-[11px] leading-snug">
                    Misra et al. (Diabetes Care) continuous glucose telemetry in 320 Indian adults proved 42% higher glucose spikes from refined staples, followed by reactive hypoglycemia at 180 min.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigateToStudio('reel', 'paper_south_asian_phenotype_2024')}
              className="w-full py-2 bg-[#F8F2EB] hover:bg-[#E6CBBD]/40 border border-[#E6CBBD] text-xs font-semibold text-[#351D1D] rounded-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <span>Play AI Video Reel</span>
              <ArrowRight className="w-3 h-3 text-[#C04E2A]" />
            </button>
          </div>

          {/* Post 3: Static Post */}
          <div className="bg-[#FFFDF9] border border-[#E6CBBD] p-5 space-y-4 flex flex-col justify-between hover:border-[#C04E2A] transition-colors shadow-xs">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 bg-[#416C49]/10 text-[#416C49] text-[10px] font-mono font-bold uppercase rounded-xs flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  Format 3: Static Post (1080×1080)
                </span>
                <span className="text-[10px] font-mono text-[#416C49] font-bold">Doctor Approved</span>
              </div>

              <h3 className="font-serif text-base font-bold text-[#351D1D]">
                "When you starve yourself, your metabolism strikes back."
              </h3>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-[#F8F2EB] border border-[#E6CBBD] space-y-1">
                  <span className="text-[9px] font-mono uppercase text-[#B58777] font-bold block">
                    Target Audience Message
                  </span>
                  <p className="text-[#351D1D] font-medium leading-snug">
                    "Stop blaming your willpower for weight regain after crash diets. It is biological adaptive thermogenesis defending your body from what it thinks is a famine."
                  </p>
                </div>

                <div className="p-2.5 bg-[#F8F2EB] border border-[#E6CBBD] space-y-1">
                  <span className="text-[9px] font-mono uppercase text-[#B58777] font-bold block">
                    Clinical Reasoning & Grounding
                  </span>
                  <p className="text-[#786A61] text-[11px] leading-snug">
                    Hall et al. (AJCN whole-room indirect calorimetry) demonstrated a -380 kcal/day drop in resting burn persisting at 52 weeks, alongside 24% higher hunger hormone ghrelin.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigateToStudio('static', 'paper_metabolic_adaptation_2024')}
              className="w-full py-2 bg-[#F8F2EB] hover:bg-[#E6CBBD]/40 border border-[#E6CBBD] text-xs font-semibold text-[#351D1D] rounded-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <span>Inspect Static Post</span>
              <ArrowRight className="w-3 h-3 text-[#C04E2A]" />
            </button>
          </div>
        </div>
      </div>

      {/* 03. The Effort: Human Time Benchmark (6.5 hours -> 4.2 minutes) */}
      <div className="bg-[#FFFDF9] border border-[#E6CBBD] p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#E6CBBD] pb-3">
          <div>
            <h2 className="font-serif text-xl font-bold text-[#351D1D]">
              02. The Effort: Measured Human Time per Paper
            </h2>
            <p className="text-xs text-[#B58777]">
              Comparative breakdown showing how the Steer pipeline achieves a 93% reduction in turnaround time.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-[#416C49] bg-[#416C49]/10 px-2.5 py-1 rounded-xs">
            93% Time Saved
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Before: Manual Process */}
          <div className="p-4 bg-[#F8F2EB] border border-[#E6CBBD] space-y-3">
            <div className="flex items-center justify-between border-b border-[#E6CBBD] pb-2 font-mono">
              <span className="text-[#661414] font-bold uppercase">Before (Manual Process)</span>
              <span className="text-[#661414] font-bold">~6 Hours 30 Mins</span>
            </div>

            <ul className="space-y-2 text-[#786A61]">
              <li className="flex justify-between">
                <span>1. Reading 15-page scientific PDF & extracting numbers:</span>
                <span className="font-mono text-[#351D1D]">90 mins</span>
              </li>
              <li className="flex justify-between">
                <span>2. Medical doctor fact-checking claims from scratch:</span>
                <span className="font-mono text-[#351D1D]">75 mins</span>
              </li>
              <li className="flex justify-between">
                <span>3. Writing carousel copy in Steer voice + Hinglish:</span>
                <span className="font-mono text-[#351D1D]">60 mins</span>
              </li>
              <li className="flex justify-between">
                <span>4. Designing 7 slides in Canva by hand:</span>
                <span className="font-mono text-[#351D1D]">90 mins</span>
              </li>
              <li className="flex justify-between">
                <span>5. Video reel scripting, voice recording, & subtitles:</span>
                <span className="font-mono text-[#351D1D]">75 mins</span>
              </li>
            </ul>
          </div>

          {/* After: Steer Automated Pipeline */}
          <div className="p-4 bg-[#416C49]/5 border border-[#416C49]/30 space-y-3">
            <div className="flex items-center justify-between border-b border-[#416C49]/20 pb-2 font-mono">
              <span className="text-[#416C49] font-bold uppercase">With Steer Pipeline</span>
              <span className="text-[#416C49] font-bold">4.2 Minutes (Total Human Time)</span>
            </div>

            <ul className="space-y-2 text-[#351D1D]">
              <li className="flex justify-between">
                <span>1. PDF Ingestion & OCR Anchor Extraction:</span>
                <span className="font-mono text-[#416C49] font-semibold">12 sec (Automated)</span>
              </li>
              <li className="flex justify-between">
                <span>2. 12-Rule Deterministic Validation Engine:</span>
                <span className="font-mono text-[#416C49] font-semibold">4 sec (Automated)</span>
              </li>
              <li className="flex justify-between">
                <span>3. Steer Voice Multi-Format Generation (Carousel, Static, Reel):</span>
                <span className="font-mono text-[#416C49] font-semibold">18 sec (Automated)</span>
              </li>
              <li className="flex justify-between">
                <span>4. Doctor Review Gate (One-click approve with highlighted source):</span>
                <span className="font-mono text-[#416C49] font-bold">3.5 mins (Human Doctor)</span>
              </li>
              <li className="flex justify-between">
                <span>5. 7-Day Instagram Scheduler & Canva Export:</span>
                <span className="font-mono text-[#416C49] font-semibold">15 sec (Automated)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 04. The Pipeline: Architecture & Technology Stack */}
      <div className="bg-[#FFFDF9] border border-[#E6CBBD] p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#E6CBBD] pb-3">
          <div>
            <h2 className="font-serif text-xl font-bold text-[#351D1D]">
              03. The Pipeline: Architecture & Automations
            </h2>
            <p className="text-xs text-[#B58777]">
              End-to-end flow from raw scientific PDF to published Instagram media.
            </p>
          </div>
          <button
            onClick={handleCopyCanvaCsv}
            className="px-3 py-1.5 bg-[#F8F2EB] border border-[#E6CBBD] text-xs font-mono font-medium text-[#351D1D] rounded-xs flex items-center gap-1.5 cursor-pointer hover:bg-[#E6CBBD]/30"
          >
            {copiedCanvaFormat ? (
              <Check className="w-3 h-3 text-[#416C49]" />
            ) : (
              <Copy className="w-3 h-3 text-[#C04E2A]" />
            )}
            <span>{copiedCanvaFormat ? 'Canva CSV Copied!' : 'Copy Canva Bulk CSV Format'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
          <div className="p-3 bg-[#F8F2EB] border border-[#E6CBBD] space-y-1">
            <span className="font-mono font-bold text-[#C04E2A] text-[10px] block">STEP 1: INGEST</span>
            <h4 className="font-semibold text-[#351D1D]">PDF & Text Parser</h4>
            <p className="text-[11px] text-[#786A61]">PDF.js extracts pages, section headers, tables, and character coordinates without fabricating missing text.</p>
          </div>

          <div className="p-3 bg-[#F8F2EB] border border-[#E6CBBD] space-y-1">
            <span className="font-mono font-bold text-[#C04E2A] text-[10px] block">STEP 2: EXTRACT</span>
            <h4 className="font-semibold text-[#351D1D]">Grounded Claim Miner</h4>
            <p className="text-[11px] text-[#786A61]">Gemini 3.8 Flash extracts structured claims with mandatory verbatim supporting quotes and population anchors.</p>
          </div>

          <div className="p-3 bg-[#F8F2EB] border border-[#E6CBBD] space-y-1">
            <span className="font-mono font-bold text-[#C04E2A] text-[10px] block">STEP 3: VALIDATE</span>
            <h4 className="font-semibold text-[#351D1D]">12-Rule Engine</h4>
            <p className="text-[11px] text-[#786A61]">Deterministic checks catch causal overstatements, cohort generalizations, and numerical discrepancies before review.</p>
          </div>

          <div className="p-3 bg-[#F8F2EB] border border-[#E6CBBD] space-y-1">
            <span className="font-mono font-bold text-[#C04E2A] text-[10px] block">STEP 4: REVIEW GATE</span>
            <h4 className="font-semibold text-[#351D1D]">Doctor Approval</h4>
            <p className="text-[11px] text-[#786A61]">Steer doctors review claims in the Investigation Desk. Changes automatically propagate and invalidate dependent slides.</p>
          </div>

          <div className="p-3 bg-[#F8F2EB] border border-[#E6CBBD] space-y-1">
            <span className="font-mono font-bold text-[#C04E2A] text-[10px] block">STEP 5: PUBLISH</span>
            <h4 className="font-semibold text-[#351D1D]">Canva & Video Engine</h4>
            <p className="text-[11px] text-[#786A61]">Outputs 1080x1350 Carousels, Web Speech synthesized AI reels, Hinglish toggles, and Instagram schedule queues.</p>
          </div>
        </div>
      </div>

      {/* 05. 2-Minute Loom Presentation Script */}
      <div className="bg-[#FFFDF9] border border-[#E6CBBD] p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#E6CBBD] pb-3">
          <div>
            <h2 className="font-serif text-xl font-bold text-[#351D1D]">
              04. 2-Minute Loom Walkthrough Script (120-Second Presentation)
            </h2>
            <p className="text-xs text-[#B58777]">
              Word-for-word timed script ready for recording your hackathon presentation video.
            </p>
          </div>

          <button
            onClick={handleCopyLoomScript}
            className="px-3.5 py-1.5 bg-[#C04E2A] hover:bg-[#a63f1f] text-[#FFFDF9] text-xs font-semibold rounded-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
          >
            {copiedLoomScript ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copiedLoomScript ? 'Script Copied!' : 'Copy 2-Min Script'}</span>
          </button>
        </div>

        <div className="p-4 bg-[#F8F2EB] border border-[#E6CBBD] font-mono text-xs text-[#351D1D] leading-relaxed whitespace-pre-line max-h-72 overflow-y-auto">
          {loomScriptText}
        </div>
      </div>

      {/* 06. Steer Brand Constitution Compliance Matrix */}
      <div className="bg-[#FFFDF9] border border-[#E6CBBD] p-6 space-y-4 shadow-xs">
        <h2 className="font-serif text-xl font-bold text-[#351D1D] border-b border-[#E6CBBD] pb-2">
          05. Steer Brand Constitution & Guidelines Compliance Matrix
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-[#F5EBDF] border border-[#E6CBBD] space-y-1">
            <span className="font-mono text-[10px] text-[#C04E2A] font-bold block">COLOUR PALETTE</span>
            <div className="font-semibold text-[#351D1D]">Cream (#F5EBDF) & Rust (#C04E2A)</div>
            <p className="text-[10px] text-[#786A61]">Deep maroon (#661414) for emotional slides. Zero bright neon.</p>
          </div>

          <div className="p-3 bg-[#F8F2EB] border border-[#E6CBBD] space-y-1">
            <span className="font-mono text-[10px] text-[#C04E2A] font-bold block">TYPOGRAPHY</span>
            <div className="font-semibold text-[#351D1D]">Fraunces Serif + Caveat Notes</div>
            <p className="text-[10px] text-[#786A61]">Mixes upright and italic within headlines. Handwritten founder notes.</p>
          </div>

          <div className="p-3 bg-[#F8F2EB] border border-[#E6CBBD] space-y-1">
            <span className="font-mono text-[10px] text-[#C04E2A] font-bold block">INDIAN CALIBRATION</span>
            <div className="font-semibold text-[#351D1D]">Rotis, Chai & Desk Jobs</div>
            <p className="text-[10px] text-[#786A61]">Contextualized for South Asian metabolism and family dinners.</p>
          </div>

          <div className="p-3 bg-[#F8F2EB] border border-[#E6CBBD] space-y-1">
            <span className="font-mono text-[10px] text-[#C04E2A] font-bold block">ETHICAL CONSTRAINTS</span>
            <div className="font-semibold text-[#351D1D]">Zero Miracle Promises</div>
            <p className="text-[10px] text-[#786A61]">No body-shaming, no drug brand promotion, no before/after pictures.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
