const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // who booked
  mentorName: { type: String, required: true },
  sessionType: { type: String, required: true }, // video-call, phone-call etc.
  duration: { type: String, required: true },    // 30min, 60min etc.
  date: { type: Date, required: true },
  time: { type: String, required: true },
  notes: { type: String },
  cost: { type: Number, required: true },
  status: { type: String, enum: ["pending", "confirmed", "cancelled"], default: "pending" },
}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);
