import { Link } from 'react-router-dom';
import '../pages/frontend.css'; // Use frontend styles for footer


function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <p>&copy; 2024 Time Tailor. All rights reserved. | info@timetailor.com | +977 984-123-4567</p>
        <div className="footer-links">
          <Link to="/dashboard">Dashboard</Link> | 
          <Link to="/gallery">Gallery</Link> | 
          <Link to="/services">Services</Link> | 
          <Link to="/profile">Profile</Link>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

