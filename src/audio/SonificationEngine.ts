import { VariableId, DataPoint, SonificationMappingConfig, OrchestraTrack } from "../types";
import { nasaDataService } from "../services/NASADataService";

export class SonificationEngine {
  private ctx: AudioContext | null = null;
  private isRunning: boolean = false;
  private isPaused: boolean = false;

  // Master audio nodes
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private dynamicsCompressor: DynamicsCompressorNode | null = null;

  // Single Variable Sound generators
  private primaryOsc: OscillatorNode | null = null;
  private primaryGain: GainNode | null = null;
  private subOsc: OscillatorNode | null = null;
  private subGain: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private lfoOsc: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;

  // Granular / Rhythmic Generators (Wind, Rain, Fire)
  private noiseNode: AudioBufferSourceNode | null = null;
  private noiseFilter: BiquadFilterNode | null = null;
  private noiseGain: GainNode | null = null;
  private rhythmTimer: number | null = null;

  // Current State
  private currentVariable: VariableId = "temperature";
  private currentDataPoint: DataPoint | null = null;
  private mappingConfig: SonificationMappingConfig = {
    pitchInverted: false,
    sensitivity: 1.0,
    baseFrequency: 130,
    maxFrequency: 880,
    timbre: "sine",
    reverbAmount: 0.3,
  };
  private masterVolume: number = 0.7;

  // Orchestra Mode state
  private isOrchestraMode: boolean = false;
  private orchestraNodes: Map<
    VariableId,
    {
      osc?: OscillatorNode;
      gain?: GainNode;
      filter?: BiquadFilterNode;
      lfo?: OscillatorNode;
    }
  > = new Map();

  constructor() {
    // Lazy AudioContext initialization on first user gesture
  }

