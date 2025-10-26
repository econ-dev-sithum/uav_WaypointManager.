import React, { createContext, useContext, useState, useCallback } from 'react';

const MissionContext = createContext();

export const useMission = () => {
  const context = useContext(MissionContext);
  if (!context) {
    throw new Error('useMission must be used within a MissionProvider');
  }
  return context;
};

export const MissionProvider = ({ children }) => {
  const [waypoints, setWaypoints] = useState([]);
  const [selectedWaypointId, setSelectedWaypointId] = useState(null);
  const [missionMetadata, setMissionMetadata] = useState({
    name: 'Untitled Mission',
    description: '',
    homePosition: { lat: 8.3114, lng: 80.4037, alt: 0 },
    defaultAltitude: 50,
    defaultSpeed: 5,
  });

  // Check if mission has takeoff
  const hasTakeoff = useCallback(() => {
    return waypoints.some(wp => wp.action === 'takeoff');
  }, [waypoints]);

  // Add waypoint
  const addWaypoint = useCallback((lat, lng, forceAction = null) => {
    // Check if this is the first waypoint - it must be takeoff
    if (waypoints.length === 0 && !forceAction) {
      const newWaypoint = {
        id: Date.now(),
        lat,
        lng,
        altitude: missionMetadata.defaultAltitude,
        speed: missionMetadata.defaultSpeed,
        action: 'takeoff',
        holdTime: 0,
        acceptanceRadius: 5,
        passRadius: 0,
        yaw: 0,
      };
      setWaypoints(prev => [...prev, newWaypoint]);
      return { id: newWaypoint.id, message: 'Takeoff point added. You can now add waypoints.' };
    }

    // Check if takeoff exists for subsequent waypoints
    const hasTakeoffPoint = waypoints.some(wp => wp.action === 'takeoff');
    if (!hasTakeoffPoint && !forceAction) {
      return { id: null, error: 'Please add a takeoff point first!' };
    }

    const newWaypoint = {
      id: Date.now(),
      lat,
      lng,
      altitude: missionMetadata.defaultAltitude,
      speed: missionMetadata.defaultSpeed,
      action: forceAction || 'waypoint',
      holdTime: 0,
      acceptanceRadius: 5,
      passRadius: 0,
      yaw: 0,
    };
    setWaypoints(prev => [...prev, newWaypoint]);
    return { id: newWaypoint.id };
  }, [missionMetadata.defaultAltitude, missionMetadata.defaultSpeed, waypoints]);

  // Update waypoint
  const updateWaypoint = useCallback((waypointId, updates) => {
    setWaypoints(prev => {
      const updatedWaypoints = prev.map(wp => (wp.id === waypointId ? { ...wp, ...updates } : wp));

      // If takeoff is updated and RTL exists, update RTL to match takeoff position
      const updatedWaypoint = updatedWaypoints.find(wp => wp.id === waypointId);
      if (updatedWaypoint && updatedWaypoint.action === 'takeoff') {
        return updatedWaypoints.map(wp => {
          if (wp.action === 'rtl') {
            return {
              ...wp,
              lat: updatedWaypoint.lat,
              lng: updatedWaypoint.lng,
              altitude: updatedWaypoint.altitude,
            };
          }
          return wp;
        });
      }

      return updatedWaypoints;
    });
  }, []);

  // Delete waypoint
  const deleteWaypoint = useCallback((waypointId) => {
    setWaypoints(prev => prev.filter(wp => wp.id !== waypointId));
    if (selectedWaypointId === waypointId) {
      setSelectedWaypointId(null);
    }
  }, [selectedWaypointId]);

  // Clear all waypoints
  const clearMission = useCallback(() => {
    setWaypoints([]);
    setSelectedWaypointId(null);
  }, []);

  // Reorder waypoints
  const reorderWaypoints = useCallback((startIndex, endIndex) => {
    setWaypoints(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  }, []);

  // Import mission
  const importMission = useCallback((missionData) => {
    try {
      if (missionData.waypoints && Array.isArray(missionData.waypoints)) {
        const formattedWaypoints = missionData.waypoints.map((wp, index) => ({
          id: Date.now() + index,
          lat: wp.latitude || wp.lat,
          lng: wp.longitude || wp.lng,
          altitude: wp.altitude || missionMetadata.defaultAltitude,
          speed: wp.speed || missionMetadata.defaultSpeed,
          action: wp.action || 'waypoint',
          holdTime: wp.holdTime || 0,
          acceptanceRadius: wp.acceptanceRadius || 5,
          passRadius: wp.passRadius || 0,
          yaw: wp.yaw || 0,
        }));
        setWaypoints(formattedWaypoints);

        if (missionData.metadata) {
          setMissionMetadata(prev => ({ ...prev, ...missionData.metadata }));
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing mission:', error);
      return false;
    }
  }, [missionMetadata.defaultAltitude, missionMetadata.defaultSpeed]);

  // Export mission
  const exportMission = useCallback(() => {
    return {
      version: '1.0.0',
      type: 'UAV_MISSION',
      created: new Date().toISOString(),
      metadata: missionMetadata,
      waypoints: waypoints.map((wp, index) => ({
        index: index + 1,
        latitude: wp.lat,
        longitude: wp.lng,
        altitude: wp.altitude,
        speed: wp.speed,
        action: wp.action,
        holdTime: wp.holdTime,
        acceptanceRadius: wp.acceptanceRadius,
        passRadius: wp.passRadius,
        yaw: wp.yaw,
      })),
    };
  }, [waypoints, missionMetadata]);

  // Calculate mission statistics
  const getMissionStats = useCallback(() => {
    if (waypoints.length === 0) {
      return { distance: 0, duration: 0, waypoints: 0 };
    }

    let totalDistance = 0;
    let totalTime = 0;

    for (let i = 0; i < waypoints.length - 1; i++) {
      const wp1 = waypoints[i];
      const wp2 = waypoints[i + 1];

      // Haversine formula for distance
      const R = 6371000; // Earth radius in meters
      const lat1 = wp1.lat * Math.PI / 180;
      const lat2 = wp2.lat * Math.PI / 180;
      const dLat = lat2 - lat1;
      const dLng = (wp2.lng - wp1.lng) * Math.PI / 180;

      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1) * Math.cos(lat2) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      totalDistance += distance;
      totalTime += distance / (wp1.speed || 5); // Time = distance / speed
      totalTime += wp2.holdTime || 0; // Add hold time
    }

    return {
      distance: totalDistance,
      duration: totalTime,
      waypoints: waypoints.length,
    };
  }, [waypoints]);

  // Add Return to Launch
  const addReturnToLaunch = useCallback(() => {
    const takeoffPoint = waypoints.find(wp => wp.action === 'takeoff');
    if (!takeoffPoint) {
      return { error: 'Please add a takeoff point first!' };
    }

    // Check if RTL already exists
    const hasRTL = waypoints.some(wp => wp.action === 'rtl');
    if (hasRTL) {
      return { error: 'Return to Launch already exists!' };
    }

    // RTL should return to the takeoff position
    const rtlWaypoint = {
      id: Date.now(),
      lat: takeoffPoint.lat,
      lng: takeoffPoint.lng,
      altitude: takeoffPoint.altitude,
      speed: missionMetadata.defaultSpeed,
      action: 'rtl',
      holdTime: 0,
      acceptanceRadius: 5,
      passRadius: 0,
      yaw: 0,
    };
    setWaypoints(prev => [...prev, rtlWaypoint]);
    return { id: rtlWaypoint.id, message: 'Return to Launch added! Path will return to takeoff position.' };
  }, [waypoints, missionMetadata.defaultSpeed]);

  const value = {
    waypoints,
    selectedWaypointId,
    missionMetadata,
    setSelectedWaypointId,
    setMissionMetadata,
    addWaypoint,
    updateWaypoint,
    deleteWaypoint,
    clearMission,
    reorderWaypoints,
    importMission,
    exportMission,
    getMissionStats,
    hasTakeoff,
    addReturnToLaunch,
  };

  return (
    <MissionContext.Provider value={value}>
      {children}
    </MissionContext.Provider>
  );
};
