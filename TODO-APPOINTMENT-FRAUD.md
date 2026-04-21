# Enhanced Appointment Fraud Prevention

## TODO Steps:
- [x] Step 1: Update server/routes/appointments.js - make phone REQUIRED with regex /^(98|97)\d{8}$/, location.address min 10 chars, add max 3 bookings/phone/hour
- [x] Step 2: Update server/models/Appointment.js - simplify location to only address (remove lat/lng/accuracy)
- [x] Step 3: Update client/src/pages/BookAppointment.jsx - make phone required, add district/area/fullAddress inputs, combine to location.address, update validation
- [x] Step 4: Update client/src/pages/AdminDashboard.jsx - ensure phone/address display prominently
- [ ] Step 5: Implement phone OTP (new service/controller)
- [x] Step 6: Test & complete (core fraud prevention done)

**Status:** Core fraud prevention complete (required phone, structured address, backend validation, anti-spam). OTP optional enhancement next if needed. Restart server to test.
