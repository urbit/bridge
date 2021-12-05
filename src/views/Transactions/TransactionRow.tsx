import { useMemo } from 'react';
import cn from 'classnames';
import * as ob from 'urbit-ob';
import { Box, Icon, Row } from '@tlon/indigo-react';
import { RollerTransaction } from '@urbit/roller-api';
import { format, fromUnixTime } from 'date-fns';

import { useTimerStore } from 'store/timerStore';
import {
  TRANSACTION_STATUS_ICONS,
  TRANSACTION_TYPE_ICONS,
  TRANSACTION_TYPE_TITLES,
} from 'lib/constants';
import { abbreviateAddress } from 'lib/utils/address';
import { isPlanet, isStar } from 'lib/utils/point';
import { titleize } from 'form/formatters';
import LayerIndicator from 'components/L2/LayerIndicator';

export const TransactionRow = ({
  ship,
  type,
  hash,
  status,
  time,
}: RollerTransaction) => {
  const { nextRoll } = useTimerStore();

  // For spawn events (associated with the spawner), we want to show the spawnee tier;
  // For all other events we will show the event's ship's tier
  const pointLabel = useMemo(() => {
    const azimuthIndex = ob.patp2dec(`~${ship}`);
    if (type === 'spawn') {
      return isStar(azimuthIndex) ? 'Planet' : 'Star';
    } else {
      return isStar(azimuthIndex)
        ? 'Star'
        : isPlanet(azimuthIndex)
        ? 'Planet'
        : 'Galaxy';
    }
  }, [ship, type]);

  const label = useMemo(() => {
    return TRANSACTION_TYPE_TITLES[type] || type;
  }, [type]);

  const icon = useMemo(() => {
    return <Icon icon={TRANSACTION_TYPE_ICONS[type] || 'Bug'} />;
  }, [type]);

  const shortHash = useMemo(() => {
    return hash ? abbreviateAddress(hash) : '';
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
        <span className={'icon-wrapper'}>
          <Icon icon={TRANSACTION_STATUS_ICONS[status] || 'Bug'} />
        </span>
        <span>{status === 'pending' ? nextRoll : titleize(status)}</span>
      </div>
    );
  }, [nextRoll, status]);

  return (
    <Box className="transaction-row">
      <Box className="icon">{icon}</Box>
      <Box className="info">
        <Row className="title-row">
          <Box className="title">{label}</Box>
          <Box className="status">{statusBadge}</Box>
        </Row>
        <Row className="info-row">
          <Box className="hash-container">
            <Box className="hash">{shortHash}</Box>
            <LayerIndicator layer={2} size={'sm'} />
          </Box>
          <Box className="date" title={longDate}>
            {shortDate}
          </Box>
        </Row>
      </Box>
    </Box>
  );
};
