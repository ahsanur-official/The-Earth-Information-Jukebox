import React from "react";
import { DatasetMetadata } from "../types";
import { BookOpen, ShieldAlert, CheckCircle, HelpCircle } from "lucide-react";

interface ScienceExplainerProps {
  metadata: DatasetMetadata;
}

export const ScienceExplainer: React.FC<ScienceExplainerProps> = ({ metadata }) => {
  return (
    <div className="w-full glass-panel rounded-2xl p-5 sm:p-6 border border-cyan-500/25 shadow-2xl">
      {/* Header */}
      <div className="pb-4 border-b border-cyan-500/20 mb-6">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          <span className="text-xs font-mono text-cyan-400 font-semibold tracking-wider uppercase">
            SCIENCE & AUDITORY LITERACY
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-xs font-mono text-slate-300">
            {metadata.name}
          </span>
        </div>
        <h2 className="font-display font-extrabold text-2xl text-white mt-1">
          SCIENTIFIC EXPLAINER & AUDITORY GUIDE
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl font-sans">
          Understand the physical Earth science phenomena and learn how to interpret what your ears are detecting.
        </p>
      </div>

      {/* 4 Core Q&A Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Card 1: What is it? */}
        <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase font-bold mb-1.5">
            <HelpCircle className="w-4 h-4" />
            <span>1. What is this variable?</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed font-sans">
            {metadata.scientificDescription}
          </p>
          <div className="mt-3 text-xs font-mono text-slate-400 bg-slate-900/80 p-2 rounded border border-slate-800">
            Baseline: <strong className="text-slate-200">{metadata.baseline}</strong>
          </div>
        </div>

        {/* Card 2: Why it matters */}
        <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 text-xs font-mono text-sky-400 uppercase font-bold mb-1.5">
            <HelpCircle className="w-4 h-4" />
            <span>2. Why does it matter to Earth?</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed font-sans">
            Earth's climate is an intricately balanced thermodynamic system. Changes in {metadata.shortName.toLowerCase()} affect energy retention, atmospheric circulation patterns, regional ecosystems, and weather volatility across global scales.
          </p>
          <div className="mt-3 text-xs font-mono text-slate-400 bg-slate-900/80 p-2 rounded border border-slate-800">
            Observed Range: <strong className="text-slate-200">{metadata.min} to {metadata.max} {metadata.unit}</strong>
          </div>
        </div>

        {/* Card 3: How we sonify it */}
        <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 text-xs font-mono text-purple-400 uppercase font-bold mb-1.5">
            <HelpCircle className="w-4 h-4" />
            <span>3. How do we sonify it?</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed font-sans">
            {metadata.audioMappingDescription}. Rather than arbitrary pitch assignments, our synthesis algorithm scales dynamically with normalized physical bounds to preserve relational proportions.
          </p>
          <div className="mt-3 text-xs font-mono text-slate-400 bg-slate-900/80 p-2 rounded border border-slate-800">
            Synthesis Method: <strong className="text-slate-200">Continuous DSP Waveform Synthesis</strong>
          </div>
        </div>

        {/* Card 4: What the sound means */}
        <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase font-bold mb-1.5">
            <HelpCircle className="w-4 h-4" />
            <span>4. What does the sound tell your ears?</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed font-sans">
            When you hear rising pitch or quickening flutter, physical energy in the Earth system has increased relative to baseline. A drop in frequency or harmonic thinness signals physical depletion or cold anomaly.
          </p>
          <div className="mt-3 text-xs font-mono text-slate-400 bg-slate-900/80 p-2 rounded border border-slate-800">
            Sonic Indicator: <strong className="text-slate-200">Pitch & Harmonic Intensity = Planetary State</strong>
          </div>
        </div>
      </div>

      {/* Scientific Integrity & Ethics Notice */}
      <div className="bg-cyan-950/30 p-4 rounded-xl border border-cyan-500/30 flex items-start gap-3 text-xs font-sans">
        <ShieldAlert className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <div className="font-bold text-slate-200 uppercase font-mono tracking-wider mb-0.5">
            Scientific Integrity & Sonification Ethics
          </div>
          <p className="text-slate-300 leading-relaxed">
            Sonification is an interpretive psychoacoustic translation tool designed for accessibility, multi-sensory education, and pattern detection. It is <em>not</em> a direct raw acoustic recording of space or Earth. We maintain strict separation between raw satellite telemetry, mathematical calibration, and synthesized sound.
          </p>
        </div>
      </div>
    </div>
  );
};
