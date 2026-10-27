const express = require('express');
const cors = require('cors');
const ytSearch = require('yt-search');
let ytdlInstance = null;
let chooseFormatFn = null;

async function getYtdl() {
  if (!ytdlInstance) {
    const { Ytdl, chooseFormat } = await import('@distube/ytdl-core');
    ytdlInstance = new Ytdl();
    chooseFormatFn = chooseFormat;
  }
  return { ytdl: ytdlInstance, chooseFormat: chooseFormatFn };
}

const app = express();
const PORT = process.env.PORT || 4000;

// Enable CORS with full headers for Web Audio API & Range Requests
app.use(cors({
  origin: '*',
  methods: ['GET', 'HEAD', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Range', 'Authorization', 'Accept'],
  exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length', 'Content-Type']
}));

// Explicit middleware to guarantee CORS headers on every response
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range, Accept');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length, Content-Type');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Normalize request URL if rewritten by Vercel serverless functions
app.use((req, res, next) => {
  if (req.url === '/server.js' || req.url === '/api/index.js' || req.url.startsWith('/server.js?') || req.url.startsWith('/api/index.js?')) {
    const rawPath = req.headers['x-matched-path'] || '/';
    const queryIdx = req.url.indexOf('?');
    const queryString = queryIdx !== -1 ? req.url.substring(queryIdx) : '';
    req.url = rawPath + queryString;
  }
  next();
});

// Root Health & Status Endpoint
app.get(['/', '/api'], (req, res) => {
  res.json({
    status: 'ok',
    service: 'winamp-ytm-server',
    endpoints: {
      health: '/api/health',
      search: '/api/search?q=query',
      stream: '/api/stream/:videoId'
    }
  });
});

// Watchdog & Heartbeat (Only active if explicitly enabled, disabled on Cloud/Render 24/7)
const WATCHDOG_TIMEOUT_MS = 600000; // 10 minutes
let lastActivityTimestamp = Date.now();
let watchdogEnabled = process.env.ENABLE_WATCHDOG === 'true';
let hasReceivedFirstClientPing = false;

// Update activity timestamp on any request
app.use((req, res, next) => {
  lastActivityTimestamp = Date.now();
  next();
});

// Helper for graceful shutdown
const shutdownServer = (reason = 'requested') => {
  console.log(`\n🛑 [SHUTDOWN] Received ${reason} signal. Exiting process to prevent background battery drain...`);
  setTimeout(() => {
    process.exit(0);
  }, 300);
};

// 1. Health & Heartbeat Check
app.get(['/health', '/api/health'], (req, res) => {
  hasReceivedFirstClientPing = true;
  lastActivityTimestamp = Date.now();
  res.json({
    status: 'ok',
    service: 'winamp-ytm-server',
    port: PORT,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    watchdog: {
      enabled: watchdogEnabled,
      inactiveSeconds: Math.floor((Date.now() - lastActivityTimestamp) / 1000)
    }
  });
});

app.all(['/heartbeat', '/api/heartbeat'], (req, res) => {
  hasReceivedFirstClientPing = true;
  lastActivityTimestamp = Date.now();
  res.json({ status: 'alive', timestamp: Date.now() });
});

// 2. Graceful Shutdown Endpoint (handles GET, POST, OPTIONS)
app.all(['/shutdown', '/api/shutdown'], (req, res) => {
  console.log('[SHUTDOWN] Client requested server termination.');
  res.json({ status: 'shutting_down', message: 'Backend is stopping...' });
  shutdownServer('client_exit');
});

// Auto-exit watchdog interval (only active when enabled and outside Vercel)
const STARTUP_TIME = Date.now();
if (!process.env.VERCEL && watchdogEnabled) {
  setInterval(() => {
    const timeSinceStartup = Date.now() - STARTUP_TIME;
    const inactiveTime = Date.now() - lastActivityTimestamp;

    if ((hasReceivedFirstClientPing && inactiveTime > WATCHDOG_TIMEOUT_MS) ||
        (!hasReceivedFirstClientPing && timeSinceStartup > 600000)) {
      console.log(`\n⚠️ [AUTO-WATCHDOG] No client activity for ${Math.round(inactiveTime / 1000)}s.`);
      shutdownServer('watchdog_inactivity_timeout');
    }
  }, 10000);
}

