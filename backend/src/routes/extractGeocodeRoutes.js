const express = require('express');
const router = express.Router();
const { extractLocationFromDescription } = require('../services/geminiService');
const { geocodeLocation } = require('../services/geocodingService');

// POST /extract-geocode
// Body: { "description": "Heavy flooding in Manhattan" }
router.post('/', async (req, res) => {
  const { description } = req.body;
  if (!description) {
    return res.status(400).json({ error: 'description is required' });
  }

  // Step 1: Extract location name using Gemini
  const location_name = await extractLocationFromDescription(description);
  if (!location_name) {
    return res.status(404).json({ error: 'Could not extract location name' });
  }

  // Step 2: Geocode location name using Nominatim
  const coords = await geocodeLocation(location_name);
  if (!coords) {
    return res.status(404).json({ error: 'Could not geocode location' });
  }

  res.json({
    location_name,
    lat: coords.lat,
    lon: coords.lon
  });
});

module.exports = router;