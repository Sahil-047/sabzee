import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { yieldPredictionApi } from '../services/api';

const YieldPredictionPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  
  const [formData, setFormData] = useState({
    latitude: '',
    longitude: '',
    crop: '',
    season: 'Rabi',
    area_of_land: '',
    soil_type: 'Loamy',
    location_details: {}
  });

  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState('');
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [locationName, setLocationName] = useState('');
  
  // Redirect if not a farmer
  if (!user || user.role !== 'farmer') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Access Denied
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Only farmers can access the yield prediction tool.
          </p>
          <div className="mt-5 flex justify-center">
            <Link
              to="/dashboard"
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Initialize map once on component mount
  useEffect(() => {
    const loadMapScript = () => {
      if (window.mapboxgl) {
        setMapLoaded(true);
        return;
      }
      
      // We're using Mapbox as our map provider
      const script = document.createElement('script');
      script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
      script.async = true;
      script.onload = () => {
        const link = document.createElement('link');
        link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
        setMapLoaded(true);
      };
      document.head.appendChild(script);
    };
    
    loadMapScript();
  }, []);
  
  // Initialize map when mapLoaded state changes to true
  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current) return;
    
    try {
      // Get Mapbox token from environment variable or use a fallback for development
      const mapboxToken = import.meta.env.VITE_MAPBOX_API_KEY || 'pk.eyJ1IjoibWFwYm94LWRlbW8iLCJhIjoiY2xpNGUwZnZ0MHUxbDNkbXFoYTQ2MDhuYyJ9.HbaRRHR8HXD0CAanL2PoDw'; // Demo token with limited usage
      
      // Create map instance
      mapboxgl.accessToken = mapboxToken;
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: [78.9629, 20.5937], // Center on India
        zoom: 4
      });
      
      // Add navigation controls
      map.addControl(new mapboxgl.NavigationControl());
      
      // Add geolocate control to the map (real-time location tracking)
      const geolocateControl = new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true
      });
      
      map.addControl(geolocateControl);
      
      // When map loads, trigger geolocate if useCurrentLocation is enabled
      map.on('load', () => {
        if (useCurrentLocation) {
          setTimeout(() => {
            geolocateControl.trigger(); // Automatically request location
          }, 1000);
        }
      });
      
      // Save the map instance to ref
      mapInstanceRef.current = map;
      
      // Add a marker that will be moved when the user clicks
      const marker = new mapboxgl.Marker({
        draggable: true,
        color: '#22c55e' // Green color matching the theme
      });
      
      // Update coordinates when marker is dragged
      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        updateCoordinates(lngLat.lat, lngLat.lng);
      });
      
      markerRef.current = marker;
      
      // Add click event to set marker position
      map.on('click', (e) => {
        marker.setLngLat(e.lngLat).addTo(map);
        updateCoordinates(e.lngLat.lat, e.lngLat.lng);
      });
      
      // Listen for location updates from geolocate control
      geolocateControl.on('geolocate', (e) => {
        const { latitude, longitude } = e.coords;
        updateCoordinates(latitude, longitude);
        
        // Add marker at user's location if it doesn't exist yet
        marker.setLngLat([longitude, latitude]).addTo(map);
      });
      
      // If we already have coordinates, set the marker
      if (formData.latitude && formData.longitude) {
        const lat = parseFloat(formData.latitude);
        const lng = parseFloat(formData.longitude);
        marker.setLngLat([lng, lat]).addTo(map);
        map.flyTo({ center: [lng, lat], zoom: 12 });
      }
      
      // Clean up on unmount
      return () => {
        map.remove();
      };
    } catch (err) {
      console.error("Error initializing map:", err);
      setError("Unable to initialize map. Please enter coordinates manually.");
    }
  }, [mapLoaded, useCurrentLocation]);

  // Function to update coordinates and fetch location name
  const updateCoordinates = async (lat, lng) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6)
    }));
    
    try {
      // Get Mapbox token from environment variable or use fallback
      const mapboxToken = mapboxgl?.accessToken || import.meta.env.VITE_MAPBOX_API_KEY || '';
      
      if (!mapboxToken) {
        setLocationName('Location data unavailable - no API key');
        return;
      }
      
      // Fetch location details using reverse geocoding
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}&language=en`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.features && data.features.length > 0) {
          const placeName = data.features[0].place_name;
          setLocationName(placeName);
          
          // Extract useful location data
          const locationDetails = {
            place_name: placeName,
            district: data.features.find(f => f.place_type?.includes('district'))?.text || '',
            state: data.features.find(f => f.place_type?.includes('region'))?.text || '',
            country: data.features.find(f => f.place_type?.includes('country'))?.text || ''
          };
          
          setFormData(prev => ({
            ...prev,
            location_details: locationDetails
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching location details:", error);
      setLocationName('Unable to fetch location name');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // If manually changing coordinates, update the map
    if ((name === 'latitude' || name === 'longitude') && 
        mapInstanceRef.current && markerRef.current && 
        formData.latitude && formData.longitude) {
      
      const lat = name === 'latitude' ? parseFloat(value) : parseFloat(formData.latitude);
      const lng = name === 'longitude' ? parseFloat(value) : parseFloat(formData.longitude);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        markerRef.current.setLngLat([lng, lat]).addTo(mapInstanceRef.current);
        mapInstanceRef.current.flyTo({ center: [lng, lat], zoom: 12 });
      }
    }
  };

  const toggleLocationInput = () => {
    setUseCurrentLocation(!useCurrentLocation);
    if (!useCurrentLocation) {
      // If switching back to current location, clear the manual inputs
      setFormData(prev => ({
        ...prev,
        latitude: '',
        longitude: ''
      }));
      setLocationName('');
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPrediction(null);
    
    try {
      // Validate inputs
      if (!formData.latitude || !formData.longitude) {
        throw new Error('Location coordinates are required. Please select a location on the map.');
      }
      if (!formData.crop) {
        throw new Error('Crop name is required');
      }
      if (!formData.area_of_land) {
        throw new Error('Land area is required');
      }

      // Send to API
      const result = await yieldPredictionApi.predictYield(formData);
      setPrediction(result);
      
      // Scroll to results
      setTimeout(() => {
        document.getElementById('prediction-results')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error('Prediction error:', err);
      setError(err.message || 'Failed to process the prediction. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleViewHistory = () => {
    navigate('/yield-prediction-history');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Crop Yield Prediction</h1>
            <p className="mt-2 text-lg text-gray-600">
              Predict your crop yield and get recommendations based on your farm conditions
            </p>
          </div>
          <button
            onClick={handleViewHistory}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            View History
          </button>
        </div>
        
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleSubmit}>
              {/* Location Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Farm Location</h3>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="useCurrentLocation"
                      checked={useCurrentLocation}
                      onChange={toggleLocationInput}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor="useCurrentLocation" className="ml-2 block text-sm text-gray-700">
                      Use my current location
                    </label>
                  </div>
                </div>
                
                {/* Map Container */}
                <div className="mb-4 rounded-lg overflow-hidden border border-gray-300" style={{ height: '300px' }}>
                  <div ref={mapContainerRef} className="w-full h-full">
                    {!mapLoaded && (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <p className="text-gray-500">Loading map...</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {locationName && (
                  <div className="mb-4 px-3 py-2 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800">
                      <span className="font-semibold">Selected location:</span> {locationName}
                    </p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="latitude" className="block text-sm font-medium text-gray-700">
                      Latitude
                    </label>
                    <input
                      type="text"
                      name="latitude"
                      id="latitude"
                      value={formData.latitude}
                      onChange={handleChange}
                      disabled={useCurrentLocation}
                      placeholder="e.g., 23.8103"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="longitude" className="block text-sm font-medium text-gray-700">
                      Longitude
                    </label>
                    <input
                      type="text"
                      name="longitude"
                      id="longitude"
                      value={formData.longitude}
                      onChange={handleChange}
                      disabled={useCurrentLocation}
                      placeholder="e.g., 90.4125"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      required
                    />
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Select a location by clicking on the map or enter coordinates manually
                </p>
              </div>
              
              {/* Crop Information Section */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Crop Information</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="crop" className="block text-sm font-medium text-gray-700">
                      Crop Name
                    </label>
                    <select
                      name="crop"
                      id="crop"
                      value={formData.crop}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      required
                    >
                      <option value="">Select a crop</option>
                      <option value="Rice">Rice</option>
                      <option value="Wheat">Wheat</option>
                      <option value="Maize">Maize</option>
                      <option value="Sugarcane">Sugarcane</option>
                      <option value="Cotton">Cotton</option>
                      <option value="Soybeans">Soybeans</option>
                      <option value="Potatoes">Potatoes</option>
                      <option value="Tomatoes">Tomatoes</option>
                      <option value="Onions">Onions</option>
                      <option value="Chillies">Chillies</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="season" className="block text-sm font-medium text-gray-700">
                      Growing Season
                    </label>
                    <select
                      name="season"
                      id="season"
                      value={formData.season}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      required
                    >
                      <option value="Rabi">Rabi (Winter)</option>
                      <option value="Kharif">Kharif (Monsoon)</option>
                      <option value="Zaid">Zaid (Summer)</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Land Information Section */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Land Information</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="area_of_land" className="block text-sm font-medium text-gray-700">
                      Land Area (Acres)
                    </label>
                    <input
                      type="number"
                      name="area_of_land"
                      id="area_of_land"
                      min="0.1"
                      step="0.1"
                      value={formData.area_of_land}
                      onChange={handleChange}
                      placeholder="e.g., 5.5"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="soil_type" className="block text-sm font-medium text-gray-700">
                      Soil Type
                    </label>
                    <select
                      name="soil_type"
                      id="soil_type"
                      value={formData.soil_type}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      required
                    >
                      <option value="Loamy">Loamy</option>
                      <option value="Clay">Clay</option>
                      <option value="Sandy">Sandy</option>
                      <option value="Silt">Silt</option>
                      <option value="Black">Black</option>
                      <option value="Red">Red</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Submit Button */}
              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={loading}
                  className={`inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                    loading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    'Predict Yield'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        {/* Prediction Results */}
        {prediction && (
          <div id="prediction-results" className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 bg-green-50">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Prediction Results</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Based on your farm location and crop details
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Predicted Yield</dt>
                  <dd className="mt-1">
                    <div className="text-3xl font-bold text-green-600">
                      {prediction.predicted_yield_kg.toLocaleString()} kg
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      ({(prediction.confidence * 100).toFixed(0)}% confidence)
                      {prediction.isMock && 
                        <span className="ml-2 text-yellow-600">(using feature-based prediction)</span>
                      }
                    </p>
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Crop</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formData.crop}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Area</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formData.area_of_land} acres</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Season</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formData.season}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Soil Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formData.soil_type}</dd>
                </div>
                
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Weather Conditions</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex flex-col">
                        <div className="flex items-center mb-3">
                          <div className="flex-shrink-0 mr-3">
                            {prediction.weather.weather_condition === 'Clear' && (
                              <svg className="h-8 w-8 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                              </svg>
                            )}
                            {prediction.weather.weather_condition === 'Clouds' && (
                              <svg className="h-8 w-8 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                              </svg>
                            )}
                            {(prediction.weather.weather_condition === 'Rain' || prediction.weather.weather_condition === 'Drizzle') && (
                              <svg className="h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                              </svg>
                            )}
                            {!['Clear', 'Clouds', 'Rain', 'Drizzle'].includes(prediction.weather.weather_condition) && (
                              <svg className="h-8 w-8 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <p className="text-lg font-medium">{prediction.weather.weather_condition}</p>
                            <p className="text-sm text-gray-500 capitalize">{prediction.weather.weather_description}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-2">
                          <div className="flex items-center">
                            <svg className="h-5 w-5 text-yellow-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <span>Temperature: <strong>{prediction.weather.temperature}°C</strong></span>
                          </div>
                          <div className="flex items-center">
                            <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            <span>Humidity: <strong>{prediction.weather.humidity}%</strong></span>
                          </div>
                          <div className="flex items-center">
                            <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                            </svg>
                            <span>Rainfall: <strong>{prediction.weather.rainfall} mm</strong></span>
                          </div>
                          {prediction.weather.wind_speed !== undefined && (
                            <div className="flex items-center">
                              <svg className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                              </svg>
                              <span>Wind: <strong>{prediction.weather.wind_speed} m/s</strong></span>
                            </div>
                          )}
                          {prediction.weather.timestamp && (
                            <div className="flex items-center col-span-2">
                              <svg className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>Last updated: <strong>{new Date(prediction.weather.timestamp).toLocaleString()}</strong></span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {prediction.weather_source === 'openweathermap_api' ? (
                      <div className="mt-2 flex items-center text-sm text-green-700 bg-green-50 p-2 rounded-md">
                        <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Using real-time weather data from OpenWeatherMap for this location
                      </div>
                    ) : (
                      <div className="mt-2 flex items-center text-sm text-yellow-700 bg-yellow-50 p-2 rounded-md">
                        <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Using estimated weather data (OpenWeatherMap API key not configured)
                      </div>
                    )}
                  </dd>
                </div>
                
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Location Data</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <div className="flex flex-col space-y-2">
                      <div>
                        <span className="text-gray-500">Coordinates: </span>
                        <strong>{formData.latitude}, {formData.longitude}</strong>
                      </div>
                      {locationName && (
                        <div>
                          <span className="text-gray-500">Location: </span>
                          <strong>{locationName}</strong>
                        </div>
                      )}
                      {formData.location_details?.district && (
                        <div>
                          <span className="text-gray-500">District: </span>
                          <strong>{formData.location_details.district}</strong>
                        </div>
                      )}
                      {formData.location_details?.state && (
                        <div>
                          <span className="text-gray-500">State: </span>
                          <strong>{formData.location_details.state}</strong>
                        </div>
                      )}
                    </div>
                  </dd>
                </div>
                
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Recommended Alternative Crops</dt>
                  <dd className="mt-1">
                    <ul className="bg-green-50 rounded-md p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {prediction.suggested_crops.map((crop, index) => (
                        <li key={index} className="flex items-center">
                          <svg className="h-5 w-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-gray-900">{crop}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-gray-500 mt-2">
                      These crops are well-suited for your soil type and current weather conditions
                    </p>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default YieldPredictionPage; 