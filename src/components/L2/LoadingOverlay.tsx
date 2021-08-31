import { LoadingSpinner } from '@tlon/indigo-react';

import './LoadingOverlay.scss';

const LoadingOverlay = ({ loading = false }: { loading: boolean }) => {
  if (!loading) {
    return null;
  }

  return (
    <div className="loading-overlay">
      <LoadingSpinner foreground="white" background="rgba(0,0,0,0.3)" />
    </div>
  );
};

export default LoadingOverlay;
