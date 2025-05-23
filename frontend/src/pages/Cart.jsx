// src/pages/Cart.jsx
import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { API_URL } from '../api';
import './Cart.css';

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

  const calculateDays = () => {
    if (!form.start_date || !form.end_date) return 1;
    const startDate = new Date(form.start_date);
    const endDate = new Date(form.end_date);
    if (endDate <= startDate) return 1;
    const timeDiff = endDate.getTime() - startDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysDiff;
  };

  const days = calculateDays();
  const dailyTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = dailyTotal * days;

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
      <h1>🎵 Dein Warenkorb</h1>

      <div className="cart-container">
        {cart.length === 0 ? (
          <div className="empty-cart">
            <p>🎼 Dein Warenkorb ist noch leer.</p>
            <p>Entdecke unsere Auswahl an hochwertigen Musikinstrumenten!</p>
          </div>
        ) : (
          <>
            <ul className="cart-list">
              {cart.map((item, index) => (
                <li
                  key={item.article_id}
                  className="cart-item"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="cart-item-content">
                    <div className="cart-item-info">
                      <h3>{item.name}</h3>
                      <div className="cart-item-price">
                        {item.price.toFixed(2)} € / Tag
                      </div>
                    </div>

                    <div className="quantity-controls">
                      <label>Menge:</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={e => updateQuantity(item.article_id, parseInt(e.target.value) || 1)}
                        className="quantity-input"
                      />
                    </div>

                    <button
                      onClick={() => removeFromCart(item.article_id)}
                      className="remove-btn"
                      aria-label={`${item.name} entfernen`}
                    >
                      ❌ Entfernen
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="total-section">
              <h2>Kostenübersicht</h2>

              <div className="pricing-breakdown">
                <div className="daily-price">
                  <strong>Einzelpreis pro Tag:</strong>
                  <span className="price-value"> {dailyTotal.toFixed(2)} €</span>
                </div>

                {(form.start_date && form.end_date) && (
                  <div className="rental-period">
                    <strong>Gewählter Zeitraum:</strong>
                    <span className="period-value"> {days} Tag{days !== 1 ? 'e' : ''}</span>
                  </div>
                )}

                <div className="calculation-breakdown">
                  <strong>Berechnung:</strong>
                  <span className="price-breakdown">
                    {dailyTotal.toFixed(2)} € × {days} Tag{days !== 1 ? 'e' : ''} = {(dailyTotal * days).toFixed(2)} €
                  </span>
                </div>
              </div>

              <p className="total-price">
                💰 Gesamtpreis: {total.toFixed(2)} €
              </p>
            </div>

            <div className="checkout-section">
              <h2>🎸 Deine Kontaktdaten</h2>

              <div className="checkout-form">
                <div className="form-row">
                  <div className="form-group">
                    <input
                      name="customer_name"
                      type="text"
                      placeholder="Dein Name *"
                      value={form.customer_name}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <input
                      name="customer_email"
                      type="email"
                      placeholder="E-Mail Adresse *"
                      value={form.customer_email}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <input
                      name="customer_phone"
                      type="tel"
                      placeholder="Telefonnummer (optional)"
                      value={form.customer_phone}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group"></div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <input
                      name="start_date"
                      type="date"
                      value={form.start_date}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                    <label style={{
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                      marginTop: '0.25rem',
                      display: 'block'
                    }}>
                      Startdatum *
                    </label>
                  </div>
                  <div className="form-group">
                    <input
                      name="end_date"
                      type="date"
                      value={form.end_date}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                    <label style={{
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                      marginTop: '0.25rem',
                      display: 'block'
                    }}>
                      Enddatum *
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <textarea
                    name="message"
                    placeholder="Besondere Wünsche oder Anmerkungen? (optional)"
                    value={form.message}
                    onChange={handleInputChange}
                    className="form-textarea"
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="submit-btn"
                >
                  {loading ? '🎵 Wird gesendet...' : '🚀 Anfrage absenden'}
                </button>

                {error && (
                  <div className="message error-message">
                    ⚠️ {error}
                  </div>
                )}

                {success && (
                  <div className="message success-message">
                    ✅ {success}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Cart;
