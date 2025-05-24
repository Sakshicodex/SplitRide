// frontend/src/pages/RidesPage.jsx

import React, { useState, useEffect } from 'react';
import Grid from '@mui/material/Unstable_Grid2'; // Note: Ensure you have the correct version of MUI
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Avatar from '@mui/material/Avatar';

import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'src/context/AuthContext'; // Use the useAuth hook

export function RidesPage() {
  const [rides, setRides] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [bennettFilter, setBennettFilter] = useState('from'); // 'from' or 'to'
  const [loading, setLoading] = useState(true); // Loading state

  const navigate = useNavigate(); // Initialize useNavigate
  const { user } = useAuth(); // Access current user using useAuth hook

  // Fetch rides from the backend
  useEffect(() => {
    const fetchRides = async () => {
      try {
        const response = await axios.get('/api/rides');
        console.log('API Response:', response);
        if (Array.isArray(response.data.rides)) {
          // Filter out rides posted by the current user
          const filteredRides = response.data.rides.filter(
            (ride) => ride.driverId !== user?._id
          );
          setRides(filteredRides);
        } else {
          console.error('Unexpected response format:', response.data);
          setRides([]); // Fallback to an empty array
        }
      } catch (error) {
        console.error('Error fetching rides:', error.response || error);
        setRides([]); // Fallback to an empty array on error
      } finally {
        setLoading(false); // Set loading to false after fetch
      }
    };

    // Only fetch rides if user is authenticated
    if (user) {
      fetchRides();
    } else {
      setLoading(false); // If no user, stop loading
    }
  }, [user?._id]); // Re-run effect if user ID changes

  const handleSearch = (event) => {
    setSearch(event.target.value);
  };

  const handleFilterChange = (event) => {
    setFilter(event.target.value);
  };

  const handleBennettFilter = (event, newFilter) => {
    if (newFilter) setBennettFilter(newFilter);
  };

  // Sort rides based on filter
  const sortedRides = [...rides].sort((a, b) => {
    if (filter === 'priceLowHigh') return a.price - b.price;
    if (filter === 'priceHighLow') return b.price - a.price;
    if (filter === 'departureTime')
      return new Date(a.departureTime) - new Date(b.departureTime);
    return 0;
  });

  // Current time for filtering out past rides
  const currentTime = new Date();

  // Filter rides based on Bennett filter, search term, and departure time
  const filteredRides = sortedRides.filter(
    (ride) =>
      (bennettFilter === 'from'
        ? ride.startLocation.toLowerCase().includes('bennett university')
        : ride.destination.toLowerCase().includes('bennett university')) &&
      (ride.destination.toLowerCase().includes(search.toLowerCase()) ||
        ride.startLocation.toLowerCase().includes(search.toLowerCase())) &&
      new Date(ride.departureTime) > currentTime // Exclude past rides
  );

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          height: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="h6">Loading rides...</Typography>
      </Box>
    );
  }

  // Handler for "View Details" button click
  const handleViewDetails = (ride) => {
    if (ride.availableSeats > 0) {
      navigate(`/rides/${ride._id}`);
    } else {
      alert('Seats are full. Please check another ride.');
    }
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
      {/* Header Section */}
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold', textAlign: 'center' }}>
        Find a Ride 🚗
      </Typography>

      {/* Toggle for Bennett University Filter */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <ToggleButtonGroup
          value={bennettFilter}
          exclusive
          onChange={handleBennettFilter}
          aria-label="Bennett Filter"
        >
          <ToggleButton value="from" aria-label="From Bennett University">
            From Bennett University
          </ToggleButton>
          <ToggleButton value="to" aria-label="To Bennett University">
            To Bennett University
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Search and Filters */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid xs={12} sm={8}>
          <TextField
            fullWidth
            label="Search by destination or departure"
            value={search}
            onChange={handleSearch}
            placeholder="Enter a city or destination"
            sx={{ backgroundColor: '#fff', borderRadius: 1 }}
          />
        </Grid>
        <Grid xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel id="filter-label">Sort By</InputLabel>
            <Select
              labelId="filter-label"
              value={filter}
              onChange={handleFilterChange}
              label="Sort By"
              sx={{ backgroundColor: '#fff', borderRadius: 1 }}
            >
              <MenuItem value="priceLowHigh">Price: Low to High</MenuItem>
              <MenuItem value="priceHighLow">Price: High to Low</MenuItem>
              <MenuItem value="departureTime">Departure Time</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Rides List */}
      {filteredRides.length > 0 ? (
        <Grid container spacing={3}>
          {filteredRides.map((ride) => (
            <Grid xs={12} sm={6} md={4} key={ride._id}>
              <Card
                sx={{
                  boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
                  borderRadius: 0,
                  overflow: 'hidden',
                  backgroundColor: '#fff',
                  opacity: ride.availableSeats === 0 ? 0.7 : 1, // Optional: Reduce opacity for full seats
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    mt: 2,
                  }}
                >
                  <Avatar
                    alt={ride.driverName}
                    src={ride.profilePicture}
                    sx={{
                      width: 80,
                      height: 80,
                      border: '3px solid #3f51b5',
                    }}
                  />
                </Box>
                <CardContent sx={{ textAlign: 'center', paddingBottom: '16px' }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {ride.driverName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    From: {ride.startLocation} <br />
                    To: {ride.destination}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Departure: {new Date(ride.departureTime).toLocaleString()} <br />
                    Arrival: {new Date(ride.arrivalTime).toLocaleString()}
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 2, fontWeight: 'bold', color: '#3f51b5' }}>
                    ₹{ride.price} per seat
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Seats Available: {ride.availableSeats}
                  </Typography>
                </CardContent>
                <CardActions
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    px: 2,
                    pb: 2,
                  }}
                >
                  <Button
                    size="small"
                    color="primary"
                    variant={ride.availableSeats > 0 ? 'contained' : 'outlined'}
                    onClick={() => handleViewDetails(ride)} // Conditional navigation or alert
                    disabled={ride.availableSeats === 0} // Disable if no seats
                    sx={{
                      cursor: ride.availableSeats === 0 ? 'not-allowed' : 'pointer',
                      backgroundColor:
                        ride.availableSeats > 0 ? '#3f51b5' : 'grey.400',
                      color: '#fff',
                      '&:hover': {
                        backgroundColor:
                          ride.availableSeats > 0 ? '#303f9f' : 'grey.400',
                      },
                    }}
                  >
                    {ride.availableSeats > 0 ? 'View Details' : 'Seats Full'}
                  </Button>
                </CardActions>

              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography variant="h6" align="center" color="text.secondary">
          No rides found matching your criteria.
        </Typography>
      )}

      {/* Post a Ride Button */}
      <Box sx={{ mt: 5, textAlign: 'center' }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          sx={{ boxShadow: '0px 4px 20px rgba(63, 81, 181, 0.5)' }}
          onClick={() => navigate('/post-ride')} // Use navigate
        >
          Post a Ride
        </Button>
      </Box>
    </Box>
  );
}
