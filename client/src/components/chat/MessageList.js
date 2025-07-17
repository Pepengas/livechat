import React, { useState } from 'react';
import { format } from 'date-fns';
import { useChat } from '../../hooks/useChat';
import ImageModal from '../modals/ImageModal';
import DeleteMessageModal from '../modals/DeleteMessageModal';

const MessageList = ({ messages, currentUser, selectedChat }) => {
  const { deleteMessageById } = useChat();
  const [selectedImage, setSelectedImage] = useState(null);
  const [messageToDelete, setMessageToDelete] = useState(null);

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.createdAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  // Format the date for display
  const formatDate = (dateString) => {
    const messageDate = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return format(messageDate, 'MMMM d, yyyy');
    }
  };

  // Format the time for display
  const formatTime = (dateString) => {
    return format(new Date(dateString), 'h:mm a');
  };

  // Handle message deletion
  const handleDeleteMessage = async (messageId, scope) => {
    try {
      await deleteMessageById(messageId, selectedChat._id, scope);
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  const openDeleteModal = (messageId) => {
    setMessageToDelete(messageId);
  };

  // Render attachment
  const renderAttachment = (attachment) => {
    const type = attachment.type.split('/')[0];
    
    switch (type) {
      case 'image':
        return (
          <div className="mt-2 rounded-lg overflow-hidden">
            <img
              src={attachment.url}
              alt={attachment.name || 'Image'}
              className="max-w-full h-auto max-h-60 object-cover rounded-md shadow cursor-pointer"
              onClick={() => setSelectedImage(attachment.url)}
            />
            {attachment.name && (
              <div className="text-xs mt-1 text-gray-500">
                {attachment.name} {attachment.size && `(${formatFileSize(attachment.size)})`}
              </div>
            )}
          </div>
        );
      case 'video':
        return (
          <div className="mt-2">
            <video 
              controls 
              className="max-w-full rounded-lg max-h-60"
            >
              <source src={attachment.url} type={attachment.type} />
              Your browser does not support the video tag.
            </video>
            {attachment.name && (
              <div className="text-xs mt-1 text-gray-500">
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
              <div className="text-xs mt-1 text-gray-500">
                {attachment.name} {attachment.size && `(${formatFileSize(attachment.size)})`}
              </div>
            )}
          </div>
        );
      default:
        return (
          <div className="mt-2 p-3 bg-gray-100 rounded-lg flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
                <div className="text-xs text-gray-500">
                  {formatFileSize(attachment.size)}
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  // Format file size
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
        {Object.keys(groupedMessages).map((date) => (
          <div key={date}>
            <div className="flex justify-center mb-4">
              <div className="bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600">
                {formatDate(date)}
              </div>
            </div>

            <div className="space-y-4">
              {groupedMessages[date].map((message) => {
              const isSentByMe = message.sender._id === currentUser._id;
              
              return (
                <div key={message._id} className={`flex ${isSentByMe ? 'justify-end' : 'justify-start'}`}>
                  <div className="flex max-w-[75%]">
                    {!isSentByMe && !selectedChat.isGroupChat && (
                      <img 
                        src={message.sender.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender.name)}&background=random`} 
                        alt={message.sender.name}
                        className="h-8 w-8 rounded-full mr-2 mt-1"
                      />
                    )}
                    
                    <div>
                      {selectedChat.isGroupChat && !isSentByMe && (
                        <div className="flex items-center mb-1">
                          <img 
                            src={message.sender.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender.name)}&background=random`} 
                            alt={message.sender.name}
                            className="h-6 w-6 rounded-full mr-2"
                          />
                          <span className="text-xs font-medium text-gray-700">{message.sender.name}</span>
                        </div>
                      )}
                      
                      <div 
                        className={`message-bubble ${isSentByMe ? 'sent' : 'received'}`}
                      >
                        {message.content && <div>{message.content}</div>}
                        
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="space-y-2">
                            {message.attachments.map((attachment, index) => (
                              <div key={index}>
                                {renderAttachment(attachment)}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center mt-1">
                        <span className="text-xs text-gray-500">
                          {formatTime(message.createdAt)}
                        </span>
                        
                        {isSentByMe && (
                          <>
                            <span className="mx-1 text-gray-400">•</span>
                            {message.readBy.length > 0 ? (
                              <span className="text-xs text-gray-500">
                                Read
                              </span>
                            ) : (
                              <span className="text-xs text-gray-500">
                                Delivered
                              </span>
                            )}
                          </>
                        )}
                        
                        <button
                          onClick={() => openDeleteModal(message._id)}
                          className="ml-2 text-gray-400 hover:text-red-500"
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
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
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

export default MessageList
