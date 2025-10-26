import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { useMission } from '../../context/MissionContext';
import MapToolbar from './MapToolbar';
import MapSidebar from './MapSidebar';

const MapView = () => {
  const { waypoints, addWaypoint, updateWaypoint, deleteWaypoint, selectedWaypointId, setSelectedWaypointId, missionMetadata, addReturnToLaunch } = useMission();
  const [map, setMap] = useState(null);
  const [mapType, setMapType] = useState('satellite');
  const [measureMode, setMeasureMode] = useState(false);
  const [currentMode, setCurrentMode] = useState('takeoff');
  const polylineRef = useRef(null);
  const arrowsRef = useRef([]);
  const measureLineRef = useRef(null);
  const measureMarkersRef = useRef([]);

  const mapContainerStyle = {
    width: '100%',
    height: '100%',
    minHeight: '600px',
  };

  const mapOptions = useMemo(() => ({
    zoom: 13,
    center: missionMetadata.homePosition,
    mapTypeId: mapType,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
    zoomControl: false,
    gestureHandling: 'greedy',
    disableDefaultUI: false,
  }), [missionMetadata.homePosition, mapType]);

  const onLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Handle map click to add waypoints
  const handleMapClick = useCallback((event) => {
    if (measureMode) {
      // Measurement mode - add measurement points
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();

      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        map: map,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: '#ef4444',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 6,
        },
      });

      measureMarkersRef.current.push(marker);

      if (measureMarkersRef.current.length > 1) {
        const lastTwo = measureMarkersRef.current.slice(-2);
        const pos1 = lastTwo[0].getPosition();
        const pos2 = lastTwo[1].getPosition();

        // Calculate distance
        const distance = window.google.maps.geometry.spherical.computeDistanceBetween(pos1, pos2);

        // Draw line
        const line = new window.google.maps.Polyline({
          path: [pos1, pos2],
          strokeColor: '#ef4444',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          map: map,
        });

        measureLineRef.current = line;

        // Show distance label
        const infoWindow = new window.google.maps.InfoWindow({
          content: `Distance: ${distance.toFixed(2)}m`,
          position: pos2,
        });
        infoWindow.open(map);
      }
      return;
    }

    const lat = event.latLng.lat();
    const lng = event.latLng.lng();

    // Handle different modes
    switch (currentMode) {
      case 'takeoff':
        const takeoffResult = addWaypoint(lat, lng, 'takeoff');
        if (!takeoffResult.error) {
          setSelectedWaypointId(takeoffResult.id);
          setCurrentMode('waypoint'); // Switch back to waypoint mode
        }
        break;

      case 'waypoint':
        // Check if takeoff exists
        const hasTakeoffPoint = waypoints.some(wp => wp.action === 'takeoff');
        if (!hasTakeoffPoint) {
          setCurrentMode('takeoff'); // Switch to takeoff mode
          return;
        }
        const waypointResult = addWaypoint(lat, lng);
        if (!waypointResult.error) {
          setSelectedWaypointId(waypointResult.id);
        }
        break;

      case 'roi':
        const roiResult = addWaypoint(lat, lng, 'loiter');
        if (!roiResult.error) {
          setSelectedWaypointId(roiResult.id);
          setCurrentMode('waypoint'); // Switch back to waypoint mode
        }
        break;

      default:
        break;
    }
  }, [addWaypoint, setSelectedWaypointId, measureMode, map, currentMode, addReturnToLaunch]);

  // Handle marker drag
  const handleMarkerDrag = useCallback((waypointId, event) => {
    updateWaypoint(waypointId, {
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    });
  }, [updateWaypoint]);

  // Handle marker right-click
  const handleMarkerRightClick = useCallback((waypointId) => {
    if (window.confirm('Delete this waypoint?')) {
      deleteWaypoint(waypointId);
    }
  }, [deleteWaypoint]);

  // Handle marker click for selection
  const handleMarkerClick = useCallback((waypointId) => {
    setSelectedWaypointId(waypointId);
  }, [setSelectedWaypointId]);

  // Memoize path coordinates
  const pathCoordinates = useMemo(() => {
    return waypoints.map(wp => ({ lat: wp.lat, lng: wp.lng }));
  }, [waypoints]);

  // Create and manage polyline using native Google Maps API
  useEffect(() => {
    if (!map || waypoints.length < 2) {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
      return;
    }

    // Remove existing polyline
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }

    // Build the complete flight path
    let flightPath = [];

    // Check if we have takeoff and RTL
    const takeoffWaypoint = waypoints.find(wp => wp.action === 'takeoff');
    const rtlWaypoint = waypoints.find(wp => wp.action === 'rtl');

    if (takeoffWaypoint) {
      // Start with takeoff
      flightPath.push({ lat: takeoffWaypoint.lat, lng: takeoffWaypoint.lng });

      // Add all waypoints except takeoff and RTL
      waypoints.forEach(wp => {
        if (wp.action !== 'takeoff' && wp.action !== 'rtl') {
          flightPath.push({ lat: wp.lat, lng: wp.lng });
        }
      });

      // If RTL exists, add it at the end (which is at takeoff position)
      if (rtlWaypoint) {
        flightPath.push({ lat: rtlWaypoint.lat, lng: rtlWaypoint.lng });
      }
    } else {
      // No takeoff, just connect all waypoints in order
      flightPath = pathCoordinates;
    }

    // Create main polyline without arrows
    polylineRef.current = new window.google.maps.Polyline({
      path: flightPath,
      strokeColor: '#2563eb',
      strokeOpacity: 0.9,
      strokeWeight: 3,
      map: map,
      geodesic: true,
    });

    // Clear previous arrows
    arrowsRef.current.forEach(arrow => arrow.setMap(null));
    arrowsRef.current = [];

    // Create one arrow per segment
    for (let i = 0; i < flightPath.length - 1; i++) {
      const start = flightPath[i];
      const end = flightPath[i + 1];

      // Calculate midpoint
      const midLat = (start.lat + end.lat) / 2;
      const midLng = (start.lng + end.lng) / 2;

      // Calculate bearing/heading for arrow direction
      const heading = window.google.maps.geometry.spherical.computeHeading(
        new window.google.maps.LatLng(start.lat, start.lng),
        new window.google.maps.LatLng(end.lat, end.lng)
      );

      // Create arrow marker
      const arrow = new window.google.maps.Marker({
        position: { lat: midLat, lng: midLng },
        map: map,
        icon: {
          path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          strokeColor: '#ffffff',
          fillColor: '#ffffff',
          fillOpacity: 1,
          strokeWeight: 2,
          scale: 4,
          rotation: heading,
        },
        clickable: false,
      });

      arrowsRef.current.push(arrow);
    }

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
      arrowsRef.current.forEach(arrow => arrow.setMap(null));
      arrowsRef.current = [];
    };
  }, [map, pathCoordinates, waypoints, waypoints.length]);

  // Get marker icon based on action type
  const getMarkerIcon = useCallback((action, isSelected, index) => {
    const colors = {
      waypoint: '#2563eb',
      takeoff: '#10b981',
      land: '#ef4444',
      loiter: '#f59e0b',
      rtl: '#8b5cf6',
    };

    const color = colors[action] || colors.waypoint;
    const scale = isSelected ? 1.3 : 1.1;

    // Create SVG path for a circular marker with better visibility
    const circlePath = 'M 12,2 C 8.13,2 5,5.13 5,9 c 0,5.25 7,13 7,13 0,0 7,-7.75 7,-13 0,-3.87 -3.13,-7 -7,-7 z';

    return {
      path: circlePath,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 3,
      scale: scale * 1.8,
      anchor: new window.google.maps.Point(12, 22),
      labelOrigin: new window.google.maps.Point(12, 10),
    };
  }, []);

  // Toolbar handlers
  const handleZoomIn = useCallback(() => {
    if (map) {
      map.setZoom(map.getZoom() + 1);
    }
  }, [map]);

  const handleZoomOut = useCallback(() => {
    if (map) {
      map.setZoom(map.getZoom() - 1);
    }
  }, [map]);

  const handleToggleLayer = useCallback((newMapType) => {
    setMapType(newMapType);
  }, []);

  const handleToggleMeasure = useCallback((enabled) => {
    setMeasureMode(enabled);
    if (!enabled) {
      // Clear measurement markers and lines
      measureMarkersRef.current.forEach(marker => marker.setMap(null));
      measureMarkersRef.current = [];
      if (measureLineRef.current) {
        measureLineRef.current.setMap(null);
        measureLineRef.current = null;
      }
    }
  }, []);

  const handleModeChange = useCallback((mode) => {
    setCurrentMode(mode);
    setMeasureMode(false);
  }, []);

  const handleCenterMap = useCallback(() => {
    if (map && waypoints.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      waypoints.forEach(wp => {
        bounds.extend({ lat: wp.lat, lng: wp.lng });
      });
      map.fitBounds(bounds);
    } else if (map) {
      map.setCenter(missionMetadata.homePosition);
      map.setZoom(13);
    }
  }, [map, waypoints, missionMetadata.homePosition]);

  const handleAddRTL = useCallback(() => {
    const result = addReturnToLaunch();
    if (!result.error && result.id) {
      setSelectedWaypointId(result.id);
    }
  }, [addReturnToLaunch, setSelectedWaypointId]);

  return (
    <div className="w-full h-full relative">
      <LoadScript
        googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
        libraries={['geometry']}
      >
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          options={mapOptions}
          onLoad={onLoad}
          onUnmount={onUnmount}
          onClick={handleMapClick}
        >
          {waypoints
            .filter(waypoint => waypoint.action !== 'rtl') // Hide RTL marker but keep in waypoints for path
            .map((waypoint, index) => {
              const isSelected = selectedWaypointId === waypoint.id;

              // Calculate proper index for numbering (exclude takeoff from count)
              const waypointsBefore = waypoints.slice(0, waypoints.indexOf(waypoint));
              const waypointNumber = waypointsBefore.filter(wp => wp.action === 'waypoint').length + 1;

              const labelText = waypoint.action === 'takeoff' ? 'T' :
                               waypoint.action === 'land' ? 'L' :
                               `${waypointNumber}`;

              return (
                <Marker
                  key={waypoint.id}
                  position={{ lat: waypoint.lat, lng: waypoint.lng }}
                  label={{
                    text: labelText,
                    color: '#ffffff',
                    fontWeight: 'bold',
                    fontSize: isSelected ? '16px' : '15px',
                    fontFamily: 'Arial, sans-serif',
                  }}
                  icon={getMarkerIcon(waypoint.action, isSelected, index)}
                  draggable={true}
                  onDragEnd={(event) => handleMarkerDrag(waypoint.id, event)}
                  onRightClick={() => handleMarkerRightClick(waypoint.id)}
                  onClick={() => handleMarkerClick(waypoint.id)}
                  title={`${waypoint.action === 'takeoff' ? 'Takeoff' : 'WP' + waypointNumber}: ${waypoint.action.toUpperCase()} (Alt: ${waypoint.altitude}m)`}
                />
              );
            })}
        </GoogleMap>
        <MapSidebar
          currentMode={currentMode}
          onModeChange={handleModeChange}
          onCenterMap={handleCenterMap}
          onAddRTL={handleAddRTL}
          hasTakeoff={waypoints.some(wp => wp.action === 'takeoff')}
        />
        <MapToolbar
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onToggleLayer={handleToggleLayer}
          onToggleMeasure={handleToggleMeasure}
          mapType={mapType}
        />
      </LoadScript>
    </div>
  );
};

export default MapView;
