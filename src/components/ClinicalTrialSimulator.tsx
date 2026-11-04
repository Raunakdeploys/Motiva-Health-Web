import React, { useState } from 'react';
import { Activity, Sliders, ShieldCheck, HeartPulse, X } from 'lucide-react';

interface ClinicalTrialSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PatientPhenotype {
  id: string;
  name: string;
  age: number;
  gender: string;
  profile: string;
  baselineFatPct: number;
  baselineRmr: number;
  baselineMuscleKg: number;
  defaultProtein: number;
  defaultDeficit: number;
  defaultTrainingDays: number;
  defaultSleep: number;
}

const PHENOTYPES: PatientPhenotype[] = [
  {
    id: 'south_asian',
    name: 'Synthetic profile A · adult example',
    age: 38,
    gender: 'Female',
    profile: 'Illustrative inputs only; not a trial participant or recommendation.',
    baselineFatPct: 34.5,
    baselineRmr: 1380,
    baselineMuscleKg: 24.2,
    defaultProtein: 65,
    defaultDeficit: 400,
    defaultTrainingDays: 2,
    defaultSleep: 6.5,
  },
  {
    id: 't2d_risk',
    name: 'Synthetic profile B · elevated-risk example',
    age: 46,
    gender: 'Male',
    profile: 'Illustrative inputs only; not a trial participant or recommendation.',
    baselineFatPct: 29.8,
    baselineRmr: 1720,
    baselineMuscleKg: 32.5,
    defaultProtein: 80,
    defaultDeficit: 500,
    defaultTrainingDays: 1,
    defaultSleep: 6.0,
  },
  {
    id: 'active_preserver',
    name: 'Synthetic profile C · active-adult example',
    age: 32,
    gender: 'Female',
    profile: 'Illustrative inputs only; not a trial participant or recommendation.',
    baselineFatPct: 26.0,
    baselineRmr: 1450,
    baselineMuscleKg: 27.8,
    defaultProtein: 120,
    defaultDeficit: 350,
    defaultTrainingDays: 4,
    defaultSleep: 7.5,
  },
];

