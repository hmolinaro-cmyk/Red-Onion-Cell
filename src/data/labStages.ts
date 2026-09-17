import { LabStage, MagnificationConfig, MagnificationObjective } from '../types';

export const MAGNIFICATION_CONFIGS: Record<MagnificationObjective, MagnificationConfig> = {
  '4x': {
    objective: '4x',
    eyepiece: 10,
    totalMagnification: 40,
    label: '4x Scanning (40x Total)',
    fieldOfViewUm: 4500,
    scaleFactor: 0.38,
  },
  '10x': {
    objective: '10x',
    eyepiece: 10,
    totalMagnification: 100,
    label: '10x Low Power (100x Total)',
    fieldOfViewUm: 1800,
    scaleFactor: 0.88,
  },
  '40x': {
    objective: '40x',
    eyepiece: 10,
    totalMagnification: 400,
    label: '40x High Power (400x Total)',
    fieldOfViewUm: 450,
    scaleFactor: 2.1,
  },
};

export const LAB_STAGES: LabStage[] = [
  {
    id: 'initial',
    stepNumber: 1,
    title: 'Red Onion Skin (Initial Mount)',
    subtitle: 'Observation of unaltered red onion epidermal cells',
    recommendedMag: '10x',
    targetSolution: 'Standard epidermal peel mount',
    defaultOsmoticLevel: 0.90,
    description: 'Mount a thin peel of red onion epidermis on a clean glass slide. Observe the boxy arrangement of cells and rigid cell walls.',
  },
  {
    id: 'fresh_water',
    stepNumber: 2,
    title: 'Red Onion Skin + Fresh Water',
    subtitle: 'Hypotonic environment — cell expands with water',
    recommendedMag: '40x',
    targetSolution: 'Distilled / Tap Water (0% Salt)',
    defaultOsmoticLevel: 1.0,
    description: 'Add a drop of pure water to one edge of the coverslip and wick through. Water enters the vacuole through osmosis. Observe how full and plump the cells appear.',
  },
  {
    id: 'salt_water',
    stepNumber: 3,
    title: 'Red Onion Skin + Salt Water',
    subtitle: 'Hypertonic environment — Plasmolysis occurs live!',
    recommendedMag: '40x',
    targetSolution: '10% NaCl Salt Solution',
    defaultOsmoticLevel: 0.58, // Vacuoles shrink away from walls with scalloped contours (as in reference image), NOT completely reduced
    description: 'Add 10% salt water to one side of the coverslip and wick it through with paper towel. Watch the vacuole shrink away from the walls while the rigid cell wall keeps its shape!',
  },
  {
    id: 'fresh_water_rinse',
    stepNumber: 4,
    title: 'Red Onion Skin + Water Again',
    subtitle: 'Hypotonic rinse — Partial Deplasmolysis',
    recommendedMag: '40x',
    targetSolution: 'Fresh Water Flush',
    defaultOsmoticLevel: 0.72, // Recovers partially, but does NOT fill the whole cell again; clear gaps remain at ends and sides!
    description: 'Flush out the salt by adding fresh water and wicking on the other side. Notice that the vacuole expands back partway, but does NOT fill the whole cell again — clear unfilled spaces and detached corners remain!',
  },
];

export const VOCABULARY_TERMS = [
  {
    term: 'Cell Wall',
    definition: 'The rigid, box-like outer layer made of cellulose that gives plant cells their shape and prevents them from bursting.',
    clue: 'Notice that during both salt and fresh water, the cell wall never shrinks or collapses!',
  },
  {
    term: 'Cell Membrane',
    definition: 'A flexible, semi-permeable boundary that controls what enters and exits the cell. It pulls away from the wall during plasmolysis.',
    clue: 'In salt water, look closely where the purple region pulls away from the wall — that boundary is the membrane.',
  },
  {
    term: 'Central Vacuole & Anthocyanin',
    definition: 'A large storage sac filled with water and natural purple/magenta pigment (anthocyanin) that gives red onions their color.',
    clue: 'When water leaves, the pigment concentrates, making the purple appear darker!',
  },
  {
    term: 'Plasmolysis',
    definition: 'The shrinking of the plant cell cytoplasm and vacuole away from the cell wall when exposed to a hypertonic (salty) solution.',
    clue: 'This is the key event in Step 3 when salt water is added.',
  },
  {
    term: 'Osmosis',
    definition: 'The movement of water molecules through a semi-permeable membrane from an area of higher water concentration to lower water concentration.',
    clue: 'Water always flows toward the side with more dissolved solute (salt).',
  },
  {
    term: 'Deplasmolysis',
    definition: 'The partial recovery process where water flows back into a plasmolyzed cell in fresh water, though some gaps may remain.',
    clue: 'Observed in Step 4 when rinsing the slide with plain water!',
  },
];
