import React, { useCallback } from 'react';
import { Grid, H3, P, B, Flex, Text, CheckboxInput } from 'indigo-react';

import View from 'components/View';
import { useCheckboxInput } from 'components/Inputs';
import { ForwardButton } from 'components/Buttons';
import { useLocalRouter } from 'lib/LocalRouter';

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
          <P>
            Welcome to Bridge. Please read this information. Your assets could
            be stolen if you do not pay attention to these warnings.
          </P>

          <P>
            <B>You own and control your assets. We do not.</B> If you send your
            assets to another address, we can’t get them back for you.
          </P>

          <B>Please understand that nobody can:</B>
          <P>
            1. Access your assets for you <br />
            2. Recover, reset, or modify ANY of your information <br />
            3. Reverse, cancel, or refund transactions <br />
            4. Hold, back-up, or access your keys
          </P>

          <B>
            You’re responsible for keeping your information safe. This includes:
          </B>
          <P>
            1. Private Keys/Mnemonic Phrases and passwords <br />
            2. JSON files <br />
            3. Hardware wallet PINs; <br />
            4. Downloading this software from a reliable site, and ensuring it
            has not been tampered with. [add something about using the checksum
            here]
          </P>

          <B>To be clear</B>
          <P>
            This software is provided “as is” without warranties of any kind and
            our liability to you in connection with the same is limited;
          </P>
          <P>
            We have no liability for any security problems or incidents that you
            may experience, including any loss or theft of your keys or any
            problems that may arise in connection with your wallet.
          </P>
        </Grid.Item>
        <Grid.Item as={Flex} className="bg-red1 pv3 ph4" align="center" full>
          <Text className="red3 fw-bold">
            Warning: We Can't Restore of Reset Your Master Ticket
          </Text>
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
