const Booking = require("../models/Booking");
const User = require("../models/User");

exports.createBooking = async (req, res) => {
  try {
    const { userId, mentorId, mentorName, sessionType, duration, date, time, notes, cost, topics } = req.body;

    console.log('createBooking - Received data:', { userId, mentorId, mentorName, sessionType, duration, date, time, notes, cost, topics });

    if (!userId || !mentorId || !mentorName || !sessionType || !duration || !date || !time) {
      console.log('createBooking - Missing required fields');
      return res.status(400).json({ message: "Missing required fields" });
    }

    const booking = new Booking({
      user: userId,
      mentor: mentorId,
      mentorName,
      sessionType,
      duration,
      date: new Date(date),
      time,
      startTime: time,
      notes: notes || "",
      cost: cost || 0,
      topics: topics || [],
    });

    await booking.save();
    console.log('createBooking - Booking saved successfully:', booking);
    
    // Emit socket event to notify mentor of new session request
    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');
    if (io && onlineUsers) {
      // Get mentor's email from User model
      const mentorUser = await User.findById(mentorId);
      if (mentorUser && mentorUser.email) {
        const mentorSocketId = onlineUsers.get(mentorUser.email);
        
        console.log('📢 Emitting new-session-request event to mentor:', mentorUser.email);
        
        if (mentorSocketId) {
          io.to(mentorSocketId).emit('new-session-request', {
            bookingId: booking._id,
            mentorId: booking.mentor,
            mentorName: booking.mentorName,
            sessionType: booking.sessionType,
            duration: booking.duration,
            date: booking.date,
            time: booking.time,
            status: booking.status
          });
        }
      }
    }
    
    res.status(201).json({ 
      message: "Booking created successfully", 
      booking: {
        id: booking._id,
        mentorId: booking.mentor,
        mentorName: booking.mentorName,
        sessionType: booking.sessionType,
        duration: booking.duration,
        date: booking.date,
        time: booking.time,
        startTime: booking.startTime,
        cost: booking.cost,
        status: booking.status,
        topics: booking.topics
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

    if (!status || !["pending", "confirmed", "cancelled", "completed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status. Must be: pending, confirmed, cancelled, or completed" });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const oldStatus = booking.status;
    booking.status = status;
    await booking.save();

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');
    if (io && onlineUsers) {
      // Populate user info to get email
      const populatedBooking = await Booking.findById(id).populate('user', 'email name');
      if (populatedBooking && populatedBooking.user) {
        const menteeEmail = populatedBooking.user.email;
        const menteeSocketId = onlineUsers.get(menteeEmail);
        
        console.log('📢 Emitting booking-status-updated event to mentee:', menteeEmail);
        
        if (menteeSocketId) {
          io.to(menteeSocketId).emit('booking-status-updated', {
            bookingId: id,
            status: status,
            mentorName: booking.mentorName,
            action: status === 'confirmed' ? 'accepted' : status === 'cancelled' ? 'declined' : 'updated'
          });
        }
      }
    }

    // Update user statistics when session is completed
    if (status === "completed" && oldStatus !== "completed") {
      try {
        // Parse duration (e.g., "30 minutes" or "1 hour")
        let hours = 0;
        const durationStr = booking.duration.toLowerCase();
        if (durationStr.includes("hour")) {
          const hourMatch = durationStr.match(/(\d+)/);
          hours = hourMatch ? parseFloat(hourMatch[1]) : 1;
        } else if (durationStr.includes("min")) {
          const minMatch = durationStr.match(/(\d+)/);
          hours = minMatch ? parseFloat(minMatch[1]) / 60 : 0.5;
        }

        // Update mentee (student) stats
        await User.findByIdAndUpdate(booking.user, {
          $inc: { 
            "mentee.completedSessions": 1,
            "mentee.hoursLearned": hours,
            "mentee.activeMentors": 0 // Will be calculated separately if needed
          }
        });

        // Update mentor stats
        await User.findByIdAndUpdate(booking.mentor, {
          $inc: { 
            "mentor.totalSessions": 1,
            "mentor.activeStudents": 0 // Will be calculated separately if needed
          }
        });

        console.log(`✅ Updated stats for completed session: ${hours} hours added`);
      } catch (statsError) {
        console.error("Error updating user stats:", statsError);
        // Don't fail the status update if stats update fails
      }
    }

    const updatedBooking = await Booking.findById(id).populate('user', 'name email');

    res.json({ 
      message: "Booking status updated successfully", 
      booking: updatedBooking 
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

// Get bookings by mentor ID
exports.getBookingsByMentorId = async (req, res) => {
  try {
    const { mentorId } = req.params;
    console.log('getBookingsByMentorId - Received mentorId:', mentorId);
    
    const bookings = await Booking.find({ mentor: mentorId })
      .populate('user', 'name email phone')
      .sort({ date: 1, time: 1 });
    
    console.log('getBookingsByMentorId - Found bookings count:', bookings.length);
    console.log('getBookingsByMentorId - Bookings:', JSON.stringify(bookings, null, 2));
    
    res.json(bookings);
  } catch (err) {
    console.error("Get mentor bookings by ID error:", err);
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

// Rate a completed session
exports.rateSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, review, userId } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== "completed") {
      return res.status(400).json({ message: "Can only rate completed sessions" });
    }

    // Verify the user is the mentee who booked this session
    if (booking.user.toString() !== userId) {
      return res.status(403).json({ message: "You can only rate your own sessions" });
    }

    // Update booking with rating
    booking.rating = rating;
    booking.review = review || "";
    await booking.save();

    // Update mentor's average rating
    try {
      const mentorBookings = await Booking.find({ 
        mentor: booking.mentor,
        status: "completed",
        rating: { $exists: true, $ne: null, $gte: 1 }
      });

      const totalRatings = mentorBookings.length;
      const sumRatings = mentorBookings.reduce((sum, b) => sum + (b.rating || 0), 0);
      const avgRating = totalRatings > 0 ? (sumRatings / totalRatings).toFixed(1) : 0;

      await User.findByIdAndUpdate(booking.mentor, {
        "mentor.averageRating": parseFloat(avgRating),
        "mentor.totalReviews": totalRatings
      });

      console.log(`✅ Updated mentor rating: ${avgRating} (${totalRatings} reviews)`);
    } catch (ratingError) {
      console.error("Error updating mentor rating:", ratingError);
    }

    // Update student's average rating received from mentors
    try {
      const studentBookings = await Booking.find({ 
        user: booking.user,
        status: "completed",
        rating: { $exists: true, $ne: null, $gte: 1 }
      });

      const totalRatings = studentBookings.length;
      const sumRatings = studentBookings.reduce((sum, b) => sum + (b.rating || 0), 0);
      const avgRating = totalRatings > 0 ? (sumRatings / totalRatings).toFixed(1) : 0;

      await User.findByIdAndUpdate(booking.user, {
        "mentee.averageRating": parseFloat(avgRating)
      });

      console.log(`✅ Updated student rating: ${avgRating} (${totalRatings} reviews)`);
    } catch (ratingError) {
      console.error("Error updating student rating:", ratingError);
    }

    res.json({ 
      message: "Session rated successfully", 
      booking 
    });
  } catch (err) {
    console.error("Rate session error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Calculate and update learning streak
exports.calculateStreak = async (req, res) => {
  try {
    const { userId } = req.params;

    const completedBookings = await Booking.find({
      user: userId,
      status: "completed"
    }).sort({ date: 1 });

    if (completedBookings.length === 0) {
      return res.json({ currentStreak: 0, longestStreak: 0 });
    }

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;
    let lastDate = null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate streaks
    for (let i = 0; i < completedBookings.length; i++) {
      const bookingDate = new Date(completedBookings[i].date);
      bookingDate.setHours(0, 0, 0, 0);

      if (lastDate) {
        const daysDiff = Math.floor((bookingDate - lastDate) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 7) { // One week apart
          tempStreak++;
        } else if (daysDiff < 7) { // Same week
          // Don't increment, continue current week
        } else { // More than a week gap
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }

      lastDate = bookingDate;
    }

    longestStreak = Math.max(longestStreak, tempStreak);

    // Check if current streak is still active (within last week)
    if (lastDate) {
      const daysSinceLastSession = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
      if (daysSinceLastSession <= 7) {
        currentStreak = tempStreak;
      }
    }

    res.json({ currentStreak, longestStreak });
  } catch (err) {
    console.error("Calculate streak error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
