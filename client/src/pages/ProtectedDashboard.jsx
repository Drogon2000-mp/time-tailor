import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/api';
import { ToastContainer, toast } from 'react-toastify';

import 'react-toastify/dist/ReactToastify.css';
import '../components/HeroSlideShow.css';
import HeroSlideshow from '../components/HeroSlideshow.jsx';
import ProductCard from '../components/ProductCard.jsx';
import ProductModal from '../components/ProductModal.jsx';
import OrderDetailsModal from '../components/OrderDetailsModal.jsx'; // Ensure this is used if intended

import Cart from './Cart.jsx';
import './protected-dashboard-orders.css';

function ProtectedDashboard() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [galleryImages, setGalleryImages] = useState([]);
  const [services, setServices] = useState([]); // Initialize services state
  const [fabrics, setFabrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [orders, setOrders] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedGalleryImage, setSelectedGalleryImage] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    const success = params.get('success');
    if (tab === 'products') {
      setActiveTab('products');
    } else if (tab === 'orders') {
      setActiveTab('orders');
      if (success === 'true') {
        toast.success('Order placed successfully! You can track it here.');
      }
    }

    const fetchData = async () => {
      try {
        console.log("Fetching dashboard data...");
        // Use Promise.allSettled for better resiliency
        const results = await Promise.allSettled([ // Removed /api prefix from all calls
          api.get('/auth/me'), 
          api.get('/products'), 
          api.get('/appointments'), 
          api.get('/gallery'), 
          api.get('/services'), 
          api.get('/fabrics'), 
          api.get('/orders/my-orders') 
        ]);

        // Extract data or provide defaults for failures
        const userRes = results[0].status === 'fulfilled' ? results[0].value : null;
        const productsRes = results[1].status === 'fulfilled' ? results[1].value : { data: { data: [] } };
        const appointmentsRes = results[2].status === 'fulfilled' ? results[2].value : { data: { data: [] } };
        const galleryRes = results[3].status === 'fulfilled' ? results[3].value : { data: { data: [] } };
        const servicesRes = results[4].status === 'fulfilled' ? results[4].value : { data: { data: [] } };
        const fabricsRes = results[5].status === 'fulfilled' ? results[5].value : { data: { data: [] } };
        const ordersRes = results[6].status === 'fulfilled' ? results[6].value : { data: { data: [] } };
        
        console.log("Products API Response:", productsRes.data);

        const userData = userRes.data.data;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));

        // SET STATES FOR ALL FETCHED DATA
        setProducts(productsRes.data.data || []);
        setAppointments(appointmentsRes.data.data || []);
        setGalleryImages(galleryRes.data.data || []);
        setServices(servicesRes.data.data || []); // Set services state

        setFabrics(fabricsRes.data.data || []);
        setOrders(ordersRes.data.data || []);

        if (userData.role === 'admin') {
          navigate('/admin-dashboard');
          return;
        }
      } catch (err) {
        console.log('Dashboard data fetch failed:', err);
        if (err.response?.status === 401) {
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
      // Backend will clear the HttpOnly cookie
      await api.post('/auth/logout');
    } catch (err) {
      console.log('Logout failed:', err);
    }
    localStorage.removeItem('user');
    navigate('/');
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
                  <a href="https://wa.me/9841519933?text=Hi%20I%20want%20a%20custom%20design%20from%20Time%20Tailor" className="cta-button secondary" target="_blank" rel="noopener noreferrer">WhatsApp for Custom Design</a>
                </div>
              </div>
            </div>
          </div>
        );
      case 'gallery':
        return (
          <div className="dashboard-tab-content fade-in">
            <div className="container">
              <h2 className="section-title"></h2>
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
              <h2 className="section-title"></h2>
              
              <div style={{ marginBottom: '2rem' }}>
                <Link to="/book-appointment" className="cta-button">
                  + Book New Appointment
                </Link>
              </div>

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
              <h2 className="section-title"></h2>
              <div className="gallery-grid">
                {fabrics.length === 0 ? (
                  <p className="no-results">No fabrics available</p>
                ) : (
                  fabrics.map(fabric => (
                    <div key={fabric._id} className="gallery-item">
                      <img 
                        src={fabric.image || fabric.imageUrl || fabric.image?.url || '/placeholder-fabric.jpg'} 
                        alt={fabric.name} 
                      />
                      <div className="gallery-info">
                        <h3>{fabric.name}</h3>
                        <p>रु. {fabric.pricePerMeter?.toLocaleString()} / meter</p>
                        <p>रु. {Math.floor(Number(fabric.pricePerMeter || 0)).toLocaleString()}/m</p>
                        <p>{fabric.category}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );
      case 'products':
        return (
          <div className="dashboard-tab-content fade-in">
            <div className="container">
              <h2 className="section-title"></h2>
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
              <h2 className="section-title"></h2>
              <Cart />
            </div>
          </div>
        );
      case 'orders':
        return (
          <div className="dashboard-tab-content fade-in">
            <div className="container">
              <h2 className="section-title" style={{ textAlign: 'center', marginBottom: '2rem' }}></h2>

              {orders.length === 0 ? (
                <p className="no-results">No orders found.</p>
              ) : (
                <div className="my-orders-container">
                  {orders.map((order) => (
                    <div key={order._id || order.orderNumber} className="order-card">
                      <div className="order-header">
                        <div className="header-main">
                          <span className="order-id">Order #{order.orderNumber || order._id?.slice(-8).toUpperCase()}</span>
                          <span className="order-date">{order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</span>
                        </div>
                        <div className="header-status">
                          <span className={`order-status-badge status-${order.paymentStatus}`}>
                            {order.paymentStatus?.toUpperCase() || 'PENDING'}
                          </span>
                          <span className={`order-status-badge status-${order.status}`}>
                            {order.status?.toUpperCase() || 'PROCESSING'}
                          </span>
                        </div>
                        <div className="header-total">
                          Total: <strong>Rs. {order.total?.toLocaleString() || '0'}</strong>
                        </div>
                      </div>

                      <div className="order-product-list">
                        {Array.isArray(order.items) && order.items.length > 0 ? (
                          order.items.map((item, idx) => {
                            const productImageUrl = (item.image && item.image.trim()) 
                              ? item.image 
                              : '/images/product-placeholder.jpg';

                            return (
                              <div key={item._id || idx} className="order-product">
                                <div className="order-product-image">
                                  <img
                                    src={productImageUrl}
                                    alt={item.serviceName}
                                    onError={(e) => { e.target.src = '/placeholder.jpg'; }}
                                  />
                                </div>
                                <div className="order-product-details">
                                  <h4>{item.serviceName || 'Tailored Item'}</h4>
                                  <div className="product-meta">
                                    <div><strong>Size:</strong> {item.size || '-'} </div>
                                    <div><strong>Description:</strong> {item.description || 'No description'}</div>
                                    <div><strong>Qty:</strong> {item.quantity || 1}</div>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p>No items found.</p>
                        )}
                      </div>

                      <div className="order-footer">
                        <div className="delivery-section">
                          <h5>Delivery Information</h5>
                          <p><strong>{order.deliveryAddress?.fullName}</strong> • {order.deliveryAddress?.deliveryPhone}</p>
                          <p>{order.deliveryAddress?.address}, {order.deliveryAddress?.city}</p>
                          <p>{order.deliveryAddress?.district}, {order.deliveryAddress?.province} {order.deliveryAddress?.postalCode}</p>
                        </div>
                        <button
                          className="view-details-btn"
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowOrderDetails(true);
                          }}
                        >
                          View Full Details →
                        </button>
                      </div>
                      <div className="order-id-footer">
                        TX UUID: {order.transaction_uuid}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Inline CSS for the new order card layout
  return (
    <div className="dashboard-app">
      <style>{`
        .my-orders-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          margin-top: 20px;
          max-width: 850px;
          margin-left: auto;
          margin-right: auto;
        }
        .order-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          overflow: hidden;
          transition: transform 0.2s;
          border: 1px solid #eee;
        }
        .order-card:hover { transform: translateY(-3px); }
        .order-header {
          padding: 1rem 1.5rem;
          background: #fcfcfc;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .header-main { display: flex; flex-direction: column; }
        .order-id { font-weight: 800; color: #333; font-size: 1.1rem; }
        .order-date { color: #888; font-size: 0.9rem; }
        .order-status-badge {
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 700;
          margin-left: 8px;
        }
        .status-paid, .status-delivered, .status-completed { background: #d4edda; color: #155724; }
        .status-pending, .status-processing { background: #fff4e6; color: #fd7e14; }
        .status-failed, .status-cancelled { background: #f8d7da; color: #721c24; }
        .status-shipped { background: #e7f3ff; color: #007bff; }
        
        .order-product-list { padding: 0.5rem 1.5rem; }
        .order-product {
          display: flex;
          gap: 1.25rem;
          padding: 1rem 0;
          align-items: center;
          border-bottom: 1px dashed #eee;
        }
        .order-product:last-child { border-bottom: none; }
        .order-product-image {
          width: 100px;
          height: 100px;
          flex-shrink: 0;
        }
        .order-product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 10px;
        }
        .order-product-details h4 { margin: 0 0 5px 0; color: #333; font-size: 1.05rem; }
        .product-meta {
          display: flex;
          gap: 15px;
          font-size: 0.9rem;
          color: #666;
          align-items: center;
        }
        .product-price { font-weight: 700; color: #000; }
        
        .order-footer {
          padding: 1.25rem 1.5rem;
          background: #f9f9f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .delivery-section h5 { margin: 0 0 8px 0; color: #555; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 1px; }
        .delivery-section p { margin: 2px 0; font-size: 0.85rem; color: #666; }
        .view-details-btn {
          background: #000;
          color: white;
          border: none;
          padding: 8px 18px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .view-details-btn:hover { background: #333; }
        .order-id-footer {
          padding: 8px 1.5rem;
          font-size: 0.7rem;
          color: #ccc;
          border-top: 1px solid #f0f0f0;
          background: #fff;
        }

        @media (max-width: 768px) {
          .order-header { flex-direction: column; align-items: flex-start; }
          .order-footer { flex-direction: column; align-items: flex-start; }
          .order-product { flex-direction: column; gap: 0.5rem; }
          .order-product-image { width: 100%; height: 150px; }
          .header-status { margin-top: 5px; }
          .order-status-badge { margin-left: 0; margin-right: 8px; }
        }
      `}</style>

      <ToastContainer position="top-right" autoClose={3000} />
      
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
              className={`nav-link ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => setTab('products')}
            >
              Products
            </button>
            <button 
              className={`nav-link ${activeTab === 'cart' ? 'active' : ''}`}
              onClick={() => setTab('cart')}
            > 
              Cart
            </button>
            <button 
              className={`nav-link ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setTab('orders')}
            >
              {/* TASK 5: DASHBOARD MY ORDERS TAB */}
              My Orders
            </button>
          </nav>
          <div className="profile-section">
         <div className="profile-dropdown" onClick={() => setDropdownOpen(!dropdownOpen)}>
  {user?.picture && user.picture.trim() && (
    <img
      src={user.picture}
      alt="Profile"
      className="profile-picture-img"
    />
  )}
  <span>{user?.name?.split(' ')[0] || 'User'}</span>
</div>
            {dropdownOpen && (
              <div
                className="dropdown-menu"
                onClick={(e) => e.stopPropagation()}
              >
                <Link
                  to="/profile"
                  className="dropdown-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDropdownOpen(false);
                  }}
                >
                  Edit Profile
                </Link>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLogout();
                  }}
                  className="dropdown-item logout"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Order Details Modal (User) */}
      {showOrderDetails && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => {
            setShowOrderDetails(false);
            setSelectedOrder(null);
          }}
        />
      )}

      <main className="dashboard-main">
        {renderTabContent()}
      </main>


      <footer className="footer">
        <div className="container">
          <p>&copy; 2024 Time Tailor. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default ProtectedDashboard;
