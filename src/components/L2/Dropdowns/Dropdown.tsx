import React from 'react';
import { Icon } from '@tlon/indigo-react';

import './Dropdown.scss';

export interface DropdownProps {
  className: string;
  children: any;
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
    <div className={`dropdown ${className}`}>
      <div className={`selector ${open ? 'open' : ''}`} onClick={toggleOpen}>
        {value}
        <Icon icon="ChevronSouth" />
      </div>
      {open && (
        <div className="content-border">
          <div className="content">{children}</div>
        </div>
      )}
    </div>
  );
};

export default Dropdown;
