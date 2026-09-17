import React, { useState, useEffect } from "react";
import { Sparkles, X, ChevronRight, ChevronLeft, Play, CheckCircle, Radio } from "lucide-react";
import { VariableId } from "../types";

interface QuickDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVariable: (id: VariableId) => void;
  onSetYear: (year: number) => void;
  onStartSound: () => void;
  onEnableOrchestra: () => void;
  onNavigateSection: (sectionId: string) => void;
}

export const QuickDemoModal: React.FC<QuickDemoModalProps> = ({
  isOpen,
  onClose,
  onSelectVariable,
  onSetYear,
  onStartSound,
  onEnableOrchestra,
  onNavigateSection,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);

  const demoSteps = [
    {
      title: "1. Global Temperature Anomaly",
      highlight: "Rising Pitch & Thermal Harmonic Intensity",
      variable: "temperature" as VariableId,
      year: 2024,
      section: "dashboard",
      narrative:
        "Welcome to the Earth Jukebox. Notice how the temperature anomaly (+1.18°C) drives a high, cutting tone in the upper frequency spectrum. As we sweep through the years, the pitch ascends dramatically with modern planetary warming.",
      action: () => {
        onSelectVariable("temperature");
        onSetYear(2024);
        onStartSound();
        onNavigateSection("dashboard");
      },
    },
    {
      title: "2. Arctic Sea Ice Decline",
      highlight: "Crystalline High Bell Resonance",
      variable: "ice" as VariableId,
      year: 2012,
      section: "dashboard",
      narrative:
        "Listen to Arctic Sea Ice Coverage during 2012's record low (3.41M km²). The sound is mapped to a crystalline, high-frequency bell resonance with acute filter Q, evoking brittle polar ice extent.",
      action: () => {
        onSelectVariable("ice");
        onSetYear(2012);
        onStartSound();
        onNavigateSection("dashboard");
      },
    },
    {
      title: "3. Atmospheric CO2 Burden",
      highlight: "Harmonic Microtonal Tension Drone",
      variable: "co2" as VariableId,
      year: 2024,
      section: "dashboard",
      narrative:
        "Carbon Dioxide has exceeded 424 ppm (from 338 ppm in 1980). The sonification introduces deliberate microtonal acoustic beating and detuned harmonic tension, directly reflecting greenhouse retention.",
      action: () => {
        onSelectVariable("co2");
        onSetYear(2024);
        onStartSound();
        onNavigateSection("dashboard");
      },
    },
    {
      title: "4. The Earth Orchestra Ensemble",
      highlight: "Multi-Variable Polyphonic Harmony",
      variable: "temperature" as VariableId,
      year: 2024,
      section: "orchestra",
      narrative:
        "Now listen to all Earth layers sounding together! Temperature sings the melody, ocean heat carries the sub-bass, wind provides the rhythmic pulse, vegetation provides the harmony pad, and wildfires add granular crackle.",
      action: () => {
        onEnableOrchestra();
        onStartSound();
        onNavigateSection("orchestra");
      },
    },
    {
      title: "5. Hear The Change: 1985 vs 2024",
      highlight: "Direct Auditory Delta (Δ) Comparison",
      variable: "temperature" as VariableId,
      year: 2024,
      section: "change",
      narrative:
        "Our signature 'Hear The Change' engine allows instant A/B auditory comparisons between historical baseline (1985) and modern era (2024). Hear how +1.1°C of physical heat shifts pitch upward by over 200 Hz.",
      action: () => {
        onNavigateSection("change");
      },
    },
    {
      title: "6. Multi-Sensory & Inclusive Science",
      highlight: "Visual Oscilloscope & Accessible Captions",
      variable: "temperature" as VariableId,
      year: 2024,
      section: "dashboard",
      narrative:
        "By pairing real-time audio synthesis with the 3D globe, frequency analyzer, and live screen-reader captions, NASA Earth Information Center science becomes accessible to both sighted and visually impaired explorers.",
      action: () => {
        onNavigateSection("dashboard");
      },
    },
  ];

  useEffect(() => {
    if (isOpen) {
      demoSteps[currentStep].action();
    }
  }, [isOpen, currentStep]);

  if (!isOpen) return null;

  const stepData = demoSteps[currentStep];

  const handleNext = () => {
    if (currentStep < demoSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg glass-panel rounded-2xl p-6 border border-amber-500/40 shadow-2xl bg-slate-950/95 text-left">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 text-amber-400 text-xs font-mono uppercase font-bold tracking-wider mb-2">
          <Sparkles className="w-4 h-4" />
          <span>GUIDED AUDIO TOUR • STEP {currentStep + 1} OF {demoSteps.length}</span>
        </div>

        <h3 className="font-display font-extrabold text-xl text-white mb-1">
          {stepData.title}
        </h3>

        <div className="text-xs font-mono text-cyan-300 mb-4 bg-cyan-950/50 px-2.5 py-1 rounded border border-cyan-500/30 inline-block">
          {stepData.highlight}
        </div>

        <p className="text-sm text-slate-300 leading-relaxed font-sans mb-6">
          {stepData.narrative}
        </p>

        {/* Step Progress Indicators */}
        <div className="flex gap-1.5 mb-6">
          {demoSteps.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                idx === currentStep
                  ? "bg-amber-400"
                  : idx < currentStep
                  ? "bg-cyan-500"
                  : "bg-slate-800"
              }`}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:pointer-events-none transition flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <button
            onClick={handleNext}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs font-mono shadow-lg transition hover:opacity-95 flex items-center gap-1.5"
          >
            <span>{currentStep === demoSteps.length - 1 ? "FINISH TOUR" : "NEXT HIGHLIGHT"}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
