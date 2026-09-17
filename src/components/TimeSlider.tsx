import React from "react";
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
} from "lucide-react";

interface TimeSliderProps {
  currentYear: number;
  minYear?: number;
  maxYear?: number;
  isPlayingTime: boolean;
  playbackSpeed: number; // 1, 2, 4
  onYearChange: (year: number) => void;
  onTogglePlayTime: () => void;
  onSpeedChange: (speed: number) => void;
  onResetTime: () => void;
}

export const TimeSlider: React.FC<TimeSliderProps> = ({
  currentYear,
  minYear = 1980,
  maxYear = 2025,
  isPlayingTime,
  playbackSpeed,
  onYearChange,
  onTogglePlayTime,
  onSpeedChange,
  onResetTime,
}) => {
  // Key Climate & Earth System Milestones
  const milestones: Record<number, string> = {
    1980: "Baseline Start (44-year record begins)",
    1991: "Mt. Pinatubo Eruption (Aerosol cooling signature)",
    1998: "Super El Niño (Historic ocean-atmosphere spike)",
    2005: "Hurricane Katrina & Arctic Sea Ice drop",
    2012: "Record Low Arctic Sea Ice Extent (3.41M km²)",
    2016: "Historic Global Temperature Anomaly (+1.02°C)",
    2020: "Global Lockdowns (Brief emission pause)",
    2023: "Unprecedented Ocean Heat & Wildfire Record",
    2025: "Present Day Observations",
  };

  const currentMilestone = milestones[currentYear];

  return (
    <div className="w-full glass-panel rounded-2xl p-4 sm:p-5 border border-cyan-500/25 shadow-xl">
      {/* Top Header: Current Year Display & Playback Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 bg-slate-900/90 border border-cyan-500/30 px-3 py-1 rounded-xl shadow-inner">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono text-slate-400">YEAR:</span>
            <span className="font-display font-extrabold text-xl sm:text-2xl text-cyan-300 tracking-wider">
              {currentYear}
            </span>
          </div>

          {currentMilestone && (
            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg text-xs font-mono text-amber-300">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold">{currentMilestone}</span>
            </div>
          )}
        </div>

        {/* Playback Controls & Speed */}
        <div className="flex items-center gap-2">
          {/* Step Back 1 Year */}
          <button
            onClick={() => onYearChange(Math.max(minYear, currentYear - 1))}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-300 transition"
            title="Step back 1 year"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Play Through Time Button */}
          <button
            onClick={onTogglePlayTime}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold transition shadow-md ${
              isPlayingTime
                ? "bg-amber-500 hover:bg-amber-400 text-slate-950"
                : "bg-cyan-500 hover:bg-cyan-400 text-slate-950"
            }`}
            title="Automatically step through historical years and sonify changes"
          >
            {isPlayingTime ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-slate-950" />
                <span>PAUSE TIMELINE</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-slate-950" />
                <span>PLAY THROUGH TIME</span>
              </>
            )}
          </button>

          {/* Step Forward 1 Year */}
          <button
            onClick={() => onYearChange(Math.min(maxYear, currentYear + 1))}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-300 transition"
            title="Step forward 1 year"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Speed Selector (1x, 2x, 4x) */}
          <div className="flex rounded-lg bg-slate-900 border border-slate-800 p-0.5 ml-1">
            {[1, 2, 4].map((s) => (
              <button
                key={s}
                onClick={() => onSpeedChange(s)}
                className={`px-2 py-0.5 rounded text-xs font-mono transition ${
                  playbackSpeed === s
                    ? "bg-cyan-500/30 text-cyan-200 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Reset to 1980 */}
          <button
            onClick={onResetTime}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition"
            title="Reset to 1980"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Slider */}
      <div className="relative pt-2 pb-1">
        <input
          type="range"
          min={minYear}
          max={maxYear}
          step="1"
          value={currentYear}
          onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
          className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
        />

        {/* Milestone Tick Marks */}
        <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mt-2">
          <span
            onClick={() => onYearChange(1980)}
            className="cursor-pointer hover:text-cyan-300"
          >
            1980
          </span>
          <span
            onClick={() => onYearChange(1990)}
            className="cursor-pointer hover:text-cyan-300"
          >
            1990
          </span>
          <span
            onClick={() => onYearChange(2000)}
            className="cursor-pointer hover:text-cyan-300"
          >
            2000
          </span>
          <span
            onClick={() => onYearChange(2010)}
            className="cursor-pointer hover:text-cyan-300"
          >
            2010
          </span>
          <span
            onClick={() => onYearChange(2020)}
            className="cursor-pointer hover:text-cyan-300"
          >
            2020
          </span>
          <span
            onClick={() => onYearChange(2025)}
            className="cursor-pointer hover:text-cyan-300 text-cyan-400 font-bold"
          >
            2025 (NOW)
          </span>
        </div>
      </div>
    </div>
  );
};
