import React from 'react';
import cn from 'classnames';
import Maybe from 'folktale/maybe';
import * as ob from 'urbit-ob';
import { Grid, Flex } from 'indigo-react';
import { times } from 'lodash';

import usePointBirthday from 'lib/usePointBirthday';
import { formatDots } from 'lib/dateFormat';

import Blinky, { kLoadingCharacter, kInterstitialCharacter } from './Blinky';
import MaybeSigil from './MaybeSigil';

const buildDate = char =>
  [4, 2, 2].map(t => times(t, () => char).join('')).join('.');
const kDateA = buildDate(kLoadingCharacter);
const kDateB = buildDate(kInterstitialCharacter);

/**
 * point is Maybe<number>
 */
export default function Passport({ point, className }) {
  const birthday = usePointBirthday(point.getOrElse(null));
  const visualBirthday = birthday.matchWith({
    Nothing: () => <Blinky a={kDateA} b={kDateB} />,
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

  return (
    <Grid gap={16} className={cn('bg-black r8 p7', className)}>
      <Grid.Item cols={[1, 4]} className="bg-green">
        <MaybeSigil patp={name} size={64} margin={0} />
      </Grid.Item>
      <Grid.Item as={Flex} cols={[4, 13]} col justify="between">
        <Flex.Item className="mono white f5">{visualName}</Flex.Item>
        <Flex.Item as={Flex} col>
          <Flex.Item className="mono gray4 f6 uppercase">Birth Time</Flex.Item>
          <Flex.Item className="mono gray4 f6">{visualBirthday}</Flex.Item>
        </Flex.Item>
      </Grid.Item>
    </Grid>
  );
}
