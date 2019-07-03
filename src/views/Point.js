import React, { useCallback } from 'react';
import Maybe from 'folktale/maybe';
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

import Actions from './Point/Actions';
import { useWallet } from 'store/wallet';

export default function Point() {
  const history = useHistory();
  const { pointCursor } = usePointCursor();
  const { pointCache } = usePointCache();
  const { wallet } = useWallet();

  const point = need.point(pointCursor);
  const hasInCache = point in pointCache;

  // fetch the invites for the current cursor
  const { availableInvites } = useInvites(point);
  const availableInvitesText = matchBlinky(availableInvites);

  const showActions = Maybe.Just.hasInstance(wallet);

  const goAdmin = useCallback(() => history.push(ROUTE_NAMES.ADMIN), [history]);

  const goInvite = useCallback(() => history.push(ROUTE_NAMES.INVITE), [
    history,
  ]);

  // sync the current cursor
  useSyncOwnedPoints([point]);

  return (
    <View>
      <Passport point={Maybe.Just(point)} />
      <Grid className="pt2">
        <Grid.Item
          full
          as={ForwardButton}
          disabled={!hasInCache}
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
