import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { productApi } from '../services/api';

const EditProductPage = () => {
  const { productId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [currentImages, setCurrentImages] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    unit: '',
    quantity: '',
    harvestDate: '',
    organic: false,
    certifications: []
  });
  
  const [certificationData, setCertificationData] = useState({
    name: '',
    certificationNumber: '',
    issuedDate: '',
    expiryDate: ''
  });

  const categories = ['vegetables', 'fruits', 'grains', 'dairy', 'other'];
  const units = ['kg', 'gram', 'piece', 'dozen', 'liter'];

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const product = await productApi.getProductById(productId);
        
        // Only check if user is a farmer, since they can only access this from their dashboard
        if (!user || user.role !== 'farmer') {
          setError('Only farmers can edit products');
          return;
        }
        
        // Format harvest date for form input
        const harvestDate = new Date(product.harvestDate);
        const formattedDate = harvestDate.toISOString().split('T')[0];
        
        setFormData({
          name: product.name,
          description: product.description,
          category: product.category,
          price: product.price,
          unit: product.unit,
          quantity: product.quantity,
          harvestDate: formattedDate,
          organic: product.organic || false,
          certifications: product.certifications || []
        });
        
        setCurrentImages(product.images || []);
        
      } catch (error) {
        console.error('Error fetching product:', error);
        setError('Failed to load product data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [productId, user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleCertificationChange = (e) => {
    const { name, value } = e.target;
    setCertificationData({
      ...certificationData,
      [name]: value
    });
  };

  const handleAddCertification = () => {
    if (certificationData.name && certificationData.certificationNumber) {
      setFormData({
        ...formData,
        certifications: [...formData.certifications, { ...certificationData }]
      });
      setCertificationData({
        name: '',
        certificationNumber: '',
        issuedDate: '',
        expiryDate: ''
      });
    }
  };

  const handleRemoveCertification = (index) => {
    setFormData({
      ...formData,
      certifications: formData.certifications.filter((_, i) => i !== index)
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      setError('Maximum 5 images allowed');
      return;
    }

    // Clear existing new image previews
    setImagePreviews([]);
    
    // Generate previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      await productApi.updateProduct(productId, {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        price: parseFloat(formData.price),
        unit: formData.unit,
        quantity: parseInt(formData.quantity),
        harvestDate: new Date(formData.harvestDate).toISOString(),
        organic: formData.organic,
        certifications: formData.certifications
      });

      navigate(`/products/${productId}`);
    } catch (error) {
      console.error('Error updating product:', error);
      setError(error.response?.data?.message || 'Failed to update product');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await productApi.deleteProduct(productId);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting product:', error);
      setError(error.response?.data?.message || 'Failed to delete product');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
        <p className="mt-4 text-gray-600">Loading product data...</p>
      </div>
    );
  }

  if (!user || user.role !== 'farmer') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-lg text-gray-600">
            Only farmers can edit products.
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Error</h2>
          <p className="mt-2 text-lg text-gray-600">
            {error}
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Edit Product</h1>
          <p className="mt-1 text-lg text-gray-500">
            Update your product information
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <form onSubmit={handleSubmit}>
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Product Information
              </h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Product Name
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
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <div className="mt-1">
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                      className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="sm:col-span-6">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="description"
                      name="description"
                      rows="4"
                      value={formData.description}
                      onChange={handleChange}
                      required
                      className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                    Price (₹)
                  </label>
                  <div className="mt-1">
                    <input
                      type="number"
                      name="price"
                      id="price"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={handleChange}
                      required
                      className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="unit" className="block text-sm font-medium text-gray-700">
                    Unit
                  </label>
                  <div className="mt-1">
                    <select
                      id="unit"
                      name="unit"
                      value={formData.unit}
                      onChange={handleChange}
                      required
                      className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    >
                      {units.map(unit => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                    Available Quantity
                  </label>
                  <div className="mt-1">
                    <input
                      type="number"
                      name="quantity"
                      id="quantity"
                      min="0"
                      value={formData.quantity}
                      onChange={handleChange}
                      required
                      className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="harvestDate" className="block text-sm font-medium text-gray-700">
                    Harvest Date
                  </label>
                  <div className="mt-1">
                    <input
                      type="date"
                      name="harvestDate"
                      id="harvestDate"
                      value={formData.harvestDate}
                      onChange={handleChange}
                      required
                      className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <div className="flex items-center h-full mt-6">
                    <input
                      id="organic"
                      name="organic"
                      type="checkbox"
                      checked={formData.organic}
                      onChange={handleChange}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor="organic" className="ml-2 block text-sm text-gray-900">
                      This product is organic
                    </label>
                  </div>
                </div>

                <div className="sm:col-span-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Current Images</h4>
                  {currentImages.length > 0 ? (
                    <div className="grid grid-cols-5 gap-4">
                      {currentImages.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={image.url}
                            alt={`Product ${index + 1}`}
                            className="h-24 w-24 object-cover rounded-md"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No images available</p>
                  )}
                  
                  {/* Disabled for now - image update requires additional server-side handling */}
                  {/* 
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Update Images (Max 5)
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
                            htmlFor="images"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500"
                          >
                            <span>Upload new images</span>
                            <input
                              id="images"
                              name="images"
                              type="file"
                              ref={fileInputRef}
                              multiple
                              accept="image/*"
                              onChange={handleImageChange}
                              className="sr-only"
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF up to 5MB each
                        </p>
                      </div>
                    </div>

                    {imagePreviews.length > 0 && (
                      <div className="mt-4 grid grid-cols-5 gap-4">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="relative">
                            <img
                              src={preview}
                              alt={`New preview ${index + 1}`}
                              className="h-24 w-24 object-cover rounded-md"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  */}
                </div>

                {/* Certifications Section */}
                <div className="sm:col-span-6 border-t pt-5">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Certifications</h3>
                  
                  {formData.certifications.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Added Certifications</h4>
                      <ul className="divide-y divide-gray-200 border rounded-md">
                        {formData.certifications.map((cert, index) => (
                          <li key={index} className="px-4 py-3 flex justify-between items-center">
                            <div>
                              <p className="font-medium">{cert.name}</p>
                              <p className="text-sm text-gray-500">#{cert.certificationNumber}</p>
                              {cert.issuedDate && cert.expiryDate && (
                                <p className="text-xs text-gray-500">
                                  Valid: {new Date(cert.issuedDate).toLocaleDateString()} to {new Date(cert.expiryDate).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveCertification(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-6 border p-4 rounded-md bg-gray-50">
                    <div className="sm:col-span-3">
                      <label htmlFor="certName" className="block text-sm font-medium text-gray-700">
                        Certification Name
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id="certName"
                          name="name"
                          value={certificationData.name}
                          onChange={handleCertificationChange}
                          className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder="e.g. Organic, FSSAI"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="certNumber" className="block text-sm font-medium text-gray-700">
                        Certification Number
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id="certNumber"
                          name="certificationNumber"
                          value={certificationData.certificationNumber}
                          onChange={handleCertificationChange}
                          className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="issuedDate" className="block text-sm font-medium text-gray-700">
                        Issued Date
                      </label>
                      <div className="mt-1">
                        <input
                          type="date"
                          id="issuedDate"
                          name="issuedDate"
                          value={certificationData.issuedDate}
                          onChange={handleCertificationChange}
                          className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700">
                        Expiry Date
                      </label>
                      <div className="mt-1">
                        <input
                          type="date"
                          id="expiryDate"
                          name="expiryDate"
                          value={certificationData.expiryDate}
                          onChange={handleCertificationChange}
                          className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-6 flex justify-end">
                      <button
                        type="button"
                        onClick={handleAddCertification}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        Add Certification
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 flex justify-between">
              <button
                type="button"
                onClick={handleDeleteProduct}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete Product
              </button>

              <div>
                <button
                  type="button"
                  onClick={() => navigate(`/products/${productId}`)}
                  className="mr-3 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProductPage; 