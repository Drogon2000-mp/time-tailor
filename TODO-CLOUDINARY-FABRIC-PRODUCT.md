# Cloudinary Image Upload for Fabric & Product

## Plan

**Information Gathered:**
- server.js: Cloudinary configured, multer for gallery/products exists
- AdminDashboard.jsx: Fabric/product forms use FormData → `/upload` endpoints
- Fabric model: `image: String`
- Product model: `images: [{url, alt}]`
- Current issue: fabric/products need Cloudinary upload endpoints

**Detailed Update Plan:**

1. **server/routes/fabrics.js**
   - Add `/upload` endpoint using multer like products
   - Update create to use `image: uploaded_url`

2. **server/routes/products.js**
   - `/upload` already exists (multer)
   - Ensure create handles empty images

3. **client/src/pages/AdminDashboard.jsx**
   - Fabric upload: `/api/fabrics/upload` → `image: imageUrl`
   - Product already works

**Dependent files:**
- server/server.js (multer available)
- server/middleware/auth.js (protect routes)

**Followup:**
- Restart server
- Test admin uploads
- Verify user dashboard/CustomTailoring display

Proceed?
