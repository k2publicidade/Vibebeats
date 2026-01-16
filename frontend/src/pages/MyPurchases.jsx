import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext, getCoverUrl } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Music, ArrowLeft, Package, Plus, Headphones, Download } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Cart from '@/components/Cart';
import { getUserPurchases, createProject as createProjectSupabase } from '@/lib/supabase';

const MyPurchases = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBeat, setSelectedBeat] = useState(null);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      if (!user?.id) return;
      const { data, error } = await getUserPurchases(user.id);
      if (error) {
        toast.error('Erro ao carregar compras');
      } else {
        setPurchases(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch purchases:', error);
      toast.error('Erro ao carregar compras');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!projectTitle.trim()) {
      toast.error('Digite um título para o projeto');
      return;
    }

    setCreatingProject(true);

    try {
      const { data, error } = await createProjectSupabase({
        title: projectTitle,
        beat_id: selectedBeat.beat_id,
        description: projectDescription,
        artist_id: user.id,
        status: 'draft'
      });

      if (error) {
        toast.error(error.message || 'Erro ao criar projeto');
      } else {
        toast.success('Projeto criado com sucesso!');
        setProjectTitle('');
        setProjectDescription('');
        setSelectedBeat(null);
        navigate('/my-projects');
      }
    } catch (error) {
      console.error('Create project error:', error);
      toast.error('Erro ao conectar com o servidor');
    } finally {
      setCreatingProject(false);
    }
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
                <Package className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Minhas Compras</h1>
                <p className="text-gray-400">{purchases.length} {purchases.length === 1 ? 'beat adquirido' : 'beats adquiridos'}</p>
              </div>
            </div>
          </div>

        {purchases.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <Package className="w-20 h-20 text-gray-600 mx-auto mb-4" />
            <p className="text-xl text-gray-400 mb-6">Você ainda não comprou nenhum beat</p>
            <Button
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-[#ff0400] to-[#ff0400]/90"
            >
              Explorar Beats
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {purchases.map((purchase) => (
              <div
                key={purchase.id}
                data-testid={`purchase-${purchase.id}`}
                className="glass rounded-xl overflow-hidden hover:scale-105 transition-transform duration-300"
              >
                <div className="h-48 bg-gradient-to-br from-zinc-900 to-black flex items-center justify-center">
                  <Headphones className="w-16 h-16 text-gray-600" />
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-lg text-white mb-2">{purchase.beat_title}</h3>
                  <p className="text-sm text-gray-400 mb-3">Licença: {purchase.license_type}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[#ff0400] font-bold">R$ {purchase.amount.toFixed(2)}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(purchase.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        data-testid={`create-project-${purchase.id}`}
                        onClick={() => {
                          setSelectedBeat(purchase);
                          setProjectTitle(`Projeto - ${purchase.beat_title}`);
                        }}
                        className="w-full bg-gradient-to-r from-[#ff0400] to-[#ff0400]/90 hover:from-[#ff0400]/90 hover:to-[#ff0400]/80"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Criar Projeto
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-zinc-900 border-[#ff0400]/30 text-white">
                      <DialogHeader>
                        <DialogTitle className="text-2xl">Criar Novo Projeto</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div>
                          <Label htmlFor="project-title" className="text-gray-300">Título do Projeto</Label>
                          <Input
                            data-testid="project-title-input"
                            id="project-title"
                            value={projectTitle}
                            onChange={(e) => setProjectTitle(e.target.value)}
                            className="bg-zinc-900/50 border-[#ff0400]/20 text-white mt-2"
                            placeholder="Nome da sua música"
                          />
                        </div>
                        <div>
                          <Label htmlFor="project-description" className="text-gray-300">Descrição (opcional)</Label>
                          <Input
                            data-testid="project-description-input"
                            id="project-description"
                            value={projectDescription}
                            onChange={(e) => setProjectDescription(e.target.value)}
                            className="bg-zinc-900/50 border-[#ff0400]/20 text-white mt-2"
                            placeholder="Detalhes do projeto"
                          />
                        </div>
                        <Button
                          data-testid="confirm-create-project-button"
                          onClick={handleCreateProject}
                          disabled={creatingProject}
                          className="w-full bg-gradient-to-r from-[#ff0400] to-[#ff0400]/90"
                        >
                          {creatingProject ? 'Criando...' : 'Criar Projeto'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
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

export default MyPurchases;