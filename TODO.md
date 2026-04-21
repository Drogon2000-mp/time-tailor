# Appointment Fraud Prevention Enhancements - TODO

## Plan Progress Tracker

### 1. [x] Create/Update TODO.md  
### 2. [x] Update client/src/pages/BookAppointment.jsx  
   - Added district/area/fullAddress to formData  
   - Updated phone label to REQUIRED  
   - Added address validation (district/area min3, fullAddress min5)  
   - Compute location.address before POST

### 3. [x] Update server/models/Appointment.js  
   - Added required: true to phone  
   - Updated regex to exact 98|97 +8 digits

### 4. [x] Update server/routes/appointments.js  
   - Made location.address REQUIRED (notEmpty)
   - Minor phone msg tweak

### 5. [x] Update client/src/pages/AdminDashboard.jsx  
   - Location column now shows address not notes  
   - Phone has click-to-call tel: link

### 6. [ ] Test changes

### 7. [ ] Attempt completion
   - Make phone field required: true with exact regex /^(98|97)\d{8}$/

### 4. [ ] Update server/routes/appointments.js
   - Make location.address REQUIRED in POST validation (remove optional)

### 5. [ ] Update client/src/pages/AdminDashboard.jsx
   - Change appointments table Location column from notes to location.address
   - Add tel: link to phone display

### 6. [ ] Test changes
   - Frontend form validation (phone/address errors)
   - Backend API tests (missing fields → 400, spam → 429)
   - Admin dashboard display

### 7. [ ] Attempt completion

**Status: All code changes complete. Tests pending.**

