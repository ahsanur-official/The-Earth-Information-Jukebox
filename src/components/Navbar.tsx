import React, { useState, useEffect } from "react";
import {
  Volume2,
  VolumeX,
  Sparkles,
  Eye,
  Radio,
  Menu,
  X,
  Globe2,
  Layers,
  Clock,
  BarChart3,
  Sliders,
  Database,
  ChevronRight,
  Bot,
  HelpCircle,
  Play,
  Square,
  FileVideo,
} from "lucide-react";
import { AccessibilitySettings } from "../types";

export type AppViewId = "video" | "studio" | "orchestra" | "data" | "sources";

interface NavbarProps {
  currentView: AppViewId;
  onChangeView: (view: AppViewId) => void;
  isPlaying: boolean;
  isMuted: boolean;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onStartQuickDemo: () => void;
  accessibility: AccessibilitySettings;
  onToggleAccessibility: () => void;
  dataSourceMode: "LIVE_NASA" | "DEMO_DATA";
  onOpenNarrator: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onChangeView,
  isPlaying,
  isMuted,
  onTogglePlay,
  onToggleMute,
  onStartQuickDemo,
  accessibility,
  onToggleAccessibility,
  dataSourceMode,
  onOpenNarrator,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  // Close menu on Esc key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMenuOpen]);

  // Prevent background scroll when hamburger menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isMenuOpen]);

  const navItems: {
    id: AppViewId;
    title: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    shortcut: string;
  }[] = [
    {
      id: "video",
      title: "Video Sonifier (Tone.js)",
      subtitle: "Upload video & real-time frame luminosity, RGB and Tone.js synthesis",
      icon: FileVideo,
      badge: "TONE.JS",
      shortcut: "1",
    },
    {
      id: "studio",
      title: "Earth Jukebox Studio",
      subtitle: "Visual Analysis, Sound Mapping Rules & Web Audio Generation",
      icon: Radio,
      badge: "STUDIO",
      shortcut: "2",
    },
    {
      id: "orchestra",
      title: "The Earth Orchestra",
      subtitle: "6-track polyphonic planetary synthesizer console",
      icon: Layers,
      badge: "ENSEMBLE",
      shortcut: "3",
    },
    {
      id: "data",
      title: "Data Matrix & Analytics",
      subtitle: "11 global environmental variables & historical curves (1980–2025)",
      icon: BarChart3,
      badge: "DATASETS",
      shortcut: "4",
    },
    {
      id: "sources",
      title: "Missions & Open Data",
      subtitle: "Earth observation satellites, sensors & open data registry",
      icon: Database,
      badge: "VERIFIED",
      shortcut: "5",
    },
  ];

  const currentNav = navItems.find((item) => item.id === currentView) || navItems[0];

