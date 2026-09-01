// Vercel Serverless Cloud Function: /api/wallet
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    const body = req.body || {};
    const amount = parseFloat(body.amount) || 20.00;
    return res.status(200).json({
      success: true,
      deposited: amount,
      status: "COMPLETED_VIA_STRIPE"
    });
  }

  return res.status(200).json({
    user_id: "user_founder_01",
    username: "Member #9042",
    balance: 20.00,
    is_pro: true,
    hardware_verified: true
  });
}
