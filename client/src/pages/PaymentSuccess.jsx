import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/api';
import { toast } from 'react-toastify';

function PaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();

  const [isVerifying, setIsVerifying] = useState(true);
  const [status, setStatus] = useState('verifying');

  const params = new URLSearchParams(location.search);
  const p_uuid = params.get('transaction_uuid');
  const p_refId = params.get('refId');

  useEffect(() => {
    const complete = async () => {
      try {
        // Backend already verified payment via eSewa callback.
        // This page should just perform client-side cleanup + redirect.
        toast.success('Payment Verified Successfully! ✅');

        setStatus('success');

        // Clear local cart only after callback created the order
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user._id) {
          localStorage.removeItem(`cart_${user._id}`);
          window.dispatchEvent(new Event('storage'));
        }

        setTimeout(() => navigate('/dashboard?tab=orders'), 3000);
      } catch (err) {
        console.error('PaymentSuccess error:', err);
        toast.error('Payment Verification Failed. Please contact support.');
        setStatus('failed');
      } finally {
        setIsVerifying(false);
      }
    };

    if (p_uuid && p_refId) {
      complete();
    } else {
      navigate('/dashboard');
    }
  }, [p_uuid, p_refId, navigate]);

  return (
    <div className="dashboard" style={{ padding: '2rem' }}>
      <div className="dashboard-card" style={{ maxWidth: 800, margin: '0 auto' }}>
        {isVerifying ? (
          <h2>Verifying Payment with eSewa... ⏳</h2>
        ) : status === 'success' ? (
          <h2 style={{ color: '#52c41a' }}>Payment Confirmed ✅</h2>
        ) : (
          <h2 style={{ color: '#ff4d4f' }}>Payment Verification Failed ❌</h2>
        )}
        <p>{isVerifying ? 'Please do not refresh the page.' : 'Redirecting you shortly...'}</p>
      </div>
    </div>
  );
}

export default PaymentSuccess;
