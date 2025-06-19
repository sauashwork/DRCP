const axios = require('axios');

async function geocodeLocation(locationName) {
  const url = `https://nominatim.openstreetmap.org/search`;
  const params = {
    q: locationName,
    format: 'json',
    limit: 1
  };

  try {
    const response = await axios.get(url, { params, headers: { 'User-Agent': 'drcp-app/1.0' } });
    if (response.data && response.data.length > 0) {
      const { lat, lon } = response.data[0];
      return { lat: parseFloat(lat), lon: parseFloat(lon) };
    }
    return null;
  } catch (err) {
    console.error('Geocoding error:', err.message);
    return null;
  }
}

module.exports = { geocodeLocation };