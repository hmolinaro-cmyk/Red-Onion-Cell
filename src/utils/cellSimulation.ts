import { CellData } from '../types';

export interface WrinkleProfile {
  freq1: number;
  freq2: number;
  freq3: number;
  phase1: number;
  phase2: number;
  phase3: number;
  amp1: number;
  amp2: number;
  amp3: number;
  indentPos1: number;
  indentDepth1: number;
  indentPos2: number;
  indentDepth2: number;
}

export interface FoldCrease {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  depth: number;
}

export interface RealisticCell {
  id: number;
  row: number;
  col: number;
  // Position in tissue coordinate space
  x: number;
  y: number;
  length: number; // long axis
  width: number;  // short axis
  angle: number;  // diagonal orientation ~ -28 to -34 degrees as in image.png
  // Corner vertex offsets for organic cell wall shape
  corners: { x: number; y: number }[];
  // Transverse and longitudinal wall thickness
  wallThickness: number;
  // Vacuole contraction profile
  shrinkVariance: number;
  endRetractionRatio: number; // ends retract more than sides as seen in image.png
  sideRetractionRatio: number;
  scallopOffsets: number[]; // control points for organic scalloping
  topWrinkles: WrinkleProfile;
  bottomWrinkles: WrinkleProfile;
  baseHue: number;
  baseSaturation: number;
  baseLightness: number;
  nucleusPos: { x: number; y: number };
}

/**
 * Generate authentic red onion epidermis cells matching the micrograph in image.png
 */
export function generateRealisticCells(rows = 6, cols = 8): RealisticCell[] {
  const cells: RealisticCell[] = [];
  const baseLength = 220;
  const baseWidth = 72;
  let id = 1;

  for (let r = 0; r < rows; r++) {
    // Brickwork stagger
    const xOffset = (r % 2 === 0 ? 0 : baseLength * 0.48) - baseLength * 0.8;
    const yPos = r * (baseWidth * 0.94) - 100;

    for (let c = 0; c < cols; c++) {
      const seed = id * 7919 + 65537;
      const r1 = ((seed * 9301 + 49297) % 233280) / 233280;
      const r2 = ((seed * 49297 + 9301) % 233280) / 233280;
      const r3 = ((seed * 12345 + 6789) % 233280) / 233280;
      const r4 = ((seed * 54321 + 9876) % 233280) / 233280;
      const r5 = ((seed * 67891 + 13579) % 233280) / 233280;
      const r6 = ((seed * 35791 + 24680) % 233280) / 233280;

      const len = baseLength * (0.9 + r1 * 0.22);
      const wid = baseWidth * (0.92 + r2 * 0.16);
      const xPos = xOffset + c * (baseLength * 0.95);

      // Natural corner coordinates forming the elongated rectangular plant cell
      const halfL = len / 2;
      const halfW = wid / 2;

      // 4 primary corners with slight organic skew
      const c1 = { x: -halfL + (r1 - 0.5) * 6, y: -halfW + (r2 - 0.5) * 4 };
      const c2 = { x: halfL + (r2 - 0.5) * 6, y: -halfW + (r3 - 0.5) * 4 };
      const c3 = { x: halfL + (r3 - 0.5) * 6, y: halfW + (r4 - 0.5) * 4 };
      const c4 = { x: -halfL + (r4 - 0.5) * 6, y: halfW + (r1 - 0.5) * 4 };

      // Scalloped control points along the perimeter (8 points) for the vacuole
      const scallopOffsets = [
        0.85 + r1 * 0.3, // top left end
        0.9 + r2 * 0.2,  // top middle
        0.82 + r3 * 0.3, // top right end
        0.75 + r4 * 0.35,// right end cap
        0.8 + r2 * 0.3,  // bottom right end
        0.92 + r1 * 0.2, // bottom middle
        0.84 + r3 * 0.25,// bottom left end
        0.72 + r4 * 0.35,// left end cap
      ];

      // Wrinkling profile for top side of vacuole (multiple frequencies and indentation puckers)
      const topWrinkles: WrinkleProfile = {
        freq1: 3 + Math.floor(r1 * 2), // 3-4 major undulating lobes
        freq2: 6 + Math.floor(r2 * 3), // 6-8 ripple waves
        freq3: 11 + Math.floor(r3 * 4),// fine micro-crenations
        phase1: r1 * Math.PI * 2,
        phase2: r2 * Math.PI * 2,
        phase3: r3 * Math.PI * 2,
        amp1: 0.42 + r1 * 0.28,
        amp2: 0.32 + r2 * 0.22,
        amp3: 0.18 + r3 * 0.15,
        indentPos1: 0.28 + r4 * 0.18, // first pronounced inward wrinkle tuck
        indentDepth1: 0.75 + r5 * 0.55,
        indentPos2: 0.65 + r5 * 0.2,  // second pronounced inward wrinkle tuck
        indentDepth2: 0.65 + r6 * 0.5,
      };

      // Wrinkling profile for bottom side of vacuole (independent from top)
      const bottomWrinkles: WrinkleProfile = {
        freq1: 3 + Math.floor(r3 * 2),
        freq2: 7 + Math.floor(r4 * 2),
        freq3: 12 + Math.floor(r1 * 3),
        phase1: r4 * Math.PI * 2,
        phase2: r5 * Math.PI * 2,
        phase3: r6 * Math.PI * 2,
        amp1: 0.44 + r3 * 0.25,
        amp2: 0.34 + r4 * 0.2,
        amp3: 0.19 + r5 * 0.16,
        indentPos1: 0.32 + r2 * 0.18,
        indentDepth1: 0.7 + r1 * 0.55,
        indentPos2: 0.72 + r1 * 0.18,
        indentDepth2: 0.75 + r3 * 0.5,
      };

      cells.push({
        id,
        row: r,
        col: c,
        x: xPos,
        y: yPos,
        length: len,
        width: wid,
        angle: -0.52 + (r1 - 0.5) * 0.05, // ~ -30 degrees diagonal tilt as in reference image!
        corners: [c1, c2, c3, c4],
        wallThickness: 3.5 + r2 * 1.5,
        shrinkVariance: 0.9 + r3 * 0.2,
        endRetractionRatio: 1.6 + r1 * 0.6, // ends pull away more prominently than sides
        sideRetractionRatio: 1.0 + r4 * 0.35,
        scallopOffsets,
        topWrinkles,
        bottomWrinkles,
        // Anthocyanin purple: vibrant magenta-violet like reference image (#7e1e75 / #9d358f)
        baseHue: 318 + (r1 - 0.5) * 16,
        baseSaturation: 72 + r2 * 18,
        baseLightness: 36 + r3 * 10,
        nucleusPos: {
          x: (r2 - 0.5) * (len * 0.5),
          y: (r3 - 0.5) * (wid * 0.35),
        },
      });

      id++;
    }
  }

  return cells;
}

