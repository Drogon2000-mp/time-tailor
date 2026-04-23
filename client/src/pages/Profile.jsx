import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

function Profile() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [preferences, setPreferences] = useState({});
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
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
          email: user.email || '',
          phone: user.phone || ''
        });
        setPreferences(user.preferences || {} );
        }
    } catch (err) {
      toast.error('Failed to load profile');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };



  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put('/api/users/profile', { 
        name: formData.name,
        phone: formData.phone 
      }, {
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



  const handleSubmitPassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put('/api/users/change-password', passwordData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('Password changed successfully!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally {
      setSaving(false);
    }
  };



  if (loading) return <div className="loading">Loading profile...</div>;

  return (
    <div className="auth-page">
      <div className="auth-container" style={{ maxWidth: '800px' }}>
        <h1 className="auth-title">Edit Profile</h1>



        {/* Basic Profile Form */}
        <form onSubmit={handleSubmitProfile} className="auth-form">
          <h3>Basic Info</h3>
          <div className="form-row">
            <input 
              name="name" 
              placeholder="Full Name" 
              value={formData.name} 
              onChange={handleProfileChange} 
              className="auth-input" 
              required 
            />
            <input 
              name="phone" 
              placeholder="Phone" 
              value={formData.phone} 
              onChange={handleProfileChange} 
              className="auth-input" 
            />
          </div>
          <input 
            name="email" 
            placeholder="Email" 
            value={formData.email} 
            className="auth-input" 
            disabled 
          />
          <button type="submit" disabled={saving} className="auth-button">
            {saving ? 'Saving...' : 'Update Profile'}
          </button>
        </form>



        {/* Password Change Form */}
        <form onSubmit={handleSubmitPassword} className="auth-form" style={{ marginTop: '2rem' }}>
          <h3>Change Password</h3>
          <input 
            type="password" 
            name="currentPassword" 
            placeholder="Current Password" 
            value={passwordData.currentPassword} 
            onChange={handlePasswordChange} 
            className="auth-input"
            required 
          />
          <input 
            type="password" 
            name="newPassword" 
            placeholder="New Password (min 6 chars)" 
            value={passwordData.newPassword} 
            onChange={handlePasswordChange} 
            className="auth-input"
            required 
          />
          <input 
            type="password" 
            name="confirmPassword" 
            placeholder="Confirm New Password" 
            value={passwordData.confirmPassword} 
            onChange={handlePasswordChange} 
            className="auth-input"
            required 
          />
          <button type="submit" disabled={saving} className="auth-button">
            {saving ? 'Changing...' : 'Change Password'}
          </button>
        </form>

        <p className="auth-link" style={{ marginTop: '2rem' }}>
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
          h3 {
            margin-top: 2rem;
            color: #333;
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
