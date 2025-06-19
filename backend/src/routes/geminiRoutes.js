const express = require('express');
const router = express.Router();
const { getCache, setCache } = require('../services/cacheService');
const { extractLocationFromDescription } = require('../services/geminiService');

// POST /gemini/extract-location
// Body: { "description": "Heavy flooding in Manhattan" }
router.post('/extract-location', async (req, res) => {
  console.log('Received request:', req.body);
  const { description } = req.body;
  if (!description) {
    return res.status(400).json({ error: 'description is required' });
  }

  const cacheKey = `gemini-location:${description}`;
  const cached = await getCache(cacheKey);
  if (cached) return res.json({ location_name: cached });

  const locationName = await extractLocationFromDescription(description);
  if (!locationName) {
    return res.status(404).json({ error: 'Could not extract location' });
  }

  await setCache(cacheKey, locationName, 3600);
  res.json({ location_name: locationName });
});

module.exports = router;