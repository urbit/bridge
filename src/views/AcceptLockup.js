import React, { useCallback, useMemo } from 'react';
import cn from 'classnames';
import { Grid, Text } from 'indigo-react';
import * as azimuth from 'azimuth-js';
import { memoize } from 'lodash';

import { useNetwork } from 'store/network';
import { useWallet } from 'store/wallet';
import { useHistory } from 'store/history';

import * as need from 'lib/need';
import useEthereumTransaction from 'lib/useEthereumTransaction';
import { GAS_LIMITS } from 'lib/constants';
import { useLocalRouter } from 'lib/LocalRouter';
import { useFlowCommand } from 'lib/flowCommand';
import { isValidAddress, eqAddr } from 'lib/wallet';

import ViewHeader from 'components/ViewHeader';
import InlineEthereumTransaction from 'components/InlineEthereumTransaction';
import View from 'components/View';

import BridgeForm from 'form/BridgeForm';
import { AddressInput } from 'form/Inputs';
import { composeValidator } from 'form/validators';

function useAcceptLockup() {
  const { contracts } = useNetwork();
  const { push, names } = useHistory();

  const flow = useFlowCommand();

  const _contracts = need.contracts(contracts);

  const transaction = useEthereumTransaction(
    useCallback(
      from => {
        if (flow.lock === 'conditional') {
          return azimuth.conditionalSR.transferCommitment(_contracts, from);
        } else {
          return azimuth.linearSR.transferBatch(_contracts, from);
        }
      },
      [_contracts, flow]
    ),
    useCallback(() => push(names.STAR_RELEASE), [push, names]),
    GAS_LIMITS.TRANSFER_LOCKUP
  );

  return {
    ...transaction,
  };
}

export default function AcceptLockup() {
  const { pop } = useLocalRouter();
  const { contracts } = useNetwork();
  const { wallet } = useWallet();
  const flow = useFlowCommand();

  const _contracts = need.contracts(contracts);
  const _address = need.addressFromWallet(wallet);

  const {
    completed,
    bind,
    inputsLocked,
    construct,
    unconstruct,
  } = useAcceptLockup();

  const initialValues = useMemo(() => {
    if (!flow.from) return {};
    return { from: flow.from };
  }, [flow]);

  const getApproved = useMemo(() => {
    return memoize(async from => {
      console.log('------ looking up');
      const lok = await (flow.lock === 'conditional'
        ? azimuth.conditionalSR.getCommitment(_contracts, from)
        : azimuth.linearSR.getBatch(_contracts, from));
      return lok.approvedTransferTo;
    });
  }, [flow, _contracts]);

  const validate = useMemo(
    () =>
      composeValidator({
        from: async from => {
          if (!isValidAddress(from)) {
            return 'This is not a valid Ethereum address.';
          }
          const approved = await getApproved(from);
          if (!eqAddr(_address, approved)) {
            return 'Not permitted to take lockup from this address.';
          }
        },
      }),
    [_address, getApproved]
  );

  const onValues = useCallback(
    ({ valid, values, form }) => {
      if (valid) {
        construct(values.from);
      } else {
        unconstruct();
      }
    },
    [construct, unconstruct]
  );

  return (
    <View pop={pop} inset>
      <Grid>
        <Grid.Item full as={ViewHeader}>
          Accept Star Lockup
        </Grid.Item>

        <Grid.Item
          full
          as={Text}
          className={cn('f5 wrap', {
            green3: completed,
          })}>
          {completed
            ? `You have accepted the star lockup.`
            : `Accept the incoming transfer of a star lockup.`}
        </Grid.Item>

        <BridgeForm
          validate={validate}
          initialValues={initialValues}
          onValues={onValues}>
          {() => (
            <Grid.Item
              full
              as={AddressInput}
              name="from"
              label="Previous owner of the star lockup"
              disabled={inputsLocked}
              className="mv4"
            />
          )}
        </BridgeForm>

        <Grid.Item
          full
          as={InlineEthereumTransaction}
          {...bind}
          onReturn={() => pop()}
        />
      </Grid>
    </View>
  );
}
