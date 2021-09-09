import React, { MouseEvent } from 'react';
import { Box } from '@tlon/indigo-react';

import './Modal.scss';

export interface ModalProps {
  show: boolean;
  hide: () => void;
  children: React.ReactNode;
}

export default function Modal({ show, hide, children }: ModalProps) {
  const dontHide = (e: MouseEvent) => {
    e.stopPropagation();
  };

  if (!show) {
    return null;
  }

  return (
    <Box className="modal" onClick={hide}>
      <Box onClick={dontHide}>{children}</Box>
    </Box>
  );
}
