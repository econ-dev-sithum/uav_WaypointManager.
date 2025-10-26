import React, { useState } from 'react';
import { useMission } from '../../context/MissionContext';

const MissionBrowser = () => {
  const { waypoints, missionMetadata, setMissionMetadata } = useMission();
  const [expandedSections, setExpandedSections] = useState({
    missions: true,
    settings: false,
    info: true,
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-md h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold flex items-center text-gray-800">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          Mission Browser
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Mission Info Section */}
        <div className="border-b border-gray-200">
          <button
            onClick={() => toggleSection('info')}
            className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <span className="font-medium text-sm text-gray-700 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Mission Info
            </span>
            <svg
              className={`w-4 h-4 text-gray-500 transition-transform ${expandedSections.info ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expandedSections.info && (
            <div className="px-4 pb-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Mission Name</label>
                <input
                  type="text"
                  value={missionMetadata.name}
                  onChange={(e) => setMissionMetadata(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter mission name"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Description</label>
                <textarea
                  value={missionMetadata.description}
                  onChange={(e) => setMissionMetadata(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows="3"
                  placeholder="Enter mission description"
                />
              </div>
            </div>
          )}
        </div>

        {/* Missions Section */}
        <div className="border-b border-gray-200">
          <button
            onClick={() => toggleSection('missions')}
            className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <span className="font-medium text-sm text-gray-700 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Current Mission
            </span>
            <svg
              className={`w-4 h-4 text-gray-500 transition-transform ${expandedSections.missions ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expandedSections.missions && (
            <div className="px-4 pb-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-semibold text-sm text-blue-900">{missionMetadata.name}</span>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-blue-700">
                  <div className="flex justify-between">
                    <span className="text-blue-600">Waypoints:</span>
                    <span className="font-semibold">{waypoints.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600">Home Position:</span>
                    <span className="font-mono text-[10px]">
                      {missionMetadata.homePosition.lat.toFixed(4)}, {missionMetadata.homePosition.lng.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600">Default Alt:</span>
                    <span className="font-semibold">{missionMetadata.defaultAltitude}m</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Settings Section */}
        <div className="border-b border-gray-200">
          <button
            onClick={() => toggleSection('settings')}
            className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <span className="font-medium text-sm text-gray-700 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Default Settings
            </span>
            <svg
              className={`w-4 h-4 text-gray-500 transition-transform ${expandedSections.settings ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expandedSections.settings && (
            <div className="px-4 pb-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Default Altitude (m)</label>
                <input
                  type="number"
                  value={missionMetadata.defaultAltitude}
                  onChange={(e) => setMissionMetadata(prev => ({ ...prev, defaultAltitude: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Default Speed (m/s)</label>
                <input
                  type="number"
                  value={missionMetadata.defaultSpeed}
                  onChange={(e) => setMissionMetadata(prev => ({ ...prev, defaultSpeed: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="0.1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Home Latitude</label>
                <input
                  type="number"
                  value={missionMetadata.homePosition.lat}
                  onChange={(e) => setMissionMetadata(prev => ({
                    ...prev,
                    homePosition: { ...prev.homePosition, lat: parseFloat(e.target.value) || 0 }
                  }))}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  step="0.000001"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Home Longitude</label>
                <input
                  type="number"
                  value={missionMetadata.homePosition.lng}
                  onChange={(e) => setMissionMetadata(prev => ({
                    ...prev,
                    homePosition: { ...prev.homePosition, lng: parseFloat(e.target.value) || 0 }
                  }))}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  step="0.000001"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MissionBrowser;
