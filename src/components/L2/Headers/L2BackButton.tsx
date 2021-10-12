import React from 'react';
import { Icon } from '@tlon/indigo-react';
import './L2BackButton.scss';

interface L2BackButtonProps {
  onBack?: () => void;
  className?: string;
}

export default function L2BackButton({
  onBack,
  className = '',
}: L2BackButtonProps) {
  return (
    <Icon
      className={`back-button ${className}`}
      icon="ChevronWest"
      onClick={onBack}
    />
  );
}
