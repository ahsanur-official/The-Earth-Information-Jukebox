import React, { useState } from "react";
import { Sliders, Cpu, Activity, Volume2, ArrowRight, CheckCircle2, Waves, Radio } from "lucide-react";

export const AudioMappingGuide: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(1);

  const steps = [
    {
      step: 1,
      title: "1. Earth Observation Data",
      subtitle: "Satellites & Ground Stations",
      description:
        "Raw physical measurements collected by NASA missions (MODIS, Landsat, GISTEMP, OCO-2, SMAP). Measurements come in varied physical units: °C anomalies, ppm CO2, million km² ice extent, and kg/m² rainfall.",
      technical:
        "Input Data: Raw floating point numbers [x_raw] with varying physical boundaries [min_bound, max_bound].",
      icon: <Radio className="w-5 h-5 text-cyan-400" />,
    },
    {
      step: 2,
      title: "2. Mathematical Normalization",
      subtitle: "Dimensionless Range [0.0 - 1.0]",
      description:
        "To map disparate physical phenomena uniformly into audio synthesis algorithms without clipping or distortion, values are calibrated against 45-year historical min/max boundaries: Norm = (X_raw - Min) / (Max - Min).",
      technical:
        "Formula: normalized = Math.max(0, Math.min(1, (val - minBound) / (maxBound - minBound)))",
      icon: <Cpu className="w-5 h-5 text-sky-400" />,
    },
    {
      step: 3,
      title: "3. Scientific Feature Mapping",
      subtitle: "Psychoacoustic Association",
      description:
        "Mappings follow natural physical intuitions: Temperature maps to pitch & harmonic density; ocean thermal inertia maps to deep sub-bass; wind speed maps to modulation rate and noise bandpass; precipitation maps to droplet density.",
      technical:
        "Mapping Matrix: Frequency = baseFreq + (norm * (maxFreq - baseFreq) * sensitivity). Timbre = oscillator waveform selection.",
      icon: <Sliders className="w-5 h-5 text-purple-400" />,
    },
    {
      step: 4,
      title: "4. Real-Time DSP Audio Synthesis",
      subtitle: "Web Audio API Engine",
      description:
        "Sound is synthesized dynamically in real-time within the browser using Web Audio API nodes: Oscillators, BiquadFilterNodes, GainNodes, Dynamic Compressors, and AnalyserNodes. No pre-recorded MP3 tracks.",
      technical:
        "Audio Graph: OscillatorNode -> BiquadFilterNode -> GainNode -> DynamicsCompressorNode -> AnalyserNode -> AudioDestination.",
      icon: <Waves className="w-5 h-5 text-emerald-400" />,
    },
    {
      step: 5,
      title: "5. Multi-Sensory Experience",
      subtitle: "Sight + Sound Synthesis",
      description:
        "Visual telemetry (3D globe, oscilloscope, and historical charts) sync with the audio clock. This enables both sighted and visually impaired researchers and learners to experience Earth science data simultaneously.",
      technical:
        "Outputs: Synchronized 3D WebGL render + Real-time 1024-bin FFT spectrum + Live accessible screen-reader auditory captions.",
      icon: <Volume2 className="w-5 h-5 text-amber-400" />,
    },
  ];

  return (
    <div id="mapping" className="w-full glass-panel rounded-2xl p-5 sm:p-6 border border-cyan-500/25 shadow-2xl">
      {/* Header */}
      <div className="pb-4 border-b border-cyan-500/20 mb-6">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          <span className="text-xs font-mono text-cyan-400 font-semibold tracking-wider uppercase">
            SCIENTIFIC METHODOLOGY
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-xs font-mono text-slate-300">
            TRANSLATION BLUEPRINT
          </span>
        </div>
        <h2 className="font-display font-extrabold text-2xl text-white mt-1">
          HOW EARTH BECOMES SOUND
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl font-sans">
          The step-by-step pipeline from NASA satellite measurements to real-time audio synthesis.
        </p>
      </div>

      {/* Steps Navigation Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 mb-6">
        {steps.map((s) => (
          <button
            key={s.step}
            onClick={() => setActiveStep(s.step)}
            className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
              activeStep === s.step
                ? "bg-cyan-950/60 border-cyan-400 shadow-lg shadow-cyan-500/10"
                : "bg-slate-950/50 border-slate-800/80 hover:bg-slate-900/40 text-slate-400"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-400">
                STAGE 0{s.step}
              </span>
              {s.icon}
            </div>
            <div className="font-bold text-xs text-slate-100 line-clamp-1">
              {s.title.split(". ")[1]}
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-0.5 line-clamp-1">
              {s.subtitle}
            </div>
          </button>
        ))}
      </div>

      {/* Active Step Deep-Dive Card */}
      {(() => {
        const current = steps[activeStep - 1];
        return (
          <div className="bg-slate-950/90 rounded-xl p-5 border border-cyan-500/30">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <span className="text-xs font-mono text-cyan-400 uppercase font-bold tracking-wider">
                  STAGE 0{current.step} IN DETAIL
                </span>
                <h3 className="font-display font-bold text-xl text-white mt-0.5">
                  {current.title}
                </h3>
                <p className="text-xs font-mono text-slate-400">{current.subtitle}</p>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                {current.icon}
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed font-sans mb-4">
              {current.description}
            </p>

            <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 font-mono text-xs text-cyan-300">
              <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">
                ENGINEERING SPECIFICATION
              </div>
              <div>{current.technical}</div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
