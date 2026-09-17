import React, { useState, useEffect, useCallback } from 'react';
import {
  MicroscopeState,
  SolutionType,
} from './types';
import { LAB_STAGES } from './data/labStages';
import { MicroscopeViewer } from './components/MicroscopeViewer';
import { BenchPrep } from './components/BenchPrep';
import {
  Microscope,
  RotateCcw,
} from 'lucide-react';

export default function App() {
  // Microscope Optical State
  const [microscopeState, setMicroscopeState] = useState<MicroscopeState>({
    objective: '10x', // Starts at 10x (100x Total)
    coarseFocus: 50,
    fineFocus: 50,
    lightIntensity: 85,
    irisDiaphragm: 80,
    panX: 0,
    panY: 0,
    showGridRuler: false,
  });

  // Lab Stage & Osmotic State
  // Initial: ~0.90
  // Fresh Water (Step 2): 1.0 (fully turgid)
  // Salt Water (Step 3): ~0.58 (shrunk with scalloped edges as in reference image, NOT reduced to zero)
  // Fresh Water Rinse (Step 4): ~0.84 (partially recovered, does NOT return to 100% full size)
  const [currentStage, setCurrentStage] = useState<SolutionType>('initial');
  const [solutionInSlide, setSolutionInSlide] = useState<SolutionType>('initial');
  const [hasPlasmolyzed, setHasPlasmolyzed] = useState<boolean>(false);
  const [osmoticLevel, setOsmoticLevel] = useState<number>(0.90);
  const [targetOsmoticLevel, setTargetOsmoticLevel] = useState<number>(0.90);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1);

  // Smooth live osmosis animation loop
  useEffect(() => {
    if (!isSimulating) return;

    let frameId: number;
    const stepSpeed = 0.0022 * simulationSpeed;

    const animate = () => {
      setOsmoticLevel((prev) => {
        const diff = targetOsmoticLevel - prev;
        if (Math.abs(diff) < 0.004) {
          setIsSimulating(false);
          return targetOsmoticLevel;
        }
        return prev + Math.sign(diff) * stepSpeed;
      });

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [isSimulating, targetOsmoticLevel, simulationSpeed]);

  // Handle stage selection
  const handleSelectStage = useCallback((stageId: SolutionType) => {
    setCurrentStage(stageId);
    const stage = LAB_STAGES.find((s) => s.id === stageId);
    if (!stage) return;

    if (stageId === 'salt_water' || stageId === 'fresh_water_rinse') {
      setHasPlasmolyzed(true);
    }

    setMicroscopeState((prev) => ({
      ...prev,
      objective: stage.recommendedMag,
    }));

    setTargetOsmoticLevel(stage.defaultOsmoticLevel);
    setIsSimulating(true);
  }, []);

  // Handle applying solutions
  const handleApplySolution = useCallback(
    (solution: SolutionType) => {
      let target = 0.90;
      let effectiveSolution = solution;

      if (solution === 'fresh_water') {
        // If cells have already been exposed to salt water, re-adding fresh water
        // CANNOT fill the whole cell again (partial deplasmolysis with prominent gaps)!
        if (hasPlasmolyzed || solutionInSlide === 'salt_water' || currentStage === 'salt_water' || currentStage === 'fresh_water_rinse') {
          effectiveSolution = 'fresh_water_rinse';
          target = 0.72; // Recovers partially (~72%), does NOT fill the whole cell again!
          setHasPlasmolyzed(true);
        } else {
          target = 1.0; // Initial fresh water mount (fully turgid)
        }
      } else if (solution === 'salt_water') {
        // Plasmolysis in 10% salt water
        target = 0.58;
        setHasPlasmolyzed(true);
      } else if (solution === 'fresh_water_rinse') {
        // Re-adding fresh water: does NOT return to 100% full size (prominent unfilled gaps remain)
        target = 0.72;
        setHasPlasmolyzed(true);
      }

      setSolutionInSlide(effectiveSolution);
      setCurrentStage(effectiveSolution);
      setTargetOsmoticLevel(target);
      setIsSimulating(true);
    },
    [hasPlasmolyzed, solutionInSlide, currentStage]
  );

  // RESET FUNCTIONALITY (Prominently requested by user)
  const handleResetLab = useCallback(() => {
    setIsSimulating(false);
    setHasPlasmolyzed(false);
    setCurrentStage('initial');
    setSolutionInSlide('initial');
    setOsmoticLevel(0.90);
    setTargetOsmoticLevel(0.90);
    setMicroscopeState({
      objective: '10x',
      coarseFocus: 50,
      fineFocus: 50,
      lightIntensity: 85,
      irisDiaphragm: 80,
      panX: 0,
      panY: 0,
      showGridRuler: false,
    });
  }, []);

  const activeStage = LAB_STAGES.find((s) => s.id === currentStage) || LAB_STAGES[0];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col antialiased">
      {/* App Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          {/* Brand & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-700 to-pink-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <Microscope className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  Red Onion Cell Lab
                </h1>
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                  7th Grade Life Science
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Cellular Osmosis & Plasmolysis Investigation
              </p>
            </div>
          </div>

          {/* Action Header Buttons including RESET */}
          <div className="flex items-center gap-2.5">
            {/* Prominent Reset Button */}
            <button
              id="header-reset-btn"
              onClick={handleResetLab}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-300 hover:border-red-300 transition-all cursor-pointer shadow-xs active:scale-98"
              title="Reset the lab back to Step 1"
            >
              <RotateCcw className="w-4 h-4 text-slate-600 group-hover:text-red-600" />
              <span>Reset Lab</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Lab Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* Lab Step Objective Banner */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-5 text-white shadow-md flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1 min-w-[280px]">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-mono uppercase tracking-widest text-purple-300 font-extrabold">
                Current Lab Step: Step {activeStage.stepNumber} of 4
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
              <span className="text-xs text-purple-200 font-semibold">{activeStage.targetSolution}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight mb-1">
              {activeStage.title}
            </h2>
            <p className="text-xs sm:text-sm text-purple-100/90 leading-relaxed max-w-3xl">
              {activeStage.description}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-purple-950/80 border border-purple-400/30 rounded-2xl px-4 py-2.5 text-center shadow-inner">
              <span className="text-[10px] uppercase tracking-wider text-purple-300 block font-mono font-bold">
                Suggested Objective
              </span>
              <span className="text-sm font-extrabold text-white">
                {activeStage.recommendedMag} Lens
              </span>
            </div>
          </div>
        </div>

        {/* 2-Column Lab Workspace: Microscope on Left, Workbench on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Microscope Viewport (6 cols on lg) */}
          <div className="lg:col-span-6 flex flex-col gap-4 sticky lg:top-20">
            <MicroscopeViewer
              microscopeState={microscopeState}
              setMicroscopeState={setMicroscopeState}
              osmoticLevel={osmoticLevel}
              solutionInSlide={solutionInSlide}
              isSimulating={isSimulating}
              currentStageName={activeStage.title}
            />
          </div>

          {/* Slide Workbench & Solution Controls (6 cols on lg) */}
          <div className="lg:col-span-6 flex flex-col gap-5">
            <BenchPrep
              currentStage={currentStage}
              onSelectStage={handleSelectStage}
              solutionInSlide={solutionInSlide}
              onApplySolution={handleApplySolution}
              onResetLab={handleResetLab}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
        <p>
          Red Onion Cell Lab • Designed for 7th Grade Life Science & Cellular
          Biology • Standards: MS-LS1-2
        </p>
      </footer>
    </div>
  );
}
