import React from "react";
import { DataPoint, DatasetMetadata } from "../types";
import { TrendingUp, BarChart3 } from "lucide-react";

interface DataChartProps {
  data: DataPoint[];
  metadata: DatasetMetadata;
  currentYear: number;
  onSelectYear: (year: number) => void;
}

export const DataChart: React.FC<DataChartProps> = ({
  data,
  metadata,
  currentYear,
  onSelectYear,
}) => {
  if (!data || data.length === 0) return null;

  // Calculate statistics
  const values = data.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const avgVal = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2);
  const currentPt = data.find((d) => d.year === currentYear) || data[data.length - 1];

  // SVG dimensions
  const svgWidth = 800;
  const svgHeight = 220;
  const padLeft = 55;
  const padRight = 25;
  const padTop = 20;
  const padBottom = 35;

  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  const minYear = data[0].year;
  const maxYear = data[data.length - 1].year;
  const valRange = maxVal - minVal || 1;

  // Coordinate mappers
  const getX = (year: number) => padLeft + ((year - minYear) / (maxYear - minYear)) * chartW;
  const getY = (val: number) => padTop + chartH - ((val - minVal) / valRange) * chartH;

  // Baseline Y (0.0 if in range, otherwise minVal)
  const zeroY = minVal <= 0 && maxVal >= 0 ? getY(0) : getY(minVal);

  // Build SVG Path
  const points = data.map((d) => `${getX(d.year)},${getY(d.value)}`).join(" ");
  const areaPath = `M ${getX(data[0].year)},${zeroY} L ${points} L ${getX(
    data[data.length - 1].year
  )},${zeroY} Z`;

  // Cursor for current year
  const cursorX = getX(currentYear);
  const cursorY = getY(currentPt.value);

  return (
    <div className="w-full glass-panel rounded-2xl p-4 sm:p-5 border border-cyan-500/25 shadow-xl">
      {/* Chart Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono text-cyan-400 font-semibold uppercase tracking-wider">
              HISTORICAL TIME-SERIES
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-xs font-mono text-slate-300">1980–2025</span>
          </div>
          <div className="font-display font-bold text-base text-white mt-0.5">
            {metadata.name} Measurement Arc
          </div>
        </div>

        {/* Quick Stats Badges */}
        <div className="flex items-center gap-2 text-[11px] font-mono">
          <div className="bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
            <span className="text-slate-400">MIN: </span>
            <span className="text-slate-200 font-bold">{minVal}</span>
          </div>
          <div className="bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
            <span className="text-slate-400">AVG: </span>
            <span className="text-slate-200 font-bold">{avgVal}</span>
          </div>
          <div className="bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
            <span className="text-slate-400">PEAK: </span>
            <span className="text-cyan-300 font-bold">{maxVal}</span>
          </div>
        </div>
      </div>

      {/* Responsive SVG Chart */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto block select-none cursor-crosshair"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = ((e.clientX - rect.left) / rect.width) * svgWidth;
            const clampedX = Math.max(padLeft, Math.min(padLeft + chartW, clickX));
            const yearRatio = (clampedX - padLeft) / chartW;
            const clickedYear = Math.round(minYear + yearRatio * (maxYear - minYear));
            onSelectYear(clickedYear);
          }}
        >
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={metadata.color} stopOpacity="0.45" />
              <stop offset="100%" stopColor={metadata.color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={padLeft}
            y1={padTop}
            x2={padLeft + chartW}
            y2={padTop}
            stroke="rgba(100, 116, 139, 0.15)"
            strokeDasharray="3 3"
          />
          <line
            x1={padLeft}
            y1={padTop + chartH / 2}
            x2={padLeft + chartW}
            y2={padTop + chartH / 2}
            stroke="rgba(100, 116, 139, 0.15)"
            strokeDasharray="3 3"
          />
          <line
            x1={padLeft}
            y1={padTop + chartH}
            x2={padLeft + chartW}
            y2={padTop + chartH}
            stroke="rgba(100, 116, 139, 0.25)"
          />

          {/* Zero baseline if present */}
          {minVal <= 0 && maxVal >= 0 && (
            <line
              x1={padLeft}
              y1={zeroY}
              x2={padLeft + chartW}
              y2={zeroY}
              stroke="rgba(244, 63, 94, 0.4)"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
          )}

          {/* Area Fill */}
          <path d={areaPath} fill="url(#chartGradient)" />

          {/* Line */}
          <polyline
            fill="none"
            stroke={metadata.color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />

          {/* Current Year Cursor Line */}
          <line
            x1={cursorX}
            y1={padTop}
            x2={cursorX}
            y2={padTop + chartH}
            stroke="#ffffff"
            strokeWidth="2"
            strokeDasharray="3 3"
          />

          {/* Current Point Dot */}
          <circle
            cx={cursorX}
            cy={cursorY}
            r="6"
            fill={metadata.color}
            stroke="#ffffff"
            strokeWidth="2.5"
          />

          {/* Y-Axis Value Labels */}
          <text
            x={padLeft - 8}
            y={padTop + 4}
            fill="#94a3b8"
            fontSize="10"
            fontFamily="monospace"
            textAnchor="end"
          >
            {maxVal}
          </text>
          <text
            x={padLeft - 8}
            y={padTop + chartH + 4}
            fill="#94a3b8"
            fontSize="10"
            fontFamily="monospace"
            textAnchor="end"
          >
            {minVal}
          </text>

          {/* X-Axis Year Labels */}
          <text
            x={padLeft}
            y={svgHeight - 10}
            fill="#94a3b8"
            fontSize="10"
            fontFamily="monospace"
            textAnchor="start"
          >
            1980
          </text>
          <text
            x={padLeft + chartW / 2}
            y={svgHeight - 10}
            fill="#94a3b8"
            fontSize="10"
            fontFamily="monospace"
            textAnchor="middle"
          >
            2002
          </text>
          <text
            x={padLeft + chartW}
            y={svgHeight - 10}
            fill="#94a3b8"
            fontSize="10"
            fontFamily="monospace"
            textAnchor="end"
          >
            2025
          </text>
        </svg>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-1.5 text-[10px] sm:text-[11px] font-mono text-slate-400 mt-2">
        <span className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
          Click anywhere along the chart curve to jump to that year.
        </span>
        <span className="text-cyan-300 font-bold">
          Year {currentYear}: {currentPt.value} {metadata.unit}
        </span>
      </div>
    </div>
  );
};
