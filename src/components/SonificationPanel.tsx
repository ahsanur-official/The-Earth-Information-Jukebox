import React from "react";
import {
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Sliders,
  Sparkles,
  ArrowRightLeft,
  Info,
  Activity,
  Music,
} from "lucide-react";
import { DatasetMetadata, DataPoint, SonificationMappingConfig } from "../types";

interface SonificationPanelProps {
  metadata: DatasetMetadata;
  currentDataPoint: DataPoint;
  isPlaying: boolean;
  isPaused: boolean;
  isMuted: boolean;
  volume: number;
  mappingConfig: SonificationMappingConfig;
  onTogglePlay: () => void;
  onStop: () => void;
  onToggleMute: () => void;
  onVolumeChange: (vol: number) => void;
  onMappingChange: (config: Partial<SonificationMappingConfig>) => void;
  onOpenNarrator: () => void;
}

export const SonificationPanel: React.FC<SonificationPanelProps> = ({
  metadata,
  currentDataPoint,
  isPlaying,
  isPaused,
  isMuted,
  volume,
  mappingConfig,
  onTogglePlay,
  onStop,
  onToggleMute,
  onVolumeChange,
  onMappingChange,
  onOpenNarrator,
}) => {
  // Calculate approx frequency based on normalized data
  const baseFreq = mappingConfig.baseFrequency || 130;
  const maxFreq = mappingConfig.maxFrequency || 880;
  const norm = mappingConfig.pitchInverted
    ? 1 - currentDataPoint.normalized
    : currentDataPoint.normalized;
  const estimatedPitch = Math.round(baseFreq + norm * (maxFreq - baseFreq) * mappingConfig.sensitivity);

  return (
    <div className="w-full glass-panel rounded-2xl p-4 sm:p-5 border border-cyan-500/25 shadow-xl flex flex-col justify-between">
      <div>
        {/* Header: Now Listening To */}
        <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: metadata.color }}
              />
              <span className="text-[11px] font-mono text-cyan-400 font-semibold tracking-wider uppercase">
                ACTIVE SONIFICATION MATRIX
              </span>
            </div>
            <h3 className="font-display font-bold text-lg text-white mt-0.5">
              {metadata.name}
            </h3>
          </div>

          <button
            onClick={onOpenNarrator}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 text-amber-300 border border-amber-500/40 text-xs px-2.5 py-1.5 rounded-lg transition font-mono"
            title="Ask AI Earth Sound Narrator"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">AI Explain Sound</span>
          </button>
        </div>

        {/* Primary Controls: Big Play/Pause Button + Stop */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={onTogglePlay}
            className={`flex-1 py-3 px-4 rounded-xl font-mono font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition transform active:scale-95 ${
              isPlaying && !isPaused
                ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20"
                : "bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/25"
            }`}
          >
            {isPlaying && !isPaused ? (
              <>
                <Pause className="w-4 h-4 fill-slate-950" />
                <span>PAUSE SONIFICATION</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-slate-950" />
                <span>START SONIFICATION</span>
              </>
            )}
          </button>

          <button
            onClick={onStop}
            disabled={!isPlaying}
            className="p-3 rounded-xl bg-slate-900 border border-slate-700/70 text-slate-300 hover:text-red-400 hover:border-red-500/40 disabled:opacity-40 disabled:pointer-events-none transition"
            title="Stop Audio Synthesis"
          >
            <Square className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleMute}
            className={`p-3 rounded-xl border transition ${
              isMuted
                ? "bg-red-500/20 border-red-500/40 text-red-300"
                : "bg-slate-900 border-slate-700/70 text-cyan-300"
            }`}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Data Translation Math Box: Raw Value -> Normalized Value -> Audio Pitch */}
        <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 mb-4 font-mono text-xs">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-semibold mb-2">
            <span className="flex items-center gap-1 text-cyan-300">
              <Activity className="w-3 h-3" />
              SCIENTIFIC PARAMETER COUPLING
            </span>
            <span>YEAR {currentDataPoint.year}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-900/90 p-2 rounded border border-slate-800">
              <div className="text-[10px] text-slate-400">RAW DATA</div>
              <div className="font-bold text-white text-sm mt-0.5">
                {currentDataPoint.value > 0 && metadata.unit.includes("Anomaly")
                  ? `+${currentDataPoint.value}`
                  : currentDataPoint.value}
              </div>
              <div className="text-[9px] text-slate-400 truncate">{metadata.unit}</div>
            </div>

            <div className="bg-slate-900/90 p-2 rounded border border-slate-800">
              <div className="text-[10px] text-slate-400">NORMALIZED</div>
              <div className="font-bold text-cyan-300 text-sm mt-0.5">
                {currentDataPoint.normalized.toFixed(3)}
              </div>
              <div className="text-[9px] text-slate-400">[0.0 to 1.0] Range</div>
            </div>

            <div className="bg-slate-900/90 p-2 rounded border border-slate-800">
              <div className="text-[10px] text-slate-400">TARGET PITCH</div>
              <div className="font-bold text-emerald-400 text-sm mt-0.5">
                ~{isPlaying ? `${estimatedPitch} Hz` : "--"}
              </div>
              <div className="text-[9px] text-slate-400">Audio Clock</div>
            </div>
          </div>

          {/* Normalization Progress Bar */}
          <div className="mt-3">
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span>MIN: {metadata.min} {metadata.unit}</span>
              <span>NORM RATIO: {(currentDataPoint.normalized * 100).toFixed(0)}%</span>
              <span>MAX: {metadata.max} {metadata.unit}</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${Math.max(4, Math.min(100, currentDataPoint.normalized * 100))}%`,
                  backgroundColor: metadata.color,
                }}
              />
            </div>
          </div>
        </div>

        {/* Sonification Parameters & Controls */}
        <div className="space-y-3 font-mono text-xs">
          {/* Master Volume */}
          <div>
            <div className="flex justify-between text-slate-300 text-[11px] mb-1">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                SYNTHESIZER VOLUME
              </span>
              <span>{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Sensitivity Scaling */}
          <div>
            <div className="flex justify-between text-slate-300 text-[11px] mb-1">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-sky-400" />
                MODULATION SENSITIVITY
              </span>
              <span>{mappingConfig.sensitivity.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={mappingConfig.sensitivity}
              onChange={(e) =>
                onMappingChange({ sensitivity: parseFloat(e.target.value) })
              }
              className="w-full accent-sky-400 cursor-pointer"
            />
          </div>

          {/* Timbre Waveform & Invert Pitch */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-1">
              <Music className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] text-slate-400">Timbre:</span>
              <div className="flex rounded bg-slate-900 border border-slate-800 p-0.5 ml-1">
                {(["sine", "triangle", "sawtooth"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => onMappingChange({ timbre: t })}
                    className={`px-2 py-0.5 rounded text-[10px] capitalize transition ${
                      mappingConfig.timbre === t
                        ? "bg-cyan-500/30 text-cyan-200 font-bold"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() =>
                onMappingChange({ pitchInverted: !mappingConfig.pitchInverted })
              }
              className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] border transition ${
                mappingConfig.pitchInverted
                  ? "bg-purple-500/20 text-purple-200 border-purple-500/40"
                  : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
              }`}
              title="Invert Pitch (Higher values = Lower sound)"
            >
              <ArrowRightLeft className="w-3 h-3" />
              <span>Invert Pitch</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Instrument Metadata */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 font-sans flex items-center justify-between">
        <span className="flex items-center gap-1">
          <Info className="w-3 h-3 text-cyan-400" />
          Mission: <strong className="text-slate-300">{metadata.mission}</strong>
        </span>
        <span className="font-mono text-[10px] text-slate-400">
          Source: {metadata.dataSource}
        </span>
      </div>
    </div>
  );
};
