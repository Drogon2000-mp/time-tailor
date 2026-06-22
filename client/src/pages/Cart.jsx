import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/api';
import { toast } from 'react-toastify';

function Cart() {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentInitiated, setPaymentInitiated] = useState(false);

  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [deliveryData, setDeliveryData] = useState({
    fullName: '',
    deliveryPhone: '',
    address: '',
    city: '',
    district: '',
    province: '',
    postalCode: '',
    landmark: '',
    orderNotes: ''
  });
  const navigate = useNavigate();

  // TASK 9: CLEAR CART - Exported function
  const clearUserCart = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    localStorage.removeItem(`cart_${user._id}`);
    setCart([]);
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user._id) {
      navigate('/login');
      return;
    }

    const cartKey = `cart_${user._id}`;
    console.log("Logged User:", user._id, "Accessing Cart Key:", cartKey);
    
    const savedCart = localStorage.getItem(cartKey);
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, [navigate]);

  const updateQty = (index, qty) => {
    if (qty < 1) {
      removeItem(index);
      return;
    }
    const newCart = [...cart];
    newCart[index].qty = qty;
    setCart(newCart);
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const cartKey = `cart_${user._id}`;
    localStorage.setItem(cartKey, JSON.stringify(newCart));
  };

  const removeItem = (index) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const cartKey = `cart_${user._id}`;
    localStorage.setItem(cartKey, JSON.stringify(newCart));
    toast.info('Item removed from cart');
  };

  const handleDeliveryChange = (e) => {
    const { name, value } = e.target;
    setDeliveryData(prev => ({ ...prev, [name]: value }));
  };

  const initiatePayment = async () => {
    if (paymentInitiated) {
      toast.info('Payment already initiated. Please complete on eSewa.');
      return;
    }
    setPaymentInitiated(true);
    const missing = [];
    if (!deliveryData.fullName) missing.push('full name');
    if (!deliveryData.deliveryPhone) missing.push('phone');
    if (!deliveryData.address) missing.push('address');
    if (!deliveryData.city) missing.push('city');
    if (!deliveryData.district) missing.push('district');
    if (!deliveryData.province) missing.push('province');

    if (missing.length > 0) {
      toast.error(`Please fill: ${missing.join(', ')}`);
      return;
    }

    try {
      const payload = {
        items: cart.map(item => ({
          id: item.productId,
          qty: item.qty,
          size: item.size || '',
          description: item.description || '',
          image: item.image || '',
          name: item.name || ''
        })),
        deliveryDetails: deliveryData,
        customerPhone: deliveryData.deliveryPhone
      };

      console.log('CHECKOUT ITEMS', cart.map(item => ({
        id: item.productId,
        qty: item.qty,
        size: item.size,
        description: item.description
      })));

      console.log("=== ESEWA REQUEST ===");
      console.log(payload);

      const response = await api.post('/esewa/initiate', payload);

      if (response.data.success) {
        const { params, paymentUrl } = response.data.data;
        console.log("=== ESEWA PARAMS FROM BACKEND ===");
        console.log(params);

        const form = document.createElement('form');
        form.method = 'POST';
        form.action = paymentUrl;
        form.style.display = 'none';

        Object.entries(params).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = value;
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
        toast.info('🔄 Redirecting to secure payment gateway...');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment initiation failed');
    }
    setPaymentLoading(false);
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  if (cart.length === 0) {
    return (
      <div className="dashboard">
        <div className="dashboard-card">
          <h2>Your cart is empty</h2>
        </div>
      </div>
    );
  }

  const handleContinueShopping = () => {
    navigate('/dashboard?tab=products');
  };

  return (
    <div className="cart-page">
      <style>{`
        /* ===== CART PAGE - WHITE THEME ===== */
        .cart-page {
          min-height: 100vh;
          padding: 2rem;
          background: #f5f7fa;
          color: #1a1a2e;
        }

        .cart-page .dashboard-header {
          max-width: 1200px;
          margin: 0 auto 2rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #e8e8e8;
        }

        .cart-page .dashboard-header h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #1a1a2e;
          letter-spacing: -0.5px;
        }

        .cart-page .dashboard-header h1 span {
          color: #d4af37;
          font-weight: 700;
        }

        .cart-page .dashboard-content {
          max-width: 1200px;
          margin: 0 auto;
        }

        .cart-page .dashboard-card {
          background: #ffffff;
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 2px 20px rgba(0, 0, 0, 0.06);
          border: 1px solid #eef0f2;
        }

        /* ===== TABLE ===== */
        .cart-page .orders-table-container {
          overflow-x: auto;
          margin-bottom: 2rem;
        }

        .cart-page .orders-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.95rem;
        }

        .cart-page .orders-table thead th {
          text-align: left;
          padding: 1rem 0.75rem;
          color: #6b7280;
          font-weight: 600;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #eef0f2;
          background: #f9fafb;
        }

        .cart-page .orders-table tbody td {
          padding: 1rem 0.75rem;
          border-bottom: 1px solid #f3f4f6;
          vertical-align: middle;
          color: #1a1a2e;
        }

        .cart-page .orders-table tbody tr:last-child td {
          border-bottom: none;
        }

        .cart-page .orders-table tbody tr:hover {
          background: #fafbfc;
        }

        /* ===== CART IMAGE ===== */
        .cart-page .cart-img {
          width: 60px;
          height: 60px;
          object-fit: cover;
          border-radius: 8px;
          margin-right: 1rem;
          border: 1px solid #eef0f2;
          vertical-align: middle;
        }

        .cart-page .cart-item-name {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        /* ===== QUANTITY INPUT ===== */
        .cart-page .qty-input {
          width: 70px;
          padding: 0.5rem 0.75rem;
          background: #ffffff;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          color: #1a1a2e;
          font-size: 0.95rem;
          text-align: center;
          transition: all 0.3s;
        }

        .cart-page .qty-input:focus {
          outline: none;
          border-color: #d4af37;
          box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.15);
        }

        .cart-page .qty-input::-webkit-inner-spin-button {
          opacity: 1;
        }

        /* ===== ACTION BUTTONS ===== */
        .cart-page .action-btn {
          padding: 0.4rem 1rem;
          border: none;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .cart-page .action-btn.danger {
          background: #fef2f2;
          color: #dc2626;
        }

        .cart-page .action-btn.danger:hover {
          background: #fee2e2;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(220, 38, 38, 0.15);
        }

        /* ===== DELIVERY FORM ===== */
        .cart-page .delivery-form {
          margin: 2rem 0;
          padding: 2rem;
          background: #f9fafb;
          border-radius: 12px;
          border: 2px solid #d4af37;
          animation: slideDown 0.4s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .cart-page .delivery-form h3 {
          margin: 0 0 1.5rem 0;
          color: #d4af37;
          font-weight: 600;
          font-size: 1.2rem;
          letter-spacing: 0.5px;
        }

        .cart-page .form-grid {
          display: grid;
          gap: 1rem;
        }

        .cart-page .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .cart-page .form-input {
          padding: 0.85rem 1rem;
          background: #ffffff;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          color: #1a1a2e;
          font-size: 0.95rem;
          transition: all 0.3s;
          font-family: inherit;
        }

        .cart-page .form-input::placeholder {
          color: #9ca3af;
        }

        .cart-page .form-input:focus {
          outline: none;
          border-color: #d4af37;
          box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.15);
        }

        .cart-page .form-input.full {
          grid-column: 1 / -1;
        }

        .cart-page textarea.form-input {
          resize: vertical;
          min-height: 80px;
          font-family: inherit;
        }

        /* ===== CART TOTAL ===== */
        .cart-page .cart-total {
          margin-top: 2rem;
          padding: 2rem 2.5rem;
          background: linear-gradient(135deg, #f9fafb, #f3f4f6);
          border-radius: 12px;
          text-align: right;
          border: 1px solid #eef0f2;
        }

        .cart-page .cart-total h3 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1a1a2e;
          margin-bottom: 1.5rem;
        }

        .cart-page .cart-total h3 span {
          color: #d4af37;
          font-weight: 700;
        }

        /* ===== BUTTONS ===== */
        .cart-page .book-btn {
          padding: 0.9rem 2.5rem;
          background: #d4af37;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .cart-page .book-btn:hover:not(:disabled) {
          background: #c4a032;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(212, 175, 55, 0.3);
        }

        .cart-page .book-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .cart-page .book-btn.secondary {
          background: #6b7280;
          color: #ffffff;
        }

        .cart-page .book-btn.secondary:hover:not(:disabled) {
          background: #4b5563;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(107, 114, 128, 0.3);
        }

        .cart-page .checkout-buttons {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: 1rem;
          align-items: flex-end;
        }

        .cart-page .checkout-buttons .book-btn {
          min-width: 250px;
        }

        /* ===== EMPTY CART ===== */
        .cart-page .dashboard-card h2 {
          text-align: center;
          padding: 3rem 0;
          color: #9ca3af;
          font-weight: 300;
          font-size: 1.5rem;
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 768px) {
          .cart-page {
            padding: 1rem;
          }

          .cart-page .dashboard-card {
            padding: 1rem;
          }

          .cart-page .dashboard-header h1 {
            font-size: 1.5rem;
          }

          .cart-page .orders-table thead th,
          .cart-page .orders-table tbody td {
            padding: 0.5rem;
            font-size: 0.85rem;
          }

          .cart-page .cart-img {
            width: 40px;
            height: 40px;
            margin-right: 0.5rem;
          }

          .cart-page .form-row {
            grid-template-columns: 1fr;
          }

          .cart-page .cart-total {
            padding: 1.5rem;
            text-align: center;
          }

          .cart-page .cart-total h3 {
            font-size: 1.2rem;
          }

          .cart-page .checkout-buttons {
            align-items: stretch;
          }

          .cart-page .checkout-buttons .book-btn {
            min-width: unset;
            width: 100%;
          }

          .cart-page .book-btn {
            padding: 0.75rem 1.5rem;
            font-size: 0.9rem;
            width: 100%;
          }

          .cart-page .delivery-form {
            padding: 1.25rem;
          }

          .cart-page .qty-input {
            width: 60px;
            padding: 0.4rem 0.5rem;
            font-size: 0.85rem;
          }
        }

        @media (max-width: 480px) {
          .cart-page .dashboard-header h1 {
            font-size: 1.2rem;
          }

          .cart-page .orders-table-container {
            font-size: 0.8rem;
          }

          .cart-page .orders-table thead th {
            font-size: 0.65rem;
          }

          .cart-page .orders-table tbody td {
            padding: 0.4rem 0.3rem;
          }

          .cart-page .action-btn {
            padding: 0.3rem 0.6rem;
            font-size: 0.7rem;
          }

          .cart-page .cart-total h3 {
            font-size: 1rem;
          }
        }

        /* ===== SCROLLBAR ===== */
        .cart-page .orders-table-container::-webkit-scrollbar {
          height: 6px;
        }

        .cart-page .orders-table-container::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 3px;
        }

        .cart-page .orders-table-container::-webkit-scrollbar-thumb {
          background: #d4af37;
          border-radius: 3px;
        }

        .cart-page .orders-table-container::-webkit-scrollbar-thumb:hover {
          background: #c4a032;
        }
      `}</style>

      <header className="dashboard-header">
        <h1>Shopping Cart <span>({cart.length} items)</span></h1>
      </header>

      <div className="dashboard-content">
        <div className="dashboard-card">
          {/* Cart Items */}
          <div className="orders-table-container">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Size</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <div className="cart-item-name">
                        <img src={item.image} alt={item.name} className="cart-img" />
                        {item.name}
                      </div>
                    </td>
                    <td>{item.size}</td>
                    <td>
                      <input 
                        type="number" 
                        min="1" 
                        value={item.qty} 
                        onChange={(e) => updateQty(index, parseInt(e.target.value) || 1)}
                        className="qty-input"
                      />
                    </td>
                    <td>₹{item.price.toLocaleString()}</td>
                    <td>₹{(item.price * item.qty).toLocaleString()}</td>
                    <td>
                      <button onClick={() => removeItem(index)} className="action-btn danger">Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Delivery Form */}
          {showDeliveryForm && (
            <div className="delivery-form">
              <h3>📍 Delivery Details</h3>
              <div className="form-grid">
                <input
                  name="fullName"
                  placeholder="Full Name *"
                  value={deliveryData.fullName}
                  onChange={handleDeliveryChange}
                  className="form-input full"
                />
                <input
                  name="deliveryPhone"
                  placeholder="Phone Number *"
                  value={deliveryData.deliveryPhone}
                  onChange={handleDeliveryChange}
                  className="form-input full"
                />
                <input
                  name="address"
                  placeholder="Street Address *"
                  value={deliveryData.address}
                  onChange={handleDeliveryChange}
                  className="form-input full"
                />
                <div className="form-row">
                  <input
                    name="city"
                    placeholder="City *"
                    value={deliveryData.city}
                    onChange={handleDeliveryChange}
                    className="form-input"
                  />
                  <input
                    name="district"
                    placeholder="District *"
                    value={deliveryData.district}
                    onChange={handleDeliveryChange}
                    className="form-input"
                  />
                </div>
                <div className="form-row">
                  <input
                    name="province"
                    placeholder="Province *"
                    value={deliveryData.province}
                    onChange={handleDeliveryChange}
                    className="form-input"
                  />
                  <input
                    name="postalCode"
                    placeholder="Postal Code *"
                    value={deliveryData.postalCode}
                    onChange={handleDeliveryChange}
                    className="form-input"
                  />
                </div>
                <input
                  name="landmark"
                  placeholder="Landmark (optional)"
                  value={deliveryData.landmark}
                  onChange={handleDeliveryChange}
                  className="form-input full"
                />
                <textarea
                  name="orderNotes"
                  placeholder="Order Notes (optional)"
                  value={deliveryData.orderNotes}
                  onChange={handleDeliveryChange}
                  className="form-input full"
                  rows="3"
                />
              </div>
            </div>
          )}

          {/* Checkout Buttons */}
          <div className="cart-total">
            <h3>Total: <span>₹{total.toLocaleString()}</span></h3>
            {!showDeliveryForm ? (
              <button 
                onClick={() => setShowDeliveryForm(true)} 
                className="book-btn"
                disabled={cart.length === 0}
              >
                ➡️ Proceed to Delivery &amp; eSewa Payment
              </button>
            ) : (
              <div className="checkout-buttons">
                <button 
                  onClick={async () => {
                    setPaymentLoading(true);
                    try {
                      await initiatePayment();
                    } finally {
                      setPaymentLoading(false);
                    }
                  }} 
                  disabled={paymentLoading || cart.length === 0} 
                  className="book-btn"
                >
                  {paymentLoading ? '⏳ Initiating...' : `💳 Pay ₹${total.toLocaleString()} - eSewa`}
                </button>

                <button 
                  onClick={() => toast.info('Complete payment in eSewa. You will be redirected to the result page automatically.')}
                  disabled={paymentLoading}
                  className="book-btn secondary"
                >
                  ✅ Payment Done (handled automatically)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cart;