import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-green-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold">Sabzee</span>
            </Link>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link to="/" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700">
                  Home
                </Link>
                <Link to="/products" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700">
                  Products
                </Link>
                <Link to="/farmers" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700">
                  Farmers
                </Link>
                {isAuthenticated && user?.role === 'farmer' && (
                  <>
                    <Link to="/dashboard" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700">
                      Dashboard
                    </Link>
                    <Link to="/crop-scan" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700">
                      Crop Scan
                    </Link>
                    <Link to="/yield-prediction" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700">
                      Yield Prediction
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {isAuthenticated ? (
                <div className="flex items-center">
                  <span className="mr-4">Hi, {user?.name}</span>
                  {user?.role === 'farmer' && (
                    <>
                      <Link to="/add-product" className="mr-4 px-3 py-1 bg-white text-green-600 rounded-md text-sm font-medium hover:bg-gray-100">
                        Add Product
                      </Link>
                      <Link to="/crop-scan-history" className="mr-4 px-3 py-1 bg-white text-green-600 rounded-md text-sm font-medium hover:bg-gray-100">
                        Scan History
                      </Link>
                      <Link to="/yield-prediction-history" className="mr-4 px-3 py-1 bg-white text-green-600 rounded-md text-sm font-medium hover:bg-gray-100">
                        Yield History
                      </Link>
                    </>
                  )}
                  <Link to="/profile" className="mr-4 px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700">
                    Profile
                  </Link>
                  <button
                    onClick={logout}
                    className="px-3 py-1 border border-white rounded-md text-sm font-medium hover:bg-green-700"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex">
                  <Link to="/login" className="px-3 py-1 border border-white rounded-md text-sm font-medium hover:bg-green-700 mr-3">
                    Login
                  </Link>
                  <Link to="/register" className="px-3 py-1 bg-white text-green-600 rounded-md text-sm font-medium hover:bg-gray-100">
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
          <div className="flex md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-green-700 focus:outline-none"
            >
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link to="/" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-green-700">
              Home
            </Link>
            <Link to="/products" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-green-700">
              Products
            </Link>
            <Link to="/farmers" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-green-700">
              Farmers
            </Link>
            {isAuthenticated && user?.role === 'farmer' && (
              <>
                <Link to="/dashboard" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-green-700">
                  Dashboard
                </Link>
                <Link to="/crop-scan" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-green-700">
                  Crop Scan
                </Link>
                <Link to="/yield-prediction" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-green-700">
                  Yield Prediction
                </Link>
              </>
            )}
          </div>
          <div className="pt-4 pb-3 border-t border-green-700">
            {isAuthenticated ? (
              <div className="flex flex-col px-2">
                <span className="block px-3 py-2 text-base font-medium">Hi, {user?.name}</span>
                <Link to="/profile" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-green-700">
                  Profile
                </Link>
                {user?.role === 'farmer' && (
                  <>
                    <Link to="/add-product" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-green-700">
                      Add Product
                    </Link>
                    <Link to="/crop-scan-history" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-green-700">
                      Scan History
                    </Link>
                    <Link to="/yield-prediction-history" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-green-700">
                      Yield History
                    </Link>
                  </>
                )}
                <button
                  onClick={logout}
                  className="mt-1 block w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-green-700"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex flex-col px-2">
                <Link to="/login" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-green-700">
                  Login
                </Link>
                <Link to="/register" className="mt-1 block px-3 py-2 rounded-md text-base font-medium hover:bg-green-700">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 