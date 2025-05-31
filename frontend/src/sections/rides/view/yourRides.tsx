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

interface Ride {
  _id: string;
  driverName: string;
  profilePicture: string;
  startLocation: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  availableSeats: number;
  seatsBooked?: number;
  status?: string;
  bookingId?: string;
  ride?: string;
  user?: {
    name: string;
    email: string;
    profilePicture: string;
    _id: string;
  };
  seats?: number;
}

export function YourRides() {
  const [postedRides, setPostedRides] = useState<Ride[]>([]);
const [bookedRides, setBookedRides] = useState<Ride[]>([]);
const [pendingBookingsAsDriver, setPendingBookingsAsDriver] = useState<Ride[]>([]);
const [pendingBookingsAsPassenger, setPendingBookingsAsPassenger] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [modalOpen, setModalOpen] = useState(false);
 const [currentBooking, setCurrentBooking] = useState<Ride | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | ''>('');

  const [filter, setFilter] = useState<'posted' | 'booked' | 'pending'>('posted');

  const handleFilterChange = (_event: React.MouseEvent<HTMLElement>, newFilter: string | null) => {
    if (newFilter !== null) setFilter(newFilter as typeof filter);
  };

  const fetchPostedRides = async () => {
    try {
      const response = await axios.get('/api/rides/your-posts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPostedRides(Array.isArray(response.data.rides) ? response.data.rides : []);
    } catch (error) {
      console.error('Error fetching posted rides:', error);
      setError('Failed to fetch your posted rides.');
      setPostedRides([]);
    }
  };

  const fetchBookedRides = async () => {
    try {
      const response = await axios.get('/api/rides/your-bookings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookedRides(Array.isArray(response.data.bookedRides) ? response.data.bookedRides : []);
    } catch (error) {
      console.error('Error fetching booked rides:', error);
      setError('Failed to fetch your booked rides.');
      setBookedRides([]);
    }
  };

  const fetchPendingBookingsAsDriver = async () => {
    try {
      const response = await axios.get('/api/rides/your-posts', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const posted = Array.isArray(response.data.rides) ? response.data.rides : [];
      const bookingPromises = posted.map((ride: Ride) =>
        axios
          .get(`/api/rides/${ride._id}/bookings`, { headers: { Authorization: `Bearer ${token}` } })
          .then((res) => res.data.bookings)
          .catch(() => [])
      );

      const allBookings = (await Promise.all(bookingPromises)).flat();
      const pending = allBookings.filter((b: Ride) => b.status === 'pending');
      setPendingBookingsAsDriver(pending);
    } catch (error) {
      console.error('Error fetching pending bookings as driver:', error);
      setError('Failed to fetch pending bookings as driver.');
      setPendingBookingsAsDriver([]);
    }
  };

  const fetchPendingBookingsAsPassenger = async () => {
    try {
      const response = await axios.get('/api/rides/your-bookings', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const booked = Array.isArray(response.data.bookedRides) ? response.data.bookedRides : [];
      const pending = booked.filter((ride: Ride) => ride.status === 'pending');
      setPendingBookingsAsPassenger(pending);
    } catch (error) {
      console.error('Error fetching pending bookings as passenger:', error);
      setError('Failed to fetch pending bookings as passenger.');
      setPendingBookingsAsPassenger([]);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchPostedRides();
      await fetchBookedRides();
      await fetchPendingBookingsAsDriver();
      await fetchPendingBookingsAsPassenger();
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleViewDetails = (ride: Ride) => navigate(`/rides/${ride._id}`);

  const handleChat = async (booking: Ride) => {
    if (!token || !booking.user?._id) {
      alert('Authentication error. Please try again.');
      return;
    }

    try {
      const response = await axios.post(
        `/api/chat/conversations/${booking.user._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      navigate(`/chat/${response.data.conversation._id}`);
    } catch (error) {
      console.error('Error initiating chat:', error);
      alert('Failed to initiate chat. Please try again.');
    }
  };

  const handleOpenModal = (booking: Ride, type: 'approve' | 'reject') => {
    setCurrentBooking(booking);
    setActionType(type);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setCurrentBooking(null);
    setActionType('');
    setModalOpen(false);
  };

  const handleConfirmAction = async () => {
    if (!currentBooking || !actionType) return;
    const rideId = currentBooking.ride!;
    const bookingId = currentBooking._id;

    try {
      await axios.post(
        `/api/rides/${rideId}/bookings/${bookingId}/${actionType}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPendingBookingsAsDriver((prev) =>
        prev.filter((booking) => booking._id !== bookingId)
      );

      alert(`Booking ${actionType}d successfully!`);
      handleCloseModal();
    } catch (error) {
      console.error(`Error performing ${actionType} on booking:`, error);
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
  alt={booking.user?.name || 'User'}
  src={booking.user?.profilePicture || ''}
  sx={{
    width: 60,
    height: 60,
    mr: 2,
    border: '2px solid #3f51b5',
  }}
/>

                  {/* Booking Details */}
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6">{booking.user?.name || 'Unknown User'}</Typography>

                    <Typography variant="body2" color="text.secondary">
                      Email: {booking.user?.email || 'N/A'}
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
                  <strong>Passenger:</strong> {currentBooking.user?.name || 'Unknown'}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Email:</strong> {currentBooking.user?.email || 'N/A'}
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
