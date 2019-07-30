import React, { useCallback } from 'react';
import { Just } from 'folktale/maybe';
import { Input, Grid, Text } from 'indigo-react';

import { useHistory } from 'store/history';
import { usePointCursor } from 'store/pointCursor';

import patp2dec from 'lib/patp2dec';
import { usePointInput } from 'lib/useInputs';

import View from 'components/View';
import { ForwardButton } from 'components/Buttons';
import ViewHeader from 'components/ViewHeader';

export default function ViewPoint() {
  const { pop, popAndPush, names } = useHistory();
  const { setPointCursor } = usePointCursor();
  const [pointInput, { data: pointName, pass }] = usePointInput({
    name: 'point',
    autoFocus: true,
  });

  const disabled = !pass;
  const goForward = useCallback(() => {
    setPointCursor(Just(patp2dec(pointName)));
    popAndPush(names.POINT);
  }, [setPointCursor, pointName, popAndPush, names.POINT]);

  return (
    <View pop={pop} inset>
      <Grid>
        <Grid.Item full as={ViewHeader}>
          View a Point
        </Grid.Item>

        <Grid.Item full as={Text}>
          Enter a point name to view its public information.
        </Grid.Item>

        <Grid.Item full as={Input} {...pointInput} onEnter={goForward} />

        <Grid.Item
          full
          as={ForwardButton}
          className="mt3"
          disabled={disabled}
          onClick={goForward}
          solid>
          Continue
        </Grid.Item>
      </Grid>
    </View>
  );
}
