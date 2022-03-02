import { Row, Box, Icon, BaseButton } from '@tlon/indigo-react';

import { useEffect, useState } from 'react';
import { useInvites } from './useInvites';
import { generateCsvName } from 'lib/utils/invite';
import { DEFAULT_CSV_NAME } from 'lib/constants';
import Point from 'lib/types/Point';

interface CSVModalProps {
  point: Point;
  invitesUpdating: boolean;
}

export const CSVButton = ({ point, invitesUpdating }: CSVModalProps) => {
  const { generateCsv } = useInvites();
  const [csv, setCsv] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (invitesUpdating) {
      return;
    }

    try {
      const csv = generateCsv();
      setCsv(csv);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [generateCsv, invitesUpdating]);

  if (!csv || invitesUpdating) {
    return (
      <BaseButton display="flex" className="download-csv" disabled>
        <Icon icon="Download" />
        <Box>CSV</Box>
      </BaseButton>
    );
  }

  return (
    <a
      href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`}
      download={generateCsvName(
        DEFAULT_CSV_NAME,
        point.patp?.slice(1) || 'bridge'
      )}>
      <Row className="download-csv">
        <Icon icon="Download" />
        <Box>CSV</Box>
      </Row>
    </a>
  );
};
