import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, ShoppingCart, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FavoriteButton from '@/components/FavoriteButton';
import { useCart } from '@/contexts/CartContext';
import { AuthContext, getCoverUrl } from '@/App';
import { cn } from '@/lib/utils';

const BeatCard = ({
  beat,
  isPlaying,
  onPlay,
  onPause,
  showProducer = true,
  className
}) => {
  const navigate = useNavigate();
  const { addToCart, isInCart } = useCart();
  const { user } = useContext(AuthContext);
  const inCart = isInCart(beat.id);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const handleCardClick = () => {
    navigate(`/beat/${beat.id}`);
  };

  const handlePlayClick = (e) => {
    e.stopPropagation();
    if (isPlaying) {
      onPause?.();
    } else {
      onPlay?.(beat);
    }
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (user?.user_type === 'artist') {
      addToCart(beat);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        'group relative bg-[#1a1a1a] rounded-xl overflow-hidden cursor-pointer',
        'border border-[#2a2a2a] hover:border-[#ff0400]/30',
        'transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1',
        'hover:shadow-lg hover:shadow-[#ff0400]/10',
        className
      )}
    >
      {/* Cover Image */}
      <div className="relative aspect-square overflow-hidden">
        {beat.cover_url ? (
          <img
            src={beat.cover_url.startsWith('http') ? beat.cover_url : getCoverUrl(beat.cover_url)}
            alt={beat.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] flex items-center justify-center">
            <Music className="w-12 h-12 text-gray-600" />
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Play Button */}
        <button
          onClick={handlePlayClick}
          className={cn(
            'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'w-14 h-14 rounded-full bg-[#ff0400] flex items-center justify-center',
            'opacity-0 group-hover:opacity-100 transition-all duration-300',
            'hover:scale-110 active:scale-95',
            'shadow-lg shadow-[#ff0400]/30'
          )}
        >
          {isPlaying ? (
            <Pause className="w-6 h-6 text-white fill-white" />
          ) : (
            <Play className="w-6 h-6 text-white fill-white ml-1" />
          )}
        </button>

        {/* Favorite Button */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <FavoriteButton beat={beat} size="sm" />
        </div>

        {/* BPM & Key Badge */}
        <div className="absolute bottom-3 left-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="px-2 py-1 text-xs font-medium bg-black/70 backdrop-blur-sm rounded text-white">
            {beat.bpm} BPM
          </span>
          <span className="px-2 py-1 text-xs font-medium bg-black/70 backdrop-blur-sm rounded text-white">
            {beat.key}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-white truncate group-hover:text-[#ff0400] transition-colors">
          {beat.title}
        </h3>

        {showProducer && (
          <p className="text-sm text-gray-400 truncate mt-1">
            {beat.producer_name}
          </p>
        )}

        <div className="flex items-center gap-2 mt-2">
          <span className="px-2 py-0.5 text-xs rounded-full bg-[#2a2a2a] text-gray-400">
            {beat.genre}
          </span>
          {beat.license_type === 'exclusive' && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-[#ff0400]/20 text-[#ff0400]">
              Exclusivo
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mt-4">
          <span className="text-lg font-bold text-[#ff0400]">
            {formatPrice(beat.price)}
          </span>

          {user?.user_type === 'artist' && (
            <Button
              size="sm"
              onClick={handleAddToCart}
              disabled={inCart}
              className={cn(
                'transition-all',
                inCart
                  ? 'bg-green-600 hover:bg-green-600 cursor-default'
                  : 'bg-[#ff0400] hover:bg-[#ff0400]/90'
              )}
            >
              <ShoppingCart className="w-4 h-4 mr-1" />
              {inCart ? 'No carrinho' : 'Adicionar'}
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
          <span>{beat.plays || 0} plays</span>
          <span>{beat.purchases || 0} vendas</span>
        </div>
      </div>
    </div>
  );
};

export default BeatCard;
