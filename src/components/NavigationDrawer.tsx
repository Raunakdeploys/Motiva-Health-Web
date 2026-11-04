import React from 'react';
import { ActiveTab } from './NavigationSidebar';
import { PaperRecord } from '../types';
import { ArrowUpRight, BookOpen, CalendarDays, CheckCircle2, ChevronRight, FileText, FlaskConical, Layers3, Menu, Network, Radar, Settings2, ShieldCheck, Sparkles, X } from 'lucide-react';

interface NavigationDrawerProps {
  open: boolean;
  onClose: () => void;
  currentTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  activePaper: PaperRecord | null;
  papers: PaperRecord[];
  onSwitchPaper: (paperId: string) => void;
  onOpenAuthModal: () => void;
}

const groups: { label: string; items: { id: ActiveTab; label: string; note: string; icon: React.ComponentType<{ className?: string }> }[] }[] = [
  { label: 'Research', items: [
    { id: 'workspace', label: 'Overview', note: 'Your research desk', icon: Layers3 },
    { id: 'papers', label: 'Paper intake', note: 'Add a new source', icon: FileText },
    { id: 'radar', label: 'Evidence radar', note: 'Find signal in the noise', icon: Radar },
    { id: 'desk', label: 'Investigation desk', note: 'Work through claims', icon: FlaskConical },
    { id: 'source', label: 'Evidence stitch', note: 'Read source passages', icon: BookOpen },
  ] },
  { label: 'Production', items: [
    { id: 'studio', label: 'Content studio', note: 'Create social packages', icon: Sparkles },
    { id: 'media', label: 'AI media lab', note: 'Ground visuals in evidence', icon: Network },
    { id: 'schedule', label: 'Content calendar', note: 'Plan the week', icon: CalendarDays },
  ] },
  { label: 'Governance', items: [
    { id: 'review', label: 'Claim review', note: 'Approve clinical copy', icon: CheckCircle2 },
    { id: 'provenance', label: 'Provenance graph', note: 'Trace every decision', icon: Network },
    { id: 'report', label: 'Evidence report', note: 'Audit trail & compliance', icon: FileText },
    { id: 'selftest', label: 'Validation engine', note: '12-rule deterministic checks', icon: ShieldCheck },
    { id: 'submission', label: 'Submission packet', note: 'Prepare for sign-off', icon: ShieldCheck },
    { id: 'audit', label: 'Audit logs', note: 'Review activity', icon: Settings2 },
  ] },
];

export function NavigationDrawer({ open, onClose, currentTab, onSelectTab, activePaper, papers, onSwitchPaper, onOpenAuthModal }: NavigationDrawerProps) {
  const select = (tab: ActiveTab) => { onSelectTab(tab); onClose(); };
  return (
    <>
      <div aria-hidden={!open} onClick={onClose} className={`fixed inset-0 z-40 bg-[#11110f]/35 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`} />
      <aside aria-label="Main navigation" aria-hidden={!open} className={`fixed inset-y-0 left-0 z-50 flex w-[min(390px,92vw)] flex-col border-r border-[#d8cec1] bg-[#f7f4ee] shadow-[24px_0_80px_rgba(38,28,20,.14)] transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-[#d8cec1] px-7 py-6">
          <button onClick={() => select('workspace')} className="text-left" aria-label="Open overview"><span className="font-serif text-3xl tracking-[-.08em] text-[#261f1a]">MOTIVA</span><span className="ml-2 align-top font-mono text-[9px] uppercase tracking-[.22em] text-[#9b8e81]">research OS</span></button>
          <button onClick={onClose} className="rounded-full border border-[#cfc4b7] p-2 text-[#51483f] transition hover:bg-[#ebe4da]" aria-label="Close navigation"><X className="h-4 w-4" /></button>
        </div>
        <div className="border-b border-[#d8cec1] px-7 py-5"><div className="mb-2 flex items-center justify-between"><span className="font-mono text-[10px] uppercase tracking-[.2em] text-[#9b8e81]">Current source</span><span className="h-2 w-2 rounded-full bg-[#9a4b39]" /></div><button onClick={() => select('papers')} className="group flex w-full items-start justify-between text-left"><span className="max-w-[270px] font-serif text-xl leading-tight text-[#261f1a]">{activePaper?.title || 'Choose a research paper to begin'}</span><ArrowUpRight className="mt-1 h-4 w-4 text-[#9b8e81] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></button><div className="mt-2 font-mono text-[10px] uppercase tracking-[.16em] text-[#9b8e81]">{activePaper ? `${activePaper.year} · ${activePaper.journal || 'Clinical source'}` : 'No source selected'}</div>{papers.length > 1 && <select value={activePaper?.paper_id || ''} onChange={(e) => onSwitchPaper(e.target.value)} className="mt-4 w-full border-0 border-b border-[#cfc4b7] bg-transparent py-2 font-mono text-xs text-[#51483f] outline-none"><option value="">Switch source</option>{papers.map((paper) => <option key={paper.paper_id} value={paper.paper_id}>{paper.title}</option>)}</select>}</div>
        <nav className="flex-1 overflow-y-auto px-5 py-5">{groups.map((group) => <div key={group.label} className="mb-7"><p className="px-2 pb-2 font-mono text-[10px] uppercase tracking-[.22em] text-[#9b8e81]">{group.label}</p><div className="space-y-1">{group.items.map((item) => { const Icon = item.icon; const active = currentTab === item.id; return <button key={item.id} onClick={() => select(item.id)} className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${active ? 'bg-[#261f1a] text-[#f7f4ee]' : 'text-[#51483f] hover:bg-[#ebe4da]'}`}><span className={`flex h-9 w-9 items-center justify-center rounded-lg ${active ? 'bg-[#9a4b39]' : 'bg-[#ebe4da] text-[#8a4638]'}`}><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-medium">{item.label}</span><span className={`block text-xs ${active ? 'text-[#cfc4b7]' : 'text-[#9b8e81]'}`}>{item.note}</span></span><ChevronRight className={`h-4 w-4 transition ${active ? 'text-[#f7f4ee]' : 'text-[#b1a59a] group-hover:translate-x-0.5'}`} /></button> })}</div></div>)}</nav>
        <div className="flex items-center justify-between border-t border-[#d8cec1] px-7 py-5"><button onClick={onOpenAuthModal} className="text-left"><span className="block text-sm font-medium text-[#261f1a]">Your workspace</span><span className="font-mono text-[10px] uppercase tracking-[.16em] text-[#9b8e81]">Personal · synced</span></button><Menu className="h-4 w-4 text-[#9b8e81]" /></div>
      </aside>
    </>
  );
}
