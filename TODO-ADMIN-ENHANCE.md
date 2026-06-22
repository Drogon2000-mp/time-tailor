# Admin Dashboard Enhancement TODO - APPROVED PLAN

**Backend:**
- [ ] Edit server/models/Appointment.js (add cancelReason field)
- [ ] Edit server/routes/appointments.js (add accept/reject endpoints, user cancel with reason)
- [ ] Extend server/routes/products.js (full CRUD forms ready)

**Frontend:**
- [ ] Rewrite client/src/pages/AdminDashboard.jsx:
  * Fix loading (setLoading(false) after fetches)
  * Independent dark theme/header
  * Tabs: Gallery (upload), Products (CRUD form), Appointments (list/accept), Orders, Notifications (counts)
  * Logout button prominent

**Followup Steps:**
- Run server/client
- Test admin add product/gallery/appointment accept
- User book appointment → cancel with reason

Next: Edit Appointment model/routes
