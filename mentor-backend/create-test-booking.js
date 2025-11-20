// Script to create a test booking
const mongoose = require('mongoose');
require('dotenv').config();

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/mentorconnect';

mongoose.connect(mongoUri)
  .then(() => console.log(`✅ Connected to MongoDB: ${mongoUri}`))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const Booking = require('./models/Booking');
const User = require('./models/User');

async function createTestBooking() {
  try {
    // First, let's check what users exist
    console.log('🔍 Checking database...');
    const allUsers = await User.find({});
    console.log(`📊 Total users in database: ${allUsers.length}`);
    
    if (allUsers.length === 0) {
      console.log('❌ No users found in database!');
      console.log('💡 Please register at least one mentor and one student first.');
      process.exit(1);
    }
    
    console.log('\n👥 Users in database:');
    allUsers.forEach(u => {
      console.log(`   - ${u.name} (${u.email}) - Role: ${u.role} - ID: ${u._id}`);
    });
    
    // Find the mentor by ID (from your localStorage)
    const mentorId = '691491fd9000fecf03780eed';
    const mentor = await User.findById(mentorId);
    
    if (!mentor) {
      console.log(`\n❌ Mentor not found with ID: ${mentorId}`);
      console.log('💡 Please use one of the IDs listed above');
      process.exit(1);
    }
    
    console.log(`\n✅ Found mentor: ${mentor.name} (${mentor._id})`);
    
    // Find or create a test student
    let student = await User.findOne({ 
      email: 'teststudent@example.com',
      role: 'student'
    });
    
    if (!student) {
      console.log('📝 Creating test student...');
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('Test@123', 10);
      
      student = new User({
        name: 'Test Student',
        email: 'teststudent@example.com',
        password: hashedPassword,
        role: 'student',
        isEmailVerified: true
      });
      await student.save();
      console.log(`✅ Test student created: ${student.name} (${student._id})`);
    } else {
      console.log(`✅ Found test student: ${student.name} (${student._id})`);
    }
    
    // Create test booking
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    
    const booking = new Booking({
      user: student._id,
      mentor: mentor._id,
      mentorName: mentor.name,
      sessionType: 'video-call',
      duration: '60min',
      date: tomorrow,
      time: '10:00 AM',
      notes: 'Test booking for mentor dashboard - Please accept or decline this request',
      cost: 100,
      status: 'pending'
    });
    
    await booking.save();
    
    console.log('\n✅ Test booking created successfully!');
    console.log('📋 Booking Details:');
    console.log(`   ID: ${booking._id}`);
    console.log(`   Student: ${student.name}`);
    console.log(`   Mentor: ${mentor.name}`);
    console.log(`   Date: ${booking.date.toDateString()}`);
    console.log(`   Time: ${booking.time}`);
    console.log(`   Status: ${booking.status}`);
    console.log(`   Cost: $${booking.cost}`);
    console.log('\n🎉 Now refresh your Mentor Dashboard to see the request!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test booking:', error);
    process.exit(1);
  }
}

createTestBooking();
