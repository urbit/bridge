import React, { useCallback, useState } from 'react';
import Maybe from 'folktale/maybe';
import * as ob from 'urbit-ob';
import { Input } from 'indigo-react';

import { H1, P } from '../components/old/Base';

import { useHistory } from 'store/history';
import { usePointCursor } from 'store/pointCursor';

import { ROUTE_NAMES } from 'lib/routeNames';

import View from 'components/View';
import { ForwardButton } from 'components/Buttons';
import { usePointInput } from 'components/Inputs';
import InputSigil from 'components/InputSigil';

export default function ViewPoint() {
  const history = useHistory();
  const { setPointCursor } = usePointCursor();
  const [lastValidPoint, setLastValidPoint] = useState('');
  const pointInput = usePointInput({
    name: 'point',
    label: 'Point Name',
    autoFocus: true,
    onValue: setLastValidPoint,
  });
  const { data: pointName, pass, error, focused } = pointInput;

  const disabled = !pass;
  const goForward = useCallback(() => {
    setPointCursor(Maybe.Just(parseInt(ob.patp2dec(pointName), 10)));
    // ^ pointCursor expects native number type, not string
    history.popAndPush(ROUTE_NAMES.POINT);
  }, [setPointCursor, history, pointName]);

  return (
    <View>
      <H1>View a Point</H1>

      <P>Enter a point name to view its public information.</P>

      <Input
        {...pointInput}
        onEnter={goForward}
        accessory={
          lastValidPoint && (
            <InputSigil
              patp={lastValidPoint}
              size={68}
              margin={8}
              pass={pass}
              focused={focused}
              error={error}
            />
          )
        }
      />

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
