import React from 'react';
import { ClipboardIcon, FaceSmileIcon, TrashIcon } from '@heroicons/react/24/outline';
import linkify from '../../utils/linkify';

const MessageItem = ({ message, isOwn, onDelete }) => {
  const text = message.text || message.content;

  const handleCopy = () => {
    if (text) {
      navigator.clipboard?.writeText(text);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(message._id || message.id);
    }
  };

  const renderAttachment = (attachment) => {
    const type = attachment.type || '';
    if (type.startsWith('image/')) {
      return (
        <img
          src={attachment.url}
          alt={attachment.name || 'image'}
          className="mt-2 max-w-xs rounded-md" />
      );
    }
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-block text-sm text-blue-600 underline"
      >
        {attachment.name || 'Attachment'}
      </a>
    );
  };

  return (
    <div className="relative group">
      {text && (
        <div className="text-[15px] leading-6 whitespace-pre-wrap break-words">
          {linkify(text)}
        </div>
      )}
      {message.attachments && message.attachments.map((att) => (
        <div key={att.id || att.url}>{renderAttachment(att)}</div>
      ))}
      {message.reactions && Object.keys(message.reactions).length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {Object.entries(message.reactions).map(([emoji, users]) => (
            <div key={emoji} className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">
              {emoji} {users.length}
            </div>
          ))}
        </div>
      )}
      <div className="absolute -top-2 right-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={handleCopy} className="p-1 hover:bg-gray-200 rounded" title="Copy">
          <ClipboardIcon className="h-4 w-4" />
        </button>
        <button className="p-1 hover:bg-gray-200 rounded" title="React">
          <FaceSmileIcon className="h-4 w-4" />
        </button>
        {isOwn && (
          <button onClick={handleDelete} className="p-1 hover:bg-gray-200 rounded" title="Delete">
            <TrashIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default MessageItem;