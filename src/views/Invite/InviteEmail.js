import React, { useCallback, useEffect, useMemo, useState } from 'react';
import cn from 'classnames';
import Maybe from 'folktale/maybe';
import * as azimuth from 'azimuth-js';
import {
  Grid,
  Flex,
  Input,
  IconButton,
  HelpText,
  Text,
  ErrorText,
} from 'indigo-react';
import { uniq } from 'lodash';

import * as need from 'lib/need';
import * as wg from 'lib/walletgen';

// for transaction generation and signing
import {
  signTransaction,
  sendSignedTransaction,
  waitForTransactionConfirm,
  hexify,
  fromWei,
  toWei,
} from 'lib/txn';
import * as tank from 'lib/tank';
import { useLocalRouter } from 'lib/LocalRouter';

import MiniBackButton from 'components/MiniBackButton';
import useInvites from 'lib/useInvites';
import { usePointCursor } from 'store/pointCursor';
import LoadableButton from 'components/LoadableButton';
import useArray from 'lib/useArray';
import useForm from 'indigo-react/lib/useForm';
import { buildEmailInputConfig } from 'components/Inputs';
import { MIN_PLANET } from 'lib/constants';
import Highlighted from 'components/Highlighted';
import { useNetwork } from 'store/network';
import { usePointCache } from 'store/pointCache';
import { useWallet } from 'store/wallet';
import useSetState from 'lib/useSetState';
import pluralize from 'lib/pluralize';
import useMailer from 'lib/useMailer';
import useRenderCount from 'lib/useRenderCount';

const GAS_PRICE_GWEI = 20; // we pay the premium for faster ux
const GAS_LIMIT = 400000;
const INVITE_COST = toWei((GAS_PRICE_GWEI * GAS_LIMIT).toString(), 'gwei');

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

const kPendingAccessory = '⋯';
const kSuccessAccessory = '✔';
const kFailureAccessory = '×';

// world's simplest uid
let id = 0;
const buildInputConfig = (extra = {}) =>
  buildEmailInputConfig({ name: `email-${id++}`, ...extra });

const buildAccessoryFor = (dones, errors) => name => (
  <Flex justify="center" align="center" style={{ height: '100%' }}>
    {(() => {
      if (dones[name]) return kSuccessAccessory;
      if (errors[name]) return kFailureAccessory;
      return kPendingAccessory;
    })()}
  </Flex>
);

