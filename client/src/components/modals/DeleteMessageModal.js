import React from 'react';

const DeleteMessageModal = ({ isOpen, onClose, onDeleteForMe, onDeleteForEveryone }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-backdrop modal-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xs p-4 modal-scale-in">
        <h2 className="text-lg font-medium text-gray-800 mb-4">Remove message</h2>
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => {
              onDeleteForMe();
              onClose();
            }}
            className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
          >
            Just for me
          </button>
          <button
            onClick={() => {
              onDeleteForEveryone();
              onClose();
            }}
            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
          >
            For everyone
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteMessageModal;
