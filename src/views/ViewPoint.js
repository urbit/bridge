import React, { useCallback } from 'react';
import Maybe from 'folktale/maybe';
import { Input } from 'indigo-react';

import { H1, P } from '../components/old/Base';

import { useHistory } from 'store/history';
import { usePointCursor } from 'store/pointCursor';

import { ROUTE_NAMES } from 'lib/routeNames';
import patp2dec from 'lib/patp2dec';

import View from 'components/View';
import { ForwardButton } from 'components/Buttons';
import { usePointInput } from 'components/Inputs';

export default function ViewPoint() {
  const history = useHistory();
  const { setPointCursor } = usePointCursor();
  const pointInput = usePointInput({
    name: 'point',
    autoFocus: true,
  });
  const { data: pointName, pass } = pointInput;

  const disabled = !pass;
  const goForward = useCallback(() => {
    setPointCursor(Maybe.Just(patp2dec(pointName)));
    history.popAndPush(ROUTE_NAMES.POINT);
  }, [setPointCursor, history, pointName]);

  return (
    <View>
      <H1>View a Point</H1>

      <P>Enter a point name to view its public information.</P>

      <Input {...pointInput} onEnter={goForward} />

      <ForwardButton
        className="mt3"
        disabled={disabled}
        onClick={goForward}
        solid>
        Continue
      </ForwardButton>
    </View>
  );
}
