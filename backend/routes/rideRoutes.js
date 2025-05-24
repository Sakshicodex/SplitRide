// routes/rides.js

const express = require('express');
const router = express.Router();
const Ride = require('../modals/rideModal'); // Corrected path
const Booking = require('../modals/bookingModal'); // Import Booking model
const protect = require('../middleware/authMiddleware');
const sendEmail = require('../utils/sendEmail');
const Conversation = require('../modals/conversationModel');
const User = require('../modals/userModal');

// ============================
// Rides Routes
// ============================

/**
 * POST /api/rides
 * Create a new ride
 */
router.post('/', protect, async (req, res) => {
  try {
    const {
      driverName,
      profilePicture,
      startLocation,
      destination,
      departureTime,
      arrivalTime,
      price,
      availableSeats,
    } = req.body;

    const driverEmail = req.user.email;

    // Validate required fields
    if (
      !driverName ||
      !startLocation ||
      !destination ||
      !departureTime ||
      !arrivalTime ||
      !price ||
      !availableSeats
    ) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const newRide = new Ride({
      driverId: req.user.id,
      driverName,
      driverEmail,
      profilePicture,
      startLocation,
      destination,
      departureTime: new Date(departureTime),
      arrivalTime: new Date(arrivalTime),
      price: parseFloat(price),
      availableSeats: parseInt(availableSeats, 10),
      reviews: [],
      rating: 0,
    });

    await newRide.save();
    res.status(201).json({ message: 'Ride posted successfully!', ride: newRide });
  } catch (error) {
    console.error('Error posting ride:', error.message);
    res.status(500).json({ message: 'Failed to post the ride.', error: error.message });
  }
});

/**
 * GET /api/rides/your-posts
 * Retrieve rides posted by the authenticated user
 */
router.get('/your-posts', protect, async (req, res) => {
  try {
    const rides = await Ride.find({ driverId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ rides });
  } catch (error) {
    console.error('Error fetching your posted rides:', error.message);
    res.status(500).json({ message: 'Failed to fetch your posted rides.', error: error.message });
  }
});

/**
 * GET /api/rides/your-bookings
 * Retrieve rides booked by the authenticated user
 */
router.get('/your-bookings', protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('ride') // Populate ride details
      .sort({ bookedAt: -1 });

    // Extract ride details from bookings
    const bookedRides = bookings.map((booking) => ({
      ...booking.ride._doc, // Spread ride details
      bookingId: booking._id, // Include booking ID if needed
      seatsBooked: booking.seats, // Number of seats booked
      status: booking.status, // Include status
      bookedAt: booking.bookedAt,
    }));

    res.status(200).json({ bookedRides });
  } catch (error) {
    console.error('Error fetching your booked rides:', error.message);
    res.status(500).json({ message: 'Failed to fetch your booked rides.', error: error.message });
  }
});

/**
 * GET /api/rides
 * Retrieve all rides
 */
router.get('/', async (req, res) => {
  try {
    const rides = await Ride.find().sort({ createdAt: -1 }); // Sort by most recent
    res.status(200).json({ rides });
  } catch (error) {
    console.error('Error fetching rides:', error.message);
    res.status(500).json({ message: 'Failed to fetch rides.', error: error.message });
  }
});

/**
 * GET /api/rides/:id
 * Retrieve a specific ride by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found.' });
    }
    res.status(200).json({ ride });
  } catch (error) {
    console.error('Error fetching ride:', error.message);
    res.status(500).json({ message: 'Failed to fetch ride.', error: error.message });
  }
});

/**
 * POST /api/rides/:id/book
 * Book a ride
 */
