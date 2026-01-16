import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AuthContext, getCoverUrl } from '@/App';
import { PlayerContext } from '@/components/GlobalPlayer';
import { Button } from '@/components/ui/button';
import { Music, ArrowLeft, Play, Pause, Headphones, TrendingUp, Heart } from 'lucide-react';
import Logo from '@/components/Logo';
import { toast } from 'sonner';
import Waveform from '@/components/Waveform';
import { getUserProfile, getProducerBeats } from '@/lib/supabase';

const ProducerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { addToPlaylist, playTrack, currentTrack, isPlaying: globalIsPlaying } = useContext(PlayerContext);
  const [producer, setProducer] = useState(null);
  const [beats, setBeats] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducerData();
  }, [id]);

  const fetchProducerData = async () => {
    try {
      // Buscar informações do produtor
      const { data: userData, error: userError } = await getUserProfile(id);
      if (userError || !userData) {
        toast.error('Produtor não encontrado');
        navigate('/');
        return;
      }
      setProducer(userData);

      // Buscar beats do produtor
      const { data: beatsData, error: beatsError } = await getProducerBeats(id);
      const beatsList = beatsData || [];
      setBeats(beatsList);
      addToPlaylist(beatsList);

      // Calcular estatísticas
      const totalPlays = beatsList.reduce((sum, beat) => sum + (beat.plays || 0), 0);
      const totalSales = beatsList.reduce((sum, beat) => sum + (beat.purchases || 0), 0);
      setStats({
        totalBeats: beatsList.length,
        totalPlays,
        totalSales
      });
    } catch (error) {
      console.error('Failed to fetch producer:', error);
      toast.error('Erro ao carregar produtor');
    } finally {
      setLoading(false);
    }
  };

  const playBeat = (beat, index) => {
    playTrack(index);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-[#ff0400] text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="glass border-b border-[#ff0400]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/">
                <Button variant="ghost" className="text-[#ff0400] hover:text-[#ff0400]/80">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <Logo className="h-8" />
            </div>
          </div>
        </div>
      </header>

      {/* Producer Header */}
      <div className="relative">
        <div className="h-48 bg-gradient-to-r from-[#ff0400]/20 to-black"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-20">
            <div className="flex items-end gap-6">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#ff0400] to-[#ff0400]/90 flex items-center justify-center text-white text-5xl font-bold border-4 border-black">
                {producer.name.charAt(0).toUpperCase()}
              </div>
              <div className="pb-4 flex-1">
                <h1 className="text-4xl font-bold text-white mb-2">{producer.name}</h1>
                <p className="text-gray-400 text-lg">Produtor Musical</p>
                {producer.bio && (
                  <p className="text-gray-300 mt-2 max-w-2xl">{producer.bio}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-3 gap-6 mb-12">
          <div className="glass rounded-xl p-6 text-center">
            <Music className="w-8 h-8 text-[#ff0400] mx-auto mb-2" />
            <p className="text-3xl font-bold text-white">{stats.totalBeats}</p>
            <p className="text-gray-400 text-sm">Beats</p>
          </div>
          <div className="glass rounded-xl p-6 text-center">
            <Play className="w-8 h-8 text-[#ff0400] mx-auto mb-2" />
            <p className="text-3xl font-bold text-white">{stats.totalPlays}</p>
            <p className="text-gray-400 text-sm">Total de Plays</p>
          </div>
          <div className="glass rounded-xl p-6 text-center">
            <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-3xl font-bold text-white">{stats.totalSales}</p>
            <p className="text-gray-400 text-sm">Vendas</p>
          </div>
        </div>

        {/* Beats List */}
        <h2 className="text-2xl font-bold text-white mb-6">Beats de {producer.name}</h2>
        
        {beats.length === 0 ? (
          <div className="text-center py-20">
            <Music className="w-20 h-20 text-gray-600 mx-auto mb-4" />
            <p className="text-xl text-gray-400">Nenhum beat disponível</p>
          </div>
        ) : (
          <div className="space-y-3">
            {beats.map((beat, index) => (
              <div
                key={beat.id}
                className="glass rounded-lg p-4 hover:bg-zinc-900/70 transition-all cursor-pointer group"
                onClick={() => navigate(`/beat/${beat.id}`)}
              >
                <div className="flex items-center gap-4">
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
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>{beat.bpm} BPM</span>
                      <span>{beat.genre}</span>
                      <span className="text-[#ff0400] font-bold">R$ {beat.price.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProducerProfile;