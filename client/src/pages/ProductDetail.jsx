import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './ProductDetail.css'; // Import the CSS file

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [qty, setQty] = useState(1);
  const [selectedImage, setSelectedImage] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    fetchProduct();
    updateCartCount();
    
    // Listen for cart updates
    window.addEventListener('storage', updateCartCount);
    return () => window.removeEventListener('storage', updateCartCount);
  }, [id]);

  const updateCartCount = () => {
    const savedCart = localStorage.getItem('catalogCart');
    if (savedCart) {
      const cart = JSON.parse(savedCart);
      const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
      setCartCount(totalItems);
    }
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/products/${id}`);
      setProduct(res.data.data);
      
      // Auto-select first available size if exists
      const availableSizes = res.data.data.sizes?.filter(s => s.available > 0) || [];
      if (availableSizes.length > 0) {
        setSelectedSize(availableSizes[0].size);
      }
    } catch (err) {
      console.error('Error fetching product:', err);
      toast.error('Product not found');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = () => {
    if (!selectedSize) {
      toast.error('Please select a size');
      return;
    }
    
    if (qty <= 0) {
      toast.error('Please select a valid quantity');
      return;
    }

    const sizeStock = product.sizes.find(s => s.size === selectedSize);
    if (!sizeStock || sizeStock.available < qty) {
      toast.error(`Insufficient stock for size ${selectedSize}. Only ${sizeStock?.available || 0} available.`);
      return;
    }

    const basePrice = product.basePrice || product.price || 0;
    const sizeAdjustment = sizeStock.priceAdjustment || 0;
    const itemPrice = basePrice + sizeAdjustment;
    const totalPrice = itemPrice * qty;

    const cartItem = {
      productId: product._id,
      name: product.name,
      size: selectedSize,
      qty: qty,
      price: itemPrice,
      total: totalPrice,
      image: product.images?.[0]?.url || product.images?.[0] || '/placeholder.jpg',
      category: product.category
    };

    // Get existing cart
    let currentCart = JSON.parse(localStorage.getItem('catalogCart') || '[]');
    
    // Check if item already exists
    const existingIndex = currentCart.findIndex(
      item => item.productId === product._id && item.size === selectedSize
    );
    
    if (existingIndex > -1) {
      // Update existing item
      currentCart[existingIndex].qty += qty;
      currentCart[existingIndex].total = currentCart[existingIndex].price * currentCart[existingIndex].qty;
      toast.info(`Updated quantity for ${product.name} (${selectedSize})`);
    } else {
      // Add new item
      currentCart.push(cartItem);
      toast.success(`${product.name} (${selectedSize}) added to cart!`);
    }
    
    // Save to localStorage
    localStorage.setItem('catalogCart', JSON.stringify(currentCart));
    
    // Update cart count
    updateCartCount();
    
    // Trigger storage event for other components
    window.dispatchEvent(new Event('storage'));
    
    // Optional: Ask user if they want to go to cart
    if (window.confirm('Item added to cart! Would you like to view your cart?')) {
      navigate('/cart');
    }
  };

  const goBack = () => {
    navigate('/dashboard');
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading product details...</p>
      </div>
    );
  }
  
  if (!product) {
    return (
      <div className="loading-container">
        <p>Product not found</p>
        <button onClick={goBack} className="back-btn">Go Back</button>
      </div>
    );
  }

  const availableSizes = product.sizes?.filter(s => s.available > 0) || [];
  const basePrice = product.basePrice || product.price || 0;
  const selectedSizeData = product.sizes?.find(s => s.size === selectedSize);
  const currentPrice = selectedSizeData 
    ? basePrice + (selectedSizeData.priceAdjustment || 0)
    : basePrice;

  return (
    <div className="product-detail-page">
      <header className="product-detail-header">
        <button onClick={goBack} className="back-btn">
          ← Back to Dashboard
        </button>
        <h1>{product.name}</h1>
        <button onClick={() => navigate('/cart')} className="cart-btn">
          🛒 Cart {cartCount > 0 && `(${cartCount})`}
        </button>
      </header>
      
      <div className="product-detail-content">
        <div className="product-detail-card">
          <div className="product-detail-container">
            <div className="product-image-section">
              <img 
                src={product.images?.[0]?.url || product.images?.[0] || '/placeholder.jpg'} 
                alt={product.name} 
                className="product-main-img"
                onClick={() => handleImageClick(product.images?.[0]?.url || product.images?.[0])}
                style={{ cursor: 'pointer' }}
              />
              {product.images && product.images.length > 1 && (
                <div className="product-thumbnails">
                  {product.images.slice(0, 4).map((img, idx) => (
                    <img 
                      key={idx} 
                      src={img.url || img} 
                      alt={`${product.name} view ${idx + 1}`}
                      onClick={() => handleImageClick(img.url || img)}
                    />
                  ))}
                </div>
              )}
            </div>
            
            <div className="product-info-section">
              <h2>{product.name}</h2>
              {product.category && <span className="product-category">{product.category}</span>}
              
              <p className="product-price">
                NPR {currentPrice.toLocaleString()}
                {selectedSizeData?.priceAdjustment > 0 && (
                  <span style={{ fontSize: '0.9rem', color: '#666', marginLeft: '10px' }}>
                    (Base: NPR {Math.floor(Number(basePrice)).toLocaleString()} + {selectedSizeData.priceAdjustment})
                  </span>
                )}
              </p>
              
              <p className="product-description">
                {product.description || 'No description available for this product.'}
              </p>
              
              {product.material && (
                <p><strong>Material:</strong> {product.material}</p>
              )}
              
              {product.careInstructions && (
                <p><strong>Care Instructions:</strong> {product.careInstructions}</p>
              )}
              
              <div className="sizes-section">
                <h3>Select Size:</h3>
                {availableSizes.length === 0 ? (
                  <p className="out-of-stock-message">Sorry, this product is currently out of stock.</p>
                ) : (
                  <div className="sizes-grid">
                    {product.sizes.map(s => (
                      <div 
                        key={s._id} 
                        className={`size-card ${s.available === 0 ? 'out-of-stock' : ''} ${selectedSize === s.size ? 'selected' : ''}`}
                        onClick={() => s.available > 0 && setSelectedSize(s.size)}
                      >
                        <strong>{s.size}</strong>
                        <span>{s.available} available</span>
                        {s.priceAdjustment > 0 && (
                          <span className="price-adjustment">+NPR {s.priceAdjustment}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {availableSizes.length > 0 && (
                <div className="add-cart-section">
                  <div className="qty-control">
                    <label>Quantity:</label>
                    <input 
                      type="number" 
                      value={qty} 
                      onChange={(e) => {
                        const newQty = Math.max(1, parseInt(e.target.value) || 1);
                        const maxQty = selectedSizeData?.available || 99;
                        setQty(Math.min(newQty, maxQty));
                      }}
                      min={1}
                      max={selectedSizeData?.available || 99}
                      className="qty-input"
                    />
                    {selectedSizeData && (
                      <span style={{ fontSize: '0.85rem', color: '#666' }}>
                        Max: {selectedSizeData.available}
                      </span>
                    )}
                  </div>
                  
                  <button 
                    onClick={addToCart} 
                    disabled={!selectedSize || qty <= 0 || !selectedSizeData?.available}
                    className="add-to-cart-btn"
                  >
                  Add to Cart - NPR {Math.floor(Number(currentPrice * qty)).toLocaleString()}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal for fullscreen view */}
      {selectedImage && (
        <div className="image-modal" onClick={() => setSelectedImage(null)}>
          <img src={selectedImage} alt="Full size preview" />
          <button 
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'white',
              border: 'none',
              fontSize: '30px',
              cursor: 'pointer',
              width: '40px',
              height: '40px',
              borderRadius: '50%'
            }}
            onClick={() => setSelectedImage(null)}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

export default ProductDetail;