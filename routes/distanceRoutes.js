const express = require('express');
const axios = require('axios');
const router = express.Router();

// Load environment variables
require('dotenv').config();

/**
 * GET /api/distance
 * Query Parameters:
 * - origins: Starting location
 * - destinations: Destination location
 */
router.get('/', async (req, res) => {
  try {
    const { origins, destinations } = req.query;

    if (!origins || !destinations) {
      return res.status(400).json({ error: 'Both origins and destinations are required' });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY; // Ensure this is set in your .env file

    const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
      params: {
        origins,
        destinations,
        key: apiKey,
      },
    });

    const data = response.data;

    if (data.status !== 'OK') {
      return res.status(500).json({
        error: 'Failed to fetch distance data from Google Maps API',
        details: data.error_message || 'Unknown error from Google Maps API',
      });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching distance data:', error.message);
    res.status(500).json({ error: 'Failed to fetch distance data', details: error.message });
  }
});

module.exports = router;
