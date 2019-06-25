import React, { useCallback, useState } from 'react';
import Maybe from 'folktale/maybe';
import * as ob from 'urbit-ob';

import { H1, P } from '../components/old/Base';

import { useHistory } from 'store/history';
import { usePointCursor } from 'store/pointCursor';

import { ROUTE_NAMES } from 'lib/routeNames';

import View from 'components/View';
import { ForwardButton } from 'components/Buttons';
import { PointInput } from 'components/Inputs';

export default function ViewPoint() {
  const history = useHistory();
  const { setPointCursor } = usePointCursor();
  const [pointName, setPointName] = useState('');
  const [pass, setPass] = useState(false);
  const [error, setError] = useState();
  const [focused, setFocused] = useState(true);

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

      <PointInput
        name="point"
        label="Point Name"
        initialValue={pointName}
        onValue={setPointName}
        pass={pass}
        onPass={setPass}
        error={error}
        onError={setError}
        focused={focused}
        onFocus={setFocused}
        onEnter={goForward}
        autoFocus
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
