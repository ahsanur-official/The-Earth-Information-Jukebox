import React from "react";
import { Radio, ExternalLink, ShieldCheck, Heart } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#030611] border-t border-cyan-500/20 py-12 px-4 sm:px-6 lg:px-8 text-slate-400 font-sans text-xs">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        {/* Col 1: Identity */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <Radio className="w-5 h-5 text-cyan-400" />
            <span className="font-display font-bold text-lg text-white tracking-wider">
              EARTH <span className="text-cyan-400">JUKEBOX</span>
            </span>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed mb-4 max-w-md">
            Translating Earth Information Center science and video feeds into dynamic, real-time sound. Designed to make climate and Earth observation accessible, multi-sensory, and emotionally resonant.
          </p>
          <div className="inline-block bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300 text-[11px] font-mono">
            Platform: <strong>The Earth Information Jukebox</strong>
          </div>
        </div>

        {/* Col 2: Open Science Missions */}
        <div>
          <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider mb-3">
            NASA Observation Missions
          </h4>
          <ul className="space-y-1.5 text-[11px] font-mono text-slate-400">
            <li>• Terra & Aqua (MODIS)</li>
            <li>• Landsat 8 & Landsat 9 (OLI/TIRS)</li>
            <li>• GISS Surface Temperature (GISTEMP v4)</li>
            <li>• Orbiting Carbon Observatory (OCO-2)</li>
            <li>• Soil Moisture Active Passive (SMAP)</li>
            <li>• GRACE / GRACE Follow-On</li>
          </ul>
        </div>

        {/* Col 3: Resources */}
        <div>
          <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider mb-3">
            NASA Open Resources
          </h4>
          <ul className="space-y-1.5 text-[11px] font-mono">
            <li>
              <a
                href="https://earth.gov"
                target="_blank"
                rel="noreferrer"
                className="hover:text-cyan-300 flex items-center gap-1"
              >
                <span>Earth Information Center</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li>
              <a
                href="https://earthdata.nasa.gov"
                target="_blank"
                rel="noreferrer"
                className="hover:text-cyan-300 flex items-center gap-1"
              >
                <span>NASA Earthdata Open Archive</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li>
              <a
                href="https://data.nasa.gov"
                target="_blank"
                rel="noreferrer"
                className="hover:text-cyan-300 flex items-center gap-1"
              >
                <span>NASA Open Data Portal</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li>
              <a
                href="https://earth.gov/multimedia"
                target="_blank"
                rel="noreferrer"
                className="hover:text-cyan-300 flex items-center gap-1"
              >
                <span>Earth Visualizations Archive</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Disclaimer */}
      <div className="max-w-7xl mx-auto pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px] font-mono text-center sm:text-left">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>The Earth Information Jukebox — Open Planetary Multi-Sensory Sonification Platform.</span>
        </div>
        <div className="flex items-center gap-1">
          <span>Crafted with scientific rigor for accessible global climate education.</span>
        </div>
      </div>
    </footer>
  );
};
