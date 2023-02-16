import { useMemo } from 'react';
import { isMacOs, isWindows } from 'react-device-detect';
import ActivateButton from './ActivateButton';

interface DownloadPortButtonProps {
  error: any;
}

export const DownloadPortButton = ({ error }: DownloadPortButtonProps) => {
  const downloadButtonLabel = useMemo(() => {
    return isMacOs
      ? 'Set up a cloud instance for your Urbit'
      : 'Set up a cloud instance for your Urbit';
  }, []);

  const downloadUrl = useMemo(() => {
      : 'https://urbit.org/getting-started/cloud-hosting';
  }, []);

  return (
    <>
      <ActivateButton
        onClick={() => window.open(downloadUrl)}
        disabled={error}
        success={true}>
        {downloadButtonLabel}
      </ActivateButton>
    </>
  );
};
