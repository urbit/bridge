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

const TEXT_STYLE = 'f5';

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
        <Grid.Item as={H3} full>
          Disclaimer
        </Grid.Item>
        <Grid.Item full>
          <Text className={cn(TEXT_STYLE, 'block mb4')}>
            Welcome to Bridge. Please read this information. Your Urbit ID is considered a digital asset. You must secure it.  If you do not pay attention to these warnings, your digital assets could be stolen or compromised.
          </Text>

          <Text className={cn(TEXT_STYLE, 'block mb4')}>
            <B>You own and control your assets. We do not.</B> If you send your
            assets to another address, we cannot get them back for you.
          </Text>

          <B className={TEXT_STYLE}>Please understand that nobody can:</B>
          <Text className={cn(TEXT_STYLE, 'block mb4')}>
            1. Access your assets for you <br />
            2. Recover, reset, or modify ANY of your information <br />
            3. Reverse, cancel, or refund transactions <br />
            4. Hold, back-up, or access your keys
          </Text>

          <B className={TEXT_STYLE}>
            You are responsible for keeping your information safe. This includes:
          </B>
          <Text className={cn(TEXT_STYLE, 'block mb4')}>
            1. Private Keys/Mnemonic Phrases and passwords <br />
            2. JSON files <br />
            3. Hardware wallet PINs; <br />
            4. Downloading this software from a reliable site, and ensuring it
            has not been tampered with
          </Text>

          <B className={TEXT_STYLE}>To be clear:</B>
          <Text className={cn(TEXT_STYLE, 'block')}>
            This software is provided “as is” without warranties of any kind and
            our liability to you in connection with the same is limited;
          </Text>
          <Text className={cn(TEXT_STYLE, 'block')}>
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
