import * as azimuth from 'azimuth-js';
import * as need from 'lib/need';
import * as ob from 'urbit-ob';
import { WARNING } from 'form/helpers';
import { FORM_ERROR } from 'final-form';
import { Just } from 'folktale/maybe';
import BridgeForm from 'form/BridgeForm';
import { TicketInput } from 'form/Inputs';
import {
  composeValidator,
  buildPatqValidator,
  hasErrors,
  buildCheckboxValidator,
} from 'form/validators';
import FormError from 'form/FormError';
import { CheckboxInput, Grid } from 'indigo-react';
import { useCallback, useMemo, useRef } from 'react';
import { useActivateFlow } from './ActivateFlow';
import WarningBox from 'components/WarningBox';
import useRoller from 'lib/useRoller';
import useImpliedTicket from 'lib/useImpliedTicket';
import {
  generateTemporaryOwnershipWallet,
  generateWallet,
} from 'lib/walletgen';
import { walletFromMnemonic } from 'lib/wallet';
import { useNetwork } from 'store/network';
import { DEFAULT_HD_PATH, POINT_DOMINIONS, POINT_PROXIES } from 'lib/constants';
import useBreakpoints from 'lib/useBreakpoints';
import { Ship } from '@urbit/roller-api';
import { convertToInt } from 'lib/convertToInt';
import { Box } from '@tlon/indigo-react';
import { timeout } from 'lib/timeout';
import withFadeable from './withFadeable';
import ActivateButton from './ActivateButton';

interface ActivateCodeFormProps {
  afterSubmit: VoidFunction;
}

const ActivateCodeForm = ({ afterSubmit }: ActivateCodeFormProps) => {
  const { contracts } = useNetwork();
  const { api, getPoints } = useRoller();
  const { impliedAzimuthPoint, impliedTicket } = useImpliedTicket();
  const didWarn = useRef<boolean>(false);

  const {
    setDerivedPatp,
    setDerivedPoint,
    setDerivedPointDominion,
    setDerivedWallet,
    setInviteWallet,
    setIsIn,
  } = useActivateFlow();

  // this is a pretty naive way to detect if we're on a mobile device
  // (i.e. we're checking the width of the screen)
  // but it will suffice for the 99% case and if someone wants to get around it
  // well by golly they're allowed to turn their phone into landscape mode
  // for this screen
  const activationAllowed = useBreakpoints([false, true, true]);

  const validateForm = useCallback(
    (values, errors) => {
      didWarn.current = false;

      if (hasErrors(errors)) {
        return errors;
      }
    },
    [didWarn]
  );

  const validate = useMemo(
    () =>
      composeValidator(
        { ticket: buildPatqValidator(), showTicket: buildCheckboxValidator() },
        validateForm
      ),
    [validateForm]
  );

  const loadL1Points = useCallback(
    async (address: string): Promise<number[]> => {
      const _contracts = need.contracts(contracts);
      const owned = await azimuth.azimuth.getOwnedPoints(_contracts, address);
      const transferring = await azimuth.azimuth.getTransferringFor(
        _contracts,
        address
      );
      const incoming = [...owned, ...transferring];
      console.log('incoming L1 points', incoming);
      return incoming;
    },
    [contracts]
  );

  const loadl2points = useCallback(
    async (address: string): Promise<Ship[]> => {
      const owned = await getPoints(POINT_PROXIES.OWN, address);
      const transferring = await getPoints(POINT_PROXIES.TRANSFER, address);
      const incoming = [...owned, ...transferring];
      console.log('incoming L2 points', incoming);
      return incoming;
    },
    [getPoints]
  );

  // derive and set our state on submission
  const onSubmit = useCallback(
    async values => {
      // Allow UI animation to start
      await timeout(42);

      // Derive wallet
      const ticket = impliedTicket || values.ticket;
      const { seed } = await generateTemporaryOwnershipWallet(ticket);
      const inviteWallet = walletFromMnemonic(seed, DEFAULT_HD_PATH);
      setInviteWallet(inviteWallet);
      const _inviteWallet = need.wallet(inviteWallet);
      const inviteAddress = _inviteWallet.address;

      // Query for points depending on point's dominion
      const rollerPoint = await api.getPoint(impliedAzimuthPoint!);
      let incoming: number[] | Ship[];
      if (rollerPoint.dominion === POINT_DOMINIONS.L2) {
        incoming = await loadl2points(inviteAddress);
      } else {
        incoming = await loadL1Points(inviteAddress);
      }

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

        setDerivedPatp(Just(ob.patp(point)));
        setDerivedPoint(Just(point));
        setDerivedPointDominion(Just(rollerPoint.dominion));
        setDerivedWallet(Just(await generateWallet(point, ticket, true)));
        setIsIn(false);
        await timeout(100);
      } else {
        return {
          [FORM_ERROR]:
            'Invite code has no claimable point.\n' +
            'Check your invite code and try again?',
        };
      }
    },
    [
      api,
      impliedAzimuthPoint,
      impliedTicket,
      loadL1Points,
      loadl2points,
      setDerivedPatp,
      setDerivedPoint,
      setDerivedPointDominion,
      setDerivedWallet,
      setInviteWallet,
      setIsIn,
    ]
  );

  const initialValues = useMemo(
    () => ({ ticket: impliedTicket || '', showTicket: true }),
    [impliedTicket]
  );

  return (
    <Box
      display="flex"
      flexDirection="column"
      flexWrap="nowrap"
      height={'100%'}
      justifyContent="flex-end">
      <BridgeForm
        validate={validate}
        onSubmit={onSubmit}
        afterSubmit={afterSubmit}
        initialValues={initialValues}>
        {({ valid, validating, values, submitting, handleSubmit }) => (
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

            <Box
              display="flex"
              flexDirection="column"
              flexWrap="nowrap"
              height={'100%'}
              width={'100%'}
              justifyContent="flex-end">
              <ActivateButton
                disabled={!valid || submitting}
                onClick={handleSubmit}>
                {submitting ? 'Generating...' : 'Claim'}
              </ActivateButton>
            </Box>

            {!activationAllowed && (
              <Grid.Item full as={WarningBox} className="mt4">
                For your security, please access Bridge on a desktop device.
              </Grid.Item>
            )}
          </>
        )}
      </BridgeForm>
    </Box>
  );
};

export default ActivateCodeForm;

export const FadeableActivateCodeForm = withFadeable(ActivateCodeForm);
