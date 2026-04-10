import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';



function PlaceOrder() {
  const [formData, setFormData] = useState({
    items: [{
      serviceType: 'suit',
      serviceName: 'Custom Suit',
      galleryImage: null,
      fabric: { name: '', color: '', pricePerMeter: 0 },
      measurements: {},
      itemPrice: 0,
      quantity: 1
    }],
    subtotal: 0,
    total: 0,
    specialInstructions: '',
    phone: ''
  });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [selectedDesign, setSelectedDesign] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserProfile(token);
      fetchGallery();
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const fetchUserProfile = async (token) => {
    try {
      const response = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setUser(response.data.data);
        setFormData(prev => ({ ...prev, phone: response.data.data.phone || '' }));
      }
    } catch (err) {
      toast.error('Failed to load profile');
      navigate('/login');
    }
  };

  const fetchGallery = async () => {
    try {
      const res = await axios.get('/api/gallery');
      setGalleryImages(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load gallery');
    }
  };

  const handleDesignSelect = (image) => {
    setSelectedDesign(image);
    const itemPrice = image.category === 'suit' ? 500 : image.category === 'shirt' ? 150 : 200;
    setFormData(prev => ({
      ...prev,
      items: [{
        ...prev.items[0],
        galleryImage: image,
        serviceName: `${image.category.charAt(0).toUpperCase() + image.category.slice(1)} Design`,
        itemPrice
      }],
      subtotal: itemPrice,
      total: itemPrice
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'fabric.name' || name === 'fabric.color' || name === 'phone' || name === 'specialInstructions') {
      const field = name.split('.')[1] || name;
      if (name === 'phone') {
        setFormData(prev => ({ ...prev, phone: value }));
      } else if (name === 'specialInstructions') {
        setFormData(prev => ({ ...prev, specialInstructions: value }));
      } else if (name === 'fabric.name') {
        setFormData(prev => ({ 
          ...prev, 
          items: [{ ...prev.items[0], fabric: { ...prev.items[0].fabric, name: value } }] 
        }));
      } else if (name === 'fabric.color') {
        setFormData(prev => ({ 
          ...prev, 
          items: [{ ...prev.items[0], fabric: { ...prev.items[0].fabric, color: value } }] 
        }));
      }
    } else if (name.startsWith('measurements.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        items: [{ ...prev.items[0], measurements: { ...prev.items[0].measurements, [field]: value } }]
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        items: formData.items,
        subtotal: formData.subtotal,
        total: formData.total,
        specialInstructions: formData.specialInstructions,
        laborCost: 100,
        advance: 0
      };
      const response = await axios.post('/api/orders', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        toast.success('Order placed! Admin will contact via WhatsApp.');
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    }
    setLoading(false);
  };

  return (
    <div className="place-order-page">
      <div className="dashboard-content" style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
        <div className="dashboard-card">
          <h2>Place Order</h2>
          <p>Select design, fabric/color, estimate price. Admin will contact via WhatsApp to confirm.</p>
          
          <div className="form-section">
            <h3>Select Design from Gallery</h3>
            <div className="gallery-grid" style={{ maxHeight: '300px', overflow: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              {galleryImages.slice(0,12).map(img => (
                <div key={img._id} className="gallery-item" onClick={() => handleDesignSelect(img)}>
                  <img src={img.imageUrl} alt={img.title} />
                  <p>{img.title}</p>
                </div>
              ))}
            </div>
            {selectedDesign && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0f8ff', borderRadius: '8px' }}>
                <strong>Selected: {selectedDesign.title} (${formData.total})</strong>
              </div>
            )}
          </div>

          {selectedDesign && (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-row">
                <input name="fabric.name" placeholder="Fabric (e.g., Wool)" value={formData.items[0].fabric.name} onChange={handleInputChange} required />
                <input name="fabric.color" placeholder="Color (e.g., Navy)" value={formData.items[0].fabric.color} onChange={handleInputChange} required />
              </div>
              <input name="phone" placeholder="WhatsApp Phone (+1...)" value={formData.phone} onChange={handleInputChange} required />
              <textarea name="specialInstructions" placeholder="Special notes/measurements" value={formData.specialInstructions} onChange={handleInputChange} rows="3" className="auth-input" />
              <input name="measurements.chest" placeholder="Chest (inches)" type="number" step="0.1" onChange={handleInputChange} className="auth-input" />
              <div className="form-row">
                <input name="measurements.waist" placeholder="Waist" type="number" step="0.1" onChange={handleInputChange} className="auth-input" />
                <input name="measurements.length" placeholder="Length" type="number" step="0.1" onChange={handleInputChange} className="auth-input" />
              </div>
              <p><strong>Est. Total: ${formData.total.toFixed(2)}</strong> (Admin will confirm price)</p>
              <button type="submit" disabled={loading || !selectedDesign} className="book-btn">
                {loading ? 'Submitting...' : 'Place Order & Await WhatsApp'}
              </button>
            </form>
          )}
        </div>
      </div>
<style jsx>{`
        .form-section { margin: 2rem 0 }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        @media (max-width: 768px) { .form-row { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}

export default PlaceOrder;

