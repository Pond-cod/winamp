/**
 * InAppAudioPlayer - Embedded YouTube Player Engine
 * Runs completely inside the app WebView using YouTube IFrame API.
 * Requires ZERO backend servers, ZERO proxies, and has NO CORS issues.
 */

class InAppAudioPlayerManager {
  constructor() {
    this.player = null;
    this.isApiLoaded = false;
    this.isPlayerReady = false;
    this.currentVideoId = null;
    this.queuedVideoId = null;
    this.trackEndCallback = null;
    this.stateChangeCallback = null;
    this.volume = 100;
  }

  /**
   * Initializes YouTube IFrame API script
   */
  init(containerId = 'inapp-yt-player-container') {
    if (this.isApiLoaded && this.player) return;

    // Create container if not exists
    let container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      container.style.position = 'fixed';
      container.style.bottom = '-9999px';
      container.style.left = '-9999px';
      container.style.width = '200px';
      container.style.height = '200px';
      container.style.zIndex = '-999';
      container.style.opacity = '0.01';
      container.style.pointerEvents = 'none';
      document.body.appendChild(container);
    }

    const placeholder = document.createElement('div');
    placeholder.id = 'inapp-yt-iframe-placeholder';
    container.appendChild(placeholder);

    // Load YouTube IFrame API
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      document.head.appendChild(tag);

      window.onYouTubeIframeAPIReady = () => {
        this.createPlayer();
      };
    } else {
      this.createPlayer();
    }
  }

  createPlayer() {
    if (!window.YT || !window.YT.Player) return;

    try {
      this.player = new window.YT.Player('inapp-yt-iframe-placeholder', {
        height: '200',
        width: '200',
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          playsinline: 1,
          rel: 0,
          modestbranding: 1
        },
        events: {
          onReady: (event) => {
            console.log('[IN-APP AUDIO] YouTube Player Engine Ready!');
            this.isPlayerReady = true;
            this.player.setVolume(this.volume);
            if (this.queuedVideoId) {
              this.loadAndPlay(this.queuedVideoId);
              this.queuedVideoId = null;
            }
          },
          onStateChange: (event) => {
            // event.data: 0 (ENDED), 1 (PLAYING), 2 (PAUSED), 3 (BUFFERING)
            if (this.stateChangeCallback) {
              this.stateChangeCallback(event.data);
            }
            if (event.data === 0) { // ENDED
              console.log('[IN-APP AUDIO] Track ended naturally. Triggering next track...');
              if (this.trackEndCallback) {
                this.trackEndCallback();
              }
            }
          },
          onError: (event) => {
            console.warn('[IN-APP AUDIO] YouTube playback notice:', event.data);
          }
        }
      });
    } catch (err) {
      console.error('[IN-APP AUDIO] Failed to create player:', err);
    }
  }

  /**
   * Load and play a YouTube videoId
   */
  loadAndPlay(videoId) {
    if (!videoId) return;

    // Clean videoId if passed with inapp:// prefix
    const cleanId = videoId.replace('inapp://', '').trim();
    this.currentVideoId = cleanId;

    if (!this.isPlayerReady || !this.player || !this.player.loadVideoById) {
      console.log('[IN-APP AUDIO] Player not ready yet, queuing videoId:', cleanId);
      this.queuedVideoId = cleanId;
      return;
    }

    console.log(`[IN-APP AUDIO] Playing track: ${cleanId}`);
    try {
      this.player.loadVideoById({
        videoId: cleanId,
        startSeconds: 0
      });
      this.player.setVolume(this.volume);
      this.player.playVideo();
    } catch (e) {
      console.warn('[IN-APP AUDIO] loadVideoById error:', e);
    }
  }

  play() {
    if (this.player && this.player.playVideo && this.isPlayerReady) {
      try {
        this.player.playVideo();
      } catch (e) {}
    }
  }

  pause() {
    if (this.player && this.player.pauseVideo && this.isPlayerReady) {
      try {
        this.player.pauseVideo();
      } catch (e) {}
    }
  }

  stop() {
    if (this.player && this.player.stopVideo && this.isPlayerReady) {
      try {
        this.player.stopVideo();
      } catch (e) {}
    }
  }

  seekTo(seconds) {
    if (this.player && this.player.seekTo && this.isPlayerReady) {
      try {
        this.player.seekTo(seconds, true);
      } catch (e) {}
    }
  }

  setVolume(percent) {
    this.volume = Math.max(0, Math.min(100, Math.round(percent)));
    if (this.player && this.player.setVolume && this.isPlayerReady) {
      try {
        this.player.setVolume(this.volume);
      } catch (e) {}
    }
  }

  getCurrentTime() {
    if (this.player && this.player.getCurrentTime && this.isPlayerReady) {
      try {
        return this.player.getCurrentTime() || 0;
      } catch (e) {}
    }
    return 0;
  }

  getDuration() {
    if (this.player && this.player.getDuration && this.isPlayerReady) {
      try {
        return this.player.getDuration() || 0;
      } catch (e) {}
    }
    return 0;
  }

  onTrackEnded(callback) {
    this.trackEndCallback = callback;
  }

  onStateChange(callback) {
    this.stateChangeCallback = callback;
  }
}

export const inAppAudioPlayer = new InAppAudioPlayerManager();
