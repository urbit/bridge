import React, { useCallback } from 'react';
import { Just } from 'folktale/maybe';
import { Grid } from 'indigo-react';
import * as need from 'lib/need';

import { ForwardButton, DownloadButton } from 'components/Buttons';

import { useHistory } from 'store/history';
import { useWallet } from 'store/wallet';
import { usePointCursor } from 'store/pointCursor';

import useKeyfileGenerator from 'lib/useKeyfileGenerator';
import usePermissionsForPoint from 'lib/usePermissionsForPoint';

import FooterButton from 'components/FooterButton';
import ViewHeader from 'components/ViewHeader';
import Blinky from 'components/Blinky';
import { useLocalRouter } from 'lib/LocalRouter';

export default function AdminHome() {
  const history = useHistory();
  const { push, names } = useLocalRouter();
  const { urbitWallet, wallet } = useWallet();
  const { pointCursor } = usePointCursor();

  const point = need.point(pointCursor);
  const address = need.addressFromWallet(wallet);
  const { isOwner, canTransfer } = usePermissionsForPoint(address, point);

  const {
    generating: generatingKeyfile,
    available: keyfileAvailable,
    generateAndDownload: generateAndDownloadKeyfile,
  } = useKeyfileGenerator(point);

  const goRedownload = useCallback(() => push(names.REDOWNLOAD), [push, names]);
  const goReticket = useCallback(() => push(names.RETICKET), [push, names]);
  const goEditPermissions = useCallback(() => push(names.EDIT_PERMISSIONS), [
    push,
    names,
  ]);
  const goTransfer = useCallback(() => history.push(history.names.TRANSFER), [
    history,
  ]);

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
          detail="Re-download your paper wallet">
          Download Passport
        </Grid.Item>
        <Grid.Divider />
        <Grid.Item
          full
          as={DownloadButton}
          disabled={!keyfileAvailable}
          accessory={generatingKeyfile ? <Blinky /> : undefined}
          onClick={generateAndDownloadKeyfile}
          detail="Download your Arvo Keyfile">
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
      </Grid>
      <FooterButton
        detail="Transfer this identity to a new owner"
        disabled={!canTransfer}
        onClick={goTransfer}>
        Transfer
      </FooterButton>
    </>
  );
}
