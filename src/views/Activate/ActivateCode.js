import React, { useCallback, useMemo, useRef } from 'react';
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
import {
  TicketInput,
  hasErrors,
  composeValidator,
  buildTicketValidator,
} from 'form/Inputs';
import FormError from 'form/FormError';
import { FORM_ERROR } from 'final-form';

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

  // validate should be a pure function but we don't want to have to recompute
  // all of this information on submit, so cache the invite wallet and avoid
  // re-renders that may trigger re-validations (causing infinite loop)
  const validateForm = useCallback(
    async ({ ticket }, errors) => {
      if (hasErrors(errors)) {
        return errors;
      }

      await timeout(100); // allow the ui changes to flush before we lag it out

      const _contracts = need.contracts(contracts);
      const { seed } = await generateTemporaryOwnershipWallet(ticket);

      cachedInviteWallet.current = walletFromMnemonic(seed, DEFAULT_HD_PATH);

      const _inviteWallet = need.wallet(cachedInviteWallet.current);

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
        return {
          [FORM_ERROR]:
            'Invite code has no claimable point.\n' +
            'Check your invite code and try again?',
        };
      }
    },
    [contracts, setDerivedPoint]
  );

  const validate = useMemo(
    () => composeValidator({ ticket: buildTicketValidator() }, validateForm),
    [validateForm]
  );

  // set our state on submission
  const onSubmit = useCallback(
    async values => {
      setInviteWallet(cachedInviteWallet.current);
      setDerivedWallet(Just(await generateWallet(cachedPoint)));
    },
    [setDerivedWallet, setInviteWallet]
  );

  const afterSubmit = useCallback(async () => goToPassport(), [goToPassport]);

  return (
    <View inset>
      <Grid>
        <Grid.Item full as={Passport} point={derivedPoint} />
        <Grid.Item full as={H4} className="mt3 mb2">
          Activate
        </Grid.Item>
        <BridgeForm
          validate={validate}
          onSubmit={onSubmit}
          afterSubmit={afterSubmit}
          initialValues={{ ticket: impliedTicket || '' }}>
          {({ validating, submitting, handleSubmit }) => (
            <>
              <Grid.Item
                full
                as={TicketInput}
                name="ticket"
                label="Activation Code"
              />

              <Grid.Item full as={FormError} />

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
