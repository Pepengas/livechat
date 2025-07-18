import React, { useState, useEffect } from 'react';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services';

const CreateGroupModal = ({ isOpen, onClose }) => {
  const { createGroupChat } = useChat();
  const { currentUser } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle modal click outside
  const handleModalClick = (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
      onClose();
    }
  };

  // Search users
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      try {
        setSearchLoading(true);
        const response = await userService.searchUsers(searchQuery);
        // Filter out current user and already selected users
        const filteredResults = response.filter(
          user => user._id !== currentUser._id && !selectedUsers.some(selected => selected._id === user._id)
        );
        setSearchResults(filteredResults);
      } catch (err) {
        console.error('Error searching users:', err);
      } finally {
        setSearchLoading(false);
      }
    };

    const timer = setTimeout(searchUsers, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, currentUser._id, selectedUsers]);

  // Add user to selected users
  const handleUserSelect = (user) => {
    setSelectedUsers([...selectedUsers, user]);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Remove user from selected users
  const handleUserRemove = (userId) => {
    setSelectedUsers(selectedUsers.filter(user => user._id !== userId));
  };

  // Create group chat
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!groupName.trim()) {
      setError('Please enter a group name');
      return;
    }

    if (selectedUsers.length < 2) {
      setError('Please select at least 2 users');
      return;
    }

    try {
      setLoading(true);
      const userIds = selectedUsers.map(user => user._id);
      await createGroupChat(userIds, groupName);
      onClose();
      // Reset form
      setGroupName('');
      setSelectedUsers([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create group chat');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-backdrop modal-fade-in"
      onClick={handleModalClick}
    >
      <div className="bg-white dark:bg-gray-700 rounded-lg shadow-xl w-full max-w-md p-6 overflow-y-auto max-h-[90vh] modal-scale-in">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">New Group</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-200 focus:outline-none"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md dark:bg-gray-600 dark:text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Group Name */}
          <div className="mb-4">
            <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Group Name
            </label>
            <input
              type="text"
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
              placeholder="Enter group name"
              required
            />
          </div>

          {/* User Search */}
          <div className="mb-4">
            <label htmlFor="userSearch" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Add Users
            </label>
            <input
              type="text"
              id="userSearch"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
              placeholder="Search users by name or email"
            />
          </div>

          {/* Search Results */}
          {searchLoading ? (
            <div className="flex justify-center my-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            searchResults.length > 0 && (
              <div className="mb-4 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-md">
                {searchResults.map(user => (
                  <div
                    key={user._id}
                    className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                    onClick={() => handleUserSelect(user)}
                  >
                    <img 
                      src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`} 
                      alt={user.name}
                      className="h-8 w-8 rounded-full mr-3"
                    />
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Selected Users ({selectedUsers.length})
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map(user => (
                  <div
                    key={user._id}
                    className="flex items-center bg-gray-100 dark:bg-gray-600 rounded-full pl-1 pr-2 py-1"
                  >
                    <img 
                      src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`} 
                      alt={user.name}
                      className="h-6 w-6 rounded-full mr-1"
                    />
                    <span className="text-sm mr-1">{user.name}</span>
                    <button 
                      type="button" 
                      onClick={() => handleUserRemove(user._id)}
                      className="text-gray-500 dark:text-gray-300 hover:text-red-500 focus:outline-none"
                      aria-label="Remove user"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-100 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={loading || selectedUsers.length < 2}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </span>
              ) : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;