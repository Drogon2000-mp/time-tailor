import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../pages/dashboard.css';

const Header = ({ user }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleProtectedNav = (path) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.info('Please login to access this feature');
      navigate('/login');
      return;
    }
    navigate(path);
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout', {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
    } catch (err) {
      console.log('Logout failed:', err);
    }
    localStorage.removeItem('token');
    navigate('/');
    toast.info('Logged out successfully');
  };

  if (!user) {
    return (
      <header className="dashboard-header">
        <div className="header-left">
          <Link to="/" className="logo" style={{color: 'white'}}>
            Time Tailor
          </Link>
          <nav className="header-nav">
            <Link to="/" className="nav-round-btn" title="Home">🏠</Link>
            <Link to="/gallery" className="nav-round-btn" title="Gallery">🖼️</Link>
            <Link to="/services" className="nav-round-btn" title="Services">⚙️</Link>
            <Link to="/catalog" className="nav-round-btn" title="Catalog">🛍️</Link>
          </nav>
        </div>
        <div className="header-right">
          <Link to="/login" className="login-btn">Login</Link>
          <Link to="/signup" className="signup-btn">Sign Up</Link>
        </div>
      </header>
    );
  }

  return (
    <header className="dashboard-header">
      <div className="header-left">
        <Link to="/dashboard" className="logo" style={{color: 'white'}}>
          Time Tailor
        </Link>
        <nav className="header-nav">
          <Link to="/dashboard" className="nav-round-btn" title="Dashboard">🏠</Link>
          <Link to="/gallery" className="nav-round-btn" title="Gallery">🖼️</Link>
          <button onClick={() => handleProtectedNav('/book-appointment')} className="nav-round-btn" title="Appointment">📅</button>
          <button onClick={() => handleProtectedNav('/custom-tailoring')} className="nav-round-btn" title="Custom Design">✂️</button>
          <Link to="/catalog" className="nav-round-btn" title="Products">🛍️</Link>
        </nav>
      </div>
      <div className="header-right">
        <div className="profile-dropdown" onClick={() => setDropdownOpen(!dropdownOpen)}>
          <img 
            src={user?.picture || '/default-avatar.png'} 
            alt="Profile" 
            className="profile-avatar"
          />
          <span>{user?.name?.split(' ')[0] || 'User'}</span>
          {dropdownOpen && (
            <div className="dropdown-menu">
              <Link to="/profile" className="dropdown-item">Edit Profile</Link>

              <button onClick={handleLogout} className="dropdown-item logout">Logout</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

