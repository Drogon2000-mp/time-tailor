import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

function Profile() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    measurements: { chest: '', waist: '', shoulder: '', length: '' }
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get('http://localhost:5000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const user = response.data.data;
        setFormData({
          name: user.name || '',
          email: user.email || '',
          measurements: {
            chest: user.measurements?.shirt?.chest || '',
            waist: user.measurements?.shirt?.waist || '',
            shoulder: user.measurements?.shirt?.shoulder || '',
            length: user.measurements?.shirt?.length || ''
          }
        });
      }
    } catch (err) {
      toast.error('Failed to load profile');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('measurements.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        measurements: { ...prev.measurements, [field]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const updateData = {
        name: formData.name,
        measurements: {
          shirt: {
            chest: parseFloat(formData.measurements.chest),
            waist: parseFloat(formData.measurements.waist),
            shoulder: parseFloat(formData.measurements.shoulder),
            length: parseFloat(formData.measurements.length)
          }
        }
      };

      const response = await axios.put('http://localhost:5000/api/users/profile', updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('Profile updated successfully!');
        // Refresh profile
        fetchProfile();
      }
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.msg || err.response?.data?.message || 'Update failed';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Loading profile...</div>;

  return (
    <div className="auth-page">
      <div className="auth-container" style={{ maxWidth: '600px' }}>
        <h1 className="auth-title">Profile Management</h1>
        <p className="auth-subtitle">Update your personal information and measurements</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <input 
              name="name" 
              placeholder="Full Name" 
              value={formData.name} 
              onChange={handleChange} 
              className="auth-input" 
              required 
            />
            <input 
              name="email" 
              placeholder="Email" 
              value={formData.email} 
              className="auth-input" 
              disabled 
            />
          </div>

          <h3>Measurements (inches)</h3>
          <div className="measurements-grid">
            <input 
              name="measurements.chest" 
              placeholder="Chest" 
              type="number" 
              step="0.1" 
              value={formData.measurements.chest} 
              onChange={handleChange} 
              className="auth-input" 
              required 
            />
            <input 
              name="measurements.waist" 
              placeholder="Waist" 
              type="number" 
              step="0.1" 
              value={formData.measurements.waist} 
              onChange={handleChange} 
              className="auth-input" 
              required 
            />
            <input 
              name="measurements.shoulder" 
              placeholder="Shoulder" 
              type="number" 
              step="0.1" 
              value={formData.measurements.shoulder} 
              onChange={handleChange} 
              className="auth-input" 
              required 
            />
            <input 
              name="measurements.length" 
              placeholder="Length" 
              type="number" 
              step="0.1" 
              value={formData.measurements.length} 
              onChange={handleChange} 
              className="auth-input" 
              required 
            />
          </div>

          <button type="submit" disabled={saving} className="auth-button">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        <p className="auth-link">
          <button onClick={() => navigate('/dashboard')} className="auth-button secondary">
            Back to Dashboard
          </button>
        </p>

        <style jsx>{`
          .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
          }
          .measurements-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
          }
          .auth-button.secondary {
            background: #6c757d;
          }
          @media (max-width: 768px) {
            .form-row {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </div>
    </div>
  );
}

export default Profile;
