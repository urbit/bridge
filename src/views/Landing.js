import React from 'react';
import { H1, P } from '../components/old/Base';

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

      <ForwardButton onClick={() => history.push(ROUTE_NAMES.INVITE_TICKET)}>
        Claim an invite
      </ForwardButton>

      <P>If you were sent an Azimuth invite code, start here.</P>

      <ForwardButton onClick={() => history.push(ROUTE_NAMES.NETWORK)}>
        Unlock a Wallet
      </ForwardButton>

      <P>
        If you own Azimuth assets and want to manage them in some way, start
        here. You'll need either your Urbit ticket or a keypair.
      </P>

      <ForwardButton onClick={() => history.push(ROUTE_NAMES.VIEW_POINT)}>
        View a point
      </ForwardButton>
      <P>{'View an Azimuth point without signing into a wallet.'}</P>
    </View>
  );
}

export default Landing;
