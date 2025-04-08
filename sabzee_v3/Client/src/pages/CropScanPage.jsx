import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { predictionApi } from '../services/api';
import { uploadImageToCloudinary } from '../utils/cloudinary';
import Webcam from 'react-webcam';

const CropScanPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const [captureMethod, setCaptureMethod] = useState('upload'); // 'upload' or 'webcam'
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState('');
  
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
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setPrediction(null); // Reset previous prediction
    }
  };
  
  const handleWebcamCapture = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      // Convert base64 to File object
      fetch(imageSrc)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], "webcam-image.jpg", { type: "image/jpeg" });
          setSelectedImage(file);
          setPreviewUrl(imageSrc);
          setPrediction(null); // Reset previous prediction
        });
    }
  };
  
  const handleScan = async () => {
    if (!selectedImage) {
      setError('Please select or capture an image first');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Upload image to Cloudinary
      const imageUrl = await uploadImageToCloudinary(selectedImage);
      
      // Send to prediction API
      const result = await predictionApi.predictDisease(imageUrl);
      
      // Set prediction results
      setPrediction(result);
    } catch (err) {
      console.error('Scan error:', err);
      setError(err.message || 'Failed to process the image. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleViewHistory = () => {
    navigate('/crop-scan-history');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Crop Disease Detection</h1>
          <p className="mt-2 text-lg text-gray-600">
            Upload or capture images of crop leaves to detect diseases
          </p>
        </div>
        
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            {/* Capture Method Selection */}
            <div className="mb-6">
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setCaptureMethod('upload')}
                  className={`py-4 px-6 font-medium text-sm focus:outline-none ${
                    captureMethod === 'upload'
                      ? 'border-b-2 border-green-500 text-green-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Upload Image
                </button>
                <button
                  onClick={() => setCaptureMethod('webcam')}
                  className={`py-4 px-6 font-medium text-sm focus:outline-none ${
                    captureMethod === 'webcam'
                      ? 'border-b-2 border-green-500 text-green-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Use Webcam
                </button>
              </div>
            </div>
            
            {/* Image Upload Section */}
            {captureMethod === 'upload' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload a clear image of the crop leaf
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          onChange={handleFileChange}
                          ref={fileInputRef}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Webcam Capture Section */}
            {captureMethod === 'webcam' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capture a clear image of the crop leaf
                </label>
                <div className="mt-1 border border-gray-300 rounded-md overflow-hidden">
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{
                      width: 720,
                      height: 480,
                      facingMode: "environment"
                    }}
                    className="w-full"
                  />
                  <div className="p-2 bg-gray-50 text-center">
                    <button
                      onClick={handleWebcamCapture}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Capture Image
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Image Preview */}
            {previewUrl && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image Preview
                </label>
                <div className="mt-1 border border-gray-300 rounded-md overflow-hidden">
                  <img 
                    src={previewUrl} 
                    alt="Crop Preview" 
                    className="w-full h-64 object-contain"
                  />
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={handleScan}
                disabled={loading || !selectedImage}
                className={`inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 w-full sm:w-auto ${
                  (loading || !selectedImage) ? 'opacity-50 cursor-not-allowed' : ''
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
                ) : 'Scan Crop'}
              </button>
              
              <button
                type="button"
                onClick={handleViewHistory}
                className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 w-full sm:w-auto"
              >
                View Scan History
              </button>
            </div>
          </div>
        </div>
        
        {/* Prediction Results */}
        {prediction && (
          <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Scan Results
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Analysis of the uploaded crop image
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">
                    Disease Detected
                  </dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900">
                    {prediction.prediction}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">
                    Confidence Score
                  </dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900">
                    {Math.round(prediction.confidence * 100)}%
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">
                    Scan Date
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(prediction.createdAt).toLocaleString()}
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

export default CropScanPage; 