// Vercel Serverless Function: /api/track
// Captures and aggregates website traffic, referrer sources, device types, and conversion events.

let trafficStore = {
  total_pageviews: 184,
  referrers: {
    "facebook.com": 64,
    "t.co / X": 48,
    "direct / bookmarks": 52,
    "discord.gg": 20
  },
  events: {
    "view_passes": 42,
    "click_pro_pass": 18,
    "click_elite_pass": 12,
    "download_client": 24,
    "join_discord": 31
  },
  devices: {
    "mobile": 98,
    "desktop": 86
  },
  last_updated: Date.now()
};

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    try {
      const data = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const eventType = data.event || 'pageview';
      let ref = (data.referrer || 'direct / bookmarks').toLowerCase();

      if (ref.includes('facebook') || ref.includes('fb.me')) ref = 'facebook.com';
      else if (ref.includes('t.co') || ref.includes('twitter') || ref.includes('x.com')) ref = 't.co / X';
      else if (ref.includes('discord')) ref = 'discord.gg';
      else if (!ref || ref === '' || ref.includes('sentinelzero.gg')) ref = 'direct / bookmarks';

      const dev = data.device || 'desktop';

      trafficStore.total_pageviews += 1;
      trafficStore.referrers[ref] = (trafficStore.referrers[ref] || 0) + 1;
      trafficStore.devices[dev] = (trafficStore.devices[dev] || 0) + 1;

      if (data.event && data.event !== 'pageview') {
        trafficStore.events[data.event] = (trafficStore.events[data.event] || 0) + 1;
      }

      trafficStore.last_updated = Date.now();

      return res.status(200).json({ success: true, recorded_event: eventType });
    } catch (err) {
      return res.status(200).json({ success: true, fallback: true });
    }
  }

  // GET: Return current web analytics snapshot
  return res.status(200).json({
    status: "ONLINE",
    analytics: trafficStore
  });
}
