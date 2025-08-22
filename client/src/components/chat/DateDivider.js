import React from 'react';
import { format } from 'date-fns';

function friendlyDateLabel(date) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return format(d, 'MMM d, yyyy');
}

const DateDivider = ({ date }) => (
  <div className="my-4 flex items-center gap-3">
    <div className="h-px bg-gray-200 flex-1" />
    <div className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600">
      {friendlyDateLabel(date)}
    </div>
    <div className="h-px bg-gray-200 flex-1" />
  </div>
);

export default DateDivider;
