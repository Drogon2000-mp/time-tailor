import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/api';
import { toast } from 'react-toastify';
import './itailor-landing.css';
function Signup() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.name.trim().length < 2) {
      setError('Full name is required (min 2 characters)');
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await api.post('/auth/register', formData, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.data.success) {
        const { token, user } = response.data.data;
        
        localStorage.setItem('user', JSON.stringify(user));
        
        toast.success('Account created successfully!');
        navigate('/dashboard');
      }
    } catch (err) {
      if (err.code === 'ERR_CANCELED') {
        setError('Signup timeout - please try again');
        toast.error('Request timeout');
      } else {
        setError(err.response?.data?.message || 'Signup failed');
        toast.error(err.response?.data?.message || 'Signup failed');
      }
    }
    setLoading(false);
  };



  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Join Time Tailor</p>
        <form onSubmit={handleSignup} className="auth-form">
          <input
            name="name"
            type="text"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
            className="auth-input"
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            className="auth-input"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            className="auth-input"
          />
          {error && <div className="auth-error-message">{error}</div>}
          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>
        <div className="auth-divider">
          <span>or</span>
        </div>

        <p className="auth-link">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;