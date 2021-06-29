import React, { useCallback, useEffect, useMemo } from 'react';
import cn from 'classnames';
import { Grid, Flex } from 'indigo-react';
import { conditionalSR, linearSR } from 'azimuth-js';

import * as need from 'lib/need';
import useEthereumTransaction from 'lib/useEthereumTransaction';
import { getLockupKind } from 'lib/starRelease';
import { eqAddr, isZeroAddress } from 'lib/utils/address';

import { useNetwork } from 'store/network';
import { useWallet } from 'store/wallet';
import { useHistory } from 'store/history';
import { useStarReleaseCache } from 'store/starRelease';

import InlineEthereumTransaction from 'components/InlineEthereumTransaction';
import CopiableWithTooltip from 'components/CopiableWithTooltip';
import CopiableAddress from 'components/CopiableAddress';
import NoticeBox from 'components/NoticeBox';

import { AddressInput } from 'form/Inputs';
import BridgeForm from 'form/BridgeForm';
import FormError from 'form/FormError';
import { composeValidator, buildAddressValidator } from 'form/validators';
import { isValidAddress } from 'ethereumjs-util';

function useTransferLockup(kind) {
  const { contracts } = useNetwork();

  return useEthereumTransaction(
    useCallback(
      to => {
        const _contracts = need.contracts(contracts);
        if (kind === 'conditional') {
          return conditionalSR.approveCommitmentTransfer(_contracts, to);
        } else {
          return linearSR.approveBatchTransfer(_contracts, to);
        }
      },
      [kind, contracts]
    ),
    () => {}
  );
}

export default function Transfer({ className, goActive }) {
  const { wallet } = useWallet();
  const { contracts } = useNetwork();
  const { pop } = useHistory();
  const address = need.addressFromWallet(wallet);

  const { syncStarReleaseDetails, starReleaseDetails } = useStarReleaseCache();

  useEffect(() => {
    syncStarReleaseDetails();
  }, [syncStarReleaseDetails]);

  const kind = useMemo(() => {
    return starReleaseDetails.map(a => a.kind).getOrElse('') === 'conditional'
      ? 'conditional'
      : 'linear';
  }, [starReleaseDetails]);

  const approvedFor = useMemo(() => {
    let approved;
    if (kind === 'conditional') {
      approved = starReleaseDetails.map(a => a.conditional.approvedTransferTo);
    } else {
      approved = starReleaseDetails.map(a => a.linear.approvedTransferTo);
    }
    approved = approved.getOrElse('0x0');
    if (isZeroAddress(approved) || eqAddr(approved, address)) {
      return false;
    } else {
      return approved;
    }
  }, [starReleaseDetails, kind, address]);

  const {
    bind,
    construct,
    unconstruct,
    inputsLocked,
    completed,
  } = useTransferLockup(kind);

  const onValues = useCallback(
    async ({ valid, values }) => {
      if (valid) {
        construct(values.to);
      } else {
        unconstruct();
      }
    },
    [construct, unconstruct]
  );

  const validate = useMemo(
    () =>
      composeValidator({
        to: async to => {
          if (!isValidAddress(to)) {
            return 'This is not a valid Ethereum address.';
          }
          const theirs = await getLockupKind(need.contracts(contracts), to);
          if (theirs === kind || theirs === 'both') {
            return `Target address already owns a ${kind} lockup.`;
          }
        },
      }),
    [kind, contracts]
  );

  return (
    <Grid gap={completed ? 0 : 6} className={cn('mt4', className)} full>
      <BridgeForm onValues={onValues} validate={validate}>
        {({ values, form }) => (
          <>
            {!completed && (
              <>
                <Grid.Item full className="f5">
                  Allow the specified address to take over your {kind} lockup.
                  <br />
                  After they accept the transfer, you will no longer be able to{' '}
                  withdraw from this lockup.
                </Grid.Item>
                {approvedFor && (
                  <Grid.Item full as={NoticeBox}>
                    Transfer currently approved for{' '}
                    <CopiableAddress>{approvedFor}</CopiableAddress>
                  </Grid.Item>
                )}
                <Grid.Item full className="f5" cols={[1, 13]} as={Flex} col>
                  <Flex.Item
                    name="to"
                    as={AddressInput}
                    label="Approve transfer to"
                    disabled={inputsLocked}
                  />
                </Grid.Item>
              </>
            )}

            <Grid.Item full as={FormError} />
            {completed && (
              <>
                <Grid.Item full className="pv4">
                  <CopiableAddress>{values.to}</CopiableAddress> is now allowed{' '}
                  to take ownership of this lockup. They can do so by visiting:
                </Grid.Item>
                <Grid.Item full as="code" className="f5 mb4 mono wrap">
                  https://bridge.urbit.org/?kind=takeLockup&lock={kind}
                  &from={address}
                </Grid.Item>
                <Grid.Divider />
              </>
            )}
            <Grid.Item
              full
              as={InlineEthereumTransaction}
              {...bind}
              label="Approve Transfer"
              onReturn={() => pop()}
            />
          </>
        )}
      </BridgeForm>
    </Grid>
  );
}
