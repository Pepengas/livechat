import React from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import { CheckIcon as CheckIconSolid } from '@heroicons/react/24/solid';

const MessageStatusTicks = ({ status, className = '' }) => {
  return (
    <span className={`inline-flex items-center text-gray-500 ${className}`}>
      {status === 'sent' && <CheckIcon className="h-4 w-4" />}
      {status === 'delivered_all' && (
        <>
          <CheckIcon className="h-4 w-4" />
          <CheckIcon className="h-4 w-4 -ml-1" />
        </>
      )}
      {status === 'read_all' && (
        <span className="flex text-blue-600">
          <CheckIconSolid className="h-4 w-4" />
          <CheckIconSolid className="h-4 w-4 -ml-1" />
        </span>
      )}
    </span>
  );
};

export default MessageStatusTicks;
