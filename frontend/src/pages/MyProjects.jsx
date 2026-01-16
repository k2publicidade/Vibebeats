import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Music, ArrowLeft, FolderOpen, Clock, Edit2, Trash2 } from 'lucide-react';
import Logo from '@/components/Logo';
import { toast } from 'sonner';
import { getUserProjects, updateProject, deleteProject } from '@/lib/supabase';

const MyProjects = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    status: 'draft'
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      if (!user?.id) return;
      const { data, error } = await getUserProjects(user.id);
      if (error) {
        toast.error('Erro ao carregar projetos');
      } else {
        setProjects(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      toast.error('Erro ao carregar projetos');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      mixing: 'bg-[#efd7ce]/20 text-[#efd7ce] border-[#efd7ce]/30',
      mastering: 'bg-[#ff0400]/20 text-[#ff0400] border-[#ff0400]/30',
      completed: 'bg-green-500/20 text-green-400 border-green-500/30'
    };
    return colors[status] || colors.draft;
  };

  const getStatusLabel = (status) => {
    const labels = {
      draft: 'Rascunho',
      mixing: 'Em Mixagem',
      mastering: 'Em Masterização',
      completed: 'Concluído'
    };
    return labels[status] || status;
  };

  const openEditDialog = (project) => {
    setEditingProject(project);
    setEditFormData({
      title: project.title,
      description: project.description || '',
      status: project.status
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateProject = async () => {
    if (!editFormData.title.trim()) {
      toast.error('O título é obrigatório');
      return;
    }

    try {
      const { data, error } = await updateProject(editingProject.id, editFormData);

      if (error) {
        toast.error(error.message || 'Erro ao atualizar projeto');
      } else {
        toast.success('Projeto atualizado com sucesso!');
        setIsEditDialogOpen(false);
        fetchProjects();
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Erro ao conectar com o servidor');
    }
  };

  const handleDeleteProject = async (projectId, projectTitle) => {
    if (!window.confirm(`Tem certeza que deseja excluir o projeto "${projectTitle}"?`)) {
      return;
    }

    try {
      const { error } = await deleteProject(projectId);

      if (error) {
        toast.error('Erro ao excluir projeto');
      } else {
        toast.success('Projeto excluído com sucesso');
        fetchProjects();
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Erro ao conectar com o servidor');
    }
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <FolderOpen className="w-8 h-8 text-[#ff0400]" />
            Meus Projetos
          </h1>
          <p className="text-gray-400">{projects.length} projetos musicais</p>
        </div>

        {projects.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <FolderOpen className="w-20 h-20 text-gray-600 mx-auto mb-4" />
            <p className="text-xl text-gray-400 mb-6">Você ainda não criou nenhum projeto</p>
            <Button
              onClick={() => navigate('/my-purchases')}
              className="bg-gradient-to-r from-[#ff0400] to-[#ff0400]/90"
            >
              Ver Minhas Compras
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                data-testid={`project-${project.id}`}
                className="glass rounded-xl p-6 hover:scale-105 transition-transform duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-white mb-1">{project.title}</h3>
                    <p className="text-sm text-gray-400">Beat: {project.beat_title}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                      {getStatusLabel(project.status)}
                    </span>
                    <Button
                      data-testid={`edit-project-${project.id}`}
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditDialog(project)}
                      className="text-[#ff0400] hover:text-orange-300 hover:bg-[#ff0400]/10"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      data-testid={`delete-project-${project.id}`}
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteProject(project.id, project.title)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {project.description && (
                  <p className="text-sm text-gray-300 mb-4 line-clamp-2">{project.description}</p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Criado em {new Date(project.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-[#ff0400]/20">
                  <p className="text-xs text-gray-400 mb-3">Recursos Disponíveis:</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-2 py-1 bg-[#ff0400]/10 text-[#ff0400] rounded text-xs">Mixagem IA</span>
                    <span className="px-2 py-1 bg-[#ff0400]/10 text-[#ff0400] rounded text-xs">Masterização IA</span>
                  </div>
                  
                  <Button
                    data-testid={`open-workspace-${project.id}`}
                    onClick={() => navigate(`/workspace/${project.id}`)}
                    className="w-full bg-gradient-to-r from-[#ff0400] to-[#ff0400]/90 hover:from-[#ff0400]/90 hover:to-[#ff0400]/80 text-white"
                  >
                    <Music className="w-4 h-4 mr-2" />
                    Abrir Workspace
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Project Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-zinc-900 border-[#ff0400]/30 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Editar Projeto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="edit-title" className="text-gray-300">Título do Projeto</Label>
              <Input
                id="edit-title"
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                className="bg-zinc-900/50 border-zinc-700 text-white mt-2"
                placeholder="Nome do projeto"
              />
            </div>

            <div>
              <Label htmlFor="edit-description" className="text-gray-300">Descrição</Label>
              <Textarea
                id="edit-description"
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                className="bg-zinc-900/50 border-zinc-700 text-white mt-2 resize-none"
                placeholder="Descrição do projeto"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="edit-status" className="text-gray-300">Status</Label>
              <Select 
                value={editFormData.status} 
                onValueChange={(value) => setEditFormData({ ...editFormData, status: value })}
              >
                <SelectTrigger id="edit-status" className="bg-zinc-900/50 border-zinc-700 text-white mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="draft" className="text-white">Rascunho</SelectItem>
                  <SelectItem value="mixing" className="text-white">Em Mixagem</SelectItem>
                  <SelectItem value="mastering" className="text-white">Em Masterização</SelectItem>
                  <SelectItem value="completed" className="text-white">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setIsEditDialogOpen(false)}
                variant="outline"
                className="flex-1 border-zinc-700 text-gray-300 hover:bg-zinc-800"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpdateProject}
                className="flex-1 bg-gradient-to-r from-[#ff0400] to-[#ff0400]/90 hover:from-[#ff0400]/90 hover:to-[#ff0400]/80 text-white"
              >
                Salvar Alterações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyProjects;