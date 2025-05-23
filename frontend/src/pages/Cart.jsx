// src/pages/Cart.jsx
import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { API_URL } from '../api';
import './Cart.css'; // Du kannst eigene Styles hier hinzufügen

const Cart = () => {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    start_date: '',
    end_date: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const total = cart.reduce((sum, item) =>
    sum + item.price * item.quantity, 0);

  const handleSubmit = async () => {
    if (!form.customer_name || !form.customer_email || !form.start_date || !form.end_date) {
      setError("Bitte fülle alle Pflichtfelder aus.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${API_URL}/rentals/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          items: cart.map(item => ({
            article_id: item.article_id,
            quantity: item.quantity
          }))
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Fehler bei der Anfrage');

      setSuccess("Deine Anfrage wurde übermittelt. Wir melden uns bald.");
      clearCart();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cart-page">
      <h1>🛒 Dein Warenkorb</h1>

      {cart.length === 0 ? (
        <p>Dein Warenkorb ist leer.</p>
      ) : (
        <>
          <ul className="cart-list">
            {cart.map(item => (
              <li key={item.article_id} className="cart-item">
                <div>
                  <strong>{item.name}</strong><br />
                  {item.price.toFixed(2)} € / Tag
                </div>
                <div>
                  Menge: <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={e => updateQuantity(item.article_id, parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <button onClick={() => removeFromCart(item.article_id)}>❌ Entfernen</button>
                </div>
              </li>
            ))}
          </ul>

          <p className="total-price"><strong>Gesamtpreis pro Tag:</strong> {total.toFixed(2)} €</p>

          <h2>Deine Kontaktdaten</h2>
          <div className="checkout-form">
            <input name="customer_name" placeholder="Dein Name *" onChange={handleInputChange} />
            <input name="customer_email" type="email" placeholder="E-Mail *" onChange={handleInputChange} />
            <input name="customer_phone" placeholder="Telefon (optional)" onChange={handleInputChange} />
            <input name="start_date" type="date" onChange={handleInputChange} />
            <input name="end_date" type="date" onChange={handleInputChange} />
            <textarea name="message" placeholder="Nachricht (optional)" onChange={handleInputChange}></textarea>
            <button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Wird gesendet...' : 'Anfrage absenden'}
            </button>
            {error && <p className="error-message">⚠️ {error}</p>}
            {success && <p className="success-message">✅ {success}</p>}
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;