  const handleSelectView = (id: AppViewId) => {
    onChangeView(id);
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-[#030612]/95 backdrop-blur-md border-b border-cyan-500/20 shadow-xl">
        {/* Universal Earth Information Jukebox Status Bar */}
        <div className="bg-gradient-to-r from-slate-950 via-cyan-950/40 to-slate-950 border-b border-cyan-500/10 py-1 px-2 sm:px-4 text-center text-[9px] sm:text-xs font-mono text-cyan-300/80 flex items-center justify-center gap-1.5 sm:gap-2 leading-tight">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
          <span className="truncate sm:overflow-visible">THE EARTH INFORMATION JUKEBOX</span>
          <span className="hidden sm:inline text-slate-500">•</span>
          <span className="hidden sm:inline text-slate-400">Translating Planetary Sight & Video into Real-Time Sound</span>
        </div>

        <div className="max-w-[1720px] 2xl:max-w-[1880px] w-full mx-auto px-2.5 sm:px-6 lg:px-10 xl:px-12 h-13 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-4">
          {/* Logo & Product Name */}
          <div
            onClick={() => handleSelectView("studio")}
            className="flex items-center gap-1.5 sm:gap-3 cursor-pointer group shrink min-w-0"
          >
            <div className="relative flex items-center justify-center w-7 h-7 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-400/40 shadow-inner group-hover:border-cyan-300 transition duration-300 shrink-0">
              <Radio className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-cyan-300 group-hover:scale-110 transition duration-300" />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping opacity-75" />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-cyan-400" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="font-display font-black text-xs sm:text-lg tracking-wider text-white whitespace-nowrap">
                  EARTH <span className="text-cyan-400">JUKEBOX</span>
                </span>
                <span className="hidden md:inline-block bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold uppercase whitespace-nowrap">
                  {dataSourceMode === "LIVE_NASA" ? "NASA LIVE" : "DEMO DATA"}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-sans hidden lg:block">
                Listen to a Changing Planet.
              </p>
            </div>
          </div>

          {/* Active View Quick Label (Visible on large desktop) */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 px-3 py-1 rounded-xl text-xs font-mono text-slate-300 truncate">
            <currentNav.icon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-slate-400">ACTIVE:</span>
            <span className="text-cyan-300 font-semibold truncate">{currentNav.title}</span>
          </div>

          {/* Action Controls & HAMBURGER MENU */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Quick Demo button - visible on sm+ screens */}
            <button
              onClick={onStartQuickDemo}
              className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs px-2.5 py-1.5 rounded-xl shadow-lg transition transform active:scale-95 font-mono whitespace-nowrap"
              title="Start 3-Minute Guided Demo Tour"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>QUICK DEMO</span>
            </button>

            {/* AI Narrator Button */}
            <button
              onClick={onOpenNarrator}
              className="hidden md:flex items-center gap-1 bg-slate-900/90 hover:bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs px-2.5 py-1.5 rounded-xl transition font-mono whitespace-nowrap"
              title="Ask AI Earth Sound Narrator"
            >
              <Bot className="w-3.5 h-3.5 text-amber-400" />
              <span>AI</span>
            </button>

            {/* Audio Toggle (Play/Pause audio engine directly from header) */}
            <button
              onClick={onTogglePlay}
              className={`p-1.5 sm:p-2 rounded-xl border transition flex items-center justify-center text-xs font-mono min-w-[32px] min-h-[32px] sm:min-w-[38px] sm:min-h-[38px] ${
                isPlaying
                  ? "bg-cyan-500/20 border-cyan-400 text-cyan-300"
                  : "bg-slate-900/80 border-slate-700/70 text-slate-300 hover:text-white"
              }`}
              title={isPlaying ? "Pause Sound Engine (Space)" : "Start Sound Engine (Space)"}
              aria-label="Toggle Sound Engine"
            >
              {isPlaying ? (
                <Square className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current text-cyan-400" />
              ) : (
                <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current text-slate-300" />
              )}
            </button>

            {/* Master Mute Toggle */}
            <button
              onClick={onToggleMute}
              className={`p-1.5 sm:p-2 rounded-xl border transition flex items-center justify-center min-w-[32px] min-h-[32px] sm:min-w-[38px] sm:min-h-[38px] ${
                isMuted
                  ? "bg-red-500/20 border-red-500/40 text-red-300"
                  : "bg-slate-900/80 border-slate-700/70 text-cyan-400 hover:text-cyan-300"
              }`}
              title={isMuted ? "Unmute Sound Engine (M)" : "Mute Sound Engine (M)"}
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>

            {/* Accessibility toggle (desktop) */}
            <button
              onClick={onToggleAccessibility}
              className={`hidden sm:flex p-1.5 sm:p-2 rounded-xl border transition items-center justify-center min-w-[38px] min-h-[38px] ${
                accessibility.captionsEnabled || accessibility.highContrast
                  ? "bg-cyan-500/25 border-cyan-400 text-cyan-200"
                  : "bg-slate-900/80 border-slate-700/70 text-slate-400 hover:text-slate-200"
              }`}
              title="Accessibility Mode & Audio Captions"
              aria-label="Toggle Accessibility Mode"
            >
              <Eye className="w-4 h-4" />
            </button>

            {/* THE HAMBURGER MENU BUTTON */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-1 sm:gap-2 bg-gradient-to-b from-slate-900 to-slate-950 hover:from-slate-800 hover:to-slate-900 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400 px-2 sm:px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition shadow-lg active:scale-95 group shrink-0"
              aria-label="Toggle Main Navigation Menu"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? (
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-300" />
              ) : (
                <Menu className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 group-hover:scale-110 transition" />
              )}
              <span className="tracking-wider text-[11px] sm:text-xs">MENU</span>
            </button>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* FULL HAMBURGER SLIDE-OVER DRAWER (MOBILE AND DESKTOP)        */}
      {/* ============================================================ */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            onClick={() => setIsMenuOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-fadeIn"
          />

          {/* Drawer Content */}
          <div className="relative w-full max-w-md h-full bg-[#030714] border-l border-cyan-500/30 shadow-2xl flex flex-col z-10 animate-slideLeft overflow-y-auto">
            {/* Drawer Header */}
            <div className="p-5 border-b border-cyan-500/20 flex items-center justify-between bg-slate-950/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
                  <Radio className="w-4 h-4 text-cyan-300" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-white text-base tracking-wider">
                    EARTH JUKEBOX
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400">
                    Workspace Navigation & Modes
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Sections */}
            <div className="flex-1 p-5 space-y-2">
              <div className="text-[10px] font-mono text-cyan-400/80 uppercase font-bold tracking-wider px-2 mb-2">
                WORKSPACES & FEATURES ("EKEK PART")
              </div>

              {navItems.map((item) => {
                const isActive = currentView === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectView(item.id)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition group flex items-center justify-between ${
                      isActive
                        ? "bg-cyan-950/50 border-cyan-400/70 text-white shadow-lg shadow-cyan-950/40"
                        : "bg-slate-900/50 border-slate-800/80 text-slate-300 hover:bg-slate-900 hover:border-cyan-500/30 hover:text-white"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-xl border mt-0.5 transition ${
                          isActive
                            ? "bg-cyan-500/20 border-cyan-400 text-cyan-300"
                            : "bg-slate-950 border-slate-800 text-slate-400 group-hover:text-cyan-300 group-hover:border-cyan-500/30"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-white group-hover:text-cyan-200 transition">
                            {item.title}
                          </span>
                          {item.badge && (
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                                isActive
                                  ? "bg-cyan-400 text-slate-950"
                                  : "bg-slate-800 text-slate-400"
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 font-sans">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-mono text-slate-500 group-hover:text-cyan-400 shrink-0 ml-2">
                      <span className="hidden sm:inline bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                        [{item.shortcut}]
                      </span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                    </div>
                  </button>
                );
              })}

              {/* Special Tools Section */}
              <div className="pt-4 border-t border-slate-900 space-y-2">
                <div className="text-[10px] font-mono text-cyan-400/80 uppercase font-bold tracking-wider px-2 mb-2">
                  EXPLORATION SHORTCUTS
                </div>

                {/* Quick Demo button */}
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onStartQuickDemo();
                  }}
                  className="w-full text-left p-3 rounded-xl bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/30 hover:border-amber-400 transition flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="text-xs font-bold text-amber-300 font-mono">
                        GUIDED INTERACTIVE TOUR
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Guided step-by-step walkthrough of all key sounds
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-amber-400" />
                </button>

                {/* AI Sound Narrator */}
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenNarrator();
                  }}
                  className="w-full text-left p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/30 transition flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <Bot className="w-4 h-4 text-cyan-400" />
                    <div>
                      <div className="text-xs font-bold text-slate-200 font-mono">
                        AI EARTH SOUND NARRATOR
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Instant plain-language audio science explanation
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                {/* Accessibility Mode Toggle */}
                <button
                  onClick={() => {
                    onToggleAccessibility();
                  }}
                  className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between ${
                    accessibility.captionsEnabled
                      ? "bg-cyan-950/40 border-cyan-400/50 text-cyan-200"
                      : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Eye className="w-4 h-4 text-cyan-400" />
                    <div>
                      <div className="text-xs font-bold font-mono">
                        ACCESSIBILITY & LIVE CAPTIONS
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {accessibility.captionsEnabled
                          ? "Captions Active (Screen Reader Friendly)"
                          : "Enable live audio descriptive captions"}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      accessibility.captionsEnabled
                        ? "bg-cyan-400 text-slate-950"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {accessibility.captionsEnabled ? "ON" : "OFF"}
                  </span>
                </button>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-cyan-500/20 bg-slate-950 text-xs font-mono text-slate-500 flex items-center justify-between">
              <span>Earth Information Jukebox</span>
              <span className="text-slate-400">Press 1–5 to jump</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
