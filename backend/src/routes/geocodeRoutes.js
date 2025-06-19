const express = require('express');
const router = express.Router();
const { getCache, setCache } = require('../services/cacheService');
const { geocodeLocation } = require('../services/geocodingService');

// POST /geocode
// Body: { "location_name": "Manhattan, NYC" }
router.post('/', async (req, res) => {
  const { location_name } = req.body;
  if (!location_name) {
    return res.status(400).json({ error: 'location_name is required' });
  }

  const cacheKey = `geocode:${location_name}`;
  const cached = await getCache(cacheKey);
  if (cached) return res.json(cached);

  const coords = await geocodeLocation(location_name);
  if (!coords) {
    return res.status(404).json({ error: 'Location not found' });
  }

  await setCache(cacheKey, coords, 3600); // cache for 1 hour
  res.json(coords);
});

module.exports = router;