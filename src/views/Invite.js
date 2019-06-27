import React from 'react';
import * as need from 'lib/need';
import { Grid, H5, Text } from 'indigo-react';

import { usePointCursor } from 'store/pointCursor';
import { useHistory } from 'store/history';

import View from 'components/View';
import Crumbs from 'components/Crumbs';
import Highlighted from 'components/Highlighted';
import { matchBlinky } from 'components/Blinky';

import useInvites from 'lib/useInvites';
import { useSyncOwnedPoints } from 'lib/useSyncPoints';
import useCurrentPointName from 'lib/useCurrentPointName';
import useRouter from 'lib/useRouter';
import { LocalRouterProvider } from 'lib/LocalRouter';

import InviteUrl from './Invite/InviteUrl';
import InviteEmail from './Invite/InviteEmail';

const kInviteNames = {
  URL: 'URL',
  EMAIL: 'EMAIL',
};

const kInviteViews = {
  URL: InviteUrl,
  EMAIL: InviteEmail,
};

export default function Invite() {
  const history = useHistory();
  const { Route, ...router } = useRouter({
    names: kInviteNames,
    views: kInviteViews,
    initialRoutes: [{ key: kInviteNames.URL }],
  });
  const { pointCursor } = usePointCursor();
  const point = need.point(pointCursor);
  const name = useCurrentPointName();

  // sync the current point
  useSyncOwnedPoints([point]);

  // get the invites for the current point
  const { availableInvites, sentInvites, acceptedInvites } = useInvites(point);

  // number or loading character
  const availableInvitesText = matchBlinky(availableInvites);
  const sentInvitesText = matchBlinky(sentInvites);
  const acceptedInvitesText = matchBlinky(acceptedInvites);

  return (
    <LocalRouterProvider value={router}>
      <View>
        <Grid className="mb4">
          <Grid.Item
            as={Crumbs}
            routes={[
              {
                text: name,
                action: () => history.pop(),
              },
              {
                text: 'Invite',
              },
            ]}
            full
          />
          <Grid.Item as={H5} className="mv4" full>
            Invite
          </Grid.Item>
          <Grid.Item as={Text} full>
            You currently have{' '}
            <Highlighted>{availableInvitesText} invitations</Highlighted> left.
            <br />
            Out of the <Highlighted>{sentInvitesText}</Highlighted> invites you
            sent, <Highlighted>{acceptedInvitesText}</Highlighted> have been
            accepted.
          </Grid.Item>
        </Grid>
        <Route />
      </View>
    </LocalRouterProvider>
  );
}
