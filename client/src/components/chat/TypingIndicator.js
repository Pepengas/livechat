import React from 'react';

const TypingIndicator = ({ text }) => (
  <div className="typing-indicator text-gray-500 dark:text-gray-400 text-sm">
    {text}
    <span></span>
    <span></span>
    <span></span>
  </div>
);

export default TypingIndicator;
