import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Music, Users, TrendingUp, Sparkles, Heart, Shield, Zap, Globe } from 'lucide-react';
import Logo from '@/components/Logo';

const About = () => {
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
              <Link to="/charts" className="text-[#efd7ce] hover:text-white transition-colors">
                Charts
              </Link>
              <Link to="/about" className="text-[#ff0400] font-semibold">
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
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Sobre o <span className="text-[#ff0400]">VibeBeats</span>
            </h1>
            <p className="text-xl text-[#efd7ce]/80 max-w-3xl mx-auto">
              A plataforma definitiva que conecta produtores talentosos e artistas visionários.
              Criando hits que definem gerações.
            </p>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="glass rounded-2xl p-12">
          <div className="text-center max-w-3xl mx-auto">
            <Heart className="w-16 h-16 text-[#ff0400] mx-auto mb-6" />
            <h2 className="text-4xl font-bold text-white mb-6">Nossa Missão</h2>
            <p className="text-lg text-[#efd7ce]/80 leading-relaxed">
              O VibeBeats nasceu com uma missão clara: democratizar o acesso à música de qualidade profissional.
              Acreditamos que todo artista merece ter acesso a beats excepcionais, e todo produtor merece
              ser reconhecido e remunerado pelo seu trabalho. Nossa plataforma é o ponto de encontro
              onde talento encontra oportunidade.
            </p>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-4xl font-bold text-white text-center mb-12">Por Que Escolher o VibeBeats?</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass rounded-xl p-6 text-center hover:scale-105 transition-transform">
            <div className="w-16 h-16 rounded-full bg-[#ff0400]/20 flex items-center justify-center mx-auto mb-4">
              <Music className="w-8 h-8 text-[#ff0400]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Beats Premium</h3>
            <p className="text-gray-400">
              Acesso a milhares de beats de alta qualidade produzidos por profissionais.
            </p>
          </div>

          <div className="glass rounded-xl p-6 text-center hover:scale-105 transition-transform">
            <div className="w-16 h-16 rounded-full bg-[#efd7ce]/20 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-[#efd7ce]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Ferramentas IA</h3>
            <p className="text-gray-400">
              Workspace DAW com mixagem e masterização assistida por inteligência artificial.
            </p>
          </div>

          <div className="glass rounded-xl p-6 text-center hover:scale-105 transition-transform">
            <div className="w-16 h-16 rounded-full bg-[#ff0400]/20 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-[#ff0400]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Licenças Claras</h3>
            <p className="text-gray-400">
              Licenciamento transparente com opções exclusivas e não-exclusivas.
            </p>
          </div>

          <div className="glass rounded-xl p-6 text-center hover:scale-105 transition-transform">
            <div className="w-16 h-16 rounded-full bg-[#efd7ce]/20 flex items-center justify-center mx-auto mb-4">
              <Globe className="w-8 h-8 text-[#efd7ce]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Comunidade Global</h3>
            <p className="text-gray-400">
              Conecte-se com artistas e produtores de todo o mundo.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gradient-to-r from-[#ff0400]/10 to-black py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <TrendingUp className="w-12 h-12 text-[#ff0400] mx-auto mb-4" />
              <h3 className="text-5xl font-bold text-white mb-2">10K+</h3>
              <p className="text-[#efd7ce] text-lg">Beats Disponíveis</p>
            </div>
            <div>
              <Users className="w-12 h-12 text-[#efd7ce] mx-auto mb-4" />
              <h3 className="text-5xl font-bold text-white mb-2">5K+</h3>
              <p className="text-[#efd7ce] text-lg">Produtores Ativos</p>
            </div>
            <div>
              <Zap className="w-12 h-12 text-[#ff0400] mx-auto mb-4" />
              <h3 className="text-5xl font-bold text-white mb-2">50K+</h3>
              <p className="text-[#efd7ce] text-lg">Artistas Conectados</p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-4xl font-bold text-white text-center mb-12">Como Funciona</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-[#ff0400] text-white text-2xl font-bold flex items-center justify-center mx-auto mb-6">
              1
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Cadastre-se</h3>
            <p className="text-gray-400">
              Crie sua conta como artista ou produtor em poucos segundos.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-[#efd7ce] text-black text-2xl font-bold flex items-center justify-center mx-auto mb-6">
              2
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Explore & Compre</h3>
            <p className="text-gray-400">
              Navegue pelo catálogo, ouça previews e compre as licenças que você precisa.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-[#ff0400] text-white text-2xl font-bold flex items-center justify-center mx-auto mb-6">
              3
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Crie & Publique</h3>
            <p className="text-gray-400">
              Use nosso workspace DAW para criar seus hits e publique no mundo todo.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-[#ff0400]/10 to-black py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl font-bold text-white mb-6">
            Pronto para criar seu próximo <span className="text-[#ff0400]">hit</span>?
          </h2>
          <p className="text-xl text-[#efd7ce]/80 mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de artistas e produtores que já fazem parte da nossa comunidade.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/auth">
              <Button className="bg-[#ff0400] hover:bg-[#ff0400]/90 text-white h-14 px-8 text-lg">
                Começar Agora
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline" className="border-white text-white hover:bg-white/10 h-14 px-8 text-lg">
                Explorar Beats
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;