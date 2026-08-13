require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const seedUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB.');

    const email = 'student@test.edu';
    const password = 'password123';

    let user = await User.findOne({ email });

    if (user) {
      console.log(`ℹ️ User ${email} already exists.`);
      // Make sure it is verified
      user.isEmailVerified = true;
      user.verificationStatus = 'approved';
      // Reset password just in case
      user.passwordHash = password;
      await user.save();
      console.log('✅ Existing user status updated (Verified, password reset to password123).');
    } else {
      user = await User.create({
        email,
        passwordHash: password, // gets hashed by the pre-save hook
        firstName: 'Alex',
        lastName: 'Mercer',
        university: 'University of Ghana',
        department: 'Computer Science',
        year: '3',
        bio: 'Coding student entrepreneur. Selling textbooks and tech gadgets.',
        isEmailVerified: true,
        verificationStatus: 'approved',
      });
      console.log(`✅ New test student user created successfully.`);
    }

    console.log('\n==========================================');
    console.log('🎓 Test Student Account Credentials:');
    console.log(`📧 Email:    ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log('==========================================\n');

  } catch (error) {
    console.error('❌ Error seeding user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB.');
  }
};

seedUser();
