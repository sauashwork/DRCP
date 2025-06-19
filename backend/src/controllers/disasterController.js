const { geocodeLocation } = require('../services/geocodingService');
const supabase = require('../services/supabaseService');
const { appendAuditTrail } = require('../utils/auditTrail');
const { logAction } = require('../utils/logger'); // Assuming logAction is exported from this module

// Create a new disaster
exports.createDisaster = async (req, res) => {
  try {
    const { title, location_name, description, tags } = req.body;

    // Geocode location_name to get lat/lon
    let point = null;
    if (location_name) {
      const coords = await geocodeLocation(location_name);
      if (coords) {
        point = `POINT(${coords.lon} ${coords.lat})`;
      }
    }

    // Build audit trail entry
    const audit_trail = [{
      action: "create",
      user_id: req.user.id,
      timestamp: new Date().toISOString()
    }];

    // Insert into Supabase
    const { data, error } = await supabase
      .from('disasters')
      .insert([{
        title,
        location_name,
        location: point,
        description,
        tags,
        owner_id: req.user.userId,
        audit_trail
      }])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get disasters (optionally filter by tag)
exports.getDisasters = async (req, res) => {
  const { tag } = req.query;
  let query = supabase.from('disasters').select('*').order('created_at', { ascending: false });
  if (tag) query = query.contains('tags', [tag]);
  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};

// Get a disaster by ID
exports.getDisasterById = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('disasters')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
};

// Update a disaster
exports.updateDisaster = async (req, res) => {
  const { id } = req.params;
  const fields = { ...req.body };
  const userId = req.user?.userId || 'unknown';

  // Remove location if not provided, so it doesn't overwrite with null
  if (fields.location === undefined || fields.location === null || fields.location === '') {
    delete fields.location;
  }

  // Fetch current disaster to get current audit_trail
  const { data: current, error: fetchError } = await supabase
    .from('disasters')
    .select('audit_trail')
    .eq('id', id)
    .single();

  if (fetchError) return res.status(404).json({ error: fetchError.message });

  const newTrail = appendAuditTrail(current.audit_trail, 'update', userId);

  const { data, error } = await supabase
    .from('disasters')
    .update({ ...fields, audit_trail: newTrail })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  logAction('Disaster updated', { disaster_id: id, user_id: req.user?.userId });

  res.json(data);
};

// Delete a disaster
exports.deleteDisaster = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.userId || 'unknown';

  // Hard delete
  const { error } = await supabase
    .from('disasters')
    .delete()
    .eq('id', id);

  if (error) return res.status(400).json({ error: error.message });
  logAction('Disaster deleted', { disaster_id: id, user_id: userId });
  res.json({ message: 'Disaster deleted' });
};