import React from 'react';
import { Zap, Radio, CheckCircle2, AlertCircle, Sparkles, Layers } from 'lucide-react';

export const HeaderBar = ({ backendStatus, currentSkinName, trackCount }) => {
  return (
    <header className="border-b border-cyan-900/40 bg-[#0d1117]/90 backdrop-blur-md sticky top-0 z-50 px-4 py-3 shadow-lg shadow-black/50">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 border border-amber-400/40 animate-pulse">
            <Zap className="w-5 h-5 text-black fill-black" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-wider font-['Chakra_Petch'] text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-cyan-400 uppercase">
                Winamp YTM
              </h1>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800">
                v2.91 Web+Stream
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Classic Winamp 10-Band EQ &middot; YouTube Music Streamer
            </p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center space-x-3 text-xs font-mono">
          {/* Active Skin Indicator */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-300">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400 hidden md:inline">Skin:</span>
            <span className="font-semibold text-cyan-300 truncate max-w-[140px]">{currentSkinName}</span>
          </div>

          {/* Backend Status Indicator */}
          <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md border ${
            backendStatus === 'online'
              ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300'
              : 'bg-rose-950/60 border-rose-700/60 text-rose-300'
          }`}>
            <Radio className={`w-3.5 h-3.5 ${backendStatus === 'online' ? 'animate-pulse text-emerald-400' : 'text-rose-400'}`} />
            <span className="hidden sm:inline">Backend :4000:</span>
            <span className="font-bold uppercase tracking-wider">{backendStatus}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
