import React, { useState, useRef, useEffect } from 'react';
import { SKINS } from '../config/skins';
import { EQ_PRESETS } from './WebampPlayer';
import { getApiBaseUrl, setBackendUrl } from '../config/api';

export const WinampMenuBar = ({
  currentSkin,
  onSelectSkin,
  onOpenYouTubeSearch,
  showMediaLibrary,
  onToggleMediaLibrary,
  isFullscreen,
  onToggleFullscreen,
  webampRef,
  onAbout,
  onExit,
  backendStatus = 'checking'
}) => {
  const [openMenu, setOpenMenu] = useState(null); // 'file' | 'play' | 'options' | 'skins' | 'view' | 'help' | null
  const [showOptionsSkinsSubmenu, setShowOptionsSkinsSubmenu] = useState(false);
  const [showOptionsEqSubmenu, setShowOptionsEqSubmenu] = useState(false);
  const [showPlaySleepSubmenu, setShowPlaySleepSubmenu] = useState(false);
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState(0);
  const [sleepSecondsLeft, setSleepSecondsLeft] = useState(0);
  const barRef = useRef(null);

  // Close menus when clicking or tapping outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (barRef.current && !barRef.current.contains(e.target)) {
        setOpenMenu(null);
        setShowOptionsSkinsSubmenu(false);
        setShowOptionsEqSubmenu(false);
        setShowPlaySleepSubmenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Sleep Timer countdown and auto-pause
  useEffect(() => {
    if (sleepTimerMinutes <= 0) {
      setSleepSecondsLeft(0);
      return;
    }

    setSleepSecondsLeft(sleepTimerMinutes * 60);

    const interval = setInterval(() => {
      setSleepSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          getWebamp()?.pause();
          setSleepTimerMinutes(0);
          console.log('[SLEEP TIMER] Reached zero: audio paused.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sleepTimerMinutes]);

  const handleSetSleepTimer = (minutes) => {
    setSleepTimerMinutes(minutes);
  };

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const toggleMenu = (menuName) => {
    setOpenMenu(openMenu === menuName ? null : menuName);
    setShowOptionsSkinsSubmenu(false);
    setShowOptionsEqSubmenu(false);
    setShowPlaySleepSubmenu(false);
  };

  const handleMenuHover = (menuName) => {
    if (openMenu !== null && openMenu !== menuName) {
      setOpenMenu(menuName);
      setShowOptionsSkinsSubmenu(false);
      setShowOptionsEqSubmenu(false);
      setShowPlaySleepSubmenu(false);
    }
  };

  const handleAction = (callback) => {
    if (callback) callback();
    setOpenMenu(null);
    setShowOptionsSkinsSubmenu(false);
    setShowOptionsEqSubmenu(false);
    setShowPlaySleepSubmenu(false);
  };

  const getWebamp = () => webampRef?.current?.getWebampInstance();

  return (
    <div
      ref={barRef}
      className="relative w-[275px] bg-[#d4d0c8] text-black border border-t-[#ffffff] border-l-[#ffffff] border-b-[#808080] border-r-[#808080] select-none font-sans text-[11px] z-50 shadow-sm"
      style={{ fontFamily: 'Tahoma, "Segoe UI", "MS Sans Serif", sans-serif' }}
    >
      {/* Top Menu Bar Items */}
      <div className="flex items-center justify-between px-1 py-[2px] bg-gradient-to-b from-[#f2f0ea] to-[#d8d4cc]">
        <div className="flex items-center space-x-0.5">
          {/* File Menu */}
          <div className="relative">
            <button
              onClick={() => toggleMenu('file')}
              onMouseEnter={() => handleMenuHover('file')}
              className={`px-1.5 py-[1px] text-[11px] font-medium leading-none focus:outline-none ${
                openMenu === 'file'
                  ? 'bg-[#0a246a] text-white shadow-inner'
                  : 'hover:bg-[#2e5ea8] hover:text-white active:bg-[#0a246a]'
              }`}
            >
              <span className="underline">F</span>ile
            </button>

            {openMenu === 'file' && (
              <div className="absolute left-0 top-full mt-[1px] w-[245px] bg-[#d4d0c8] text-black border-2 border-t-[#ffffff] border-l-[#ffffff] border-b-[#404040] border-r-[#404040] shadow-2xl py-0.5 z-50">
                <div
                  onClick={() => handleAction(onOpenYouTubeSearch)}
                  className="px-3 py-1 hover:bg-[#0a246a] hover:text-white flex items-center justify-between cursor-pointer text-[11px] font-semibold text-emerald-900 hover:text-white"
                >
                  <span>Add YouTube Music...</span>
                  <span className="text-[10px] text-slate-600 group-hover:text-white font-mono">Ctrl+F</span>
                </div>
                <div
                  onClick={() => handleAction(onToggleMediaLibrary)}
                  className="px-3 py-1 hover:bg-[#0a246a] hover:text-white flex items-center justify-between cursor-pointer text-[11px]"
                >
                  <span>Media Library</span>
                  <span className="text-[10px] text-slate-600 font-mono">Alt+L</span>
                </div>
                <div
                  onClick={() => handleAction(() => {
                    const url = prompt('Enter Audio Stream URL:');
                    if (url && webampRef?.current) {
                      webampRef.current.playTrack({
                        title: 'Stream URL',
                        artist: 'Internet Radio',
                        streamUrl: url
                      });
                    }
                  })}
                  className="px-3 py-1 hover:bg-[#0a246a] hover:text-white flex items-center justify-between cursor-pointer text-[11px]"
                >
                  <span>Play URL...</span>
                  <span className="text-[10px] text-slate-600 font-mono">Ctrl+L</span>
                </div>
                <div className="border-t border-[#808080] border-b border-[#ffffff] my-1" />
                <div
                  onClick={() => handleAction(() => {
                    const pl = document.getElementById('playlist-window');
                    if (pl) pl.scrollIntoView({ behavior: 'smooth' });
                  })}
                  className="px-3 py-1 hover:bg-[#0a246a] hover:text-white flex items-center justify-between cursor-pointer text-[11px]"
                >
                  <span>Open Playlist</span>
                  <span className="text-[10px] text-slate-600 font-mono">Ctrl+O</span>
                </div>
                <div className="border-t border-[#808080] border-b border-[#ffffff] my-1" />
                <div
                  onClick={() => handleAction(onExit)}
                  className="px-3 py-1 hover:bg-[#a00000] hover:text-white flex items-center justify-between cursor-pointer text-[11px] font-semibold text-rose-800"
                >
                  <span>Exit &amp; Stop Backend</span>
                  <span className="text-[10px] text-slate-600 font-mono">Alt+F4</span>
                </div>
              </div>
            )}
          </div>

          {/* Play Menu */}
          <div className="relative">
            <button
              onClick={() => toggleMenu('play')}
              onMouseEnter={() => handleMenuHover('play')}
              className={`px-1.5 py-[1px] text-[11px] font-medium leading-none focus:outline-none ${
                openMenu === 'play'
                  ? 'bg-[#0a246a] text-white shadow-inner'
                  : 'hover:bg-[#2e5ea8] hover:text-white active:bg-[#0a246a]'
              }`}
            >
              <span className="underline">P</span>lay
            </button>

            {openMenu === 'play' && (
              <div className="absolute left-[-25px] top-full mt-[1px] w-[245px] bg-[#d4d0c8] text-black border-2 border-t-[#ffffff] border-l-[#ffffff] border-b-[#404040] border-r-[#404040] shadow-2xl py-0.5 z-50 max-h-[85vh] overflow-y-auto retro-scrollbar">
                <div
                  onClick={() => handleAction(() => getWebamp()?.previousTrack())}
                  className="px-3 py-1 hover:bg-[#0a246a] hover:text-white flex items-center justify-between cursor-pointer text-[11px]"
                >
                  <span>Previous</span>
                  <span className="text-[10px] text-slate-600 font-mono">Z</span>
                </div>
                <div
                  onClick={() => handleAction(() => getWebamp()?.play())}
                  className="px-3 py-1 hover:bg-[#0a246a] hover:text-white flex items-center justify-between cursor-pointer text-[11px] font-bold"
                >
                  <span>Play / Resume</span>
                  <span className="text-[10px] text-slate-600 font-mono">X</span>
                </div>
                <div
                  onClick={() => handleAction(() => getWebamp()?.pause())}
                  className="px-3 py-1 hover:bg-[#0a246a] hover:text-white flex items-center justify-between cursor-pointer text-[11px]"
                >
                  <span>Pause</span>
                  <span className="text-[10px] text-slate-600 font-mono">C</span>
                </div>
                <div
                  onClick={() => handleAction(() => getWebamp()?.stop())}
                  className="px-3 py-1 hover:bg-[#0a246a] hover:text-white flex items-center justify-between cursor-pointer text-[11px]"
                >
                  <span>Stop</span>
                  <span className="text-[10px] text-slate-600 font-mono">V</span>
                </div>
                <div
                  onClick={() => handleAction(() => getWebamp()?.nextTrack())}
                  className="px-3 py-1 hover:bg-[#0a246a] hover:text-white flex items-center justify-between cursor-pointer text-[11px]"
                >
                  <span>Next</span>
                  <span className="text-[10px] text-slate-600 font-mono">B</span>
                </div>

                <div className="border-t border-[#808080] border-b border-[#ffffff] my-1" />

                {/* Sleep Timer In-line Accordion Section */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPlaySleepSubmenu(!showPlaySleepSubmenu);
                  }}
                  className={`px-3 py-1 flex items-center justify-between cursor-pointer text-[11px] font-semibold transition-colors ${
                    showPlaySleepSubmenu ? 'bg-[#0a246a] text-white' : 'hover:bg-[#0a246a] hover:text-white'
                  }`}
                >
                  <span className="flex items-center space-x-1.5">
                    <span>⏱️</span>
                    <span>Sleep Timer</span>
                    {sleepTimerMinutes > 0 && (
                      <span className="text-[9px] text-amber-300 bg-[#000080] px-1 rounded font-mono font-bold">
                        {formatTimer(sleepSecondsLeft)}
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] font-mono">{showPlaySleepSubmenu ? '▼' : '►'}</span>
                </div>

                {showPlaySleepSubmenu && (
                  <div className="bg-[#b8b4ab] border-y border-[#808080] py-0.5 shadow-inner">
                    {[
                      { min: 0, label: 'Off (Disabled)' },
                      { min: 15, label: '15 Minutes' },
                      { min: 30, label: '30 Minutes' },
                      { min: 45, label: '45 Minutes' },
                      { min: 60, label: '60 Minutes' }
                    ].map((opt) => (
                      <div
                        key={opt.min}
                        onClick={() => handleAction(() => handleSetSleepTimer(opt.min))}
                        className={`px-4 py-1 flex items-center justify-between cursor-pointer text-[10px] ${
                          sleepTimerMinutes === opt.min
                            ? 'bg-[#0a246a] text-white font-bold'
                            : 'hover:bg-[#2e5ea8] hover:text-white text-slate-900'
                        }`}
                      >
                        <div className="flex items-center space-x-1.5">
                          <span className="w-3 text-center">{sleepTimerMinutes === opt.min ? '✓' : ''}</span>
                          <span>{opt.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Options Menu (Contains In-line Accordion Skins & EQ Presets) */}
          <div className="relative">
            <button
              onClick={() => toggleMenu('options')}
              onMouseEnter={() => handleMenuHover('options')}
              className={`px-1.5 py-[1px] text-[11px] font-medium leading-none focus:outline-none ${
                openMenu === 'options'
                  ? 'bg-[#0a246a] text-white shadow-inner'
                  : 'hover:bg-[#2e5ea8] hover:text-white active:bg-[#0a246a]'
              }`}
            >
              <span className="underline">O</span>ptions
            </button>

            {openMenu === 'options' && (
              <div className="absolute left-[-55px] top-full mt-[1px] w-[255px] bg-[#d4d0c8] text-black border-2 border-t-[#ffffff] border-l-[#ffffff] border-b-[#404040] border-r-[#404040] shadow-2xl py-0.5 z-50 max-h-[85vh] overflow-y-auto retro-scrollbar">
                {/* In-line Skins Accordion */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowOptionsSkinsSubmenu(!showOptionsSkinsSubmenu);
                  }}
                  className={`px-3 py-1 flex items-center justify-between cursor-pointer text-[11px] font-semibold transition-colors ${
                    showOptionsSkinsSubmenu ? 'bg-[#0a246a] text-white' : 'hover:bg-[#0a246a] hover:text-white'
                  }`}
                >
                  <span className="flex items-center space-x-1.5">
                    <span>🎨</span>
                    <span>Skins ({SKINS.length})</span>
                  </span>
                  <span className="text-[10px] font-mono">{showOptionsSkinsSubmenu ? '▼' : '►'}</span>
                </div>

                {showOptionsSkinsSubmenu && (
                  <div className="bg-[#b8b4ab] border-y border-[#808080] py-0.5 max-h-48 overflow-y-auto retro-scrollbar shadow-inner">
                    {SKINS.map((skin) => {
                      const isActive = currentSkin.id === skin.id;
                      return (
                        <div
                          key={skin.id}
                          onClick={() => handleAction(() => onSelectSkin(skin))}
                          className={`px-4 py-1 flex items-center justify-between cursor-pointer text-[10px] ${
                            isActive
                              ? 'bg-[#0a246a] text-white font-bold'
                              : 'hover:bg-[#2e5ea8] hover:text-white text-slate-900'
                          }`}
                        >
                          <div className="flex items-center space-x-1.5 truncate">
                            <span className="w-3 text-center font-bold">{isActive ? '✓' : ''}</span>
                            <span
                              className="w-2.5 h-2.5 rounded-sm border border-black shrink-0"
                              style={{ backgroundColor: skin.accentColor }}
                            />
                            <span className="truncate">{skin.name}</span>
                          </div>
                          <span className={`text-[9px] uppercase px-1 rounded shrink-0 font-mono ${
                            isActive ? 'bg-[#1a3a8a] text-amber-200' : 'bg-slate-300 text-slate-700'
                          }`}>
                            {skin.tag}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* In-line EQ Presets Accordion */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowOptionsEqSubmenu(!showOptionsEqSubmenu);
                  }}
                  className={`px-3 py-1 flex items-center justify-between cursor-pointer text-[11px] font-semibold transition-colors ${
                    showOptionsEqSubmenu ? 'bg-[#0a246a] text-white' : 'hover:bg-[#0a246a] hover:text-white text-amber-950'
                  }`}
                >
                  <span className="flex items-center space-x-1.5">
                    <span>🎚️</span>
                    <span>EQ Presets (10-Band)</span>
                  </span>
                  <span className="text-[10px] font-mono">{showOptionsEqSubmenu ? '▼' : '►'}</span>
                </div>

                {showOptionsEqSubmenu && (
                  <div className="bg-[#b8b4ab] border-y border-[#808080] py-0.5 max-h-48 overflow-y-auto retro-scrollbar shadow-inner">
                    {Object.values(EQ_PRESETS).map((preset) => {
                      const currentEq = webampRef?.current?.getActiveEqPreset?.() || 'FLAT';
                      const isActive = currentEq === preset.id;
                      return (
                        <div
                          key={preset.id}
                          onClick={() => handleAction(() => webampRef?.current?.applyEqPreset?.(preset.id))}
                          className={`px-4 py-1 flex items-center justify-between cursor-pointer text-[10px] ${
                            isActive
                              ? 'bg-[#0a246a] text-white font-bold'
                              : 'hover:bg-[#2e5ea8] hover:text-white text-slate-900'
                          }`}
                        >
                          <div className="flex items-center space-x-1.5 truncate">
                            <span className="w-3 text-center font-bold">{isActive ? '✓' : ''}</span>
                            <span className="truncate">{preset.name}</span>
                          </div>
                          <span className={`text-[9px] uppercase px-1 rounded font-mono shrink-0 ${
                            isActive ? 'bg-[#1a3a8a] text-amber-200' : 'bg-slate-300 text-slate-700'
                          }`}>
                            {preset.tag}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="border-t border-[#808080] border-b border-[#ffffff] my-1" />

                <div
                  onClick={() => handleAction(() => getWebamp()?.toggleShuffle())}
                  className="px-3 py-1 hover:bg-[#0a246a] hover:text-white flex items-center justify-between cursor-pointer text-[11px]"
                >
                  <span>Shuffle</span>
                  <span className="text-[10px] text-slate-600 font-mono">S</span>
                </div>
                <div
                  onClick={() => handleAction(() => getWebamp()?.toggleRepeat())}
                  className="px-3 py-1 hover:bg-[#0a246a] hover:text-white flex items-center justify-between cursor-pointer text-[11px]"
                >
                  <span>Repeat</span>
                  <span className="text-[10px] text-slate-600 font-mono">R</span>
                </div>

                <div className="border-t border-[#808080] border-b border-[#ffffff] my-1" />

                <div
                  onClick={() => handleAction(() => {
                    const current = getApiBaseUrl();
                    const newUrl = prompt('Enter Backend Server API URL (e.g. Render.com or LAN IP):', current);
                    if (newUrl !== null) {
                      setBackendUrl(newUrl);
                      window.location.reload();
                    }
                  })}
                  className="px-3 py-1 hover:bg-[#0a246a] hover:text-white flex items-center justify-between cursor-pointer text-[11px] font-semibold text-blue-900 hover:text-white"
                >
                  <span>Backend Server URL...</span>
                  <span className="text-[10px] font-mono">🌐</span>
                </div>
              </div>
            )}
          </div>

          {/* Direct Skins Menu Bar Dropdown */}
          <div className="relative">
            <button
              onClick={() => toggleMenu('skins')}
              onMouseEnter={() => handleMenuHover('skins')}
              className={`px-1.5 py-[1px] text-[11px] font-bold leading-none focus:outline-none ${
                openMenu === 'skins'
                  ? 'bg-[#0a246a] text-white shadow-inner'
                  : 'hover:bg-[#2e5ea8] hover:text-white active:bg-[#0a246a]'
              }`}
            >
              <span className="underline">S</span>kins
            </button>

            {openMenu === 'skins' && (
              <div className="absolute left-[-105px] top-full mt-[1px] w-[255px] bg-[#d4d0c8] text-black border-2 border-t-[#ffffff] border-l-[#ffffff] border-b-[#404040] border-r-[#404040] shadow-2xl py-1 z-50 max-h-[75vh] overflow-y-auto retro-scrollbar">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-700 border-b border-slate-400 uppercase tracking-wider flex items-center justify-between bg-[#c8c4bc]">
                  <span>SELECT THEME (.WSZ)</span>
                  <span className="text-emerald-800 font-mono">10 SKINS</span>
                </div>
                {SKINS.map((skin, idx) => {
                  const isActive = currentSkin.id === skin.id;
                  return (
                    <div
                      key={skin.id}
                      onClick={() => handleAction(() => onSelectSkin(skin))}
                      className={`px-3 py-1.5 hover:bg-[#0a246a] hover:text-white flex items-center justify-between cursor-pointer text-[11px] ${
                        isActive ? 'font-bold bg-slate-300 text-[#0a246a]' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-1.5 truncate">
                        <span className="w-3.5 text-center font-bold text-[#0a246a] shrink-0">
                          {isActive ? '✓' : ''}
                        </span>
                        <span
                          className="w-2.5 h-2.5 rounded-sm border border-black shrink-0"
                          style={{ backgroundColor: skin.accentColor }}
                        />
                        <span className="truncate">{idx + 1}. {skin.name}</span>
                      </div>
                      <span className="text-[9px] uppercase px-1 py-0.2 bg-slate-200 text-slate-700 rounded text-right shrink-0 font-mono">
                        {skin.tag}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* View Menu */}
          <div className="relative">
            <button
              onClick={() => toggleMenu('view')}
              onMouseEnter={() => handleMenuHover('view')}
              className={`px-1.5 py-[1px] text-[11px] font-medium leading-none focus:outline-none ${
                openMenu === 'view'
                  ? 'bg-[#0a246a] text-white shadow-inner'
                  : 'hover:bg-[#2e5ea8] hover:text-white active:bg-[#0a246a]'
              }`}
            >
              <span className="underline">V</span>iew
            </button>

            {openMenu === 'view' && (
              <div className="absolute left-[-145px] top-full mt-[1px] w-[245px] bg-[#d4d0c8] text-black border-2 border-t-[#ffffff] border-l-[#ffffff] border-b-[#404040] border-r-[#404040] shadow-2xl py-0.5 z-50 max-h-[85vh] overflow-y-auto retro-scrollbar">
                <div
                  onClick={() => handleAction(onToggleMediaLibrary)}
                  className="px-3 py-1 hover:bg-[#0a246a] hover:text-white flex items-center justify-between cursor-pointer text-[11px] font-bold text-emerald-800 hover:text-white"
                >
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 text-center">{showMediaLibrary ? '✓' : ''}</span>
                    <span>Media Library (YTM)</span>
                  </div>
                  <span className="text-[10px] text-slate-600 font-mono">Alt+L</span>
                </div>
                <div
                  onClick={() => handleAction(onToggleFullscreen)}
                  className="px-3 py-1 hover:bg-[#0a246a] hover:text-white flex items-center justify-between cursor-pointer text-[11px]"
                >
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 text-center">{isFullscreen ? '✓' : ''}</span>
                    <span>Full Screen</span>
                  </div>
                  <span className="text-[10px] text-slate-600 font-mono">F11</span>
                </div>
                <div className="border-t border-[#808080] border-b border-[#ffffff] my-1" />
                <div
                  onClick={() => handleAction(() => {
                    const el = document.getElementById('main-window');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  })}
                  className="px-3 py-1 hover:bg-[#0a246a] hover:text-white flex items-center justify-between cursor-pointer text-[11px]"
                >
                  <span>Main Window</span>
                  <span className="text-[10px] text-slate-600 font-mono">275x116</span>
                </div>
                <div
                  onClick={() => handleAction(() => {
                    const el = document.getElementById('equalizer-window');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  })}
                  className="px-3 py-1 hover:bg-[#0a246a] hover:text-white flex items-center justify-between cursor-pointer text-[11px]"
                >
                  <span>Equalizer</span>
                  <span className="text-[10px] text-slate-600 font-mono">Alt+G</span>
                </div>
                <div
                  onClick={() => handleAction(() => {
                    const el = document.getElementById('playlist-window');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  })}
                  className="px-3 py-1 hover:bg-[#0a246a] hover:text-white flex items-center justify-between cursor-pointer text-[11px]"
                >
                  <span>Playlist Editor</span>
                  <span className="text-[10px] text-slate-600 font-mono">Alt+E</span>
                </div>
              </div>
            )}
          </div>

          {/* Help Menu */}
          <div className="relative">
            <button
              onClick={() => toggleMenu('help')}
              onMouseEnter={() => handleMenuHover('help')}
              className={`px-1.5 py-[1px] text-[11px] font-medium leading-none focus:outline-none ${
                openMenu === 'help'
                  ? 'bg-[#0a246a] text-white shadow-inner'
                  : 'hover:bg-[#2e5ea8] hover:text-white active:bg-[#0a246a]'
              }`}
            >
              <span className="underline">H</span>elp
            </button>

            {openMenu === 'help' && (
              <div className="absolute right-0 top-full mt-[1px] w-[210px] bg-[#d4d0c8] text-black border-2 border-t-[#ffffff] border-l-[#ffffff] border-b-[#404040] border-r-[#404040] shadow-2xl py-0.5 z-50">
                <div
                  onClick={() => handleAction(onAbout)}
                  className="px-3 py-1 hover:bg-[#0a246a] hover:text-white flex items-center justify-between cursor-pointer text-[11px] font-semibold"
                >
                  <span>About Winamp YTM...</span>
                  <span className="text-[10px] text-slate-600 font-mono">F1</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Action Buttons: Fullscreen & YouTube Music (YTM) */}
        <div className="flex items-center space-x-0.5 shrink-0">
          {sleepTimerMinutes > 0 && (
            <div
              title={`Sleep timer active: ${formatTimer(sleepSecondsLeft)} until audio pause`}
              className="px-1.5 py-[1px] bg-[#000080] text-amber-300 border border-t-white border-l-white border-b-black border-r-black text-[9px] font-mono flex items-center space-x-0.5"
            >
              <span>💤</span>
              <span>{formatTimer(sleepSecondsLeft)}</span>
            </div>
          )}
          {/* In-App Engine Status Indicator */}
          <div
            title="In-App YouTube Music Engine: Active & Ready (Self-contained, No External Server Needed)"
            className="px-1.5 py-[1px] bg-[#1a1c23] border border-t-[#808080] border-l-[#808080] border-b-[#ffffff] border-r-[#ffffff] flex items-center space-x-1"
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_#34d399]" />
            <span className="text-[8px] font-mono font-bold leading-none text-emerald-300">
              IN-APP
            </span>
          </div>

          <button
            onClick={onToggleFullscreen}
            title={isFullscreen ? "Exit Full Screen (F11)" : "Full Screen (F11)"}
            className={`px-1 py-[1px] border text-[9px] font-bold font-mono transition-colors ${
              isFullscreen
                ? 'bg-[#000080] text-amber-300 border-t-black border-l-black border-b-white border-r-white shadow-inner'
                : 'bg-[#d4d0c8] text-slate-800 hover:bg-[#0a246a] hover:text-white border-t-white border-l-white border-b-black border-r-black'
            }`}
          >
            {isFullscreen ? '🗗' : '⛶'}
          </button>
          <button
            onClick={onOpenYouTubeSearch}
            title="Search & Add YouTube Music into Playlist (Ctrl+F)"
            className={`px-1.5 py-[1px] border text-[9px] font-bold font-mono transition-colors ${
              showMediaLibrary
                ? 'bg-[#000080] text-amber-300 border-t-black border-l-black border-b-white border-r-white shadow-inner'
                : 'bg-[#d4d0c8] text-red-700 hover:bg-[#0a246a] hover:text-white border-t-white border-l-white border-b-black border-r-black'
            }`}
          >
            YTM
          </button>
        </div>
      </div>
    </div>
  );
};
