# Clothing Catalog Feature TODO
Current working directory: /Users/viserion/time-tailor

## Approved Plan (Updated per feedback: Standard sizes only, no custom measurements for catalog orders)

**Backend:**
- [ ] Create server/models/Product.js (name, category, price, sizes[], images[], stock)
- [ ] Create server/routes/products.js (CRUD, public list/filter)
- [ ] Edit server/models/Order.js (add size to orderItemSchema)
- [ ] Edit server/server.js (mount /api/products routes)
- [ ] Add sample products to server/seed.js

**Frontend:**
- [ ] Create client/src/pages/Catalog.jsx (browse, filter, add to cart)
- [ ] Create client/src/pages/Cart.jsx (review cart, order with size/qty)
- [ ] Edit client/src/pages/Dashboard.jsx (add Catalog card/link)
- [ ] Edit client/src/pages/AdminDashboard.jsx (Products tab/CRUD)
- [ ] Edit client/src/App.jsx (add /catalog, /cart routes)

**Testing/Followup:**
- [ ] Run server seed.js
- [ ] Test catalog flow: browse -> cart -> order
- [ ] Test admin add/edit products

Next step: Create server/models/Product.js
