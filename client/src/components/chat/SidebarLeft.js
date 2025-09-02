import React from 'react';

const SidebarLeft = ({ isOpen = true, children }) => {
  return (
    <aside className={`bg-panel w-80 ${isOpen ? 'block' : 'hidden'} md:block`}>{children}</aside>
  );
};

export default SidebarLeft;
