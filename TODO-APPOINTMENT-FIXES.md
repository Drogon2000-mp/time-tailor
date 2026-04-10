# Appointment System Debug & Fixes TODO

## Current Status
✅ Backend routes/model fully functional & integrated  
✅ Frontend booking/listing/admin UI complete  
✅ User model refs, Service population, proxy OK  
❌ CRITICAL: Date mutation bug in slot availability  
❌ Minor: Phone regex double-escaped in model  

## Step-by-Step Plan (Approved)

### 1. ✅ Fix date mutation in server/routes/appointments.js
- Clone date object before setHours()
- Both GET /slots/available and admin /admin/all

### 2. ✅ Fix phone regex in server/models/Appointment.js
- Change `/^(9|98)\\d{8}$/` → `/(9|98)\d{8}/`

### 3. [Optional] Add cancel button to Dashboard.jsx appointments
- Use existing PUT /:id/cancel endpoint

### 4. ✅ Fixed booking 400 - route phone regex unescaped (9841060952 now ✓)
**Progress: 3/5 complete**

### 4. Test Flow
```
cd server && npm start
# Browser: BookAppointment → slots → book → Dashboard → Admin approve
```

### 5. Verify
- Slots show correct availability  
- Booking succeeds, appears in lists  
- Admin status updates reflect instantly  
- User cancel works  

**Progress: 0/5 complete**
