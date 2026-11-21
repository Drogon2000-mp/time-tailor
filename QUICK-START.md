# Time Tailor - Quick Start Guide

## 🚀 For Developers

### First Time Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd time-tailor

# Install all dependencies
npm install

# Build the client
npm run build

# Start the server
npm start
```

Visit: http://localhost:5000

### Daily Development

```bash
# Use the helper script (handles port conflicts automatically)
./start-dev.sh

# Or manually
npm run kill-port  # Kill any process on port 5000
npm start          # Start the server
```

### Running Tests

```bash
# Test if everything is ready for deployment
./test-build.sh
```

## 🌐 For Deployment

### Prerequisites Checklist

- [ ] MongoDB Atlas connection string
- [ ] Cloudinary credentials (cloud name, API key, API secret)
- [ ] eSewa secret key (or test value)
- [ ] Git repository connected to Render
- [ ] Environment variables ready

### Deploy to Render

1. **Connect Repository**
   - Go to render.com → New Blueprint
   - Select your repository

2. **Set Environment Variables**
   Only these need manual configuration (others are auto-set):
   ```
   MONGODB_URI=mongodb+srv://...
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=123456789012345
   CLOUDINARY_API_SECRET=your-secret
   ESEWA_SECRET_KEY=your-secret
   ```

3. **Deploy**
   - Click "Apply"
   - Wait 5-10 minutes
   - Visit https://time-tailor11.onrender.com

### Verify Deployment

```bash
# Check health endpoint
curl https://time-tailor11.onrender.com/api/health

# Expected response:
# {"status":"ok","message":"Time Tailor API is running","timestamp":"..."}
```

## 🆘 Common Issues & Fixes

### Issue: Port 5000 already in use

```bash
# Fix 1: Use helper script
./start-dev.sh

# Fix 2: Kill the process
lsof -ti:5000 | xargs kill -9
npm start

# Fix 3: Use npm script
npm run kill-port && npm start
```

### Issue: Frontend not found

```bash
# Build the client first
npm run build

# Verify build exists
ls client/dist
```

### Issue: MongoDB connection failed

**Check:**
- Connection string is correct
- IP address whitelisted in MongoDB Atlas (use 0.0.0.0/0 for Render)
- Cluster is not paused
- Password is URL-encoded if it contains special characters

### Issue: Build fails on Render

**Check:**
- All environment variables are set
- MongoDB URI is valid
- Build logs for specific errors

## 📚 Documentation

- **Full Deployment Guide**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Pre-Deploy Checklist**: [PRE-DEPLOY-CHECKLIST.md](./PRE-DEPLOY-CHECKLIST.md)
- **Project README**: [README.md](./README.md)

## 🔑 Default Credentials

**Admin Login:**
- Email: `admin@timetailor.com`
- Password: `Admin@123`

⚠️ **IMPORTANT**: Change this password immediately after first login!

## 🛠️ Useful Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install all dependencies |
| `npm run build` | Build client for production |
| `npm start` | Start production server |
| `npm run dev` | Start dev server with auto-reload |
| `npm run dev:client` | Start client dev server only |
| `npm run kill-port` | Kill process on port 5000 |
| `./start-dev.sh` | Interactive startup (handles conflicts) |
| `./test-build.sh` | Test if ready for deployment |

## 📂 Project Structure

```
time-tailor/
├── client/              # React frontend (Vite)
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── api/         # API client
│   │   └── assets/      # Images, styles
│   └── dist/           # Build output (generated)
│
├── server/             # Express backend
│   ├── models/         # Mongoose models
│   ├── routes/         # API routes
│   ├── middleware/     # Custom middleware
│   ├── config/         # Configuration files
│   ├── utils/          # Utility functions
│   └── server.js       # Main server file
│
├── .render.yaml        # Render deployment config
├── package.json        # Root workspace config
└── README.md          # Main documentation
```

## 🔗 Important URLs

### Local Development
- Frontend & API: http://localhost:5000
- API Health Check: http://localhost:5000/api/health
- Client Dev Server: http://localhost:5173 (if running separately)

### Production (Render)
- Application: https://time-tailor11.onrender.com
- API Health: https://time-tailor11.onrender.com/api/health
- API Base: https://time-tailor11.onrender.com/api

## 💡 Tips

1. **First time setup**: Always run `npm install` then `npm run build` before starting
2. **Port conflicts**: Use `./start-dev.sh` for automatic handling
3. **Before deploying**: Run `./test-build.sh` to verify everything is ready
4. **After changes**: Rebuild client with `npm run build` if you modified frontend code
5. **Production deploys**: Push to git → Render auto-deploys from connected branch

## 🎯 Next Steps

1. ✅ Set up local development environment
2. ✅ Test the application locally
3. ✅ Configure MongoDB Atlas
4. ✅ Configure Cloudinary
5. ✅ Review pre-deployment checklist
6. ✅ Deploy to Render
7. ✅ Test production deployment
8. ✅ Change admin password

---

**Need help?** Check the detailed guides:
- Deployment issues → [DEPLOYMENT.md](./DEPLOYMENT.md)
- Pre-deploy checklist → [PRE-DEPLOY-CHECKLIST.md](./PRE-DEPLOY-CHECKLIST.md)
- General info → [README.md](./README.md)
