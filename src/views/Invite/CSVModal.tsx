import { Button } from 'indigo-react';
import { Row, Box, LoadingSpinner } from '@tlon/indigo-react';

import Modal, { ModalProps } from 'components/L2/Modal';
import { useEffect, useState } from 'react';
import { useInvites, useInviteStore } from './useInvites';

interface CSVModalProps extends Omit<ModalProps, 'children'> {
  point: number;
}

export const CSVModal = ({ show, hide, hideClose, point }: CSVModalProps) => {
  const [loading, setLoading] = useState(false);
  const [csvElement, setCsvElement] = useState<HTMLAnchorElement | null>();
  const [error, setError] = useState('');
  const { invites, generatingNum } = useInviteStore();
  const { generateCsv } = useInvites();
  const invitePoints = invites[point];
  const generatingCodesText = `Generating ${generatingNum} of ${invitePoints.length} codes...`;

  useEffect(() => {
    const generate = async () => {
      setLoading(true);

      try {
        const element = await generateCsv();
        setCsvElement(element);
      } catch (e) {
        setError((e as Error).message);
      }

      setLoading(false);
    };

    generate();
  }, [generateCsv]);

  return (
    <Modal show={show} hide={hide} hideClose={hideClose}>
      <Box className="download-csv-modal">
        <Box>
          <Box>Download CSV</Box>
          {loading && <Box>{generatingCodesText}</Box>}
        </Box>
        <Row className="download-buttons">
          {/*
          // @ts-ignore */}
          <Button center className="ph4 close-button" solid onClick={hide}>
            Close
          </Button>
          {/*
          // @ts-ignore */}
          <Button
            center
            className="ph4 download-button"
            disabled={loading}
            solid
            onClick={() => csvElement?.click()}>
            Download CSV
          </Button>
        </Row>
      </Box>
      {loading && (
        <Box className="csv-loading">
          <LoadingSpinner background="#BCDCFF" foreground="#219DFF" />
        </Box>
      )}
    </Modal>
  );
};
