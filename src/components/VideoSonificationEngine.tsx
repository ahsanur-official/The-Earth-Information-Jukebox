import React, { useState, useRef, useEffect, useCallback } from "react";
import * as Tone from "tone";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Upload,
  RotateCcw,
  Sliders,
  Eye,
  Radio,
  Sparkles,
  Info,
  Maximize2,
  Activity,
  Layers,
  Music,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileVideo,
} from "lucide-react";

// Curated Earth Video Presets
interface EarthVideoPreset {
  id: string;
  name: string;
  category: string;
  description: string;
  sourceNote: string;
  accentColor: string;
  synthMood: string;
}

const PRESET_VIDEOS: EarthVideoPreset[] = [
  {
    id: "goes_cyclone",
    name: "NASA GOES-16 Hurricane Vortex",
    category: "Atmosphere",
    description: "Geostationary infrared & visible storm spirals tracking eyewall convection and wind velocity.",
    sourceNote: "NASA / NOAA GOES-East ABI Geostationary Stream",
    accentColor: "#38bdf8",
    synthMood: "Swirling barometric drones & dynamic wind flutter",
  },
  {
    id: "arctic_ice",
    name: "Arctic Sea Ice & Albedo Shift",
    category: "Cryosphere",
    description: "Decadal polar sea ice contraction revealing deep dark ocean waters beneath bright reflective ice.",
    sourceNote: "NASA Cryospheric Sciences / MODIS Ice Extent",
    accentColor: "#a5f3fc",
    synthMood: "Crystalline high-resonance tones & glacial chime sweeps",
  },
  {
    id: "amazon_canopy",
    name: "Amazon Rainforest Phenology",
    category: "Biosphere",
    description: "Seasonal greenness canopy cycles and frontier biomass variation across the Amazon river basin.",
    sourceNote: "Terra & Aqua MODIS Normalized Difference Vegetation (NDVI)",
    accentColor: "#4ade80",
    synthMood: "Warm harmonic pads & organic mid-range respiration",
  },
  {
    id: "wildfire_thermal",
    name: "Thermal Wildfire & Smoke Propagation",
    category: "Thermal Infrared",
    description: "Rapid high-temperature thermal anomalies emitting intense mid-infrared radiances.",
    sourceNote: "Suomi NPP / VIIRS 375m Active Fire Detection",
    accentColor: "#fb923c",
    synthMood: "Ascending acute frequencies & thermal crackle rhythms",
  },
  {
    id: "ocean_temperature",
    name: "Pacific Sea Surface Thermal Waves",
    category: "Hydrosphere",
    description: "Equatorial Kelvin wave propagation and thermal anomalies driving global teleconnections.",
    sourceNote: "NASA JPL Multi-scale Ultra-high Resolution (MUR) SST",
    accentColor: "#818cf8",
    synthMood: "Deep subterranean sub-bass with gentle oceanic swell",
  },
];

// Scale definition for musical mapping
const MUSICAL_SCALES = {
  pentatonic_minor: {
    name: "Atmospheric Minor (A Pentatonic)",
    notes: [110, 130.81, 146.83, 164.81, 196.0, 220.0, 261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0],
  },
  lydian_ambient: {
    name: "Cosmic Lydian (Bright & Open)",
    notes: [130.81, 146.83, 164.81, 185.0, 196.0, 220.0, 246.94, 261.63, 293.66, 329.63, 369.99, 392.0, 440.0, 493.88, 523.25, 587.33],
  },
  dorian_deep: {
    name: "Oceanic Dorian (Mysterious Depth)",
    notes: [98.0, 110.0, 123.47, 130.81, 146.83, 164.81, 174.61, 196.0, 220.0, 246.94, 261.63, 293.66, 329.63, 349.23, 392.0, 440.0],
  },
  pure_hz: {
    name: "Scientific Continuous (Direct Hz Spectrum)",
    notes: [], // Continuous interpolation
  },
};

type ScaleKey = keyof typeof MUSICAL_SCALES;
type VisualOverlay = "raw" | "heatmap" | "grayscale" | "scanline";
export type SynthWaveType = "sawtooth" | "sine" | "triangle" | "square";