router.post('/:id/book', protect, async (req, res) => {
  try {
    const { seats } = req.body;

    if (!seats || seats < 1) {
      return res.status(400).json({ message: 'Number of seats must be at least 1.' });
    }

    const ride = await Ride.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found.' });
    }

    if (ride.availableSeats < seats) {
      return res.status(400).json({ message: 'Not enough available seats.' });
    }

    // Check if the user has already booked this ride
    const existingBooking = await Booking.findOne({
      ride: ride._id,
      user: req.user.id,
    });

    if (existingBooking) {
      return res.status(400).json({ message: 'You have already booked this ride.' });
    }

    const booking = new Booking({
      ride: ride._id,
      user: req.user.id,
      seats,
    });

    await booking.save();

    if (!ride.driverEmail) {
      console.error('Driver email not found for ride:', ride._id);
      return res.status(500).json({ message: 'Driver email not available.' });
    }

    // Notify the driver about the new booking
    await sendEmail(
      ride.driverEmail,
      'New Ride Booking Request',
      `Hello ${ride.driverName},\n\nA user has requested to book ${seats} seat(s) for your ride from ${ride.startLocation} to ${ride.destination}.\n\nPlease approve or reject the booking from your dashboard.\n\nThank you!`
    );

    // Notify the user about the pending approval
    await sendEmail(
      req.user.email,
      'Booking Pending Approval',
      `Hello ${req.user.name},\n\nYour booking for ${seats} seat(s) on the ride from ${ride.startLocation} to ${ride.destination} is pending approval by the driver.\n\nYou will receive an email notification once the driver approves or rejects your booking.\n\nThank you for using our service!`
    );

    // Create a conversation between driver and passenger
    const passenger = await User.findById(req.user.id);
    const driver = await User.findById(ride.driverId);

    if (!passenger || !driver) {
      console.error('Passenger or Driver not found.');
      return res.status(500).json({ message: 'User information incomplete.' });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      'participants.user': { $all: [passenger._id, driver._id] },
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [
          {
            user: passenger._id,
            name: passenger.name,
            email: passenger.email,
            profilePicture: passenger.profilePicture,
          },
          {
            user: driver._id,
            name: driver.name,
            email: driver.email,
            profilePicture: driver.profilePicture,
          },
        ],
      });

      await conversation.save();
    }

    res.status(200).json({ message: 'Ride booked successfully! Awaiting approval.', booking, conversationId: conversation._id });
  } catch (error) {
    console.error('Error booking ride:', error.message);
    res.status(500).json({ message: 'Failed to book the ride.', error: error.message });
  }
});



/**
 * POST /api/rides/:rideId/bookings/:bookingId/approve
 * Approve a booking
 */
router.post('/:rideId/bookings/:bookingId/approve', protect, async (req, res) => {
  try {
    const { rideId, bookingId } = req.params;

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found.' });
    }

    if (ride.driverId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to approve bookings for this ride.' });
    }

    const booking = await Booking.findById(bookingId).populate('user', 'email name');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    if (booking.ride.toString() !== rideId || booking.status !== 'pending') {
      return res.status(400).json({ message: 'Invalid booking status.' });
    }

    if (ride.availableSeats < booking.seats) {
      return res.status(400).json({ message: 'Not enough available seats.' });
    }

    booking.status = 'approved';
    await booking.save();

    ride.availableSeats -= booking.seats;
    await ride.save();

    // Notify the user about approval
    await sendEmail(
      booking.user.email,
      'Booking Approved',
      `Hello ${booking.user.name},\n\nYour booking for the ride from ${ride.startLocation} to ${ride.destination} has been approved.\n\nEnjoy your trip!\n\nThank you!`
    );

    res.status(200).json({ message: 'Booking approved successfully.', booking });
  } catch (error) {
    console.error('Error approving booking:', error.message);
    res.status(500).json({ message: 'Failed to approve booking.', error: error.message });
  }
});


/**
 * POST /api/rides/:rideId/bookings/:bookingId/reject
 * Reject a booking
 */
/**
 * POST /api/rides/:rideId/bookings/:bookingId/reject
 * Reject a booking
 */
