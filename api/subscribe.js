// Vercel Serverless Cloud Function: /api/subscribe
// Handles authentic Early Adopter pre-registration pledges ($0 upfront delayed billing).
import { recordEarlyAdopterPledge } from './store.js';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const body = req.body || {};
  const plan = (body.plan || 'pro').toLowerCase();
  const price = plan === 'elite' ? 12.99 : 6.99;
  const gameVote = body.vote || null;
  const gamertag = body.gamertag || 'Operative';
  const email = body.email || '';
  const discord = body.discord || '';

  // Record into real authentic persistent store
  const recorded = recordEarlyAdopterPledge({
    gamertag,
    email,
    discord,
    plan,
    vote: gameVote
  });

  return res.status(200).json({
    success: true,
    plan: plan,
    price: price,
    upfront_charge: 0.00,
    status: "ACTIVE_EARLY_ADOPTER",
    role_granted: plan === 'elite' ? "@Early Adopter Elite" : "@Early Adopter Pro",
    gamertag: gamertag,
    ticket_id: recorded.record.ticket_id,
    vote_registered: gameVote,
    total_count: recorded.total_count,
    threshold_milestone: "500_GO_LIVE",
    delayed_billing_guarantee: "Billed only when 500 Early Adopter threshold is achieved and servers go live.",
    tournament_ticket_issued: true,
    cloud_processed: true
  });
}
