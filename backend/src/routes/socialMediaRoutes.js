const { getCache, setCache } = require('../services/cacheService');
const { logAction } = require('../utils/logger');

module.exports = (io) => {
  const router = require('express').Router();

  // GET /disasters/:id/social-media
  router.get('/:id/social-media', async (req, res) => {
    const cacheKey = `social-media:${req.params.id}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    // Mock data for demonstration
    const mockPosts = [
      { post: "#floodrelief Need food in NYC", user: "citizen1", disaster_id: req.params.id, timestamp: new Date().toISOString() },
      { post: "Volunteers needed in Manhattan", user: "volunteer2", disaster_id: req.params.id, timestamp: new Date().toISOString() }
    ];

    await setCache(cacheKey, mockPosts, 3600); // cache for 1 hour

    // Log the action of fetching social media data
    logAction('Social media fetched', { disaster_id: req.params.id, user_id: req.user?.userId });

    res.json(mockPosts);
  });

  // POST /disasters/:id/social-media
  router.post('/:id/social-media', (req, res) => {
    const newPost = {
      post: req.body.post,
      user: req.body.user,
      disaster_id: req.params.id,
      timestamp: new Date().toISOString()
    };
    io.emit('social_media_updated', newPost);
    res.status(201).json(newPost);
  });

  return router;
};