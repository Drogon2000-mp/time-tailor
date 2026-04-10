import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './itailor-landing.css';
import HeroSlideShow from '../components/heroSlideShow.jsx';

function PublicLanding() {
  const [products, setProducts] = useState([]);
  const [galleryImages, setGalleryImages] = useState([]);
  const [randomGalleryImages, setRandomGalleryImages] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const navigate = useNavigate();

  // Add refs for sections
  const heroRef = useRef(null);
  const galleryRef = useRef(null);
  const servicesRef = useRef(null);
  const productsRef = useRef(null);

  const heroImages = [
    '/images/src/image 1.jpeg',
    '/images/src/image 2.jpeg',
    '/images/src/image 3.jpeg',
    '/images/src/image 4.jpeg'
  ];

  // Add scrollToSection function
  const scrollToSection = (sectionRef, sectionId) => {
    if (sectionRef && sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      // Fallback to getElementById
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % heroImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        const [productsRes, galleryRes, servicesRes] = await Promise.all([
          axios.get('/api/products'),
          axios.get('/api/gallery'),
          // axios.get('/api/services') // Keep fetch as fallback but use static
        ]);
        setProducts(productsRes.data.data || []);
        setGalleryImages(galleryRes.data.data || []);
        // Randomize 6 gallery images
        const shuffled = shuffle(galleryRes.data.data || []);
        setRandomGalleryImages(shuffled.slice(0, 6));
      } catch (err) {
        console.log('Public data fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPublicData();
  }, []);

  const handleProtectedNav = (path) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.info('Please login to book appointments or place orders');
      navigate('/login');
      return;
    }
    navigate(path);
  };

  const checkLoginForAction = (action) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.info(`Please login to ${action}`);
      navigate('/login');
      return false;
    }
    return true;
  };

  // Shuffle function for randomization
  const shuffle = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Randomize gallery images when they change
  useEffect(() => {
    if (galleryImages.length > 0) {
      const shuffled = shuffle(galleryImages);
      setRandomGalleryImages(shuffled.slice(0, 6));
    }
  }, [galleryImages]);

  const staticServices = [
    {
      name: "Custom Tailoring",
      content: `
        <p>Design your outfit exactly the way you want.</p>
        <ul>
          <li>Choose fabric, color, and fit</li>
          <li>Provide your measurements for a perfect fit</li>
          <li>Get garments crafted specifically for you</li>
        </ul>
        <p class="service-highlight">Perfect for suits, shirts, traditional wear, and special occasions.</p>
      `
    },
    {
      name: "Appointment Booking",
      content: `
        <p>Get personalized attention from our expert tailors.</p>
        <ul>
          <li>Book appointments online</li>
          <li>Select your preferred date and time</li>
          <li>In-store consultation for measurements and styling</li>
        </ul>
        <p class="service-highlight">No waiting — your time is tailored to you.</p>
      `
    },
    {
      name: "Ready-Made Collection",
      content: `
        <p>Shop from our curated clothing catalog.</p>
        <ul>
          <li>Suits, shirts, trousers, and traditional wear</li>
          <li>Categories: Suit, Pant, Shirt, Overcoat, Waistcoat, Daura Suruwal, Kurta Suruwal, Jwari Coat</li>
          <li>Available in multiple sizes with transparent pricing</li>
        </ul>
        <p class="service-highlight">Stylish, affordable, and ready to wear.</p>
      `
    },
    {
      name: "Alteration & Fitting",
      content: `
        <p>Already have a garment? We'll perfect it.</p>
        <ul>
          <li>Size adjustments</li>
          <li>Fit improvements</li>
          <li>Repair and refinement</li>
        </ul>
        <p class="service-highlight">Because every detail matters.</p>
      `
    },
    {
      name: "Style Consultation",
      image: "/images/src/image 1.jpeg",
      content: `
        <p>Not sure what suits you best?</p>
        <ul>
          <li>Get expert advice on fabric, color, and fit</li>
          <li>Personalized recommendations based on your body type and occasion</li>
        </ul>
        <p class="service-highlight">Look confident, feel confident.</p>
      `
    },
    {
      name: "Order Tracking & Delivery",
      image: "/images/src/image 2.jpeg",
      content: `
        <p>Stay updated every step of the way.</p>
        <ul>
          <li>Track your order status (Processing → Stitching → Ready)</li>
          <li>Estimated delivery dates</li>
          <li>Reliable and timely delivery service</li>
        </ul>
      `
    }
  ];

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <>
      {/* Fixed Header */}
      <header className="header">
        <div className="nav-container">
          <Link to="/" className="logo">
            Time Tailor
          </Link>
          <nav className="nav">
            <button className="nav-link" onClick={() => scrollToSection(heroRef, 'hero')}>Home</button>
            <button className="nav-link" onClick={() => scrollToSection(productsRef, 'products')}>Product</button>
            <button className="nav-link" onClick={() => scrollToSection(galleryRef, 'gallery')}>Gallery</button>
            <button className="nav-link" onClick={() => scrollToSection(servicesRef, 'services')}>Services</button>
            
            <div className="auth-buttons">
              <Link to="/login" className="nav-link login-btn">Login</Link>
              <Link to="/signup" className="nav-link signup-btn">Sign Up</Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Home Section */}
      <section id="hero" ref={heroRef}>
        <HeroSlideShow />
      </section>

      <div className="hero-cta-section">
        <div className="container">
          <div className="hero-buttons">
            <button onClick={() => handleProtectedNav('/book-appointment')} className="cta-button secondary">Book Appointment</button>
            <Link to="/login" className="cta-button outline">Login to Order</Link>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <section id="products" className="section products-section" ref={productsRef}>
        <div className="container">
          <h2 className="section-title">Featured Products</h2>
          <div className="services-grid products-grid">
            {products.slice(0, 8).map(product => (
              <div key={product._id} className="service-card">
                <Link to={`/product/${product._id}`} className="product-link">
                <img src={product.images[0]?.url || '/images/suits/two-piece.jpg'} alt={product.name} />
                  <h3>{product.name}</h3>
                  <p className="price">₹{product.basePrice.toLocaleString()}</p>
                </Link>
              </div>
            ))}
          </div>
          <div className="section-cta">
            <button onClick={() => handleProtectedNav('/catalog')} className="cta-button large prominent">View Full Catalog</button>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="section gallery" ref={galleryRef}>
        <div className="container">
          <h2 className="section-title">Our Gallery</h2>
          <div className="services-grid gallery-grid">
            {randomGalleryImages.map(image => (
              <div key={image._id} className="service-card">
                <div className="gallery-link">
                  <img src={image.imageUrl || '/images/src/image 1.jpeg'} alt={image.title} />
                  <h3>{image.title || image.category || 'Stylish Tailoring'}</h3>
                </div>
              </div>
            ))}
          </div>
          <div className="section-cta">
            <button onClick={() => handleProtectedNav('/gallery')} className="cta-button large prominent">View Full Gallery</button>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="section services" ref={servicesRef}>
        <div className="container">
          <h2 className="section-title">Our Services</h2>
          <p className="services-intro">At Time Tailor, we blend craftsmanship with modern convenience to deliver clothing that fits your style and your schedule. From fully customized outfits to ready-made collections, we provide a complete tailoring experience.</p>
          <div className="services-grid">
            {staticServices.map((service, index) => (
              <div key={index} className="service-card">
                <img src={service.image} alt={service.name} className="service-image" />
                <h3>{service.name}</h3>
                <div className="service-content" dangerouslySetInnerHTML={{ __html: service.content }} />
              </div>
            ))}
          </div>
          <div className="section-cta">
            <button onClick={() => handleProtectedNav('/custom-tailoring')} className="cta-button large prominent">Start Custom Order</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>&copy; 2024 Time Tailor. All rights reserved. | <Link to="/services">Services</Link> | <Link to="/gallery">Gallery</Link></p>
        </div>
      </footer>
    </>
  );
}

export default PublicLanding;