import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  Database,
  LogOut,
  Menu,
  PanelRightClose,
  PanelRightOpen,
  Search,
  Sparkles,
  User as UserIcon,
  X,
} from 'lucide-react';
import type { ActiveTab } from './NavigationSidebar';
import type { PaperRecord } from '../types';
import { useAuth } from '../context/AuthContext';
import { GoogleAuthModal } from './GoogleAuthModal';

interface TopBarProps {
  currentTab: ActiveTab;
  onSelectTab?: (tab: ActiveTab) => void;
  activePaper: PaperRecord | null;
  isMobileSidebarOpen: boolean;
  onToggleSidebarMobile: () => void;
  isInspectorOpen: boolean;
  onToggleInspector: () => void;
  sqlSyncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  onQuickAction?: () => void;
  quickActionLabel?: string;
  onOpenAuthModal?: () => void;
  onOpenSimulator?: () => void;
}

const TAB_TITLES: Record<ActiveTab, { title: string; subtitle: string }> = {
  workspace: { title: 'Overview', subtitle: 'Your evidence-to-publishing workflow' },
  radar: { title: 'Evidence radar', subtitle: 'Audience questions and scientific gaps' },
  papers: { title: 'Research library', subtitle: 'Manage and ingest clinical research' },
  source: { title: 'Source reader', subtitle: 'Trace claims back to the original paper' },
  desk: { title: 'Investigation desk', subtitle: 'Inspect evidence and refine claims' },
  provenance: { title: 'Provenance graph', subtitle: 'Follow the path from source to story' },
  review: { title: 'Claim review', subtitle: 'Review evidence before it becomes content' },
  studio: { title: 'Content studio', subtitle: 'Create research-backed social deliverables' },
  schedule: { title: 'Publishing calendar', subtitle: 'Plan and track upcoming content' },
  submission: { title: 'Submission packet', subtitle: 'Prepare a concise project showcase' },
  report: { title: 'Evidence report', subtitle: 'Review the supporting research record' },
  selftest: { title: 'Validation tests', subtitle: 'Check the rules that protect each claim' },
  audit: { title: 'Audit log', subtitle: 'Review workspace activity and decisions' },
  media: { title: 'AI media lab', subtitle: 'Generate grounded media for approved claims' },
};

