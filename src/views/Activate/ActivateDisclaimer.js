import React, { useCallback } from 'react';
import { Grid, H3, P, B, Flex, Text, CheckboxInput } from 'indigo-react';

import View from 'components/View';
import { useCheckboxInput } from 'components/Inputs';
import { ForwardButton } from 'components/Buttons';
import { useLocalRouter } from 'lib/LocalRouter';
import WarningBox from 'components/WarningBox';

export default function ActivateDisclaimer() {
  const { push, names } = useLocalRouter();
  const checkboxInput = useCheckboxInput({
    name: 'checkbox',
    label: 'I acknowledge and understand these rights',
  });

  const goToPassport = useCallback(() => push(names.PASSPORT), [push, names]);

  return (
    <View>
      <Grid gap={2} className="mt8 mb10">
        <Grid.Item as={H3} full>
          Disclaimer
        </Grid.Item>
        <Grid.Item full>
          <Text className="f6 block mb4">
            Welcome to Bridge. Please read this information. Your assets could
            be stolen if you do not pay attention to these warnings.
          </Text>

          <Text className="f6 block mb4">
            <B>You own and control your assets. We do not.</B> If you send your
            assets to another address, we can’t get them back for you.
          </Text>

          <B className="f6">Please understand that nobody can:</B>
          <Text className="f6 block mb4">
            1. Access your assets for you <br />
            2. Recover, reset, or modify ANY of your information <br />
            3. Reverse, cancel, or refund transactions <br />
            4. Hold, back-up, or access your keys
          </Text>

          <B className="f6">
            You’re responsible for keeping your information safe. This includes:
          </B>
          <Text className="f6 block mb4">
            1. Private Keys/Mnemonic Phrases and passwords <br />
            2. JSON files <br />
            3. Hardware wallet PINs; <br />
            4. Downloading this software from a reliable site, and ensuring it
            has not been tampered with. [add something about using the checksum
            here]
          </Text>

          <B className="f6">To be clear</B>
          <Text className="f6 block">
            This software is provided “as is” without warranties of any kind and
            our liability to you in connection with the same is limited;
          </Text>
          <Text className="f6 block">
            We have no liability for any security problems or incidents that you
            may experience, including any loss or theft of your keys or any
            problems that may arise in connection with your wallet.
          </Text>
        </Grid.Item>
        <Grid.Item full as={WarningBox}>
          Warning: Nobody but you can restore or reset your Master Ticket
        </Grid.Item>
        <Grid.Item as={CheckboxInput} {...checkboxInput} full />
        <Grid.Item
          as={ForwardButton}
          disabled={!checkboxInput.data}
          onClick={goToPassport}
          solid
          full>
          Continue
        </Grid.Item>
      </Grid>
    </View>
  );
}
