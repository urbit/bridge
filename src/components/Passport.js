import React from 'react';
import * as ob from 'urbit-ob';
import { Grid, Flex } from 'indigo-react';
import { times } from 'lodash';

import Sigil from './Sigil';
import usePointBirthday from 'lib/usePointBirthday';
import { formatDots } from 'lib/dateFormat';
import { kLoadingCharacter } from 'lib/loadingCharacter';

const kLoadingDate = [4, 2, 2]
  .map(t => times(t, () => kLoadingCharacter).join(''))
  .join('.');

export default function Passport({ point }) {
  const birthday = usePointBirthday(point);
  const birthDate = birthday.matchWith({
    Nothing: () => kLoadingDate,
    Just: p => formatDots(p.value),
  });
  const name = ob.patp(point);

  return (
    <Grid gap={16} className="bg-black r8 p7">
      <Grid.Item cols={[1, 4]} className="bg-green">
        <Sigil patp={name} size={64} margin={0} />
      </Grid.Item>
      <Grid.Item as={Flex} cols={[4, 13]} col justify="between">
        <Flex.Item className="mono white f5">{name}</Flex.Item>
        <Flex.Item as={Flex} col>
          <Flex.Item className="mono gray4 f6 uppercase">Birth Time</Flex.Item>
          <Flex.Item className="mono gray4 f6">{birthDate}</Flex.Item>
        </Flex.Item>
      </Grid.Item>
    </Grid>
  );
}