const PAGE_LINKS: { id: ActiveTab; label: string; detail: string }[] = [
  { id: 'workspace', label: 'Overview', detail: 'Workspace' },
  { id: 'papers', label: 'Research library', detail: 'Research & evidence' },
  { id: 'source', label: 'Source reader', detail: 'Research & evidence' },
  { id: 'desk', label: 'Investigation desk', detail: 'Research & evidence' },
  { id: 'review', label: 'Claim review', detail: 'Research & evidence' },
  { id: 'radar', label: 'Evidence radar', detail: 'Research & evidence' },
  { id: 'provenance', label: 'Provenance graph', detail: 'Research & evidence' },
  { id: 'studio', label: 'Content studio', detail: 'Create & publish' },
  { id: 'media', label: 'AI media lab', detail: 'Create & publish' },
  { id: 'schedule', label: 'Publishing calendar', detail: 'Create & publish' },
  { id: 'submission', label: 'Submission packet', detail: 'Create & publish' },
  { id: 'report', label: 'Evidence report', detail: 'Trust & reporting' },
  { id: 'selftest', label: 'Validation tests', detail: 'Trust & reporting' },
  { id: 'audit', label: 'Audit log', detail: 'Trust & reporting' },
];

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onSelectTab,
  activePaper,
  isMobileSidebarOpen,
  onToggleSidebarMobile,
  isInspectorOpen,
  onToggleInspector,
  sqlSyncStatus,
  onQuickAction,
  quickActionLabel,
  onOpenAuthModal,
  onOpenSimulator,
}) => {
  const { user, signOutUser, loading: authLoading } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const tabInfo = TAB_TITLES[currentTab];

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return PAGE_LINKS;
    return PAGE_LINKS.filter((item) => `${item.label} ${item.detail}`.toLowerCase().includes(query));
  }, [searchQuery]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsCommandOpen(true);
      }
      if (event.key === 'Escape') {
        setIsCommandOpen(false);
        setUserDropdownOpen(false);
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  useEffect(() => {
    if (isCommandOpen) {
      setSearchQuery('');
      searchInputRef.current?.focus();
    }
  }, [isCommandOpen]);

  const openPage = (tab: ActiveTab) => {
    onSelectTab?.(tab);
    setIsCommandOpen(false);
    setSearchQuery('');
  };

  const syncLabels = {
    synced: 'Synced',
    syncing: 'Syncing',
    offline: 'Sign in to sync',
    error: 'Needs attention',
  };

  return (
    <>
      <header className="motiva-topbar sticky top-0 z-30 flex items-center justify-between gap-3 px-3 sm:px-5 xl:px-7">
        <div className="motiva-topbar-left">
          <button
            type="button"
            onClick={onToggleSidebarMobile}
            className="motiva-icon-button md:hidden"
            aria-label={isMobileSidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-controls="motiva-navigation"
            aria-expanded={isMobileSidebarOpen}
          >
            <Menu size={17} aria-hidden="true" />
          </button>
          <div className="motiva-topbar-title-wrap">
            <div className="motiva-topbar-crumb">
              <strong>MOTIVA</strong>
              <span aria-hidden="true">/</span>
              <span>Health research workspace</span>
            </div>
            <h1 className="motiva-topbar-heading">{tabInfo.title}</h1>
            <span className="motiva-topbar-context">
              {activePaper ? `${activePaper.title} · ${activePaper.year}` : tabInfo.subtitle}
            </span>
          </div>
        </div>

        <div className="motiva-topbar-right">
          <button
            type="button"
            className="motiva-search-trigger"
            onClick={() => setIsCommandOpen(true)}
            aria-label="Search workspace pages, Control or Command K"
            aria-haspopup="dialog"
          >
            <Search size={14} aria-hidden="true" />
            <span className="motiva-search-trigger-label">Search pages and tools</span>
            <kbd>⌘ K</kbd>
          </button>

          {quickActionLabel && onQuickAction && (
            <button
              type="button"
              onClick={onQuickAction}
              className="motiva-action-button motiva-quick-action"
            >
              {quickActionLabel}
              <ArrowRight size={13} aria-hidden="true" />
            </button>
          )}

          {onOpenSimulator && (
            <button
              type="button"
              onClick={onOpenSimulator}
              className="motiva-action-button motiva-action-button-primary"
              title="Open the illustrative scenario sandbox"
              aria-label="Open the illustrative scenario sandbox"
            >
              <Sparkles size={14} aria-hidden="true" />
              <span className="hidden xl:inline">Scenario sandbox</span>
            </button>
          )}

          <div className="motiva-status-pill" title={`Database status: ${syncLabels[sqlSyncStatus]}`}>
            <span className="motiva-sync-dot" data-status={sqlSyncStatus} aria-hidden="true" />
            <Database size={13} aria-hidden="true" />
            {syncLabels[sqlSyncStatus]}
          </div>

          {(currentTab === 'workspace' || currentTab === 'source' || currentTab === 'review') && (
            <button
              type="button"
              onClick={onToggleInspector}
              className={`motiva-action-button${isInspectorOpen ? ' motiva-action-button-primary' : ''}`}
              title={isInspectorOpen ? 'Close evidence inspector' : 'Open evidence inspector'}
              aria-pressed={isInspectorOpen}
            >
              {isInspectorOpen ? <PanelRightClose size={15} aria-hidden="true" /> : <PanelRightOpen size={15} aria-hidden="true" />}
              <span className="hidden xl:inline">Inspector</span>
            </button>
          )}

          {user ? (
            <div className="motiva-profile-wrap">
              <button
                type="button"
                onClick={() => setUserDropdownOpen((open) => !open)}
                className="motiva-action-button motiva-profile-trigger"
                aria-expanded={userDropdownOpen}
                aria-haspopup="menu"
                aria-label="Open account menu"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="size-5 rounded-full object-cover" />
                ) : (
                  <span className="motiva-profile-avatar" aria-hidden="true">
                    {(user.displayName || user.email || 'S').charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="hidden 2xl:inline max-w-[100px] truncate">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <ChevronDown size={13} aria-hidden="true" />
              </button>

              {userDropdownOpen && (
                <div className="motiva-profile-menu" role="menu">
                  <div className="motiva-profile-menu-header">
                    <strong>{user.displayName || 'MOTIVA researcher'}</strong>
                    <span>{user.email}</span>
                    <small><Database size={12} aria-hidden="true" /> {syncLabels[sqlSyncStatus]}</small>
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={signOutUser}
                    className="motiva-profile-menu-action"
                  >
                    <LogOut size={14} aria-hidden="true" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (onOpenAuthModal) onOpenAuthModal();
                else setIsAuthModalOpen(true);
              }}
              disabled={authLoading}
              className="motiva-action-button motiva-auth-trigger"
              title="Sign in to sync research across devices"
            >
              <UserIcon size={14} aria-hidden="true" />
              <span className="hidden sm:inline">Sign in</span>
            </button>
          )}
        </div>
      </header>

      {isCommandOpen && (
        <div
          className="motiva-command-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsCommandOpen(false);
          }}
        >
          <section
            className="motiva-command-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="motiva-command-title"
          >
            <h2 id="motiva-command-title" className="sr-only">Search workspace pages</h2>
            <div className="motiva-command-search">
              <Search size={17} aria-hidden="true" />
              <label className="sr-only" htmlFor="motiva-command-input">Search workspace sections</label>
              <input
                id="motiva-command-input"
                ref={searchInputRef}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && (event.nativeEvent.isComposing || event.keyCode === 229)) return;
                  if (event.key === 'Enter' && searchResults[0]) openPage(searchResults[0].id);
                }}
                placeholder="Search a page or tool…"
                autoComplete="off"
              />
              <button
                type="button"
                className="motiva-icon-button"
                onClick={() => setIsCommandOpen(false)}
                aria-label="Close search"
              >
                <X size={15} aria-hidden="true" />
              </button>
            </div>
            <div className="motiva-command-results">
              <span className="motiva-command-label">Workspace sections</span>
              {searchResults.length > 0 ? (
                searchResults.map((item) => (
                  <button
                    type="button"
                    className="motiva-command-item"
                    key={item.id}
                    onClick={() => openPage(item.id)}
                    aria-current={item.id === currentTab ? 'page' : undefined}
                  >
                    <span>{item.label}</span>
                    <small>{item.detail}</small>
                  </button>
                ))
              ) : (
                <div className="motiva-command-empty">No sections match “{searchQuery}”.</div>
              )}
            </div>
          </section>
        </div>
      )}

      <GoogleAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        sqlSyncStatus={sqlSyncStatus}
      />
    </>
  );
};
