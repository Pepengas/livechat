import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { useChat } from '../../hooks/useChat';
import ImageModal from '../modals/ImageModal';
import DeleteMessageModal from '../modals/DeleteMessageModal';

const FIVE_MIN = 5 * 60 * 1000;

const MessageList = ({ messages, currentUser, selectedChat }) => {
  const { deleteMessageById } = useChat();
  const [selectedImage, setSelectedImage] = useState(null);
  const [messageToDelete, setMessageToDelete] = useState(null);

  // Build list of date pills and message groups
  const items = useMemo(() => {
    const result = [];
    let lastDate = '';
    let currentGroup = null;

    messages.forEach((msg) => {
      const dateStr = new Date(msg.createdAt).toDateString();

      if (dateStr !== lastDate) {
        result.push({ type: 'date', date: dateStr });
        lastDate = dateStr;
        currentGroup = null;
      }

      const isMe = msg.sender._id === currentUser._id;
      const msgTime = new Date(msg.createdAt).getTime();

      if (
        !currentGroup ||
        currentGroup.isMe !== isMe ||
        currentGroup.sender._id !== msg.sender._id ||
        msgTime - currentGroup.lastTime > FIVE_MIN
      ) {
        currentGroup = {
          type: 'group',
          sender: msg.sender,
          isMe,
          messages: [msg],
          lastTime: msgTime,
        };
        result.push(currentGroup);
      } else {
        currentGroup.messages.push(msg);
        currentGroup.lastTime = msgTime;
      }
    });

    return result;
  }, [messages, currentUser]);

  const formatDate = (dateString) => {
    const messageDate = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) return 'Today';
    if (messageDate.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return format(messageDate, 'MMMM d, yyyy');
  };

  const formatTime = (dateStr) => format(new Date(dateStr), 'h:mm a');

  const formatMessageContent = (text, wordsPerLine = 7) => {
    if (!text) return '';
    const words = text.split(/\s+/);
    const lines = [];
    for (let i = 0; i < words.length; i += wordsPerLine) {
      lines.push(words.slice(i, i + wordsPerLine).join(' '));
    }
    return lines.join('\n');
  };

  const openDeleteModal = (messageId) => setMessageToDelete(messageId);

  const handleDeleteMessage = async (messageId, scope) => {
    try {
      await deleteMessageById(messageId, selectedChat._id, scope);
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  const renderAttachment = (attachment) => {
    const type = attachment.type.split('/')[0];

    switch (type) {
      case 'image':
        return (
          <div className="mt-2 rounded-lg overflow-hidden">
            <img
              src={attachment.url}
              alt={attachment.name || 'Image'}
              className="max-w-full h-auto max-h-60 object-cover rounded-md shadow cursor-pointer transition-transform hover:scale-105"
              onClick={() => setSelectedImage(attachment.url)}
            />
            {attachment.name && (
              <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                {attachment.name} {attachment.size && `(${formatFileSize(attachment.size)})`}
              </div>
            )}
          </div>
        );
      case 'video':
        return (
          <div className="mt-2">
            <video controls className="max-w-full rounded-lg max-h-60">
              <source src={attachment.url} type={attachment.type} />
              Your browser does not support the video tag.
            </video>
            {attachment.name && (
              <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                {attachment.name} {attachment.size && `(${formatFileSize(attachment.size)})`}
              </div>
            )}
          </div>
        );
      case 'audio':
        return (
          <div className="mt-2">
            <audio controls className="w-full">
              <source src={attachment.url} type={attachment.type} />
              Your browser does not support the audio tag.
            </audio>
            {attachment.name && (
              <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                {attachment.name} {attachment.size && `(${formatFileSize(attachment.size)})`}
              </div>
            )}
          </div>
        );
      default:
        return (
          <div className="mt-2 p-3 bg-gray-100 rounded-lg flex items-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <div className="ml-2">
              <a
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-800 font-medium"
              >
                {attachment.name || 'File'}
              </a>
              {attachment.size && (
                <div className="text-xs" style={{ color: 'var(--muted)' }}>
                  {formatFileSize(attachment.size)}
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <>
      <div className="space-y-6">
        {items.map((item, idx) => {
          if (item.type === 'date') {
            return (
              <div
                key={`date-${idx}`}
                className="mx-auto my-3 px-3 py-1 text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full w-fit"
              >
                {formatDate(item.date)}
              </div>
            );
          }

          const lastMsg = item.messages[item.messages.length - 1];
          const isMe = item.isMe;
          return (
            <div
              key={`group-${idx}`}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end`}
            >
              {!isMe && (
                <img
                  src={
                    item.sender.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      item.sender.name
                    )}&background=random`
                  }
                  alt={item.sender.name}
                  className="h-8 w-8 rounded-full mr-2 self-end"
                />
              )}

              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}>
                {selectedChat.isGroupChat && !isMe && (
                  <span
                    className="text-xs font-medium"
                    style={{ color: 'var(--muted)' }}
                  >
                    {item.sender.name}
                  </span>
                )}

                {item.messages.map((message, i) => {
                  const isLast = i === item.messages.length - 1;
                  return (
                    <div key={message._id} className="message-row group">
                      <div
                        dir="auto"
                        className={`bubble ${isMe ? 'bubble--me' : 'bubble--them'} ${
                          isLast ? 'bubble--tail' : ''
                        }`}
                      >
                        {message.content && (
                          <div className="message-text" style={{ whiteSpace: 'pre-wrap' }}>
                            {formatMessageContent(message.content)}
                          </div>
                        )}

                        {message.attachments && message.attachments.length > 0 && (
                          <div className="space-y-2 mt-2">
                            {message.attachments.map((att, index) => (
                              <div key={index}>{renderAttachment(att)}</div>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => openDeleteModal(message._id)}
                        className="ml-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 align-bottom"
                        aria-label="Delete message"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  );
                })}

                <div
                  className={`group-meta text-xs text-slate-400 mt-1 ${
                    isMe ? 'text-right' : 'text-left'
                  }`}
                >
                  {formatTime(lastMsg.createdAt)}
                  {isMe && (
                    <span className="ml-1">
                      • {lastMsg.readBy.length > 0 ? '✓✓ Read' : '✓ Delivered'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <ImageModal
        isOpen={!!selectedImage}
        imageUrl={selectedImage}
        onClose={() => setSelectedImage(null)}
      />
      <DeleteMessageModal
        isOpen={!!messageToDelete}
        onClose={() => setMessageToDelete(null)}
        onDeleteForMe={() => handleDeleteMessage(messageToDelete, 'me')}
        onDeleteForEveryone={() => handleDeleteMessage(messageToDelete, 'all')}
      />
    </>
  );
};

export default MessageList;

