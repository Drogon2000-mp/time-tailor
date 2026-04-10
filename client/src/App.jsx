import { StrictMode, createContext, useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

import { GoogleOAuthProvider } from '@react-oauth/google';

import 'react-toastify/dist/ReactToastify.css';
import 'react-datepicker/dist/react-datepicker.css';
import Login from './pages/Login.jsx';
import Signup from './pages/signup.jsx';
import PublicLanding from './pages/PublicLanding.jsx';
import ProtectedDashboard from './pages/ProtectedDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import PlaceOrder from './pages/PlaceOrder.jsx';
import CustomTailoring from './pages/CustomTailoring.jsx';
import Profile from './pages/Profile.jsx';
import Services from './pages/Services.jsx';
import Gallery from './pages/Gallery.jsx';
import BookAppointment from './pages/BookAppointment.jsx';
import Cart from './pages/Cart.jsx';
import ProductDetail from './pages/ProductDetail.jsx';


import './App.css'


// User Context
export const UserContext = createContext();

function AppContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && (location.pathname === '/dashboard' || location.pathname === '/profile')) {
      (async () => {
        try {
          const response = await fetch('/api/auth/me', {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          const data = await response.json();
          if (response.ok && data.success) {
            setUser(data.data);
          } else {
            localStorage.removeItem('token');
          }
        } catch (err) {
          localStorage.removeItem('token');
        } finally {
          setLoading(false);
        }
      })();
    } else {
      setLoading(false);
    }
  }, [location.pathname]);

  const showHeader = !location.pathname.startsWith('/admin-dashboard') && !['/login', '/signup'].includes(location.pathname);

  if (loading) return <div className="loading">Loading...</div>;


  return (
    <>
      <Routes>


        <Route path="/" element={<PublicLanding />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<ProtectedDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/place-order" element={<PlaceOrder />} />
        <Route path="/custom-tailoring" element={<CustomTailoring />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/services" element={<Services />} />
        <Route path="/measurements" element={<Profile />} />
        <Route path="/book-appointment" element={<BookAppointment />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />

      </Routes>

      {/* Footer removed from all pages */}

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

    </>
  );
}

function App() {
  return (
    <StrictMode>

<GoogleOAuthProvider clientId="your-google-client-id.googleusercontent.com">

        <Router>
          <AppContent />
        </Router>
      </GoogleOAuthProvider>
    </StrictMode>
  );
}

export default App;

