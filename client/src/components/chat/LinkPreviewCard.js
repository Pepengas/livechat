import React from 'react';
import { PhotoIcon } from '@heroicons/react/24/outline';

const PlaceholderImage = () => (
  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
    <PhotoIcon className="w-8 h-8" />
  </div>
);

const Skeleton = () => (
  <div className="mt-2 max-w-md border rounded-md overflow-hidden animate-pulse">
    <div className="w-full aspect-video bg-gray-200" />
    <div className="p-2 space-y-2">
      <div className="h-4 bg-gray-200 rounded" />
      <div className="h-3 bg-gray-200 rounded" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
    </div>
  </div>
);

/**
 * Render a rich preview card for a URL.
 * @param {Object} props
 * @param {Object} props.preview - preview data {url,title,description,image,siteName}
 * @param {boolean} props.isLoading
 */
const LinkPreviewCard = ({ preview, isLoading }) => {
  if (isLoading || !preview) {
    return <Skeleton />;
  }

  const { url, title, description, image, siteName } = preview;
  let domain = siteName;
  try {
    if (!domain && url) {
      domain = new URL(url).hostname;
    }
  } catch (_) {
    domain = '';
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={title}
      className="mt-2 block max-w-md border rounded-md overflow-hidden hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
    >
      <div className="w-full aspect-video bg-gray-100 overflow-hidden">
        {image ? (
          <img src={image} alt={title} className="w-full h-full object-cover" />
        ) : (
          <PlaceholderImage />
        )}
      </div>
      <div className="p-2">
        {title && (
          <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
        )}
        {description && (
          <p
            className="mt-1 text-sm text-gray-700 overflow-hidden"
            style={{
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
            }}
          >
            {description}
          </p>
        )}
        {domain && (
          <p className="mt-1 text-xs text-gray-500">{domain}</p>
        )}
      </div>
    </a>
  );
};

export default LinkPreviewCard;
