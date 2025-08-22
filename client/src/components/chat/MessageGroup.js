import React from 'react';
import { format } from 'date-fns';
import MessageItem from './MessageItem';

const avatarUrl = (sender) => {
  if (!sender) return '';
  return (
    sender.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(sender.name || '')}&background=random`
  );
};

const MessageGroup = ({ group, currentUser, onDelete }) => {
  if (!group.sender) {
    // system messages
    return (
      <div className="text-center text-sm text-gray-500 my-2">
        {group.items.map((m) => (
          <div key={m.id || m._id}>{m.text || m.content}</div>
        ))}
      </div>
    );
  }

  const isOwn = (group.sender._id || group.sender.id) === (currentUser._id || currentUser.id);
  const first = group.items[0];
  const rest = group.items.slice(1);
  const shortTime = format(group.startAt, 'h:mm a');
  const fullTime = group.startAt.toLocaleString();

  return (
    <div className="group mb-3">
      <div className="grid grid-cols-[48px_1fr] gap-3">
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
          <MessageItem message={first} isOwn={isOwn} onDelete={onDelete} />
        </div>
      </div>
      {rest.map((m) => (
        <div key={m.id || m._id} className="grid grid-cols-[48px_1fr] gap-3 mt-1">
          <div />
          <MessageItem message={m} isOwn={isOwn} onDelete={onDelete} />
        </div>
      ))}
    </div>
  );
};

export default MessageGroup;
