import React from 'react';
import { Icon, IconIndex } from '@tlon/indigo-react';
import './HeaderButton.scss';

interface HeaderButtonProps {
  icon: keyof IconIndex;
  onClick?: () => void;
  className?: string;
}

export default function HeaderButton({
  icon,
  onClick,
  className = '',
}: HeaderButtonProps) {
  return (
    <Icon
      className={`back-button ${className}`}
      icon={icon}
      onClick={onClick}
    />
  );
}
