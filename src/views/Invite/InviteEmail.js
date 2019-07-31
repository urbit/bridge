import React, { useCallback, useEffect, useMemo, useState } from 'react';
import cn from 'classnames';
import * as ob from 'urbit-ob';
import * as azimuth from 'azimuth-js';
import {
  Grid,
  Flex,
  Input,
  IconButton,
  HelpText,
  Text,
  ErrorText,
  AccessoryIcon,
  useForm,
} from 'indigo-react';
import { uniq } from 'lodash';
import { fromWei, toWei } from 'web3-utils';

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
import useArray from 'lib/useArray';
import { buildEmailInputConfig } from 'lib/useInputs';
import { MIN_PLANET, GAS_LIMITS, DEFAULT_GAS_PRICE_GWEI } from 'lib/constants';
import * as need from 'lib/need';
import * as wg from 'lib/walletgen';
import useSetState from 'lib/useSetState';
import pluralize from 'lib/pluralize';
import useMailer from 'lib/useMailer';

import LoadableButton from 'components/LoadableButton';
import Highlighted from 'components/Highlighted';

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

// world's simplest uid
let id = 0;
const buildInputConfig = (extra = {}) =>
  buildEmailInputConfig({
    name: `email-${id++}`,
    placeholder: 'Email Address',
    ...extra,
  });

const buildAccessoryFor = (dones, errors) => name => {
  if (dones[name]) return <AccessoryIcon.Success />;
  if (errors[name]) return <AccessoryIcon.Failure />;
  return <AccessoryIcon.Pending />;
};

