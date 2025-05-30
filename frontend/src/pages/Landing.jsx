import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { API_URL } from '../api';

// CSS für die Landing-Komponente 
import './Landing.css';

const Landing = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const response = await fetch(`${API_URL}/articles?featured=true`);
        if (!response.ok) {
          throw new Error('Failed to fetch');
        }
        const data = await response.json();
        setFeaturedProducts(data.slice(0, 3));
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  return (
    <div className="landing-page">
      <section className="hero">
        <div className="overlay"></div>
        <motion.div 
          className="hero-content"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div className="logo" variants={fadeIn}>
            <span className="logo-part1">N<span className="logo-accent">oname</span></span>
            <span className="logo-part2">S<span className="logo-accent">ound</span></span>
          </motion.div>
          <motion.h1 variants={fadeIn}>HANGTECHNIKA BÉRLÉS</motion.h1>
          <motion.p variants={fadeIn}>Minőségi hangszerek és felszerelések minden alkalomra</motion.p>
          <motion.div variants={fadeIn}>
            <Link to="/products" className="cta-button pulse">
              Fedezze fel termékeinket
            </Link>
          </motion.div>
          <motion.div className="qr-section" variants={fadeIn}>
            <p>Termékeinkhez<br/>Olvassa be a QR Kódot!</p>
          </motion.div>
        </motion.div>
      </section>

      <motion.section 
        className="services"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
      >
        <div className="container">
          <motion.h2 variants={fadeIn}>BÁROK / KLUBOK / ESKÜVŐK</motion.h2>
          <motion.h3 variants={fadeIn}>SZÜLETÉSNAPOK / RENDEZVÉNYEK</motion.h3>
          
          <motion.div className="services-grid" variants={staggerContainer}>
            <motion.div className="service-item" variants={fadeIn}>
              <div className="service-icon">
                <span className="highlight">PROFI SZAKÉRTELEM</span>
              </div>
            </motion.div>
            <motion.div className="service-item" variants={fadeIn}>
              <div className="service-icon">
                <span className="highlight">GYORS TELEPÍTÉS</span>
              </div>
            </motion.div>
            <motion.div className="service-item" variants={fadeIn}>
              <div className="service-icon">
                <span className="highlight">MEGFIZETHETŐ ÁR</span>
              </div>
            </motion.div>
          </motion.div>
          
          <motion.div className="delivery-highlight" variants={fadeIn}>
            <h3>BUDAPEST TERÜLETÉN <span className="highlight">INGYENES</span> KISZÁLLÁS!</h3>
          </motion.div>
          
          <motion.div className="motto" variants={fadeIn}>
            "SZÓLJON, HOGY MINŐSÉG SZOLJON!"
          </motion.div>
          
          <motion.div className="contact-info" variants={fadeIn}>
            <p>+36 30 994 3215 / nonamesound0@gmail.com</p>
          </motion.div>
        </div>
      </motion.section>

      <motion.section 
        className="featured-products"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
      >
        <div className="container">
          <motion.h2 variants={fadeIn}>Kiemelt termékeink</motion.h2>
          
          {isLoading ? (
            <div className="loading">
              <div className="loading-spinner"></div>
              <p>A termékek betöltése folyamatban...</p>
            </div>
          ) : featuredProducts.length > 0 ? (
            <motion.div className="products-grid" variants={staggerContainer}>
              {featuredProducts.map((product, index) => (
                <motion.div 
                  key={product.id} 
                  className="product-card"
                  variants={fadeIn}
                  whileHover={{ scale: 1.03, transition: { duration: 0.3 } }}
                >
                  <div className="product-image">
                    <img src={product.image_url || '/placeholder-instrument.jpg'} alt={product.name} />
                    <div className="product-overlay"></div>
                  </div>
                  <div className="product-info">
                    <h3>{product.name}</h3>
                    <p className="price">{product.price_per_day} €</p>
                    <Link to={`/products/${product.id}`} className="view-details">
                      Részletek megtekintése
                    </Link>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.p variants={fadeIn}>Nem található termék.</motion.p>
          )}
          
          <motion.div className="view-all" variants={fadeIn}>
            <Link to="/products" className="view-all-link">
              Összes termék megtekintése
              <span className="arrow">→</span>
            </Link>
          </motion.div>
        </div>
      </motion.section>

      <motion.section 
        className="cta-section"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
      >
        <div className="container">
          <motion.h2 variants={fadeIn}>Készen áll zenélni?</motion.h2>
          <motion.p variants={fadeIn}>Lépjen kapcsolatba velünk még ma, hogy megtalálja a tökéletes hangszereket a következő rendezvényéhez.</motion.p>
          <motion.div variants={fadeIn}>
            <Link to="/contact" className="cta-button pulse">
              Kapcsolatfelvétel
            </Link>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
};

export default Landing;
