require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const admin = await User.findOne({ email: 'admin@campusmarket.com' }).select('+passwordHash');
  if (admin) {
    console.log('Found admin:');
    console.log('  email:', admin.email);
    console.log('  role:', admin.role);
    console.log('  isEmailVerified:', admin.isEmailVerified);
    console.log('  passwordHash exists:', !!admin.passwordHash);
    console.log('  passwordHash is bcrypt:', admin.passwordHash && admin.passwordHash.length > 50);
    console.log('  verificationStatus:', admin.verificationStatus);
    const match = await admin.comparePassword('Admin123!');
    console.log('  password match for Admin123!:', match);
  } else {
    console.log('Admin NOT found in database!');
  }
  await mongoose.disconnect();
})();
