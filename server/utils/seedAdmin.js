import User from '../models/User.js'; // Assuming your User model is here
import bcrypt from 'bcryptjs';

const seedAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME || 'System Administrator';

    if (!adminEmail || !adminPassword) {
      console.error("❌ Missing ADMIN_EMAIL or ADMIN_PASSWORD in .env for seeding.");
      return;
    }

    const existingAdmin = await User.findOne({ email: adminEmail }).select('+password');

    if (existingAdmin) {
      const isMatch = await existingAdmin.comparePassword(adminPassword);
      if (!isMatch) {
        existingAdmin.password = adminPassword;
        await existingAdmin.save();
        console.log("✅ Admin user password synchronized with .env.");
      } else {
        console.log("✅ Admin user already exists and is up to date.");
      }
    } else {
      await User.create({
        name: adminName,
        email: adminEmail,
        password: adminPassword, // Pass plain password, model hook handles hashing
        role: 'admin', // Assign 'admin' role
      });
      console.log("✅ Admin user seeded successfully.");
    }
  } catch (error) {
    console.error("❌ Error seeding admin user:", error.message);
  }
};

export default seedAdmin;