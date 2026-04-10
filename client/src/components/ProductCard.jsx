// ProductCard.jsx
import { useNavigate } from 'react-router-dom';
import './ProductCard.css';

function ProductCard({ product, onViewDetails }) {
  const navigate = useNavigate();

  const handleCardClick = (e) => {
    // Don't navigate if clicking on the "View Details" button
    if (e.target.classList.contains('view-details-btn')) {
      return;
    }
    onViewDetails(product._id);
  };

  const handleViewDetailsClick = (e) => {
    e.stopPropagation(); // Prevent event bubbling
    onViewDetails(product._id);
  };

  return (
    <div className="product-card" onClick={handleCardClick}>
      <div className="product-image-wrapper">
        <img 
          src={product.images?.[0]?.url || product.images?.[0] || '/placeholder-product.jpg'} 
          alt={product.name}
          onError={(e) => {
            e.target.src = '/placeholder-product.jpg';
            e.target.onerror = null;
          }}
          loading="lazy"
        />
      </div>
      <div className="product-info">
        <h3>{product.name}</h3>
        <p className="category">{product.category}</p>
        <p className="price">₹ {Number(product.basePrice || product.price || 0).toLocaleString('en-IN')}</p>
        <button 
          className="view-details-btn"
          onClick={handleViewDetailsClick}
        >
          View Details →
        </button>
      </div>
    </div>
  );
}

export default ProductCard;