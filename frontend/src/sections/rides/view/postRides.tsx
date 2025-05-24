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
import { GoogleMap, useLoadScript, Autocomplete } from '@react-google-maps/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import api, { getDistanceMatrix } from 'src/utils/api'; // Import the Axios instance and getDistanceMatrix

// Google Libraries
const libraries = ['places'];
const mapContainerStyle = {
  width: '0px',
  height: '0px',
};

// Bennett University Details
const BENNETT_UNIVERSITY_ADDRESS =
  'Bennett University, Greater Noida, Uttar Pradesh, India';
// You can replace this with the actual Place ID if available for more precise matching
const BENNETT_UNIVERSITY_PLACE_ID = 'ChIJw7I6xwH6njkRejR7_eGd1o4'; // Example Place ID

export function PostRidePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    // driver will be fetched from profile
   
    startLocation: '',
    destination: '',
    departureTime: null as Date | null,
    arrivalTime: null as Date | null, // Will be set automatically
    price: '',
    availableSeats: '',
    requiresApproval: false, // New field for booking approval
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [driverName, setDriverName] = useState('');


  const [rideDirection, setRideDirection] = useState<'from' | 'to'>('from'); // 'from' or 'to'

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: 'AIzaSyB1FL4hF8actfjd_5PgMAyxv9Zz2lN_Imw', // Use environment variables
    libraries,
  });

  const autocompleteStart = useRef<google.maps.places.Autocomplete | null>(null);
  const autocompleteDestination = useRef<google.maps.places.Autocomplete | null>(null);

  // Function to fetch user profile from the backend
  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/profile'); // GET /api/profile
      return response.data; // Assuming the backend sends the user data directly
    } catch (error) {
      console.error('Error fetching user profile:', error.response || error);
      throw error; // Propagate the error to handle it in the component
    }
  };

  // Fetch user profile on component mount
  useEffect(() => {
    const getUserProfile = async () => {
      try {
        const profile = await fetchUserProfile();
        setDriverName(profile.name); // Adjust based on your backend's user object
        
        // If rideDirection is 'from', set startLocation to Bennett University
        if (rideDirection === 'from') {
          setFormData((prev) => ({
            ...prev,
            startLocation: BENNETT_UNIVERSITY_ADDRESS,
            destination: '',
            arrivalTime: null,
          }));
        } else if (rideDirection === 'to') {
          setFormData((prev) => ({
            ...prev,
            destination: BENNETT_UNIVERSITY_ADDRESS,
            startLocation: '',
            arrivalTime: null,
          }));
        }
      } catch (error) {
        setSubmitError('Failed to fetch user profile. Please try again.');
      }
    };
    getUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rideDirection]);

  // Handle toggle change
  const handleToggleChange = (
    event: React.MouseEvent<HTMLElement>,
    newDirection: 'from' | 'to' | null
  ) => {
    if (newDirection !== null) {
      setRideDirection(newDirection);
      // Reset form fields related to the toggle
      if (newDirection === 'from') {
        setFormData((prev) => ({
          ...prev,
          startLocation: BENNETT_UNIVERSITY_ADDRESS,
          destination: '',
          arrivalTime: null,
        }));
        setErrors((prev) => ({
          ...prev,
          startLocation: '',
          destination: '',
          location: '',
          departureTime: '',
        }));
      } else if (newDirection === 'to') {
        setFormData((prev) => ({
          ...prev,
          destination: BENNETT_UNIVERSITY_ADDRESS,
          startLocation: '',
          arrivalTime: null,
        }));
        setErrors((prev) => ({
          ...prev,
          startLocation: '',
          destination: '',
          location: '',
          departureTime: '',
        }));
      }
    }
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    if (name === 'requiresApproval') {
      setFormData((prev) => ({ ...prev, requiresApproval: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle date-time changes
  const handleDateChange = async (name: string, value: Date | null) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'departureTime') {
      if (
        formData.startLocation &&
        formData.destination &&
        value // Ensure departureTime is selected
      ) {
        try {
          // Fetch distance matrix from backend
          const distanceData = await getDistanceMatrix(formData.startLocation, formData.destination);
          if (
            distanceData &&
            distanceData.rows &&
            distanceData.rows[0].elements &&
            distanceData.rows[0].elements[0].status === 'OK'
          ) {
            const travelDurationSeconds = distanceData.rows[0].elements[0].duration.value; // Duration in seconds
            const arrivalDate = new Date(value);
            arrivalDate.setSeconds(arrivalDate.getSeconds() + travelDurationSeconds);
            setFormData((prev) => ({ ...prev, arrivalTime: arrivalDate }));
          } else {
            setErrors((prev) => ({
              ...prev,
              arrivalTime: 'Unable to calculate arrival time.',
            }));
            setFormData((prev) => ({ ...prev, arrivalTime: null }));
          }
        } catch (error) {
          console.error('Error fetching distance matrix:', error);
          setErrors((prev) => ({
            ...prev,
            arrivalTime: 'Error calculating arrival time.',
          }));
          setFormData((prev) => ({ ...prev, arrivalTime: null }));
        }
      } else {
        setFormData((prev) => ({ ...prev, arrivalTime: null }));
      }
    }
  };

  // Handle place selection from Autocomplete
  const onPlaceChanged = (
    ref: React.RefObject<google.maps.places.Autocomplete>,
    field: string
  ) => {
    if (ref.current !== null) {
      const place = ref.current.getPlace();
      if (place.formatted_address) {
        setFormData((prev) => ({ ...prev, [field]: place.formatted_address, arrivalTime: null }));
      }
    }
  };

  // Validate form inputs
  const validate = (): boolean => {
    let temp: { [key: string]: string } = {};
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);

    // Validate start and destination based on toggle
    if (rideDirection === 'from') {
      // Start location is fixed, validate destination
      temp.startLocation =
        formData.startLocation === BENNETT_UNIVERSITY_ADDRESS
          ? ''
          : 'Start location must be Bennett University.';
      temp.destination = formData.destination ? '' : 'Destination is required.';
    } else if (rideDirection === 'to') {
      // Destination is fixed, validate start location
      temp.destination =
        formData.destination === BENNETT_UNIVERSITY_ADDRESS
          ? ''
          : 'Destination must be Bennett University.';
      temp.startLocation = formData.startLocation ? '' : 'Start location is required.';
    }

    // Validate departureTime
    if (formData.departureTime) {
      if (formData.departureTime <= now) {
        temp.departureTime = 'Departure time must be in the future.';
      } else if (formData.departureTime > sevenDaysFromNow) {
        temp.departureTime = 'Departure time must be within the next 7 days.';
      } else {
        temp.departureTime = '';
      }
    } else {
      temp.departureTime = 'Departure time is required.';
    }

    // Validate arrivalTime
    temp.arrivalTime = formData.arrivalTime ? '' : 'Arrival time is required.';

    // Validate price
    temp.price =
      formData.price && !isNaN(Number(formData.price)) && parseFloat(formData.price) > 0
        ? ''
        : 'Valid price is required.';

    // Validate availableSeats
    temp.availableSeats =
      formData.availableSeats &&
      !isNaN(Number(formData.availableSeats)) &&
      parseInt(formData.availableSeats, 10) > 0
        ? ''
        : 'Valid number of seats is required.';

    setErrors({
      ...temp,
    });

    return Object.values(temp).every((x) => x === '');
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setSubmitting(true);
      setSubmitError('');
      try {
        const payload = {
          driverName: driverName,
         
          ...formData,
          departureTime: formData.departureTime?.toISOString(),
          arrivalTime: formData.arrivalTime?.toISOString(),
          price: parseFloat(formData.price),
          availableSeats: parseInt(formData.availableSeats, 10),
        };

        console.log('Payload:', payload); // Debugging: Log the payload before sending

        const response = await api.post('/rides', payload); // Use the Axios instance
        alert('Ride posted successfully!');
        navigate('/rides'); // Navigate to the rides page
      } catch (error: any) {
        console.error('Error posting ride:', error.response || error);
        setSubmitError(error.response?.data?.message || 'Failed to post ride.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  if (loadError) return <Typography color="error">Error loading maps</Typography>;
  if (!isLoaded)
    return (
      <Box
        sx={{
          display: 'flex',
          height: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );

  // Calculate the maximum departure date (7 days from now)
  const maxDepartureDate = new Date();
  maxDepartureDate.setDate(maxDepartureDate.getDate() + 7);

  // Calculate minTime and maxTime for DatePicker based on whether the selected date is today
  const calculateMinTime = () => {
    if (
      formData.departureTime &&
      formData.departureTime.toDateString() === new Date().toDateString()
    ) {
      return new Date();
    }
    return new Date().setHours(0, 0, 0, 0);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 5 }, backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      <Paper elevation={3} sx={{ p: 4, maxWidth: '600px', mx: 'auto' }}>
        <Typography variant="h5" sx={{ mb: 3, textAlign: 'center', fontWeight: 'bold' }}>
          Post a Ride
        </Typography>
        
        <Typography variant="subtitle1" sx={{ textAlign: 'center', mb: 3 }}>
          Driver: {driverName}
        </Typography>

        {/* Toggle Button Group */}
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <ToggleButtonGroup
            value={rideDirection}
            exclusive
            onChange={handleToggleChange}
            aria-label="Ride Direction"
          >
            <ToggleButton value="from" aria-label="From Bennett University">
              From Bennett University
            </ToggleButton>
            <ToggleButton value="to" aria-label="To Bennett University">
              To Bennett University
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            {/* Start Location with Autocomplete */}
            <Grid item xs={12}>
              {rideDirection === 'from' ? (
                <TextField
                  label="Start Location"
                  name="startLocation"
                  value={formData.startLocation}
                  fullWidth
                  disabled
                  InputProps={{
                    readOnly: true,
                  }}
                />
              ) : (
                <Autocomplete
                  onLoad={(autocomplete) => {
                    autocompleteStart.current = autocomplete;
                  }}
                  onPlaceChanged={() =>
                    onPlaceChanged(autocompleteStart, 'startLocation')
                  }
                  options={{
                    componentRestrictions: { country: 'in' },
                    fields: ['formatted_address'],
                  }}
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

            {/* Destination with Autocomplete */}
            <Grid item xs={12}>
              {rideDirection === 'to' ? (
                <TextField
                  label="Destination"
                  name="destination"
                  value={formData.destination}
                  fullWidth
                  disabled
                  InputProps={{
                    readOnly: true,
                  }}
                />
              ) : (
                <Autocomplete
                  onLoad={(autocomplete) => {
                    autocompleteDestination.current = autocomplete;
                  }}
                  onPlaceChanged={() =>
                    onPlaceChanged(autocompleteDestination, 'destination')
                  }
                  options={{
                    componentRestrictions: { country: 'in' },
                    fields: ['formatted_address'],
                  }}
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

            {/* Validation Message for Locations (if any) */}
            {errors.location && (
              <Grid item xs={12}>
                <Typography variant="body2" color="error">
                  {errors.location}
                </Typography>
              </Grid>
            )}

            {/* Departure Time */}
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Departure Time
              </Typography>
              <DatePicker
                selected={formData.departureTime}
                onChange={(date) => handleDateChange('departureTime', date)}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="MMMM d, yyyy h:mm aa"
                className="date-picker"
                placeholderText="Select departure time"
                wrapperClassName="w-full"
                minDate={new Date()}
                maxDate={maxDepartureDate}
                minTime={calculateMinTime()}
                maxTime={new Date(new Date().setHours(23, 45))}
              />
              {errors.departureTime && (
                <Typography variant="body2" color="error">
                  {errors.departureTime}
                </Typography>
              )}
            </Grid>

            {/* Arrival Time - Read Only */}
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Arrival Time
              </Typography>
              <DatePicker
                selected={formData.arrivalTime}
                onChange={() => {}} // Do nothing, read-only
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="MMMM d, yyyy h:mm aa"
                className="date-picker"
                placeholderText="Arrival time will be set automatically"
                wrapperClassName="w-full"
                readOnly
              />
              {errors.arrivalTime && (
                <Typography variant="body2" color="error">
                  {errors.arrivalTime}
                </Typography>
              )}
            </Grid>

            {/* Price */}
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
                required
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>

            {/* Available Seats */}
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
                required
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>

            {/* New Toggle for Booking Approval */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.requiresApproval}
                    onChange={handleChange}
                    name="requiresApproval"
                    color="primary"
                  />
                }
                label="Require approval for bookings"
              />
            </Grid>

            {/* Submit Button */}
            <Grid item xs={12}>
              {submitError && (
                <Typography variant="body2" color="error" sx={{ mb: 2 }}>
                  {submitError}
                </Typography>
              )}
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={submitting}
              >
                {submitting ? 'Posting...' : 'Post Ride'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
}
