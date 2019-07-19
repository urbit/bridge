import React from 'react';
import cn from 'classnames';
import { Just, Nothing } from 'folktale/maybe';
import * as ob from 'urbit-ob';
import { Grid, Flex, Text } from 'indigo-react';
import { times } from 'lodash';

import usePointBirthday from 'lib/usePointBirthday';

import {
  LOADING_CHARACTER,
  INTERSTITIAL_CHARACTER,
  matchBlinkyDate,
} from './Blinky';
import MaybeSigil from './MaybeSigil';

const TICKET_CHAR_LENGTH = 30;
const TICKET = times(TICKET_CHAR_LENGTH, i =>
  i % 2 === 0 ? LOADING_CHARACTER : INTERSTITIAL_CHARACTER
).join('');
const PENDING_TICKET = TICKET;
const VALID_TICKET = `${TICKET} ◆`;

const VISIBLE_ADDRESS_CHAR_COUNT = 20;
const EMPTY_ADDRESS = times(VISIBLE_ADDRESS_CHAR_COUNT, () => '<').join('');
const ADDRESS_BUFFER_CHARS = times(40, () => '<').join('');

/**
 * point is Maybe<number>
 * ticket is null | boolean
 * address is null | Maybe<string>
 */
export default function Passport({
  point,
  className,
  ticket = null,
  address = Nothing(),
  mini = false,
}) {
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
  const isValidTiket = !!ticket;
  const visibleTicket = isValidTiket ? VALID_TICKET : PENDING_TICKET;
  const visibleAddress = `${address.matchWith({
    Nothing: () => EMPTY_ADDRESS,
    Just: p => p.value.slice(0, VISIBLE_ADDRESS_CHAR_COUNT),
  })}${ADDRESS_BUFFER_CHARS}`;

  return (
    <Grid gap={4} className={cn('bg-black r8 p7', className)}>
      <Grid.Item cols={[1, 4]} className="bg-green">
        <MaybeSigil patp={name} size={64} margin={0} />
      </Grid.Item>
      <Grid.Item as={Flex} cols={[4, 13]} col justify="between">
        <Flex.Item className="mono white f5">{visualName}</Flex.Item>
        <Flex.Item as={Flex} col>
          <Flex.Item as={Text} className="mono f6 f5-ns gray4 uppercase">
            Birth Time
          </Flex.Item>
          <Flex.Item as={Text} className="mono f6 f5-ns gray4 ">
            {visualBirthday}
          </Flex.Item>
        </Flex.Item>
      </Grid.Item>
      {!mini && showTicket && (
        <Grid.Item full className="mv3" as={Flex} col>
          <Flex.Item as={Text} className="mono f6 f5-ns gray4 uppercase">
            Master Ticket
          </Flex.Item>
          <Flex.Item
            as={Text}
            className={cn('mono f6 f5-ns wrap', {
              gray4: !isValidTiket,
              green3: isValidTiket,
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
