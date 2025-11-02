import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

const MapView = ({ waypoints, setWaypoints }) => {
  const [map, setMap] = useState(null);
  const polylineRef = useRef(null);

  // Default center - Anuradhapura, Sri Lanka
  const defaultCenter = {
    lat: 8.3114,
    lng: 80.4037
  };

  const mapContainerStyle = {
    width: '100%',
    height: '600px'
  };

  const mapOptions = {
    zoom: 22,
    minZoom: 3,
    maxZoom: 22, // Maximum zoom level for best detail
    center: defaultCenter,
    mapTypeId: 'satellite', // Using satellite view for UAV operations
    mapTypeControl: true,
    streetViewControl: false,
    fullscreenControl: true,
    zoomControl: true,
  };

  // Path styling options
  const pathOptions = {
    strokeColor: '#FF0000',
    strokeOpacity: 0.8,
    strokeWeight: 3,
    fillColor: '#FF0000',
    fillOpacity: 0.35,
    clickable: false,
    draggable: false,
    editable: false,
    visible: true,
    zIndex: 1
  };

  const onLoad = useCallback((map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Handle map click to add waypoints
  const handleMapClick = (event) => {
    const newMarker = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
      id: Date.now(),
      altitude: 50,
      speed: 5,
      action: 'waypoint'
    };
    setWaypoints([...waypoints, newMarker]);
  };

  // Handle marker drag to update waypoint position
  const handleMarkerDrag = useCallback((markerId, event) => {
    setWaypoints(prevMarkers =>
      prevMarkers.map(marker => {
        if (marker.id === markerId) {
          return {
            ...marker,
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
          };
        }
        return marker;
      })
    );
  }, [setWaypoints]);

  // Handle marker right-click to delete waypoint
  const handleMarkerRightClick = (markerId) => {
    const updatedMarkers = waypoints.filter(marker => marker.id !== markerId);
    setWaypoints(updatedMarkers);
  };

  // Memoize path to ensure it updates properly
  const pathCoordinates = useMemo(() => {
    return waypoints.map(marker => ({ lat: marker.lat, lng: marker.lng }));
  }, [waypoints]);

  // Create and manage polyline using native Google Maps API
  useEffect(() => {
    if (!map || waypoints.length < 2) {
      // Remove polyline if it exists
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

    // Create new polyline with updated path
    polylineRef.current = new window.google.maps.Polyline({
      path: pathCoordinates,
      strokeColor: '#FF0000',
      strokeOpacity: 0.8,
      strokeWeight: 3,
      map: map
    });

    // Cleanup function
    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
    };
  }, [map, pathCoordinates]);

  return (
    <div className="w-full h-full relative">

      <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          options={mapOptions}
          onLoad={onLoad}
          onUnmount={onUnmount}
          onClick={handleMapClick}
        >
          {waypoints.map((marker, index) => (
            <Marker
              key={marker.id}
              position={{ lat: marker.lat, lng: marker.lng }}
              label={{
                text: `${index + 1}`,
                color: 'white',
                fontWeight: 'bold'
              }}
              draggable={true}
              onDragEnd={(event) => handleMarkerDrag(marker.id, event)}
              onRightClick={() => handleMarkerRightClick(marker.id)}
            />
          ))}
        </GoogleMap>
      </LoadScript>
    </div>
  );
};

export default MapView;

