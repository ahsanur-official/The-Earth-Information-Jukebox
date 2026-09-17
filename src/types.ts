export type VariableId =
  | "temperature"
  | "ocean"
  | "sealevel"
  | "co2"
  | "wind"
  | "precipitation"
  | "vegetation"
  | "wildfire"
  | "ice"
  | "clouds"
  | "pressure";

export interface DataPoint {
  year: number;
  value: number;
  normalized: number; // 0 to 1
  anomaly?: number;
  label?: string;
  regionalHotspots?: { lat: number; lon: number; intensity: number; label: string }[];
}

export interface DatasetMetadata {
  id: VariableId;
  name: string;
  shortName: string;
  icon: string;
  category: "Atmosphere" | "Cryosphere" | "Biosphere" | "Hydrosphere";
  unit: string;
  currentYear: number;
  currentValue: number;
  min: number;
  max: number;
  minBound?: number;
  maxBound?: number;
  average: number;
  baseline: string;
  baselineReference?: string;
  trend: "increasing" | "decreasing" | "variable";
  dataSource: string;
  mission: string;
  satelliteSource?: string;
  instrument?: string;
  temporalResolution?: string;
  doiOrUrl: string;
  doiUrl?: string;
  processingMethod: string;
  scientificDescription: string;
  sonificationPrinciple: string;
  whatTheSoundMeans: string;
  audioMappingDescription: string;
  defaultInstrument: string;
  color: string;
  accentColor: string;
}

export interface SonificationParams {
  frequency: number;
  volume: number;
  filterCutoff: number;
  harmonicity: number;
  modulationRate: number;
  rhythmRate: number;
  resonance: number;
  waveType: OscillatorType;
}

export interface SonificationMappingConfig {
  pitchInverted: boolean;
  sensitivity: number; // 0.5 to 2.0
  baseFrequency: number; // e.g. 110Hz
  maxFrequency: number; // e.g. 880Hz
  timbre: "sine" | "triangle" | "sawtooth" | "fm" | "noise";
  reverbAmount: number;
}

export interface OrchestraTrack {
  variableId: VariableId;
  name: string;
  role: "Melody" | "Sub Bass" | "Bass Drone" | "Harmony Pad" | "Noise Rhythm" | "Percussion Droplets" | "Atmospheric Swell" | "Granular Texture" | "Crystalline Chime" | "Filter Sweep" | "Barometric Pulse";
  enabled: boolean;
  volume: number; // 0 to 1
  solo: boolean;
  color: string;
  timbre: string;
}

export interface TimeComparison {
  yearA: number;
  yearB: number;
  valueA: number;
  valueB: number;
  deltaValue: number;
  deltaNormalized: number;
  deltaPercent: number;
  direction: "increase" | "decrease" | "stable";
  scientificInsight: string;
}

export interface AccessibilitySettings {
  screenReaderDescriptions: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  captionsEnabled: boolean;
  soundCueOnTimeChange: boolean;
  fontSize?: "normal" | "large" | "extra-large";
  keyboardNav?: boolean;
}

export interface AudioVisualizerData {
  waveform: Uint8Array;
  frequency: Uint8Array;
  rms: number;
  peakFrequency: number;
  intensity: number;
}
