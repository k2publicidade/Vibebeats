import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Play, Trash2, Music, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Cart from '@/components/Cart';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useCart } from '@/contexts/CartContext';
import { AuthContext, getFileUrl } from '@/App';
import { PlayerContext } from '@/components/GlobalPlayer';

const Favorites = () => {
  const navigate = useNavigate();
  const { favorites, removeFromFavorites, clearFavorites } = useFavorites();
  const { addToCart, isInCart } = useCart();
  const { user } = useContext(AuthContext);
  const { playTrack, addToPlaylist, currentTrack, isPlaying, togglePlay } = useContext(PlayerContext);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const handlePlay = (beat) => {
    addToPlaylist(favorites);
    const index = favorites.findIndex(b => b.id === beat.id);
    playTrack(index);
  };

  const isCurrentPlaying = (beatId) => {
    return currentTrack?.id === beatId && isPlaying;
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <Cart />

      <main className="pt-24 pb-20">
        <div className="max-w-6xl mx-auto px-4">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#ff0400] to-[#ff0400]/50 flex items-center justify-center">
                <Heart className="w-7 h-7 text-white fill-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Favoritos</h1>
                <p className="text-gray-400">
                  {favorites.length} {favorites.length === 1 ? 'beat salvo' : 'beats salvos'}
                </p>
              </div>
            </div>

            {favorites.length > 0 && (
              <Button
                variant="outline"
                onClick={clearFavorites}
                className="border-[#2a2a2a] text-gray-400 hover:text-red-400 hover:border-red-500/30"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Limpar Tudo
              </Button>
            )}
          </div>

          {favorites.length === 0 ? (
            <div className="text-center py-20">
              <Heart className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <h2 className="text-xl font-semibold text-white mb-2">
                Nenhum favorito ainda
              </h2>
              <p className="text-gray-400 mb-6">
                Explore nosso catálogo e salve os beats que você mais gosta.
              </p>
              <Button
                onClick={() => navigate('/')}
                className="bg-[#ff0400] hover:bg-[#ff0400]/90"
              >
                Explorar Beats
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {favorites.map((beat, index) => (
                <div
                  key={beat.id}
                  className="group flex items-center gap-4 p-4 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#ff0400]/30 transition-all"
                >
                  {/* Index */}
                  <span className="w-8 text-center text-gray-500 text-sm">
                    {index + 1}
                  </span>

                  {/* Cover & Play */}
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-[#2a2a2a] flex-shrink-0">
                    {beat.cover_url ? (
                      <img
                        src={getFileUrl(beat.cover_url)}
                        alt={beat.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-6 h-6 text-gray-500" />
                      </div>
                    )}
                    <button
                      onClick={() => handlePlay(beat)}
                      className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Play className={`w-6 h-6 text-white ${isCurrentPlaying(beat.id) ? 'fill-white' : ''}`} />
                    </button>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-semibold text-white truncate cursor-pointer hover:text-[#ff0400] transition-colors"
                      onClick={() => navigate(`/beat/${beat.id}`)}
                    >
                      {beat.title}
                    </h3>
                    <p
                      className="text-sm text-gray-400 truncate cursor-pointer hover:text-[#ff0400] transition-colors"
                      onClick={() => navigate(`/producer/${beat.producer_id}`)}
                    >
                      {beat.producer_name}
                    </p>
                  </div>

                  {/* Meta */}
                  <div className="hidden sm:flex items-center gap-4 text-sm text-gray-500">
                    <span>{beat.bpm} BPM</span>
                    <span>{beat.genre}</span>
                  </div>

                  {/* Price */}
                  <div className="text-[#ff0400] font-semibold">
                    {formatPrice(beat.price)}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {user?.user_type === 'artist' && (
                      <Button
                        size="sm"
                        onClick={() => addToCart(beat)}
                        disabled={isInCart(beat.id)}
                        className={
                          isInCart(beat.id)
                            ? 'bg-green-600 hover:bg-green-600'
                            : 'bg-[#ff0400] hover:bg-[#ff0400]/90'
                        }
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFromFavorites(beat.id)}
                      className="text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Favorites;