router.post('/:rideId/bookings/:bookingId/reject', protect, async (req, res) => {
  try {
    const { rideId, bookingId } = req.params;

    // Fetch the ride
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found.' });
    }

    // Check if the requester is the driver
    if (ride.driverId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to reject bookings for this ride.' });
    }

    // Fetch the booking
    const booking = await Booking.findById(bookingId).populate('user', 'email name');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    // Check if the booking is associated with the ride
    if (booking.ride.toString() !== rideId) {
      return res.status(400).json({ message: 'Booking does not belong to this ride.' });
    }

    // Check if booking is already approved or rejected
    if (booking.status !== 'pending') {
      return res.status(400).json({ message: `Booking is already ${booking.status}.` });
    }

    // Update the booking status to 'rejected'
    booking.status = 'rejected';
    await booking.save();

    // Notify the user about rejection
    await sendEmail(
      booking.user.email,
      'Booking Rejected',
      `Hello ${booking.user.name},\n\nYour booking for the ride from ${ride.startLocation} to ${ride.destination} has been rejected.\n\nPlease consider other available rides or contact the driver for more details.\n\nThank you!`
    );

    res.status(200).json({ message: 'Booking rejected successfully.', booking });
  } catch (error) {
    console.error('Error rejecting booking:', error.message);
    res.status(500).json({ message: 'Failed to reject booking.', error: error.message });
  }
});


/**
 * GET /api/rides/:id/copassengers
 * Retrieve approved bookings (co-passengers) for a ride
 */
router.get('/:id/copassengers', async (req, res) => {
  try {
    const rideId = req.params.id;

    // Fetch bookings with status 'approved' for the specified ride
    const bookings = await Booking.find({ ride: rideId, status: 'approved' })
      .populate('user', 'name email profilePicture') // Populate only necessary user fields
      .sort({ bookedAt: -1 });

    if (bookings.length === 0) {
      return res.status(200).json({ coPassengers: [], message: 'No co-passengers yet.' });
    }

    // Map bookings to extract co-passenger details
    const coPassengers = bookings.map((booking) => ({
      name: booking.user.name,
      email: booking.user.email,
      profilePicture: booking.user.profilePicture || '', // Provide a default if needed
      seats: booking.seats,
      bookedAt: booking.bookedAt,
    }));

    res.status(200).json({ coPassengers });
  } catch (error) {
    console.error('Error fetching co-passengers:', error.message);
    res.status(500).json({ message: 'Failed to fetch co-passengers.', error: error.message });
  }
});


/**
 * GET /api/rides/:rideId/bookings
 * Retrieve all bookings for a ride (for driver) or approved bookings plus user's booking (for passenger)
 */
router.get('/:rideId/bookings', protect, async (req, res) => {
  try {
    const { rideId } = req.params;

    // Fetch the ride
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found.' });
    }

    // Check if the requester is the driver
    if (ride.driverId.toString() === req.user.id) {
      // User is the driver; fetch all bookings
      const bookings = await Booking.find({ ride: rideId })
        .populate('user', 'name email profilePicture') // Populate user details
        .sort({ bookedAt: -1 });

      return res.status(200).json({ bookings });
    } else {
      // User is a passenger; check if they have a booking for this ride
      const userBooking = await Booking.findOne({
        ride: rideId,
        user: req.user.id,
      }).populate('user', 'name email profilePicture');

      if (!userBooking) {
        return res.status(403).json({ message: 'Not authorized to view bookings for this ride.' });
      }

      // Fetch approved bookings as co-passengers, excluding the user's own booking
      const approvedBookings = await Booking.find({
        ride: rideId,
        status: 'approved',
      })
        .populate('user', 'name email profilePicture')
        .sort({ bookedAt: -1 });

      // Exclude the user's own booking from approvedBookings
      const coPassengers = approvedBookings.filter(
        (booking) => booking.user.email !== userBooking.user.email
      );

      // Combine user's booking and co-passengers
      return res.status(200).json({ bookings: [userBooking, ...coPassengers] });
    }
  } catch (error) {
    console.error('Error fetching bookings for ride:', error.message);
    res.status(500).json({ message: 'Failed to fetch bookings for the ride.', error: error.message });
  }
});

module.exports = router;
