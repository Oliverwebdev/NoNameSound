import { useState, useEffect } from 'react';
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
  const { addToCart } = useCart();

  

  useEffect(() => {
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
        setError('Hiba a termékek betöltésekor. Kérjük, próbálja meg később újra.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

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
        <h1 className="page-title">Termékeink</h1>

        <div className="products-filters">
          <div className="search-box">
            <input
              type="text"
              placeholder="Keresés..."
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
              Szűrő {isFilterOpen ? '▲' : '▼'}
            </button>

            <div className={`filter-dropdown ${isFilterOpen ? 'open' : ''}`}>
              <div className="filter-selector">
                <label htmlFor="availability-filter">Elérhetőség:</label>
                <select 
                  id="availability-filter" 
                  value={filter} 
                  onChange={handleFilterChange}
                  className="filter-select"
                >
                  <option value="all">Összes termék</option>
                  <option value="available">Csak elérhető</option>
                  <option value="unavailable">Csak nem elérhető</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>A termékek betöltése folyamatban...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            {error}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="no-products">
            <p>Nincs találat.</p>
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
                      Nem elérhető
                    </div>
                  )}
                </div>

                <div className="product-details">
                  <h3 className="product-title">{product.name}</h3>
                  <p className="price">{product.price_per_day}&nbsp;€</p>

                  {product.description && (
                    <p className="description">{product.description.length > 100 
                      ? `${product.description.substring(0, 100)}...` 
                      : product.description}
                    </p>
                  )}

                  <div className="product-actions">
                    <button 
                      className="add-to-cart-button" 
                      onClick={() => addToCart(product)}
                      disabled={!product.is_available || product.quantity_available === 0}
                    >
                      {product.is_available && product.quantity_available > 0 ? 'Kosárba' : 'Nem elérhető'}
                    </button>

                    <Link to={`/products/${product.id}`} className="details-link">
                      Részletek
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