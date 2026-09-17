import React, { useState } from 'react';
import { SolutionType } from '../types';
import { LAB_STAGES } from '../data/labStages';
import {
  Droplet,
  RotateCcw,
  Sparkles,
  Beaker,
  CheckCircle2,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface BenchPrepProps {
  currentStage: SolutionType;
  onSelectStage: (stage: SolutionType) => void;
  solutionInSlide: SolutionType;
  onApplySolution: (solution: SolutionType) => void;
  onResetLab: () => void;
}

export const BenchPrep: React.FC<BenchPrepProps> = ({
  currentStage,
  onSelectStage,
  solutionInSlide,
  onApplySolution,
  onResetLab,
}) => {
  const [wickingActive, setWickingActive] = useState(false);

  const activeStageConfig = LAB_STAGES.find((s) => s.id === currentStage) || LAB_STAGES[0];

  const triggerSolutionApplication = (solution: SolutionType) => {
    setWickingActive(true);
    onApplySolution(solution);
    setTimeout(() => {
      setWickingActive(false);
    }, 2500);
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-md border border-slate-200/80 flex flex-col gap-5">
      {/* Stage Step Progress & Reset Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100">
        <div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Investigation Steps (7th Grade Lab)
          </span>
          <span className="text-xs text-purple-700 font-semibold">
            Follow the steps in sequence or choose when to add solutions
          </span>
        </div>

        {/* PROMINENT RESET BUTTON */}
        <button
          id="reset-lab-bench-btn"
          onClick={onResetLab}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-300 hover:border-red-300 transition-all cursor-pointer shadow-xs active:scale-98"
          title="Reset the simulation back to initial state"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-600 group-hover:text-red-600" />
          <span>Reset Lab</span>
        </button>
      </div>

      {/* 4 Step Sequence Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {LAB_STAGES.map((stage) => {
          const isActive = currentStage === stage.id;
          return (
            <button
              key={stage.id}
              id={`step-tab-${stage.id}`}
              onClick={() => onSelectStage(stage.id)}
              className={`flex flex-col items-start p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                isActive
                  ? 'bg-purple-50/90 border-purple-500 shadow-md ring-2 ring-purple-400/30 text-purple-950'
                  : 'bg-slate-50/70 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  Step {stage.stepNumber}
                </span>
                {isActive && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
              </div>
              <span className="text-xs font-bold leading-snug line-clamp-1">{stage.title}</span>
              <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                {stage.recommendedMag} objective
              </span>
            </button>
          );
        })}
      </div>

      {/* Interactive Wet Mount Slide Diagram with Wicking Animation */}
      <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200 relative overflow-hidden">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Wet Mount Slide & Solution Wicking Technique
            </h4>
          </div>
          <span className="text-[11px] text-slate-600">
            Current fluid:{' '}
            <strong className="text-purple-800 font-bold capitalize">
              {solutionInSlide.replace(/_/g, ' ')}
            </strong>
          </span>
        </div>

        {/* Visual Glass Slide & Tissue simulation */}
        <div className="relative h-32 bg-gradient-to-b from-slate-100 to-slate-200/90 rounded-xl border border-slate-300 flex items-center justify-center shadow-inner overflow-hidden">
          {/* Glass Slide Body */}
          <div className="w-4/5 h-20 bg-white/95 rounded-lg border border-slate-300 shadow-md relative flex items-center justify-center">
            {/* Frosted labeling end */}
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-slate-200/90 border-r border-slate-300 rounded-l-lg flex items-center justify-center">
              <span className="text-[9px] font-mono -rotate-90 text-slate-500 font-bold select-none">
                SLIDE 1
              </span>
            </div>

            {/* Red Onion Epidermal Peel Sample */}
            <div className="w-24 h-12 bg-purple-300/60 rounded border border-purple-500/50 relative flex items-center justify-center overflow-hidden">
              <div
                className="w-full h-full opacity-40"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(0deg, #7e22ce, #7e22ce 1px, transparent 1px, transparent 8px), repeating-linear-gradient(90deg, #7e22ce, #7e22ce 1px, transparent 1px, transparent 20px)',
                }}
              />
              <span className="absolute text-[9px] font-extrabold text-purple-950 uppercase tracking-tight">
                Red Onion Skin
              </span>
            </div>

            {/* Square Coverslip */}
            <div className="absolute w-28 h-16 border border-cyan-400/90 bg-cyan-100/30 rounded-sm pointer-events-none shadow-sm flex items-center justify-between px-1">
              <span className="text-[8px] text-cyan-800 font-mono font-semibold select-none">
                Coverslip
              </span>
            </div>

            {/* Dropper Pipette (Left) */}
            <div
              className={`absolute -left-3 top-1/2 -translate-y-1/2 transition-transform duration-500 flex items-center ${
                wickingActive ? 'translate-x-3 scale-110' : ''
              }`}
            >
              <div className="w-8 h-3 bg-slate-700 rounded-l-sm relative">
                <div className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-4 h-1.5 bg-slate-400 rounded-r-full" />
              </div>
              {wickingActive && (
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping ml-1" />
              )}
            </div>

            {/* Paper Towel Wicking (Right) */}
            <div
              className={`absolute -right-4 top-1/2 -translate-y-1/2 transition-transform duration-500 flex items-center ${
                wickingActive ? '-translate-x-3' : ''
              }`}
            >
              <div className="w-10 h-14 bg-amber-50 border border-amber-300 rounded-sm shadow-md flex items-center justify-center">
                <span className="text-[8px] text-amber-900 font-mono font-bold -rotate-90">
                  Paper Towel
                </span>
              </div>
            </div>

            {/* Fluid Wave Animation */}
            {wickingActive && (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/30 via-purple-300/40 to-amber-200/30 animate-pulse rounded-lg pointer-events-none" />
            )}
          </div>
        </div>

        <p className="text-[11px] text-slate-500 mt-2 text-center">
          Adding liquid to the left edge while paper towel wicks from the right draws the solution
          directly through the onion cell tissue.
        </p>
      </div>

      {/* Solution Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Fresh Water */}
        <button
          id="add-fresh-water-btn"
          onClick={() => triggerSolutionApplication('fresh_water')}
          className="flex items-center justify-center gap-2 py-3 px-3.5 rounded-2xl border border-sky-300 bg-sky-50 text-sky-950 font-bold text-xs hover:bg-sky-100 transition-all shadow-xs active:scale-98 cursor-pointer"
        >
          <Droplet className="w-4 h-4 text-sky-600 fill-sky-200" />
          <span>Add Fresh Water</span>
        </button>

        {/* 10% Salt Water */}
        <button
          id="add-salt-water-btn"
          onClick={() => triggerSolutionApplication('salt_water')}
          className="flex items-center justify-center gap-2 py-3 px-3.5 rounded-2xl border border-purple-300 bg-purple-50 text-purple-950 font-bold text-xs hover:bg-purple-100 transition-all shadow-xs active:scale-98 cursor-pointer"
        >
          <Beaker className="w-4 h-4 text-purple-700" />
          <span>Add 10% Salt Water</span>
        </button>

        {/* Fresh Water Rinse */}
        <button
          id="add-water-rinse-btn"
          onClick={() => triggerSolutionApplication('fresh_water_rinse')}
          className="flex items-center justify-center gap-2 py-3 px-3.5 rounded-2xl border border-emerald-300 bg-emerald-50 text-emerald-950 font-bold text-xs hover:bg-emerald-100 transition-all shadow-xs active:scale-98 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>Add Fresh Water</span>
        </button>
      </div>
    </div>
  );
};
