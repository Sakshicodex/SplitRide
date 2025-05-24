// frontend/src/pages/TripDetailsPage.tsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // React Router for navigation
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Rating from '@mui/material/Rating';
import Modal from '@mui/material/Modal';
import Backdrop from '@mui/material/Backdrop';
import Fade from '@mui/material/Fade';
import { Iconify } from 'src/components/iconify';
import axios from 'axios'; // Import axios
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Divider from '@mui/material/Divider';
// Corrected import for jwt-decode
import {jwtDecode}from 'jwt-decode'; 

import { useAuth } from 'src/context/AuthContext'; // Ensure AuthContext is properly set up

interface Review {
  user: string;
  comment: string;
}

interface Ride {
  _id: string;
  driverId: string;
  driverName: string;
  profilePicture: string;
  startLocation: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  distance: number;
  price: number;
  availableSeats: number;
  reviews: Review[];
  rating: number;
  // Add other fields as necessary
}

interface Booking {
  _id: string;
  user: {
    _id: string; // Added user ID
    name: string;
    email: string;
    profilePicture: string;
  };
  seats: number;
  status: string; // 'pending', 'approved', 'rejected'
  bookedAt: string;
}

interface CoPassenger {
  name: string;
  email: string;
  profilePicture: string;
  seats: number;
  bookedAt: string;
}

interface DecodedToken {
  id: string;
  email: string; // Assuming email is included in the token
  // Add other fields from your JWT if necessary
}

