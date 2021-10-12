import cn from 'classnames';
import { Box, Icon, Row } from '@tlon/indigo-react';
import { RollerTransaction } from '@urbit/roller-api';
import { format, fromUnixTime } from 'date-fns';
import { titleize } from 'form/formatters';
import {
  TRANSACTION_STATUS_ICONS,
  TRANSACTION_TYPE_ICONS,
  TRANSACTION_TYPE_TITLES,
} from 'lib/constants';
import { abbreviateAddress } from 'lib/utils/address';
import { useMemo } from 'react';
import { useRollerStore } from 'store/roller';

export const TransactionRow = ({
  type,
  hash,
  status,
  time,
}: RollerTransaction) => {
  const { nextRoll } = useRollerStore();

  const label = useMemo(() => {
    return TRANSACTION_TYPE_TITLES[type] || type;
  }, [type]);

  const icon = useMemo(() => {
    return <Icon icon={TRANSACTION_TYPE_ICONS[type] || 'Bug'} />;
  }, [type]);

  const shortHash = useMemo(() => {
    return abbreviateAddress(hash);
  }, [hash]);

  const parsedDate = useMemo(() => {
    if (!time) {
      return null;
    }

    return fromUnixTime(time / 1000);
  }, [time]);

  const shortDate = useMemo(() => {
    if (!parsedDate) {
      return null;
    }

    return format(parsedDate, 'MMMM dd');
  }, [parsedDate]);

  const longDate = useMemo(() => {
    if (!parsedDate) {
      return null;
    }

    return parsedDate.toISOString();
  }, [parsedDate]);

  const statusBadge = useMemo(() => {
    return (
      <div className={cn(['badge', status])}>
        <span>
          <Icon icon={TRANSACTION_STATUS_ICONS[status] || 'Bug'} />
        </span>
        <span>{status === 'pending' ? nextRoll : titleize(status)}</span>
      </div>
    );
  }, [status, nextRoll]);

  return (
    <Box className="transaction-row">
      <Box className="icon">{icon}</Box>
      <Box className="info">
        <Row className="title-row">
          <Box className="title">{label}</Box>
          <Box className="status">{statusBadge}</Box>
        </Row>
        <Row className="info-row">
          <Box className="hash">{shortHash}</Box>
          <Box className="date" title={longDate}>
            {shortDate}
          </Box>
        </Row>
      </Box>
    </Box>
  );
};
