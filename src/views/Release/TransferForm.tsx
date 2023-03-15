import * as need from 'lib/need';
import CopiableAddress from 'components/copiable/CopiableAddress';
import InlineEthereumTransaction from 'components/InlineEthereumTransaction';
import NoticeBox from 'components/NoticeBox';
import BridgeForm from 'form/BridgeForm';
import FormError from 'form/FormError';
import { AddressInput } from 'form/Inputs';
import { composeValidator } from 'form/validators';
import { Grid, Flex } from 'indigo-react';
import { useCallback, useEffect, useMemo } from 'react';
import { useHistory } from 'store/history';
import { useNetwork } from 'store/network';
import { useStarReleaseCache } from 'store/starRelease';
import { useWallet } from 'store/wallet';
import { eqAddr, isZeroAddress } from 'lib/utils/address';
import { useTransferLockup } from './useTransferLockup';
import { isValidAddress } from '@ethereumjs/util';
import { getLockupKind } from 'lib/starRelease';

interface TransferFormProps {
  afterSubmit: VoidFunction;
}

export const TransferForm = ({ afterSubmit }: TransferFormProps) => {
  const { wallet }: any = useWallet();
  const { contracts }: any = useNetwork();
  const { pop }: any = useHistory();
  const address = need.addressFromWallet(wallet);

  const {
    syncStarReleaseDetails,
    starReleaseDetails,
  }: any = useStarReleaseCache();

  useEffect(() => {
    syncStarReleaseDetails();
  }, [syncStarReleaseDetails]);

  const kind = useMemo(() => {
    return starReleaseDetails.map((a: any) => a.kind).getOrElse('') ===
      'conditional'
      ? 'conditional'
      : 'linear';
  }, [starReleaseDetails]);

  const approvedFor = useMemo(() => {
    let approved;
    if (kind === 'conditional') {
      approved = starReleaseDetails.map(
        (a: any) => a.conditional.approvedTransferTo
      );
    } else {
      approved = starReleaseDetails.map(
        (a: any) => a.linear.approvedTransferTo
      );
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
        to: async (to: string) => {
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
    <>
      <BridgeForm onValues={onValues} validate={validate}>
        {({ values }: any) => (
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
    </>
  );
};
