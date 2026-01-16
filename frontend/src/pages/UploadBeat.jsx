import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Music, ArrowLeft, Upload, Loader2 } from 'lucide-react';
import Logo from '@/components/Logo';
import { toast } from 'sonner';
import { createBeat, uploadFile, getPublicUrl } from '@/lib/supabase';

const UploadBeat = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    genre: 'Hip Hop',
    bpm: '',
    key: 'C',
    description: '',
    price: '',
    license_type: 'non_exclusive',
    tags: ''
  });
  const [audioFile, setAudioFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);

  const genres = ['Hip Hop', 'Trap', 'R&B', 'Pop', 'Lo-fi', 'Electronic', 'Rock', 'Jazz', 'Reggaeton'];
  const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!audioFile) {
      toast.error('Selecione um arquivo de áudio');
      return;
    }

    // Use auth_id for storage (matches Supabase auth.uid() in policies)
    const authId = user?.auth_id || user?.id;
    if (!authId) {
      toast.error('Faça login para continuar');
      return;
    }

    setUploading(true);

    try {
      // Generate unique file names using auth_id (matches storage policy)
      const timestamp = Date.now();
      const audioFileName = `${authId}/${timestamp}_${audioFile.name}`;
      let coverUrl = null;

      // Upload audio file to Supabase Storage
      const { data: audioData, error: audioError } = await uploadFile('audio', audioFileName, audioFile);
      if (audioError) {
        throw new Error('Erro ao fazer upload do áudio');
      }
      const audioUrl = getPublicUrl('audio', audioFileName);

      // Upload cover if provided
      if (coverFile) {
        const coverFileName = `${authId}/${timestamp}_${coverFile.name}`;
        const { data: coverData, error: coverError } = await uploadFile('covers', coverFileName, coverFile);
        if (!coverError) {
          coverUrl = getPublicUrl('covers', coverFileName);
        }
      }

      // Create beat record in database
      // producer_id uses auth_id to match RLS policy (auth.uid())
      const beatData = {
        title: formData.title,
        genre: formData.genre,
        bpm: parseInt(formData.bpm),
        key: formData.key,
        description: formData.description,
        price: parseFloat(formData.price),
        license_type: formData.license_type,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        audio_url: audioUrl,
        cover_url: coverUrl,
        producer_id: authId,
        producer_name: user.name || user.email,
        is_active: true
      };

      const { data, error } = await createBeat(beatData);

      if (error) {
        toast.error(error.message || 'Erro ao enviar beat');
      } else {
        toast.success('Beat enviado com sucesso!');
        navigate('/profile');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Erro ao conectar com o servidor');
    } finally {
      setUploading(false);
    }
  };

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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="glass rounded-2xl p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Upload de Beat</h1>
            <p className="text-[#efd7ce]/70">Compartilhe sua criação com artistas do mundo todo</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <Label htmlFor="title" className="text-[#efd7ce]">Título do Beat *</Label>
              <Input
                data-testid="beat-title-input"
                id="title"
                type="text"
                placeholder="Ex: Dark Trap Beat"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="bg-zinc-900/50 border-[#efd7ce]/20 text-white mt-2"
              />
            </div>

            {/* Genre and BPM */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="genre" className="text-[#efd7ce]">Gênero *</Label>
                <Select value={formData.genre} onValueChange={(value) => setFormData({ ...formData, genre: value })}>
                  <SelectTrigger data-testid="genre-select" id="genre" className="bg-zinc-900/50 border-[#efd7ce]/20 text-white mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    {genres.map((genre) => (
                      <SelectItem key={genre} value={genre} className="text-white hover:bg-[#efd7ce]/20">
                        {genre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="bpm" className="text-[#efd7ce]">BPM *</Label>
                <Input
                  data-testid="bpm-input"
                  id="bpm"
                  type="number"
                  placeholder="Ex: 140"
                  value={formData.bpm}
                  onChange={(e) => setFormData({ ...formData, bpm: e.target.value })}
                  required
                  min="60"
                  max="200"
                  className="bg-zinc-900/50 border-zinc-700 text-white mt-2"
                />
              </div>
            </div>

            {/* Key and Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="key" className="text-[#efd7ce]">Tonalidade *</Label>
                <Select value={formData.key} onValueChange={(value) => setFormData({ ...formData, key: value })}>
                  <SelectTrigger data-testid="key-select" id="key" className="bg-zinc-900/50 border-[#efd7ce]/20 text-white mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    {keys.map((key) => (
                      <SelectItem key={key} value={key} className="text-white hover:bg-[#efd7ce]/20">
                        {key}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="price" className="text-[#efd7ce]">Preço (R$) *</Label>
                <Input
                  data-testid="price-input"
                  id="price"
                  type="number"
                  placeholder="Ex: 99.90"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  min="0"
                  step="0.01"
                  className="bg-zinc-900/50 border-zinc-700 text-white mt-2"
                />
              </div>
            </div>

            {/* License Type */}
            <div>
              <Label htmlFor="license" className="text-[#efd7ce]">Tipo de Licença *</Label>
              <Select value={formData.license_type} onValueChange={(value) => setFormData({ ...formData, license_type: value })}>
                <SelectTrigger data-testid="license-select" id="license" className="bg-zinc-900/50 border-[#efd7ce]/20 text-white mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="non_exclusive" className="text-white hover:bg-[#efd7ce]/20">
                    Não Exclusiva
                  </SelectItem>
                  <SelectItem value="exclusive" className="text-white hover:bg-[#efd7ce]/20">
                    Exclusiva
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-[#efd7ce]">Descrição *</Label>
              <Textarea
                data-testid="description-input"
                id="description"
                placeholder="Descreva o vibe do seu beat, influências, etc..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={4}
                className="bg-zinc-900/50 border-[#efd7ce]/20 text-white mt-2 resize-none"
              />
            </div>

            {/* Tags */}
            <div>
              <Label htmlFor="tags" className="text-[#efd7ce]">Tags (separadas por vírgula)</Label>
              <Input
                data-testid="tags-input"
                id="tags"
                type="text"
                placeholder="Ex: dark, melodic, trap"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="bg-zinc-900/50 border-[#efd7ce]/20 text-white mt-2"
              />
            </div>

            {/* Audio File */}
            <div>
              <Label htmlFor="audio" className="text-[#efd7ce]">Arquivo de Áudio (MP3) *</Label>
              <div className="mt-2">
                <input
                  data-testid="audio-file-input"
                  id="audio"
                  type="file"
                  accept="audio/mpeg,audio/mp3"
                  onChange={(e) => setAudioFile(e.target.files[0])}
                  required
                  className="block w-full text-[#efd7ce]/70 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#ff0400] file:text-white hover:file:bg-[#ff0400]/90 file:cursor-pointer cursor-pointer"
                />
              </div>
              {audioFile && (
                <p className="mt-2 text-sm text-[#ff0400]">Arquivo selecionado: {audioFile.name}</p>
              )}
            </div>

            {/* Cover Image */}
            <div>
              <Label htmlFor="cover" className="text-[#efd7ce]">Imagem de Capa (opcional)</Label>
              <div className="mt-2">
                <input
                  data-testid="cover-file-input"
                  id="cover"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCoverFile(e.target.files[0])}
                  className="block w-full text-[#efd7ce]/70 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#efd7ce] file:text-white hover:file:bg-[#efd7ce] file:cursor-pointer cursor-pointer"
                />
              </div>
              {coverFile && (
                <p className="mt-2 text-sm text-[#efd7ce]">Arquivo selecionado: {coverFile.name}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              data-testid="upload-submit-button"
              type="submit"
              disabled={uploading}
              className="w-full bg-gradient-to-r from-[#ff0400] to-[#ff0400]/90 hover:from-[#ff0400]/90 hover:to-[#ff0400]/80 text-white h-14 text-lg"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Publicar Beat
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UploadBeat;