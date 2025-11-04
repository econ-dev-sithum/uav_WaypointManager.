import React, { useState, useMemo } from "react";
import { useMission } from "../../context/MissionContext";

const WaypointPanel = () => {
  const {
    waypoints,
    updateWaypoint,
    deleteWaypoint,
    selectedWaypointId,
    setSelectedWaypointId,
  } = useMission();
  const [expandedWaypointId, setExpandedWaypointId] = useState(null);

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

  if (waypoints.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          Waypoints
        </h2>
        <div className="text-center text-gray-500 py-8">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
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
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold flex items-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Waypoints
          </h2>
          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
            {waypoints.length} {waypoints.length === 1 ? "point" : "points"}
          </span>
        </div>
        {waypoints.length > 1 && (
          <div className="text-sm text-blue-600 font-semibold flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Total: {totalDistance.toFixed(1)}m
          </div>
        )}
      </div>

      <div className="overflow-y-auto max-h-96 divide-y divide-gray-200">
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

          // Calculate proper waypoint number (excluding takeoff)
          const waypointsBefore = waypoints.slice(
            0,
            waypoints.indexOf(waypoint)
          );
          const waypointNumber =
            waypointsBefore.filter((wp) => wp.action === "waypoint").length + 1;

          // Determine label and icon based on action
          const isActionType = waypoint.action !== "waypoint";
          const displayLabel =
            waypoint.action === "takeoff"
              ? "Takeoff"
              : waypoint.action === "land"
              ? "Land"
              : waypoint.action === "loiter"
              ? "Loiter"
              : waypoint.action === "rtl"
              ? "Return to Launch"
              : `Waypoint`;

          const displayNumber =
            waypoint.action === "takeoff"
              ? "T"
              : waypoint.action === "land"
              ? "L"
              : waypoint.action === "loiter"
              ? "R"
              : waypoint.action === "rtl"
              ? "H"
              : waypointNumber;

          // Icon colors based on action
          const iconBgColor =
            waypoint.action === "takeoff"
              ? "bg-green-600"
              : waypoint.action === "land"
              ? "bg-red-600"
              : waypoint.action === "loiter"
              ? "bg-yellow-600"
              : waypoint.action === "rtl"
              ? "bg-purple-600"
              : "bg-blue-600";

          const isExpanded = expandedWaypointId === waypoint.id;

          return (
            <div
              key={waypoint.id}
              className={`border-b border-gray-200 last:border-b-0 ${
                isExpanded ? "bg-blue-50" : "hover:bg-gray-50"
              } transition-colors`}
            >
              {/* Waypoint Header - Always Visible */}
              <div
                className="p-4 cursor-pointer flex items-center justify-between"
                onClick={() => {
                  setSelectedWaypointId(waypoint.id);
                  setExpandedWaypointId(isExpanded ? null : waypoint.id);
                }}
              >
                <div className="flex items-center space-x-3 flex-1">
                  <div
                    className={`${iconBgColor} text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0`}
                  >
                    {displayNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{displayLabel}</div>
                    <div className="text-xs text-gray-600">
                      {waypoint.lat.toFixed(6)}, {waypoint.lng.toFixed(6)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-2">
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${
                      isExpanded ? "transform rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Delete ${displayLabel}?`)) {
                        deleteWaypoint(waypoint.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-800 p-1 flex-shrink-0"
                    title={`Delete ${displayLabel}`}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Waypoint Parameters - Shown Only When Expanded */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-200 space-y-2">
                {/* Takeoff - Only Altitude */}
                {waypoint.action === "takeoff" && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-600 block mb-1">
                          Altitude (m)
                        </label>
                        <input
                          type="number"
                          value={waypoint.altitude}
                          onChange={(e) => {
                            e.stopPropagation();
                            updateWaypoint(waypoint.id, {
                              altitude: parseFloat(e.target.value) || 0,
                            });
                          }}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onClick={(e) => e.stopPropagation()}
                          step="0.1"
                          min="0"
                        />
                      </div>
                      {distanceToNext !== null && (
                        <div>
                          <label className="text-xs text-gray-600 block mb-1">
                            Distance to Next (m)
                          </label>
                          <input
                            type="text"
                            value={distanceToNext.toFixed(1)}
                            readOnly
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-50 text-gray-700 font-semibold"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Regular Waypoint - Altitude, Speed, Yaw, Hold Time */}
                {waypoint.action === "waypoint" && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-600 block mb-1">
                          Altitude (m)
                        </label>
                        <input
                          type="number"
                          value={waypoint.altitude}
                          onChange={(e) => {
                            e.stopPropagation();
                            updateWaypoint(waypoint.id, {
                              altitude: parseFloat(e.target.value) || 0,
                            });
                          }}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onClick={(e) => e.stopPropagation()}
                          step="0.1"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 block mb-1">
                          Speed (m/s)
                        </label>
                        <input
                          type="number"
                          value={waypoint.speed}
                          onChange={(e) => {
                            e.stopPropagation();
                            updateWaypoint(waypoint.id, {
                              speed: parseFloat(e.target.value) || 0,
                            });
                          }}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onClick={(e) => e.stopPropagation()}
                          step="0.1"
                          min="0"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-600 block mb-1">
                          Yaw (deg)
                        </label>
                        <input
                          type="number"
                          value={waypoint.yaw || 0}
                          onChange={(e) => {
                            e.stopPropagation();
                            updateWaypoint(waypoint.id, {
                              yaw: parseFloat(e.target.value) || 0,
                            });
                          }}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onClick={(e) => e.stopPropagation()}
                          min="0"
                          max="360"
                          step="1"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 block mb-1">
                          Hold Time (s)
                        </label>
                        <input
                          type="number"
                          value={waypoint.holdTime || 0}
                          onChange={(e) => {
                            e.stopPropagation();
                            updateWaypoint(waypoint.id, {
                              holdTime: parseFloat(e.target.value) || 0,
                            });
                          }}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onClick={(e) => e.stopPropagation()}
                          step="1"
                          min="0"
                        />
                      </div>
                    </div>

                    {distanceToNext !== null && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-600 block mb-1">
                            Distance to Next (m)
                          </label>
                          <input
                            type="text"
                            value={distanceToNext.toFixed(1)}
                            readOnly
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-50 text-gray-700 font-semibold"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Loiter - Altitude, Speed, Hold Time */}
                {waypoint.action === "loiter" && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-600 block mb-1">
                          Altitude (m)
                        </label>
                        <input
                          type="number"
                          value={waypoint.altitude}
                          onChange={(e) => {
                            e.stopPropagation();
                            updateWaypoint(waypoint.id, {
                              altitude: parseFloat(e.target.value) || 0,
                            });
                          }}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onClick={(e) => e.stopPropagation()}
                          step="0.1"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 block mb-1">
                          Speed (m/s)
                        </label>
                        <input
                          type="number"
                          value={waypoint.speed}
                          onChange={(e) => {
                            e.stopPropagation();
                            updateWaypoint(waypoint.id, {
                              speed: parseFloat(e.target.value) || 0,
                            });
                          }}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onClick={(e) => e.stopPropagation()}
                          step="0.1"
                          min="0"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-600 block mb-1">
                          Hold Time (s)
                        </label>
                        <input
                          type="number"
                          value={waypoint.holdTime || 0}
                          onChange={(e) => {
                            e.stopPropagation();
                            updateWaypoint(waypoint.id, {
                              holdTime: parseFloat(e.target.value) || 0,
                            });
                          }}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onClick={(e) => e.stopPropagation()}
                          step="1"
                          min="0"
                        />
                      </div>
                      {distanceToNext !== null && (
                        <div>
                          <label className="text-xs text-gray-600 block mb-1">
                            Distance to Next (m)
                          </label>
                          <input
                            type="text"
                            value={distanceToNext.toFixed(1)}
                            readOnly
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-50 text-gray-700 font-semibold"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* RTL - Only Altitude */}
                {waypoint.action === "rtl" && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">
                        Altitude (m)
                      </label>
                      <input
                        type="number"
                        value={waypoint.altitude}
                        onChange={(e) => {
                          e.stopPropagation();
                          updateWaypoint(waypoint.id, {
                            altitude: parseFloat(e.target.value) || 0,
                          });
                        }}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                        step="0.1"
                        min="0"
                      />
                    </div>
                  </div>
                )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WaypointPanel;
