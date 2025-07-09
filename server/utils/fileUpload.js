/**
 * Utility functions for file uploads
 * Note: This is a placeholder for actual file upload implementation
 * In a production environment, you would use a service like AWS S3, Cloudinary, etc.
 */

/**
 * Validates file type
 * @param {string} fileType - MIME type of the file
 * @returns {boolean} - Whether the file type is valid
 */
const isValidFileType = (fileType) => {
  const validTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  return validTypes.includes(fileType);
};

/**
 * Validates file size
 * @param {number} fileSize - Size of the file in bytes
 * @returns {boolean} - Whether the file size is valid
 */
const isValidFileSize = (fileSize) => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  return fileSize <= maxSize;
};

/**
 * Generates a unique filename
 * @param {string} originalName - Original filename
 * @returns {string} - Unique filename
 */
const generateUniqueFilename = (originalName) => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  return `${timestamp}-${randomString}.${extension}`;
};

module.exports = {
  isValidFileType,
  isValidFileSize,
  generateUniqueFilename,
};