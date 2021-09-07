import React from 'react';
import { Box, Icon } from '@tlon/indigo-react';

import './Dropdown.scss';

export interface DropdownProps {
  className: string;
  children: React.ReactNode;
  value: string;
  open: boolean;
  toggleOpen: () => void;
}

const Dropdown = ({
  children,
  value,
  open,
  toggleOpen,
  className,
}: DropdownProps) => {
  return (
    <Box className={`dropdown ${className}`}>
      <Box className={`selector ${open ? 'open' : ''}`} onClick={toggleOpen}>
        {value}
        <Icon icon="ChevronSouth" />
      </Box>
      {open && (
        <Box className="content-border">
          <Box className="content">{children}</Box>
        </Box>
      )}
    </Box>
  );
};

export default Dropdown;
