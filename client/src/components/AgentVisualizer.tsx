import React, { useEffect, useRef } from 'react';
import { AgentState } from '../types/index';

interface AgentVisualizerProps {
  state: AgentState;
  micAmplitude: number; // 0 to 100
  latestText?: string;
}

export const AgentVisualizer: React.FC<AgentVisualizerProps> = ({
  state,
  micAmplitude,
  latestText,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Audio Waveform Canvas rendering inside bottom screen of Monolith
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      phase += 0.08;

      ctx.beginPath();
      const bars = 36;
      const barWidth = 2;
      const gap = (width - bars * barWidth) / (bars + 1);

      for (let i = 0; i < bars; i++) {
        const x = gap + i * (barWidth + gap);
        let barHeight = 4;

        if (state === 'listening') {
          const noise = Math.sin(i * 0.4 + phase) * 0.5 + 0.5;
          barHeight = Math.max(4, (micAmplitude / 100) * height * 0.75 * noise);
        } else if (state === 'speaking') {
          const wave = Math.sin(i * 0.35 + phase * 1.5);
          barHeight = Math.max(6, Math.abs(wave) * height * 0.7);
        } else if (state === 'processing') {
          const wave = Math.sin(i * 0.5 + phase * 2);
          barHeight = Math.max(4, Math.abs(wave) * height * 0.5);
        } else {
          const wave = Math.sin(i * 0.2 + phase * 0.5);
          barHeight = Math.max(3, Math.abs(wave) * 6);
        }

        ctx.fillStyle = state === 'processing' ? '#F2B84B' : state === 'error' ? '#FF5C5C' : '#E6EDF3';
        ctx.fillRect(x, centerY - barHeight / 2, barWidth, barHeight);
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [state, micAmplitude]);

  const defaultDisplayText = "SYSTEMS NOMINAL.\nONLINE AND READY TO ASSIST.\nWHAT DO YOU NEED HELP WITH?";

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-xl mx-auto py-0.5 sm:py-1 select-none">
      {/* Outer Metallic Monolith Structure (5-Pillar Interstellar Robot Module) */}
      <div className="relative flex w-full max-w-[490px] h-[210px] sm:h-[340px] lg:h-[430px] rounded-sm bg-gradient-to-b from-[#242933] via-[#161a22] to-[#0a0d12] p-1 sm:p-1.5 shadow-[0_20px_60px_rgba(0,0,0,0.95)] border border-[#26313D]">
        
        {/* Pillar 1 (Left Outer Steel Block) */}
        <div className="w-[19%] h-full bg-gradient-to-r from-[#323847] via-[#202430] to-[#12161f] border-r border-black/90 flex flex-col justify-between p-1 shadow-inner relative">
          <div className="w-full h-[40%] border-b border-black/80 bg-gradient-to-b from-slate-600/20 to-transparent" />
          <div className="w-full h-[55%] bg-gradient-to-t from-slate-700/20 to-transparent" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[1px] h-12 sm:h-16 bg-slate-500/30" />
        </div>

        {/* Pillar 2 (Left Inner Steel Block) */}
        <div className="w-[17%] h-full bg-gradient-to-r from-[#242834] to-[#141822] border-r border-black flex flex-col justify-between relative">
          <div className="w-full h-[30%] border-b border-black/80" />
          <div className="w-full h-[65%]" />
        </div>

        {/* Pillar 3 & 4 (Center Screen Display Column) */}
        <div className="w-[48%] h-full bg-[#05070A] flex flex-col border-x border-[#26313D] shadow-2xl relative z-10">
          
          {/* Top Screen: LED Dot Matrix Title */}
          <div className="h-[28%] bg-[#06080D] border-b border-[#26313D] p-1.5 sm:p-3 flex flex-col items-center justify-center relative overflow-hidden">
            {/* LED Matrix Grid Background */}
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#E6EDF3_1px,transparent_1px)] [background-size:5px_5px]" />
            <h1 className="text-sm sm:text-xl font-mono font-bold tracking-[0.4em] text-[#E6EDF3] drop-shadow-[0_0_10px_rgba(230,237,243,0.8)]">
              T A R S
            </h1>
            <div className="flex items-center gap-1 mt-1 sm:mt-2">
              <span className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-[#E6EDF3] animate-pulse" />
              <span className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-[#7E8B98]" />
              <span className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-[#7E8B98]" />
              <span className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-[#7E8B98]" />
            </div>
          </div>

          {/* Middle Screen: Digital Text Output Display */}
          <div className="h-[42%] bg-[#080B10] border-b border-[#26313D] p-2 sm:p-4 flex items-center justify-center text-center relative overflow-hidden">
            <div className="absolute inset-0 scanlines opacity-30 pointer-events-none" />
            <p className="text-[9px] sm:text-[11px] font-mono tracking-widest text-[#E6EDF3] uppercase leading-snug sm:leading-relaxed font-semibold max-h-full overflow-hidden whitespace-pre-line">
              {latestText || defaultDisplayText}
            </p>
          </div>

          {/* Bottom Screen: Audio Waveform & Status State */}
          <div className="h-[30%] bg-[#05070A] p-1 sm:p-2.5 flex flex-col items-center justify-between relative">
            <div className="w-full flex-1 flex items-center justify-center">
              <canvas ref={canvasRef} width={200} height={36} className="w-[140px] sm:w-[200px] h-[22px] sm:h-[36px]" />
            </div>

            <div className="space-y-0.5 text-center pb-0.5">
              <span className="text-[8px] sm:text-[10px] font-mono tracking-[0.25em] sm:tracking-[0.3em] text-[#E6EDF3] font-bold uppercase">
                {state === 'speaking' ? 'RESPONDING' : state === 'listening' ? 'L I S T E N I N G' : state === 'processing' ? 'ANALYZING...' : 'L I S T E N I N G'}
              </span>
            </div>
          </div>
        </div>

        {/* Pillar 5 (Right Inner Steel Block) */}
        <div className="w-[17%] h-full bg-gradient-to-l from-[#242834] to-[#141822] border-l border-black flex flex-col justify-between relative">
          <div className="w-full h-[30%] border-b border-black/80" />
          <div className="w-full h-[65%]" />
        </div>

        {/* Pillar 6 (Right Outer Steel Block) */}
        <div className="w-[19%] h-full bg-gradient-to-l from-[#323847] via-[#202430] to-[#12161f] border-l border-black/90 flex flex-col justify-between p-1 shadow-inner relative">
          <div className="w-full h-[40%] border-b border-black/80 bg-gradient-to-b from-slate-600/20 to-transparent" />
          <div className="w-full h-[55%] bg-gradient-to-t from-slate-700/20 to-transparent" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[1px] h-16 bg-slate-500/30" />
        </div>
      </div>

      {/* Ground Shadow Reflection */}
      <div className="w-[400px] h-3 bg-gradient-to-r from-transparent via-black to-transparent blur-md mt-1" />
    </div>
  );
};
