import React, { useCallback, useMemo, useState } from 'react';
import * as need from 'lib/need';
import cn from 'classnames';

import ActivateView from './ActivateView';
import { Box, Text } from '@tlon/indigo-react';
import { composeValidator, buildPatqValidator } from 'form/validators';
import { DEFAULT_FADE_TIMEOUT } from 'lib/constants';
import { FadeableActivateButton as ActivateButton } from './ActivateButton';
import { FadeableActivateHeader as ActivateHeader } from './ActivateHeader';
import { FadeableActivateParagraph as ActivateParagraph } from './ActivateParagraph';
import { FadeableActivateSteps as ActivateSteps } from './ActivateSteps';
import { isDevelopment } from 'lib/flags';
import { ticketFromSegments, ticketToSegments } from 'form/formatters';
import { timeout } from 'lib/timeout';
import { useActivateFlow } from './ActivateFlow';
import { useLocalRouter } from 'lib/LocalRouter';
import { validateExactly } from 'lib/validators';
import BridgeForm from 'form/BridgeForm';
import FormError from 'form/FormError';
import useFadeIn from './useFadeIn';
import { HiddenInput, TicketSegmentInput } from 'form/Inputs';
import View from 'components/View';

import './MasterKeyConfirm.scss';

const MasterKeyConfirm = () => {
  const { derivedWallet, setIsIn }: any = useActivateFlow();
  const { ticket } = need.wallet(derivedWallet);
  const { push, names }: any = useLocalRouter();
  const STUB_VERIFY_TICKET = isDevelopment;
  const ticketSegments = useMemo(() => ticketToSegments(ticket), [ticket]);
  const [showError, setShowError] = useState<boolean>(false);

  const onValues = useCallback(({ valid, values, form }) => {
    const { ticket0, ticket1, ticket2, ticket3 } = values;
    const tickets = [ticket0, ticket1, ticket2, ticket3];
    const allTicketsPopulated = tickets.every(t => t?.length === 6);

    setShowError(!valid && allTicketsPopulated);

    form.change('ticket', ticketFromSegments(tickets));
  }, []);

  const validate = useMemo(
    () =>
      composeValidator({
        ticket: buildPatqValidator([
          validateExactly(ticket, 'Does not match expected master ticket.'),
        ]),
      }),
    [ticket]
  );

  const initialValues = useMemo(
    () => ({
      ticket: STUB_VERIFY_TICKET ? ticket : undefined,
      ticket0: STUB_VERIFY_TICKET ? ticketSegments[0] : undefined,
      ticket1: STUB_VERIFY_TICKET ? ticketSegments[1] : undefined,
      ticket2: STUB_VERIFY_TICKET ? ticketSegments[2] : undefined,
      ticket3: STUB_VERIFY_TICKET ? ticketSegments[3].slice(0, 5) : undefined,
    }),
    [STUB_VERIFY_TICKET, ticket, ticketSegments]
  );

  const goToTransfer = useCallback(async () => {
    setIsIn(false);
    await timeout(DEFAULT_FADE_TIMEOUT); // Pause for UI fade animation
    push(names.TRANSFER);
  }, [names.TRANSFER, push, setIsIn]);

  const goBack = useCallback(async () => {
    setIsIn(false);
    await timeout(DEFAULT_FADE_TIMEOUT); // Pause for UI fade animation
    push(names.DOWNLOAD, { skipAnimationDelay: true });
  }, [names.DOWNLOAD, push, setIsIn]);

  const header = useMemo(() => {
    return (
      <Box>
        <ActivateHeader content={'Confirm Backup'} />
        <ActivateParagraph
          copy={
            'Confirm that you have stored your Master Ticket somewhere safe by entering it below'
          }
        />
      </Box>
    );
  }, []);

  useFadeIn();

  return (
    <View inset id={'master-key-confirm'}>
      <ActivateView
        onBack={goBack}
        header={header}
        gridRows={'20% 80%'}
        gridAreas={"'header' 'content'"}>
        <Box className={'content'}>
          <BridgeForm
            style={{
              display: 'flex',
              flexFlow: 'column nowrap',
              height: '100%',
              width: '100%',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            validate={validate}
            afterSubmit={goToTransfer}
            onValues={onValues}
            initialValues={initialValues}>
            {({ handleSubmit, valid }: any) => (
              <Box className="form-inner">
                <Box className="inputs-outer">
                  {showError && (
                    <Box height={'24px'}>
                      {/* this is a flexbox placeholder to balance the error message below*/}
                    </Box>
                  )}
                  <Box className="inputs-inner">
                    {ticketSegments.map((segment, i) => {
                      return (
                        <Box
                          key={i}
                          display={'flex'}
                          flexDirection={'row'}
                          flexWrap={'nowrap'}>
                          <TicketSegmentInput
                            className={cn('ticket-input', {
                              'has-error': showError,
                            })}
                            name={`ticket${i}`}
                            autoFocus={i === 0}
                          />
                          {i < ticketSegments.length - 1 ? (
                            <Text
                              key={i}
                              alignSelf="center"
                              color="gray"
                              mx={1}>
                              —
                            </Text>
                          ) : null}
                        </Box>
                      );
                    })}
                  </Box>
                  {showError && (
                    <Box>
                      <Text className="error-message">
                        The Master Ticket you entered is incorrect
                      </Text>
                    </Box>
                  )}
                </Box>

                <Box
                  full
                  style={{ display: 'none' }}
                  as={HiddenInput}
                  name="ticket"
                />

                <Box as={FormError} />

                <Box
                  display="flex"
                  flexDirection="column"
                  flexWrap="nowrap"
                  height={'100%'}
                  justifyContent="flex-end"
                  gridArea="submit">
                  <ActivateButton disabled={!valid} onClick={handleSubmit}>
                    Confirm Backup
                  </ActivateButton>
                </Box>
              </Box>
            )}
          </BridgeForm>
        </Box>
      </ActivateView>
      <ActivateSteps currentStep={2} totalSteps={4} overrideFadeIn={true} />
    </View>
  );
};

export default MasterKeyConfirm;
