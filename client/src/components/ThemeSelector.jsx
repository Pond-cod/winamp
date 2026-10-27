import React from 'react';
import { SKINS } from '../config/skins';
import { Palette, Check, Sparkles } from 'lucide-react';

export const ThemeSelector = ({ currentSkinId, onSelectSkin }) => {
  return (
    <div className="bg-[#131720]/80 border border-slate-800 rounded-xl p-4 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center space-x-2">
          <Palette className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider font-['Chakra_Petch'] text-slate-200">
            10-Theme Selector Grid
          </h2>
        </div>
        <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded">
          10 Legendary Skins
        </span>
      </div>

      <p className="text-xs text-slate-400 mb-3">
        Click any theme to swap Winamp's look instantly, or right-click directly inside Winamp to choose from the classic menu:
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
        {SKINS.map((skin) => {
          const isActive = currentSkinId === skin.id;
          return (
            <button
              key={skin.id}
              onClick={() => onSelectSkin(skin)}
              className={`text-left p-2.5 rounded-lg border transition-all duration-200 flex flex-col justify-between relative group ${
                isActive
                  ? 'border-cyan-400 bg-cyan-950/30 shadow-md shadow-cyan-950/50 ring-1 ring-cyan-400/50'
                  : 'border-slate-800/80 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-850'
              }`}
            >
              <div className="flex items-start justify-between gap-1 w-full mb-1">
                <div className="flex items-center space-x-2">
                  <span
                    className="w-3 h-3 rounded-full border border-white/20 shrink-0"
                    style={{ backgroundColor: skin.accentColor }}
                  />
                  <span className={`text-xs font-semibold truncate ${isActive ? 'text-cyan-300' : 'text-slate-200 group-hover:text-white'}`}>
                    {skin.name}
                  </span>
                </div>
                {isActive && (
                  <span className="shrink-0 p-0.5 rounded-full bg-cyan-500 text-black">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-400 line-clamp-1 mb-1.5">
                {skin.description}
              </p>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span className="px-1.5 py-0.2 rounded bg-black/40 border border-white/5 uppercase">
                  {skin.tag}
                </span>
                <span className="text-slate-400 group-hover:text-cyan-400 transition-colors">
                  {isActive ? 'Active Theme' : 'Apply Skin →'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