export function TripDetailsPage() {
  const { id } = useParams(); // Get the ride ID from the URL
  const navigate = useNavigate(); // For navigation
  const { user, token } = useAuth(); // Destructure user and token from AuthContext

  const [ride, setRide] = useState<Ride | null>(null);
  const [estimatedTime, setEstimatedTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingSeats, setBookingSeats] = useState(1); // State for booking seats
  const [bookingError, setBookingError] = useState(''); // State for booking errors

  // States for managing bookings (if needed)
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState('');

  // States for managing co-passengers
  const [coPassengers, setCoPassengers] = useState<CoPassenger[] | null>(null);
  const [coPassengersLoading, setCoPassengersLoading] = useState<boolean>(false);
  const [coPassengersError, setCoPassengersError] = useState<string>('');

  // State to check if user has already booked
  const [hasBooked, setHasBooked] = useState(false);
  const [existingBooking, setExistingBooking] = useState<Booking | null>(null);

  // Function to get current user ID from token
  const getUserId = () => {
    if (!token) return null;
    try {
      const decoded: DecodedToken = jwtDecode(token);
      return decoded.id;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  const currentUserId = getUserId();

  // Fetch the ride details from the backend
  useEffect(() => {
    const fetchRideDetails = async () => {
      try {
        const response = await axios.get(`/api/rides/${id}`); // Public route, no token needed
        console.log('Ride Data:', response.data.ride); // Debug log
        setRide({
          ...response.data.ride,
          reviews: response.data.ride.reviews || [], // Ensure reviews is an array
        });
        if (response.data.ride) {
          calculateTravelTime(response.data.ride.startLocation, response.data.ride.destination);
        }
      } catch (error: any) {
        console.error('Error fetching ride details:', error.response || error);
        setRide(null); // Fallback in case of error
        setLoading(false);
      }
    };
    fetchRideDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Calculate travel time using backend API
  const calculateTravelTime = async (origin: string, destination: string) => {
    if (!origin || !destination) {
      console.error('Origin or destination is undefined');
      setEstimatedTime('Invalid locations');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get('/api/distance', {
        params: {
          origins: origin,
          destinations: destination,
        },
      });

      const data = response.data;
      console.log('Distance Matrix Response:', data); // Debug log

      if (data.rows && data.rows[0].elements && data.rows[0].elements[0].status === 'OK') {
        setEstimatedTime(data.rows[0].elements[0].duration.text);
      } else {
        setEstimatedTime('Not Available');
      }
    } catch (error: any) {
      console.error('Error calculating travel time:', error);
      setEstimatedTime('Error calculating time');
    } finally {
      setLoading(false);
    }
  };

  // Fetch bookings based on user role (if needed)
  useEffect(() => {
    const fetchBookings = async () => {
      if (!ride || !currentUserId) return;

      setBookingsLoading(true);
      setBookingsError('');
      try {
        const response = await axios.get(`/api/rides/${id}/bookings`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const fetchedBookings: Booking[] = response.data.bookings || [];

        if (ride.driverId === currentUserId) {
          // User is the driver; manage bookings
          setBookings(fetchedBookings);
        } else {
          // User is a passenger; check if they've already booked and fetch co-passengers
          const userBooking = fetchedBookings.find(
            (booking) => booking.user.email === user?.email
          );

          if (userBooking) {
            setHasBooked(true);
            setExistingBooking(userBooking);
          }

          // Fetch approved bookings as co-passengers
          const approvedBookings = fetchedBookings.filter(
            (booking) => booking.status === 'approved'
          );
          setBookings(approvedBookings);
        }
      } catch (error: any) {
        console.error('Error fetching bookings:', error.response || error);
        if (ride.driverId === currentUserId) {
          setBookingsError('Failed to fetch bookings.');
        } else {
          setBookingsError('Failed to fetch co-passengers.');
        }
      } finally {
        setBookingsLoading(false);
      }
    };

    fetchBookings();
  }, [ride, id, currentUserId, token, user?.email]);

  // Fetch co-passengers from the public endpoint
  useEffect(() => {
    const fetchCoPassengers = async () => {
      if (!id) return; // Ensure ride ID is available

      setCoPassengersLoading(true);
      setCoPassengersError('');
      try {
        const response = await axios.get(`/api/rides/${id}/copassengers`);
        setCoPassengers(response.data.coPassengers);
      } catch (error: any) {
        console.error('Error fetching co-passengers:', error.response || error);
        setCoPassengersError(
          error.response?.data?.message || 'Failed to fetch co-passengers.'
        );
      } finally {
        setCoPassengersLoading(false);
      }
    };

    fetchCoPassengers();
  }, [id]);

  // Function to approve a booking
  const handleApprove = async (bookingId: string) => {
    try {
      await axios.post(
        `/api/rides/${id}/bookings/${bookingId}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // Update bookings state
      setBookings((prev) =>
        prev?.map((booking) =>
          booking._id === bookingId ? { ...booking, status: 'approved' } : booking
        )
      );
      alert('Booking approved successfully!');
    } catch (error: any) {
      console.error('Error approving booking:', error.response || error);
      alert(error.response?.data?.message || 'Failed to approve booking.');
    }
  };

  // Function to reject a booking
  const handleReject = async (bookingId: string) => {
    try {
      await axios.post(
        `/api/rides/${id}/bookings/${bookingId}/reject`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // Update bookings state
      setBookings((prev) =>
        prev?.map((booking) =>
          booking._id === bookingId ? { ...booking, status: 'rejected' } : booking
        )
      );
      alert('Booking rejected successfully!');
    } catch (error: any) {
      console.error('Error rejecting booking:', error.response || error);
      alert(error.response?.data?.message || 'Failed to reject booking.');
    }
  };

  // Function to handle chat initiation
  const handleChat = async (booking: Booking) => {
    if (!token || !booking.user._id) {
      alert('Authentication error. Please try again.');
      return;
    }

    try {
      // Create or get the conversation with the passenger
      const conversationResponse = await axios.post(
        `/api/chat/conversations/${booking.user._id}`, // Adjust the endpoint as per your backend
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const conversationId = conversationResponse.data.conversation._id;

      // Navigate to the Chat Page with conversationId
      navigate(`/chat/${conversationId}`);
    } catch (error: any) {
      console.error('Error initiating chat:', error.response || error);
      alert('Failed to initiate chat. Please try again.');
    }
  };

  // Function to handle booking modal open
  const handleBookingOpen = () => {
    if (ride && ride.availableSeats > 0) {
      setBookingSeats(1); // Reset to 1 seat when opening the modal
      setBookingError('');
      setBookingOpen(true);
    } else {
      alert('No seats available for this ride.');
    }
  };

  // Function to handle booking modal close
  const handleBookingClose = () => {
    setBookingOpen(false);
    setBookingError('');
  };

  // Function to confirm booking
  const handleConfirmBooking = async () => {
    if (!ride) return;

    // Validate the number of seats before booking
    if (bookingSeats < 1 || bookingSeats > ride.availableSeats) {
      setBookingError(`Please select between 1 and ${ride.availableSeats} seats.`);
      return;
    }

    try {
      // Check if the user has already booked
      if (hasBooked) {
        setBookingError('You have already booked this ride.');
        return;
      }

      // Example booking API call
      const response = await axios.post(
        `/api/rides/${id}/book`,
        {
          seats: bookingSeats, // Use the selected number of seats
        },
        {
          headers: {
            Authorization: `Bearer ${token}`, // Include the token in headers
          },
        }
      );

      // Handle successful booking
      alert(`Successfully booked ${bookingSeats} seat(s)! Awaiting approval.`);
      setBookingOpen(false);
      setHasBooked(true);
      setExistingBooking(response.data.booking);
      // Optionally, navigate to a confirmation page or update the ride's available seats
      navigate('/rides'); // Navigate back to rides list or another page
    } catch (error: any) {
      console.error('Error booking ride:', error.response || error);
      setBookingError(error.response?.data?.message || 'Failed to book the ride. Please try again.');
    }
  };

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
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!ride) {
    return (
      <Box sx={{ textAlign: 'center', mt: 10 }}>
        <Typography variant="h4" color="error" gutterBottom>
          Ride Not Found
        </Typography>
        <Button variant="contained" color="primary" onClick={() => navigate('/rides')}>
          Back to Rides
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 5 }, backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      {/* Header Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Avatar
            alt={ride.driverName}
            src={ride.profilePicture}
            sx={{
              width: { xs: 120, sm: 150 },
              height: { xs: 120, sm: 150 },
              border: '4px solid #3f51b5',
              mx: 'auto',
              display: 'block',
            }}
          />
        </Grid>
        <Grid item xs={12} sm={8} sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            {ride.driverName}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            From <strong>{ride.startLocation}</strong> to <strong>{ride.destination}</strong>
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: { xs: 'center', sm: 'flex-start' },
              mt: 1,
            }}
          >
            <Rating value={ride.rating} precision={0.1} readOnly />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              {ride.rating} ({ride.reviews?.length || 0} reviews)
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Trip Details */}
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1">
              <strong>Departure Time:</strong> {new Date(ride.departureTime).toLocaleString()}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1">
              <strong>Arrival Time:</strong> {new Date(ride.arrivalTime).toLocaleString()}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1">
              <strong>Distance:</strong> {ride.distance} km
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1">
              <strong>Seats Available:</strong> {ride.availableSeats}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="h6" color="#3f51b5">
              Price: ₹{ride.price} per seat
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Estimated Travel Time and Co-Passengers */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Estimated Travel Time
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mt: 2,
              }}
            >
              {estimatedTime ? (
                <Typography variant="h4" sx={{ color: '#3f51b5', fontWeight: 'bold' }}>
                  {estimatedTime}
                </Typography>
              ) : (
                <Typography variant="body1" color="error">
                  Not Available
                </Typography>
              )}
            </Box>

            {/* Conditional Rendering for Driver Controls */}
            {ride.driverId === currentUserId && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Manage Bookings
                </Typography>
                {bookingsLoading ? (
                  <CircularProgress />
                ) : bookingsError ? (
                  <Alert severity="error">{bookingsError}</Alert>
                ) : bookings && bookings.length > 0 ? (
                  <List>
                    {bookings.map((booking) => (
                      <React.Fragment key={booking._id}>
                        <ListItem alignItems="flex-start">
                          <ListItemAvatar>
                            <Avatar alt={booking.user.name} src={booking.user.profilePicture || ''} />
                          </ListItemAvatar>
                          <ListItemText
                            primary={booking.user.name}
                            secondary={
                              <>
                                <Typography component="span" variant="body2" color="text.primary">
                                  {booking.user.email}
                                </Typography>
                                {' — '}
                                Seats: {booking.seats} | Status: {booking.status}
                              </>
                            }
                          />
                          <Box>
                            {booking.status === 'pending' && (
                              <>
                                <Button
                                  variant="contained"
                                  color="success"
                                  size="small"
                                  sx={{ mr: 1 }}
                                  onClick={() => handleApprove(booking._id)}
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="outlined"
                                  color="error"
                                  size="small"
                                  onClick={() => handleReject(booking._id)}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            {booking.status === 'approved' && (
                              <Button
                                variant="outlined"
                                color="primary"
                                size="small"
                                onClick={() => handleChat(booking)}
                              >
                                Chat
                              </Button>
                            )}
                          </Box>
                        </ListItem>
                        <Divider component="li" />
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No bookings yet.
                  </Typography>
                )}

                {/* Display existing booking if user has already booked */}
                {hasBooked && existingBooking && (
                  <Box sx={{ mt: 4 }}>
                    <Alert severity="info">
                      You have already booked this ride for {existingBooking.seats} seat(s). Status: {existingBooking.status}.
                    </Alert>
                  </Box>
                )}
              </Box>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Typography variant="h6" gutterBottom>
              Trip Route
            </Typography>
            {/* Embed Google Map */}
            <Box sx={{ mt: 2, height: '300px' }}>
              <iframe
                title="Trip Route"
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src={`https://www.google.com/maps/embed/v1/directions?key=AIzaSyB1FL4hF8actfjd_5PgMAyxv9Zz2lN_Imw&origin=${encodeURIComponent(
                  ride.startLocation
                )}&destination=${encodeURIComponent(ride.destination)}&mode=driving`}
                allowFullScreen
              ></iframe>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Co-Passengers Section for Everyone */}
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Co-Passengers
        </Typography>
        {coPassengersLoading ? (
          <CircularProgress />
        ) : coPassengersError ? (
          <Alert severity="error">{coPassengersError}</Alert>
        ) : coPassengers && coPassengers.length > 0 ? (
          <List>
            {coPassengers.map((passenger) => (
              <React.Fragment key={passenger.email}> {/* Assuming email is unique */}
                <ListItem alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar alt={passenger.name} src={passenger.profilePicture || ''} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={passenger.name}
                    secondary={
                      <>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.primary"
                        >
                          {passenger.email}
                        </Typography>
                        {' — '}
                        Seats: {passenger.seats}
                      </>
                    }
                  />
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No co-passengers yet.
          </Typography>
        )}
      </Paper>

      {/* Driver Reviews */}
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Driver Reviews
        </Typography>
        {ride.reviews?.length > 0 ? (
          ride.reviews.map((review, index) => (
            <Box key={index} sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                {review.user}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {review.comment}
              </Typography>
            </Box>
          ))
        ) : (
          <Typography variant="body2" color="text.secondary">
            No reviews yet.
          </Typography>
        )}
      </Paper>

      {/* Book Ride Button */}
      <Box sx={{ textAlign: 'center' }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          sx={{ px: 5, py: 2, fontSize: '1.2rem', boxShadow: '0px 4px 20px rgba(63, 81, 181, 0.5)' }}
          onClick={handleBookingOpen}
          disabled={ride.availableSeats === 0 || hasBooked} // Disable if no seats or already booked
        >
          {hasBooked ? 'Already Booked' : 'Book Ride'}
        </Button>
      </Box>

      {/* Booking Confirmation Modal */}
      <Modal
        open={bookingOpen}
        onClose={handleBookingClose}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 500,
          },
        }}
      >
        <Fade in={bookingOpen}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: 300, sm: 400 },
              bgcolor: 'background.paper',
              borderRadius: 2,
              boxShadow: 24,
              p: 4,
              textAlign: 'center',
            }}
          >
            <Iconify icon="mdi:check-circle-outline" color="#4caf50" width={60} height={60} />
            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
              Confirm Booking
            </Typography>

            {/* Seat Selection */}
            <Box sx={{ mt: 2, mb: 2 }}>
              <TextField
                label="Number of Seats"
                type="number"
                value={bookingSeats}
                onChange={(e) => setBookingSeats(Number(e.target.value))}
                inputProps={{
                  min: 1,
                  max: ride ? ride.availableSeats : 1,
                }}
                fullWidth
                required
              />
              {bookingError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {bookingError}
                </Alert>
              )}
            </Box>

            {/* Total Price */}
            <Typography variant="body1" sx={{ mb: 2 }}>
              <strong>Total Price:</strong> ₹{ride.price * bookingSeats}
            </Typography>

            {/* Action Buttons */}
            <Button
              variant="contained"
              color="primary"
              onClick={handleConfirmBooking}
              sx={{ mr: 2 }}
            >
              Yes, Book
            </Button>
            <Button variant="outlined" color="secondary" onClick={handleBookingClose}>
              Cancel
            </Button>
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
}

export default TripDetailsPage;
