import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Upload,
  Eye,
  EyeOff,
  Sparkles,
  Volume2,
  VolumeX,
  Sliders,
  Maximize2,
  Info,
  CheckCircle2,
  AlertCircle,
  Film,
  Image as ImageIcon,
  Flame,
  Snowflake,
  Trees,
  Thermometer,
  Moon,
  Radio,
  Share2,
} from "lucide-react";

export type EICDatasetId = "arctic_ice" | "global_temp" | "amazon_forest" | "wildfire" | "night_lights" | "custom";

interface DatasetPreset {
  id: EICDatasetId;
  title: string;
  subtitle: string;
  source: string;
  metricLabel: string;
  metricUnit: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  accentColor: string;
  description: string;
  soundRule: string;
  generateFrame: (ctx: CanvasRenderingContext2D, width: number, height: number, progress: number) => void;
}

export const EICVisualSonifier: React.FC = () => {
  // Playback & Frame state
  const [selectedDataset, setSelectedDataset] = useState<EICDatasetId>("arctic_ice");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.8);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [eyesClosedMode, setEyesClosedMode] = useState<boolean>(false);
  const [speechNarrator, setSpeechNarrator] = useState<boolean>(true);
  const [scanMode, setScanMode] = useState<"whole_frame" | "scanline">("whole_frame");
  const [scanlineX, setScanlineX] = useState<number>(0.5);

  // Analysis telemetry extracted from visual frames
  const [telemetry, setTelemetry] = useState({
    primaryMetricPercent: 0,
    whitePixelPercent: 0,
    greenPixelPercent: 0,
    thermalPixelPercent: 0,
    meanBrightness: 0,
    motionDelta: 0,
    frequencyHz: 440,
    musicalNote: "A4",
    tempoBpm: 80,
  });

  // Canvas and Audio refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prevImageDataRef = useRef<Uint8ClampedArray | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const progressRef = useRef<number>(0);
  const customImageRef = useRef<HTMLImageElement | null>(null);
  const customVideoRef = useRef<HTMLVideoElement | null>(null);
  const [customFileLoaded, setCustomFileLoaded] = useState<boolean>(false);
  const [customFileName, setCustomFileName] = useState<string>("");

  // Web Audio Nodes refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const subOscRef = useRef<OscillatorNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const mainGainRef = useRef<GainNode | null>(null);
  const lfoRef = useRef<OscillatorNode | null>(null);
  const lfoGainRef = useRef<GainNode | null>(null);
  const noiseNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const noiseGainRef = useRef<GainNode | null>(null);

  // Speech synthesis announcement throttle
  const lastSpokenTimeRef = useRef<number>(0);

  // ============================================================================
  // PRESET PROCEDURAL NASA EIC SATELLITE VISUALIZATIONS (Frame-by-Frame generators)
  // ============================================================================
  const presets: DatasetPreset[] = [
    {
      id: "arctic_ice",
      title: "Arctic Sea Ice Melt Time-Lapse",
      subtitle: "NASA Goddard Space Flight Center / NSIDC (1984–2024)",
      source: "NASA Aqua/Terra MODIS & CryoSat-2",
      metricLabel: "Ice Coverage Extent",
      metricUnit: "% of Arctic Ocean",
      icon: Snowflake,
      accentColor: "#38bdf8",
      description: "Visual time-lapse of Arctic sea ice declining over 4 decades. In winter the ice expands into a bright white shield, and in summer it rapidly fractures and melts.",
      soundRule: "More white ice pixels = Higher, crystalline pitch (600–900 Hz). As ice melts = Pitch dives down (180 Hz) with cold dissonant tremolo.",
      generateFrame: (ctx, width, height, progress) => {
        // Deep Arctic Ocean background
        ctx.fillStyle = "#031129";
        ctx.fillRect(0, 0, width, height);

        // Coastlines / Greenland & Eurasia landmass outline
        ctx.fillStyle = "#1e293b";
        ctx.beginPath();
        ctx.ellipse(width * 0.18, height * 0.45, width * 0.12, height * 0.35, 0.4, 0, Math.PI * 2);
        ctx.fill(); // Greenland
        ctx.beginPath();
        ctx.ellipse(width * 0.8, height * 0.75, width * 0.25, height * 0.2, -0.2, 0, Math.PI * 2);
        ctx.fill(); // Siberia

        // Ice Cap calculation: progress 0 (1984 = max ice ~85%) -> progress 1 (2024 = min ice ~35%)
        // Adding seasonal oscillation on top of multi-decade decline
        const multiDecadeDecline = 0.82 - progress * 0.52;
        const seasonalSwing = Math.sin(progress * Math.PI * 8) * 0.12;
        const currentIceExtent = Math.max(0.2, multiDecadeDecline + seasonalSwing);

        const centerX = width * 0.5;
        const centerY = height * 0.5;
        const baseRadius = Math.min(width, height) * 0.38 * currentIceExtent;

        // Ice glow aura
        const glowGrad = ctx.createRadialGradient(centerX, centerY, baseRadius * 0.3, centerX, centerY, baseRadius * 1.2);
        glowGrad.addColorStop(0, "rgba(224, 242, 254, 0.95)");
        glowGrad.addColorStop(0.7, "rgba(186, 230, 253, 0.65)");
        glowGrad.addColorStop(1, "rgba(56, 189, 248, 0.0)");
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius * 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Solid Arctic Ice Shield (pure white & cyan pixels)
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        const points = 36;
        for (let i = 0; i < points; i++) {
          const angle = (i / points) * Math.PI * 2;
          const noise = Math.sin(angle * 4 + progress * 6) * 0.12 + Math.cos(angle * 6) * 0.08;
          const r = baseRadius * (1 + noise);
          const x = centerX + Math.cos(angle) * r;
          const y = centerY + Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();

        // Melt ponds / fissures (darker water cracking through ice as progress increases)
        if (progress > 0.3) {
          ctx.strokeStyle = "rgba(3, 17, 41, 0.75)";
          ctx.lineWidth = 2 + progress * 3;
          for (let f = 0; f < 6; f++) {
            ctx.beginPath();
            const startAngle = f * 1.1 + progress;
            const sx = centerX + Math.cos(startAngle) * baseRadius * 0.4;
            const sy = centerY + Math.sin(startAngle) * baseRadius * 0.4;
            ctx.moveTo(sx, sy);
            ctx.lineTo(
              centerX + Math.cos(startAngle + 0.3) * baseRadius * 0.95,
              centerY + Math.sin(startAngle + 0.3) * baseRadius * 0.95
            );
            ctx.stroke();
          }
        }
      },
    },
    {
      id: "global_temp",
      title: "NASA GISTEMP Global Heat Anomaly",
      subtitle: "NASA Goddard Institute for Space Studies (GISS)",
      source: "NASA GISTEMP Surface Temperature Analysis",
      metricLabel: "Thermal Anomaly",
      metricUnit: "+°C above pre-industrial",
      icon: Thermometer,
      accentColor: "#f97316",
      description: "Color-coded planetary heat map. In early decades blue/neutral tones dominate; as emissions surge, blazing crimson and yellow heatwaves engulf the continents.",
      soundRule: "More red/orange heat pixels = Rising warning frequency + brassy harmonic buzz + increased modulation speed.",
      generateFrame: (ctx, width, height, progress) => {
        // Space / Ocean base
        ctx.fillStyle = "#050b14";
        ctx.fillRect(0, 0, width, height);

        // Grid lines
        ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
        ctx.lineWidth = 1;
        for (let x = 0; x < width; x += width / 8) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }

        // Heat anomaly intensity: 0 to 1
        // Progress 0 = 1880 (mild blue/white anomaly -0.2°C), Progress 1 = 2024 (+1.48°C blazing crimson)
        const heatAnomaly = Math.min(1, Math.max(0.05, progress * 1.1));

        // Draw heat patches across northern and tropical latitudes
        const numBlobs = 18;
        for (let i = 0; i < numBlobs; i++) {
          const bx = ((i * 137.5) % width);
          const by = height * 0.2 + (Math.sin(i * 2.3) * 0.5 + 0.5) * height * 0.6;
          const radius = (width * 0.12) * (0.8 + Math.sin(i + progress * 5) * 0.3);

          const heatGrad = ctx.createRadialGradient(bx, by, 0, bx, by, radius);
          if (heatAnomaly < 0.3) {
            heatGrad.addColorStop(0, "rgba(56, 189, 248, 0.6)");
            heatGrad.addColorStop(0.6, "rgba(30, 64, 175, 0.4)");
            heatGrad.addColorStop(1, "rgba(5, 11, 20, 0)");
          } else {
            const redAlpha = Math.min(0.9, heatAnomaly * 0.95);
            heatGrad.addColorStop(0, `rgba(254, 240, 138, ${redAlpha})`); // Yellow heat core
            heatGrad.addColorStop(0.35, `rgba(249, 115, 22, ${redAlpha * 0.85})`); // Orange
            heatGrad.addColorStop(0.7, `rgba(220, 38, 38, ${redAlpha * 0.6})`); // Red
            heatGrad.addColorStop(1, "rgba(5, 11, 20, 0)");
          }

          ctx.fillStyle = heatGrad;
          ctx.beginPath();
          ctx.arc(bx, by, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      },
    },
    {
      id: "amazon_forest",
      title: "Amazon Deforestation Satellite Feed",
      subtitle: "NASA / USGS Landsat 7/8/9 & Terra MODIS",
      source: "USGS Landsat Forest Disturbance Tracker",
      metricLabel: "Canopy Cover Index (NDVI)",
      metricUnit: "% intact forest",
      icon: Trees,
      accentColor: "#10b981",
      description: "Visual time-lapse of the southern Amazon 'Arc of Deforestation'. Lush deep green rainforest is fragmented by diagonal logging roads into pale brown pasture blocks.",
      soundRule: "Lush green canopy = Warm resonant organ-like pad (432 Hz). As trees fall = Sound thins out into a hollow dry wind whisper.",
      generateFrame: (ctx, width, height, progress) => {
        // Lush green rainforest background
        ctx.fillStyle = "#064e3b";
        ctx.fillRect(0, 0, width, height);

        // River meandering through forest
        ctx.strokeStyle = "#0284c7";
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.moveTo(0, height * 0.3);
        ctx.bezierCurveTo(width * 0.3, height * 0.1, width * 0.7, height * 0.6, width, height * 0.4);
        ctx.stroke();

        // Deforestation fishbone tracks emerging with progress
        const deforestBlocks = Math.floor(progress * 28);
        ctx.fillStyle = "#78350f"; // Bare soil
        ctx.strokeStyle = "#a16207";
        ctx.lineWidth = 3;

        for (let b = 0; b < deforestBlocks; b++) {
          const rx = (b * 67) % (width - 60) + 20;
          const ry = height * 0.45 + ((b * 43) % (height * 0.45));
          const rw = 25 + (b % 4) * 12;
          const rh = 18 + (b % 3) * 10;

          // Road spine
          ctx.beginPath();
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx + rw, ry - rh);
          ctx.stroke();

          // Cleared parcel
          ctx.fillRect(rx, ry, rw, rh);
        }
      },
    },
    {
      id: "wildfire",
      title: "Active Wildfire Perimeter & Plume",
      subtitle: "NASA Fire Information for Resource Management (FIRMS)",
      source: "Suomi NPP / NOAA-20 VIIRS Active Fire",
      metricLabel: "Active Fire Front Radiance",
      metricUnit: "MW / Thermal Flux",
      icon: Flame,
      accentColor: "#ef4444",
      description: "Rapidly spreading wildfire front detected by thermal infrared. Red hot thermal pixels ignite along the fireline with gray pyrocumulus smoke spreading downwind.",
      soundRule: "Intense fire pixels = Granular crackle noise + fast pulsing rhythmic alarm tone proportional to burn perimeter.",
      generateFrame: (ctx, width, height, progress) => {
        // Dark scorched landscape
        ctx.fillStyle = "#18181b";
        ctx.fillRect(0, 0, width, height);

        // Smoke plume expanding downwind
        const smokeGrad = ctx.createRadialGradient(
          width * 0.3,
          height * 0.5,
          20,
          width * 0.65,
          height * 0.4,
          width * 0.5
        );
        smokeGrad.addColorStop(0, "rgba(113, 113, 122, 0.7)");
        smokeGrad.addColorStop(0.6, "rgba(63, 63, 70, 0.45)");
        smokeGrad.addColorStop(1, "rgba(24, 24, 27, 0)");
        ctx.fillStyle = smokeGrad;
        ctx.beginPath();
        ctx.ellipse(width * 0.55, height * 0.4, width * 0.4, height * 0.3, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // Expanding fireline perimeter
        const fireProgress = progress;
        const fireCount = Math.floor(15 + fireProgress * 35);
        for (let i = 0; i < fireCount; i++) {
          const angle = (i / fireCount) * Math.PI * 1.5;
          const fx = width * 0.25 + Math.cos(angle) * (width * 0.2 * fireProgress + 20) + (Math.random() - 0.5) * 15;
          const fy = height * 0.6 + Math.sin(angle) * (height * 0.25 * fireProgress + 15) + (Math.random() - 0.5) * 15;
          const fRadius = 6 + Math.random() * 10;

          // Fiery glow
          const fireGrad = ctx.createRadialGradient(fx, fy, 0, fx, fy, fRadius);
          fireGrad.addColorStop(0, "#fef08a"); // White-yellow core
          fireGrad.addColorStop(0.4, "#f97316"); // Orange
          fireGrad.addColorStop(0.8, "#ef4444"); // Red
          fireGrad.addColorStop(1, "rgba(239, 68, 68, 0)");

          ctx.fillStyle = fireGrad;
          ctx.beginPath();
          ctx.arc(fx, fy, fRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      },
    },
    {
      id: "night_lights",
      title: "Earth at Night (Urban Electrification)",
      subtitle: "NASA Black Marble / Visible Infrared Imaging Radiometer (VIIRS)",
      source: "NASA Earth Observatory Black Marble Product Suite",
      metricLabel: "Human Light Luminance",
      metricUnit: "nW/cm²·sr",
      icon: Moon,
      accentColor: "#fbbf24",
      description: "Night satellite photograph capturing the expansion of human civilization through electric streetlights and megacity power grids over three decades.",
      soundRule: "Brighter city lights = Shimmering pentatonic harmonics and ringing bell-like overtones as grid density spreads.",
      generateFrame: (ctx, width, height, progress) => {
        // Deep nocturnal space
        ctx.fillStyle = "#02040a";
        ctx.fillRect(0, 0, width, height);

        // Coastline silhouette
        ctx.strokeStyle = "rgba(30, 41, 59, 0.4)";
        ctx.lineWidth = 2;
        ctx.strokeRect(width * 0.1, height * 0.15, width * 0.8, height * 0.7);

        // Cities emerging and glowing brighter with progress
        const numCities = Math.floor(20 + progress * 40);
        for (let c = 0; c < numCities; c++) {
          const cx = ((c * 179) % (width * 0.75)) + width * 0.12;
          const cy = ((c * 241) % (height * 0.65)) + height * 0.18;
          const intensity = 0.4 + (progress * 0.6);
          const cradius = 4 + (c % 5) * 4 * intensity;

          const lightGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cradius * 2);
          lightGrad.addColorStop(0, `rgba(255, 255, 230, ${intensity})`);
          lightGrad.addColorStop(0.4, `rgba(251, 191, 36, ${intensity * 0.7})`);
          lightGrad.addColorStop(1, "rgba(2, 4, 10, 0)");

          ctx.fillStyle = lightGrad;
          ctx.beginPath();
          ctx.arc(cx, cy, cradius * 2, 0, Math.PI * 2);
          ctx.fill();
        }
      },
    },
  ];

  const currentPreset = presets.find((p) => p.id === selectedDataset) || presets[0];

  // ============================================================================
  // WEB AUDIO ENGINE INITIALIZATION & REAL-TIME MODULATION
  // ============================================================================
  const initAudio = () => {
    if (audioCtxRef.current) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();

      // Master Gain
      const masterGain = ctx.createGain();
      const initialGain = (!isPlaying || isMuted) ? 0.00001 : volume;
      masterGain.gain.setValueAtTime(initialGain, ctx.currentTime);
      masterGain.connect(ctx.destination);

      // Lowpass filter
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1200, ctx.currentTime);
      filter.Q.setValueAtTime(3.5, ctx.currentTime);
      filter.connect(masterGain);

      // Main Oscillator (Carrier)
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, ctx.currentTime);

      // Sub / Harmonic Oscillator
      const subOsc = ctx.createOscillator();
      subOsc.type = "triangle";
      subOsc.frequency.setValueAtTime(220, ctx.currentTime);

      // Sub gain
      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(0.4, ctx.currentTime);
      subOsc.connect(subGain);
      subGain.connect(filter);

      // Main osc gain
      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(0.7, ctx.currentTime);
      osc.connect(oscGain);
      oscGain.connect(filter);

      // LFO for Tremolo / Meltdown effect
      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(3, ctx.currentTime);
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(0, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(oscGain.gain);

      // Noise Buffer for Wildfire crackle / wind
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const noiseNode = ctx.createBufferSource();
      noiseNode.buffer = noiseBuffer;
      noiseNode.loop = true;

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0, ctx.currentTime);
      noiseNode.connect(noiseGain);
      noiseGain.connect(filter);

      osc.start();
      subOsc.start();
      lfo.start();
      noiseNode.start();

      audioCtxRef.current = ctx;
      oscRef.current = osc;
      subOscRef.current = subOsc;
      filterRef.current = filter;
      mainGainRef.current = masterGain;
      lfoRef.current = lfo;
      lfoGainRef.current = lfoGain;
      noiseNodeRef.current = noiseNode;
      noiseGainRef.current = noiseGain;
    } catch (e) {
      console.error("AudioContext initialization failed:", e);
    }
  };

  // Convert Hz to Musical Note name
  const hzToNote = (hz: number): string => {
    const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const midi = Math.round(69 + 12 * Math.log2(hz / 440));
    const note = notes[midi % 12];
    const octave = Math.floor(midi / 12) - 1;
    return `${note}${octave}`;
  };

  // ============================================================================
  // COMPUTER VISION FRAME ANALYZER (Reads pixels from Canvas each frame)
  // ============================================================================
  const analyzeVisualFrame = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      let imgData: ImageData;
      try {
        imgData = ctx.getImageData(0, 0, width, height);
      } catch {
        return;
      }
      const data = imgData.data;
      const totalPixels = width * height;

      let whiteCount = 0;
      let greenCount = 0;
      let thermalCount = 0;
      let totalLuminance = 0;

      // Scanline sampling or full frame sampling
      const step = 4; // Sample every 4th pixel for high performance 60fps
      let sampled = 0;

      const startX = scanMode === "scanline" ? Math.floor(scanlineX * width) - 5 : 0;
      const endX = scanMode === "scanline" ? Math.floor(scanlineX * width) + 5 : width;

      for (let y = 0; y < height; y += step) {
        for (let x = Math.max(0, startX); x < Math.min(width, endX); x += step) {
          const idx = (y * width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          // 1. Luminance
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          totalLuminance += lum;
          sampled++;

          // 2. White Ice pixels (High brightness and balanced RGB)
          if (r > 195 && g > 195 && b > 195 && Math.abs(r - b) < 40) {
            whiteCount++;
          }

          // 3. Green Canopy pixels (Green clearly exceeds red and blue)
          if (g > 70 && g > r * 1.15 && g > b * 1.15) {
            greenCount++;
          }

          // 4. Thermal Heat / Wildfire pixels (High Red, moderate green, low blue)
          if (r > 165 && (r - b) > 55) {
            thermalCount++;
          }
        }
      }

      const whiteRatio = whiteCount / (sampled || 1);
      const greenRatio = greenCount / (sampled || 1);
      const thermalRatio = thermalCount / (sampled || 1);
      const meanLum = totalLuminance / (sampled || 1);

      // Frame-to-frame motion delta
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

      // Determine Primary Metric based on current active dataset
      let primaryPercent = 0;
      let targetFrequency = 440;
      let targetWave: OscillatorType = "sine";
      let filterFreq = 1200;
      let lfoDepth = 0;
      let noiseLevel = 0;
      let tempo = 80;

      if (selectedDataset === "arctic_ice") {
        // Arctic Ice Extent: White pixel coverage
        primaryPercent = Math.round(whiteRatio * 100);
        // High ice = bright 880 Hz, low ice = low 220 Hz
        targetFrequency = 220 + (whiteRatio * 660);
        targetWave = "sine";
        filterFreq = 800 + (whiteRatio * 2400);
        // As ice declines below 40%, tremolo LFO accelerates (melting breakdown)
        if (whiteRatio < 0.45) {
          lfoDepth = (0.45 - whiteRatio) * 1.5;
        }
        tempo = Math.round(60 + (1 - whiteRatio) * 60);
      } else if (selectedDataset === "global_temp") {
        // Thermal Anomaly: Red/heat pixels
        primaryPercent = Math.round(thermalRatio * 100);
        // Heat rises = pitch ascends and switches to saw/brass
        targetFrequency = 180 + (thermalRatio * 680);
        targetWave = thermalRatio > 0.3 ? "sawtooth" : "triangle";
        filterFreq = 600 + (thermalRatio * 3200);
        tempo = Math.round(75 + thermalRatio * 85);
      } else if (selectedDataset === "amazon_forest") {
        // Amazon Forest: Green canopy pixels
        primaryPercent = Math.round(greenRatio * 100);
        // Lush forest = warm 432Hz fundamental, low canopy = 140Hz hollow tone + wind hiss
        targetFrequency = 140 + (greenRatio * 460);
        targetWave = "triangle";
        filterFreq = 500 + (greenRatio * 2000);
        noiseLevel = (1 - greenRatio) * 0.35; // Deforested dry wind
        tempo = Math.round(70 + (1 - greenRatio) * 50);
      } else if (selectedDataset === "wildfire") {
        // Wildfire Radiance: Thermal pixels + motion delta
        primaryPercent = Math.round(thermalRatio * 100);
        targetFrequency = 160 + (thermalRatio * 720);
        targetWave = "sawtooth";
        filterFreq = 1000 + (thermalRatio * 4000);
        noiseLevel = thermalRatio * 0.6; // Crackle noise
        lfoDepth = thermalRatio * 0.5;
        tempo = Math.round(90 + thermalRatio * 120);
      } else if (selectedDataset === "night_lights") {
        // Night Lights: Mean Luminance
        primaryPercent = Math.round((meanLum / 255) * 100);
        targetFrequency = 261.63 * Math.pow(2, (meanLum / 255) * 2); // Pentatonic octave climbing
        targetWave = "sine";
        filterFreq = 1200 + (meanLum / 255) * 3500;
        tempo = Math.round(80 + (meanLum / 255) * 40);
      } else {
        // Custom Image / Video
        primaryPercent = Math.round((meanLum / 255) * 100);
        targetFrequency = 200 + ((whiteRatio + thermalRatio) * 500);
        filterFreq = 800 + (meanLum / 255) * 2500;
      }

      // Live Telemetry state
      setTelemetry({
        primaryMetricPercent: primaryPercent,
        whitePixelPercent: Math.round(whiteRatio * 100),
        greenPixelPercent: Math.round(greenRatio * 100),
        thermalPixelPercent: Math.round(thermalRatio * 100),
        meanBrightness: Math.round((meanLum / 255) * 100),
        motionDelta: Math.round(motionDelta * 100),
        frequencyHz: Math.round(targetFrequency),
        musicalNote: hzToNote(targetFrequency),
        tempoBpm: tempo,
      });

      // Update Web Audio Nodes in Real Time
      if (audioCtxRef.current && oscRef.current && filterRef.current) {
        const now = audioCtxRef.current.currentTime;
        oscRef.current.type = targetWave;
        oscRef.current.frequency.setTargetAtTime(targetFrequency, now, 0.04);

        if (subOscRef.current) {
          subOscRef.current.frequency.setTargetAtTime(targetFrequency * 0.5, now, 0.04);
        }

        filterRef.current.frequency.setTargetAtTime(Math.min(18000, Math.max(100, filterFreq)), now, 0.05);

        if (lfoGainRef.current) {
          lfoGainRef.current.gain.setTargetAtTime(lfoDepth, now, 0.05);
        }

        if (noiseGainRef.current) {
          noiseGainRef.current.gain.setTargetAtTime(noiseLevel, now, 0.05);
        }
      }

      // Accessibility Speech Narrator (Speaks once every 8 seconds when playing)
      if (speechNarrator && isPlaying && typeof window !== "undefined" && "speechSynthesis" in window) {
        const nowMs = Date.now();
        if (nowMs - lastSpokenTimeRef.current > 7500) {
          lastSpokenTimeRef.current = nowMs;
          const msg = `${currentPreset.metricLabel}: ${primaryPercent} percent. Audio pitch: ${Math.round(targetFrequency)} Hertz.`;
          try {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(msg);
            utterance.rate = 1.1;
            utterance.volume = 0.8;
            window.speechSynthesis.speak(utterance);
          } catch {}
        }
      }
    },
    [selectedDataset, scanMode, scanlineX, speechNarrator, isPlaying, currentPreset]
  );

  // ============================================================================
  // CONTINUOUS ANIMATION LOOP (30-60 FPS Frame Player)
  // ============================================================================
  useEffect(() => {
    let animId: number;

    const renderLoop = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;

          if (selectedDataset === "custom" && customImageRef.current) {
            // Render user uploaded custom image
            ctx.drawImage(customImageRef.current, 0, 0, w, h);
          } else if (selectedDataset === "custom" && customVideoRef.current) {
            // Render user uploaded custom video
            ctx.drawImage(customVideoRef.current, 0, 0, w, h);
          } else {
            // Render NASA EIC procedural time-lapse frame
            currentPreset.generateFrame(ctx, w, h, progressRef.current);
          }

          // If scanline mode, draw visual overlay indicator
          if (scanMode === "scanline") {
            const sx = scanlineX * w;
            ctx.strokeStyle = "rgba(34, 211, 238, 0.85)";
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(sx, 0);
            ctx.lineTo(sx, h);
            ctx.stroke();
            ctx.setLineDash([]);
          }

          // Perform Computer Vision Analysis on this frame
          analyzeVisualFrame(ctx, w, h);
        }
      }

      // Advance time if playing
      if (isPlaying) {
        progressRef.current += 0.002 * playbackSpeed;
        if (progressRef.current > 1) {
          progressRef.current = 0; // Loop back
        }
      }

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, playbackSpeed, selectedDataset, scanMode, scanlineX, currentPreset, analyzeVisualFrame]);

  // Guaranteed cleanup on unmount
  useEffect(() => {
    return () => {
      if (mainGainRef.current && audioCtxRef.current) {
        try {
          const now = audioCtxRef.current.currentTime;
          mainGainRef.current.gain.cancelScheduledValues(now);
          mainGainRef.current.gain.setValueAtTime(0, now);
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

  // Master Volume / Mute updates (strictly respects isPlaying state)
  useEffect(() => {
    if (mainGainRef.current && audioCtxRef.current) {
      const now = audioCtxRef.current.currentTime;
      mainGainRef.current.gain.cancelScheduledValues(now);
      if (!isPlaying || isMuted) {
        mainGainRef.current.gain.setValueAtTime(mainGainRef.current.gain.value, now);
        mainGainRef.current.gain.setTargetAtTime(0.00001, now, 0.02);
      } else {
        mainGainRef.current.gain.setTargetAtTime(volume, now, 0.05);
      }
    }
  }, [isPlaying, volume, isMuted]);

  // Handle Play/Pause Toggle
  const handleTogglePlay = () => {
    const nextPlay = !isPlaying;
    if (nextPlay) {
      initAudio();
      if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
    } else {
      if (mainGainRef.current && audioCtxRef.current) {
        const now = audioCtxRef.current.currentTime;
        mainGainRef.current.gain.cancelScheduledValues(now);
        mainGainRef.current.gain.setValueAtTime(mainGainRef.current.gain.value, now);
        mainGainRef.current.gain.setTargetAtTime(0.00001, now, 0.02);
      }
    }
    setIsPlaying(nextPlay);
  };

  // Handle Reset Time-Lapse
  const handleReset = () => {
    progressRef.current = 0;
  };

  // Handle Custom File Upload (Image or Video)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCustomFileName(file.name);
    setSelectedDataset("custom");

    if (file.type.startsWith("image/")) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        customImageRef.current = img;
        customVideoRef.current = null;
        setCustomFileLoaded(true);
      };
    } else if (file.type.startsWith("video/")) {
      const video = document.createElement("video");
      video.src = URL.createObjectURL(file);
      video.loop = true;
      video.muted = true;
      video.play();
      customVideoRef.current = video;
      customImageRef.current = null;
      setCustomFileLoaded(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-cyan-950/70 via-slate-900 to-indigo-950/70 border border-cyan-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider mb-1.5">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span>NASA EIC VISUAL-TO-SOUND JUKEBOX ENGINE</span>
              <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full text-[10px]">
                COMPUTER VISION + WEB AUDIO
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-black text-white">
              Turn NASA Satellite Frames into Live Music
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl font-sans leading-relaxed">
              NASA Earth Information Center creates stunning time-lapses of disappearing ice, rising heat, and deforestation.
              This Jukebox inspects every visual frame pixel-by-pixel, measuring white ice ratio, green canopy, and thermal heat, turning them directly into scientific audio frequencies so you can <strong className="text-cyan-300">hear the change even with your eyes closed</strong>.
            </p>
          </div>

          {/* Quick Action Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setEyesClosedMode(!eyesClosedMode)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-mono font-bold transition shadow-lg ${
                eyesClosedMode
                  ? "bg-amber-500 text-slate-950 border-amber-400"
                  : "bg-slate-900/90 text-slate-300 border-slate-700 hover:border-amber-400/50 hover:text-amber-300"
              }`}
              title="Toggle Eyes-Closed Blind-Accessible Auditory Mode"
            >
              {eyesClosedMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{eyesClosedMode ? "EYES-CLOSED MODE: ON" : "EYES-CLOSED MODE"}</span>
            </button>

            <button
              onClick={() => setSpeechNarrator(!speechNarrator)}
              className={`px-3 py-2 rounded-2xl border text-xs font-mono transition ${
                speechNarrator
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-400"
                  : "bg-slate-900 text-slate-400 border-slate-800"
              }`}
              title="Live Plain-Language Audio Description for the Visually Impaired"
            >
              VOICE NARRATION: {speechNarrator ? "ON" : "OFF"}
            </button>
          </div>
        </div>
      </div>

      {/* Dataset Selection Tabs ("EKEK PART") */}
      <div className="p-2 rounded-2xl bg-slate-950/70 border border-slate-800 backdrop-blur-md">
        <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider px-2 py-1 mb-1">
          CHOOSE A NASA EIC VISUAL TIME-LAPSE OR UPLOAD YOUR OWN:
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {presets.map((preset) => {
            const isSelected = selectedDataset === preset.id;
            const Icon = preset.icon;
            return (
              <button
                key={preset.id}
                onClick={() => {
                  setSelectedDataset(preset.id);
                  progressRef.current = 0;
                }}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  isSelected
                    ? "bg-slate-900 border-cyan-400 text-white shadow-lg shadow-cyan-950/40"
                    : "bg-slate-950/40 border-slate-800/80 text-slate-400 hover:bg-slate-900 hover:text-slate-200 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <Icon className="w-5 h-5" style={{ color: preset.accentColor }} />
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-xs leading-tight line-clamp-1">
                    {preset.title.split(" ")[0]} {preset.title.split(" ")[1]}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 mt-0.5 line-clamp-1">
                    {preset.metricLabel}
                  </div>
                </div>
              </button>
            );
          })}

          {/* Custom File Upload Option */}
          <label className="p-3 rounded-xl border border-dashed border-cyan-500/40 hover:border-cyan-400 bg-cyan-950/20 hover:bg-cyan-950/40 text-left transition flex flex-col justify-between cursor-pointer group">
            <div className="flex items-center justify-between w-full mb-2">
              <Upload className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition" />
              <span className="text-[9px] font-mono bg-cyan-500/30 text-cyan-200 px-1 rounded">
                CUSTOM
              </span>
            </div>
            <div>
              <div className="font-bold text-xs text-white leading-tight">
                {customFileName ? customFileName.slice(0, 14) + "..." : "Upload Satellite"}
              </div>
              <div className="text-[10px] font-mono text-cyan-400 mt-0.5">
                Image or Video
              </div>
            </div>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Main Analysis Stage: Screen + Live Audio Synthesizer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 xl:gap-8 items-stretch">
        {/* Visual Frame Screen (7 Cols, or 8 on 2xl) */}
        <div className="lg:col-span-7 2xl:col-span-8 flex flex-col gap-3">
          <div className="relative rounded-3xl overflow-hidden glass-panel border border-cyan-500/30 shadow-2xl bg-black flex items-center justify-center min-h-[300px] xs:min-h-[360px] sm:min-h-[440px] lg:min-h-[500px] xl:min-h-[560px]">
            {/* The Actual HTML5 Canvas where NASA frames are generated & pixel-scanned */}
            <canvas
              ref={canvasRef}
              width={640}
              height={400}
              className={`w-full h-full object-contain transition duration-500 ${
                eyesClosedMode ? "filter blur-2xl opacity-10 pointer-events-none" : ""
              }`}
            />

            {/* Eyes-Closed Simulation Mask (Shows the user what a blind student experiences purely via audio) */}
            {eyesClosedMode && (
              <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center animate-fadeIn z-20">
                <EyeOff className="w-12 h-12 text-amber-400 mb-3 animate-bounce" />
                <h3 className="text-xl font-display font-extrabold text-white">
                  Eyes-Closed Auditory Mode Active
                </h3>
                <p className="text-sm text-slate-300 max-w-md mt-1 font-sans">
                  The visual feed is masked. Listen to the pitch and harmonics:
                </p>
                <div className="mt-4 p-4 rounded-2xl bg-slate-900 border border-cyan-500/30 max-w-sm text-left font-mono text-xs space-y-1.5 text-cyan-200">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Current Frequency:</span>
                    <span className="font-bold text-white">{telemetry.frequencyHz} Hz ({telemetry.musicalNote})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Extracted {currentPreset.metricLabel}:</span>
                    <span className="font-bold text-amber-300">{telemetry.primaryMetricPercent}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Auditory State:</span>
                    <span className="font-bold text-emerald-400">
                      {telemetry.frequencyHz > 550 ? "High Elevation / Frozen" : "Melting / Extreme Warming"}
                    </span>
                  </div>
                </div>
                <p className="text-xs font-mono text-slate-400 mt-4">
                  "If the pitch drops, the ice is shrinking. If it rises, heat is surging."
                </p>
              </div>
            )}

            {/* Overlaid HUD Information on Canvas */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
              <div className="flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-cyan-500/30 text-xs font-mono text-white">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="font-bold uppercase tracking-wider">{currentPreset.title}</span>
              </div>

              <div className="bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700 text-xs font-mono text-cyan-300">
                FRAME ANALYZER: 60 FPS
              </div>
            </div>

            {/* Live Scanline Slider for Optical Sonogram Scanning */}
            {scanMode === "scanline" && (
              <div className="absolute bottom-4 left-6 right-6 z-10 pointer-events-auto bg-slate-950/90 p-2.5 rounded-2xl border border-cyan-500/40">
                <div className="flex justify-between text-[11px] font-mono text-cyan-300 mb-1">
                  <span>OPTICAL SCANLINE POSITION: {Math.round(scanlineX * 100)}%</span>
                  <span>DRAG TO SONIFY HORIZONTAL PIXEL COLUMNS</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={scanlineX}
                  onChange={(e) => setScanlineX(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-ew-resize"
                />
              </div>
            )}
          </div>

          {/* Time-Lapse Transport Controls */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={handleTogglePlay}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl font-mono text-xs font-bold transition shadow-lg ${
                  isPlaying
                    ? "bg-amber-500 hover:bg-amber-400 text-slate-950"
                    : "bg-cyan-500 hover:bg-cyan-400 text-slate-950"
                }`}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                <span>{isPlaying ? "PAUSE JUKEBOX" : "START SONIFICATION"}</span>
              </button>

              <button
                onClick={handleReset}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition"
                title="Restart Time-Lapse"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-mono text-slate-300">
                {[0.5, 1, 2].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setPlaybackSpeed(spd)}
                    className={`px-2 py-0.5 rounded-lg transition ${
                      playbackSpeed === spd ? "bg-cyan-500/25 text-cyan-300 font-bold" : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            {/* Analysis Mode Toggle */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-mono">
              <button
                onClick={() => setScanMode("whole_frame")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  scanMode === "whole_frame"
                    ? "bg-cyan-500/25 text-cyan-300 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Whole Frame
              </button>
              <button
                onClick={() => setScanMode("scanline")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  scanMode === "scanline"
                    ? "bg-cyan-500/25 text-cyan-300 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Sonogram Scanline
              </button>
            </div>
          </div>
        </div>

        {/* Live Sonification & Computer Vision Telemetry (5 Cols, or 4 on 2xl) */}
        <div className="lg:col-span-5 2xl:col-span-4 flex flex-col gap-4">
          {/* Real-time Extracted Data Panel */}
          <div className="p-5 rounded-3xl glass-panel border border-cyan-500/30 shadow-2xl bg-gradient-to-b from-slate-950/80 to-slate-900/60">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-cyan-400" />
                <h3 className="font-display font-extrabold text-white text-base">
                  Real-Time Pixel Analysis
                </h3>
              </div>
              <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full font-bold">
                NO PRE-RECORDED AUDIO
              </span>
            </div>

            {/* Primary Big Metric Box */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/30 mb-4">
              <div className="text-xs font-mono text-slate-400 uppercase">
                EXTRACTED {currentPreset.metricLabel.toUpperCase()}:
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl sm:text-4xl font-mono font-black text-cyan-300">
                  {telemetry.primaryMetricPercent}
                </span>
                <span className="text-sm font-mono text-slate-400">
                  {currentPreset.metricUnit}
                </span>
              </div>

              {/* Progress visual bar */}
              <div className="w-full bg-slate-950 h-2.5 rounded-full mt-3 overflow-hidden border border-slate-800">
                <div
                  className="h-full rounded-full transition-all duration-100"
                  style={{
                    width: `${Math.min(100, Math.max(2, telemetry.primaryMetricPercent))}%`,
                    backgroundColor: currentPreset.accentColor,
                  }}
                />
              </div>
            </div>

            {/* Sound Mapping Telemetry */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400">SYNTHESIZED PITCH</div>
                <div className="text-lg font-mono font-bold text-white mt-0.5">
                  {telemetry.frequencyHz} Hz
                </div>
                <div className="text-[11px] font-mono text-cyan-400">
                  Note: {telemetry.musicalNote}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400">AUDIO TEMPO</div>
                <div className="text-lg font-mono font-bold text-white mt-0.5">
                  {telemetry.tempoBpm} BPM
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  Pulse Sync
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400">WHITE ICE PIXELS</div>
                <div className="text-lg font-mono font-bold text-cyan-200 mt-0.5">
                  {telemetry.whitePixelPercent}%
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400">THERMAL HEAT PIXELS</div>
                <div className="text-lg font-mono font-bold text-orange-400 mt-0.5">
                  {telemetry.thermalPixelPercent}%
                </div>
              </div>
            </div>

            {/* Scientific Mapping Rule Card */}
            <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 text-xs font-sans">
              <div className="flex items-center gap-1.5 text-cyan-300 font-mono font-bold text-[11px] mb-1">
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                HOW THIS DATA BECOMES SOUND:
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                {currentPreset.soundRule}
              </p>
            </div>
          </div>

          {/* Volume & Master Controls */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-4">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2 rounded-xl border transition ${
                isMuted
                  ? "bg-red-500/20 border-red-500/40 text-red-300"
                  : "bg-slate-900 border-slate-800 text-cyan-400"
              }`}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <div className="flex-1">
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                <span>SYNTHESIZER VOLUME</span>
                <span>{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Educational Explanation: The 3 Core Pillars */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-950/70 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase">
          <Info className="w-4 h-4" />
          <span>HOW EARTH JUKEBOX TRANSLATES SIGHT INTO SOUND</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center gap-2 text-white font-bold text-sm mb-1.5">
              <span className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-mono text-xs flex items-center justify-center font-black">
                1
              </span>
              Visual Analysis (Computer Vision)
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Extracts objective quantitative data from raw satellite pixels: white ice reflectance, green NDVI canopy, thermal infrared heat pixels, and frame-to-frame change velocity.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center gap-2 text-white font-bold text-sm mb-1.5">
              <span className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 font-mono text-xs flex items-center justify-center font-black">
                2
              </span>
              Scientific Sonification (Sound Mapping)
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Applies psychoacoustic rules to map physics variables directly to sound: ice loss drives pitch drop, thermal anomaly raises brassy buzz, and deforestation thins harmony into dry wind.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center gap-2 text-white font-bold text-sm mb-1.5">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono text-xs flex items-center justify-center font-black">
                3
              </span>
              Real-Time Dynamic Audio (Multi-Sensory)
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Uses the native browser Web Audio API to synthesize responsive audio waveforms on the fly with zero latency. No pre-recorded MP3 tracks — pure live mathematical sound.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
