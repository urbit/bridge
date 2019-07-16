import React, { useCallback, useEffect, useState } from 'react';
import { Just, Nothing } from 'folktale/maybe';
import * as azimuth from 'azimuth-js';
import { Grid, Input, H4, ErrorText } from 'indigo-react';

import View from 'components/View';
import { ForwardButton } from 'components/Buttons';
import Passport from 'components/Passport';

import { useHistory } from 'store/history';

import { useTicketInput } from 'lib/useInputs';
import * as need from 'lib/need';
import { ROUTE_NAMES } from 'lib/routeNames';
import { useSyncKnownPoints } from 'lib/useSyncPoints';
import FooterButton from 'components/FooterButton';
import Blinky from 'components/Blinky';
import { DEFAULT_HD_PATH, walletFromMnemonic } from 'lib/wallet';
import { useNetwork } from 'store/network';
import { generateWallet } from 'lib/invite';
import { generateTemporaryOwnershipWallet } from 'lib/walletgen';
import { useActivateFlow } from './ActivateFlow';
import { useLocalRouter } from 'lib/LocalRouter';

export default function ActivateCode() {
  const history = useHistory();
  const { names, push } = useLocalRouter();
  const { contracts } = useNetwork();
  const [generalError, setGeneralError] = useState();
  const [deriving, setDeriving] = useState(false);
  const {
    derivedWallet,
    setDerivedWallet,
    setInviteWallet,
    derivedPoint,
    setDerivedPoint,
  } = useActivateFlow();

  const [ticketInput, { pass: validTicket, data: ticket }] = useTicketInput({
    name: 'ticket',
    label: 'Code',
    autoFocus: true,
  });

  const goToLogin = useCallback(() => history.popAndPush(ROUTE_NAMES.LOGIN), [
    history,
  ]);
  const goToDisclaimer = useCallback(() => push(names.DISCLAIMER), [
    names,
    push,
  ]);

  const pass = derivedWallet.matchWith({
    Nothing: () => false,
    Just: () => true,
  });

  useEffect(() => {
    if (validTicket) {
      const _contracts = need.contracts(contracts);

      setDeriving(true);
      // when the ticket becomes valid, derive the point
      (async () => {
        const { seed } = await generateTemporaryOwnershipWallet(ticket);

        //TODO isn't all this accessible in the ownership object?
        const inviteWallet = walletFromMnemonic(seed, DEFAULT_HD_PATH);
        const _inviteWallet = need.wallet(inviteWallet);

        const owned = await azimuth.azimuth.getOwnedPoints(
          _contracts,
          _inviteWallet.address
        );
        const transferring = await azimuth.azimuth.getTransferringFor(
          _contracts,
          _inviteWallet.address
        );
        const incoming = [...owned, ...transferring];

        let realPoint = Nothing();
        let wallet = Nothing();

        if (incoming.length > 0) {
          const pointNum = parseInt(incoming[0], 10);
          realPoint = Just(pointNum);
          wallet = Just(await generateWallet(pointNum));

          if (incoming.length > 1) {
            setGeneralError(
              'This invite code has multiple points available.\n' +
                "Once you've activated this point, activate the next with the same process."
            );
          }
        } else {
          setGeneralError(
            'Invite code has no claimable point.\n' +
              'Check your invite code and try again?'
          );
        }

        setDerivedPoint(realPoint);
        setDerivedWallet(wallet);
        setInviteWallet(inviteWallet);
        setDeriving(false);
      })();
    } else {
      setGeneralError(false);
    }
  }, [
    validTicket,
    contracts,
    ticket,
    setDerivedPoint,
    setDerivedWallet,
    setInviteWallet,
  ]);

  // when we know the derived point, ensure we have the data to display it
  useSyncKnownPoints([derivedPoint.getOrElse(null)].filter(p => p !== null));

  return (
    <View>
      <Grid>
        <Grid.Item as={Passport} point={derivedPoint} full />
        <Grid.Item as={H4} className="mt3 mb2" full>
          Activate
        </Grid.Item>
        <Grid.Item as={Input} {...ticketInput} full />
        {generalError && (
          <Grid.Item full>
            <ErrorText>{generalError}</ErrorText>{' '}
          </Grid.Item>
        )}
        <Grid.Item
          as={ForwardButton}
          className="mt4"
          disabled={!pass || deriving}
          accessory={deriving ? <Blinky /> : undefined}
          onClick={goToDisclaimer}
          solid
          full>
          {deriving && 'Deriving...'}
          {!deriving && 'Go'}
        </Grid.Item>
      </Grid>
      <FooterButton as={ForwardButton} onClick={goToLogin}>
        Login
      </FooterButton>
    </View>
  );
}
