import { useCallback, useMemo, useRef } from 'react';
import { Just } from 'folktale/maybe';
import * as azimuth from 'azimuth-js';
import { Grid, H4, P, CheckboxInput } from 'indigo-react';
import { FORM_ERROR } from 'final-form';

import View from 'components/View';
import { ForwardButton } from 'components/Buttons';
import WarningBox from 'components/WarningBox';
import FooterButton from 'components/FooterButton';

import { useNetwork } from 'store/network';
import { useHistory } from 'store/history';

import * as need from 'lib/need';
import { ROUTE_NAMES } from 'lib/routeNames';
import { walletFromMnemonic } from 'lib/wallet';
import { DEFAULT_HD_PATH } from 'lib/constants';
import { generateWallet } from 'lib/invite';
import { generateOwnershipWallet } from 'lib/walletgen';
import { useLocalRouter } from 'lib/LocalRouter';
import useImpliedTicket from 'lib/useImpliedTicket';
import { timeout } from 'lib/timeout';
import useHasDisclaimed from 'lib/useHasDisclaimed';
import useBreakpoints from 'lib/useBreakpoints';

import BridgeForm from 'form/BridgeForm';
import SubmitButton from 'form/SubmitButton';
import { TicketInput } from 'form/Inputs';
import {
  composeValidator,
  buildPatqValidator,
  hasErrors,
  buildCheckboxValidator,
} from 'form/validators';
import FormError from 'form/FormError';

import { useActivateFlow } from './ActivateFlow';
import { WARNING } from 'form/helpers';
import { convertToInt } from 'lib/convertToInt';
import { patp2dec } from 'lib/patp2dec';

export default function ActivateCode() {
  const history = useHistory();
  const { names, push } = useLocalRouter();
  const { contracts } = useNetwork();
  const { impliedPoint, impliedTicket } = useImpliedTicket();
  const [hasDisclaimed] = useHasDisclaimed();
  const didWarn = useRef(false);

  const {
    setDerivedPoint,
    setDerivedWallet,
    setInviteWallet,
  } = useActivateFlow();
  // this is a pretty naive way to detect if we're on a mobile device
  // (i.e. we're checking the width of the screen)
  // but it will suffice for the 99% case and if someone wants to get around it
  // well by golly they're allowed to turn their phone into landscape mode
  // for this screen
  const activationAllowed = useBreakpoints([false, true, true]);

  const goToLogin = useCallback(() => history.popAndPush(ROUTE_NAMES.LOGIN), [
    history,
  ]);

  const goToPassport = useCallback(() => {
    if (!hasDisclaimed) {
      push(names.DISCLAIMER, { next: names.PASSPORT });
    } else {
      push(names.PASSPORT);
    }
  }, [hasDisclaimed, names.DISCLAIMER, names.PASSPORT, push]);

  const validateForm = useCallback((values, errors) => {
    didWarn.current = false;

    if (hasErrors(errors)) {
      return errors;
    }
  }, []);

  const validate = useMemo(
    () =>
      composeValidator(
        { ticket: buildPatqValidator(), showTicket: buildCheckboxValidator() },
        validateForm
      ),
    [validateForm]
  );

  // derive and set our state on submission
  const onSubmit = useCallback(
    async _values => {
      await timeout(16); // allow the ui changes to flush before we lag it out

      // TODO: fallback logic to first use implied values if present, otherwise form values?
      // Derive wallet
      const impliedAzimuthPoint = patp2dec(impliedPoint);
      const _contracts = need.contracts(contracts);
      const { seed } = await generateOwnershipWallet(
        impliedAzimuthPoint,
        impliedTicket
      );
      const inviteWallet = walletFromMnemonic(seed, DEFAULT_HD_PATH);
      const _inviteWallet = need.wallet(inviteWallet);

      // Load associated points
      const owned = await azimuth.azimuth.getOwnedPoints(
        _contracts,
        _inviteWallet.address
      );
      const transferring = await azimuth.azimuth.getTransferringFor(
        _contracts,
        _inviteWallet.address
      );

      const incoming = [...owned, ...transferring];

      setInviteWallet(inviteWallet);

      // Set derived
      if (incoming.length > 0) {
        if (incoming.length > 1 && !didWarn.current) {
          didWarn.current = true;

          return {
            [WARNING]:
              'This invite code has multiple points available. ' +
              "Once you've activated this point, " +
              'activate the next with the same process.',
          };
        }

        const point = convertToInt(incoming[0], 10);

        setDerivedPoint(Just(point));
        setDerivedWallet(Just(await generateWallet(point, true)));
      } else {
        return {
          [FORM_ERROR]:
            'Invite code has no claimable point.\n' +
            'Check your invite code and try again?',
        };
      }
    },
    [
      contracts,
      impliedPoint,
      impliedTicket,
      setDerivedPoint,
      setDerivedWallet,
      setInviteWallet,
    ]
  );

  const initialValues = useMemo(
    () => ({ ticket: impliedTicket || '', showTicket: true }),
    [impliedTicket]
  );

  return (
    <View inset>
      <Grid>
        <Grid.Item full as={H4} className="mt3">
          Welcome. This is your Urbit.
        </Grid.Item>
        {!impliedTicket && (
          <Grid.Item full as={P} className="mb2">
            Enter your activation code to continue.
          </Grid.Item>
        )}

        {impliedPoint && (
          <Grid.Item full as={P} className="mb2">
            {impliedPoint}
          </Grid.Item>
        )}
        <BridgeForm
          validate={validate}
          onSubmit={onSubmit}
          afterSubmit={goToPassport}
          initialValues={initialValues}>
          {({ validating, values, submitting, handleSubmit }) => (
            <>
              {!impliedTicket && (
                <>
                  <Grid.Item
                    full
                    as={TicketInput}
                    type={values.showTicket ? 'text' : 'password'}
                    name="ticket"
                    label="Activation Code"
                    disabled={!activationAllowed}
                  />

                  <Grid.Item
                    full
                    as={CheckboxInput}
                    name="showTicket"
                    label="Show"
                  />
                </>
              )}

              <Grid.Item full as={FormError} />

              <Grid.Item
                full
                as={SubmitButton}
                className="mt4"
                handleSubmit={handleSubmit}>
                {isWarning =>
                  validating
                    ? 'Deriving...'
                    : submitting
                    ? 'Generating...'
                    : isWarning
                    ? 'Continue Activation'
                    : 'Claim'
                }
              </Grid.Item>

              {!activationAllowed && (
                <Grid.Item full as={WarningBox} className="mt4">
                  For your security, please access Bridge on a desktop device.
                </Grid.Item>
              )}
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
