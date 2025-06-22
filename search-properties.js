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

    // YOUR EXISTING APIFY TOKEN (from handover notes)
    const apifyToken = process.env.APIFY_API_TOKEN || 'apify_api_B0D4ojy2qKFPcaYnBkMhNGa0a3YZTF0X1RIT';
    
    if (!apifyToken.startsWith('apify_api_')) {
      return res.status(500).json({
        success: false,
        error: 'Invalid Apify token configuration'
      });
    }

    console.log(`✅ Using Apify token: ${apifyToken.substring(0, 15)}...`);

    // Create the Idealista URL for the location (as per the original fix)
    const searchUrl = `https://www.idealista.it/vendita-case/${location.toLowerCase()}/`;
    console.log(`🎯 Search URL: ${searchUrl}`);

    // Call Apify directly with your existing setup
    const apifyResponse = await fetch('https://api.apify.com/v2/acts/igolaizola~idealista-scraper/run-sync-get-dataset-items', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apifyToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        startUrls: [searchUrl],
        maxItems: parseInt(maxItems),
        proxy: {
          useApifyProxy: true,
          apifyProxyGroups: ['RESIDENTIAL']
        }
      }),
      timeout: 120000 // 2 minutes timeout
    });

    console.log(`📊 Apify response status: ${apifyResponse.status}`);

    if (!apifyResponse.ok) {
      const errorText = await apifyResponse.text();
      console.error('❌ Apify error:', errorText);
      return res.status(500).json({
        success: false,
        error: `Apify error: ${apifyResponse.status}`,
        details: errorText
      });
    }

    const apifyData = await apifyResponse.json();
    console.log(`📦 Apify returned ${apifyData.length || 0} items`);

    // Transform Apify data to our format
    const properties = apifyData.map((item, index) => {
      // Extract price from various formats
      let price = 0;
      if (item.price) {
        const priceStr = item.price.toString().replace(/[€.,\s]/g, '');
        const priceMatch = priceStr.match(/\d+/);
        if (priceMatch) {
          price = parseInt(priceMatch[0]);
        }
      }

      // Extract room count
      let rooms = 0;
      if (item.rooms || item.bedrooms) {
        rooms = parseInt(item.rooms || item.bedrooms) || 0;
      } else if (item.title) {
        // Try to extract from title
        const roomMatch = item.title.match(/(\d+)\s*(stanze?|camere?|locali?)/i);
        if (roomMatch) {
          rooms = parseInt(roomMatch[1]);
        }
      }

      // Extract size
      let size = 0;
      if (item.size || item.surface) {
        const sizeStr = (item.size || item.surface).toString().replace(/[m²\s]/g, '');
        const sizeMatch = sizeStr.match(/\d+/);
        if (sizeMatch) {
          size = parseInt(sizeMatch[0]);
        }
      }

      // Get the best image
      let image = null;
      if (item.thumbnail) {
        image = item.thumbnail;
      } else if (item.image) {
        image = item.image;
      } else if (item.photos && item.photos.length > 0) {
        image = item.photos[0].url || item.photos[0];
      }

      return {
        id: item.id || `apify-${index}`,
        title: item.title || item.description || `Property in ${location}`,
        price: price,
        location: item.location || item.address || location,
        rooms: rooms,
        bathrooms: item.bathrooms || Math.floor(rooms / 2) || 1,
        size: size,
        image: image,
        url: item.url,
        description: item.description,
        features: item.features || [],
        source: 'idealista-apify',
        energyClass: item.energyClass,
        condition: item.condition,
        floor: item.floor,
        elevator: item.elevator,
        parking: item.parking,
        terrace: item.terrace,
        garden: item.garden
      };
    });

    console.log(`✨ Transformed ${properties.length} properties successfully`);

    // Log sample property for debugging
    if (properties.length > 0) {
      console.log('📝 Sample property:', {
        title: properties[0].title,
        price: properties[0].price,
        location: properties[0].location,
        rooms: properties[0].rooms
      });
    }

    return res.status(200).json({
      success: true,
      data: properties,
      total: properties.length,
      location: location,
      source: 'apify-idealista',
      searchUrl: searchUrl,
      timestamp: new Date().toISOString(),
      subscription: 'active'
    });

  } catch (error) {
    console.error('❌ Backend error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
}