import React, { useCallback } from 'react';
import { Just } from 'folktale/maybe';
import { Grid } from 'indigo-react';
import * as need from 'lib/need';

import View from 'components/View';
import { ForwardButton } from 'components/Buttons';

import { ROUTE_NAMES } from 'lib/routeNames';
import { eqAddr } from 'lib/wallet';

import { useHistory } from 'store/history';
import { useWallet } from 'store/wallet';
import { usePointCursor } from 'store/pointCursor';
import { usePointCache } from 'store/pointCache';
import FooterButton from 'components/FooterButton';

export default function Admin() {
  const history = useHistory();
  const { urbitWallet, wallet } = useWallet();
  const { pointCursor } = usePointCursor();
  const { pointCache } = usePointCache();

  const point = need.point(pointCursor);
  const pointDetails = need.fromPointCache(pointCache, point);
  const address = need.addressFromWallet(wallet);

  const goRedownload = useCallback(() => history.push(ROUTE_NAMES.REDOWNLOAD), [
    history,
  ]);

  const goReticket = useCallback(() => history.push(ROUTE_NAMES.RETICKET), [
    history,
  ]);

  const goEditPerms = useCallback(() => history.push(ROUTE_NAMES.PERMISSIONS), [
    history,
  ]);

  const goTransfer = useCallback(() => history.push(ROUTE_NAMES.TRANSFER), [
    history,
  ]);

  const canDownloadPassport = Just.hasInstance(urbitWallet);
  const isOwner = eqAddr(address, pointDetails.owner);

  return (
    <View>
      <Grid className="pt2">
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
          as={ForwardButton}
          disabled={!isOwner}
          onClick={goReticket}
          detail="Move to brand new wallet, re-setting all permissions">
          Reticket
        </Grid.Item>
        <Grid.Item
          full
          as={ForwardButton}
          onClick={goEditPerms}
          detail="Management, networking keys, etc.">
          Edit permissions
        </Grid.Item>
      </Grid>

      <FooterButton
        detail="Transfer this identity to a new owner"
        disabled={!isOwner}
        onClick={goTransfer}>
        Transfer
      </FooterButton>
    </View>
  );
}
