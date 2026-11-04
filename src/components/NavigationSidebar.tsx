import React from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  AlertTriangle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Database,
  FileCheck2,
  FileText,
  FlaskConical,
  LayoutDashboard,
  Layers,
  Plus,
  Radio,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import type { PaperRecord } from '../types';

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

interface NavigationItem {
  id: ActiveTab;
  label: string;
  icon: LucideIcon;
  badge?: string;
  badgeTone?: 'accent' | 'sage';
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
    onCloseMobile?.();
  };

  const groups: { label: string; items: NavigationItem[] }[] = [
    {
      label: 'Workspace',
      items: [{ id: 'workspace', label: 'Overview', icon: LayoutDashboard }],
    },
    {
      label: 'Research & evidence',
      items: [
        { id: 'papers', label: 'Research library', icon: BookOpen, badge: papers.length ? `${papers.length}` : undefined },
        { id: 'source', label: 'Source reader', icon: FileText },
        {
          id: 'desk',
          label: 'Investigation desk',
          icon: FlaskConical,
          badge: flaggedClaimsCount ? `${flaggedClaimsCount} flagged` : totalClaimsCount ? `${totalClaimsCount}` : undefined,
          badgeTone: flaggedClaimsCount ? 'accent' : undefined,
        },
        {
          id: 'review',
          label: 'Claim review',
          icon: CheckCircle2,
          badge: totalClaimsCount ? `${approvedClaimsCount}/${totalClaimsCount}` : undefined,
          badgeTone: approvedClaimsCount ? 'sage' : undefined,
        },
        { id: 'radar', label: 'Evidence radar', icon: Radio, badge: 'Explore', badgeTone: 'sage' },
        { id: 'provenance', label: 'Provenance graph', icon: Layers },
      ],
    },
    {
      label: 'Create & publish',
      items: [
        { id: 'studio', label: 'Content studio', icon: Activity },
        { id: 'media', label: 'AI media lab', icon: Sparkles },
        { id: 'schedule', label: 'Publishing calendar', icon: CalendarDays },
        { id: 'submission', label: 'Submission packet', icon: ClipboardCheck },
      ],
    },
    {
      label: 'Trust & reporting',
      items: [
        { id: 'report', label: 'Evidence report', icon: FileCheck2 },
        { id: 'selftest', label: 'Validation tests', icon: AlertTriangle },
        { id: 'audit', label: 'Audit log', icon: ShieldCheck },
      ],
    },
  ];

  const syncLabels = {
    synced: 'Cloud data synced',
    syncing: 'Syncing changes',
    offline: 'Sign in to sync',
    error: 'Sync needs attention',
  };

  return (
    <aside
      id="motiva-navigation"
      className={`motiva-sidebar fixed inset-y-0 left-0 z-40 flex h-screen flex-col transition-transform duration-200 ease-out ${
        isOpenMobile ? 'motiva-sidebar-open shadow-2xl' : ''
      }`}
      aria-label="MOTIVA workspace navigation"
    >
      <div className="motiva-sidebar-header">
        <button
          type="button"
          className="motiva-brand-button"
          onClick={() => handleNavClick('workspace')}
          aria-label="MOTIVA overview"
        >
          <span className="motiva-brand-mark" aria-hidden="true">M</span>
          <span className="motiva-brand-name">
            MOTIVA
            <small>evidence studio</small>
          </span>
        </button>
        <span className="motiva-sidebar-tag">Health</span>
      </div>

      <div className="motiva-source-card">
        <div className="motiva-source-card-top">
          <span>Active study</span>
          {activePaper && <span className="motiva-source-state">{activePaper.is_demo ? 'Sample' : 'Ready'}</span>}
        </div>
        {activePaper ? (
          <>
            <button
              type="button"
              className="motiva-source-title"
              onClick={() => handleNavClick('papers')}
              title={activePaper.title}
            >
              {activePaper.title}
            </button>
            <div className="motiva-source-meta">
              <span>{activePaper.year}</span>
              <span aria-hidden="true">·</span>
              <span className="truncate">{activePaper.journal || 'Journal not specified'}</span>
            </div>
            {papers.length > 1 && (
              <div className="motiva-source-switch-row">
                <span>Switch study</span>
                <select
                  aria-label="Switch active study"
                  value={activePaper.paper_id}
                  onChange={(event) => onSwitchPaper(event.target.value)}
                  className="motiva-source-select"
                >
                  {papers.map((paper) => (
                    <option key={paper.paper_id} value={paper.paper_id}>
                      {paper.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        ) : (
          <button type="button" className="motiva-inline-link" onClick={() => handleNavClick('papers')}>
            <Plus size={14} aria-hidden="true" />
            Add your first paper
          </button>
        )}
      </div>

      <nav className="motiva-sidebar-nav" aria-label="Primary">
        {groups.map((group) => (
          <div className="motiva-nav-group" key={group.label}>
            <span className="motiva-nav-group-label">{group.label}</span>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`motiva-nav-item${isActive ? ' motiva-nav-item-active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="motiva-nav-item-main">
                    <Icon className="motiva-nav-item-icon" size={15} aria-hidden="true" />
                    <span className="motiva-nav-item-label">{item.label}</span>
                  </span>
                  {item.badge && (
                    <span
                      className={`motiva-nav-badge${item.badgeTone === 'sage' ? ' motiva-nav-badge-accent' : ''}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <footer className="motiva-sidebar-footer">
        <div className="motiva-sync-row" title={`Database status: ${sqlSyncStatus}`}>
          <span className="motiva-sync-label">
            <Database size={13} aria-hidden="true" />
            {syncLabels[sqlSyncStatus]}
          </span>
          <span className="motiva-sync-dot" data-status={sqlSyncStatus} aria-hidden="true" />
        </div>
        {onOpenDemo && (
          <button type="button" className="motiva-demo-reset" onClick={onOpenDemo}>
            <RefreshCw size={13} aria-hidden="true" />
            Restore sample workspace
          </button>
        )}
      </footer>
    </aside>
  );
};
