import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { GoogleLogin } from '@react-oauth/google'; 
import './itailor-landing.css';

function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Function to get user data and redirect based on role
  const handleUserRedirect = async (token) => {
    try {
      const response = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        const user = response.data.data;
        if (user.role === 'admin') {
          navigate('/admin-dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        navigate('/dashboard'); // Default fallback
      }
    } catch (err) {
      console.error('Failed to fetch user data:', err);
      navigate('/dashboard'); // Fallback to user dashboard
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await axios.post('/api/auth/login', formData, { 
        signal: controller.signal 
      });
      clearTimeout(timeoutId);
      
      if (response.data.success) {
        const token = response.data.data.token;
        localStorage.setItem('token', token);
        toast.success('Logged in successfully!');
        
        // Fetch user data to determine role
        await handleUserRedirect(token);
      }
    } catch (err) {
      if (err.code === 'ERR_CANCELED') {
        setError('Login timeout - please try again');
        toast.error('Request timeout');
      } else {
        setError(err.response?.data?.message || 'Login failed');
        toast.error(err.response?.data?.message || 'Login failed');
      }
    }
    setLoading(false);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/google', {
        id_token: credentialResponse.credential
      });
      if (response.data.success) {
        const token = response.data.data.token;
        localStorage.setItem('token', token);
        toast.success('Logged in with Google!');
        
        // Fetch user data to determine role
        await handleUserRedirect(token);
      }
    } catch (err) {
      toast.error('Google login failed');
      setError('Google login failed');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="auth-title">Login to Time Tailor</h1>
        <p className="auth-subtitle">Welcome back</p>
        
        
        <form onSubmit={handleEmailLogin} className="auth-form">
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
            {loading ? 'Signing in...' : 'Login with Email'}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <div className="google-login-container">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google login failed')}
            theme="filled_blue"
            size="large"
            text="signin_with"
            shape="rectangular"
            width="100%"
            disabled={loading}
          />
        </div>

        <p className="auth-link">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;