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
"MOTIVA is a prototype for helping research teams keep source evidence visible as candidate claims move toward draft content. The goal is to reduce repetitive work without replacing expert review."

[0:25 - 0:55] THE PIPELINE IN ACTION
"The bundled benchmark is synthetic. It demonstrates how passages can be linked to claims and how deterministic checks can flag missing quotes, mismatched populations, or overreach. Passing a rule check is not proof that a claim is true."

[0:55 - 1:25] ILLUSTRATIVE FORMATS
"This packet shows example carousel, static, and reel formats to demonstrate the workflow. They are not clinically reviewed outputs, medical advice, or content that should be published. A real workflow must retain its source citations and limitations."

[1:25 - 1:45] THE HUMAN REVIEW GATE
"A qualified human reviewer remains responsible for each decision. Reviewers can approve, flag, edit, or reject a claim; edits require downstream content to be checked again before use."

[1:45 - 2:00] THE OUTCOME
"The prototype includes a publishing calendar and export interactions. Model reliability, production readiness, and time savings have not been evaluated. Thank you!"`;

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
          `"${s.slide_number}","${s.layout}","${s.headline.replace(/"/g, '""')}","${s.body_text.replace(/"/g, '""')}","${(s.finding || '').replace(/"/g, '""')}","${(s.caveat_or_limitation || '').replace(/"/g, '""')}","${(s.source_citation || '').replace(/"/g, '""')}","MOTIVAclub.com"`
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
              Prototype walkthrough: from research to reviewed content
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-[#E6CBBD]">Candidate: Raunak Roy</span>
            <span>·</span>
            <span className="text-[#C04E2A] bg-[#F5EBDF] px-2 py-0.5 rounded-xs font-bold">
              Prototype Walkthrough
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F5EBDF]">
            MOTIVA / Evidence-to-Content Prototype
          </h1>
          <p className="text-xs sm:text-sm text-[#E6CBBD] max-w-3xl leading-relaxed">
            An evidence-linked workflow prototype for organizing source passages, checking candidate claims, and preparing drafts for qualified human review. This packet contains synthetic examples, not clinically approved content.
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-md border border-[#D9B66F] bg-[#FBF4E7] px-4 py-3 text-sm leading-relaxed text-[#5E4821]" role="note">
        Illustrative synthetic examples only. No clinician review or approval is represented; do not use these drafts as medical advice or publish them.
      </div>

      {/* 02. Illustrative format examples */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#E6CBBD] pb-2">
          <div>
            <h2 className="font-serif text-xl font-bold text-[#351D1D]">
              01. Illustrative content formats
            </h2>
            <p className="text-xs text-[#B58777]">
              Synthetic examples demonstrate the workflow; they are not evidence-backed or approved posts.
            </p>
          </div>
          <span className="text-[10px] font-mono text-[#C04E2A] bg-[#C04E2A]/10 px-2 py-1 rounded-xs font-bold">
            Sample content
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
                <span className="text-[10px] font-mono text-[#786A61] font-bold">Illustrative sample</span>
              </div>

              <h3 className="font-serif text-base font-bold text-[#351D1D]">
                "Example carousel: one study result with its caveat."
              </h3>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-[#F8F2EB] border border-[#E6CBBD] space-y-1">
                  <span className="text-[9px] font-mono uppercase text-[#B58777] font-bold block">
                    Illustrative message template
                  </span>
                  <p className="text-[#351D1D] font-medium leading-snug">
                    "Illustrative draft: summarize a study finding in plain language and link readers to its source."
                  </p>
                </div>

                <div className="p-2.5 bg-[#F8F2EB] border border-[#E6CBBD] space-y-1">
                  <span className="text-[9px] font-mono uppercase text-[#B58777] font-bold block">
                    Evidence note required
                  </span>
                  <p className="text-[#786A61] text-[11px] leading-snug">
                    Template only: attach the exact supporting passage, study population, endpoint, and limitations before review. This example is not sourced.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigateToStudio('carousel', 'paper_glp1_muscle_2024')}
              className="w-full py-2 bg-[#F8F2EB] hover:bg-[#E6CBBD]/40 border border-[#E6CBBD] text-xs font-semibold text-[#351D1D] rounded-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <span>View Sample Carousel</span>
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
                <span className="text-[10px] font-mono text-[#786A61] font-bold">Illustrative sample</span>
              </div>

              <h3 className="font-serif text-base font-bold text-[#351D1D]">
                "Example reel: explain a research finding without personal medical advice."
              </h3>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-[#F8F2EB] border border-[#E6CBBD] space-y-1">
                  <span className="text-[9px] font-mono uppercase text-[#B58777] font-bold block">
                    Illustrative message template
                  </span>
                  <p className="text-[#351D1D] font-medium leading-snug">
                    "Illustrative draft: describe only the population and outcome examined in the study."
                  </p>
                </div>

                <div className="p-2.5 bg-[#F8F2EB] border border-[#E6CBBD] space-y-1">
                  <span className="text-[9px] font-mono uppercase text-[#B58777] font-bold block">
                    Evidence note required
                  </span>
                  <p className="text-[#786A61] text-[11px] leading-snug">
                    Template only: verify the source, population, measurements, and caveats before drafting. Do not infer individual diagnosis or treatment advice.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigateToStudio('reel', 'paper_south_asian_phenotype_2024')}
              className="w-full py-2 bg-[#F8F2EB] hover:bg-[#E6CBBD]/40 border border-[#E6CBBD] text-xs font-semibold text-[#351D1D] rounded-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <span>View Sample Reel</span>
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
                <span className="text-[10px] font-mono text-[#786A61] font-bold">Illustrative sample</span>
              </div>

              <h3 className="font-serif text-base font-bold text-[#351D1D]">
                "Example static post: pair a study limitation with its finding."
              </h3>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-[#F8F2EB] border border-[#E6CBBD] space-y-1">
                  <span className="text-[9px] font-mono uppercase text-[#B58777] font-bold block">
                    Illustrative message template
                  </span>
                  <p className="text-[#351D1D] font-medium leading-snug">
                    "Illustrative draft: distinguish what a study observed from what it cannot establish."
                  </p>
                </div>

                <div className="p-2.5 bg-[#F8F2EB] border border-[#E6CBBD] space-y-1">
                  <span className="text-[9px] font-mono uppercase text-[#B58777] font-bold block">
                    Evidence note required
                  </span>
                  <p className="text-[#786A61] text-[11px] leading-snug">
                    Template only: cite the specific source and check its methods, timeframe, uncertainty, and limitations. This example is not sourced.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigateToStudio('static', 'paper_metabolic_adaptation_2024')}
              className="w-full py-2 bg-[#F8F2EB] hover:bg-[#E6CBBD]/40 border border-[#E6CBBD] text-xs font-semibold text-[#351D1D] rounded-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <span>View Sample Static Post</span>
              <ArrowRight className="w-3 h-3 text-[#C04E2A]" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-[#FFFDF9] border border-[#E6CBBD] p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#E6CBBD] pb-3 gap-3">
          <div>
            <h2 className="font-serif text-xl font-bold text-[#351D1D]">
              02. Human review stays in the loop
            </h2>
            <p className="text-xs text-[#B58777]">
              This prototype has not been measured for time savings or clinical outcomes; the sample carries no reviewer approval.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-[#315A49] bg-[#315A49]/10 px-2.5 py-1 rounded-xs">
            Human decision required
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="p-4 bg-[#F8F2EB] border border-[#E6CBBD] space-y-2">
            <h3 className="font-semibold text-[#351D1D]">Evidence checks</h3>
            <p className="text-[#786A61] leading-relaxed">
              Deterministic checks can surface missing source links, quote mismatches, and overgeneralization. A passing result is not proof that a claim is accurate.
            </p>
          </div>
          <div className="p-4 bg-[#315A49]/5 border border-[#315A49]/20 space-y-2">
            <h3 className="font-semibold text-[#351D1D]">Qualified human review</h3>
            <p className="text-[#786A61] leading-relaxed">
              A reviewer must inspect the source and context, then approve, flag, edit, or reject each claim. Re-check affected drafts after any upstream edit and before publication.
            </p>
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
              Conceptual flow from source evidence to reviewed content; publishing still requires human approval.
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
            <p className="text-[11px] text-[#786A61]">AI-assisted extraction proposes candidate claims and source quotes; a reviewer must confirm them against the paper.</p>
          </div>

          <div className="p-3 bg-[#F8F2EB] border border-[#E6CBBD] space-y-1">
            <span className="font-mono font-bold text-[#C04E2A] text-[10px] block">STEP 3: VALIDATE</span>
            <h4 className="font-semibold text-[#351D1D]">12-Rule Engine</h4>
            <p className="text-[11px] text-[#786A61]">Deterministic checks catch causal overstatements, cohort generalizations, and numerical discrepancies before review.</p>
          </div>

          <div className="p-3 bg-[#F8F2EB] border border-[#E6CBBD] space-y-1">
            <span className="font-mono font-bold text-[#C04E2A] text-[10px] block">STEP 4: REVIEW GATE</span>
              <h4 className="font-semibold text-[#351D1D]">Human Review</h4>
            <p className="text-[11px] text-[#786A61]">Qualified reviewers inspect claim evidence. Changes can invalidate dependent drafts, which must be reviewed again.</p>
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

      {/* 06. MOTIVA Brand Constitution Compliance Matrix */}
      <div className="bg-[#FFFDF9] border border-[#E6CBBD] p-6 space-y-4 shadow-xs">
        <h2 className="font-serif text-xl font-bold text-[#351D1D] border-b border-[#E6CBBD] pb-2">
          05. MOTIVA Brand Constitution & Guidelines Compliance Matrix
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-[#F5EBDF] border border-[#E6CBBD] space-y-1">
            <span className="font-mono text-[10px] text-[#C04E2A] font-bold block">COLOUR PALETTE</span>
            <div className="font-semibold text-[#351D1D]">Cream (#F5EBDF) & Rust (#C04E2A)</div>
            <p className="text-[10px] text-[#786A61]">Deep maroon (#661414) for emotional slides. Zero bright neon.</p>
          </div>

          <div className="p-3 bg-[#F8F2EB] border border-[#E6CBBD] space-y-1">
            <span className="font-mono text-[10px] text-[#C04E2A] font-bold block">TYPOGRAPHY</span>
            <div className="font-semibold text-[#351D1D]">Instrument Serif + DM Sans</div>
            <p className="text-[10px] text-[#786A61]">Mixes upright and italic within headlines. Handwritten founder notes.</p>
          </div>

          <div className="p-3 bg-[#F8F2EB] border border-[#E6CBBD] space-y-1">
            <span className="font-mono text-[10px] text-[#C04E2A] font-bold block">INDIAN CALIBRATION</span>
            <div className="font-semibold text-[#351D1D]">Rotis, Chai & Desk Jobs</div>
            <p className="text-[10px] text-[#786A61]">              Population context should follow the cited study; do not generalize across individuals.</p>
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
