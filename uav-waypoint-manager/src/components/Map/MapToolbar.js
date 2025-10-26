import React, { useState } from 'react';

const MapToolbar = ({ onZoomIn, onZoomOut, onToggleLayer, onToggleMeasure, mapType }) => {
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [measureMode, setMeasureMode] = useState(false);

  const handleMeasureClick = () => {
    setMeasureMode(!measureMode);
    onToggleMeasure(!measureMode);
  };

  return (
    <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
      {/* Zoom Controls */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <button
          onClick={onZoomIn}
          className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 border-b border-gray-200 transition-colors"
          title="Zoom In"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
        <button
          onClick={onZoomOut}
          className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors"
          title="Zoom Out"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
      </div>

      {/* Layer Control */}
      <div className="relative">
        <button
          onClick={() => setShowLayerMenu(!showLayerMenu)}
          className={`w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors ${
            showLayerMenu ? 'bg-blue-50' : ''
          }`}
          title="Map Layers"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
          </svg>
        </button>

        {showLayerMenu && (
          <div className="absolute left-12 top-0 bg-white rounded-lg shadow-lg p-2 min-w-[150px]">
            <div className="text-xs font-semibold text-gray-700 mb-2 px-2">Map Type</div>
            <button
              onClick={() => {
                onToggleLayer('satellite');
                setShowLayerMenu(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 flex items-center justify-between ${
                mapType === 'satellite' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
              }`}
            >
              Satellite
              {mapType === 'satellite' && (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            <button
              onClick={() => {
                onToggleLayer('roadmap');
                setShowLayerMenu(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 flex items-center justify-between ${
                mapType === 'roadmap' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
              }`}
            >
              Roadmap
              {mapType === 'roadmap' && (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            <button
              onClick={() => {
                onToggleLayer('hybrid');
                setShowLayerMenu(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 flex items-center justify-between ${
                mapType === 'hybrid' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
              }`}
            >
              Hybrid
              {mapType === 'hybrid' && (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            <button
              onClick={() => {
                onToggleLayer('terrain');
                setShowLayerMenu(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 flex items-center justify-between ${
                mapType === 'terrain' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
              }`}
            >
              Terrain
              {mapType === 'terrain' && (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Measurement Tool */}
      <button
        onClick={handleMeasureClick}
        className={`w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors ${
          measureMode ? 'bg-blue-50 ring-2 ring-blue-500' : ''
        }`}
        title="Measure Distance"
      >
        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      </button>

      {/* Home/Reset View */}
      <button
        onClick={() => window.location.reload()}
        className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
        title="Reset View"
      >
        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </button>
    </div>
  );
};

export default MapToolbar;
