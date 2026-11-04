import React, { useState } from 'react';
import { ScheduledPost } from '../types';
import {
  Calendar,
  Clock,
  Download,
  Check,
  Layers,
  FileText,
  Video,
  ArrowRight,
} from 'lucide-react';

interface PostSchedulerProps {
  scheduledPosts: ScheduledPost[];
  onNavigateToStudio: (deliverableType: 'carousel' | 'static' | 'reel', paperId?: string) => void;
}

export const PostScheduler: React.FC<PostSchedulerProps> = ({
  scheduledPosts,
  onNavigateToStudio,
}) => {
  const [filterFormat, setFilterFormat] = useState<'ALL' | 'CAROUSEL' | 'STATIC' | 'REEL'>('ALL');
  const [copiedBuffer, setCopiedBuffer] = useState(false);

  const filteredPosts = scheduledPosts.filter(
    (p) => filterFormat === 'ALL' || p.format === filterFormat
  );
  const draftCount = scheduledPosts.filter((post) => post.status === 'DRAFT').length;
  const scheduledCount = scheduledPosts.filter((post) => post.status === 'SCHEDULED').length;
  const formatCount = new Set(scheduledPosts.map((post) => post.format)).size;

  const handleExportBufferJson = () => {
    const payload = {
      export_type: 'draft_editorial_plan',
      generated_at: new Date().toISOString(),
      queue: scheduledPosts.map((post) => ({
        post_id: post.id,
        planned_time_utc: post.scheduled_for,
        slot_label: post.slot_label,
        type: post.format.toLowerCase(),
        hook_headline: post.hook,
        caption: post.caption,
        hashtags: post.hashtags,
        language: post.language,
        review_status: post.status,
        compliance_check: post.status === 'DOCTOR_APPROVED' ? 'DOCTOR_APPROVED' : 'REVIEW_REQUIRED',
      })),
      publishing_note: 'Export only. No social platform is connected and nothing was published.',
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'MOTIVA_editorial_plan.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);

    setCopiedBuffer(true);
    setTimeout(() => setCopiedBuffer(false), 2500);
  };

  return (
    <div className="max-w-[1360px] mx-auto p-4 sm:p-6 md:p-8 space-y-6">
      {/* 01. Desk Header */}
      <div className="bg-[#FFFDF9] border border-[#E6CBBD] p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#C04E2A] font-bold">
              PLANNING ONLY · MANUAL PUBLISHING
            </span>
            <span className="px-2 py-0.5 bg-[#416C49]/10 text-[#416C49] text-[10px] font-mono font-semibold rounded-xs">
              Draft plan
            </span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#351D1D]">
            Editorial plan
          </h2>
          <p className="text-xs text-[#B58777] max-w-2xl leading-relaxed">
            Organize reviewed drafts here. This calendar is a planning tool only: it does not connect to or publish on Instagram.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <p className="max-w-48 text-right text-[11px] leading-relaxed text-[#786A61]">
            Add items manually after clinical and editorial review.
          </p>

          <button
            onClick={handleExportBufferJson}
            disabled={scheduledPosts.length === 0}
            className="px-3.5 py-2.5 bg-[#FFFDF9] hover:bg-[#F8F2EB] border border-[#E6CBBD] text-xs font-medium text-[#351D1D] rounded-xs flex items-center gap-1.5 cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {copiedBuffer ? (
              <Check className="w-3.5 h-3.5 text-[#416C49]" />
            ) : (
              <Download className="w-3.5 h-3.5 text-[#C04E2A]" />
            )}
            <span>{copiedBuffer ? 'Exported' : 'Export plan JSON'}</span>
          </button>
        </div>
      </div>

      {/* 02. Cadence & Pipeline Metrics Bar */}
      <div className="motiva-calendar-metrics grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#FFFDF9] border border-[#E6CBBD] p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase text-[#B58777] block">Planned items</span>
          <div className="text-xl font-serif font-bold text-[#351D1D]">{scheduledPosts.length} items</div>
          <p className="text-[10px] text-[#B58777]">{scheduledCount} scheduled · {draftCount} draft</p>
        </div>

        <div className="bg-[#FFFDF9] border border-[#E6CBBD] p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase text-[#B58777] block">Formats in plan</span>
          <div className="text-xl font-serif font-bold text-[#C04E2A]">{formatCount} formats</div>
          <p className="text-[10px] text-[#B58777]">Carousel · static · reel</p>
        </div>

        <div className="bg-[#FFFDF9] border border-[#E6CBBD] p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase text-[#B58777] block">Review queue</span>
          <div className="text-xl font-serif font-bold text-[#416C49]">{draftCount} drafts</div>
          <p className="text-[10px] text-[#B58777]">Human review still required</p>
        </div>

        <div className="bg-[#FFFDF9] border border-[#E6CBBD] p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase text-[#B58777] block">Publishing</span>
          <div className="text-xl font-serif font-bold text-[#661414]">Manual only</div>
          <p className="text-[10px] text-[#B58777]">No social account connected</p>
        </div>
      </div>

      {/* 03. Format Filter Bar */}
      <div className="flex items-center justify-between border-b border-[#E6CBBD] pb-2 text-xs font-mono">
        <div className="flex items-center gap-1">
          <span className="text-[#B58777] uppercase text-[10px] font-semibold mr-2">Filter Format:</span>
          {(['ALL', 'CAROUSEL', 'REEL', 'STATIC'] as const).map((fmt) => (
            <button
              key={fmt}
              onClick={() => setFilterFormat(fmt)}
              aria-pressed={filterFormat === fmt}
              className={`px-3 py-1 rounded-xs transition-colors cursor-pointer ${
                filterFormat === fmt
                  ? 'bg-[#C04E2A] text-[#FFFDF9] font-bold'
                  : 'bg-[#FFFDF9] text-[#786A61] border border-[#E6CBBD] hover:bg-[#F8F2EB]'
              }`}
            >
              {fmt}
            </button>
          ))}
        </div>

        <span className="text-[10px] text-[#B58777]">
          Showing {filteredPosts.length} of {scheduledPosts.length} planned items
        </span>
      </div>

      {/* 04. Editorial plan queue */}
      {filteredPosts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 border border-dashed border-[#E6CBBD] bg-[#FFFDF9] px-6 py-12 text-center">
          <Calendar className="size-6 text-[#B58777]" aria-hidden="true" />
          <h3 className="font-serif text-lg font-bold text-[#351D1D]">No planned posts yet</h3>
          <p className="max-w-md text-xs leading-relaxed text-[#786A61]">
            Review and approve source-linked claims, create a content draft in Studio, then add it to this manual plan.
          </p>
        </div>
      ) : (
      <div className="space-y-3">
        {filteredPosts.map((post, idx) => {
          const isCarousel = post.format === 'CAROUSEL';
          const isReel = post.format === 'REEL';
          const isStatic = post.format === 'STATIC';

          return (
            <div
              key={post.id}
              className="motiva-calendar-entry bg-[#FFFDF9] border border-[#E6CBBD] p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-[#C04E2A] transition-colors shadow-xs"
            >
              {/* Left: Time & Format Badge */}
              <div className="flex items-start gap-4">
                <div className="motiva-calendar-day-index w-12 h-12 bg-[#F8F2EB] border border-[#E6CBBD] flex flex-col items-center justify-center shrink-0">
                  <span className="text-[10px] font-mono text-[#B58777] uppercase font-bold">
                    DAY
                  </span>
                  <span className="text-lg font-serif font-bold text-[#661414]">
                    0{idx + 1}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono text-[#B58777] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#C04E2A]" />
                      {post.slot_label}
                    </span>

                    <span
                      className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded-xs flex items-center gap-1 ${
                        isCarousel
                          ? 'bg-[#661414]/10 text-[#661414]'
                          : isReel
                          ? 'bg-[#C04E2A]/10 text-[#C04E2A]'
                          : 'bg-[#416C49]/10 text-[#416C49]'
                      }`}
                    >
                      {isCarousel && <Layers className="w-2.5 h-2.5" />}
                      {isReel && <Video className="w-2.5 h-2.5" />}
                      {isStatic && <FileText className="w-2.5 h-2.5" />}
                      {post.format}
                    </span>

                    <span className="text-[9px] font-mono bg-[#E6CBBD]/50 text-[#351D1D] px-1.5 py-0.5 rounded-xs">
                      {post.language}
                    </span>

                    <span className={`text-[9px] font-mono flex items-center gap-0.5 font-semibold ${post.status === 'DRAFT' ? 'text-amber-900' : 'text-[#416C49]'}`}>
                      <Clock className="size-2.5" aria-hidden="true" />
                      {post.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <h3 className="font-serif text-base font-bold text-[#351D1D] leading-snug">
                    "{post.hook}"
                  </h3>

                  <p className="text-xs text-[#786A61] leading-relaxed break-words">
                    Source Paper: {post.paper_title}
                  </p>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#E6CBBD]">
                <button
                  onClick={() =>
                    onNavigateToStudio(
                      isCarousel ? 'carousel' : isReel ? 'reel' : 'static',
                      post.paper_id
                    )
                  }
                  className="px-3 py-1.5 bg-[#F8F2EB] hover:bg-[#E6CBBD]/40 border border-[#E6CBBD] text-xs font-semibold text-[#351D1D] rounded-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <span>Open in Studio</span>
                  <ArrowRight className="w-3 h-3 text-[#C04E2A]" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};
