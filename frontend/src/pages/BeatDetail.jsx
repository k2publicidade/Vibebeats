import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext, getCoverUrl } from '@/App';
import { PlayerContext } from '@/components/GlobalPlayer';
import { getBeat, getBeats } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import {
  Music,
  ArrowLeft,
  Play,
  Pause,
  ShoppingCart,
  Headphones,
  TrendingUp,
  Clock,
  Key,
  Share2,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Cart from '@/components/Cart';
import FavoriteButton from '@/components/FavoriteButton';
import { useCart } from '@/contexts/CartContext';

const BeatDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { addToPlaylist, playTrack, currentTrack, isPlaying: globalIsPlaying, togglePlay } = useContext(PlayerContext);
  const { addToCart, isInCart } = useCart();
  const [beat, setBeat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedBeats, setRelatedBeats] = useState([]);

  const inCart = beat ? isInCart(beat.id) : false;

  useEffect(() => {
    fetchBeat();
  }, [id]);

  const fetchBeat = async () => {
    try {
      const { data, error } = await getBeat(id);
      if (error || !data) {
        toast.error('Beat não encontrado');
        navigate('/');
        return;
      }
      setBeat(data);
      addToPlaylist([data]);
      fetchRelatedBeats(data.genre);
    } catch (error) {
      console.error('Failed to fetch beat:', error);
      toast.error('Erro ao carregar beat');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedBeats = async (genre) => {
    try {
      const { data, error } = await getBeats({ genre, limit: 4 });
      if (!error && data) {
        setRelatedBeats(data.filter(b => b.id !== id));
      }
    } catch (error) {
      console.error('Failed to fetch related beats:', error);
    }
  };

  const handleTogglePlay = () => {
    if (!beat) return;

    if (currentTrack?.id === beat.id) {
      togglePlay();
    } else {
      playTrack(0);
    }
  };

  const handleAddToCart = () => {
    if (!user) {
      toast.error('Faça login para adicionar ao carrinho');
      navigate('/auth');
      return;
    }

    if (user.user_type !== 'artist') {
      toast.error('Apenas artistas podem comprar beats');
      return;
    }

    addToCart(beat);
  };

  const handleBuyNow = () => {
    if (!user) {
      toast.error('Faça login para comprar');
      navigate('/auth');
      return;
    }

    if (user.user_type !== 'artist') {
      toast.error('Apenas artistas podem comprar beats');
      return;
    }

    addToCart(beat);
    navigate('/checkout');
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: beat.title,
        text: `Confira esse beat: ${beat.title} por ${beat.producer_name}`,
        url: window.location.href
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copiado!');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="flex items-center justify-center pt-32 pb-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[#ff0400]/30 border-t-[#ff0400] rounded-full animate-spin" />
            <span className="text-gray-400">Carregando...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!beat) return null;

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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Beat Cover & Player */}
            <div className="space-y-6">
              <div className="relative rounded-2xl overflow-hidden bg-[#1a1a1a] border border-[#2a2a2a] group">
                <div className="relative aspect-square">
                  {beat.cover_url ? (
                    <img
                      src={getCoverUrl(beat.cover_url)}
                      alt={beat.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a]">
                      <Headphones className="w-32 h-32 text-gray-600" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>

                  {/* Play Button */}
                  <button
                    data-testid="play-button-detail"
                    onClick={handleTogglePlay}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="w-20 h-20 bg-[#ff0400] hover:bg-[#ff0400]/90 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-2xl shadow-[#ff0400]/40">
                      {currentTrack?.id === beat.id && globalIsPlaying ? (
                        <Pause className="w-8 h-8 text-white fill-white" />
                      ) : (
                        <Play className="w-8 h-8 text-white fill-white ml-1" />
                      )}
                    </div>
                  </button>

                  {/* Favorite Button */}
                  <div className="absolute top-4 right-4">
                    <FavoriteButton beat={beat} size="lg" />
                  </div>

                  {/* Share Button */}
                  <button
                    onClick={handleShare}
                    className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-[#1a1a1a] rounded-xl p-4 text-center border border-[#2a2a2a]">
                  <TrendingUp className="w-5 h-5 text-[#ff0400] mx-auto mb-2" />
                  <p className="text-xl font-bold text-white">{beat.plays || 0}</p>
                  <p className="text-xs text-gray-500">Plays</p>
                </div>
                <div className="bg-[#1a1a1a] rounded-xl p-4 text-center border border-[#2a2a2a]">
                  <ShoppingCart className="w-5 h-5 text-[#ff0400] mx-auto mb-2" />
                  <p className="text-xl font-bold text-white">{beat.purchases || 0}</p>
                  <p className="text-xs text-gray-500">Vendas</p>
                </div>
                <div className="bg-[#1a1a1a] rounded-xl p-4 text-center border border-[#2a2a2a]">
                  <Music className="w-5 h-5 text-[#ff0400] mx-auto mb-2" />
                  <p className="text-xl font-bold text-white">{beat.bpm}</p>
                  <p className="text-xs text-gray-500">BPM</p>
                </div>
                <div className="bg-[#1a1a1a] rounded-xl p-4 text-center border border-[#2a2a2a]">
                  <Key className="w-5 h-5 text-[#ff0400] mx-auto mb-2" />
                  <p className="text-xl font-bold text-white">{beat.key || 'C'}</p>
                  <p className="text-xs text-gray-500">Tom</p>
                </div>
              </div>
            </div>

            {/* Beat Info & Purchase */}
            <div className="space-y-6">
              <div>
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-[#ff0400]/20 text-[#ff0400] border border-[#ff0400]/30">
                  {beat.genre}
                </span>
                <h1 data-testid="beat-title" className="text-3xl sm:text-4xl font-bold text-white mt-4 mb-2">
                  {beat.title}
                </h1>
                <p
                  className="text-lg text-gray-400 hover:text-[#ff0400] cursor-pointer transition-colors"
                  onClick={() => navigate(`/producer/${beat.producer_id}`)}
                >
                  por <span className="font-medium">{beat.producer_name}</span>
                </p>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1.5 bg-[#2a2a2a] text-gray-300 rounded-lg text-sm">
                  {beat.key || 'C Major'}
                </span>
                <span className="px-3 py-1.5 bg-[#2a2a2a] text-gray-300 rounded-lg text-sm">
                  {beat.bpm} BPM
                </span>
                <span className="px-3 py-1.5 bg-[#2a2a2a] text-gray-300 rounded-lg text-sm flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {beat.duration || '3:30'}
                </span>
                <span className={`px-3 py-1.5 rounded-lg text-sm ${
                  beat.license_type === 'exclusive'
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'bg-green-500/20 text-green-400'
                }`}>
                  {beat.license_type === 'exclusive' ? 'Exclusivo' : 'Não-exclusivo'}
                </span>
              </div>

              {/* Tags */}
              {beat.tags && beat.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {beat.tags.map((tag, index) => (
                    <span key={index} className="px-2.5 py-1 bg-[#1a1a1a] text-gray-400 rounded text-sm border border-[#2a2a2a]">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Description */}
              <div className="bg-[#1a1a1a] rounded-xl p-5 border border-[#2a2a2a]">
                <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Descrição</h3>
                <p data-testid="beat-description" className="text-gray-300 leading-relaxed">
                  {beat.description || 'Sem descrição disponível.'}
                </p>
              </div>

              {/* Purchase Card */}
              <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a] sticky top-24">
                <div className="flex items-baseline justify-between mb-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Preço</p>
                    <p data-testid="beat-price" className="text-4xl font-bold text-[#ff0400]">
                      {formatPrice(beat.price)}
                    </p>
                  </div>
                  {beat.license_type === 'exclusive' && (
                    <span className="text-xs text-purple-400">Licença única</span>
                  )}
                </div>

                {user?.user_type === 'artist' ? (
                  <div className="space-y-3">
                    <Button
                      data-testid="purchase-button"
                      onClick={handleBuyNow}
                      disabled={inCart}
                      className="w-full h-12 bg-[#ff0400] hover:bg-[#ff0400]/90 text-white text-lg font-semibold"
                    >
                      {inCart ? 'Já está no carrinho' : 'Comprar Agora'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleAddToCart}
                      disabled={inCart}
                      className={`w-full h-12 text-lg ${
                        inCart
                          ? 'border-green-500 text-green-500'
                          : 'border-[#2a2a2a] text-gray-300 hover:text-white hover:bg-[#2a2a2a]'
                      }`}
                    >
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      {inCart ? 'No Carrinho' : 'Adicionar ao Carrinho'}
                    </Button>
                  </div>
                ) : !user ? (
                  <Button
                    onClick={() => navigate('/auth')}
                    className="w-full h-12 bg-[#ff0400] hover:bg-[#ff0400]/90 text-white text-lg font-semibold"
                  >
                    Faça login para comprar
                  </Button>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-400">
                      Apenas artistas podem comprar beats.
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Crie uma conta como artista para fazer compras.
                    </p>
                  </div>
                )}

                {/* Includes */}
                <div className="mt-6 pt-6 border-t border-[#2a2a2a]">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Inclui</p>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li className="flex items-center gap-2">
                      <Download className="w-4 h-4 text-[#ff0400]" />
                      Arquivo WAV de alta qualidade
                    </li>
                    <li className="flex items-center gap-2">
                      <Download className="w-4 h-4 text-[#ff0400]" />
                      Arquivo MP3 320kbps
                    </li>
                    <li className="flex items-center gap-2">
                      <Download className="w-4 h-4 text-[#ff0400]" />
                      {beat.license_type === 'exclusive' ? 'Stems separados' : 'Beat completo'}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Related Beats */}
          {relatedBeats.length > 0 && (
            <section className="mt-16">
              <h2 className="text-2xl font-bold text-white mb-6">Beats Relacionados</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {relatedBeats.slice(0, 4).map((related) => (
                  <div
                    key={related.id}
                    onClick={() => navigate(`/beat/${related.id}`)}
                    className="bg-[#1a1a1a] rounded-xl p-4 border border-[#2a2a2a] hover:border-[#ff0400]/30 cursor-pointer transition-all group"
                  >
                    <div className="aspect-square rounded-lg overflow-hidden bg-[#2a2a2a] mb-3">
                      {related.cover_url ? (
                        <img
                          src={getCoverUrl(related.cover_url)}
                          alt={related.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music className="w-8 h-8 text-gray-600" />
                        </div>
                      )}
                    </div>
                    <h4 className="font-medium text-white truncate group-hover:text-[#ff0400] transition-colors">
                      {related.title}
                    </h4>
                    <p className="text-sm text-gray-500 truncate">{related.producer_name}</p>
                    <p className="text-[#ff0400] font-semibold mt-2">{formatPrice(related.price)}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BeatDetail;
