import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/api';
import { toast } from 'react-toastify';
import './itailor-landing.css';


function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await api.post('/auth/login', formData, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.data.success) {
        const { token, user } = response.data.data;
        
        // Save to localStorage for persistence and header use
        localStorage.setItem('user', JSON.stringify(user));
        
        toast.success('Logged in successfully!');
        
        // Immediate Role-based redirection
        if (user.role === 'admin') {
          navigate('/admin-dashboard');
        } else {
          navigate('/dashboard');
        }
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



        <p className="auth-link">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;