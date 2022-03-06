import { Col, H3, LoadingSpinner, Row, Text } from '@tlon/indigo-react';
import Modal from 'components/L2/Modal';
import { Button } from 'indigo-react';
import { InviteGeneratingStatus } from './useInvites';

interface GeneratingModalProps {
  status: InviteGeneratingStatus;
  current: number;
  total: number;
  fromStar?: string;
  error?: string;
  spawn?: boolean;
  hide: () => void;
}

export const GeneratingModal = ({
  status,
  current,
  total,
  hide,
  error,
  fromStar,
  spawn = true,
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
            <Col mb={3}>
              <Row alignItems="center">
                <LoadingSpinner dark />
                <H3 marginLeft={2}>
                  Generating {current} of {total} Invites
                </H3>
              </Row>
              {fromStar && <Text ml={4}>from {fromStar}</Text>}
            </Col>
            <Text>
              Each invite will require {spawn ? 'four' : 'three'} transactions
              to be signed, unless your point is owned by a master ticket.
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