export const ClinicalTrialSimulator: React.FC<ClinicalTrialSimulatorProps> = ({ isOpen, onClose }) => {
  const [selectedPhenotype, setSelectedPhenotype] = useState<PatientPhenotype>(PHENOTYPES[0]);
  const [protein, setProtein] = useState<number>(PHENOTYPES[0].defaultProtein);
  const [deficit, setDeficit] = useState<number>(PHENOTYPES[0].defaultDeficit);
  const [trainingDays, setTrainingDays] = useState<number>(PHENOTYPES[0].defaultTrainingDays);
  const [sleep, setSleep] = useState<number>(PHENOTYPES[0].defaultSleep);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSelectPhenotype = (p: PatientPhenotype) => {
    setSelectedPhenotype(p);
    setProtein(p.defaultProtein);
    setDeficit(p.defaultDeficit);
    setTrainingDays(p.defaultTrainingDays);
    setSleep(p.defaultSleep);
  };

  // Illustrative demo math only; this is not a validated clinical prediction model.
  const proteinBonus = Math.min(protein / 120, 1.3);
  const trainingBonus = trainingDays * 1.8;
  const sleepBonus = sleep >= 7 ? 1.2 : 0.8;

  const predictedFatLossPct = Number(
    ((deficit / 500) * 5.2 * (proteinBonus * 0.7 + trainingBonus * 0.15) * (sleepBonus * 0.9)).toFixed(1)
  );

  const predictedMuscleRetainedKg = Number(
    (
      (protein >= 100 && trainingDays >= 3
        ? 0.8
        : protein >= 80
        ? 0.1
        : -1.2) * (sleep >= 7 ? 1.1 : 0.7)
    ).toFixed(1)
  );

  const predictedRmrDelta = Math.round(
    -120 + (protein >= 90 ? 95 : 20) + (trainingDays * 15) + (sleep >= 7 ? 25 : -15)
  );

  const insulinSensitivityScore = Math.min(
    98,
    Math.round(55 + (trainingDays * 7) + (protein >= 90 ? 12 : 0) + (sleep >= 7 ? 8 : -5) - (deficit > 600 ? 10 : 0))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#351D1D]/70 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl bg-[#FFFDF9] rounded-xs shadow-2xl overflow-hidden border border-[#E6CBBD] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#FAF6F0] border-b border-[#E6CBBD] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xs bg-[#C04E2A] text-[#FFFDF9] flex items-center justify-center shadow-xs">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-serif font-bold text-[#351D1D]">
                  Illustrative Scenario Sandbox
                </h2>
                <span className="px-2 py-0.5 rounded-xs bg-[#C04E2A]/15 text-[#C04E2A] text-[10px] font-mono font-bold uppercase tracking-wider">
                  DEMO ONLY
                </span>
              </div>
              <p className="text-xs text-[#786A61] font-mono">
                Synthetic scenario values from an unvalidated demo formula; not a clinical forecast.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#786A61] hover:text-[#351D1D] p-1.5 rounded-xs hover:bg-[#E6CBBD]/40 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          <div className="rounded-md border border-[#D9B66F] bg-[#FBF4E7] px-4 py-3 text-xs leading-relaxed text-[#5E4821]" role="note">
            Synthetic demo only. These values come from an unvalidated formula, are not derived from a clinical trial, and must not be used for health or treatment decisions.
          </div>

          {/* Phenotype selector */}
          <div className="space-y-2">
            <label className="block text-xs font-mono uppercase tracking-wider text-[#786A61] font-bold">
              01. Select a Synthetic Demo Profile
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {PHENOTYPES.map((p) => {
                const isSelected = selectedPhenotype.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPhenotype(p)}
                    className={`p-3.5 text-left rounded-xs border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#661414] text-[#FFFDF9] border-[#661414] shadow-sm'
                        : 'bg-[#FAF6F0] hover:bg-[#F5EFE6] text-[#351D1D] border-[#E6CBBD]'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-serif font-bold leading-snug">{p.name}</span>
                        {isSelected && <ShieldCheck className="w-4 h-4 text-[#C04E2A] shrink-0" />}
                      </div>
                      <p className={`text-[11px] leading-relaxed ${isSelected ? 'text-[#F5EBDF]' : 'text-[#786A61]'}`}>
                        {p.profile}
                      </p>
                    </div>
                    <div className={`mt-3 pt-2 border-t flex items-center justify-between text-[10px] font-mono ${isSelected ? 'border-[#8B2323] text-[#F5EBDF]' : 'border-[#E6CBBD] text-[#786A61]'}`}>
                      <span>              Demo profile · Age {p.age} · {p.gender}</span>
                      <span>Baseline Fat: {p.baselineFatPct}%</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sliders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-[#FAF6F0] rounded-xs border border-[#E6CBBD]">
            <div className="space-y-4">
              <h3 className="text-xs font-serif font-bold text-[#351D1D] uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-[#C04E2A]" />
                <span>Illustrative inputs</span>
              </h3>

              {/* Protein Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-[#351D1D]">
                  <span>Demo protein input</span>
                  <span className="font-mono font-bold text-[#661414]">{protein}g / day</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="180"
                  step="5"
                  value={protein}
                  onChange={(e) => setProtein(Number(e.target.value))}
                  className="w-full accent-[#661414] cursor-pointer"
                />
                <p className="text-[10px] text-[#786A61]">Illustrative value only; not a nutrition recommendation.</p>
              </div>

              {/* Caloric Deficit Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-[#351D1D]">
                  <span>Demo calorie-deficit input</span>
                  <span className="font-mono font-bold text-[#C04E2A]">{deficit > 0 ? `-${deficit}` : `+${Math.abs(deficit)}`} kcal</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="800"
                  step="50"
                  value={deficit}
                  onChange={(e) => setDeficit(Number(e.target.value))}
                  className="w-full accent-[#C04E2A] cursor-pointer"
                />
                <p className="text-[10px] text-[#786A61]">Illustrative value only; this formula does not model clinical effects.</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-serif font-bold text-[#351D1D] uppercase tracking-wider flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-[#416C49]" />
                <span>Illustrative inputs</span>
              </h3>

              {/* Training Days */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-[#351D1D]">
                  <span>Demo training-frequency input</span>
                  <span className="font-mono font-bold text-[#416C49]">{trainingDays} days / week</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="1"
                  value={trainingDays}
                  onChange={(e) => setTrainingDays(Number(e.target.value))}
                  className="w-full accent-[#416C49] cursor-pointer"
                />
                <p className="text-[10px] text-[#786A61]">Illustrative value only; not an exercise recommendation.</p>
              </div>

              {/* Sleep Duration */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-[#351D1D]">
                  <span>Demo sleep-duration input</span>
                  <span className="font-mono font-bold text-[#351D1D]">{sleep} hours / night</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="9"
                  step="0.5"
                  value={sleep}
                  onChange={(e) => setSleep(Number(e.target.value))}
                  className="w-full accent-[#351D1D] cursor-pointer"
                />
                <p className="text-[10px] text-[#786A61]">Illustrative value only; not a health recommendation.</p>
              </div>
            </div>
          </div>

          {/* 12-Week Predictive Results Dashboard */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#786A61] font-bold">
              02. Illustrative 12-Week Demo Output (Not Validated)
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#FFFDF9] border border-[#E6CBBD] p-4 rounded-xs text-center space-y-1 shadow-2xs">
                <span className="text-[10px] font-mono text-[#786A61] uppercase tracking-wider block">Demo fat-change value</span>
                <span className="text-2xl font-serif font-bold text-[#661414]">{predictedFatLossPct}%</span>
                <span className="text-[10px] text-[#786A61] font-medium block">Arbitrary demo output</span>
              </div>

              <div className="bg-[#FFFDF9] border border-[#E6CBBD] p-4 rounded-xs text-center space-y-1 shadow-2xs">
                <span className="text-[10px] font-mono text-[#786A61] uppercase tracking-wider block">Demo muscle-change value</span>
                <span className="text-2xl font-serif font-bold text-[#351D1D]">
                  {predictedMuscleRetainedKg >= 0 ? `+${predictedMuscleRetainedKg}kg` : `${predictedMuscleRetainedKg}kg`}
                </span>
                <span className="text-[10px] text-[#786A61] font-medium block">Arbitrary demo output</span>
              </div>

              <div className="bg-[#FFFDF9] border border-[#E6CBBD] p-4 rounded-xs text-center space-y-1 shadow-2xs">
                <span className="text-[10px] font-mono text-[#786A61] uppercase tracking-wider block">Demo RMR value</span>
                <span className="text-2xl font-serif font-bold text-[#351D1D]">
                  {predictedRmrDelta > 0 ? `+${predictedRmrDelta}` : predictedRmrDelta} kcal
                </span>
                <span className="text-[10px] text-[#786A61] font-medium block">Arbitrary demo output</span>
              </div>

              <div className="bg-[#FFFDF9] border border-[#E6CBBD] p-4 rounded-xs text-center space-y-1 shadow-2xs">
                <span className="text-[10px] font-mono text-[#786A61] uppercase tracking-wider block">Demo-only index</span>
                <span className="text-2xl font-serif font-bold text-[#351D1D]">{insulinSensitivityScore} / 100</span>
                <span className="text-[10px] text-[#786A61] font-medium block">Arbitrary demo output</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-[#FBF4E7] border border-[#D9B66F] rounded-md space-y-2" role="note">
            <div className="flex items-center gap-2 text-[#5E4821] font-bold text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>What this demo cannot tell you</span>
            </div>
            <p className="text-xs text-[#5E4821] leading-relaxed">
              These sliders and outputs use synthetic profiles and an unvalidated formula. They do not forecast individual outcomes or recommend nutrition, exercise, or treatment. Do not use them for care decisions; consult a qualified healthcare professional.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#FAF6F0] border-t border-[#E6CBBD] flex items-center justify-between shrink-0">
          <span className="text-[11px] font-mono text-[#786A61]">
            MOTIVA scenario sandbox · Not medical advice
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#661414] hover:bg-[#501010] text-[#FFFDF9] text-xs font-semibold rounded-xs shadow-xs transition-colors cursor-pointer"
          >
            Close Simulator
          </button>
        </div>
      </div>
    </div>
  );
};
