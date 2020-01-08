import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { Grid, ErrorText } from 'indigo-react';
import { get, uniq, zip, compact, isEqual } from 'lodash';
import * as azimuth from 'azimuth-js';
import { FORM_ERROR } from 'final-form';
import { toWei, toBN } from 'web3-utils';
import * as ob from 'urbit-ob';

import * as need from 'lib/need';
import * as wg from 'lib/walletgen';
import * as tank from 'lib/tank';
import useCopiable from 'lib/useCopiable';

import Tabs from 'components/Tabs';
import ProgressButton from 'components/ProgressButton';
import { ForwardButton } from 'components/Buttons';
import NeedFundsNotice from 'components/NeedFundsNotice';

import { useNetwork } from 'store/network';
import { useWallet } from 'store/wallet';
import { usePointCursor } from 'store/pointCursor';
import { usePointCache } from 'store/pointCache';

import {
  signTransaction,
  sendSignedTransaction,
  waitForTransactionConfirm,
  hexify,
} from 'lib/txn';
import { MIN_PLANET, GAS_LIMITS } from 'lib/constants';
import pluralize from 'lib/pluralize';
import useGasPrice from 'lib/useGasPrice';

import EmailChipInput from 'form/EmailChipInput';
import FormError from 'form/FormError';
import SubmitButton from 'form/SubmitButton';
import BridgeForm from 'form/BridgeForm';
import {
  composeValidator,
  hasErrors,
  buildEmailValidator,
  buildArrayValidator,
} from 'form/validators';
import { WARNING } from 'form/helpers';
import useMailer from 'lib/useMailer';

const GAS_LIMIT = GAS_LIMITS.GIFT_PLANET;

const STATUS = {
  INPUT: 'INPUT',
  SENDING: 'SENDING',
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
};

const HAS_RECEIVED_TEXT = 'This email has already received an invite.';

const useInviter = sendInvites => {
  const { contracts, web3, networkType } = useNetwork();
  const { wallet, walletType, walletHdPath } = useWallet();
  const { pointCursor } = usePointCursor();
  const { syncInvites } = usePointCache();
  const { gasPrice } = useGasPrice();
  const point = need.point(pointCursor);

  const [needFunds, setNeedFunds] = useState(null);
  const [invites, setInvites] = useState([]);

  const [progress, setProgress] = useState(0);
  const [txStatus, setTxStatus] = useState(STATUS.INPUT);
  // const [errors, addError] = useSetState();

  const isDone = txStatus === STATUS.SUCCESS;
  useEffect(() => {
    if (isDone) {
      syncInvites(point);
    }
  }, [isDone, syncInvites, point]);

  const resetInvites = useCallback(() => {
    setProgress(0);
    setInvites([]);
    setTxStatus(STATUS.INPUT);
  }, [setProgress, setInvites, setTxStatus]);

  const generateInvites = useCallback(
    async numInvites => {
      const _contracts = contracts.getOrElse(null);
      const _web3 = web3.getOrElse(null);
      const _wallet = wallet.getOrElse(null);
      if (!_contracts || !_web3 || !_wallet) {
        // not using need because we want a custom error
        throw new Error('Internal Error: Missing Contracts/Web3/Wallet');
      }

      const nonce = await _web3.eth.getTransactionCount(_wallet.address);
      const chainId = await _web3.eth.net.getId();
      debugger;
      const planets = await azimuth.delegatedSending.getPlanetsToSend(
        _contracts,
        point,
        numInvites
      );

      setTxStatus(STATUS.SENDING);
      // account for the race condition where invites got used up while we were
      // composing our target list
      if (planets.length < numInvites) {
        // resync invites to the cache, since they're out of date
        syncInvites(point);

        setTxStatus(STATUS.FAILURE);

        return {
          errors: {
            [FORM_ERROR]:
              `Can currently only send ${planets.length} invites. ` +
              `Please remove invites until you are within the limit.`,
          },
        };
      }

      // NB(shrugs) - must be processed in serial because main thread, etc
      let signedInvites = [];
      let errorCount = 0;
      for (let i = 0; i < numInvites; i++) {
        setProgress(x => x + 1);
        try {
          const planet = planets[i];

          const { ticket, owner } = await wg.generateTemporaryTicketAndWallet(
            MIN_PLANET
            // we're always giving planets, so generate a ticket of the correct size
          );

          const inviteTx = azimuth.delegatedSending.sendPoint(
            _contracts,
            point,
            planet,
            owner.keys.address
          );

          const signedTx = await signTransaction({
            wallet: _wallet,
            walletType,
            walletHdPath,
            networkType,
            chainId,
            nonce: nonce + i,
            // TODO: ^ make a useTransactionSigner to encapsulate this logic
            txn: inviteTx,
            gasPrice: gasPrice.toFixed(), // expects string gwei
            gasLimit: GAS_LIMIT.toFixed(),
          });

          const rawTx = hexify(signedTx.serialize());

          signedInvites.push({ ticket, signedTx, rawTx });
        } catch (error) {
          console.error(error);
          return {
            errors: {
              [WARNING]: `There was an error while generating wallets.`,
            },
          };
        }
      }

      const totalCost = toBN(GAS_LIMIT)
        .mul(toBN(gasPrice))
        .mul(toBN(numInvites));
      const tankWasUsed = await tank.ensureFundsFor(
        _web3,
        point,
        _wallet.address,
        toWei(totalCost.toString(), 'gwei'),
        Object.keys(invites).map(name => invites[name].rawTx),
        (address, minBalance, balance) =>
          setNeedFunds({ address, minBalance, balance }),
        () => setNeedFunds(undefined)
      );

      let unsentInvites = [];
      let confirmedInvites = [];
      const txAndMailings = signedInvites.map(async invite => {
        try {
          const txHash = await sendSignedTransaction(
            _web3,
            invite.signedTx,
            tankWasUsed
          );

          await waitForTransactionConfirm(_web3, txHash);
          confirmedInvites.push(invite);
        } catch (error) {
          console.error(error);
          unsentInvites.push(invite);
          return;
        }
      });

      await Promise.all(txAndMailings);

      setTxStatus(STATUS.SUCCESS);
      setInvites(confirmedInvites);
      console.log(unsentInvites);
      console.log(confirmedInvites);

      if (unsentInvites.length > 0) {
        return { errors: { [FORM_ERROR]: unsentInvites } };
      }

      if (errorCount > 0) {
        return {
          errors: {
            [WARNING]: `There ${pluralize(
              errorCount,
              'was',
              'were'
            )} ${pluralize(
              errorCount,
              'error'
            )} while generating wallets. You can still send the invites that generated correctly.`,
          },
        };
      }
      return { invites: confirmedInvites };
    },
    [
      contracts,
      gasPrice,
      invites,
      networkType,
      point,
      syncInvites,
      wallet,
      walletHdPath,
      walletType,
      web3,
    ]
  );

  return {
    progress,
    txStatus,
    needFunds,
    invites,
    generateInvites,
    resetInvites,
  };
};

