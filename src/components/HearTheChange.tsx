import React, { useState } from "react";
import { VariableId, DatasetMetadata } from "../types";
import { nasaDataService } from "../services/NASADataService";
import { ArrowRight, Play, RefreshCw, Sparkles, TrendingUp } from "lucide-react";

interface HearTheChangeProps {
  currentVariable: VariableId;
  variableMetadata: DatasetMetadata;
  onPreviewYear: (year: number) => void;
  onMorphTransition: (yearA: number, yearB: number) => void;
}

export const HearTheChange: React.FC<HearTheChangeProps> = ({
  currentVariable,
  variableMetadata,
  onPreviewYear,
  onMorphTransition,
}) => {
  const [yearA, setYearA] = useState<number>(1985);
  const [yearB, setYearB] = useState<number>(2024);
  const [isMorphing, setIsMorphing] = useState<boolean>(false);

  const ptA = nasaDataService.getDataPointForYear(currentVariable, yearA);
  const ptB = nasaDataService.getDataPointForYear(currentVariable, yearB);

  const deltaValue = (ptB.value - ptA.value).toFixed(2);
  const deltaNorm = (ptB.normalized - ptA.normalized).toFixed(2);
  const freqDiff = Math.round((ptB.normalized - ptA.normalized) * 450);

  const handleTriggerMorph = () => {
    setIsMorphing(true);
    onMorphTransition(yearA, yearB);
    setTimeout(() => {
      setIsMorphing(false);
    }, 4000);
  };

  return (
    <div id="change" className="w-full glass-panel rounded-2xl p-5 sm:p-6 border border-cyan-500/25 shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-cyan-500/20 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <span className="text-xs font-mono text-cyan-400 font-semibold tracking-wider uppercase">
              TEMPORAL COMPARISON ENGINE
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              HEAR THE CHANGE
            </span>
          </div>
          <h2 className="font-display font-extrabold text-2xl text-white mt-1">
            LISTEN TO EARTH CHANGE
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl font-sans">
            A/B sonic comparison between historical baseline and modern era. Hear the audible pitch shift and harmonic tension caused by physical environmental change.
          </p>
        </div>

        <button
          onClick={handleTriggerMorph}
          disabled={isMorphing}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-lg transition transform active:scale-95 text-xs font-mono disabled:opacity-50"
        >
          {isMorphing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>MORPHING AUDIO SWEEP...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-slate-950" />
              <span>PLAY A/B AUDITORY MORPH</span>
            </>
          )}
        </button>
      </div>

      {/* Comparison Split Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* Baseline Period (Year A) */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400 uppercase font-bold">
              HISTORICAL BASELINE
            </span>
            <select
              value={yearA}
              onChange={(e) => setYearA(parseInt(e.target.value, 10))}
              className="bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-xs rounded px-2 py-1"
            >
              {[1980, 1985, 1990, 1995, 2000].map((y) => (
                <option key={y} value={y}>
                  Year {y}
                </option>
              ))}
            </select>
          </div>

          <div className="text-3xl font-extrabold font-display text-white mb-1">
            {ptA.value > 0 && variableMetadata.unit.includes("Anomaly") ? `+${ptA.value}` : ptA.value}
            <span className="text-xs font-mono text-slate-400 ml-1.5">{variableMetadata.unit}</span>
          </div>

          <div className="text-xs font-mono text-slate-400 mb-3">
            Normalized Index: <span className="text-slate-200">{ptA.normalized.toFixed(3)}</span>
          </div>

          <button
            onClick={() => onPreviewYear(yearA)}
            className="w-full py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-mono text-cyan-300 transition flex items-center justify-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Hear Year {yearA}</span>
          </button>
        </div>

        {/* Delta (Δ) Auditory Difference Box */}
        <div className="bg-gradient-to-b from-cyan-950/40 to-slate-950/80 p-4 rounded-xl border border-cyan-500/30 text-center flex flex-col justify-center">
          <div className="text-[11px] font-mono text-cyan-400 uppercase font-semibold mb-1">
            AUDITORY & PHYSICAL DELTA (Δ)
          </div>

          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-cyan-300 my-1">
            {parseFloat(deltaValue) > 0 ? `+${deltaValue}` : deltaValue} {variableMetadata.unit}
          </div>

          <div className="text-xs font-mono text-amber-300 mb-2">
            Pitch Frequency Shift: {freqDiff > 0 ? `+${freqDiff} Hz` : `${freqDiff} Hz`}
          </div>

          <div className="text-[11px] text-slate-300 font-sans leading-snug">
            {parseFloat(deltaValue) > 0
              ? "Notice the higher frequency and heightened harmonic tension in the modern soundscape."
              : "Notice the lowering pitch and shifting resonance corresponding to physical decline."}
          </div>
        </div>

        {/* Modern Era (Year B) */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400 uppercase font-bold">
              MODERN OBSERVATION
            </span>
            <select
              value={yearB}
              onChange={(e) => setYearB(parseInt(e.target.value, 10))}
              className="bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-xs rounded px-2 py-1"
            >
              {[2010, 2015, 2020, 2023, 2024, 2025].map((y) => (
                <option key={y} value={y}>
                  Year {y}
                </option>
              ))}
            </select>
          </div>

          <div className="text-3xl font-extrabold font-display text-white mb-1">
            {ptB.value > 0 && variableMetadata.unit.includes("Anomaly") ? `+${ptB.value}` : ptB.value}
            <span className="text-xs font-mono text-slate-400 ml-1.5">{variableMetadata.unit}</span>
          </div>

          <div className="text-xs font-mono text-slate-400 mb-3">
            Normalized Index: <span className="text-slate-200">{ptB.normalized.toFixed(3)}</span>
          </div>

          <button
            onClick={() => onPreviewYear(yearB)}
            className="w-full py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-mono text-cyan-300 transition flex items-center justify-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Hear Year {yearB}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
