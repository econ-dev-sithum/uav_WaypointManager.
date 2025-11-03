import "./App.css";
import React, { useState, useRef, useEffect } from "react";
import { LoadScript } from "@react-google-maps/api";
import { MissionProvider } from "./context/MissionContext";
import MapView from "./components/Map/MapView";
import WaypointPanel from "./components/Panels/WaypointPanel";
import MissionPanel from "./components/Panels/MissionPanel";
import MissionBrowser from "./components/Panels/MissionBrowser";

// Define libraries outside to prevent re-renders
const GOOGLE_MAPS_LIBRARIES = ['geometry', 'places'];

function App() {
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const autocompleteServiceRef = useRef(null);
  const geocoderRef = useRef(null);
  const searchInputRef = useRef(null);
  const mapUpdateHandlerRef = useRef(null);

  // Initialize Google Places when Google Maps script loads
  useEffect(() => {
    const initPlaces = () => {
      try {
        if (window.google?.maps?.places) {
          autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
          console.log('✓ AutocompleteService initialized');
        }
        if (window.google?.maps) {
          geocoderRef.current = new window.google.maps.Geocoder();
          console.log('✓ Geocoder initialized');
        }
        setGoogleMapsLoaded(true);
      } catch (error) {
        console.error('Error initializing Google Places:', error);
      }
    };

    // Check if Google Maps is already loaded
    if (window.google?.maps?.places) {
      initPlaces();
    } else {
      // Wait for Google Maps to load (via LoadScript onLoad callback)
      const checkGoogleMaps = setInterval(() => {
        if (window.google?.maps?.places) {
          initPlaces();
          clearInterval(checkGoogleMaps);
        }
      }, 100);

      // Cleanup interval on unmount
      return () => clearInterval(checkGoogleMaps);
    }
  }, []);

  // Handle location search input
  const handleSearchInput = (e) => {
    const value = e.target.value;
    setSearchInput(value);

    if (value.length > 2 && autocompleteServiceRef.current) {
      setSearchLoading(true);
      autocompleteServiceRef.current.getPlacePredictions(
        {
          input: value,
          componentRestrictions: { country: 'lk' }, // Sri Lanka
        },
        (predictions) => {
          setSearchResults(predictions || []);
          setShowSearchResults(predictions && predictions.length > 0);
          setSearchLoading(false);
        }
      );
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
      setSearchLoading(false);
    }
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchInput('');
    setSearchResults([]);
    setShowSearchResults(false);
    searchInputRef.current?.focus();
  };

  // Handle location selection
  const handleSelectLocation = (_, description) => {
    if (!geocoderRef.current) {
      console.warn('Geocoder not ready yet');
      return;
    }

    // Use Geocoder to get coordinates from the description
    geocoderRef.current.geocode(
      { address: description },
      (results, status) => {
        if (status === 'OK' && results && results.length > 0) {
          const location = results[0].geometry.location;
          const lat = location.lat();
          const lng = location.lng();

          // Update the map location via ref callback
          if (mapUpdateHandlerRef.current) {
            mapUpdateHandlerRef.current(lat, lng, description);
          }

          // Clear search
          setSearchInput(description);
          setShowSearchResults(false);
          setSearchResults([]);

          console.log('📍 Location selected from header:', description, lat, lng);
        } else {
          console.error('Geocode failed:', status);
        }
      }
    );
  };

  return (
    <LoadScript
      googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
      libraries={GOOGLE_MAPS_LIBRARIES}
      onLoad={() => {
        console.log('✓ Google Maps API loaded successfully');
      }}
      onError={() => {
        console.error('✗ Failed to load Google Maps API');
      }}
    >
      <MissionProvider>
        <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
          {/* Header */}
          <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
            <div className="px-6 py-3">
              <div className="flex items-center justify-between gap-6">
                {/* Left - Title */}
                <div className="flex-shrink-0">
                  <h1 className="text-2xl font-bold flex items-center">
                    <svg className="w-7 h-7 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    UAV Mission Planner
                  </h1>
                  <p className="text-xs text-blue-100 mt-0.5 ml-9">
                    Professional waypoint management system
                  </p>
                </div>

                {/* Center - Search Bar */}
                <div className="flex-grow max-w-md">
                  <div className="relative">
                    <div className="relative flex items-center bg-white rounded-lg shadow-md">
                      <span className="absolute left-3 text-gray-400 text-lg">🔍</span>
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchInput}
                        onChange={handleSearchInput}
                        placeholder="Search location..."
                        className="w-full pl-10 pr-12 py-2.5 rounded-lg bg-white text-gray-700 placeholder-gray-400 focus:outline-none text-sm"
                        onFocus={() => searchInput.length > 2 && setShowSearchResults(true)}
                        disabled={!googleMapsLoaded}
                      />
                      <div className="absolute right-3 flex items-center">
                        {searchLoading && <div className="animate-spin text-lg">⏳</div>}
                        {searchInput && !searchLoading && (
                          <button
                            onClick={handleClearSearch}
                            className="text-gray-400 hover:text-gray-600 text-lg"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Search Results Dropdown */}
                    {showSearchResults && searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white rounded-lg mt-2 shadow-xl border border-gray-200 overflow-hidden z-20 max-h-64 overflow-y-auto text-gray-700">
                        <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500">
                          {searchResults.length} Results Found
                        </div>
                        {searchResults.map((result) => (
                          <div
                            key={result.place_id}
                            onClick={() => handleSelectLocation(result.place_id, result.description)}
                            className="px-3 py-2.5 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors text-sm"
                          >
                            <div className="font-semibold text-gray-800 truncate">{result.main_text}</div>
                            <div className="text-xs text-gray-500 truncate">{result.secondary_text}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {showSearchResults && searchResults.length === 0 && searchInput.length > 2 && !searchLoading && (
                      <div className="absolute top-full left-0 right-0 bg-white rounded-lg mt-2 shadow-lg border border-gray-200 p-3 z-20 text-center text-gray-500 text-sm">
                        No locations found
                      </div>
                    )}
                  </div>
                </div>

                {/* Right - Version */}
                <div className="text-right flex-shrink-0">
                  <div className="text-xs text-blue-200">Version 1.0.0</div>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-hidden">
            <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-3 p-3">
              {/* Left Sidebar - Mission Browser */}
              <div className="hidden lg:block lg:col-span-2 h-full overflow-y-auto">
                <div className="h-full flex flex-col space-y-3">
                  <MissionBrowser />
                  <MissionPanel />
                </div>
              </div>

              {/* Center - Map View (Larger) */}
              <div className="lg:col-span-8 order-first lg:order-none h-full">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden h-full">
                  <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-4 py-2 flex items-center justify-between">
                    <h2 className="text-white font-semibold flex items-center text-sm">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      Map View
                    </h2>
                    <span className="text-xs text-gray-300">Home: 7.028095°, 79.909942°</span>
                  </div>
                  <div className="h-[calc(100%-40px)]">
                    <MapView onLocationUpdate={(handler) => {mapUpdateHandlerRef.current = handler;}} />
                  </div>
                </div>
              </div>

              {/* Right Sidebar - Waypoint List */}
              <div className="lg:col-span-2 h-full overflow-y-auto">
                <WaypointPanel />
              </div>
            </div>
          </main>
        </div>
      </MissionProvider>
    </LoadScript>
  );
}

export default App;
