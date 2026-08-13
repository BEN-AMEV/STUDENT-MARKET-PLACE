require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({
      $or: [
        { firstName: /james/i },
        { lastName: /bond/i },
      ],
    });
    console.log('Found matching users:');
    users.forEach((u) => {
      console.log({
        id: u._id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        isEmailVerified: u.isEmailVerified,
        verificationStatus: u.verificationStatus,
        role: u.role,
        isVerifiedVirtual: u.isVerified,
      });
    });
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
})();
