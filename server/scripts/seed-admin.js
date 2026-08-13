/**
 * Seed Admin Script
 * Creates an admin user in the database.
 *
 * Usage: node scripts/seed-admin.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const { ROLES, VERIFICATION_STATUS } = require('../config/constants');

const ADMIN_DATA = {
  email: 'admin@campusmarket.com',
  passwordHash: 'Admin123!', // Will be hashed by pre-save hook
  firstName: 'Admin',
  lastName: 'CampusMarket',
  university: 'System',
  role: ROLES.ADMIN,
  isEmailVerified: true,
  verificationStatus: VERIFICATION_STATUS.APPROVED,
};

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existing = await User.findOne({ email: ADMIN_DATA.email });
    if (existing) {
      console.log('⚠️  Admin user already exists:');
      console.log(`   Email:    ${existing.email}`);
      console.log(`   Role:     ${existing.role}`);
      console.log(`   ID:       ${existing._id}`);
      process.exit(0);
    }

    // Create admin
    const admin = await User.create(ADMIN_DATA);
    console.log('🎉 Admin user created successfully!');
    console.log(`   Email:    ${admin.email}`);
    console.log(`   Password: Admin123!`);
    console.log(`   Role:     ${admin.role}`);
    console.log(`   ID:       ${admin._id}`);
    console.log('\n⚠️  Change the password after first login!');
  } catch (error) {
    console.error('❌ Error seeding admin:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

seedAdmin();
