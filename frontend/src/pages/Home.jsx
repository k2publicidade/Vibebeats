import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext, getCoverUrl } from '@/App';
import { PlayerContext } from '@/components/GlobalPlayer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, TrendingUp, Disc3, Headphones, ChevronDown, Sparkles, Play } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BeatCard from '@/components/BeatCard';
import Cart from '@/components/Cart';
import { getBeats } from '@/lib/supabase';

const Home = () => {
  const { user } = useContext(AuthContext);
  const { addToPlaylist, playTrack, currentTrack, isPlaying: globalIsPlaying, togglePlay } = useContext(PlayerContext);
  const navigate = useNavigate();
  const [beats, setBeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [genreFilter, setGenreFilter] = useState('all');
  const [bpmFilter, setBpmFilter] = useState('all');
  const [keyFilter, setKeyFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');

  const genres = ['all', 'Hip Hop', 'Trap', 'R&B', 'Pop', 'Lo-fi', 'Electronic', 'Rock', 'Jazz', 'Reggaeton'];
  const bpmRanges = ['all', '60-90', '90-120', '120-140', '140-180'];
  const keys = ['all', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const priceRanges = ['all', '0-50', '50-100', '100-200', '200+'];

  useEffect(() => {
    fetchBeats();
  }, [genreFilter]);

  useEffect(() => {
    if (searchTerm.length > 0) {
      const debounce = setTimeout(() => {
        fetchBeats();
      }, 500);
      return () => clearTimeout(debounce);
    } else if (searchTerm.length === 0) {
      fetchBeats();
    }
  }, [searchTerm]);

  const fetchBeats = async () => {
    try {
      const filters = {
        limit: 50
      };

      if (genreFilter !== 'all') {
        filters.genre = genreFilter;
      }

      if (searchTerm) {
        filters.search = searchTerm;
      }

      // Parse BPM filter
      if (bpmFilter !== 'all') {
        const [minBpm, maxBpm] = bpmFilter.split('-').map(Number);
        filters.minBpm = minBpm;
        filters.maxBpm = maxBpm;
      }

      // Parse price filter
      if (priceFilter !== 'all') {
        if (priceFilter === '200+') {
          // No max price for 200+
        } else {
          const [, maxPrice] = priceFilter.split('-').map(Number);
          filters.maxPrice = maxPrice;
        }
      }

      const { data, error } = await getBeats(filters);

      if (error) {
        console.error('Failed to fetch beats:', error);
        toast.error('Falha ao carregar beats');
        return;
      }

      const beatsData = data || [];
      setBeats(beatsData);

      if (beatsData.length > 0) {
        addToPlaylist(beatsData);
      }
    } catch (error) {
      console.error('Failed to fetch beats:', error);
      toast.error('Falha ao carregar beats');
    } finally {
      setLoading(false);
    }
  };

  const playBeat = (beat) => {
    if (beats.length > 0) {
      addToPlaylist(beats);
      const beatIndex = beats.findIndex(b => b.id === beat.id);
      if (beatIndex !== -1) {
        setTimeout(() => {
          playTrack(beatIndex);
        }, 0);
      } else {
        toast.error('Beat não encontrado na playlist');
      }
    } else {
      toast.error('Nenhum beat disponível para reproduzir');
    }
  };

  const handlePause = () => {
    togglePlay();
  };

  const isCurrentlyPlaying = (beatId) => {
    return currentTrack?.id === beatId && globalIsPlaying;
  };

  const topCharts = beats.slice(0, 10).sort((a, b) => (b.plays || 0) - (a.plays || 0));
  const featuredBeats = beats.slice(0, 12);

  // Helper to get cover image URL
  const getBeatCoverUrl = (beat) => {
    if (!beat.cover_url) return null;
    if (beat.cover_url.startsWith('http')) return beat.cover_url;
    return getCoverUrl(beat.cover_url);
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <Cart />

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-4 sm:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#ff0400]/10 via-black to-[#efd7ce]/5"></div>
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#ff0400]/10 rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#efd7ce]/10 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="max-w-[1400px] mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#ff0400]/10 border border-[#ff0400]/20 mb-6">
            <Sparkles className="w-4 h-4 text-[#ff0400]" />
            <span className="text-sm text-[#ff0400] font-medium">Novos beats toda semana</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="text-white">
              Seu Som, Nosso Ritmo.
            </span>
            <br />
            <span className="bg-gradient-to-r from-[#ff0400] to-[#ff6b6b] bg-clip-text text-transparent">
              Compre e Venda Beats Premium.
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            A plataforma definitiva para produtores talentosos e artistas visionários.
            Compre, venda e crie hits que definem gerações.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => document.getElementById('beats-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-[#ff0400] hover:bg-[#ff0400]/90 text-white text-lg px-8 py-6 rounded-xl shadow-2xl shadow-[#ff0400]/40 transition-all hover:scale-105"
            >
              <Play className="w-5 h-5 mr-2" />
              Explorar Beats
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/auth')}
              className="border-2 border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white text-lg px-8 py-6 rounded-xl transition-all"
            >
              Começar a Vender
            </Button>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 sm:gap-16 mt-16">
            <div className="text-center">
              <p className="text-3xl sm:text-4xl font-bold text-white">500+</p>
              <p className="text-gray-500 text-sm">Produtores</p>
            </div>
            <div className="text-center">
              <p className="text-3xl sm:text-4xl font-bold text-white">10K+</p>
              <p className="text-gray-500 text-sm">Beats</p>
            </div>
            <div className="text-center">
              <p className="text-3xl sm:text-4xl font-bold text-white">50K+</p>
              <p className="text-gray-500 text-sm">Downloads</p>
            </div>
          </div>
        </div>
      </section>

      {/* Search and Filters Section */}
      <section id="beats-section" className="max-w-[1400px] mx-auto px-4 sm:px-8 py-8">
        <div className="bg-[#1a1a1a]/80 rounded-2xl p-6 backdrop-blur-sm border border-[#2a2a2a]">
          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
            <Input
              type="text"
              placeholder="Buscar beats, produtores, estilos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 bg-black/50 border-[#2a2a2a] text-white placeholder:text-gray-500 h-14 text-lg rounded-xl focus:border-[#ff0400]/50 focus:ring-[#ff0400]/20"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <Select value={genreFilter} onValueChange={setGenreFilter}>
              <SelectTrigger className="w-36 bg-black/50 border-[#2a2a2a] text-white hover:border-[#ff0400]/30">
                <SelectValue placeholder="Gênero" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                {genres.map((genre) => (
                  <SelectItem key={genre} value={genre} className="text-white hover:bg-[#2a2a2a]">
                    {genre === 'all' ? 'Todos os Gêneros' : genre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={bpmFilter} onValueChange={setBpmFilter}>
              <SelectTrigger className="w-32 bg-black/50 border-[#2a2a2a] text-white hover:border-[#ff0400]/30">
                <SelectValue placeholder="BPM" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                {bpmRanges.map((range) => (
                  <SelectItem key={range} value={range} className="text-white hover:bg-[#2a2a2a]">
                    {range === 'all' ? 'Todos os BPM' : `${range} BPM`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={keyFilter} onValueChange={setKeyFilter}>
              <SelectTrigger className="w-32 bg-black/50 border-[#2a2a2a] text-white hover:border-[#ff0400]/30">
                <SelectValue placeholder="Tom" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                {keys.map((key) => (
                  <SelectItem key={key} value={key} className="text-white hover:bg-[#2a2a2a]">
                    {key === 'all' ? 'Todos os Tons' : key}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priceFilter} onValueChange={setPriceFilter}>
              <SelectTrigger className="w-36 bg-black/50 border-[#2a2a2a] text-white hover:border-[#ff0400]/30">
                <SelectValue placeholder="Preço" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                {priceRanges.map((range) => (
                  <SelectItem key={range} value={range} className="text-white hover:bg-[#2a2a2a]">
                    {range === 'all' ? 'Todos os Preços' : `R$${range}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(genreFilter !== 'all' || bpmFilter !== 'all' || keyFilter !== 'all' || priceFilter !== 'all' || searchTerm) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setGenreFilter('all');
                  setBpmFilter('all');
                  setKeyFilter('all');
                  setPriceFilter('all');
                  setSearchTerm('');
                }}
                className="text-gray-400 hover:text-white"
              >
                Limpar filtros
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Beats Grid */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            {searchTerm ? `Resultados para "${searchTerm}"` : 'Beats em Destaque'}
          </h2>
          <span className="text-gray-500">{beats.length} beats</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-[#1a1a1a] rounded-xl aspect-[4/5] animate-pulse border border-[#2a2a2a]">
                <div className="aspect-square bg-[#2a2a2a] rounded-t-xl"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-[#2a2a2a] rounded w-3/4"></div>
                  <div className="h-3 bg-[#2a2a2a] rounded w-1/2"></div>
                  <div className="h-8 bg-[#2a2a2a] rounded w-full mt-4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : beats.length === 0 ? (
          <div className="text-center py-20">
            <Disc3 className="w-20 h-20 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Nenhum beat encontrado</h3>
            <p className="text-gray-400">Tente ajustar seus filtros ou buscar por outro termo.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {featuredBeats.map((beat) => (
              <BeatCard
                key={beat.id}
                beat={beat}
                isPlaying={isCurrentlyPlaying(beat.id)}
                onPlay={playBeat}
                onPause={handlePause}
              />
            ))}
          </div>
        )}

        {beats.length > 12 && (
          <div className="text-center mt-10">
            <Button
              variant="outline"
              size="lg"
              className="border-[#2a2a2a] text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
            >
              Ver todos os beats
            </Button>
          </div>
        )}
      </section>

      {/* Top Charts Section */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#ff0400]/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#ff0400]" />
            </div>
            <h2 className="text-2xl font-bold text-white">Top Charts</h2>
          </div>
          <Link to="/charts" className="text-[#ff0400] hover:text-[#ff0400]/80 font-medium transition-colors">
            Ver todos →
          </Link>
        </div>

        <div className="bg-[#1a1a1a]/50 rounded-2xl border border-[#2a2a2a] overflow-hidden">
          {topCharts.slice(0, 5).map((beat, index) => (
            <div
              key={beat.id}
              onClick={() => navigate(`/beat/${beat.id}`)}
              className="flex items-center gap-4 p-4 hover:bg-[#2a2a2a]/50 transition-colors cursor-pointer border-b border-[#2a2a2a] last:border-0"
            >
              <span className="text-2xl font-bold text-[#ff0400] w-8 text-center">
                {index + 1}
              </span>
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#2a2a2a] flex-shrink-0">
                {beat.cover_url ? (
                  <img
                    src={getBeatCoverUrl(beat)}
                    alt={beat.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Headphones className="w-6 h-6 text-gray-600" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-white truncate hover:text-[#ff0400] transition-colors">
                  {beat.title}
                </h4>
                <p className="text-sm text-gray-400 truncate">{beat.producer_name}</p>
              </div>
              <div className="hidden sm:flex items-center gap-4 text-sm text-gray-500">
                <span>{beat.bpm} BPM</span>
                <span>{beat.genre}</span>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[#ff0400] font-semibold">
                  R${beat.price?.toFixed(0) || '0'}
                </p>
                <p className="text-xs text-gray-500">{beat.plays || 0} plays</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-8 py-16">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#ff0400] to-[#ff6b6b] p-8 sm:p-12">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Pronto para vender seus beats?
            </h2>
            <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
              Junte-se a centenas de produtores que já estão lucrando com sua música na VibeBeats.
            </p>
            <Button
              size="lg"
              onClick={() => navigate('/auth')}
              className="bg-white text-[#ff0400] hover:bg-white/90 text-lg px-8 py-6 rounded-xl shadow-lg"
            >
              Criar Conta Grátis
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
