import { Box, LoadingSpinner } from '@tlon/indigo-react';

import './LoadingOverlay.scss';

const LoadingOverlay = ({ loading = false }: { loading: boolean }) => {
  if (!loading) {
    return null;
  }

  return (
    <Box className="loading-overlay">
      <LoadingSpinner foreground="white" background="rgba(0,0,0,0.3)" />
    </Box>
  );
};

export default LoadingOverlay;
