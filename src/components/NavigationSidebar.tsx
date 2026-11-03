import React from 'react';
import { PaperRecord } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  CheckCircle2,
  Calendar,
  Layers,
  Award,
  BookOpen,
  Plus,
  RefreshCw,
  Database,
  FileCheck,
  AlertTriangle,
  FlaskConical,
  Compass,
  ShieldCheck,
  ChevronDown,
  Sparkles,
  Radio,
} from 'lucide-react';

export type ActiveTab =
  | 'workspace'
  | 'radar'
  | 'desk'
  | 'provenance'
  | 'review'
  | 'studio'
  | 'schedule'
  | 'submission'
  | 'papers'
  | 'source'
  | 'report'
  | 'selftest'
  | 'audit'
  | 'media';

interface NavigationSidebarProps {
  currentTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  activePaper: PaperRecord | null;
  papers: PaperRecord[];
  onSwitchPaper: (paperId: string) => void;
  approvedClaimsCount: number;
  totalClaimsCount: number;
  flaggedClaimsCount: number;
  sqlSyncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  onOpenDemo?: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  onOpenAuthModal?: () => void;
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  currentTab,
  onSelectTab,
  activePaper,
  papers,
  onSwitchPaper,
  approvedClaimsCount,
  totalClaimsCount,
  flaggedClaimsCount,
  sqlSyncStatus,
  onOpenDemo,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const handleNavClick = (tab: ActiveTab) => {
    onSelectTab(tab);
    if (onCloseMobile) onCloseMobile();
  };

  // Structured into 3 clear operational sections
  const workflowGroup = [
    {
      id: 'workspace' as ActiveTab,
      label: 'Workbench',
      icon: Compass,
    },
    {
      id: 'radar' as ActiveTab,
      label: 'Evidence Radar',
      icon: Radio,
      badge: 'Audience Qs',
      badgeHighlight: true,
    },
    {
      id: 'papers' as ActiveTab,
      label: 'Paper Intake',
      icon: FileText,
      badge: papers.length > 0 ? `${papers.length}` : undefined,
    },
    {
      id: 'desk' as ActiveTab,
      label: 'Investigation Desk',
      icon: FlaskConical,
      badge: totalClaimsCount > 0 ? `${totalClaimsCount}` : undefined,
      badgeHighlight: flaggedClaimsCount > 0,
    },
    {
      id: 'review' as ActiveTab,
      label: 'Claim Review',
      icon: CheckCircle2,
      badge: totalClaimsCount > 0 ? `${approvedClaimsCount}/${totalClaimsCount}` : undefined,
      badgeHighlight: approvedClaimsCount > 0,
    },
    {
      id: 'studio' as ActiveTab,
      label: 'Content Studio',
      icon: Layers,
      badge: 'Feed & Reels',
    },
    {
      id: 'media' as ActiveTab,
      label: 'AI Media & Grounding',
      icon: Sparkles,
      badge: 'Veo 3',
      badgeHighlight: true,
    },
  ];

  const scienceGroup = [
    {
      id: 'source' as ActiveTab,
      label: 'Evidence Stitch',
      icon: BookOpen,
    },
    {
      id: 'provenance' as ActiveTab,
      label: 'Provenance Graph',
      icon: Layers,
    },
    {
      id: 'report' as ActiveTab,
      label: 'Evidence Report',
      icon: FileCheck,
    },
  ];

  const governanceGroup = [
    {
      id: 'schedule' as ActiveTab,
      label: 'Content Calendar',
      icon: Calendar,
      badge: '7-Day',
    },
    {
      id: 'submission' as ActiveTab,
      label: 'Submission Packet',
      icon: Award,
      badge: 'PS2',
    },
    {
      id: 'selftest' as ActiveTab,
      label: 'Validation Engine',
      icon: AlertTriangle,
      badge: '12 Rules',
    },
    {
      id: 'audit' as ActiveTab,
      label: 'Audit Logs',
      icon: ShieldCheck,
    },
  ];

