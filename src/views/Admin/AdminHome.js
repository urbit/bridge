import React, { useCallback } from 'react';
import { Just } from 'folktale/maybe';
import { Grid } from 'indigo-react';
import * as need from 'lib/need';

import { ForwardButton } from 'components/Buttons';

import { useWallet } from 'store/wallet';
import { usePointCursor } from 'store/pointCursor';

import usePermissionsForPoint from 'lib/usePermissionsForPoint';

import ViewHeader from 'components/ViewHeader';
import { useLocalRouter } from 'lib/LocalRouter';
import DownloadKeyfileButton from 'components/DownloadKeyfileButton';
import MiniBackButton from 'components/MiniBackButton';

export default function AdminHome() {
  const { push, names, pop } = useLocalRouter();
  const { urbitWallet, wallet } = useWallet();
  const { pointCursor } = usePointCursor();

  const point = need.point(pointCursor);
  const address = need.addressFromWallet(wallet);
  const { isOwner, canTransfer } = usePermissionsForPoint(address, point);

  const goRedownload = useCallback(() => push(names.REDOWNLOAD), [push, names]);
  const goReticket = useCallback(() => push(names.RETICKET), [push, names]);
  const goEditPermissions = useCallback(() => push(names.EDIT_PERMISSIONS), [
    push,
    names,
  ]);
  const goTransfer = useCallback(() => push(names.TRANSFER), [names, push]);

  const canDownloadPassport = Just.hasInstance(urbitWallet);

  return (
    <>
      <Grid>
        <Grid.Item full as={MiniBackButton} onClick={() => pop()} />
        <Grid.Item full as={ViewHeader}>
          Admin
        </Grid.Item>

        <Grid.Item
          full
          as={ForwardButton}
          disabled={!canDownloadPassport}
          onClick={goRedownload}
          detail="Re-download your paper wallet">
          Download Passport
        </Grid.Item>
        <Grid.Divider />
        <Grid.Item
          full
          as={DownloadKeyfileButton}
          detail="Download your Arvo Keyfile"
        />
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
        <Grid.Item
          full
          as={ForwardButton}
          onClick={goTransfer}
          detail="Transfer ownership of this point"
          disabled={!canTransfer}>
          Transfer
        </Grid.Item>
        <Grid.Divider />
      </Grid>
    </>
  );
}
