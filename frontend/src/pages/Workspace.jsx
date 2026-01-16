import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, Link, useNavigate, useBeforeUnload } from 'react-router-dom';
import { AuthContext, getAudioUrl } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Music, ArrowLeft, Play, Pause, Square, Volume2, VolumeX, Plus, Trash2, Download, Sparkles, Loader2 } from 'lucide-react';
import Logo from '@/components/Logo';
import { toast } from 'sonner';
import { supabase, getBeat } from '@/lib/supabase';

const Workspace = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [beat, setBeat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState('');
  const [showAiDialog, setShowAiDialog] = useState(false);
  
  // Audio context and tracks
  const audioContextRef = useRef(null);
  const [tracks, setTracks] = useState([
    {
      id: 1,
      name: 'Beat Principal',
      type: 'beat',
      volume: 100,
      pan: 0,
      muted: false,
      solo: false,
      audioUrl: null,
      audioElement: null,
      gainNode: null,
      panNode: null,
      startTime: 0, // Tempo de início em segundos
      duration: 0 // Duração do áudio
    }
  ]);
  
  // Estados para timeline
  const [zoom, setZoom] = useState(20); // pixels por segundo
  const [draggingTrack, setDraggingTrack] = useState(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartTime, setDragStartTime] = useState(0);
  const timelineRef = useRef(null);

  useEffect(() => {
    fetchProjectAndBeat();
    initAudioContext();
    
    // Mostrar dica ao carregar
    setTimeout(() => {
      toast.info('💡 A reprodução será pausada automaticamente se você trocar de aba ou sair do workspace', {
        duration: 5000
      });
    }, 1000);
    
    // Cleanup: parar todas as músicas quando o componente for desmontado
    return () => {
      stopAndCleanupAllTracks();
    };
  }, [id]);

  // Parar música quando o usuário sair da página (trocar de aba ou fechar)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && playing) {
        pauseAllTracks();
        setPlaying(false);
      }
    };

    const handleBeforeUnload = () => {
      stopAndCleanupAllTracks();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [playing]);

  // Parar música quando navegar para outra rota
  useEffect(() => {
    return () => {
      stopAndCleanupAllTracks();
    };
  }, []);

  // Avisar usuário se tentar sair com música tocando
  useEffect(() => {
    const handleBeforeNavigate = (e) => {
      if (playing) {
        const message = 'Há música tocando. Tem certeza que deseja sair? A reprodução será interrompida.';
        e.preventDefault();
        
        // Parar a música
        stopAndCleanupAllTracks();
        
        // Mostrar toast de aviso
        toast.info('Reprodução interrompida ao sair do workspace');
      }
    };

    // Interceptar cliques em links para avisar
    const handleLinkClick = (e) => {
      if (playing && e.target.closest('a')) {
        const confirmLeave = window.confirm('Há música tocando. Deseja parar e sair do workspace?');
        if (!confirmLeave) {
          e.preventDefault();
          e.stopPropagation();
        } else {
          stopAndCleanupAllTracks();
          toast.info('Reprodução interrompida');
        }
      }
    };

    // Interceptar atalhos de teclado (Ctrl+W, Alt+F4, etc)
    const handleKeyDown = (e) => {
      // Ctrl+W ou Cmd+W (fechar aba)
      if (playing && ((e.ctrlKey || e.metaKey) && e.key === 'w')) {
        e.preventDefault();
        const confirmClose = window.confirm('Há música tocando. Deseja parar e fechar?');
        if (confirmClose) {
          stopAndCleanupAllTracks();
          window.close();
        }
      }
      
      // ESC para pausar reprodução
      if (playing && e.key === 'Escape') {
        pauseAllTracks();
        setPlaying(false);
        toast.info('Reprodução pausada (ESC)');
      }
      
      // Espaço para play/pause
      if (e.key === ' ' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        togglePlay();
      }
    };

    document.addEventListener('click', handleLinkClick, true);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('click', handleLinkClick, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [playing]);

  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
  };

  const fetchProjectAndBeat = async () => {
    try {
      // Fetch project from Supabase
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (projectError || !projectData) {
        toast.error('Projeto não encontrado');
        navigate('/my-projects');
        return;
      }

      setProject(projectData);

      // Fetch beat using Supabase helper
      const { data: beatData, error: beatError } = await getBeat(projectData.beat_id);
      if (!beatError && beatData) {
        setBeat(beatData);

        // Set beat audio URL
        setTracks(prev => [
          { ...prev[0], audioUrl: beatData.audio_url },
          ...prev.slice(1)
        ]);
      }

    } catch (error) {
      console.error('Failed to fetch project:', error);
      toast.error('Erro ao carregar projeto');
    } finally {
      setLoading(false);
    }
  };

  const addTrack = (type = 'audio') => {
    const newTrack = {
      id: Date.now(),
      name: `Faixa ${tracks.length + 1}`,
      type,
      volume: 100,
      pan: 0,
      muted: false,
      solo: false,
      audioUrl: null,
      audioElement: null,
      gainNode: null,
      panNode: null,
      startTime: 0,
      duration: 0
    };
    setTracks([...tracks, newTrack]);
  };

  const removeTrack = (trackId) => {
    if (tracks.length === 1) {
      toast.error('Não é possível remover a última faixa');
      return;
    }
    
    const track = tracks.find(t => t.id === trackId);
    if (track.audioElement) {
      track.audioElement.pause();
    }
    
    setTracks(tracks.filter(t => t.id !== trackId));
  };

  const handleFileUpload = async (trackId, file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const audioUrl = e.target.result;
      setTracks(tracks.map(t => 
        t.id === trackId ? { ...t, audioUrl } : t
      ));
      toast.success('Arquivo carregado com sucesso');
    };
    reader.readAsDataURL(file);
  };

  const updateTrack = (trackId, updates) => {
    setTracks(tracks.map(t => 
      t.id === trackId ? { ...t, ...updates } : t
    ));
  };
  
  // ============ TIMELINE FUNCTIONS ============
  
  const handleTrackMouseDown = (e, trackId) => {
    e.preventDefault();
    const track = tracks.find(t => t.id === trackId);
    if (!track || !track.audioUrl) return;
    
    setDraggingTrack(trackId);
    setDragStartX(e.clientX);
    setDragStartTime(track.startTime);
  };
  
  const handleMouseMove = (e) => {
    if (!draggingTrack) return;
    
    const deltaX = e.clientX - dragStartX;
    const deltaTime = deltaX / zoom; // Converter pixels em segundos
    let newStartTime = Math.max(0, dragStartTime + deltaTime);
    
    // Arredondar para 0.1 segundos para melhor precisão
    newStartTime = Math.round(newStartTime * 10) / 10;
    
    updateTrack(draggingTrack, { startTime: newStartTime });
  };
  
  const handleMouseUp = () => {
    setDraggingTrack(null);
  };
  
  const handleZoomIn = () => {
    setZoom(Math.min(zoom + 5, 50)); // Max 50px/segundo
  };
  
  const handleZoomOut = () => {
    setZoom(Math.max(zoom - 5, 5)); // Min 5px/segundo
  };
  
  // Adicionar event listeners para arrastar
  useEffect(() => {
    if (draggingTrack) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingTrack, dragStartX, dragStartTime, zoom]);
  
  // Atualizar duração do áudio quando carregado
  const updateAudioDuration = (trackId, audioElement) => {
    if (audioElement && audioElement.duration) {
      updateTrack(trackId, { duration: audioElement.duration });
    }
  };

  const togglePlay = () => {
    if (playing) {
      pauseAllTracks();
    } else {
      playAllTracks();
    }
    setPlaying(!playing);
  };

  const playAllTracks = () => {
    let trackCount = 0;
    let endedCount = 0;
    
    tracks.forEach(track => {
      if (track.audioUrl && !track.muted) {
        trackCount++;
        let audio = track.audioElement;
        
        if (!audio) {
          audio = new Audio(track.audioUrl);
          audio.volume = track.volume / 100;
          
          audio.addEventListener('timeupdate', () => {
            setCurrentTime(audio.currentTime);
          });
          
          audio.addEventListener('loadedmetadata', () => {
            setDuration(audio.duration);
          });
          
          audio.addEventListener('ended', () => {
            endedCount++;
            if (endedCount === trackCount) {
              setPlaying(false);
              toast.success('Reprodução finalizada', {
                description: 'Todas as faixas terminaram de tocar'
              });
            }
          });
          
          updateTrack(track.id, { audioElement: audio });
        }
        
        audio.play().catch(err => {
          console.error('Error playing track:', err);
          toast.error(`Erro ao reproduzir: ${track.name}`);
        });
      }
    });
    
    if (trackCount === 0) {
      toast.warning('Nenhuma faixa com áudio disponível para reproduzir');
      setPlaying(false);
    }
  };

  const pauseAllTracks = () => {
    tracks.forEach(track => {
      if (track.audioElement) {
        track.audioElement.pause();
      }
    });
  };

  const stopAllTracks = () => {
    tracks.forEach(track => {
      if (track.audioElement) {
        track.audioElement.pause();
        track.audioElement.currentTime = 0;
      }
    });
    setPlaying(false);
    setCurrentTime(0);
  };

  const stopAndCleanupAllTracks = () => {
    tracks.forEach(track => {
      if (track.audioElement) {
        // Pausar e limpar o áudio
        track.audioElement.pause();
        track.audioElement.currentTime = 0;
        
        // Remover event listeners
        track.audioElement.removeEventListener('timeupdate', () => {});
        track.audioElement.removeEventListener('loadedmetadata', () => {});
        track.audioElement.removeEventListener('ended', () => {});
        
        // Limpar a referência
        track.audioElement.src = '';
        track.audioElement.load();
        track.audioElement = null;
      }
    });
    setPlaying(false);
    setCurrentTime(0);
  };

  const handleVolumeChange = (trackId, volume) => {
    updateTrack(trackId, { volume: volume[0] });
    const track = tracks.find(t => t.id === trackId);
    if (track?.audioElement) {
      track.audioElement.volume = volume[0] / 100;
    }
  };

  const toggleMute = (trackId) => {
    const track = tracks.find(t => t.id === trackId);
    const newMuted = !track.muted;
    updateTrack(trackId, { muted: newMuted });
    
    if (track.audioElement) {
      track.audioElement.muted = newMuted;
    }
  };

  const toggleSolo = (trackId) => {
    const track = tracks.find(t => t.id === trackId);
    const newSolo = !track.solo;
    
    if (newSolo) {
      // Mute all other tracks
      setTracks(tracks.map(t => {
        const updates = { solo: t.id === trackId };
        if (t.id !== trackId && t.audioElement) {
          t.audioElement.muted = true;
        }
        return { ...t, ...updates };
      }));
    } else {
      // Unmute all tracks
      setTracks(tracks.map(t => {
        if (t.audioElement) {
          t.audioElement.muted = t.muted;
        }
        return { ...t, solo: false };
      }));
    }
  };

  const requestAiMixing = async () => {
    setAiAnalyzing(true);
    setShowAiDialog(true);

    try {
      const trackInfo = tracks.map(t => ({
        name: t.name,
        type: t.type,
        volume: t.volume,
        muted: t.muted
      }));

      // AI analysis feature - placeholder for future implementation
      // This would connect to an AI service for mixing suggestions
      await new Promise(resolve => setTimeout(resolve, 2000));

      setAiSuggestions(`🎛️ Análise do Projeto: ${project?.title}
Beat: ${beat?.title} (${beat?.genre}, ${beat?.bpm} BPM)

📊 Sugestões de Mixagem:

1. BALANCEAMENTO DE VOLUME
   - Beat Principal: Mantenha entre -6dB e -3dB
   - Vocais: Posicione entre -3dB e 0dB
   - Elementos de apoio: Entre -12dB e -6dB

2. EQ RECOMENDADA
   - Kick: Boost em 60-80Hz, corte em 300Hz
   - Snare: Boost em 200Hz e 5kHz
   - Hi-hats: High-pass em 300Hz, boost sutil em 10kHz

3. COMPRESSÃO
   - Drums: Ratio 4:1, attack 10ms, release 100ms
   - Master: Ratio 2:1, attack 30ms, release auto

4. ESPACIALIZAÇÃO
   - Reverb: Plate reverb com decay de 1.5s nos vocais
   - Delay: Stereo delay de 1/8 nota nos elementos melódicos

5. MASTERIZAÇÃO
   - Limiter: Ceiling em -0.3dB
   - Target loudness: -14 LUFS para streaming

💡 Dica: Sempre faça A/B comparisons durante o processo!`);

    } catch (error) {
      console.error('AI analysis error:', error);
      toast.error('Erro ao analisar com IA');
      setAiSuggestions('Erro ao obter sugestões. Tente novamente.');
    } finally {
      setAiAnalyzing(false);
    }
  };

  const exportProject = () => {
    // In a real implementation, this would mix all tracks and export
    toast.success('Exportação iniciada! (Funcionalidade em desenvolvimento)');
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-[#ff0400] text-xl">Carregando workspace...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="glass border-b border-[#ff0400]/20">
        <div className="max-w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                onClick={() => {
                  if (playing) {
                    const confirmLeave = window.confirm('Há música tocando. Deseja parar e voltar?');
                    if (confirmLeave) {
                      stopAndCleanupAllTracks();
                      navigate('/my-projects');
                    }
                  } else {
                    navigate('/my-projects');
                  }
                }}
                className="text-[#ff0400] hover:text-[#ff0400]/80"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <Music className={`w-7 h-7 ${playing ? 'text-[#ff0400] animate-pulse' : 'text-[#ff0400]'}`} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold bg-gradient-to-r from-[#ff0400] to-[#ff0400] bg-clip-text text-transparent">
                    {project?.title}
                  </span>
                  {playing && (
                    <span className="flex items-center gap-1 text-xs bg-[#ff0400]/20 text-[#ff0400] px-2 py-1 rounded-full border border-[#ff0400]/30">
                      <span className="w-2 h-2 bg-[#ff0400] rounded-full animate-pulse"></span>
                      Tocando
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400">Beat: {beat?.title}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                data-testid="ai-mixing-button"
                onClick={requestAiMixing}
                disabled={aiAnalyzing}
                className="bg-gradient-to-r from-[#ff0400] to-[#efd7ce] hover:from-[#ff0400] hover:to-[#efd7ce] text-white"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {aiAnalyzing ? 'Analisando...' : 'IA: Mixagem'}
              </Button>
              
              <Button
                data-testid="export-button"
                onClick={exportProject}
                className="bg-gradient-to-r from-[#ff0400] to-[#ff0400]/90 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Transport Controls */}
      <div className="glass border-b border-[#ff0400]/20 px-4 py-4">
        <div className="max-w-full mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              data-testid="play-button"
              onClick={togglePlay}
              size="lg"
              className="bg-[#ff0400] hover:bg-[#ff0400]/90 text-white rounded-full w-14 h-14"
            >
              {playing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
            </Button>
            
            <Button
              data-testid="stop-button"
              onClick={stopAllTracks}
              size="lg"
              variant="outline"
              className="border-[#ff0400] text-[#ff0400] hover:bg-[#ff0400]/10"
            >
              <Square className="w-5 h-5" />
            </Button>

            <div className="text-white font-mono">
              <span className="text-[#ff0400]">{formatTime(currentTime)}</span>
              <span className="text-gray-500 mx-2">/</span>
              <span className="text-gray-400">{formatTime(duration)}</span>
            </div>
          </div>

          <Button
            data-testid="add-track-button"
            onClick={() => addTrack('audio')}
            className="bg-[#ff0400]/20 text-[#ff0400] border border-[#ff0400]/30 hover:bg-[#ff0400]/30"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Faixa
          </Button>
        </div>
      </div>

      {/* Timeline Header e Controles de Zoom */}
      <div className="px-4 py-3 bg-zinc-900/70 border-b border-[#ff0400]/20">
        <div className="flex items-center justify-between">
          <div className="text-white font-semibold flex items-center gap-2">
            <Music className="w-5 h-5 text-[#ff0400]" />
            Timeline de Faixas
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Zoom:</span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleZoomOut}
              className="border-[#ff0400]/30 text-[#ff0400] hover:bg-[#ff0400]/10 h-8 w-8 p-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </Button>
            <span className="text-xs text-gray-500 w-16 text-center">{zoom}px/s</span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleZoomIn}
              className="border-[#ff0400]/30 text-[#ff0400] hover:bg-[#ff0400]/10 h-8 w-8 p-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </Button>
          </div>
        </div>
      </div>

      {/* Timeline Ruler com marcadores de tempo */}
      <div className="px-4 py-2 bg-zinc-900/50 border-b border-zinc-800 overflow-x-auto" ref={timelineRef}>
        <div className="relative h-8 min-w-max" style={{ width: `${Math.max(duration * zoom, 800)}px` }}>
          {/* Marcadores de tempo */}
          {[...Array(Math.ceil(duration) + 1)].map((_, i) => (
            <div
              key={i}
              className="absolute top-0 h-full border-l border-zinc-700"
              style={{ left: `${i * zoom}px` }}
            >
              <span className="absolute -top-1 -left-4 text-xs text-gray-500 font-mono">
                {formatTime(i)}
              </span>
            </div>
          ))}
          
          {/* Playhead (indicador de posição atual) */}
          <div
            className="absolute top-0 h-full w-0.5 bg-[#ff0400] shadow-lg shadow-[#ff0400]/50 z-10"
            style={{ left: `${currentTime * zoom}px` }}
          >
            <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-[#ff0400] rounded-full" />
          </div>
        </div>
      </div>

      {/* Tracks com Timeline Visual */}
      <div className="max-w-full px-4 py-6 space-y-4">
        {tracks.map((track, index) => (
          <div
            key={track.id}
            data-testid={`track-${track.id}`}
            className="glass rounded-lg p-4"
          >
            <div className="grid grid-cols-12 gap-4 items-center">
              {/* Track Info */}
              <div className="col-span-2">
                <Input
                  value={track.name}
                  onChange={(e) => updateTrack(track.id, { name: e.target.value })}
                  className="bg-zinc-900/50 border-zinc-700 text-white text-sm"
                  placeholder="Nome da faixa"
                />
                {index === 0 && (
                  <p className="text-xs text-gray-500 mt-1">Beat principal</p>
                )}
              </div>

              {/* File Upload */}
              <div className="col-span-2">
                {track.audioUrl ? (
                  <div className="text-xs text-green-400 flex items-center gap-1">
                    <Music className="w-3 h-3" />
                    Áudio carregado
                  </div>
                ) : index > 0 ? (
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => handleFileUpload(track.id, e.target.files[0])}
                    className="text-xs text-gray-400 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-[#ff0400] file:text-white hover:file:bg-[#ff0400]/90 file:cursor-pointer"
                  />
                ) : (
                  <div className="text-xs text-gray-500">Beat do projeto</div>
                )}
              </div>

              {/* Volume Control */}
              <div className="col-span-3 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toggleMute(track.id)}
                  className={track.muted ? 'text-red-400' : 'text-gray-400'}
                >
                  {track.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
                <Slider
                  value={[track.volume]}
                  onValueChange={(val) => handleVolumeChange(track.id, val)}
                  max={100}
                  step={1}
                  className="flex-1"
                  disabled={track.muted}
                />
                <span className="text-xs text-gray-400 w-10">{track.volume}%</span>
              </div>

              {/* Solo/Mute Buttons */}
              <div className="col-span-2 flex gap-2">
                <Button
                  data-testid={`solo-${track.id}`}
                  size="sm"
                  onClick={() => toggleSolo(track.id)}
                  className={`${track.solo ? 'bg-yellow-500 text-black' : 'bg-zinc-800 text-gray-400'} hover:bg-yellow-600`}
                >
                  S
                </Button>
                <Button
                  data-testid={`mute-${track.id}`}
                  size="sm"
                  onClick={() => toggleMute(track.id)}
                  className={`${track.muted ? 'bg-red-500 text-white' : 'bg-zinc-800 text-gray-400'} hover:bg-red-600`}
                >
                  M
                </Button>
              </div>

              {/* Pan Control */}
              <div className="col-span-2 flex items-center gap-2">
                <span className="text-xs text-gray-400">Pan</span>
                <Slider
                  value={[track.pan]}
                  onValueChange={(val) => updateTrack(track.id, { pan: val[0] })}
                  min={-50}
                  max={50}
                  step={1}
                  className="flex-1"
                />
                <span className="text-xs text-gray-400 w-8">{track.pan > 0 ? 'R' : track.pan < 0 ? 'L' : 'C'}</span>
              </div>

              {/* Delete Button */}
              <div className="col-span-1 flex justify-end">
                {index > 0 && (
                  <Button
                    data-testid={`delete-track-${track.id}`}
                    size="sm"
                    variant="ghost"
                    onClick={() => removeTrack(track.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Timeline Visualization - Faixa Arrastável */}
            <div className="mt-4 relative overflow-x-auto">
              <div 
                className="relative h-20 bg-zinc-900/70 rounded-lg border border-zinc-800"
                style={{ minWidth: `${Math.max(duration * zoom, 800)}px` }}
              >
                {track.audioUrl ? (
                  <div
                    onMouseDown={(e) => handleTrackMouseDown(e, track.id)}
                    className={`absolute top-2 h-16 rounded-lg cursor-move transition-all ${
                      draggingTrack === track.id ? 'opacity-70 shadow-2xl' : 'opacity-100 shadow-lg'
                    }`}
                    style={{
                      left: `${track.startTime * zoom}px`,
                      width: `${(track.duration || 30) * zoom}px`,
                      background: `linear-gradient(135deg, ${
                        index === 0 ? '#ff0400 0%, #ff0400dd 100%' : '#efd7ce40 0%, #efd7ce20 100%'
                      })`,
                      border: '2px solid',
                      borderColor: index === 0 ? '#ff0400' : '#efd7ce'
                    }}
                  >
                    <div className="absolute inset-0 flex items-center justify-between px-3">
                      <div className="flex items-center gap-2">
                        <Music className="w-4 h-4 text-white" />
                        <span className="text-xs font-medium text-white truncate max-w-[150px]">
                          {track.name}
                        </span>
                      </div>
                      <div className="text-xs text-white/70 font-mono">
                        {formatTime(track.startTime)} - {formatTime(track.startTime + (track.duration || 0))}
                      </div>
                    </div>
                    
                    {/* Waveform visual simplificado */}
                    <div className="absolute bottom-1 left-2 right-2 h-6 flex items-center gap-0.5">
                      {[...Array(20)].map((_, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-white/30 rounded-sm"
                          style={{ height: `${Math.random() * 100}%` }}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-600 text-sm">
                    {index === 0 ? 'Aguardando beat do projeto' : 'Carregue um arquivo de áudio'}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* AI Suggestions Dialog */}
      <Dialog open={showAiDialog} onOpenChange={setShowAiDialog}>
        <DialogContent className="bg-zinc-900 border-[#ff0400]/30 text-white max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-[#ff0400]" />
              Sugestões de IA - Mixagem e Masterização
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {aiAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-12 h-12 text-[#ff0400] animate-spin mb-4" />
                <p className="text-gray-400">Analisando seu projeto com IA...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-zinc-800 rounded-lg p-4">
                  <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans">{aiSuggestions}</pre>
                </div>
                <Button
                  onClick={() => setShowAiDialog(false)}
                  className="w-full bg-[#ff0400] hover:bg-[#ff0400]/90 text-white"
                >
                  Fechar
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Workspace;