// TODO: test with tank, successful txs
// TODO: put accessory inside of input
export default function InviteEmail() {
  // TODO: resumption after error?
  const { pop } = useLocalRouter();
  const { contracts, web3, networkType } = useNetwork();
  const { wallet, walletType, walletHdPath } = useWallet();
  const { syncInvites } = usePointCache();
  const { pointCursor } = usePointCursor();
  const point = need.pointCursor(pointCursor);

  const { availableInvites } = useInvites(point);
  const maxInvitesToSend = availableInvites.matchWith({
    Nothing: () => 0,
    Just: p => p.value,
  });

  const [
    inputConfigs,
    { append: appendInput, removeAt: removeInputAt },
  ] = useArray(
    [buildInputConfig({ placeholder: 'Email Address' })],
    buildInputConfig
  );

  const { getHasRecieved, syncHasReceivedForEmail, sendMail } = useMailer();
  const [hovered, setHovered] = useSetState();
  const [invites, addInvite, clearInvites] = useSetState();
  const [receipts, addReceipt, clearReceipts] = useSetState();
  const [errors, addError, clearError] = useSetState();

  const [status, setStatus] = useState(STATUS.INPUT);
  const [needFunds, setNeedFunds] = useState(null);
  const [generalError, setGeneralError] = useState(null);

  const canInput = status === STATUS.INPUT;
  const canSend = status === STATUS.CAN_SEND;
  const isGenerating = status === STATUS.GENERATING;
  const isSending = status === STATUS.SENDING;
  const isFunding = status === STATUS.FUNDING;
  const isFailed = status === STATUS.FAILURE;
  const isDone = status === STATUS.SUCCESS;

  const dynamicConfigs = useMemo(
    () =>
      inputConfigs.map(config => {
        config.disabled = !canInput;
        const hasReceivedError = getHasRecieved(config.name).matchWith({
          Nothing: () => null, // loading
          Just: p => p.value && 'This email has already received an invite.',
        });
        config.error = hasReceivedError || errors[config.name];
        return config;
      }),
    [inputConfigs, errors, canInput, getHasRecieved]
  );
  const { inputs, pass } = useForm(dynamicConfigs);
  const emails = useMemo(() => inputs.map(i => i.data).filter(d => !!d), [
    inputs,
  ]);

  const canAddInvite = canInput && inputs.length < maxInvitesToSend;
  const allPass = pass && !generalError;
  const canGenerate = allPass && status === STATUS.INPUT;

  const progress = isGenerating
    ? Object.keys(invites).length
    : isSending
    ? Object.keys(receipts).length
    : null;
  const visualProgress = progress === null ? '-' : `${progress + 1}`;

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

    let errorCount = 0;
    clearInvites();
    // NB(shrugs) - must be processed in serial because main thread, etc
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
          wallet,
          walletType,
          walletHdPath,
          networkType,
          // TODO: ^ make a useTransactionSigner to encapsulate this logic
          txn: Maybe.Just(inviteTx),
          gasPrice: GAS_PRICE_GWEI.toString(),
          gasLimit: GAS_LIMIT.toString(),
          nonce: nonce + i,
          chainId,
          setStx: () => {},
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
    point,
    contracts,
    web3,
    addInvite,
    clearInvites,
    syncInvites,
    inputs,
    networkType,
    wallet,
    walletType,
    walletHdPath,
    addError,
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
      () => setNeedFunds(false)
    );

    setStatus(STATUS.SENDING);
    clearReceipts();

    let errorCount = 0;
    const txAndMailings = inputs.map(async input => {
      const invite = invites[input.name];
      try {
        const txHash = await sendSignedTransaction(
          _web3,
          Maybe.Just(invite.signedTx),
          tankWasUsed,
          () => {}
        );

        // TODO: waitForTransactionConfirm never rejects
        const didConfirm = await waitForTransactionConfirm(_web3, txHash);
        if (!didConfirm) throw new Error();
      } catch (error) {
        console.error(error);
        errorCount++;
        addError({
          [input.name]: `Transaction Failure for ${invite.email}`,
        });
        return;
      }

      try {
        await sendMail(invite.email, invite.ticket, invite.rawTx);
      } catch (error) {
        console.error(error);
        errorCount++;
        addError({
          [input.name]: `Mailing Failure for ${invite.email}`,
        });
      }

      addReceipt({ [input.name]: true });
    });

    await Promise.all(txAndMailings);
    // if there are any receipt errors, throw a general error
    if (errorCount > 0) {
      throw new Error(
        `There ${pluralize(errorCount, 'was', 'were')} ${pluralize(
          errorCount,
          'error'
        )} while sending transactions.`
      );
    }
  }, [
    web3,
    inputs,
    addReceipt,
    clearReceipts,
    invites,
    point,
    wallet,
    addError,
    sendMail,
  ]);

  const onClickGenerate = useCallback(async () => {
    setGeneralError(null);
    setStatus(STATUS.GENERATING);
    try {
      await generateInvites();
      setStatus(STATUS.CAN_SEND);
    } catch (error) {
      console.error(error);
      setGeneralError(error);
      setStatus(STATUS.FAILURE);
    }
  }, [setStatus, setGeneralError, generateInvites]);

  const onClickSend = useCallback(async () => {
    setGeneralError(null);
    setStatus(STATUS.SENDING);
    try {
      await sendInvites();
      setStatus(STATUS.SUCCESS);
    } catch (error) {
      console.error(error);
      setGeneralError(error);
      setStatus(STATUS.FAILURE);
    }
  }, [setStatus, sendInvites, setGeneralError]);

  const onClick = useCallback(() => {
    if (canGenerate) {
      onClickGenerate();
    } else if (canSend) {
      onClickSend();
    }
  }, [canGenerate, canSend, onClickGenerate, onClickSend]);

  useEffect(() => {
    if (uniq(emails).length !== emails.length) {
      setGeneralError(new Error(`Duplicate email.`));
    } else {
      setGeneralError(null);
    }
  }, [emails]);

  // when we transition to done, sync invites because we just sent some
  useEffect(() => {
    if (isDone) {
      syncInvites(point);
    }
  }, [isDone, syncInvites, point]);

  return (
    <Grid gap={12}>
      <Grid.Item as={Grid} full>
        <Grid.Item as={Flex} cols={[1, 11]} align="center">
          <MiniBackButton onClick={() => pop()} />
        </Grid.Item>
        <Grid.Item cols={[11, 13]} justifySelf="end">
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
      </Grid.Item>

      {isDone && (
        <>
          <Grid.Item as={Text} full>
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
                gap={12}
                onMouseOver={() => setHovered({ [input.name]: true })}
                onMouseLeave={() => setHovered({ [input.name]: false })}
                full>
                <Grid.Item
                  as={Input}
                  cols={[1, 11]}
                  {...input}
                  onValue={email => syncHasReceivedForEmail(email)}
                  // NB(shrugs): ^ this feels like a hack?
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
              <Highlighted>
                Your ownership address {needFunds.address} needs at least{' '}
                {fromWei(needFunds.minBalance)}ETH and currently has{' '}
                {fromWei(needFunds.balance)}.
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
