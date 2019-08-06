import React, { useCallback, useMemo } from 'react';
import { Just } from 'folktale/maybe';
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
import { composeValidator, buildPatqValidator } from 'form/validators';
import FormError from 'form/FormError';
import { FORM_ERROR } from 'final-form';

export default function ActivateCode() {
  const history = useHistory();
  const { names, push } = useLocalRouter();
  const { contracts } = useNetwork();
  const impliedTicket = useImpliedTicket();
  const [hasDisclaimed] = useHasDisclaimed();

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

  const validate = useMemo(
    () => composeValidator({ ticket: buildPatqValidator() }),
    []
  );

  // set our state on submission
  const onSubmit = useCallback(
    async values => {
      await timeout(100); // allow the ui changes to flush before we lag it out

      const _contracts = need.contracts(contracts);
      const { seed } = await generateTemporaryOwnershipWallet(values.ticket);

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

      if (incoming.length > 0) {
        if (incoming.length > 1) {
          // TODO: putting a warning here doesn't make sense since the user
          // will be immediately redirected away — what do?
          // 'This invite code has multiple points available.\n' +
          //   "Once you've activated this point, activate the next with the same process.";
        }

        const point = parseInt(incoming[0], 10);

        setDerivedPoint(Just(point));
        setInviteWallet(inviteWallet);
        setDerivedWallet(Just(await generateWallet(point)));
      } else {
        return {
          [FORM_ERROR]:
            'Invite code has no claimable point.\n' +
            'Check your invite code and try again?',
        };
      }
    },
    [contracts, setDerivedPoint, setDerivedWallet, setInviteWallet]
  );

  const initialValues = useMemo(() => ({ ticket: impliedTicket || '' }), [
    impliedTicket,
  ]);

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
          afterSubmit={goToPassport}
          initialValues={initialValues}>
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
