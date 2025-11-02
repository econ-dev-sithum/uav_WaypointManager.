import React, { useState } from 'react';

const MapToolbar = ({ onZoomIn, onZoomOut, onToggleLayer, onToggleMeasure, mapType, currentLocation, locationLoading, locationError, onNavigateToLocation, onRetryLocation, onUseMapCenter }) => {
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

      {/* Navigate to Current Location */}
      {locationLoading && (
        <button
          disabled
          className="w-10 h-10 bg-yellow-400 rounded-lg shadow-lg flex items-center justify-center cursor-wait"
          title="Getting GPS Location..."
        >
          <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </button>
      )}

      {locationError && !locationLoading && (
        <>
          <button
            onClick={onRetryLocation}
            className="w-10 h-10 bg-red-500 hover:bg-red-600 rounded-lg shadow-lg flex items-center justify-center transition-colors"
            title={`${locationError} - Click to retry GPS`}
          >
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
          </button>
          <button
            onClick={onUseMapCenter}
            className="w-10 h-10 bg-green-600 hover:bg-green-700 rounded-lg shadow-lg flex items-center justify-center transition-colors"
            title="Use map center as my location"
          >
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              <circle cx="12" cy="9" r="1.5" fill="white"/>
            </svg>
          </button>
        </>
      )}

      {currentLocation && !locationLoading && !locationError && (
        <button
          onClick={onNavigateToLocation}
          className="w-10 h-10 bg-blue-600 rounded-lg shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
          title="Navigate to Current Location"
        >
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            <circle cx="12" cy="9" r="1.5" fill="white"/>
          </svg>
        </button>
      )}
    </div>
  );
};

export default MapToolbar;
