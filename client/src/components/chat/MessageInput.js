import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../hooks/useChat';
import { useSocket } from '../../hooks/useSocket';
import { useDebounce } from '../../hooks/useDebounce';
import { uploadAttachments } from '../../services/messageService';

const MessageInput = ({ chatId, onTyping }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [previewAttachments, setPreviewAttachments] = useState([]);
  const fileInputRef = useRef(null);
  const { sendNewMessage } = useChat();
  const { socket } = useSocket();
  const debouncedTyping = useDebounce(isTyping, 1000);

  // Handle typing indicator
  useEffect(() => {
    if (!socket) return;

    if (isTyping) {
      socket.emit('typing', chatId);
    }

    if (debouncedTyping === false && isTyping) {
      socket.emit('stop-typing', chatId);
      setIsTyping(false);
    }
  }, [isTyping, debouncedTyping, socket, chatId]);

  // Handle message input change
  const handleInputChange = (e) => {
    setMessage(e.target.value);
    if (!isTyping) {
      setIsTyping(true);
      if (onTyping) onTyping();
    }
  };

  // Handle file selection
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const validFiles = files.filter(file => {
      if (!allowedTypes.includes(file.type)) {
        alert(`Unsupported file type: ${file.name}`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} exceeds 5MB size limit`);
        return false;
      }
      return true;
    });

    const newAttachments = validFiles.map(file => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    }));

    setAttachments([...attachments, ...newAttachments]);
    setPreviewAttachments([...previewAttachments, ...newAttachments]);
    
    // Reset file input
    e.target.value = null;
  };

  // Remove attachment
  const removeAttachment = (index) => {
    const newAttachments = [...attachments];
    const newPreviewAttachments = [...previewAttachments];
    
    // Revoke object URL to prevent memory leaks
    if (newPreviewAttachments[index].preview) {
      URL.revokeObjectURL(newPreviewAttachments[index].preview);
    }
    
    newAttachments.splice(index, 1);
    newPreviewAttachments.splice(index, 1);
    
    setAttachments(newAttachments);
    setPreviewAttachments(newPreviewAttachments);
  };

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      previewAttachments.forEach(attachment => {
        if (attachment.preview) {
          URL.revokeObjectURL(attachment.preview);
        }
      });
    };
  }, []);

  // Handle message submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if ((message === '' && attachments.length === 0) || !chatId) return;
    
    try {
      // Stop typing indicator
      if (socket) {
        socket.emit('stop-typing', chatId);
      }
      
      let uploaded = [];
      if (attachments.length > 0) {
        const files = attachments.map(a => a.file);
        uploaded = await uploadAttachments(files);
      }

      await sendNewMessage(chatId, message, uploaded);
      
      // Reset state
      setMessage('');
      setAttachments([]);
      setPreviewAttachments([]);
      setIsTyping(false);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Get file icon based on type
  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    } else if (fileType.startsWith('video/')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      );
    } else if (fileType.startsWith('audio/')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      );
    } else {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
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
    <div className="py-3">
      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {previewAttachments.map((attachment, index) => (
            <div key={index} className="relative bg-gray-100 dark:bg-gray-600 rounded-md p-2 flex items-center">
              <div className="mr-2 text-gray-600">
                {getFileIcon(attachment.type)}
              </div>
              <div className="mr-6">
                <div className="text-sm truncate max-w-[150px]">{attachment.name}</div>
                <div className="text-xs text-gray-500">{formatFileSize(attachment.size)}</div>
              </div>
              <button 
                onClick={() => removeAttachment(index)}
                className="absolute top-1 right-1 text-gray-500 hover:text-red-500"
                aria-label="Remove attachment"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Message input form */}
      <form onSubmit={handleSubmit} className="flex items-center">
        <button 
          type="button"
          onClick={() => fileInputRef.current.click()}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 focus:outline-none"
          aria-label="Attach file"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileSelect} 
          className="hidden" 
          multiple 
        />
        
        <input 
          type="text" 
          value={message} 
          onChange={handleInputChange} 
          placeholder="Type a message..." 
          className="flex-1 p-3 rounded-full bg-gray-100 dark:bg-gray-600 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 mx-2"
        />
        
        <button 
          type="submit" 
          className="p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          disabled={message === '' && attachments.length === 0}
          aria-label="Send message"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default MessageInput;