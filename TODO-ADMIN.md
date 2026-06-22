# Admin Dashboard & Order Flow TODO

## Status: Starting

1. [ ] Create `client/src/pages/admin-dashboard.css`
2. [ ] Create `client/src/pages/AdminDashboard.jsx` (orders table, gallery upload)
3. [ ] Update `client/src/App.jsx` (add /admin-dashboard route)
4. [ ] Update `client/src/pages/Dashboard.jsx` (admin role redirect)
5. [ ] Replace `client/src/pages/CustomTailoring.jsx` -> `PlaceOrder.jsx` (gallery design select, fabric/color/price/phone/notes, POST /api/orders)
6. [ ] Update `client/src/pages/Login.jsx` (add admin creds note)
7. [ ] Update dashboard/frontend links to /place-order
8. [ ] Test flow: admin login, user order -> admin accept/date -> gallery upload

Run:
- Server: cd server && npm i && npm start
- Client: cd client && npm i && npm run dev

