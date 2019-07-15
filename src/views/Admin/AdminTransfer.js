import React, { useCallback } from 'react';
import { Grid, P, Text, Input } from 'indigo-react';
import { useLocalRouter } from 'lib/LocalRouter';

import ViewHeader from 'components/ViewHeader';
import MiniBackButton from 'components/MiniBackButton';
import { GenerateButton } from 'components/Buttons';
import { useAddressInput } from 'lib/useInputs';
import useCurrentPointName from 'lib/useCurrentPointName';

function useTransfer() {
  const transfer = useCallback(async () => {}, []);

  return {
    transfer,
  };
}

export default function AdminTransfer() {
  const { pop } = useLocalRouter();
  const name = useCurrentPointName();

  const [addressInput, { pass }] = useAddressInput({
    name: 'address',
    label: `Ethereum Address`,
  });

  const { transfer } = useTransfer();

  return (
    <Grid>
      <Grid.Item full as={MiniBackButton} onClick={() => pop()} />
      <Grid.Item full as={ViewHeader}>
        Transfer Point
      </Grid.Item>
      <Grid.Item full as={P}>
        Transfer {name} to a new owner.
      </Grid.Item>

      <Grid.Item full as={Input} {...addressInput} className="mv4" />

      <Grid.Item full as={GenerateButton} onClick={transfer} disabled={!pass}>
        Generate & Sign Transaction
      </Grid.Item>
    </Grid>
  );
}
