import { useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  FileSearch,
  Link2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react';
import './IntroExperience.css';

const workflowSteps = [
  {
    number: '01',
    label: 'Start with the source',
    description: 'Bring the research into a workspace built around its original context.',
    icon: FileSearch,
    marker: 'SOURCE IN CONTEXT',
  },
  {
    number: '02',
    label: 'Keep every claim connected',
    description: 'Trace draft language back to the exact passage and page it came from.',
    icon: Link2,
    marker: 'CLAIM ↔ PASSAGE',
  },
  {
    number: '03',
    label: 'Let people make the call',
    description: 'AI can help with a first draft. A clinician decides what earns approval.',
    icon: ShieldCheck,
    marker: 'HUMAN REVIEW',
  },
  {
    number: '04',
    label: 'Share the story, not the guesswork',
    description: 'Shape clear health content with the evidence trail still close at hand.',
    icon: BookOpen,
    marker: 'READY TO SHARE',
  },
];

export function IntroExperience({ onEnter }: { onEnter: () => void }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const storyRef = useRef<HTMLElement>(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const reduceMotion = useReducedMotion() ?? false;
  const { scrollYProgress } = useScroll({
    container: scrollContainerRef,
    target: storyRef,
    offset: ['start start', 'end end'],
  });

  const sceneRotateY = useTransform(
    scrollYProgress,
    [0, 0.33, 0.66, 1],
    reduceMotion ? [0, 0, 0, 0] : [-10, -4, 4, 10],
  );
  const sceneRotateX = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    reduceMotion ? [0, 0, 0] : [5, 0, -5],
  );
  const sceneLift = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    reduceMotion ? [0, 0, 0] : [14, -3, 14],
  );
  const orbitRotate = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion ? [0, 0] : [-16, 28],
  );
  const progressScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  useMotionValueEvent(scrollYProgress, 'change', (progress) => {
    const nextStep = Math.min(
      workflowSteps.length - 1,
      Math.floor(progress * workflowSteps.length),
    );
    setActiveStepIndex((currentStep) => currentStep === nextStep ? currentStep : nextStep);
  });

  const activeStep = workflowSteps[activeStepIndex];
  const ActiveIcon = activeStep.icon;

  return (
    <main
      ref={scrollContainerRef}
      className="motiva-intro-scroll"
      aria-label="MOTIVA product introduction"
      tabIndex={0}
    >
      <section ref={storyRef} className="motiva-intro-story" aria-labelledby="motiva-intro-title">
        <div className="motiva-intro-stage">
          <div className="motiva-intro-grid" aria-hidden="true" />
          <div className="motiva-intro-ambient motiva-intro-ambient-one" aria-hidden="true" />
          <div className="motiva-intro-ambient motiva-intro-ambient-two" aria-hidden="true" />

          <header className="motiva-intro-header">
            <a className="motiva-intro-brand" href="#motiva-intro-title" aria-label="MOTIVA introduction">
              <span className="motiva-intro-brand-mark">m</span>
              <span className="motiva-intro-brand-name">MOTIVA</span>
              <span className="motiva-intro-brand-divider" />
              <span className="motiva-intro-brand-context">Evidence to impact</span>
            </a>
            <button className="motiva-intro-enter" type="button" onClick={onEnter}>
              Enter workspace <ArrowUpRight size={15} aria-hidden="true" />
            </button>
          </header>

          <div className="motiva-intro-content">
            <div className="motiva-intro-copy">
              <div className="motiva-intro-eyebrow">
                <span className="motiva-intro-eyebrow-dot" />
                Evidence-first health communication
              </div>
              <h1 id="motiva-intro-title">Make evidence travel with the story.</h1>
              <p className="motiva-intro-lede">
                Health research is hard to communicate without losing context. MOTIVA keeps
                every draft claim connected to its source—and publication behind human review.
              </p>

              <div className="motiva-intro-step" aria-live="polite">
                <div className="motiva-intro-step-icon">
                  <ActiveIcon size={17} aria-hidden="true" />
                </div>
                <div className="motiva-intro-step-copy">
                  <div className="motiva-intro-step-kicker">
                    <span>{activeStep.number}</span>
                    <span className="motiva-intro-step-rule" />
                    <span>{activeStep.marker}</span>
                  </div>
                  <h2>{activeStep.label}</h2>
                  <p>{activeStep.description}</p>
                </div>
              </div>
            </div>

            <div className="motiva-intro-art-wrap" aria-hidden="true">
              <div className="motiva-intro-orbit motiva-intro-orbit-outer" />
              <div className="motiva-intro-orbit motiva-intro-orbit-inner" />
              <motion.div className="motiva-intro-orbit-core" style={{ rotate: orbitRotate }} />
              <motion.div
                className="motiva-intro-art"
                style={{ rotateX: sceneRotateX, rotateY: sceneRotateY, y: sceneLift }}
              >
                <div className="motiva-intro-paper-shadow" />
                <div className="motiva-intro-paper-back" />
                <article className="motiva-intro-paper">
                  <div className="motiva-intro-paper-head">
                    <div className="motiva-intro-paper-kicker"><BookOpen size={12} /> RESEARCH SOURCE</div>
                    <span className="motiva-intro-paper-pages">PDF · 18 PAGES</span>
                  </div>
                  <div className="motiva-intro-paper-title-lines">
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className="motiva-intro-paper-section">ABSTRACT · PAGE 04</div>
                  <div className="motiva-intro-paper-body-lines">
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className="motiva-intro-highlight">
                    <span />
                    <span />
                  </div>
                  <div className="motiva-intro-paper-foot">
                    <span>Passage linked</span>
                    <span className="motiva-intro-paper-foot-dot"><Check size={10} /></span>
                  </div>
                </article>

                <motion.div className="motiva-intro-float-card motiva-intro-citation" style={{ y: sceneLift }}>
                  <span className="motiva-intro-float-icon"><FileSearch size={15} /></span>
                  <span><strong>Exact passage</strong><small>Page and context retained</small></span>
                </motion.div>
                <motion.div className="motiva-intro-float-card motiva-intro-claim" style={{ y: sceneLift }}>
                  <span className="motiva-intro-float-icon"><Link2 size={15} /></span>
                  <span><strong>Draft claim</strong><small>Source-linked · needs review</small></span>
                  <span className="motiva-intro-review-dot" />
                </motion.div>
                <div className="motiva-intro-review-stamp">
                  <ShieldCheck size={14} /> Human review
                </div>
              </motion.div>
              <div className="motiva-intro-art-caption">
                <Sparkles size={12} /> Illustrative workflow · no clinical results shown
              </div>
            </div>
          </div>

          <footer className="motiva-intro-footer">
            <div className="motiva-intro-progress-wrap">
              <div
                className="motiva-intro-progress-track"
                role="progressbar"
                aria-label="Introduction progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(activeStepIndex * 100 / (workflowSteps.length - 1))}
              >
                <motion.span className="motiva-intro-progress-fill" style={{ scaleX: progressScale }} />
              </div>
              <span className="motiva-intro-progress-count">{activeStep.number} <span>/ 04</span></span>
            </div>
            <div className="motiva-intro-scroll-cue">
              <span>Scroll to follow the evidence</span>
              <ArrowDown size={14} aria-hidden="true" />
            </div>
            <button className="motiva-intro-footer-enter" type="button" onClick={onEnter}>
              Open MOTIVA <ArrowRight size={15} aria-hidden="true" />
            </button>
          </footer>
        </div>
      </section>
    </main>
  );
}
