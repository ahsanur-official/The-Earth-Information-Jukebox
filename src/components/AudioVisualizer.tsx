import React, { useEffect, useRef, useState } from "react";
import { sonificationEngine } from "../audio/SonificationEngine";
import { Activity, BarChart2, Radio, Volume2 } from "lucide-react";

interface AudioVisualizerProps {
  isPlaying: boolean;
  color?: string;
  variableName?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isPlaying,
  color = "#38bdf8",
  variableName = "Earth Science Sonification",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [visualMode, setVisualMode] = useState<"waveform" | "spectrum" | "both">("both");
  const [peakFreq, setPeakFreq] = useState<number>(0);
  const [rmsLevel, setRmsLevel] = useState<number>(0);

  useEffect(() => {
    let animationFrameId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const analyser = sonificationEngine.getAnalyserNode();
      const width = canvas.width;
      const height = canvas.height;

      // Dark background with subtle grid
      ctx.fillStyle = "rgba(6, 11, 25, 0.45)";
      ctx.fillRect(0, 0, width, height);

      // Draw subtle sci-fi grid
      ctx.strokeStyle = "rgba(56, 189, 248, 0.05)";
      ctx.lineWidth = 1;
      const step = 20;
      for (let x = 0; x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      if (!analyser || !isPlaying) {
        // Idle ambient subtle breathing line
        const now = Date.now() * 0.002;
        ctx.beginPath();
        ctx.strokeStyle = "rgba(100, 116, 139, 0.3)";
        ctx.lineWidth = 1.5;
        const midY = height / 2;
        for (let x = 0; x < width; x += 4) {
          const y = midY + Math.sin(x * 0.03 + now) * 3;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        setPeakFreq(0);
        setRmsLevel(0);
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      const bufferLength = analyser.frequencyBinCount;
      const timeData = new Uint8Array(bufferLength);
      const freqData = new Uint8Array(bufferLength);
      analyser.getByteTimeDomainData(timeData);
      analyser.getByteFrequencyData(freqData);

      // Compute RMS and peak frequency
      let sumSquares = 0;
      let maxFreqIndex = 0;
      let maxFreqVal = 0;
      for (let i = 0; i < bufferLength; i++) {
        const val = (timeData[i] - 128) / 128;
        sumSquares += val * val;

        if (freqData[i] > maxFreqVal) {
          maxFreqVal = freqData[i];
          maxFreqIndex = i;
        }
      }
      const calculatedRms = Math.min(1, Math.sqrt(sumSquares / bufferLength) * 3.5);
      const approxFreq = Math.round((maxFreqIndex * 24000) / bufferLength);

      setRmsLevel(calculatedRms);
      setPeakFreq(approxFreq);

      // Render Spectrum Bars
      if (visualMode === "spectrum" || visualMode === "both") {
        const barWidth = Math.max(2, (width / 64) - 1.5);
        const barCount = Math.floor(width / (barWidth + 1.5));
        for (let i = 0; i < barCount; i++) {
          const dataIdx = Math.floor((i / barCount) * (bufferLength / 3.5));
          const val = freqData[dataIdx] / 255;
          const barHeight = val * (height * 0.65);

          const grad = ctx.createLinearGradient(0, height, 0, height - barHeight);
          grad.addColorStop(0, "rgba(2, 132, 199, 0.2)");
          grad.addColorStop(0.7, color);
          grad.addColorStop(1, "rgba(255, 255, 255, 0.9)");

          ctx.fillStyle = grad;
          ctx.fillRect(i * (barWidth + 1.5), height - barHeight, barWidth, barHeight);
        }
      }

      // Render Waveform Oscilloscope Line
      if (visualMode === "waveform" || visualMode === "both") {
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
        ctx.lineWidth = 2;
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;

        const sliceWidth = (width * 1.0) / bufferLength;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
          const v = timeData[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }
        ctx.stroke();
        ctx.shadowBlur = 0; // reset
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, color, visualMode]);

  return (
    <div className="w-full glass-panel-subtle rounded-xl p-3 border border-cyan-500/20 shadow-lg relative overflow-hidden">
      {/* Top telemetry bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-1 border-b border-cyan-500/15 text-xs font-mono text-slate-300">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isPlaying ? "bg-cyan-400" : "bg-slate-500"
              }`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isPlaying ? "bg-cyan-500" : "bg-slate-600"
              }`}
            ></span>
          </span>
          <span className="font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            LIVE AUDIO TELEMETRY
          </span>
          <span className="text-slate-500 hidden sm:inline">|</span>
          <span className="text-cyan-300 hidden sm:inline">{variableName}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-900/70 px-2 py-0.5 rounded border border-slate-700/50">
            <Radio className="w-3 h-3 text-cyan-400" />
            <span>{isPlaying ? `${peakFreq} Hz` : "0 Hz"}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900/70 px-2 py-0.5 rounded border border-slate-700/50">
            <Volume2 className="w-3 h-3 text-emerald-400" />
            <span>{isPlaying ? `${(rmsLevel * 100).toFixed(0)}% RMS` : "Muted"}</span>
          </div>

          {/* Mode Switcher */}
          <div className="flex rounded bg-slate-900/80 p-0.5 border border-slate-800">
            <button
              onClick={() => setVisualMode("waveform")}
              className={`px-1.5 py-0.5 rounded text-[10px] transition ${
                visualMode === "waveform"
                  ? "bg-cyan-500/30 text-cyan-200 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Oscilloscope Waveform"
            >
              Wave
            </button>
            <button
              onClick={() => setVisualMode("spectrum")}
              className={`px-1.5 py-0.5 rounded text-[10px] transition ${
                visualMode === "spectrum"
                  ? "bg-cyan-500/30 text-cyan-200 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="FFT Spectrum"
            >
              Spectrum
            </button>
            <button
              onClick={() => setVisualMode("both")}
              className={`px-1.5 py-0.5 rounded text-[10px] transition ${
                visualMode === "both"
                  ? "bg-cyan-500/30 text-cyan-200 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Dual Wave + Spectrum"
            >
              Both
            </button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative w-full h-24 sm:h-28 bg-[#040814] rounded-lg overflow-hidden border border-slate-800/80">
        <canvas
          ref={canvasRef}
          width={800}
          height={180}
          className="w-full h-full block"
        />

        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 backdrop-blur-[1px] text-xs text-slate-400 font-mono pointer-events-none">
            <span className="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-full border border-slate-700/60 shadow">
              <BarChart2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              PRESS PLAY TO INITIATE REAL-TIME SONIFICATION
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
