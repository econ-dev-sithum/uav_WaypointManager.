import React from 'react';

const MapSidebar = ({ currentMode, onModeChange, onCenterMap, hasTakeoff, onAddRTL }) => {
  const modes = [
    {
      id: 'takeoff',
      label: 'Takeoff',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" transform="rotate(-45 12 12)" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v4m0 12v4" />
        </svg>
      ),
    },
    {
      id: 'waypoint',
      label: 'Waypoint',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
    {
      id: 'return',
      label: 'Return',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      id: 'center',
      label: 'Center',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3" strokeWidth={2} />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v4m0 12v4M2 12h4m12 0h4" />
        </svg>
      ),
    },
  ];

  const handleClick = (mode) => {
    // Check if waypoint/return modes require takeoff
    const requiresTakeoff = ['waypoint', 'return'].includes(mode.id);

    if (requiresTakeoff && !hasTakeoff) {
      onModeChange('takeoff');
      return;
    }

    if (mode.id === 'center') {
      onCenterMap();
    } else if (mode.id === 'return') {
      // Add RTL immediately without map click
      onAddRTL();
    } else {
      onModeChange(mode.id);
    }
  };

  return (
    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 flex flex-col gap-1">
      {modes.map((mode) => {
        const requiresTakeoff = ['waypoint', 'return'].includes(mode.id);
        const isDisabled = requiresTakeoff && !hasTakeoff;

        return (
          <button
            key={mode.id}
            onClick={() => handleClick(mode)}
            disabled={isDisabled}
            className={`group relative w-12 h-12 rounded-lg shadow-lg transition-all duration-200 flex flex-col items-center justify-center ${
              isDisabled
                ? 'bg-gray-600 bg-opacity-50 text-gray-400 cursor-not-allowed'
                : currentMode === mode.id
                ? 'bg-blue-600 text-white scale-110'
                : 'bg-gray-800 bg-opacity-80 text-white hover:bg-opacity-100 hover:scale-105'
            }`}
            title={isDisabled ? 'Add Takeoff first' : mode.label}
          >
            {mode.icon}
            <span className="text-[9px] mt-0.5 font-medium">{mode.label}</span>

            {/* Tooltip on hover */}
            <div className="absolute left-14 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <div className="bg-gray-900 text-white px-3 py-1.5 rounded-md text-xs whitespace-nowrap shadow-lg">
                {isDisabled ? 'Add Takeoff first' : mode.label}
                <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default MapSidebar;
