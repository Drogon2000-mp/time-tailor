import { useEffect } from 'react';
import './OrderDetailsModal.css';

function OrderDetailsModal({ order, onClose, role }) {
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  if (!order) return null;

  const delivery = order.deliveryAddress || {};

  return (
    <div className="order-details-overlay" onClick={onClose}>
      <div className="order-details-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="order-details-header">
          <div>
            <div className="order-details-title">
              {role === 'admin' ? 'Order Details (Admin)' : 'Order Details'}
            </div>
            <div className="order-details-subtitle">
              <span>Order:</span>
              <strong>{order.orderNumber || order._id}</strong>
              {order.createdAt && (
                <span className="order-details-dot">•</span>
              )}
              {order.createdAt && <span>{new Date(order.createdAt).toLocaleString()}</span>}
            </div>
          </div>

          <button className="order-details-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="order-details-body">
          <div className="order-details-meta-grid">
            <div className="meta-card">
              <div className="meta-label">Status</div>
              <div className="meta-value">
                <span className={`status-badge status-${order.status || 'pending'}`}>{order.status || 'pending'}</span>
              </div>
            </div>

            <div className="meta-card">
              <div className="meta-label">Payment</div>
              <div className="meta-value">
                <div>{order.paymentStatus || 'paid'}</div>
                {(order.esewaPaymentId || order.esewaRefId || order.transaction_uuid) && (
                  <div className="meta-small">
                    eSewa Ref: {order.esewaPaymentId || order.esewaRefId || order.transaction_uuid}
                  </div>
                )}
              </div>
            </div>

            <div className="meta-card">
              <div className="meta-label">Total</div>
              <div className="meta-value">₹{order.total != null ? order.total : (order.totalAmount ?? '-')}</div>
            </div>


            <div className="meta-card">
              <div className="meta-label">Customer</div>
              <div className="meta-value">
                {order.user?.name || order.customerName || '-'}
                {order.user?.email && <div className="meta-small">{order.user?.email}</div>}
              </div>
            </div>
          </div>

          <div className="order-details-section">
            <div className="section-title">Delivery Details</div>
            <div className="delivery-grid">
              <div><strong>Full Name:</strong> {delivery.fullName || delivery.name || '-'}</div>
              <div><strong>Phone:</strong> {delivery.deliveryPhone || delivery.phone || '-'} </div>
              <div><strong>Address:</strong> {delivery.address || delivery.street || '-'}</div>
              <div><strong>City:</strong> {delivery.city || '-'}</div>
              <div><strong>District:</strong> {delivery.district || '-'}</div>
              <div><strong>Province:</strong> {delivery.province || '-'}</div>
              <div><strong>Postal Code:</strong> {delivery.postalCode || delivery.zip || '-'}</div>
              <div><strong>Landmark:</strong> {delivery.landmark || '-'}</div>
            </div>
          </div>

          <div className="order-details-section">
            <div className="section-title">Ordered Items</div>
            <div className="items-grid">
              {Array.isArray(order.items) && order.items.length > 0 ? (
                order.items.map((item, idx) => {                  
                  // Use the 'image' field directly from the order item, which is now populated by the backend
                  const productImageUrl = (item.image && item.image.trim()) 
                    ? item.image 
                    : '/images/product-placeholder.jpg';

                  const name = item.serviceName || item.name || item.productName || 'Item';

                  const qty = item.quantity || item.qty || 1;
                  const price = item.itemPrice ?? item.price ?? '-';

                  return (
                    <div className="item-card" key={item._id || idx}>
                    <div className="item-image-wrap">
                        <img
                          src={productImageUrl || '/images/product-placeholder.jpg'}
                          alt={name}
                          className="item-image"
                          onError={(e) => {
                            // Fallback image (also stop infinite error loops)
                            e.target.onerror = null;
                            e.target.src = '/images/product-placeholder.jpg';
                          }}
                        />
                      </div>

                      <div className="item-info">
                        <div className="item-name">{name}</div>
                        <div className="item-row"><span className="muted">Size:</span> {item.size || item.selectedSize || '-'}</div>
                        <div className="item-row"><span className="muted">Description:</span> {item.description || 'No description'}</div>
                        <div className="item-row"><span className="muted">Qty:</span> {qty}</div>
                        <div className="item-row"><span className="muted">Price:</span> {price === '-' ? '-' : `₹${price}`}</div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty">No items found for this order.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetailsModal;
