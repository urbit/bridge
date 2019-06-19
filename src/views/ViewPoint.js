import React, { useState } from 'react';
import Maybe from 'folktale/maybe';
import * as ob from 'urbit-ob';

import { H1, P } from '../components/old/Base';

import { useHistory } from 'store/history';
import { usePointCursor } from 'store/pointCursor';

import { ROUTE_NAMES } from 'lib/routeNames';

import View from 'components/View';
import { ForwardButton } from 'components/Buttons';
import { PointInput } from 'components/Inputs';
import InputSigil from 'components/InputSigil';

export default function ViewPoint() {
  const history = useHistory();
  const { setPointCursor } = usePointCursor();
  const [pointName, setPointName] = useState('');
  const [pass, setPass] = useState(false);
  const [error, setError] = useState();
  const [focused, setFocused] = useState(true);

  return (
    <View>
      <H1>{'View a Point'}</H1>

      <P>{'Enter a point name to view its public information.'}</P>

      <PointInput
        name="point"
        label="Point Name"
        onValue={setPointName}
        onPass={setPass}
        onError={setError}
        onFocus={setFocused}
        autoFocus
      />

      <InputSigil
        patp={pointName}
        size={68}
        margin={8}
        pass={pass}
        focused={focused}
        error={error}
      />

      <ForwardButton
        disabled={!pass}
        onClick={() => {
          setPointCursor(Maybe.Just(parseInt(ob.patp2dec(pointName), 10)));
          // ^ pointCursor expects native number type, not string
          history.popAndPush(ROUTE_NAMES.SHIP);
        }}
        solid>
        Continue
      </ForwardButton>
    </View>
  );
}
