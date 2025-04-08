/**
 * Uploads an image file to Cloudinary and returns the secure URL.
 * @param {File} file - The image file to upload
 * @returns {Promise<string>} The secure URL of the uploaded image
 */
export const uploadImageToCloudinary = async (file) => {
  // Get Cloudinary configuration from environment variables
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  // Validate configuration
  if (!cloudName || !uploadPreset) {
    console.error('Cloudinary configuration missing');
    throw new Error('Image upload service is not properly configured');
  }

  // Create a FormData instance for the file upload
  const formData = new FormData();
  formData.append('upload_preset', uploadPreset);
  formData.append('file', file);
  
  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Cloudinary upload failed:', errorData);
      throw new Error(errorData.error?.message || 'Failed to upload image');
    }
    
    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    if (error.message.includes('configuration')) {
      throw error;
    }
    throw new Error('Image upload failed. Please try again.');
  }
}; 