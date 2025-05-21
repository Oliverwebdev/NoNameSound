import React, { useEffect, useState } from 'react';
import { authFetch } from '../../utils/authFetch';

function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Produkte laden
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const res = await authFetch('/api/articles');
        if (!res.ok) throw new Error('Fehler beim Laden der Produkte');
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="manage-products">
      <h1>Produkte verwalten</h1>
      {isLoading ? (
        <p>Produkte werden geladen...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Preis/Tag</th>
              <th>Verfügbar</th>
              <th>Menge</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {products.map(prod => (
              <tr key={prod.id}>
                <td>{prod.name}</td>
                <td>{prod.price_per_day} €</td>
                <td>{prod.is_available ? "✅" : "❌"}</td>
                <td>{prod.quantity_available}</td>
                <td>
                  {/* Edit/Delete-Buttons als Platzhalter */}
                  <button>Bearbeiten</button>
                  <button>Löschen</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {/* Button für neuen Artikel */}
      <button>+ Neues Produkt</button>
    </div>
  );
}

export default ManageProducts;
