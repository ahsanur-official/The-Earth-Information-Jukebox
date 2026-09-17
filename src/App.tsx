import React, { useState, useEffect, useRef } from "react";
import {
  VariableId,
  SonificationMappingConfig,
  OrchestraTrack,
  AccessibilitySettings,
} from "./types";
import { nasaDataService } from "./services/NASADataService";
import { sonificationEngine } from "./audio/SonificationEngine";

// Components
import { Navbar, AppViewId } from "./components/Navbar";
import { HeroSection } from "./components/HeroSection";
import { AudioVisualizer } from "./components/AudioVisualizer";
import { EarthGlobe } from "./components/EarthGlobe";
import { DataLayerSelector } from "./components/DataLayerSelector";
import { SonificationPanel } from "./components/SonificationPanel";
import { TimeSlider } from "./components/TimeSlider";
import { DataChart } from "./components/DataChart";
import { EarthOrchestra } from "./components/EarthOrchestra";
import { HearTheChange } from "./components/HearTheChange";
import { AudioMappingGuide } from "./components/AudioMappingGuide";
import { ScienceExplainer } from "./components/ScienceExplainer";
import { AccessibilityMode } from "./components/AccessibilityMode";
import { DataSourcePanel } from "./components/DataSourcePanel";
import { AINarratorModal } from "./components/AINarratorModal";
import { QuickDemoModal } from "./components/QuickDemoModal";
import { EICVisualSonifier } from "./components/EICVisualSonifier";
import { UnifiedStudio } from "./components/UnifiedStudio";
import { VideoSonificationEngine } from "./components/VideoSonificationEngine";
import { Footer } from "./components/Footer";

// Icons for Workspace switcher
import {
  Globe2,
  Radio,
  Layers,
  Clock,
  BarChart3,
  Sliders,
  Database,
  ArrowRight,
  Eye,
  FileVideo,
} from "lucide-react";

export type PillarFocusType = "all" | "visual" | "mapping" | "synthesis";

