import React from 'react';

const DayDivider = ({ label }) => {
  return (
    <div className="sticky top-0 z-10 flex justify-center my-2">
      <span className="px-3 py-1 rounded-full bg-panel-2 text-xs text-dim" role="separator">
        {label}
      </span>
    </div>
  );
};

export default DayDivider;
