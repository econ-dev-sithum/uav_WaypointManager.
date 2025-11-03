import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { useMission } from '../../context/MissionContext';
import MapToolbar from './MapToolbar';
import MapSidebar from './MapSidebar';

const MapView = ({ onLocationUpdate }) => {
  const { waypoints, addWaypoint, updateWaypoint, deleteWaypoint, selectedWaypointId, setSelectedWaypointId, missionMetadata, addReturnToLaunch } = useMission();
  const [map, setMap] = useState(null);
  const [mapType, setMapType] = useState('satellite');
  const [measureMode, setMeasureMode] = useState(false);
  const [currentMode, setCurrentMode] = useState('takeoff');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState(null);
  const [locationRetry, setLocationRetry] = useState(0);
  const [manualLocationMode, setManualLocationMode] = useState(false);
  const [useHighAccuracy, setUseHighAccuracy] = useState(true);
  const polylineRef = useRef(null);
  const arrowsRef = useRef([]);
  const measureLineRef = useRef(null);
  const measureMarkersRef = useRef([]);
  const watchIdRef = useRef(null);
  const accuracyCircleRef = useRef(null);
  const previousPositionRef = useRef(null);
  const calculatedHeadingRef = useRef(0);
  const gridOverlayRef = useRef(null);

  const mapContainerStyle = {
    width: '100%',
    height: '100%',
    minHeight: '600px',
  };

  const mapOptions = useMemo(() => ({
    zoom: 22,
    minZoom: 3,
    maxZoom: 25,
    center: currentLocation || missionMetadata.homePosition,
    mapTypeId: mapType,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
    zoomControl: false,
    gestureHandling: 'greedy',
    disableDefaultUI: false,
    scaleControl: true,
    scaleControlOptions: {
      position: window.google?.maps?.ControlPosition?.BOTTOM_LEFT || 6,
    },
    tilt: 0,
    rotateControl: true,
    rotateControlOptions: {
      position: window.google?.maps?.ControlPosition?.LEFT_CENTER || 4,
    },
  }), [currentLocation, missionMetadata.homePosition, mapType]);

  const onLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Handle location update from search bar in header
  const handleLocationFromSearch = useCallback((lat, lng, locationName) => {
    const location = {
      lat,
      lng,
      accuracy: 50,
      heading: 0,
      speed: 0
    };

    setCurrentLocation(location);

    if (map) {
      map.panTo({ lat, lng });
      map.setZoom(24);
    }

    console.log('📍 Location from search:', locationName, lat, lng);
  }, [map]);

  // Expose location update handler to parent
  useEffect(() => {
    if (onLocationUpdate && typeof onLocationUpdate === 'function') {
      onLocationUpdate(handleLocationFromSearch);
    }
  }, [onLocationUpdate, handleLocationFromSearch]);

  // Handle map click to add waypoints
  const handleMapClick = useCallback((event) => {
    // Guard: Check if Google Maps geometry library is available
    if (!window.google?.maps?.geometry) {
      console.warn('⚠️ Google Maps geometry library not ready yet');
      return;
    }

    if (measureMode) {
      // Measurement mode - add measurement points
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();

      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        map: map,
        icon: {
          path: 'M 0,-1 a 1,1 0 1,1 0,2 a 1,1 0 1,1 0,-2',
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
        const hasTakeoff = waypoints.some(wp => wp.action === 'takeoff');
        if (!hasTakeoff) {
          const takeoffResult = addWaypoint(lat, lng, 'takeoff');
          if (!takeoffResult.error) {
            setSelectedWaypointId(takeoffResult.id);
            setCurrentMode('waypoint');
          }
        }
        break;

      case 'waypoint':
        const hasTakeoffPoint = waypoints.some(wp => wp.action === 'takeoff');
        if (!hasTakeoffPoint) {
          setCurrentMode('takeoff');
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
          setCurrentMode('waypoint');
        }
        break;

      default:
        break;
    }
  }, [addWaypoint, setSelectedWaypointId, measureMode, map, currentMode, waypoints]);

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

    // Guard: Check if Google Maps is available
    if (!window.google?.maps) {
      console.warn('⚠️ Google Maps not ready yet for polyline');
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

      // If RTL exists, add it at the end
      if (rtlWaypoint) {
        flightPath.push({ lat: rtlWaypoint.lat, lng: rtlWaypoint.lng });
      }
    } else {
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

    // Create arrows only if geometry library is available
    if (window.google?.maps?.geometry?.spherical) {
      for (let i = 0; i < flightPath.length - 1; i++) {
        const start = flightPath[i];
        const end = flightPath[i + 1];

        const midLat = (start.lat + end.lat) / 2;
        const midLng = (start.lng + end.lng) / 2;

        // Calculate bearing/heading for arrow direction
        const heading = window.google.maps.geometry.spherical.computeHeading(
          new window.google.maps.LatLng(start.lat, start.lng),
          new window.google.maps.LatLng(end.lat, end.lng)
        );

        // Create arrow marker - guard against undefined SymbolPath
        if (window.google.maps.SymbolPath?.FORWARD_CLOSED_ARROW) {
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
      }
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

    const circlePath = 'M 12,2 C 8.13,2 5,5.13 5,9 c 0,5.25 7,13 7,13 0,0 7,-7.75 7,-13 0,-3.87 -3.13,-7 -7,-7 z';

    return {
      path: circlePath,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 3,
      scale: scale * 1.8,
      anchor: { x: 12, y: 22 },
      labelOrigin: { x: 12, y: 10 },
    };
  }, []);

  // Toolbar handlers with ultra-zoom support
  const handleZoomIn = useCallback(() => {
    if (map) {
      const currentZoom = map.getZoom();
      const newZoom = Math.min(currentZoom + 1, 25);
      map.setZoom(newZoom);
      console.log(`🔍 Zoom level: ${newZoom} (max: 25)`);
    }
  }, [map]);

  const handleZoomOut = useCallback(() => {
    if (map) {
      const currentZoom = map.getZoom();
      const newZoom = Math.max(currentZoom - 1, 3);
      map.setZoom(newZoom);
      console.log(`🔍 Zoom level: ${newZoom}`);
    }
  }, [map]);

  const handleToggleLayer = useCallback((newMapType) => {
    setMapType(newMapType);
  }, []);

  const handleToggleMeasure = useCallback((enabled) => {
    setMeasureMode(enabled);
    if (!enabled) {
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
      setTimeout(() => {
        const currentZoom = map.getZoom();
        if (currentZoom > 25) {
          map.setZoom(25);
        }
      }, 100);
    } else if (map) {
      const centerPoint = currentLocation || missionMetadata.homePosition;
      map.setCenter(centerPoint);
      map.setZoom(22);
    }
  }, [map, waypoints, currentLocation, missionMetadata.homePosition]);

  const handleAddRTL = useCallback(() => {
    const result = addReturnToLaunch();
    if (!result.error && result.id) {
      setSelectedWaypointId(result.id);
    }
  }, [addReturnToLaunch, setSelectedWaypointId]);

  // GPS tracking with proper guards
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      setLocationLoading(false);
      console.error('Geolocation API not available');
      return;
    }

    if (manualLocationMode) {
      console.log('📍 Manual location set, continuing GPS tracking in background...');
      setLocationLoading(false);
    } else {
      setLocationLoading(true);
      if (useHighAccuracy) {
        console.log('🔍 Trying GPS location (high accuracy)...');
      } else {
        console.log('🔍 Trying network location (WiFi/IP based)...');
      }
      console.log('💡 Tip: If this fails, use the green button to set location manually');
    }

    const options = {
      enableHighAccuracy: useHighAccuracy,
      timeout: useHighAccuracy ? 10000 : 8000,
      maximumAge: 5000
    };

    if (!manualLocationMode) {
      console.log('📍 Attempting to get location...');

      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('✅ GPS Location acquired!');
          console.log('📍 RAW GPS DATA:', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: new Date(position.timestamp).toLocaleString()
          });

          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            heading: position.coords.heading || 0,
            speed: position.coords.speed || 0
          };

          console.log('🗺️ Setting location to:', location.lat, location.lng);
          console.log('🌐 Google Maps link: https://www.google.com/maps?q=' + location.lat + ',' + location.lng);

          previousPositionRef.current = { lat: location.lat, lng: location.lng };

          setCurrentLocation(location);
          setLocationLoading(false);
          setLocationError(null);
          setManualLocationMode(false);

          if (map) {
            map.panTo({ lat: location.lat, lng: location.lng });
            map.setZoom(24);
            console.log('✅ Map centered to GPS location');
          } else {
            console.log('✅ GPS location ready, map will center when loaded');
          }
        },
        (error) => {
          console.error('❌ Location failed:', error.message);

          if (error.code === 3 && useHighAccuracy) {
            console.log('⚡ GPS timeout - switching to network-based location...');
            setUseHighAccuracy(false);
            setLocationRetry(prev => prev + 1);
            return;
          }

          setLocationLoading(false);

          let errorMsg = 'Location failed';
          if (error.code === 1) {
            errorMsg = 'Location permission denied';
            console.log('📌 Browser blocked location access. Click "Allow" in browser popup.');
          } else if (error.code === 2) {
            errorMsg = 'Location unavailable';
            console.log('📌 Enable Windows Location Services:');
            console.log('   1. Press Win+I → Privacy & Security → Location');
            console.log('   2. Turn ON "Location services"');
            console.log('   3. Make sure WiFi is enabled');
            console.log('   4. Restart browser after enabling');
          } else if (error.code === 3) {
            errorMsg = 'Location timeout';
            console.log('📌 Location timeout - no GPS or network location available');
            console.log('   Use GREEN button to set location manually');
          }

          console.log('');
          console.log('💡 Click GREEN button to use map center as location');
          setLocationError(errorMsg);
        },
        options
      );
    }

    console.log('👁️ Starting continuous GPS tracking...');
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newLat = position.coords.latitude;
        const newLng = position.coords.longitude;

        if (!previousPositionRef.current) {
          console.log('🔄 First GPS update:', {
            lat: newLat,
            lng: newLng,
            accuracy: position.coords.accuracy,
            heading: position.coords.heading,
            speed: position.coords.speed
          });
          console.log('🌐 Check location: https://www.google.com/maps?q=' + newLat + ',' + newLng);
        }

        let calculatedHeading = calculatedHeadingRef.current;

        // Guard: Check if geometry library is available
        if (previousPositionRef.current && window.google?.maps?.geometry?.spherical) {
          const prevPos = previousPositionRef.current;
          const currentPos = new window.google.maps.LatLng(newLat, newLng);
          const prevLatLng = new window.google.maps.LatLng(prevPos.lat, prevPos.lng);

          const distanceMoved = window.google.maps.geometry.spherical.computeDistanceBetween(
            prevLatLng,
            currentPos
          );

          if (distanceMoved > 5) {
            calculatedHeading = window.google.maps.geometry.spherical.computeHeading(
              prevLatLng,
              currentPos
            );
            calculatedHeadingRef.current = calculatedHeading;
            console.log('🧭 Heading updated:', calculatedHeading.toFixed(0) + '°', 'Distance:', distanceMoved.toFixed(1) + 'm');
          }
        }

        const heading = position.coords.heading !== null && position.coords.heading !== undefined
          ? position.coords.heading
          : calculatedHeading;

        const location = {
          lat: newLat,
          lng: newLng,
          accuracy: position.coords.accuracy,
          heading: heading,
          speed: position.coords.speed || 0
        };

        previousPositionRef.current = { lat: newLat, lng: newLng };

        setCurrentLocation(location);
        setLocationLoading(false);
        setLocationError(null);
        setManualLocationMode(false);
      },
      (error) => {
        console.warn('⚠️ GPS watch error:', error.message);
      },
      {
        enableHighAccuracy: useHighAccuracy,
        timeout: 30000,
        maximumAge: 3000
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        console.log('🛑 GPS tracking stopped');
      }
    };
  }, [map, locationRetry, manualLocationMode, useHighAccuracy]);

  const handleNavigateToLocation = useCallback(() => {
    if (currentLocation && map) {
      map.panTo(currentLocation);
      map.setZoom(25);
    }
  }, [currentLocation, map]);

  const handleRetryLocation = useCallback(() => {
    console.log('Retrying location...');
    setManualLocationMode(false);
    setLocationError(null);
    setLocationLoading(true);
    setUseHighAccuracy(true);
    setLocationRetry(prev => prev + 1);
  }, []);

  const handleUseMapCenter = useCallback(() => {
    if (map) {
      const center = map.getCenter();
      const location = {
        lat: center.lat(),
        lng: center.lng(),
        accuracy: 100,
        heading: 0,
        speed: 0
      };
      setCurrentLocation(location);
      setManualLocationMode(true);
      setLocationLoading(false);
      setLocationError(null);
      console.log('✅ Using map center as location:', location.lat, location.lng);
    }
  }, [map]);

  // Create and update accuracy circle
  useEffect(() => {
    if (!map || !currentLocation) {
      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.setMap(null);
        accuracyCircleRef.current = null;
      }
      return;
    }

    // Guard: Check if Circle is available
    if (!window.google?.maps?.Circle) {
      console.warn('⚠️ Google Maps Circle not ready');
      return;
    }

    if (accuracyCircleRef.current) {
      accuracyCircleRef.current.setMap(null);
    }

    accuracyCircleRef.current = new window.google.maps.Circle({
      center: { lat: currentLocation.lat, lng: currentLocation.lng },
      radius: currentLocation.accuracy || 10,
      map: map,
      fillColor: '#4285F4',
      fillOpacity: 0.15,
      strokeColor: '#4285F4',
      strokeOpacity: 0.3,
      strokeWeight: 1,
      clickable: false,
    });

    return () => {
      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.setMap(null);
      }
    };
  }, [map, currentLocation]);

  // Grid overlay
  useEffect(() => {
    if (!map || !currentLocation) {
      if (gridOverlayRef.current) {
        gridOverlayRef.current.setMap(null);
        gridOverlayRef.current = null;
      }
      return;
    }

    // Guard: Check if Circle is available
    if (!window.google?.maps?.Circle) {
      console.warn('⚠️ Google Maps Circle not ready');
      return;
    }

    if (gridOverlayRef.current) {
      gridOverlayRef.current.setMap(null);
    }

    gridOverlayRef.current = new window.google.maps.Circle({
      center: { lat: currentLocation.lat, lng: currentLocation.lng },
      radius: 5,
      map: map,
      fillColor: '#00ff00',
      fillOpacity: 0.05,
      strokeColor: '#00ff00',
      strokeOpacity: 0.4,
      strokeWeight: 2,
      clickable: false,
      zIndex: 1,
    });

    return () => {
      if (gridOverlayRef.current) {
        gridOverlayRef.current.setMap(null);
      }
    };
  }, [map, currentLocation]);

  return (
    <div className="w-full h-full relative">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        options={mapOptions}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={handleMapClick}
      >
        {currentLocation && window.google?.maps && (
          <Marker
            position={{ lat: currentLocation.lat, lng: currentLocation.lng }}
            icon={{
              path: 'M 0,-1 a 1,1 0 1,1 0,2 a 1,1 0 1,1 0,-2',
              scale: 8,
              fillColor: '#ef4444',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }}
            title={`My Location\nLat: ${(currentLocation.lat || 0).toFixed(6)}\nLng: ${(currentLocation.lng || 0).toFixed(6)}\nAccuracy: ${(currentLocation.accuracy || 0).toFixed(0)}m`}
            zIndex={1000}
          />
        )}

        {waypoints
          .filter(waypoint => waypoint.action !== 'rtl')
          .map((waypoint, index) => {
            const isSelected = selectedWaypointId === waypoint.id;

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
        currentLocation={currentLocation}
        locationLoading={locationLoading}
        locationError={locationError}
        onNavigateToLocation={handleNavigateToLocation}
        onRetryLocation={handleRetryLocation}
        onUseMapCenter={handleUseMapCenter}
      />
    </div>
  );
};

export default MapView;
