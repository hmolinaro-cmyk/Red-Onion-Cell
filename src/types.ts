/**
 * Red Onion Cell Plasmolysis Virtual Lab - Types & Definitions
 */

export type MagnificationObjective = '4x' | '10x' | '40x';

export interface MagnificationConfig {
  objective: MagnificationObjective;
  eyepiece: number; // 10x
  totalMagnification: number; // 40x, 100x, 400x
  label: string;
  fieldOfViewUm: number; // Field of view in micrometers (e.g., 4000um, 1600um, 400um)
  scaleFactor: number;
}

export type SolutionType = 'initial' | 'fresh_water' | 'salt_water' | 'fresh_water_rinse';

export interface LabStage {
  id: SolutionType;
  stepNumber: number;
  title: string;
  subtitle: string;
  recommendedMag: MagnificationObjective;
  description: string;
  defaultOsmoticLevel: number; // 0 (fully plasmolyzed) to 1 (fully turgid)
  targetSolution: string;
}

export interface CellData {
  id: number;
  // Cell boundary polygon (relative coordinates inside cell grid)
  x: number;
  y: number;
  width: number;
  height: number;
  polygon: { x: number; y: number }[]; // 5 to 7 vertices for realistic plant tissue
  nucleusOffset: { x: number; y: number };
  nucleusRadius: number;
  pigmentBaseHue: number; // slight natural variation in purple hue
  pigmentBaseSaturation: number;
  shrinkFactorVariation: number; // real cells don't shrink identically
  internalFolds: { x: number; y: number; c1x: number; c1y: number; c2x: number; c2y: number }[];
}

export interface ObservationRecord {
  stageId: SolutionType;
  magnification: string;
  description: string;
  drawingDataUrl: string | null;
  timestamp: string;
  completed: boolean;
}

export interface MicroscopeState {
  objective: MagnificationObjective;
  coarseFocus: number; // 0 to 100 (optimal around 50)
  fineFocus: number; // 0 to 100 (optimal around 50)
  lightIntensity: number; // 20 to 100%
  irisDiaphragm: number; // contrast 30 to 100%
  panX: number;
  panY: number;
  showGridRuler: boolean;
}

export interface LabProgress {
  currentStage: SolutionType;
  osmoticLevel: number; // 0 (severe plasmolysis) to 1.0 (fully turgid)
  solutionInSlide: SolutionType;
  isSimulating: boolean;
  simulationSpeed: number; // 0.5x, 1x, 2x
}
