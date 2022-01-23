import { useMemo } from 'react';
import { isMacOs, isWindows } from 'react-device-detect';
import ActivateButton from './ActivateButton';

interface DownloadPortButtonProps {
  error: any;
}

export const DownloadPortButton = ({ error }: DownloadPortButtonProps) => {
  const downloadButtonLabel = useMemo(() => {
    return isMacOs
      ? 'To use it, download Port for Mac'
      : isWindows
      ? 'To use it, download Port for Windows'
      : 'To use it, download Port for your OS';
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
