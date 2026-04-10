import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { toast } from 'react-toastify';


function CustomTailoring() {
  const [step, setStep] = useState(0);
  const [garment, setGarment] = useState(null);
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [measurements, setMeasurements] = useState({});
  const [selectedFabric, setSelectedFabric] = useState(null);
  const [user, setUser] = useState(null);
  const [fabrics, setFabrics] = useState([]);
  const [galleryImages, setGalleryImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const garments = [
    { value: 'two-piece-suit', label: 'Two Piece Suit', category: 'suit', clothMeter: 5, labor: 12000, measKeys: ['chest', 'waist', 'shoulder', 'sleeve', 'length'] },
    { value: 'three-piece-suit', label: 'Three Piece Suit', category: 'suit', clothMeter: 6.5, labor: 18000, measKeys: ['chest', 'waist', 'shoulder', 'sleeve', 'length', 'waistcoatChest'] },
    { value: 'shirt', label: 'Shirt', category: 'shirt', clothMeter: 2.5, labor: 5000, measKeys: ['chest', 'waist', 'shoulder', 'sleeve', 'length'] },
    { value: 'pant', label: 'Pant', category: 'trouser', clothMeter: 2.5, labor: 4000, measKeys: ['waist', 'hip', 'thigh', 'knee', 'length'] },
    { value: 'overcoat', label: 'Overcoat', category: 'overcoat', clothMeter: 4, labor: 10000, measKeys: ['chest', 'waist', 'shoulder', 'sleeve', 'length'] },
    { value: 'daurasuruwal', label: 'Daura Suruwal', category: 'daura', clothMeter: 3, labor: 8000, measKeys: ['chest', 'waist', 'shoulder', 'sleeve', 'length'] },
    { value: 'kurta-suruwal', label: 'Kurta Suruwal', category: 'kurta', clothMeter: 3, labor: 8000, measKeys: ['chest', 'waist', 'shoulder', 'sleeve', 'length'] }
  ];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchInitialData(token);
    } else {
      toast.error('Please login to continue');
      navigate('/login');
    }
  }, [navigate]);

  const fetchInitialData = async (token) => {
    try {
      const [profileRes, fabricsRes, galleryRes] = await Promise.all([
        axios.get('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/fabrics'),
        axios.get('/api/gallery')
      ]);
      setUser(profileRes.data.data);
      setFabrics(fabricsRes.data.data || []);
      setGalleryImages(galleryRes.data.data || []);
    } catch (err) {
      console.error('Failed to load data:', err);
      toast.error('Failed to load data. Please refresh the page.');
    }
  };

  const currentGarment = garments.find(g => g.value === garment);
  const filteredDesigns = galleryImages.filter(img => img.category === currentGarment?.category);
  const totalCost = selectedFabric && currentGarment ? 
    (currentGarment.clothMeter * selectedFabric.meterPrice + currentGarment.labor) : 0;

  const handleGarmentSelect = (g) => {
    setGarment(g.value);
    // Prefill measurements from profile
    const userCatMeas = user?.measurements?.[g.category] || {};
    const meas = {};
    g.measKeys.forEach(key => {
      meas[key] = userCatMeas[key] || '';
    });
    setMeasurements(meas);
    setStep(1);
  };

  const handleDesignSelect = (design) => {
    setSelectedDesign(design);
    setStep(2);
  };

  const handleMeasurementChange = (field, value) => {
    setMeasurements(prev => ({ ...prev, [field]: value }));
  };

  const handleFabricSelect = (fabric) => {
    setSelectedFabric(fabric);
    setStep(4);
  };

  const handlePrev = () => setStep(prev => Math.max(0, prev - 1));
  const handleNext = () => {
    // Validation before moving to next step
    if (step === 1 && !selectedDesign) {
      toast.error('Please select a design');
      return;
    }
    if (step === 2) {
      // Validate measurements
      const missingFields = currentGarment.measKeys.filter(key => !measurements[key]);
      if (missingFields.length > 0) {
        toast.error(`Please fill in all measurements: ${missingFields.join(', ')}`);
        return;
      }
    }
    if (step === 3 && !selectedFabric) {
      toast.error('Please select a fabric');
      return;
    }
    setStep(prev => Math.min(5, prev + 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = {
        garmentType: garment,
        designImage: selectedDesign?._id || selectedDesign?.imageUrl,
        measurements: { [currentGarment.category]: measurements },
        fabric: selectedFabric?._id,
        total: totalCost,
        fit: 'regular',
        color: selectedFabric?.color || ''
      };
      const res = await axios.post('/api/custom-orders', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        toast.success(`Custom order submitted! Total: NPR ${totalCost.toLocaleString()}`);
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Submit failed:', err);
      toast.error(err.response?.data?.message || 'Failed to submit order');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="step-container">
            <h1 className="auth-title">Select Garment Type</h1>
            <p className="auth-subtitle">Choose the type of garment you want to customize</p>
            <div className="garments-grid">
              {garments.map(g => (
                <button 
                  key={g.value} 
                  onClick={() => handleGarmentSelect(g)} 
                  className="garment-card"
                >
                  <div className="garment-icon">👔</div>
                  <h3>{g.label}</h3>
                  <p className="garment-price">Labor: NPR {g.labor.toLocaleString()}</p>
                </button>
              ))}
            </div>
          </div>
        );
      
      case 1:
        return (
          <div className="step-container">
            <h1 className="auth-title">{currentGarment?.label} - Choose Design</h1>
            <p className="auth-subtitle">Select from gallery ({filteredDesigns.length} designs available)</p>
            {filteredDesigns.length === 0 ? (
              <div className="no-designs">
                <p>No designs available for this category yet.</p>
                <button onClick={handlePrev} className="auth-button">Go Back</button>
              </div>
            ) : (
              <div className="gallery-grid">
                {filteredDesigns.map(img => (
                  <div 
                    key={img._id} 
                    className={`gallery-item ${selectedDesign?._id === img._id ? 'selected' : ''}`} 
                    onClick={() => handleDesignSelect(img)}
                  >
                    <img src={img.imageUrl || img.url} alt={img.title} />
                    <div className="gallery-info">
                      <h3>{img.title || img.caption || 'Design'}</h3>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      
      case 2:
        return (
          <div className="step-container">
            <h1 className="auth-title">Enter Measurements (inches)</h1>
            <p className="auth-subtitle">For {currentGarment?.label} - These will be saved to your profile</p>
            <div className="measurements-grid">
              {currentGarment?.measKeys.map(key => (
                <div key={key} className="measurement-field">
                  <label>{key.charAt(0).toUpperCase() + key.slice(1)}:</label>
                  <input
                    placeholder={`Enter ${key} in inches`}
                    type="number"
                    step="0.1"
                    value={measurements[key] || ''}
                    onChange={(e) => handleMeasurementChange(key, e.target.value)}
                    className="auth-input"
                    required
                  />
                </div>
              ))}
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="step-container">
            <h1 className="auth-title">Select Fabric</h1>
            <p className="auth-subtitle">Choose from our premium fabric collection</p>
            <div className="fabrics-grid">
              {fabrics.map(fabric => (
                <div 
                  key={fabric._id} 
                  className={`fabric-card ${selectedFabric?._id === fabric._id ? 'selected' : ''}`} 
                  onClick={() => handleFabricSelect(fabric)}
                >
                  <img src={fabric.image?.url || '/placeholder-fabric.jpg'} alt={fabric.name} />
                  <div className="fabric-info">
                    <h3>{fabric.name}</h3>
                    <p className="fabric-category">{fabric.category}</p>
                    <p className="fabric-price">NPR {fabric.pricePerMeter?.toLocaleString()} / meter</p>
                    {fabric.color && <p className="fabric-color">Color: {fabric.color}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="step-container">
            <h1 className="auth-title">Order Summary</h1>
            <div className="order-summary">
              <div className="summary-section">
                <h3>Garment Details</h3>
                <p><strong>Type:</strong> {currentGarment?.label}</p>
                <p><strong>Fabric Required:</strong> {currentGarment?.clothMeter} meters</p>
                <p><strong>Labor Cost:</strong> NPR {currentGarment?.labor.toLocaleString()}</p>
              </div>
              
              <div className="summary-section">
                <h3>Design Selection</h3>
                <img src={selectedDesign?.imageUrl} alt="Design" className="summary-image" />
                <p>{selectedDesign?.title || 'Selected Design'}</p>
              </div>
              
              <div className="summary-section">
                <h3>Fabric Selection</h3>
                <p><strong>Fabric:</strong> {selectedFabric?.name}</p>
                <p><strong>Price per meter:</strong> NPR {selectedFabric?.meterPrice?.toLocaleString()}</p>
                <p><strong>Fabric Cost:</strong> NPR {(currentGarment?.clothMeter * selectedFabric?.meterPrice).toLocaleString()}</p>
              </div>
              
              <div className="summary-section">
                <h3>Measurements (inches)</h3>
                <div className="measurements-list">
                  {Object.entries(measurements).map(([key, value]) => (
                    <p key={key}><strong>{key}:</strong> {value} inches</p>
                  ))}
                </div>
              </div>
              
              <div className="summary-total">
                <h2>Total Cost: NPR {totalCost.toLocaleString()}</h2>
                <p className="total-breakdown">
                  (Fabric: NPR {(currentGarment?.clothMeter * selectedFabric?.meterPrice).toLocaleString()} + 
                  Labor: NPR {currentGarment?.labor.toLocaleString()})
                </p>
              </div>
            </div>
          </div>
        );
      
      case 5:
        return (
          <div className="step-container">
            <h1 className="auth-title">Confirm & Submit</h1>
            <div className="confirmation-box">
              <p>You are about to place a custom order for:</p>
              <h3>{currentGarment?.label}</h3>
              <p className="total-amount">Total Amount: NPR {totalCost.toLocaleString()}</p>
              <div className="confirmation-actions">
                <button 
                  onClick={handleSubmit} 
                  disabled={loading} 
                  className="auth-button"
                >
                  {loading ? 'Submitting...' : 'Confirm Order'}
                </button>
                <button onClick={handlePrev} className="auth-button secondary">
                  Back to Review
                </button>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const renderStepper = () => (
    <div className="stepper-container">
      {[
        { step: 0, label: 'Garment' },
        { step: 1, label: 'Design' },
        { step: 2, label: 'Measurements' },
        { step: 3, label: 'Fabric' },
        { step: 4, label: 'Summary' },
        { step: 5, label: 'Confirm' }
      ].map((s) => (
        <div key={s.step} className={`stepper-step ${s.step <= step ? 'active' : ''} ${s.step === step ? 'current' : ''}`}>
          <div className="stepper-circle">{s.step + 1}</div>
          <div className="stepper-label">{s.label}</div>
        </div>
      ))}
    </div>
  );

  if (!user) return <div className="loading">Loading...</div>;

  return (
    <div className="custom-tailoring-page">
      <div className="custom-tailoring-container">
        {renderStepper()}
        
        <div className="step-content">
          {renderStep()}
        </div>
        
        {(step > 0 && step < 5 && step !== 1 && step !== 3) && (
          <div className="navigation-buttons">
            <button onClick={handlePrev} className="auth-button secondary">
              ← Previous
            </button>
            {step < 4 && (
              <button onClick={handleNext} className="auth-button">
                Next →
              </button>
            )}
          </div>
        )}
        
        <button 
          onClick={() => navigate('/dashboard')} 
          className="back-to-dashboard"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

export default CustomTailoring;