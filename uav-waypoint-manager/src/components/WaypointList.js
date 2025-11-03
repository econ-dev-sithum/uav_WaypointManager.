import React, { useMemo } from 'react';

const WaypointList = ({ waypoints, onWaypointUpdate, onWaypointDelete, onWaypointSelect }) => {
  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
  };

  // Calculate total mission distance
  const totalDistance = useMemo(() => {
    if (waypoints.length < 2) return 0;
    let total = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      const wp1 = waypoints[i];
      const wp2 = waypoints[i + 1];
      total += calculateDistance(wp1.lat, wp1.lng, wp2.lat, wp2.lng);
    }
    return total;
  }, [waypoints]);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Waypoints</h2>
        <div className="text-right">
          <div className="text-sm text-gray-600">Total: {waypoints.length}</div>
          {waypoints.length > 1 && (
            <div className="text-sm font-semibold text-blue-600">
              Distance: {totalDistance.toFixed(1)}m
            </div>
          )}
        </div>
      </div>

      {waypoints.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <p>No waypoints added</p>
          <p className="text-sm mt-2">Click on the map to add waypoints</p>
        </div>
      ) : (
        <div className="space-y-2">
          {waypoints.map((waypoint, index) => {
            // Calculate distance to next waypoint
            const distanceToNext = index < waypoints.length - 1
              ? calculateDistance(
                  waypoint.lat,
                  waypoint.lng,
                  waypoints[index + 1].lat,
                  waypoints[index + 1].lng
                )
              : null;

            return (
              <div
                key={waypoint.id}
                className="border border-gray-300 rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onWaypointSelect && onWaypointSelect(waypoint.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">Waypoint {index + 1}</div>
                      <div className="text-xs text-gray-600">
                        Lat: {waypoint.lat.toFixed(6)}, Lng: {waypoint.lng.toFixed(6)}
                      </div>
                      {distanceToNext !== null && (
                        <div className="text-xs text-green-600 font-semibold mt-1">
                          ↓ {distanceToNext.toFixed(1)}m to next
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onWaypointDelete(waypoint.id);
                    }}
                    className="text-red-600 hover:text-red-800 px-2 py-1"
                    title="Delete waypoint"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-gray-600">Altitude (m)</label>
                    <input
                      type="number"
                      value={waypoint.altitude || 10}
                      onChange={(e) => {
                        e.stopPropagation();
                        onWaypointUpdate(waypoint.id, { altitude: parseFloat(e.target.value) });
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Speed (m/s)</label>
                    <input
                      type="number"
                      value={waypoint.speed || 5}
                      onChange={(e) => {
                        e.stopPropagation();
                        onWaypointUpdate(waypoint.id, { speed: parseFloat(e.target.value) });
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Action</label>
                    <select
                      value={waypoint.action || 'waypoint'}
                      onChange={(e) => {
                        e.stopPropagation();
                        onWaypointUpdate(waypoint.id, { action: e.target.value });
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="waypoint">Waypoint</option>
                      <option value="land">Land</option>
                      <option value="takeoff">Takeoff</option>
                      <option value="loiter">Loiter</option>
                      <option value="rtl">Return to Launch</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WaypointList;
