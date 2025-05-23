import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Products.css';
import { useCart } from '../context/CartContext';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [animationPhase, setAnimationPhase] = useState('loading');
  const gridRef = useRef(null);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        setAnimationPhase('loading');
        
        // Add slight delay for smoother animation
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const response = await fetch('/api/articles');
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const data = await response.json();
        setProducts(data);
        setError(null);
        setAnimationPhase('loaded');
      } catch (error) {
        console.error('Error fetching products:', error);
        setError('Hiba a termékek betöltésekor. Kérjük, próbálja meg később újra.');
        setAnimationPhase('error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Stagger animation for product cards
  useEffect(() => {
    if (animationPhase === 'loaded' && gridRef.current) {
      const cards = gridRef.current.querySelectorAll('.product-card');
      cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('animate-in');
      });
    }
  }, [animationPhase, products]);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    if (filter === 'all') {
      return matchesSearch;
    } else if (filter === 'available') {
      return matchesSearch && product.is_available && product.quantity_available > 0;
    } else {
      return matchesSearch && (!product.is_available || product.quantity_available === 0);
    }
  });

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  const toggleFilterMenu = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  const handleAddToCart = (product) => {
    addToCart(product);
    
    // Subtle success feedback
    const button = event.target;
    button.classList.add('cart-success');
    setTimeout(() => {
      button.classList.remove('cart-success');
    }, 1000);
  };

  return (
    <div className="products-page">
      {/* Animated background with floating musical notes */}
      <div className="gradient-background">
        <div className="floating-notes">
          <span className="note note-1">♪</span>
          <span className="note note-2">♫</span>
          <span className="note note-3">♪</span>
          <span className="note note-4">♬</span>
          <span className="note note-5">♫</span>
          <span className="note note-6">♪</span>
        </div>
      </div>
      
      <div className="container">
        <div className="header-section">
          <h1 className="page-title">
            <span className="title-main">Zenei Világ</span>
            <span className="title-sub">Prémium hangszerek bérlése</span>
          </h1>
          
          <div className="stats-bar">
            <div className="stat-item">
              <span className="stat-number">{products.length}</span>
              <span className="stat-label">Hangszer</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">{products.filter(p => p.is_available && p.quantity_available > 0).length}</span>
              <span className="stat-label">Elérhető</span>
            </div>
          </div>
        </div>

        <div className="products-filters">
          <div className="search-section">
            <div className="search-box">
              <div className="search-icon-wrapper">
                <svg className="search-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                  <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <input
                type="text"
                placeholder="Hangszer keresése..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="search-input"
              />
              {searchTerm && (
                <button 
                  className="clear-search"
                  onClick={() => setSearchTerm('')}
                  aria-label="Keresés törlése"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div className="filter-container">
            <button 
              className={`filter-toggle ${isFilterOpen ? 'active' : ''}`}
              onClick={toggleFilterMenu}
              aria-expanded={isFilterOpen}
            >
              <span className="filter-icon">⚙</span>
              <span>Szűrők</span>
              <span className={`arrow ${isFilterOpen ? 'up' : 'down'}`}>⌄</span>
            </button>

            <div className={`filter-dropdown ${isFilterOpen ? 'open' : ''}`}>
              <div className="filter-section">
                <label className="filter-label">Elérhetőség</label>
                <div className="filter-options">
                  <label className="filter-option">
                    <input
                      type="radio"
                      name="availability"
                      value="all"
                      checked={filter === 'all'}
                      onChange={handleFilterChange}
                    />
                    <span className="radio-custom"></span>
                    <span>Összes termék</span>
                  </label>
                  <label className="filter-option">
                    <input
                      type="radio"
                      name="availability"
                      value="available"
                      checked={filter === 'available'}
                      onChange={handleFilterChange}
                    />
                    <span className="radio-custom"></span>
                    <span>Csak elérhető</span>
                  </label>
                  <label className="filter-option">
                    <input
                      type="radio"
                      name="availability"
                      value="unavailable"
                      checked={filter === 'unavailable'}
                      onChange={handleFilterChange}
                    />
                    <span className="radio-custom"></span>
                    <span>Nem elérhető</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="loading-container">
            <div className="loading-composition">
              <div className="vinyl-record">
                <div className="vinyl-center"></div>
                <div className="vinyl-lines"></div>
              </div>
              <div className="loading-text">
                <p className="loading-main">Hangszerek betöltése</p>
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="error-container">
            <div className="error-icon">⚠</div>
            <div className="error-content">
              <h3>Hiba történt</h3>
              <p>{error}</p>
              <button className="retry-button" onClick={() => window.location.reload()}>
                Újrapróbálás
              </button>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="no-products">
            <div className="empty-state">
              <div className="empty-icon">🎵</div>
              <h3>Nincs találat</h3>
              <p>Próbáljon meg más keresési feltételekkel</p>
              {searchTerm && (
                <button 
                  className="clear-filters"
                  onClick={() => {
                    setSearchTerm('');
                    setFilter('all');
                  }}
                >
                  Szűrők törlése
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="products-section">
            <div className="results-header">
              <span className="results-count">
                {filteredProducts.length} hangszer találva
              </span>
            </div>
            
            <div className="products-grid" ref={gridRef}>
              {filteredProducts.map((product, index) => (
                <article key={product.id} className="product-card" tabIndex="0">
                  <div className="product-image-container">
                    <div className="product-image">
                      <img 
                        src={product.image_url || '/placeholder-instrument.jpg'} 
                        alt={product.name}
                        loading="lazy"
                      />
                      <div className="image-overlay">
                        <Link to={`/products/${product.id}`} className="quick-view">
                          <span>Részletek</span>
                        </Link>
                      </div>
                    </div>
                    
                    {(!product.is_available || product.quantity_available === 0) && (
                      <div className="availability-badge unavailable">
                        <span>Nem elérhető</span>
                      </div>
                    )}
                    
                    {product.is_available && product.quantity_available > 0 && product.quantity_available <= 3 && (
                      <div className="availability-badge limited">
                        <span>Csak {product.quantity_available} db</span>
                      </div>
                    )}
                  </div>

                  <div className="product-content">
                    <div className="product-header">
                      <h3 className="product-title">{product.name}</h3>
                      <div className="price-tag">
                        <span className="price-amount">{product.price_per_day}</span>
                        <span className="price-currency">€</span>
                        <span className="price-period">/nap</span>
                      </div>
                    </div>

                    {product.description && (
                      <p className="product-description">
                        {product.description.length > 120 
                          ? `${product.description.substring(0, 120)}...` 
                          : product.description}
                      </p>
                    )}

                    <div className="product-footer">
                      <button 
                        className={`add-to-cart-btn ${!product.is_available || product.quantity_available === 0 ? 'disabled' : ''}`}
                        onClick={() => handleAddToCart(product)}
                        disabled={!product.is_available || product.quantity_available === 0}
                      >
                        <span className="btn-icon">🛒</span>
                        <span className="btn-text">
                          {product.is_available && product.quantity_available > 0 ? 'Kosárba' : 'Nem elérhető'}
                        </span>
                        <div className="btn-ripple"></div>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;