import React, { useMemo } from 'react';
import { useChat } from '../../hooks/useChat';
import groupMessages from '../../utils/groupMessages';
import DateDivider from './DateDivider';
import MessageGroup from './MessageGroup';

const MessageList = ({ messages, currentUser, selectedChat }) => {
  const { deleteMessageById } = useChat();

  const groups = useMemo(() => groupMessages(messages), [messages]);

  const handleDelete = async (id) => {
    try {
      await deleteMessageById(id, selectedChat._id, 'all');
    } catch (err) {
      console.error('Error deleting message:', err);
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
            <MessageGroup group={group} currentUser={currentUser} onDelete={handleDelete} />
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default MessageList;
