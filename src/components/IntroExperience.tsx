import { useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  FileSearch,
  Fingerprint,
  Link2,
  ShieldCheck,
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
    artifact: 'Research source',
    artifactDetail: 'The original passage stays in view.',
    artifactState: 'PDF · PAGE 04',
  },
  {
    number: '02',
    label: 'Keep every claim connected',
    description: 'Trace draft language back to the exact passage and page it came from.',
    icon: Link2,
    marker: 'CLAIM ↔ PASSAGE',
    artifact: 'Draft claim',
    artifactDetail: 'Every statement keeps a source link.',
    artifactState: 'SOURCE LINKED',
  },
  {
    number: '03',
    label: 'Let people make the call',
    description: 'AI can help with a first draft. A clinician decides what earns approval.',
    icon: ShieldCheck,
    marker: 'HUMAN REVIEW',
    artifact: 'Clinical review',
    artifactDetail: 'A person approves what moves forward.',
    artifactState: 'REVIEW REQUIRED',
  },
  {
    number: '04',
    label: 'Share the story, not the guesswork',
    description: 'Shape clear health content with the evidence trail still close at hand.',
    icon: BookOpen,
    marker: 'READY TO SHARE',
    artifact: 'Story draft',
    artifactDetail: 'Context travels with the content.',
    artifactState: 'TRAIL PRESERVED',
  },
];

const principles = [
  {
    number: '01',
    title: 'Traceable by design',
    description: 'Claims stay connected to the source passage that supports them.',
    icon: Fingerprint,
  },
  {
    number: '02',
    title: 'Human at the gate',
    description: 'Drafting can be assisted. Clinical approval stays with people.',
    icon: ShieldCheck,
  },
  {
    number: '03',
    title: 'Context stays close',
    description: 'The original study, claim, and review status live in one workflow.',
    icon: BookOpen,
  },
];

function Brand() {
  return (
    <a className="motiva-site-brand" href="#top" aria-label="MOTIVA home">
      <span className="motiva-site-brand-mark">m</span>
      <span className="motiva-site-brand-name">MOTIVA</span>
    </a>
  );
}

