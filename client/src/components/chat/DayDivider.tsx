import React from 'react';

interface DayDividerProps {
  label: string;
}

const DayDivider: React.FC<DayDividerProps> = ({ label }) => {
  return (
    <div className="sticky top-0 z-10 flex justify-center my-2">
      <span className="px-3 py-1 rounded-full bg-panel-2 text-xs text-dim" role="separator">
        {label}
      </span>
    </div>
  );
};

export default DayDivider;
