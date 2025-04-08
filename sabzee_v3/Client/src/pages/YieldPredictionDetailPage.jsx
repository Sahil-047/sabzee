import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { yieldPredictionApi } from '../services/api';

const YieldPredictionDetailPage = () => {
  const { predictionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchPredictionDetail = async () => {
      try {
        setLoading(true);
        const data = await yieldPredictionApi.getYieldPredictionById(predictionId);
        setPrediction(data);
      } catch (err) {
        console.error('Error fetching prediction detail:', err);
        setError(err.message || 'Failed to load prediction details');
      } finally {
        setLoading(false);
      }
    };
    
    if (user && user.role === 'farmer' && predictionId) {
      fetchPredictionDetail();
    }
  }, [predictionId, user]);
  
  // Redirect if not a farmer
  if (!user || user.role !== 'farmer') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Access Denied
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Only farmers can access yield predictions.
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
  
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const handleGoBack = () => {
    navigate('/yield-prediction-history');
  };
  
  const handleNewPrediction = () => {
    navigate('/yield-prediction');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center">
          <button
            onClick={handleGoBack}
            className="flex items-center text-gray-600 hover:text-gray-900 focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to History
          </button>
        </div>
        
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            <p className="mt-4 text-gray-600">Loading prediction details...</p>
          </div>
        ) : prediction ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Yield Prediction Details</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Created on {formatDate(prediction.createdAt)}
                </p>
              </div>
              <button
                onClick={handleNewPrediction}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                New Prediction
              </button>
            </div>
            
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                {/* Crop Information */}
                <div className="sm:col-span-3">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Crop Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Crop</dt>
                        <dd className="mt-1 text-lg font-semibold text-gray-900">{prediction.crop}</dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Season</dt>
                        <dd className="mt-1 text-lg font-semibold text-gray-900">{prediction.season}</dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Land Area</dt>
                        <dd className="mt-1 text-lg font-semibold text-gray-900">{prediction.area_of_land} acres</dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Soil Type</dt>
                        <dd className="mt-1 text-lg font-semibold text-gray-900">{prediction.soil_type}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
                
                {/* Location Information */}
                <div className="sm:col-span-3">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Location Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Latitude</dt>
                        <dd className="mt-1 text-lg font-semibold text-gray-900">{prediction.location.lat}</dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Longitude</dt>
                        <dd className="mt-1 text-lg font-semibold text-gray-900">{prediction.location.lng}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
                
                {/* Weather Conditions */}
                <div className="sm:col-span-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Weather Conditions</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-3">
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Temperature</dt>
                        <dd className="mt-1 text-lg font-semibold text-gray-900">{prediction.weather.temperature}°C</dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Humidity</dt>
                        <dd className="mt-1 text-lg font-semibold text-gray-900">{prediction.weather.humidity}%</dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Rainfall</dt>
                        <dd className="mt-1 text-lg font-semibold text-gray-900">{prediction.weather.rainfall}mm</dd>
                      </div>
                    </dl>
                  </div>
                </div>
                
                {/* Prediction Results */}
                <div className="sm:col-span-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Prediction Results</h3>
                  <div className="bg-green-50 border border-green-100 rounded-lg p-6">
                    <div className="mb-6">
                      <h4 className="text-base font-medium text-gray-700 mb-2">Estimated Yield</h4>
                      <div className="flex items-end">
                        <span className="text-4xl font-bold text-green-600">{prediction.predicted_yield_kg}</span>
                        <span className="ml-2 text-xl text-gray-500">kg</span>
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        Prediction confidence: {Math.round(prediction.confidence * 100)}%
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-base font-medium text-gray-700 mb-2">Recommended Crops</h4>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {prediction.suggested_crops.map((crop, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                          >
                            {crop}
                          </span>
                        ))}
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        These crops are recommended based on your soil type, location, and current season for optimal yield.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">Prediction not found</h3>
              <p className="mt-1 text-sm text-gray-500">
                The yield prediction you are looking for may have been deleted or does not exist.
              </p>
              <div className="mt-6">
                <Link
                  to="/yield-prediction-history"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Go to History
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default YieldPredictionDetailPage; 