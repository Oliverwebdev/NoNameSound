// src/context/CartContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    const stored = localStorage.getItem('cart');
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (article, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.article_id === article.id);
      if (existing) {
        return prev.map(item =>
          item.article_id === article.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prev, { article_id: article.id, name: article.name, price: article.price_per_day, quantity }];
      }
    });
  };

  const updateQuantity = (articleId, quantity) => {
    setCart(prev =>
      prev.map(item =>
        item.article_id === articleId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const removeFromCart = (articleId) => {
    setCart(prev => prev.filter(item => item.article_id !== articleId));
  };

  const clearCart = () => setCart([]);

  const value = {
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
