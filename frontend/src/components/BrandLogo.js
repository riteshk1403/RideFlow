import React from 'react';
import './BrandLogo.css';

/**
 * RideFlow Brand Logo Component
 * Luxury Chauffeur Steering Wheel & Waypoint Beacon Emblem
 */
const BrandLogo = ({
  size = 'md',
  showText = true,
  subtitle = null,
  onClick,
  className = ''
}) => {
  return (
    <div
      className={`rf-brand-logo ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => (e.key === 'Enter' || e.key === ' ') && onClick() : undefined}
    >
      <div className={`rf-logo-badge size-${size}`}>
        <svg
          className="rf-logo-svg"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="rfWheelGrad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="50%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
            <linearGradient id="rfWaypointGrad" x1="18" y1="8" x2="30" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
            <filter id="rfGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="2.5" floodColor="#6366f1" floodOpacity="0.5" />
            </filter>
          </defs>

          {/* Outer Steering Rim */}
          <circle
            cx="24"
            cy="24"
            r="19"
            stroke="url(#rfWheelGrad)"
            strokeWidth="3.2"
            strokeLinecap="round"
          />

          {/* Chauffeur Grip Accents at 10 & 2 o'clock */}
          <path
            d="M 9 17 A 19 19 0 0 1 14 9"
            stroke="#38bdf8"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          <path
            d="M 39 17 A 19 19 0 0 0 34 9"
            stroke="#38bdf8"
            strokeWidth="4.5"
            strokeLinecap="round"
          />

          {/* 3-Spoke Chauffeur Steering Spoke Architecture */}
          {/* Horizontal Spokes */}
          <path
            d="M 6.5 24.5 H 18.5"
            stroke="url(#rfWheelGrad)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M 29.5 24.5 H 41.5"
            stroke="url(#rfWheelGrad)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Vertical Down Spoke */}
          <path
            d="M 24 29.5 V 41.5"
            stroke="url(#rfWheelGrad)"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Fused Waypoint Beacon Core */}
          <path
            d="M 24 9.5 C 19.8 9.5 16.5 12.8 16.5 17 C 16.5 22.3 22.6 28.5 24 29.8 C 25.4 28.5 31.5 22.3 31.5 17 C 31.5 12.8 28.2 9.5 24 9.5 Z"
            fill="url(#rfWaypointGrad)"
            filter="url(#rfGlow)"
          />

          {/* Waypoint Lens / Radar Center */}
          <circle cx="24" cy="17" r="3.2" fill="#0b1120" />
          <circle cx="24" cy="17" r="1.6" fill="#38bdf8" />
        </svg>
      </div>

      {showText && (
        <div className="rf-logo-text">
          <h1 className={`rf-logo-title text-${size}`}>
            Ride<span className="rf-gradient-flow">Flow</span>
          </h1>
          {subtitle && <span className="rf-logo-subtitle">{subtitle}</span>}
        </div>
      )}
    </div>
  );
};

export default BrandLogo;
