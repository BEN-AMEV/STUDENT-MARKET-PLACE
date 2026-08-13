require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const result = await User.updateMany(
      {
        $or: [
          { firstName: /james/i },
          { lastName: /bond/i },
        ],
        verificationStatus: 'approved',
      },
      {
        $set: { isEmailVerified: true },
      }
    );
    console.log('Update result:', result);

    const users = await User.find({
      $or: [
        { firstName: /james/i },
        { lastName: /bond/i },
      ],
    });
    console.log('Updated user records:');
    users.forEach((u) => {
      console.log({
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        isEmailVerified: u.isEmailVerified,
        verificationStatus: u.verificationStatus,
      });
    });
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
})();
