import { Box, LoadingSpinner } from '@tlon/indigo-react';

import './LoadingOverlay.scss';

const LoadingOverlay = ({
  loading,
  text,
}: {
  loading: boolean;
  text?: string;
}) => {
  if (!loading) {
    return null;
  }

  return (
    <Box className="loading-overlay">
      <Box className={`${text ? 'solid' : ''}`}>
        {!!text && <Box className="loader-text">{text}</Box>}
        <LoadingSpinner foreground="white" background="rgba(0,0,0,0.3)" />
      </Box>
    </Box>
  );
};

export default LoadingOverlay;
