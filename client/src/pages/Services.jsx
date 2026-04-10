import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/services')
      .then(res => {
        setServices(res.data.data || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="loading">Loading services...</div>;

  return (
    <div className="services-page">
      <div className="container">
        <header className="page-header">
          <h1>Our Tailoring Services</h1>
          <p>Labor Costs in NPR - Choose your perfect fit</p>
        </header>

        <div className="services-grid">
          {services.map(service => (
            <div key={service._id} className="service-card">
              {service.image && (
                <div className="service-image">
                  <img src={service.image} alt={service.name} />
                </div>
              )}
              <div className="service-content">
                <h3>{service.name}</h3>
                <div className="service-price">₹{service.basePrice.toLocaleString()}</div>
                <p className="service-category">{service.category.toUpperCase()}</p>
                <p className="service-desc">{service.description}</p>
                <ul className="service-features">
                  {service.features?.map((feature, i) => (
                    <li key={i}>✅ {feature}</li>
                  ))}
                </ul>
                <div className="service-meters">
                  Fabric Required: {service.defaultMeters} meters
                </div>
                <Link to="/custom-tailoring" className="service-cta">
                  Order Now
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Services;

