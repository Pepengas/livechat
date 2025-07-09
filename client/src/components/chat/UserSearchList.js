import React from 'react';
import { useSocket } from '../../hooks/useSocket';

const UserSearchList = ({ users, onUserSelect }) => {
  const { isUserOnline } = useSocket();

  return (
    <div className="divide-y divide-gray-200">
      {users.map((user) => {
        const isOnline = isUserOnline(user._id);
        
        return (
          <div 
            key={user._id}
            className="p-4 cursor-pointer hover:bg-gray-50 flex items-center"
            onClick={() => onUserSelect(user._id)}
          >
            <div className="relative">
              <img 
                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`} 
                alt={user.name}
                className="h-12 w-12 rounded-full object-cover"
              />
              {isOnline && (
                <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-400 ring-2 ring-white"></span>
              )}
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900">{user.name}</h3>
              <p className="text-sm text-gray-500">{user.email}</p>
              {user.status && (
                <p className="text-xs text-gray-400 mt-1">
                  Status: {user.status}
                </p>
              )}
            </div>
            <div className="ml-auto">
              <button 
                className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                onClick={(e) => {
                  e.stopPropagation();
                  onUserSelect(user._id);
                }}
              >
                Message
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default UserSearchList;