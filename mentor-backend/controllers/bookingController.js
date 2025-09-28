const Booking = require("../models/Booking");

exports.createBooking = async (req, res) => {
  try {
    const { userId, mentorName, sessionType, duration, date, time, notes, cost } = req.body;

    if (!userId || !mentorName || !sessionType || !duration || !date || !time) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const booking = new Booking({
      user: userId,
      mentorName,
      sessionType,
      duration,
      date: new Date(date),
      time,
      notes: notes || "",
      cost: cost || 0,
    });

    await booking.save();
    res.status(201).json({ 
      message: "Booking created successfully", 
      booking: {
        id: booking._id,
        mentorName: booking.mentorName,
        sessionType: booking.sessionType,
        duration: booking.duration,
        date: booking.date,
        time: booking.time,
        cost: booking.cost,
        status: booking.status
      }
    });
  } catch (err) {
    console.error("Booking error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.params.userId }).sort({ date: 1 });
    res.json(bookings);
  } catch (err) {
    console.error("Get bookings error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all bookings (admin/debug)
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().populate('user', 'name email').sort({ date: 1 });
    res.json(bookings);
  } catch (err) {
    console.error("Get all bookings error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get single booking by ID
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('user', 'name email');
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    res.json(booking);
  } catch (err) {
    console.error("Get booking error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update booking
exports.updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates._id;
    delete updates.createdAt;
    delete updates.updatedAt;

    // Convert date to Date object if provided
    if (updates.date) {
      updates.date = new Date(updates.date);
    }

    const booking = await Booking.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json({ 
      message: "Booking updated successfully", 
      booking 
    });
  } catch (err) {
    console.error("Update booking error:", err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: "Validation error", details: err.message });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// Update booking status
exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["pending", "confirmed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status. Must be: pending, confirmed, or cancelled" });
    }

    const booking = await Booking.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json({ 
      message: "Booking status updated successfully", 
      booking 
    });
  } catch (err) {
    console.error("Update booking status error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete booking
exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    
    const booking = await Booking.findByIdAndDelete(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json({ message: "Booking deleted successfully" });
  } catch (err) {
    console.error("Delete booking error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get bookings by mentor
exports.getBookingsByMentor = async (req, res) => {
  try {
    const { mentorName } = req.params;
    const bookings = await Booking.find({ mentorName }).populate('user', 'name email').sort({ date: 1 });
    res.json(bookings);
  } catch (err) {
    console.error("Get mentor bookings error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get bookings by date range
exports.getBookingsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Start date and end date are required" });
    }

    const bookings = await Booking.find({
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).populate('user', 'name email').sort({ date: 1 });

    res.json(bookings);
  } catch (err) {
    console.error("Get bookings by date range error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
