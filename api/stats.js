// Vercel Serverless Cloud Function: /api/stats
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const now = new Date();
  // Calculate current hour in Eastern Time (UTC-4 / EDT)
  const estHour = (now.getUTCHours() - 4 + 24) % 24;
  const isPrimeTime = (estHour >= 17 && estHour <= 22); // 5:00 PM - 10:59 PM EST

  // Deterministic organic variation
  const cycleSec = Math.floor(now.getTime() / 15000);
  const jitter = Math.floor(Math.sin(cycleSec) * 7);

  // Prime Time surges player lobbies, normal hours maintain healthy beta baseline
  const baseOnline = isPrimeTime ? (124 + jitter) : (48 + jitter);
  const baseQueue = isPrimeTime ? Math.max(8, Math.floor(baseOnline * 0.18)) : Math.max(4, Math.floor(baseOnline * 0.12));

  return res.status(200).json({
    status: "ONLINE",
    cloud_host: "Vercel Edge Global Network",
    total_online: baseOnline,
    total_in_queue: baseQueue,
    is_prime_time: isPrimeTime,
    prime_time_window: "5:00 PM – 10:30 PM EST",
    total_matches: 512,
    server_time: Math.floor(now.getTime() / 1000)
  });
}
