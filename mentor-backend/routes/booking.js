const express = require("express");
const router = express.Router();
const { 
  createBooking, 
  getBookings, 
  getAllBookings,
  getBookingById,
  updateBooking,
  updateBookingStatus,
  deleteBooking,
  getBookingsByMentor,
  getBookingsByDateRange
} = require("../controllers/bookingController");

// Create booking
router.post("/", createBooking);

// Get all bookings (admin/debug)
router.get("/", getAllBookings);

// Get bookings by date range
router.get("/date-range", getBookingsByDateRange);

// Get bookings by mentor
router.get("/mentor/:mentorName", getBookingsByMentor);

// Get single booking by ID
router.get("/booking/:id", getBookingById);

// Update booking
router.put("/booking/:id", updateBooking);

// Update booking status only
router.patch("/booking/:id/status", updateBookingStatus);

// Delete booking
router.delete("/booking/:id", deleteBooking);

// Get bookings for a user (keep this last to avoid conflicts)
router.get("/user/:userId", getBookings);

module.exports = router;
