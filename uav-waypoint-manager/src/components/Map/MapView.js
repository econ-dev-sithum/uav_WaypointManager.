import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { useMission } from '../../context/MissionContext';
import MapToolbar from './MapToolbar';
import MapSidebar from './MapSidebar';

// Define libraries outside component to prevent re-renders
const GOOGLE_MAPS_LIBRARIES = ['geometry'];

const MapView = () => {
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

  const mapContainerStyle = {
    width: '100%',
    height: '100%',
    minHeight: '600px',
  };

  const mapOptions = useMemo(() => ({
    zoom: 22,
    minZoom: 3,
    maxZoom: 22,
    center: currentLocation || missionMetadata.homePosition,
    mapTypeId: mapType,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
    zoomControl: false,
    gestureHandling: 'greedy',
    disableDefaultUI: false,
  }), [currentLocation, missionMetadata.homePosition, mapType]);

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
        // Check if takeoff already exists
        const hasTakeoff = waypoints.some(wp => wp.action === 'takeoff');
        if (!hasTakeoff) {
          const takeoffResult = addWaypoint(lat, lng, 'takeoff');
          if (!takeoffResult.error) {
            setSelectedWaypointId(takeoffResult.id);
            setCurrentMode('waypoint'); // Switch back to waypoint mode
          }
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
      anchor: { x: 12, y: 22 },
      labelOrigin: { x: 12, y: 10 },
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

  // GPS tracking - Get and watch current location (optimized for laptops)
  useEffect(() => {
    // Skip if no geolocation support
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      setLocationLoading(false);
      console.error('Geolocation API not available');
      return;
    }

    // If manual mode was used, start watch immediately without showing loading
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

    // Options for GPS tracking - use state to toggle between GPS and network
    const options = {
      enableHighAccuracy: useHighAccuracy, // Toggle between GPS and network
      timeout: useHighAccuracy ? 10000 : 8000, // Shorter timeout for GPS, moderate for network
      maximumAge: 5000 // Accept 5-second cached position
    };

    // Get initial position
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

          // Store initial position for heading calculation
          previousPositionRef.current = { lat: location.lat, lng: location.lng };

          setCurrentLocation(location);
          setLocationLoading(false);
          setLocationError(null);
          setManualLocationMode(false); // Override manual location

          // Center map on first GPS lock
          if (map) {
            map.panTo({ lat: location.lat, lng: location.lng });
            map.setZoom(19);
            console.log('✅ Map centered to GPS location');
          } else {
            // If map is not loaded yet, it will use currentLocation from mapOptions
            console.log('✅ GPS location ready, map will center when loaded');
          }
        },
        (error) => {
          console.error('❌ Location failed:', error.message);

          // If high accuracy (GPS) times out, automatically try network-based location
          if (error.code === 3 && useHighAccuracy) {
            console.log('⚡ GPS timeout - switching to network-based location...');
            setUseHighAccuracy(false);
            setLocationRetry(prev => prev + 1);
            return; // Don't show error, just retry with lower accuracy
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

    // Always start watching position (even in manual mode) for live updates
    console.log('👁️ Starting continuous GPS tracking...');
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newLat = position.coords.latitude;
        const newLng = position.coords.longitude;

        // Log first update with full details
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

        // Calculate heading from movement if we have a previous position
        let calculatedHeading = calculatedHeadingRef.current;

        if (previousPositionRef.current && window.google?.maps?.geometry) {
          const prevPos = previousPositionRef.current;
          const currentPos = new window.google.maps.LatLng(newLat, newLng);
          const prevLatLng = new window.google.maps.LatLng(prevPos.lat, prevPos.lng);

          // Calculate distance moved
          const distanceMoved = window.google.maps.geometry.spherical.computeDistanceBetween(
            prevLatLng,
            currentPos
          );

          // Only update heading if moved more than 5 meters (to avoid jitter)
          if (distanceMoved > 5) {
            calculatedHeading = window.google.maps.geometry.spherical.computeHeading(
              prevLatLng,
              currentPos
            );
            calculatedHeadingRef.current = calculatedHeading;
            console.log('🧭 Heading updated:', calculatedHeading.toFixed(0) + '°', 'Distance:', distanceMoved.toFixed(1) + 'm');
          }
        }

        // Use GPS heading if available (from device compass), otherwise use calculated heading
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

        // Store current position for next heading calculation
        previousPositionRef.current = { lat: newLat, lng: newLng };

        setCurrentLocation(location);
        setLocationLoading(false);
        setLocationError(null);
        setManualLocationMode(false); // GPS overrides manual location
      },
      (error) => {
        console.warn('⚠️ GPS watch error:', error.message);
        // Don't set error state here, just log it
      },
      {
        enableHighAccuracy: useHighAccuracy,
        timeout: 30000, // Longer timeout for watch
        maximumAge: 3000 // More frequent updates (3 seconds)
      }
    );

    // Cleanup
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        console.log('🛑 GPS tracking stopped');
      }
    };
  }, [map, locationRetry, manualLocationMode, useHighAccuracy]);

  // Handler to navigate to current location
  const handleNavigateToLocation = useCallback(() => {
    if (currentLocation && map) {
      map.panTo(currentLocation);
      map.setZoom(22);
    }
  }, [currentLocation, map]);

  // Handler to retry getting location
  const handleRetryLocation = useCallback(() => {
    console.log('Retrying location...');
    setManualLocationMode(false);
    setLocationError(null);
    setLocationLoading(true);
    setUseHighAccuracy(true); // Start with GPS again
    setLocationRetry(prev => prev + 1); // Trigger useEffect to re-run
  }, []);

  // Handler to use map center as current location
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

    // Remove existing circle
    if (accuracyCircleRef.current) {
      accuracyCircleRef.current.setMap(null);
    }

    // Create new accuracy circle
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

  return (
    <div className="w-full h-full relative">
      <LoadScript
        googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
        libraries={GOOGLE_MAPS_LIBRARIES}
      >
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          options={mapOptions}
          onLoad={onLoad}
          onUnmount={onUnmount}
          onClick={handleMapClick}
        >
          {/* Current location marker - Blue arrow that rotates with heading */}
          {currentLocation && window.google?.maps && (
            <Marker
              position={{ lat: currentLocation.lat, lng: currentLocation.lng }}
              icon={{
                path: 'M 0,-24 L 8,0 L 0,-8 L -8,0 Z',
                scale: 1.5,
                fillColor: '#4285F4',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
                rotation: currentLocation.heading !== null ? currentLocation.heading : 0,
                anchor: { x: 0, y: 0 }
              }}
              title={`My Location\nLat: ${currentLocation.lat.toFixed(6)}\nLng: ${currentLocation.lng.toFixed(6)}\nHeading: ${currentLocation.heading.toFixed(0)}°\nSpeed: ${(currentLocation.speed * 3.6).toFixed(1)} km/h\nAccuracy: ${currentLocation.accuracy.toFixed(0)}m`}
              zIndex={1000}
            />
          )}

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
          currentLocation={currentLocation}
          locationLoading={locationLoading}
          locationError={locationError}
          onNavigateToLocation={handleNavigateToLocation}
          onRetryLocation={handleRetryLocation}
          onUseMapCenter={handleUseMapCenter}
        />
      </LoadScript>
    </div>
  );
};

export default MapView;
