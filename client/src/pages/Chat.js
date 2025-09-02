import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat';

// Components
import ChatLayout from '../components/chat/ChatLayout';
import ProfileModal from '../components/modals/ProfileModal';
import CreateGroupModal from '../components/modals/CreateGroupModal';
import UserProfileModal from '../components/modals/UserProfileModal';
import GroupInfoModal from '../components/modals/GroupInfoModal';

const Chat = () => {
  const { currentUser } = useAuth();
  const { selectedChat } = useChat();
  
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState(false);
  const [isGroupInfoModalOpen, setIsGroupInfoModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

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
    <div className="h-full flex relative overscroll-none min-h-0">
      <ChatLayout />

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
