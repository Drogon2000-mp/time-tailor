// Seed Script - Populate database with initial data
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

// Import models
import User from './models/User.js';
import Service from './models/Service.js';
import Order from './models/Order.js';
import Appointment from './models/Appointment.js';
import Product from './models/Product.js';

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    await User.deleteMany({});
    await Service.deleteMany({});
    await Order.deleteMany({});
    await Appointment.deleteMany({});
    await Product.deleteMany({});
    console.log('✅ Cleared existing data');

    const adminUser = await User.create({
      name: 'Admin',
      email: 'admin@gmail.com',
      password: 'admin123',
      phone: '+977-9800000000',
      role: 'admin',
      measurements: {}
    });
    console.log('✅ Admin user created (admin@gmail.com / admin123)');

    const demoUser = await User.create({
      name: 'Demo User',
      email: 'user@example.com',
      password: 'user123',
      phone: '+1-555-0101',
      role: 'user',
      measurements: {}
    });
    console.log('✅ Demo user created (user@example.com / user123)');

    const services = [
      {
        name: 'Custom Suit',
        description: 'Full custom tailored suit with your choice of fabric, buttons, and design options. Perfect fit guaranteed.',
        basePrice: 4000,
        category: 'suit',
        defaultMeters: 3.0,
        features: ['Premium fabric selection', 'Custom design options', 'Perfect fit guarantee', 'Multiple fittings included'],
        displayOrder: 1
      },
      {
        name: 'Dress Shirt',
        description: 'Custom made dress shirt with your choice of fabric, collar, and cuff style.',
        basePrice: 600,
        category: 'shirt',
        defaultMeters: 2.0,
        features: ['Premium cotton fabrics', 'Custom collar styles', 'Monogramming available', 'Perfect fit'],
        displayOrder: 2
      },
      {
        name: 'Tailored Trousers',
        description: 'Custom tailored trousers with your choice of fabric, waistband, and pocket styles.',
        basePrice: 700,
        category: 'trouser',
        defaultMeters: 1.10,
        features: ['Premium fabric selection', 'Custom waistband options', 'Perfect hem adjustment', 'Multiple fit options'],
        displayOrder: 3
      },
      {
        name: 'Overcoat',
        description: 'Luxurious custom overcoat for elegant winter styling.',
        basePrice: 200,
        category: 'overcoat',
        defaultMeters: 3.5,
        features: ['Premium wool blend', 'Custom lining options', 'Perfect fit', 'Quality construction'],
        displayOrder: 4
      }
    ];

    const createdServices = await Service.insertMany(services);
    console.log(`✅ Created ${createdServices.length} service categories`);

    const sampleProducts = [
      {
        name: 'Classic Suit Set (Pant + Shirt + Overcoat)',
        description: 'Premium 3-piece suit set. Perfect for formal occasions.',
        category: 'suit-pant-shirt-overcoat',
        basePrice: 12500,
        sizes: [
          { size: 'S', available: 5 },
          { size: 'M', available: 8 },
          { size: 'L', available: 12 },
          { size: 'XL', available: 6 }
        ],
        images: [{ url: '/images/suits/two-piece.jpg', alt: 'Suit set' }],
        fabric: { material: 'Wool Blend', color: 'Navy Blue' }
      },
      {
        name: 'Daura Suruwal Traditional',
        description: 'Authentic Nepali attire for cultural events.',
        category: 'daura-suruwal',
        basePrice: 8500,
        sizes: [
          { size: 'S', available: 4 },
          { size: 'M', available: 7 },
          { size: 'L', available: 10 },
          { size: 'XL', available: 5 }
        ],
        images: [{ url: '/images/src/image 1.jpeg', alt: 'Daura Suruwal' }],
        fabric: { material: 'Cotton-Silk', color: 'Cream' }
      },
      {
        name: 'Kurta Suruwal Elegant',
        description: 'Comfortable ethnic wear for festivals.',
        category: 'kurta-suruwal',
        basePrice: 6500,
        sizes: [
          { size: 'S', available: 6 },
          { size: 'M', available: 9 },
          { size: 'L', available: 12 }
        ],
        images: [{ url: '/images/src/image 2.jpeg', alt: 'Kurta Suruwal' }],
        fabric: { material: 'Cotton', color: 'White' }
      }
    ];

    await Product.insertMany(sampleProducts);
    console.log('✅ Created 3 sample clothing products');

    console.log('\n🎉 Seed complete!');
    console.log('Login: user@example.com / user123');
    console.log('Admin: admin@gmail.com / admin123');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedData();
