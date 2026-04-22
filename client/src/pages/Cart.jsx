import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';


function Cart() {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedCart = localStorage.getItem('catalogCart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    } else {
      navigate('/catalog');
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
    localStorage.setItem('catalogCart', JSON.stringify(newCart));
  };

  const removeItem = (index) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
    localStorage.setItem('catalogCart', JSON.stringify(newCart));
    toast.info('Item removed from cart');
  };

  const placeOrder = async () => {
    if (cart.length === 0) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Please login');

      const items = cart.map(item => ({
        serviceType: 'ready-made',
        serviceName: item.name,
        quantity: item.qty,
        size: item.size,
        itemPrice: item.price,
        specialInstructions: `Ready-made order: ${item.name} Size: ${item.size} Qty: ${item.qty}`
      }));

      const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

      const response = await axios.post('/api/orders', {
        items,
        subtotal: total,
        total,
        specialInstructions: `Ready-made clothing order. Sizes as specified. No custom measurements needed.`
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        localStorage.removeItem('catalogCart');
        toast.success('Order placed successfully! Admin will contact you via WhatsApp.');
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    }
    setLoading(false);
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  if (cart.length === 0) return (
    <div className="dashboard">
      <div className="dashboard-card">
        <h2>Cart is empty</h2>
        <Link to="/products" className="book-btn">Continue Shopping</Link>
      </div>
    </div>
  );

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Shopping Cart ({cart.length} items)</h1>
        <Link to="/products" className="view-btn">← Continue Shopping</Link>
      </header>
      
      <div className="dashboard-content">
        <div className="dashboard-card">
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
                      <img src={item.image} alt={item.name} className="cart-img" />
                      {item.name}
                    </td>
                    <td>{item.size}</td>
                    <td>
                      <input 
                        type="number" 
                        min="1" 
                        value={item.qty} 
                        onChange={(e) => updateQty(index, Math.floor(Number(e.target.value)))}
                        className="qty-input"
                      />
                    </td>
                    <td>₹{item.price.toLocaleString()}</td>
                    <td>₹{(item.price * item.qty).toLocaleString()}</td>
                    <td>
                      <button onClick={() => removeItem(index)} className="action-btn">Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="cart-total">
            <h3>Total: ₹{total.toLocaleString()}</h3>
            <button onClick={placeOrder} disabled={loading || cart.length === 0} className="book-btn">
              {loading ? 'Placing Order...' : 'Place Order (Admin WhatsApp Contact)'}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .cart-img { width: 50px; height: 50px; object-fit: cover; border-radius: 4px; margin-right: 1rem; }
        .qty-input { width: 60px; padding: 0.3rem; }
        .cart-total { margin-top: 2rem; padding: 2rem; background: #f8f9fa; border-radius: 8px; text-align: right; }
        .orders-table td { vertical-align: middle; }
      `}</style>
    </div>
  );
}

export default Cart;
