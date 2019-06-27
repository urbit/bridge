import React from 'react';
import cn from 'classnames';
import Maybe from 'folktale/maybe';
import * as ob from 'urbit-ob';
import { Grid, Flex, Text } from 'indigo-react';
import { times } from 'lodash';

import usePointBirthday from 'lib/usePointBirthday';
import { formatDots } from 'lib/dateFormat';

import Blinky, { kLoadingCharacter, kInterstitialCharacter } from './Blinky';
import MaybeSigil from './MaybeSigil';

const buildDate = char =>
  [4, 2, 2].map(t => times(t, () => char).join('')).join('.');
const kDateA = buildDate(kLoadingCharacter);
const kDateB = buildDate(kInterstitialCharacter);

const kTicketCharacterLength = 40;
const kPendingTicket = times(
  kTicketCharacterLength,
  () => kLoadingCharacter
).join('');
const kValidTicket =
  times(kTicketCharacterLength, () => kLoadingCharacter).join('') + '◆';

const kVisibleAddressCharacters = 20;
const kEmptyHalfAddress = times(kVisibleAddressCharacters, () => '<').join('');
const bufferAddressCharacters = times(40, () => '<').join('');

/**
 * point is Maybe<number>
 * ticket is boolean
 * address is null | Maybe<string>
 */
export default function Passport({
  point,
  className,
  ticket = null,
  address = null,
  mini = false,
}) {
  const birthday = usePointBirthday(point.getOrElse(null));
  const visualBirthday = birthday.matchWith({
    Nothing: () => <Blinky a={kDateA} b={kDateB} delayed />,
    Just: p => formatDots(p.value),
  });

  const name = point.matchWith({
    Nothing: () => Maybe.Nothing(),
    Just: p => Maybe.Just(ob.patp(p.value)),
  });
  const visualName = name.matchWith({
    Nothing: () => '...',
    Just: p => p.value,
  });

  const showTicket = ticket !== null;
  const showValidTicket = !!ticket;
  const visibleTicket = showValidTicket ? kValidTicket : kPendingTicket;
  const visibleAddress =
    address &&
    `${address.matchWith({
      Nothing: () => kEmptyHalfAddress,
      Just: p => p.value.slice(0, kVisibleAddressCharacters),
    })}${bufferAddressCharacters}`;

  return (
    <Grid gap={4} className={cn('bg-black r8 p7', className)}>
      <Grid.Item cols={[1, 4]} className="bg-green">
        <MaybeSigil patp={name} size={64} margin={0} />
      </Grid.Item>
      <Grid.Item as={Flex} cols={[4, 13]} col justify="between">
        <Flex.Item className="mono white f5">{visualName}</Flex.Item>
        <Flex.Item as={Flex} col>
          <Flex.Item as={Text} className="mono gray4 uppercase">
            Birth Time
          </Flex.Item>
          <Flex.Item as={Text} className="mono gray4">
            {visualBirthday}
          </Flex.Item>
        </Flex.Item>
      </Grid.Item>
      {!mini && showTicket && (
        <Grid.Item full className="mv3" as={Flex} col>
          <Flex.Item as={Text} className="mono gray4 uppercase">
            Master Ticket
          </Flex.Item>
          <Flex.Item
            as={Text}
            className={cn('mono gray4', {
              green3: showValidTicket,
            })}>
            {visibleTicket}
          </Flex.Item>
          <Flex.Item as={Text} className="mono gray4">
            {visibleAddress}
          </Flex.Item>
        </Grid.Item>
      )}
    </Grid>
  );
}
