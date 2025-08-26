import React from 'react';

const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

/**
 * Convert plain text URLs into anchor tags.
 * @param {string} text
 * @returns {React.ReactNode}
 */
export default function linkify(text) {
  if (!text) return text;
  return text.split(urlPattern).map((part, index) => {
    if (part.match(urlPattern)) {
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

/**
 * Extract unique URLs from text.
 * Ignores mailto: and tel: links.
 * @param {string} text
 * @returns {string[]}
 */
export function extractUrls(text) {
  if (!text) return [];
  const matches = text.match(urlPattern) || [];
  const set = new Set();
  matches.forEach((raw) => {
    const lower = raw.toLowerCase();
    if (lower.startsWith('mailto:') || lower.startsWith('tel:')) return;
    const href = raw.startsWith('http') ? raw : `https://${raw}`;
    set.add(href);
  });
  return Array.from(set);
}

export { urlPattern };
