// Vercel Serverless Function: /api/stats
// Real-time authentic player tracking via active hardware heartbeats.

const activeHeartbeats = new Map();

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const now = Date.now();

  // If POST, record incoming client heartbeat
  if (req.method === 'POST') {
    try {
      const data = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const id = data.client_id || req.headers['x-forwarded-for'] || 'client-local';
      activeHeartbeats.set(id, now);
    } catch (e) {}
  }

  // Prune inactive sessions older than 45 seconds
  for (const [id, ts] of activeHeartbeats.entries()) {
    if (now - ts > 45000) {
      activeHeartbeats.delete(id);
    }
  }

  const realCount = Math.max(1, activeHeartbeats.size);

  return res.status(200).json({
    status: "ONLINE",
    cloud_host: "Vercel Edge Global Network",
    total_online: realCount,
    total_in_queue: 0,
    prime_time_window: "5:00 PM – 10:30 PM EST",
    server_time: Math.floor(now / 1000)
  });
}
