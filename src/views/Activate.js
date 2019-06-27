import React, { useCallback } from 'react';
import * as ob from 'urbit-ob';
import Maybe from 'folktale/maybe';
import useImpliedPoint from 'lib/useImpliedPoint';
import { usePointInput, useTicketInput } from 'components/Inputs';
import { Grid, Input } from 'indigo-react';

import View from 'components/View';
import Footer from 'components/Footer';
import { ForwardButton } from 'components/Buttons';
import Passport from 'components/Passport';

import { useHistory } from 'store/history';

import { ROUTE_NAMES } from 'lib/routeNames';
import { useSyncKnownPoints } from 'lib/useSyncPoints';
import patp2dec from 'lib/patp2dec';

export default function Activate() {
  const { popAndPush } = useHistory();
  const impliedPoint = useImpliedPoint();

  const pointInput = usePointInput({
    name: 'point',
    initialValue: impliedPoint || '',
    autoFocus: !!impliedPoint,
  });

  // Maybe<number>
  const point = ob.isValidPatp(pointInput.data)
    ? Maybe.Just(patp2dec(pointInput.data))
    : Maybe.Nothing();

  useSyncKnownPoints([point.getOrElse(null)].filter(p => p !== null));

  const ticketInput = useTicketInput({
    name: 'ticket',
  });

  const goToLogin = useCallback(() => popAndPush(ROUTE_NAMES.LOGIN), [
    popAndPush,
  ]);

  return (
    <View>
      <Grid>
        <Grid.Item as={Passport} point={point} full />
        {!impliedPoint && <Grid.Item as={Input} {...pointInput} full />}
        <Grid.Item as={Input} {...ticketInput} full />
      </Grid>
      <Footer>
        <Grid className="pt2">
          <Grid.Divider />
          <Grid.Item as={ForwardButton} onClick={goToLogin} full>
            Login
          </Grid.Item>
        </Grid>
      </Footer>
    </View>
  );
}
