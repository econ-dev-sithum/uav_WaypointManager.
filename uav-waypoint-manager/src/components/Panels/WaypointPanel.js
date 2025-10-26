import React from 'react';
import { useMission } from '../../context/MissionContext';

const WaypointPanel = () => {
  const { waypoints, updateWaypoint, deleteWaypoint, selectedWaypointId, setSelectedWaypointId } = useMission();

  const getActionColor = (action) => {
    const colors = {
      waypoint: 'bg-blue-100 text-blue-800',
      takeoff: 'bg-green-100 text-green-800',
      land: 'bg-red-100 text-red-800',
      loiter: 'bg-yellow-100 text-yellow-800',
      rtl: 'bg-purple-100 text-purple-800',
    };
    return colors[action] || colors.waypoint;
  };

  if (waypoints.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Waypoints
        </h2>
        <div className="text-center text-gray-500 py-8">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <p className="font-medium">No waypoints</p>
          <p className="text-sm mt-2">Click on the map to add waypoints</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Waypoints
          </h2>
          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
            {waypoints.length} {waypoints.length === 1 ? 'point' : 'points'}
          </span>
        </div>
      </div>

      <div className="overflow-y-auto max-h-96 divide-y divide-gray-200">
        {waypoints.map((waypoint, index) => (
          <div
            key={waypoint.id}
            className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
              selectedWaypointId === waypoint.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
            }`}
            onClick={() => setSelectedWaypointId(waypoint.id)}
          >
            {/* Waypoint Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium text-sm">Waypoint {index + 1}</div>
                  <div className="text-xs text-gray-600">
                    {waypoint.lat.toFixed(6)}, {waypoint.lng.toFixed(6)}
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Delete Waypoint ${index + 1}?`)) {
                    deleteWaypoint(waypoint.id);
                  }
                }}
                className="text-red-600 hover:text-red-800 p-1"
                title="Delete waypoint"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>

            {/* Waypoint Parameters */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Altitude (m)</label>
                  <input
                    type="number"
                    value={waypoint.altitude}
                    onChange={(e) => {
                      e.stopPropagation();
                      updateWaypoint(waypoint.id, { altitude: parseFloat(e.target.value) || 0 });
                    }}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Speed (m/s)</label>
                  <input
                    type="number"
                    value={waypoint.speed}
                    onChange={(e) => {
                      e.stopPropagation();
                      updateWaypoint(waypoint.id, { speed: parseFloat(e.target.value) || 0 });
                    }}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Action</label>
                  <select
                    value={waypoint.action}
                    onChange={(e) => {
                      e.stopPropagation();
                      updateWaypoint(waypoint.id, { action: e.target.value });
                    }}
                    className={`w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${getActionColor(waypoint.action)}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="waypoint">Waypoint</option>
                    <option value="takeoff">Takeoff</option>
                    <option value="land">Land</option>
                    <option value="loiter">Loiter</option>
                    <option value="rtl">Return to Launch</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Hold Time (s)</label>
                  <input
                    type="number"
                    value={waypoint.holdTime || 0}
                    onChange={(e) => {
                      e.stopPropagation();
                      updateWaypoint(waypoint.id, { holdTime: parseFloat(e.target.value) || 0 });
                    }}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Yaw (deg)</label>
                  <input
                    type="number"
                    value={waypoint.yaw || 0}
                    onChange={(e) => {
                      e.stopPropagation();
                      updateWaypoint(waypoint.id, { yaw: parseFloat(e.target.value) || 0 });
                    }}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={(e) => e.stopPropagation()}
                    min="0"
                    max="360"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Acc Radius (m)</label>
                  <input
                    type="number"
                    value={waypoint.acceptanceRadius || 5}
                    onChange={(e) => {
                      e.stopPropagation();
                      updateWaypoint(waypoint.id, { acceptanceRadius: parseFloat(e.target.value) || 0 });
                    }}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-600 block mb-1">Pass Radius (m)</label>
                <input
                  type="number"
                  value={waypoint.passRadius || 0}
                  onChange={(e) => {
                    e.stopPropagation();
                    updateWaypoint(waypoint.id, { passRadius: parseFloat(e.target.value) || 0 });
                  }}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WaypointPanel;
