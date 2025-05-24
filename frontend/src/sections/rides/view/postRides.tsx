// frontend/src/sections/rides/view/PostRidePage.tsx

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Button,
  TextField,
  Grid,
  Paper,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { Autocomplete } from '@react-google-maps/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import api, { getDistanceMatrix } from 'src/utils/api';

// Google Libraries
const libraries = ['places'];
const mapContainerStyle = { width: '0px', height: '0px' };

// Bennett University Details
const BENNETT_UNIVERSITY_ADDRESS =
  'Bennett University, Greater Noida, Uttar Pradesh, India';

export function PostRidePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    startLocation: '',
    destination: '',
    departureTime: null as Date | null,
    arrivalTime: null as Date | null,
    price: '',
    availableSeats: '',
    requiresApproval: false,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [driverName, setDriverName] = useState('');

  const [rideDirection, setRideDirection] = useState<'from' | 'to'>('from');

  const autocompleteStart = useRef<google.maps.places.Autocomplete | null>(null);
  const autocompleteDestination = useRef<google.maps.places.Autocomplete | null>(null);

  // Fetch user profile
  useEffect(() => {
    (async () => {
      try {
        const profile = (await api.get('/profile')).data;
        setDriverName(profile.name);
        // initialize location based on toggle
        if (rideDirection === 'from') {
          setFormData(f => ({ ...f, startLocation: BENNETT_UNIVERSITY_ADDRESS, destination: '', arrivalTime: null }));
        } else {
          setFormData(f => ({ ...f, destination: BENNETT_UNIVERSITY_ADDRESS, startLocation: '', arrivalTime: null }));
        }
      } catch {
        setSubmitError('Failed to fetch user profile. Please try again.');
      }
    })();
  }, [rideDirection]);

  const handleToggleChange = (_: any, newDir: 'from' | 'to' | null) => {
    if (!newDir) return;
    setRideDirection(newDir);
    setErrors({});
    setFormData(f => ({
      ...f,
      startLocation: newDir === 'from' ? BENNETT_UNIVERSITY_ADDRESS : '',
      destination: newDir === 'to' ? BENNETT_UNIVERSITY_ADDRESS : '',
      arrivalTime: null,
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    setFormData(f => ({
      ...f,
      [name]: name === 'requiresApproval' ? checked : value,
    }));
  };

  const handleDateChange = async (field: string, date: Date | null) => {
    setFormData(f => ({ ...f, [field]: date }));
    if (field === 'departureTime' && formData.startLocation && formData.destination && date) {
      try {
        const dist = await getDistanceMatrix(formData.startLocation, formData.destination);
        const el = dist.rows[0].elements[0];
        if (el.status === 'OK') {
          const arrival = new Date(date);
          arrival.setSeconds(arrival.getSeconds() + el.duration.value);
          setFormData(f => ({ ...f, arrivalTime: arrival }));
        } else {
          setErrors(e => ({ ...e, arrivalTime: 'Unable to calculate arrival time.' }));
          setFormData(f => ({ ...f, arrivalTime: null }));
        }
      } catch {
        setErrors(e => ({ ...e, arrivalTime: 'Error calculating arrival time.' }));
        setFormData(f => ({ ...f, arrivalTime: null }));
      }
    }
  };

  const onPlaceChanged = (ref: React.RefObject<google.maps.places.Autocomplete>, field: string) => {
    const place = ref.current?.getPlace();
    if (place?.formatted_address) {
      setFormData(f => ({ ...f, [field]: place.formatted_address, arrivalTime: null }));
    }
  };

  const validate = () => {
    const now = new Date();
    const weekAhead = new Date(now);
    weekAhead.setDate(now.getDate() + 7);
    const temp: Record<string,string> = {};

    if (rideDirection === 'from') {
      temp.destination = formData.destination ? '' : 'Destination is required.';
    } else {
      temp.startLocation = formData.startLocation ? '' : 'Start location is required.';
    }

    if (!formData.departureTime) temp.departureTime = 'Departure time is required.';
    else if (formData.departureTime <= now) temp.departureTime = 'Must be in the future.';
    else if (formData.departureTime > weekAhead) temp.departureTime = 'Within next 7 days.';

    temp.arrivalTime = formData.arrivalTime ? '' : 'Arrival time is required.';
    temp.price = +formData.price > 0 ? '' : 'Valid price is required.';
    temp.availableSeats = +formData.availableSeats > 0 ? '' : 'Valid seats required.';

    setErrors(temp);
    return Object.values(temp).every(v => v === '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        driverName,
        ...formData,
        departureTime: formData.departureTime?.toISOString(),
        arrivalTime: formData.arrivalTime?.toISOString(),
        price: +formData.price,
        availableSeats: +formData.availableSeats,
      };
      await api.post('/rides', payload);
      alert('Ride posted successfully!');
      navigate('/rides');
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Failed to post ride.');
    } finally {
      setSubmitting(false);
    }
  };

  // Render
  return (
    <Box sx={{ p: { xs: 2, md: 5 }, backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      <Paper elevation={3} sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
        <Typography variant="h5" align="center" gutterBottom>
          Post a Ride
        </Typography>
        <Typography variant="subtitle1" align="center" gutterBottom>
          Driver: {driverName}
        </Typography>

        <Box textAlign="center" mb={3}>
          <ToggleButtonGroup
            value={rideDirection}
            exclusive
            onChange={handleToggleChange}
          >
            <ToggleButton value="from">From Bennett University</ToggleButton>
            <ToggleButton value="to">To Bennett University</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>

            {/* Start Location */}
            <Grid item xs={12}>
              {rideDirection === 'from' ? (
                <TextField
                  label="Start Location"
                  name="startLocation"
                  value={formData.startLocation}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />
              ) : (
                <Autocomplete
                  onLoad={ref => (autocompleteStart.current = ref)}
                  onPlaceChanged={() => onPlaceChanged(autocompleteStart, 'startLocation')}
                  options={{ componentRestrictions: { country: 'in' }, fields: ['formatted_address'] }}
                >
                  <TextField
                    label="Start Location"
                    name="startLocation"
                    value={formData.startLocation}
                    onChange={handleChange}
                    fullWidth
                    error={!!errors.startLocation}
                    helperText={errors.startLocation}
                    required
                  />
                </Autocomplete>
              )}
            </Grid>

            {/* Destination */}
            <Grid item xs={12}>
              {rideDirection === 'to' ? (
                <TextField
                  label="Destination"
                  name="destination"
                  value={formData.destination}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />
              ) : (
                <Autocomplete
                  onLoad={ref => (autocompleteDestination.current = ref)}
                  onPlaceChanged={() => onPlaceChanged(autocompleteDestination, 'destination')}
                  options={{ componentRestrictions: { country: 'in' }, fields: ['formatted_address'] }}
                >
                  <TextField
                    label="Destination"
                    name="destination"
                    value={formData.destination}
                    onChange={handleChange}
                    fullWidth
                    error={!!errors.destination}
                    helperText={errors.destination}
                    required
                  />
                </Autocomplete>
              )}
            </Grid>

            {/* Departure & Arrival */}
            <Grid item xs={12} sm={6}>
              <Typography>Departure Time</Typography>
              <DatePicker
                selected={formData.departureTime}
                onChange={date => handleDateChange('departureTime', date)}
                showTimeSelect
                timeIntervals={15}
                dateFormat="MMMM d, yyyy h:mm aa"
                className="date-picker"
                placeholderText="Select departure time"
                minDate={new Date()}
                maxDate={(() => { const d = new Date(); d.setDate(d.getDate()+7); return d; })()}
              />
              {!!errors.departureTime && <Typography color="error">{errors.departureTime}</Typography>}
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography>Arrival Time</Typography>
              <DatePicker
                selected={formData.arrivalTime}
                readOnly
                showTimeSelect
                timeIntervals={15}
                dateFormat="MMMM d, yyyy h:mm aa"
                className="date-picker"
                placeholderText="Arrival time will be set automatically"
              />
              {!!errors.arrivalTime && <Typography color="error">{errors.arrivalTime}</Typography>}
            </Grid>

            {/* Price & Seats */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Price (INR)"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleChange}
                fullWidth
                error={!!errors.price}
                helperText={errors.price}
                inputProps={{ min: 0 }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Available Seats"
                name="availableSeats"
                type="number"
                value={formData.availableSeats}
                onChange={handleChange}
                fullWidth
                error={!!errors.availableSeats}
                helperText={errors.availableSeats}
                inputProps={{ min: 1 }}
                required
              />
            </Grid>

            {/* Approval Toggle */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.requiresApproval}
                    onChange={handleChange}
                    name="requiresApproval"
                  />
                }
                label="Require approval for bookings"
              />
            </Grid>

            {/* Submit */}
            <Grid item xs={12}>
              {!!submitError && <Typography color="error">{submitError}</Typography>}
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={submitting}
              >
                {submitting ? 'Posting…' : 'Post Ride'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
}

