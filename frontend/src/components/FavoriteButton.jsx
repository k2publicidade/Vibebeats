import React from 'react';
import { Heart } from 'lucide-react';
import { useFavorites } from '@/contexts/FavoritesContext';
import { cn } from '@/lib/utils';

const FavoriteButton = ({ beat, size = 'md', className }) => {
  const { toggleFavorite, isFavorite } = useFavorites();
  const isFav = isFavorite(beat.id);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(beat);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'rounded-full flex items-center justify-center transition-all duration-200',
        'hover:scale-110 active:scale-95',
        isFav
          ? 'bg-[#ff0400]/20 text-[#ff0400]'
          : 'bg-black/50 backdrop-blur-sm text-white/70 hover:text-white hover:bg-black/70',
        sizeClasses[size],
        className
      )}
      aria-label={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
    >
      <Heart
        className={cn(
          iconSizes[size],
          'transition-all duration-200',
          isFav && 'fill-[#ff0400]'
        )}
      />
    </button>
  );
};

export default FavoriteButton;
