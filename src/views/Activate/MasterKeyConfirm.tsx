import React, { useCallback, useMemo } from 'react';
import * as need from 'lib/need';

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
import NavHeader from 'components/NavHeader';
import { MiniBackButton } from 'components/MiniBackButton';

const MasterKeyConfirm = () => {
  const { derivedWallet, setIsIn } = useActivateFlow();
  const { ticket } = need.wallet(derivedWallet);
  const { push, names } = useLocalRouter();
  const STUB_VERIFY_TICKET = isDevelopment;
  const ticketSegments = useMemo(() => ticketToSegments(ticket), [ticket]);

  const onValues = useCallback(({ valid, values, form }) => {
    const { ticket0, ticket1, ticket2, ticket3 } = values;

    form.change(
      'ticket',
      ticketFromSegments([ticket0, ticket1, ticket2, ticket3])
    );
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
    push(names.DOWNLOAD);
  }, [names.DOWNLOAD, push, setIsIn]);

  const header = useMemo(() => {
    return (
      <Box>
        <ActivateHeader content={'Confirm Backup'} />
        <ActivateParagraph
          copy={
            'Confirm that you have stored your Master Key somewhere safe by entering it below'
          }
        />
      </Box>
    );
  }, []);

  useFadeIn();

  return (
    <View centered={true}>
      <NavHeader>
        <Box
          marginBottom={'10px'}>
          <MiniBackButton
            hpadding={true}
            vpadding={true}
            onClick={goBack}
            className=""
          />
        </Box>
      </NavHeader>
      <ActivateView
        header={header}
        gridRows={'20% 80%'}
        gridAreas={"'header' 'content'"}>
        <Box
          alignItems={'center'}
          display={'flex'}
          flexDirection={'column'}
          flexWrap={'nowrap'}
          height={'100%'}
          justifyContent={'center'}>
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
            {({ handleSubmit, valid }) => (
              <Box
                display={'grid'}
                gridTemplateAreas={"'inputs' 'submit'"}
                gridTemplateColumns={'1fr'}
                gridTemplateRows={'80% 20%'}
                width={'100%'}
                height={'100%'}>
                <Box
                  gridArea="inputs"
                  display={'flex'}
                  flexDirection={'column'}
                  flexWrap={'nowrap'}
                  height={'100%'}
                  alignItems={'center'}
                  justifyContent={'center'}>
                  <Box
                    display={'flex'}
                    flexDirection={'row'}
                    width={'80%'}
                    height={'min-content'}
                    flexWrap={'nowrap'}
                    justifyContent={'center'}>
                    {ticketSegments.map((segment, i) => {
                      return (
                        <Box
                          key={i}
                          display={'flex'}
                          flexDirection={'row'}
                          flexWrap={'nowrap'}>
                          <TicketSegmentInput
                            width={'75px'}
                            paddingY={'18px'}
                            fontSize={'16px'}
                            height={'24px'}
                            fontFamily={'Source Code Pro'}
                            borderRadius={'5px'}
                            border={'solid 1px rgba(0,0,0,0.25)'}
                            name={`ticket${i}`}
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
