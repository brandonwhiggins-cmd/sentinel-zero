// Vercel Serverless Function: /api/track
// Captures and aggregates website traffic, referrer sources, device types, and conversion events.
// Zero mock data: starts from 0 and tracks authentic visits only.
import fs from 'fs';
import path from 'path';

const TRAFFIC_PATH = path.join('/tmp', 'sentinel_traffic.json');

let trafficStore = {
  total_pageviews: 0,
  referrers: {},
  events: {},
  devices: {},
  last_updated: Date.now()
};

function readTraffic() {
  try {
    if (fs.existsSync(TRAFFIC_PATH)) {
      const raw = fs.readFileSync(TRAFFIC_PATH, 'utf-8');
      const data = JSON.parse(raw);
      if (data && typeof data.total_pageviews === 'number') {
        trafficStore = data;
      }
    }
  } catch (e) {}
  return trafficStore;
}

function writeTraffic(data) {
  trafficStore = data;
  try {
    fs.writeFileSync(TRAFFIC_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {}
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const store = readTraffic();

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

      store.total_pageviews += 1;
      store.referrers[ref] = (store.referrers[ref] || 0) + 1;
      store.devices[dev] = (store.devices[dev] || 0) + 1;

      if (data.event && data.event !== 'pageview') {
        store.events[data.event] = (store.events[data.event] || 0) + 1;
      }

      store.last_updated = Date.now();
      writeTraffic(store);

      return res.status(200).json({ success: true, recorded_event: eventType });
    } catch (err) {
      return res.status(200).json({ success: true, fallback: true });
    }
  }

  // GET: Return current authentic web analytics snapshot
  return res.status(200).json({
    status: "ONLINE",
    analytics: store
  });
}