  const renderNavButton = (item: {
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    badgeHighlight?: boolean;
  }) => {
    const isActive = currentTab === item.id;
    const Icon = item.icon;

    return (
      <button
        key={item.id}
        onClick={() => handleNavClick(item.id)}
        className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-medium rounded-xs transition-all cursor-pointer group text-left ${
          isActive
            ? 'bg-[#F4EBE1] text-[#661414] font-bold border-l-2 border-[#661414]'
            : 'text-[#351D1D] hover:text-[#661414] hover:bg-[#FFFDF9]'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Icon
            className={`w-3.5 h-3.5 shrink-0 transition-colors ${
              isActive ? 'text-[#661414]' : 'text-[#786A61] group-hover:text-[#661414]'
            }`}
          />
          <span className="truncate">{item.label}</span>
        </div>

        {item.badge && (
          <span
            className={`text-[9px] font-mono px-1.5 py-0.2 rounded-xs font-semibold ${
              isActive
                ? 'bg-[#661414]/15 text-[#661414]'
                : item.badgeHighlight
                ? 'bg-[#416C49]/15 text-[#416C49]'
                : 'bg-[#E6CBBD]/40 text-[#786A61]'
            }`}
          >
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-[230px] bg-[#FAF6F0] border-r border-[#E6CBBD] flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
        isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
      }`}
    >
      {/* Brand & Workspace Context - Scrollable Navigation */}
      <div className="flex flex-col overflow-y-auto min-h-0 flex-1">
        {/* Masthead */}
        <div className="h-14 px-4 border-b border-[#E6CBBD] flex items-center justify-between bg-[#FFFDF9]">
          <div
            className="flex items-baseline gap-1.5 cursor-pointer"
            onClick={() => handleNavClick('workspace')}
          >
            <span className="font-serif italic text-xl font-black text-[#661414] tracking-tight">
              steer
            </span>
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#786A61]">
              STITCH
            </span>
          </div>
          <span className="text-[9px] font-mono tracking-wider uppercase text-[#786A61] border border-[#E6CBBD] px-1.5 py-0.5 rounded-xs bg-[#FAF6F0] font-semibold">
            STUDIO
          </span>
        </div>

        {/* Active Source Card */}
        <div className="px-3.5 py-3 border-b border-[#E6CBBD] bg-[#FFFDF9]/70">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#786A61] font-semibold">
              ACTIVE SOURCE
            </span>
            {activePaper?.is_demo && (
              <span className="text-[9px] font-mono uppercase tracking-wider text-[#C04E2A] font-bold">
                DEMO
              </span>
            )}
          </div>

          {activePaper ? (
            <div className="space-y-1">
              <div
                className="font-serif text-xs font-semibold text-[#351D1D] line-clamp-2 leading-snug cursor-pointer hover:text-[#661414] transition-colors"
                onClick={() => handleNavClick('papers')}
                title={activePaper.title}
              >
                {activePaper.title}
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-[#786A61]">
                <span>{activePaper.year}</span>
                <span>·</span>
                <span className="truncate max-w-[110px]">{activePaper.journal || 'Journal'}</span>
              </div>
            </div>
          ) : (
            <button
              onClick={() => handleNavClick('papers')}
              className="w-full text-left py-1 text-xs text-[#661414] hover:underline font-medium flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Ingest paper...</span>
            </button>
          )}

          {papers.length > 1 && (
            <div className="mt-2 pt-2 border-t border-[#E6CBBD] flex items-center justify-between text-[10px]">
              <span className="text-[#786A61] font-mono">Switch:</span>
              <div className="relative">
                <select
                  value={activePaper?.paper_id}
                  onChange={(e) => onSwitchPaper(e.target.value)}
                  className="bg-[#FFFDF9] border border-[#E6CBBD] text-[#351D1D] text-[10px] font-medium py-0.5 pl-1.5 pr-5 rounded-xs max-w-[130px] truncate cursor-pointer focus:outline-hidden focus:border-[#661414] appearance-none"
                >
                  {papers.map((p) => (
                    <option key={p.paper_id} value={p.paper_id}>
                      {p.title.substring(0, 20)}...
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-2.5 h-2.5 text-[#786A61] absolute right-1.5 top-2 pointer-events-none" />
              </div>
            </div>
          )}
        </div>

        {/* Navigation Groups */}
        <nav className="p-2 space-y-4">
          {/* Group 1: Editorial Workflow */}
          <div className="space-y-0.5">
            <span className="px-2.5 py-1 text-[9px] font-mono uppercase tracking-widest text-[#B58777] font-bold block">
              EDITORIAL WORKFLOW
            </span>
            {workflowGroup.map(renderNavButton)}
          </div>

          {/* Group 2: Traceability & Science */}
          <div className="space-y-0.5">
            <span className="px-2.5 py-1 text-[9px] font-mono uppercase tracking-widest text-[#B58777] font-bold block">
              EVIDENCE & PROVENANCE
            </span>
            {scienceGroup.map(renderNavButton)}
          </div>

          {/* Group 3: Publishing & Governance */}
          <div className="space-y-0.5">
            <span className="px-2.5 py-1 text-[9px] font-mono uppercase tracking-widest text-[#B58777] font-bold block">
              CALENDAR & GOVERNANCE
            </span>
            {governanceGroup.map(renderNavButton)}
          </div>
        </nav>
      </div>

      {/* Footer: Database Sync Status & Reset Demo */}
      <div className="p-3 border-t border-[#E6CBBD] bg-[#FFFDF9] space-y-2">
        {/* Cloud SQL Connection Status */}
        <div className="flex items-center justify-between text-[10px] font-mono text-[#786A61]">
          <div className="flex items-center gap-1.5">
            <Database className="w-3 h-3 text-[#416C49]" />
            <span>Cloud SQL Sync</span>
          </div>
          <span
            className={`w-2 h-2 rounded-full ${
              sqlSyncStatus === 'synced'
                ? 'bg-[#416C49]'
                : sqlSyncStatus === 'syncing'
                ? 'bg-[#C04E2A] animate-pulse'
                : 'bg-[#B58777]'
            }`}
            title={`Status: ${sqlSyncStatus}`}
          />
        </div>

        {/* Demo reset button */}
        {onOpenDemo && (
          <button
            onClick={onOpenDemo}
            className="w-full text-left py-1 text-[11px] text-[#786A61] hover:text-[#661414] font-mono flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset Demo Workspace</span>
          </button>
        )}
      </div>
    </aside>
  );
};
