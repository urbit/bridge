import React, { useCallback, useState } from 'react';
import { Grid, ErrorText } from 'indigo-react';
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

const InviteUrl = () => {
  const { txStatus, needFunds, invites, generateInvites } = useInviter();

  const [error, setError] = useState();

  const generateInvite = useCallback(async () => {
    const { errors } = await generateInvites(1);
    if (hasErrors(errors)) {
      setError(errors);
    }
  }, [generateInvites]);

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

  const url = `https://bridge.urbit.org/#${get(invites, '[0].ticket', '')}`;

  const [doCopy, didCopy] = useCopiable(url);

  return (
    <Grid.Item full as={Grid}>
      {invites.length > 0 && (
        <>
          <Grid.Item full className="b-gray3 b1 mv4 p1 flex flex-center">
            <div className="flex1 ml1">{url}</div>
            <Grid.Item
              className="pv3 ph4 bg-black white"
              onClick={() => doCopy()}>
              {didCopy ? 'Copied' : 'Copy'}
            </Grid.Item>
          </Grid.Item>
          <Grid.Item full>
            Your invite link expires after consumption.
          </Grid.Item>
        </>
      )}
      {invites.length === 0 && renderGenerateButton()}
      {needFunds && <Grid.Item full as={NeedFundsNotice} {...needFunds} />}
      {error[FORM_ERROR] ||
        (error[WARNING] && (
          <Grid.Item as={ErrorText}>
            {error[FORM_ERROR] || error[WARNING]}
          </Grid.Item>
        ))}
    </Grid.Item>
  );
};

export default InviteUrl;
