import React, { useCallback, useMemo } from 'react';
import cn from 'classnames';
import { Grid, H3, B, Text, CheckboxInput } from 'indigo-react';

import useHasDisclaimed from 'lib/useHasDisclaimed';
import { useLocalRouter } from 'lib/LocalRouter';

import View from 'components/View';
import WarningBox from 'components/WarningBox';
import BridgeForm from 'form/BridgeForm';
import SubmitButton from 'form/SubmitButton';
import { composeValidator, buildCheckboxValidator } from 'form/validators';

const textProps = {
  fontFamily: "Inter",
  fontSize: '14px',
  lineHeight: '20px'
}

export default function ActivateDisclaimer() {
  const { pop, popAndPush, data } = useLocalRouter();
  const [, setHasDisclaimed] = useHasDisclaimed();

  const validate = useMemo(
    () => composeValidator({ checkbox: buildCheckboxValidator(true) }),
    []
  );

  const initialValues = useMemo(() => ({ checkbox: false }), []);

  const goNext = useCallback(async () => {
    setHasDisclaimed(true);
    if (data.next) {
      popAndPush(data.next);
    } else {
      pop();
    }
  }, [data, pop, popAndPush, setHasDisclaimed]);

  return (
    <View>
      <Grid gap={2} className="mt8 mb10">
        <Grid.Item full>
          <Text as='h3' style={{...textProps, fontSize: '16px', fontWeight: 'bold'}}>Disclaimer</Text>
        </Grid.Item>
        <Grid.Item full>
          <Text as='p' style={textProps}>
            Welcome to Bridge. Please read this information. Your Urbit ID is considered a digital asset. You must secure it.  If you do not pay attention to these warnings, your digital assets could be stolen or compromised.
          </Text>

          <Text as='p' style={textProps}>
            <strong>You own and control your assets. We do not.</strong> If you send your assets to another address, we cannot get them back for you.
          </Text>

          <Text as='p' style={textProps}>Please understand that nobody can:</Text>

          <Text as={'ol'} style={{paddingLeft: '1em'}}>
            <Text as='li' style={textProps}>Access your assets for you;</Text>
            <Text as='li' style={textProps}>Recover, reset, or modify ANY of your information;</Text>
            <Text as='li' style={textProps}>Reverse, cancel, or refund transactions;</Text>
            <Text as='li' style={textProps}>Hold, back-up, or access your keys</Text>
          </Text>

          <Text as='p' style={{...textProps, fontWeight: 'bold'}}>
            You are responsible for keeping your information safe. This includes:
          </Text>

          <Text as={'ol'} style={{paddingLeft: '1em'}}>
            <Text as='li' style={textProps}>Private Keys/Mnemonic Phrases and passwords;</Text>
            <Text as='li' style={textProps}>JSON files; </Text>
            <Text as='li' style={textProps}>Hardware wallet PINs; </Text>
            <Text as='li' style={textProps}>Downloading this software from a reliable site, and ensuring it has not been tampered with</Text>
          </Text>

          <Text as='p' style={{...textProps, fontWeight: 'bold'}}>To be clear:</Text>

          <Text as='p' style={textProps}>
            This software is provided “as is” without warranties of any kind and
            our liability to you in connection with the same is limited;
          </Text>
          
          <Text as='p' style={textProps}>
            We have no liability for any security problems or incidents that you
            may experience, including any loss or theft of your keys or any
            problems that may arise in connection with your wallet.
          </Text>
        </Grid.Item>
        <BridgeForm
          validate={validate}
          afterSubmit={goNext}
          initialValues={initialValues}>
          {({ handleSubmit }) => (
            <>
              <Grid.Item
                full
                as={CheckboxInput}
                name="checkbox"
                label="I acknowledge and understand these rights"
              />

              <Grid.Item
                center
                full
                as={SubmitButton}
                handleSubmit={handleSubmit}>
                Continue
              </Grid.Item>
            </>
          )}
        </BridgeForm>
      </Grid>
    </View>
  );
}
