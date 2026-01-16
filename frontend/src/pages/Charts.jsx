import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext, getCoverUrl } from '@/App';
import { PlayerContext } from '@/components/GlobalPlayer';
import { Button } from '@/components/ui/button';
import { Music, TrendingUp, Crown, Award, Play, Pause, Headphones } from 'lucide-react';
import { toast } from 'sonner';
import Waveform from '@/components/Waveform';
import Logo from '@/components/Logo';
import { getBeats, getProducers } from '@/lib/supabase';

const Charts = () => {
  const navigate = useNavigate();
  const { addToPlaylist, playTrack, currentTrack, isPlaying: globalIsPlaying } = useContext(PlayerContext);
  const [topBeats, setTopBeats] = useState([]);
  const [topProducers, setTopProducers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('beats'); // 'beats' or 'producers'

  useEffect(() => {
    fetchCharts();
  }, []);

  const fetchCharts = async () => {
    try {
      // Fetch top beats using Supabase
      const { data: beatsData, error: beatsError } = await getBeats({ limit: 20 });
      if (!beatsError && beatsData) {
        // Sort by plays descending
        const sortedBeats = beatsData.sort((a, b) => (b.plays || 0) - (a.plays || 0));
        setTopBeats(sortedBeats);
        addToPlaylist(sortedBeats);
      }

      // Fetch top producers using Supabase
      const { data: producersData, error: producersError } = await getProducers({ limit: 10 });
      if (!producersError && producersData) {
        setTopProducers(producersData);
      }
    } catch (error) {
      console.error('Failed to fetch charts:', error);
      toast.error('Erro ao carregar charts');
    } finally {
      setLoading(false);
    }
  };

  const playBeat = (beat, index) => {
    playTrack(index);
  };

  const getRankIcon = (position) => {
    if (position === 1) return <Crown className="w-6 h-6 text-yellow-400" />;
    if (position === 2) return <Award className="w-6 h-6 text-gray-300" />;
    if (position === 3) return <Award className="w-6 h-6 text-orange-400" />;
    return <span className="text-gray-500 font-bold">#{position}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-[#ff0400] text-xl">Carregando charts...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="glass border-b border-[#ff0400]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Logo className="h-8" />

            <nav className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-[#efd7ce] hover:text-white transition-colors">
                Beats
              </Link>
              <Link to="/artists" className="text-[#efd7ce] hover:text-white transition-colors">
                Artists
              </Link>
              <Link to="/charts" className="text-[#ff0400] font-semibold">
                Charts
              </Link>
              <Link to="/about" className="text-[#efd7ce] hover:text-white transition-colors">
                About
              </Link>
            </nav>

            <Link to="/auth">
              <Button className="bg-[#ff0400] hover:bg-[#ff0400]/90 text-white">
                Login / Signup
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#ff0400]/10 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <TrendingUp className="w-12 h-12 text-[#ff0400]" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Top <span className="text-[#ff0400]">Charts</span>
            </h1>
            <p className="text-xl text-[#efd7ce]/80 max-w-2xl mx-auto">
              Descubra os beats e produtores mais populares do momento.
              Rankings atualizados em tempo real.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-4 mb-8">
          <Button
            onClick={() => setActiveTab('beats')}
            className={activeTab === 'beats' 
              ? 'bg-[#ff0400] text-white' 
              : 'bg-zinc-900 text-gray-400 hover:text-white'
            }
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Top Beats
          </Button>
          <Button
            onClick={() => setActiveTab('producers')}
            className={activeTab === 'producers' 
              ? 'bg-[#ff0400] text-white' 
              : 'bg-zinc-900 text-gray-400 hover:text-white'
            }
          >
            <Crown className="w-4 h-4 mr-2" />
            Top Produtores
          </Button>
        </div>

        {/* Top Beats */}
        {activeTab === 'beats' && (
          <div>
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-[#ff0400]" />
              Beats Mais Populares
            </h2>

            {topBeats.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center">
                <Music className="w-20 h-20 text-gray-600 mx-auto mb-4" />
                <p className="text-xl text-gray-400">Nenhum beat disponível ainda</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topBeats.map((beat, index) => (
                  <div
                    key={beat.id}
                    className="glass rounded-lg p-4 hover:bg-zinc-900/70 transition-all cursor-pointer group"
                    onClick={() => navigate(`/beat/${beat.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className="w-12 flex items-center justify-center">
                        {getRankIcon(index + 1)}
                      </div>

                      {/* Play Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playBeat(beat, index);
                        }}
                        className="bg-[#ff0400] hover:bg-[#ff0400]/90 rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110"
                      >
                        {currentTrack?.id === beat.id && globalIsPlaying ? (
                          <Pause className="w-5 h-5 text-white" />
                        ) : (
                          <Play className="w-5 h-5 text-white ml-0.5" />
                        )}
                      </button>

                      {/* Cover */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-zinc-900 flex-shrink-0">
                        {beat.cover_url ? (
                          <img src={beat.cover_url} alt={beat.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Headphones className="w-6 h-6 text-gray-600" />
                          </div>
                        )}
                      </div>

                      {/* Waveform */}
                      <div className="h-16 flex-1 min-w-0">
                        <Waveform isPlaying={currentTrack?.id === beat.id && globalIsPlaying} />
                      </div>

                      {/* Info */}
                      <div className="flex-shrink-0 text-right">
                        <h3 className="font-semibold text-white mb-1">{beat.title}</h3>
                        <p className="text-sm text-gray-400 mb-1">por {beat.producer_name}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>{beat.plays || 0} plays</span>
                          <span>{beat.bpm} BPM</span>
                          <span className="text-[#ff0400] font-bold">R$ {beat.price.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Top Producers */}
        {activeTab === 'producers' && (
          <div>
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <Crown className="w-8 h-8 text-yellow-400" />
              Produtores Mais Vendidos
            </h2>

            {topProducers.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center">
                <Crown className="w-20 h-20 text-gray-600 mx-auto mb-4" />
                <p className="text-xl text-gray-400">Nenhum produtor disponível ainda</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {topProducers.map((producer, index) => (
                  <div
                    key={producer.id}
                    onClick={() => navigate(`/producer/${producer.id}`)}
                    className="glass rounded-xl p-6 hover:scale-105 transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className="w-12 flex items-center justify-center">
                        {getRankIcon(index + 1)}
                      </div>

                      {/* Avatar */}
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#ff0400] to-[#ff0400]/90 flex items-center justify-center text-white text-2xl font-bold">
                        {producer.name.charAt(0).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-1">{producer.name}</h3>
                        {producer.bio && (
                          <p className="text-sm text-gray-400 mb-2 line-clamp-1">{producer.bio}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-[#efd7ce]">
                            {producer.total_beats || 0} beats
                          </span>
                          <span className="text-[#ff0400] font-bold">
                            {producer.total_sales || 0} vendas
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Charts;