function SiteHeader({ onEnter }: { onEnter: () => void }) {
  return (
    <header className="motiva-site-header">
      <div className="motiva-site-header-inner">
        <Brand />
        <nav className="motiva-site-nav" aria-label="Main navigation">
          <a href="#tension">The challenge</a>
          <a href="#journey">The workflow</a>
          <a href="#principles">Our principles</a>
        </nav>
        <button className="motiva-site-nav-cta" type="button" onClick={onEnter}>
          Open workspace <ArrowUpRight size={15} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}

function HeroArtifact({ reduceMotion }: { reduceMotion: boolean }) {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const rotateY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [-17, 12]);
  const rotateX = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [9, -9]);
  const artY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [0, -100]);
  const artScale = useTransform(scrollYProgress, [0, 1], reduceMotion ? [1, 1] : [1, 0.88]);
  const orbitRotate = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [-14, 34]);
  const sourceX = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [0, -68]);
  const claimX = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [0, 80]);

  return (
    <section ref={heroRef} className="motiva-site-hero" id="top" aria-labelledby="motiva-site-title">
      <div className="motiva-site-hero-texture" aria-hidden="true" />
      <div className="motiva-site-hero-glow" aria-hidden="true" />
      <div className="motiva-site-hero-layout">
        <div className="motiva-site-hero-copy">
          <div className="motiva-site-eyebrow"><span /> EVIDENCE TO IMPACT · 01—04</div>
          <h1 id="motiva-site-title">Make evidence travel <em>with the story.</em></h1>
          <p>
            Health research is hard to communicate without losing context. MOTIVA connects
            every draft claim to its source—and keeps publication behind human review.
          </p>
          <div className="motiva-site-hero-actions">
            <a className="motiva-site-primary-link" href="#journey">
              Follow the evidence <ArrowDown size={16} aria-hidden="true" />
            </a>
            <span className="motiva-site-hero-note">A clearer path from study to story.</span>
          </div>
        </div>

        <div className="motiva-site-hero-art" aria-hidden="true">
          <motion.div className="motiva-site-orbit motiva-site-orbit-one" style={{ rotate: orbitRotate }} />
          <motion.div className="motiva-site-orbit motiva-site-orbit-two" style={{ rotate: orbitRotate }} />
          <motion.div
            className="motiva-site-document-stack"
            style={{ rotateX, rotateY, y: artY, scale: artScale }}
          >
            <div className="motiva-site-document-back" />
            <article className="motiva-site-document">
              <div className="motiva-site-document-topline">
                <span><BookOpen size={13} /> RESEARCH SOURCE</span>
                <span>PDF · 18 PAGES</span>
              </div>
              <div className="motiva-site-document-title-lines"><i /><i /><i /></div>
              <div className="motiva-site-document-section">ABSTRACT · PAGE 04</div>
              <div className="motiva-site-document-paragraph"><i /><i /><i /><i /></div>
              <div className="motiva-site-document-highlight"><i /><i /></div>
              <div className="motiva-site-document-footer">
                <span>Passage linked</span><Check size={13} />
              </div>
            </article>
            <motion.div className="motiva-site-float-card motiva-site-float-source" style={{ x: sourceX }}>
              <span className="motiva-site-float-icon"><FileSearch size={16} /></span>
              <span><strong>Exact passage</strong><small>Page + context retained</small></span>
            </motion.div>
            <motion.div className="motiva-site-float-card motiva-site-float-claim" style={{ x: claimX }}>
              <span className="motiva-site-float-icon"><Link2 size={16} /></span>
              <span><strong>Draft claim</strong><small>Source-linked · needs review</small></span>
              <span className="motiva-site-pulse-dot" />
            </motion.div>
            <div className="motiva-site-review-seal"><ShieldCheck size={15} /> Human review</div>
          </motion.div>
          <div className="motiva-site-art-note">ILLUSTRATIVE WORKFLOW · NO CLINICAL RESULTS SHOWN</div>
        </div>
      </div>
      <a className="motiva-site-scroll-cue" href="#tension">
        <span>Scroll to see where the story breaks</span><ArrowDown size={14} aria-hidden="true" />
      </a>
      <div className="motiva-site-hero-index" aria-hidden="true">M / 2026</div>
    </section>
  );
}

function TensionSection({ reduceMotion }: { reduceMotion: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const leftY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [90, -100]);
  const rightY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [-60, 90]);
  const leftRotate = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [-12, 8]);
  const rightRotate = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [11, -8]);
  const bridgeScale = useTransform(scrollYProgress, [0.15, 0.55, 0.9], [0.15, 1, 1]);

  return (
    <section ref={sectionRef} className="motiva-site-tension" id="tension" aria-labelledby="motiva-tension-title">
      <div className="motiva-site-tension-copy">
        <div className="motiva-site-eyebrow motiva-site-eyebrow-dark"><span /> THE HANDOFF</div>
        <h2 id="motiva-tension-title">The science is precise. <em>The handoff rarely is.</em></h2>
        <p>
          Research lives in papers. Public-facing content lives somewhere else. When the
          connection between them gets lost, even careful teams lose time rebuilding context.
        </p>
        <a className="motiva-site-text-link" href="#journey">There is a better path <ArrowRight size={15} /></a>
      </div>

      <div className="motiva-site-gap-art" aria-hidden="true">
        <div className="motiva-site-gap-orbit" />
        <motion.div className="motiva-site-gap-card motiva-site-gap-source" style={{ y: leftY, rotateZ: leftRotate }}>
          <span className="motiva-site-gap-card-label">01 / SOURCE</span>
          <BookOpen size={19} />
          <strong>Original study</strong>
          <span className="motiva-site-gap-lines"><i /><i /><i /></span>
          <small>Context is in the paper.</small>
        </motion.div>
        <motion.div className="motiva-site-gap-bridge" style={{ scaleX: bridgeScale }}>
          <span /><i /><span />
        </motion.div>
        <motion.div className="motiva-site-gap-card motiva-site-gap-claim" style={{ y: rightY, rotateZ: rightRotate }}>
          <span className="motiva-site-gap-card-label">02 / CONTENT</span>
          <Link2 size={18} />
          <strong>Draft claim</strong>
          <span className="motiva-site-gap-lines"><i /><i /><i /></span>
          <small>Where did this come from?</small>
        </motion.div>
        <div className="motiva-site-gap-tag motiva-site-gap-tag-one">SOURCE CONTEXT</div>
        <div className="motiva-site-gap-tag motiva-site-gap-tag-two">TRACEABILITY GAP</div>
      </div>
    </section>
  );
}