export default function App() {
  // 1. Current Workspace View ("ekek part ekek jaigai rakho")
  const [currentView, setCurrentView] = useState<AppViewId>("studio");
  const [pillarFocus, setPillarFocus] = useState<PillarFocusType>("all");

  // 2. Core Audio & Data State
  const [currentVariable, setCurrentVariable] = useState<VariableId>("temperature");
  const [currentYear, setCurrentYear] = useState<number>(2024);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.75);

  const [mappingConfig, setMappingConfig] = useState<SonificationMappingConfig>({
    pitchInverted: false,
    sensitivity: 1.0,
    baseFrequency: 140,
    maxFrequency: 840,
    timbre: "sine",
    reverbAmount: 0.3,
  });

  // 3. Timeline Auto-Playback
  const [isPlayingTime, setIsPlayingTime] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const timeIntervalRef = useRef<number | null>(null);

  // 4. Earth Orchestra State
  const [isOrchestraActive, setIsOrchestraActive] = useState<boolean>(false);
  const [orchestraTracks, setOrchestraTracks] = useState<OrchestraTrack[]>([
    { variableId: "temperature", name: "Temperature", role: "Melody", enabled: true, volume: 0.8, solo: false, color: "#f97316", timbre: "FM Lead" },
    { variableId: "ocean", name: "Ocean Heat", role: "Sub Bass", enabled: true, volume: 0.85, solo: false, color: "#0284c7", timbre: "Sub Sine" },
    { variableId: "wind", name: "Wind Speed", role: "Noise Rhythm", enabled: true, volume: 0.6, solo: false, color: "#38bdf8", timbre: "Wind Sweeps" },
    { variableId: "precipitation", name: "Precipitation", role: "Percussion Droplets", enabled: true, volume: 0.7, solo: false, color: "#3b82f6", timbre: "Water Drops" },
    { variableId: "vegetation", name: "Vegetation", role: "Harmony Pad", enabled: true, volume: 0.65, solo: false, color: "#10b981", timbre: "Lush Chords" },
    { variableId: "wildfire", name: "Wildfires", role: "Granular Texture", enabled: false, volume: 0.5, solo: false, color: "#ef4444", timbre: "Crackle Texture" },
  ]);

  // 5. Accessibility State
  const [accessibility, setAccessibility] = useState<AccessibilitySettings>({
    screenReaderDescriptions: true,
    highContrast: false,
    reducedMotion: false,
    captionsEnabled: true,
    soundCueOnTimeChange: true,
    fontSize: "normal",
    keyboardNav: true,
  });

  // 6. Modals & Data Source
  const [isNarratorOpen, setIsNarratorOpen] = useState<boolean>(false);
  const [isQuickDemoOpen, setIsQuickDemoOpen] = useState<boolean>(false);
  const [dataSourceMode, setDataSourceMode] = useState<"LIVE_NASA" | "DEMO_DATA">("DEMO_DATA");

  // Computed dataset properties
  const allVariables = nasaDataService.getAllVariables();
  const currentMetadata = nasaDataService.getVariableMetadata(currentVariable);
  const timeSeries = nasaDataService.getTimeSeries(currentVariable);
  const currentDataPoint = nasaDataService.getDataPointForYear(currentVariable, currentYear);

  // Check NASA API status on boot
  useEffect(() => {
    nasaDataService.checkLiveConnection().then((status) => {
      setDataSourceMode(status.isLive ? "LIVE_NASA" : "DEMO_DATA");
    });
  }, []);

  // Keyboard Shortcuts (1-5 to switch views, Space for play/pause, M for mute)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === "1") setCurrentView("video");
      else if (e.key === "2") setCurrentView("studio");
      else if (e.key === "3") setCurrentView("orchestra");
      else if (e.key === "4") setCurrentView("data");
      else if (e.key === "5") setCurrentView("sources");
      else if (e.code === "Space") {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.key.toLowerCase() === "m") {
        handleToggleMute();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, isPaused, isMuted, isOrchestraActive]);

  // Update sound engine on variable, year, or orchestra changes (for non-studio views)
  useEffect(() => {
    if (currentView !== "studio" && isPlaying && !isPaused) {
      if (isOrchestraActive) {
        sonificationEngine.updateOrchestraYear(currentYear);
      } else {
        sonificationEngine.playDataPoint(currentVariable, currentDataPoint, mappingConfig);
      }
    }
  }, [currentView, currentVariable, currentYear, isPlaying, isPaused, isOrchestraActive]);

  // Cleanly silence all audio when navigating between workspace views
  useEffect(() => {
    sonificationEngine.stop();
    setIsPlaying(false);
    setIsPaused(false);
  }, [currentView]);

  // Handle Timeline Playback
  useEffect(() => {
    if (isPlayingTime) {
      const intervalMs = Math.max(120, 1000 / playbackSpeed);
      timeIntervalRef.current = window.setInterval(() => {
        setCurrentYear((prevYear) => {
          if (prevYear >= 2025) {
            return 1980;
          }
          return prevYear + 1;
        });
      }, intervalMs);
    } else {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
        timeIntervalRef.current = null;
      }
    }

    return () => {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
    };
  }, [isPlayingTime, playbackSpeed]);

  // Toggle Sound Play / Stop
  const handleTogglePlay = async () => {
    if (isPlaying) {
      if (isPaused) {
        if (currentView !== "studio") {
          await sonificationEngine.start();
        }
        setIsPaused(false);
      } else {
        sonificationEngine.stop();
        setIsPlaying(false);
        setIsPaused(false);
      }
    } else {
      if (currentView !== "studio") {
        await sonificationEngine.start();
        if (isOrchestraActive) {
          sonificationEngine.setOrchestraMode(true, orchestraTracks);
          sonificationEngine.updateOrchestraYear(currentYear);
        } else {
          sonificationEngine.playDataPoint(currentVariable, currentDataPoint, mappingConfig);
        }
      }
      setIsPlaying(true);
      setIsPaused(false);
    }
  };

  const handleStop = () => {
    sonificationEngine.stop();
    setIsPlaying(false);
    setIsPaused(false);
    setIsPlayingTime(false);
  };

  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    sonificationEngine.setMuted(nextMute);
  };

  const handleSelectVariable = (id: VariableId) => {
    setCurrentVariable(id);
    sonificationEngine.setVariable(id);
  };

  // Orchestra Handlers
  const handleToggleOrchestra = async () => {
    const nextState = !isOrchestraActive;
    setIsOrchestraActive(nextState);

    if (nextState) {
      if (!isPlaying) {
        await sonificationEngine.start();
        setIsPlaying(true);
        setIsPaused(false);
      }
      sonificationEngine.setOrchestraMode(true, orchestraTracks);
      sonificationEngine.updateOrchestraYear(currentYear);
    } else {
      sonificationEngine.setOrchestraMode(false, []);
      if (isPlaying) {
        sonificationEngine.playDataPoint(currentVariable, currentDataPoint, mappingConfig);
      }
    }
  };

  const handleTrackToggle = (variableId: string) => {
    const updated = orchestraTracks.map((t) =>
      t.variableId === variableId ? { ...t, enabled: !t.enabled } : t
    );
    setOrchestraTracks(updated);
    sonificationEngine.updateOrchestraTracks(updated);
  };

  const handleTrackSolo = (variableId: string) => {
    const isCurrentlySolo = orchestraTracks.find((t) => t.variableId === variableId)?.solo;
    const updated = orchestraTracks.map((t) => {
      if (isCurrentlySolo) {
        return { ...t, solo: false, enabled: true };
      } else {
        return { ...t, solo: t.variableId === variableId, enabled: t.variableId === variableId };
      }
    });
    setOrchestraTracks(updated);
    sonificationEngine.updateOrchestraTracks(updated);
  };

  const handleTrackVolume = (variableId: string, vol: number) => {
    const updated = orchestraTracks.map((t) =>
      t.variableId === variableId ? { ...t, volume: vol } : t
    );
    setOrchestraTracks(updated);
    sonificationEngine.updateOrchestraTracks(updated);
  };

  const handlePresetSelect = (presetName: string) => {
    let updated = [...orchestraTracks];
    if (presetName === "Planetary Symphony") {
      updated = updated.map((t) => ({ ...t, enabled: true, solo: false }));
    } else if (presetName === "Ocean-Atmosphere Coupled") {
      updated = updated.map((t) => ({
        ...t,
        enabled: t.variableId === "ocean" || t.variableId === "wind" || t.variableId === "precipitation",
        solo: false,
      }));
    } else if (presetName === "Storm Surge") {
      updated = updated.map((t) => ({
        ...t,
        enabled: t.variableId === "wind" || t.variableId === "precipitation" || t.variableId === "temperature",
        solo: false,
      }));
    } else if (presetName === "Fire & Ice Extreme") {
      updated = updated.map((t) => ({
        ...t,
        enabled: t.variableId === "wildfire" || t.variableId === "temperature",
        solo: false,
      }));
    }
    setOrchestraTracks(updated);
    sonificationEngine.updateOrchestraTracks(updated);
  };

  // Hear The Change Morph Sweep
  const handleMorphTransition = async (yearA: number, yearB: number) => {
    if (!isPlaying) {
      await sonificationEngine.start();
      setIsPlaying(true);
      setIsPaused(false);
    }

    setCurrentYear(yearA);
    const steps = 15;
    const intervalMs = 200;
    let stepCount = 0;

    const timer = setInterval(() => {
      stepCount++;
      const currentInterpolatedYear = Math.round(
        yearA + (stepCount / steps) * (yearB - yearA)
      );
      setCurrentYear(currentInterpolatedYear);

      if (stepCount >= steps) {
        clearInterval(timer);
        setCurrentYear(yearB);
      }
    }, intervalMs);
  };

  // Navigation handler from Hamburger Menu, Hero, or Modals
  const handleNavigateView = (view: AppViewId | string) => {
    if (view === "video" || view === "videoplayer") {
      setCurrentView("video");
    } else if (view === "dashboard" || view === "studio" || view === "hero" || view === "eic") {
      setCurrentView("studio");
    } else if (view === "orchestra") {
      setCurrentView("orchestra");
    } else if (view === "data" || view === "change") {
      setCurrentView("data");
    } else if (view === "sources" || view === "science") {
      setCurrentView("sources");
    } else {
      setCurrentView("studio");
    }

    // Scroll smoothly to workspace area
    const mainArea = document.getElementById("workspace-area");
    if (mainArea) {
      mainArea.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const workspaceTabs = [
    {
      id: "video" as AppViewId,
      label: "Video Sonifier (Tone.js)",
      icon: FileVideo,
      badge: "Tone.js Audio",
      color: "text-amber-400",
    },
    {
      id: "studio" as AppViewId,
      label: "Earth Jukebox Studio",
      icon: Radio,
      badge: "Sight-to-Sound",
      color: "text-cyan-400",
    },
    {
      id: "orchestra" as AppViewId,
      label: "The Earth Orchestra",
      icon: Layers,
      badge: "6-Track Mixer",
      color: "text-blue-400",
    },
    {
      id: "data" as AppViewId,
      label: "Data Matrix & Trends",
      icon: BarChart3,
      badge: "11 Variables",
      color: "text-emerald-400",
    },
    {
      id: "sources" as AppViewId,
      label: "Missions & Registry",
      icon: Database,
      badge: "Open Data",
      color: "text-purple-400",
    },
  ];

  return (
    <div
      className={`min-h-screen bg-[#030612] text-slate-100 selection:bg-cyan-500 selection:text-slate-950 ${
        accessibility.highContrast ? "contrast-125 brightness-110" : ""
      }`}
    >
      {/* Top Navbar with HAMBURGER MENU on both mobile and desktop */}
      <Navbar
        currentView={currentView}
        onChangeView={handleNavigateView}
        isPlaying={isPlaying && !isPaused}
        isMuted={isMuted}
        onTogglePlay={handleTogglePlay}
        onToggleMute={handleToggleMute}
        onStartQuickDemo={() => setIsQuickDemoOpen(true)}
        accessibility={accessibility}
        onToggleAccessibility={() =>
          setAccessibility((prev) => ({
            ...prev,
            captionsEnabled: !prev.captionsEnabled,
          }))
        }
        dataSourceMode={dataSourceMode}
        onOpenNarrator={() => setIsNarratorOpen(true)}
      />

      {/* Main Minimal Workspace Area */}
      <div id="workspace-area" className="max-w-[1720px] 2xl:max-w-[1880px] w-full mx-auto px-3 sm:px-6 lg:px-10 xl:px-12 pt-4 pb-16">
        {/* Sleek Universal Workspace Switcher Bar */}
        <div className="mb-5 sm:mb-6 p-2 rounded-2xl bg-slate-950/80 border border-slate-800/90 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-0.5">
            {workspaceTabs.map((tab) => {
              const isActive = currentView === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentView(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                    isActive
                      ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25 font-extrabold"
                      : "bg-slate-900/60 text-slate-300 hover:bg-slate-900 hover:text-white border border-slate-800/80"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-slate-950" : tab.color}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="hidden xl:flex items-center gap-2 text-[10px] font-mono text-slate-400 px-3 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Zero Pre-Recorded Audio • Dynamic Real-Time Synthesis</span>
          </div>
        </div>

        {/* Studio Pillar Sub-Selector (only when on Earth Jukebox Studio) */}
        {currentView === "studio" && (
          <div className="mb-4 p-2.5 sm:p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-[11px] font-semibold text-cyan-300">STUDIO FOCUS:</span>
              <span className="text-[10px] text-slate-500 hidden sm:inline">Inspect individual sight-to-sound stages or view all 3 simultaneously</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setPillarFocus("all")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  pillarFocus === "all"
                    ? "bg-cyan-500 text-slate-950 shadow-sm"
                    : "bg-slate-900 text-slate-300 hover:text-white border border-slate-800"
                }`}
              >
                All 3 Stages
              </button>
              <button
                onClick={() => setPillarFocus("visual")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  pillarFocus === "visual"
                    ? "bg-cyan-500 text-slate-950 shadow-sm"
                    : "bg-slate-900 text-slate-300 hover:text-white border border-slate-800"
                }`}
              >
                1. Visual Analysis
              </button>
              <button
                onClick={() => setPillarFocus("mapping")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  pillarFocus === "mapping"
                    ? "bg-cyan-500 text-slate-950 shadow-sm"
                    : "bg-slate-900 text-slate-300 hover:text-white border border-slate-800"
                }`}
              >
                2. Sonification Rules
              </button>
              <button
                onClick={() => setPillarFocus("synthesis")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  pillarFocus === "synthesis"
                    ? "bg-cyan-500 text-slate-950 shadow-sm"
                    : "bg-slate-900 text-slate-300 hover:text-white border border-slate-800"
                }`}
              >
                3. Audio Synthesis
              </button>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* WORKSPACE VIEW 0: VIDEO SONIFICATION ENGINE (TONE.JS)            */}
        {/* ================================================================ */}
        {currentView === "video" && (
          <div className="animate-fadeIn">
            <VideoSonificationEngine />
          </div>
        )}

        {/* ================================================================ */}
        {/* WORKSPACE VIEW 1: UNIFIED STUDIO (3 CORE PILLARS)               */}
        {/* ================================================================ */}
        {currentView === "studio" && (
          <UnifiedStudio
            pillarFocus={pillarFocus}
            onPillarFocusChange={setPillarFocus}
            onOpenOrchestraDrawer={() => setCurrentView("orchestra")}
            onOpenSourcesModal={() => setCurrentView("sources")}
            onOpenNarratorModal={() => setIsNarratorOpen(true)}
            isGlobalPlaying={isPlaying}
            isGlobalMuted={isMuted}
            onAudioActiveChange={(active) => {
              setIsPlaying(active);
              if (active) {
                sonificationEngine.stop();
              }
            }}
          />
        )}

        {/* ================================================================ */}
        {/* WORKSPACE VIEW 2: THE EARTH ORCHESTRA (6-TRACK MIXER)           */}
        {/* ================================================================ */}
        {currentView === "orchestra" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-display font-extrabold text-white flex items-center gap-2">
                  <Layers className="w-6 h-6 text-blue-400" />
                  The Earth Orchestra (6-Track Polyphonic Ensemble)
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 font-sans mt-0.5">
                  Listen to interconnected planetary spheres simultaneously: Temperature leads, ocean provides sub-bass, and winds drive rhythm.
                </p>
              </div>

              <button
                onClick={() => setCurrentView("studio")}
                className="flex items-center gap-1.5 text-xs font-mono text-cyan-300 hover:text-white bg-slate-900 border border-cyan-500/30 px-3.5 py-2 rounded-xl transition"
              >
                <span>Return to Unified Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Earth Orchestra Console */}
            <EarthOrchestra
              isOrchestraActive={isOrchestraActive}
              tracks={orchestraTracks}
              onToggleOrchestra={handleToggleOrchestra}
              onTrackToggle={handleTrackToggle}
              onTrackSolo={handleTrackSolo}
              onTrackVolume={handleTrackVolume}
              onPresetSelect={handlePresetSelect}
            />

            {/* Timeline Slider */}
            <TimeSlider
              currentYear={currentYear}
              minYear={1980}
              maxYear={2025}
              isPlayingTime={isPlayingTime}
              playbackSpeed={playbackSpeed}
              onYearChange={(y) => setCurrentYear(y)}
              onTogglePlayTime={() => {
                if (!isPlaying) handleTogglePlay();
                setIsPlayingTime(!isPlayingTime);
              }}
              onSpeedChange={(s) => setPlaybackSpeed(s)}
              onResetTime={() => setCurrentYear(1980)}
            />
          </div>
        )}

        {/* ================================================================ */}
        {/* WORKSPACE VIEW 3: DATA MATRIX & HISTORICAL CURVES               */}
        {/* ================================================================ */}
        {currentView === "data" && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-display font-extrabold text-white flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-emerald-400" />
                  NASA Environmental Data Matrix & Historical Curves (1980–2025)
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 font-sans mt-0.5">
                  Explore 11 planetary observation datasets across atmosphere, ocean, cryosphere, and biosphere.
                </p>
              </div>

              <button
                onClick={() => setCurrentView("studio")}
                className="flex items-center gap-1.5 text-xs font-mono text-cyan-300 hover:text-white bg-slate-900 border border-cyan-500/30 px-3.5 py-2 rounded-xl transition"
              >
                <span>Return to Unified Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Matrix & Chart */}
            <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-cyan-500/25 shadow-xl">
              <DataLayerSelector
                variables={allVariables}
                selectedVariableId={currentVariable}
                onSelectVariable={handleSelectVariable}
                isPlaying={isPlaying && !isPaused}
              />
            </div>

            <DataChart
              data={timeSeries}
              metadata={currentMetadata}
              currentYear={currentYear}
              onSelectYear={(y) => setCurrentYear(y)}
            />
          </div>
        )}

        {/* ================================================================ */}
        {/* WORKSPACE VIEW 4: NASA MISSIONS & VERIFIED DOIS                 */}
        {/* ================================================================ */}
        {currentView === "sources" && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-display font-extrabold text-white flex items-center gap-2">
                  <Database className="w-6 h-6 text-purple-400" />
                  Verified NASA Missions, Satellite Sensors & DOIs
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 font-sans mt-0.5">
                  Complete citations, instrument registry, DOI links, and live NASA Earthdata API status.
                </p>
              </div>

              <button
                onClick={() => setCurrentView("studio")}
                className="flex items-center gap-1.5 text-xs font-mono text-cyan-300 hover:text-white bg-slate-900 border border-cyan-500/30 px-3.5 py-2 rounded-xl transition"
              >
                <span>Return to Unified Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <DataSourcePanel
              variables={allVariables}
              statusMode={dataSourceMode}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <Footer />

      {/* AI Earth Sound Narrator Modal */}
      <AINarratorModal
        isOpen={isNarratorOpen}
        onClose={() => setIsNarratorOpen(false)}
        metadata={currentMetadata}
        currentDataPoint={currentDataPoint}
      />

      {/* 3-Minute Quick Demo Walkthrough Modal */}
      <QuickDemoModal
        isOpen={isQuickDemoOpen}
        onClose={() => setIsQuickDemoOpen(false)}
        onSelectVariable={handleSelectVariable}
        onSetYear={(y) => setCurrentYear(y)}
        onStartSound={async () => {
          if (!isPlaying || isPaused) {
            await sonificationEngine.start();
            setIsPlaying(true);
            setIsPaused(false);
          }
        }}
        onEnableOrchestra={async () => {
          setIsOrchestraActive(true);
          sonificationEngine.setOrchestraMode(true, orchestraTracks);
        }}
        onNavigateSection={handleNavigateView}
      />
    </div>
  );
}
