// ProductModal.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './ProductModal.css';

function ProductModal({ productId, onClose }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [qty, setQty] = useState(1);

  useEffect(() => {
    fetchProductDetails();
  }, [productId]);

  // Close modal on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const fetchProductDetails = async () => {
    try {
      const res = await axios.get(`/api/products/${productId}`);
      setProduct(res.data.data);
      // Auto-select first available size
      const availableSizes = res.data.data.sizes?.filter(s => s.available > 0) || [];
      if (availableSizes.length > 0) {
        setSelectedSize(availableSizes[0].size);
      }
    } catch (err) {
      console.error('Error fetching product:', err);
      toast.error('Failed to load product details');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const addToCart = () => {
    if (!selectedSize) {
      toast.error('Please select a size');
      return;
    }

    const sizeStock = product.sizes.find(s => s.size === selectedSize);
    if (!sizeStock || sizeStock.available < qty) {
      toast.error(`Insufficient stock for size ${selectedSize}`);
      return;
    }

    const basePrice = product.basePrice || product.price || 0;
    const sizeAdjustment = sizeStock.priceAdjustment || 0;
    const itemPrice = basePrice + sizeAdjustment;

    const cartItem = {
      productId: product._id,
      name: product.name,
      size: selectedSize,
      qty: qty,
      price: itemPrice,
      total: itemPrice * qty,
      image: product.images?.[0]?.url || '/placeholder.jpg',
      category: product.category
    };

    let currentCart = JSON.parse(localStorage.getItem('catalogCart') || '[]');
    const existingIndex = currentCart.findIndex(
      item => item.productId === product._id && item.size === selectedSize
    );
    
    if (existingIndex > -1) {
      currentCart[existingIndex].qty += qty;
      currentCart[existingIndex].total = currentCart[existingIndex].price * currentCart[existingIndex].qty;
      toast.info(`Updated quantity for ${product.name} (${selectedSize})`);
    } else {
      currentCart.push(cartItem);
      toast.success(`${product.name} (${selectedSize}) added to cart!`);
    }
    
    localStorage.setItem('catalogCart', JSON.stringify(currentCart));
    window.dispatchEvent(new Event('storage'));
    onClose();
  };

  if (loading) {
    return (
      <div className="product-modal-overlay" onClick={onClose}>
        <div className="product-modal-content" onClick={e => e.stopPropagation()}>
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const basePrice = product.basePrice || product.price || 0;
  const selectedSizeData = product.sizes?.find(s => s.size === selectedSize);
  const currentPrice = selectedSizeData 
    ? basePrice + (selectedSizeData.priceAdjustment || 0)
    : basePrice;

  return (
    <div className="product-modal-overlay" onClick={onClose}>
      <div className="product-modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>×</button>
        
        <div className="product-modal-body">
          <div className="modal-image-section">
            <img 
              src={product.images?.[0]?.url || product.images?.[0] || '/placeholder.jpg'} 
              alt={product.name}
            />
          </div>
          
          <div className="modal-info-section">
            <h2>{product.name}</h2>
            {product.category && <span className="product-category">{product.category}</span>}
            <p className="product-price">NPR {currentPrice.toLocaleString()}</p>
            <p className="product-description">{product.description || 'No description available'}</p>
            
            <div className="sizes-section">
              <h4>Select Size:</h4>
              <div className="sizes-grid">
                {product.sizes?.map(s => (
                  <div 
                    key={s._id}
                    className={`size-option ${s.available === 0 ? 'out-of-stock' : ''} ${selectedSize === s.size ? 'selected' : ''}`}
                    onClick={() => s.available > 0 && setSelectedSize(s.size)}
                  >
                    {s.size}
                    {s.priceAdjustment > 0 && <small>+NPR {s.priceAdjustment}</small>}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="qty-section">
              <label>Quantity:</label>
              <input 
                type="number"
                value={qty}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                max={selectedSizeData?.available || 99}
              />
            </div>
            
            <button 
              className="add-to-cart-modal-btn"
              onClick={addToCart}
              disabled={!selectedSize}
            >
              Add to Cart - NPR {(currentPrice * qty).toLocaleString()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductModal;