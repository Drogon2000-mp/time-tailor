// Time Tailor - Main Server Entry Point
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary'; // Import v2 directly
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';


// Security middleware
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';

// Load environment variables
dotenv.config(); // Ensure dotenv is loaded first

// Fail-fast validation for required production env vars
import validateEnv from './config/validateEnv.js';
validateEnv();

// Import admin seeding utility
import seedAdmin from './utils/seedAdmin.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import serviceRoutes from './routes/services.js';
import orderRoutes from './routes/orders.js';
import appointmentRoutes from './routes/appointments.js';
import fabricRoutes from './routes/fabrics.js';
import buttonDesignRoutes from './routes/buttonDesigns.js';
import galleryRoutes from './routes/gallery.js'; // Ensure this is used
import productRoutes from './routes/products.js';
import otpRoutes from './routes/otp.js';
import esewaRoutes from './routes/esewa.js';
import paymentRoutes from './routes/paymentRoutes.js';


const app = express();
// Trust proxy (Render and other PaaS set X-Forwarded-* headers)
app.set('trust proxy', 1);

// Configure Cloudinary
cloudinary.config({ // Use v2 directly
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer with Cloudinary storage
const galleryStorage = new CloudinaryStorage({
  cloudinary: cloudinary, // Use v2 directly
  params: {
    folder: 'time-tailor/gallery',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 1200, height: 1200, crop: 'limit', quality: 'auto' }
    ]
  }
});

const productStorage = new CloudinaryStorage({
  cloudinary: cloudinary, // Use v2 directly
  params: {
    folder: 'time-tailor/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 800, height: 800, crop: 'limit', quality: 'auto' }
    ]
  }
});

const upload = multer({ // This 'upload' variable is not used, consider removing or integrating
  storage: galleryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

// Security Middleware

// 1. Helmet - Sets various HTTP headers for security
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:', 'res.cloudinary.com'],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", 'https://api.cloudinary.com'],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// 2. Rate Limiting - Prevent brute force attacks
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Strict limit for auth routes (login, register)
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply authLimiter specifically to auth routes
app.use('/api/auth', authLimiter);
// Apply general rate limiting to all API routes
app.use('/api/', generalLimiter);

// 3. MongoDB Sanitization - Prevent NoSQL injection
app.use(mongoSanitize());

// 4. HPP - Prevent HTTP Parameter Pollution
app.use(hpp());

// 5. Request size limit - Prevent large payload attacks
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Cookie parsing (required for authenticate middleware)
app.use(cookieParser());

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Development allowances
    const devOrigins = [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'https://time-tailor11.onrender.com'
    ];

    const prodAllowed = [
      process.env.CLIENT_URL || process.env.FRONTEND_URL,
      process.env.SERVER_URL,
      process.env.RENDER_EXTERNAL_HOSTNAME ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME}` : undefined
    ].filter(Boolean);

    const allowedOrigins = process.env.NODE_ENV === 'production' ? prodAllowed : [...prodAllowed, ...devOrigins];

    // Allow requests with no origin (e.g., curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Make upload available globally
app.locals.upload = multer({ storage: galleryStorage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (req, file, cb) => { // This is redundant with the 'upload' variable above
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) cb(null, true); else cb(new Error('Only image files are allowed!'));
  }});

app.locals.productUpload = multer({ storage: productStorage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (req, file, cb) => { // This is redundant with the 'upload' variable above
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) cb(null, true); else cb(new Error('Only image files are allowed!'));
  }});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API Routes
// NOTE: paymentRoutes.js is currently unused because the app mounts /api/esewa
// which is sufficient for the existing Cart integration.
app.use('/api/auth', authRoutes);

app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/esewa', esewaRoutes);
app.use('/api/fabrics', fabricRoutes);
app.use('/api/button-designs', buttonDesignRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/products', productRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Time Tailor API is running',
    timestamp: new Date().toISOString()
  });
});

// Serve built frontend if available
const clientBuildPath = path.resolve(__dirname, '../client/dist');
const clientAssetsPath = path.join(clientBuildPath, 'assets');
if (fs.existsSync(clientBuildPath)) {
  console.log('✅ Serving frontend from:', clientBuildPath);
  app.use('/assets', (req, res, next) => {
    console.log(`📦 Asset request: ${req.path}`);
    next();
  });
  app.use('/assets', express.static(clientAssetsPath, { index: false }));
  app.use(express.static(clientBuildPath, { index: false }));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/assets') || req.path.startsWith('/favicon') || req.path.startsWith('/icons')) {
      return next();
    }
    res.sendFile(path.join(clientBuildPath, 'index.html'), (err) => {
      if (err) {
        next(err);
      }
    });
  });
} else {
  console.warn('⚠️  Frontend build not found at:', clientBuildPath);
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Database connection and server start
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI; // Removed localhost fallback

// Start server with or without MongoDB
const startServer = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB'); 
    // Call the admin seeding function after connection is established
    await seedAdmin();
  } catch (error) {
    console.error('❌ MongoDB connection failed. Exiting...');
    process.exit(1);
  }
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    const publicUrl = process.env.SERVER_URL || process.env.FRONTEND_URL || (process.env.RENDER_EXTERNAL_HOSTNAME ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME}` : `http://localhost:${PORT}`);
    console.log(`📍 API available at ${publicUrl}/api`);
    if (mongoose.connection.readyState !== 1) {
      console.log(`⚠️  Database: Not connected (some features will not work)`);
    }
  });
};

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

export default app;
