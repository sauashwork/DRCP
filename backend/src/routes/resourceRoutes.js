const express = require('express');
const resourceController = require('../controllers/resourceController');
const jwtAuth = require('../middleware/jwtAuth');
const roleCheck = require('../middleware/roleCheck');
const supabase = require('../services/supabaseService');

module.exports = (io) => {
  const router = require('express').Router();
  // Use io inside your route handlers

  // Protect all resource routes
  router.use(jwtAuth);

  // Only admin can create, update, delete
  router.post('/', roleCheck(['admin']), (req, res) => resourceController.createResource(req, res, io));
  router.put('/:id', roleCheck(['admin']), resourceController.updateResource);
  router.delete('/:id', roleCheck(['admin']), resourceController.deleteResource);

  // Anyone can read
  router.get('/', async (req, res) => {
    const { lat, lon, radius = 10000 } = req.query;
    if (lat && lon) {
      // Geospatial query
      const { data, error } = await supabase
        .rpc('find_resources_within_radius', {
          center_lat: parseFloat(lat),
          center_lon: parseFloat(lon),
          search_radius: parseInt(radius, 10)
        });
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ resources: data });
    } else {
      // Default: get all resources (optionally filter by disaster_id)
      return resourceController.getResources(req, res);
    }
  });

  return router;
};
