import React, { useState } from 'react';
import { Search, RefreshCw, X, Minus, Square, Music } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

const QUICK_CHIPS = [
  'Synthwave',
  'Lofi Beats',
  'Eurobeat 90s',
  'Rock 80s',
  'Cyberpunk',
  'City Pop'
];

export const WinampMediaLibrary = ({
  backendStatus,
  onPlayTrack,
  onAppendTrack,
  onClose
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [addedId, setAddedId] = useState(null);
  const [error, setError] = useState(null);

  const handleSearch = async (searchTerm) => {
    const term = searchTerm || query;
    if (!term || !term.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(term.trim())}`);
      if (!res.ok) throw new Error(`Search failed: HTTP ${res.status}`);
      const data = await res.json();
      setResults(data);
      setSelectedIndex(0);
    } catch (err) {
      console.error(err);
      setError('Cannot connect to YouTube Music API: ' + API_BASE_URL);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleEnqueue = (item) => {
    onAppendTrack(item);
    setAddedId(item.videoId);
    setTimeout(() => setAddedId(null), 1200);
  };

  return (
    <div
      id="media-library-window"
      className="w-full max-w-[340px] sm:max-w-[440px] lg:max-w-[540px] h-[486px] bg-[#1a1c26] border-2 border-t-[#3f455d] border-l-[#3f455d] border-b-[#0b0d14] border-r-[#0b0d14] shadow-2xl shadow-black font-sans text-slate-200 select-none flex flex-col justify-between mx-auto box-border overflow-hidden"
    >
      {/* 1. Classic Winamp Window Title Bar */}
      <div className="bg-gradient-to-r from-[#1c2030] via-[#2f354c] to-[#1c2030] px-1.5 py-1 flex items-center justify-between border-b border-[#0b0d14] cursor-move shrink-0">
        <div className="flex items-center space-x-1.5 overflow-hidden min-w-0">
          <div className="flex flex-col space-y-[2px] opacity-60 shrink-0">
            <div className="w-2.5 h-[1px] bg-white/70" />
            <div className="w-2.5 h-[1px] bg-black/70" />
            <div className="w-2.5 h-[1px] bg-white/70" />
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold tracking-wider font-mono uppercase text-[#c3cad9] drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] truncate">
            WINAMP MEDIA LIBRARY &bull; YTM
          </span>
        </div>

        {/* Retro Window Control Buttons */}
        <div className="flex items-center space-x-1 shrink-0 ml-1">
          <button
            onClick={onClose}
            title="Minimize / Hide Media Library"
            className="w-3.5 h-3 bg-[#2a2f42] hover:bg-[#383f58] border border-t-[#4e5778] border-l-[#4e5778] border-b-black border-r-black flex items-center justify-center text-[8px] text-slate-300"
          >
            <Minus className="w-2 h-2 stroke-[3]" />
          </button>
          <button
            title="Maximize"
            className="w-3.5 h-3 bg-[#2a2f42] hover:bg-[#383f58] border border-t-[#4e5778] border-l-[#4e5778] border-b-black border-r-black flex items-center justify-center text-[8px] text-slate-300"
          >
            <Square className="w-1.5 h-1.5" />
          </button>
          <button
            onClick={onClose}
            title="Close / Hide Media Library (Alt+L)"
            className="w-3.5 h-3 bg-[#2a2f42] hover:bg-rose-900 border border-t-[#4e5778] border-l-[#4e5778] border-b-black border-r-black flex items-center justify-center text-[8px] text-slate-300"
          >
            <X className="w-2 h-2 stroke-[3]" />
          </button>
        </div>
      </div>

      {/* 2. Subheader & LED Status */}
      <div className="bg-[#14161f] px-2 py-1 flex items-center justify-between border-b border-[#0b0d14] text-[10px] font-mono shrink-0">
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-amber-300 font-bold uppercase tracking-wider text-[10px] sm:text-[11px]">
            YOUTUBE MUSIC SEARCH
          </span>
        </div>

        {/* LED Status Indicator */}
        <div className="flex items-center space-x-1 text-[9px] shrink-0">
          <span className={`px-1.5 py-0.2 rounded-sm font-bold ${
            backendStatus === 'online' ? 'bg-[#002800] text-[#00ff00] border border-[#005500]' : 'bg-[#330000] text-[#ff3333] border border-[#660000]'
          }`}>
            {backendStatus === 'online' ? ':4000 OK' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* 3. Main Search & Results Panel Body */}
      <div className="p-1.5 flex-1 flex flex-col justify-between overflow-hidden">
        {/* Inset Search Box */}
        <div className="flex items-center gap-1 mb-1 shrink-0">
          <div className="flex-1 relative bg-black border-2 border-t-black border-l-black border-b-[#3c4257] border-r-[#3c4257]">
            <input
              id="ytm-search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search song or artist on YouTube Music..."
              className="w-full bg-black text-[#00ff55] placeholder-[#006622] text-[11px] font-mono px-1.5 py-1 focus:outline-none"
            />
          </div>
          <button
            onClick={() => handleSearch()}
            disabled={loading || !query.trim()}
            className="px-2.5 py-1 bg-[#2a3045] hover:bg-[#363e59] active:bg-[#1a1e2b] border border-t-[#4d577d] border-l-[#4d577d] border-b-black border-r-black text-[10px] sm:text-xs font-bold text-slate-200 uppercase font-mono tracking-wider flex items-center space-x-1 disabled:opacity-50 shrink-0"
          >
            {loading ? (
              <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
            ) : (
              <Search className="w-3 h-3 text-amber-400" />
            )}
            <span>FIND</span>
          </button>
        </div>

        {/* Quick Genres Presets */}
        <div className="flex items-center gap-1 overflow-x-auto text-[9px] font-mono py-0.5 mb-1 custom-scrollbar shrink-0">
          <span className="text-slate-400 shrink-0">CHIPS:</span>
          {QUICK_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => {
                setQuery(chip);
                handleSearch(chip);
              }}
              className="shrink-0 px-1 py-0.5 bg-[#202433] hover:bg-[#2e344a] text-slate-300 hover:text-white border border-t-[#3b435e] border-l-[#3b435e] border-b-black border-r-black text-[9px]"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Search Results Table - Fully Responsive */}
        <div className="bg-black border-2 border-t-black border-l-black border-b-[#3c4257] border-r-[#3c4257] flex-1 overflow-y-auto custom-scrollbar font-mono text-xs">
          {loading && (
            <div className="h-full flex flex-col items-center justify-center text-[#00ff55] space-y-1.5 py-6">
              <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
              <span className="text-[10px]">SCANNING YOUTUBE MUSIC...</span>
            </div>
          )}

          {!loading && results.length === 0 && !error && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-1 py-6 text-center px-2">
              <Music className="w-6 h-6 opacity-20 text-[#00ff55]" />
              <span className="text-[10px] text-slate-300">NO MEDIA LOADED</span>
              <span className="text-[9px] text-slate-400">Type a keyword above or select a chip to search</span>
            </div>
          )}

          {!loading && error && (
            <div className="p-2 text-rose-400 text-[10px]">
              {error}
            </div>
          )}

          {!loading && results.length > 0 && (
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-[#171b26] text-slate-400 border-b border-slate-800 text-[9px] sticky top-0 uppercase">
                  <th className="py-1 px-1 w-5 text-center">#</th>
                  <th className="py-1 px-1">TRACK TITLE</th>
                  <th className="py-1 px-1 w-24 hidden sm:table-cell">ARTIST</th>
                  <th className="py-1 px-1 w-12 text-right">TIME</th>
                  <th className="py-1 px-1 w-16 text-center">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {results.map((item, idx) => {
                  const isSelected = selectedIndex === idx;
                  const isAdded = addedId === item.videoId;
                  return (
                    <tr
                      key={item.videoId}
                      onClick={() => setSelectedIndex(idx)}
                      onDoubleClick={() => onPlayTrack(item)}
                      className={`cursor-pointer transition-colors border-b border-slate-900/40 text-[10px] ${
                        isSelected
                          ? 'bg-[#000080] text-white font-semibold'
                          : 'hover:bg-[#1a2238] text-slate-300'
                      }`}
                    >
                      <td className="py-1 px-1 text-slate-400 text-center">{idx + 1}</td>
                      <td className="py-1 px-1 truncate" title={item.title}>
                        <div className="truncate font-semibold">{item.title}</div>
                        <div className="text-[9px] text-slate-400 truncate sm:hidden">{item.artist}</div>
                      </td>
                      <td className="py-1 px-1 truncate text-slate-400 hidden sm:table-cell" title={item.artist}>
                        {item.artist}
                      </td>
                      <td className="py-1 px-1 text-right text-emerald-400 font-mono text-[9px]">
                        {item.duration}
                      </td>
                      <td className="py-1 px-0.5 text-center">
                        <div className="flex items-center justify-center space-x-0.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onPlayTrack(item);
                            }}
                            title="Play Now in Winamp"
                            className="px-1 py-0.5 bg-[#2a3045] hover:bg-amber-600 active:bg-[#151924] border border-t-[#4f597d] border-l-[#4f597d] border-b-black border-r-black text-[9px] font-bold text-slate-200"
                          >
                            ▶
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEnqueue(item);
                            }}
                            title="Enqueue into Winamp Playlist"
                            className={`px-1 py-0.5 border text-[9px] font-bold ${
                              isAdded
                                ? 'bg-[#004d00] text-[#00ff00] border-emerald-500'
                                : 'bg-[#2a3045] hover:bg-slate-700 active:bg-[#151924] border-t-[#4f597d] border-l-[#4f597d] border-b-black border-r-black text-slate-300'
                            }`}
                          >
                            {isAdded ? 'OK' : '+'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* 4. Bottom Winamp Button Bar */}
        <div className="flex items-center justify-between pt-1 shrink-0 text-[9px]">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => {
                if (results[selectedIndex]) onPlayTrack(results[selectedIndex]);
              }}
              disabled={!results[selectedIndex]}
              className="px-1.5 py-0.5 bg-[#252a3b] hover:bg-[#343b52] active:bg-[#141721] border border-t-[#4d5678] border-l-[#4d5678] border-b-black border-r-black font-bold font-mono text-amber-300 disabled:opacity-40"
            >
              PLAY ITEM
            </button>
            <button
              onClick={() => {
                if (results[selectedIndex]) handleEnqueue(results[selectedIndex]);
              }}
              disabled={!results[selectedIndex]}
              className="px-1.5 py-0.5 bg-[#252a3b] hover:bg-[#343b52] active:bg-[#141721] border border-t-[#4d5678] border-l-[#4d5678] border-b-black border-r-black font-bold font-mono text-slate-200 disabled:opacity-40"
            >
              ENQUEUE
            </button>
            <button
              onClick={() => {
                results.forEach(r => onAppendTrack(r));
              }}
              disabled={results.length === 0}
              className="px-1.5 py-0.5 bg-[#252a3b] hover:bg-[#343b52] active:bg-[#141721] border border-t-[#4d5678] border-l-[#4d5678] border-b-black border-r-black font-bold font-mono text-slate-300 disabled:opacity-40 hidden sm:inline-block"
            >
              ALL
            </button>
          </div>

          <div className="text-[9px] font-mono text-slate-400">
            {results.length > 0 ? `${results.length} TRACKS` : 'READY'}
          </div>
        </div>
      </div>
    </div>
  );
};
