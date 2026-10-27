import React, { useState } from 'react';
import { Search, Play, Plus, Clock, Music2, Eye, Sparkles, Loader2, Check } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

const QUICK_CHIPS = [
  'Synthwave Retro',
  'Lofi Beats to Relax',
  'Eurobeat 90s',
  'Classic Rock 80s',
  'Cyberpunk 2077 OST',
  'Thai Indie Pop'
];

export const SearchPanel = ({ onPlayTrack, onAppendTrack }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [addedId, setAddedId] = useState(null);

  const handleSearch = async (searchTerm) => {
    const term = searchTerm || query;
    if (!term || !term.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(term.trim())}`);
      if (!res.ok) {
        throw new Error(`Search failed with status: ${res.status}`);
      }
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error('Search error:', err);
      setError('Unable to reach YouTube Music search API. Ensure backend is running at ' + API_BASE_URL);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleAppend = (item) => {
    onAppendTrack(item);
    setAddedId(item.videoId);
    setTimeout(() => setAddedId(null), 1500);
  };

  return (
    <div className="bg-[#131720]/80 border border-slate-800 rounded-xl p-4 shadow-xl backdrop-blur-md flex flex-col h-full">
      {/* Panel Header */}
      <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center space-x-2">
          <Music2 className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider font-['Chakra_Petch'] text-slate-200">
            YouTube Music Search & Stream
          </h2>
        </div>
        <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
          Live Audio Stream Proxy
        </span>
      </div>

      {/* Search Bar Input */}
      <div className="relative mb-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search song, artist, album (e.g. Daft Punk, Synthwave)..."
          className="w-full bg-[#0b0e14] border border-slate-700/80 rounded-lg pl-10 pr-24 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all font-mono"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <button
          onClick={() => handleSearch()}
          disabled={loading || !query.trim()}
          className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold text-xs rounded-md flex items-center space-x-1.5 disabled:opacity-50 transition-all font-['Chakra_Petch'] uppercase tracking-wider"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <span>Search</span>
          )}
        </button>
      </div>

      {/* Quick Search Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 custom-scrollbar text-[11px]">
        <span className="text-slate-400 flex items-center gap-1 shrink-0">
          <Sparkles className="w-3 h-3 text-amber-400" /> Quick:
        </span>
        {QUICK_CHIPS.map((chip) => (
          <button
            key={chip}
            onClick={() => {
              setQuery(chip);
              handleSearch(chip);
            }}
            className="shrink-0 px-2 py-0.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 border border-slate-700/60 transition-colors"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3 mb-3 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs font-mono">
          {error}
        </div>
      )}

      {/* Results Container */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[480px] custom-scrollbar">
        {loading && (
          <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            <p className="text-xs font-mono">Searching YouTube Music catalogs...</p>
          </div>
        )}

        {!loading && results.length === 0 && !error && (
          <div className="py-12 text-center text-slate-400">
            <Music2 className="w-8 h-8 mx-auto mb-2 opacity-30 text-cyan-400" />
            <p className="text-xs">Type a keyword or pick a quick chip above to find songs</p>
            <p className="text-[11px] text-slate-400 mt-1">Direct stream audio connects to Winamp EQ & Spectrum</p>
          </div>
        )}

        {!loading && results.map((item) => {
          const isAdded = addedId === item.videoId;
          return (
            <div
              key={item.videoId}
              className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 flex items-center justify-between gap-3 group transition-all"
            >
              {/* Thumbnail with duration */}
              <div className="relative w-16 h-12 shrink-0 rounded overflow-hidden bg-black/60 border border-white/5">
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-[10px] font-mono px-1 rounded text-slate-300">
                  {item.duration}
                </span>
              </div>

              {/* Title & Artist */}
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-semibold text-slate-200 truncate group-hover:text-cyan-300 transition-colors" title={item.title}>
                  {item.title}
                </h4>
                <div className="flex items-center space-x-2 text-[11px] text-slate-400 truncate">
                  <span className="truncate">{item.artist}</span>
                  {item.views && (
                    <span className="shrink-0 text-slate-400">&bull; {item.views.toLocaleString()} views</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-1.5 shrink-0">
                {/* Play Now Button */}
                <button
                  onClick={() => onPlayTrack(item)}
                  title="Play Now in Winamp"
                  className="px-2.5 py-1.5 rounded bg-amber-500/90 hover:bg-amber-400 text-black font-bold text-xs flex items-center space-x-1 shadow-sm shadow-amber-500/20 transition-all active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span className="hidden sm:inline">Play</span>
                </button>

                {/* Add to Playlist Button */}
                <button
                  onClick={() => handleAppend(item)}
                  title="Add to Winamp Playlist"
                  className={`px-2 py-1.5 rounded text-xs font-medium border flex items-center space-x-1 transition-all active:scale-95 ${
                    isAdded
                      ? 'bg-emerald-900/60 border-emerald-500 text-emerald-300'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200 hover:text-white'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                      <span className="hidden sm:inline">Added</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Queue</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
