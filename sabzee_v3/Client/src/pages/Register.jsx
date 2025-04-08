import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Register = () => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    contactNumber: '',
    role: 'consumer',
    farmDetails: {
      farmName: '',
      farmSize: '',
      mainCrops: '',
      location: {
        coordinates: [0, 0]
      },
      locationName: ''
    },
    useCurrentLocation: true
  });
  
  const [formError, setFormError] = useState('');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [locationFetched, setLocationFetched] = useState(false);
  const [locationError, setLocationError] = useState('');
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const { 
    name, email, password, confirmPassword, contactNumber, role, useCurrentLocation,
    farmDetails: { farmName, farmSize, mainCrops, location, locationName } 
  } = formData;

  // Load Mapbox script when a user selects the farmer role
  useEffect(() => {
    if (role === 'farmer' && !mapLoaded) {
      const loadMapScript = () => {
        if (window.mapboxgl) {
          setMapLoaded(true);
          return;
        }
        
        // Load Mapbox script
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
    }
  }, [role, mapLoaded]);
  
  // Initialize map when necessary elements are ready
  useEffect(() => {
    if (role !== 'farmer' || !mapLoaded || !mapContainerRef.current) return;
    
    try {
      // Get Mapbox token from environment variable or use a fallback for development
      const mapboxToken = import.meta.env.VITE_MAPBOX_API_KEY || 'pk.eyJ1IjoibWl4aXJveSIsImEiOiJjbTk3ZjVzZmcwNHBuMmlvZjhqZGhzbnlvIn0.BPM1jifJebiXXTUipXZWAQ';
      
      // Create map instance
      window.mapboxgl.accessToken = mapboxToken;
      const map = new window.mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: [78.9629, 20.5937], // Center on India
        zoom: 4
      });
      
      // Add navigation controls
      map.addControl(new window.mapboxgl.NavigationControl());
      
      // Add geolocate control for real-time location tracking
      const geolocateControl = new window.mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true
      });
      
      map.addControl(geolocateControl);
      
      // Save map instance to ref
      mapInstanceRef.current = map;
      
      // Add a marker that will be moved when the user clicks
      const marker = new window.mapboxgl.Marker({
        draggable: true,
        color: '#22c55e' // Green color matching the theme
      });
      
      markerRef.current = marker;
      
      // Update coordinates when marker is dragged
      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        updateCoordinates(lngLat.lng, lngLat.lat);
      });
      
      // Add click event to set marker position
      map.on('click', (e) => {
        marker.setLngLat(e.lngLat).addTo(map);
        updateCoordinates(e.lngLat.lng, e.lngLat.lat);
      });
      
      // When map loads, trigger geolocate if useCurrentLocation is enabled
      map.on('load', () => {
        if (useCurrentLocation && !locationFetched) {
          setTimeout(() => {
            geolocateControl.trigger(); // Automatically request location
          }, 1000);
        }
      });
      
      // Listen for location updates from geolocate control
      geolocateControl.on('geolocate', (e) => {
        const { longitude, latitude } = e.coords;
        updateCoordinates(longitude, latitude);
        
        // Add marker at user's location
        marker.setLngLat([longitude, latitude]).addTo(map);
        setLocationFetched(true);
      });
      
      // Clean up on unmount
      return () => {
        map.remove();
      };
    } catch (err) {
      console.error("Error initializing map:", err);
      setLocationError("Unable to initialize map. Please enter coordinates manually.");
    }
  }, [role, mapLoaded, useCurrentLocation, locationFetched]);

  // Function to update coordinates and fetch location name
  const updateCoordinates = async (lng, lat) => {
    setFormData(prev => ({
      ...prev,
      farmDetails: {
        ...prev.farmDetails,
        location: {
          ...prev.farmDetails.location,
          coordinates: [lng, lat]
        }
      }
    }));
    
    try {
      // Get Mapbox token
      const mapboxToken = window.mapboxgl?.accessToken || import.meta.env.VITE_MAPBOX_API_KEY || '';
      
      if (!mapboxToken) {
        setLocationError('Location data unavailable - no API key');
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
          
          // Extract useful location data
          const locationDetails = {
            place_name: placeName,
            district: data.features.find(f => f.place_type?.includes('district'))?.text || '',
            state: data.features.find(f => f.place_type?.includes('region'))?.text || '',
            country: data.features.find(f => f.place_type?.includes('country'))?.text || ''
          };
          
          setFormData(prev => ({
            ...prev,
            farmDetails: {
              ...prev.farmDetails,
              locationName: placeName,
              locationDetails
            }
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching location details:", error);
      setLocationError('Unable to fetch location name');
    }
  };

  const handleChange = (e) => {
    if (e.target.name.includes('farmDetails.')) {
      const farmField = e.target.name.split('.')[1];
      setFormData({
        ...formData,
        farmDetails: {
          ...formData.farmDetails,
          [farmField]: e.target.value
        }
      });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    const userData = {
      name,
      email,
      password,
      contactNumber,
      role
    };

    if (role === 'farmer') {
      // Check if location is set
      const [longitude, latitude] = formData.farmDetails.location.coordinates;
      if (longitude === 0 && latitude === 0) {
        setFormError('Please set your farm location on the map');
        return;
      }
      
      // Process mainCrops from comma-separated string to array
      const cropsArray = mainCrops.split(',').map(crop => crop.trim()).filter(crop => crop !== '');
      
      userData.farmDetails = {
        farmName,
        farmSize: parseFloat(farmSize),
        mainCrops: cropsArray,
        location: {
          coordinates: formData.farmDetails.location.coordinates,
          type: 'Point'
        },
        locationName: formData.farmDetails.locationName,
        locationDetails: formData.farmDetails.locationDetails
      };
    }

    try {
      await register(userData);
      navigate('/');
    } catch (error) {
      setFormError(error.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  const toggleLocationInput = () => {
    setFormData(prev => ({
      ...prev,
      useCurrentLocation: !prev.useCurrentLocation
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create a new account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link to="/login" className="font-medium text-green-600 hover:text-green-500">
            login to your existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {formError && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
              <p className="text-sm text-red-700">{formError}</p>
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700">
                Contact Number
              </label>
              <div className="mt-1">
                <input
                  id="contactNumber"
                  name="contactNumber"
                  type="tel"
                  autoComplete="tel"
                  required
                  value={contactNumber}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                I am a
              </label>
              <div className="mt-1">
                <select
                  id="role"
                  name="role"
                  value={role}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                >
                  <option value="consumer">Consumer</option>
                  <option value="farmer">Farmer</option>
                </select>
              </div>
            </div>

            {role === 'farmer' && (
              <div className="space-y-4 border-t border-gray-200 pt-4">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Farm Details</h3>
                
                <div>
                  <label htmlFor="farmName" className="block text-sm font-medium text-gray-700">
                    Farm Name
                  </label>
                  <div className="mt-1">
                    <input
                      id="farmName"
                      name="farmDetails.farmName"
                      type="text"
                      required={role === 'farmer'}
                      value={farmName}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="farmSize" className="block text-sm font-medium text-gray-700">
                    Farm Size (in acres)
                  </label>
                  <div className="mt-1">
                    <input
                      id="farmSize"
                      name="farmDetails.farmSize"
                      type="number"
                      step="0.01"
                      required={role === 'farmer'}
                      value={farmSize}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="mainCrops" className="block text-sm font-medium text-gray-700">
                    Main Crops (comma separated)
                  </label>
                  <div className="mt-1">
                    <input
                      id="mainCrops"
                      name="farmDetails.mainCrops"
                      type="text"
                      required={role === 'farmer'}
                      value={mainCrops}
                      onChange={handleChange}
                      placeholder="e.g. Tomatoes, Potatoes, Onions"
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Farm Location
                    </label>
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
                  <div className="mt-2 mb-4 rounded-lg overflow-hidden border border-gray-300" style={{ height: '250px' }}>
                    <div ref={mapContainerRef} className="w-full h-full">
                      {!mapLoaded && (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <p className="text-gray-500">Loading map...</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {locationName && (
                    <div className="mt-2 mb-4 px-3 py-2 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-sm text-green-800">
                        <span className="font-semibold">Selected location:</span> {locationName}
                      </p>
                    </div>
                  )}
                  
                  {locationError && (
                    <div className="mt-2 mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-800">{locationError}</p>
                    </div>
                  )}
                  
                  <p className="mt-1 text-xs text-gray-500">
                    Click on the map to set your farm location or use your current location
                  </p>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                  loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Registering...' : 'Register'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register; 