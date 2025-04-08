import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { userApi, farmerApi } from '../services/api';

const ProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contactNumber: '',
    farmDetails: {
      farmName: '',
      farmSize: '',
      mainCrops: [],
      location: {
        coordinates: [0, 0]
      }
    }
  });
  const [cropInput, setCropInput] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const fetchProfile = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let data;
      if (user.role === 'farmer') {
        data = await farmerApi.getFarmerProfile();
      } else {
        data = await userApi.getUserProfile();
      }
      
      setProfile(data);
      
      // Initialize form data with profile info
      setFormData({
        name: data.name || '',
        contactNumber: data.contactNumber || '',
        farmDetails: {
          farmName: data.farmDetails?.farmName || '',
          farmSize: data.farmDetails?.farmSize || '',
          mainCrops: data.farmDetails?.mainCrops || [],
          location: {
            coordinates: data.farmDetails?.location?.coordinates || [0, 0]
          }
        }
      });
      
      // Set image preview if profile image exists
      if (data.profileImage) {
        setImagePreview(data.profileImage);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('farmDetails.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        farmDetails: {
          ...formData.farmDetails,
          [field]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleAddCrop = () => {
    if (cropInput.trim() !== '' && !formData.farmDetails.mainCrops.includes(cropInput.trim())) {
      setFormData({
        ...formData,
        farmDetails: {
          ...formData.farmDetails,
          mainCrops: [...formData.farmDetails.mainCrops, cropInput.trim()]
        }
      });
      setCropInput('');
    }
  };

  const handleRemoveCrop = (cropToRemove) => {
    setFormData({
      ...formData,
      farmDetails: {
        ...formData.farmDetails,
        mainCrops: formData.farmDetails.mainCrops.filter(crop => crop !== cropToRemove)
      }
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      let updatedProfile;
      
      if (user.role === 'farmer') {
        // Create FormData object
        const formDataObj = new FormData();
        
        // Add basic fields
        formDataObj.append('name', formData.name);
        formDataObj.append('contactNumber', formData.contactNumber);
        
        // Create the farmDetails object
        const farmDetailsObj = {
          farmName: formData.farmDetails.farmName,
          farmSize: parseFloat(formData.farmDetails.farmSize),
          mainCrops: formData.farmDetails.mainCrops,
          location: {
            type: 'Point',
            coordinates: [
              parseFloat(formData.farmDetails.location.coordinates[0]),
              parseFloat(formData.farmDetails.location.coordinates[1])
            ]
          }
        };
        
        // Add farm details as a JSON string
        formDataObj.append('farmDetails', JSON.stringify(farmDetailsObj));
        
        // Add profile image if selected
        if (fileInputRef.current.files[0]) {
          formDataObj.append('profileImage', fileInputRef.current.files[0]);
        }
        
        updatedProfile = await farmerApi.updateFarmerProfile(formDataObj);
      } else {
        // Consumer profile update
        updatedProfile = await userApi.updateConsumerProfile({
          name: formData.name,
          contactNumber: formData.contactNumber
        });
      }
      
      setProfile(updatedProfile);
      await fetchProfile();
      setIsEditing(false);
      
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
        <p className="mt-4 text-gray-600">Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Access Denied
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            You need to be logged in to access this page.
          </p>
          <div className="mt-5 flex justify-center">
            <Link
              to="/login"
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">My Profile</h1>
          <p className="mt-1 text-lg text-gray-500">
            Manage your account information
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {!isEditing ? (
            // View mode
            <div>
              <div className="flex justify-between items-center px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Profile Information
                </h3>
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Edit Profile
                </button>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center mb-6">
                  <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                    {profile.profileImage ? (
                      <img
                        src={profile.profileImage}
                        alt={profile.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-green-100 text-green-600">
                        <span className="text-xl font-bold">{profile.name.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                  <div className="ml-6">
                    <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
                    <p className="text-sm text-gray-500 capitalize">{profile.role}</p>
                  </div>
                </div>

                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">{profile.email}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Contact Number</dt>
                    <dd className="mt-1 text-sm text-gray-900">{profile.contactNumber}</dd>
                  </div>

                  {user.role === 'farmer' && profile.farmDetails && (
                    <>
                      <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500">Farm Details</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          <div className="border border-gray-200 rounded-md p-4">
                            <div className="mb-3">
                              <span className="font-medium">Farm Name:</span> {profile.farmDetails.farmName || 'Not specified'}
                            </div>
                            <div className="mb-3">
                              <span className="font-medium">Farm Size:</span> {profile.farmDetails.farmSize ? `${profile.farmDetails.farmSize} acres` : 'Not specified'}
                            </div>
                            <div className="mb-3">
                              <span className="font-medium">Location:</span>{' '}
                              {profile.farmDetails.location?.coordinates ? (
                                <span>
                                  {profile.farmDetails.location.coordinates[0].toFixed(4)}°E, {profile.farmDetails.location.coordinates[1].toFixed(4)}°N
                                </span>
                              ) : (
                                'Not specified'
                              )}
                            </div>
                            <div>
                              <span className="font-medium">Main Crops:</span>
                              {profile.farmDetails.mainCrops && profile.farmDetails.mainCrops.length > 0 ? (
                                <div className="mt-1 flex flex-wrap gap-2">
                                  {profile.farmDetails.mainCrops.map((crop, index) => (
                                    <span
                                      key={index}
                                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                                    >
                                      {crop}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="ml-1 text-gray-500">Not specified</span>
                              )}
                            </div>
                          </div>
                        </dd>
                      </div>
                    </>
                  )}
                </dl>
              </div>
            </div>
          ) : (
            // Edit mode
            <form onSubmit={handleSubmit}>
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Edit Profile
                </h3>
              </div>
              <div className="px-4 py-5 sm:p-6">
                {user.role === 'farmer' && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profile Image
                    </label>
                    <div className="flex items-center">
                      <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                        {imagePreview ? (
                          <img
                            src={imagePreview}
                            alt="Profile preview"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-green-100 text-green-600">
                            <span className="text-xl font-bold">{formData.name.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                      </div>
                      <div className="ml-5">
                        <div className="relative">
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            className="hidden"
                            accept="image/*"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current.click()}
                            className="bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            Change
                          </button>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          JPG, PNG, GIF up to 2MB
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="name"
                        id="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700">
                      Contact Number
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="contactNumber"
                        id="contactNumber"
                        value={formData.contactNumber}
                        onChange={handleChange}
                        required
                        className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  {user.role === 'farmer' && (
                    <>
                      <div className="sm:col-span-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-3">Farm Details</h3>
                      </div>

                      <div className="sm:col-span-3">
                        <label htmlFor="farmDetails.farmName" className="block text-sm font-medium text-gray-700">
                          Farm Name
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            name="farmDetails.farmName"
                            id="farmDetails.farmName"
                            value={formData.farmDetails.farmName}
                            onChange={handleChange}
                            required
                            className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-3">
                        <label htmlFor="farmDetails.farmSize" className="block text-sm font-medium text-gray-700">
                          Farm Size (acres)
                        </label>
                        <div className="mt-1">
                          <input
                            type="number"
                            name="farmDetails.farmSize"
                            id="farmDetails.farmSize"
                            value={formData.farmDetails.farmSize}
                            onChange={handleChange}
                            className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-6">
                        <label className="block text-sm font-medium text-gray-700">
                          Farm Location
                        </label>
                        <div className="mt-1 grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="longitude" className="block text-sm font-medium text-gray-700">
                              Longitude (°E)
                            </label>
                            <input
                              type="number"
                              step="0.000001"
                              value={formData.farmDetails.location.coordinates[0]}
                              onChange={(e) => {
                                const newCoords = [...formData.farmDetails.location.coordinates];
                                newCoords[0] = parseFloat(e.target.value);
                                setFormData({
                                  ...formData,
                                  farmDetails: {
                                    ...formData.farmDetails,
                                    location: {
                                      ...formData.farmDetails.location,
                                      coordinates: newCoords
                                    }
                                  }
                                });
                              }}
                              placeholder="e.g. 88.3639"
                              className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label htmlFor="latitude" className="block text-sm font-medium text-gray-700">
                              Latitude (°N)
                            </label>
                            <input
                              type="number"
                              step="0.000001"
                              value={formData.farmDetails.location.coordinates[1]}
                              onChange={(e) => {
                                const newCoords = [...formData.farmDetails.location.coordinates];
                                newCoords[1] = parseFloat(e.target.value);
                                setFormData({
                                  ...formData,
                                  farmDetails: {
                                    ...formData.farmDetails,
                                    location: {
                                      ...formData.farmDetails.location,
                                      coordinates: newCoords
                                    }
                                  }
                                });
                              }}
                              placeholder="e.g. 22.5726"
                              className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="sm:col-span-6">
                        <label htmlFor="mainCrops" className="block text-sm font-medium text-gray-700">
                          Main Crops
                        </label>
                        <div className="mt-1">
                          <div className="flex">
                            <input
                              type="text"
                              value={cropInput}
                              onChange={(e) => setCropInput(e.target.value)}
                              placeholder="Add a crop"
                              className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            />
                            <button
                              type="button"
                              onClick={handleAddCrop}
                              className="ml-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                              Add
                            </button>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {formData.farmDetails.mainCrops.map((crop, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                              >
                                {crop}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCrop(crop)}
                                  className="ml-1.5 inline-flex text-green-400 hover:text-green-600 focus:outline-none"
                                >
                                  <span className="sr-only">Remove</span>
                                  &times;
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="mr-3 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  {isLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 