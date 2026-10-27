import React, { useState } from 'react';
import { Search, RefreshCw, X, Play, Plus, Check, Music } from 'lucide-react';
import { searchYouTubeInApp } from '../services/inAppSearchService';
import { API_BASE_URL } from '../config/api';

const QUICK_CHIPS = [
  'เพลงฮิต',
  'Bodyslam',
  'Synthwave',
  'Lofi Beats',
  '90s Hits',
  'Rock',
  'Pop',
  'City Pop'
];

export const YouTubeSearchModal = ({
  isOpen,
  onClose,
  onPlayTrack,
  onAppendTrack
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [addedId, setAddedId] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSearch = async (searchTerm) => {
    const term = searchTerm || query;
    if (!term || !term.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Try search via Backend API (/api/search) first
      try {
        const res = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(term.trim())}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setResults(data);
            setLoading(false);
            return;
          }
        }
      } catch (backendErr) {
        console.warn('[SEARCH] Backend search fallback to in-app:', backendErr.message);
      }

      // 2. Fallback to direct In-App search
      const inAppData = await searchYouTubeInApp(term.trim());
      if (inAppData && inAppData.length > 0) {
        // Ensure streamUrl points to backend streaming endpoint
        const mapped = inAppData.map(item => ({
          ...item,
          streamUrl: `${API_BASE_URL}/api/stream/${item.videoId}`
        }));
        setResults(mapped);
      } else {
        setError(`No music tracks found for "${term}". Please try another keyword.`);
      }
    } catch (err) {
      console.error(err);
      setError('Search temporarily unavailable. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
    if (e.key === 'Escape') onClose();
  };

  const handleEnqueue = (item) => {
    onAppendTrack(item);
    setAddedId(item.videoId);
    setTimeout(() => setAddedId(null), 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none p-2">
      <div
        className="w-full max-w-[480px] bg-[#1c202e] border-2 border-t-[#ffffff] border-l-[#ffffff] border-b-[#000000] border-r-[#000000] shadow-2xl font-mono text-xs flex flex-col overflow-hidden"
        style={{ fontFamily: 'Tahoma, "Segoe UI", "MS Sans Serif", sans-serif' }}
      >
        {/* Title Bar */}
        <div className="bg-gradient-to-r from-[#000080] via-[#1030a0] to-[#000080] text-white px-2 py-1 flex items-center justify-between border-b border-black">
          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-[11px] tracking-wider uppercase drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
              ADD YOUTUBE MUSIC TRACK / SEARCH
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-4 h-4 bg-[#c0c0c0] hover:bg-rose-700 active:bg-[#808080] border border-t-[#ffffff] border-l-[#ffffff] border-b-black border-r-black text-black hover:text-white flex items-center justify-center text-[10px] font-bold"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-2 space-y-2 bg-[#181a24] text-slate-200">
          {/* Search Bar */}
          <div className="flex items-center gap-1.5">
            <div className="flex-1 bg-black border-2 border-t-black border-l-black border-b-[#4e5570] border-r-[#4e5570]">
              <input
                type="text"
                value={query}
                autoFocus
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type song title, artist, or keyword..."
                className="w-full bg-black text-[#00ff55] placeholder-[#006622] text-xs font-mono px-2 py-1.5 focus:outline-none"
              />
            </div>
            <button
              onClick={() => handleSearch()}
              disabled={loading || !query.trim()}
              className="px-3 py-1.5 bg-[#2a3045] hover:bg-[#384160] active:bg-[#1a1e2b] border border-t-[#525f87] border-l-[#525f87] border-b-black border-r-black text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center space-x-1 disabled:opacity-50 shrink-0"
            >
              {loading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
              ) : (
                <Search className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>FIND</span>
            </button>
          </div>

          {/* Quick Genre Chips */}
          <div className="flex items-center gap-1 overflow-x-auto text-[9px] font-mono py-0.5 custom-scrollbar">
            <span className="text-slate-400 shrink-0">CHIPS:</span>
            {QUICK_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => {
                  setQuery(chip);
                  handleSearch(chip);
                }}
                className="shrink-0 px-1.5 py-0.5 bg-[#222738] hover:bg-[#2d344d] text-slate-300 hover:text-white border border-t-[#454f73] border-l-[#454f73] border-b-black border-r-black text-[9px]"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Search Results Box */}
          <div className="bg-black border-2 border-t-black border-l-black border-b-[#4e5570] border-r-[#4e5570] h-56 overflow-y-auto custom-scrollbar font-mono text-xs">
            {loading && (
              <div className="h-full flex flex-col items-center justify-center text-[#00ff55] space-y-2 py-6">
                <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
                <span className="text-xs">SEARCHING YOUTUBE MUSIC...</span>
              </div>
            )}

            {!loading && results.length === 0 && !error && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-1.5 py-6 text-center px-4">
                <Music className="w-8 h-8 opacity-20 text-[#00ff55]" />
                <span className="text-xs text-slate-300">Ready to search YouTube Music</span>
                <span className="text-[10px] text-slate-500">Type a song or artist above and click FIND</span>
              </div>
            )}

            {!loading && error && (
              <div className="p-4 text-center space-y-2">
                <div className="text-rose-400 text-xs font-semibold">{error}</div>
                <div className="text-[10px] text-slate-400">
                  Target API: <span className="text-amber-300 font-mono">{API_BASE_URL.toString()}</span>
                </div>
                <button
                  onClick={() => {
                    const newUrl = prompt('Enter Backend Server URL (e.g. Render Cloud URL or Local IP):', API_BASE_URL.toString());
                    if (newUrl !== null) {
                      localStorage.setItem('winamp_backend_url', newUrl.trim());
                      window.location.reload();
                    }
                  }}
                  className="px-3 py-1 bg-[#2a3045] hover:bg-[#3d4663] text-amber-300 border border-t-[#525f87] border-l-[#525f87] border-b-black border-r-black text-[10px] font-bold"
                >
                  ⚙️ Change Backend URL
                </button>
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="divide-y divide-slate-800">
                {results.map((item, idx) => {
                  const isAdded = addedId === item.videoId;
                  return (
                    <div
                      key={item.videoId}
                      className="px-2 py-1.5 flex items-center justify-between hover:bg-[#15203b] transition-colors group text-[11px]"
                    >
                      <div className="flex items-center space-x-2 truncate min-w-0 mr-2">
                        <span className="text-slate-500 text-[10px] w-4 text-right shrink-0">
                          {idx + 1}.
                        </span>
                        <div className="truncate">
                          <div className="truncate text-slate-200 font-semibold group-hover:text-amber-300">
                            {item.title}
                          </div>
                          <div className="text-[9px] text-slate-400 truncate">
                            {item.artist} &bull; <span className="text-emerald-400">{item.duration}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          onClick={() => {
                            onPlayTrack(item);
                            onClose();
                          }}
                          title="Play Track Now"
                          className="px-2 py-0.5 bg-[#2a3045] hover:bg-amber-600 active:bg-[#151924] border border-t-[#4f597d] border-l-[#4f597d] border-b-black border-r-black text-[10px] font-bold text-slate-200 flex items-center space-x-1"
                        >
                          <Play className="w-2.5 h-2.5 fill-current" />
                          <span>PLAY</span>
                        </button>
                        <button
                          onClick={() => handleEnqueue(item)}
                          title="Add to Winamp Playlist"
                          className={`px-2 py-0.5 border text-[10px] font-bold flex items-center space-x-1 ${
                            isAdded
                              ? 'bg-[#004d00] text-[#00ff00] border-emerald-500'
                              : 'bg-[#2a3045] hover:bg-slate-700 active:bg-[#151924] border-t-[#4f597d] border-l-[#4f597d] border-b-black border-r-black text-slate-300'
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-2.5 h-2.5" />
                              <span>ADDED</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-2.5 h-2.5" />
                              <span>ENQUEUE</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Modal Footer Controls */}
          <div className="flex items-center justify-between pt-1 text-[11px]">
            <div className="flex items-center space-x-1.5">
              {results.length > 0 && (
                <button
                  onClick={() => {
                    results.forEach(r => onAppendTrack(r));
                    onClose();
                  }}
                  className="px-2.5 py-1 bg-[#252a3b] hover:bg-[#343b52] active:bg-[#141721] border border-t-[#4d5678] border-l-[#4d5678] border-b-black border-r-black font-bold text-emerald-400 text-[10px]"
                >
                  + ENQUEUE ALL ({results.length})
                </button>
              )}
            </div>

            <button
              onClick={onClose}
              className="px-4 py-1 bg-[#252a3b] hover:bg-[#343b52] active:bg-[#141721] border border-t-[#4d5678] border-l-[#4d5678] border-b-black border-r-black font-bold text-slate-300 text-[10px]"
            >
              CLOSE (ESC)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
