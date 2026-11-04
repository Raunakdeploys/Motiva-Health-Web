import { CarouselSlide, EvidenceAuditReport, ReelScene, StaticPostContent } from '../types';
import { authenticatedApiFetch } from './sqlApiClient';

/**
 * Downloads a text or JSON file as a real Blob
 */
export function downloadJsonFile(filename: string, data: any) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Renders a MOTIVA Editorial Static Post to an HTML5 Canvas and downloads as PNG
 */
export async function downloadStaticPostPng(post: StaticPostContent, filename = 'motiva-static-post.png') {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background: Soft paper #F8F2EB
  ctx.fillStyle = '#F8F2EB';
  ctx.fillRect(0, 0, 1080, 1080);

  // Subtle margin border
  ctx.strokeStyle = 'rgba(53, 29, 29, 0.12)';
  ctx.lineWidth = 2;
  ctx.strokeRect(60, 60, 960, 960);

  // Top header: Wordmark
  ctx.fillStyle = '#661414'; // Deep maroon
  ctx.font = 'bold 32px "DM Sans", sans-serif';
  ctx.fillText('MOTIVA', 100, 140);

  ctx.fillStyle = '#C04E2A'; // Rust
  ctx.font = '600 18px "DM Sans", sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText('EVIDENCE STUDIO · RESEARCH BRIEF', 210, 138);

  // Divider line
  ctx.strokeStyle = 'rgba(53, 29, 29, 0.15)';
  ctx.beginPath();
  ctx.moveTo(100, 170);
  ctx.lineTo(980, 170);
  ctx.stroke();

  // Primary Headline
  ctx.fillStyle = '#351D1D'; // Ink
  ctx.font = 'italic 700 64px "Instrument Serif", Georgia, serif';
  wrapText(ctx, post.headline, 100, 260, 880, 76);

  // Primary Finding Box
  ctx.fillStyle = '#F5EBDF'; // Cream
  ctx.fillRect(100, 420, 880, 200);
  ctx.strokeStyle = '#B58777'; // Clay
  ctx.lineWidth = 1;
  ctx.strokeRect(100, 420, 880, 200);

  ctx.fillStyle = '#C04E2A';
  ctx.font = '600 20px "DM Sans", sans-serif';
  ctx.fillText('KEY MEASURED FINDING', 140, 465);

  ctx.fillStyle = '#351D1D';
  ctx.font = '600 36px "DM Sans", sans-serif';
  wrapText(ctx, post.primary_finding, 140, 520, 800, 46);

  // Supporting Context
  ctx.fillStyle = '#351D1D';
  ctx.font = '400 26px "DM Sans", sans-serif';
  wrapText(ctx, post.supporting_text, 100, 670, 880, 38);

  // Qualification / Limitation
  ctx.fillStyle = '#661414';
  ctx.font = 'italic 500 22px "Instrument Serif", Georgia, serif';
  wrapText(ctx, `Caveat: ${post.qualification}`, 100, 810, 880, 32);

  // Bottom Footer / Citation
  ctx.strokeStyle = 'rgba(53, 29, 29, 0.15)';
  ctx.beginPath();
  ctx.moveTo(100, 910);
  ctx.lineTo(980, 910);
  ctx.stroke();

  ctx.fillStyle = '#8B6A60';
  ctx.font = '400 18px "JetBrains Mono", monospace';
  wrapText(ctx, `SOURCE: ${post.source_note}`, 100, 950, 880, 24);

  // Export to Blob and download
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/png');
}

/**
 * Renders a single carousel slide to Canvas and returns Data URL or Blob
 */
