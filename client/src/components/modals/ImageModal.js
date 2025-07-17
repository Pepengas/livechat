import React from 'react';

const ImageModal = ({ isOpen, imageUrl, onClose }) => {
  if (!isOpen) return null;

  const handleClick = (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 modal-backdrop modal-fade-in"
      onClick={handleClick}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 text-white hover:text-gray-300"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <img
        src={imageUrl}
        alt="Image"
        className="max-h-[90vh] max-w-full object-contain rounded-lg shadow-lg modal-scale-in"
      />
    </div>
  );
};

export default ImageModal;
