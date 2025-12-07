

import React from 'react';
import { TopHatAccessory, SunglassesAccessory, BowTieAccessory, PropellerHatAccessory, CrownAccessory } from './Icons';

type RobotState = 'idle' | 'thinking' | 'angry' | 'greeting' | 'success' | 'error';

interface FloatingRobotProps {
  state: RobotState;
  color?: string;
  accessory?: string | null;
  onClick: () => void;
}

const Accessories: { [key: string]: React.FC } = {
  'top-hat': TopHatAccessory,
  'sunglasses': SunglassesAccessory,
  'bow-tie': BowTieAccessory,
  'propeller-hat': PropellerHatAccessory,
  'crown': CrownAccessory,
};

// Keyframe definitions for new animations
const animationStyles = `
  @keyframes wave {
    0%, 60%, 100% { transform: rotate(0deg); }
    10%, 30% { transform: rotate(14deg); }
    20%, 40% { transform: rotate(-8deg); }
    50% { transform: rotate(10deg); }
  }
  .animate-wave { animation: wave 2s ease-in-out; }

  @keyframes success-pop {
    0%, 100% { transform: translateY(0) scale(1); }
    50% { transform: translateY(-10px) scale(1.1); }
  }
  .animate-success-pop { animation: success-pop 0.5s ease-in-out; }

  @keyframes error-tilt {
    0%, 100% { transform: rotate(0); }
    20%, 60% { transform: rotate(-8deg); }
    40%, 80% { transform: rotate(8deg); }
  }
  .animate-error-tilt { animation: error-tilt 0.6s ease-in-out; }
`;

const FloatingRobot: React.FC<FloatingRobotProps> = ({ state, color = '#f3f4f6', accessory, onClick }) => {
    const stateClasses = {
        idle: { eye: '#3b82f6', antenna: '', robot: 'animate-hover', tooltip: 'Click to open the Robot Store!' },
        thinking: { eye: '#3b82f6', antenna: 'animate-blink', robot: '', tooltip: 'STENPAN AI is thinking...' },
        angry: { eye: '#ef4444', antenna: '', robot: 'animate-shake', tooltip: 'Violation detected! Account will be suspended.' },
        greeting: { eye: '#22c55e', antenna: '', robot: '', tooltip: 'Hello there!', arm: 'animate-wave' },
        success: { eye: '#22c55e', antenna: 'animate-blink', robot: 'animate-success-pop', tooltip: 'Task completed!' },
        error: { eye: '#f97316', antenna: '', robot: 'animate-error-tilt', tooltip: 'Something went wrong.' },
    };

    const current = stateClasses[state];
    const AccessoryComponent = accessory ? Accessories[accessory] : null;

    const isCosmic = color.includes('#4f46e5');
    const isIce = color.includes('#e0f2fe');
    let fillValue = color;
    if (isCosmic) fillValue = 'url(#cosmic-gradient-robot)';
    else if (isIce) fillValue = 'url(#ice-gradient-robot)';

  return (
    <>
      <style>{animationStyles}</style>
      <div className="group fixed bottom-28 right-6 z-30">
        <button
          onClick={onClick}
          className={`relative transition-transform duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full ${current.robot}`}
          aria-label="Open Robot Store"
        >
            <svg width="64" height="64" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
                <defs>
                    <linearGradient id="cosmic-gradient-robot" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor: '#4f46e5'}} />
                        <stop offset="100%" style={{stopColor: '#c026d3'}} />
                    </linearGradient>
                    <linearGradient id="ice-gradient-robot" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor: '#e0f2fe'}} />
                        <stop offset="100%" style={{stopColor: '#a5f3fc'}} />
                    </linearGradient>
                </defs>
                <g>
                    {/* Antenna */}
                    <line x1="50" y1="15" x2="50" y2="5" stroke="#9ca3af" strokeWidth="2" />
                    <circle cx="50" cy="5" r="3" fill="#9ca3af" className={current.antenna} />
                    
                    {/* Head */}
                    <rect x="30" y="15" width="40" height="30" rx="8" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="2" />
                    
                    {/* Eyes */}
                    <circle cx="42" cy="30" r="5" fill={current.eye} className="transition-colors duration-300" />
                    <circle cx="58" cy="30" r="5" fill={current.eye} className="transition-colors duration-300" />

                    {/* Left Arm (for waving) */}
                    <g style={{ transformOrigin: '25px 55px' }} className={current.arm}>
                        <rect x="10" y="50" width="15" height="10" rx="5" fill={fillValue} stroke="#9ca3af" strokeWidth="2" />
                    </g>
                    
                    {/* Body */}
                    <rect x="25" y="45" width="50" height="40" rx="10" fill={fillValue} stroke="#9ca3af" strokeWidth="2" className="transition-colors duration-300" />
                    
                    {/* Chest Plate */}
                    <rect x="40" y="55" width="20" height="15" rx="3" fill="#d1d5db" />

                    {/* Accessory */}
                    {AccessoryComponent && <g className="text-slate-700 dark:text-slate-800">{AccessoryComponent()}</g>}
                </g>
            </svg>
        </button>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-1.5 bg-gray-800 text-white text-xs font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {current.tooltip}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
        </div>
      </div>
    </>
  );
};

export default FloatingRobot;