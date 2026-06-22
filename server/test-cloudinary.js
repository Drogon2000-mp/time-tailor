// Cloudinary Test Script
// Run this to verify your Cloudinary configuration is correct

import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config();

console.log('🔍 Testing Cloudinary Configuration...\n');

// Check if credentials are set
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || cloudName === 'your_cloud_name') {
  console.log('❌ CLOUDINARY_CLOUD_NAME is not set or is the default value');
  console.log('   Please edit server/.env and add your Cloudinary cloud name');
  process.exit(1);
}

if (!apiKey || apiKey === 'your_api_key') {
  console.log('❌ CLOUDINARY_API_KEY is not set or is the default value');
  console.log('   Please edit server/.env and add your Cloudinary API key');
  process.exit(1);
}

if (!apiSecret || apiSecret === 'your_api_secret') {
  console.log('❌ CLOUDINARY_API_SECRET is not set or is the default value');
  console.log('   Please edit server/.env and add your Cloudinary API secret');
  process.exit(1);
}

console.log('✅ Environment variables are set');
console.log(`   Cloud Name: ${cloudName}`);
console.log(`   API Key: ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`);
console.log(`   API Secret: ${apiSecret.substring(0, 4)}...${apiSecret.substring(apiSecret.length - 4)}\n`);

// Configure Cloudinary
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret
});

// Test the connection
const testUpload = async () => {
  try {
    console.log('🧪 Testing Cloudinary API connection...');
    
    // Try to get account info (doesn't require upload)
    const result = await cloudinary.api.usage();
    
    console.log('✅ Cloudinary connection successful!\n');
    console.log('📊 Account Usage:');
    console.log(`   Credits used: ${result.credits.used}/${result.credits.limit}`);
    console.log(`   Storage used: ${(result.storage.used / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Bandwidth: ${(result.bandwidth.used / 1024 / 1024).toFixed(2)} MB\n`);
    
    console.log('🎉 Cloudinary is configured correctly!');
    console.log('   You can now upload images from the admin panel.\n');
    
    process.exit(0);
  } catch (error) {
    console.log('❌ Cloudinary connection failed:');
    console.log(`   ${error.message}\n`);
    
    if (error.error && error.error.code === 'ENOTFOUND') {
      console.log('💡 This usually means the cloud name is incorrect.');
    } else if (error.error && error.error.code === '401') {
      console.log('💡 This usually means the API key or secret is incorrect.');
    }
    
    process.exit(1);
  }
};

testUpload();