/**
 * Trace the cell wall contour with turgor pressure response.
 * When fresh water is added (osmoticLevel > 0.90 to 1.0), internal turgor pressure
 * builds, causing the cell dimensions to expand and the walls to bow outwards gently.
 */
export function traceCellWallPath(
  ctx: CanvasRenderingContext2D,
  cell: RealisticCell,
  osmoticLevel: number
) {
  const turgorFactor = Math.min(1.0, Math.max(0, (osmoticLevel - 0.90) / 0.10));
  const lScale = 1 + 0.028 * turgorFactor;
  const wScale = 1 + 0.062 * turgorFactor;
  const halfL = (cell.length * lScale) / 2;
  const halfW = (cell.width * wScale) / 2;
  const bulgeY = 4.2 * turgorFactor;
  const bulgeX = 2.2 * turgorFactor;

  const p1 = { x: cell.corners[0].x * lScale, y: cell.corners[0].y * wScale };
  const p2 = { x: cell.corners[1].x * lScale, y: cell.corners[1].y * wScale };
  const p3 = { x: cell.corners[2].x * lScale, y: cell.corners[2].y * wScale };
  const p4 = { x: cell.corners[3].x * lScale, y: cell.corners[3].y * wScale };

  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  // Top wall bowing outward (upward, negative y)
  ctx.quadraticCurveTo(0, -halfW - bulgeY, p2.x, p2.y);
  // Right end wall bowing outward (rightward, positive x)
  ctx.quadraticCurveTo(halfL + bulgeX, 0, p3.x, p3.y);
  // Bottom wall bowing outward (downward, positive y)
  ctx.quadraticCurveTo(0, halfW + bulgeY, p4.x, p4.y);
  // Left end wall bowing outward (leftward, negative x)
  ctx.quadraticCurveTo(-halfL - bulgeX, 0, p1.x, p1.y);
  ctx.closePath();
}

/**
 * Calculate vacuole contour points for a cell at given osmotic level
 * - Level 1.0 = Turgid (pressed firmly against cell wall, filling ~98%, smooth, swollen with turgor pressure)
 * - Level 0.90 = Initial / Dry Mount (resting cell state, straight walls, 90% vacuole fill)
 * - Level 0.58 = Salt Water Plasmolysis (shrunken with deep wrinkly/rippled sides as in image.png)
 * - Level 0.84 = Fresh Water Rinse (partially deplasmolyzed, does NOT return to 100% full size, mild residual wrinkles)
 */
