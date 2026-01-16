import React, { useState, useEffect, useRef, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, ChevronDown, ChevronUp, Music, Headphones, X } from 'lucide-react';
import { getFileUrl } from '@/App';

export const PlayerContext = React.createContext();

export const PlayerProvider = ({ children }) => {
  const [playlist, setPlaylist] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false);
  const audioRef = useRef(null);

  const currentTrack = playlist[currentTrackIndex];

  const addToPlaylist = (tracks) => {
    setPlaylist(tracks);
    if (tracks.length > 0 && !currentTrack) {
      setCurrentTrackIndex(0);
    }
  };

  const playTrack = (index) => {
    console.log('🎮 GlobalPlayer.playTrack called with index:', index);
    console.log('📋 Playlist length:', playlist.length);
    
    // VALIDAÇÃO: Verificar se o track existe antes de tentar tocar
    if (!playlist || playlist.length === 0) {
      console.error('❌ Playlist is empty!');
      return;
    }
    
    if (index < 0 || index >= playlist.length) {
      console.error('❌ Invalid track index:', index, 'Playlist length:', playlist.length);
      return;
    }
    
    const trackToPlay = playlist[index];
    if (!trackToPlay) {
      console.error('❌ Track at index', index, 'is undefined!');
      return;
    }
    
    console.log('🎵 Track to play:', trackToPlay.title);
    
    setCurrentTrackIndex(index);
    setIsPlaying(true);
    setHasPlayedOnce(true); // Marca que o player foi ativado
    
    console.log('✅ State updated: currentTrackIndex =', index, ', isPlaying = true');
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
        setHasPlayedOnce(true); // Marca que o player foi ativado
      }
      setIsPlaying(!isPlaying);
    }
  };

  const playNext = () => {
    if (currentTrackIndex < playlist.length - 1) {
      setCurrentTrackIndex(currentTrackIndex + 1);
      setIsPlaying(true);
    } else {
      setCurrentTrackIndex(0);
      setIsPlaying(true);
    }
  };

  const playPrevious = () => {
    if (currentTime > 3) {
      audioRef.current.currentTime = 0;
    } else if (currentTrackIndex > 0) {
      setCurrentTrackIndex(currentTrackIndex - 1);
      setIsPlaying(true);
    } else {
      setCurrentTrackIndex(playlist.length - 1);
      setIsPlaying(true);
    }
  };

  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume[0]);
    if (audioRef.current) {
      audioRef.current.volume = newVolume[0] / 100;
    }
    if (newVolume[0] > 0) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const stopPlayer = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const hidePlayer = () => {
    stopPlayer();
    setHasPlayedOnce(false);
  };

  useEffect(() => {
    if (audioRef.current && currentTrack) {
      const audioUrl = getFileUrl(currentTrack.audio_url);
      console.log('🎵 Setting audio source:', audioUrl);
      audioRef.current.src = audioUrl;
      audioRef.current.volume = volume / 100;
      
      if (isPlaying) {
        audioRef.current.play().catch(err => {
          console.error('❌ Playback error:', err);
          console.error('Audio URL:', audioUrl);
          console.error('Audio readyState:', audioRef.current.readyState);
        });
      }
    }
  }, [currentTrackIndex, currentTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => playNext();
    
    const handleError = (e) => {
      console.error('❌ Audio error event:', e);
      console.error('Error code:', audio.error?.code);
      console.error('Error message:', audio.error?.message);
      console.error('Audio src:', audio.src);
    };
    
    const handleCanPlay = () => {
      console.log('✅ Audio can play');
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [currentTrackIndex, playlist]);

  const value = {
    playlist,
    currentTrack,
    currentTrackIndex,
    isPlaying,
    volume,
    isMuted,
    currentTime,
    duration,
    isMinimized,
    hasPlayedOnce,
    addToPlaylist,
    playTrack,
    togglePlay,
    playNext,
    playPrevious,
    handleVolumeChange,
    toggleMute,
    setIsMinimized,
    stopPlayer,
    hidePlayer
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio ref={audioRef} />
    </PlayerContext.Provider>
  );
};

export const GlobalPlayer = () => {
  const location = useLocation();
  const {
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    currentTime,
    duration,
    isMinimized,
    hasPlayedOnce,
    togglePlay,
    playNext,
    playPrevious,
    handleVolumeChange,
    toggleMute,
    setIsMinimized,
    hidePlayer
  } = useContext(PlayerContext);

  // Esconder player no workspace
  const isInWorkspace = location.pathname.includes('/workspace');

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Só mostra o player se:
  // 1. Não está no workspace
  // 2. Tem uma faixa carregada
  // 3. O usuário já deu play pelo menos uma vez
  if (isInWorkspace || !currentTrack || !hasPlayedOnce) return null;

  return (
    <div 
      data-testid="global-player"
      className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-500 ease-out animate-slide-up ${
        isMinimized ? 'translate-y-[calc(100%-3rem)]' : 'translate-y-0'
      }`}
    >
      {/* Progress Bar */}
      {!isMinimized && (
        <div className="h-1 bg-zinc-900 cursor-pointer group">
          <div 
            className="h-full bg-gradient-to-r from-[#ff0400] to-[#ff0400]/90 transition-all relative"
            style={{ width: `${progressPercentage}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"></div>
          </div>
        </div>
      )}

      {/* Player Container */}
      <div className="glass border-t border-[#efd7ce]/20 backdrop-blur-xl">
        <div className="max-w-full px-4 py-3">
          <div className="grid grid-cols-12 gap-4 items-center">
            {/* Track Info - Col 1-3 */}
            <div className="col-span-3 flex items-center gap-3 min-w-0">
              <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-900">
                {currentTrack.cover_url ? (
                  <img 
                    src={getFileUrl(currentTrack.cover_url)} 
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Headphones className="w-6 h-6 text-gray-600" />
                  </div>
                )}
              </div>
              {!isMinimized && (
                <div className="min-w-0 flex-1">
                  <h4 className="text-white font-semibold text-sm truncate">
                    {currentTrack.title}
                  </h4>
                  <p className="text-gray-400 text-xs truncate">
                    {currentTrack.producer_name}
                  </p>
                </div>
              )}
            </div>

            {/* Controls - Col 4-6 */}
            {!isMinimized && (
              <div className="col-span-6 flex flex-col items-center gap-2">
                {/* Playback Controls */}
                <div className="flex items-center gap-4">
                  <Button
                    data-testid="player-previous"
                    size="sm"
                    variant="ghost"
                    onClick={playPrevious}
                    className="text-gray-400 hover:text-white"
                  >
                    <SkipBack className="w-5 h-5" />
                  </Button>

                  <Button
                    data-testid="player-play-pause"
                    size="lg"
                    onClick={togglePlay}
                    className="bg-[#ff0400] hover:bg-[#ff0400]/90 text-white rounded-full w-10 h-10 p-0"
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5 ml-0.5" />
                    )}
                  </Button>

                  <Button
                    data-testid="player-next"
                    size="sm"
                    variant="ghost"
                    onClick={playNext}
                    className="text-gray-400 hover:text-white"
                  >
                    <SkipForward className="w-5 h-5" />
                  </Button>
                </div>

                {/* Time Display */}
                <div className="flex items-center gap-2 text-xs text-gray-400 w-full max-w-md">
                  <span className="w-12 text-right">{formatTime(currentTime)}</span>
                  <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#ff0400] transition-all"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <span className="w-12">{formatTime(duration)}</span>
                </div>
              </div>
            )}

            {/* Volume & Actions - Col 7-9 */}
            {!isMinimized && (
              <div className="col-span-3 flex items-center justify-end gap-3">
                {/* Volume Control */}
                <div className="flex items-center gap-2">
                  <Button
                    data-testid="player-mute"
                    size="sm"
                    variant="ghost"
                    onClick={toggleMute}
                    className="text-gray-400 hover:text-white"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </Button>
                  <Slider
                    value={[volume]}
                    onValueChange={handleVolumeChange}
                    max={100}
                    step={1}
                    className="w-24"
                  />
                </div>

                {/* Minimize & Close Buttons */}
                <Button
                  data-testid="player-minimize"
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="text-gray-400 hover:text-white"
                  title="Minimizar player"
                >
                  {isMinimized ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </Button>
                
                <Button
                  data-testid="player-close-expanded"
                  size="sm"
                  variant="ghost"
                  onClick={hidePlayer}
                  className="text-gray-400 hover:text-red-400 hover:bg-red-900/20"
                  title="Fechar player"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Minimized View */}
            {isMinimized && (
              <div className="col-span-9 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Button
                    data-testid="player-minimized-play"
                    size="sm"
                    onClick={togglePlay}
                    className="bg-[#ff0400] hover:bg-[#ff0400]/90 text-white rounded-full w-8 h-8 p-0 flex-shrink-0"
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4 ml-0.5" />
                    )}
                  </Button>
                  <div className="min-w-0 flex-1">
                    <div className="text-white text-sm truncate">{currentTrack.title}</div>
                    <div className="text-gray-400 text-xs truncate">{currentTrack.producer_name}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    data-testid="player-expand"
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsMinimized(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <ChevronUp className="w-5 h-5" />
                  </Button>
                  <Button
                    data-testid="player-close"
                    size="sm"
                    variant="ghost"
                    onClick={hidePlayer}
                    className="text-gray-400 hover:text-red-400 hover:bg-red-900/20"
                    title="Fechar player"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