  public async initAudio(): Promise<boolean> {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        console.warn("Web Audio API is not supported in this browser.");
        return false;
      }
      this.ctx = new AudioCtx();
    }

    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }

    if (!this.masterGain) {
      this.setupMasterChain();
    }

    return true;
  }

  private setupMasterChain() {
    if (!this.ctx) return;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);

    this.dynamicsCompressor = this.ctx.createDynamicsCompressor();
    this.dynamicsCompressor.threshold.setValueAtTime(-18, this.ctx.currentTime);
    this.dynamicsCompressor.knee.setValueAtTime(24, this.ctx.currentTime);
    this.dynamicsCompressor.ratio.setValueAtTime(6, this.ctx.currentTime);
    this.dynamicsCompressor.attack.setValueAtTime(0.005, this.ctx.currentTime);
    this.dynamicsCompressor.release.setValueAtTime(0.2, this.ctx.currentTime);

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.analyser.smoothingTimeConstant = 0.85;

    // Connect: MasterGain -> Compressor -> Analyser -> Destination
    this.masterGain.connect(this.dynamicsCompressor);
    this.dynamicsCompressor.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
  }

  public async start(): Promise<boolean> {
    const initialized = await this.initAudio();
    if (!initialized || !this.ctx || !this.masterGain) return false;

    if (this.isRunning && !this.isPaused) return true;

    if (this.isPaused) {
      this.isPaused = false;
      this.isRunning = true;
      if (this.masterGain) {
        this.masterGain.gain.setTargetAtTime(this.masterVolume, this.ctx.currentTime, 0.08);
      }
      return true;
    }

    this.isRunning = true;
    this.isPaused = false;

    if (this.isOrchestraMode) {
      this.startOrchestraSynthesizers();
    } else {
      this.startSingleSynthesizer();
    }

    return true;
  }

  public pause(): void {
    if (!this.ctx || !this.masterGain) return;
    this.isPaused = true;
    try {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setTargetAtTime(0.00001, now, 0.04);
    } catch {}
  }

  public stop(): void {
    this.isRunning = false;
    this.isPaused = false;

    if (this.rhythmTimer) {
      clearInterval(this.rhythmTimer);
      this.rhythmTimer = null;
    }

    if (this.masterGain && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setValueAtTime(0, now);
      } catch {}
    }

    this.cleanupSingleSynthesizers();
    this.cleanupOrchestraSynthesizers();
  }

  public setVolume(vol: number): void {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && !this.isPaused) {
      this.masterGain.gain.setTargetAtTime(this.masterVolume, this.ctx.currentTime, 0.05);
    }
  }

  public setVariable(variableId: VariableId): void {
    const changed = this.currentVariable !== variableId;
    this.currentVariable = variableId;
    if (changed && this.isRunning && !this.isOrchestraMode) {
      this.cleanupSingleSynthesizers();
      this.startSingleSynthesizer();
      if (this.currentDataPoint) {
        this.applyParameterMapping(this.currentVariable, this.currentDataPoint);
      }
    }
  }

  public setMapping(config: Partial<SonificationMappingConfig>): void {
    this.mappingConfig = { ...this.mappingConfig, ...config };
    if (this.isRunning && this.currentDataPoint && !this.isOrchestraMode) {
      this.applyParameterMapping(this.currentVariable, this.currentDataPoint);
    }
  }

  public updateData(data: DataPoint, variableId?: VariableId): void {
    this.currentDataPoint = data;
    if (variableId) {
      this.currentVariable = variableId;
    }

    if (!this.isRunning || !this.ctx || this.isPaused) return;

    if (this.isOrchestraMode) {
      this.updateOrchestraTrackData(this.currentVariable, data);
    } else {
      this.applyParameterMapping(this.currentVariable, data);
    }
  }

  public playDataPoint(
    variableId: VariableId,
    data: DataPoint,
    config?: SonificationMappingConfig
  ): void {
    if (config) {
      this.mappingConfig = { ...this.mappingConfig, ...config };
    }
    this.updateData(data, variableId);
  }

  public updateOrchestraYear(year: number): void {
    if (!this.ctx || !this.isOrchestraMode) return;
    this.orchestraNodes.forEach((_, variableId) => {
      const dp = nasaDataService.getDataPointForYear(variableId, year);
      this.updateOrchestraTrackData(variableId, dp);
    });
  }

  public setMuted(muted: boolean): void {
    if (!this.masterGain || !this.ctx) return;
    const target = muted ? 0.0001 : this.masterVolume;
    this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.05);
  }

  // ==========================================
  // SINGLE SYNTHESIZER SETUP & MODULATION
  // ==========================================
  private startSingleSynthesizer() {
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;

    // Filter Node
    this.filterNode = this.ctx.createBiquadFilter();
    this.filterNode.type = "lowpass";
    this.filterNode.frequency.setValueAtTime(1200, t);
    this.filterNode.Q.setValueAtTime(2.0, t);
    this.filterNode.connect(this.masterGain);

    // Primary Oscillator
    this.primaryGain = this.ctx.createGain();
    this.primaryGain.gain.setValueAtTime(0.001, t);
    this.primaryGain.connect(this.filterNode);

    this.primaryOsc = this.ctx.createOscillator();
    this.primaryOsc.type = this.getOscillatorType(this.currentVariable);
    this.primaryOsc.frequency.setValueAtTime(220, t);
    this.primaryOsc.connect(this.primaryGain);
    this.primaryOsc.start(t);

    // Sub-bass / Harmonic helper oscillator
    this.subGain = this.ctx.createGain();
    this.subGain.gain.setValueAtTime(0.001, t);
    this.subGain.connect(this.filterNode);

    this.subOsc = this.ctx.createOscillator();
    this.subOsc.type = "sine";
    this.subOsc.frequency.setValueAtTime(110, t);
    this.subOsc.connect(this.subGain);
    this.subOsc.start(t);

    // LFO for modulation (e.g. wind gusts, ocean swell)
    this.lfoGain = this.ctx.createGain();
    this.lfoGain.gain.setValueAtTime(15, t);

    this.lfoOsc = this.ctx.createOscillator();
    this.lfoOsc.type = "sine";
    this.lfoOsc.frequency.setValueAtTime(0.5, t);
    this.lfoOsc.connect(this.lfoGain);
    this.lfoGain.connect(this.primaryOsc.frequency);
    this.lfoOsc.start(t);

    // Fade in
    this.primaryGain.gain.setTargetAtTime(0.35, t, 0.1);
    this.subGain.gain.setTargetAtTime(0.2, t, 0.15);

    // Setup rhythmic percussions or noise if wind/rain/wildfires
    this.setupEnvironmentalTexture(this.currentVariable);

    if (this.currentDataPoint) {
      this.applyParameterMapping(this.currentVariable, this.currentDataPoint);
    }
  }

  private getOscillatorType(variable: VariableId): OscillatorType {
    switch (variable) {
      case "temperature":
        return "triangle";
      case "ocean":
        return "sine";
      case "sealevel":
        return "sawtooth";
      case "co2":
        return "sawtooth";
      case "vegetation":
        return "triangle";
      case "ice":
        return "sine";
      case "pressure":
        return "triangle";
      case "wind":
      case "precipitation":
      case "wildfire":
      case "clouds":
      default:
        return "sine";
    }
  }

  private setupEnvironmentalTexture(variable: VariableId) {
    if (!this.ctx || !this.masterGain) return;

    if (this.rhythmTimer) {
      clearInterval(this.rhythmTimer);
      this.rhythmTimer = null;
    }

    if (variable === "wind" || variable === "clouds") {
      this.startFilteredNoise();
    } else if (variable === "precipitation") {
      this.startRainDrops();
    } else if (variable === "wildfire") {
      this.startWildfireCrackles();
    }
  }

  private startFilteredNoise() {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = noiseBuffer;
    this.noiseNode.loop = true;

    this.noiseFilter = this.ctx.createBiquadFilter();
    this.noiseFilter.type = "bandpass";
    this.noiseFilter.frequency.setValueAtTime(450, this.ctx.currentTime);
    this.noiseFilter.Q.setValueAtTime(3.0, this.ctx.currentTime);

    this.noiseGain = this.ctx.createGain();
    this.noiseGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

    this.noiseNode.connect(this.noiseFilter);
    this.noiseFilter.connect(this.noiseGain);
    this.noiseGain.connect(this.masterGain);

    this.noiseNode.start();
  }

  private startRainDrops() {
    if (!this.ctx || !this.masterGain) return;

    const intervalMs = 120; // Will be scaled dynamically by precipitation rate
    this.rhythmTimer = window.setInterval(() => {
      if (!this.ctx || !this.masterGain || this.isPaused || !this.isRunning) return;

      const norm = this.currentDataPoint ? this.currentDataPoint.normalized : 0.5;
      const t = this.ctx.currentTime;

      // Soft water droplet blip
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const pan = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;

      const baseDropFreq = 800 + Math.random() * 900 + norm * 400;
      osc.type = "sine";
      osc.frequency.setValueAtTime(baseDropFreq, t);
      osc.frequency.exponentialRampToValueAtTime(baseDropFreq * 1.5, t + 0.04);
      osc.frequency.exponentialRampToValueAtTime(baseDropFreq * 0.4, t + 0.09);

      const dropVol = (0.05 + norm * 0.12) * (0.8 + Math.random() * 0.4);
      gain.gain.setValueAtTime(dropVol, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);

      if (pan) {
        pan.pan.setValueAtTime((Math.random() * 2 - 1) * 0.8, t);
        osc.connect(gain);
        gain.connect(pan);
        pan.connect(this.masterGain);
      } else {
        osc.connect(gain);
        gain.connect(this.masterGain);
      }

      osc.start(t);
      osc.stop(t + 0.1);
    }, intervalMs);
  }

  private startWildfireCrackles() {
    if (!this.ctx || !this.masterGain) return;

    this.rhythmTimer = window.setInterval(() => {
      if (!this.ctx || !this.masterGain || this.isPaused || !this.isRunning) return;

      const norm = this.currentDataPoint ? this.currentDataPoint.normalized : 0.5;
      // Probability of crackle burst scales with fire activity
      if (Math.random() > 0.4 + (1 - norm) * 0.5) {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(140 + Math.random() * 450, t);

        const crackleVol = 0.08 + norm * 0.15;
        gain.gain.setValueAtTime(crackleVol, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.025);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.03);
      }
    }, 45);
  }

  // ==========================================
  // SCIENTIFIC FEATURE PARAMETER MAPPING
  // ==========================================
  private applyParameterMapping(variable: VariableId, data: DataPoint) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const norm = Math.max(0, Math.min(1, data.normalized));
    const effectiveNorm = this.mappingConfig.pitchInverted ? 1 - norm : norm;
    const sens = this.mappingConfig.sensitivity;

    switch (variable) {
      case "temperature": {
        // Higher temperature -> Higher pitch, richer harmonics
        const minF = 180;
        const maxF = 680 * sens;
        const freq = minF + effectiveNorm * (maxF - minF);
        if (this.primaryOsc) this.primaryOsc.frequency.setTargetAtTime(freq, t, 0.06);
        if (this.subOsc) this.subOsc.frequency.setTargetAtTime(freq * 0.5, t, 0.06);
        if (this.filterNode) {
          this.filterNode.frequency.setTargetAtTime(1000 + effectiveNorm * 3800, t, 0.08);
          this.filterNode.Q.setTargetAtTime(1.5 + effectiveNorm * 3.5, t, 0.08);
        }
        if (this.lfoOsc) {
          // Rapid temperature anomaly -> faster vibrato modulation
          this.lfoOsc.frequency.setTargetAtTime(1.0 + effectiveNorm * 5.0, t, 0.1);
        }
        break;
      }

      case "ocean": {
        // Deep sub-bass resonance, lower frequency and heavy low-pass
        const minF = 55;
        const maxF = 140;
        const freq = maxF - effectiveNorm * (maxF - minF) * sens;
        if (this.primaryOsc) this.primaryOsc.frequency.setTargetAtTime(Math.max(45, freq), t, 0.08);
        if (this.subOsc) this.subOsc.frequency.setTargetAtTime(Math.max(30, freq * 0.5), t, 0.08);
        if (this.filterNode) {
          this.filterNode.frequency.setTargetAtTime(250 + (1 - effectiveNorm) * 450, t, 0.1);
          this.filterNode.Q.setTargetAtTime(3.5 + effectiveNorm * 2.0, t, 0.1);
        }
        if (this.lfoOsc) {
          this.lfoOsc.frequency.setTargetAtTime(0.15 + effectiveNorm * 0.4, t, 0.1); // slow ocean swell
        }
        break;
      }

      case "sealevel": {
        // Cumulative volume rise -> ascending pitch and rising choral harmonic density
        const minF = 110;
        const maxF = 440 * sens;
        const freq = minF + effectiveNorm * (maxF - minF);
        if (this.primaryOsc) this.primaryOsc.frequency.setTargetAtTime(freq, t, 0.06);
        if (this.subOsc) this.subOsc.frequency.setTargetAtTime(freq * 0.75, t, 0.06);
        if (this.filterNode) {
          this.filterNode.frequency.setTargetAtTime(600 + effectiveNorm * 2000, t, 0.08);
        }
        break;
      }

      case "co2": {
        // Rising fundamental pitch with dissonant tension as CO2 increases beyond 350 ppm
        const minF = 160;
        const maxF = 520 * sens;
        const freq = minF + effectiveNorm * (maxF - minF);
        if (this.primaryOsc) this.primaryOsc.frequency.setTargetAtTime(freq, t, 0.06);
        // Intentional microtonal detuning (beating effect) representing atmospheric tension
        if (this.subOsc) {
          const detuneHz = freq * (1 + (effectiveNorm * 0.08));
          this.subOsc.frequency.setTargetAtTime(detuneHz, t, 0.06);
        }
        if (this.filterNode) {
          this.filterNode.frequency.setTargetAtTime(900 + effectiveNorm * 2800, t, 0.08);
        }
        break;
      }

      case "wind": {
        // Wind speed -> playback/modulation rate & noise filter resonance
        const rate = 0.4 + effectiveNorm * 4.2 * sens;
        if (this.lfoOsc) this.lfoOsc.frequency.setTargetAtTime(rate, t, 0.08);
        if (this.noiseFilter) {
          this.noiseFilter.frequency.setTargetAtTime(250 + effectiveNorm * 2200, t, 0.08);
          this.noiseFilter.Q.setTargetAtTime(2.0 + effectiveNorm * 6.0, t, 0.08);
        }
        if (this.primaryOsc) {
          this.primaryOsc.frequency.setTargetAtTime(120 + effectiveNorm * 380, t, 0.08);
        }
        break;
      }

      case "precipitation": {
        // Rainfall intensity -> rhythmic density & drop volume
        if (this.primaryOsc) {
          this.primaryOsc.frequency.setTargetAtTime(320 + effectiveNorm * 240, t, 0.08);
        }
        if (this.filterNode) {
          this.filterNode.frequency.setTargetAtTime(1200 + effectiveNorm * 2600, t, 0.08);
        }
        break;
      }

      case "vegetation": {
        // NDVI -> harmonic brightness, lush pentatonic chord overtone
        const baseF = 196; // G3
        const freq = baseF * (1 + effectiveNorm * 0.5 * sens);
        if (this.primaryOsc) this.primaryOsc.frequency.setTargetAtTime(freq, t, 0.08);
        if (this.subOsc) this.subOsc.frequency.setTargetAtTime(freq * 1.5, t, 0.08); // Perfect 5th
        if (this.filterNode) {
          this.filterNode.frequency.setTargetAtTime(1400 + effectiveNorm * 3600, t, 0.08);
          this.filterNode.Q.setTargetAtTime(1.2, t, 0.08);
        }
        break;
      }

      case "wildfire": {
        // Fire radiative power -> sonic tension, pulse intensity
        const freq = 220 + effectiveNorm * 480 * sens;
        if (this.primaryOsc) this.primaryOsc.frequency.setTargetAtTime(freq, t, 0.04);
        if (this.subOsc) this.subOsc.frequency.setTargetAtTime(freq * 0.94, t, 0.04); // dissonant rub
        if (this.filterNode) {
          this.filterNode.frequency.setTargetAtTime(1600 + effectiveNorm * 3200, t, 0.05);
        }
        break;
      }

      case "ice": {
        // Crystalline high-frequency glass chime resonance
        const minF = 587.33; // D5
        const maxF = 1174.66; // D6
        const freq = minF + effectiveNorm * (maxF - minF) * sens;
        if (this.primaryOsc) this.primaryOsc.frequency.setTargetAtTime(freq, t, 0.06);
        if (this.subOsc) this.subOsc.frequency.setTargetAtTime(freq * 2.0, t, 0.06); // Upper octave
        if (this.filterNode) {
          this.filterNode.frequency.setTargetAtTime(2800 + effectiveNorm * 3000, t, 0.08);
          this.filterNode.Q.setTargetAtTime(6.0, t, 0.08); // high bell resonance
        }
        break;
      }

      case "clouds": {
        // Diffused airy shimmer & wide stereo pad
        if (this.primaryOsc) this.primaryOsc.frequency.setTargetAtTime(261.63, t, 0.1);
        if (this.filterNode) {
          this.filterNode.frequency.setTargetAtTime(600 + effectiveNorm * 1800, t, 0.1);
        }
        break;
      }

      case "pressure": {
        // Grounding barometric bass drone
        const freq = 110 + (effectiveNorm - 0.5) * 40 * sens;
        if (this.primaryOsc) this.primaryOsc.frequency.setTargetAtTime(freq, t, 0.08);
        if (this.subOsc) this.subOsc.frequency.setTargetAtTime(55, t, 0.08);
        break;
      }
    }
  }

  // ==========================================
  // MULTI-VARIABLE "EARTH ORCHESTRA" MODE
  // ==========================================
  public setOrchestraMode(enabled: boolean, tracks: OrchestraTrack[]): void {
    if (this.isOrchestraMode === enabled) {
      if (enabled) this.updateOrchestraTracks(tracks);
      return;
    }

    this.isOrchestraMode = enabled;
    if (this.isRunning) {
      if (enabled) {
        this.cleanupSingleSynthesizers();
        this.startOrchestraSynthesizers(tracks);
      } else {
        this.cleanupOrchestraSynthesizers();
        this.startSingleSynthesizer();
      }
    }
  }

  private startOrchestraSynthesizers(tracks?: OrchestraTrack[]) {
    if (!this.ctx || !this.masterGain) return;

    // Default tracks if not provided
    const defaultTracks: OrchestraTrack[] = tracks || [
      { variableId: "temperature", name: "Temperature", role: "Melody", enabled: true, volume: 0.8, solo: false, color: "#f97316", timbre: "FM Lead" },
      { variableId: "ocean", name: "Ocean Heat", role: "Sub Bass", enabled: true, volume: 0.85, solo: false, color: "#0284c7", timbre: "Sub Sine" },
      { variableId: "wind", name: "Wind Speed", role: "Noise Rhythm", enabled: true, volume: 0.6, solo: false, color: "#38bdf8", timbre: "Wind Sweeps" },
      { variableId: "precipitation", name: "Precipitation", role: "Percussion Droplets", enabled: true, volume: 0.7, solo: false, color: "#3b82f6", timbre: "Water Drops" },
      { variableId: "vegetation", name: "Vegetation", role: "Harmony Pad", enabled: true, volume: 0.65, solo: false, color: "#10b981", timbre: "Lush Chords" },
      { variableId: "wildfire", name: "Wildfires", role: "Granular Texture", enabled: false, volume: 0.5, solo: false, color: "#ef4444", timbre: "Crackle Texture" },
    ];

    for (const tr of defaultTracks) {
      this.createOrchestraVoice(tr);
    }
  }

  private createOrchestraVoice(track: OrchestraTrack) {
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    let baseFreq = 220;
    let waveType: OscillatorType = "sine";

    switch (track.role) {
      case "Melody": // Temperature
        waveType = "triangle";
        baseFreq = 330;
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(2400, t);
        break;
      case "Sub Bass": // Ocean
        waveType = "sine";
        baseFreq = 65;
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(300, t);
        break;
      case "Harmony Pad": // Vegetation
        waveType = "triangle";
        baseFreq = 196; // G3
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(1400, t);
        break;
      case "Noise Rhythm": // Wind
        waveType = "sawtooth";
        baseFreq = 110;
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(600, t);
        break;
      case "Granular Texture": // Wildfire
        waveType = "sawtooth";
        baseFreq = 440;
        filter.type = "highpass";
        filter.frequency.setValueAtTime(1800, t);
        break;
      default:
        waveType = "sine";
        baseFreq = 220;
        break;
    }

    osc.type = waveType;
    osc.frequency.setValueAtTime(baseFreq, t);

    const initialGain = track.enabled ? track.volume * 0.3 : 0.0001;
    gain.gain.setValueAtTime(initialGain, t);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);

    this.orchestraNodes.set(track.variableId, { osc, gain, filter });
  }

  public updateOrchestraTracks(tracks: OrchestraTrack[]): void {
    if (!this.ctx) return;
    const hasSolo = tracks.some((t) => t.solo);

    for (const tr of tracks) {
      const voice = this.orchestraNodes.get(tr.variableId);
      if (voice && voice.gain) {
        const isAudible = hasSolo ? tr.solo : tr.enabled;
        const targetGain = isAudible ? tr.volume * 0.35 : 0.0001;
        voice.gain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.06);
      }
    }
  }

  private updateOrchestraTrackData(variableId: VariableId, data: DataPoint) {
    if (!this.ctx) return;
    const voice = this.orchestraNodes.get(variableId);
    if (!voice || !voice.osc) return;

    const t = this.ctx.currentTime;
    const norm = data.normalized;

    if (variableId === "temperature") {
      voice.osc.frequency.setTargetAtTime(220 + norm * 500, t, 0.06);
    } else if (variableId === "ocean") {
      voice.osc.frequency.setTargetAtTime(50 + norm * 45, t, 0.08);
    } else if (variableId === "vegetation") {
      voice.osc.frequency.setTargetAtTime(165 + norm * 130, t, 0.08);
    } else if (variableId === "wind") {
      voice.osc.frequency.setTargetAtTime(90 + norm * 180, t, 0.06);
    } else if (voice.osc) {
      voice.osc.frequency.setTargetAtTime(200 + norm * 400, t, 0.06);
    }
  }

  // ==========================================
  // CLEANUP & UTILITIES
  // ==========================================
  private cleanupSingleSynthesizers() {
    if (this.primaryOsc) {
      try {
        this.primaryOsc.stop();
        this.primaryOsc.disconnect();
      } catch {}
      this.primaryOsc = null;
    }
    if (this.subOsc) {
      try {
        this.subOsc.stop();
        this.subOsc.disconnect();
      } catch {}
      this.subOsc = null;
    }
    if (this.lfoOsc) {
      try {
        this.lfoOsc.stop();
        this.lfoOsc.disconnect();
      } catch {}
      this.lfoOsc = null;
    }
    if (this.noiseNode) {
      try {
        this.noiseNode.stop();
        this.noiseNode.disconnect();
      } catch {}
      this.noiseNode = null;
    }
    if (this.primaryGain) {
      try { this.primaryGain.disconnect(); } catch {}
      this.primaryGain = null;
    }
    if (this.subGain) {
      try { this.subGain.disconnect(); } catch {}
      this.subGain = null;
    }
    if (this.lfoGain) {
      try { this.lfoGain.disconnect(); } catch {}
      this.lfoGain = null;
    }
    if (this.filterNode) {
      try { this.filterNode.disconnect(); } catch {}
      this.filterNode = null;
    }
    if (this.noiseGain) {
      try { this.noiseGain.disconnect(); } catch {}
      this.noiseGain = null;
    }
    if (this.noiseFilter) {
      try { this.noiseFilter.disconnect(); } catch {}
      this.noiseFilter = null;
    }
  }

  private cleanupOrchestraSynthesizers() {
    this.orchestraNodes.forEach((voice) => {
      if (voice.osc) {
        try {
          voice.osc.stop();
          voice.osc.disconnect();
        } catch {}
      }
      if (voice.gain) {
        try {
          voice.gain.disconnect();
        } catch {}
      }
    });
    this.orchestraNodes.clear();
  }

  public getAnalyserNode(): AnalyserNode | null {
    return this.analyser;
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  public getIsPaused(): boolean {
    return this.isPaused;
  }
}

// Global Singleton
export const sonificationEngine = new SonificationEngine();
