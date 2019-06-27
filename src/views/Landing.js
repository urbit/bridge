import React from 'react';
import { H1, P } from 'indigo-react';

import { ROUTE_NAMES } from '../lib/routeNames';
import { useHistory } from '../store/history';

import View from 'components/View';
import { ForwardButton } from 'components/Buttons';

function Landing() {
  const history = useHistory();

  return (
    <View>
      <H1>Welcome</H1>

      <P>
        Bridge is a tool for managing and viewing assets on Azimuth, the Urbit
        address space.
      </P>

      <ForwardButton
        className="mt3"
        detail="If you were sent an Azimuth invite code."
        onClick={() => history.push(ROUTE_NAMES.ACTIVATE)}>
        Activate a Point
      </ForwardButton>

      <ForwardButton
        className="mt3"
        detail="Login to an activated point."
        onClick={() => history.push(ROUTE_NAMES.LOGIN)}>
        Login
      </ForwardButton>

      <ForwardButton
        className="mt3"
        detail="View an Azimuth point without signing into a wallet."
        onClick={() => history.push(ROUTE_NAMES.VIEW_POINT)}>
        View a Point
      </ForwardButton>
    </View>
  );
}

export default Landing;
