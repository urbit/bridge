import React from 'react';
import { H1, P } from 'indigo-react';

import { ROUTE_NAMES } from '../lib/routeNames';
import { useHistory } from '../store/history';

import View from 'components/View';
import { ForwardButton } from 'components/Buttons';

function Landing(props) {
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
        onClick={() => history.push(ROUTE_NAMES.INVITE_TICKET)}>
        Claim an invite
      </ForwardButton>

      <ForwardButton
        className="mt3"
        detail="If you own Azimuth assets and want to manage them in some way."
        onClick={() => history.push(ROUTE_NAMES.NETWORK)}>
        Unlock a Wallet
      </ForwardButton>

      <ForwardButton
        className="mt3"
        detail="View an Azimuth point without signing into a wallet."
        onClick={() => history.push(ROUTE_NAMES.VIEW_POINT)}>
        View a point
      </ForwardButton>
    </View>
  );
}

export default Landing;
