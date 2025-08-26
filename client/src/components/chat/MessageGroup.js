import React from 'react';
import { format } from 'date-fns';
import MessageItem from './MessageItem';
import TimeDivider from './TimeDivider';
import linkify from '../../utils/linkify';

const avatarUrl = (sender) => {
  if (!sender) return '';
  return (
    sender.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(sender.name || '')}&background=random`
  );
};

const MessageGroup = ({
  group,
  currentUser,
  onDelete,
  prevMessageDate,
  registerMessageRef,
  onReply,
  scrollToMessage,
}) => {
  if (!group.sender) {
    // system messages
    let last = prevMessageDate ? new Date(prevMessageDate) : null;
    const elements = [];
    group.items.forEach((m) => {
      const msgDate = new Date(m.createdAt);
      const minuteChanged =
        !last ||
        msgDate.getHours() !== last.getHours() ||
        msgDate.getMinutes() !== last.getMinutes();
      if (minuteChanged) {
        elements.push(
          <TimeDivider key={`time-${m.id || m._id}`} time={msgDate} />
        );
      }
      elements.push(
        <div
          key={m.id || m._id}
          className="text-center text-sm text-gray-500 my-2"
        >
          {linkify(m.text || m.content)}
        </div>
      );
      last = msgDate;
    });
    return <div className="mb-3">{elements}</div>;
  }

  const isOwn = (group.sender._id || group.sender.id) === (currentUser._id || currentUser.id);
  let last = prevMessageDate ? new Date(prevMessageDate) : null;
  const elements = [];
  let prevType = 'divider';
  group.items.forEach((m) => {
    const msgDate = new Date(m.createdAt);
    const minuteChanged =
      !last ||
      msgDate.getHours() !== last.getHours() ||
      msgDate.getMinutes() !== last.getMinutes();
    if (minuteChanged) {
      elements.push(
        <TimeDivider key={`time-${m.id || m._id}`} time={msgDate} />
      );
      prevType = 'divider';
    }
    const showAvatar = prevType !== 'message';
    if (showAvatar) {
      const shortTime = format(msgDate, 'h:mm a');
      const fullTime = msgDate.toLocaleString();
      elements.push(
        <div key={m.id || m._id} className="message-row grid grid-cols-[48px_1fr] gap-3">
          <img
            src={avatarUrl(group.sender)}
            className="w-12 h-12 rounded-full"
            alt={group.sender.name}
          />
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-medium text-sm">{group.sender.name}</span>
              <time className="text-xs text-gray-500" title={fullTime}>{shortTime}</time>
            </div>
            <MessageItem
              ref={registerMessageRef(m._id || m.id)}
              message={m}
              isOwn={isOwn}
              onDelete={onDelete}
              onReply={() => onReply(m)}
              scrollToMessage={scrollToMessage}
            />
          </div>
        </div>
      );
    } else {
      elements.push(
        <div
          key={m.id || m._id}
          className="message-row grid grid-cols-[48px_1fr] gap-3 mt-1"
        >
          <div className="avatar-spacer" />
          <MessageItem
            ref={registerMessageRef(m._id || m.id)}
            message={m}
            isOwn={isOwn}
            onDelete={onDelete}
            onReply={() => onReply(m)}
            scrollToMessage={scrollToMessage}
          />
        </div>
      );
    }
    prevType = 'message';
    last = msgDate;
  });

  return <div className="group mb-3">{elements}</div>;
};

export default MessageGroup;