// 3. YouTube Search API
app.get(['/search', '/api/search'], async (req, res) => {
  try {
    const query = req.query.q;
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ error: 'Search keyword is required (e.g. ?q=synthwave)' });
    }

    console.log(`[SEARCH] Query: "${query.trim()}"`);
    const searchResults = await ytSearch(query.trim());
    const videos = searchResults.videos || [];

    const host = req.headers.host || `localhost:${PORT}`;
    const protocol = req.headers['x-forwarded-proto'] || 'http';

    const results = videos.slice(0, 25).map(v => ({
      videoId: v.videoId,
      title: v.title,
      artist: v.author?.name || 'Unknown Artist',
      duration: v.timestamp || '0:00',
      durationSeconds: v.seconds || 0,
      thumbnail: v.thumbnail || v.image,
      views: v.views,
      ago: v.ago,
      url: v.url,
      streamUrl: `${protocol}://${host}/api/stream/${v.videoId}`
    }));

    res.json(results);
  } catch (error) {
    console.error('[SEARCH ERROR]:', error.message);
    res.status(500).json({ error: 'Failed to search YouTube', details: error.message });
  }
});

// 3. Audio Stream Proxy
app.get(['/stream/:videoId', '/api/stream/:videoId'], async (req, res) => {
  const videoId = req.params.videoId;
  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return res.status(400).json({ error: 'Invalid YouTube videoId format' });
  }

  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  console.log(`[STREAM REQUEST] videoId: ${videoId}`);

  try {
    const { ytdl, chooseFormat } = await getYtdl();
    const info = await ytdl.getInfo(videoUrl);

    // Pick best audio-only format
    let format = null;
    try {
      format = chooseFormat(info.formats, {
        quality: 'highestaudio',
        filter: { hasAudio: true, hasVideo: false }
      });
    } catch {
      // Fallback: search manually in formats
      format = info.formats.find(f => f.hasAudio && !f.hasVideo) || info.formats.find(f => f.hasAudio);
    }

    if (!format) {
      return res.status(404).json({ error: 'No audio format found for this track' });
    }

    const contentType = format.mimeType ? format.mimeType.split(';')[0] : 'audio/webm';
    const totalSize = parseInt(format.contentLength, 10);

    // Ensure headers for Web Audio API & Range Requests
    res.setHeader('Content-Type', contentType);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

    const rangeHeader = req.headers.range;

    if (rangeHeader && totalSize && !isNaN(totalSize)) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

      if (start >= totalSize || end >= totalSize) {
        res.setHeader('Content-Range', `bytes */${totalSize}`);
        return res.status(416).send('Requested Range Not Satisfiable');
      }

      const chunkSize = (end - start) + 1;
      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${totalSize}`);
      res.setHeader('Content-Length', chunkSize);

      const stream = ytdl.download(videoUrl, {
        format,
        range: { start, end },
        highWaterMark: 1 << 25
      });

      // Cleanup stream when client disconnects (song skip, pause, or seek)
      req.on('close', () => {
        try {
          if (stream && !stream.destroyed) {
            stream.destroy();
            console.log(`[STREAM ABORTED] videoId: ${videoId}`);
          }
        } catch (e) {}
      });

      stream.on('error', err => {
        console.error(`[STREAM ERROR RANGE ${videoId}]:`, err.message);
        if (!res.headersSent) res.sendStatus(500);
      });

      stream.pipe(res);
    } else {
      if (totalSize && !isNaN(totalSize)) {
        res.setHeader('Content-Length', totalSize);
      }

      const stream = ytdl.download(videoUrl, {
        format,
        highWaterMark: 1 << 25
      });

      // Cleanup stream when client disconnects
      req.on('close', () => {
        try {
          if (stream && !stream.destroyed) {
            stream.destroy();
            console.log(`[STREAM ABORTED] videoId: ${videoId}`);
          }
        } catch (e) {}
      });

      stream.on('error', err => {
        console.error(`[STREAM ERROR ${videoId}]:`, err.message);
        if (!res.headersSent) res.sendStatus(500);
      });

      stream.pipe(res);
    }
  } catch (error) {
    console.error(`[STREAM SETUP ERROR ${videoId}]:`, error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to stream audio', details: error.message });
    }
  }
});

// Start Server (only when running standalone outside Vercel)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`📻 Winamp YouTube Music Server is running!`);
    console.log(`🚀 Port: ${PORT}`);
    console.log(`📡 Local:   http://localhost:${PORT}`);
    console.log(`🔍 Health:  http://localhost:${PORT}/api/health`);
    console.log(`🎵 Search:  http://localhost:${PORT}/api/search?q=synthwave`);
    console.log(`===============================================`);
  });
}

module.exports = app;
