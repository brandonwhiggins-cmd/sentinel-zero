// Vercel Serverless Function: /api/stats
// Real-time authentic player tracking via active hardware heartbeats & live Early Adopter state.
import { getEarlyAdopterState } from './store.js';

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

  // Authentic live online count (1 is current connecting client session)
  const realCount = Math.max(1, activeHeartbeats.size);
  const eaState = getEarlyAdopterState();

  return res.status(200).json({
    status: "ONLINE",
    cloud_host: "Vercel Edge Global Network",
    total_online: realCount,
    total_in_queue: 0,
    early_adopter_count: eaState.count,
    early_adopter_target: eaState.target,
    early_adopter_percent: eaState.percent,
    early_adopter_remaining: eaState.remaining,
    votes: eaState.votes,
    prime_time_window: "5:00 PM – 10:30 PM CT (6:00 PM – 11:30 PM ET)",
    launch_titles: ["Counter-Strike 2", "Rainbow Six Siege"],
    server_time: Math.floor(now / 1000)
  });
}
