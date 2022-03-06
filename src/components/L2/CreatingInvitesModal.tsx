import { Col, H3, LoadingSpinner, Row, Text, Button } from '@tlon/indigo-react';
import Modal from 'components/L2/Modal';
import { ReactComponent as InviteIcon } from 'assets/invite.svg';
import { InviteGeneratingStatus } from '../../views/Invite/useInvites';
import BodyPane from './Window/BodyPane';

interface GeneratingModalProps {
  status: InviteGeneratingStatus;
  current: number;
  total: number;
  error?: string;
  hide: () => void;
}

export const CreatingInvitesModal = ({
  status,
  current,
  total,
  hide,
  error,
}: GeneratingModalProps) => {
  const successfulInvites = current > 1 ? current - 1 : 0;
  return (
    <Modal
      small
      show={status !== 'initial'}
      hide={hide}
      hideClose={status !== 'finished'}>
      <BodyPane p={0}>
        <Col width="350px">
          {status === 'generating' && (
            <Row alignItems="center">
              <LoadingSpinner dark />
              <Text bold marginLeft={2}>
                Creating Invite {current}/{total}...
              </Text>
            </Row>
          )}
          {status === 'finished' && (
            <>
              <Row mb={3}>
                <InviteIcon />
                <Text bold ml={2}>
                  All Invites Created
                </Text>
              </Row>
              <Text mb={3}>
                The planets you selected are re-ticketed and appear as new
                invitation links under each star.
              </Text>
              <Row>
                <Button className="secondary" ml="auto" onClick={hide}>
                  Close
                </Button>
              </Row>
            </>
          )}
          {status === 'errored' && (
            <>
              <H3 marginBottom={2}>
                There was an error while creating your invites:
              </H3>
              {error && (
                <Text color="red" mono marginBottom={3}>
                  {error}
                </Text>
              )}
              {!!successfulInvites && (
                <Text marginY={3}>
                  At least {successfulInvites} planet
                  {successfulInvites > 1 ? 's' : ''} were successfully
                  re-ticketed and appear as new invitation links under each
                  star.
                </Text>
              )}
              <Button className="secondary" onClick={hide}>
                Back
              </Button>
            </>
          )}
        </Col>
      </BodyPane>
    </Modal>
  );
};
