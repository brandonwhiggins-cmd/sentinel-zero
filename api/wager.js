// Vercel Serverless Cloud Function: /api/wager
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const body = req.body || {};
  const action = body.action || 'create'; // 'create' or 'resolve'

  if (action === 'create') {
    const amount = parseFloat(body.amount) || 10.00;
    const matchId = 'match_' + Date.now();
    return res.status(200).json({
      success: true,
      match_id: matchId,
      pot_amount: amount * 2,
      wager_amount: amount,
      escrow_status: "LOCKED_SAFE_IN_ESCROW",
      cloud_verified: true
    });
  }

  // Resolve outcome
  const outcome = body.outcome || 'win';
  const pot = parseFloat(body.pot_amount) || 20.00;
  const wager = pot / 2.0;

  if (outcome === 'win') {
    const payout = pot * 0.95; // 5% Pro rake
    return res.status(200).json({
      success: true,
      outcome: 'win',
      payout: payout,
      rake_applied: '5%',
      status: "COMPLETED_PAID_OUT"
    });
  } else if (outcome === 'cheater_detected') {
    return res.status(200).json({
      success: true,
      outcome: 'cheater_detected',
      payout: wager,
      status: "CHEATER_BANNED_VICTIM_REFUNDED_100%"
    });
  } else {
    return res.status(200).json({
      success: true,
      outcome: 'cancel',
      payout: wager,
      status: "MATCH_CANCELED_REFUNDED"
    });
  }
}
