import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import Webamp from 'webamp';
import { SKINS, INITIAL_TRACK } from '../config/skins';
import { inAppAudioPlayer } from '../services/InAppAudioPlayer';
import { API_BASE_URL } from '../config/api';

const SILENT_AUDIO = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";

// Helper: Read persistent playlist from localStorage
const getPersistedPlaylist = () => {
  try {
    const raw = localStorage.getItem('winamp_ytm_playlist');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const valid = parsed.filter(t => t && t.url && t.metaData);
        if (valid.length > 0) {
          return valid;
        }
      }
    }
  } catch (err) {
    console.warn('Failed to load saved playlist:', err);
  }
  return [INITIAL_TRACK];
};

// Helper: Save track to persistent list immediately
const saveTrackToPersistentStorage = (track) => {
  if (!track || !track.url) return;
  try {
    const current = getPersistedPlaylist();
    const filtered = current.filter(t => !(t.url === track.url || (t.metaData?.title === track.metaData?.title && t.metaData?.artist === track.metaData?.artist)));
    filtered.push(track);
    localStorage.setItem('winamp_ytm_playlist', JSON.stringify(filtered));
  } catch (e) {
    console.warn('Failed to save track:', e);
  }
};

// Helper: Serialize and save playlist tracks to localStorage preserving URLs
const persistPlaylistFromStore = (webamp) => {
  if (!webamp || !webamp.store) return;
  try {
    const state = webamp.store.getState();
    const tracksMap = state.playlist?.tracks;
    const trackOrder = state.playlist?.trackOrder;

    if (tracksMap && Array.isArray(trackOrder) && trackOrder.length > 0) {
      const savedTracks = getPersistedPlaylist();
      const urlMap = new Map();
      savedTracks.forEach(st => {
        if (st && st.url) {
          const key = `${st.metaData?.title || ''}_${st.metaData?.artist || ''}`.toLowerCase();
          urlMap.set(key, st.url);
          urlMap.set(st.url, st.url);
        }
      });

      const toSave = trackOrder
        .map(id => tracksMap[id])
        .filter(Boolean)
        .map(t => {
          const key = `${t.title || t.defaultName || ''}_${t.artist || ''}`.toLowerCase();
          const resolvedUrl = t.url || urlMap.get(key) || (t.media && t.media.url) || '';
          return {
            metaData: {
              artist: t.artist || 'Unknown Artist',
              title: t.title || t.defaultName || 'Unknown Title',
              album: t.album || 'YouTube Music',
              albumArtUrl: t.albumArtUrl || ''
            },
            url: resolvedUrl,
            duration: t.duration || 180
          };
        })
        .filter(t => t.url && t.url.length > 0);

      if (toSave.length > 0) {
        localStorage.setItem('winamp_ytm_playlist', JSON.stringify(toSave));
      }
    }
  } catch (e) {
    console.warn('Failed to persist playlist:', e);
  }
};

// Curated Winamp Equalizer Presets
export const EQ_PRESETS = {
  FLAT: {
    id: 'FLAT',
    name: 'Flat (0 dB)',
    tag: 'FLAT',
    values: { preamp: 50, 60: 50, 170: 50, 310: 50, 600: 50, 1000: 50, 3000: 50, 6000: 50, 12000: 50, 14000: 50, 16000: 50 }
  },
  BASS_BOOST: {
    id: 'BASS_BOOST',
    name: 'Full Bass Boost',
    tag: 'BASS',
    values: { preamp: 55, 60: 88, 170: 78, 310: 62, 600: 50, 1000: 48, 3000: 52, 6000: 58, 12000: 64, 14000: 68, 16000: 70 }
  },
  ROCK: {
    id: 'ROCK',
    name: 'Rock / Metal',
    tag: 'ROCK',
    values: { preamp: 58, 60: 76, 170: 66, 310: 44, 600: 40, 1000: 46, 3000: 62, 6000: 72, 12000: 78, 14000: 82, 16000: 84 }
  },
  POP: {
    id: 'POP',
    name: 'Pop / Dance',
    tag: 'POP',
    values: { preamp: 52, 60: 64, 170: 72, 310: 60, 600: 52, 1000: 50, 3000: 58, 6000: 66, 12000: 70, 14000: 68, 16000: 65 }
  },
  VOCAL: {
    id: 'VOCAL',
    name: 'Vocal / Acoustic',
    tag: 'VOCAL',
    values: { preamp: 50, 60: 40, 170: 45, 310: 56, 600: 68, 1000: 78, 3000: 76, 6000: 66, 12000: 54, 14000: 48, 16000: 42 }
  },
  TECHNO: {
    id: 'TECHNO',
    name: 'Techno / EDM',
    tag: 'EDM',
    values: { preamp: 58, 60: 82, 170: 76, 310: 52, 600: 44, 1000: 50, 3000: 66, 6000: 76, 12000: 82, 14000: 78, 16000: 72 }
  },
  CLUB: {
    id: 'CLUB',
    name: 'Club / Party',
    tag: 'CLUB',
    values: { preamp: 54, 60: 68, 170: 76, 310: 66, 600: 56, 1000: 52, 3000: 62, 6000: 70, 12000: 72, 14000: 64, 16000: 58 }
  }
};