export function getVacuolePerimeter(cell: RealisticCell, osmoticLevel: number): { x: number; y: number }[] {
  const turgorFactor = Math.min(1.0, Math.max(0, (osmoticLevel - 0.90) / 0.10));
  const lScale = 1 + 0.028 * turgorFactor;
  const wScale = 1 + 0.062 * turgorFactor;
  const halfL = (cell.length * lScale) / 2;
  const halfW = (cell.width * wScale) / 2;
  const turgorBulgeY = 4.2 * turgorFactor;
  const turgorBulgeX = 2.2 * turgorFactor;

  // Amount of retraction from the wall
  // When osmoticLevel is 1.0 (fresh water), retraction is tiny (~1.8px) with full turgor swelling
  // When osmoticLevel is ~0.58 (salt water), retraction is ~12-28px on ends and ~6-24px on sides with wrinkling
  // When osmoticLevel is ~0.72-0.84 (fresh water rinse), retraction remains ~5-14px (partial recovery with residual waviness)
  const shrinkProgress = Math.max(0, 1 - osmoticLevel); // 0 at turgid, ~0.42 in salt water

  // Retraction distances in pixels
  const cellVariance = cell.shrinkVariance || 1.0;
  const endGap = shrinkProgress * 54 * cell.endRetractionRatio * cellVariance;
  const sideGapBase = shrinkProgress * 22 * cell.sideRetractionRatio * cellVariance;

  // Wrinkle intensity scales with plasmolysis depth (0 when turgid, strong when plasmolyzed)
  const wrinkleIntensity = Math.min(1.0, shrinkProgress * 2.5);

  const points: { x: number; y: number }[] = [];

  // --- 1. Top Side (from left end to right end, 16 sample points along the length) ---
  const numSidePoints = 16;
  const topXSpan = (cell.length * lScale - 2 * Math.max(8, endGap * 0.85));
  const topXStart = -halfL + Math.max(8, endGap * 0.85);

  for (let i = 0; i <= numSidePoints; i++) {
    const t = i / numSidePoints; // 0.0 to 1.0
    const x = topXStart + t * topXSpan;
    const wallBowing = Math.sin(t * Math.PI) * turgorBulgeY;

    if (t === 0) {
      // Top-left corner transition - noticeably rounded and detached when retracted
      const cornerGap = Math.max(2, endGap * 0.76);
      points.push({ x: -halfL + cornerGap, y: -halfW + Math.max(1.8, sideGapBase * 0.9) - wallBowing });
      continue;
    }
    if (t === 1) {
      // Top-right corner transition
      const cornerGap = Math.max(2, endGap * 0.76);
      points.push({ x: halfL - cornerGap, y: -halfW + Math.max(1.8, sideGapBase * 0.9) - wallBowing });
      continue;
    }

    // Wrinkle undulation function combining harmonic lobes + micro crenations + inward puckers
    const p = cell.topWrinkles;
    const wave1 = p.amp1 * Math.sin(t * Math.PI * p.freq1 + p.phase1);
    const wave2 = p.amp2 * Math.sin(t * Math.PI * p.freq2 + p.phase2);
    const wave3 = p.amp3 * Math.cos(t * Math.PI * p.freq3 + p.phase3);

    // Pronounced inward tucks/wrinkles
    const dist1 = t - p.indentPos1;
    const pucker1 = p.indentDepth1 * Math.exp(-dist1 * dist1 * 60);
    const dist2 = t - p.indentPos2;
    const pucker2 = p.indentDepth2 * Math.exp(-dist2 * dist2 * 50);

    // Total inward wrinkle offset (positive pushes deeper into cell, away from top wall)
    const combinedWrinkle = (wave1 + wave2 + wave3 + pucker1 + pucker2) * wrinkleIntensity;
    const retraction = Math.max(
      1.8,
      Math.min(halfW * 0.68, sideGapBase * (1.0 + combinedWrinkle * 1.45))
    );

    points.push({
      x,
      y: -halfW + retraction - wallBowing,
    });
  }

  // --- 2. Right End Cap (rounding around right edge, 4 points) ---
  const rightEndRetract = Math.max(2.2, endGap * cell.scallopOffsets[3] * 1.25);
  points.push({
    x: halfL - rightEndRetract * 0.75 + turgorBulgeX * 0.7,
    y: -halfW * 0.35 - turgorBulgeY * 0.4,
  });
  points.push({
    x: halfL - rightEndRetract + turgorBulgeX,
    y: 0,
  });
  points.push({
    x: halfL - rightEndRetract * 0.75 + turgorBulgeX * 0.7,
    y: halfW * 0.35 + turgorBulgeY * 0.4,
  });

  // --- 3. Bottom Side (from right end back to left end, 16 sample points along the length) ---
  const botXSpan = (cell.length * lScale - 2 * Math.max(8, endGap * 0.85));
  const botXStart = halfL - Math.max(8, endGap * 0.85);

  for (let i = 0; i <= numSidePoints; i++) {
    const t = i / numSidePoints; // 0.0 (right) to 1.0 (left)
    const x = botXStart - t * botXSpan;
    const wallBowing = Math.sin(t * Math.PI) * turgorBulgeY;

    if (t === 0) {
      const cornerGap = Math.max(2, endGap * 0.76);
      points.push({ x: halfL - cornerGap, y: halfW - Math.max(1.8, sideGapBase * 0.9) + wallBowing });
      continue;
    }
    if (t === 1) {
      const cornerGap = Math.max(2, endGap * 0.76);
      points.push({ x: -halfL + cornerGap, y: halfW - Math.max(1.8, sideGapBase * 0.9) + wallBowing });
      continue;
    }

    const p = cell.bottomWrinkles;
    const wave1 = p.amp1 * Math.sin(t * Math.PI * p.freq1 + p.phase1);
    const wave2 = p.amp2 * Math.sin(t * Math.PI * p.freq2 + p.phase2);
    const wave3 = p.amp3 * Math.cos(t * Math.PI * p.freq3 + p.phase3);

    const dist1 = t - p.indentPos1;
    const pucker1 = p.indentDepth1 * Math.exp(-dist1 * dist1 * 60);
    const dist2 = t - p.indentPos2;
    const pucker2 = p.indentDepth2 * Math.exp(-dist2 * dist2 * 50);

    const combinedWrinkle = (wave1 + wave2 + wave3 + pucker1 + pucker2) * wrinkleIntensity;
    const retraction = Math.max(
      1.8,
      Math.min(halfW * 0.68, sideGapBase * (1.0 + combinedWrinkle * 1.45))
    );

    points.push({
      x,
      y: halfW - retraction + wallBowing,
    });
  }

  // --- 4. Left End Cap (rounding around left edge, 4 points) ---
  const leftEndRetract = Math.max(2.2, endGap * cell.scallopOffsets[7] * 1.2);
  points.push({
    x: -halfL + leftEndRetract * 0.75 - turgorBulgeX * 0.7,
    y: halfW * 0.35 + turgorBulgeY * 0.4,
  });
  points.push({
    x: -halfL + leftEndRetract - turgorBulgeX,
    y: 0,
  });
  points.push({
    x: -halfL + leftEndRetract * 0.75 - turgorBulgeX * 0.7,
    y: -halfW * 0.35 - turgorBulgeY * 0.4,
  });

  return points;
}

