import React, { useCallback } from 'react';
import { Just } from 'folktale/maybe';
import * as need from 'lib/need';
import { Grid } from 'indigo-react';

import { usePointCursor } from 'store/pointCursor';
// import { usePointCache } from 'store/pointCache';

import View from 'components/View';
import Passport from 'components/Passport';
import { ForwardButton } from 'components/Buttons';

import useInvites from 'lib/useInvites';
import { ROUTE_NAMES } from 'lib/routeNames';

import { useHistory } from 'store/history';
import { useWallet } from 'store/wallet';
import FooterButton from 'components/FooterButton';

export default function Admin() {
  const history = useHistory();
  const { urbitWallet } = useWallet();
  const { pointCursor } = usePointCursor();
  // const { pointCache } = usePointCache();

  const point = need.point(pointCursor);

  // fetch the invites for the current cursor
  const { availableInvites } = useInvites(point);

  const goRedownload = useCallback(() => history.push(ROUTE_NAMES.REDOWNLOAD), [
    history,
  ]);

  const goReticket = useCallback(() => history.push(ROUTE_NAMES.RETICKET), [
    history,
  ]);

  // const pointDetails = need.fromPointCache(pointCache, point);

  const canDownloadPassport = Just.hasInstance(urbitWallet);

  return (
    <View>
      <Grid className="pt2">
        <Grid.Item full>
          <ForwardButton
            disabled={!canDownloadPassport}
            onClick={goRedownload}
            detail="Re-download your paper wallet">
            Download Passport
          </ForwardButton>
        </Grid.Item>
        <Grid.Divider />
        <Grid.Item full>
          <ForwardButton
            onClick={goReticket}
            detail="//TODO disable if not logged in as owner">
            Reticket
          </ForwardButton>
        </Grid.Item>
      </Grid>

      <FooterButton detail="Transfer this identity to a new owner" disabled>
        Transfer
      </FooterButton>
    </View>
  );
}
