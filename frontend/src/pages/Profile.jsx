import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Music, ArrowLeft, TrendingUp, DollarSign, Play, Trash2, Package, Edit2, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Cart from '@/components/Cart';
import {
  getProducerStats,
  getArtistStats,
  getProducerBeats,
  updateBeat,
  deleteBeat as deleteSupabaseBeat,
  updateUserProfile
} from '@/lib/supabase';

const Profile = () => {
  const { user, login, supabaseUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [beats, setBeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditBeatOpen, setIsEditBeatOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editingBeat, setEditingBeat] = useState(null);
  const [editBeatForm, setEditBeatForm] = useState({
    title: '',
    genre: '',
    bpm: '',
    key: '',
    description: '',
    price: '',
    license_type: '',
    tags: ''
  });
  const [editProfileForm, setEditProfileForm] = useState({
    name: '',
    bio: ''
  });

  const genres = ['Hip Hop', 'Trap', 'R&B', 'Pop', 'Lo-fi', 'Electronic', 'Rock', 'Jazz', 'Reggaeton'];
  const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  useEffect(() => {
    if (user?.id) {
      fetchDashboardStats();
    }
  }, [user?.id]);

  const fetchDashboardStats = async () => {
    try {
      if (user.user_type === 'producer') {
        // Fetch producer stats
        const { data: statsData, error: statsError } = await getProducerStats(user.id);
        if (statsError) throw statsError;

        // Fetch producer beats
        const { data: beatsData, error: beatsError } = await getProducerBeats(user.id);
        if (beatsError) throw beatsError;

        setStats({
          total_beats: statsData?.total_beats || 0,
          total_plays: statsData?.total_plays || 0,
          total_sales: statsData?.total_sales || 0,
          total_revenue: statsData?.total_revenue || 0
        });
        setBeats(beatsData || []);
      } else {
        // Fetch artist stats
        const { data: statsData, error: statsError } = await getArtistStats(user.id);
        if (statsError) throw statsError;

        setStats({
          total_purchases: statsData?.total_purchases || 0,
          total_projects: statsData?.total_projects || 0,
          total_spent: statsData?.total_spent || 0
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      toast.error('Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBeat = async (beatId) => {
    if (!window.confirm('Tem certeza que deseja excluir este beat?')) return;

    try {
      const { error } = await deleteSupabaseBeat(beatId);

      if (error) {
        toast.error('Erro ao excluir beat');
        return;
      }

      toast.success('Beat excluído com sucesso');
      fetchDashboardStats();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Erro ao conectar com o servidor');
    }
  };

  const openEditBeatDialog = (beat) => {
    setEditingBeat(beat);
    setEditBeatForm({
      title: beat.title,
      genre: beat.genre,
      bpm: beat.bpm.toString(),
      key: beat.key,
      description: beat.description || '',
      price: beat.price.toString(),
      license_type: beat.license_type,
      tags: beat.tags?.join(', ') || ''
    });
    setIsEditBeatOpen(true);
  };

  const handleUpdateBeat = async () => {
    if (!editBeatForm.title.trim()) {
      toast.error('O título é obrigatório');
      return;
    }

    try {
      const updates = {
        title: editBeatForm.title,
        genre: editBeatForm.genre,
        bpm: parseInt(editBeatForm.bpm),
        key: editBeatForm.key,
        description: editBeatForm.description,
        price: parseFloat(editBeatForm.price),
        license_type: editBeatForm.license_type,
        tags: editBeatForm.tags.split(',').map(t => t.trim()).filter(t => t)
      };

      const { error } = await updateBeat(editingBeat.id, updates);

      if (error) {
        toast.error('Erro ao atualizar beat');
        return;
      }

      toast.success('Beat atualizado com sucesso!');
      setIsEditBeatOpen(false);
      fetchDashboardStats();
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Erro ao conectar com o servidor');
    }
  };

  const openEditProfileDialog = () => {
    setEditProfileForm({
      name: user.name,
      bio: user.bio || ''
    });
    setIsEditProfileOpen(true);
  };

  const handleUpdateProfile = async () => {
    if (!editProfileForm.name.trim()) {
      toast.error('O nome é obrigatório');
      return;
    }

    try {
      const { data, error } = await updateUserProfile(user.id, {
        name: editProfileForm.name,
        bio: editProfileForm.bio
      });

      if (error) {
        toast.error('Erro ao atualizar perfil');
        return;
      }

      toast.success('Perfil atualizado com sucesso!');
      setIsEditProfileOpen(false);

      // Update auth context with new profile data
      if (data) {
        login(supabaseUser, data);
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Erro ao conectar com o servidor');
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="glass rounded-2xl p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#ff0400] to-[#ff0400]/90 flex items-center justify-center text-white text-3xl font-bold">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{user.name}</h1>
                <p className="text-gray-400 text-lg">
                  {user.user_type === 'producer' ? 'Produtor Musical' : 'Artista'}
                </p>
                <p className="text-gray-500 text-sm mt-1">{user.email}</p>
                {user.bio && <p className="text-gray-300 text-sm mt-2 max-w-md">{user.bio}</p>}
              </div>
            </div>
            <Button
              data-testid="edit-profile-button"
              onClick={openEditProfileDialog}
              variant="outline"
              className="border-[#ff0400] text-[#ff0400] hover:bg-[#ff0400]/10"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Editar Perfil
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {user.user_type === 'producer' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div data-testid="stat-total-beats" className="glass rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <Music className="w-8 h-8 text-[#ff0400]" />
                  <span className="text-3xl font-bold text-white">{stats?.total_beats || 0}</span>
                </div>
                <p className="text-gray-400">Beats Cadastrados</p>
              </div>

              <div data-testid="stat-total-plays" className="glass rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <Play className="w-8 h-8 text-[#ff0400]" />
                  <span className="text-3xl font-bold text-white">{stats?.total_plays || 0}</span>
                </div>
                <p className="text-gray-400">Total de Plays</p>
              </div>

              <div data-testid="stat-total-sales" className="glass rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-8 h-8 text-green-400" />
                  <span className="text-3xl font-bold text-white">{stats?.total_sales || 0}</span>
                </div>
                <p className="text-gray-400">Vendas Realizadas</p>
              </div>

              <div data-testid="stat-total-revenue" className="glass rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-8 h-8 text-yellow-400" />
                  <span className="text-3xl font-bold text-white">R$ {(stats?.total_revenue || 0).toFixed(2)}</span>
                </div>
                <p className="text-gray-400">Receita Total</p>
              </div>
            </div>

            {/* My Beats */}
            <div className="glass rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Meus Beats</h2>
                <Button
                  data-testid="upload-new-beat-button"
                  onClick={() => navigate('/upload')}
                  className="bg-gradient-to-r from-[#ff0400] to-[#ff0400]/90 text-white"
                >
                  + Novo Beat
                </Button>
              </div>

              {beats && beats.length > 0 ? (
                <div className="space-y-4">
                  {beats.map((beat) => (
                    <div
                      key={beat.id}
                      data-testid={`producer-beat-${beat.id}`}
                      className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg hover:bg-zinc-900 transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{beat.title}</h3>
                        <p className="text-sm text-gray-400">
                          {beat.genre} • {beat.bpm} BPM • R$ {beat.price?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-gray-400">
                        <span>{beat.plays || 0} plays</span>
                        <span>{beat.purchases || 0} vendas</span>
                        <Button
                          data-testid={`edit-beat-${beat.id}`}
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditBeatDialog(beat)}
                          className="text-[#ff0400] hover:text-orange-300 hover:bg-[#ff0400]/10"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          data-testid={`delete-beat-${beat.id}`}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteBeat(beat.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-400 py-8">Nenhum beat cadastrado ainda</p>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div data-testid="stat-total-purchases" className="glass rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <Package className="w-8 h-8 text-[#ff0400]" />
                  <span className="text-3xl font-bold text-white">{stats?.total_purchases || 0}</span>
                </div>
                <p className="text-gray-400">Beats Comprados</p>
              </div>

              <div data-testid="stat-total-projects" className="glass rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <Music className="w-8 h-8 text-[#ff0400]" />
                  <span className="text-3xl font-bold text-white">{stats?.total_projects || 0}</span>
                </div>
                <p className="text-gray-400">Projetos Criados</p>
              </div>

              <div data-testid="stat-total-spent" className="glass rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-8 h-8 text-green-400" />
                  <span className="text-3xl font-bold text-white">R$ {(stats?.total_spent || 0).toFixed(2)}</span>
                </div>
                <p className="text-gray-400">Total Investido</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Button
                data-testid="view-purchases-button"
                onClick={() => navigate('/my-purchases')}
                className="glass h-24 text-lg hover:bg-zinc-900"
              >
                <Package className="w-6 h-6 mr-3" />
                Minhas Compras
              </Button>
              <Button
                data-testid="view-projects-button"
                onClick={() => navigate('/my-projects')}
                className="glass h-24 text-lg hover:bg-zinc-900"
              >
                <Music className="w-6 h-6 mr-3" />
                Meus Projetos
              </Button>
            </div>
          </>
        )}
        </div>
      </main>

      <Footer />

      {/* Edit Beat Dialog */}
      <Dialog open={isEditBeatOpen} onOpenChange={setIsEditBeatOpen}>
        <DialogContent className="bg-zinc-900 border-[#ff0400]/30 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Editar Beat</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-gray-300">Título</Label>
              <Input
                value={editBeatForm.title}
                onChange={(e) => setEditBeatForm({ ...editBeatForm, title: e.target.value })}
                className="bg-zinc-900/50 border-zinc-700 text-white mt-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Gênero</Label>
                <Select value={editBeatForm.genre} onValueChange={(value) => setEditBeatForm({ ...editBeatForm, genre: value })}>
                  <SelectTrigger className="bg-zinc-900/50 border-zinc-700 text-white mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    {genres.map((genre) => (
                      <SelectItem key={genre} value={genre} className="text-white">{genre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-300">BPM</Label>
                <Input
                  type="number"
                  value={editBeatForm.bpm}
                  onChange={(e) => setEditBeatForm({ ...editBeatForm, bpm: e.target.value })}
                  className="bg-zinc-900/50 border-zinc-700 text-white mt-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Tonalidade</Label>
                <Select value={editBeatForm.key} onValueChange={(value) => setEditBeatForm({ ...editBeatForm, key: value })}>
                  <SelectTrigger className="bg-zinc-900/50 border-zinc-700 text-white mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    {keys.map((key) => (
                      <SelectItem key={key} value={key} className="text-white">{key}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-300">Preço (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editBeatForm.price}
                  onChange={(e) => setEditBeatForm({ ...editBeatForm, price: e.target.value })}
                  className="bg-zinc-900/50 border-zinc-700 text-white mt-2"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-300">Tipo de Licença</Label>
              <Select value={editBeatForm.license_type} onValueChange={(value) => setEditBeatForm({ ...editBeatForm, license_type: value })}>
                <SelectTrigger className="bg-zinc-900/50 border-zinc-700 text-white mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="non_exclusive" className="text-white">Não Exclusiva</SelectItem>
                  <SelectItem value="exclusive" className="text-white">Exclusiva</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-300">Descrição</Label>
              <Textarea
                value={editBeatForm.description}
                onChange={(e) => setEditBeatForm({ ...editBeatForm, description: e.target.value })}
                className="bg-zinc-900/50 border-zinc-700 text-white mt-2 resize-none"
                rows={3}
              />
            </div>

            <div>
              <Label className="text-gray-300">Tags (separadas por vírgula)</Label>
              <Input
                value={editBeatForm.tags}
                onChange={(e) => setEditBeatForm({ ...editBeatForm, tags: e.target.value })}
                className="bg-zinc-900/50 border-zinc-700 text-white mt-2"
                placeholder="trap, dark, melodic"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setIsEditBeatOpen(false)}
                variant="outline"
                className="flex-1 border-zinc-700 text-gray-300 hover:bg-zinc-800"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpdateBeat}
                className="flex-1 bg-gradient-to-r from-[#ff0400] to-[#ff0400]/90 hover:from-[#ff0400]/90 hover:to-[#ff0400]/80 text-white"
              >
                Salvar Alterações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="bg-zinc-900 border-[#ff0400]/30 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Editar Perfil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-gray-300">Nome / Nome Artístico</Label>
              <Input
                value={editProfileForm.name}
                onChange={(e) => setEditProfileForm({ ...editProfileForm, name: e.target.value })}
                className="bg-zinc-900/50 border-zinc-700 text-white mt-2"
                placeholder="Seu nome"
              />
            </div>

            <div>
              <Label className="text-gray-300">Biografia</Label>
              <Textarea
                value={editProfileForm.bio}
                onChange={(e) => setEditProfileForm({ ...editProfileForm, bio: e.target.value })}
                className="bg-zinc-900/50 border-zinc-700 text-white mt-2 resize-none"
                placeholder="Conte um pouco sobre você..."
                rows={4}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setIsEditProfileOpen(false)}
                variant="outline"
                className="flex-1 border-zinc-700 text-gray-300 hover:bg-zinc-800"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpdateProfile}
                className="flex-1 bg-gradient-to-r from-[#ff0400] to-[#ff0400]/90 hover:from-[#ff0400]/90 hover:to-[#ff0400]/80 text-white"
              >
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
