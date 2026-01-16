import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

const FavoritesContext = createContext();

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);

  // Carregar do localStorage ao iniciar
  useEffect(() => {
    const savedFavorites = localStorage.getItem('vibebeats_favorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (e) {
        localStorage.removeItem('vibebeats_favorites');
      }
    }
  }, []);

  // Salvar no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem('vibebeats_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const addToFavorites = (beat) => {
    const exists = favorites.find(item => item.id === beat.id);
    if (exists) {
      toast.info('Beat já está nos favoritos');
      return false;
    }
    setFavorites(prev => [...prev, { ...beat, favoritedAt: new Date().toISOString() }]);
    toast.success('Adicionado aos favoritos');
    return true;
  };

  const removeFromFavorites = (beatId) => {
    setFavorites(prev => prev.filter(item => item.id !== beatId));
    toast.success('Removido dos favoritos');
  };

  const toggleFavorite = (beat) => {
    if (isFavorite(beat.id)) {
      removeFromFavorites(beat.id);
      return false;
    } else {
      addToFavorites(beat);
      return true;
    }
  };

  const isFavorite = (beatId) => {
    return favorites.some(item => item.id === beatId);
  };

  const getFavoritesCount = () => {
    return favorites.length;
  };

  const clearFavorites = () => {
    setFavorites([]);
    localStorage.removeItem('vibebeats_favorites');
  };

  const value = {
    favorites,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorite,
    getFavoritesCount,
    clearFavorites
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

export default FavoritesContext;
