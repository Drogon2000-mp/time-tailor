# Time Tailor - Custom Tailoring Service

A full-stack web application for custom tailoring services, featuring appointment booking, product catalog, and admin management.

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Build the client
npm run build

# Start the server
npm start
```

The application will be available at `http://localhost:5000`

### Using the Helper Script

For easier development with automatic port conflict resolution:

```bash
./start-dev.sh
```

## 🛠️ Common Issues

### Port 5000 Already in Use

**Error**: `EADDRINUSE: address already in use :::5000`

**Solutions**:

1. Use the helper script: `./start-dev.sh`
2. Use the npm script: `npm run kill-port && npm start`
3. Manual cleanup: `lsof -ti:5000 | xargs kill -9 && npm start`

### Frontend Build Not Found

**Error**: `⚠️ Frontend build not found at: /Users/.../client/dist`

**Solution**: Build the client first:

```bash
npm run build
```

## 📦 Project Structure

```
time-tailor/
├── client/           # React frontend
│   ├── src/
│   ├── public/
│   └── dist/        # Built frontend (generated)
├── server/          # Express backend
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── server.js
├── .render.yaml     # Render deployment config
└── package.json     # Workspace root
```

## 🌐 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions for Render.

### Quick Deploy to Render

1. Connect your repository to Render
2. Render will auto-detect `.render.yaml`
3. Set required environment variables:
   - `MONGODB_URI`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `ESEWA_SECRET_KEY`
4. Deploy!

## 🔧 Available Scripts

- `npm run build` - Build client for production
- `npm start` - Start production server (with automatic port cleanup)
- `npm run dev` - Start development server with auto-reload
- `npm run dev:client` - Start client development server only
- `npm run kill-port` - Kill any process using port 5000

## 🔐 Environment Variables

Create `server/.env`:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:5000
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
ESEWA_MERCHANT_ID=EPAYTEST
ESEWA_SECRET_KEY=your_esewa_secret
```

## 🎯 Features

- 👔 Custom tailoring service catalog
- 📅 Appointment booking system
- 🛒 Shopping cart and checkout
- 💳 eSewa payment integration
- 🖼️ Gallery management
- 👨‍💼 Admin dashboard
- 🔐 User authentication with Google OAuth
- 📱 Responsive design

## 🔗 API Endpoints

- `/api/health` - Health check
- `/api/auth` - Authentication routes
- `/api/users` - User management
- `/api/services` - Service catalog
- `/api/orders` - Order management
- `/api/appointments` - Appointment booking
- `/api/products` - Product catalog
- `/api/gallery` - Gallery images
- `/api/esewa` - Payment processing

## 📄 License

Private - All rights reserved

## 👥 Default Admin Credentials

- **Email**: admin@timetailor.com
- **Password**: Admin@123

**⚠️ IMPORTANT**: Change this password immediately after first login!

