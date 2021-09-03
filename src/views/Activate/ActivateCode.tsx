import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Just } from 'folktale/maybe';
import * as azimuth from 'azimuth-js';
import { Grid, CheckboxInput } from 'indigo-react';
import { FORM_ERROR } from 'final-form';

import View from 'components/View';
import { ForwardButton } from 'components/Buttons';
import WarningBox from 'components/WarningBox';
import FooterButton from 'components/FooterButton';
import ActivateView from './ActivateView';

import { useNetwork } from 'store/network';
import { useHistory } from 'store/history';

import * as need from 'lib/need';
import { ROUTE_NAMES } from 'lib/routeNames';
import { walletFromMnemonic } from 'lib/wallet';
import { DEFAULT_HD_PATH, POINT_DOMINIONS, POINT_PROXIES } from 'lib/constants';
import { generateWallet } from 'lib/invite';
import { generateTemporaryOwnershipWallet } from 'lib/walletgen';
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
import PointPresenter from './PointPresenter';
import useRoller from 'lib/useRoller';
import { Ship } from '@urbit/roller-api';
import { Box, Text } from '@tlon/indigo-react';
import ActivateHeader from './ActivateHeader';
import { MasterKey } from './MasterKey';

export default function ActivateCode() {
  const history = useHistory();
  const { names, push } = useLocalRouter();
  const { contracts } = useNetwork();
  const {
    impliedAzimuthPoint,
    impliedPatp,
    impliedTicket,
  } = useImpliedTicket();
  const [hasDisclaimed] = useHasDisclaimed();
  const didWarn = useRef(false);
  const { api, getPoints } = useRoller();
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

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
      setIsGenerating(true);
      await timeout(16); // allow the ui changes to flush before we lag it out

      // Derive wallet
      // TODO: fallback logic to first use implied values if present, otherwise form values?
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
          setIsGenerating(false);

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
        setIsGenerating(false);

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
      setDerivedPoint,
      setDerivedWallet,
      setInviteWallet,
    ]
  );

  const initialValues = useMemo(
    () => ({ ticket: impliedTicket || '', showTicket: true }),
    [impliedTicket]
  );

  useEffect(() => {
    const fetchRollerPoint = async () => {
      if (!impliedAzimuthPoint) {
        return;
      }
      const p = await api.getPoint(impliedAzimuthPoint!);
      console.log(p);
    };

    fetchRollerPoint();
  }, [api, impliedAzimuthPoint]);

  const footer = useMemo(() => {
    return (
      <Box
        display="flex"
        flexDirection="column"
        flexWrap="nowrap"
        height={'100%'}
        justifyContent="flex-end">
        <Grid>
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
      </Box>
    );
  }, [
    activationAllowed,
    goToPassport,
    impliedTicket,
    initialValues,
    onSubmit,
    validate,
  ]);

  return (
    <View inset>
      <ActivateView
        header={
          !isGenerating && (
            <ActivateHeader copy={'Welcome. This is your Urbit.'} />
          )
        }
        footer={!isGenerating && footer}>
        <Box
          alignItems={'center'}
          display={'flex'}
          flexDirection={'column'}
          flexWrap={'nowrap'}
          height={'100%'}
          justifyContent={'center'}>
          {!impliedTicket && (
            <Text className="mb2">Enter your activation code to continue.</Text>
          )}
          {!isGenerating && impliedPatp && (
            <PointPresenter patp={impliedPatp} />
          )}
          {isGenerating && (
            <Box
              display={'flex'}
              flexDirection={'row'}
              flexWrap={'nowrap'}
              width={'80%'}
              height={'min-content'}
              justifyContent={'center'}>
              <MasterKey />
            </Box>
          )}
        </Box>
      </ActivateView>

      <FooterButton as={ForwardButton} onClick={goToLogin}>
        Login
      </FooterButton>
    </View>
  );
}
