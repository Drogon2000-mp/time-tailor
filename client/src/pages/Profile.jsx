import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

function Profile() {
  const [formData, setFormData] = useState({ name: '', email: '' });
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

      const response = await axios.get('/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const user = response.data.data;
        setFormData({
          name: user.name || '',
          email: user.email || ''
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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put('/api/users/profile', { name: formData.name }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('Profile updated successfully!');
        fetchProfile();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Loading profile...</div>;

  return (
    <div className="auth-page">
      <div className="auth-container" style={{ maxWidth: '600px' }}>
        <h1 className="auth-title">Profile</h1>
        <p className="auth-subtitle">Update your name</p>

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

