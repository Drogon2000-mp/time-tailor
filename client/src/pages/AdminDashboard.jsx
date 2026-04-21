import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './admin-dashboard.css';

function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [galleryImages, setGalleryImages] = useState([]);
  const [products, setProducts] = useState([]);
  const [fabrics, setFabrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadData, setUploadData] = useState({ title: '', category: 'suit', imagePreview: null });
  // Fabric form state
  const [fabricForm, setFabricForm] = useState({
    name: '',
    category: 'suit',
    meterPrice: '',
    imagePreview: null
  });
  const [fabricFile, setFabricFile] = useState(null);
  const [uploadingFabric, setUploadingFabric] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState(null);
  
  // Product form state
  const [showProductModal, setShowProductModal] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'suit',
    basePrice: '',
    sizes: ['S', 'M', 'L', 'XL'],
    description: '',
    images: [],
    stock: 10
  });
  const [productImages, setProductImages] = useState([]);
  const [uploadingProduct, setUploadingProduct] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // API Base URL
  const API_BASE = 'http://localhost:5000/api';

  // Fetch all data based on active tab
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchUser();
  }, [token, navigate]);

  useEffect(() => {
    if (user?.role === 'admin') {
      if (activeTab === 'orders') fetchOrders();
      if (activeTab === 'appointments') fetchAppointments();
      if (activeTab === 'gallery') fetchGallery();
      if (activeTab === 'products') fetchProducts();
      if (activeTab === 'fabrics') fetchFabrics();
    }
  }, [activeTab, user]);

  const fetchUser = async () => {
    try {
      const res = await axios.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data.data);
      setLoading(false);
      if (res.data.data.role !== 'admin') {
        toast.error('Admin access required');
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error('Authentication failed');
      localStorage.removeItem('token');
      navigate('/login');
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API_BASE}/orders/admin/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load orders');
    }
  };

  const fetchAppointments = async () => {
    try {
      const res = await axios.get(`${API_BASE}/appointments/admin/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppointments(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load appointments');
    }
  };

  const fetchGallery = async () => {
    try {
      const res = await axios.get(`${API_BASE}/gallery/admin/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGalleryImages(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load gallery');
    }
  };

  const fetchFabrics = async () => {
    try {
      const res = await axios.get(`${API_BASE}/fabrics/admin/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFabrics(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load fabrics');
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/products/admin/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load products');
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE}/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch {}
    localStorage.removeItem('token');
    navigate('/');
  };

  // Order Management
  const updateOrderStatus = async (orderId, status) => {
    try {
      await axios.put(`${API_BASE}/orders/${orderId}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Order status updated to ${status}`);
      fetchOrders();
    } catch (err) {
      toast.error('Update failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const cancelOrder = async (orderId, reason) => {
    if (!reason) {
      toast.error('Please provide a reason for cancellation');
      return;
    }
    try {
      await axios.put(`${API_BASE}/orders/${orderId}/cancel`, { reason }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Order cancelled successfully');
      setShowCancelModal(false);
      setCancelReason('');
      setCancelOrderId(null);
      fetchOrders();
    } catch (err) {
      toast.error('Failed to cancel order: ' + (err.response?.data?.message || err.message));
    }
  };

  // Appointment Management
  // Fixed appointment status management using correct backend endpoint
  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    if (!newStatus) {
      toast.error('Please select a status');
      return;
    }
    try {
      const response = await axios.put(`${API_BASE}/appointments/${appointmentId}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Appointment status updated to ${newStatus}`);
      fetchAppointments();
    } catch (err) {
      toast.error('Failed to update status: ' + (err.response?.data?.message || err.message));
    }
  };

  const cancelAppointment = async (appointmentId, reason) => {
    if (!reason) {
      toast.error('Please provide a reason for cancellation');
      return;
    }
    try {
      await axios.put(`${API_BASE}/appointments/${appointmentId}/status`, { 
        status: 'cancelled',
        cancelReason: reason 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Appointment cancelled');
      fetchAppointments();
    } catch (err) {
      toast.error('Failed to cancel appointment: ' + (err.response?.data?.message || err.message));
    }
  };

  // Gallery Management
  const uploadGalleryImage = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      toast.error('Please select an image');
      return;
    }
    if (!uploadData.title) {
      toast.error('Please enter an image title');
      return;
    }
    
    setUploading(true);
    try {
      // Step 1: Upload image only
      const formData = new FormData();
      formData.append('image', uploadFile);
      
      const uploadRes = await axios.post(`${API_BASE}/gallery/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (!uploadRes.data.success || !uploadRes.data.data.imageUrl) {
        throw new Error('Upload failed or no image URL returned');
      }

      const imageUrl = uploadRes.data.data.imageUrl;

      // Step 2: Create gallery record (1-button)
      const createRes = await axios.post(`${API_BASE}/gallery`, {
        title: uploadData.title,
        category: uploadData.category,
        imageUrl: imageUrl
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (createRes.data.success) {
        toast.success('Image added to gallery!');
        setUploadFile(null);
        setUploadData({ title: '', category: 'suit', imagePreview: null });
        fetchGallery();
      } else {
        toast.error('Image uploaded but failed to save to gallery');
      }
    } catch (err) {
      console.error('Gallery upload error:', err);
      toast.error('Upload failed: ' + (err.response?.data?.message || err.message));
    }
    setUploading(false);
  };


  const uploadFabricImage = async (e) => {
    e.preventDefault();
    if (!fabricFile) {
      toast.error('Please select an image');
      return;
    }
    if (!fabricForm.name || !fabricForm.meterPrice) {
      toast.error('Please fill name and meter price');
      return;
    }
    
    setUploadingFabric(true);
    try {
      const formData = new FormData();
      formData.append('image', fabricFile);
      
      const uploadRes = await axios.post(`${API_BASE}/fabrics/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (!uploadRes.data.success || !uploadRes.data.data.imageUrl) {
        throw new Error('Upload failed');
      }

      const imageUrl = uploadRes.data.data.imageUrl;

      const createRes = await axios.post(`${API_BASE}/fabrics`, {
    name: fabricForm.name,
    category: fabricForm.category,
    pricePerMeter: parseInt(fabricForm.meterPrice, 10),
    image: imageUrl,
    color: "Default",
    colorHex: "#000000"
}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (createRes.data.success) {
        toast.success('Fabric added!');
        setFabricFile(null);
        setFabricForm({ name: '', category: 'suit', meterPrice: '', imagePreview: null });
        fetchFabrics();
      }
    } catch (err) {
      toast.error('Upload failed: ' + (err.response?.data?.message || err.message));
    }
    setUploadingFabric(false);
  };

  const deleteFabric = async (fabricId) => {
    if (window.confirm('Delete this fabric?')) {
      try {
        await axios.delete(`${API_BASE}/fabrics/${fabricId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Fabric deleted');
        setFabrics(prev => prev.filter(f => f._id !== fabricId));
      } catch (err) {
        toast.error('Delete failed');
      }
    }
  };

  const handleFabricFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setFabricFile(file);
      setFabricForm({
        ...fabricForm,
        imagePreview: URL.createObjectURL(file)
      });
    }
  };

  const deleteGalleryImage = async (imageId) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      try {
        await axios.delete(`${API_BASE}/gallery/${imageId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Image deleted');
        // Remove from state immediately
        setGalleryImages(prevImages => prevImages.filter(img => img._id !== imageId));
        fetchGallery(); // Refresh to ensure consistency
      } catch (err) {
        toast.error('Failed to delete image: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Product Management - FIXED
  const createProduct = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!productForm.name || !productForm.basePrice) {
      toast.error('Please fill required fields (Name and Base Price)');
      return;
    }

    if (productForm.basePrice <= 0) {
      toast.error('Base price must be greater than 0');
      return;
    }

    setUploadingProduct(true);
    
    try {
      let imageUrls = [];
      
      // Upload images if any (1-button)
      if (productImages.length > 0) {
        toast.info(`Uploading ${productImages.length} image(s)...`);
        
        for (let i = 0; i < productImages.length; i++) {
          const img = productImages[i];
          const formData = new FormData();
          formData.append('image', img);
          
          const uploadRes = await axios.post(`${API_BASE}/products/upload`, formData, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          });
          
          if (uploadRes.data.success && uploadRes.data.data.imageUrl) {
        imageUrls.push({ url: uploadRes.data.data.imageUrl, alt: `${productForm.name} ${i+1}` });
          }
        }
      }

      // Prepare product data (match model: images [{url, alt}])
      const productData = {
        name: productForm.name,
        category: (() => {
          if (productForm.category === 'suit') return 'complete-suit';
          if (['shirt', 'trouser', 'overcoat', 'waistcoat'].includes(productForm.category)) return 'suit-pant-shirt-overcoat';
          if (productForm.category === 'daura') return 'daura-suruwal';
          if (productForm.category === 'kurta') return 'kurta-suruwal';
          return productForm.category;
        })(),

        basePrice: Number(productForm.basePrice),
        stock: parseInt(productForm.stock),
        description: productForm.description || '',
        sizes: Array.isArray(productForm.sizes) ? productForm.sizes : productForm.sizes.split(',').map(s => ({ size: s.trim(), available: 10 })),
        images: imageUrls,
        available: true
      };

      const createRes = await axios.post(`${API_BASE}/products`, productData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (createRes.data.success || createRes.data.data) {
        toast.success('Product created successfully!');
        
        // Reset form
        setShowProductModal(false);
setProductForm({
          name: '',
          category: 'complete-suit',
          basePrice: '',
          sizes: ['S', 'M', 'L', 'XL'],
          description: '',
          images: [],
          stock: 10
        });

        setProductImages([]);
        
        // Refresh products list
        await fetchProducts();
      } else {
        toast.error(createRes.data.message || 'Failed to create product');
      }
    } catch (err) {
      console.error('Product creation error:', err);
      toast.error('Failed to create product: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploadingProduct(false);
    }
  };


  const deleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      try {
        await axios.delete(`${API_BASE}/products/${productId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Product deleted successfully');
        // Remove from state immediately
        setProducts(prevProducts => prevProducts.filter(p => p._id !== productId));
        fetchProducts(); // Refresh to ensure consistency
      } catch (err) {
        toast.error('Failed to delete product: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      setUploadFile(file);
      setUploadData({
        ...uploadData,
        imagePreview: URL.createObjectURL(file)
      });
    } else {
      toast.error('Please select a valid image file');
    }
  };

  const handleProductImages = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length !== files.length) {
      toast.error('Some files are not images and were skipped');
    }
    
    if (validFiles.length > 5) {
      toast.error('Maximum 5 images allowed');
      setProductImages(validFiles.slice(0, 5));
    } else {
      setProductImages(validFiles);
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading Admin Dashboard...</p>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="admin-dashboard">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <header className="admin-header">
        <div className="admin-header-content">
          <h1 className="admin-title">👑 Admin Dashboard</h1>
          <p className="admin-welcome">Welcome, {user?.name}</p>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          📦 Orders ({orders.filter(o => o.status === 'pending').length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'appointments' ? 'active' : ''}`}
          onClick={() => setActiveTab('appointments')}
        >
          📅 Appointments ({appointments.filter(a => a.status === 'pending').length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'gallery' ? 'active' : ''}`}
          onClick={() => setActiveTab('gallery')}
        >
          🖼️ Gallery ({galleryImages.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'fabrics' ? 'active' : ''}`}
          onClick={() => setActiveTab('fabrics')}
        >
          🧵 Fabrics ({fabrics.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          🛍️ Products ({products.length})
        </button>
      </div>

      <div className="admin-content">
        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="admin-card">
            <h2 className="card-title">📋 All Orders</h2>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{textAlign: 'center'}}>No orders found</td>
                    </tr>
                  ) : (
                    orders.map(order => (
                      <tr key={order._id}>
                        <td className="order-id">{order.orderNumber?.slice(-8) || order._id.slice(-8)}</td>
                        <td>
                          <div className="customer-info">
                            <strong>{order.user?.name}</strong>
                            <small>{order.user?.email}</small>
                            <small>{order.user?.phone}</small>
                          </div>
                        </td>
                        <td>
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="order-item">
                              {item.name} x{item.quantity}
                            </div>
                          ))}
                        </td>
                        <td className="order-total">₹{order.total?.toLocaleString()}</td>
                        <td>
                          <span className={`status-badge status-${order.status}`}>
                            {order.status}
                          </span>
                        </td>
                        <td>
                          <select
                            className="status-select"
                            onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                            value={order.status}
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="completed">Completed</option>
                          </select>
                          {order.status !== 'cancelled' && order.status !== 'delivered' && order.status !== 'completed' && (
                            <button
                              className="btn-cancel"
                              onClick={() => {
                                setCancelOrderId(order._id);
                                setShowCancelModal(true);
                              }}
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div className="admin-card">
            <h2 className="card-title">📅 Appointment Management</h2>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Service</th>
                    <th>Date/Time</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{textAlign: 'center'}}>No appointments found</td>
                    </tr>
                  ) : (
                    appointments.map(apt => (
                      <tr key={apt._id}>
                        <td>
                          <div className="customer-info">
                            <strong>{apt.user?.name || 'Guest'}</strong>
                            <div style={{marginTop: '0.25rem'}}>
<strong><a href={'tel:' + (apt.phone || apt.user?.phone)} style={{color: 'inherit', textDecoration: 'none'}}>📱 {apt.phone || apt.user?.phone}</a></strong>
                            </div>
                            <small>{apt.user?.email || apt.email}</small>
                          </div>
                        </td>
                        <td>{apt.type || 'General'}</td>
                        <td>{new Date(apt.date).toLocaleDateString()} {apt.time}</td>
                        <td>{apt.location?.address || 'N/A'}</td>
                        <td>
                          <span className={`status-badge status-${apt.status}`}>
                            {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                          </span>
                          {apt.cancelReason && (
                            <small className="cancel-reason">({apt.cancelReason})</small>
                          )}
                        </td>
                        <td className="action-buttons">
                          {apt.status === 'pending' && (
                            <select 
                              className="status-select"
                              onChange={(e) => updateAppointmentStatus(apt._id, e.target.value)}
                              defaultValue="pending"
                            >
                              <option value="pending">Pending</option>
                              <option value="scheduled">Accept/Schedule</option>
                              <option value="rejected">Reject</option>
                            </select>
                          )}
                          {apt.status === 'scheduled' && (
                            <>
                              <select 
                                className="status-select"
                                onChange={(e) => updateAppointmentStatus(apt._id, e.target.value)}
                                defaultValue="scheduled"
                              >
                                <option value="scheduled">Scheduled</option>
                                <option value="completed">Mark Complete</option>
                                <option value="cancelled">Cancel</option>
                              </select>
                              <button
                                className="btn-cancel small"
                                onClick={() => {
                                  const reason = prompt('Reason for cancellation:');
                                  if (reason) cancelAppointment(apt._id, reason);
                                }}
                              >
                                Cancel w/ Reason
                              </button>
                            </>
                          )}
                          {apt.status === 'completed' && (
                            <span className="completed-label">✓ Completed</span>
                          )}
                          {apt.status === 'cancelled' || apt.status === 'rejected' && (
                            <span className="cancelled-label">✗ {apt.status.toUpperCase()}</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Gallery Tab - Fixed visibility */}
        {activeTab === 'gallery' && (
          <div className="admin-card">
            <h2 className="card-title">🖼️ Gallery Management</h2>
            
            <form className="upload-form" onSubmit={uploadGalleryImage}>
              <div className="upload-area">
                <input
                  type="file"
                  id="gallery-image"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="file-input"
                  hidden
                />
                <label htmlFor="gallery-image" className="upload-label">
                  {uploadData.imagePreview ? (
                    <img src={uploadData.imagePreview} alt="Preview" className="upload-preview" />
                  ) : (
                    <div className="upload-placeholder">
                      📸 Click to select image
                    </div>
                  )}
                </label>
                
                <input
                  type="text"
                  placeholder="Image title"
                  value={uploadData.title}
                  onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                  className="form-input"
                  required
                />
                
                <select
                  value={uploadData.category}
                  onChange={(e) => setUploadData({ ...uploadData, category: e.target.value })}
                  className="form-input"
                >
                  <option value="suit">Suit</option>
                  <option value="shirt">Shirt</option>
                  <option value="trouser">Trouser</option>
                  <option value="overcoat">Overcoat</option>
                  <option value="waistcoat">Waistcoat</option>
                  <option value="daura">Daura Suruwal</option>
                  <option value="kurta">Kurta Suruwal</option>
                  <option value="jwari">Jwari Coat</option>
                </select>
                
                <button type="submit" className="btn-primary" disabled={uploading || !uploadFile}>
                  {uploading ? 'Uploading...' : 'Upload to Gallery'}
                </button>
              </div>
            </form>

            <div className="gallery-grid-admin">
              {galleryImages.length === 0 ? (
                <p style={{textAlign: 'center', gridColumn: '1/-1'}}>No images in gallery. Upload your first image!</p>
              ) : (
                galleryImages.map(img => (
                  <div key={img._id} className="gallery-item-admin">
                    <img src={img.imageUrl} alt={img.title} onError={(e) => {
                      e.target.src = '/placeholder-image.jpg';
                      e.target.onerror = null;
                    }} />
                    <div className="gallery-item-info">
                      <span className="gallery-title">{img.title}</span>
                      <span className="gallery-category">{img.category}</span>
                    </div>
                    <button
                      className="delete-btn"
                      onClick={() => deleteGalleryImage(img._id)}
                      title="Delete image"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Fabrics Tab */}
        {activeTab === 'fabrics' && (
          <div className="admin-card">
            <h2 className="card-title">🧵 Fabric Management</h2>
            
            <form className="upload-form" onSubmit={uploadFabricImage}>
              <div className="upload-area">
                <input
                  type="file"
                  id="fabric-image"
                  accept="image/*"
                  onChange={handleFabricFileSelect}
                  className="file-input"
                  hidden
                />
                <label htmlFor="fabric-image" className="upload-label">
                  {fabricForm.imagePreview ? (
                    <img src={fabricForm.imagePreview} alt="Preview" className="upload-preview" />
                  ) : (
                    <div className="upload-placeholder">
                      🧵 Select fabric image
                    </div>
                  )}
                </label>
                
                <input
                  type="text"
                  placeholder="Fabric name"
                  value={fabricForm.name}
                  onChange={(e) => setFabricForm({ ...fabricForm, name: e.target.value })}
                  className="form-input"
                  required
                />
                
                <input
                  type="number"
                  placeholder="Price per meter (NPR)"
                  value={fabricForm.meterPrice}
                  onChange={(e) => setFabricForm({ ...fabricForm, meterPrice: e.target.value })}
                  className="form-input"
                  required
                  min="0"
                />
                
                <select
                  value={fabricForm.category}
                  onChange={(e) => setFabricForm({ ...fabricForm, category: e.target.value })}
                  className="form-input"
                >
                  <option value="suit">Suit</option>
                  <option value="shirt">Shirt</option>
                  <option value="trouser">Pant</option>
                  <option value="overcoat">Overcoat</option>
                  <option value="daura">Daura Suruwal</option>
                  <option value="kurta">Kurta Suruwal</option>
                  <option value="wool">Wool</option>
                  <option value="cotton">Cotton</option>
                  <option value="silk">Silk</option>
                  <option value="linen">Linen</option>
                  <option value="blend">Blend</option>
                  <option value="velvet">Velvet</option>
                </select>
                
                <button type="submit" className="btn-primary" disabled={uploadingFabric || !fabricFile}>
                  {uploadingFabric ? 'Uploading...' : 'Add Fabric'}
                </button>
              </div>
            </form>

            <div className="gallery-grid-admin">
              {fabrics.length === 0 ? (
                <p style={{textAlign: 'center', gridColumn: '1/-1'}}>No fabrics. Add first!</p>
              ) : (
                fabrics.map(fabric => (
                  <div key={fabric._id} className="gallery-item-admin">
<img src={fabric.image || fabric.imageUrl || fabric.image?.url} alt={fabric.name} />
                    <div className="gallery-item-info">
                      <span>{fabric.name}</span>
                      <span>रु. {parseInt(fabric.pricePerMeter || 0, 10).toLocaleString()}/m</span>
                      <span>{fabric.category}</span>
                    </div>
                    <button className="delete-btn" onClick={() => deleteFabric(fabric._id)}>
                      🗑️
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="admin-card">
            <div className="card-header">
              <h2 className="card-title">🛍️ Product Management</h2>
              <button className="btn-primary" onClick={() => setShowProductModal(true)}>
                + Add New Product
              </button>
            </div>

            <div className="products-grid-admin">
              {products.length === 0 ? (
                <p style={{textAlign: 'center', gridColumn: '1/-1'}}>No products found. Create your first product!</p>
              ) : (
                products.map(product => (
                  <div key={product._id} className="product-card-admin">
                    {product.images && product.images.length > 0 ? (
                      <img src={product.images[0]?.url || product.images[0]} alt={product.name} className="product-image" onError={(e) => {
                        e.target.src = '/placeholder-product.jpg';
                        e.target.onerror = null;
                      }} />
                    ) : (
                      <div className="product-image-placeholder">📷 No Image</div>
                    )}
                    <div className="product-info">
                      <h3 className="product-name">{product.name}</h3>
                      <span className="product-category">{product.category}</span>
                      <p className="product-price"> रु. {product.basePrice?.toLocaleString('en-IN') || '0'}</p>
                      <div className="product-sizes">
                        {product.sizes?.map((size, idx) => (
                          <span key={idx} className="size-badge">{typeof size === 'object' ? size.size : size}</span>
                        ))}
                      </div>
                      <p className="product-stock">Stock: {product.stock} units</p>
                    </div>
                    <button
                      className="delete-btn"
                      onClick={() => deleteProduct(product._id)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Cancel Order</h3>
            <textarea
              placeholder="Reason for cancellation..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="form-textarea"
              rows="4"
              required
            />
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => {
                setShowCancelModal(false);
                setCancelReason('');
                setCancelOrderId(null);
              }}>
                Close
              </button>
              <button
                className="btn-danger"
                onClick={() => cancelOrder(cancelOrderId, cancelReason)}
                disabled={!cancelReason}
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showProductModal && (
        <div className="modal-overlay" onClick={() => setShowProductModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <h3>Add New Product</h3>
            <form onSubmit={createProduct}>
              <div className="form-row">
                <div className="form-group">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                <select
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  className="form-input"
                >
                  <option value="suit">Suit</option>
                  <option value="shirt">Shirt</option>
                  <option value="trouser">Trouser</option>
                  <option value="overcoat">Overcoat</option>
                  <option value="waistcoat">Waistcoat</option>
                  <option value="daura">Daura Suruwal</option>
                  <option value="kurta">Kurta Suruwal</option>
                  <option value="jwari">Jwari Coat</option>
                </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Base Price (NPR) *</label>
                  <input
                    type="number"
                    value={productForm.basePrice}
                    onChange={(e) => setProductForm({ ...productForm, basePrice: e.target.value })}
                    className="form-input"
                    required
                    min="0"
                    step="100"
                  />
                </div>
                <div className="form-group">
                  <label>Stock *</label>
                  <input
                    type="number"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    className="form-input"
                    required
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Sizes (comma separated)</label>
                <input
                  type="text"
                  value={Array.isArray(productForm.sizes) ? productForm.sizes.join(',') : productForm.sizes}
                  onChange={(e) => setProductForm({ ...productForm, sizes: e.target.value.split(',').map(s => s.trim()) })}
                  className="form-input"
                  placeholder="S, M, L, XL, XXL"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="form-textarea"
                  rows="3"
                  placeholder="Product description..."
                />
              </div>

              <div className="form-group">
                <label>Product Images (Max 5 images)</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleProductImages}
                  className="file-input"
                />
                {productImages.length > 0 && (
                  <div className="image-previews">
                    {productImages.map((img, idx) => (
                      <span key={idx} className="image-preview-label">
                        📷 {img.name} ({(img.size / 1024).toFixed(1)} KB)
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="modal-buttons">
                <button type="button" className="btn-cancel" onClick={() => {
                  setShowProductModal(false);
                  setProductImages([]);
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={uploadingProduct}>
                  {uploadingProduct ? 'Creating Product...' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
