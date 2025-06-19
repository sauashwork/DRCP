const supabase = require('../services/supabaseService');
const { io } = require('../app'); // Import io
const { logAction } = require('../utils/logger');
const { geocodeLocation } = require('../services/geocodingService');

// Create a new resource
exports.createResource = async (req, res, io) => {
  const { disaster_id, name, location_name, type, lat, lon } = req.body;

  let point = null;
  if (lat && lon) {
    point = `POINT(${lon} ${lat})`;
  } else if (location_name) {
    const coords = await geocodeLocation(location_name);
    if (coords) {
      point = `POINT(${coords.lon} ${coords.lat})`;
    }
  }

  if (!disaster_id || !name || !location_name || !type || !point) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const { data, error } = await supabase
    .from('resources')
    .insert([
      {
        disaster_id,
        name,
        location_name,
        type,
        location: point,
        created_at: new Date().toISOString()
      }
    ])
    .select()
    .single();

  if (error) return res.status(400).json({
    error: error.message
  });
  io.emit('resources_updated', data); // Emit real-time update
  logAction('Resource created', {
    resource_id: data.id,
    disaster_id: data.disaster_id,
    user_id: req.user?.id
  });
  res.status(201).json(data);
};

// Get all resources for a disaster
exports.getResources = async (req, res) => {
  const { disaster_id } = req.query;
  let query = supabase.from('resources').select('*').order('created_at', {
    ascending: false
  });
  if (disaster_id) query = query.eq('disaster_id', disaster_id);
  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};

// Update a resource
exports.updateResource = async (req, res) => {
  const { id } = req.params;
  const { name, location_name, type, lat, lon } = req.body;
  const updateData = { name, location_name, type };
  if (lat && lon) updateData.location = `POINT(${lon} ${lat})`;

  const { data, error } = await supabase
    .from('resources')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};

// Delete a resource
exports.deleteResource = async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('resources')
    .delete()
    .eq('id', id);

  if (error) return res.status(400).json({ error: error.message });
  logAction('Resource deleted', { resource_id: id, user_id: req.user?.userId });
  res.json({ message: 'Resource deleted' });
};

