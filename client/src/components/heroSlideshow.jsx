import { useState, useEffect } from 'react';

const HeroSlideshow = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
const slides = [
    {
      image: '/src/images/heroSlideshow/suit.jpg',
      title: 'Premium Suits',
      subtitle: 'Timeless elegance for every occasion'
    },
    {
      image: '/src/images/heroSlideshow/black%20shirt.webp',
      title: 'Custom Shirts',
      subtitle: 'Perfect fit, premium fabrics'
    },
    {
      image: '/src/images/heroSlideshow/pant.webp',
      title: 'Tailored Trousers',
      subtitle: 'Modern slim fit collection'
    },
    {
      image: '/src/images/heroSlideshow/overcoat.webp',
      title: 'Classic Overcoats',
      subtitle: 'Sophisticated winter elegance'
    },
    {
      image: '/src/images/heroSlideshow/traditional%20dress.jpg',
      title: 'Wedding Collection',
      subtitle: 'Perfect for your special day'
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [slides.length]);

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + slides.length) % slides.length);
  };

  return (
    <div className="hero-slideshow">
      <div className="slideshow-container">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`slide ${index === currentIndex ? 'active' : ''}`}
            style={{
              backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${slide.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          >
            <div className="slide-content">
              <h2 className="slide-title">{slide.title}</h2>
              <p className="slide-subtitle">{slide.subtitle}</p>
            </div>
          </div>
        ))}
        
        <button className="slide-arrow prev" onClick={prevSlide}>
          &#10094;
        </button>
        <button className="slide-arrow next" onClick={nextSlide}>
          &#10095;
        </button>
        
        <div className="slide-dots">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroSlideshow;