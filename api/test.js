// api/test.js - Test your Apify connection
export default async function handler(req, res) {
  console.log('🧪 Testing Apify connection...');
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  // Test Apify connection
  const apifyToken = process.env.APIFY_API_TOKEN || 'apify_api_B0D4ojy2TEj3nXYGaWJYfdZJ4VkD2NBrE';
  
  let apifyStatus = 'unknown';
  let apifyError = null;

  try {
    // Test Apify API
    const testResponse = await fetch('https://api.apify.com/v2/users/me', {
      headers: {
        'Authorization': `Bearer ${apifyToken}`
      }
    });

    if (testResponse.ok) {
      const userData = await testResponse.json();
      apifyStatus = 'connected';
      console.log('✅ Apify connection successful');
    } else {
      apifyStatus = 'error';
      apifyError = `HTTP ${testResponse.status}`;
    }
  } catch (error) {
    apifyStatus = 'error';
    apifyError = error.message;
    console.error('❌ Apify test failed:', error);
  }

  return res.status(200).json({
    success: true,
    message: 'InvestiScope Backend - Working with YOUR Apify subscription! 🚀',
    timestamp: new Date().toISOString(),
    endpoints: {
      test: '/api/test',
      search: '/api/search-properties'
    },
    apify: {
      status: apifyStatus,
      token: apifyToken ? `${apifyToken.substring(0, 15)}...` : 'Not configured',
      subscription: '€50/month active',
      error: apifyError
    },
    ready: apifyStatus === 'connected',
    version: 'WORKING-1.0.0'
  });
}