const InviteMail = () => {
  const { progress, txStatus, needFunds, generateInvites } = useInviter();

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
    async values => {
      const emailCount = values.emails.length;
      setCount(emailCount);
      setStatus(STATUS.SENDING);
      const { errors, invites } = await generateInvites(emailCount);
      if (errors) {
        setStatus(STATUS.FAILED);
        return errors;
      }
      const mailErrors = await sendInvites(values.emails, invites);
      console.log(mailErrors);
      if (mailErrors) {
        console.log(mailErrors);
        setStatus(STATUS.FAILED);
        return mailErrors;
      }
      setStatus(STATUS.SUCCESS);
    },
    [generateInvites, setCount, setStatus, sendInvites]
  );

  const validateHasReceived = useCallback(
    async email => {
      const hasReceived = await getHasReceived(email);
      if (hasReceived) {
        return HAS_RECEIVED_TEXT;
      }
    },
    [getHasReceived]
  );

  const buttonText = () => {
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
  };

  const renderButton = handleSubmit => {
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
  };

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
            {console.log(values) && null}
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

const InviteUrl = () => {
  const { txStatus, needFunds, invites, generateInvites } = useInviter();

  const [error, setError] = useState();

  const generateInvite = useCallback(async () => {
    const errors = await generateInvites(1);
    if (hasErrors(errors)) {
      setError(errors);
    }
  }, [generateInvites]);

  const renderGenerateButton = () => {
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
  };

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
      {error && <Grid.Item as={ErrorText}>{JSON.stringify(error)}</Grid.Item>}
    </Grid.Item>
  );
};

const InviteCohort = () => {
  const [tab, setTab] = useState(NAMES.MAIL);
  return (
    <Grid.Item
      full
      as={Tabs}
      tabClassName="t-center flex1"
      className="flex1"
      views={VIEWS}
      options={OPTIONS}
      currentTab={tab}
      onTabChange={setTab}
    />
  );
};

const NAMES = {
  MAIL: 'MAIL',
  URL: 'URL',
};

const VIEWS = {
  [NAMES.MAIL]: InviteMail,
  [NAMES.URL]: InviteUrl,
};

const OPTIONS = [
  { text: 'Email', value: NAMES.MAIL },
  { text: 'URL', value: NAMES.URL },
];

export default InviteCohort;
