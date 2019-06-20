import React, { useCallback } from 'react';
import * as need from 'lib/need';
import { Grid, H5, Text, Button } from 'indigo-react';

import { usePointCursor } from 'store/pointCursor';
// import { usePointCache } from 'store/pointCache';

import View from 'components/View';
import Crumbs from 'components/Crumbs';

import useInvites from 'lib/useInvites';
import useSyncPoint from 'lib/useSyncPoint';
import useCurrentPointName from 'lib/useCurrentPointName';

import { useHistory } from 'store/history';
import { ForwardButton } from 'components/Buttons';
import FooterButton from 'components/FooterButton';
import useRouter from 'lib/useRouter';
import InvitesSend from './InvitesSend';

const kInviteNames = {
  URL: 'URL',
  EMAIL: 'EMAIL',
};

const kInviteViews = {
  URL: InviteUrl,
  EMAIL: InvitesSend,
};

const valOrLoading = val =>
  val.matchWith({
    Nothing: () => '▓',
    Just: p => p.value,
  });

function Highlighted(props) {
  return <span className="red3" {...props} />;
}

function InviteUrl({ names, push }) {
  const pushEmail = useCallback(() => push(names.EMAIL), [push, names]);

  return (
    <>
      <Grid className="mt3">
        <Grid.Divider />
        <Grid.Item
          as={Button}
          detail="Generate a URL to send to one guest"
          full
          disabled>
          Generate Invite
        </Grid.Item>
        <Grid.Divider />
        <Grid.Item
          as={ForwardButton}
          onClick={pushEmail}
          detail="Send invitation to your guest's email"
          full>
          Send Invite via Email
        </Grid.Item>
      </Grid>
      <FooterButton detail="i.e. Ethereum Address, Text File" disabled>
        Advanced
      </FooterButton>
    </>
  );
}

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
  const availableInvitesText = valOrLoading(availableInvites);
  const sentInvitesText = valOrLoading(sentInvites);
  const acceptedInvitesText = valOrLoading(acceptedInvites);

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
