import React, { MouseEvent } from 'react';
import { Box } from '@tlon/indigo-react';

import './Modal.scss';

export interface ModalProps {
  show: boolean;
  hide: () => void;
  hideClose?: boolean;
  children: React.ReactNode;
}

export default function Modal({
  show,
  hide,
  hideClose = false,
  children,
}: ModalProps) {
  const dontHide = (e: MouseEvent) => {
    e.stopPropagation();
  };

  if (!show) {
    return null;
  }

  return (
    <Box className="modal" onClick={hide}>
      <Box className="content">
        {!hideClose && (
          <Box className="close" onClick={hide}>
            &#215;
          </Box>
        )}
        <Box onClick={dontHide}>{children}</Box>
      </Box>
    </Box>
  );
}
