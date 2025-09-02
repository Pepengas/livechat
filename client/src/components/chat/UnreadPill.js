import React from 'react';

const UnreadPill = ({ label = 'Unread messages' }) => {
  return (
    <div className="flex justify-center my-3" role="separator">
      <span className="px-4 py-1 rounded-full bg-[color:var(--primary)] text-[color:var(--bg)] text-xs">
        {label}
      </span>
    </div>
  );
};

export default UnreadPill;
