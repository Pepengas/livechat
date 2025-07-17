import React from 'react';
import { useChat } from '../../hooks/useChat';
import { useSocket } from '../../hooks/useSocket';

const UserProfileModal = ({ isOpen, onClose, user }) => {
  const { accessChat } = useChat();
  const { isUserOnline } = useSocket();
  
  // Handle modal click outside
  const handleModalClick = (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
      onClose();
    }
  };

  // Start a chat with the user
  const handleStartChat = async () => {
    try {
      await accessChat(user._id);
      onClose();
    } catch (err) {
      console.error('Error starting chat:', err);
    }
  };

  if (!isOpen || !user) return null;

  const isOnline = isUserOnline(user._id);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-backdrop modal-fade-in"
      onClick={handleModalClick}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 overflow-y-auto max-h-[90vh] modal-scale-in">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Profile</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col items-center mb-6">
          <div className="relative mb-4">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200">
              <img 
                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&size=256`} 
                alt={user.name}
                className="w-full h-full object-cover"
              />
            </div>
            {isOnline && (
              <div className="absolute bottom-1 right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </div>
          <h3 className="text-xl font-bold text-gray-800">{user.name}</h3>
          <p className="text-gray-600">{user.email}</p>
          <div className="mt-2 flex items-center">
            <span className={`inline-block h-3 w-3 rounded-full mr-2 ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
            <span className="text-sm">{isOnline ? 'Online' : 'Offline'}</span>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <button
            onClick={handleStartChat}
            className="w-full py-2 px-4 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Message
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;