const express = require('express');
const router = express.Router();
const disasterController = require('../controllers/disasterController');
const jwtAuth = require('../middleware/jwtAuth');
const roleCheck = require('../middleware/roleCheck');
const { extractLocationFromDescription } = require('../services/geminiService');
const { geocodeLocation } = require('../services/geocodingService');
const supabase = require('../services/supabaseService');

// Apply JWT authentication to all disaster routes
router.use(jwtAuth);

// Only admin can create, update, delete
router.post('/', roleCheck(['admin']), disasterController.createDisaster);
router.put('/:id', roleCheck(['admin']), disasterController.updateDisaster);
router.delete('/:id', roleCheck(['admin']), disasterController.deleteDisaster);

// Anyone can read
router.get('/', disasterController.getDisasters);
router.get('/:id', disasterController.getDisasterById);

// PATCH /:id/location
router.patch('/:id/location', async (req, res) => {
  const { id } = req.params;
  const { location_name } = req.body;
  if (!location_name) {
    return res.status(400).json({ error: 'location_name is required' });
  }
  const coords = await geocodeLocation(location_name);
  if (!coords) {
    return res.status(404).json({ error: 'Location not found' });
  }
  // PostGIS expects 'POINT(lon lat)'
  const point = `POINT(${coords.lon} ${coords.lat})`;
  const { data, error } = await supabase
    .from('disasters')
    .update({ location: point })
    .eq('id', id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// PATCH /disasters/:id/auto-location
router.patch('/:id/auto-location', async (req, res) => {
  const { id } = req.params;
  const { description } = req.body;
  if (!description) {
    return res.status(400).json({ error: 'description is required' });
  }

  // 1. Extract location name
  const location_name = await extractLocationFromDescription(description);
  if (!location_name) {
    return res.status(404).json({ error: 'Could not extract location name' });
  }

  // 2. Geocode location name
  const coords = await geocodeLocation(location_name);
  if (!coords) {
    return res.status(404).json({ error: 'Could not geocode location' });
  }

  // 3. Update disaster record
  const point = `POINT(${coords.lon} ${coords.lat})`;
  const { data, error } = await supabase
    .from('disasters')
    .update({ location_name, location: point })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// GET /disasters/:id/official-updates
router.get('/:id/official-updates', async (req, res) => {
  try {
    // Return mock data for testing
    res.json([
      {
        title: "FEMA: Flood Relief Operations Ongoing",
        link: "https://www.fema.gov/news-release/flood-relief",
        date: "2025-06-19"
      },
      {
        title: "Red Cross: Emergency Shelters Open in Manhattan",
        link: "https://www.redcross.org/nyc-shelters",
        date: "2025-06-19"
      }
    ]);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch official updates" });
  }
});

module.exports = router;