import React from "react";
import {
  Thermometer,
  Waves,
  Anchor,
  CloudFog,
  Wind,
  CloudRain,
  Trees,
  Flame,
  Snowflake,
  Cloud,
  Gauge,
  Volume2,
  Check,
} from "lucide-react";
import { DatasetMetadata, VariableId } from "../types";

interface DataLayerSelectorProps {
  variables: DatasetMetadata[];
  selectedVariableId: VariableId;
  onSelectVariable: (id: VariableId) => void;
  isPlaying: boolean;
}

export const DataLayerSelector: React.FC<DataLayerSelectorProps> = ({
  variables,
  selectedVariableId,
  onSelectVariable,
  isPlaying,
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "Thermometer":
        return <Thermometer className="w-4 h-4 text-orange-400" />;
      case "Waves":
        return <Waves className="w-4 h-4 text-sky-400" />;
      case "Anchor":
        return <Anchor className="w-4 h-4 text-cyan-400" />;
      case "CloudFog":
        return <CloudFog className="w-4 h-4 text-purple-400" />;
      case "Wind":
        return <Wind className="w-4 h-4 text-cyan-300" />;
      case "CloudRain":
        return <CloudRain className="w-4 h-4 text-blue-400" />;
      case "Trees":
        return <Trees className="w-4 h-4 text-emerald-400" />;
      case "Flame":
        return <Flame className="w-4 h-4 text-red-400" />;
      case "Snowflake":
        return <Snowflake className="w-4 h-4 text-cyan-200" />;
      case "Cloud":
        return <Cloud className="w-4 h-4 text-slate-300" />;
      case "Gauge":
        return <Gauge className="w-4 h-4 text-indigo-400" />;
      default:
        return <Thermometer className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-display font-bold text-sm sm:text-base text-white tracking-wide uppercase">
            EARTH DATA LAYERS
          </h3>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/20">
            {variables.length} SCIENTIFIC VARIABLES
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
          SELECT LAYER TO RE-MAP SOUND
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3">
        {variables.map((v) => {
          const isSelected = v.id === selectedVariableId;
          return (
            <div
              key={v.id}
              onClick={() => onSelectVariable(v.id)}
              className={`group relative p-3 rounded-xl cursor-pointer transition-all duration-200 border text-left flex flex-col justify-between ${
                isSelected
                  ? "bg-slate-900/90 border-cyan-400 shadow-lg shadow-cyan-500/10 scale-[1.01]"
                  : "bg-slate-950/60 border-slate-800/80 hover:border-cyan-500/40 hover:bg-slate-900/40"
              }`}
            >
              {/* Active Indicator bar */}
              {isSelected && (
                <div
                  className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                  style={{ backgroundColor: v.color }}
                />
              )}

              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                      {getIcon(v.icon)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-slate-100 group-hover:text-cyan-300 transition">
                        {v.shortName}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400">
                        {v.category}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-bold text-xs text-white">
                      {v.currentValue > 0 && v.unit.includes("Anomaly") ? `+${v.currentValue}` : v.currentValue}
                    </div>
                    <div className="text-[9px] font-mono text-slate-400">
                      {v.unit}
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-2.5">
                  {v.scientificDescription}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[10px] font-mono">
                <span className="text-slate-400 truncate max-w-[130px]" title={v.audioMappingDescription}>
                  {v.audioMappingDescription}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectVariable(v.id);
                  }}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded font-semibold transition ${
                    isSelected
                      ? "bg-cyan-500 text-slate-950 shadow"
                      : "bg-slate-800 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-200"
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>{isPlaying ? "SONIFYING" : "ACTIVE"}</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3 h-3 text-cyan-400" />
                      <span>SONIFY</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
