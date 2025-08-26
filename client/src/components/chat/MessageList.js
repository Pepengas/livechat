import React, { useMemo, useState, useRef } from 'react';
import { useChat } from '../../hooks/useChat';
import groupMessages from '../../utils/groupMessages';
import DateDivider from './DateDivider';
import MessageGroup from './MessageGroup';
import DeleteMessageModal from '../modals/DeleteMessageModal';
import ThreadPanel from './ThreadPanel';

const MessageList = ({ messages, currentUser, selectedChat }) => {
  const { deleteMessageById, startReply } = useChat();
  const [messageToDelete, setMessageToDelete] = useState(null);
  const messageRefs = useRef({});

  const registerMessageRef = (id) => (el) => {
    if (el) {
      messageRefs.current[id] = el;
    }
  };

  const scrollToMessage = (id) => {
    const el = messageRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-blue-400');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-blue-400');
      }, 2000);
    }
  };

  const handleReply = (message) => {
    startReply(message);
  };

  const groups = useMemo(() => groupMessages(messages), [messages]);

  const handleDeleteRequest = (id) => {
    setMessageToDelete(id);
  };

  const closeModal = () => {
    setMessageToDelete(null);
  };

  const deleteForMe = async () => {
    if (!messageToDelete) return;
    try {
      await deleteMessageById(messageToDelete, selectedChat._id, 'me');
    } catch (err) {
      console.error('Error deleting message for me:', err);
    }
  };

  const deleteForEveryone = async () => {
    if (!messageToDelete) return;
    try {
      await deleteMessageById(messageToDelete, selectedChat._id, 'all');
    } catch (err) {
      console.error('Error deleting message for everyone:', err);
    }
  };

  let lastDate = null;
  let lastMessageDate = null;
  return (
    <div className="space-y-2">
      {groups.map((group) => {
        const dateStr = group.startAt.toDateString();
        const showDivider = lastDate !== dateStr;
        lastDate = dateStr;
        const element = (
          <React.Fragment key={group.key}>
            {showDivider && <DateDivider date={group.startAt} />}
            <MessageGroup
              group={group}
              currentUser={currentUser}
              onDelete={handleDeleteRequest}
              prevMessageDate={lastMessageDate}
              registerMessageRef={registerMessageRef}
              onReply={handleReply}
              scrollToMessage={scrollToMessage}
            />
          </React.Fragment>
        );
        const lastItem = group.items[group.items.length - 1];
        lastMessageDate = new Date(lastItem.createdAt);
        return element;
      })}
      {messageToDelete && (
        <DeleteMessageModal
          isOpen={!!messageToDelete}
          onClose={closeModal}
          onDeleteForMe={deleteForMe}
          onDeleteForEveryone={deleteForEveryone}
        />
      )}
      <ThreadPanel />
    </div>
  );
};

export default MessageList;
