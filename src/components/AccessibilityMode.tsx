import React from "react";
import { AccessibilitySettings, DatasetMetadata, DataPoint } from "../types";
import { Eye, Volume2, Keyboard, Sun, Sparkles, Check } from "lucide-react";

interface AccessibilityModeProps {
  settings: AccessibilitySettings;
  onUpdateSettings: (newSettings: Partial<AccessibilitySettings>) => void;
  currentMetadata: DatasetMetadata;
  currentDataPoint: DataPoint;
  isPlaying: boolean;
}

export const AccessibilityMode: React.FC<AccessibilityModeProps> = ({
  settings,
  onUpdateSettings,
  currentMetadata,
  currentDataPoint,
  isPlaying,
}) => {
  // Generate descriptive dynamic auditory caption
  const generateAuditoryCaption = (): string => {
    if (!isPlaying) {
      return `Sonification is currently paused. Ready to sonify ${currentMetadata.name} for the year ${currentDataPoint.year}. Press Spacebar or the Start button to begin.`;
    }

    const norm = (currentDataPoint.normalized * 100).toFixed(0);
    const valText = `${currentDataPoint.value > 0 && currentMetadata.unit.includes("Anomaly") ? `+${currentDataPoint.value}` : currentDataPoint.value} ${currentMetadata.unit}`;

    return `Now actively sonifying ${currentMetadata.name} for the year ${currentDataPoint.year}. Physical measurement: ${valText} (${norm}% of historical range). The audio synthesizer is generating an audible pitch and harmonic overtone corresponding to ${currentMetadata.audioMappingDescription.toLowerCase()}.`;
  };

  return (
    <div className="w-full glass-panel rounded-2xl p-5 border border-cyan-500/25 shadow-2xl mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-cyan-500/20 mb-4">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-cyan-400" />
          <h3 className="font-display font-bold text-base text-white">
            ACCESSIBILITY & AUDITORY CAPTION MATRIX
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              onUpdateSettings({ highContrast: !settings.highContrast })
            }
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono border transition ${
              settings.highContrast
                ? "bg-cyan-500 text-slate-950 border-cyan-400 font-bold"
                : "bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500"
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>High Contrast</span>
          </button>

          <button
            onClick={() =>
              onUpdateSettings({ captionsEnabled: !settings.captionsEnabled })
            }
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono border transition ${
              settings.captionsEnabled
                ? "bg-cyan-500 text-slate-950 border-cyan-400 font-bold"
                : "bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500"
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Live Audio Captions</span>
          </button>
        </div>
      </div>

      {/* Live Auditory Text Caption Box (ARIA live region) */}
      {settings.captionsEnabled && (
        <div
          role="status"
          aria-live="polite"
          className="bg-slate-950/90 rounded-xl p-4 border border-cyan-500/40 mb-4 text-left shadow-inner"
        >
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase font-bold mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>LIVE AUDITORY CAPTION (SCREEN-READER SYNCHRONIZED)</span>
          </div>
          <p className="text-sm sm:text-base font-sans text-slate-100 leading-relaxed">
            {generateAuditoryCaption()}
          </p>
        </div>
      )}

      {/* Keyboard Shortcuts Reference */}
      <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800 text-xs font-mono text-slate-400 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-300 font-semibold">
          <Keyboard className="w-4 h-4 text-cyan-400" />
          <span>Keyboard Shortcuts:</span>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px]">
          <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-slate-200">
            [Space] Play/Pause
          </span>
          <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-slate-200">
            [← / →] Year +/-
          </span>
          <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-slate-200">
            [M] Mute/Unmute
          </span>
          <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-slate-200">
            [O] Earth Orchestra
          </span>
          <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-slate-200">
            [1 - 9] Select Variable
          </span>
        </div>
      </div>
    </div>
  );
};
