import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/api';
import { toast } from 'react-toastify';

function Profile() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [preferences, setPreferences] = useState({});
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('profile');

  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users/profile');

      if (response.data.success) {
        const user = response.data.data;
        setFormData({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || ''
        });
        setPreferences(user.preferences || {});
      }

      const ordersRes = await api.get('/orders/my-orders');
      if (ordersRes.data.success) setOrders(ordersRes.data.data);
    } catch (err) {
      toast.error('Failed to load profile');
      if (err.response?.status === 401) {
        localStorage.removeItem('user');
        navigate('/login');
      }
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
      const response = await api.put('/users/profile', {
        name: formData.name,
        phone: formData.phone
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
      const response = await api.put('/users/change-password', passwordData);

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
    <div className="profile-page">
      <div className="profile-container" style={{ maxWidth: '800px' }}>
        <h1 className="profile-title">Edit Profile</h1>

        {/* Basic Profile Form */}
        <form onSubmit={handleSubmitProfile} className="profile-form">
          <h3>Basic Info</h3>
          <div className="form-row">
            <input
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleProfileChange}
              className="profile-input"
              required
            />
            <input
              name="phone"
              placeholder="Phone"
              value={formData.phone}
              onChange={handleProfileChange}
              className="profile-input"
            />
          </div>
          <input
            name="email"
            placeholder="Email"
            value={formData.email}
            className="profile-input"
            disabled
          />
          <button type="submit" disabled={saving} className="profile-button">
            {saving ? 'Saving...' : 'Update Profile'}
          </button>
        </form>

        {/* Password Change Form */}
        <form onSubmit={handleSubmitPassword} className="profile-form" style={{ marginTop: '2rem' }}>
          <h3>Change Password</h3>
          <input
            type="password"
            name="currentPassword"
            placeholder="Current Password"
            value={passwordData.currentPassword}
            onChange={handlePasswordChange}
            className="profile-input"
            required
          />
          <input
            type="password"
            name="newPassword"
            placeholder="New Password (min 6 chars)"
            value={passwordData.newPassword}
            onChange={handlePasswordChange}
            className="profile-input"
            required
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm New Password"
            value={passwordData.confirmPassword}
            onChange={handlePasswordChange}
            className="profile-input"
            required
          />
          <button type="submit" disabled={saving} className="profile-button">
            {saving ? 'Changing...' : 'Change Password'}
          </button>
        </form>

        <div className="profile-link" style={{ marginTop: '2rem' }}>
          <button onClick={() => navigate('/dashboard')} className="profile-button secondary">
            Back to Dashboard
          </button>
        </div>

        <style jsx>{`
          /* Profile Page - Dark Elegant Theme */
          .profile-page {
            min-height: 100vh;
            padding: 6rem 5% 4rem;
            background: #0a0a0a;
            color: #ffffff;
            position: relative;
          }

          .profile-page::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(to right, transparent, #d4af37, transparent);
          }

          .profile-container {
            max-width: 800px;
            margin: 0 auto;
            background: #1a1a1a;
            border-radius: 12px;
            padding: 3rem;
            border: 1px solid rgba(212, 175, 55, 0.3);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            position: relative;
            animation: fadeInUp 0.6s ease-out;
          }

          .profile-container::after {
            content: '';
            position: absolute;
            bottom: -2px;
            left: 10%;
            right: 10%;
            height: 2px;
            background: linear-gradient(to right, transparent, #d4af37, transparent);
            opacity: 0.3;
          }

          .profile-title {
            font-size: clamp(2rem, 4vw, 2.5rem);
            font-weight: 300;
            text-align: center;
            letter-spacing: -0.5px;
            margin-bottom: 2.5rem;
            color: #ffffff;
            position: relative;
            padding-bottom: 1rem;
          }

          .profile-title::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 60px;
            height: 2px;
            background: #d4af37;
          }

          /* Profile Form Sections */
          .profile-form {
            display: flex;
            flex-direction: column;
            gap: 1.25rem;
            margin-bottom: 1rem;
          }

          .profile-form h3 {
            font-size: 1.1rem;
            font-weight: 500;
            color: #d4af37;
            margin: 1.5rem 0 0.5rem 0;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            border-bottom: 1px solid rgba(212, 175, 55, 0.15);
            padding-bottom: 0.75rem;
          }

          .profile-form h3:first-of-type {
            margin-top: 0;
          }

          /* Form Row - Two columns */
          .profile-form .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
          }

          /* Input Fields */
          .profile-input {
            width: 100%;
            padding: 0.9rem 1.25rem;
            background: #0a0a0a;
            border: 1px solid rgba(212, 175, 55, 0.25);
            border-radius: 6px;
            color: #ffffff;
            font-size: 0.95rem;
            font-family: inherit;
            transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);
            box-sizing: border-box;
          }

          .profile-input::placeholder {
            color: rgba(255, 255, 255, 0.3);
          }

          .profile-input:focus {
            outline: none;
            border-color: #d4af37;
            box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
            background: #1a1a1a;
          }

          .profile-input:hover:not(:disabled) {
            border-color: rgba(212, 175, 55, 0.5);
          }

          .profile-input:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            background: rgba(255, 255, 255, 0.05);
          }

          .profile-input:disabled::placeholder {
            color: rgba(255, 255, 255, 0.15);
          }

          /* Profile Buttons */
          .profile-button {
            padding: 0.9rem 2.5rem;
            background: #d4af37;
            color: #0a0a0a;
            border: none;
            border-radius: 6px;
            font-size: 0.95rem;
            font-weight: 600;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);
            margin-top: 0.5rem;
            align-self: flex-start;
            min-width: 180px;
            position: relative;
            overflow: hidden;
          }

          .profile-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            transition: left 0.6s ease;
          }

          .profile-button:hover:not(:disabled)::before {
            left: 100%;
          }

          .profile-button:hover:not(:disabled) {
            background: #0a0a0a;
            color: #d4af37;
            border: 1px solid #d4af37;
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(212, 175, 55, 0.2);
          }

          .profile-button:active:not(:disabled) {
            transform: translateY(0);
          }

          .profile-button:disabled {
            background: rgba(212, 175, 55, 0.4);
            cursor: not-allowed;
            transform: none;
            opacity: 0.7;
          }

          .profile-button.secondary {
            background: transparent;
            color: #ffffff;
            border: 1px solid rgba(255, 255, 255, 0.2);
            margin-top: 0;
            min-width: 160px;
            font-size: 0.85rem;
            align-self: center;
          }

          .profile-button.secondary:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.05);
            border-color: #ffffff;
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
          }

          .profile-button.secondary::before {
            display: none;
          }

          /* Back to Dashboard button container */
          .profile-link {
            margin-top: 2rem;
            text-align: center;
          }

          .profile-link .profile-button {
            align-self: center;
          }

          /* Loading State */
          .loading {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 400px;
            color: #ffffff;
            font-size: 1.1rem;
            opacity: 0.7;
          }

          .loading::before {
            content: '⏳';
            margin-right: 0.75rem;
            animation: spin 1s linear infinite;
          }

          /* Animations */
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }

          /* Responsive Design */
          @media (max-width: 768px) {
            .profile-page {
              padding: 4rem 1.5rem 2rem;
            }

            .profile-container {
              padding: 2rem 1.5rem;
            }

            .profile-title {
              font-size: 1.75rem;
              margin-bottom: 2rem;
            }

            .profile-form .form-row {
              grid-template-columns: 1fr;
              gap: 0.75rem;
            }

            .profile-form h3 {
              font-size: 1rem;
            }

            .profile-input {
              padding: 0.75rem 1rem;
              font-size: 0.9rem;
            }

            .profile-button {
              padding: 0.75rem 2rem;
              font-size: 0.85rem;
              min-width: 100%;
              align-self: stretch;
              text-align: center;
            }

            .profile-button.secondary {
              min-width: 100%;
            }
          }

          @media (max-width: 480px) {
            .profile-page {
              padding: 3rem 1rem 1.5rem;
            }

            .profile-container {
              padding: 1.5rem 1rem;
              border-radius: 8px;
            }

            .profile-title {
              font-size: 1.5rem;
            }

            .profile-input {
              padding: 0.65rem 0.85rem;
              font-size: 0.85rem;
              border-radius: 4px;
            }

            .profile-button {
              padding: 0.65rem 1.5rem;
              font-size: 0.8rem;
              border-radius: 4px;
            }

            .profile-form h3 {
              font-size: 0.9rem;
            }
          }

          /* Scrollbar Styling */
          .profile-container::-webkit-scrollbar {
            width: 6px;
          }

          .profile-container::-webkit-scrollbar-track {
            background: #0a0a0a;
            border-radius: 3px;
          }

          .profile-container::-webkit-scrollbar-thumb {
            background: #d4af37;
            border-radius: 3px;
          }

          .profile-container::-webkit-scrollbar-thumb:hover {
            background: #b8942f;
          }

          /* Focus visible for accessibility */
          .profile-input:focus-visible,
          .profile-button:focus-visible {
            outline: 2px solid #d4af37;
            outline-offset: 2px;
          }
        `}</style>
      </div>
    </div>
  );
}

export default Profile;