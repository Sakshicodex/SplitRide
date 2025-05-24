// frontend/src/pages/YourRides.jsx

import React, { useState, useEffect } from 'react';
import Grid from '@mui/material/Unstable_Grid2'; // Importing Grid from MUI
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Modal from '@mui/material/Modal';
import Fade from '@mui/material/Fade';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'src/context/AuthContext'; // Ensure AuthContext is properly set up

// Import MUI ToggleButton components
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

// **2. Import Iconify Components and Icons**
import { Backdrop, IconButton } from '@mui/material';
import { Icon } from '@iconify/react';
import chatBubbleOutline from '@iconify/icons-mdi/chat-bubble-outline'; // Chat icon

export function YourRides() {
  // State variables for rides
  const [postedRides, setPostedRides] = useState([]);
  const [bookedRides, setBookedRides] = useState([]);
  const [pendingBookingsAsDriver, setPendingBookingsAsDriver] = useState([]);
  const [pendingBookingsAsPassenger, setPendingBookingsAsPassenger] = useState([]);

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { user, token } = useAuth(); // Destructure user and token from AuthContext

  // Modal state for approving/rejecting bookings
  const [modalOpen, setModalOpen] = useState(false);
  const [currentBooking, setCurrentBooking] = useState(null);
  const [actionType, setActionType] = useState(''); // 'approve' or 'reject'

  // **1. Filter State**
  const [filter, setFilter] = useState('posted'); // Default filter

  /**
   * **2. Handle Filter Change**
   */
  const handleFilterChange = (event, newFilter) => {
    if (newFilter !== null) {
      setFilter(newFilter);
    }
  };

  /**
   * Fetch posted rides by the user.
   */
  const fetchPostedRides = async () => {
    try {
      const response = await axios.get('/api/rides/your-posts', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const rides = Array.isArray(response.data.rides) ? response.data.rides : [];
      setPostedRides(rides);
    } catch (error) {
      console.error('Error fetching posted rides:', error.response || error);
      setError('Failed to fetch your posted rides.');
      setPostedRides([]);
    }
  };

  /**
   * Fetch booked rides by the user.
   */
  const fetchBookedRides = async () => {
    try {
      const response = await axios.get('/api/rides/your-bookings', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const booked = Array.isArray(response.data.bookedRides)
        ? response.data.bookedRides
        : [];
      setBookedRides(booked);
    } catch (error) {
      console.error('Error fetching booked rides:', error.response || error);
      setError('Failed to fetch your booked rides.');
      setBookedRides([]);
    }
  };

  /**
   * Fetch pending bookings where the user is the driver.
   */
  const fetchPendingBookingsAsDriver = async () => {
    try {
      // Fetch user's posted rides
      const response = await axios.get('/api/rides/your-posts', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const postedRides = Array.isArray(response.data.rides)
        ? response.data.rides
        : [];

      if (postedRides.length === 0) {
        // If no rides are posted, set pending bookings as empty
        setPendingBookingsAsDriver([]);
        return;
      }

      // Fetch bookings for each posted ride
      const bookingPromises = postedRides.map((ride) =>
        axios
          .get(`/api/rides/${ride._id}/bookings`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          .then((res) => res.data.bookings)
          .catch((err) => {
            console.error(
              `Error fetching bookings for ride ${ride._id}:`,
              err.response || err
            );
            return []; // Return empty array on error to prevent Promise.all from failing
          })
      );

      // Wait for all booking fetches to complete
      const bookingsArrays = await Promise.all(bookingPromises);

      // Flatten the array of arrays into a single array of bookings
      const allBookings = bookingsArrays.flat();

      // Filter bookings with status 'pending'
      const pendingBookings = allBookings.filter(
        (booking) => booking.status === 'pending'
      );

      setPendingBookingsAsDriver(pendingBookings);
    } catch (error) {
      console.error(
        'Error fetching pending bookings as driver:',
        error.response || error
      );
      setError('Failed to fetch pending bookings as driver.');
      setPendingBookingsAsDriver([]);
    }
  };

  /**
   * Fetch pending bookings where the user is the passenger.
   */
  const fetchPendingBookingsAsPassenger = async () => {
    try {
      const response = await axios.get('/api/rides/your-bookings', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const bookedRides = Array.isArray(response.data.bookedRides)
        ? response.data.bookedRides
        : [];

      // Filter bookings with status 'pending'
      const pendingBookings = bookedRides.filter(
        (ride) => ride.status === 'pending'
      );

      setPendingBookingsAsPassenger(pendingBookings);
    } catch (error) {
      console.error(
        'Error fetching pending bookings as passenger:',
        error.response || error
      );
      setError('Failed to fetch pending bookings as passenger.');
      setPendingBookingsAsPassenger([]);
    }
  };

  /**
   * useEffect hook to fetch all necessary data on component mount.
   */
  useEffect(() => {
    const fetchData = async () => {
      await fetchPostedRides();
      await fetchBookedRides();
      await fetchPendingBookingsAsDriver();
      await fetchPendingBookingsAsPassenger();
      setLoading(false);
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Navigate to ride details page.
   * @param {Object} ride - The ride object.
   */
  const handleViewDetails = (ride) => {
    navigate(`/rides/${ride._id}`); // Adjust the path as needed
  };

  /**
   * Navigate to chat page with the driver.
   * @param {Object} booking - The booking object.
   */
  const handleChat = async (booking) => {
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
    } catch (error) {
      console.error('Error initiating chat:', error.response || error);
      alert('Failed to initiate chat. Please try again.');
    }
  };

  /**
   * Open modal for approving or rejecting a booking.
   * @param {Object} booking - The booking object.
   * @param {string} type - The action type ('approve' or 'reject').
   */
  const handleOpenModal = (booking, type) => {
    setCurrentBooking(booking);
    setActionType(type); // 'approve' or 'reject'
    setModalOpen(true);
  };

  /**
   * Close the modal.
   */
  const handleCloseModal = () => {
    setCurrentBooking(null);
    setActionType('');
    setModalOpen(false);
  };

  /**
   * Confirm the action (approve/reject) on a booking.
   */
  const handleConfirmAction = async () => {
    if (!currentBooking || !actionType) return;

    const rideId = currentBooking.ride;
    const bookingId = currentBooking._id;

    try {
      if (actionType === 'approve') {
        await axios.post(
          `/api/rides/${rideId}/bookings/${bookingId}/approve`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        // Remove the approved booking from pending bookings as driver
        setPendingBookingsAsDriver((prev) =>
          prev.filter((booking) => booking._id !== bookingId)
        );
        alert('Booking approved successfully!');
      } else if (actionType === 'reject') {
        await axios.post(
          `/api/rides/${rideId}/bookings/${bookingId}/reject`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        // Remove the rejected booking from pending bookings as driver
        setPendingBookingsAsDriver((prev) =>
          prev.filter((booking) => booking._id !== bookingId)
        );
        alert('Booking rejected successfully!');
      }

      handleCloseModal();
    } catch (error) {
      console.error(`Error performing ${actionType} on booking:`, error.response || error);
      alert(`Failed to ${actionType} the booking.`);
    }
  };

  // **3. Conditional Rendering**
  const renderContent = () => {
    switch (filter) {
      case 'posted':
        return renderPostedRides();
      case 'booked':
        return renderBookedRides();
      case 'pending':
        return renderPendingRequests();
      default:
        return null;
    }
  };

  /**
   * Render Posted Rides Section
   */
  const renderPostedRides = () => (
    <Box
      sx={{
        backgroundColor: '#ffffff',
        borderRadius: 2,
        boxShadow: 3,
        p: 3,
        height: '100%',
      }}
    >
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold', textAlign: 'center' }}>
        Posted Rides
      </Typography>
      {postedRides.length > 0 ? (
        <Grid container spacing={2}>
          {postedRides.map((ride) => (
            <Grid xs={12} key={ride._id}>
              <Card
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  p: 2,
                  mb: 2,
                  borderRadius: 2,
                  boxShadow: '0px 2px 10px rgba(0,0,0,0.1)',
                  backgroundColor: '#fafafa',
                }}
              >
                {/* Driver Avatar */}
                <Avatar
                  alt={ride.driverName}
                  src={ride.profilePicture}
                  sx={{
                    width: 60,
                    height: 60,
                    mr: 2,
                    border: '2px solid #3f51b5',
                  }}
                />

                {/* Ride Details */}
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6">{ride.driverName}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    From: {ride.startLocation} <br />
                    To: {ride.destination}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Departure: {new Date(ride.departureTime).toLocaleString()} <br />
                    Arrival: {new Date(ride.arrivalTime).toLocaleString()}
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1, color: '#3f51b5', fontWeight: 'bold' }}>
                    ₹{ride.price} per seat
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Seats Available: {ride.availableSeats}
                  </Typography>
                </Box>

                {/* Actions */}
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  onClick={() => handleViewDetails(ride)}
                  sx={{
                    borderColor: '#3f51b5',
                    color: '#3f51b5',
                    '&:hover': {
                      backgroundColor: '#3f51b5',
                      color: '#fff',
                      borderColor: '#3f51b5',
                    },
                  }}
                >
                  View Details
                </Button>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography variant="body1" color="text.secondary" align="center">
          You have not posted any rides yet.
        </Typography>
      )}
    </Box>
  );

  /**
   * Render Booked Rides Section
   */
  const renderBookedRides = () => (
    <Box
      sx={{
        backgroundColor: '#ffffff',
        borderRadius: 2,
        boxShadow: 3,
        p: 3,
        height: '100%',
      }}
    >
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold', textAlign: 'center' }}>
        Booked Rides
      </Typography>
      {bookedRides.length > 0 ? (
        <Grid container spacing={2}>
          {bookedRides.map((ride) => (
            <Grid xs={12} key={ride._id}>
              <Card
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  p: 2,
                  mb: 2,
                  borderRadius: 2,
                  boxShadow: '0px 2px 10px rgba(0,0,0,0.1)',
                  backgroundColor: '#fafafa',
                }}
              >
                {/* Driver Avatar */}
                <Avatar
                  alt={ride.driverName}
                  src={ride.profilePicture}
                  sx={{
                    width: 60,
                    height: 60,
                    mr: 2,
                    border: '2px solid #3f51b5',
                  }}
                />

                {/* Ride Details */}
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6">{ride.driverName}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    From: {ride.startLocation} <br />
                    To: {ride.destination}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Departure: {new Date(ride.departureTime).toLocaleString()} <br />
                    Arrival: {new Date(ride.arrivalTime).toLocaleString()}
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1, color: '#3f51b5', fontWeight: 'bold' }}>
                    ₹{ride.price} per seat
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Seats Booked: {ride.seatsBooked}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Status: {ride.status}
                  </Typography>
                </Box>

                {/* Actions */}
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    onClick={() => handleViewDetails(ride)}
                    sx={{
                      borderColor: '#3f51b5',
                      color: '#3f51b5',
                      '&:hover': {
                        backgroundColor: '#3f51b5',
                        color: '#fff',
                        borderColor: '#3f51b5',
                      },
                      mr: 1,
                    }}
                  >
                    View Details
                  </Button>

                  {/* **3. Add Chat Button with Iconify Icon** */}
                  <IconButton
                    color="primary"
                    size="small"
                    onClick={() => handleChat(ride)}
                    aria-label="chat with driver"
                  >
                    <Icon icon={chatBubbleOutline} width={24} height={24} />
                  </IconButton>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography variant="body1" color="text.secondary" align="center">
          You have not booked any rides yet.
        </Typography>
      )}
    </Box>
  );

  /**
   * Render Pending Requests Section
   */
  const renderPendingRequests = () => (
    <Box
      sx={{
        backgroundColor: '#ffffff',
        borderRadius: 2,
        boxShadow: 3,
        p: 3,
        height: '100%',
        overflowY: 'auto',
      }}
    >
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold', textAlign: 'center' }}>
        Pending Requests
      </Typography>

      {/* Pending Bookings as Driver */}
      {pendingBookingsAsDriver.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            Bookings Awaiting Your Approval
          </Typography>
          <Grid container spacing={2}>
            {pendingBookingsAsDriver.map((booking) => (
              <Grid xs={12} key={booking._id}>
                <Card
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 2,
                    mb: 2,
                    borderRadius: 2,
                    boxShadow: '0px 2px 10px rgba(0,0,0,0.1)',
                    backgroundColor: '#fdfdfd',
                  }}
                >
                  {/* Passenger Avatar */}
                  <Avatar
                    alt={booking.user.name}
                    src={booking.user.profilePicture}
                    sx={{
                      width: 60,
                      height: 60,
                      mr: 2,
                      border: '2px solid #3f51b5',
                    }}
                  />

                  {/* Booking Details */}
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6">{booking.user.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Email: {booking.user.email}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Seats Requested: {booking.seats}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Status: {booking.status}
                    </Typography>
                  </Box>

                  {/* Actions */}
                  <Box>
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      sx={{ mr: 1 }}
                      onClick={() => handleOpenModal(booking, 'approve')}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => handleOpenModal(booking, 'reject')}
                    >
                      Reject
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Pending Bookings as Passenger */}
      {pendingBookingsAsPassenger.length > 0 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            Your Pending Bookings
          </Typography>
          <Grid container spacing={2}>
            {pendingBookingsAsPassenger.map((ride) => (
              <Grid xs={12} key={ride.bookingId}>
                <Card
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 2,
                    mb: 2,
                    borderRadius: 2,
                    boxShadow: '0px 2px 10px rgba(0,0,0,0.1)',
                    backgroundColor: '#fdfdfd',
                  }}
                >
                  {/* Driver Avatar */}
                  <Avatar
                    alt={ride.driverName}
                    src={ride.profilePicture}
                    sx={{
                      width: 60,
                      height: 60,
                      mr: 2,
                      border: '2px solid #3f51b5',
                    }}
                  />

                  {/* Ride and Booking Details */}
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6">{ride.driverName}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      From: {ride.startLocation} <br />
                      To: {ride.destination}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Departure: {new Date(ride.departureTime).toLocaleString()} <br />
                      Arrival: {new Date(ride.arrivalTime).toLocaleString()}
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1, color: '#3f51b5', fontWeight: 'bold' }}>
                      ₹{ride.price} per seat
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Seats Booked: {ride.seatsBooked}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Status: {ride.status}
                    </Typography>
                  </Box>

                  {/* Action */}
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    onClick={() => handleViewDetails(ride)}
                    sx={{
                      borderColor: '#3f51b5',
                      color: '#3f51b5',
                      '&:hover': {
                        backgroundColor: '#3f51b5',
                        color: '#fff',
                        borderColor: '#3f51b5',
                      },
                    }}
                  >
                    View Details
                  </Button>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Message when there are no pending requests */}
      {pendingBookingsAsDriver.length === 0 && pendingBookingsAsPassenger.length === 0 && (
        <Typography variant="body1" color="text.secondary" align="center">
          You have no pending requests.
        </Typography>
      )}
    </Box>
  );

  /**
   * **4. Integrate ToggleButtonGroup**
   */
  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header Section */}
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', textAlign: 'center' }}>
        Your Rides
      </Typography>

      {/* Error Alert */}
      {error && (
        <Box sx={{ mb: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}

      {/* **ToggleButtonGroup for Filtering** */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <ToggleButtonGroup
          value={filter}
          exclusive
          onChange={handleFilterChange}
          aria-label="Ride Filter"
          color="primary"
        >
          <ToggleButton value="posted" aria-label="Posted Rides">
            Posted Rides
          </ToggleButton>
          <ToggleButton value="booked" aria-label="Booked Rides">
            Booked Rides
          </ToggleButton>
          <ToggleButton value="pending" aria-label="Pending Requests">
            Pending Requests
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* **Render Content Based on Filter** */}
      {renderContent()}

      {/* Approval/Rejection Modal */}
      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 500,
          },
        }}
      >
        <Fade in={modalOpen}>
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
            <Typography variant="h6" sx={{ mb: 2 }}>
              {actionType === 'approve' ? 'Approve Booking' : 'Reject Booking'}
            </Typography>
            {currentBooking && (
              <>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Passenger:</strong> {currentBooking.user.name}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Email:</strong> {currentBooking.user.email}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Seats Requested:</strong> {currentBooking.seats}
                </Typography>
                <Box sx={{ mt: 3 }}>
                  <Button
                    variant="contained"
                    color={actionType === 'approve' ? 'success' : 'error'}
                    onClick={handleConfirmAction}
                    sx={{ mr: 2 }}
                  >
                    {actionType === 'approve' ? 'Approve' : 'Reject'}
                  </Button>
                  <Button variant="outlined" color="secondary" onClick={handleCloseModal}>
                    Cancel
                  </Button>
                </Box>
              </>
            )}
          </Box>
        </Fade>
      </Modal>
    </Box>
  );

  /**
   * **Render Loading Spinner while fetching data**
   */
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
}

export default YourRides;
