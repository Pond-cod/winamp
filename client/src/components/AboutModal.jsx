import React, { useState } from 'react';
import { Zap, Check, Music, Server, RefreshCw } from 'lucide-react';

export const AboutModal = ({ isOpen, onClose }) => {
  const [backendUrl, setBackendUrlInput] = useState(() => {
    return localStorage.getItem('winamp_backend_url') || 'http://localhost:4000';
  });
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSaveBackend = () => {
    const trimmed = backendUrl.trim().replace(/\/+$/, '');
    if (trimmed) {
      localStorage.setItem('winamp_backend_url', trimmed);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    }
  };

  const handleResetPlaylist = () => {
    if (confirm('Reset playlist to default Winamp Llama Intro?')) {
      localStorage.removeItem('winamp_ytm_playlist');
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none p-2">
      <div
        className="w-full max-w-[420px] bg-[#d4d0c8] text-black border-2 border-t-[#ffffff] border-l-[#ffffff] border-b-[#404040] border-r-[#404040] shadow-2xl font-sans text-xs flex flex-col overflow-hidden"
        style={{ fontFamily: 'Tahoma, "Segoe UI", "MS Sans Serif", sans-serif' }}
      >
        {/* Title Bar */}
        <div className="bg-gradient-to-r from-[#000080] via-[#1030a0] to-[#000080] text-white px-2 py-1 flex items-center justify-between border-b border-black">
          <span className="font-bold text-[11px] tracking-wider uppercase">
            About Winamp 2.91 - YouTube Music Edition
          </span>
          <button
            onClick={onClose}
            className="w-4 h-4 bg-[#c0c0c0] hover:bg-rose-700 active:bg-[#808080] border border-t-[#ffffff] border-l-[#ffffff] border-b-black border-r-black text-black hover:text-white flex items-center justify-center text-[10px] font-bold"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-3.5 space-y-2.5 bg-[#ece9d8]">
          <div className="flex items-center space-x-3 bg-gradient-to-r from-[#1c2237] to-[#2a3350] p-3 text-white border border-[#404040] shadow-inner">
            <Zap className="w-9 h-9 text-amber-400 fill-amber-400 shrink-0 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            <div>
              <div className="font-black text-base tracking-wider font-mono text-amber-300">
                WINAMP 2.91
              </div>
              <div className="text-[10px] text-slate-300">
                YouTube Music Edition &bull; 10 Classic Skins
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-800 space-y-1 leading-relaxed bg-[#f8f7f3] p-2 border border-[#808080]">
            <p className="italic font-serif font-bold text-slate-900">
              &ldquo;Winamp, it really whips the llama&rsquo;s ass!&rdquo;
            </p>
            <p className="text-[10px] text-slate-600">
              Powered by Webamp, Web Audio API 10-Band EQ, and Node.js Audio Stream Proxy.
            </p>
          </div>

          {/* Android Mobile Connection / Server Configuration */}
          <div className="bg-[#dfdbd0] p-2 border border-[#808080] space-y-1.5">
            <div className="text-[10px] font-bold text-slate-700 flex items-center justify-between uppercase">
              <span className="flex items-center space-x-1">
                <Server className="w-3 h-3 text-[#0a246a]" />
                <span>Backend Server IP (For Mobile APK)</span>
              </span>
              {savedSuccess && <span className="text-emerald-700 font-bold">✓ Saved!</span>}
            </div>
            <div className="flex items-center space-x-1.5">
              <input
                type="text"
                value={backendUrl}
                onChange={(e) => setBackendUrlInput(e.target.value)}
                placeholder="http://192.168.1.xxx:4000"
                className="flex-1 px-2 py-0.5 bg-white border border-t-[#404040] border-l-[#404040] border-b-[#ffffff] border-r-[#ffffff] text-[11px] font-mono focus:outline-none"
              />
              <button
                onClick={handleSaveBackend}
                className="px-2.5 py-0.5 bg-[#d4d0c8] hover:bg-[#e4e0d8] active:bg-[#b0aca4] border border-t-[#ffffff] border-l-[#ffffff] border-b-[#404040] border-r-[#404040] font-bold text-[10px]"
              >
                Save
              </button>
            </div>
            <p className="text-[9px] text-slate-500">
              If running APK on mobile, set your PC LAN IP (e.g. http://192.168.1.50:4000).
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={handleResetPlaylist}
              title="Reset playlist tracks back to initial state"
              className="px-2 py-1 bg-[#d4d0c8] hover:bg-[#e4e0d8] active:bg-[#b0aca4] border border-t-[#ffffff] border-l-[#ffffff] border-b-[#404040] border-r-[#404040] text-[10px] text-slate-700 flex items-center space-x-1"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              <span>Reset Playlist</span>
            </button>
            <button
              onClick={onClose}
              autoFocus
              className="px-6 py-1 bg-[#d4d0c8] hover:bg-[#e4e0d8] active:bg-[#b0aca4] border-2 border-t-[#ffffff] border-l-[#ffffff] border-b-[#404040] border-r-[#404040] font-bold text-xs"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
