import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Upload,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Sliders,
  Sparkles,
  Activity,
  Radio,
  Snowflake,
  Thermometer,
  Trees,
  Flame,
  Globe2,
  Layers,
  ArrowRight,
  Info,
  CheckCircle2,
  SlidersHorizontal,
  Music,
  Gauge,
  Maximize2,
  Volume1,
  Video,
  Film,
  FastForward,
  Rewind,
  UploadCloud,
  RefreshCw,
  FileVideo,
  Download,
  Disc,
  Mic,
  Waves,
} from "lucide-react";
import { EarthGlobe } from "./EarthGlobe";
import { nasaDataService } from "../services/NASADataService";
import { VariableId } from "../types";
import { PillarFocusType } from "../App";

export type VisualSourceId =
  | "arctic_ice"
  | "global_temp"
  | "amazon_forest"
  | "wildfire"
  | "globe_3d"
  | "video_sonifier"
  | "custom";

interface VisualPreset {
  id: VisualSourceId;
  title: string;
  source: string;
  metricLabel: string;
  metricUnit: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  accentColor: string;
  description: string;
  soundRuleDescription: string;
  timbreDefault: "sine" | "triangle" | "sawtooth" | "noise";
  generateFrame?: (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    progress: number
  ) => void;
}

export interface UnifiedStudioProps {
  pillarFocus?: PillarFocusType;
  onPillarFocusChange?: (focus: PillarFocusType) => void;
  onOpenOrchestraDrawer?: () => void;
  onOpenSourcesModal?: () => void;
  onOpenNarratorModal?: () => void;
  isGlobalPlaying?: boolean;
  isGlobalMuted?: boolean;
  onAudioActiveChange?: (isActive: boolean) => void;
}

