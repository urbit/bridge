import React, { useCallback } from 'react';
import { Just } from 'folktale/maybe';
import { Grid, B } from 'indigo-react';

import { useWallet } from 'store/wallet';

import { useLocalRouter } from 'lib/LocalRouter';
import useCurrentPermissions from 'lib/useCurrentPermissions';
import useKeyfileGenerator from 'lib/useKeyfileGenerator';

import { ForwardButton } from 'components/Buttons';
import ViewHeader from 'components/ViewHeader';
import DownloadKeyfileButton from 'components/DownloadKeyfileButton';

export default function AdminHome() {
  const { push, names } = useLocalRouter();
  const { urbitWallet } = useWallet();

  const { bind: keyfileBind } = useKeyfileGenerator();

  const { isOwner, canTransfer, isTransferProxySet } = useCurrentPermissions();

  const goRedownload = useCallback(() => push(names.REDOWNLOAD), [push, names]);
  const goReticket = useCallback(() => push(names.RETICKET), [push, names]);
  const goEditPermissions = useCallback(() => push(names.EDIT_PERMISSIONS), [
    push,
    names,
  ]);
  const goCancelTransfer = useCallback(() => push(names.CANCEL_TRANSFER), [
    names,
    push,
  ]);
  const goTransfer = useCallback(() => push(names.TRANSFER), [names, push]);

  const canDownloadPassport = Just.hasInstance(urbitWallet);

  return (
    <>
      <Grid>
        <Grid.Item full as={ViewHeader}>
          Admin
        </Grid.Item>

        <Grid.Item
          full
          as={ForwardButton}
          disabled={!canDownloadPassport}
          onClick={goRedownload}
          detail="Re-download your paper wallet"
          disabledDetail={
            <B className="wrap ws-normal">
              · Master Ticket Authentication required.
            </B>
          }>
          Download Passport
        </Grid.Item>
        <Grid.Divider />
        <Grid.Item
          full
          as={DownloadKeyfileButton}
          {...keyfileBind}
          detail="Download your current Arvo Keyfile">
          Download Arvo Keyfile
        </Grid.Item>
        <Grid.Divider />
        <Grid.Item
          full
          as={ForwardButton}
          disabled={!isOwner}
          onClick={goReticket}
          detail="Move to brand new wallet, resetting all permissions">
          Reticket
        </Grid.Item>
        <Grid.Divider />
        <Grid.Item
          full
          as={ForwardButton}
          onClick={goEditPermissions}
          detail="Proxies, networking keys, etc.">
          Edit Permissions
        </Grid.Item>
        <Grid.Divider />
        {isTransferProxySet ? (
          <Grid.Item
            full
            as={ForwardButton}
            onClick={goCancelTransfer}
            detail="Cancel outgoing transfer"
            disabled={!canTransfer}>
            Cancel Outgoing Transfer
          </Grid.Item>
        ) : (
          <Grid.Item
            full
            as={ForwardButton}
            onClick={goTransfer}
            detail="Transfer ownership of this ID"
            disabled={!canTransfer}>
            Transfer
          </Grid.Item>
        )}
        <Grid.Divider />
      </Grid>
    </>
  );
}
