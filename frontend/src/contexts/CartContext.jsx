import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  // Carregar do localStorage ao iniciar
  useEffect(() => {
    const savedCart = localStorage.getItem('vibebeats_cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        localStorage.removeItem('vibebeats_cart');
      }
    }
  }, []);

  // Salvar no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem('vibebeats_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (beat) => {
    const exists = items.find(item => item.id === beat.id);
    if (exists) {
      toast.info('Beat já está no carrinho');
      return false;
    }
    setItems(prev => [...prev, { ...beat, addedAt: new Date().toISOString() }]);
    toast.success('Beat adicionado ao carrinho');
    return true;
  };

  const removeFromCart = (beatId) => {
    setItems(prev => prev.filter(item => item.id !== beatId));
    toast.success('Beat removido do carrinho');
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem('vibebeats_cart');
  };

  const isInCart = (beatId) => {
    return items.some(item => item.id === beatId);
  };

  const getTotal = () => {
    return items.reduce((total, item) => total + (item.price || 0), 0);
  };

  const getItemCount = () => {
    return items.length;
  };

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);
  const toggleCart = () => setIsOpen(prev => !prev);

  const value = {
    items,
    isOpen,
    addToCart,
    removeFromCart,
    clearCart,
    isInCart,
    getTotal,
    getItemCount,
    openCart,
    closeCart,
    toggleCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;
