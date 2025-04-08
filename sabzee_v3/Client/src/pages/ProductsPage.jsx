import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';

const CategoryFilter = ({ categories, selectedCategory, onCategoryChange }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Categories</h3>
      <div className="space-y-2">
        <div className="flex items-center">
          <input
            id="all"
            name="category"
            type="radio"
            checked={selectedCategory === ''}
            onChange={() => onCategoryChange('')}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
          />
          <label htmlFor="all" className="ml-3 text-sm text-gray-600">
            All Categories
          </label>
        </div>
        {categories.map((category) => (
          <div key={category} className="flex items-center">
            <input
              id={category}
              name="category"
              type="radio"
              checked={selectedCategory === category}
              onChange={() => onCategoryChange(category)}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
            />
            <label htmlFor={category} className="ml-3 text-sm text-gray-600 capitalize">
              {category}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

const PriceFilter = ({ price, onPriceChange }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow mt-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Price Range</h3>
      <div className="space-y-4">
        <div>
          <label htmlFor="min-price" className="block text-sm font-medium text-gray-700">
            Min Price (₹)
          </label>
          <input
            type="number"
            id="min-price"
            name="min-price"
            value={price.min}
            onChange={(e) => onPriceChange({ ...price, min: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="max-price" className="block text-sm font-medium text-gray-700">
            Max Price (₹)
          </label>
          <input
            type="number"
            id="max-price"
            name="max-price"
            value={price.max}
            onChange={(e) => onPriceChange({ ...price, max: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
          />
        </div>
      </div>
    </div>
  );
};

const SortFilter = ({ sort, onSortChange }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow mt-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Sort By</h3>
      <div className="space-y-2">
        <div className="flex items-center">
          <input
            id="price-asc"
            name="sort"
            type="radio"
            checked={sort === 'price:asc'}
            onChange={() => onSortChange('price:asc')}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
          />
          <label htmlFor="price-asc" className="ml-3 text-sm text-gray-600">
            Price: Low to High
          </label>
        </div>
        <div className="flex items-center">
          <input
            id="price-desc"
            name="sort"
            type="radio"
            checked={sort === 'price:desc'}
            onChange={() => onSortChange('price:desc')}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
          />
          <label htmlFor="price-desc" className="ml-3 text-sm text-gray-600">
            Price: High to Low
          </label>
        </div>
        <div className="flex items-center">
          <input
            id="createdAt-desc"
            name="sort"
            type="radio"
            checked={sort === 'createdAt:desc'}
            onChange={() => onSortChange('createdAt:desc')}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
          />
          <label htmlFor="createdAt-desc" className="ml-3 text-sm text-gray-600">
            Newest First
          </label>
        </div>
        <div className="flex items-center">
          <input
            id="averageRating-desc"
            name="sort"
            type="radio"
            checked={sort === 'averageRating:desc'}
            onChange={() => onSortChange('averageRating:desc')}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
          />
          <label htmlFor="averageRating-desc" className="ml-3 text-sm text-gray-600">
            Highest Rated
          </label>
        </div>
      </div>
    </div>
  );
};

const ProductCard = ({ product }) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden group">
      <Link to={`/products/${product._id}`} className="block">
        <div className="relative aspect-w-1 aspect-h-1 h-48 bg-gray-200">
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0].url}
              alt={product.name}
              className="w-full h-full object-cover object-center group-hover:opacity-90 transition-opacity"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <span className="text-gray-500">No image</span>
            </div>
          )}
          <div className="absolute top-2 right-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              product.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {product.status === 'available' ? 'In Stock' : 'Sold Out'}
            </span>
          </div>
          {product.organic && (
            <div className="absolute top-2 left-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Organic
              </span>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-1">{product.name}</h3>
          <p className="text-gray-500 text-sm mb-2 capitalize">{product.category}</p>
          <div className="flex items-center justify-between">
            <p className="text-lg font-medium text-gray-900">₹{product.price} / {product.unit}</p>
            <div className="flex items-center">
              <svg className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="ml-1 text-sm text-gray-500">
                {product.averageRating ? product.averageRating.toFixed(1) : 'Not rated'}
              </span>
            </div>
          </div>
          <div className="mt-2 flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden">
                {product.farmer.profileImage ? (
                  <img
                    src={product.farmer.profileImage}
                    alt={product.farmer.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-green-100 text-green-600">
                    <span className="text-xs font-bold">{product.farmer.name.charAt(0).toUpperCase()}</span>
                  </div>
                )}
              </div>
            </div>
            <p className="ml-2 text-xs text-gray-500">by {product.farmer.name}</p>
          </div>
        </div>
      </Link>
    </div>
  );
};

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <nav className="flex justify-center mt-8">
      <ul className="flex space-x-2">
        <li>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded ${
              currentPage === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-green-600 hover:bg-green-50'
            }`}
          >
            Previous
          </button>
        </li>
        {pageNumbers.map((page) => (
          <li key={page}>
            <button
              onClick={() => onPageChange(page)}
              className={`px-3 py-1 rounded ${
                currentPage === page
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-green-600 hover:bg-green-50'
              }`}
            >
              {page}
            </button>
          </li>
        ))}
        <li>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded ${
              currentPage === totalPages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-green-600 hover:bg-green-50'
            }`}
          >
            Next
          </button>
        </li>
      </ul>
    </nav>
  );
};

const ProductsPage = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortOption, setSortOption] = useState('createdAt:desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const categories = ['vegetables', 'fruits', 'grains', 'dairy', 'other'];

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, priceRange, sortOption, currentPage, searchQuery]);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);

    try {
      let params = {
        page: currentPage,
        limit: 12,
        sort: sortOption
      };

      if (selectedCategory) {
        params.category = selectedCategory;
      }

      if (priceRange.min) {
        params.minPrice = priceRange.min;
      }

      if (priceRange.max) {
        params.maxPrice = priceRange.max;
      }

      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await axios.get('http://localhost:5000/api/products', { params });
      setProducts(response.data.products);
      setTotalPages(response.data.pages);
      setTotalProducts(response.data.total);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handlePriceChange = (price) => {
    setPriceRange(price);
    setCurrentPage(1);
  };

  const handleSortChange = (sort) => {
    setSortOption(sort);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setPriceRange({ min: '', max: '' });
    setSortOption('createdAt:desc');
    setSearchQuery('');
    setCurrentPage(1);
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Browse Products</h1>
          {user?.role === 'farmer' && (
            <Link
              to="/add-product"
              className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 inline-flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Product
            </Link>
          )}
        </div>

        <div className="flex flex-col md:flex-row">
          {/* Filters Sidebar */}
          <div className="w-full md:w-64 md:mr-8 mb-6 md:mb-0">
            <form onSubmit={handleSearchSubmit}>
              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="block w-full p-3 pl-10 text-sm border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    placeholder="Search products..."
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </form>

            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={handleCategoryChange}
            />

            <PriceFilter
              price={priceRange}
              onPriceChange={handlePriceChange}
            />

            <SortFilter
              sort={sortOption}
              onSortChange={handleSortChange}
            />

            <button
              onClick={clearFilters}
              className="mt-4 w-full bg-gray-200 py-2 px-4 rounded-md text-gray-700 hover:bg-gray-300"
            >
              Clear Filters
            </button>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
                <p className="mt-4 text-gray-600">Loading products...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border-l-4 border-red-500 p-4">
                <p className="text-red-700">{error}</p>
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
                <button
                  onClick={clearFilters}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <>
                <div className="mb-4 flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    Showing {products.length} of {totalProducts} products
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage; 