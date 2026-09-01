// Vercel Serverless Cloud Function: /api/subscribe
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const body = req.body || {};
  const plan = body.plan || 'pro';
  const price = plan === 'elite' ? 12.99 : 6.99;

  return res.status(200).json({
    success: true,
    plan: plan,
    price: price,
    status: "ACTIVE_FOUNDER",
    role_granted: plan === 'elite' ? "@VIP High-Roller" : "@Verified Player",
    tournament_ticket_issued: true,
    cloud_processed: true
  });
}
