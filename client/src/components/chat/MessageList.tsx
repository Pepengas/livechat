import React from 'react';
import MessageItem from './MessageItem';
import DayDivider from './DayDivider';
import UnreadPill from './UnreadPill';

interface MessageListProps {
  messages: any[];
  currentUser: any;
  unreadId?: string;
  onReply?: (m: any) => void;
}

const MessageList: React.FC<MessageListProps> = ({ messages, currentUser, unreadId, onReply }) => {
  let lastDay: string | null = null;
  return (
    <div className="flex flex-col gap-[6px] px-2 py-4">
      {messages.map((m) => {
        const day = new Date(m.createdAt).toDateString();
        const showDay = day !== lastDay;
        lastDay = day;
        const isOwn = (m.sender?._id || m.user?.id || m.user?._id) === currentUser?._id;
        return (
          <React.Fragment key={m._id || m.id}>
            {showDay && <DayDivider label={day} />}
            {unreadId && m._id === unreadId && <UnreadPill />}
            <MessageItem message={m} isOwn={isOwn} onReply={() => onReply?.(m)} />
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default MessageList;
