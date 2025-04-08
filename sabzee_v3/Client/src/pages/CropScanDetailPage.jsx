import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { predictionApi } from '../services/api';

const CropScanDetailPage = () => {
  const { predictionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        setLoading(true);
        const data = await predictionApi.getPredictionById(predictionId);
        setPrediction(data);
      } catch (err) {
        console.error('Error fetching prediction:', err);
        setError(err.message || 'Failed to load prediction details');
      } finally {
        setLoading(false);
      }
    };
    
    if (user && user.role === 'farmer' && predictionId) {
      fetchPrediction();
    }
  }, [user, predictionId]);
  
  // Redirect if not a farmer
  if (!user || user.role !== 'farmer') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Access Denied
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Only farmers can access the crop disease detection tool.
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
      minute: '2-digit',
      second: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
        <p className="mt-4 text-gray-600">Loading prediction details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
          <button
            onClick={() => navigate('/crop-scan-history')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Back to History
          </button>
        </div>
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900">Prediction Not Found</h2>
            <p className="mt-2 text-gray-600">The prediction you're looking for doesn't exist or you don't have permission to view it.</p>
            <button
              onClick={() => navigate('/crop-scan-history')}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Back to History
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link to="/crop-scan-history" className="text-green-600 hover:text-green-700 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Scan History
          </Link>
        </div>
        
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Crop Disease Detection Result
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Detailed information about your crop scan
            </p>
          </div>
          
          <div className="border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
              <div className="md:col-span-1">
                <div className="border rounded-lg overflow-hidden">
                  <img 
                    src={prediction.imageUrl} 
                    alt="Crop scan" 
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
              
              <div className="md:col-span-1">
                <dl className="divide-y divide-gray-200">
                  <div className="py-4 sm:py-5 grid grid-cols-3 gap-4">
                    <dt className="text-sm font-medium text-gray-500">Disease</dt>
                    <dd className="text-sm font-bold text-gray-900 col-span-2">{prediction.prediction}</dd>
                  </div>
                  
                  <div className="py-4 sm:py-5 grid grid-cols-3 gap-4">
                    <dt className="text-sm font-medium text-gray-500">Confidence</dt>
                    <dd className="text-sm text-gray-900 col-span-2">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                          <div 
                            className="bg-green-600 h-2.5 rounded-full" 
                            style={{ width: `${Math.round(prediction.confidence * 100)}%` }}
                          ></div>
                        </div>
                        <span>{Math.round(prediction.confidence * 100)}%</span>
                      </div>
                    </dd>
                  </div>
                  
                  <div className="py-4 sm:py-5 grid grid-cols-3 gap-4">
                    <dt className="text-sm font-medium text-gray-500">Scan Date</dt>
                    <dd className="text-sm text-gray-900 col-span-2">{formatDate(prediction.createdAt)}</dd>
                  </div>
                  
                  {prediction.updatedAt && prediction.updatedAt !== prediction.createdAt && (
                    <div className="py-4 sm:py-5 grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                      <dd className="text-sm text-gray-900 col-span-2">{formatDate(prediction.updatedAt)}</dd>
                    </div>
                  )}
                  
                  <div className="py-4 sm:py-5 grid grid-cols-3 gap-4">
                    <dt className="text-sm font-medium text-gray-500">ID</dt>
                    <dd className="text-sm text-gray-900 col-span-2 break-all">{prediction._id}</dd>
                  </div>
                </dl>
              </div>
            </div>
            
            {/* Recommended Actions Section - This would be populated with real data in a production app */}
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Recommended Actions</h4>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Action Required</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      Based on the detected disease, we recommend immediate treatment to prevent spread.
                    </p>
                  </div>
                </div>
              </div>
              
              <ul className="divide-y divide-gray-200">
                <li className="py-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Isolate Affected Plants</p>
                      <p className="mt-1 text-sm text-gray-500">Remove affected plants from healthy ones to prevent disease spread.</p>
                    </div>
                  </div>
                </li>
                
                <li className="py-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Apply Appropriate Treatment</p>
                      <p className="mt-1 text-sm text-gray-500">Use fungicide or appropriate treatment specific to the detected disease.</p>
                    </div>
                  </div>
                </li>
                
                <li className="py-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Monitor Regularly</p>
                      <p className="mt-1 text-sm text-gray-500">Check crops regularly for signs of disease progression or improvement.</p>
                    </div>
                  </div>
                </li>
              </ul>
              
              <div className="mt-6">
                <Link
                  to="/crop-scan"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Scan Another Crop
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CropScanDetailPage; 