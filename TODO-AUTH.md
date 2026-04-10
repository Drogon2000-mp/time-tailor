# MERN Authentication System Implementation Plan
**Status: 10/12**
1. ✅ server/package.json + google-auth-library
2. ✅ server/models/User.js + googleId/picture
3. ✅ server/routes/auth-google.js (Google route)
4. ✅ server/routes/auth.js + google subroute
5. ✅ Backend deps installed (google-auth-library)
6. ✅ Frontend deps installed (@react-oauth/google, axios)
7. ✅ client/src/pages/Signup.jsx (email/password + API)
8. ✅ client/src/pages/Login.jsx (email/password + Google button)
9. ✅ JWT localStorage storage
10. ✅ Dashboard.jsx updated (JWT auth)

## Information Gathered
- Backend ready: User model (bcrypt), auth routes (/register, /login), middleware/auth.js (JWT), server.js
- Missing: /api/auth/google, Google token verification
- Frontend: Simple Login.jsx (localStorage demo) - replace with API calls
- Missing deps: google-auth-library (backend), @react-oauth/google (frontend)
- User model: Add googleId, picture fields

## Plan (File Level)
1. **server/package.json**: Add "google-auth-library"
2. **server/models/User.js**: Add googleId, picture fields
3. **server/routes/auth.js**: Add POST /api/auth/google (verify ID token, find/create user, JWT)
4. **server/middleware/auth.js**: No change (JWT ready)
5. **client/package.json**: Add "@react-oauth/google", "axios"
6. **client/src/pages/Login.jsx**: Email/password + Google button, API calls
7. **client/src/pages/Signup.jsx**: Email/password + Google signup
8. **client/src/pages/Dashboard.jsx**: Use JWT for protected data
9. **client/src/App.jsx**: Add JWT storage/context if needed

## Dependent Files
- Backend: package.json, User.js, routes/auth.js
- Frontend: package.json, Login.jsx, Signup.jsx

## Followup Steps
1. npm install backend deps
2. npm install client deps  
3. Add GOOGLE_CLIENT_ID to server/.env
4. Test auth flows
5. Update frontend routing/context

Ready to proceed?
