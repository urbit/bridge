import React, { useCallback } from 'react';
import { Just } from 'folktale/maybe';
import * as need from 'lib/need';
import { Grid } from 'indigo-react';

import { usePointCursor } from 'store/pointCursor';
import { usePointCache } from 'store/pointCache';
import { useHistory } from 'store/history';

import View from 'components/View';
import Passport from 'components/Passport';
import { ForwardButton } from 'components/Buttons';
import FooterButton from 'components/FooterButton';
import { matchBlinky } from 'components/Blinky';

import useInvites from 'lib/useInvites';
import { useSyncOwnedPoints } from 'lib/useSyncPoints';
import { ROUTE_NAMES } from 'lib/routeNames';
import { eqAddr } from 'lib/wallet';

import Actions from './Point/Actions';
import { useWallet } from 'store/wallet';

export default function Point() {
  const history = useHistory();
  const { pointCursor } = usePointCursor();
  const { pointCache } = usePointCache();
  const { wallet } = useWallet();

  const point = need.point(pointCursor);

  let canAdmin = false;
  if (point in pointCache) {
    canAdmin = wallet.matchWith({
      Nothing: () => false,
      Just: wal => {
        const pointDetails = need.fromPointCache(pointCache, point);
        const address = need.addressFromWallet(wallet);
        return (
          eqAddr(address, pointDetails.owner) ||
          eqAddr(address, pointDetails.managementProxy)
        );
      },
    });
  }

  // fetch the invites for the current cursor
  const { availableInvites } = useInvites(point);
  const availableInvitesText = matchBlinky(availableInvites);

  const showActions = Just.hasInstance(wallet);

  const goAdmin = useCallback(() => history.push(ROUTE_NAMES.ADMIN), [history]);

  const goInvite = useCallback(() => history.push(ROUTE_NAMES.INVITE), [
    history,
  ]);

  // sync the current cursor
  useSyncOwnedPoints([point]);

  return (
    <View>
      <Passport point={Just(point)} />
      <Grid className="pt2">
        <Grid.Item
          full
          as={ForwardButton}
          disabled={!canAdmin}
          onClick={goAdmin}>
          Admin
        </Grid.Item>
        <Grid.Divider />
        <Grid.Item full as={ForwardButton} detail="Boot your computer" disabled>
          Boot Arvo
        </Grid.Item>
        {showActions && (
          <Grid.Item full>
            <Actions />
          </Grid.Item>
        )}
      </Grid>

      <FooterButton onClick={goInvite}>
        Invite <sup>{availableInvitesText}</sup>
      </FooterButton>
    </View>
  );
}
