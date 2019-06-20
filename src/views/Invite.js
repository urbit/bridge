import React from 'react';
import * as need from 'lib/need';
import { Grid, H5, Text } from 'indigo-react';

import { usePointCursor } from 'store/pointCursor';
import { useHistory } from 'store/history';
// import { usePointCache } from 'store/pointCache';

import View from 'components/View';
import Crumbs from 'components/Crumbs';

import useInvites from 'lib/useInvites';
import useSyncPoint from 'lib/useSyncPoint';
import useCurrentPointName from 'lib/useCurrentPointName';
import useRouter from 'lib/useRouter';
import loadingCharacter from 'lib/loadingCharacter';

import InviteUrl from './Invite/InviteUrl';
import InviteEmail from './Invite/InviteEmail';
import Highlighted from 'components/Highlighted';

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
  const { Route, ...routeProps } = useRouter({
    names: kInviteNames,
    views: kInviteViews,
    initialRoutes: [{ key: kInviteNames.URL }],
  });
  const { pointCursor } = usePointCursor();
  const point = need.pointCursor(pointCursor);
  const name = useCurrentPointName();

  // sync the current cursor
  useSyncPoint(point);

  // fetch the invites for the current cursor
  const { availableInvites, sentInvites, acceptedInvites } = useInvites(point);
  const availableInvitesText = loadingCharacter(availableInvites);
  const sentInvitesText = loadingCharacter(sentInvites);
  const acceptedInvitesText = loadingCharacter(acceptedInvites);

  return (
    <View>
      <Grid className="mb3">
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
      {/* TODO(shrugs): use context isntead of this routeProps nonsense */}
      <Route {...routeProps} />
    </View>
  );
}
