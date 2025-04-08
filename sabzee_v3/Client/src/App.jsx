import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ChatBot from './components/ChatBot';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ProductsPage from './pages/ProductsPage';
import FarmerDashboard from './pages/FarmerDashboard';
import ProfilePage from './pages/ProfilePage';
import AddProductPage from './pages/AddProductPage';
import EditProductPage from './pages/EditProductPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CropScanPage from './pages/CropScanPage';
import CropScanHistoryPage from './pages/CropScanHistoryPage';
import CropScanDetailPage from './pages/CropScanDetailPage';
import YieldPredictionPage from './pages/YieldPredictionPage';
import YieldPredictionHistoryPage from './pages/YieldPredictionHistoryPage';
import YieldPredictionDetailPage from './pages/YieldPredictionDetailPage';
import CommunityForum from './pages/CommunityForum';
import ForumPostDetail from './pages/ForumPostDetail';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/:productId" element={<ProductDetailPage />} />
              <Route path="/products/:productId/edit" element={<EditProductPage />} />
              <Route path="/add-product" element={<AddProductPage />} />
              <Route path="/dashboard" element={<FarmerDashboard />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/crop-scan" element={<CropScanPage />} />
              <Route path="/crop-scan-history" element={<CropScanHistoryPage />} />
              <Route path="/crop-scan/:predictionId" element={<CropScanDetailPage />} />
              <Route path="/yield-prediction" element={<YieldPredictionPage />} />
              <Route path="/yield-prediction-history" element={<YieldPredictionHistoryPage />} />
              <Route path="/yield-prediction/:predictionId" element={<YieldPredictionDetailPage />} />
              <Route path="/forum" element={<CommunityForum />} />
              <Route path="/forum/:postId" element={<ForumPostDetail />} />
            </Routes>
          </main>
          <ErrorBoundary fallback={
            <div className="fixed bottom-6 right-6 z-50">
              <button
                onClick={() => window.location.reload()}
                className="bg-red-600 hover:bg-red-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-all"
                aria-label="Chatbot Error - Click to reload"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </button>
            </div>
          }>
            <ChatBot />
          </ErrorBoundary>
          <footer className="bg-gray-800 text-white py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="mb-4 md:mb-0">
                  <h2 className="text-xl font-bold">Sabzee</h2>
                  <p className="text-sm text-gray-400 mt-1">Farm to consumer, directly.</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">&copy; {new Date().getFullYear()} Sabzee. All rights reserved.</p>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
