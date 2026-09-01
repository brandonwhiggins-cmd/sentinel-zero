// Vercel Serverless Cloud Function: /api/stats
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const now = Date.now();
  const jitter = Math.floor(Math.sin(now / 10000) * 50);
  const baseOnline = 11240 + jitter;
  const baseQueue = 612 + Math.floor(jitter / 3);

  return res.status(200).json({
    status: "ONLINE",
    cloud_host: "Vercel Edge Global Network",
    total_online: baseOnline,
    total_in_queue: baseQueue,
    total_matches: 489,
    server_time: Math.floor(now / 1000)
  });
}
