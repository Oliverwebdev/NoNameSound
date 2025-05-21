import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Products.css'; // Wir werden eine separate CSS-Datei erstellen

const Products = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    // Fetch products from API
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/articles');
        
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        
        const data = await response.json();
        setProducts(data);
        setError(null);
      } catch (error) {
        console.error('Error fetching products:', error);
        setError('Fehler beim Laden der Produkte. Bitte versuchen Sie es später erneut.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filter products based on search term and availability filter
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

  return (
    <div className="products-page">
      <div className="gradient-background"></div>
      <div className="container">
        <h1 className="page-title">Unsere Produkte</h1>
        
        <div className="products-filters">
          <div className="search-box">
            <input
              type="text"
              placeholder="Produkt suchen..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
          
          <div className="filter-container">
            <button 
              className="filter-toggle" 
              onClick={toggleFilterMenu}
              aria-expanded={isFilterOpen}
            >
              Filter {isFilterOpen ? '▲' : '▼'}
            </button>
            
            <div className={`filter-dropdown ${isFilterOpen ? 'open' : ''}`}>
              <div className="filter-selector">
                <label htmlFor="availability-filter">Verfügbarkeit:</label>
                <select 
                  id="availability-filter" 
                  value={filter} 
                  onChange={handleFilterChange}
                  className="filter-select"
                >
                  <option value="all">Alle Produkte</option>
                  <option value="available">Nur verfügbare</option>
                  <option value="unavailable">Nur nicht verfügbare</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Produkte werden geladen...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            {error}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="no-products">
            <p>Keine Produkte gefunden.</p>
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.map((product) => (
              <div key={product.id} className="product-card" tabIndex="0">
                <div className="product-image">
                  <img 
                    src={product.image_url || '/placeholder-instrument.jpg'} 
                    alt={product.name} 
                    loading="lazy"
                  />
                  {(!product.is_available || product.quantity_available === 0) && (
                    <div className="unavailable-badge">
                      Nicht verfügbar
                    </div>
                  )}
                </div>
                
                <div className="product-details">
                  <h3 className="product-title">{product.name}</h3>
                  <p className="price">{product.price_per_day} € pro Tag</p>
                  
                  {product.description && (
                    <p className="description">{product.description.length > 100 
                      ? `${product.description.substring(0, 100)}...` 
                      : product.description}
                    </p>
                  )}
                  
                  <div className="product-actions">
                    <button 
                      className={`rent-button ${!product.is_available || product.quantity_available === 0 ? 'disabled' : ''}`}
                      disabled={!product.is_available || product.quantity_available === 0}
                      onClick={() => {
                        // This would typically add the product to a rental cart or similar
                        alert(`${product.name} zur Anfrage hinzugefügt`);
                      }}
                    >
                      {product.is_available && product.quantity_available > 0 
                        ? 'Anfragen' 
                        : 'Nicht verfügbar'}
                    </button>
                    
                    <Link to={`/products/${product.id}`} className="details-link">
                      Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;