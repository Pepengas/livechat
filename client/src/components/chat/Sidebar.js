import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useChat } from '../../hooks/useChat';
import { useDebounce } from '../../hooks/useDebounce';
import { userService } from '../../services';
import { useTheme } from '../../hooks/useTheme';

// Components
import ChatList from './ChatList';
import UserSearchList from './UserSearchList';
import LoadingSpinner from '../common/LoadingSpinner';
import OverflowMenu from '../common/OverflowMenu';

const Sidebar = ({ 
  isMobileMenuOpen, 
  toggleMobileMenu, 
  openProfileModal, 
  openCreateGroupModal,
  openUserProfileModal 
}) => {
  const { currentUser, logout } = useAuth();
  const { chats, chatLoading, fetchChats, createOrAccessChat, getTotalUnreadCount } = useChat();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const overflowBtnRef = useRef(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [activeTab, setActiveTab] = useState('chats'); // 'chats' or 'search'
  
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Handle search when debounced query changes
  useEffect(() => {
    if (debouncedSearchQuery) {
      handleSearch();
    } else {
      setSearchResults([]);
      if (activeTab === 'search') {
        setActiveTab('chats');
      }
    }
  }, [debouncedSearchQuery]);

  const handleSearch = async () => {
    if (!debouncedSearchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchError('');
    setActiveTab('search');
    
    try {
      const results = await userService.searchUsers(debouncedSearchQuery);
      // Filter out current user from results
      setSearchResults(results.filter(user => user._id !== currentUser._id));
    } catch (err) {
      console.error('Search error:', err);
      setSearchError('Failed to search users');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleUserSelect = async (userId) => {
    try {
      await createOrAccessChat(userId);
      setSearchQuery('');
      setActiveTab('chats');
    } catch (err) {
      console.error('Error accessing chat:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <div
      className={`fixed md:static inset-y-0 left-0 z-30 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 w-64 md:w-80 bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 border-r border-gray-200 dark:border-gray-600 flex flex-col h-full shadow-lg`}
    >
      {/* Header */}
      <div
        className="border-b border-gray-200 dark:border-gray-600 grid grid-cols-[48px_1fr_auto] items-center gap-3 px-4 pb-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
      >
        <img
          src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'User')}&background=random`}
          alt={currentUser?.name}
          className="h-12 w-12 rounded-full object-cover shrink-0"
        />
        <div className="min-w-0">
          <h2 className="font-bold text-base text-gray-800 dark:text-gray-100 truncate">
            {currentUser?.name || 'User'}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">{currentUser?.status || 'Online'}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <div className="flex items-center gap-1 max-[480px]:hidden">
            <button
              onClick={openProfileModal}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
              aria-label="Profile"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
              aria-label="Logout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4.22 2.22a1 1 0 011.42 0l.7.7a1 1 0 11-1.42 1.42l-.7-.7a1 1 0 010-1.42zM17 9a1 1 0 100 2h1a1 1 0 100-2h-1zM4.22 4.22a1 1 0 00-1.42 1.42l.7.7a1 1 0 001.42-1.42l-.7-.7zM3 9a1 1 0 100 2H2a1 1 0 100-2h1zm1.22 6.78a1 1 0 011.42 0l.7.7a1 1 0 01-1.42 1.42l-.7-.7a1 1 0 010-1.42zM10 17a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm6.78-1.22a1 1 0 00-1.42-1.42l-.7.7a1 1 0 001.42 1.42l.7-.7zM10 5a5 5 0 100 10 5 5 0 000-10z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-800" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
                </svg>
              )}
            </button>
          </div>
          <div className="min-[481px]:hidden">
            <button
              ref={overflowBtnRef}
              onClick={() => setMenuOpen(true)}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
              aria-label="Menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6h.01M12 12h.01M12 18h.01" />
              </svg>
            </button>
          </div>
          <button
            onClick={toggleMobileMenu}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 hidden max-[480px]:block"
            aria-label="Close menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <OverflowMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        anchorEl={overflowBtnRef.current}
      >
        <button
          onClick={() => { setMenuOpen(false); openProfileModal(); }}
          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
        >
          Profile
        </button>
        <button
          onClick={() => { setMenuOpen(false); }}
          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
        >
          Settings
        </button>
        <button
          onClick={() => { setMenuOpen(false); toggleTheme(); }}
          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
        >
          Theme
        </button>
        <button
          onClick={() => { setMenuOpen(false); handleLogout(); }}
          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
        >
          Logout
        </button>
      </OverflowMenu>
      
      {/* Search */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-600">
        <div className="relative">
          <input
            type="text"
            placeholder="Search users..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-500 dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-gray-100"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        <div className="flex justify-between mt-4">
          <button
            className={`flex-1 py-2 text-sm font-medium ${activeTab === 'chats' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
            onClick={() => setActiveTab('chats')}
          >
            Chats
            {getTotalUnreadCount() > 0 && (
              <span className="ml-1 bg-primary-600 text-white text-xs rounded-full px-2 py-0.5">
                {getTotalUnreadCount()}
              </span>
            )}
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium ${activeTab === 'search' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
            onClick={() => {
              if (searchQuery) {
                setActiveTab('search');
                handleSearch();
              }
            }}
            disabled={!searchQuery}
          >
            Search Results
          </button>
        </div>
      </div>
      
      {/* Create Group Button */}
      <div className="px-4 py-2">
        <button
          onClick={openCreateGroupModal}
          className="w-full flex items-center justify-center py-3 px-4 text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-primary-500 to-primary-700 shadow-md hover:shadow-lg transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Group
        </button>
      </div>
      
      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'chats' ? (
          // Chat List
          chatLoading ? (
            <div className="flex justify-center items-center h-32">
              <LoadingSpinner />
            </div>
          ) : chats.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="mt-2">No chats yet</p>
              <p className="text-sm">Search for users to start chatting</p>
            </div>
          ) : (
            <ChatList
              chats={chats}
              openUserProfileModal={openUserProfileModal}
              onChatSelect={() => {
                if (isMobileMenuOpen) toggleMobileMenu();
              }}
            />
          )
        ) : (
          // Search Results
          isSearching ? (
            <div className="flex justify-center items-center h-32">
              <LoadingSpinner />
            </div>
          ) : searchError ? (
            <div className="text-center py-8 text-red-500">
              <p>{searchError}</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No users found</p>
            </div>
          ) : (
            <UserSearchList users={searchResults} onUserSelect={handleUserSelect} />
          )
        )}
      </div>
    </div>
  );
};

export default Sidebar;