// TODO: test with tank, successful txs
export default function InviteEmail() {
  // TODO: resumption after error?
  const { contracts, web3, networkType } = useNetwork();
  const { wallet, walletType, walletHdPath } = useWallet();
  const { syncInvites, getInvites } = usePointCache();
  const { pointCursor } = usePointCursor();
  const point = need.point(pointCursor);
  const { getHasReceived, syncHasReceivedForEmail, sendMail } = useMailer();

  const { availableInvites } = getInvites(point);
  const maxInvitesToSend = availableInvites.matchWith({
    Nothing: () => 0,
    Just: p => p.value,
  });

  // manage the array of input configs
  const [
    inputConfigs,
    { append: appendInput, removeAt: removeInputAt },
  ] = useArray(
    [buildInputConfig({ label: 'Email Address', autoFocus: true })],
    buildInputConfig
  );

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

  // add disabled, error info to input configs
  const dynamicConfigs = useMemo(
    () =>
      inputConfigs.map(config => {
        config.disabled = !canInput;
        const hasReceivedError = getHasReceived(config.name).matchWith({
          Nothing: () => null, // loading
          Just: p => p.value && HAS_RECEIVED_TEXT,
        });
        config.error = hasReceivedError || errors[config.name];
        return config;
      }),
    [inputConfigs, errors, canInput, getHasReceived]
  );

  // construct the state of the set of inputs we're rendering below
  const { inputs, pass } = useForm(dynamicConfigs);
  // did all of the inputs pass inspection (and there are no general errors)?
  const allPass = pass && !generalError;
  // the form is submittable iff passing and input is allowed
  const canGenerate = allPass && canInput;
  // additional inputs can be added iff input is allowed and we have enough
  // invites to send
  const canAddInvite = canInput && inputConfigs.length < maxInvitesToSend;

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

  const generateInvites = useCallback(async () => {
    const _contracts = contracts.getOrElse(null);
    const _web3 = web3.getOrElse(null);
    const _wallet = wallet.getOrElse(null);
    if (!_contracts || !_web3 || !_wallet) {
      // not using need because we want a custom error
      throw new Error('Internal Error: Missing Contracts/Web3/Wallet');
    }

    //TODO want to do this on-input, but that gets weird. see #188
    let knowAll = true;
    let alreadyReceived = [];
    await Promise.all(
      inputs.map(async input => {
        const email = input.data;
        getHasReceived(email).matchWith({
          Nothing: () => {
            knowAll = false;
          },
          Just: p => {
            if (p.value) alreadyReceived.push(email);
          },
        });
      })
    );
    if (!knowAll) {
      throw new Error('No word yet from email service...');
    }
    if (alreadyReceived.length > 0) {
      throw new Error(
        'The following recipients already own a point: ' +
          alreadyReceived.join(', ')
      );
    }

    const nonce = await _web3.eth.getTransactionCount(_wallet.address);
    const chainId = await _web3.eth.net.getId();
    const planets = await azimuth.delegatedSending.getPlanetsToSend(
      _contracts,
      point,
      inputs.length
    );

    // account for the race condition where invites got used up while we were
    // composing our target list
    if (planets.length < inputs.length) {
      // resync invites to the cache, since they're out of date
      syncInvites(point);

      throw new Error(
        `Can currently only send ${planets.length} invites. ` +
          `Please remove invites until you are within the limit.`
      );
    }

    clearInvites();
    // NB(shrugs) - must be processed in serial because main thread, etc
    let errorCount = 0;
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      try {
        const { data: email, name } = inputs[i];

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

        addInvite({ [name]: { email, ticket, signedTx, rawTx } });
      } catch (error) {
        console.error(error);
        errorCount++;
        addError({ [input.name]: `Wallet Error: ${input.email}` });
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
  }, [
    contracts,
    web3,
    wallet,
    inputs,
    point,
    clearInvites,
    getHasReceived,
    addError,
    syncInvites,
    walletType,
    walletHdPath,
    networkType,
    addInvite,
  ]);

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
      INVITE_COST * inputs.length,
      inputs.map(input => invites[input.name].rawTx),
      (address, minBalance, balance) =>
        setNeedFunds({ address, minBalance, balance }),
      () => setNeedFunds(undefined)
    );

    setStatus(STATUS.SENDING);
    clearReceipts();

    let unsentInvites = [];
    let orphanedInvites = [];
    const txAndMailings = inputs.map(async input => {
      const invite = invites[input.name];
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
        const success = await sendMail(
          invite.email,
          invite.ticket,
          ob.patp(point),
          invite.rawTx
        );
        if (!success) throw new Error('Failed to send mail');
      } catch (error) {
        console.error(error);
        orphanedInvites.push(invite);
      }

      addReceipt({ [input.name]: true });
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
  }, [
    web3,
    inputs,
    addReceipt,
    clearReceipts,
    invites,
    point,
    wallet,
    sendMail,
  ]);

  const onClick = useCallback(async () => {
    setGeneralError(null);
    try {
      if (canGenerate) {
        setStatus(STATUS.GENERATING);
        await generateInvites();
        setStatus(STATUS.CAN_SEND);
      } else if (canSend) {
        setStatus(STATUS.SENDING);
        await sendInvites();
        setStatus(STATUS.SUCCESS);
      }
    } catch (error) {
      console.error(error);
      setGeneralError(error);
      setStatus(STATUS.FAILURE);
    }
  }, [canGenerate, canSend, generateInvites, sendInvites]);

  // when inputs update, check to see if any of them are duplicates
  useEffect(() => {
    // compute the list of valid emails
    const emails = inputs.map(i => i.data).filter(d => !!d);
    if (uniq(emails).length !== emails.length) {
      setGeneralError(new Error(`Duplicate email.`));
    } else {
      setGeneralError(null);
      setStatus(STATUS.INPUT);
    }
  }, [inputs]);

  // when we transition to done, sync invites because we just sent some
  // and therefore know that state has changed
  useEffect(() => {
    if (isDone) {
      syncInvites(point);
    }
  }, [isDone, syncInvites, point]);

  useEffect(() => {
    for (const input of inputs) {
      if (input.pass) {
        syncHasReceivedForEmail(input.data);
      }
    }
  }, [inputs, syncHasReceivedForEmail]);

  return (
    <Grid gap={3}>
      <Grid.Item full as={Flex} justify="end">
        {/* use hidden class instead of removing component from dom */}
        {/* in order to avoid janky reflow */}
        <IconButton
          onClick={() => appendInput()}
          disabled={!canAddInvite}
          className={cn({ hidden: isDone })}
          solid>
          +
        </IconButton>
      </Grid.Item>

      {isDone && (
        <>
          <Grid.Item as={Text} className="f5" full>
            <Highlighted>{pluralize(inputs.length, 'invite')}</Highlighted>{' '}
            {pluralize(inputs.length, 'has', 'have')} been successfully sent
          </Grid.Item>
          {inputs.map(input => (
            <Grid.Item as={HelpText} key={input.name} full>
              {invites[input.name].email}
            </Grid.Item>
          ))}
        </>
      )}

      {!isDone && (
        <>
          {/* email inputs */}
          {inputs.map((input, i) => {
            const isFirst = i === 0;
            return (
              <Grid.Item
                key={input.name}
                as={Grid}
                gap={3}
                onMouseOver={() => setHovered({ [input.name]: true })}
                onMouseLeave={() => setHovered({ [input.name]: false })}
                full>
                <Grid.Item
                  as={Input}
                  cols={[1, 11]}
                  {...input}
                  accessory={accessoryFor(input.name)}
                />
                {!isFirst &&
                  (input.focused || hovered[input.name]) &&
                  canInput && (
                    <Grid.Item
                      cols={[11, 13]}
                      justifySelf="end"
                      alignSelf="center">
                      <IconButton
                        onClick={() => removeInputAt(i)}
                        solid
                        secondary>
                        -
                      </IconButton>
                    </Grid.Item>
                  )}
              </Grid.Item>
            );
          })}

          <Grid.Item
            full
            as={LoadableButton}
            disabled={!canGenerate && !canSend}
            accessory={`${visualProgress}/${inputs.length}`}
            onClick={onClick}
            success={canSend}
            solid>
            {buttonText(status, inputs.length)}
          </Grid.Item>

          {needFunds && (
            <Grid.Item full>
              <Highlighted warning>
                Your ownership address {needFunds.address} needs at least{' '}
                {fromWei(needFunds.minBalance)} ETH and currently has{' '}
                {fromWei(needFunds.balance)} ETH. Waiting until the account has
                enough funds.
              </Highlighted>
            </Grid.Item>
          )}

          {generalError && (
            <Grid.Item full>
              <ErrorText>{generalError.message.toString()}</ErrorText>
            </Grid.Item>
          )}
        </>
      )}
    </Grid>
  );
}
