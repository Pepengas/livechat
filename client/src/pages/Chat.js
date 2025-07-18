import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat';

// Components
import Sidebar from '../components/chat/Sidebar';
import ChatArea from '../components/chat/ChatArea';
import ProfileModal from '../components/modals/ProfileModal';
import CreateGroupModal from '../components/modals/CreateGroupModal';
import UserProfileModal from '../components/modals/UserProfileModal';
import GroupInfoModal from '../components/modals/GroupInfoModal';

const Chat = () => {
  const { currentUser } = useAuth();
  const { selectedChat } = useChat();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState(false);
  const [isGroupInfoModalOpen, setIsGroupInfoModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Close mobile menu when a chat is selected
  useEffect(() => {
    if (selectedChat && isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }, [selectedChat]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const openProfileModal = () => {
    setIsProfileModalOpen(true);
  };

  const closeProfileModal = () => {
    setIsProfileModalOpen(false);
  };

  const openCreateGroupModal = () => {
    setIsCreateGroupModalOpen(true);
  };

  const closeCreateGroupModal = () => {
    setIsCreateGroupModalOpen(false);
  };

  const openUserProfileModal = (user) => {
    setSelectedUser(user);
    setIsUserProfileModalOpen(true);
  };

  const closeUserProfileModal = () => {
    setIsUserProfileModalOpen(false);
    setSelectedUser(null);
  };

  const openGroupInfoModal = () => {
    setIsGroupInfoModalOpen(true);
  };

  const closeGroupInfoModal = () => {
    setIsGroupInfoModalOpen(false);
  };

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <Sidebar 
        isMobileMenuOpen={isMobileMenuOpen}
        toggleMobileMenu={toggleMobileMenu}
        openProfileModal={openProfileModal}
        openCreateGroupModal={openCreateGroupModal}
        openUserProfileModal={openUserProfileModal}
      />

      {/* Chat Area */}
      <ChatArea 
        toggleMobileMenu={toggleMobileMenu}
        openUserProfileModal={openUserProfileModal}
        openGroupInfoModal={openGroupInfoModal}
      />

      {/* Modals */}
      {isProfileModalOpen && (
        <ProfileModal 
          isOpen={isProfileModalOpen} 
          onClose={closeProfileModal} 
          user={currentUser} 
        />
      )}

      {isCreateGroupModalOpen && (
        <CreateGroupModal 
          isOpen={isCreateGroupModalOpen} 
          onClose={closeCreateGroupModal} 
        />
      )}

      {isUserProfileModalOpen && selectedUser && (
        <UserProfileModal 
          isOpen={isUserProfileModalOpen} 
          onClose={closeUserProfileModal} 
          user={selectedUser} 
        />
      )}

      {isGroupInfoModalOpen && selectedChat && selectedChat.isGroupChat && (
        <GroupInfoModal 
          isOpen={isGroupInfoModalOpen} 
          onClose={closeGroupInfoModal} 
          chat={selectedChat} 
        />
      )}
    </div>
  );
};

export default Chat;