import React, { useCallback, useEffect, useRef, useState } from 'react';
import cn from 'classnames';
import * as ob from 'urbit-ob';
import * as azimuth from 'azimuth-js';
import {
  Grid,
  Flex,
  IconButton,
  HelpText,
  Text,
  ErrorText,
  AccessoryIcon,
} from 'indigo-react';
import { uniq } from 'lodash';
import { fromWei, toWei } from 'web3-utils';
import { FieldArray } from 'react-final-form-arrays';

import { usePointCursor } from 'store/pointCursor';
import { useNetwork } from 'store/network';
import { usePointCache } from 'store/pointCache';
import { useWallet } from 'store/wallet';

// for transaction generation and signing
import {
  signTransaction,
  sendSignedTransaction,
  waitForTransactionConfirm,
  hexify,
} from 'lib/txn';
import * as tank from 'lib/tank';
import { MIN_PLANET, GAS_LIMITS, DEFAULT_GAS_PRICE_GWEI } from 'lib/constants';
import * as need from 'lib/need';
import * as wg from 'lib/walletgen';
import useSetState from 'lib/useSetState';
import pluralize from 'lib/pluralize';
import useMailer from 'lib/useMailer';

import LoadableButton from 'components/LoadableButton';
import Highlighted from 'components/Highlighted';
import BridgeForm from 'form/BridgeForm';
import { Field } from 'react-final-form';
import { EmailInput, buildEmailValidator } from 'form/Inputs';
import { FORM_ERROR } from 'final-form';
import SubmitButton from 'form/SubmitButton';
import FormError from 'form/FormError';

const INITIAL_VALUES = { emails: [''] };

const GAS_LIMIT = GAS_LIMITS.GIFT_PLANET;
const INVITE_COST = toWei(
  (DEFAULT_GAS_PRICE_GWEI * GAS_LIMIT).toString(),
  'gwei'
);
const HAS_RECEIVED_TEXT = 'This email has already received an invite.';

const STATUS = {
  INPUT: 'INPUT',
  GENERATING: 'GENERATING',
  CAN_SEND: 'CAN_SEND',
  FUNDING: 'FUNDING',
  SENDING: 'SENDING',
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
};

const buttonText = (status, count) => {
  switch (status) {
    case STATUS.INPUT:
      return `Generate ${pluralize(count, 'Invite')}`;
    case STATUS.GENERATING:
      return `Generating ${pluralize(count, 'Invite')}...`;
    case STATUS.CAN_SEND:
      return `Send ${pluralize(count, 'Invite')}`;
    case STATUS.FUNDING:
      return `Waiting on Funds...`;
    case STATUS.SENDING:
      return `Sending ${pluralize(count, 'Invite')}...`;
    case STATUS.FAILURE:
    default:
      return 'Error';
  }
};

const buildAccessoryFor = (dones, errors) => name => {
  if (dones[name]) return <AccessoryIcon.Success />;
  if (errors[name]) return <AccessoryIcon.Failure />;
  return <AccessoryIcon.Pending />;
};

const emailFormatValidator = buildEmailValidator();

