import React from 'react';

const MissionControl = ({ waypoints, onClearMission, onUploadMission, onDownloadMission }) => {
  const handleExportJSON = () => {
    const missionData = {
      version: '1.0',
      type: 'UAV Mission',
      created: new Date().toISOString(),
      waypoints: waypoints.map((wp, index) => ({
        index: index + 1,
        latitude: wp.lat,
        longitude: wp.lng,
        altitude: wp.altitude || 50,
        speed: wp.speed || 5,
        action: wp.action || 'waypoint'
      }))
    };

    const blob = new Blob([JSON.stringify(missionData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mission_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const missionData = JSON.parse(e.target.result);
          if (onUploadMission && missionData.waypoints) {
            onUploadMission(missionData.waypoints);
          }
        } catch (error) {
          alert('Error reading mission file: ' + error.message);
        }
      };
      reader.readAsText(file);
    }
  };

  const getTotalDistance = () => {
    if (waypoints.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      const lat1 = waypoints[i].lat * Math.PI / 180;
      const lat2 = waypoints[i + 1].lat * Math.PI / 180;
      const dLat = lat2 - lat1;
      const dLng = (waypoints[i + 1].lng - waypoints[i].lng) * Math.PI / 180;

      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1) * Math.cos(lat2) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = 6371000 * c; // Earth radius in meters

      totalDistance += distance;
    }

    return totalDistance.toFixed(2);
  };

  const getEstimatedTime = () => {
    if (waypoints.length < 2) return 0;

    const distance = parseFloat(getTotalDistance());
    const avgSpeed = waypoints.reduce((sum, wp) => sum + (wp.speed || 5), 0) / waypoints.length;
    const timeInSeconds = distance / avgSpeed;
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);

    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-xl font-semibold mb-4">Mission Control</h2>

      {/* Mission Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">{waypoints.length}</div>
          <div className="text-xs text-gray-600">Waypoints</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-600">{getTotalDistance()}</div>
          <div className="text-xs text-gray-600">Distance (m)</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-purple-600">{getEstimatedTime()}</div>
          <div className="text-xs text-gray-600">Est. Time</div>
        </div>
      </div>

      {/* Mission Actions */}
      <div className="space-y-2">
        <button
          onClick={handleExportJSON}
          disabled={waypoints.length === 0}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>Download Mission</span>
        </button>

        <label className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 cursor-pointer">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <span>Upload Mission</span>
          <input
            type="file"
            accept=".json"
            onChange={handleImportJSON}
            className="hidden"
          />
        </label>

        <button
          onClick={onClearMission}
          disabled={waypoints.length === 0}
          className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span>Clear Mission</span>
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-700">
        <h3 className="font-semibold mb-2">Quick Guide:</h3>
        <ul className="space-y-1">
          <li>• Click map to add waypoints</li>
          <li>• Drag markers to reposition</li>
          <li>• Right-click markers to delete</li>
          <li>• Set altitude, speed & action for each waypoint</li>
        </ul>
      </div>
    </div>
  );
};

export default MissionControl;
