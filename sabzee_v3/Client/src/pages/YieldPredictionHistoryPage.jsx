import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { yieldPredictionApi } from '../services/api';

const YieldPredictionHistoryPage = () => {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchYieldPredictions = async () => {
      try {
        setLoading(true);
        const data = await yieldPredictionApi.getYieldPredictionHistory();
        setPredictions(data);
      } catch (err) {
        console.error('Error fetching yield prediction history:', err);
        setError(err.message || 'Failed to load yield prediction history');
      } finally {
        setLoading(false);
      }
    };
    
    if (user && user.role === 'farmer') {
      fetchYieldPredictions();
    }
  }, [user]);
  
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Yield Prediction History</h1>
            <p className="mt-2 text-lg text-gray-600">
              View your past crop yield predictions and recommendations
            </p>
          </div>
          <Link
            to="/yield-prediction"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            New Prediction
          </Link>
        </div>
        
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            <p className="mt-4 text-gray-600">Loading prediction history...</p>
          </div>
        ) : predictions.length === 0 ? (
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
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">No predictions found</h3>
              <p className="mt-1 text-sm text-gray-500">
                You haven't made any crop yield predictions yet.
              </p>
              <div className="mt-6">
                <Link
                  to="/yield-prediction"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Make Your First Prediction
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recent Yield Predictions
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Results are listed from newest to oldest
              </p>
            </div>
            <div className="border-t border-gray-200">
              <ul className="divide-y divide-gray-200">
                {predictions.map((prediction) => (
                  <li key={prediction._id}>
                    <div className="px-4 py-5 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-gray-900">
                            {prediction.crop} - {prediction.season} Season
                          </h4>
                          <div className="mt-1 flex items-center">
                            <span className="text-sm text-gray-500 mr-4">
                              {formatDate(prediction.createdAt)}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {prediction.area_of_land} acres
                            </span>
                            <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {prediction.soil_type} soil
                            </span>
                          </div>
                          <div className="mt-2 text-sm text-gray-500">
                            <div className="flex items-baseline">
                              <span className="font-medium">Predicted Yield:</span>
                              <span className="ml-2 text-green-600 font-bold">{prediction.predicted_yield_kg} kg</span>
                              <span className="ml-2 text-gray-400">
                                (Confidence: {Math.round(prediction.confidence * 100)}%)
                              </span>
                            </div>
                          </div>
                          <div className="mt-2">
                            <span className="text-sm text-gray-600 mr-2">Recommended Crops:</span>
                            <div className="flex flex-wrap mt-1 gap-1">
                              {prediction.suggested_crops.map((crop, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"
                                >
                                  {crop}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <Link
                            to={`/yield-prediction/${prediction._id}`}
                            className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default YieldPredictionHistoryPage; 