// TODO: test with tank, successful txs
export default function InviteEmail() {
  // TODO: resumption after error?
  const { contracts, web3, networkType } = useNetwork();
  const { wallet, walletType, walletHdPath } = useWallet();
  const { syncInvites, getInvites } = usePointCache();
  const { pointCursor } = usePointCursor();
  const point = need.point(pointCursor);
  const { getHasReceived, sendMail } = useMailer();

  const cachedEmails = useRef([]);

  const { availableInvites } = getInvites(point);
  const maxInvitesToSend = availableInvites.matchWith({
    Nothing: () => 0,
    Just: p => p.value,
  });

  // manage per-input state
  const [hovered, setHovered] = useSetState();
  const [invites, addInvite, clearInvites] = useSetState();
  const [receipts, addReceipt, clearReceipts] = useSetState();
  const [errors, addError] = useSetState();

  // manage general state that affects the whole form
  const [status, setStatus] = useState(STATUS.INPUT);
  const [needFunds, setNeedFunds] = useState(null);
  const [generalError, setGeneralError] = useState(null);

  // derive booleans from status
  const canInput = status === STATUS.INPUT;
  const canSend = status === STATUS.CAN_SEND;
  const isGenerating = status === STATUS.GENERATING;
  const isSending = status === STATUS.SENDING;
  const isFailed = status === STATUS.FAILURE;
  const isDone = status === STATUS.SUCCESS;

  const validate = useCallback(
    async values => {
      // compute the list of valid emails
      const emails = values.emails.filter(d => !!d);
      if (uniq(emails).length !== emails.length) {
        return { [FORM_ERROR]: 'Duplicate email.' };
      }

      let errors = {};
      for (let i = 0; i < values.emails.length; i++) {
        const name = `emails[${i}]`;
        const email = values.emails[i];

        // check individual email validity
        // TODO: validate each email individually using similar pattern from form/Inputs
        // and then reutrn that
        const error = await emailFormatValidator(email);
        if (error) {
          errors[name] = error;
          continue;
        }

        const hasReceived = await getHasReceived(email);
        if (hasReceived) {
          errors[name] = HAS_RECEIVED_TEXT;
          continue;
        }
      }

      console.log(errors);
      return errors;
    },
    [getHasReceived]
  );

  // progress is [0, .length] of invites or receipts, as we're generating them
  const progress = isGenerating
    ? Object.keys(invites).length
    : isSending
    ? Object.keys(receipts).length
    : null;
  const visualProgress = progress === null ? '-' : `${progress + 1}`;

  // build a builder for the accessory to the input, depending on status
  const accessoryFor = (() => {
    if (isGenerating || canSend) return buildAccessoryFor(invites, errors);
    if (isSending) return buildAccessoryFor(receipts, errors);
    if (isFailed) return buildAccessoryFor({}, errors);
    return () => null;
  })();

  const generateInvites = useCallback(
    async values => {
      debugger;
      const _contracts = contracts.getOrElse(null);
      const _web3 = web3.getOrElse(null);
      const _wallet = wallet.getOrElse(null);
      if (!_contracts || !_web3 || !_wallet) {
        // not using need because we want a custom error
        throw new Error('Internal Error: Missing Contracts/Web3/Wallet');
      }

      const nonce = await _web3.eth.getTransactionCount(_wallet.address);
      const chainId = await _web3.eth.net.getId();
      const planets = await azimuth.delegatedSending.getPlanetsToSend(
        _contracts,
        point,
        values.emails.length
      );

      // account for the race condition where invites got used up while we were
      // composing our target list
      if (planets.length < values.emails.length) {
        // resync invites to the cache, since they're out of date
        syncInvites(point);

        return {
          [FORM_ERROR]:
            `Can currently only send ${planets.length} invites. ` +
            `Please remove invites until you are within the limit.`,
        };
      }

      clearInvites();
      // NB(shrugs) - must be processed in serial because main thread, etc
      let errorCount = 0;
      for (let i = 0; i < values.emails.length; i++) {
        try {
          const email = values.emails[i];

          const { ticket, owner } = await wg.generateTemporaryTicketAndWallet(
            MIN_PLANET
            // we're always giving planets, so generate a ticket of the correct size
          );

          const inviteTx = azimuth.delegatedSending.sendPoint(
            _contracts,
            point,
            planets[i],
            owner.keys.address
          );
          const signedTx = await signTransaction({
            wallet: _wallet,
            walletType,
            walletHdPath,
            networkType,
            // TODO: ^ make a useTransactionSigner to encapsulate this logic
            txn: inviteTx,
            gasPrice: DEFAULT_GAS_PRICE_GWEI.toString(),
            gasLimit: GAS_LIMIT.toString(),
            nonce: nonce + i,
            chainId,
          });
          const rawTx = hexify(signedTx.serialize());

          addInvite({ [email]: { email, ticket, signedTx, rawTx } });
        } catch (error) {
          console.error(error);
          errorCount++;
          return {
            [FORM_ERROR]: `Wallet Error: unable to generate invite wallets.`,
          };
        }
      }

      if (errorCount > 0) {
        throw new Error(
          `There ${pluralize(errorCount, 'was', 'were')} ${pluralize(
            errorCount,
            'error'
          )} while generating wallets.`
        );
      }
    },
    [
      contracts,
      web3,
      wallet,
      point,
      clearInvites,
      syncInvites,
      walletType,
      walletHdPath,
      networkType,
      addInvite,
    ]
  );

  const sendInvites = useCallback(async () => {
    const _web3 = web3.getOrElse(null);
    const _wallet = wallet.getOrElse(null);
    if (!_web3 || !_wallet) {
      throw new Error('Internal Error: Missing Contracts/Web3/Wallet');
    }

    setStatus(STATUS.FUNDING);
    const tankWasUsed = await tank.ensureFundsFor(
      _web3,
      point,
      _wallet.address,
      INVITE_COST * cachedEmails.current.length,
      cachedEmails.current.map(email => invites[email].rawTx),
      (address, minBalance, balance) =>
        setNeedFunds({ address, minBalance, balance }),
      () => setNeedFunds(undefined)
    );

    setStatus(STATUS.SENDING);
    clearReceipts();

    let unsentInvites = [];
    let orphanedInvites = [];
    const txAndMailings = cachedEmails.current.map(async email => {
      const invite = invites[email];
      try {
        const txHash = await sendSignedTransaction(
          _web3,
          invite.signedTx,
          tankWasUsed
        );

        // TODO: waitForTransactionConfirm never rejects
        const didConfirm = await waitForTransactionConfirm(_web3, txHash);
        if (!didConfirm) throw new Error();
      } catch (error) {
        console.error(error);
        unsentInvites.push(invite);
        return;
      }

      try {
        await sendMail(
          invite.email,
          invite.ticket,
          ob.patp(point),
          invite.rawTx
        );
      } catch (error) {
        console.error(error);
        orphanedInvites.push(invite);
      }

      addReceipt({ [email]: true });
    });

    await Promise.all(txAndMailings);
    // if there are any receipt errors, throw a general error
    let errorString = '';
    if (orphanedInvites.length > 0) {
      errorString =
        'Not all invite emails were sent. ' +
        'Please send the following invite codes manually: ' +
        orphanedInvites.map(i => `${i.email}: ${i.ticket}`).join(', ') +
        '. ';
    }
    if (unsentInvites.length > 0) {
      errorString =
        errorString +
        'Not all invites were created. ' +
        'Did not send invites for: ' +
        unsentInvites.map(i => i.email).join(', ') +
        '.';
    }
    if (errorString !== '') {
      throw new Error(errorString);
    }
  }, [web3, addReceipt, clearReceipts, invites, point, wallet, sendMail]);

  const onSubmit = useCallback(
    async values => {
      setStatus(STATUS.GENERATING);
      await generateInvites(values);
      cachedEmails.current = values.emails;
      setStatus(STATUS.CAN_SEND);
    },
    [generateInvites]
  );

  const doSend = useCallback(async () => {
    setGeneralError(null);
    try {
      setStatus(STATUS.SENDING);
      await sendInvites();
      setStatus(STATUS.SUCCESS);
    } catch (error) {
      console.error(error);
      setGeneralError(error);
      setStatus(STATUS.FAILURE);
    }
  }, [sendInvites]);

  // when we transition to done, sync invites because we just sent some
  // and therefore know that state has changed
  useEffect(() => {
    if (isDone) {
      syncInvites(point);
    }
  }, [isDone, syncInvites, point]);

  return (
    <Grid gap={3}>
      <BridgeForm
        validate={validate}
        onSubmit={onSubmit}
        initialValues={INITIAL_VALUES}>
        {({ handleSubmit, valid, values }) => (
          <FieldArray name="emails">
            {({ fields }) => (
              <>
                <Grid.Item full as={Flex} justify="end">
                  {/* use hidden class instead of removing component from dom */}
                  {/* in order to avoid janky reflow */}
                  <IconButton
                    onClick={() => fields.push('')}
                    disabled={!canInput || fields.length >= maxInvitesToSend}
                    className={cn({ hidden: isDone })}
                    solid>
                    +
                  </IconButton>
                </Grid.Item>

                {isDone && (
                  <>
                    <Grid.Item as={Text} className="f5" full>
                      <Highlighted>
                        {pluralize(fields.length, 'invite')}
                      </Highlighted>{' '}
                      {pluralize(fields.length, 'has', 'have')} been
                      successfully sent
                    </Grid.Item>

                    {fields.map(name => (
                      <Grid.Item as={HelpText} key={name} full>
                        <Field name={name}>{({ value }) => value}</Field>
                      </Grid.Item>
                    ))}
                  </>
                )}

                {!isDone && (
                  <>
                    {fields.map((name, i) => {
                      const isFirst = i === 0;
                      return (
                        <Grid.Item
                          key={name}
                          full
                          as={Grid}
                          gap={3}
                          onMouseOver={() => setHovered({ [name]: true })}
                          onMouseLeave={() => setHovered({ [name]: false })}>
                          <Grid.Item
                            cols={[1, 11]}
                            as={EmailInput}
                            name={name}
                            label={isFirst ? 'Email Address' : undefined}
                            accessory={accessoryFor(name)}
                          />
                          <Field name={name}>
                            {({ meta: { active } }) => {
                              return (
                                <>
                                  {!isFirst &&
                                    (active || hovered[name]) &&
                                    canInput && (
                                      <Grid.Item
                                        cols={[11, 13]}
                                        justifySelf="end"
                                        alignSelf="center">
                                        <IconButton
                                          onClick={() => fields.remove(i)}
                                          solid
                                          secondary>
                                          -
                                        </IconButton>
                                      </Grid.Item>
                                    )}
                                </>
                              );
                            }}
                          </Field>
                        </Grid.Item>
                      );
                    })}

                    {canInput && (
                      <Grid.Item
                        full
                        as={SubmitButton}
                        handleSubmit={handleSubmit}>
                        {buttonText(status, fields.length)}
                      </Grid.Item>
                    )}

                    <Grid.Item
                      full
                      as={LoadableButton}
                      disabled={!(canInput || canSend || valid)}
                      accessory={`${visualProgress}/${fields.length}`}
                      onClick={doSend}
                      success={canSend}
                      solid>
                      {buttonText(status, fields.length)}
                    </Grid.Item>

                    {needFunds && (
                      <Grid.Item full>
                        <Highlighted warning>
                          Your ownership address {needFunds.address} needs at
                          least {fromWei(needFunds.minBalance)} ETH and
                          currently has {fromWei(needFunds.balance)} ETH.
                          Waiting until the account has enough funds.
                        </Highlighted>
                      </Grid.Item>
                    )}

                    <Grid.Item full as={FormError} />

                    {generalError && (
                      <Grid.Item full>
                        <ErrorText>{generalError.message.toString()}</ErrorText>
                      </Grid.Item>
                    )}
                  </>
                )}
              </>
            )}
          </FieldArray>
        )}
      </BridgeForm>
    </Grid>
  );
}
