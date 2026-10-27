import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { API_BASE_URL } from '../config/api';

/**
 * Parses time string (e.g. "3:45" or "1:02:15") into seconds
 */
const parseDurationSeconds = (str) => {
  if (!str || typeof str !== 'string') return 180;
  const parts = str.split(':').map(Number);
  if (parts.length === 2) return (parts[0] * 60) + parts[1];
  if (parts.length === 3) return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
  return 180;
};

/**
 * Searches YouTube directly from inside the app using InnerTube API with Native HTTP (No CORS)
 */
export const searchYouTubeInApp = async (query) => {
  if (!query || !query.trim()) return [];

  const cleanQuery = query.trim();
  console.log(`[IN-APP SEARCH] Searching YouTube for: "${cleanQuery}"`);

  const payload = {
    context: {
      client: {
        clientName: 'WEB',
        clientVersion: '2.20240101.00.00'
      }
    },
    query: cleanQuery
  };

  try {
    let rawData = null;

    if (Capacitor.isNativePlatform()) {
      // On Android Native: Use CapacitorHttp (bypasses browser CORS completely)
      const res = await CapacitorHttp.post({
        url: 'https://www.youtube.com/youtubei/v1/search',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        data: payload
      });
      rawData = res.data;
    } else {
      // In web browser testing: try direct fetch or fallback
      try {
        const res = await fetch('https://www.youtube.com/youtubei/v1/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          rawData = await res.json();
        }
      } catch (e) {
        console.warn('[IN-APP SEARCH] Browser direct fetch note:', e.message);
      }
    }

    if (!rawData) {
      // Fallback: If running in browser dev mode without native plugin, query public suggestions
      return await fallbackSearch(cleanQuery);
    }

    // Parse YouTube InnerTube search response
    const json = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
    const contents = json.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
    const results = [];

    for (const section of contents) {
      const items = section.itemSectionRenderer?.contents || [];
      for (const item of items) {
        const v = item.videoRenderer;
        if (v && v.videoId) {
          const title = v.title?.runs?.[0]?.text || 'Unknown Title';
          const artist = v.ownerText?.runs?.[0]?.text || 'YouTube Artist';
          const duration = v.lengthText?.simpleText || '3:30';
          const thumbnail = v.thumbnail?.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`;

          results.push({
            videoId: v.videoId,
            title,
            artist,
            duration,
            durationSeconds: parseDurationSeconds(duration),
            thumbnail,
            streamUrl: `${API_BASE_URL}/api/stream/${v.videoId}`
          });
        }
      }
    }

    console.log(`[IN-APP SEARCH] Found ${results.length} tracks.`);
    return results.slice(0, 30);
  } catch (err) {
    console.error('[IN-APP SEARCH ERROR]:', err);
    return await fallbackSearch(cleanQuery);
  }
};

/**
 * Fallback search for browser dev mode
 */
const fallbackSearch = async (cleanQuery) => {
  try {
    const res = await fetch(`https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(cleanQuery)}`);
    if (res.ok) {
      const data = await res.json();
      const suggestions = data[1] || [];
      return suggestions.slice(0, 15).map((term, i) => ({
        videoId: `mock_${Date.now()}_${i}`,
        title: term,
        artist: 'YouTube Music',
        duration: '3:45',
        durationSeconds: 225,
        thumbnail: 'https://i.ytimg.com/vi/default/hqdefault.jpg',
        streamUrl: `inapp://mock_${i}`
      }));
    }
  } catch (e) {}
  return [];
};
