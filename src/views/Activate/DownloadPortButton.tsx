import { useMemo } from 'react';
import { isMacOs, isWindows } from 'react-device-detect';
import ActivateButton from './ActivateButton';

interface DownloadPortButtonProps {
  error: any;
}

export const DownloadPortButton = ({ error }: DownloadPortButtonProps) => {
  const downloadButtonLabel = useMemo(() => {
    return isMacOs
      ? 'Download the Client for Mac'
      : isWindows
      ? 'Download the Client for Windows'
      : 'Download the Client for Your OS';
  }, []);

  const downloadUrl = useMemo(() => {
    return isMacOs
      ? `https://github.com/urbit/port/releases/latest/download/Port.dmg`
      : 'https://github.com/urbit/port/releases/latest';
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
