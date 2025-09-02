import React from 'react';

const SidebarRight = ({ isOpen = false, onClose, children }) => {
  return (
    <aside className={`bg-panel w-90 ${isOpen ? 'block' : 'hidden'} md:block`}> {children}</aside>
  );
};

export default SidebarRight;