export const VideoSonificationEngine: React.FC = () => {
  // 1. Video & Playback State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.75);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(18);
  const [currentPreset, setCurrentPreset] = useState<string>("goes_cyclone");
  const [customVideoName, setCustomVideoName] = useState<string | null>(null);
  const [customVideoUrl, setCustomVideoUrl] = useState<string | null>(null);

  // 2. Optical Analysis State
  const [luminosity, setLuminosity] = useState<number>(0.45); // 0 to 1
  const [colorRatios, setColorRatios] = useState<{ r: number; g: number; b: number; albedo: number }>({
    r: 0.3,
    g: 0.35,
    b: 0.35,
    albedo: 0.4,
  });
  const [motionDelta, setMotionDelta] = useState<number>(0.05); // 0 to 1
  const [scanlineX, setScanlineX] = useState<number>(0.5); // 0 to 1
  const [visualOverlay, setVisualOverlay] = useState<VisualOverlay>("scanline");
  const [scanModeAuto, setScanModeAuto] = useState<boolean>(true);

  // 3. Audio & Mapping Controls
  const [selectedScale, setSelectedScale] = useState<ScaleKey>("pentatonic_minor");
  const [synthWaveform, setSynthWaveform] = useState<SynthWaveType>("sawtooth");
  const [reverbAmount, setReverbAmount] = useState<number>(0.3);
  const [currentNoteName, setCurrentNoteName] = useState<string>("A3 (220 Hz)");
  const [filterCutoffDisplay, setFilterCutoffDisplay] = useState<number>(1200);
  const [toneEngineReady, setToneEngineReady] = useState<boolean>(false);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

  // DOM & Node References
  const hiddenVideoRef = useRef<HTMLVideoElement | null>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioVisualizerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const prevFrameDataRef = useRef<Uint8ClampedArray | null>(null);

  // Tone.js Node References
  const toneNodesRef = useRef<{
    mainOsc: Tone.FatOscillator | null;
    subOsc: Tone.Oscillator | null;
    filter: Tone.Filter | null;
    panner: Tone.Panner | null;
    noise: Tone.Noise | null;
    noiseFilter: Tone.Filter | null;
    noiseGain: Tone.Gain | null;
    reverb: Tone.Reverb | null;
    limiter: Tone.Limiter | null;
    masterGain: Tone.Gain | null;
    analyser: Tone.Analyser | null;
  }>({
    mainOsc: null,
    subOsc: null,
    filter: null,
    panner: null,
    noise: null,
    noiseFilter: null,
    noiseGain: null,
    reverb: null,
    limiter: null,
    masterGain: null,
    analyser: null,
  });

  // ==========================================================================
  // INITIALIZE TONE.JS SOUND ENGINE
  // ==========================================================================
  const initToneEngine = useCallback(async () => {
    if (toneNodesRef.current.mainOsc) return;

    try {
      await Tone.start();

      // Master Output Chain
      const limiter = new Tone.Limiter(-1).toDestination();
      const masterGain = new Tone.Gain(isMuted ? 0 : volume).connect(limiter);

      // Audio Analyser for live oscilloscope & FFT
      const analyser = new Tone.Analyser("waveform", 128);
      masterGain.connect(analyser);

      // Reverb Send
      const reverb = new Tone.Reverb({ decay: 2.8, preDelay: 0.04, wet: reverbAmount });
      await reverb.generate();
      reverb.connect(masterGain);

      // Stereo Panner
      const panner = new Tone.Panner(0).connect(masterGain);
      panner.connect(reverb);

      // Lowpass / Bandpass Modulated Filter
      const filter = new Tone.Filter({
        frequency: 1200,
        type: "lowpass",
        rolloff: -24,
        Q: 2.5,
      }).connect(panner);

      // Primary Tone.js Fat Oscillator (generates rich unison voices)
      const mainOsc = new Tone.FatOscillator({
        frequency: 220,
        type: synthWaveform as "sawtooth" | "sine" | "triangle" | "square",
        spread: 18,
        count: 3,
      }).connect(filter);

      // Sub Oscillator (deep octave support)
      const subOsc = new Tone.Oscillator({
        frequency: 110,
        type: "sine",
      });
      const subGain = new Tone.Gain(0.35).connect(panner);
      subOsc.connect(subGain);

      // Atmospheric Noise Generator (organic environmental texture)
      const noise = new Tone.Noise("pink");
      const noiseFilter = new Tone.Filter(800, "bandpass", -12);
      const noiseGain = new Tone.Gain(0.04);
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(masterGain);

      // Start oscillators
      mainOsc.start();
      subOsc.start();
      noise.start();

      toneNodesRef.current = {
        mainOsc,
        subOsc,
        filter,
        panner,
        noise,
        noiseFilter,
        noiseGain,
        reverb,
        limiter,
        masterGain,
        analyser,
      };

      setToneEngineReady(true);
    } catch (err) {
      console.error("Tone.js initialization error:", err);
    }
  }, [isMuted, volume, reverbAmount, synthWaveform]);

  // Clean shutdown of Tone.js on unmount
  useEffect(() => {
    return () => {
      const nodes = toneNodesRef.current;
      if (nodes.mainOsc) {
        try {
          nodes.mainOsc.stop();
          nodes.mainOsc.dispose();
          nodes.subOsc?.stop();
          nodes.subOsc?.dispose();
          nodes.noise?.stop();
          nodes.noise?.dispose();
          nodes.filter?.dispose();
          nodes.panner?.dispose();
          nodes.reverb?.dispose();
          nodes.masterGain?.dispose();
          nodes.limiter?.dispose();
        } catch {}
      }
    };
  }, []);

  // Update Master Volume & Mute in Tone.js
  useEffect(() => {
    const { masterGain } = toneNodesRef.current;
    if (masterGain) {
      const targetGain = !isPlaying || isMuted ? 0.00001 : volume;
      masterGain.gain.rampTo(targetGain, 0.05);
    }
  }, [isPlaying, isMuted, volume]);

  // Update Waveform
  useEffect(() => {
    const { mainOsc } = toneNodesRef.current;
    if (mainOsc) {
      try {
        mainOsc.type = synthWaveform;
      } catch {}
    }
  }, [synthWaveform]);

  // ==========================================================================
  // FRAME-BY-FRAME COMPUTER VISION ANALYSIS & TONE.JS MAPPING
  // ==========================================================================
  const mapValueToScaleFrequency = (normVal: number, scaleKey: ScaleKey): { freq: number; noteName: string } => {
    if (scaleKey === "pure_hz") {
      // Continuous scientific range: 65 Hz to 980 Hz
      const hz = Math.round(65 + Math.pow(normVal, 1.4) * 915);
      return { freq: hz, noteName: `${hz} Hz` };
    }

    const scale = MUSICAL_SCALES[scaleKey].notes;
    const index = Math.min(scale.length - 1, Math.max(0, Math.floor(normVal * scale.length)));
    const freq = scale[index];

    // Convert frequency to nearest standard musical note label
    const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const midi = Math.round(69 + 12 * Math.log2(freq / 440));
    const octave = Math.floor(midi / 12) - 1;
    const name = noteNames[midi % 12];
    return { freq, noteName: `${name}${octave} (${Math.round(freq)} Hz)` };
  };

  const processFrame = useCallback(() => {
    const video = hiddenVideoRef.current;
    const canvas = displayCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // A. Render either custom video or high-fidelity synthesized Earth feed
    let frameRendered = false;
    if (video && video.readyState >= 2 && !video.paused && customVideoUrl) {
      ctx.drawImage(video, 0, 0, w, h);
      frameRendered = true;
      setCurrentTime(video.currentTime);
      if (!isNaN(video.duration) && video.duration > 0) {
        setDuration(video.duration);
      }
    }

    if (!frameRendered) {
      // Synthetic curated NASA Earth Visualization Frame generator
      const t = Date.now() * 0.001 * playbackSpeed;
      const bgGrad = ctx.createLinearGradient(0, 0, w, h);

      if (currentPreset === "goes_cyclone") {
        bgGrad.addColorStop(0, "#081b29");
        bgGrad.addColorStop(1, "#030a13");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Eyewall & Spiral Bands
        const cx = w * 0.52;
        const cy = h * 0.48;
        for (let i = 0; i < 7; i++) {
          const angle = t * 0.8 + (i * Math.PI) / 3.5;
          const r = 40 + i * 22;
          ctx.beginPath();
          ctx.arc(cx + Math.cos(angle) * (r * 0.3), cy + Math.sin(angle) * (r * 0.3), r, angle, angle + Math.PI * 1.3);
          ctx.strokeStyle = `rgba(224, 242, 254, ${0.45 - i * 0.05})`;
          ctx.lineWidth = 14 + i * 3;
          ctx.stroke();
        }
      } else if (currentPreset === "arctic_ice") {
        bgGrad.addColorStop(0, "#021226");
        bgGrad.addColorStop(1, "#082f49");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Ice sheet contour
        const iceCoverage = 0.5 + Math.sin(t * 0.4) * 0.25;
        ctx.fillStyle = `rgba(240, 249, 255, ${0.75 + iceCoverage * 0.2})`;
        ctx.beginPath();
        ctx.ellipse(w * 0.5, h * 0.45, w * 0.38 * iceCoverage, h * 0.32 * iceCoverage, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (currentPreset === "amazon_canopy") {
        bgGrad.addColorStop(0, "#022c22");
        bgGrad.addColorStop(1, "#064e3b");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Biomass pulses
        const pulse = Math.sin(t * 0.6) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(74, 222, 128, ${0.4 + pulse * 0.3})`;
        ctx.beginPath();
        ctx.arc(w * 0.45, h * 0.5, 110 + pulse * 30, 0, Math.PI * 2);
        ctx.fill();
      } else if (currentPreset === "wildfire_thermal") {
        bgGrad.addColorStop(0, "#1f0904");
        bgGrad.addColorStop(1, "#431407");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Thermal Hotspots
        const flare = Math.sin(t * 2.2) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(249, 115, 22, ${0.6 + flare * 0.35})`;
        ctx.beginPath();
        ctx.arc(w * 0.55, h * 0.52, 60 + flare * 40, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fef08a";
        ctx.beginPath();
        ctx.arc(w * 0.55, h * 0.52, 20 + flare * 10, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Ocean SST
        bgGrad.addColorStop(0, "#0b122b");
        bgGrad.addColorStop(1, "#1e1b4b");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Kelvin Waves
        for (let i = 0; i < 5; i++) {
          const waveX = (w * 0.2 + (t * 40 + i * 80)) % w;
          ctx.fillStyle = `rgba(129, 140, 248, ${0.35 - i * 0.05})`;
          ctx.beginPath();
          ctx.ellipse(waveX, h * 0.5, 55, 30, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (isPlaying) {
        setCurrentTime((prev) => (prev + 0.033 * playbackSpeed) % duration);
      }
    }

    // B. Extract Pixel Data & Compute Luminosity / Color Distribution
    let imgData: ImageData;
    try {
      imgData = ctx.getImageData(0, 0, w, h);
    } catch {
      return;
    }

    const data = imgData.data;
    const totalPixels = data.length / 4;
    const step = 4; // Sample every 4th pixel for high performance

    let sumLum = 0;
    let sumR = 0;
    let sumG = 0;
    let sumB = 0;
    let whitePixelCount = 0;
    let motionDiff = 0;

    const prevData = prevFrameDataRef.current;
    const hasPrev = prevData && prevData.length === data.length;

    // Scanline target X column
    let activeScanX = scanlineX;
    if (scanModeAuto && isPlaying) {
      activeScanX = (scanlineX + 0.003 * playbackSpeed) % 1;
      setScanlineX(activeScanX);
    }
    const targetColX = Math.floor(activeScanX * w);

    let scanColLumSum = 0;
    let scanColCount = 0;

    for (let i = 0; i < data.length; i += 4 * step) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Photometric Luminance (Rec. 709)
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      sumLum += lum;
      sumR += r;
      sumG += g;
      sumB += b;

      // High Albedo / Reflective Ice/Cloud
      if (r > 190 && g > 190 && b > 190) {
        whitePixelCount++;
      }

      // Motion Delta calculation
      if (hasPrev) {
        const pR = prevData[i];
        const pG = prevData[i + 1];
        const pB = prevData[i + 2];
        motionDiff += Math.abs(r - pR) + Math.abs(g - pG) + Math.abs(b - pB);
      }

      // Check if pixel is within active scanline column band (+/- 3px)
      const pxIndex = i / 4;
      const pxX = pxIndex % w;
      if (Math.abs(pxX - targetColX) <= 3) {
        scanColLumSum += lum;
        scanColCount++;
      }
    }

    // Save previous frame for motion delta
    if (!prevFrameDataRef.current || prevFrameDataRef.current.length !== data.length) {
      prevFrameDataRef.current = new Uint8ClampedArray(data);
    } else {
      prevFrameDataRef.current.set(data);
    }

    const sampledCount = totalPixels / step;
    const meanLuminanceNorm = Math.min(1, Math.max(0, sumLum / (sampledCount * 255)));
    const scanlineLuminanceNorm = scanColCount > 0 ? scanColLumSum / (scanColCount * 255) : meanLuminanceNorm;

    const totalRGB = sumR + sumG + sumB || 1;
    const rRatio = sumR / totalRGB;
    const gRatio = sumG / totalRGB;
    const bRatio = sumB / totalRGB;
    const albedoRatio = whitePixelCount / sampledCount;
    const calculatedMotion = hasPrev ? Math.min(1, motionDiff / (sampledCount * 255 * 3) * 12) : 0.04;

    setLuminosity(meanLuminanceNorm);
    setColorRatios({ r: rRatio, g: gRatio, b: bRatio, albedo: albedoRatio });
    setMotionDelta(calculatedMotion);

    // C. Apply Visual Overlay Modes to Canvas
    if (visualOverlay === "grayscale") {
      const overlayData = ctx.getImageData(0, 0, w, h);
      const d = overlayData.data;
      for (let j = 0; j < d.length; j += 4) {
        const gray = 0.2126 * d[j] + 0.7152 * d[j + 1] + 0.0722 * d[j + 2];
        d[j] = gray;
        d[j + 1] = gray;
        d[j + 2] = gray;
      }
      ctx.putImageData(overlayData, 0, 0);
    } else if (visualOverlay === "heatmap") {
      const overlayData = ctx.getImageData(0, 0, w, h);
      const d = overlayData.data;
      for (let j = 0; j < d.length; j += 4) {
        const l = (0.2126 * d[j] + 0.7152 * d[j + 1] + 0.0722 * d[j + 2]) / 255;
        // Thermal gradient: dark blue -> cyan -> yellow -> red -> white
        if (l < 0.25) {
          d[j] = 0;
          d[j + 1] = Math.floor(l * 4 * 180);
          d[j + 2] = Math.floor(120 + l * 4 * 135);
        } else if (l < 0.5) {
          d[j] = Math.floor((l - 0.25) * 4 * 255);
          d[j + 1] = 220;
          d[j + 2] = 255 - Math.floor((l - 0.25) * 4 * 255);
        } else if (l < 0.75) {
          d[j] = 255;
          d[j + 1] = 255 - Math.floor((l - 0.5) * 4 * 140);
          d[j + 2] = 0;
        } else {
          d[j] = 255;
          d[j + 1] = 115 + Math.floor((l - 0.75) * 4 * 140);
          d[j + 2] = Math.floor((l - 0.75) * 4 * 255);
        }
      }
      ctx.putImageData(overlayData, 0, 0);
    }

    // Always draw scanline laser overlay if enabled
    if (visualOverlay === "scanline" || visualOverlay === "raw") {
      ctx.beginPath();
      ctx.moveTo(targetColX, 0);
      ctx.lineTo(targetColX, h);
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2.5;
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Scan indicator pin
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.arc(targetColX, 12, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // D. Real-Time Mapping to Tone.js Audio Oscillators
    const { mainOsc, subOsc, filter, panner, noiseGain, noiseFilter } = toneNodesRef.current;

    if (mainOsc && isPlaying) {
      // 1. Value selection: Use scanline column luminance when in scanline mode for rich horizontal sweeps
      const targetVal = visualOverlay === "scanline" ? scanlineLuminanceNorm : meanLuminanceNorm;
      const { freq, noteName } = mapValueToScaleFrequency(targetVal, selectedScale);

      // Smoothly ramp oscillator frequency to eliminate clicking
      mainOsc.frequency.rampTo(freq, 0.06);
      if (subOsc) {
        subOsc.frequency.rampTo(freq / 2, 0.06);
      }
      setCurrentNoteName(noteName);

      // 2. Filter Cutoff mapping (modulated by Luminosity + Color balance)
      if (filter) {
        const baseCutoff = 350;
        const colorBrightnessBoost = rRatio * 2200 + albedoRatio * 1800;
        const cutoffHz = Math.min(6500, Math.max(200, baseCutoff + meanLuminanceNorm * 2800 + colorBrightnessBoost));
        filter.frequency.rampTo(cutoffHz, 0.08);
        setFilterCutoffDisplay(Math.round(cutoffHz));
      }

      // 3. Stereo Panner mapped to scanline position (-1 full left, +1 full right)
      if (panner) {
        const panValue = (activeScanX - 0.5) * 1.8;
        panner.pan.rampTo(Math.max(-1, Math.min(1, panValue)), 0.05);
      }

      // 4. Atmospheric Noise Texture (driven by Motion Delta & Environmental Fire/Wind)
      if (noiseGain && noiseFilter) {
        const noiseTarget = Math.min(0.25, calculatedMotion * 0.35 + (1 - gRatio) * 0.05);
        noiseGain.gain.rampTo(noiseTarget, 0.1);
        noiseFilter.frequency.rampTo(600 + calculatedMotion * 1800, 0.1);
      }
    }
  }, [
    isPlaying,
    playbackSpeed,
    customVideoUrl,
    currentPreset,
    duration,
    visualOverlay,
    scanModeAuto,
    scanlineX,
    selectedScale,
  ]);

  // Animation Frame Loop
  useEffect(() => {
    const loop = () => {
      processFrame();
      animFrameIdRef.current = requestAnimationFrame(loop);
    };
    animFrameIdRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [processFrame]);

  // Live Audio Waveform & FFT Visualizer on bottom canvas
  useEffect(() => {
    let visualizerId: number;
    const drawWaveform = () => {
      const canvas = audioVisualizerCanvasRef.current;
      const analyser = toneNodesRef.current.analyser;
      if (canvas && analyser) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          const values = analyser.getValue(); // Float32Array between -1 and 1

          ctx.clearRect(0, 0, w, h);

          // Subtle background grid
          ctx.strokeStyle = "rgba(14, 165, 233, 0.12)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, h / 2);
          ctx.lineTo(w, h / 2);
          ctx.stroke();

          // Draw neon waveform path
          ctx.beginPath();
          ctx.strokeStyle = isPlaying ? "#38bdf8" : "#475569";
          ctx.lineWidth = 2;
          ctx.shadowColor = isPlaying ? "#38bdf8" : "transparent";
          ctx.shadowBlur = 6;

          const sliceWidth = w / (values.length - 1);
          for (let i = 0; i < values.length; i++) {
            const v = values[i] as number;
            const y = (0.5 + v * 0.45) * h;
            if (i === 0) ctx.moveTo(0, y);
            else ctx.lineTo(i * sliceWidth, y);
          }
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }
      visualizerId = requestAnimationFrame(drawWaveform);
    };

    visualizerId = requestAnimationFrame(drawWaveform);
    return () => cancelAnimationFrame(visualizerId);
  }, [isPlaying]);

  // ==========================================================================
  // PLAYBACK & USER INTERACTION HANDLERS
  // ==========================================================================
  const handleTogglePlay = async () => {
    await initToneEngine();

    const video = hiddenVideoRef.current;
    const nextPlay = !isPlaying;

    if (nextPlay) {
      if (video && customVideoUrl) {
        video.play().catch(() => {});
      }
    } else {
      if (video) {
        video.pause();
      }
    }

    setIsPlaying(nextPlay);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = parseFloat(e.target.value);
    setCurrentTime(target);
    const video = hiddenVideoRef.current;
    if (video) {
      video.currentTime = target;
    }
  };

  const handleFileUpload = (file: File) => {
    if (!file || !file.type.startsWith("video/")) {
      alert("Please select a valid video file (MP4, WebM, QuickTime).");
      return;
    }

    if (customVideoUrl) {
      URL.revokeObjectURL(customVideoUrl);
    }

    const url = URL.createObjectURL(file);
    setCustomVideoUrl(url);
    setCustomVideoName(file.name);

    const video = hiddenVideoRef.current;
    if (video) {
      video.src = url;
      video.load();
      video.onloadedmetadata = () => {
        setDuration(video.duration || 20);
        video.playbackRate = playbackSpeed;
        video.loop = isLooping;
      };
    }

    initToneEngine();
    setIsPlaying(true);
    if (video) {
      video.play().catch(() => {});
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = displayCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / rect.width;
    const clamped = Math.max(0, Math.min(1, clickX));
    setScanlineX(clamped);
    setScanModeAuto(false); // Switch to manual pin position on user click
    if (!isPlaying) {
      handleTogglePlay();
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const activePresetData = PRESET_VIDEOS.find((p) => p.id === currentPreset) || PRESET_VIDEOS[0];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 text-slate-200">
      {/* Hidden HTML5 Video Element for Frame Extraction */}
      <video
        ref={hiddenVideoRef}
        playsInline
        muted
        crossOrigin="anonymous"
        className="hidden"
        onEnded={() => {
          if (!isLooping) setIsPlaying(false);
        }}
      />

      {/* Hidden File Picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/ogg"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
          }
        }}
      />

      {/* Top Banner: Video Sonification Overview */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-cyan-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-inner shrink-0">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-display font-extrabold text-white tracking-wide">
                Video-to-Sound Translation Engine
              </h2>
              <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-mono px-2 py-0.5 rounded font-bold border border-cyan-500/30">
                TONE.JS POWERED
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Upload your own video or explore curated satellite feeds to hear frame-by-frame luminosity, color bands, and optical motion sonified in real time.
            </p>
          </div>
        </div>

        {/* Upload Trigger Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs font-mono transition shadow-lg shadow-cyan-950/40 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Video File</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Video Stage & Live Sonification Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left / Center Column: Video Stage & Transport (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Video Display Canvas Stage */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingOver(true);
            }}
            onDragLeave={() => setIsDraggingOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingOver(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileUpload(e.dataTransfer.files[0]);
              }
            }}
            className={`relative rounded-2xl overflow-hidden border bg-slate-950 shadow-2xl transition group aspect-video flex items-center justify-center ${
              isDraggingOver
                ? "border-cyan-400 ring-2 ring-cyan-400/50 bg-cyan-950/20"
                : "border-slate-800 hover:border-cyan-500/40"
            }`}
          >
            <canvas
              ref={displayCanvasRef}
              width={640}
              height={360}
              onClick={handleCanvasClick}
              title="Click anywhere on the video frame to sonify that exact optical column"
              className="w-full h-full object-contain cursor-crosshair"
            />

            {/* Top HUD Status Bar */}
            <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10 text-[10px] font-mono">
              <div className="flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-md border border-cyan-500/30 text-cyan-200">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span className="truncate max-w-[200px] sm:max-w-[280px]">
                  {customVideoName ? `FILE: ${customVideoName}` : activePresetData.name}
                </span>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-md border border-slate-700 text-slate-300">
                <ClockIcon className="w-3 h-3 text-cyan-400" />
                <span>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
            </div>

            {/* Overlay Notice for Drag-and-Drop */}
            {isDraggingOver && (
              <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-cyan-300 pointer-events-none">
                <Upload className="w-10 h-10 animate-bounce mb-2" />
                <span className="font-mono font-bold text-sm">Drop video file here to load</span>
              </div>
            )}
          </div>

          {/* Video Scrubbing Bar */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <span className="text-cyan-400 font-bold">{formatTime(currentTime)}</span>
                <span>/</span>
                <span>{formatTime(duration)}</span>
              </div>
              <span className="text-slate-500">Scrub timeline to translate any frame</span>
            </div>

            <input
              type="range"
              min={0}
              max={duration || 20}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Primary Transport Controls */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            {/* Play/Pause & Reset */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleTogglePlay}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold font-mono text-xs transition shadow-lg cursor-pointer ${
                  isPlaying
                    ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20"
                    : "bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20"
                }`}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                <span>{isPlaying ? "Pause Translation" : "Start Translation"}</span>
              </button>

              <button
                onClick={() => {
                  setCurrentTime(0);
                  const v = hiddenVideoRef.current;
                  if (v) v.currentTime = 0;
                }}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition cursor-pointer"
                title="Rewind to start"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Playback Speed Selectors */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-[11px] font-mono">
              {[0.5, 1.0, 1.5, 2.0].map((rate) => (
                <button
                  key={rate}
                  onClick={() => {
                    setPlaybackSpeed(rate);
                    const v = hiddenVideoRef.current;
                    if (v) v.playbackRate = rate;
                  }}
                  className={`px-2 py-1 rounded transition cursor-pointer ${
                    playbackSpeed === rate
                      ? "bg-cyan-500 text-slate-950 font-bold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>

            {/* Master Volume Slider & Mute */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 text-slate-400 hover:text-white transition cursor-pointer"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setVolume(val);
                  if (isMuted && val > 0) setIsMuted(false);
                }}
                className="w-20 sm:w-24 accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Visual Analysis View Mode Toggles */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="text-[11px] font-mono text-slate-400 uppercase font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span>Optical Inspection Mode</span>
              </span>
              <span className="text-[10px] text-slate-500 lowercase">switches frame rendering filter</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs font-mono">
              {[
                { id: "scanline", label: "Scanline Laser", desc: "Moving optical tracker" },
                { id: "raw", label: "RGB Frame", desc: "Natural color stream" },
                { id: "heatmap", label: "Thermal Heatmap", desc: "Radiance false-color" },
                { id: "grayscale", label: "Luminosity Map", desc: "Pure optical density" },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setVisualOverlay(m.id as VisualOverlay)}
                  className={`p-2 rounded-lg border text-left transition cursor-pointer ${
                    visualOverlay === m.id
                      ? "bg-cyan-950/60 border-cyan-400 text-cyan-200"
                      : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white"
                  }`}
                >
                  <div className="font-bold text-[11px]">{m.label}</div>
                  <div className="text-[9px] text-slate-500 truncate">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Tone.js Synthesizer Matrix & Metrics (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Live Tone.js Audio Output & Oscilloscope */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/30 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-cyan-400" />
                <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                  Tone.js Sound Output
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-300 font-bold">
                {currentNoteName}
              </span>
            </div>

            {/* Live Audio Oscilloscope Canvas */}
            <div className="w-full h-16 rounded-xl bg-slate-900/80 border border-slate-800 overflow-hidden relative">
              <canvas
                ref={audioVisualizerCanvasRef}
                width={360}
                height={64}
                className="w-full h-full"
              />
              <div className="absolute bottom-1 right-2 text-[9px] font-mono text-slate-500">
                {isPlaying ? "LIVE OSCILLOSCOPE" : "STANDBY"}
              </div>
            </div>

            {/* Synth Engine Readout */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">FILTER CUTOFF</span>
                <span className="text-cyan-300 font-bold text-sm">{filterCutoffDisplay} Hz</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">STEREO PAN</span>
                <span className="text-sky-300 font-bold text-sm">
                  {Math.round((scanlineX - 0.5) * 200)}% {scanlineX < 0.5 ? "L" : "R"}
                </span>
              </div>
            </div>
          </div>

          {/* Computer Vision Real-Time Telemetry */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Extracted Frame Metrics</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">Canvas API Rec. 709</span>
            </div>

            {/* Luminosity Meter */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-slate-400">Luminosity (Pitch Driver):</span>
                <span className="text-cyan-300 font-bold">{Math.round(luminosity * 100)}%</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-600 to-cyan-300 transition-all duration-75 rounded-full"
                  style={{ width: `${Math.round(luminosity * 100)}%` }}
                />
              </div>
            </div>

            {/* RGB Color Channels Decomposition */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-mono text-slate-400 block">Color Band Decomposition:</span>
              <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
                <div className="p-2 rounded bg-slate-900 border border-slate-800 text-center">
                  <span className="text-[9px] text-rose-400 block font-bold">RED (Thermal)</span>
                  <span className="text-slate-200 font-bold">{Math.round(colorRatios.r * 100)}%</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800 text-center">
                  <span className="text-[9px] text-emerald-400 block font-bold">GREEN (Flora)</span>
                  <span className="text-slate-200 font-bold">{Math.round(colorRatios.g * 100)}%</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800 text-center">
                  <span className="text-[9px] text-sky-400 block font-bold">BLUE (Hydro)</span>
                  <span className="text-slate-200 font-bold">{Math.round(colorRatios.b * 100)}%</span>
                </div>
              </div>
            </div>

            {/* Motion Delta */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-slate-400">Frame Motion Delta (Noise & Pulse):</span>
                <span className="text-amber-300 font-bold">{(motionDelta * 100).toFixed(1)}% Δ</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 to-amber-300 transition-all duration-75 rounded-full"
                  style={{ width: `${Math.min(100, Math.round(motionDelta * 250))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Tone.js Synthesizer Configuration */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
            <div className="flex items-center gap-2 text-slate-200 font-bold uppercase tracking-wider text-xs">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Musical Scale & Synth Tuning</span>
            </div>

            {/* Scale Selector */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 block">HARMONIC SCALE MAPPING:</label>
              <select
                value={selectedScale}
                onChange={(e) => setSelectedScale(e.target.value as ScaleKey)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-cyan-400 focus:outline-none cursor-pointer"
              >
                {Object.entries(MUSICAL_SCALES).map(([key, sc]) => (
                  <option key={key} value={key}>
                    {sc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tone.js Waveform */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 block">OSCILLATOR TIMBRE:</label>
              <div className="grid grid-cols-4 gap-1 text-[11px]">
                {(["sine", "triangle", "sawtooth", "square"] as SynthWaveType[]).map((wf) => (
                  <button
                    key={wf}
                    onClick={() => setSynthWaveform(wf)}
                    className={`py-1.5 px-2 rounded border uppercase transition cursor-pointer ${
                      synthWaveform === wf
                        ? "bg-cyan-500 text-slate-950 font-bold border-cyan-400"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {wf}
                  </button>
                ))}
              </div>
            </div>

            {/* Reverb Ambience Slider */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Reverb Wetness:</span>
                <span className="text-cyan-300 font-bold">{Math.round(reverbAmount * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={0.8}
                step={0.05}
                value={reverbAmount}
                onChange={(e) => {
                  const r = parseFloat(e.target.value);
                  setReverbAmount(r);
                  if (toneNodesRef.current.reverb) {
                    toneNodesRef.current.reverb.wet.rampTo(r, 0.05);
                  }
                }}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preset Earth Video Library */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileVideo className="w-4 h-4 text-cyan-400" />
            <h3 className="font-mono text-xs font-bold text-white uppercase tracking-wider">
              Curated Satellite & Earth Video Presets
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
            Click any preset to load its optical dynamics
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {PRESET_VIDEOS.map((preset) => {
            const isSelected = currentPreset === preset.id && !customVideoUrl;
            return (
              <button
                key={preset.id}
                onClick={() => {
                  setCustomVideoUrl(null);
                  setCustomVideoName(null);
                  setCurrentPreset(preset.id);
                  if (!isPlaying) {
                    handleTogglePlay();
                  }
                }}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between group cursor-pointer ${
                  isSelected
                    ? "bg-cyan-950/60 border-cyan-400 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-400/50"
                    : "bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: `${preset.accentColor}20`,
                        color: preset.accentColor,
                        border: `1px solid ${preset.accentColor}40`,
                      }}
                    >
                      {preset.category}
                    </span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                  </div>
                  <h4 className="font-semibold text-xs text-white group-hover:text-cyan-300 transition line-clamp-1">
                    {preset.name}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-sans mt-1 line-clamp-2 leading-relaxed">
                    {preset.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/80 text-[9px] font-mono text-slate-500">
                  {preset.synthMood}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
