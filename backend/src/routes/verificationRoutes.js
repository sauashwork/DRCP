const express = require('express');
const router = express.Router();
const { getCache, setCache } = require('../services/cacheService');
const { verifyImageWithGemini } = require('../services/geminiService');
const { logAction } = require('../utils/logger'); // Assuming logAction is exported from logService

// POST /disasters/:id/verify-image
router.post('/:id/verify-image', async (req, res) => {
  const { image_url } = req.body;
  if (!image_url) return res.status(400).json({ error: 'image_url is required' });

  const cacheKey = `gemini-image:${image_url}`;
  const cached = await getCache(cacheKey);
  if (cached) return res.json({ verification: cached });

  try {
    const result = await verifyImageWithGemini(image_url);
    const mainText = result?.candidates?.[0]?.content?.parts?.[0]?.text || "No result";
    await setCache(cacheKey, mainText, 3600);
    res.json({ verification: mainText });

    // Log the successful verification action
    logAction('Image verified', { disaster_id: req.params.id, image_url, user_id: req.user?.userId });
  } catch (err) {
    res.status(500).json({ error: 'Image verification failed' });
  }
});

module.exports = router;