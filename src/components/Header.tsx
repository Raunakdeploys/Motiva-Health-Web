import React, { useState } from 'react';
import { PaperRecord } from '../types';
import { useAuth } from '../context/AuthContext';
import { GoogleAuthModal } from './GoogleAuthModal';
import {
  FileText,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  RotateCcw,
  Database,
  LogOut,
  User as UserIcon,
  ChevronDown,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface HeaderProps {
  currentTab: 'workspace' | 'papers' | 'evidence' | 'review' | 'studio' | 'report' | 'selftest';
  onSelectTab: (tab: 'workspace' | 'papers' | 'evidence' | 'review' | 'studio' | 'report' | 'selftest') => void;
  activePaper: PaperRecord | null;
  approvedClaimsCount: number;
  totalClaimsCount: number;
  hasUnsavedChanges?: boolean;
  onOpenDemo?: () => void;
  sqlSyncStatus?: 'synced' | 'syncing' | 'offline' | 'error';
}

interface TabItem {
  id: HeaderProps['currentTab'];
  label: string;
  badge?: string;
  badgeColor?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  activePaper,
  approvedClaimsCount,
  totalClaimsCount,
  hasUnsavedChanges = false,
  onOpenDemo,
  sqlSyncStatus = 'synced',
}) => {
  const { user, signOutUser, loading: authLoading, error: authError } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const tabs: TabItem[] = [
    { id: 'workspace', label: 'Workbench' },
    { id: 'papers', label: 'Paper Intake' },
    { id: 'evidence', label: 'Evidence Stitch' },
    {
      id: 'review',
      label: 'Claim Review',
      badge: totalClaimsCount > 0 ? `${approvedClaimsCount}/${totalClaimsCount}` : undefined,
      badgeColor: approvedClaimsCount > 0 ? 'bg-[#2D5A27] text-white' : 'bg-[#C04E2A] text-white',
    },
    { id: 'studio', label: 'Content Studio' },
    { id: 'report', label: 'Evidence Report' },
    { id: 'selftest', label: 'Self-Tests' },
  ];

  const handleSignIn = () => {
    setIsAuthModalOpen(true);
  };

  return (
    <header className="border-b border-[#351D1D]/12 bg-[#F8F2EB]/95 backdrop-blur-md sticky top-0 z-50 transition-all shadow-[0_1px_3px_rgba(53,29,29,0.03)]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Identity & Mode Tag */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onSelectTab('workspace')}
            className="flex items-center gap-2.5 text-left focus:outline-none group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-[#661414] text-[#F8F2EB] flex items-center justify-center font-serif italic text-lg font-bold shadow-sm group-hover:bg-[#C04E2A] transition-colors border border-[#661414]/20">
              s
            </div>
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1.5">
                <span className="font-serif italic text-xl font-bold tracking-tight text-[#661414]">
                  MOTIVA
                </span>
                <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-[#351D1D]/80">
                  STITCH
                </span>
              </div>
              <span className="text-[9px] font-mono tracking-wider text-[#8B6A60] uppercase -mt-0.5">
                EVIDENCE STUDIO
              </span>
            </div>
          </button>

          {activePaper?.is_demo && (
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[#C04E2A] bg-[#E6CBBD]/50 px-2.5 py-0.5 rounded-full border border-[#C04E2A]/25 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C04E2A] animate-pulse" />
              SYNTHETIC BENCHMARK
            </span>
          )}
        </div>

        {/* Center: Google Stitch Precision Tab Bar */}
        <nav className="hidden lg:flex items-center bg-[#F5EBDF] p-1 rounded-xl border border-[#351D1D]/10 shadow-[inset_0_1px_2px_rgba(53,29,29,0.04)]">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id as any)}
                className={`relative px-3 py-1.5 text-xs rounded-lg transition-all duration-150 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? 'bg-[#661414] text-[#F8F2EB] shadow-sm font-semibold'
                    : 'text-[#442B2B] hover:text-[#351D1D] hover:bg-[#E6CBBD]/40 font-medium'
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-white/20 text-[#F8F2EB]' : tab.badgeColor
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Cloud SQL Database status, Google Sign In & Quick Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Cloud SQL Status indicator */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono border border-[#351D1D]/10 bg-[#F5EBDF]/80 text-[#351D1D]"
            title="Connected to Cloud SQL PostgreSQL instance (us-west1)"
          >
            <Database className="w-3.5 h-3.5 text-[#2D5A27]" />
            <span className="text-[#8B6A60]">Cloud SQL</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#2D5A27]" />
          </div>

          {/* Quick Demo Reset Button */}
          {onOpenDemo && (
            <button
              onClick={onOpenDemo}
              className="hidden xl:flex items-center gap-1 px-2.5 py-1 text-xs text-[#351D1D] bg-[#FFFFFF] hover:bg-[#F5EBDF] border border-[#351D1D]/15 rounded-lg transition-colors cursor-pointer shadow-xs font-medium"
              title="Reset to synthetic benchmark dataset"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#C04E2A]" />
              <span>Demo</span>
            </button>
          )}

          {/* User Authentication & Google Sign-In */}
          {authLoading ? (
            <div className="w-8 h-8 rounded-full border-2 border-[#661414] border-t-transparent animate-spin" />
          ) : user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1 pl-2 pr-2 rounded-lg bg-[#FFFFFF] hover:bg-[#F5EBDF] border border-[#351D1D]/15 transition-all text-xs font-medium text-[#351D1D] cursor-pointer shadow-xs"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-5 h-5 rounded-full object-cover border border-[#661414]/20"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-[#661414] text-white flex items-center justify-center text-[10px] font-bold">
                    {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="max-w-[100px] truncate hidden md:inline">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#8B6A60]" />
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 bg-[#FFFFFF] rounded-xl shadow-xl border border-[#351D1D]/15 py-2 z-50 animate-in fade-in slide-in-from-top-1"
                  onClick={() => setUserDropdownOpen(false)}
                >
                  <div className="px-3.5 py-2 border-b border-[#351D1D]/10">
                    <p className="text-xs font-bold text-[#351D1D] truncate">
                      {user.displayName || 'MOTIVA Researcher'}
                    </p>
                    <p className="text-[11px] font-mono text-[#8B6A60] truncate">{user.email}</p>
                    <div className="mt-1 flex items-center gap-1 text-[10px] font-mono text-[#2D5A27]">
                      <Check className="w-3 h-3" />
                      <span>Cloud SQL Synced (PostgreSQL)</span>
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={signOutUser}
                      className="w-full px-3.5 py-2 text-left text-xs text-[#C04E2A] hover:bg-[#F8F2EB] flex items-center gap-2 cursor-pointer transition-colors"
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
              onClick={handleSignIn}
              disabled={authLoading}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-[#351D1D] bg-[#FFFFFF] hover:bg-[#F5EBDF] active:scale-95 border border-[#351D1D]/20 rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-50"
              title="Sign in with your Google Account to persist research data to Cloud SQL"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              <span>Sign in with Google</span>
            </button>
          )}

          {/* Primary Action Button */}
          <button
            onClick={() => onSelectTab('papers')}
            className="px-3.5 py-1.5 text-xs font-semibold text-[#F8F2EB] bg-[#661414] hover:bg-[#521010] active:scale-95 rounded-lg transition-all cursor-pointer shadow-xs flex items-center gap-1.5 border border-[#661414]/30"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upload Paper</span>
            <span className="sm:hidden">Upload</span>
          </button>
        </div>
      </div>

      {authError && (
        <div className="bg-[#661414] text-white text-[11px] py-1 px-4 text-center">
          {authError}
        </div>
      )}

      {/* Mobile Horizontal Scroll Navigation */}
      <div className="lg:hidden flex items-center justify-start px-3 py-2 border-t border-[#351D1D]/10 bg-[#F5EBDF] overflow-x-auto gap-1 text-xs scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors ${
              currentTab === tab.id
                ? 'bg-[#661414] text-[#F8F2EB] font-semibold'
                : 'text-[#442B2B] hover:bg-[#E6CBBD]/40 font-medium'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <GoogleAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        sqlSyncStatus={sqlSyncStatus}
      />
    </header>
  );
};
