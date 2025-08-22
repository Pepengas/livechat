import React, { useMemo, useState } from 'react';
import { useChat } from '../../hooks/useChat';
import groupMessages from '../../utils/groupMessages';
import DateDivider from './DateDivider';
import MessageGroup from './MessageGroup';
import DeleteMessageModal from '../modals/DeleteMessageModal';

const MessageList = ({ messages, currentUser, selectedChat }) => {
  const { deleteMessageById } = useChat();
  const [messageToDelete, setMessageToDelete] = useState(null);

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
  return (
    <div className="space-y-2">
      {groups.map((group) => {
        const dateStr = group.startAt.toDateString();
        const showDivider = lastDate !== dateStr;
        lastDate = dateStr;
        return (
          <React.Fragment key={group.key}>
            {showDivider && <DateDivider date={group.startAt} />}
            <MessageGroup
              group={group}
              currentUser={currentUser}
              onDelete={handleDeleteRequest}
            />
          </React.Fragment>
        );
      })}
      {messageToDelete && (
        <DeleteMessageModal
          isOpen={!!messageToDelete}
          onClose={closeModal}
          onDeleteForMe={deleteForMe}
          onDeleteForEveryone={deleteForEveryone}
        />
      )}
    </div>
  );
};

export default MessageList;
