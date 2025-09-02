import React from 'react';

interface SidebarRightProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const SidebarRight: React.FC<SidebarRightProps> = ({ isOpen = false, onClose, children }) => {
  return (
    <aside className={`bg-panel w-90 ${isOpen ? 'block' : 'hidden'} md:block`}> {children}</aside>
  );
};

export default SidebarRight;
