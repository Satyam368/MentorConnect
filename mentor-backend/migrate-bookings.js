// Migration script to add mentor field to existing bookings
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mentor-platform')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const Booking = require('./models/Booking');
const User = require('./models/User');

async function migrateBookings() {
  try {
    console.log('🔄 Starting migration...');
    
    // Find all bookings without mentor field
    const bookingsWithoutMentor = await Booking.find({ 
      mentor: { $exists: false } 
    });
    
    console.log(`📊 Found ${bookingsWithoutMentor.length} bookings without mentor field`);
    
    if (bookingsWithoutMentor.length === 0) {
      console.log('✅ No bookings to migrate');
      process.exit(0);
    }
    
    let updated = 0;
    let failed = 0;
    
    for (const booking of bookingsWithoutMentor) {
      try {
        // Find mentor by name
        const mentor = await User.findOne({ 
          name: booking.mentorName,
          role: 'mentor'
        });
        
        if (mentor) {
          booking.mentor = mentor._id;
          await booking.save();
          updated++;
          console.log(`✅ Updated booking ${booking._id} with mentor ${mentor.name} (${mentor._id})`);
        } else {
          console.log(`⚠️  No mentor found for name: ${booking.mentorName}`);
          failed++;
        }
      } catch (err) {
        console.error(`❌ Error updating booking ${booking._id}:`, err.message);
        failed++;
      }
    }
    
    console.log('\n📈 Migration Summary:');
    console.log(`   Total bookings found: ${bookingsWithoutMentor.length}`);
    console.log(`   ✅ Successfully updated: ${updated}`);
    console.log(`   ❌ Failed: ${failed}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateBookings();
