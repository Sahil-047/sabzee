import { Link } from 'react-router-dom';

const AccessDenied = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-8">
          <div className="bg-white rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">Access Denied</h1>
        </div>
        
        <div className="p-8">
          <p className="text-gray-700 mb-6">
            This section is exclusively for farmers. You don't have permission to access this area of the application.
          </p>
          
          <div className="flex flex-col space-y-3">
            <Link
              to="/"
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md"
            >
              Return to Home
            </Link>
            
            <Link
              to="/products"
              className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied; 