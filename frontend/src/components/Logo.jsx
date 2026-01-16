import React from 'react';
import { Link } from 'react-router-dom';

const Logo = ({ className = "h-8", linkTo = "/" }) => {
  return (
    <Link to={linkTo} className="inline-block">
      <img
        src="/vibebeats-logo.png"
        alt="VibeBeats Logo"
        className={`${className} w-full h-auto`}
      />
    </Link>
  );
};

export default Logo;
