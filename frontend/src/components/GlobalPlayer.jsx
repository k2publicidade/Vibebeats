import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Volume1,
  ChevronDown, ChevronUp, Headphones, X, Repeat, Shuffle, Heart,
  ListMusic, Maximize2
} from 'lucide-react';

export const PlayerContext = React.createContext();

// Helper para obter URL correta do áudio
const getAudioUrl = (url) => {
  if (!url) return null;
  // Se já é URL completa, retorna direto
  if (url.startsWith('http')) return url;
  // Se é path relativo, monta URL do Supabase
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://sjwyyxwccooyoxbzrthq.supabase.co';
  return `${supabaseUrl}/storage/v1/object/public/audio/${url}`;
};

// Helper para obter URL da capa
const getCoverUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://sjwyyxwccooyoxbzrthq.supabase.co';
  return `${supabaseUrl}/storage/v1/object/public/covers/${url}`;
};

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
  const [isLoading, setIsLoading] = useState(false);
  const [repeatMode, setRepeatMode] = useState('none'); // none, one, all
  const [isShuffle, setIsShuffle] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const audioRef = useRef(null);

  const currentTrack = playlist[currentTrackIndex];

  const addToPlaylist = (tracks) => {
    setPlaylist(tracks);
    if (tracks.length > 0 && !currentTrack) {
      setCurrentTrackIndex(0);
    }
  };

  const playTrack = (index) => {
    if (!playlist || playlist.length === 0) {
      console.error('Playlist is empty');
      return;
    }

    if (index < 0 || index >= playlist.length) {
      console.error('Invalid track index:', index);
      return;
    }

    setCurrentTrackIndex(index);
    setIsPlaying(true);
    setHasPlayedOnce(true);
    setIsLoading(true);
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(console.error);
        setHasPlayedOnce(true);
      }
      setIsPlaying(!isPlaying);
    }
  };

  const getNextIndex = useCallback(() => {
    if (isShuffle) {
      const availableIndices = playlist
        .map((_, i) => i)
        .filter(i => i !== currentTrackIndex);
      return availableIndices[Math.floor(Math.random() * availableIndices.length)];
    }
    return currentTrackIndex < playlist.length - 1 ? currentTrackIndex + 1 : 0;
  }, [currentTrackIndex, playlist, isShuffle]);

  const playNext = useCallback(() => {
    if (playlist.length <= 1) return;
    const nextIndex = getNextIndex();
    setCurrentTrackIndex(nextIndex);
    setIsPlaying(true);
    setIsLoading(true);
  }, [playlist, getNextIndex]);

  const playPrevious = () => {
    if (currentTime > 3 && audioRef.current) {
      audioRef.current.currentTime = 0;
    } else if (currentTrackIndex > 0) {
      setCurrentTrackIndex(currentTrackIndex - 1);
      setIsPlaying(true);
      setIsLoading(true);
    } else {
      setCurrentTrackIndex(playlist.length - 1);
      setIsPlaying(true);
      setIsLoading(true);
    }
  };

  const handleVolumeChange = (newVolume) => {
    const vol = Array.isArray(newVolume) ? newVolume[0] : newVolume;
    setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol / 100;
    }
    if (vol > 0) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const seekTo = (time) => {
    if (audioRef.current && !isNaN(time)) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
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

  const toggleRepeat = () => {
    const modes = ['none', 'all', 'one'];
    const currentIndex = modes.indexOf(repeatMode);
    setRepeatMode(modes[(currentIndex + 1) % modes.length]);
  };

  const toggleShuffle = () => {
    setIsShuffle(!isShuffle);
  };

  // Load and play track when it changes
  useEffect(() => {
    if (audioRef.current && currentTrack) {
      const audioUrl = getAudioUrl(currentTrack.audio_url);
      console.log('Loading audio:', audioUrl);

      if (audioUrl) {
        audioRef.current.src = audioUrl;
        audioRef.current.volume = isMuted ? 0 : volume / 100;
        audioRef.current.load();

        if (isPlaying) {
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => setIsLoading(false))
              .catch(err => {
                console.error('Playback error:', err);
                setIsLoading(false);
              });
          }
        }
      }
    }
  }, [currentTrackIndex, currentTrack]);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      if (!isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const updateBuffered = () => {
      if (audio.buffered.length > 0) {
        setBuffered(audio.buffered.end(audio.buffered.length - 1));
      }
    };

    const handleEnded = () => {
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play();
      } else if (repeatMode === 'all' || currentTrackIndex < playlist.length - 1) {
        playNext();
      } else {
        setIsPlaying(false);
      }
    };

    const handleError = (e) => {
      console.error('Audio error:', audio.error);
      setIsLoading(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      if (isPlaying) {
        audio.play().catch(console.error);
      }
    };

    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => setIsLoading(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('durationchange', updateDuration);
    audio.addEventListener('progress', updateBuffered);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('durationchange', updateDuration);
      audio.removeEventListener('progress', updateBuffered);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
    };
  }, [currentTrackIndex, playlist, repeatMode, isPlaying, playNext]);

  const value = {
    playlist,
    currentTrack,
    currentTrackIndex,
    isPlaying,
    volume,
    isMuted,
    currentTime,
    duration,
    buffered,
    isMinimized,
    hasPlayedOnce,
    isLoading,
    repeatMode,
    isShuffle,
    addToPlaylist,
    playTrack,
    togglePlay,
    playNext,
    playPrevious,
    handleVolumeChange,
    toggleMute,
    setIsMinimized,
    stopPlayer,
    hidePlayer,
    seekTo,
    toggleRepeat,
    toggleShuffle
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio ref={audioRef} preload="auto" crossOrigin="anonymous" />
    </PlayerContext.Provider>
  );
};

