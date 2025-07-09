import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services';
import { useSocket } from '../../hooks/useSocket';

const GroupInfoModal = ({ isOpen, onClose, chat }) => {
  const { currentUser } = useAuth();
  const { isUserOnline } = useSocket();
  const { 
    renameGroupChat, 
    addUserToGroup, 
    removeUserFromGroup, 
    leaveGroup,
    updateGroupAvatar
  } = useChat();
  
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  // Initialize state when chat changes
  useEffect(() => {
    if (chat) {
      setGroupName(chat.chatName);
      setAvatarPreview(chat.groupAvatar || null);
    }
  }, [chat]);

  // Handle modal click outside
  const handleModalClick = (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
      onClose();
    }
  };

  // Check if current user is admin
  const isAdmin = chat?.groupAdmin?._id === currentUser?._id;

  // Search users
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim() || !chat) {
        setSearchResults([]);
        return;
      }

      try {
        setSearchLoading(true);
        const response = await userService.searchUsers(searchQuery);
        // Filter out users already in the group
        const filteredResults = response.filter(
          user => !chat.users.some(groupUser => groupUser._id === user._id)
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
  }, [searchQuery, chat]);

  // Handle avatar change
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError('Avatar image must be less than 5MB');
      return;
    }

    if (!file.type.match('image.*')) {
      setError('Please select an image file');
      return;
    }

    setAvatar(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  // Update group name
  const handleUpdateGroupName = async () => {
    if (!groupName.trim() || groupName === chat.chatName) return;

    try {
      setLoading(true);
      setError('');
      await renameGroupChat(chat._id, groupName);
      setSuccess('Group name updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update group name');
    } finally {
      setLoading(false);
    }
  };

  // Update group avatar
  const handleUpdateAvatar = async () => {
    if (!avatar) return;

    try {
      setLoading(true);
      setError('');
      await updateGroupAvatar(chat._id, avatar);
      setSuccess('Group avatar updated successfully');
      setTimeout(() => setSuccess(''), 3000);
      setAvatar(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update group avatar');
    } finally {
      setLoading(false);
    }
  };

  // Add user to group
  const handleAddUser = async (userId) => {
    try {
      setLoading(true);
      setError('');
      await addUserToGroup(chat._id, userId);
      setSearchQuery('');
      setSearchResults([]);
      setSuccess('User added to group successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add user to group');
    } finally {
      setLoading(false);
    }
  };

  // Remove user from group
  const handleRemoveUser = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this user from the group?')) return;

    try {
      setLoading(true);
      setError('');
      await removeUserFromGroup(chat._id, userId);
      setSuccess('User removed from group successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove user from group');
    } finally {
      setLoading(false);
    }
  };

  // Leave group
  const handleLeaveGroup = async () => {
    if (!window.confirm('Are you sure you want to leave this group?')) return;

    try {
      setLoading(true);
      await leaveGroup(chat._id);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to leave group');
      setLoading(false);
    }
  };

  if (!isOpen || !chat) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-backdrop"
      onClick={handleModalClick}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Group Info</h2>
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

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
            {success}
          </div>
        )}

        {/* Group Avatar */}
        <div className="flex flex-col items-center mb-6">
          <div 
            className={`relative w-24 h-24 mb-3 rounded-full overflow-hidden bg-gray-200 ${isAdmin ? 'cursor-pointer' : ''}`}
            onClick={isAdmin ? () => fileInputRef.current.click() : undefined}
          >
            {avatarPreview ? (
              <img 
                src={avatarPreview} 
                alt="Group Avatar" 
                className="w-full h-full object-cover"
              />
            ) : (
              <img 
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(chat.chatName)}&background=random`}
                alt="Group Avatar"
                className="w-full h-full object-cover"
              />
            )}
            {isAdmin && (
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            )}
          </div>
          {isAdmin && (
            <>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleAvatarChange} 
                className="hidden" 
                accept="image/*"
              />
              {avatar && (
                <button
                  onClick={handleUpdateAvatar}
                  className="mt-2 px-3 py-1 text-xs font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Avatar'}
                </button>
              )}
            </>
          )}
        </div>

        {/* Group Name */}
        <div className="mb-6">
          <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 mb-1">
            Group Name
          </label>
          <div className="flex">
            <input
              type="text"
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={!isAdmin || loading}
            />
            {isAdmin && (
              <button
                onClick={handleUpdateGroupName}
                className="px-3 py-2 bg-primary-600 text-white rounded-r-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={loading || !groupName.trim() || groupName === chat.chatName}
              >
                Update
              </button>
            )}
          </div>
        </div>

        {/* Group Admin */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Group Admin</h3>
          <div className="flex items-center p-3 bg-gray-50 rounded-md">
            <img 
              src={chat.groupAdmin?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.groupAdmin?.name)}&background=random`} 
              alt={chat.groupAdmin?.name}
              className="h-10 w-10 rounded-full mr-3"
            />
            <div>
              <div className="font-medium">{chat.groupAdmin?.name}</div>
              <div className="text-xs text-gray-500">{chat.groupAdmin?.email}</div>
            </div>
          </div>
        </div>

        {/* Group Members */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Group Members ({chat.users.length})
          </h3>
          <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
            {chat.users.map(user => {
              const isUserAdmin = user._id === chat.groupAdmin?._id;
              const isCurrentUser = user._id === currentUser._id;
              const online = isUserOnline(user._id);
              
              return (
                <div 
                  key={user._id} 
                  className="flex items-center justify-between p-3 hover:bg-gray-50 border-b border-gray-200 last:border-b-0"
                >
                  <div className="flex items-center">
                    <div className="relative">
                      <img 
                        src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`} 
                        alt={user.name}
                        className="h-10 w-10 rounded-full mr-3"
                      />
                      {online && (
                        <div className="absolute bottom-0 right-2 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium flex items-center">
                        {user.name}
                        {isUserAdmin && (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-primary-100 text-primary-800 rounded-full">
                            Admin
                          </span>
                        )}
                        {isCurrentUser && (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-800 rounded-full">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center">
                        <span className={`inline-block h-2 w-2 rounded-full mr-1 ${online ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                        <span>{online ? 'Online' : 'Offline'}</span>
                      </div>
                    </div>
                  </div>
                  
                  {isAdmin && !isUserAdmin && !isCurrentUser && (
                    <button
                      onClick={() => handleRemoveUser(user._id)}
                      className="text-red-500 hover:text-red-700 focus:outline-none"
                      disabled={loading}
                      aria-label="Remove user"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Add Users (Admin only) */}
        {isAdmin && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Add Users</h3>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 mb-2"
              placeholder="Search users by name or email"
              disabled={loading}
            />
            
            {searchLoading ? (
              <div className="flex justify-center my-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              searchResults.length > 0 && (
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md">
                  {searchResults.map(user => (
                    <div 
                      key={user._id} 
                      className="flex items-center justify-between p-3 hover:bg-gray-50 border-b border-gray-200 last:border-b-0"
                    >
                      <div className="flex items-center">
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
                      <button
                        onClick={() => handleAddUser(user._id)}
                        className="text-primary-600 hover:text-primary-800 focus:outline-none"
                        disabled={loading}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        )}

        {/* Leave Group */}
        <div className="border-t border-gray-200 pt-4">
          <button
            onClick={handleLeaveGroup}
            className="w-full py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center justify-center"
            disabled={loading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Leave Group
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupInfoModal;