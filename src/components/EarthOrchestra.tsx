import React from "react";
import { OrchestraTrack } from "../types";
import {
  Volume2,
  VolumeX,
  Radio,
  Sliders,
  Sparkles,
  Layers,
  Music,
} from "lucide-react";

interface EarthOrchestraProps {
  isOrchestraActive: boolean;
  tracks: OrchestraTrack[];
  onToggleOrchestra: () => void;
  onTrackToggle: (variableId: string) => void;
  onTrackSolo: (variableId: string) => void;
  onTrackVolume: (variableId: string, volume: number) => void;
  onPresetSelect: (presetName: string) => void;
}

export const EarthOrchestra: React.FC<EarthOrchestraProps> = ({
  isOrchestraActive,
  tracks,
  onToggleOrchestra,
  onTrackToggle,
  onTrackSolo,
  onTrackVolume,
  onPresetSelect,
}) => {
  return (
    <div id="orchestra" className="w-full glass-panel rounded-2xl p-5 sm:p-6 border border-cyan-500/25 shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-cyan-500/20 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <span className="text-xs font-mono text-cyan-400 font-semibold tracking-wider uppercase">
              MULTI-VARIABLE ENSEMBLE
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              SIGNATURE FEATURE
            </span>
          </div>
          <h2 className="font-display font-extrabold text-2xl text-white mt-1">
            THE EARTH ORCHESTRA
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl font-sans">
            Hear the interconnected Earth system as a multi-voice polyphonic ensemble. Temperature carries the melody, ocean heat grounds the sub-bass, wind shapes rhythm, and vegetation pads harmony.
          </p>
        </div>

        {/* Master Orchestra Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleOrchestra}
            className={`px-5 py-2.5 rounded-xl font-mono text-xs font-bold transition shadow-lg flex items-center gap-2 ${
              isOrchestraActive
                ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25"
                : "bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/25"
            }`}
          >
            <Music className="w-4 h-4" />
            <span>{isOrchestraActive ? "EXIT ORCHESTRA (SOLO)" : "ENGAGE EARTH ORCHESTRA"}</span>
          </button>
        </div>
      </div>

      {/* Preset Curations */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="text-xs font-mono text-slate-400">Curated Ensembles:</span>
        <button
          onClick={() => onPresetSelect("full")}
          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/70 text-xs font-mono text-cyan-300 transition"
        >
          Full Biosphere (All)
        </button>
        <button
          onClick={() => onPresetSelect("oceanAtmosphere")}
          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/70 text-xs font-mono text-cyan-300 transition"
        >
          Ocean-Atmosphere Coupled
        </button>
        <button
          onClick={() => onPresetSelect("storm")}
          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/70 text-xs font-mono text-cyan-300 transition"
        >
          Extreme Weather (Wind + Rain)
        </button>
        <button
          onClick={() => onPresetSelect("fireIce")}
          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/70 text-xs font-mono text-cyan-300 transition"
        >
          Thermal Extremes (Fire & Ice)
        </button>
      </div>

      {/* Track Faders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5">
        {tracks.map((track) => (
          <div
            key={track.variableId}
            className={`p-4 rounded-xl border transition-all ${
              track.enabled
                ? "bg-slate-900/90 border-cyan-500/30 shadow-md"
                : "bg-slate-950/40 border-slate-800/60 opacity-60"
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: track.color }}
                />
                <div>
                  <h4 className="font-bold text-sm text-white">{track.name}</h4>
                  <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/50 px-1.5 py-0.2 rounded border border-cyan-500/20">
                    Role: {track.role}
                  </span>
                </div>
              </div>

              {/* Mute and Solo Buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onTrackSolo(track.variableId)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition border ${
                    track.solo
                      ? "bg-amber-500 text-slate-950 border-amber-400"
                      : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
                  }`}
                  title="Solo this instrument"
                >
                  SOLO
                </button>
                <button
                  onClick={() => onTrackToggle(track.variableId)}
                  className={`p-1 rounded transition border ${
                    track.enabled
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                      : "bg-slate-800 text-slate-500 border-slate-700"
                  }`}
                  title={track.enabled ? "Mute Track" : "Unmute Track"}
                >
                  {track.enabled ? (
                    <Volume2 className="w-3.5 h-3.5" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Volume Fader */}
            <div className="mt-3">
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                <span>Timbre: {track.timbre}</span>
                <span>{Math.round(track.volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={track.volume}
                disabled={!track.enabled}
                onChange={(e) =>
                  onTrackVolume(track.variableId, parseFloat(e.target.value))
                }
                className="w-full accent-cyan-400 cursor-pointer disabled:opacity-30"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
