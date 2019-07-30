import React, { useCallback, useRef } from 'react';
import { Just, Nothing } from 'folktale/maybe';
import * as azimuth from 'azimuth-js';
import { Grid, H4 } from 'indigo-react';

import View from 'components/View';
import { ForwardButton } from 'components/Buttons';
import Passport from 'components/Passport';

import { useHistory } from 'store/history';

import * as need from 'lib/need';
import { ROUTE_NAMES } from 'lib/routeNames';
import FooterButton from 'components/FooterButton';
import { DEFAULT_HD_PATH, walletFromMnemonic } from 'lib/wallet';
import { useNetwork } from 'store/network';
import { generateWallet } from 'lib/invite';
import { generateTemporaryOwnershipWallet } from 'lib/walletgen';
import { useActivateFlow } from './ActivateFlow';
import { useLocalRouter } from 'lib/LocalRouter';
import useImpliedTicket from 'lib/useImpliedTicket';
import timeout from 'lib/timeout';
import useHasDisclaimed from 'lib/useHasDisclaimed';

import BridgeForm from 'form/BridgeForm';
import SubmitButton from 'form/SubmitButton';
import { TicketInput } from 'form/Inputs';

export default function ActivateCode() {
  const history = useHistory();
  const { names, push } = useLocalRouter();
  const { contracts } = useNetwork();
  const impliedTicket = useImpliedTicket();
  const [hasDisclaimed] = useHasDisclaimed();

  const cachedInviteWallet = useRef(Nothing());
  const cachedPoint = useRef();

  const {
    setDerivedWallet,
    setInviteWallet,
    derivedPoint,
    setDerivedPoint,
  } = useActivateFlow();

  const goToLogin = useCallback(() => history.popAndPush(ROUTE_NAMES.LOGIN), [
    history,
  ]);
  const goToPassport = useCallback(() => {
    push(names.PASSPORT);

    if (!hasDisclaimed) {
      push(names.DISCLAIMER);
    }
  }, [names, push, hasDisclaimed]);

  const validate = useCallback(
    async ticket => {
      await timeout(100); // allow the ui changes to flush before we lag it out

      const _contracts = need.contracts(contracts);
      const { seed } = await generateTemporaryOwnershipWallet(ticket);

      // TODO(fang): isn't all this accessible in the ownership object?
      const inviteWallet = walletFromMnemonic(seed, DEFAULT_HD_PATH);
      cachedInviteWallet.current = inviteWallet;

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

      if (incoming.length > 0) {
        if (incoming.length > 1) {
          // TODO: warnings
          // setGeneralError(
          //   'This invite code has multiple points available.\n' +
          //     "Once you've activated this point, activate the next with the same process."
          // );
        }

        const point = parseInt(incoming[0], 10);
        setDerivedPoint(Just(point));
        cachedPoint.current = point;
      } else {
        return (
          'Invite code has no claimable point.\n' +
          'Check your invite code and try again?'
        );
      }
    },
    [contracts, setDerivedPoint]
  );

  const onSubmit = useCallback(
    async values => {
      setInviteWallet(cachedInviteWallet.current);
      setDerivedWallet(Just(await generateWallet(cachedPoint)));

      goToPassport();
    },
    [goToPassport, setDerivedWallet, setInviteWallet]
  );

  return (
    <View inset>
      <Grid>
        <Grid.Item as={Passport} point={derivedPoint} full />
        <Grid.Item as={H4} className="mt3 mb2" full>
          Activate
        </Grid.Item>
        <BridgeForm
          onSubmit={onSubmit}
          initialValues={{ ticket: impliedTicket || '' }}>
          {({ validating, submitting, handleSubmit }) => (
            <>
              <Grid.Item
                full
                as={TicketInput}
                name="ticket"
                label="Activation Code"
                validate={validate}
                autoFocus
              />

              <Grid.Item
                full
                as={SubmitButton}
                className="mt4"
                handleSubmit={handleSubmit}>
                {validating
                  ? 'Deriving...'
                  : submitting
                  ? 'Generating...'
                  : 'Go'}
              </Grid.Item>
            </>
          )}
        </BridgeForm>
      </Grid>
      <FooterButton as={ForwardButton} onClick={goToLogin}>
        Login
      </FooterButton>
    </View>
  );
}
