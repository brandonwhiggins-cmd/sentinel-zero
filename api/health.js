// Vercel Serverless Cloud Function: /api/health
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.status(200).json({
    status: "ONLINE",
    service: "Sentinel Zero Cloud Escrow & Attestation Service",
    provider: "Vercel Edge Serverless",
    timestamp: Math.floor(Date.now() / 1000)
  });
}
