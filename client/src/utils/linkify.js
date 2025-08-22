import React from 'react';

const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

export default function linkify(text) {
  if (!text) return text;
  return text.split(urlPattern).map((part, index) => {
    if (part.match(/(https?:\/\/[^\s]+|www\.[^\s]+)/i)) {
      const href = part.startsWith('http') ? part : `https://${part}`;
      return (
        <a
          key={index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          {part}
        </a>
      );
    }
    return part;
  });
}
