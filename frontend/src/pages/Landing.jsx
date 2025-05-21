import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from '../api';

const Landing = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch featured products from API
    const fetchFeaturedProducts = async () => {
      try {
        const response = await fetch(`${API_URL}/articles?featured=true`);

        if (!response.ok) {
          throw new Error('Failed to fetch');
        }
        const data = await response.json();
        // We'll take the first 3 products as featured
        setFeaturedProducts(data.slice(0, 3));
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  return (
    <div className="landing-page">
      <section className="hero">
        <div className="hero-content">
          <h1>Willkommen beim Musikverleih</h1>
          <p>Qualitätsinstrumente und Equipment für jeden Anlass</p>
          <Link to="/products" className="cta-button">
            Produkte entdecken
          </Link>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <h2>Warum uns wählen?</h2>
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">🎵</div>
              <h3>Hochwertige Instrumente</h3>
              <p>Unsere Instrumente sind von höchster Qualität und werden regelmäßig gewartet.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">💰</div>
              <h3>Faire Preise</h3>
              <p>Wir bieten faire Mietpreise für verschiedene Zeiträume.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🚚</div>
              <h3>Flexible Abholung</h3>
              <p>Wir organisieren die Abholung und Rückgabe nach Ihren Wünschen.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="featured-products">
        <div className="container">
          <h2>Ausgewählte Produkte</h2>
          
          {isLoading ? (
            <div className="loading">Produkte werden geladen...</div>
          ) : featuredProducts.length > 0 ? (
            <div className="products-grid">
              {featuredProducts.map((product) => (
                <div key={product.id} className="product-card">
                  <div className="product-image">
                    <img src={product.image_url || '/placeholder-instrument.jpg'} alt={product.name} />
                  </div>
                  <div className="product-info">
                    <h3>{product.name}</h3>
                    <p className="price">{product.price_per_day} € pro Tag</p>
                    <Link to={`/products/${product.id}`} className="view-details">
                      Details ansehen
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>Keine Produkte gefunden.</p>
          )}
          
          <div className="view-all">
            <Link to="/products" className="view-all-link">
              Alle Produkte ansehen
            </Link>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <h2>Bereit, Musik zu machen?</h2>
          <p>Kontaktieren Sie uns noch heute, um die perfekten Instrumente für Ihr nächstes Event zu finden.</p>
          <Link to="/contact" className="cta-button">
            Kontakt aufnehmen
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Landing;