const express = require('express');
const router = express.Router();
const { getCache, setCache } = require('../services/cacheService');
const axios = require('axios');
const cheerio = require('cheerio');
const { logAction } = require('../utils/logger'); // Assuming logService is the correct path

// GET /disasters/:id/official-updates
router.get('/:id/official-updates', async (req, res) => {
  const cacheKey = `official-updates:${req.params.id}`;
  const cached = await getCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    const response = await axios.get('https://www.fema.gov/press-releases');
    const $ = cheerio.load(response.data);
    const updates = [];
    $('.views-row').slice(0, 5).each((i, el) => {
      updates.push({
        title: $(el).find('.card__title').text().trim(),
        link: 'https://www.fema.gov' + $(el).find('a').attr('href'),
        date: $(el).find('.datetime').text().trim()
      });
    });
    await setCache(cacheKey, updates, 3600); // cache for 1 hour
    logAction('Official updates fetched', { disaster_id: req.params.id, user_id: req.user?.userId });
    res.json(updates);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch official updates' });
  }
});

module.exports = router;