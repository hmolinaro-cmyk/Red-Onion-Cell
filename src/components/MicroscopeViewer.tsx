import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  MagnificationObjective,
  MicroscopeState,
  SolutionType,
} from '../types';
import { MAGNIFICATION_CONFIGS } from '../data/labStages';
import {
  generateRealisticCells,
  getVacuolePerimeter,
  getVacuoleFoldCreases,
  traceCellWallPath,
  RealisticCell,
} from '../utils/cellSimulation';
import {
  ZoomIn,
  Move,
  Sun,
  Sliders,
  Sparkles,
  Layers,
} from 'lucide-react';

interface MicroscopeViewerProps {
  microscopeState: MicroscopeState;
  setMicroscopeState: React.Dispatch<React.SetStateAction<MicroscopeState>>;
  osmoticLevel: number; // ~0.58 = salt water plasmolysis, 1.0 = turgid, ~0.84 = partial deplasmolysis
  solutionInSlide: SolutionType;
  isSimulating: boolean;
  currentStageName: string;
}

export const MicroscopeViewer: React.FC<MicroscopeViewerProps> = ({
  microscopeState,
  setMicroscopeState,
  osmoticLevel,
  solutionInSlide,
  isSimulating,
  currentStageName,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [cells] = useState<RealisticCell[]>(() => generateRealisticCells(8, 10));
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const magConfig = MAGNIFICATION_CONFIGS[microscopeState.objective];

  // Calculate optical blur from focus dials
  const coarseDiff = Math.abs(microscopeState.coarseFocus - 50);
  const fineDiff = Math.abs(microscopeState.fineFocus - 50);
  const totalFocusBlur = Math.min(16, (coarseDiff * 0.3) + (fineDiff * 0.08));

  // Main Canvas Render
  const renderMicroscope = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 14;

    ctx.clearRect(0, 0, width, height);

    // 1. Clip to circular ocular field
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.clip();

    // 2. Brightfield illumination background matching image.png (light blue-gray/greenish optical tint)
    const lightPercent = microscopeState.lightIntensity / 100;
    const diaphragmPercent = microscopeState.irisDiaphragm / 100;

    const bgGrad = ctx.createRadialGradient(
      centerX - 10,
      centerY - 10,
      radius * 0.2,
      centerX,
      centerY,
      radius
    );
    // Tint matches image.png background
    const bgR = Math.round(210 * lightPercent);
    const bgG = Math.round(228 * lightPercent);
    const bgB = Math.round(234 * lightPercent);
    bgGrad.addColorStop(0, `rgb(${bgR}, ${bgG}, ${bgB})`);
    bgGrad.addColorStop(0.7, `rgb(${Math.round(bgR * 0.94)}, ${Math.round(bgG * 0.95)}, ${Math.round(bgB * 0.96)})`);
    bgGrad.addColorStop(1, `rgb(${Math.round(bgR * 0.82)}, ${Math.round(bgG * 0.85)}, ${Math.round(bgB * 0.88)})`);

    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 3. Apply Focus Blur if dials are off center
    if (totalFocusBlur > 0.4) {
      ctx.filter = `blur(${totalFocusBlur.toFixed(1)}px)`;
    } else {
      ctx.filter = 'none';
    }

    // 4. Pan and Magnification Scale Transform
    ctx.save();
    ctx.translate(centerX + microscopeState.panX, centerY + microscopeState.panY);
    ctx.scale(magConfig.scaleFactor, magConfig.scaleFactor);

    // Base tissue tilt angle (-30 degrees as in image.png)
    ctx.rotate(-0.52);
    ctx.translate(-500, -220);

    // 5. Draw Cells
    cells.forEach((cell) => {
      ctx.save();
      ctx.translate(cell.x, cell.y);

      const halfL = cell.length / 2;
      const halfW = cell.width / 2;

      // --- A. Cell Outer Region & Middle Lamella ---
      // Extracellular saline fluid between wall and membrane (visible during plasmolysis)
      // Modulates directly with the lamp illumination so dimming the lamp dims the light behind the cells
      const cellBgR = Math.round(215 * lightPercent);
      const cellBgG = Math.round(232 * lightPercent);
      const cellBgB = Math.round(238 * lightPercent);
      traceCellWallPath(ctx, cell, osmoticLevel);
      ctx.fillStyle = `rgba(${cellBgR}, ${cellBgG}, ${cellBgB}, 0.7)`;
      ctx.fill();

      // --- B. Shrunken / Plasmolyzed Vacuole (Anthocyanin) ---
      // Uses curved organic contour matching image.png
      const vPoints = getVacuolePerimeter(cell, osmoticLevel);

      ctx.beginPath();
      // Draw smooth closed bezier curve through points
      ctx.moveTo(
        (vPoints[0].x + vPoints[vPoints.length - 1].x) / 2,
        (vPoints[0].y + vPoints[vPoints.length - 1].y) / 2
      );
      for (let i = 0; i < vPoints.length; i++) {
        const next = vPoints[(i + 1) % vPoints.length];
        const midX = (vPoints[i].x + next.x) / 2;
        const midY = (vPoints[i].y + next.y) / 2;
        ctx.quadraticCurveTo(vPoints[i].x, vPoints[i].y, midX, midY);
      }
      ctx.closePath();

      // Rich Anthocyanin Color Gradient (matches the purple-magenta shades in image.png)
      // When turgid: diluted vibrant pink-purple (~#9e358e)
      // When salt water added: concentrated deep magenta-violet (~#6e1665 to #8c237c)
      const shrinkRatio = Math.max(0, 1 - osmoticLevel); // 0 when turgid, ~0.42 in salt water
      const baseLightness = 42 - shrinkRatio * 14; // deepens in salt water
      // Scale lightness with lamp light intensity so the vacuole naturally dims as lamp light decreases
      const lightness = baseLightness * (0.2 + 0.8 * lightPercent);
      const saturation = 70 + shrinkRatio * 18;

      const vacGrad = ctx.createLinearGradient(-halfL * 0.7, -halfW * 0.5, halfL * 0.7, halfW * 0.5);
      vacGrad.addColorStop(0, `hsla(${cell.baseHue}, ${saturation}%, ${lightness}%, 0.94)`);
      vacGrad.addColorStop(0.35, `hsla(${cell.baseHue - 5}, ${saturation - 8}%, ${lightness + 6}%, 0.88)`);
      vacGrad.addColorStop(0.7, `hsla(${cell.baseHue + 4}, ${saturation}%, ${lightness - 3}%, 0.92)`);
      vacGrad.addColorStop(1, `hsla(${cell.baseHue}, ${saturation + 5}%, ${lightness - 6}%, 0.95)`);

      ctx.fillStyle = vacGrad;
      ctx.fill();

      // Cell Membrane Boundary (thinner inner boundary enclosing the purple vacuole)
      ctx.lineWidth = (osmoticLevel < 0.8 ? 2.0 : 1.2) / magConfig.scaleFactor;
      ctx.strokeStyle = `rgba(75, 12, 65, ${0.85 * diaphragmPercent})`;
      ctx.stroke();

      // Render wrinkly membrane folds / creases extending from deep wrinkle troughs
      const foldCreases = getVacuoleFoldCreases(cell, osmoticLevel);
      if (foldCreases.length > 0) {
        ctx.save();
        foldCreases.forEach((fold) => {
          ctx.beginPath();
          ctx.moveTo(fold.startX, fold.startY);
          ctx.quadraticCurveTo(
            (fold.startX + fold.endX) / 2 + (fold.depth > 12 ? 2 : -2),
            (fold.startY + fold.endY) / 2,
            fold.endX,
            fold.endY
          );
          ctx.strokeStyle = `rgba(60, 8, 52, ${0.45 * diaphragmPercent})`;
          ctx.lineWidth = 1.0 / magConfig.scaleFactor;
          ctx.stroke();
        });
        ctx.restore();
      }

      // Subtle translucent optical depth highlight inside vacuole
      const highlightGrad = ctx.createRadialGradient(
        -halfL * 0.2,
        -halfW * 0.2,
        5,
        0,
        0,
        halfL * 0.8
      );
      highlightGrad.addColorStop(0, `rgba(255, 230, 250, ${(0.18 * lightPercent).toFixed(2)})`);
      highlightGrad.addColorStop(0.8, 'rgba(0, 0, 0, 0)');
      highlightGrad.addColorStop(1, 'rgba(40, 5, 35, 0.15)');
      ctx.fillStyle = highlightGrad;
      ctx.fill();

      // Nucleus / cytoplasmic shadow (if higher power 100x / 400x)
      if (magConfig.totalMagnification >= 100) {
        ctx.beginPath();
        ctx.ellipse(cell.nucleusPos.x * (osmoticLevel < 0.8 ? 0.7 : 0.9), cell.nucleusPos.y * (osmoticLevel < 0.8 ? 0.7 : 0.9), 6, 4.5, 0.2, 0, Math.PI * 2);
        const nucR = Math.round(220 * lightPercent);
        const nucG = Math.round(195 * lightPercent);
        const nucB = Math.round(215 * lightPercent);
        ctx.fillStyle = `rgba(${nucR}, ${nucG}, ${nucB}, 0.5)`;
        ctx.fill();
        ctx.lineWidth = 0.8 / magConfig.scaleFactor;
        ctx.strokeStyle = `rgba(${Math.round(90 * lightPercent)}, ${Math.round(30 * lightPercent)}, ${Math.round(75 * lightPercent)}, 0.4)`;
        ctx.stroke();
      }

      // --- C. Plant Cell Wall (Cellulose borders that swell slightly under turgor pressure) ---
      traceCellWallPath(ctx, cell, osmoticLevel);

      // Outer thick wall border
      ctx.lineWidth = (cell.wallThickness + 2) / magConfig.scaleFactor;
      ctx.strokeStyle = `rgba(50, 75, 75, ${0.55 * diaphragmPercent})`;
      ctx.stroke();

      // Inner refractive highlight track (gives glass-like optical refractive appearance)
      const wallHiR = Math.round(180 * lightPercent);
      const wallHiG = Math.round(210 * lightPercent);
      const wallHiB = Math.round(210 * lightPercent);
      ctx.lineWidth = cell.wallThickness / magConfig.scaleFactor;
      ctx.strokeStyle = `rgba(${wallHiR}, ${wallHiG}, ${wallHiB}, ${0.8 * diaphragmPercent})`;
      ctx.stroke();

      // Thin sharp core line
      ctx.lineWidth = 1.4 / magConfig.scaleFactor;
      ctx.strokeStyle = `rgba(35, 55, 55, ${0.85 * diaphragmPercent})`;
      ctx.stroke();

      ctx.restore();
    });

    ctx.restore(); // Restore transform

    // Reset filter for HUD overlays
    ctx.filter = 'none';

    // 6. Classic Classroom Microscope Pointer (Eyepiece Needle)
    // Starts from the side/perimeter of the circle and extends directly to the center
    ctx.save();
    const ptrAngle = Math.PI * 0.75; // 135 degrees (entering from the side of the circular field)
    const dirX = Math.cos(ptrAngle);
    const dirY = Math.sin(ptrAngle);
    const perpX = -dirY;
    const perpY = dirX;

    const tipX = centerX;
    const tipY = centerY;

    // Base starts right at the side/perimeter of the circle (radius), seated into the aperture rim
    const baseDist = radius + 3;
    const baseCenterX = centerX + dirX * baseDist;
    const baseCenterY = centerY + dirY * baseDist;
    const baseHalfWidth = 2.4; // Tapers from ~4.8px base at the circle edge down to a sharp needle point at center

    const corner1X = baseCenterX + perpX * baseHalfWidth;
    const corner1Y = baseCenterY + perpY * baseHalfWidth;
    const corner2X = baseCenterX - perpX * baseHalfWidth;
    const corner2Y = baseCenterY - perpY * baseHalfWidth;

    // Solid dark needle body
    ctx.beginPath();
    ctx.moveTo(corner1X, corner1Y);
    ctx.lineTo(tipX, tipY);
    ctx.lineTo(corner2X, corner2Y);
    ctx.closePath();
    ctx.fillStyle = '#050811';
    ctx.fill();

    // Central structural spine for sharp needle definition
    ctx.beginPath();
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 1.2;
    ctx.lineCap = 'round';
    ctx.moveTo(baseCenterX, baseCenterY);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();

    // Needle tip
    ctx.beginPath();
    ctx.arc(tipX, tipY, 1.2, 0, Math.PI * 2);
    ctx.fillStyle = '#020617';
    ctx.fill();
    ctx.restore();

    // 7. Ocular Micrometer Scale Bar
    if (microscopeState.showGridRuler) {
      ctx.save();
      const barY = centerY + radius - 35;
      const barStartX = centerX - 90;
      const barEndX = centerX + 90;
      const barWidth = 180;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
      ctx.roundRect(barStartX - 16, barY - 18, barWidth + 32, 32, 6);
      ctx.fill();

      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(barStartX, barY);
      ctx.lineTo(barEndX, barY);
      for (let i = 0; i <= 5; i++) {
        const tx = barStartX + (barWidth / 5) * i;
        ctx.moveTo(tx, barY - 5);
        ctx.lineTo(tx, barY + 5);
      }
      ctx.stroke();

      const umPerPixel = magConfig.fieldOfViewUm / (radius * 2);
      const measuredUm = Math.round(barWidth * umPerPixel);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${measuredUm} µm (micrometers)`, centerX, barY - 6);
      ctx.restore();
    }

    ctx.restore(); // Restore clipping

    // 9. Black Microscope Chassis & Eyepiece Collar Rim
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.rect(width, 0, -width, height);
    ctx.fillStyle = '#080c14';
    ctx.fill();

    // Metallic barrel ring
    ctx.lineWidth = 15;
    const ringGrad = ctx.createLinearGradient(0, 0, width, height);
    ringGrad.addColorStop(0, '#334155');
    ringGrad.addColorStop(0.5, '#1e293b');
    ringGrad.addColorStop(1, '#0f172a');
    ctx.strokeStyle = ringGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 7.5, 0, Math.PI * 2);
    ctx.stroke();

    // Soft lens vignette inside
    const innerShadow = ctx.createRadialGradient(
      centerX,
      centerY,
      radius - 24,
      centerX,
      centerY,
      radius
    );
    innerShadow.addColorStop(0, 'rgba(0, 0, 0, 0)');
    innerShadow.addColorStop(0.85, 'rgba(0, 0, 0, 0.2)');
    innerShadow.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
    ctx.fillStyle = innerShadow;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }, [
    cells,
    microscopeState,
    magConfig,
    osmoticLevel,
    solutionInSlide,
    totalFocusBlur,
  ]);

  // Animation frame loop
  useEffect(() => {
    let animationId: number;
    const loop = () => {
      renderMicroscope();
      animationId = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(animationId);
  }, [renderMicroscope]);

  // Stage Dragging / Panning
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - microscopeState.panX, y: e.clientY - microscopeState.panY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const newPanX = e.clientX - dragStart.x;
    const newPanY = e.clientY - dragStart.y;
    const maxPan = 380 * magConfig.scaleFactor;
    setMicroscopeState((prev) => ({
      ...prev,
      panX: Math.max(-maxPan, Math.min(maxPan, newPanX)),
      panY: Math.max(-maxPan, Math.min(maxPan, newPanY)),
    }));
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleResetStage = () => {
    setMicroscopeState((prev) => ({
      ...prev,
      panX: 0,
      panY: 0,
      coarseFocus: 50,
      fineFocus: 50,
    }));
  };

  return (
    <div className="flex flex-col items-center bg-slate-900 rounded-3xl p-4 sm:p-6 shadow-2xl border border-slate-800 text-slate-100">
      {/* Top Header inside Microscope Viewport */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">
            Virtual Compound Microscope
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-purple-300 font-semibold border border-purple-500/30">
            {magConfig.label}
          </span>
        </div>

        {/* Viewport Action Toggles */}
        <div className="flex items-center gap-2">
          <button
            id="toggle-ruler-btn"
            onClick={() =>
              setMicroscopeState((prev) => ({ ...prev, showGridRuler: !prev.showGridRuler }))
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl font-medium transition-colors cursor-pointer ${
              microscopeState.showGridRuler
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title="Toggle Micrometer Scale Bar"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Scale (µm)</span>
          </button>
        </div>
      </div>

      {/* Main Ocular Viewport Canvas */}
      <div
        ref={containerRef}
        className="relative my-4 flex items-center justify-center select-none"
      >
        <canvas
          id="microscope-canvas"
          ref={canvasRef}
          width={520}
          height={520}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="cursor-grab active:cursor-grabbing rounded-full shadow-2xl touch-none max-w-full h-auto"
          title="Click and drag to pan across the red onion cells"
        />

        {/* Focus Blur Warning */}
        {totalFocusBlur > 4 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none px-3.5 py-1.5 rounded-full bg-slate-950/90 text-amber-300 text-xs font-medium border border-amber-500/40 backdrop-blur-sm flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 animate-spin text-amber-400" />
            <span>Turn Focus Knobs to sharpen the cells (~50%)</span>
          </div>
        )}

        {/* FOV Badge */}
        <div className="absolute top-4 left-4 pointer-events-none px-2.5 py-1 rounded-md bg-slate-950/70 border border-slate-800 backdrop-blur-xs text-[11px] font-mono text-slate-300">
          Field: {magConfig.fieldOfViewUm} µm
        </div>
      </div>

      {/* Objective Lens Turret */}
      <div className="w-full bg-slate-950/85 rounded-2xl p-3.5 border border-slate-800 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
            <ZoomIn className="w-4 h-4 text-sky-400" />
            Revolving Nosepiece (Objective Lens)
          </span>
          <span className="text-xs text-slate-400">
            Eyepiece: <strong className="text-slate-200">10x</strong>
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {/* 4x Objective (Red) */}
          <button
            id="objective-4x-btn"
            onClick={() =>
              setMicroscopeState((prev) => ({ ...prev, objective: '4x' }))
            }
            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer ${
              microscopeState.objective === '4x'
                ? 'bg-red-950/60 border-red-500 text-red-100 shadow-md ring-1 ring-red-500'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
            }`}
          >
            <div className="w-8 h-1.5 rounded-full bg-red-500 mb-1.5" />
            <span className="text-xs font-bold">4x Objective</span>
            <span className="text-[11px] text-slate-400">40x Total Mag</span>
          </button>

          {/* 10x Objective (Yellow) */}
          <button
            id="objective-10x-btn"
            onClick={() =>
              setMicroscopeState((prev) => ({ ...prev, objective: '10x' }))
            }
            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer ${
              microscopeState.objective === '10x'
                ? 'bg-amber-950/60 border-amber-500 text-amber-100 shadow-md ring-1 ring-amber-500'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
            }`}
          >
            <div className="w-8 h-1.5 rounded-full bg-amber-400 mb-1.5" />
            <span className="text-xs font-bold">10x Objective</span>
            <span className="text-[11px] text-slate-400">100x Total Mag</span>
          </button>

          {/* 40x Objective (Blue) */}
          <button
            id="objective-40x-btn"
            onClick={() =>
              setMicroscopeState((prev) => ({ ...prev, objective: '40x' }))
            }
            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer ${
              microscopeState.objective === '40x'
                ? 'bg-blue-950/60 border-blue-500 text-blue-100 shadow-md ring-1 ring-blue-500'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
            }`}
          >
            <div className="w-8 h-1.5 rounded-full bg-blue-500 mb-1.5" />
            <span className="text-xs font-bold">40x Objective</span>
            <span className="text-[11px] text-slate-400">400x Total Mag</span>
          </button>
        </div>
      </div>

      {/* Focus Knobs and Lighting Controls */}
      <div className="w-full mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Coarse Focus Knob */}
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-300 font-medium">
            <span>Coarse Focus</span>
            <span className="text-slate-400 font-mono">{microscopeState.coarseFocus}%</span>
          </div>
          <input
            id="coarse-focus-slider"
            type="range"
            min="0"
            max="100"
            value={microscopeState.coarseFocus}
            onChange={(e) =>
              setMicroscopeState((prev) => ({
                ...prev,
                coarseFocus: Number(e.target.value),
              }))
            }
            className="w-full accent-purple-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-slate-400">
            <span>Blur</span>
            <span className="text-purple-400 font-semibold">Sharp (~50)</span>
            <span>Blur</span>
          </div>
        </div>

        {/* Fine Focus Knob */}
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-300 font-medium">
            <span>Fine Focus</span>
            <span className="text-slate-400 font-mono">{microscopeState.fineFocus}%</span>
          </div>
          <input
            id="fine-focus-slider"
            type="range"
            min="0"
            max="100"
            value={microscopeState.fineFocus}
            onChange={(e) =>
              setMicroscopeState((prev) => ({
                ...prev,
                fineFocus: Number(e.target.value),
              }))
            }
            className="w-full accent-sky-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-slate-400">
            <span>Low</span>
            <span className="text-sky-400 font-semibold">Sharp (~50)</span>
            <span>High</span>
          </div>
        </div>

        {/* Light Lamp */}
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-300 font-medium">
            <span className="flex items-center gap-1">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              Light Lamp
            </span>
            <span className="text-slate-400 font-mono">{microscopeState.lightIntensity}%</span>
          </div>
          <input
            id="light-intensity-slider"
            type="range"
            min="5"
            max="100"
            value={microscopeState.lightIntensity}
            onChange={(e) =>
              setMicroscopeState((prev) => ({
                ...prev,
                lightIntensity: Number(e.target.value),
              }))
            }
            className="w-full accent-amber-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-slate-400">
            <span>Dim</span>
            <span>Bright</span>
          </div>
        </div>

        {/* Center Stage Reset */}
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-slate-300 font-medium mb-1">
            <span>Stage View</span>
            <span className="text-[10px] text-slate-500">Pan: {Math.round(microscopeState.panX)},{Math.round(microscopeState.panY)}</span>
          </div>
          <button
            onClick={handleResetStage}
            className="w-full py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Move className="w-3.5 h-3.5 text-sky-400" />
            <span>Center Slide</span>
          </button>
        </div>
      </div>
    </div>
  );
};
