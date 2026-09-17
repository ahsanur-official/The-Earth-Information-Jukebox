import React from "react";
import { DatasetMetadata } from "../types";
import { Database, ExternalLink, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";

interface DataSourcePanelProps {
  variables: DatasetMetadata[];
  statusMode: "LIVE_NASA" | "DEMO_DATA";
}

export const DataSourcePanel: React.FC<DataSourcePanelProps> = ({
  variables,
  statusMode,
}) => {
  return (
    <div id="sources" className="w-full glass-panel rounded-2xl p-5 sm:p-6 border border-cyan-500/25 shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-cyan-500/20 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            <span className="text-xs font-mono text-cyan-400 font-semibold tracking-wider uppercase">
              OPEN SCIENCE TRANSPARENCY
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-xs font-mono text-slate-300">
              DATASET REGISTRY
            </span>
          </div>
          <h2 className="font-display font-extrabold text-2xl text-white mt-1">
            NASA DATA SOURCES & MISSIONS
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl font-sans">
            Every sound is calibrated against real NASA satellite observation missions and open science climate records.
          </p>
        </div>

        {/* Live Status Indicator */}
        <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 px-3.5 py-1.5 rounded-xl text-xs font-mono">
          {statusMode === "LIVE_NASA" ? (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-300 font-bold">STATUS: LIVE NASA API</span>
            </>
          ) : (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span className="text-cyan-300 font-bold">STATUS: CALIBRATED DEMO DATA</span>
            </>
          )}
        </div>
      </div>

      {/* Transparency Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
              <th className="pb-2.5">Variable</th>
              <th className="pb-2.5">Mission / Satellite</th>
              <th className="pb-2.5">Instrument</th>
              <th className="pb-2.5">Baseline Reference</th>
              <th className="pb-2.5">DOI / Archive Link</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {variables.map((v) => (
              <tr key={v.id} className="hover:bg-slate-900/40 transition">
                <td className="py-3 font-semibold text-white flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: v.color }}
                  />
                  <span>{v.name}</span>
                </td>
                <td className="py-3 text-cyan-300">{v.mission}</td>
                <td className="py-3 text-slate-400">{v.dataSource}</td>
                <td className="py-3 text-slate-400">{v.baseline}</td>
                <td className="py-3">
                  <a
                    href={v.doiOrUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
                  >
                    <span>NASA Earthdata</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mission Ethics & Attribution */}
      <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-1.5 text-slate-300">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Full Scientific Traceability: All data points reflect public NASA Earth Science Division archives.</span>
        </div>
        <div>
          Data latency: Real-time calculation / 1980–2025 Calibrated
        </div>
      </div>
    </div>
  );
};
