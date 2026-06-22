# Custom Tailoring Implementation Plan
Status: Complete ✅

## Breakdown Steps:
- [x] Step 1: Add 'Fabrics' view tab to ProtectedDashboard.jsx (fetch /api/fabrics, grid display with prices)
- [x] Step 2: Add 'Fabrics' CRUD tab to AdminDashboard.jsx (fetch /api/fabrics/admin/all, add/edit/delete like gallery/products)
- [x] Step 3: Rewrite CustomTailoring.jsx to multi-step wizard:
  | Step 0: Garment selection (two-piece-suit, three-piece-suit, shirt, pant, overcoat, daurasuruwal, kurta-suruwal)
  | Step 1: Designs (Gallery images filtered by category)
  | Step 2: Measurements (dynamic fields from user profile by category)
  | Step 3: Fabric selection (fetch /api/fabrics)
  | Step 4: Summary + Cost calc (cloth meter * fabric.meterPrice + labor, NPR)
  | Step 5: Submit to /api/custom-orders
- [x] Step 4: Test full flow: admin add fabrics → user view fabrics → custom order end-to-end → order in dashboard
- [x] Step 5: Complete

## Cost Formulas (hardcoded in frontend):
- shirt/pant: 2.5m cloth + 5000 labor
- two-piece-suit: 5m + 12000
- three-piece-suit: 6.5m + 18000
- overcoat: 4m + 10000
- daurasuruwal/kurta-suruwal: 3m + 8000

## Notes:
- Fabric tabs functional.
- Custom tailoring step-by-step complete.
- Admin login redirect fixed.
- Backend /api/fabrics routes ready; add seed data/gallery categories if needed.
- Minor TS warnings ignorable (JSX works).

To demo: 
1. Login admin → /admin-dashboard → Fabrics tab → Add fabrics/images.
2. Login user → Dashboard → Fabrics tab (view), Custom Tailoring → flow.
