import React, { useCallback, useState } from 'react';
import { Grid, ErrorText, Flex } from 'indigo-react';
import { get } from 'lodash';
import { FORM_ERROR } from 'final-form';

import useCopiable from 'lib/useCopiable';
import useInviter from 'lib/useInviter';

import ProgressButton from 'components/ProgressButton';
import { ForwardButton } from 'components/Buttons';
import NeedFundsNotice from 'components/NeedFundsNotice';

import { hasErrors } from 'form/validators';
import { WARNING } from 'form/helpers';
const STATUS = {
  INPUT: 'INPUT',
  SENDING: 'SENDING',
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
};

const InviteUrl = ({ setSubmitting }) => {
  const { txStatus, needFunds, invites, generateInvites } = useInviter();

  const [error, setError] = useState();

  const generateInvite = useCallback(async () => {
    setSubmitting(true);
    const { errors } = await generateInvites(1);
    if (hasErrors(errors)) {
      setError(errors);
    }
    setSubmitting(false);
  }, [generateInvites, setSubmitting]);

  const renderGenerateButton = useCallback(() => {
    if (error) {
      return (
        <Grid.Item full className="mt4 p3 bg-red3 white f5">
          Error generating invite
        </Grid.Item>
      );
    }
    switch (txStatus) {
      case STATUS.INPUT:
        return (
          <Grid.Item
            solid
            full
            className="mt4"
            as={ForwardButton}
            onClick={() => generateInvite()}>
            Generate Invite URL
          </Grid.Item>
        );
      case STATUS.SENDING:
        return (
          <Grid.Item
            full
            as={ProgressButton}
            className="mt4"
            solid
            disabled
            success
            progress={0.5}>
            Generating Invite URL
          </Grid.Item>
        );
      default:
        return null;
    }
  }, [txStatus, error, generateInvite]);

  const url = `https://bridge.urbit.org/#${get(invites, '[0].ticket', '').slice(
    1
  )}`;

  const [doCopy, didCopy] = useCopiable(url);

  return (
    <Grid.Item full as={Grid} gap={3}>
      {invites.length > 0 && (
        <Grid.Item as={Flex} full col>
          <Flex.Item full className="b-gray3 b1 mt4 mb1 p1 flex flex-center">
            <div className="flex1 ml1 f6">{url}</div>
            <Flex.Item
              className="p2 bg-black white pointer-hover f6"
              onClick={() => doCopy()}>
              {didCopy ? 'Copied' : 'Copy'}
            </Flex.Item>
          </Flex.Item>
          <Flex.Item full className="f6 mb4 gray5">
            Your invite link expires after consumption.
          </Flex.Item>
        </Grid.Item>
      )}
      {invites.length === 0 && renderGenerateButton()}
      {needFunds && <Grid.Item full as={NeedFundsNotice} {...needFunds} />}
      {error && (
        <Grid.Item as={ErrorText}>
          {error[FORM_ERROR] || error[WARNING]}
        </Grid.Item>
      )}
    </Grid.Item>
  );
};

export default InviteUrl;
