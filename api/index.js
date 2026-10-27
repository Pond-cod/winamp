const express = require('express');
const cors = require('cors');
const ytSearch = require('yt-search');
let ytdlInstance = null;
let chooseFormatFn = null;

async function getYtdl() {
  if (!ytdlInstance) {
    const { Ytdl, chooseFormat, Client } = await import('@distube/ytdl-core');
    const options = {
      clients: [Client.Tv, Client.VisionOS, Client.WebEmbedded]
    };
    if (process.env.YOUTUBE_COOKIE) {
      options.cookie = process.env.YOUTUBE_COOKIE;
    }
    ytdlInstance = new Ytdl(options);
    chooseFormatFn = chooseFormat;
  }
  return { ytdl: ytdlInstance, chooseFormat: chooseFormatFn };
}

const app = express();

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

// 1. Health & Heartbeat Check
app.get(['/health', '/api/health'], (req, res) => {
  res.json({
    status: 'ok',
    service: 'winamp-ytm-server',
    timestamp: new Date().toISOString()
  });
});

app.all(['/heartbeat', '/api/heartbeat'], (req, res) => {
  res.json({ status: 'alive', timestamp: Date.now() });
});

// 2. YouTube Search API
app.get(['/search', '/api/search'], async (req, res) => {
  try {
    const query = req.query.q;
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ error: 'Search keyword is required (e.g. ?q=synthwave)' });
    }

    console.log(`[SEARCH] Query: "${query.trim()}"`);
    const searchResults = await ytSearch(query.trim());
    const videos = searchResults.videos || [];

    const host = req.headers.host || 'winamp-ecru.vercel.app';
    const protocol = req.headers['x-forwarded-proto'] || 'https';

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

    let format = null;
    try {
      format = chooseFormat(info.formats, {
        quality: 'highestaudio',
        filter: { hasAudio: true, hasVideo: false }
      });
    } catch {
      format = info.formats.find(f => f.hasAudio && !f.hasVideo) || info.formats.find(f => f.hasAudio);
    }

    if (!format) {
      return res.status(404).json({ error: 'No audio format found for this track' });
    }

    const contentType = format.mimeType ? format.mimeType.split(';')[0] : 'audio/webm';
    const totalSize = parseInt(format.contentLength, 10);

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

      req.on('close', () => {
        try {
          if (stream && !stream.destroyed) stream.destroy();
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

      req.on('close', () => {
        try {
          if (stream && !stream.destroyed) stream.destroy();
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
      // Fallback audio/wav to prevent Webamp from freezing at 00:00 when cloud IP is challenged
      const fallbackWav = Buffer.from("UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA", "base64");
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Content-Length', fallbackWav.length);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('X-Stream-Fallback', 'true');
      res.status(200).send(fallbackWav);
    }
  }
});

module.exports = app;
