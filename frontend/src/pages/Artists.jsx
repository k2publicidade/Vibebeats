import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Music, Search, TrendingUp, Award, Users, Play } from 'lucide-react';
import { toast } from 'sonner';
import Logo from '@/components/Logo';
import { getProducers } from '@/lib/supabase';

const Artists = () => {
  const navigate = useNavigate();
  const [producers, setProducers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducers();
  }, []);

  const fetchProducers = async () => {
    try {
      const { data, error } = await getProducers();
      if (error) {
        toast.error('Erro ao carregar artistas');
      } else {
        setProducers(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch producers:', error);
      toast.error('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducers = producers.filter(producer =>
    producer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <Logo className="h-8" />

            <nav className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-[#efd7ce] hover:text-white transition-colors">
                Beats
              </Link>
              <Link to="/artists" className="text-[#ff0400] font-semibold">
                Artists
              </Link>
              <Link to="/charts" className="text-[#efd7ce] hover:text-white transition-colors">
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
              <Users className="w-12 h-12 text-[#ff0400]" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Conheça Nossos <span className="text-[#ff0400]">Produtores</span>
            </h1>
            <p className="text-xl text-[#efd7ce]/80 max-w-2xl mx-auto mb-8">
              Descubra os talentos por trás dos beats que definem gerações.
              Conecte-se com produtores profissionais do mundo todo.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Buscar produtores..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-14 bg-zinc-900/50 border-[#ff0400]/30 text-white placeholder:text-gray-500 text-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Producers Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-white">
            {searchTerm ? 'Resultados da Busca' : 'Todos os Produtores'}
          </h2>
          <p className="text-gray-400">{filteredProducers.length} produtores</p>
        </div>

        {filteredProducers.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <Users className="w-20 h-20 text-gray-600 mx-auto mb-4" />
            <p className="text-xl text-gray-400 mb-2">
              {searchTerm ? 'Nenhum produtor encontrado' : 'Nenhum produtor cadastrado ainda'}
            </p>
            {searchTerm && (
              <Button
                onClick={() => setSearchTerm('')}
                variant="outline"
                className="mt-4 border-[#ff0400] text-[#ff0400]"
              >
                Limpar busca
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducers.map((producer) => (
              <div
                key={producer.id}
                onClick={() => navigate(`/producer/${producer.id}`)}
                className="glass rounded-xl p-6 hover:scale-105 transition-all duration-300 cursor-pointer group"
              >
                <div className="flex flex-col items-center text-center">
                  {/* Avatar */}
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#ff0400] to-[#ff0400]/90 flex items-center justify-center text-white text-3xl font-bold mb-4 group-hover:scale-110 transition-transform">
                    {producer.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Name */}
                  <h3 className="text-xl font-bold text-white mb-2">{producer.name}</h3>
                  
                  {/* Bio */}
                  {producer.bio && (
                    <p className="text-sm text-gray-400 mb-4 line-clamp-2">{producer.bio}</p>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 w-full mt-4 pt-4 border-t border-[#ff0400]/20">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-[#ff0400]">{producer.total_beats || 0}</p>
                      <p className="text-xs text-gray-400">Beats</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-[#efd7ce]">{producer.total_sales || 0}</p>
                      <p className="text-xs text-gray-400">Vendas</p>
                    </div>
                  </div>

                  {/* View Profile Button */}
                  <Button
                    className="w-full mt-4 bg-gradient-to-r from-[#ff0400] to-[#ff0400]/90 hover:from-[#ff0400]/90 hover:to-[#ff0400]/80 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/producer/${producer.id}`);
                    }}
                  >
                    Ver Perfil
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-[#ff0400]/10 to-black py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Quer se tornar um produtor no <span className="text-[#ff0400]">VibeBeats</span>?
          </h2>
          <p className="text-xl text-[#efd7ce]/80 mb-8 max-w-2xl mx-auto">
            Cadastre-se como produtor e comece a vender seus beats para artistas do mundo todo.
          </p>
          <Link to="/auth">
            <Button className="bg-[#ff0400] hover:bg-[#ff0400]/90 text-white h-14 px-8 text-lg">
              Começar Agora
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Artists;