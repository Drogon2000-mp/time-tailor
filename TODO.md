# Fabric Image/Price Fix - TODO

## Steps to Complete:

### 1. ✅ Update Backend Models & Routes [PENDING]
   - [ ] server/models/Fabric.js - Change `image: String` → `image: { url: String }`
   - [ ] server/routes/fabrics.js 
     - Add `/api/fabrics/upload` Cloudinary endpoint
     - Fix create/update to save `req.body.image.url`
     - Update queries to populate/select `image.url`

### 2. ✅ Fix Frontend Displays [PENDING]
   - [ ] client/src/pages/AdminDashboard.jsx 
     - Fix `API_BASE` → use `/api` proxy
     - Update image: `fabric.image?.url`
     - Fix upload to use new endpoint + `image: {url}`
   - [ ] client/src/pages/ProtectedDashboard.jsx
     - Fix useEffect: add `axios.get('/api/fabrics')`
     - Image fallback: `fabric.image?.url`
   - [ ] client/src/pages/CustomTailoring.jsx
     - Image: `fabric.image?.url || '/placeholder-fabric.jpg'`

### 3. ✅ Test & Deploy [PENDING]
   - [ ] Restart server/client: `npm run dev`
   - [ ] Admin: Upload fabric → verify image/price in user sections
   - [ ] User Dashboard: Fabrics tab shows images/prices
   - [ ] CustomTailoring: Fabric selection works
   - [ ] Migrate existing data if needed

**Progress: 0/12 steps complete**

