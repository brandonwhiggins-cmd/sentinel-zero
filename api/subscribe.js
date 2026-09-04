// Vercel Serverless Cloud Function: /api/subscribe
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const body = req.body || {};
  const plan = body.plan || 'pro';
  const price = plan === 'elite' ? 12.99 : 6.99;
  const gameVote = body.vote || null;
  const gamertag = body.gamertag || 'Operative';

  return res.status(200).json({
    success: true,
    plan: plan,
    price: price,
    upfront_charge: 0.00,
    status: "ACTIVE_EARLY_ADOPTER",
    role_granted: plan === 'elite' ? "@Early Adopter Elite" : "@Early Adopter Pro",
    gamertag: gamertag,
    vote_registered: gameVote,
    threshold_milestone: "500_GO_LIVE",
    delayed_billing_guarantee: "Billed only when 500 Early Adopter threshold is achieved and servers go live.",
    tournament_ticket_issued: true,
    cloud_processed: true
  });
}