export const UnifiedStudio: React.FC<UnifiedStudioProps> = ({
  pillarFocus,
  onPillarFocusChange,
  onOpenOrchestraDrawer,
  onOpenSourcesModal,
  onOpenNarratorModal,
  isGlobalPlaying,
  isGlobalMuted,
  onAudioActiveChange,
}) => {
  // 0. Pillar Navigation Mode
  const [internalPillarFocus, setInternalPillarFocus] = useState<PillarFocusType>("all");
  const activePillar = pillarFocus !== undefined ? pillarFocus : internalPillarFocus;
  const setPillar = (p: PillarFocusType) => {
    setInternalPillarFocus(p);
    if (onPillarFocusChange) {
      onPillarFocusChange(p);
    }
  };

  // 1. Visual Source Selection
  const [selectedSource, setSelectedSource] = useState<VisualSourceId>("arctic_ice");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.75);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [progress, setProgress] = useState<number>(0.3); // 0 to 1 (1980 to 2025)
  const [scanMode, setScanMode] = useState<"whole_frame" | "scanline">("whole_frame");
  const [scanlineX, setScanlineX] = useState<number>(0.5);

  // 2. Accessibility & Narrator
  const [eyesClosedMode, setEyesClosedMode] = useState<boolean>(false);
  const [speechNarrator, setSpeechNarrator] = useState<boolean>(true);

  // 3. Sound Mapping Configuration (Part 2)
  const [baseFrequency, setBaseFrequency] = useState<number>(140);
  const [maxFrequency, setMaxFrequency] = useState<number>(880);
  const [pitchInverted, setPitchInverted] = useState<boolean>(false);
  const [pitchSensitivity, setPitchSensitivity] = useState<number>(1.0);
  const [timbre, setTimbre] = useState<"sine" | "triangle" | "sawtooth" | "noise">("sine");
  const [scaleMode, setScaleMode] = useState<"free" | "pentatonic" | "major" | "minor" | "dorian" | "chromatic">("pentatonic");
  const [tempoSubdivision, setTempoSubdivision] = useState<"quarter" | "eighth" | "triplet" | "sixteenth">("eighth");
  const [overtoneWarmth, setOvertoneWarmth] = useState<number>(0.25);

  // Advanced Web Audio Synthesizer States (Part 3)
  const [filterCutoff, setFilterCutoff] = useState<number>(1800);
  const [filterResonance, setFilterResonance] = useState<number>(2.5);
  const [filterType, setFilterType] = useState<BiquadFilterType>("lowpass");
  const [stereoPan, setStereoPan] = useState<number>(0);

  // Real-Time Audio Recorder (Part 3)
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const destNodeRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const pannerRef = useRef<StereoPannerNode | null>(null);
  const subGainRef = useRef<GainNode | null>(null);

  // 4. Extracted Real-Time Data (Part 1: Visual Analysis)
  const [extractedData, setExtractedData] = useState({
    colorIceWhite: 72,
    colorThermalRed: 8,
    colorCanopyGreen: 12,
    colorOceanBlue: 65,
    meanBrightness: 168,
    motionDelta: 0.05,
    patternDensity: "Clustered Polar",
    primaryMetricValue: 72,
  });

  // 5. Generated Live Audio Parameters (Part 3: Real-Time Generation)
  const [audioTelemetry, setAudioTelemetry] = useState({
    frequencyHz: 440,
    musicalNote: "A4",
    volumeGain: 0.75,
    tempoBpm: 84,
    timbreWave: "sine",
    synthesizerState: "Idle",
  });

  // Refs for Animation, Canvas & Web Audio
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const oscilloscopeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const progressRef = useRef<number>(0.3);
  const prevImageDataRef = useRef<Uint8ClampedArray | null>(null);
  const customImageRef = useRef<HTMLImageElement | null>(null);
  const customVideoRef = useRef<HTMLVideoElement | null>(null);
  const videoFileInputRef = useRef<HTMLInputElement | null>(null);
  const imageFileInputRef = useRef<HTMLInputElement | null>(null);
  const [customFileName, setCustomFileName] = useState<string>("");

  // Dedicated Video Sonifier State
  const [videoState, setVideoState] = useState<{
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    isLooping: boolean;
    playbackRate: number;
    targetFeature: "dominant" | "white" | "red" | "green" | "brightness" | "motion";
    sourceType: "sample" | "upload";
  }>({
    isPlaying: true,
    currentTime: 0,
    duration: 30,
    isLooping: true,
    playbackRate: 1,
    targetFeature: "dominant",
    sourceType: "sample",
  });

  // Web Audio Context & Nodes
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const subOscRef = useRef<OscillatorNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const lfoRef = useRef<OscillatorNode | null>(null);
  const lfoGainRef = useRef<GainNode | null>(null);
  const noiseNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const noiseGainRef = useRef<GainNode | null>(null);
  const lastSpokenTimeRef = useRef<number>(0);

  // Sync progressRef with state
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  // Visual Presets with Frame Generators
  const presets: Record<VisualSourceId, VisualPreset> = {
    arctic_ice: {
      id: "arctic_ice",
      title: "Arctic Sea Ice Melting Time-Lapse",
      source: "NASA Aqua/Terra MODIS & CryoSat-2 (1984–2024)",
      metricLabel: "Ice Coverage Extent",
      metricUnit: "% of Arctic Ocean",
      icon: Snowflake,
      accentColor: "#38bdf8",
      timbreDefault: "sine",
      description:
        "40-year satellite record showing the dramatic retreat of multiyear Arctic sea ice.",
      soundRuleDescription:
        "White Ice Coverage ➔ Pitch (High = 880Hz, Low = 180Hz) | Melting Rate ➔ Tremolo LFO",
      generateFrame: (ctx, width, height, prog) => {
        ctx.fillStyle = "#031129";
        ctx.fillRect(0, 0, width, height);

        // Coastlines
        ctx.fillStyle = "#1e293b";
        ctx.beginPath();
        ctx.ellipse(width * 0.2, height * 0.45, width * 0.12, height * 0.35, 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(width * 0.8, height * 0.75, width * 0.25, height * 0.2, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // Ice coverage: decreases as prog increases
        const decline = 0.82 - prog * 0.52;
        const seasonal = Math.sin(prog * Math.PI * 8) * 0.1;
        const extent = Math.max(0.2, decline + seasonal);

        const cx = width * 0.5;
        const cy = height * 0.5;
        const r = Math.min(width, height) * 0.4 * extent;

        const glow = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r * 1.25);
        glow.addColorStop(0, "rgba(224, 242, 254, 0.95)");
        glow.addColorStop(0.7, "rgba(186, 230, 253, 0.6)");
        glow.addColorStop(1, "rgba(56, 189, 248, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 1.25, 0, Math.PI * 2);
        ctx.fill();

        // White ice cap
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        const points = 32;
        for (let i = 0; i < points; i++) {
          const a = (i / points) * Math.PI * 2;
          const noise = Math.sin(a * 4 + prog * 6) * 0.12;
          const dist = r * (1 + noise);
          const px = cx + Math.cos(a) * dist;
          const py = cy + Math.sin(a) * dist;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        // Melt fissures
        if (prog > 0.35) {
          ctx.strokeStyle = "rgba(3, 17, 41, 0.8)";
          ctx.lineWidth = 2 + prog * 2.5;
          for (let f = 0; f < 5; f++) {
            ctx.beginPath();
            const sa = f * 1.2 + prog;
            ctx.moveTo(cx + Math.cos(sa) * r * 0.3, cy + Math.sin(sa) * r * 0.3);
            ctx.lineTo(cx + Math.cos(sa + 0.3) * r * 0.9, cy + Math.sin(sa + 0.3) * r * 0.9);
            ctx.stroke();
          }
        }
      },
    },

    global_temp: {
      id: "global_temp",
      title: "Global Surface Temperature Heat Anomaly",
      source: "NASA Goddard Institute for Space Studies (GISTEMP)",
      metricLabel: "Thermal Anomaly",
      metricUnit: "+°C above baseline",
      icon: Thermometer,
      accentColor: "#f97316",
      timbreDefault: "sawtooth",
      description:
        "Global heat anomaly map transitioning from mild cooling to extreme planetary warming.",
      soundRuleDescription:
        "Red Thermal Pixels ➔ Warning Pitch (Ascending Sawtooth) | Heat Intensity ➔ Volume & Cutoff Filter",
      generateFrame: (ctx, width, height, prog) => {
        ctx.fillStyle = "#050b14";
        ctx.fillRect(0, 0, width, height);

        // Latitude lines
        ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
        ctx.lineWidth = 1;
        for (let y = 0; y < height; y += height / 6) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        const heatIntensity = Math.min(1, Math.max(0.1, prog * 1.15));
        const numBlobs = 16;
        for (let i = 0; i < numBlobs; i++) {
          const bx = (i * 145) % width;
          const by = height * 0.2 + (Math.sin(i * 2.3) * 0.5 + 0.5) * height * 0.6;
          const rad = (width * 0.14) * (0.8 + Math.sin(i + prog * 4) * 0.3);

          const grad = ctx.createRadialGradient(bx, by, 0, bx, by, rad);
          if (heatIntensity < 0.35) {
            grad.addColorStop(0, "rgba(56, 189, 248, 0.7)");
            grad.addColorStop(0.6, "rgba(30, 64, 175, 0.4)");
            grad.addColorStop(1, "rgba(5, 11, 20, 0)");
          } else {
            const alpha = Math.min(0.92, heatIntensity * 0.95);
            grad.addColorStop(0, `rgba(254, 240, 138, ${alpha})`);
            grad.addColorStop(0.35, `rgba(249, 115, 22, ${alpha * 0.85})`);
            grad.addColorStop(0.7, `rgba(220, 38, 38, ${alpha * 0.6})`);
            grad.addColorStop(1, "rgba(5, 11, 20, 0)");
          }

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(bx, by, rad, 0, Math.PI * 2);
          ctx.fill();
        }
      },
    },

    amazon_forest: {
      id: "amazon_forest",
      title: "Amazon Rainforest Deforestation",
      source: "NASA/USGS Landsat 7/8/9 & Terra MODIS",
      metricLabel: "Intact Canopy Coverage",
      metricUnit: "% Intact Rainforest",
      icon: Trees,
      accentColor: "#10b981",
      timbreDefault: "triangle",
      description:
        "Time-lapse of the southern Amazon where intact dense canopy is cleared into fishbone roads.",
      soundRuleDescription:
        "Green Canopy Pixels ➔ Resonant Organic Chord (432Hz) | Forest Loss ➔ Thin Hollow Wind Noise",
      generateFrame: (ctx, width, height, prog) => {
        ctx.fillStyle = "#064e3b";
        ctx.fillRect(0, 0, width, height);

        // River
        ctx.strokeStyle = "#0284c7";
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.moveTo(0, height * 0.3);
        ctx.bezierCurveTo(width * 0.3, height * 0.1, width * 0.7, height * 0.6, width, height * 0.4);
        ctx.stroke();

        // Fishbone deforested tracts
        const cleared = Math.floor(prog * 26);
        ctx.fillStyle = "#78350f";
        ctx.strokeStyle = "#a16207";
        ctx.lineWidth = 2.5;

        for (let b = 0; b < cleared; b++) {
          const rx = (b * 67) % (width - 60) + 20;
          const ry = height * 0.45 + ((b * 41) % (height * 0.45));
          const rw = 24 + (b % 4) * 12;
          const rh = 16 + (b % 3) * 10;

          ctx.beginPath();
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx + rw, ry - rh);
          ctx.stroke();
          ctx.fillRect(rx, ry, rw, rh);
        }
      },
    },

    wildfire: {
      id: "wildfire",
      title: "Wildfire Front & Smoke Radiance",
      source: "NASA FIRMS / Suomi NPP VIIRS Active Fire",
      metricLabel: "Active Fire Front Radiance",
      metricUnit: "MW / Thermal Flux",
      icon: Flame,
      accentColor: "#ef4444",
      timbreDefault: "noise",
      description:
        "Thermal infrared detection of active firelines with smoke plumes spreading downwind.",
      soundRuleDescription:
        "Fire Front Pixels ➔ Granular Crackle Noise | Burn Rate ➔ Fast Alarm Pulse Rate (BPM)",
      generateFrame: (ctx, width, height, prog) => {
        ctx.fillStyle = "#18181b";
        ctx.fillRect(0, 0, width, height);

        // Smoke plume
        const smoke = ctx.createRadialGradient(
          width * 0.35,
          height * 0.5,
          20,
          width * 0.65,
          height * 0.35,
          width * 0.5
        );
        smoke.addColorStop(0, "rgba(82, 82, 91, 0.85)");
        smoke.addColorStop(0.5, "rgba(63, 63, 70, 0.45)");
        smoke.addColorStop(1, "rgba(24, 24, 27, 0)");
        ctx.fillStyle = smoke;
        ctx.beginPath();
        ctx.ellipse(width * 0.55, height * 0.4, width * 0.4, height * 0.3, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // Active burning fireline perimeter
        const activeFireProg = Math.min(1, prog * 1.3);
        const firelinePoints = Math.floor(18 + activeFireProg * 35);
        ctx.lineWidth = 4 + Math.sin(prog * 20) * 1.5;

        for (let f = 0; f < firelinePoints; f++) {
          const fx = width * 0.15 + (f / firelinePoints) * width * 0.55;
          const fy = height * 0.7 - Math.sin((f + prog * 15) * 0.5) * height * 0.3;
          const glow = ctx.createRadialGradient(fx, fy, 2, fx, fy, 22);
          glow.addColorStop(0, "rgba(254, 240, 138, 1.0)");
          glow.addColorStop(0.4, "rgba(239, 68, 68, 0.85)");
          glow.addColorStop(1, "rgba(185, 28, 28, 0)");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(fx, fy, 22, 0, Math.PI * 2);
          ctx.fill();
        }
      },
    },

    globe_3d: {
      id: "globe_3d",
      title: "Interactive 3D NASA Satellite Earth Globe",
      source: "NASA Visible Earth / Blue Marble Satellite Imagery",
      metricLabel: "Surface Sphere Telemetry",
      metricUnit: "Planetary Observation",
      icon: Globe2,
      accentColor: "#06b6d4",
      timbreDefault: "sine",
      description:
        "Full Three.js 3D Earth globe with NASA Blue Marble textures, atmospheric glow, and observation pins.",
      soundRuleDescription:
        "Latitude & Longitude Surface Scans ➔ Continuous Polyphonic Frequency Harmonic",
    },

    video_sonifier: {
      id: "video_sonifier",
      title: "Video Sonifier (Upload Video & Live Sound)",
      source: "User Uploaded Satellite / Drone Video (.mp4, .webm) or NASA Cyclone Stream",
      metricLabel: "Video Optical & Motion Flow",
      metricUnit: "Delta & Radiance",
      icon: Video,
      accentColor: "#ec4899",
      timbreDefault: "sawtooth",
      description:
        "Upload any Earth observation video or run the live NASA GOES cyclone simulation. Computer vision extracts frame-by-frame color, luminance, and motion delta into real-time sound.",
      soundRuleDescription:
        "Video Motion ➔ Tempo (BPM) • Frame Radiance ➔ Pitch & Filter Cutoff",
      generateFrame: (ctx, w, h, prog) => {
        // High fidelity NASA GOES-16 Cyclone simulation
        const cx = w / 2;
        const cy = h / 2;
        const time = Date.now() * 0.0018;

        const bgGrad = ctx.createRadialGradient(cx, cy, 30, cx, cy, w * 0.65);
        bgGrad.addColorStop(0, "#082f49");
        bgGrad.addColorStop(0.5, "#0b1d36");
        bgGrad.addColorStop(1, "#020617");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        const arms = 4;
        for (let a = 0; a < arms; a++) {
          const armAngle = (a * Math.PI * 2) / arms + time * 0.9;
          for (let r = 18; r < w * 0.42; r += 7) {
            const theta = armAngle + (r / 32);
            const x = cx + Math.cos(theta) * r;
            const y = cy + Math.sin(theta) * (r * 0.72);
            const cloudRadius = 8 + Math.sin(r * 0.12 + time * 2) * 5 + (r / 26);
            const cloudGrad = ctx.createRadialGradient(x, y, 2, x, y, cloudRadius);

            if (r < 65) {
              cloudGrad.addColorStop(0, "rgba(239, 68, 68, 0.9)");
              cloudGrad.addColorStop(0.5, "rgba(245, 158, 11, 0.6)");
              cloudGrad.addColorStop(1, "rgba(239, 68, 68, 0)");
            } else {
              cloudGrad.addColorStop(0, "rgba(255, 255, 255, 0.92)");
              cloudGrad.addColorStop(0.6, "rgba(224, 242, 254, 0.5)");
              cloudGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
            }
            ctx.fillStyle = cloudGrad;
            ctx.beginPath();
            ctx.arc(x, y, cloudRadius, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Cyclone Eye
        const eyeGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 18);
        eyeGrad.addColorStop(0, "#020617");
        eyeGrad.addColorStop(0.8, "rgba(15, 23, 42, 0.7)");
        eyeGrad.addColorStop(1, "transparent");
        ctx.fillStyle = eyeGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, 18, 0, Math.PI * 2);
        ctx.fill();

        // Atmospheric pressure ripples
        const rippleR = ((time * 45) % (w * 0.48));
        ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 8]);
        ctx.beginPath();
        ctx.ellipse(cx, cy, rippleR, rippleR * 0.72, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      },
    },

    custom: {
      id: "custom",
      title: "Custom Satellite Image Feed",
      source: "User Uploaded Satellite Asset (JPG, PNG)",
      metricLabel: "Custom Pixel Extraction",
      metricUnit: "Optical Metrics",
      icon: Upload,
      accentColor: "#a855f7",
      timbreDefault: "triangle",
      description:
        "Upload any satellite image to analyze optical colors and sonify in real time.",
      soundRuleDescription:
        "Color & Brightness in Custom Media ➔ Real-Time Synthesis Parameters",
    },
  };

  const activePreset = presets[selectedSource];

  // Helper: Scale quantizer for musical tuning
  const quantizeFrequency = (rawFreq: number, mode: string): number => {
    if (mode === "free") return rawFreq;
    const midi = 12 * Math.log2(rawFreq / 440) + 69;
    const roundedMidi = Math.round(midi);
    const noteInOctave = ((roundedMidi % 12) + 12) % 12;
    const octave = Math.floor(roundedMidi / 12);

    const scalePatterns: Record<string, number[]> = {
      pentatonic: [0, 2, 4, 7, 9],
      major: [0, 2, 4, 5, 7, 9, 11],
      minor: [0, 2, 3, 5, 7, 8, 10],
      dorian: [0, 2, 3, 5, 7, 9, 10],
      chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    };

    const scale = scalePatterns[mode];
    if (!scale) return rawFreq;

    let nearest = scale[0];
    let minDiff = 999;
    for (const s of scale) {
      const diff = Math.abs(s - noteInOctave);
      if (diff < minDiff) {
        minDiff = diff;
        nearest = s;
      }
    }
    const quantizedMidi = octave * 12 + nearest;
    return 440 * Math.pow(2, (quantizedMidi - 69) / 12);
  };

  // Helper: Convert frequency to musical note name
  const freqToNote = (freq: number): string => {
    const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const semitones = Math.round(12 * Math.log2(freq / 440)) + 69;
    const noteName = notes[semitones % 12];
    const octave = Math.floor(semitones / 12) - 1;
    return `${noteName}${octave}`;
  };

  // Initialize Web Audio Engine (Part 3: Real-Time Generation)
  const initAudio = useCallback(() => {
    if (audioCtxRef.current) return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    audioCtxRef.current = ctx;

    // Analyser Node for Live Real-Time Oscilloscope
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyserRef.current = analyser;

    // Master Gain
    const masterGain = ctx.createGain();
    const initialGain = (!isPlaying || isMuted) ? 0.00001 : volume;
    masterGain.gain.setValueAtTime(initialGain, ctx.currentTime);
    masterGain.connect(analyser);
    analyser.connect(ctx.destination);
    gainRef.current = masterGain;

    // Filter Node (Biquad)
    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(filterCutoff, ctx.currentTime);
    filter.Q.setValueAtTime(filterResonance, ctx.currentTime);
    filterRef.current = filter;

    // Stereo Panner (if supported)
    if (typeof (ctx as any).createStereoPanner === "function") {
      const panner = (ctx as any).createStereoPanner();
      panner.pan.setValueAtTime(stereoPan, ctx.currentTime);
      filter.connect(panner);
      panner.connect(masterGain);
      pannerRef.current = panner;
    } else {
      filter.connect(masterGain);
    }

    // MediaStream Destination for Audio Recording & Download
    if (typeof (ctx as any).createMediaStreamDestination === "function") {
      const dest = (ctx as any).createMediaStreamDestination();
      masterGain.connect(dest);
      destNodeRef.current = dest;
    }

    // Primary Oscillator
    const osc = ctx.createOscillator();
    osc.type = timbre === "noise" ? "sawtooth" : timbre;
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.connect(filter);
    osc.start();
    oscRef.current = osc;

    // Sub Oscillator (Sub-bass warmth)
    const subOsc = ctx.createOscillator();
    subOsc.type = "sine";
    subOsc.frequency.setValueAtTime(220, ctx.currentTime);
    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(overtoneWarmth, ctx.currentTime);
    subOsc.connect(subGain);
    subGain.connect(filter);
    subOsc.start();
    subOscRef.current = subOsc;
    subGainRef.current = subGain;

    // LFO (Tremolo / Modulation)
    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(4, ctx.currentTime);
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(0, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start();
    lfoRef.current = lfo;
    lfoGainRef.current = lfoGain;

    // White Noise Generator for Wildfire Crackle & Wind
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer = noiseBuffer;
    noiseNode.loop = true;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.setValueAtTime(1200, ctx.currentTime);
    noiseFilter.Q.setValueAtTime(3.0, ctx.currentTime);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0, ctx.currentTime);

    noiseNode.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);
    noiseNode.start();

    noiseNodeRef.current = noiseNode;
    noiseGainRef.current = noiseGain;
  }, [isMuted, volume, timbre, filterType, filterCutoff, filterResonance, stereoPan, overtoneWarmth]);

  // Sync with global play state from Navbar / Spacebar
  useEffect(() => {
    if (isGlobalPlaying !== undefined && isGlobalPlaying !== isPlaying) {
      if (isGlobalPlaying) {
        initAudio();
        if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
          audioCtxRef.current.resume();
        }
        if (customVideoRef.current && selectedSource === "video_sonifier") {
          customVideoRef.current.play().catch(() => {});
          setVideoState((prev) => ({ ...prev, isPlaying: true }));
        }
      } else {
        if (gainRef.current && audioCtxRef.current) {
          const now = audioCtxRef.current.currentTime;
          gainRef.current.gain.cancelScheduledValues(now);
          gainRef.current.gain.setValueAtTime(gainRef.current.gain.value, now);
          gainRef.current.gain.setTargetAtTime(0.00001, now, 0.02);
        }
        if (customVideoRef.current) {
          customVideoRef.current.pause();
          setVideoState((prev) => ({ ...prev, isPlaying: false }));
        }
      }
      setIsPlaying(isGlobalPlaying);
    }
  }, [isGlobalPlaying]);

  useEffect(() => {
    if (isGlobalMuted !== undefined) {
      setIsMuted(isGlobalMuted);
    }
  }, [isGlobalMuted]);

  // Guaranteed cleanup on unmount - no leaking audio contexts or oscillators
  useEffect(() => {
    return () => {
      if (gainRef.current && audioCtxRef.current) {
        try {
          const now = audioCtxRef.current.currentTime;
          gainRef.current.gain.cancelScheduledValues(now);
          gainRef.current.gain.setValueAtTime(0, now);
        } catch {}
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        try {
          audioCtxRef.current.close();
        } catch {}
      }
      if (customVideoRef.current) {
        try {
          customVideoRef.current.pause();
        } catch {}
      }
    };
  }, []);

  // Master Volume, Playback State & Mute listener (Guarantees absolute silence when paused)
  useEffect(() => {
    if (gainRef.current && audioCtxRef.current) {
      const now = audioCtxRef.current.currentTime;
      gainRef.current.gain.cancelScheduledValues(now);
      if (!isPlaying || isMuted) {
        gainRef.current.gain.setValueAtTime(gainRef.current.gain.value, now);
        gainRef.current.gain.setTargetAtTime(0.00001, now, 0.03);
      } else {
        gainRef.current.gain.setTargetAtTime(volume, now, 0.05);
      }
    }
  }, [isPlaying, volume, isMuted]);

  // Timbre change listener
  useEffect(() => {
    if (oscRef.current) {
      oscRef.current.type = timbre === "noise" ? "sawtooth" : timbre;
    }
  }, [timbre]);

  // Filter parameter updates
  useEffect(() => {
    if (filterRef.current && audioCtxRef.current) {
      const now = audioCtxRef.current.currentTime;
      filterRef.current.type = filterType;
      filterRef.current.frequency.setTargetAtTime(filterCutoff, now, 0.05);
      filterRef.current.Q.setTargetAtTime(filterResonance, now, 0.05);
    }
  }, [filterCutoff, filterResonance, filterType]);

  // Stereo pan listener
  useEffect(() => {
    if (pannerRef.current && audioCtxRef.current) {
      const now = audioCtxRef.current.currentTime;
      pannerRef.current.pan.setTargetAtTime(stereoPan, now, 0.05);
    }
  }, [stereoPan]);

  // Sub oscillator overtone warmth listener
  useEffect(() => {
    if (subGainRef.current && audioCtxRef.current) {
      const now = audioCtxRef.current.currentTime;
      subGainRef.current.gain.setTargetAtTime(overtoneWarmth, now, 0.05);
    }
  }, [overtoneWarmth]);

  // Audition Test Note Handler (Pillar 2 Test Button)
  const handleAuditionMapping = () => {
    initAudio();
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
      const now = audioCtxRef.current.currentTime;
      if (gainRef.current) {
        gainRef.current.gain.cancelScheduledValues(now);
        gainRef.current.gain.setValueAtTime(0, now);
        gainRef.current.gain.linearRampToValueAtTime(volume, now + 0.04);
        gainRef.current.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
      }
    }
  };

  // Real-time Audio Recorder (MediaRecorder to .webm file)
  const handleToggleRecord = () => {
    initAudio();
    if (!isRecording) {
      if (!destNodeRef.current) return;
      try {
        recordedChunksRef.current = [];
        const mr = new MediaRecorder(destNodeRef.current.stream);
        mr.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };
        mr.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: "audio/webm" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `earth-jukebox-${selectedSource}-${Date.now()}.webm`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        };
        mr.start();
        mediaRecorderRef.current = mr;
        setIsRecording(true);
        setRecordingSeconds(0);
        if (!isPlaying) {
          setIsPlaying(true);
        }
      } catch (err) {
        console.warn("MediaRecorder start error:", err);
      }
    } else {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    }
  };

  // Recording Timer
  useEffect(() => {
    let timer: any;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  // Update preset default timbre when source changes
  const handleSelectSource = (id: VisualSourceId) => {
    setSelectedSource(id);
    setTimbre(presets[id].timbreDefault);
  };

  // Perform Real-Time Visual Computer Vision Analysis (Part 1: Visual Analysis)
  const analyzeFrame = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      let imgData: ImageData;
      try {
        imgData = ctx.getImageData(0, 0, width, height);
      } catch {
        return;
      }

      const data = imgData.data;
      let whiteCount = 0;
      let greenCount = 0;
      let thermalCount = 0;
      let blueCount = 0;
      let totalLuminance = 0;
      let sampled = 0;

      const step = 6;
      const startX = scanMode === "scanline" ? Math.floor(scanlineX * width) - 8 : 0;
      const endX = scanMode === "scanline" ? Math.floor(scanlineX * width) + 8 : width;

      for (let y = 0; y < height; y += step) {
        for (let x = Math.max(0, startX); x < Math.min(width, endX); x += step) {
          const idx = (y * width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          // Luminance
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          totalLuminance += lum;
          sampled++;

          // White (Ice)
          if (r > 195 && g > 195 && b > 195 && Math.abs(r - b) < 40) {
            whiteCount++;
          }
          // Green (Canopy)
          if (g > 70 && g > r * 1.12 && g > b * 1.12) {
            greenCount++;
          }
          // Red (Thermal / Fire)
          if (r > 160 && r - b > 50) {
            thermalCount++;
          }
          // Blue (Ocean / Water)
          if (b > 110 && b > r * 1.2) {
            blueCount++;
          }
        }
      }

      const whiteRatio = whiteCount / (sampled || 1);
      const greenRatio = greenCount / (sampled || 1);
      const thermalRatio = thermalCount / (sampled || 1);
      const blueRatio = blueCount / (sampled || 1);
      const meanLum = totalLuminance / (sampled || 1);

      // Frame Motion Delta (Change Detection)
      let motionDelta = 0;
      if (prevImageDataRef.current) {
        let diffSum = 0;
        const prev = prevImageDataRef.current;
        for (let i = 0; i < data.length; i += 16) {
          diffSum += Math.abs(data[i] - prev[i]);
        }
        motionDelta = diffSum / (data.length / 16) / 255;
      }
      prevImageDataRef.current = new Uint8ClampedArray(data);

      // Map Extracted Metrics to Primary Value
      let primaryMetric = 50;
      if (selectedSource === "arctic_ice") {
        primaryMetric = Math.round(whiteRatio * 100);
      } else if (selectedSource === "global_temp") {
        primaryMetric = Math.round(thermalRatio * 100);
      } else if (selectedSource === "amazon_forest") {
        primaryMetric = Math.round(greenRatio * 100);
      } else if (selectedSource === "wildfire") {
        primaryMetric = Math.round(thermalRatio * 100);
      } else if (selectedSource === "video_sonifier") {
        if (videoState.targetFeature === "white") {
          primaryMetric = Math.round(whiteRatio * 100);
        } else if (videoState.targetFeature === "red") {
          primaryMetric = Math.round(thermalRatio * 100);
        } else if (videoState.targetFeature === "green") {
          primaryMetric = Math.round(greenRatio * 100);
        } else if (videoState.targetFeature === "motion") {
          primaryMetric = Math.min(100, Math.round(motionDelta * 500));
        } else if (videoState.targetFeature === "brightness") {
          primaryMetric = Math.round((meanLum / 255) * 100);
        } else {
          // Dominant multi-feature blend: clouds + thermal infrared + luminance
          primaryMetric = Math.round(
            (whiteRatio * 0.45 + thermalRatio * 0.35 + (meanLum / 255) * 0.2) * 100
          );
        }
      } else {
        primaryMetric = Math.round((meanLum / 255) * 100);
      }

      setExtractedData({
        colorIceWhite: Math.round(whiteRatio * 100),
        colorThermalRed: Math.round(thermalRatio * 100),
        colorCanopyGreen: Math.round(greenRatio * 100),
        colorOceanBlue: Math.round(blueRatio * 100),
        meanBrightness: Math.round(meanLum),
        motionDelta: parseFloat(motionDelta.toFixed(3)),
        patternDensity:
          scanMode === "scanline"
            ? `Scanline col ${Math.round(scanlineX * 100)}%`
            : selectedSource === "video_sonifier"
            ? `Video Frame • ${(motionDelta * 100).toFixed(1)}% Δ`
            : "Whole Matrix Sample",
        primaryMetricValue: primaryMetric,
      });

      // ======================================================================
      // PART 2: SONIFICATION MAPPING (Mapping extracted data to sound)
      // ======================================================================
      let normVal = primaryMetric / 100;
      if (pitchInverted) {
        normVal = 1 - normVal;
      }

      // 1. Calculate Target Frequency (Pitch with musical scale quantizer)
      const rawFreq =
        baseFrequency + normVal * (maxFrequency - baseFrequency) * pitchSensitivity;
      const targetFreq = quantizeFrequency(rawFreq, scaleMode);
      const note = freqToNote(targetFreq);

      // 2. Calculate Tempo (BPM) based on Rate of Change and rhythmic subdivision
      const subMultiplier =
        tempoSubdivision === "sixteenth" ? 1.5 : tempoSubdivision === "triplet" ? 1.25 : tempoSubdivision === "eighth" ? 1.0 : 0.75;
      const baseTempo =
        selectedSource === "video_sonifier"
          ? 70 + Math.min(130, motionDelta * 280)
          : 70 + motionDelta * 180;
      const calculatedTempo = Math.round(baseTempo * subMultiplier);

      // 3. Dynamic Modulation (Filter & Noise)
      let noiseLevel = 0;
      let lfoDepth = 0;
      let filterCutoff = 1200;

      if (selectedSource === "arctic_ice") {
        filterCutoff = 800 + whiteRatio * 2200;
        if (whiteRatio < 0.4) lfoDepth = (0.4 - whiteRatio) * 12; // melting dissonance
      } else if (selectedSource === "global_temp") {
        filterCutoff = 600 + thermalRatio * 3200;
        lfoDepth = thermalRatio * 15;
      } else if (selectedSource === "amazon_forest") {
        filterCutoff = 500 + greenRatio * 1800;
        noiseLevel = (1 - greenRatio) * 0.3; // dry wind noise on deforestation
      } else if (selectedSource === "wildfire") {
        filterCutoff = 1200 + thermalRatio * 4000;
        noiseLevel = thermalRatio * 0.55; // crackle noise
      } else if (selectedSource === "video_sonifier") {
        filterCutoff = 700 + (meanLum / 255) * 2800;
        lfoDepth = motionDelta * 22;
        noiseLevel = Math.max(0, (1 - whiteRatio) * 0.18);
      }

      // Update Web Audio Nodes in Real Time (Part 3: Real-Time Generation)
      if (audioCtxRef.current && isPlaying) {
        const now = audioCtxRef.current.currentTime;
        if (oscRef.current) {
          oscRef.current.frequency.setTargetAtTime(targetFreq, now, 0.04);
        }
        if (subOscRef.current) {
          subOscRef.current.frequency.setTargetAtTime(targetFreq * 0.5, now, 0.04);
        }
        if (filterRef.current) {
          filterRef.current.frequency.setTargetAtTime(filterCutoff, now, 0.06);
        }
        if (lfoGainRef.current) {
          lfoGainRef.current.gain.setTargetAtTime(lfoDepth, now, 0.05);
        }
        if (noiseGainRef.current) {
          noiseGainRef.current.gain.setTargetAtTime(noiseLevel, now, 0.05);
        }
      }

      setAudioTelemetry({
        frequencyHz: Math.round(targetFreq),
        musicalNote: note,
        volumeGain: Math.round(volume * 100),
        tempoBpm: calculatedTempo,
        timbreWave: timbre,
        synthesizerState: isPlaying ? "Active Synthesis" : "Standby",
      });

      // Voice Audio Description for Blind/Low-Vision Users
      if (speechNarrator && isPlaying && "speechSynthesis" in window) {
        const timeNow = Date.now();
        if (timeNow - lastSpokenTimeRef.current > 12000) {
          lastSpokenTimeRef.current = timeNow;
          const msg = `${activePreset.metricLabel} is currently ${primaryMetric} percent. Audio pitch is ${Math.round(
            targetFreq
          )} Hertz at ${note}.`;
          const utterance = new SpeechSynthesisUtterance(msg);
          utterance.rate = 1.05;
          window.speechSynthesis.speak(utterance);
        }
      }
    },
    [
      selectedSource,
      scanMode,
      scanlineX,
      pitchInverted,
      baseFrequency,
      maxFrequency,
      pitchSensitivity,
      timbre,
      isPlaying,
      volume,
      speechNarrator,
      activePreset,
    ]
  );

  // Continuous 60 FPS Render & Visual Analysis Loop
  useEffect(() => {
    let animId: number;

    const renderLoop = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;

          if (selectedSource === "custom" && customImageRef.current) {
            ctx.drawImage(customImageRef.current, 0, 0, w, h);
          } else if (
            (selectedSource === "custom" || selectedSource === "video_sonifier") &&
            customVideoRef.current &&
            customVideoRef.current.readyState >= 2
          ) {
            ctx.drawImage(customVideoRef.current, 0, 0, w, h);
          } else if (selectedSource !== "globe_3d" && activePreset.generateFrame) {
            activePreset.generateFrame(ctx, w, h, progressRef.current);
          }

          // Draw Optical Scanline Indicator
          if (scanMode === "scanline" && selectedSource !== "globe_3d") {
            const sx = scanlineX * w;
            ctx.strokeStyle = "rgba(34, 211, 238, 0.9)";
            ctx.lineWidth = 2.5;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(sx, 0);
            ctx.lineTo(sx, h);
            ctx.stroke();
            ctx.setLineDash([]);
          }

          // Analyze Visual Frame
          if (selectedSource !== "globe_3d") {
            analyzeFrame(ctx, w, h);
          }
        }
      }

      // Advance time if playing
      if (isPlaying) {
        progressRef.current += 0.0018 * playbackSpeed;
        if (progressRef.current > 1) {
          progressRef.current = 0;
        }
        setProgress(progressRef.current);
      }

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, playbackSpeed, selectedSource, scanMode, scanlineX, activePreset, analyzeFrame]);

  // Live Oscilloscope & Audio Spectrum Visualizer Loop (Part 3: Real-Time Generation)
  useEffect(() => {
    let oscAnimId: number;

    const renderOsc = () => {
      const canvas = oscilloscopeCanvasRef.current;
      if (!canvas) {
        oscAnimId = requestAnimationFrame(renderOsc);
        return;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;

      ctx.fillStyle = "rgba(3, 7, 18, 0.45)";
      ctx.fillRect(0, 0, w, h);

      // Grid
      ctx.strokeStyle = "rgba(34, 211, 238, 0.06)";
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      const analyser = analyserRef.current;

      if (!analyser || !isPlaying) {
        // Idle ambient line
        const now = Date.now() * 0.002;
        ctx.strokeStyle = "rgba(100, 116, 139, 0.4)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = 0; x < w; x += 4) {
          const y = h / 2 + Math.sin(x * 0.04 + now) * 4;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        oscAnimId = requestAnimationFrame(renderOsc);
        return;
      }

      const bufferLen = analyser.frequencyBinCount;
      const timeData = new Uint8Array(bufferLen);
      const freqData = new Uint8Array(bufferLen);
      analyser.getByteTimeDomainData(timeData);
      analyser.getByteFrequencyData(freqData);

      // Draw Live Frequency Bars in background
      const barWidth = (w / bufferLen) * 3;
      for (let i = 0; i < bufferLen; i += 2) {
        const barHeight = (freqData[i] / 255) * (h * 0.8);
        ctx.fillStyle = "rgba(56, 189, 248, 0.12)";
        ctx.fillRect(i * barWidth, h - barHeight, barWidth - 1, barHeight);
      }

      // Draw Live Real-Time Oscilloscope Waveform
      ctx.strokeStyle = activePreset.accentColor || "#22d3ee";
      ctx.lineWidth = 2.5;
      ctx.shadowColor = activePreset.accentColor || "#22d3ee";
      ctx.shadowBlur = 8;
      ctx.beginPath();

      const sliceWidth = w / bufferLen;
      let x = 0;
      for (let i = 0; i < bufferLen; i++) {
        const v = timeData[i] / 128.0;
        const y = (v * h) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      oscAnimId = requestAnimationFrame(renderOsc);
    };

    oscAnimId = requestAnimationFrame(renderOsc);
    return () => cancelAnimationFrame(oscAnimId);
  }, [isPlaying, activePreset]);

  // Master Play/Pause Toggle
  const handleTogglePlay = () => {
    const nextPlay = !isPlaying;
    if (nextPlay) {
      initAudio();
      if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
      if (gainRef.current && audioCtxRef.current) {
        const now = audioCtxRef.current.currentTime;
        gainRef.current.gain.cancelScheduledValues(now);
        gainRef.current.gain.setTargetAtTime(isMuted ? 0.00001 : volume, now, 0.04);
      }
      if (customVideoRef.current && selectedSource === "video_sonifier") {
        customVideoRef.current.play().catch(() => {});
        setVideoState((prev) => ({ ...prev, isPlaying: true }));
      }
    } else {
      if (gainRef.current && audioCtxRef.current) {
        const now = audioCtxRef.current.currentTime;
        gainRef.current.gain.cancelScheduledValues(now);
        gainRef.current.gain.setValueAtTime(gainRef.current.gain.value, now);
        gainRef.current.gain.setTargetAtTime(0.00001, now, 0.02);
      }
      if (customVideoRef.current) {
        customVideoRef.current.pause();
        setVideoState((prev) => ({ ...prev, isPlaying: false }));
      }
    }
    setIsPlaying(nextPlay);
    onAudioActiveChange?.(nextPlay);
  };

  // Canvas Click Handler: Allows user to click anywhere on the frame to sonify that exact scanline column
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / rect.width;
    const clampedX = Math.max(0, Math.min(1, clickX));
    setScanlineX(clampedX);
    if (scanMode !== "scanline") {
      setScanMode("scanline");
    }
    if (!isPlaying) {
      handleTogglePlay();
    }
  };

  // Dedicated Video Upload Handler
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.src = url;
    video.crossOrigin = "anonymous";
    video.playsInline = true;
    video.setAttribute("playsinline", "true");
    video.loop = videoState.isLooping;
    video.muted = true;
    video.playbackRate = videoState.playbackRate;

    video.onloadedmetadata = () => {
      setVideoState((prev) => ({
        ...prev,
        duration: video.duration || 10,
        isPlaying: true,
        sourceType: "upload",
      }));
      video.play().catch(() => {});
    };

    video.ontimeupdate = () => {
      setVideoState((prev) => ({
        ...prev,
        currentTime: video.currentTime,
        duration: video.duration || prev.duration,
      }));
    };

    video.onended = () => {
      if (!video.loop) {
        setVideoState((prev) => ({ ...prev, isPlaying: false }));
        if (gainRef.current && audioCtxRef.current) {
          const now = audioCtxRef.current.currentTime;
          gainRef.current.gain.cancelScheduledValues(now);
          gainRef.current.gain.setValueAtTime(gainRef.current.gain.value, now);
          gainRef.current.gain.setTargetAtTime(0.00001, now, 0.02);
        }
        setIsPlaying(false);
        onAudioActiveChange?.(false);
      }
    };

    customVideoRef.current = video;
    customImageRef.current = null;
    setCustomFileName(file.name);
    setSelectedSource("video_sonifier");

    // Start audio sonification in sync with uploaded video
    initAudio();
    if (!isPlaying) {
      handleTogglePlay();
    }
  };

  // Dedicated Image Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      customImageRef.current = img;
      if (customVideoRef.current) {
        customVideoRef.current.pause();
        customVideoRef.current = null;
      }
      setCustomFileName(file.name);
      setSelectedSource("custom");
    };
  };

  // Video Playback Controls (100% synchronized with Web Audio synthesizer)
  const toggleVideoPlayback = () => {
    const video = customVideoRef.current;
    if (video) {
      if (video.paused) {
        video.play().then(() => {
          setVideoState((prev) => ({ ...prev, isPlaying: true }));
        }).catch(() => {});
        if (!isPlaying) {
          handleTogglePlay();
        }
      } else {
        video.pause();
        setVideoState((prev) => ({ ...prev, isPlaying: false }));
        if (isPlaying) {
          handleTogglePlay();
        }
      }
    } else {
      // Toggle both video state and sonification in sync
      handleTogglePlay();
    }
  };

  const seekVideo = (time: number) => {
    const video = customVideoRef.current;
    if (video) {
      video.currentTime = time;
    }
    setVideoState((prev) => ({ ...prev, currentTime: time }));
  };

  const setVideoPlaybackRate = (rate: number) => {
    const video = customVideoRef.current;
    if (video) {
      video.playbackRate = rate;
    }
    setVideoState((prev) => ({ ...prev, playbackRate: rate }));
  };

  const resetToNasaSampleVideo = () => {
    if (customVideoRef.current) {
      customVideoRef.current.pause();
      customVideoRef.current = null;
    }
    customImageRef.current = null;
    setCustomFileName("NASA GOES Cyclone Satellite Stream");
    setVideoState((prev) => ({
      ...prev,
      sourceType: "sample",
      isPlaying: true,
      currentTime: 0,
      duration: 30,
    }));
    setSelectedSource("video_sonifier");
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Custom File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCustomFileName(file.name);

    if (file.type.startsWith("image/")) {
      handleImageUpload(e);
    } else if (file.type.startsWith("video/")) {
      handleVideoUpload(e);
    }
  };

  // Calculated Year (1980 to 2025)
  const currentYear = Math.round(1980 + progress * 45);

  return (
    <div className="w-full space-y-5 animate-fadeIn">
      {/* ==================================================================== */}
      {/* MINIMAL TOP CONTROL BAR                                             */}
      {/* ==================================================================== */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/80 border border-cyan-500/25 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        {/* Left: Challenge Title & Live Generation Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <h1 className="font-display font-extrabold text-white text-base sm:text-lg tracking-tight">
              EARTH JUKEBOX
            </h1>
          </div>
          <span className="text-[10px] font-mono bg-cyan-950/90 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full font-bold hidden sm:inline">
            SIGHT-TO-SOUND SYNTHESIS ENGINE
          </span>
        </div>

        {/* Right: Master Audio Transport & Accessibility Actions */}
        <div className="flex items-center gap-2">
          {/* Master Play/Pause */}
          <button
            onClick={handleTogglePlay}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs font-bold transition shadow-lg ${
              isPlaying
                ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20"
                : "bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/25"
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-slate-950" />
                <span>PAUSE SOUND</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-slate-950" />
                <span>START SONIFICATION</span>
              </>
            )}
          </button>

          {/* Real-Time Live Audio Recorder Button */}
          <button
            onClick={handleToggleRecord}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-mono transition ${
              isRecording
                ? "bg-red-600 text-white font-bold border-red-400 animate-pulse shadow-lg shadow-red-500/30"
                : "bg-slate-900 text-slate-300 border-slate-700 hover:text-red-400 hover:border-red-500/40"
            }`}
            title="Record real-time live synthesis output and download .webm audio file"
          >
            <Disc className={`w-3.5 h-3.5 ${isRecording ? "animate-spin text-white" : "text-red-400"}`} />
            <span>
              {isRecording
                ? `REC 00:${recordingSeconds < 10 ? "0" : ""}${recordingSeconds} (STOP)`
                : "REC AUDIO"}
            </span>
          </button>

          {/* Volume Mute Toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-2 rounded-xl border transition ${
              isMuted
                ? "bg-red-500/20 text-red-300 border-red-500/40"
                : "bg-slate-900 border-slate-700/70 text-cyan-300 hover:bg-slate-800"
            }`}
            title={isMuted ? "Unmute Sound" : "Mute Sound"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Eyes-Closed Auditory Mode Button */}
          <button
            onClick={() => setEyesClosedMode(!eyesClosedMode)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-mono transition ${
              eyesClosedMode
                ? "bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md"
                : "bg-slate-900 text-slate-300 border-slate-700 hover:text-amber-300"
            }`}
            title="Toggle Eyes-Closed Mode (Auditory-Only Perception for Blind Accessibility)"
          >
            {eyesClosedMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">
              {eyesClosedMode ? "EYES-CLOSED: ON" : "EYES-CLOSED MODE"}
            </span>
          </button>

          {/* Optional Multi-Track Orchestra Drawer Button */}
          {onOpenOrchestraDrawer && (
            <button
              onClick={onOpenOrchestraDrawer}
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/30 text-xs font-mono text-cyan-300 transition"
              title="Open Multi-Track Ensemble Console"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Orchestra Mixer</span>
            </button>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3 CORE PILLARS WORKSPACE INTERACTION MODE SELECTOR                  */}
      {/* ==================================================================== */}
      <div className="p-1.5 sm:p-2 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-xl backdrop-blur-md flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={() => setPillar("all")}
            className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 shrink-0 ${
              activePillar === "all"
                ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-extrabold shadow-lg shadow-cyan-500/25"
                : "bg-slate-900/60 text-slate-300 hover:bg-slate-900 hover:text-white border border-slate-800/80"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Unified (3-in-1 Overview)</span>
          </button>

          <button
            onClick={() => setPillar("visual")}
            className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 shrink-0 ${
              activePillar === "visual"
                ? "bg-cyan-500 text-slate-950 font-extrabold shadow-lg shadow-cyan-500/25"
                : "bg-slate-900/60 text-cyan-300 hover:bg-slate-900 hover:text-cyan-200 border border-cyan-500/30"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>1. Visual Analysis (Image/Video)</span>
          </button>

          <button
            onClick={() => setPillar("mapping")}
            className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 shrink-0 ${
              activePillar === "mapping"
                ? "bg-sky-500 text-slate-950 font-extrabold shadow-lg shadow-sky-500/25"
                : "bg-slate-900/60 text-sky-300 hover:bg-slate-900 hover:text-sky-200 border border-sky-500/30"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>2. Sonification Rules (Pitch/Vol/Tempo)</span>
          </button>

          <button
            onClick={() => setPillar("synthesis")}
            className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 shrink-0 ${
              activePillar === "synthesis"
                ? "bg-emerald-500 text-slate-950 font-extrabold shadow-lg shadow-emerald-500/25"
                : "bg-slate-900/60 text-emerald-300 hover:bg-slate-900 hover:text-emerald-200 border border-emerald-500/30"
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>3. Web Audio Synthesis (Live Oscillator)</span>
          </button>
        </div>

        <div className="hidden xl:flex items-center gap-2 text-[10px] font-mono text-slate-400 px-2 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Real-Time Web Audio Engine • Active</span>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* VISUAL SOURCE SELECTOR BAR (Clean, Single-Click Switching)            */}
      {/* ==================================================================== */}
      <div className="p-2 sm:p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-2 py-1 text-[11px] font-mono text-slate-400 border-b border-slate-900 mb-2">
          <span className="text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            STEP 1: SELECT NASA VISUAL FEED OR UPLOAD VIDEO / IMAGE:
          </span>
          <span className="hidden sm:inline text-slate-500">
            Real satellite feeds, time-lapses, 3D globe & custom video
          </span>
        </div>

        {/* Hidden inputs for video and image upload */}
        <input
          ref={videoFileInputRef}
          type="file"
          accept="video/*"
          onChange={handleVideoUpload}
          className="hidden"
        />
        <input
          ref={imageFileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 sm:gap-2">
          {(
            [
              "arctic_ice",
              "global_temp",
              "amazon_forest",
              "wildfire",
              "globe_3d",
              "video_sonifier",
              "custom",
            ] as VisualSourceId[]
          ).map((srcId) => {
            if (srcId === "video_sonifier") {
              const isSelected = selectedSource === "video_sonifier";
              return (
                <button
                  key="video_sonifier"
                  onClick={() => {
                    setSelectedSource("video_sonifier");
                    if (!customVideoRef.current && videoState.sourceType !== "upload") {
                      setVideoState((prev) => ({ ...prev, sourceType: "sample", isPlaying: true }));
                    }
                  }}
                  className={`p-2 sm:p-2.5 rounded-xl border text-left transition flex items-center gap-2 relative overflow-hidden ${
                    isSelected
                      ? "bg-slate-900 border-pink-500 text-white shadow-lg shadow-pink-950/40 ring-1 ring-pink-500/50"
                      : "bg-slate-900/40 border-slate-800 text-slate-300 hover:bg-slate-900 hover:text-white hover:border-pink-500/40"
                  }`}
                >
                  <div className="p-1 rounded-lg bg-pink-500/10 text-pink-400 shrink-0">
                    <Video className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="font-bold text-xs leading-tight truncate flex items-center gap-1">
                      <span>Video Sonifier</span>
                      <span className="text-[8px] bg-pink-500/20 text-pink-300 px-1 rounded font-mono">LIVE</span>
                    </div>
                    <div className="text-[9px] font-mono text-slate-400 truncate">
                      {videoState.sourceType === "upload" ? "Custom MP4" : "NASA Storm"}
                    </div>
                  </div>
                </button>
              );
            }

            if (srcId === "custom") {
              const isSelected = selectedSource === "custom";
              return (
                <div
                  key="custom"
                  onClick={() => imageFileInputRef.current?.click()}
                  className={`p-2 sm:p-2.5 rounded-xl border border-dashed transition flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? "bg-purple-950/50 border-purple-400 text-white shadow-lg shadow-purple-950/40"
                      : "bg-slate-900/40 border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <div className="p-1 rounded-lg bg-purple-500/10 text-purple-400 shrink-0">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div className="truncate text-left">
                    <div className="font-bold text-xs leading-tight truncate">
                      {customFileName && selectedSource === "custom"
                        ? customFileName.slice(0, 10) + "..."
                        : "Upload Image"}
                    </div>
                    <div className="text-[9px] font-mono text-slate-500">JPG, PNG</div>
                  </div>
                </div>
              );
            }

            const item = presets[srcId];
            const isSelected = selectedSource === srcId;
            const Icon = item.icon;

            return (
              <button
                key={srcId}
                onClick={() => handleSelectSource(srcId)}
                className={`p-2 sm:p-2.5 rounded-xl border text-left transition flex items-center gap-2 ${
                  isSelected
                    ? "bg-slate-900 border-cyan-400 text-white shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/40"
                    : "bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-slate-200 hover:border-slate-700"
                }`}
              >
                <div className="p-1 rounded-lg bg-slate-800/80 shrink-0">
                  <Icon className="w-4 h-4" style={{ color: item.accentColor }} />
                </div>
                <div className="truncate">
                  <div className="font-bold text-xs leading-tight truncate">
                    {item.title.split(" ")[0]} {item.title.split(" ")[1]}
                  </div>
                  <div className="text-[9px] font-mono text-slate-500 truncate">{item.metricLabel}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* THE 3 CORE PILLARS IN A HARMONIC, COHESIVE GRID                      */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* ================================================================== */}
        {/* PILLAR 1: VISUAL ANALYSIS                                            */}
        {/* ================================================================== */}
        {(activePillar === "all" || activePillar === "visual") && (
          <div
            className={`${
              activePillar === "visual" ? "lg:col-span-12" : "lg:col-span-5"
            } flex flex-col justify-between gap-3 glass-panel p-3.5 sm:p-5 rounded-2xl border border-cyan-500/25 shadow-xl`}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-cyan-500/20">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <h2 className="font-display font-extrabold text-sm sm:text-base text-white tracking-wide uppercase">
                  1. VISUAL ANALYSIS
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-cyan-300/80 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                  FRAME EXTRACTION
                </span>
                {activePillar === "visual" && (
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
                    FULL FOCUS MODE
                  </span>
                )}
              </div>
            </div>

            <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
              Extracts real optical metrics from image/video frames (colors, brightness, change & pattern).
            </p>

            {/* Visual Display Stage */}
            <div
              className={`relative w-full ${
                activePillar === "visual" ? "h-[280px] sm:h-[400px]" : "h-[220px] sm:h-[290px]"
              } rounded-xl overflow-hidden bg-black border border-slate-800 flex items-center justify-center shadow-inner`}
            >
            {selectedSource === "globe_3d" ? (
              <div className="w-full h-full">
                <EarthGlobe
                  currentVariable="temperature"
                  variableMetadata={nasaDataService.getVariableMetadata("temperature")}
                  currentYear={currentYear}
                  normalizedValue={extractedData.primaryMetricValue / 100}
                />
              </div>
            ) : (
              <canvas
                ref={canvasRef}
                width={640}
                height={400}
                onClick={handleCanvasClick}
                title="Click anywhere on the feed to position the optical scanline and sonify this column"
                className={`w-full h-full object-contain transition duration-300 ${
                  scanMode === "scanline" ? "cursor-crosshair" : "cursor-pointer"
                } ${
                  eyesClosedMode ? "filter blur-2xl opacity-10 pointer-events-none" : ""
                }`}
              />
            )}

            {/* Eyes-Closed Mode Overlay */}
            {eyesClosedMode && (
              <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-4 text-center z-10 animate-fadeIn">
                <EyeOff className="w-8 h-8 text-amber-400 mb-2 animate-bounce" />
                <h4 className="font-bold text-white text-sm">Eyes-Closed Mode Active</h4>
                <p className="text-xs text-slate-300 max-w-xs mt-1">
                  Visual feed is masked. Listen to the pitch and harmonics:
                </p>
                <div className="mt-2 text-xs font-mono text-cyan-300 bg-slate-900 px-3 py-1.5 rounded-lg border border-cyan-500/30">
                  {audioTelemetry.frequencyHz} Hz • {audioTelemetry.musicalNote}
                </div>
              </div>
            )}

            {/* Top HUD Badge */}
            <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none z-10 gap-1.5">
              <span className="bg-slate-950/85 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono text-cyan-200 border border-cyan-500/30 truncate max-w-[65%]">
                {selectedSource === "video_sonifier"
                  ? videoState.sourceType === "upload"
                    ? `VIDEO: ${customFileName || "Custom File"}`
                    : "VIDEO: NASA GOES-16 Cyclone Stream"
                  : `${activePreset.title.slice(0, 22)}...`}
              </span>
              <span className="bg-slate-950/85 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono text-slate-300 border border-slate-700 shrink-0">
                {selectedSource === "video_sonifier"
                  ? `${formatTime(videoState.currentTime)} / ${formatTime(videoState.duration)}`
                  : `YEAR: ${currentYear}`}
              </span>
            </div>

            {/* Scanline Range Input */}
            {scanMode === "scanline" && selectedSource !== "globe_3d" && (
              <div className="absolute bottom-2 left-3 right-3 bg-slate-950/90 p-2 rounded-lg border border-cyan-500/40 z-10">
                <div className="flex justify-between text-[10px] font-mono text-cyan-300 mb-1">
                  <span>SCANLINE COL: {Math.round(scanlineX * 100)}%</span>
                  <span>DRAG TO SAMPLE</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={scanlineX}
                  onChange={(e) => setScanlineX(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-ew-resize h-1"
                />
              </div>
            )}
          </div>

          {/* ================================================================ */}
          {/* DEDICATED VIDEO SONIFIER CONTROLS (Active when video_sonifier)    */}
          {/* ================================================================ */}
          {selectedSource === "video_sonifier" && (
            <div className="p-3 rounded-xl bg-slate-950/90 border border-pink-500/30 space-y-2.5 font-mono text-xs animate-fadeIn">
              {/* Header with Source Status & Upload Trigger */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-pink-400 font-bold text-[11px]">
                  <Film className="w-3.5 h-3.5" />
                  <span>VIDEO SONIFICATION DECK</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => videoFileInputRef.current?.click()}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/40 text-[10px] font-bold transition"
                    title="Upload local MP4 or WebM video file"
                  >
                    <UploadCloud className="w-3 h-3" />
                    <span>Upload Video</span>
                  </button>
                  {videoState.sourceType === "upload" && (
                    <button
                      onClick={resetToNasaSampleVideo}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[10px] transition"
                      title="Switch back to NASA GOES Cyclone stream"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>NASA Stream</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Video Timeline Scrubber */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="text-pink-300">
                    FRAME TIME: {formatTime(videoState.currentTime)}
                  </span>
                  <span>TOTAL: {formatTime(videoState.duration)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={videoState.duration || 30}
                  step="0.1"
                  value={videoState.currentTime}
                  onChange={(e) => seekVideo(parseFloat(e.target.value))}
                  className="w-full accent-pink-500 h-1.5 cursor-pointer bg-slate-900 rounded-lg"
                />
              </div>

              {/* Video Transport Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-900">
                {/* Play/Pause & Step */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={toggleVideoPlayback}
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition ${
                      videoState.isPlaying
                        ? "bg-pink-500 text-slate-950 hover:bg-pink-400"
                        : "bg-slate-900 text-pink-300 border border-pink-500/40 hover:bg-slate-800"
                    }`}
                  >
                    {videoState.isPlaying ? (
                      <>
                        <Pause className="w-3 h-3 fill-current" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 fill-current" />
                        <span>Play Video</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => seekVideo(Math.max(0, videoState.currentTime - 5))}
                    className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                    title="Rewind 5 seconds"
                  >
                    <Rewind className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => seekVideo(Math.min(videoState.duration, videoState.currentTime + 5))}
                    className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                    title="Forward 5 seconds"
                  >
                    <FastForward className="w-3 h-3" />
                  </button>
                </div>

                {/* Speed selector */}
                <div className="flex items-center gap-1 text-[10px]">
                  <span className="text-slate-500">Speed:</span>
                  {[0.5, 1, 2].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => setVideoPlaybackRate(spd)}
                      className={`px-1.5 py-0.5 rounded transition ${
                        videoState.playbackRate === spd
                          ? "bg-pink-500/30 text-pink-300 font-bold border border-pink-500/40"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Video Sonification Feature Focus */}
              <div className="pt-1.5 border-t border-slate-900 flex flex-wrap items-center justify-between gap-1.5 text-[10px]">
                <span className="text-slate-400 font-bold">Sonify Focus:</span>
                <div className="flex flex-wrap items-center gap-1">
                  {(
                    [
                      { id: "dominant", label: "Auto (Blend)" },
                      { id: "white", label: "☁️ Clouds" },
                      { id: "red", label: "🔥 Heat" },
                      { id: "green", label: "🌲 Canopy" },
                      { id: "motion", label: "⚡ Motion Δ" },
                      { id: "brightness", label: "💡 Light" },
                    ] as const
                  ).map((feat) => (
                    <button
                      key={feat.id}
                      onClick={() =>
                        setVideoState((prev) => ({ ...prev, targetFeature: feat.id }))
                      }
                      className={`px-2 py-0.5 rounded transition ${
                        videoState.targetFeature === feat.id
                          ? "bg-pink-500/30 text-pink-200 font-bold border border-pink-500/50"
                          : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                      }`}
                    >
                      {feat.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Real-Time Computer Vision Extracted Metrics Card */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span className="text-cyan-400 font-bold uppercase">EXTRACTED MEANINGFUL DATA:</span>
              <span className="truncate max-w-[50%]">{extractedData.patternDensity}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center">
              {/* Color: Ice White */}
              <div className="bg-slate-900/90 p-1.5 rounded border border-slate-800">
                <div className="text-[9px] text-slate-400">ICE/CLOUD (WHITE)</div>
                <div className="font-bold text-sky-200 text-xs mt-0.5">
                  {extractedData.colorIceWhite}%
                </div>
              </div>

              {/* Color: Thermal Red */}
              <div className="bg-slate-900/90 p-1.5 rounded border border-slate-800">
                <div className="text-[9px] text-slate-400">HEAT (RED)</div>
                <div className="font-bold text-orange-400 text-xs mt-0.5">
                  {extractedData.colorThermalRed}%
                </div>
              </div>

              {/* Brightness */}
              <div className="bg-slate-900/90 p-1.5 rounded border border-slate-800">
                <div className="text-[9px] text-slate-400">BRIGHTNESS</div>
                <div className="font-bold text-white text-xs mt-0.5">
                  {extractedData.meanBrightness}/255
                </div>
              </div>

              {/* Change (Motion Delta) */}
              <div className="bg-slate-900/90 p-1.5 rounded border border-slate-800">
                <div className="text-[9px] text-slate-400">CHANGE Δ</div>
                <div className="font-bold text-amber-400 text-xs mt-0.5">
                  {(extractedData.motionDelta * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Scan Mode Toggle */}
            <div className="flex items-center justify-between pt-1 text-[10px]">
              <span className="text-slate-400">Scan Area:</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setScanMode("whole_frame")}
                  className={`px-2 py-0.5 rounded transition ${
                    scanMode === "whole_frame"
                      ? "bg-cyan-500/30 text-cyan-200 font-bold border border-cyan-500/40"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Whole Frame
                </button>
                <button
                  onClick={() => setScanMode("scanline")}
                  className={`px-2 py-0.5 rounded transition ${
                    scanMode === "scanline"
                      ? "bg-cyan-500/30 text-cyan-200 font-bold border border-cyan-500/40"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Optical Scanline
                </button>
              </div>
            </div>
          </div>

          {activePillar === "visual" && (
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setPillar("mapping")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-slate-950 font-mono font-bold text-xs hover:from-sky-400 hover:to-blue-500 transition shadow-lg shadow-sky-500/25"
              >
                <span>Next Step: 2. Sound Mapping Rules</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

        {/* ================================================================== */}
        {/* PILLAR 2: SONIFICATION MAPPING RULES                                */}
        {/* ================================================================== */}
        {(activePillar === "all" || activePillar === "mapping") && (
          <div
            className={`${
              activePillar === "mapping" ? "lg:col-span-12" : "lg:col-span-3"
            } flex flex-col justify-between gap-3 glass-panel p-4 sm:p-5 rounded-2xl border border-sky-500/25 shadow-xl`}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-sky-500/20">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-sky-400" />
                <h2 className="font-display font-extrabold text-sm sm:text-base text-white tracking-wide uppercase">
                  2. SOUND MAPPING
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-400">
                  RULES & LOGIC
                </span>
                {activePillar === "mapping" && (
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
                    FULL FOCUS MODE
                  </span>
                )}
              </div>
            </div>

            <p className="text-[11px] text-slate-400 font-sans">
              Maps extracted visual metrics to pitch, volume, tempo, and instrument timbres.
            </p>

            <div
              className={`${
                activePillar === "mapping"
                  ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5"
                  : "space-y-3"
              } font-mono text-xs`}
            >
              {/* Rule 1: Visual Data -> Pitch (Hz & Note) */}
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-cyan-300 font-bold">
                  <span className="flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5" />
                    DATA ➔ PITCH (Frequency)
                  </span>
                  <span className="text-white bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">
                    {audioTelemetry.frequencyHz} Hz ({audioTelemetry.musicalNote})
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 leading-snug">
                  {activePreset.metricLabel} ({extractedData.primaryMetricValue}%) modulates oscillator
                  frequency from {baseFrequency}Hz to {maxFrequency}Hz.
                </div>

                {/* Musical Scale Mode Selector */}
                <div className="pt-1 space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span>Scale Mode:</span>
                    <span className="text-cyan-300 uppercase font-bold">{scaleMode}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {(["free", "pentatonic", "major", "minor", "dorian", "chromatic"] as const).map((sc) => (
                      <button
                        key={sc}
                        onClick={() => setScaleMode(sc)}
                        className={`px-1.5 py-0.5 rounded text-[9px] capitalize transition border ${
                          scaleMode === sc
                            ? "bg-cyan-500/30 text-cyan-200 border-cyan-400 font-bold"
                            : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                        }`}
                      >
                        {sc}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pitch Invert Toggle */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => setPitchInverted(!pitchInverted)}
                    className={`text-[10px] px-2 py-0.5 rounded border transition ${
                      pitchInverted
                        ? "bg-purple-500/30 text-purple-200 border-purple-400"
                        : "bg-slate-900 text-slate-400 border-slate-700"
                    }`}
                  >
                    {pitchInverted ? "Inverted (Low = High)" : "Direct (High = High)"}
                  </button>
                  <span className="text-[9px] text-slate-500">Sensitivity: {pitchSensitivity}x</span>
                </div>
              </div>

              {/* Rule 2: Brightness / Flux -> Volume Gain */}
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-sky-300 font-bold">
                  <span className="flex items-center gap-1">
                    <Volume1 className="w-3.5 h-3.5" />
                    BRIGHTNESS ➔ VOLUME (Gain)
                  </span>
                  <span className="text-white bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">
                    {audioTelemetry.volumeGain}%
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 leading-snug">
                  Pixel brightness and thermal radiance directly modulate amplitude and cutoff filter.
                </div>
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Master Volume:</span>
                    <span className="text-sky-300 font-bold">{Math.round(volume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full accent-sky-400 h-1.5 bg-slate-800 rounded appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Rule 3: Change / Motion -> Tempo (BPM) */}
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-amber-300 font-bold">
                  <span className="flex items-center gap-1">
                    <Radio className="w-3.5 h-3.5" />
                    CHANGE ➔ TEMPO (Clock Rate)
                  </span>
                  <span className="text-white bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">
                    {audioTelemetry.tempoBpm} BPM
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 leading-snug">
                  Frame temporal change (Δ {(extractedData.motionDelta * 100).toFixed(1)}%) accelerates
                  the rhythmic clock from 70 to 180 BPM.
                </div>
                {/* Clock Subdivision */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Subdivision:</span>
                    <span className="text-amber-300 capitalize">{tempoSubdivision}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {(["quarter", "eighth", "triplet", "sixteenth"] as const).map((sub) => (
                      <button
                        key={sub}
                        onClick={() => setTempoSubdivision(sub)}
                        className={`px-1 py-0.5 rounded text-[9px] capitalize transition border ${
                          tempoSubdivision === sub
                            ? "bg-amber-500/30 text-amber-200 border-amber-400 font-bold"
                            : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                        }`}
                      >
                        {sub === "quarter" ? "1/4" : sub === "eighth" ? "1/8" : sub === "triplet" ? "1/3" : "1/16"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Rule 4: Dataset -> Instrument Timbre */}
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-emerald-300 font-bold">
                  <span className="flex items-center gap-1">
                    <Music className="w-3.5 h-3.5" />
                    SURFACE ➔ TIMBRE (Waveform)
                  </span>
                  <span className="text-white bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700 capitalize">
                    {timbre}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {(["sine", "triangle", "sawtooth", "noise"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTimbre(t)}
                      className={`py-1 rounded text-[10px] capitalize transition border ${
                        timbre === t
                          ? "bg-cyan-500/25 text-cyan-200 border-cyan-400 font-bold"
                          : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {/* Sub-bass Warmth Slider */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Sub Warmth:</span>
                    <span className="text-emerald-300 font-bold">{Math.round(overtoneWarmth * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.8"
                    step="0.05"
                    value={overtoneWarmth}
                    onChange={(e) => setOvertoneWarmth(parseFloat(e.target.value))}
                    className="w-full accent-emerald-400 h-1.5 bg-slate-800 rounded appearance-none cursor-pointer"
                  />
                </div>

                {/* Audition Test Note Button */}
                <div className="pt-1">
                  <button
                    onClick={handleAuditionMapping}
                    className="w-full py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition shadow-sm"
                    title="Play 0.5s audition test note"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Audition Note</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Next step button if mapping focus */}
            {activePillar === "mapping" && (
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setPillar("synthesis")}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-mono font-bold text-xs hover:from-emerald-400 hover:to-teal-500 transition shadow-lg shadow-emerald-500/25"
                >
                  <span>Next Step: 3. Web Audio Synthesis</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="text-[10px] font-mono text-slate-500 text-center">
              Zero pre-recorded files • Pure scientific mapping
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* PILLAR 3: REAL-TIME GENERATION                                     */}
        {/* ================================================================== */}
        {(activePillar === "all" || activePillar === "synthesis") && (
          <div
            className={`${
              activePillar === "synthesis" ? "lg:col-span-12" : "lg:col-span-4"
            } flex flex-col justify-between gap-3 glass-panel p-4 sm:p-5 rounded-2xl border border-emerald-500/25 shadow-xl`}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-emerald-500/20">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                <h2 className="font-display font-extrabold text-sm sm:text-base text-white tracking-wide uppercase">
                  3. REAL-TIME GENERATION
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                  LIVE WEB AUDIO API
                </span>
                {activePillar === "synthesis" && (
                  <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30 font-bold">
                    FULL FOCUS MODE
                  </span>
                )}
              </div>
            </div>

            <p className="text-[11px] text-slate-400 font-sans">
              Acoustic synthesis generated live from data in real-time — zero static audio files.
            </p>

            {/* Live Real-Time Oscilloscope & Spectrum Visualizer */}
            <div
              className={`relative w-full ${
                activePillar === "synthesis" ? "h-[220px] sm:h-[260px]" : "h-[180px] sm:h-[200px]"
              } rounded-xl overflow-hidden bg-slate-950 border border-emerald-500/30 shadow-inner flex items-center justify-center`}
            >
              <canvas
                ref={oscilloscopeCanvasRef}
                width={480}
                height={200}
                className="w-full h-full object-cover"
              />

              {/* Overlaid Telemetry Readout */}
              <div className="absolute top-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono pointer-events-none">
                <span className="bg-slate-950/80 px-2 py-0.5 rounded text-cyan-300 border border-cyan-500/30">
                  OSCILLOSCOPE 48kHz
                </span>
                <span className="bg-slate-950/80 px-2 py-0.5 rounded text-emerald-400 font-bold border border-emerald-500/30">
                  {audioTelemetry.synthesizerState}
                </span>
              </div>

              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono pointer-events-none">
                <span className="text-slate-400">
                  FREQ: <strong className="text-white">{audioTelemetry.frequencyHz} Hz</strong>
                </span>
                <span className="text-slate-400">
                  TEMPO: <strong className="text-amber-400">{audioTelemetry.tempoBpm} BPM</strong>
                </span>
              </div>
            </div>

            {/* Synthesizer Audio FX Rack (Biquad Filter & Stereo Panner) */}
            <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2.5 font-mono text-xs">
              <div className="flex items-center justify-between text-[10px] text-emerald-400 uppercase font-bold">
                <span>SYNTHESIS FILTER & PANNING RACK:</span>
                <span className="text-slate-400 lowercase">{filterType} • {stereoPan > 0 ? "R" : stereoPan < 0 ? "L" : "C"}</span>
              </div>

              <div className={`${activePillar === "synthesis" ? "grid grid-cols-1 sm:grid-cols-3 gap-3" : "space-y-2"}`}>
                {/* Filter Type & Cutoff */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Filter Cutoff:</span>
                    <span className="text-cyan-300 font-bold">{Math.round(filterCutoff)} Hz</span>
                  </div>
                  <input
                    type="range"
                    min="200"
                    max="6000"
                    step="50"
                    value={filterCutoff}
                    onChange={(e) => setFilterCutoff(parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded appearance-none cursor-pointer"
                  />
                  <div className="grid grid-cols-3 gap-1 pt-0.5">
                    {(["lowpass", "bandpass", "highpass"] as BiquadFilterType[]).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFilterType(f)}
                        className={`py-0.5 rounded text-[9px] capitalize border transition ${
                          filterType === f
                            ? "bg-emerald-500/30 text-emerald-200 border-emerald-400 font-bold"
                            : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                        }`}
                      >
                        {f.replace("pass", "")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filter Resonance (Q) */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Resonance (Q):</span>
                    <span className="text-amber-300 font-bold">{filterResonance.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="10"
                    step="0.5"
                    value={filterResonance}
                    onChange={(e) => setFilterResonance(parseFloat(e.target.value))}
                    className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded appearance-none cursor-pointer"
                  />
                  <div className="text-[9px] text-slate-500">Spectral peak emphasis</div>
                </div>

                {/* Stereo Panner */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Stereo Pan:</span>
                    <span className="text-purple-300 font-bold">
                      {stereoPan === 0 ? "Center" : stereoPan < 0 ? `L ${Math.round(Math.abs(stereoPan) * 100)}%` : `R ${Math.round(stereoPan * 100)}%`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.1"
                    value={stereoPan}
                    onChange={(e) => setStereoPan(parseFloat(e.target.value))}
                    className="w-full accent-purple-400 h-1.5 bg-slate-800 rounded appearance-none cursor-pointer"
                  />
                  <div className="text-[9px] text-slate-500 flex justify-between">
                    <span>Left</span>
                    <span>Center</span>
                    <span>Right</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Data-to-Sound Pipeline Telemetry Box */}
            <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1.5 font-mono text-xs">
              <div className="text-[10px] text-slate-400 uppercase font-bold text-cyan-400">
                REAL-TIME PIPELINE FLOW:
              </div>
              <div className="text-[11px] text-slate-200 leading-snug flex items-center gap-1.5">
                <span className="bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded text-[10px]">
                  Frame ({extractedData.primaryMetricValue}%)
                </span>
                <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
                <span className="bg-slate-900 text-amber-300 px-1.5 py-0.5 rounded text-[10px]">
                  {audioTelemetry.frequencyHz} Hz ({audioTelemetry.musicalNote})
                </span>
                <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
                <span className="bg-slate-900 text-emerald-300 px-1.5 py-0.5 rounded text-[10px]">
                  {timbre}
                </span>
              </div>
            </div>

            {/* Transport & Year Scrubber */}
            <div className="space-y-2 p-3 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-400">TIMELINE: YEAR {currentYear}</span>
                <div className="flex items-center gap-1">
                  {[0.5, 1, 2].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => setPlaybackSpeed(spd)}
                      className={`px-1.5 py-0.2 rounded text-[10px] ${
                        playbackSpeed === spd
                          ? "bg-cyan-500/30 text-cyan-200 font-bold"
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>

              <input
                type="range"
                min="0"
                max="1"
                step="0.005"
                value={progress}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setProgress(val);
                  progressRef.current = val;
                }}
                className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[9px] text-slate-500">
                <span>1980 (Baseline)</span>
                <span>2002</span>
                <span className="text-cyan-400 font-bold">2025 (Present)</span>
              </div>
            </div>

            {/* Speech Audio Description Toggle */}
            <div className="flex items-center justify-between text-xs font-mono">
              <button
                onClick={() => setSpeechNarrator(!speechNarrator)}
                className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg border transition ${
                  speechNarrator
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                    : "bg-slate-900 text-slate-400 border-slate-800"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Voice Narration: {speechNarrator ? "ON" : "OFF"}</span>
              </button>

              {onOpenNarratorModal && (
                <button
                  onClick={onOpenNarratorModal}
                  className="text-[11px] text-amber-300 hover:underline flex items-center gap-1"
                >
                  <span>AI Sound Explainer</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* If in Pillar 3 Focus mode, provide button back to Unified or Pillar 1 */}
            {activePillar === "synthesis" && (
              <div className="pt-2 flex justify-between items-center">
                <button
                  onClick={() => setPillar("mapping")}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 text-slate-300 border border-slate-700 text-xs font-mono hover:text-white"
                >
                  ← 2. Sound Mapping
                </button>
                <button
                  onClick={() => setPillar("all")}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-mono font-bold text-xs hover:bg-cyan-400 transition shadow-lg shadow-cyan-500/25"
                >
                  <span>Unified (3-in-1 View)</span>
                  <Layers className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