function WorkflowSection({ reduceMotion }: { reduceMotion: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });
  const cardRotateY = useTransform(
    scrollYProgress,
    [0, 0.32, 0.68, 1],
    reduceMotion ? [0, 0, 0, 0] : [-24, -8, 10, 24],
  );
  const cardRotateX = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    reduceMotion ? [0, 0, 0] : [12, -3, 10],
  );
  const cardY = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    reduceMotion ? [0, 0, 0] : [48, -26, 35],
  );
  const orbitRotate = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion ? [0, 0] : [8, 112],
  );
  const lineScale = useTransform(scrollYProgress, [0, 1], [0.05, 1]);
  const leftBadgeX = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [10, -34]);
  const rightBadgeX = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [-12, 38]);

  useMotionValueEvent(scrollYProgress, 'change', (progress) => {
    const nextStep = Math.min(workflowSteps.length - 1, Math.floor(progress * workflowSteps.length));
    setActiveStepIndex((currentStep) => currentStep === nextStep ? currentStep : nextStep);
  });

  const activeStep = workflowSteps[activeStepIndex];
  const ActiveIcon = activeStep.icon;

  return (
    <section ref={sectionRef} className="motiva-site-journey" id="journey" aria-labelledby="motiva-journey-title">
      <div className="motiva-site-journey-stage">
        <div className="motiva-site-journey-grid" aria-hidden="true" />
        <div className="motiva-site-journey-head">
          <div className="motiva-site-eyebrow"><span /> A CONNECTED WORKFLOW · 02—04</div>
          <div className="motiva-site-journey-scroll-label"><span>Keep scrolling</span><ArrowDown size={14} /></div>
        </div>

        <div className="motiva-site-journey-layout">
          <div className="motiva-site-journey-copy" aria-live="polite">
            <div className="motiva-site-journey-count">{activeStep.number}<span> / 04</span></div>
            <h2 id="motiva-journey-title">{activeStep.label}</h2>
            <p>{activeStep.description}</p>
            <div className="motiva-site-journey-active-label">
              <ActiveIcon size={15} aria-hidden="true" /> {activeStep.marker}
            </div>
            <ol className="motiva-site-journey-list" aria-label="Evidence workflow steps">
              {workflowSteps.map((step, index) => {
                const StepIcon = step.icon;
                return (
                  <li key={step.number} aria-current={index === activeStepIndex ? 'step' : undefined}>
                    <span className="motiva-site-journey-list-icon"><StepIcon size={14} aria-hidden="true" /></span>
                    <span>{step.label}</span>
                    <span className="motiva-site-journey-list-number">{step.number}</span>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="motiva-site-journey-scene" aria-hidden="true">
            <motion.div className="motiva-site-journey-orbit motiva-site-journey-orbit-one" style={{ rotate: orbitRotate }} />
            <div className="motiva-site-journey-orbit motiva-site-journey-orbit-two" />
            <div className="motiva-site-journey-beam"><motion.span style={{ scaleX: lineScale }} /></div>
            <div className="motiva-site-journey-nodes">
              {workflowSteps.map((step, index) => {
                const StepIcon = step.icon;
                return (
                  <span className={index <= activeStepIndex ? 'is-lit' : ''} key={step.number}>
                    <StepIcon size={14} />
                  </span>
                );
              })}
            </div>
            <motion.div className="motiva-site-journey-card-shadow" style={{ rotateY: cardRotateY, rotateX: cardRotateX, y: cardY }} />
            <motion.article className="motiva-site-journey-card" style={{ rotateY: cardRotateY, rotateX: cardRotateX, y: cardY }}>
              <div className="motiva-site-journey-card-top">
                <span><ActiveIcon size={14} /> {activeStep.artifactState}</span>
                <span className="motiva-site-journey-card-index">{activeStep.number}</span>
              </div>
              <div className="motiva-site-journey-card-label">MOTIVA WORKSPACE</div>
              <h3>{activeStep.artifact}</h3>
              <p>{activeStep.artifactDetail}</p>
              <div className="motiva-site-journey-card-lines"><i /><i /><i /></div>
              <div className="motiva-site-journey-card-bottom">
                <span className="motiva-site-journey-card-dot" /> Evidence trail attached
                <ArrowUpRight size={14} />
              </div>
            </motion.article>
            <motion.div className="motiva-site-journey-float motiva-site-journey-float-left" style={{ x: leftBadgeX }}>
              <FileSearch size={15} /> <span>Passage · p.04</span>
            </motion.div>
            <motion.div className="motiva-site-journey-float motiva-site-journey-float-right" style={{ x: rightBadgeX }}>
              <ShieldCheck size={15} /> <span>Review required</span>
            </motion.div>
            <div className="motiva-site-journey-scene-caption">SOURCE <span>→</span> CLAIM <span>→</span> HUMAN REVIEW <span>→</span> STORY</div>
          </div>
        </div>
        <div className="motiva-site-journey-progress" role="progressbar" aria-label="Workflow walkthrough progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(activeStepIndex * 100 / (workflowSteps.length - 1))}>
          <motion.span style={{ scaleX: lineScale }} />
        </div>
      </div>
    </section>
  );
}

function PrinciplesSection() {
  return (
    <section className="motiva-site-principles" id="principles" aria-labelledby="motiva-principles-title">
      <div className="motiva-site-principles-intro">
        <div className="motiva-site-eyebrow motiva-site-eyebrow-dark"><span /> BUILT FOR RESPONSIBLE COMMUNICATION</div>
        <h2 id="motiva-principles-title">Fast-moving work. <em>Careful by design.</em></h2>
        <p>Tools should make the evidence trail easier to follow—not make the judgment for you.</p>
      </div>
      <div className="motiva-site-principle-grid">
        {principles.map((principle) => {
          const PrincipleIcon = principle.icon;
          return (
            <article className="motiva-site-principle-card" key={principle.number}>
              <div className="motiva-site-principle-card-top">
                <span>{principle.number}</span><span className="motiva-site-principle-icon"><PrincipleIcon size={18} /></span>
              </div>
              <h3>{principle.title}</h3>
              <p>{principle.description}</p>
              <div className="motiva-site-principle-rule" />
            </article>
          );
        })}
      </div>
      <div className="motiva-site-principles-footnote"><span /> Source-linked. Human-reviewed. Ready to communicate.</div>
    </section>
  );
}

function ClosingSection({ onEnter }: { onEnter: () => void }) {
  return (
    <section className="motiva-site-closing" aria-labelledby="motiva-closing-title">
      <div className="motiva-site-closing-rings" aria-hidden="true"><i /><i /><i /></div>
      <div className="motiva-site-closing-content">
        <div className="motiva-site-eyebrow"><span /> EVIDENCE TO IMPACT · 04—04</div>
        <h2 id="motiva-closing-title">Keep the evidence <em>in the story.</em></h2>
        <p>One connected workspace for research, claims, clinical review, and clear health content.</p>
        <button className="motiva-site-closing-cta" type="button" onClick={onEnter}>
          Open the MOTIVA workspace <ArrowUpRight size={17} aria-hidden="true" />
        </button>
      </div>
      <footer className="motiva-site-footer">
        <Brand />
        <span>Illustrative workflow · no clinical outcomes represented</span>
        <a href="#top">Back to top <ArrowRight size={14} aria-hidden="true" /></a>
      </footer>
    </section>
  );
}

export function IntroExperience({ onEnter }: { onEnter: () => void }) {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <main className="motiva-site" aria-label="MOTIVA product site">
      <SiteHeader onEnter={onEnter} />
      <HeroArtifact reduceMotion={reduceMotion} />
      <TensionSection reduceMotion={reduceMotion} />
      <WorkflowSection reduceMotion={reduceMotion} />
      <PrinciplesSection />
      <ClosingSection onEnter={onEnter} />
    </main>
  );
}
