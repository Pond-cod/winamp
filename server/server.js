const express = require('express');
const cors = require('cors');
const ytSearch = require('yt-search');
const { Ytdl, chooseFormat } = require('@distube/ytdl-core');

const app = express();
const PORT = process.env.PORT || 4000;
const ytdl = new Ytdl();

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

// 1. Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'winamp-ytm-server',
    port: PORT,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime())
  });
});

// 2. YouTube Search API
app.get('/api/search', async (req, res) => {
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
app.get('/api/stream/:videoId', async (req, res) => {
  const videoId = req.params.videoId;
  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return res.status(400).json({ error: 'Invalid YouTube videoId format' });
  }

  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  console.log(`[STREAM REQUEST] videoId: ${videoId}`);

  try {
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

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`===============================================`);
  console.log(`📻 Winamp YouTube Music Server is running!`);
  console.log(`🚀 Port: ${PORT}`);
  console.log(`📡 Local:   http://localhost:${PORT}`);
  console.log(`🔍 Health:  http://localhost:${PORT}/api/health`);
  console.log(`🎵 Search:  http://localhost:${PORT}/api/search?q=synthwave`);
  console.log(`===============================================`);
});
