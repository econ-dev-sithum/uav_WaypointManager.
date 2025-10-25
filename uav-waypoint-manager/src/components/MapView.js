import React, { useState, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

const MapView = () => {
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);

  // Default center (you can change this to your preferred location)
  const defaultCenter = {
    lat: 40.7128,
    lng: -74.0060
  };

  const mapContainerStyle = {
    width: '100%',
    height: '600px'
  };

  const mapOptions = {
    zoom: 12,
    center: defaultCenter,
    mapTypeId: 'satellite', // Using satellite view for UAV operations
    mapTypeControl: true,
    streetViewControl: false,
    fullscreenControl: true,
    zoomControl: true,
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
      id: Date.now()
    };
    setMarkers([...markers, newMarker]);
  };

  return (
    <div className="w-full h-full">
      <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          options={mapOptions}
          onLoad={onLoad}
          onUnmount={onUnmount}
          onClick={handleMapClick}
        >
          {markers.map((marker) => (
            <Marker
              key={marker.id}
              position={{ lat: marker.lat, lng: marker.lng }}
            />
          ))}
        </GoogleMap>
      </LoadScript>
    </div>
  );
};

export default MapView;
