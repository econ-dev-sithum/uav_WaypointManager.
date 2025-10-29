import React, { useRef, useState } from 'react';
import { useMission } from '../../context/MissionContext';

const MissionPanel = () => {
  const { waypoints, clearMission, importMission, exportMission, exportQGroundControlMission, getMissionStats, addReturnToLaunch } = useMission();
  const fileInputRef = useRef(null);
  const [showFilenameDialog, setShowFilenameDialog] = useState(false);
  const [customFilename, setCustomFilename] = useState('mission');

  const stats = getMissionStats();

  const formatDistance = (meters) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)} km`;
    }
    return `${meters.toFixed(0)} m`;
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const handleDownload = () => {
    const missionData = exportMission();
    const blob = new Blob([JSON.stringify(missionData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mission_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadQGC = () => {
    setShowFilenameDialog(true);
  };

  const handleConfirmDownload = () => {
    const filename = customFilename.trim() || 'mission';
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9_\-]/g, '_');

    const missionData = exportQGroundControlMission();
    const blob = new Blob([JSON.stringify(missionData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sanitizedFilename}.plan`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setShowFilenameDialog(false);
    setCustomFilename('mission');
  };

  const handleUpload = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const missionData = JSON.parse(e.target.result);
          importMission(missionData);
        } catch (error) {
          console.error('Error reading mission file:', error);
        }
      };
      reader.readAsText(file);
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear the entire mission?')) {
      clearMission();
    }
  };

  const handleAddRTL = () => {
    addReturnToLaunch();
  };

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          Mission Control
        </h2>
      </div>

      <div className="p-4">
        {/* Statistics */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 text-center border border-blue-200">
            <div className="text-2xl font-bold text-blue-700">{stats.waypoints}</div>
            <div className="text-xs text-blue-600 font-medium mt-1">Waypoints</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 text-center border border-green-200">
            <div className="text-2xl font-bold text-green-700">{formatDistance(stats.distance)}</div>
            <div className="text-xs text-green-600 font-medium mt-1">Distance</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 text-center border border-purple-200">
            <div className="text-2xl font-bold text-purple-700">{formatDuration(stats.duration)}</div>
            <div className="text-xs text-purple-600 font-medium mt-1">Est. Time</div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={handleDownloadQGC}
            disabled={waypoints.length === 0}
            className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Download Mission (.plan)</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={waypoints.length === 0}
            className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Download Mission (.json)</span>
          </button>

          <label className="w-full bg-green-600 text-white py-2.5 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 cursor-pointer font-medium">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>Upload Mission</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.plan"
              onChange={handleUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={handleClear}
            disabled={waypoints.length === 0}
            className="w-full bg-red-600 text-white py-2.5 px-4 rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Clear Mission</span>
          </button>
        </div>

        {/* Quick Guide */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Quick Guide
          </h3>
          <ul className="space-y-1 text-xs text-gray-600">
            <li className="flex items-start">
              <span className="text-green-600 mr-2">1.</span>
              <span><strong>First click:</strong> Adds takeoff point</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">2.</span>
              <span><strong>Next clicks:</strong> Add waypoints</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-600 mr-2">3.</span>
              <span><strong>RTL button:</strong> Return to home</span>
            </li>
            <li className="flex items-start">
              <span className="text-orange-600 mr-2">•</span>
              <span>Drag markers to reposition</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-600 mr-2">•</span>
              <span>Right-click to delete waypoint</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Filename Dialog Modal */}
      {showFilenameDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Download Mission (.plan)</h3>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filename
            </label>
            <input
              type="text"
              value={customFilename}
              onChange={(e) => setCustomFilename(e.target.value)}
              placeholder="mission"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleConfirmDownload();
                }
              }}
            />
            <p className="text-xs text-gray-500 mb-4">
              Extension .plan will be added automatically
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowFilenameDialog(false);
                  setCustomFilename('mission');
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDownload}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MissionPanel;
