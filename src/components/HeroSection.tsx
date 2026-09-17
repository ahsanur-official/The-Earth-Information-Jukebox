import React from "react";
import { Play, ArrowDown, Sparkles, Radio, HelpCircle } from "lucide-react";

interface HeroSectionProps {
  onExplore: () => void;
  onHowItWorks: () => void;
  onQuickDemo: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onOpenEIC?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExplore,
  onHowItWorks,
  onQuickDemo,
  isPlaying,
  onTogglePlay,
  onOpenEIC,
}) => {
  return (
    <section className="relative w-full pt-8 sm:pt-14 lg:pt-16 pb-12 sm:pb-16 lg:pb-20 px-3 sm:px-6 lg:px-10 overflow-hidden bg-gradient-to-b from-[#050711] via-[#060c20] to-[#050711]">
      {/* Background ambient lighting glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[300px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-[1440px] 2xl:max-w-[1600px] mx-auto text-center relative z-10 px-2 sm:px-4">
        {/* Universal Status Pill Tag */}
        <div className="inline-flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 bg-slate-900/90 border border-cyan-500/30 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-mono text-cyan-300 shadow-lg mb-4 sm:mb-6 backdrop-blur-md">
          <Radio className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400 animate-pulse shrink-0" />
          <span>EARTH OBSERVATION & SONIFICATION</span>
          <span className="hidden xs:inline text-slate-600">•</span>
          <span className="text-slate-300">THE EARTH INFORMATION JUKEBOX</span>
        </div>

        {/* Main Cinematic Headlines */}
        <h1 className="font-display text-3xl xs:text-5xl sm:text-6xl lg:text-7xl 2xl:text-8xl font-extrabold tracking-tight text-white mb-4 sm:mb-6">
          LISTEN TO <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500">EARTH.</span>
        </h1>

        <p className="text-lg xs:text-xl sm:text-2xl 2xl:text-3xl text-slate-200 font-display font-medium max-w-3xl mx-auto mb-3 sm:mb-4 leading-snug">
          Earth is constantly changing.
          <br />
          <span className="text-cyan-300">Now you can hear it.</span>
        </p>

        <p className="text-xs xs:text-sm sm:text-base text-slate-400 max-w-2xl mx-auto mb-6 sm:mb-8 font-sans leading-relaxed">
          The Earth Information Jukebox transforms Earth science data and video feeds into real-time sound, allowing users to experience environmental change through both sight and hearing.
        </p>

        {/* Call to Actions */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3.5 mb-8 sm:mb-10 w-full max-w-4xl mx-auto">
          <button
            onClick={onOpenEIC || onHowItWorks}
            className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-cyan-950 to-indigo-950 hover:from-cyan-900 hover:to-indigo-900 text-cyan-200 border border-cyan-400/50 hover:border-cyan-300 font-bold px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl transition shadow-lg text-xs sm:text-sm font-mono group cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 group-hover:scale-110 transition" />
            <span>LAUNCH EARTH JUKEBOX</span>
          </button>

          <button
            onClick={onExplore}
            className="flex items-center gap-1.5 sm:gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl shadow-lg shadow-cyan-500/25 transition transform hover:-translate-y-0.5 active:translate-y-0 text-xs sm:text-sm font-mono"
          >
            <span>3D SATELLITE GLOBE</span>
            <ArrowDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <button
            onClick={onTogglePlay}
            className="flex items-center gap-1.5 sm:gap-2 bg-slate-900/90 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 hover:border-cyan-300 font-semibold px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl transition shadow-md text-xs sm:text-sm font-mono"
          >
            <Play className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isPlaying ? "text-amber-400 fill-amber-400" : "fill-cyan-400"}`} />
            <span>{isPlaying ? "PAUSE AUDIO" : "LISTEN NOW"}</span>
          </button>

          <button
            onClick={onQuickDemo}
            className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/40 font-semibold px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition shadow-md text-xs sm:text-sm font-mono"
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            <span>QUICK DEMO</span>
          </button>

          <button
            onClick={onHowItWorks}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 px-3 py-2.5 sm:py-3 rounded-xl transition text-xs sm:text-sm font-mono"
          >
            <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>HOW IT WORKS</span>
          </button>
        </div>

        {/* Core Scientific Translation Pipeline Banner */}
        <div className="glass-panel rounded-2xl p-3 sm:p-5 border border-cyan-500/25 max-w-5xl mx-auto shadow-2xl">
          <div className="text-[10px] sm:text-[11px] font-mono text-cyan-400 uppercase tracking-wider mb-2.5 sm:mb-3 flex items-center justify-center gap-2">
            <span>SCIENTIFIC TRANSLATION ARCHITECTURE</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 sm:gap-2 text-center text-xs font-mono">
            <div className="bg-slate-950/70 p-2 sm:p-2.5 rounded-xl border border-slate-800">
              <div className="text-slate-400 text-[9px] sm:text-[10px] mb-0.5 sm:mb-1">STEP 01</div>
              <div className="font-bold text-slate-100 text-[11px] sm:text-xs">NASA DATA</div>
              <div className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5">Satellites & In-Situ</div>
            </div>

            <div className="bg-slate-950/70 p-2 sm:p-2.5 rounded-xl border border-slate-800">
              <div className="text-slate-400 text-[9px] sm:text-[10px] mb-0.5 sm:mb-1">STEP 02</div>
              <div className="font-bold text-slate-100 text-[11px] sm:text-xs">NORMALIZATION</div>
              <div className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5">[0.0 to 1.0] Bounds</div>
            </div>

            <div className="bg-slate-950/70 p-2 sm:p-2.5 rounded-xl border border-slate-800">
              <div className="text-slate-400 text-[9px] sm:text-[10px] mb-0.5 sm:mb-1">STEP 03</div>
              <div className="font-bold text-cyan-300 text-[11px] sm:text-xs">FEATURE MAPPING</div>
              <div className="text-[9px] sm:text-[10px] text-cyan-400/80 mt-0.5">Pitch, Timbre, Rhythm</div>
            </div>

            <div className="bg-slate-950/70 p-2 sm:p-2.5 rounded-xl border border-slate-800">
              <div className="text-slate-400 text-[9px] sm:text-[10px] mb-0.5 sm:mb-1">STEP 04</div>
              <div className="font-bold text-slate-100 text-[11px] sm:text-xs">DSP SYNTHESIS</div>
              <div className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5">Real-Time Web Audio</div>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-cyan-950/40 p-2 sm:p-2.5 rounded-xl border border-cyan-500/40">
              <div className="text-cyan-400 text-[9px] sm:text-[10px] mb-0.5 sm:mb-1">EXPERIENCE</div>
              <div className="font-bold text-cyan-200 text-[11px] sm:text-xs">SOUND + SIGHT</div>
              <div className="text-[9px] sm:text-[10px] text-cyan-300/80 mt-0.5">Multi-Sensory EIC</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
