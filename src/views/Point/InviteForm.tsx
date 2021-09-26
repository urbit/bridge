import cn from 'classnames';
import BarGraph from 'components/BarGraph';
import Chip from 'components/Chip';
import InviteSigilList from 'components/InviteSigilList';
import { Grid, Flex } from 'indigo-react';
import { Button } from '@tlon/indigo-react';
import Inviter from 'views/Invite/Inviter';

export const InviteForm = ({
  showInviteForm,
  setShowInviteForm,
  acceptedInvites,
  acceptedPoints,
  availableInvites,
  goCohort,
  pendingPoints,
  sentInvites,
  showInvites,
}) => {
  const _totalInvites =
    sentInvites.getOrElse(0) + availableInvites.getOrElse(0);
  const _pendingInvites = pendingPoints.getOrElse([]).length;

  return (
    <>
      <Grid.Item cols={[1, 11]}>
        Invite Group
        <br />
      </Grid.Item>

      <Grid.Item
        className={cn('t-right underline pointer-hover', {
          gray4: sentInvites.getOrElse(0) === 0,
        })}
        onClick={goCohort}
        cols={[11, 13]}>
        View
      </Grid.Item>
      <Grid.Item full>
        <Flex align="center">
          <Flex.Item>
            {acceptedInvites.getOrElse(0)} / {_totalInvites}
          </Flex.Item>
          {_pendingInvites > 0 && (
            <Flex.Item as={Chip} className="bg-yellow1 yellow4">
              {_pendingInvites} pending
            </Flex.Item>
          )}
        </Flex>
      </Grid.Item>

      {showInvites && (
        <>
          <Grid.Item
            full
            as={BarGraph}
            available={availableInvites}
            sent={sentInvites}
            accepted={acceptedInvites}
          />
          <Grid.Item
            full
            as={InviteSigilList}
            pendingPoints={pendingPoints}
            acceptedPoints={acceptedPoints}
          />
        </>
      )}
      {!showInvites && (
        <>
          <Grid.Item full className="b-gray4 b-dotted b1 self-center">
            <div className="p4 pv8 t-center gray4">
              Start your invite group by adding members
            </div>
          </Grid.Item>
        </>
      )}
      {!showInviteForm && availableInvites.getOrElse(0) > 0 && (
        <Grid.Item
          full
          solid
          as={Button}
          center
          onClick={() => setShowInviteForm(true)}>
          Add Members
        </Grid.Item>
      )}
      {showInviteForm && <Inviter />}
      <Grid.Item full className="mb2" />
    </>
  );
};
