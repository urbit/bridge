import React, { useState, useCallback, useMemo } from 'react';
import { Grid } from 'indigo-react';
import { FORM_ERROR } from 'final-form';
import * as ob from 'urbit-ob';
import { uniq, zip, compact, isEqual } from 'lodash';

import { usePointCursor } from 'store/pointCursor';

import * as need from 'lib/need';
import useMailer from 'lib/useMailer';
import { pluralize } from 'lib/pluralize';
import useInviter from 'lib/useInviter';

import {
  composeValidator,
  hasErrors,
  buildEmailValidator,
  buildArrayValidator,
} from 'form/validators';
import EmailChipInput from 'form/EmailChipInput';
import FormError from 'form/FormError';
import SubmitButton from 'form/SubmitButton';
import BridgeForm from 'form/BridgeForm';

import NeedFundsNotice from 'components/NeedFundsNotice';
import ProgressButton from 'components/ProgressButton';

const HAS_RECEIVED_TEXT = 'This email has already received an invite: ';

const STATUS = {
  INPUT: 'INPUT',
  SENDING: 'SENDING',
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
};

const InviteMail = ({ setSubmitting }) => {
  const {
    progress,
    txStatus,
    needFunds,
    generateInvites,
    resetInvites,
  } = useInviter();

  const { sendMail, getHasReceived } = useMailer();

  const [status, setStatus] = useState(STATUS.INPUT);

  const [count, setCount] = useState(0);
  const canInput = status === STATUS.INPUT;
  const isSending = txStatus === STATUS.SENDING || status === STATUS.SENDING;
  const isDone = status === STATUS.SUCCESS;
  const isFailed = status === STATUS.FAILED;

  const { pointCursor } = usePointCursor();
  const point = need.point(pointCursor);

  const sendInvites = useCallback(
    async (emails, invites) => {
      const mailingErrors = compact(
        await Promise.all(
          zip(emails, invites).map(([email, invite]) =>
            sendMail(email, invite.ticket, ob.patp(point), '', invite.rawTx)
              .then(() => null)
              .catch(
                () => `Sending ticket ${invite.ticket} to ${email} failed.`
              )
          )
        )
      ).join(', ');
      if (mailingErrors.length) {
        return { [FORM_ERROR]: mailingErrors };
      }
    },
    [point, sendMail]
  );

  const onSubmit = useCallback(
    async (values, form) => {
      const emailCount = values.emails.length;
      setCount(emailCount);
      setStatus(STATUS.SENDING);
      setSubmitting(true);
      const { errors, invites } = await generateInvites(emailCount);
      if (errors) {
        setStatus(STATUS.FAILED);
        setSubmitting(false);
        return errors;
      }
      const mailErrors = await sendInvites(values.emails, invites);
      if (mailErrors) {
        console.log(mailErrors);
        setStatus(STATUS.FAILED);
        setSubmitting(false);
        return mailErrors;
      }
      setSubmitting(false);
      setStatus(STATUS.SUCCESS);
      setTimeout(() => {
        setStatus(STATUS.INPUT);
        resetInvites();
        form.reset();
      }, 1500);
    },
    [setSubmitting, generateInvites, sendInvites, resetInvites]
  );

  const validateHasReceived = useCallback(
    async email => {
      const hasReceived = await getHasReceived(email);
      if (hasReceived) {
        return HAS_RECEIVED_TEXT + email;
      }
    },
    [getHasReceived]
  );

  const buttonText = useCallback(() => {
    switch (status) {
      case STATUS.INPUT:
        return 'Add to Invite Group';
      case STATUS.SENDING:
        return `Sending ${pluralize(count, 'Invite')}...`;
      case STATUS.SUCCESS:
        return `✓ ${pluralize(count, 'Invite')} sent`;
      case STATUS.FAILURE:
      default:
        return 'Error';
    }
  }, [status, count]);

  const renderButton = useCallback(
    handleSubmit => {
      if (canInput) {
        return (
          <Grid.Item full as={SubmitButton} handleSubmit={handleSubmit}>
            {buttonText()}
          </Grid.Item>
        );
      }

      if (isSending) {
        const percentProgress = progress / count;
        return (
          <Grid.Item
            full
            as={ProgressButton}
            className="mt4"
            solid
            disabled
            success
            progress={percentProgress}>
            {buttonText(count)}
          </Grid.Item>
        );
      }
      if (isDone) {
        return (
          <Grid.Item full className="mt4 p3 bg-green3 white f5">
            {buttonText(count)}
          </Grid.Item>
        );
      }
      if (isFailed) {
        return (
          <Grid.Item full className="mt4 p3 bg-red3 white f5">
            {buttonText(count)}
          </Grid.Item>
        );
      }

      return null;
    },
    [buttonText, isDone, isFailed, isSending, canInput, count, progress]
  );

  const validateForm = useCallback((values, errors) => {
    if (hasErrors(errors)) {
      return errors;
    }

    // check for email uniqenesss
    const emails = values.emails.filter(d => !!d);
    if (uniq(emails).length !== emails.length) {
      return { [FORM_ERROR]: 'Duplicate email.' };
    }
  }, []);

  const validate = useMemo(
    () =>
      composeValidator(
        {
          emails: buildArrayValidator(buildEmailValidator(validateHasReceived)),
        },
        validateForm
      ),
    [validateHasReceived, validateForm]
  );

  const initialValues = { emails: [] };
  return (
    <Grid.Item full as={Grid}>
      <BridgeForm
        validate={validate}
        initialValues={initialValues}
        initialValuesEqual={isEqual}
        onSubmit={onSubmit}>
        {({ handleSubmit, values }) => (
          <>
            <Grid.Item full as={EmailChipInput} name="emails" className="mt4" />
            {renderButton(handleSubmit)}

            <Grid.Item full as={FormError} />
            {needFunds && (
              <Grid.Item full as={NeedFundsNotice} {...needFunds} />
            )}
          </>
        )}
      </BridgeForm>
    </Grid.Item>
  );
};

export default InviteMail;
