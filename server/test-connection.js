// Test MongoDB Connection Script
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const testConnection = async () => {
  console.log('Testing MongoDB connection...');
  console.log('Connection URI:', process.env.MONGODB_URI?.replace(/:([^:@]+)@/, ':****@'));
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected successfully!');
    console.log('Database name:', mongoose.connection.name);
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
};

testConnection();

