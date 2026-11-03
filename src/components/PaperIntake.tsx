import React, { useState, useRef } from 'react';
import { PaperRecord, EvidencePassage } from '../types';
import { extractPdfDocument, createManualPaperEntry } from '../utils/pdfExtractor';
import {
  FileUp,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit2,
  Plus,
  BookOpen,
  ArrowRight,
  ClipboardPaste,
  Check,
  X,
  Sparkles,
} from 'lucide-react';

interface PaperIntakeProps {
  papers: PaperRecord[];
  activePaper: PaperRecord | null;
  passages: EvidencePassage[];
  onAddPaper: (paper: PaperRecord, passages: EvidencePassage[]) => void;
  onUpdatePaper: (paper: PaperRecord) => void;
  onDeletePaper: (paperId: string) => void;
  onSelectPaper: (paperId: string) => void;
  onNavigateToEvidence: () => void;
}

export const PaperIntake: React.FC<PaperIntakeProps> = ({
  papers,
  activePaper,
  passages,
  onAddPaper,
  onUpdatePaper,
  onDeletePaper,
  onSelectPaper,
  onNavigateToEvidence,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Manual text paste modal state
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualJournal, setManualJournal] = useState('');
  const [manualYear, setManualYear] = useState(new Date().getFullYear().toString());
  const [manualDoi, setManualDoi] = useState('');
  const [manualText, setManualText] = useState('');

  // Metadata editor state
  const [editingPaper, setEditingPaper] = useState<PaperRecord | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = async (file: File) => {
    setErrorMessage(null);

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setErrorMessage('Invalid file format. Please upload a scientific paper in PDF format (.pdf).');
      return;
    }

    const MAX_SIZE_BYTES = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      setErrorMessage(`File exceeds 25 MB size limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
      return;
    }

    setIsProcessing(true);
    setProgressPercent(5);
    setProgressMessage('Reading PDF file stream...');

    try {
      const result = await extractPdfDocument(file, (percent, msg) => {
        setProgressPercent(percent);
        setProgressMessage(msg);
      });

      onAddPaper(result.paper, result.passages);
      setIsProcessing(false);
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage(
        err?.message ||
          'Extraction failed. If this is a scanned document without machine-readable text, use the "Paste Paper Text" option below.'
      );
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim()) {
      alert('Please enter or paste paper excerpts to extract evidence passages.');
      return;
    }

    const result = createManualPaperEntry(
      manualTitle.trim() || 'Manually Ingested Research Paper',
      manualJournal.trim() || 'Independent Clinical Review',
      manualYear.trim(),
      manualDoi.trim(),
      manualText.trim()
    );

    onAddPaper(result.paper, result.passages);
    setShowManualModal(false);
    setManualTitle('');
    setManualJournal('');
    setManualDoi('');
    setManualText('');
  };

  const saveMetadataEdits = () => {
    if (editingPaper) {
      onUpdatePaper({
        ...editingPaper,
        is_metadata_verified: true,
      });
      setEditingPaper(null);
    }
  };

  const currentPassages = activePaper
    ? passages.filter((p) => p.paper_id === activePaper.paper_id)
    : [];

  return (
    <div className="max-w-[1360px] mx-auto p-4 sm:p-6 md:p-8 space-y-8">
      {/* 00. Landmark Research Studies for Hackathon PS2 */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[#661414] text-[#F5EBDF] text-[10px] font-mono font-bold uppercase rounded-xs">
                STAGE 01: INGESTION
              </span>
              <span className="text-xs font-mono text-[#C04E2A] font-semibold">
                Landmark Metabolic Research Library
              </span>
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#351D1D] mt-1 tracking-tight">
              Select a Clinical Study or Upload Any Medical PDF
            </h2>
          </div>
          <span className="text-xs font-mono text-[#786A61]">
            Problem Statement 2 • steerclub.com
          </span>
        </div>

        {/* 3 Landmark Study Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Study 1: GLP-1 & Lean Mass */}
          <div
            onClick={() => onSelectPaper('paper_glp1_muscle_2024')}
            className={`p-5 rounded-xs border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
              activePaper?.paper_id === 'paper_glp1_muscle_2024'
                ? 'bg-[#FFFDF9] border-[#661414] shadow-md ring-1 ring-[#661414]'
                : 'bg-[#FFFDF9] border-[#E6CBBD] hover:border-[#C04E2A]'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="px-2 py-0.5 bg-[#661414]/10 text-[#661414] font-bold rounded-xs">
                  NEJM 2021
                </span>
                {activePaper?.paper_id === 'paper_glp1_muscle_2024' ? (
                  <span className="text-[#416C49] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> ACTIVE
                  </span>
                ) : (
                  <span className="text-[#786A61]">Wilding et al.</span>
                )}
              </div>
              <h3 className="font-serif font-bold text-sm text-[#351D1D] leading-snug">
                Once-Weekly Semaglutide in Adults with Overweight or Obesity
              </h3>
              <p className="text-xs text-[#786A61] line-clamp-2 leading-relaxed">
                Landmark STEP-1 clinical trial: up to 39% of weight loss on GLP-1 is lean muscle mass, requiring high-protein protection.
              </p>
            </div>
            <div className="pt-2 border-t border-[#E6CBBD] flex items-center justify-between text-xs font-mono">
              <span className="text-[#C04E2A] font-bold">1,961 Patients</span>
              <span className="text-[#661414] font-semibold flex items-center gap-1">
                {activePaper?.paper_id === 'paper_glp1_muscle_2024' ? 'Current Paper' : 'Select Paper →'}
              </span>
            </div>
          </div>

          {/* Study 2: South Asian Phenotype */}
          <div
            onClick={() => onSelectPaper('paper_south_asian_phenotype_2024')}
            className={`p-5 rounded-xs border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
              activePaper?.paper_id === 'paper_south_asian_phenotype_2024'
                ? 'bg-[#FFFDF9] border-[#661414] shadow-md ring-1 ring-[#661414]'
                : 'bg-[#FFFDF9] border-[#E6CBBD] hover:border-[#C04E2A]'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="px-2 py-0.5 bg-[#C04E2A]/10 text-[#C04E2A] font-bold rounded-xs">
                  DRCP 2023
                </span>
                {activePaper?.paper_id === 'paper_south_asian_phenotype_2024' ? (
                  <span className="text-[#416C49] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> ACTIVE
                  </span>
                ) : (
                  <span className="text-[#786A61]">Misra & Vikram</span>
                )}
              </div>
              <h3 className="font-serif font-bold text-sm text-[#351D1D] leading-snug">
                Insulin Resistance & The 'Thin-Fat' South Asian Phenotype
              </h3>
              <p className="text-xs text-[#786A61] line-clamp-2 leading-relaxed">
                Why Indians with normal BMI suffer severe 3 PM insulin crashes, visceral adiposity, and earlier onset of type-2 diabetes.
              </p>
            </div>
            <div className="pt-2 border-t border-[#E6CBBD] flex items-center justify-between text-xs font-mono">
              <span className="text-[#C04E2A] font-bold">Indian Cohort</span>
              <span className="text-[#661414] font-semibold flex items-center gap-1">
                {activePaper?.paper_id === 'paper_south_asian_phenotype_2024' ? 'Current Paper' : 'Select Paper →'}
              </span>
            </div>
          </div>

          {/* Study 3: Adaptive Thermogenesis */}
          <div
            onClick={() => onSelectPaper('paper_metabolic_adaptation_2024')}
            className={`p-5 rounded-xs border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
              activePaper?.paper_id === 'paper_metabolic_adaptation_2024'
                ? 'bg-[#FFFDF9] border-[#661414] shadow-md ring-1 ring-[#661414]'
                : 'bg-[#FFFDF9] border-[#E6CBBD] hover:border-[#C04E2A]'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="px-2 py-0.5 bg-[#416C49]/10 text-[#416C49] font-bold rounded-xs">
                  OBESITY 2016
                </span>
                {activePaper?.paper_id === 'paper_metabolic_adaptation_2024' ? (
                  <span className="text-[#416C49] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> ACTIVE
                  </span>
                ) : (
                  <span className="text-[#786A61]">Kevin Hall et al.</span>
                )}
              </div>
              <h3 className="font-serif font-bold text-sm text-[#351D1D] leading-snug">
                Persistent Metabolic Adaptation 6 Years After Crash Dieting
              </h3>
              <p className="text-xs text-[#786A61] line-clamp-2 leading-relaxed">
                Resting metabolic rate drops by ~500 kcal/day and stays suppressed for years, proving weight regain is hormonal biology.
              </p>
            </div>
            <div className="pt-2 border-t border-[#E6CBBD] flex items-center justify-between text-xs font-mono">
              <span className="text-[#C04E2A] font-bold">6-Year Followup</span>
              <span className="text-[#661414] font-semibold flex items-center gap-1">
                {activePaper?.paper_id === 'paper_metabolic_adaptation_2024' ? 'Current Paper' : 'Select Paper →'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 01. Ingestion Area */}
      <section className="bg-[#FFFDF9] border border-[#E6CBBD] p-5 sm:p-6 space-y-4 rounded-xs shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E6CBBD] pb-4">
          <div>
            <h2 className="font-serif text-lg font-bold text-[#351D1D]">
              Or Upload a New Scientific PDF / Publication
            </h2>
            <p className="text-xs text-[#786A61]">
              Every page text layer is extracted into verifiable evidence blocks with verbatim quotes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="px-4 py-2 bg-[#661414] hover:bg-[#501010] disabled:opacity-50 text-[#FFFDF9] rounded-xs text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
            >
              <FileUp className="w-3.5 h-3.5" />
              <span>Select PDF Document</span>
            </button>

            <button
              onClick={() => setShowManualModal(true)}
              className="px-3.5 py-2 bg-[#FFFDF9] hover:bg-[#F8F2EB] text-[#351D1D] border border-[#E6CBBD] rounded-xs text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <ClipboardPaste className="w-3.5 h-3.5 text-[#786A61]" />
              <span>Paste Text (OCR Fallback)</span>
            </button>
          </div>
        </div>

        {/* Drag & Drop Target Area */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleFileDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`py-10 px-4 text-center border-2 border-dashed rounded-xs transition-all cursor-pointer ${
            isDragging
              ? 'border-[#661414] bg-[#FAF6F0]'
              : 'border-[#E6CBBD] bg-[#FAF6F0]/50 hover:border-[#661414]/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileInputChange}
            className="hidden"
          />

          <FileUp className="w-8 h-8 mx-auto text-[#B58777] mb-2" />
          <span className="text-xs font-semibold text-[#351D1D] block">
            Drag and drop research PDF here, or click to browse files
          </span>
          <span className="text-[11px] font-mono text-[#786A61] block mt-1">
            Standard publication formats (.pdf) · Max 25 MB
          </span>
        </div>

        {/* Processing State */}
        {isProcessing && (
          <div className="p-3.5 bg-[#FAF6F0] border border-[#E6CBBD] rounded-xs space-y-2">
            <div className="flex justify-between items-center text-xs font-mono text-[#351D1D]">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#C04E2A] animate-spin" />
                {progressMessage}
              </span>
              <span className="font-bold">{progressPercent}%</span>
            </div>
            <div className="w-full bg-[#E6CBBD] h-1.5 overflow-hidden rounded-full">
              <div
                className="bg-[#661414] h-1.5 transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="p-3.5 bg-[#661414]/10 border border-[#661414]/30 text-xs text-[#661414] flex items-start gap-2.5 rounded-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#661414]" />
            <div>
              <span className="font-semibold">Ingestion Issue: </span>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}
      </section>

      {/* 02. The Ingested Document at the Center of Workspace */}
      {activePaper && (
        <section className="bg-[#FFFDF9] border border-[#E6CBBD] p-5 sm:p-6 space-y-5 rounded-xs shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E6CBBD] pb-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#786A61] font-semibold">
                ACTIVE DOCUMENT RECORD
              </span>
              {activePaper.is_metadata_verified ? (
                <span className="text-[10px] font-mono text-[#416C49] bg-[#416C49]/15 px-2 py-0.5 rounded-xs font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Metadata Verified
                </span>
              ) : (
                <span className="text-[10px] font-mono text-[#C04E2A] bg-[#C04E2A]/15 px-2 py-0.5 rounded-xs font-semibold">
                  Unverified (Review Metadata)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditingPaper(activePaper)}
                className="px-2.5 py-1 text-xs border border-[#E6CBBD] hover:bg-[#F8F2EB] text-[#351D1D] rounded-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Edit2 className="w-3 h-3 text-[#786A61]" />
                <span>Edit Metadata</span>
              </button>

              <button
                onClick={onNavigateToEvidence}
                className="px-3.5 py-1 text-xs font-semibold bg-[#661414] hover:bg-[#501010] text-[#FFFDF9] rounded-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
              >
                <span>Inspect Evidence ({currentPassages.length} passages)</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#351D1D] leading-snug">
              {activePaper.title}
            </h1>
            <p className="text-xs text-[#786A61]">
              Authors: {activePaper.authors}
            </p>
          </div>

          {/* Structured Document Attributes Table */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border-t border-[#E6CBBD] pt-4 font-mono">
            <div className="p-3 bg-[#FAF6F0] border border-[#E6CBBD] rounded-xs">
              <span className="text-[9px] uppercase text-[#786A61] block">Journal</span>
              <span className="text-[#391E1D] font-medium block truncate mt-0.5">{activePaper.journal || 'Not specified'}</span>
            </div>
            <div className="p-3 bg-[#FAF6F0] border border-[#E6CBBD] rounded-xs">
              <span className="text-[9px] uppercase text-[#786A61] block">Publication Year</span>
              <span className="text-[#391E1D] font-medium block mt-0.5">{activePaper.year || 'Unknown'}</span>
            </div>
            <div className="p-3 bg-[#FAF6F0] border border-[#E6CBBD] rounded-xs">
              <span className="text-[9px] uppercase text-[#786A61] block">DOI Reference</span>
              <span className="text-[#391E1D] font-medium block truncate mt-0.5">{activePaper.doi || 'None recorded'}</span>
            </div>
            <div className="p-3 bg-[#FAF6F0] border border-[#E6CBBD] rounded-xs">
              <span className="text-[9px] uppercase text-[#786A61] block">Extracted Extent</span>
              <span className="text-[#416C49] font-medium block mt-0.5">{activePaper.total_pages} Pages · {currentPassages.length} Passages</span>
            </div>
          </div>
        </section>
      )}

      {/* 03. Paper Library Registry */}
      <section className="bg-[#FFFDF9] border border-[#E6CBBD] p-5 sm:p-6 space-y-4 rounded-xs shadow-xs">
        <div className="flex items-center justify-between border-b border-[#E6CBBD] pb-3">
          <div>
            <h3 className="font-serif text-base font-bold text-[#351D1D]">
              Research Document Library
            </h3>
            <p className="text-xs text-[#786A61]">
              Ingested papers in current investigative workspace.
            </p>
          </div>
          <span className="text-xs font-mono text-[#786A61]">
            {papers.length} Document{papers.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="divide-y divide-[#E6CBBD]">
          {papers.map((p) => {
            const isCurrent = p.paper_id === activePaper?.paper_id;
            return (
              <div
                key={p.paper_id}
                className={`py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors ${
                  isCurrent ? 'bg-[#FAF6F0]/80 -mx-2 px-3 rounded-xs' : 'hover:bg-[#FAF6F0]/40 px-1'
                }`}
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-[#786A61]">
                      {p.year} · {p.journal || 'Journal'}
                    </span>
                    {p.is_demo && (
                      <span className="text-[9px] font-mono uppercase text-[#C04E2A] font-bold">
                        DEMO
                      </span>
                    )}
                    {isCurrent && (
                      <span className="text-[9px] font-mono text-[#416C49] font-semibold border border-[#416C49]/30 px-1 rounded-xs">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <h4
                    onClick={() => onSelectPaper(p.paper_id)}
                    className="font-serif text-sm font-semibold text-[#351D1D] hover:text-[#661414] cursor-pointer line-clamp-1 transition-colors"
                  >
                    {p.title}
                  </h4>
                  <div className="text-[11px] font-mono text-[#786A61]">
                    DOI: {p.doi || 'None'} · {p.total_pages} Pages
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {!isCurrent && (
                    <button
                      onClick={() => onSelectPaper(p.paper_id)}
                      className="px-2.5 py-1 text-xs font-medium border border-[#E6CBBD] hover:bg-[#F8F2EB] text-[#351D1D] rounded-xs cursor-pointer transition-colors"
                    >
                      Set Active
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (confirm(`Remove "${p.title}" and all associated evidence?`)) {
                        onDeletePaper(p.paper_id);
                      }
                    }}
                    className="p-1.5 text-[#786A61] hover:text-[#661414] cursor-pointer rounded-xs hover:bg-[#F8F2EB] transition-colors"
                    title="Delete paper record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Metadata Edit Modal */}
      {editingPaper && (
        <div className="fixed inset-0 z-50 bg-[#351D1D]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF9] border border-[#E6CBBD] max-w-lg w-full p-6 space-y-4 shadow-xl rounded-xs animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E6CBBD] pb-3">
              <h3 className="font-serif font-bold text-base text-[#351D1D]">
                Verify Publication Metadata
              </h3>
              <button
                onClick={() => setEditingPaper(null)}
                className="text-[#786A61] hover:text-[#351D1D] p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-mono text-[10px] uppercase text-[#786A61] block font-semibold mb-1">
                  Full Publication Title
                </label>
                <input
                  type="text"
                  value={editingPaper.title}
                  onChange={(e) => setEditingPaper({ ...editingPaper, title: e.target.value })}
                  className="w-full p-2 bg-[#FAF6F0] border border-[#E6CBBD] rounded-xs text-xs focus:outline-hidden focus:border-[#661414]"
                />
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase text-[#786A61] block font-semibold mb-1">
                  Journal / Publishing Source
                </label>
                <input
                  type="text"
                  value={editingPaper.journal}
                  onChange={(e) => setEditingPaper({ ...editingPaper, journal: e.target.value })}
                  className="w-full p-2 bg-[#FAF6F0] border border-[#E6CBBD] rounded-xs text-xs focus:outline-hidden focus:border-[#661414]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-[10px] uppercase text-[#786A61] block font-semibold mb-1">
                    Year
                  </label>
                  <input
                    type="text"
                    value={editingPaper.year}
                    onChange={(e) => setEditingPaper({ ...editingPaper, year: e.target.value })}
                    className="w-full p-2 bg-[#FAF6F0] border border-[#E6CBBD] rounded-xs text-xs focus:outline-hidden focus:border-[#661414]"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase text-[#786A61] block font-semibold mb-1">
                    DOI
                  </label>
                  <input
                    type="text"
                    value={editingPaper.doi}
                    onChange={(e) => setEditingPaper({ ...editingPaper, doi: e.target.value })}
                    className="w-full p-2 bg-[#FAF6F0] border border-[#E6CBBD] rounded-xs text-xs focus:outline-hidden focus:border-[#661414]"
                  />
                </div>
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase text-[#786A61] block font-semibold mb-1">
                  Authors
                </label>
                <input
                  type="text"
                  value={editingPaper.authors}
                  onChange={(e) => setEditingPaper({ ...editingPaper, authors: e.target.value })}
                  className="w-full p-2 bg-[#FAF6F0] border border-[#E6CBBD] rounded-xs text-xs focus:outline-hidden focus:border-[#661414]"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-[#E6CBBD]">
                <button
                  onClick={() => setEditingPaper(null)}
                  className="px-3.5 py-1.5 border border-[#E6CBBD] hover:bg-[#F8F2EB] text-[#351D1D] rounded-xs text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={saveMetadataEdits}
                  className="px-4 py-1.5 bg-[#661414] hover:bg-[#501010] text-[#FFFDF9] rounded-xs text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Save Verified Metadata
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Paste Text Fallback Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-[#351D1D]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF9] border border-[#E6CBBD] max-w-xl w-full p-6 space-y-4 shadow-xl rounded-xs animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E6CBBD] pb-3">
              <h3 className="font-serif font-bold text-base text-[#351D1D]">
                Paste Study Text (OCR Fallback)
              </h3>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-[#786A61] hover:text-[#351D1D] p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-mono text-[10px] uppercase text-[#786A61] block font-semibold mb-1">
                  Study Title
                </label>
                <input
                  type="text"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="e.g. Clinical evaluation of metabolic adaptation..."
                  className="w-full p-2 bg-[#FAF6F0] border border-[#E6CBBD] rounded-xs text-xs focus:outline-hidden focus:border-[#661414]"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-mono text-[10px] uppercase text-[#786A61] block font-semibold mb-1">
                    Journal
                  </label>
                  <input
                    type="text"
                    value={manualJournal}
                    onChange={(e) => setManualJournal(e.target.value)}
                    className="w-full p-2 bg-[#FAF6F0] border border-[#E6CBBD] rounded-xs text-xs focus:outline-hidden focus:border-[#661414]"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase text-[#786A61] block font-semibold mb-1">
                    Year
                  </label>
                  <input
                    type="text"
                    value={manualYear}
                    onChange={(e) => setManualYear(e.target.value)}
                    className="w-full p-2 bg-[#FAF6F0] border border-[#E6CBBD] rounded-xs text-xs focus:outline-hidden focus:border-[#661414]"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase text-[#786A61] block font-semibold mb-1">
                    DOI
                  </label>
                  <input
                    type="text"
                    value={manualDoi}
                    onChange={(e) => setManualDoi(e.target.value)}
                    className="w-full p-2 bg-[#FAF6F0] border border-[#E6CBBD] rounded-xs text-xs focus:outline-hidden focus:border-[#661414]"
                  />
                </div>
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase text-[#786A61] block font-semibold mb-1">
                  Verbatim Scientific Excerpts (Abstract, Methods, Results, Limitations)
                </label>
                <textarea
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  rows={8}
                  placeholder="Paste verbatim text paragraphs here..."
                  className="w-full p-2.5 bg-[#FAF6F0] border border-[#E6CBBD] rounded-xs text-xs font-serif leading-relaxed focus:outline-hidden focus:border-[#661414]"
                  required
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-[#E6CBBD]">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-3.5 py-1.5 border border-[#E6CBBD] hover:bg-[#F8F2EB] text-[#351D1D] rounded-xs text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#661414] hover:bg-[#501010] text-[#FFFDF9] rounded-xs text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Extract Evidence Passages
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
