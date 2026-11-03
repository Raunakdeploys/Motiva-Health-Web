import React, { useState } from 'react';
import {
  Menu,
  PanelRightClose,
  PanelRightOpen,
  Database,
  ArrowRight,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { ActiveTab } from './NavigationSidebar';
import { PaperRecord } from '../types';
import { useAuth } from '../context/AuthContext';
import { GoogleAuthModal } from './GoogleAuthModal';

interface TopBarProps {
  currentTab: ActiveTab;
  onSelectTab?: (tab: ActiveTab) => void;
  activePaper: PaperRecord | null;
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
  workspace: { title: 'Workbench', subtitle: 'Overview & Editorial Queue' },
  radar: { title: 'Evidence Radar', subtitle: 'Audience Questions, Literature Gaps & Content Briefs' },
  papers: { title: 'Paper Intake', subtitle: 'Ingest Research & Extract Passages' },
  source: { title: 'Evidence Stitch', subtitle: 'Verbatim Document Source Reader' },
  desk: { title: 'Investigation Desk', subtitle: 'Multi-Pane Evidence & Claim Triangulation' },
  provenance: { title: 'Provenance Graph', subtitle: 'End-to-End Visual Audit Trail' },
  review: { title: 'Claim Review', subtitle: 'Doctor Review Gate & 12-Rule Audit' },
  studio: { title: 'Content Studio', subtitle: 'Instagram Carousels, Statics & Reels' },
  schedule: { title: 'Content Calendar', subtitle: '7-Day Instagram Publishing Cadence' },
  submission: { title: 'Submission Packet', subtitle: 'Problem Statement 2 Showcase' },
  report: { title: 'Evidence Report', subtitle: 'Printable Audit Trail & Compliance' },
  selftest: { title: 'Validation Engine', subtitle: '12-Rule Deterministic Self-Tests' },
  audit: { title: 'Audit Logs', subtitle: 'System Governance & Multi-User Trail' },
  media: { title: 'AI Media & Grounding Lab', subtitle: 'Veo 3 Video, Nano Banana 2.1 & Search Grounding' },
};

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onSelectTab,
  activePaper,
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

  const tabInfo = TAB_TITLES[currentTab] || { title: 'Steer Evidence Studio', subtitle: '' };

  return (
    <>
      <header className="h-14 bg-[#FFFDF9] border-b border-[#E6CBBD] px-3 sm:px-5 flex items-center justify-between gap-3 shrink-0 sticky top-0 z-30 shadow-xs">
        {/* Left: Mobile Menu Toggle + Breadcrumbs + Active Paper Context */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile hamburger toggle */}
          <button
            onClick={onToggleSidebarMobile}
            className="md:hidden p-1.5 text-[#351D1D] hover:text-[#661414] hover:bg-[#F8F2EB] rounded-xs border border-[#E6CBBD] transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Breadcrumb Title */}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-serif italic font-bold text-[#661414] tracking-tight">
                steer
              </span>
              <span className="text-[#B58777]">/</span>
              <h1 className="font-semibold text-[#351D1D] truncate">
                {tabInfo.title}
              </h1>
            </div>
            {activePaper && (
              <span className="text-[10px] font-mono text-[#786A61] truncate hidden sm:inline max-w-[280px] md:max-w-[420px]">
                {activePaper.title} ({activePaper.year})
              </span>
            )}
          </div>
        </div>

        {/* Right: Quick Stage Progression + Sync Indicator + Inspector Toggle + User Account */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Workflow Quick Action Button */}
          {quickActionLabel && onQuickAction && (
            <button
              onClick={onQuickAction}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-[#661414] hover:bg-[#501010] active:scale-98 text-[#FFFDF9] text-xs font-semibold rounded-xs shadow-xs transition-all cursor-pointer"
            >
              <span>{quickActionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Trial Simulator Wow Factor Button */}
          {onOpenSimulator && (
            <button
              onClick={onOpenSimulator}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C04E2A] hover:bg-[#a84021] text-[#FFFDF9] text-xs font-bold rounded-xs shadow-xs transition-all cursor-pointer"
              title="Launch Live Clinical Trial Simulator & Patient Twin"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#F5EBDF]" />
              <span className="hidden sm:inline">🧠 Trial Simulator</span>
              <span className="sm:hidden">Simulator</span>
            </button>
          )}

          {/* Cloud SQL / Firestore Database Sync Status Pill */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono border border-[#E6CBBD] bg-[#FAF6F0] text-[#351D1D] rounded-xs"
            title={
              sqlSyncStatus === 'synced'
                ? 'Cloud SQL & Firestore in-sync'
                : sqlSyncStatus === 'syncing'
                ? 'Syncing clinical data...'
                : 'Local offline storage active'
            }
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                sqlSyncStatus === 'synced'
                  ? 'bg-[#416C49]'
                  : sqlSyncStatus === 'syncing'
                  ? 'bg-[#C04E2A] animate-pulse'
                  : 'bg-[#B58777]'
              }`}
            />
            <span className="text-[#786A61] hidden md:inline">SQL:</span>
            <span className="font-medium">
              {sqlSyncStatus === 'syncing' ? 'Syncing...' : sqlSyncStatus === 'synced' ? 'Synced' : sqlSyncStatus === 'offline' ? 'Offline' : 'Error'}
            </span>
          </div>

          {/* Evidence Inspector Drawer Toggle */}
          <button
            onClick={onToggleInspector}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium border rounded-xs transition-colors cursor-pointer ${
              isInspectorOpen
                ? 'bg-[#661414] text-[#FFFDF9] border-[#661414] font-semibold'
                : 'bg-[#FFFDF9] hover:bg-[#F8F2EB] text-[#351D1D] border-[#E6CBBD]'
            }`}
            title={isInspectorOpen ? 'Collapse evidence inspector' : 'Expand evidence inspector'}
          >
            {isInspectorOpen ? (
              <PanelRightClose className="w-3.5 h-3.5 text-[#FFFDF9]" />
            ) : (
              <PanelRightOpen className="w-3.5 h-3.5 text-[#661414]" />
            )}
            <span className="hidden sm:inline">Inspector</span>
          </button>

          {/* User Profile / Google Sign-in */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-1.5 p-1 sm:px-2 sm:py-1 rounded-xs bg-[#FFFDF9] hover:bg-[#F8F2EB] border border-[#E6CBBD] transition-all text-xs font-medium text-[#351D1D] cursor-pointer"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-5 h-5 rounded-full object-cover border border-[#661414]/20"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-[#661414] text-[#FFFDF9] flex items-center justify-center text-[10px] font-bold">
                    {(user.displayName || user.email || 'R').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="max-w-[100px] truncate hidden md:inline font-mono text-[11px]">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <ChevronDown className="w-3 h-3 text-[#786A61]" />
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 bg-[#FFFDF9] rounded-xs shadow-xl border border-[#E6CBBD] py-2 z-50 animate-in fade-in duration-100"
                  onClick={() => setUserDropdownOpen(false)}
                >
                  <div className="px-3.5 py-2 border-b border-[#E6CBBD]">
                    <p className="text-xs font-bold text-[#351D1D] truncate">
                      {user.displayName || 'Steer Medical Researcher'}
                    </p>
                    <p className="text-[11px] font-mono text-[#786A61] truncate">{user.email}</p>
                    <div className="mt-1 flex items-center gap-1 text-[10px] font-mono text-[#416C49]">
                      <Check className="w-3 h-3" />
                      <span>Cloud SQL Synced</span>
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={signOutUser}
                      className="w-full px-3.5 py-1.5 text-left text-xs text-[#C04E2A] hover:bg-[#F8F2EB] flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => {
                if (onOpenAuthModal) onOpenAuthModal();
                else setIsAuthModalOpen(true);
              }}
              disabled={authLoading}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-[#351D1D] bg-[#FFFDF9] hover:bg-[#F8F2EB] border border-[#E6CBBD] rounded-xs transition-colors cursor-pointer"
              title="Sign in with Google to sync research with Cloud SQL & Firestore"
            >
              <UserIcon className="w-3.5 h-3.5 text-[#661414]" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}
        </div>
      </header>

      {/* Google Authentication Portal Modal */}
      <GoogleAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        sqlSyncStatus={sqlSyncStatus}
      />
    </>
  );
};