/**
 * Generates subtle interior crease/fold lines radiating slightly into the vacuole
 * from the deep side wrinkle notches when plasmolyzed
 */
export function getVacuoleFoldCreases(cell: RealisticCell, osmoticLevel: number): FoldCrease[] {
  if (osmoticLevel > 0.82) return [];

  const halfL = cell.length / 2;
  const halfW = cell.width / 2;
  const shrinkProgress = Math.max(0, 1 - osmoticLevel);
  const endGap = shrinkProgress * 44 * cell.endRetractionRatio;
  const sideGapBase = shrinkProgress * 17 * cell.sideRetractionRatio;
  const creases: FoldCrease[] = [];

  // Top creases
  const pTop = cell.topWrinkles;
  [pTop.indentPos1, pTop.indentPos2].forEach((pos) => {
    const x = -halfL + endGap * 0.85 + pos * (cell.length - 2 * endGap * 0.85);
    const startY = -halfW + sideGapBase * 1.8;
    const depth = 8 + shrinkProgress * 14;
    creases.push({
      startX: x,
      startY,
      endX: x + (pos > 0.5 ? -4 : 4),
      endY: startY + depth,
      depth,
    });
  });

  // Bottom creases
  const pBot = cell.bottomWrinkles;
  [pBot.indentPos1, pBot.indentPos2].forEach((pos) => {
    const x = halfL - endGap * 0.85 - pos * (cell.length - 2 * endGap * 0.85);
    const startY = halfW - sideGapBase * 1.8;
    const depth = 8 + shrinkProgress * 14;
    creases.push({
      startX: x,
      startY,
      endX: x + (pos > 0.5 ? 4 : -4),
      endY: startY - depth,
      depth,
    });
  });

  return creases;
}
