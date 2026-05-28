import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartApi } from '../lib/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isLoggedIn } = useAuth();
  const [items, setItems]   = useState([]);
  const [total, setTotal]   = useState(0);
  const [count, setCount]   = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!isLoggedIn) { setItems([]); setTotal(0); setCount(0); return; }
    setLoading(true);
    try {
      const { data } = await cartApi.get();
      setItems(data.items || []);
      setTotal(data.total || 0);
      setCount(data.count || 0);
    } catch {}
    setLoading(false);
  }, [isLoggedIn]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addToCart = async (productId, qty = 1) => {
    await cartApi.add(productId, qty);
    fetchCart();
  };

  const updateQty = async (productId, qty) => {
    await cartApi.update(productId, qty);
    fetchCart();
  };

  const removeFromCart = async (productId) => {
    await cartApi.remove(productId);
    fetchCart();
  };

  const clearCart = async () => {
    await cartApi.clear();
    fetchCart();
  };

  return (
    <CartContext.Provider value={{ items, total, count, loading, fetchCart, addToCart, updateQty, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
