const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // mentee who booked
  mentor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // mentor being booked
  mentorName: { type: String, required: true },
  sessionType: { type: String, required: true }, // video-call, phone-call etc.
  duration: { type: String, required: true },    // 30min, 60min etc.
  date: { type: Date, required: true },
  time: { type: String, required: true },
  notes: { type: String },
  cost: { type: Number, required: true },
  status: { type: String, enum: ["pending", "confirmed", "cancelled", "completed"], default: "pending" },
  rating: { type: Number, min: 1, max: 5 },
  review: { type: String },
  topics: [{ type: String }], // Skills/topics covered in this session
  startTime: { type: String }, // Actual start time (for upcoming sessions)
}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);
