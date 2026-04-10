import { useState, useEffect } from 'react';
import axios from 'axios';

function Gallery() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    axios.get('/api/gallery')
      .then(res => {
        const galleryData = res.data.data || [];
        // Ensure each image has a valid URL
        const processedImages = galleryData.map(img => ({
          ...img,
          displayUrl: img.imageUrl || img.url || '/placeholder.jpg'
        }));
        setImages(processedImages);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Close modal with Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && selectedImage) {
        setSelectedImage(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [selectedImage]);

  if (loading) return <div className="loading">Loading gallery...</div>;

  return (
    <div className="gallery-page">
      <div className="container">
        <header className="page-header">
          <h1>Gallery - Our Work</h1>
          <p>Admin uploaded tailoring masterpieces</p>
        </header>

        <div className="gallery-grid">
          {images.length === 0 ? (
            <p className="no-results">No gallery images available</p>
          ) : (
            images.map(image => (
              <div 
                key={image._id} 
                className="gallery-item"
                onClick={() => setSelectedImage(image)}
              >
                <img 
                  src={image.displayUrl} 
                  alt={image.caption || image.title || 'Gallery image'} 
                  loading="lazy"
                />
                {(image.caption || image.title) && (
                  <div className="gallery-info">
                    <h3>{image.title || image.caption}</h3>
                    {image.category && <p>{image.category}</p>}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Fullscreen Lightbox Modal */}
        {selectedImage && (
          <div 
            className="fullscreen-gallery-modal" 
            onClick={() => setSelectedImage(null)}
          >
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <button 
                className="modal-close" 
                onClick={() => setSelectedImage(null)}
                aria-label="Close"
              >
                ×
              </button>
              <img 
                src={selectedImage.displayUrl} 
                alt={selectedImage.caption || selectedImage.title || 'Gallery image'} 
              />
              {(selectedImage.caption || selectedImage.title) && (
                <div className="modal-info">
                  <h3>{selectedImage.title || selectedImage.caption}</h3>
                  {selectedImage.category && <p>{selectedImage.category}</p>}
                  {selectedImage.description && <p>{selectedImage.description}</p>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Gallery;