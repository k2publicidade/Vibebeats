import React from 'react';

const Waveform = ({ isPlaying, color = '#ff0400' }) => {
  const bars = 40;
  
  return (
    <div className="flex items-center justify-center gap-[2px] h-full">
      {[...Array(bars)].map((_, i) => {
        const height = 20 + Math.sin(i * 0.5) * 30 + Math.random() * 20;
        const delay = i * 0.05;
        
        return (
          <div
            key={i}
            className={`w-[2px] rounded-full transition-all duration-150 ${
              isPlaying ? 'animate-pulse' : ''
            }`}
            style={{
              height: `${height}%`,
              backgroundColor: color,
              opacity: 0.3 + Math.random() * 0.7,
              animationDelay: `${delay}s`
            }}
          />
        );
      })}
    </div>
  );
};

export default Waveform;