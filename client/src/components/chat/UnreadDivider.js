import React, { forwardRef } from 'react';

const UnreadDivider = forwardRef((props, ref) => (
  <div ref={ref} className="my-4 flex items-center gap-3" {...props}>
    <div className="h-px bg-gray-200 flex-1" />
    <div className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-600">
      Unread messages
    </div>
    <div className="h-px bg-gray-200 flex-1" />
  </div>
));

export default UnreadDivider;