export const GlobalPlayer = () => {
  const location = useLocation();
  const progressRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const {
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    currentTime,
    duration,
    buffered,
    isMinimized,
    hasPlayedOnce,
    isLoading,
    repeatMode,
    isShuffle,
    togglePlay,
    playNext,
    playPrevious,
    handleVolumeChange,
    toggleMute,
    setIsMinimized,
    hidePlayer,
    seekTo,
    toggleRepeat,
    toggleShuffle
  } = useContext(PlayerContext);

  const isInWorkspace = location.pathname.includes('/workspace');

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercentage = duration > 0 ? (buffered / duration) * 100 : 0;

  // Handle progress bar click/drag
  const handleProgressClick = (e) => {
    if (!progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    seekTo(percentage * duration);
  };

  const handleProgressMouseDown = (e) => {
    setIsDragging(true);
    handleProgressClick(e);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        handleProgressClick(e);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, duration]);

  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2;

  if (isInWorkspace || !currentTrack || !hasPlayedOnce) return null;

  return (
    <div
      data-testid="global-player"
      className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-out ${
        isMinimized ? 'h-16' : 'h-24'
      }`}
    >
      {/* Background with blur */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/95 to-black/90 backdrop-blur-xl border-t border-white/10" />

      {/* Content */}
      <div className="relative h-full max-w-screen-2xl mx-auto px-4 flex flex-col">

        {/* Progress Bar - Always visible at top */}
        <div
          ref={progressRef}
          className="absolute top-0 left-0 right-0 h-1 bg-white/10 cursor-pointer group"
          onMouseDown={handleProgressMouseDown}
        >
          {/* Buffered */}
          <div
            className="absolute top-0 left-0 h-full bg-white/20 transition-all"
            style={{ width: `${bufferedPercentage}%` }}
          />
          {/* Progress */}
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#ff0400] to-[#ff6b00] transition-all"
            style={{ width: `${progressPercentage}%` }}
          >
            {/* Scrubber */}
            <div
              className={`absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg shadow-black/50 transition-all ${
                isDragging ? 'scale-125 opacity-100' : 'scale-0 group-hover:scale-100 opacity-0 group-hover:opacity-100'
              }`}
            />
          </div>
          {/* Hover expand effect */}
          <div className="absolute inset-0 h-1 group-hover:h-1.5 transition-all" />
        </div>

        {/* Main Player Content */}
        <div className={`flex-1 flex items-center gap-4 pt-2 ${isMinimized ? 'py-2' : ''}`}>

          {/* Track Info - Left */}
          <div className="flex items-center gap-3 min-w-0 w-1/4">
            {/* Album Art */}
            <div className={`relative flex-shrink-0 rounded-lg overflow-hidden bg-zinc-900 shadow-xl transition-all ${
              isMinimized ? 'w-10 h-10' : 'w-14 h-14'
            }`}>
              {currentTrack.cover_url ? (
                <img
                  src={getCoverUrl(currentTrack.cover_url)}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                  <Headphones className={`text-zinc-600 ${isMinimized ? 'w-5 h-5' : 'w-6 h-6'}`} />
                </div>
              )}
              {/* Playing animation overlay */}
              {isPlaying && !isMinimized && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div className="flex items-end gap-0.5 h-4">
                    <div className="w-1 bg-[#ff0400] rounded-full animate-music-bar-1" />
                    <div className="w-1 bg-[#ff0400] rounded-full animate-music-bar-2" />
                    <div className="w-1 bg-[#ff0400] rounded-full animate-music-bar-3" />
                  </div>
                </div>
              )}
            </div>

            {/* Track Details */}
            <div className="min-w-0 flex-1">
              <h4 className={`text-white font-semibold truncate ${isMinimized ? 'text-sm' : 'text-base'}`}>
                {currentTrack.title}
              </h4>
              {!isMinimized && (
                <p className="text-zinc-400 text-sm truncate hover:text-white cursor-pointer transition-colors">
                  {currentTrack.producer_name}
                </p>
              )}
            </div>

            {/* Like Button - Only in expanded */}
            {!isMinimized && (
              <Button
                size="sm"
                variant="ghost"
                className="text-zinc-400 hover:text-[#ff0400] hover:bg-transparent flex-shrink-0"
              >
                <Heart className="w-5 h-5" />
              </Button>
            )}
          </div>

          {/* Playback Controls - Center */}
          <div className={`flex-1 flex flex-col items-center justify-center gap-1 ${isMinimized ? 'flex-row gap-4' : ''}`}>
            {/* Control Buttons */}
            <div className="flex items-center gap-2">
              {/* Shuffle - Only expanded */}
              {!isMinimized && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={toggleShuffle}
                  className={`${isShuffle ? 'text-[#ff0400]' : 'text-zinc-400'} hover:text-white hover:bg-white/5`}
                >
                  <Shuffle className="w-4 h-4" />
                </Button>
              )}

              {/* Previous */}
              <Button
                data-testid="player-previous"
                size="sm"
                variant="ghost"
                onClick={playPrevious}
                className="text-zinc-400 hover:text-white hover:bg-white/5"
              >
                <SkipBack className="w-5 h-5 fill-current" />
              </Button>

              {/* Play/Pause */}
              <Button
                data-testid="player-play-pause"
                onClick={togglePlay}
                disabled={isLoading}
                className={`rounded-full bg-white hover:bg-white/90 text-black transition-all hover:scale-105 active:scale-95 ${
                  isMinimized ? 'w-9 h-9' : 'w-10 h-10'
                }`}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </Button>

              {/* Next */}
              <Button
                data-testid="player-next"
                size="sm"
                variant="ghost"
                onClick={playNext}
                className="text-zinc-400 hover:text-white hover:bg-white/5"
              >
                <SkipForward className="w-5 h-5 fill-current" />
              </Button>

              {/* Repeat - Only expanded */}
              {!isMinimized && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={toggleRepeat}
                  className={`relative ${repeatMode !== 'none' ? 'text-[#ff0400]' : 'text-zinc-400'} hover:text-white hover:bg-white/5`}
                >
                  <Repeat className="w-4 h-4" />
                  {repeatMode === 'one' && (
                    <span className="absolute -top-0.5 -right-0.5 text-[8px] font-bold">1</span>
                  )}
                </Button>
              )}
            </div>

            {/* Time Progress - Only expanded */}
            {!isMinimized && (
              <div className="flex items-center gap-2 text-xs text-zinc-500 w-full max-w-md px-4">
                <span className="w-10 text-right tabular-nums">{formatTime(currentTime)}</span>
                <div className="flex-1" />
                <span className="w-10 tabular-nums">{formatTime(duration)}</span>
              </div>
            )}
          </div>

          {/* Volume & Extra Controls - Right */}
          <div className="flex items-center justify-end gap-2 w-1/4">
            {/* Queue Button - Only expanded */}
            {!isMinimized && (
              <Button
                size="sm"
                variant="ghost"
                className="text-zinc-400 hover:text-white hover:bg-white/5"
              >
                <ListMusic className="w-5 h-5" />
              </Button>
            )}

            {/* Volume Control */}
            <div
              className="relative flex items-center gap-1"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <Button
                data-testid="player-mute"
                size="sm"
                variant="ghost"
                onClick={toggleMute}
                className="text-zinc-400 hover:text-white hover:bg-white/5"
              >
                <VolumeIcon className="w-5 h-5" />
              </Button>

              {/* Volume Slider */}
              <div className={`overflow-hidden transition-all duration-200 ${
                showVolumeSlider || !isMinimized ? 'w-24 opacity-100' : 'w-0 opacity-0'
              }`}>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  onValueChange={handleVolumeChange}
                  max={100}
                  step={1}
                  className="w-24"
                />
              </div>
            </div>

            {/* Minimize/Maximize */}
            <Button
              data-testid="player-minimize"
              size="sm"
              variant="ghost"
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-zinc-400 hover:text-white hover:bg-white/5"
            >
              {isMinimized ? (
                <Maximize2 className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </Button>

            {/* Close */}
            <Button
              data-testid="player-close"
              size="sm"
              variant="ghost"
              onClick={hidePlayer}
              className="text-zinc-400 hover:text-red-400 hover:bg-red-400/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* CSS for music bar animation */}
      <style>{`
        @keyframes musicBar1 {
          0%, 100% { height: 4px; }
          50% { height: 16px; }
        }
        @keyframes musicBar2 {
          0%, 100% { height: 8px; }
          50% { height: 12px; }
        }
        @keyframes musicBar3 {
          0%, 100% { height: 12px; }
          50% { height: 6px; }
        }
        .animate-music-bar-1 { animation: musicBar1 0.8s ease-in-out infinite; }
        .animate-music-bar-2 { animation: musicBar2 0.6s ease-in-out infinite 0.2s; }
        .animate-music-bar-3 { animation: musicBar3 0.7s ease-in-out infinite 0.1s; }
      `}</style>
    </div>
  );
};
