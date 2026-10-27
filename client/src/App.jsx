import React, { useState, useEffect, useRef } from 'react';
import { WebampPlayer } from './components/WebampPlayer';
import { WinampMediaLibrary } from './components/WinampMediaLibrary';
import { WinampMenuBar } from './components/WinampMenuBar';
import { YouTubeSearchModal } from './components/YouTubeSearchModal';
import { AboutModal } from './components/AboutModal';
import { SKINS } from './config/skins';
import { API_BASE_URL } from './config/api';

export default function App() {
  const webampRef = useRef(null);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [activeSkinId, setActiveSkinId] = useState(() => {
    return localStorage.getItem('winamp_skin_id') || 'classic';
  });
  // Default to FALSE per user request: "เริ่มต้นเปิดแอพให้แสดงหน้าแอพหลักที่วงแดงไป"
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState('player'); // 'player' | 'library'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  // Dynamic Viewport tracking for Responsive Full Screen
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 390,
    height: typeof window !== 'undefined' ? window.innerHeight : 844
  });

  const currentSkin = SKINS.find(s => s.id === activeSkinId) || SKINS[0];

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Track Fullscreen status
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  // Backend Health check
  useEffect(() => {
    let isMounted = true;
    const checkHealth = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/health`);
        if (res.ok && isMounted) setBackendStatus('online');
        else if (isMounted) setBackendStatus('offline');
      } catch {
        if (isMounted) setBackendStatus('offline');
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 8000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Global Winamp Hotkeys (Alt+L / Ctrl+F: Open YouTube Music Search Popup, F11: Fullscreen)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.altKey && (e.key === 'l' || e.key === 'L')) || (e.ctrlKey && (e.key === 'f' || e.key === 'F'))) {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
      if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handlePlayTrack = (trackItem) => {
    if (webampRef.current) {
      webampRef.current.playTrack(trackItem);
    }
  };

  const handleAppendTrack = (trackItem) => {
    if (webampRef.current) {
      webampRef.current.appendTrack(trackItem);
    }
  };

  const handleSelectSkin = (skin) => {
    if (webampRef.current) {
      webampRef.current.setSkin(skin);
      setActiveSkinId(skin.id);
    }
  };

  // Open YouTube Music Search Popup Modal
  const handleOpenYouTubeSearch = () => {
    setIsSearchModalOpen(true);
  };

  // Dynamically calculate optimal playlist segments to fill 100% of screen without gaps
  const isMobile = windowSize.width < 768;
  const isPortrait = windowSize.height > windowSize.width;

  // Menubar: 22px, Main: 116px, EQ: 116px -> Fixed top = 254px
  // Base playlist: 116px -> Each extra segment: 29px
  // Unscaled width is 275px
  let bestSegments = 4;
  let bestScale = 1.0;
  let bestArea = 0;

  const maxSegments = isMobile ? (isPortrait ? 22 : 6) : 15;
  for (let s = 0; s <= maxSegments; s++) {
    const stackH = 254 + (116 + s * 29);
    const scale = Math.min(windowSize.width / 275, windowSize.height / stackH);
    const area = (275 * scale) * (stackH * scale);
    if (area > bestArea) {
      bestArea = area;
      bestSegments = s;
      bestScale = scale;
    }
  }

  const unscaledPlaylistH = 116 + bestSegments * 29;
  const unscaledWebampH = 232 + unscaledPlaylistH; // 116 + 116 + playlistH
  const unscaledTotalH = 22 + unscaledWebampH; // 22 (menubar) + webamp

  const scaledW = Math.floor(275 * bestScale);
  const scaledH = Math.floor(unscaledTotalH * bestScale);

  return (
    <div className={`h-screen w-screen overflow-hidden bg-[#12151e] text-[#c4ccd9] flex flex-col items-center justify-center p-0 select-none box-border`}>
      {/* Unified Retro Stereo App: Menubar + Main + EQ + Playlist all flush, filling screen */}
      <div
        className="relative flex items-center justify-center select-none overflow-visible mx-auto shrink-0 shadow-2xl"
        style={{
          width: `${scaledW}px`,
          height: `${scaledH}px`,
        }}
      >
        <div
          style={{
            transform: `scale(${bestScale})`,
            transformOrigin: 'top left',
            width: '275px',
            height: `${unscaledTotalH}px`,
            position: 'absolute',
            top: 0,
            left: 0
          }}
          className="flex flex-col items-center"
        >
          {/* Classic Menubar: File, Play, Options, Skins, View, Help, Fullscreen, YTM */}
          <WinampMenuBar
            currentSkin={currentSkin}
            onSelectSkin={handleSelectSkin}
            onOpenYouTubeSearch={handleOpenYouTubeSearch}
            showMediaLibrary={isSearchModalOpen}
            onToggleMediaLibrary={handleOpenYouTubeSearch}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
            webampRef={webampRef}
            onAbout={() => setIsAboutOpen(true)}
          />

          {/* 3-Window Stack: Main (275x116) + EQ (275x116) + PL (275x(116+bestSegments*29)) */}
          <div className="w-[275px] relative" style={{ height: `${unscaledWebampH}px` }}>
            <WebampPlayer
              ref={webampRef}
              onSkinChange={(skin) => setActiveSkinId(skin.id)}
              onOpenYouTubeSearch={handleOpenYouTubeSearch}
              extraSegments={bestSegments}
            />
          </div>
        </div>
      </div>

      {/* YouTube Music Search & Enqueue Popup Modal */}
      <YouTubeSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onPlayTrack={handlePlayTrack}
        onAppendTrack={handleAppendTrack}
      />

      {/* About Winamp YTM Modal */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />
    </div>
  );
}
