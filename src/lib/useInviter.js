import { useState, useCallback, useEffect } from 'react';
import { toWei, toBN } from 'web3-utils';
import * as azimuth from 'azimuth-js';
import { FORM_ERROR } from 'final-form';

import * as wg from 'lib/walletgen';
import * as tank from 'lib/tank';
import * as need from 'lib/need';
import pluralize from 'lib/pluralize';
import { GAS_LIMITS } from 'lib/constants';
import {
  signTransaction,
  sendSignedTransaction,
  waitForTransactionConfirm,
  hexify,
} from 'lib/txn';
import useGasPrice from 'lib/useGasPrice';
import { MIN_PLANET } from 'lib/constants';

import { useNetwork } from 'store/network';
import { useWallet } from 'store/wallet';
import { usePointCursor } from 'store/pointCursor';
import { usePointCache } from 'store/pointCache';

import { WARNING } from 'form/helpers';

const GAS_LIMIT = GAS_LIMITS.GIFT_PLANET;
const STATUS = {
  INPUT: 'INPUT',
  SENDING: 'SENDING',
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
};

const useInviter = () => {
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

export default useInviter;
