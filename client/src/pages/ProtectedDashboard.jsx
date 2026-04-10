import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../components/heroSlideShow.css';

import HeroSlideshow from '../components/heroSlideShow.jsx';
import ProductCard from '../components/ProductCard.jsx';
import ProductModal from '../components/ProductModal.jsx';
import Cart from './Cart.jsx';

function ProtectedDashboard() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [appointments, setAppointments] = useState([]);
const [galleryImages, setGalleryImages] = useState([]);
  const [services, setServices] = useState([]);
  const [fabrics, setFabrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedGalleryImage, setSelectedGalleryImage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [userRes, productsRes, appointmentsRes, galleryRes, servicesRes, fabricsRes] = await Promise.all([
          axios.get('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/products'),
          axios.get('/api/appointments', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/gallery'),
          axios.get('/api/services'),
          axios.get('/api/fabrics') 
        ]);
        setUser(userRes.data.data);
        setUser(userRes.data.data);
        setProducts(productsRes.data.data || []);
        setAppointments(appointmentsRes.data.data || []);
        setGalleryImages(galleryRes.data.data || []);
        setServices(servicesRes.data.data || []);
        setFabrics(fabricsRes.data.data || []);
        const fetchedUser = userRes.data.data;
        setUser(fetchedUser);
        if (fetchedUser.role === 'admin') {
          navigate('/admin-dashboard');
          return;
        }
      } catch (err) {
        console.log('Dashboard data fetch failed:', err);
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const setTab = (tab) => {
    setActiveTab(tab);
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
  };

  // Navigate to product detail page
  const handleViewProduct = (productId) => {
    navigate(`/product/${productId}`);
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="dashboard-tab-content fade-in">
            <HeroSlideshow />
            <div className="dashboard-hero-content">
              <div className="container">
                <h1>Welcome, {user?.name || user?.email}!</h1>
                <p>Your tailoring dashboard</p>
                <div className="hero-buttons">
                  <button onClick={() => setTab('products')} className="cta-button prominent">
                    Browse Products
                  </button>
                  <Link to="/custom-tailoring" className="cta-button secondary">Custom Order</Link>
                </div>
              </div>
            </div>
          </div>
        );
      case 'gallery':
  return (
    <div className="dashboard-tab-content fade-in">
      <div className="container">
        <h2 className="section-title">Design Gallery</h2>
        <div className="gallery-grid">
          {galleryImages.length === 0 ? (
            <p className="no-results">No gallery images available</p>
          ) : (
            galleryImages.map(image => (
              <div 
                key={image._id} 
                className="gallery-item" 
                onClick={() => setSelectedGalleryImage({
                  ...image,
                  displayUrl: image.imageUrl || image.url || '/placeholder.jpg'
                })}
              >
                <img 
                  src={image.imageUrl || image.url || '/placeholder.jpg'} 
                  alt={image.title || image.caption || 'Gallery image'} 
                />
                {(image.title || image.caption) && (
                  <div className="gallery-info">
                    <h3>{image.title || image.caption}</h3>
                    {image.category && <p>{image.category}</p>}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        
        {/* Fullscreen Modal */}
        {selectedGalleryImage && (
          <div className="fullscreen-gallery-modal" onClick={() => setSelectedGalleryImage(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setSelectedGalleryImage(null)}>×</button>
              <img 
                src={selectedGalleryImage.displayUrl || selectedGalleryImage.imageUrl || selectedGalleryImage.url} 
                alt={selectedGalleryImage.title || selectedGalleryImage.caption} 
              />
              <div className="modal-info">
                <h3>{selectedGalleryImage.title || selectedGalleryImage.caption}</h3>
                {selectedGalleryImage.category && <p>{selectedGalleryImage.category}</p>}
                {selectedGalleryImage.description && <p>{selectedGalleryImage.description}</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

     case 'appointment':
  return (
    <div className="dashboard-tab-content fade-in">
      <div className="container">
        <h2 className="section-title">Appointments</h2>
        
        {/* Book Appointment Button */}
        <div style={{ marginBottom: '2rem' }}>
          <Link to="/book-appointment" className="cta-button">
            + Book New Appointment
          </Link>
        </div>

        {/* Appointments List */}
        <div className="dashboard-card">
          <h3>Your Appointments</h3>
          {appointments.length === 0 ? (
            <p>No appointments found. Book your first appointment!</p>
          ) : (
            <div className="appointments-list">
              {appointments.map(apt => (
                <div key={apt._id} className="appointment-item">
                  <div className="appointment-details">
                    <strong>
                      {new Date(apt.preferredDate || apt.date).toLocaleDateString()}
                    </strong>
                    {' at '}
                    <span>{apt.preferredTime || apt.time}</span>
                    <br />
                    <small>Type: {apt.serviceType || apt.type}</small>
                  </div>
                  <div className="appointment-status">
                    <span className={`status-badge ${apt.status}`}>
                      {apt.status || 'pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

      case 'fabrics':
        return (
          <div className="dashboard-tab-content fade-in">
            <div className="container">
              <h2 className="section-title">Fabrics</h2>
              <div className="gallery-grid">
                {fabrics.length === 0 ? (
                  <p className="no-results">No fabrics available</p>
                ) : (
                  fabrics.map(fabric => (
                    <div key={fabric._id} className="gallery-item">
                      <img 
                        src={fabric.image?.url || '/placeholder-fabric.jpg'} 
                        alt={fabric.name} 
                      />
                      <div className="gallery-info">
                        <h3>{fabric.name}</h3>
                        <p>रु. {fabric.pricePerMeter?.toLocaleString()} / meter</p>
                        <p>{fabric.category}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );
      case 'custom':
        return (
          <div className="dashboard-tab-content fade-in">
            <div className="container">
              <h2 className="section-title">Custom Design</h2>
              <div className="dashboard-grid">
                <div className="dashboard-card">
                  <h3>Available Services</h3>
                  {services.length === 0 ? (
                    <p>No services available</p>
                  ) : (
                    services.slice(0, 3).map(s => (
                      <div key={s._id} className="service-item">
                        <strong>{s.name}</strong> - NPR {(s.basePrice || s.price || 0).toLocaleString()}
                      </div>
                    ))
                  )}
                </div>
                <div className="quick-actions">
                  <Link to="/custom-tailoring" className="cta-button">Create Custom Order</Link>
                  <Link to="/profile" className="cta-button secondary">Update Measurements</Link>
                </div>
              </div>
            </div>
          </div>
        );
      case 'products':
  return (
    <div className="dashboard-tab-content fade-in">
      <div className="container">
        <h2 className="section-title">Featured Products</h2>
        <div className="products-grid">
          {products.length === 0 ? (
            <p className="no-results">No products available</p>
          ) : (
            products.map(product => (
              <ProductCard 
                key={product._id} 
                product={product} 
                onViewDetails={(productId) => setSelectedProduct(productId)}
              />
            ))
          )}
        </div>
        
        {/* Product Modal - Only shows when selectedProduct is not null */}
        {selectedProduct && (
          <ProductModal 
            productId={selectedProduct} 
            onClose={() => setSelectedProduct(null)} 
          />
        )}
      </div>
    </div>
  );

      case 'cart':
        return (
          <div className="dashboard-tab-content fade-in">
            <div className="container">
              <h2 className="section-title">Your Cart</h2>
              <Cart />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="dashboard-app">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Fixed Header */}
      <header className="header">
        <div className="nav-container">
          <div className="logo" onClick={() => setTab('home')} style={{ cursor: 'pointer' }}>
            Time Tailor
          </div>
          <nav className="nav">
            <button 
              className={`nav-link ${activeTab === 'home' ? 'active' : ''}`}
              onClick={() => setTab('home')}
            >

            </button>
            <button 
              className={`nav-link ${activeTab === 'gallery' ? 'active' : ''}`}
              onClick={() => setTab('gallery')}
            >
              Gallery
            </button>
            <button 
              className={`nav-link ${activeTab === 'fabrics' ? 'active' : ''}`}
              onClick={() => setTab('fabrics')}
            >
              Fabrics
            </button>
            <button 
              className={`nav-link ${activeTab === 'appointment' ? 'active' : ''}`}
              onClick={() => setTab('appointment')}
            >
              Appointment
            </button>
            <button 
              className={`nav-link ${activeTab === 'custom' ? 'active' : ''}`}
              onClick={() => setTab('custom')}
            >
              Custom Design
            </button>
            <button 
              className={`nav-link ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => setTab('products')}
            >
              Products
            </button>
            <button 
              className={`nav-link ${activeTab === 'cart' ? 'active' : ''}`}
              onClick={() => setTab('cart')}
            >
              🛒 Cart
            </button>
          </nav>
          <div className="profile-section">
            <div className="profile-dropdown" onClick={() => setDropdownOpen(!dropdownOpen)}>
              <img src={user?.picture || '/default-avatar.png'} alt="Profile" className="profile-avatar" />
              <span>{user?.name?.split(' ')[0] || 'User'}</span>
            </div>
            {dropdownOpen && (
              <div className="dropdown-menu">
                <Link to="/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>Edit Profile</Link>
                <Link to="/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>Upload Measurements</Link>
                <button onClick={handleLogout} className="dropdown-item logout">Logout</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area - Content swaps here */}
      <main className="dashboard-main">
        {renderTabContent()}
      </main>

      {/* Fixed Footer */}
      <footer className="footer">
        <div className="container">
          <p>&copy; 2024 Time Tailor. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default ProtectedDashboard;