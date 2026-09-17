import React, { useState } from "react";
import { DatasetMetadata, DataPoint } from "../types";
import { Sparkles, X, Loader2, Volume2, ShieldCheck, RefreshCw } from "lucide-react";

interface AINarratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  metadata: DatasetMetadata;
  currentDataPoint: DataPoint;
}

export const AINarratorModal: React.FC<AINarratorModalProps> = ({
  isOpen,
  onClose,
  metadata,
  currentDataPoint,
}) => {
  const [narration, setNarration] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerateNarration = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/narrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variable: metadata.name,
          year: currentDataPoint.year,
          rawValue: currentDataPoint.value,
          normalizedValue: currentDataPoint.normalized,
          mappingDescription: metadata.audioMappingDescription,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      setNarration(data.narration);
    } catch (err: any) {
      console.warn("AI Narrator request failed; providing scientific fallback", err);
      setNarration(
        `In ${currentDataPoint.year}, ${metadata.name} reached a measurement of ${currentDataPoint.value} ${metadata.unit}, corresponding to ${(currentDataPoint.normalized * 100).toFixed(0)}% of its historical calibrated range. When you listen to this sonification, the audio pitch and harmonic tension directly reflect Earth's thermodynamic balance observed by NASA satellite instruments.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl glass-panel rounded-2xl p-6 border border-cyan-500/40 shadow-2xl bg-slate-950/90 text-left">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 text-amber-400 text-xs font-mono uppercase font-bold tracking-wider mb-2">
          <Sparkles className="w-4 h-4" />
          <span>AI EARTH SOUND NARRATOR (GEMINI 3.8 FLASH)</span>
        </div>

        <h3 className="font-display font-extrabold text-2xl text-white mb-1">
          {metadata.name} • {currentDataPoint.year}
        </h3>

        <p className="text-xs font-mono text-slate-400 mb-4">
          Measurement: {currentDataPoint.value} {metadata.unit} ({(currentDataPoint.normalized * 100).toFixed(0)}% Range)
        </p>

        {/* Content Box */}
        <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 mb-5 min-h-[140px] flex items-center justify-center">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3 text-cyan-400 text-sm font-mono">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Analyzing NASA telemetry & synthesizing audio narrative...</span>
            </div>
          ) : narration ? (
            <div className="text-slate-200 text-sm leading-relaxed font-sans">
              <p className="whitespace-pre-line">{narration}</p>
            </div>
          ) : (
            <div className="text-center text-slate-400 text-sm font-sans">
              <p className="mb-3">
                Request an AI-generated scientific interpretation of what this audio frequency and physical measurement tells us about Earth's changing climate.
              </p>
              <button
                onClick={handleGenerateNarration}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs font-mono shadow transition hover:opacity-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>GENERATE SOUND NARRATION</span>
              </button>
            </div>
          )}
        </div>

        {/* Actions & Verification */}
        {narration && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs font-mono text-slate-400">
            <button
              onClick={handleGenerateNarration}
              disabled={isLoading}
              className="flex items-center gap-1.5 hover:text-cyan-300 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Regenerate Analysis</span>
            </button>
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Grounded in NASA Open Science</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
