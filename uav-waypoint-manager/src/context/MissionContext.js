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
    homePosition: { lat: 7.028095, lng: 79.909942, alt: 0 },
    defaultAltitude: 10,
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

  // Import mission (supports both custom format and QGroundControl format)
  const importMission = useCallback((missionData) => {
    try {
      // Check if it's QGroundControl format
      if (missionData.mission && missionData.mission.items) {
        return importQGroundControlMission(missionData);
      }

      // Otherwise treat as custom format
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

  // Import QGroundControl mission format
  const importQGroundControlMission = useCallback((missionData) => {
    try {
      if (!missionData.mission || !missionData.mission.items) {
        return false;
      }

      const items = missionData.mission.items;
      const formattedWaypoints = [];

      // Get home position from plannedHomePosition or first takeoff
      let homePosition = missionMetadata.homePosition;
      if (missionData.mission.plannedHomePosition) {
        homePosition = {
          lat: missionData.mission.plannedHomePosition[0],
          lng: missionData.mission.plannedHomePosition[1],
          alt: missionData.mission.plannedHomePosition[2],
        };
      }

      // Track current speed for applying DO_CHANGE_SPEED commands
      let currentSpeed = missionData.mission.cruiseSpeed || missionMetadata.defaultSpeed;
      let lastWaypointIndex = -1; // Track the last waypoint added for DO_SET_YAW

      items.forEach((item, index) => {
        const command = item.command;
        let action = 'waypoint';
        let lat = homePosition.lat;
        let lng = homePosition.lng;
        let altitude = item.Altitude || missionMetadata.defaultAltitude;
        let speed = currentSpeed; // Use current tracked speed
        let holdTime = 0;
        let acceptanceRadius = 5;
        let passRadius = 0;
        let yaw = 0;

        // Map QGC command codes to our action types
        switch (command) {
          case 22: // MAV_CMD_NAV_TAKEOFF
            action = 'takeoff';
            // Takeoff coordinates - try params first, fall back to home position
            if (item.params && item.params[4] !== null && item.params[5] !== null) {
              lat = item.params[4];
              lng = item.params[5];
            } else {
              lat = homePosition.lat;
              lng = homePosition.lng;
            }
            altitude = item.Altitude || item.params[6] || homePosition.alt;
            // Extract parameters from params array [0]=hold, [1]=accept_rad, [2]=pass_rad, [3]=yaw, [4]=lat, [5]=lng, [6]=alt
            if (item.params) {
              holdTime = item.params[0] !== null && item.params[0] !== undefined ? item.params[0] : 0;
              acceptanceRadius = item.params[1] !== null && item.params[1] !== undefined ? item.params[1] : 5;
              passRadius = item.params[2] !== null && item.params[2] !== undefined ? item.params[2] : 0;
              yaw = item.params[3] !== null && item.params[3] !== undefined ? item.params[3] : 0;
            }
            speed = currentSpeed; // Takeoff uses current speed
            break;
          case 16: // MAV_CMD_NAV_WAYPOINT
            action = 'waypoint';
            // Extract parameters from params array [0]=hold, [1]=accept_rad, [2]=pass_rad, [3]=yaw, [4]=lat, [5]=lng, [6]=alt
            if (item.params) {
              holdTime = item.params[0] !== null && item.params[0] !== undefined ? item.params[0] : 0;
              acceptanceRadius = item.params[1] !== null && item.params[1] !== undefined ? item.params[1] : 5;
              passRadius = item.params[2] !== null && item.params[2] !== undefined ? item.params[2] : 0;
              yaw = item.params[3] !== null && item.params[3] !== undefined ? item.params[3] : 0;
            }
            // Extract coordinates if available
            if (item.params && item.params[4] !== null && item.params[5] !== null) {
              lat = item.params[4];
              lng = item.params[5];
              altitude = item.params[6] || item.Altitude;
            }
            speed = currentSpeed; // Waypoint uses current speed
            break;
          case 20: // MAV_CMD_NAV_RETURN_TO_LAUNCH
            action = 'rtl';
            // RTL returns to home position
            lat = homePosition.lat;
            lng = homePosition.lng;
            altitude = homePosition.alt;
            speed = currentSpeed; // RTL uses current speed
            break;
          case 21: // MAV_CMD_NAV_LAND
            action = 'land';
            // Extract parameters from params array [0]=hold, [1]=accept_rad, [2]=pass_rad, [3]=yaw, [4]=lat, [5]=lng
            if (item.params) {
              holdTime = item.params[0] !== null && item.params[0] !== undefined ? item.params[0] : 0;
              acceptanceRadius = item.params[1] !== null && item.params[1] !== undefined ? item.params[1] : 5;
              passRadius = item.params[2] !== null && item.params[2] !== undefined ? item.params[2] : 0;
              yaw = item.params[3] !== null && item.params[3] !== undefined ? item.params[3] : 0;
            }
            // Extract coordinates if available
            if (item.params && item.params[4] !== null && item.params[5] !== null) {
              lat = item.params[4];
              lng = item.params[5];
            }
            altitude = item.Altitude || 0;
            speed = currentSpeed; // Land uses current speed
            break;
          case 178: // MAV_CMD_DO_CHANGE_SPEED
            // Update current speed for subsequent waypoints
            // params[0] = speed type (0=airspeed, 1=groundspeed)
            // params[1] = speed value in m/s
            // params[2] = throttle (-1 or percentage)
            if (item.params && item.params[1] !== null && item.params[1] !== undefined) {
              currentSpeed = item.params[1];
            }
            return; // Don't add this as a waypoint, just track the speed
          case 115: // MAV_CMD_DO_SET_YAW
            // Apply yaw rotation to the last waypoint
            // params[0] = target yaw angle (final heading 0-360)
            // params[1] = yaw rate (degrees per second)
            // params[2] = number of rotations before reaching final heading
            if (lastWaypointIndex >= 0 && item.params) {
              const finalHeading = item.params[0] !== null && item.params[0] !== undefined ? item.params[0] : 0;
              const totalRotations = item.params[2] !== null && item.params[2] !== undefined ? item.params[2] : 0;
              // Convert to total yaw value: (rotations * 360) + final heading
              const totalYaw = (totalRotations * 360) + finalHeading;
              formattedWaypoints[lastWaypointIndex].yaw = totalYaw;
            }
            return; // Don't add this as a waypoint, just modify the last one
          default:
            return; // Skip unknown commands
        }

        const waypoint = {
          id: Date.now() + index,
          lat: lat,
          lng: lng,
          altitude: altitude,
          speed: speed,
          action: action,
          holdTime: holdTime,
          acceptanceRadius: acceptanceRadius,
          passRadius: passRadius,
          yaw: yaw,
        };

        formattedWaypoints.push(waypoint);
        lastWaypointIndex = formattedWaypoints.length - 1; // Track last waypoint for DO_SET_YAW
      });

      if (formattedWaypoints.length > 0) {
        setWaypoints(formattedWaypoints);

        // Update home position if available
        if (missionData.mission.plannedHomePosition) {
          setMissionMetadata(prev => ({
            ...prev,
            homePosition: {
              lat: missionData.mission.plannedHomePosition[0],
              lng: missionData.mission.plannedHomePosition[1],
              alt: missionData.mission.plannedHomePosition[2],
            },
          }));
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing QGroundControl mission:', error);
      return false;
    }
  }, [missionMetadata]);

  // Export mission in custom format
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

  // Export mission in QGroundControl format
  const exportQGroundControlMission = useCallback(() => {
    // Map action types to QGC command codes
    const getCommand = (action) => {
      switch (action) {
        case 'takeoff':
          return 22; // MAV_CMD_NAV_TAKEOFF
        case 'waypoint':
        case 'loiter':
          return 16; // MAV_CMD_NAV_WAYPOINT
        case 'land':
          return 21; // MAV_CMD_NAV_LAND
        case 'rtl':
          return 20; // MAV_CMD_NAV_RETURN_TO_LAUNCH
        default:
          return 16;
      }
    };

    // Build mission items with DO_CHANGE_SPEED commands when speed changes
    const items = [];
    let itemIndex = 1;
    const cruiseSpeed = missionMetadata.defaultSpeed || 15;
    let lastWpSpeed = cruiseSpeed;

    waypoints.forEach((wp, wpIndex) => {
      const command = getCommand(wp.action);
      const wpSpeed = wp.speed || cruiseSpeed;
      const wpYaw = wp.yaw || 0;

      // Add DO_CHANGE_SPEED command BEFORE waypoint if speed differs from last speed
      if (wpSpeed !== lastWpSpeed && command !== 20) {
        items.push({
          autoContinue: true,
          command: 178, // MAV_CMD_DO_CHANGE_SPEED
          doJumpId: itemIndex++,
          frame: 2,
          params: [
            1,        // speed type: 1=groundspeed
            wpSpeed,  // speed in m/s
            -1,       // throttle: -1 means no change
            0,        // relative: 0=absolute speed
            0,
            0,
            0
          ],
          type: 'SimpleItem',
        });
        lastWpSpeed = wpSpeed;
      }

      if (command === 22) {
        // Takeoff - include lat/lng, hold time, yaw
        items.push({
          AMSLAltAboveTerrain: wp.altitude,
          Altitude: wp.altitude,
          AltitudeMode: 1,
          autoContinue: true,
          command: 22,
          doJumpId: itemIndex++,
          frame: 3,
          params: [wp.holdTime || 0, wp.acceptanceRadius || 5, wp.passRadius || 0, wpYaw, wp.lat, wp.lng, wp.altitude],
          type: 'SimpleItem',
        });

        // Add DO_SET_YAW command AFTER takeoff if yaw is rotation (>= 360)
        if (wpYaw >= 360) {
          const totalRotations = Math.floor(wpYaw / 360);
          const yawRate = 30; // degrees per second
          const finalHeading = wpYaw % 360;

          items.push({
            autoContinue: true,
            command: 115, // MAV_CMD_DO_SET_YAW
            doJumpId: itemIndex++,
            frame: 1,
            params: [
              finalHeading,     // [0] = target yaw angle (final heading in degrees 0-360)
              yawRate,          // [1] = yaw rate (degrees per second, 0=default)
              totalRotations,   // [2] = direction (positive = CW from north, rotations = how many times)
              0,                // [3] = reserved
              0,
              0,
              0
            ],
            type: 'SimpleItem',
          });
        }
      } else if (command === 20) {
        // Return to Launch - add speed change before RTL if needed
        if (wpSpeed !== lastWpSpeed) {
          items.push({
            autoContinue: true,
            command: 178, // MAV_CMD_DO_CHANGE_SPEED
            doJumpId: itemIndex++,
            frame: 2,
            params: [
              1,        // speed type: 1=groundspeed
              wpSpeed,  // speed in m/s
              -1,       // throttle: -1 means no change
              0,        // relative: 0=absolute speed
              0,
              0,
              0
            ],
            type: 'SimpleItem',
          });
          lastWpSpeed = wpSpeed;
        }
        items.push({
          autoContinue: true,
          command: 20,
          doJumpId: itemIndex++,
          frame: 2,
          params: [0, 0, 0, wpYaw % 360, 0, 0, 0],
          type: 'SimpleItem',
          AltitudeMode: 1,
        });

        // Add DO_SET_YAW command AFTER RTL if yaw is rotation (>= 360)
        if (wpYaw >= 360) {
          const totalRotations = Math.floor(wpYaw / 360);
          const yawRate = 30; // degrees per second
          const finalHeading = wpYaw % 360;

          items.push({
            autoContinue: true,
            command: 115, // MAV_CMD_DO_SET_YAW
            doJumpId: itemIndex++,
            frame: 1,
            params: [
              finalHeading,     // [0] = target yaw angle (final heading in degrees 0-360)
              yawRate,          // [1] = yaw rate (degrees per second, 0=default)
              totalRotations,   // [2] = direction (positive = CW from north, rotations = how many times)
              0,                // [3] = reserved
              0,
              0,
              0
            ],
            type: 'SimpleItem',
          });
        }
      } else if (command === 21) {
        // Land - include hold time, acceptance radius, pass radius, yaw
        items.push({
          AMSLAltAboveTerrain: null,
          Altitude: wp.altitude,
          AltitudeMode: 1,
          autoContinue: true,
          command: 21,
          doJumpId: itemIndex++,
          frame: 3,
          params: [wp.holdTime || 0, wp.acceptanceRadius || 5, wp.passRadius || 0, wpYaw % 360, wp.lat, wp.lng],
          type: 'SimpleItem',
        });

        // Add DO_SET_YAW command AFTER land if yaw is rotation (>= 360)
        if (wpYaw >= 360) {
          const totalRotations = Math.floor(wpYaw / 360);
          const yawRate = 30; // degrees per second
          const finalHeading = wpYaw % 360;

          items.push({
            autoContinue: true,
            command: 115, // MAV_CMD_DO_SET_YAW
            doJumpId: itemIndex++,
            frame: 1,
            params: [
              finalHeading,     // [0] = target yaw angle (final heading in degrees 0-360)
              yawRate,          // [1] = yaw rate (degrees per second, 0=default)
              totalRotations,   // [2] = direction (positive = CW from north, rotations = how many times)
              0,                // [3] = reserved
              0,
              0,
              0
            ],
            type: 'SimpleItem',
          });
        }
      } else {
        // Regular waypoint or loiter - include hold time, acceptance radius, pass radius, yaw
        items.push({
          AMSLAltAboveTerrain: null,
          Altitude: wp.altitude,
          AltitudeMode: 1,
          autoContinue: true,
          command: 16,
          doJumpId: itemIndex++,
          frame: 3,
          params: [wp.holdTime || 0, wp.acceptanceRadius || 5, wp.passRadius || 0, wpYaw % 360, wp.lat, wp.lng, wp.altitude],
          type: 'SimpleItem',
        });

        // Add DO_SET_YAW command AFTER waypoint if yaw is rotation (>= 360)
        if (wpYaw >= 360) {
          const totalRotations = Math.floor(wpYaw / 360);
          const yawRate = 30; // degrees per second
          const finalHeading = wpYaw % 360;

          items.push({
            autoContinue: true,
            command: 115, // MAV_CMD_DO_SET_YAW
            doJumpId: itemIndex++,
            frame: 1,
            params: [
              finalHeading,     // [0] = target yaw angle (final heading in degrees 0-360)
              yawRate,          // [1] = yaw rate (degrees per second, 0=default)
              totalRotations,   // [2] = direction (positive = CW from north, rotations = how many times)
              0,                // [3] = reserved
              0,
              0,
              0
            ],
            type: 'SimpleItem',
          });
        }
      }
    });

    // Get home position from first waypoint (takeoff)
    const takeoffPoint = waypoints.find(wp => wp.action === 'takeoff') || waypoints[0];
    const homePosition = takeoffPoint
      ? [takeoffPoint.lat, takeoffPoint.lng, takeoffPoint.altitude]
      : [missionMetadata.homePosition.lat, missionMetadata.homePosition.lng, missionMetadata.homePosition.alt];

    return {
      fileType: 'Plan',
      geoFence: {
        circles: [],
        polygons: [],
        version: 2,
      },
      groundStation: 'QGroundControl',
      mission: {
        cruiseSpeed: missionMetadata.defaultSpeed || 15,
        firmwareType: 3,
        globalPlanAltitudeMode: 1,
        hoverSpeed: 5,
        items,
        plannedHomePosition: homePosition,
        vehicleType: 2,
        version: 2,
      },
      rallyPoints: {
        points: [],
        version: 2,
      },
      version: 1,
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
    exportQGroundControlMission,
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
