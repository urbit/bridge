import { Col, H3, LoadingSpinner, Row, Text } from '@tlon/indigo-react';
import Modal from 'components/L2/Modal';
import { Button } from 'indigo-react';
import { InviteGeneratingStatus } from './useInvites';

interface GeneratingModalProps {
  status: InviteGeneratingStatus;
  current: number;
  total: number;
  error?: string;
  hide: () => void;
}

export const GeneratingModal = ({
  status,
  current,
  total,
  hide,
  error,
}: GeneratingModalProps) => {
  const successfulInvites = current > 1 ? current - 1 : 0;
  return (
    <Modal
      show={status !== 'initial'}
      hide={hide}
      hideClose={status !== 'finished'}>
      <Col width="350px">
        {status === 'generating' && (
          <>
            <Row alignItems="center" marginBottom={2}>
              <LoadingSpinner dark />
              <H3 marginLeft={2}>
                Generating {current} of {total} Invites
              </H3>
            </Row>
            <Text>
              Each invite will require four transactions to be signed, unless
              your point is owned by a master ticket.
            </Text>
          </>
        )}
        {status === 'finished' && (
          <>
            <H3 marginBottom={2}>
              <span className="ph1 number-emphasis">{total}</span> Invites
              Generated
            </H3>
            <Text marginBottom={4}>
              Your invites have been sent to the roller for confirmation in the
              next batch. Check the point's page to see its status.
            </Text>
            {/*
            // @ts-ignore */}
            <Button solid onClick={hide}>
              Check Status
            </Button>
          </>
        )}
        {status === 'errored' && (
          <>
            <H3 marginBottom={2}>
              There was an error while generating your invites:
            </H3>
            {error && (
              <Text color="red" mono marginBottom={3}>
                {error}
              </Text>
            )}
            {!!successfulInvites && (
              <Text marginY={3}>
                At least {successfulInvites} invite
                {successfulInvites > 1 ? 's' : ''} were successfully generated.
                Go back to see them or try again.
              </Text>
            )}
            {/*
            // @ts-ignore */}
            <Button solid onClick={hide}>
              Back
            </Button>
          </>
        )}
      </Col>
    </Modal>
  );
};
