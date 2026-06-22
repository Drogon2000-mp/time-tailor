import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

function PaymentFailure() {
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const transaction_uuid = params.get('transaction_uuid') || '';
  const reason = params.get('reason') || '';

  useEffect(() => {
    toast.error('Payment failed or cancelled');
  }, []);

  return (
    <>
      <style>{`
        .payment-failure-container {
          padding: 2rem;
          min-height: 100vh;
          background: #f7f9fc;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .payment-failure-card {
          max-width: 800px;
          width: 100%;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 16px;
          padding: 2.5rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          transition: box-shadow 0.3s ease;
        }

        .payment-failure-card:hover {
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
        }

        .payment-failure-title {
          margin-bottom: 0.5rem;
          font-size: 1.75rem;
          font-weight: 700;
          color: #1a1a2e;
          letter-spacing: -0.5px;
        }

        .payment-failure-subtitle {
          margin-top: 0;
          font-size: 1rem;
          color: #6b7280;
          line-height: 1.6;
        }

        .payment-failure-details {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 12px;
          padding: 1.25rem;
          margin-top: 1.5rem;
        }

        .payment-failure-details p {
          margin: 0;
          color: #991b1b;
          font-size: 0.95rem;
        }

        .payment-failure-details p:not(:last-child) {
          margin-bottom: 0.5rem;
        }

        .payment-failure-details b {
          color: #7f1d1d;
          font-weight: 600;
        }

        .payment-failure-actions {
          display: flex;
          gap: 0.75rem;
          margin-top: 1.75rem;
          flex-wrap: wrap;
        }

        .payment-failure-btn {
          padding: 0.6rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 44px;
        }

        .payment-failure-btn.secondary {
          background: #e5e7eb;
          color: #1f2937;
        }

        .payment-failure-btn.secondary:hover {
          background: #d1d5db;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .payment-failure-btn.secondary:active {
          transform: translateY(0);
        }

        @media (max-width: 640px) {
          .payment-failure-container {
            padding: 1rem;
          }

          .payment-failure-card {
            padding: 1.5rem;
          }

          .payment-failure-title {
            font-size: 1.5rem;
          }

          .payment-failure-actions {
            flex-direction: column;
          }

          .payment-failure-btn {
            width: 100%;
            justify-content: center;
          }
        }

        @media (min-width: 641px) and (max-width: 1024px) {
          .payment-failure-card {
            padding: 2rem;
          }
        }
      `}</style>

      <div className="payment-failure-container">
        <div className="payment-failure-card">
          <h2 className="payment-failure-title">Payment Failed</h2>
          <p className="payment-failure-subtitle">
            eSewa verification failed or the payment was cancelled.
          </p>

          <div className="payment-failure-details">
            <p><b>Transaction UUID:</b> {transaction_uuid || '-'}</p>
            <p><b>Reason:</b> {reason || 'payment_cancelled'}</p>
          </div>

          <div className="payment-failure-actions">
            <button
              className="payment-failure-btn secondary"
              onClick={() => navigate('/dashboard?tab=orders')}
            >
              Go to My Orders
            </button>
            <button
              className="payment-failure-btn secondary"
              onClick={() => navigate('/dashboard')}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default PaymentFailure;