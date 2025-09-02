import React from 'react';

interface SidebarLeftProps {
  isOpen?: boolean;
}

const SidebarLeft: React.FC<SidebarLeftProps> = ({ isOpen = true, children }) => {
  return (
    <aside className={`bg-panel w-80 ${isOpen ? 'block' : 'hidden'} md:block`}>{children}</aside>
  );
};

export default SidebarLeft;