export async function downloadCarouselSlidePng(
  slide: CarouselSlide,
  slideIndex: number,
  totalSlides: number,
  paperTitle: string,
  filename?: string
) {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background
  ctx.fillStyle = slide.layout === 'cover' ? '#F5EBDF' : '#F8F2EB';
  ctx.fillRect(0, 0, 1080, 1080);

  // Border
  ctx.strokeStyle = 'rgba(53, 29, 29, 0.12)';
  ctx.lineWidth = 2;
  ctx.strokeRect(60, 60, 960, 960);

  // Top Header
  ctx.fillStyle = '#661414';
  ctx.font = 'bold 30px "DM Sans", sans-serif';
  ctx.fillText('MOTIVA', 100, 140);

  ctx.fillStyle = '#8B6A60';
  ctx.font = '500 20px "DM Sans", sans-serif';
  ctx.fillText(`SLIDE ${slideIndex + 1} OF ${totalSlides}`, 820, 140);

  ctx.strokeStyle = 'rgba(53, 29, 29, 0.12)';
  ctx.beginPath();
  ctx.moveTo(100, 170);
  ctx.lineTo(980, 170);
  ctx.stroke();

  // Slide Layout rendering
  if (slide.layout === 'cover') {
    ctx.fillStyle = '#C04E2A';
    ctx.font = '600 20px "DM Sans", sans-serif';
    ctx.fillText('HEALTH EVIDENCE BRIEF', 100, 270);

    ctx.fillStyle = '#351D1D';
    ctx.font = 'italic 700 70px "Instrument Serif", Georgia, serif';
    wrapText(ctx, slide.headline, 100, 360, 880, 84);

    ctx.fillStyle = '#553636';
    ctx.font = '400 30px "DM Sans", sans-serif';
    wrapText(ctx, slide.body_text, 100, 680, 880, 46);
  } else if (slide.layout === 'finding_caveat') {
    ctx.fillStyle = '#351D1D';
    ctx.font = '700 52px "Instrument Serif", Georgia, serif';
    wrapText(ctx, slide.headline, 100, 260, 880, 64);

    // Finding card
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(100, 380, 880, 240);
    ctx.strokeStyle = '#E6CBBD';
    ctx.strokeRect(100, 380, 880, 240);

    ctx.fillStyle = '#C04E2A';
    ctx.font = '600 20px "DM Sans", sans-serif';
    ctx.fillText('EMPIRICAL FINDING', 140, 430);

    ctx.fillStyle = '#351D1D';
    ctx.font = '400 28px "DM Sans", sans-serif';
    wrapText(ctx, slide.finding || slide.body_text, 140, 480, 800, 40);

    // Caveat box
    if (slide.caveat_or_limitation) {
      ctx.fillStyle = '#F5EBDF';
      ctx.fillRect(100, 660, 880, 180);
      ctx.strokeStyle = '#B58777';
      ctx.strokeRect(100, 660, 880, 180);

      ctx.fillStyle = '#661414';
      ctx.font = '600 18px "DM Sans", sans-serif';
      ctx.fillText('CRITICAL CAVEAT / LIMITATION', 140, 705);

      ctx.fillStyle = '#351D1D';
      ctx.font = 'italic 400 24px "Instrument Serif", Georgia, serif';
      wrapText(ctx, slide.caveat_or_limitation, 140, 750, 800, 34);
    }
  } else {
    // Takeaway or source
    ctx.fillStyle = '#351D1D';
    ctx.font = '700 56px "Instrument Serif", Georgia, serif';
    wrapText(ctx, slide.headline, 100, 280, 880, 68);

    ctx.fillStyle = '#351D1D';
    ctx.font = '400 30px "DM Sans", sans-serif';
    wrapText(ctx, slide.body_text, 100, 460, 880, 44);

    if (slide.source_citation) {
      ctx.fillStyle = '#8B6A60';
      ctx.font = '400 20px "JetBrains Mono", monospace';
      wrapText(ctx, `SOURCE: ${slide.source_citation}`, 100, 740, 880, 30);
    }
  }

  // Footer
  ctx.strokeStyle = 'rgba(53, 29, 29, 0.12)';
  ctx.beginPath();
  ctx.moveTo(100, 930);
  ctx.lineTo(980, 930);
  ctx.stroke();

  ctx.fillStyle = '#8B6A60';
  ctx.font = '400 18px "DM Sans", sans-serif';
  ctx.fillText('Swipe for evidence audit · MOTIVA / Evidence Studio', 100, 970);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `motiva-carousel-slide-${slideIndex + 1}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/png');
}

/**
 * HTML5 Canvas + MediaRecorder vertical video generator
 * Records scenes sequentially and provides WebM download
 */
/**
 * Renders Reel Video with resilient dual-engine execution:
 * 1. Attempts client-side HTML5 Canvas + MediaRecorder
 * 2. Seamlessly falls back to server-side FFmpeg high-definition video synthesis
 */
export async function recordReelVideo(
  scenes: ReelScene[],
  onProgress: (percent: number, statusText: string) => void
): Promise<Blob> {
  const width = 720;
  const height = 1280; // Standard 9:16 mobile vertical canvas

  // First try client-side canvas capture if supported
  const hasCaptureStream = typeof HTMLCanvasElement !== 'undefined' && 
    (HTMLCanvasElement.prototype as any).captureStream;

  if (typeof MediaRecorder !== 'undefined' && hasCaptureStream) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not initialize 2D context.');

      // Render initial frame first so stream track acquires valid geometry
      if (scenes.length > 0) {
        drawReelFrame(ctx, width, height, scenes[0], 1, scenes.length, 0, scenes[0].duration_sec || 5);
      }

      const stream = (canvas as any).captureStream(20);
      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
          mimeType = 'video/webm;codecs=vp8';
        } else if (MediaRecorder.isTypeSupported('video/webm')) {
          mimeType = 'video/webm';
        } else if (MediaRecorder.isTypeSupported('video/mp4')) {
          mimeType = 'video/mp4';
        } else {
          mimeType = '';
        }
      }

      const options: MediaRecorderOptions = mimeType ? { mimeType, videoBitsPerSecond: 2500000 } : {};
      const recorder = new MediaRecorder(stream, options);
      const recordedChunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunks.push(e.data);
        }
      };

      const clientBlob = await new Promise<Blob>((resolve, reject) => {
        recorder.onstop = () => {
          const outputType = mimeType || 'video/webm';
          const videoBlob = new Blob(recordedChunks, { type: outputType });
          if (videoBlob.size > 1024) {
            resolve(videoBlob);
          } else {
            reject(new Error('Recorded video buffer empty'));
          }
        };
        recorder.onerror = (e) => reject(e);

        recorder.start(100);

        const totalDurationSec = scenes.reduce((sum, s) => sum + (s.duration_sec || 5), 0);
        let elapsedSec = 0;
        const fps = 20;

        (async () => {
          try {
            for (let sIdx = 0; sIdx < scenes.length; sIdx++) {
              const scene = scenes[sIdx];
              const sceneDuration = scene.duration_sec || 5;
              const totalFrames = Math.max(3, Math.round(sceneDuration * fps));

              for (let frame = 0; frame < totalFrames; frame++) {
                const frameTime = frame / fps;
                const currentTotalSec = elapsedSec + frameTime;
                const progress = Math.min(95, Math.round((currentTotalSec / totalDurationSec) * 100));

                onProgress(
                  progress,
                  `Rendering Scene ${sIdx + 1}/${scenes.length} (${Math.round(currentTotalSec)}s / ${totalDurationSec}s)...`
                );

                drawReelFrame(ctx, width, height, scene, sIdx + 1, scenes.length, frameTime, sceneDuration);
                await new Promise((r) => setTimeout(r, 20));
              }

              elapsedSec += sceneDuration;
            }

            onProgress(98, 'Finalizing video stream...');
            try {
              if (recorder.state !== 'inactive') {
                recorder.requestData();
              }
            } catch {}
            setTimeout(() => {
              if (recorder.state !== 'inactive') {
                recorder.stop();
              }
            }, 100);
          } catch (animErr) {
            reject(animErr);
          }
        })();
      });

      if (clientBlob && clientBlob.size > 1024) {
        onProgress(100, 'Reel video successfully generated!');
        return clientBlob;
      }
    } catch (clientErr) {
      console.warn('Client-side MediaRecorder notice, switching to MOTIVA Server Video Engine:', clientErr);
    }
  }

  // Fallback to Server Video Engine
  onProgress(50, 'Synthesizing with MOTIVA Server Video Engine...');
  const res = await authenticatedApiFetch('/api/render-reel-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenes, reelId: `reel_${Date.now()}` }),
  });

  const data = await res.json();
  if (!res.ok || !data.videoUri) {
    throw new Error(data.error || 'Server video rendering failed');
  }

  onProgress(90, 'Downloading generated MP4 video stream...');
  const videoStreamRes = await fetch(data.videoUri);
  const serverBlob = await videoStreamRes.blob();
  onProgress(100, 'Video ready for preview & download!');
  return serverBlob;
}

function drawReelFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scene: ReelScene,
  sceneNum: number,
  totalScenes: number,
  timeInScene: number,
  duration: number
) {
  // Clear
  ctx.fillStyle = '#F8F2EB';
  ctx.fillRect(0, 0, width, height);

  // Subtle background grain or border
  ctx.strokeStyle = 'rgba(53, 29, 29, 0.15)';
  ctx.lineWidth = 2;
  ctx.strokeRect(30, 30, width - 60, height - 60);

  // Top header brand
  ctx.fillStyle = '#661414';
  ctx.font = 'bold 28px "DM Sans", sans-serif';
  ctx.fillText('MOTIVA', 60, 90);

  ctx.fillStyle = '#C04E2A';
  ctx.font = '600 16px "DM Sans", sans-serif';
  ctx.fillText('EVIDENCE STUDIO', 150, 88);

  // Scene indicator
  ctx.fillStyle = '#8B6A60';
  ctx.font = '500 16px "JetBrains Mono", monospace';
  ctx.fillText(`SCENE ${sceneNum}/${totalScenes}`, width - 180, 88);

  // Progress bar top
  const sceneProgress = timeInScene / duration;
  ctx.fillStyle = 'rgba(53, 29, 29, 0.1)';
  ctx.fillRect(60, 115, width - 120, 4);
  ctx.fillStyle = '#C04E2A';
  ctx.fillRect(60, 115, (width - 120) * sceneProgress, 4);

  // Scene title
  ctx.fillStyle = '#8B6A60';
  ctx.font = '600 18px "DM Sans", sans-serif';
  const displayTitle = (scene.title || scene.on_screen_text || `SCENE ${sceneNum}`).toUpperCase();
  ctx.fillText(displayTitle, 60, 220);

  // Primary on-screen text
  ctx.fillStyle = '#351D1D';
  ctx.font = 'italic 700 46px "Instrument Serif", Georgia, serif';
  wrapText(ctx, scene.on_screen_text, 60, 300, width - 120, 60);

  // Center visual card
  ctx.fillStyle = '#F5EBDF';
  ctx.fillRect(60, 560, width - 120, 280);
  ctx.strokeStyle = '#B58777';
  ctx.strokeRect(60, 560, width - 120, 280);

  ctx.fillStyle = '#661414';
  ctx.font = '600 18px "DM Sans", sans-serif';
  ctx.fillText('VOICEOVER / SCRIPT CUE', 90, 610);

  ctx.fillStyle = '#351D1D';
  ctx.font = '400 22px "DM Sans", sans-serif';
  wrapText(ctx, `"${scene.voiceover_script}"`, 90, 660, width - 180, 34);

  // Subtitle banner at bottom
  ctx.fillStyle = '#351D1D';
  ctx.fillRect(60, 940, width - 120, 150);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '600 22px "DM Sans", sans-serif';
  wrapText(ctx, scene.subtitle_text, 90, 1000, width - 180, 32);

  // Disclaimer bottom
  ctx.fillStyle = '#8B6A60';
  ctx.font = '400 14px "DM Sans", sans-serif';
  ctx.fillText('Evidence-backed health reporting · human review required', 60, 1170);
}

/**
 * Text wrapper helper for canvas
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(' ');
  let line = '';
  let curY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, curY);
      line = words[n] + ' ';
      curY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, curY);
}