export const WebampPlayer = forwardRef(({ onTrackChange, onSkinChange, onOpenYouTubeSearch, extraSegments = 4 }, ref) => {
  const mountRef = useRef(null);
  const webampRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [activeSkin, setActiveSkin] = useState(() => {
    return localStorage.getItem('winamp_skin_id') || 'classic';
  });
  const [activeEqPreset, setActiveEqPreset] = useState(() => {
    return localStorage.getItem('winamp_eq_preset') || 'FLAT';
  });

  const applyEqPreset = (presetKey) => {
    const preset = EQ_PRESETS[presetKey];
    if (!preset || !webampRef.current?.store) return;
    try {
      const store = webampRef.current.store;
      store.dispatch({ type: 'SET_EQ_ON' });
      Object.entries(preset.values).forEach(([band, value]) => {
        store.dispatch({
          type: 'SET_BAND_VALUE',
          band: band === 'preamp' ? 'preamp' : Number(band),
          value
        });
      });
      setActiveEqPreset(presetKey);
      localStorage.setItem('winamp_eq_preset', presetKey);
      console.log(`[EQ] Applied preset: ${preset.name}`);
    } catch (err) {
      console.warn('Error applying EQ preset:', err);
    }
  };

  const unscaledWebampH = 232 + 116 + extraSegments * 29;

  const ensureContained = () => {
    const webampElem = document.getElementById('webamp');
    if (webampElem && mountRef.current && webampElem.parentElement !== mountRef.current) {
      mountRef.current.appendChild(webampElem);
    }
    if (webampElem) {
      webampElem.style.position = 'absolute';
      webampElem.style.top = '0px';
      webampElem.style.left = '0px';
      webampElem.style.width = '275px';
      webampElem.style.height = `${unscaledWebampH}px`;
    }
    if (mountRef.current) {
      mountRef.current.style.height = `${unscaledWebampH}px`;
    }
  };

  const lockWindowPositions = () => {
    ensureContained();

    if (webampRef.current && webampRef.current.store) {
      try {
        const store = webampRef.current.store;
        const state = store.getState();
        if (state.windows && state.windows.genWindows) {
          // Guarantee all 3 windows are open
          if (state.windows.genWindows.playlist && !state.windows.genWindows.playlist.open) {
            store.dispatch({ type: 'TOGGLE_WINDOW', windowId: 'playlist' });
          }
          if (state.windows.genWindows.equalizer && !state.windows.genWindows.equalizer.open) {
            store.dispatch({ type: 'TOGGLE_WINDOW', windowId: 'equalizer' });
          }
          if (state.windows.genWindows.main && !state.windows.genWindows.main.open) {
            store.dispatch({ type: 'TOGGLE_WINDOW', windowId: 'main' });
          }

          // Unshade windows
          if (state.windows.genWindows.playlist?.shade) {
            store.dispatch({ type: 'TOGGLE_WINDOW_SHADE_MODE', windowId: 'playlist' });
          }
          if (state.windows.genWindows.equalizer?.shade) {
            store.dispatch({ type: 'TOGGLE_WINDOW_SHADE_MODE', windowId: 'equalizer' });
          }

          // Enforce height for playlist based on extraSegments (size: [0, extraSegments])
          const plSize = state.windows.genWindows.playlist?.size;
          if (!plSize || plSize[0] !== 0 || plSize[1] !== extraSegments) {
            store.dispatch({ type: 'WINDOW_SIZE_CHANGED', windowId: 'playlist', size: [0, extraSegments] });
          }

          // Enforce precise 0 gap stacked coordinates in Webamp Redux store
          const p = state.windows.genWindows;
          if (!p.main?.position || p.main.position.y !== 0 ||
              !p.equalizer?.position || p.equalizer.position.y !== 116 ||
              !p.playlist?.position || p.playlist.position.y !== 232) {
            store.dispatch({
              type: 'UPDATE_WINDOW_POSITIONS',
              positions: {
                main: { x: 0, y: 0 },
                equalizer: { x: 0, y: 116 },
                playlist: { x: 0, y: 232 }
              },
              absolute: true
            });
          }
        }
      } catch (e) {
        console.warn('Error enforcing Redux window layout:', e);
      }
    }

    // Direct DOM safety: FocusTarget must NOT have transform, wrapper must have translate(0, 232px)
    const pl = document.getElementById('playlist-window');
    if (pl) {
      pl.style.top = '0px';
      pl.style.left = '0px';
      pl.style.margin = '0px';
      pl.style.transform = 'none';

      if (pl.parentElement && pl.parentElement.id !== 'webamp') {
        pl.parentElement.style.top = '0px';
        pl.parentElement.style.left = '0px';
        pl.parentElement.style.transform = 'none';
      }

      let cur = pl.parentElement;
      while (cur && cur.id !== 'webamp') {
        if (cur.style && cur.style.position === 'absolute') {
          cur.style.transform = 'translate(0px, 232px)';
          cur.style.top = '0px';
          cur.style.left = '0px';
          break;
        }
        cur = cur.parentElement;
      }
    }

    const eq = document.getElementById('equalizer-window');
    if (eq) {
      eq.style.top = '0px';
      eq.style.left = '0px';
      eq.style.margin = '0px';
      eq.style.transform = 'none';

      let cur = eq.parentElement;
      while (cur && cur.id !== 'webamp') {
        if (cur.style && cur.style.position === 'absolute') {
          cur.style.transform = 'translate(0px, 116px)';
          cur.style.top = '0px';
          cur.style.left = '0px';
          break;
        }
        cur = cur.parentElement;
      }
    }

    const main = document.getElementById('main-window');
    if (main) {
      main.style.top = '0px';
      main.style.left = '0px';
      main.style.margin = '0px';
      main.style.transform = 'none';

      let cur = main.parentElement;
      while (cur && cur.id !== 'webamp') {
        if (cur.style && cur.style.position === 'absolute') {
          cur.style.transform = 'translate(0px, 0px)';
          cur.style.top = '0px';
          cur.style.left = '0px';
          break;
        }
        cur = cur.parentElement;
      }
    }

    // Intercept [PL] button on main window: clicking it opens YouTube Music Search Popup
    const plBtn = document.getElementById('playlist-button');
    if (plBtn && !plBtn.dataset.ytmIntercepted) {
      plBtn.dataset.ytmIntercepted = 'true';
      plBtn.title = 'Add / Search YouTube Music into Playlist (Ctrl+F)';
      plBtn.addEventListener(
        'click',
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (onOpenYouTubeSearch) {
            onOpenYouTubeSearch();
          }
        },
        true // Capture phase to prevent closing playlist
      );
    }

    // Intercept playlist close button to prevent closing the playlist
    const plCloseBtn = document.getElementById('playlist-close-button');
    if (plCloseBtn && !plCloseBtn.dataset.ytmIntercepted) {
      plCloseBtn.dataset.ytmIntercepted = 'true';
      plCloseBtn.addEventListener(
        'click',
        (e) => {
          e.preventDefault();
          e.stopPropagation();
        },
        true
      );
    }
  };

  useEffect(() => {
    if (!Webamp.browserIsSupported()) {
      alert("Your browser does not support Webamp!");
      return;
    }

    if (!mountRef.current) return;

    // Safely retrieve initial skin
    const savedSkinId = localStorage.getItem('winamp_skin_id');
    const matchedSkin = SKINS.find(s => s.id === savedSkinId);
    const initialSkin = matchedSkin && matchedSkin.url ? { url: matchedSkin.url } : { url: '/skins/base-2.91.wsz' };

    // Filter available skins with valid local URLs
    const availableSkins = SKINS.map(s => ({
      url: s.url,
      name: s.name
    }));

    let isDisposed = false;
    let webamp = null;
    let persistDebounce = null;
    let unlockAudio = null;

    try {
      const initialTracks = getPersistedPlaylist();

      webamp = new Webamp({
        initialTracks,
        availableSkins,
        initialSkin,
        enableMediaSession: true,
        windowLayout: {
          main: { position: { x: 0, y: 0 }, closed: false },
          equalizer: { position: { x: 0, y: 116 }, closed: false },
          playlist: {
            position: { x: 0, y: 232 },
            size: { extraHeight: extraSegments, extraWidth: 0 },
            closed: false
          }
        },
        zIndex: 20
      });

      webampRef.current = webamp;

      // AudioContext mobile/desktop unlock on legitimate user gesture (click, touchend, keydown)
      const handleUserGesture = () => {
        try {
          const ctx = webamp.media?._context;
          if (ctx && ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
          }
        } catch (e) {}
        window.removeEventListener('click', handleUserGesture);
        window.removeEventListener('touchend', handleUserGesture);
        window.removeEventListener('keydown', handleUserGesture);
      };
      unlockAudio = handleUserGesture;

      window.addEventListener('click', handleUserGesture, { passive: true, once: true });
      window.addEventListener('touchend', handleUserGesture, { passive: true, once: true });
      window.addEventListener('keydown', handleUserGesture, { passive: true, once: true });

      // MediaSession headset and Bluetooth control handlers
      if ('mediaSession' in navigator) {
        try {
          navigator.mediaSession.setActionHandler('play', () => {
            unlockAudio?.();
            webamp.play();
          });
          navigator.mediaSession.setActionHandler('pause', () => {
            webamp.pause();
          });
          navigator.mediaSession.setActionHandler('previoustrack', () => {
            unlockAudio?.();
            webamp.previousTrack();
          });
          navigator.mediaSession.setActionHandler('nexttrack', () => {
            unlockAudio?.();
            webamp.nextTrack();
          });
          navigator.mediaSession.setActionHandler('seekbackward', () => {
            webamp.seekBackward(10);
          });
          navigator.mediaSession.setActionHandler('seekforward', () => {
            webamp.seekForward(10);
          });
        } catch (err) {
          console.warn('Error configuring MediaSession action handlers:', err);
        }
      }

      // Subscribe to store to guarantee playlist & equalizer are NEVER closed,
      // sync MediaSession playbackState, auto-enable EQ, and persist playlist
      const unsubscribeStore = webamp.store.subscribe(() => {
        const state = webamp.store.getState();
        if (state.windows && state.windows.genWindows) {
          if (state.windows.genWindows.playlist && !state.windows.genWindows.playlist.open) {
            webamp.store.dispatch({ type: 'TOGGLE_WINDOW', windowId: 'playlist' });
          }
          if (state.windows.genWindows.equalizer && !state.windows.genWindows.equalizer.open) {
            webamp.store.dispatch({ type: 'TOGGLE_WINDOW', windowId: 'equalizer' });
          }
        }

        // Keep Equalizer ON so EQ sliders modify audio in real time
        if (state.equalizer && !state.equalizer.on) {
          webamp.store.dispatch({ type: 'SET_EQ_ON' });
        }

        // Sync MediaSession playback state for OS lockscreen & notification
        if ('mediaSession' in navigator && state.media?.status) {
          const status = state.media.status;
          if (status === 'PLAYING') {
            navigator.mediaSession.playbackState = 'playing';
          } else if (status === 'PAUSED' || status === 'STOPPED') {
            navigator.mediaSession.playbackState = 'paused';
          }
        }

        // Sync In-App Audio Player engine (Play / Pause / Stop / Volume)
        if (state.media) {
          const status = state.media.status;
          if (status === 'PLAYING') {
            inAppAudioPlayer.play();
          } else if (status === 'PAUSED') {
            inAppAudioPlayer.pause();
          } else if (status === 'STOPPED') {
            inAppAudioPlayer.stop();
          }
          if (typeof state.media.volume === 'number') {
            inAppAudioPlayer.setVolume(state.media.volume);
          }
        }

        // Debounced persistence of playlist
        clearTimeout(persistDebounce);
        persistDebounce = setTimeout(() => {
          persistPlaylistFromStore(webamp);
        }, 400);
      });

      // Initialize in-app audio engine
      inAppAudioPlayer.init();
      inAppAudioPlayer.onTrackEnded(() => {
        if (webampRef.current) {
          webampRef.current.nextTrack();
        }
      });

      webamp.onTrackDidChange((track) => {
        if (track) {
          const urlStr = track.url || '';
          const match = urlStr.match(/(?:inapp:\/\/|#|\/api\/stream\/)([a-zA-Z0-9_-]{11})/);
          if (match && match[1]) {
            inAppAudioPlayer.loadAndPlay(match[1]);
          }
        }
        if (track && track.metaData) {
          if (onTrackChange) {
            onTrackChange(track);
          }
          if ('mediaSession' in navigator) {
            const title = track.metaData.title || 'Winamp Track';
            const artist = track.metaData.artist || 'Winamp';
            const album = track.metaData.album || 'YouTube Music';
            const albumArtUrl = track.metaData.albumArtUrl;
            navigator.mediaSession.metadata = new MediaMetadata({
              title,
              artist,
              album,
              artwork: albumArtUrl
                ? [{ src: albumArtUrl, sizes: '512x512', type: 'image/jpeg' }]
                : []
            });
            navigator.mediaSession.playbackState = 'playing';
          }
        }
      });

      // Prefer renderInto to contain Webamp in the exact 275x464 element
      webamp.renderInto(mountRef.current).then(() => {
        if (!isDisposed) {
          lockWindowPositions();
          setIsReady(true);
          const savedPreset = localStorage.getItem('winamp_eq_preset') || 'FLAT';
          if (savedPreset && EQ_PRESETS[savedPreset]) {
            setTimeout(() => applyEqPreset(savedPreset), 150);
          }
          console.log('[WEBAMP] Successfully mounted in contained layout!');
        }
      }).catch(err => {
        console.warn('[WEBAMP renderInto note, falling back to renderWhenReady]:', err);
        return webamp.renderWhenReady(mountRef.current).then(() => {
          if (!isDisposed) {
            lockWindowPositions();
            setIsReady(true);
            const savedPreset = localStorage.getItem('winamp_eq_preset') || 'FLAT';
            if (savedPreset && EQ_PRESETS[savedPreset]) {
              setTimeout(() => applyEqPreset(savedPreset), 150);
            }
            console.log('[WEBAMP] Successfully mounted via renderWhenReady!');
          }
        });
      });
    } catch (err) {
      console.error('[WEBAMP INIT ERROR]:', err);
    }

    return () => {
      isDisposed = true;
      clearTimeout(persistDebounce);
      if (unlockAudio) {
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('touchend', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
      }
      if (webamp) {
        try {
          webamp.dispose();
        } catch (e) {
          console.warn('Webamp disposal note:', e);
        }
      }
      webampRef.current = null;
    };
  }, []);

  // Inject "ADD YTM" option into Playlist ADD button popup and enforce window docking
  useEffect(() => {
    if (!isReady) return;

    lockWindowPositions();

    const injectAddMenuItem = () => {
      lockWindowPositions();

      const addMenu = document.getElementById('playlist-add-menu');
      if (!addMenu) return;

      const ul = addMenu.querySelector('ul');
      if (ul && !ul.querySelector('.ytm-menu-entry')) {
        addMenu.classList.add('has-ytm');

        const ytmLi = document.createElement('li');
        ytmLi.className = 'ytm-menu-entry';

        const ytmBtn = document.createElement('div');
        ytmBtn.className = 'add-ytm';
        ytmBtn.title = 'Add / Search YouTube Music Track...';
        ytmBtn.innerHTML = `<span>ADD</span><span>YTM</span>`;

        ytmBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (onOpenYouTubeSearch) {
            onOpenYouTubeSearch();
          }
          // Close the menu
          addMenu.click();
        });

        ytmLi.addEventListener('mouseenter', () => ytmLi.classList.add('hover'));
        ytmLi.addEventListener('mouseleave', () => ytmLi.classList.remove('hover'));

        ytmLi.appendChild(ytmBtn);
        // Prepend before ADD URL
        ul.insertBefore(ytmLi, ul.firstChild);
      }

      // Intercept playlist remove menu so clicking REM MISC also removes selected track without alert
      const removeMenu = document.getElementById('playlist-remove-menu');
      if (removeMenu) {
        const miscBtn = removeMenu.querySelector('.remove-misc');
        if (miscBtn && !miscBtn.dataset.ytmIntercepted) {
          miscBtn.dataset.ytmIntercepted = 'true';
          miscBtn.title = 'Remove Selected Track';
          miscBtn.addEventListener(
            'click',
            (e) => {
              e.preventDefault();
              e.stopPropagation();
              if (webampRef.current?.store) {
                const state = webampRef.current.store.getState();
                const selectedIds = state.playlist?.selectedTracks;
                if (selectedIds && selectedIds.size > 0) {
                  webampRef.current.store.dispatch({
                    type: 'REMOVE_TRACKS',
                    ids: Array.from(selectedIds)
                  });
                  setTimeout(() => persistPlaylistFromStore(webampRef.current), 80);
                }
              }
              removeMenu.click();
            },
            true // Capture phase to prevent the alert("Not supported in Webamp")
          );
        }
      }
    };

    const interval = setInterval(lockWindowPositions, 500);

    const observer = new MutationObserver(injectAddMenuItem);
    observer.observe(document.body, { childList: true, subtree: true });

    // Initial check
    injectAddMenuItem();

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, [isReady, onOpenYouTubeSearch]);

  // Dynamically update playlist segment count and height when extraSegments changes
  useEffect(() => {
    if (!isReady || !webampRef.current?.store) return;
    try {
      webampRef.current.store.dispatch({
        type: 'WINDOW_SIZE_CHANGED',
        windowId: 'playlist',
        size: [0, extraSegments]
      });
      lockWindowPositions();
    } catch (e) {
      console.warn('Error adjusting playlist size on extraSegments change:', e);
    }
  }, [extraSegments, isReady]);

  // Support Delete key to remove selected track from playlist
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'Delete' || e.key === 'Del') {
        if (webampRef.current?.store) {
          try {
            const state = webampRef.current.store.getState();
            const selectedIds = state.playlist?.selectedTracks;
            if (selectedIds && selectedIds.size > 0) {
              e.preventDefault();
              webampRef.current.store.dispatch({
                type: 'REMOVE_TRACKS',
                ids: Array.from(selectedIds)
              });
              setTimeout(() => persistPlaylistFromStore(webampRef.current), 80);
            }
          } catch (err) {
            console.warn('Error deleting track via Delete key:', err);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useImperativeHandle(ref, () => ({
    playTrack: (trackItem) => {
      if (!webampRef.current) return;
      const webamp = webampRef.current;
      const videoId = trackItem.videoId || (trackItem.streamUrl && trackItem.streamUrl.replace('inapp://', '').split('#')[0]);

      if (videoId && videoId.length === 11) {
        inAppAudioPlayer.loadAndPlay(videoId);
      }

      const audioUrl = (trackItem.streamUrl && !trackItem.streamUrl.startsWith('inapp://'))
        ? trackItem.streamUrl
        : `${API_BASE_URL}/api/stream/${videoId}`;
      const track = {
        metaData: {
          artist: trackItem.artist || 'Unknown Artist',
          title: trackItem.title || 'Unknown Title',
          album: "YouTube Music",
          albumArtUrl: trackItem.thumbnail || trackItem.thumbnailUrl || ''
        },
        url: audioUrl,
        duration: trackItem.durationSeconds || 180
      };
      saveTrackToPersistentStorage(track);

      try {
        const currentTracks = webamp.getPlaylistTracks();
        const existingIdx = currentTracks.findIndex(
          t => t.url === track.url || (t.title === track.metaData.title && t.artist === track.metaData.artist)
        );

        if (existingIdx !== -1) {
          // Track is already in playlist: switch to it and play without modifying playlist
          webamp.setCurrentTrack(existingIdx);
          webamp.play();
        } else {
          // Track is new: append to end of playlist, then switch to it and play
          const targetIdx = currentTracks.length;
          webamp.appendTracks([track]);
          setTimeout(() => {
            if (webampRef.current) {
              webampRef.current.setCurrentTrack(targetIdx);
              webampRef.current.play();
              persistPlaylistFromStore(webampRef.current);
            }
          }, 80);
        }
      } catch (err) {
        console.warn('Error in playTrack navigation:', err);
        webamp.appendTracks([track]);
        webamp.play();
        setTimeout(() => persistPlaylistFromStore(webamp), 80);
      }
    },

    appendTrack: (trackItem) => {
      if (!webampRef.current) return;
      const videoId = trackItem.videoId || (trackItem.streamUrl && trackItem.streamUrl.replace('inapp://', '').split('#')[0]);
      const audioUrl = (trackItem.streamUrl && !trackItem.streamUrl.startsWith('inapp://'))
        ? trackItem.streamUrl
        : `${API_BASE_URL}/api/stream/${videoId}`;
      const track = {
        metaData: {
          artist: trackItem.artist || 'Unknown Artist',
          title: trackItem.title || 'Unknown Title',
          album: "YouTube Music",
          albumArtUrl: trackItem.thumbnail || trackItem.thumbnailUrl || ''
        },
        url: audioUrl,
        duration: trackItem.durationSeconds || 180
      };
      saveTrackToPersistentStorage(track);
      webampRef.current.appendTracks([track]);
      setTimeout(() => persistPlaylistFromStore(webampRef.current), 80);
    },

    setSkin: (skin) => {
      if (!webampRef.current) return;
      try {
        const targetUrl = skin.url || '/skins/base-2.91.wsz';
        webampRef.current.setSkinFromUrl(targetUrl);
        setActiveSkin(skin.id);
        localStorage.setItem('winamp_skin_id', skin.id);
        if (onSkinChange) onSkinChange(skin);
        setTimeout(lockWindowPositions, 100);
      } catch (err) {
        console.error('Error switching skin:', err);
      }
    },

    getWebampInstance: () => webampRef.current,
    lockPositions: lockWindowPositions,
    persistPlaylist: () => persistPlaylistFromStore(webampRef.current),
    applyEqPreset,
    getActiveEqPreset: () => activeEqPreset,
    getEqPresets: () => EQ_PRESETS
  }));

  return (
    <div
      style={{ position: 'relative', width: '275px', height: `${unscaledWebampH}px` }}
      className="relative w-[275px] select-none"
    >
      {/* Loading state before Webamp appears */}
      {!isReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#181a24] border-2 border-[#2b3044] text-amber-300 font-mono text-xs p-4 text-center z-0">
          <span className="font-bold uppercase tracking-wider mb-2">WINAMP 2.91</span>
          <span className="text-[10px] text-slate-400">Loading audio engine &amp; skins...</span>
        </div>
      )}

      {/* Pure 275px mount point for Winamp 3-Window Stack */}
      <div
        ref={mountRef}
        id="webamp-mount-point"
        style={{ position: 'relative', width: '275px', height: `${unscaledWebampH}px` }}
        className="relative z-10 w-[275px]"
      />
    </div>
  );
});
