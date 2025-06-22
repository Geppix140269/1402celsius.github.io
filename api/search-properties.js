// api/search-properties.js - WORKING Apify Backend
export default async function handler(req, res) {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    Object.entries(corsHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    return res.status(200).json({});
  }

  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    const { location, maxItems = 50 } = req.body;

    if (!location) {
      return res.status(400).json({
        success: false,
        error: 'Location parameter is required'
      });
    }

    console.log(`🏠 Searching Apify for properties in: ${location}`);

    // YOUR EXISTING APIFY TOKEN
    const apifyToken = process.env.APIFY_API_TOKEN || 'apify_api_B0D4ojy2qKFPcaYnBkMhNGa0a3YZTF0X1RIT';
    
    console.log(`✅ Using Apify token: ${apifyToken.substring(0, 15)}...`);

    // Create the Idealista URL for the location
    const searchUrl = `https://www.idealista.it/vendita-case/${location.toLowerCase()}/`;
    console.log(`🎯 Sear
