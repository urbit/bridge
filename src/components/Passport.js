import React, { useMemo } from 'react';
import cn from 'classnames';
import { Just, Nothing } from 'folktale/maybe';
import * as ob from 'urbit-ob';
import { Grid, Flex, Text } from 'indigo-react';
import { times } from 'lodash';

import * as need from 'lib/need';
import usePointBirthday from 'lib/usePointBirthday';

import Blinky, {
  LOADING_CHARACTER,
  INTERSTITIAL_CHARACTER,
  matchBlinkyDate,
} from './Blinky';
import Sigil from './Sigil';
import MaybeSigil from './MaybeSigil';
import usePermissionsForPoint from 'lib/usePermissionsForPoint';
import { useWallet } from 'store/wallet';
import { useSyncOwnedPoints } from 'lib/useSyncPoints';

const TICKET_CHAR_LENGTH = 30;
const TICKET = times(TICKET_CHAR_LENGTH, i =>
  i % 2 === 0 ? LOADING_CHARACTER : INTERSTITIAL_CHARACTER
).join('');
const PENDING_TICKET = TICKET;
const VALID_TICKET = `${TICKET} ◆`;

const VISIBLE_ADDRESS_CHAR_COUNT = 20;
const EMPTY_ADDRESS = times(VISIBLE_ADDRESS_CHAR_COUNT, () => '<').join('');
const ADDRESS_BUFFER_CHARS = times(40, () => '<').join('');

const INVERTED_COLORWAY = ['#fff', '#000'];

const buildKeyType = permissions => {
  if (permissions.isOwner) {
    return 'Ownership';
  } else if (permissions.isManagementProxy) {
    return 'Management';
  } else if (permissions.isSpawnProxy) {
    return 'Spawn';
  } else if (permissions.isVotingProxy) {
    return 'Voting';
  } else if (permissions.isTransferProxy) {
    return 'Transfer';
  }
};

/**
 * point is Maybe<number>
 * ticket is null | boolean
 * address is null | Maybe<string>
 */
function Passport({ point, className, ticket = null, address = Nothing() }) {
  const birthday = usePointBirthday(point.getOrElse(null));
  const visualBirthday = matchBlinkyDate(birthday);

  const name = point.matchWith({
    Nothing: () => Nothing(),
    Just: p => Just(ob.patp(p.value)),
  });
  const visualName = name.matchWith({
    Nothing: () => '...',
    Just: p => p.value,
  });

  const showTicket = ticket !== null;
  const isValidTicket = !!ticket;
  const visibleTicket = isValidTicket ? VALID_TICKET : PENDING_TICKET;
  const visibleAddress = `${address.matchWith({
    Nothing: () => EMPTY_ADDRESS,
    Just: p => p.value.slice(0, VISIBLE_ADDRESS_CHAR_COUNT),
  })}${ADDRESS_BUFFER_CHARS}`;

  return (
    <Grid gap={4} className={cn('bg-black r8 p7', className)}>
      <Grid.Item cols={[1, 4]}>
        <MaybeSigil patp={name} size={64} />
      </Grid.Item>
      <Grid.Item as={Flex} cols={[4, 13]} col justify="between">
        <Flex.Item className="mono white f5">{visualName}</Flex.Item>
        <Flex.Item as={Flex} col>
          <Flex.Item as={Text} className="mono f6 f5-ns gray4 uppercase">
            Birth Time
          </Flex.Item>
          <Flex.Item as={Text} className="mono f6 f5-ns gray4 uppercase">
            {visualBirthday}
          </Flex.Item>
        </Flex.Item>
      </Grid.Item>
      {showTicket && (
        <Grid.Item full className="mv3" as={Flex} col>
          <Flex.Item as={Text} className="mono f6 f5-ns gray4 uppercase">
            Master Ticket
          </Flex.Item>
          <Flex.Item
            as={Text}
            className={cn('arial f6 f5-ns wrap', {
              gray4: !isValidTicket,
              green3: isValidTicket,
            })}>
            {visibleTicket}
          </Flex.Item>
          <Flex.Item as={Text} className="mono f6 f5-ns gray4 wrap">
            {visibleAddress}
          </Flex.Item>
        </Grid.Item>
      )}
    </Grid>
  );
}

// TODO: Passport.Mini should probably accept Maybe<> for point
// in order to display a pretty skeleton loading view
// but that requires making usePermissionsForPoint accept a Maybe<point>
// and I don't feel like that refactor is worth it right now, and the spec
// doesn't call for it, hence the TODO
Passport.Mini = function MiniPassport({ point, className, inverted, ...rest }) {
  useSyncOwnedPoints([point]);

  const { wallet } = useWallet();
  const address = need.addressFromWallet(wallet);

  const permissions = usePermissionsForPoint(address, point);
  const keyType = buildKeyType(permissions);
  const name = useMemo(() => ob.patp(point), [point]);

  return (
    <Grid
      gap={4}
      className={cn(
        'r8 p4',
        {
          'bg-black': !inverted,
          'bg-white b-gray4 b1': inverted,
        },
        className
      )}
      {...rest}>
      <Grid.Item cols={[1, 4]}>
        <Sigil
          patp={name}
          size={64}
          colors={inverted ? INVERTED_COLORWAY : undefined}
        />
      </Grid.Item>
      <Grid.Item as={Flex} cols={[4, 13]} col justify="between">
        <Flex.Item
          className={cn('mono f6 pb2', {
            white: !inverted,
            black: inverted,
          })}>
          {name}
        </Flex.Item>
        <Flex.Item as={Flex} col className={cn('mono f6 uppercase')}>
          <Flex.Item
            as={Text}
            className={cn({
              gray4: !inverted,
              black: inverted,
            })}>
            Key Type
          </Flex.Item>
          <Flex.Item
            as={Text}
            className={cn({
              white: !inverted,
              black: inverted,
            })}>
            {keyType || <Blinky />}
          </Flex.Item>
        </Flex.Item>
      </Grid.Item>
    </Grid>
  );
};

export default Passport;
