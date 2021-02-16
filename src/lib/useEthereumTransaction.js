import { useCallback, useEffect, useState } from 'react';
import { Just } from 'folktale/maybe';
import { toBN } from 'web3-utils';

import { useNetwork } from 'store/network';
import { useWallet } from 'store/wallet';
import { usePointCursor } from 'store/pointCursor';

import {
  GAS_LIMITS,
  DEFAULT_GAS_PRICE_GWEI,
  PROGRESS_ANIMATION_DELAY_MS,
} from './constants';
import {
  signTransaction,
  sendSignedTransaction,
  waitForTransactionConfirm,
  hexify,
} from './txn';
import * as need from 'lib/need';
import { ensureFundsFor } from 'lib/tank';
import useDeepEqualReference from 'lib/useDeepEqualReference';
import useGasPrice from 'lib/useGasPrice';
import timeout from 'lib/timeout';
import { safeToWei, safeFromWei } from 'lib/lib';

const STATE = {
  NONE: 'NONE',
  SIGNED: 'SIGNED',
  BROADCASTED: 'BROADCASTED',
  CONFIRMED: 'CONFIRMED',
  COMPLETED: 'COMPLETED',
};

/**
 * manage the state around sending and confirming an ethereum transaction
 * @param {Transaction Function()} transactionBuilder
 * @param {Promise<any> Function()} refetch async function called after completion
 * @param {number} initialGasLimit gas limit
 * @param {number} initialGasPrice gas price in gwei
 */
export default function useEthereumTransaction(
  transactionBuilder,
  refetch,
  initialGasLimit = GAS_LIMITS.DEFAULT,
  initialGasPrice = DEFAULT_GAS_PRICE_GWEI
) {
  const { wallet, walletType, walletHdPath } = useWallet();
  const { web3, networkType } = useNetwork();
  const { pointCursor } = usePointCursor();

  const _web3 = need.web3(web3);
  const _wallet = need.wallet(wallet);

  const [error, _setError] = useState();
  const setError = useCallback(
    error => {
      _setError(error);
      if (error) {
        console.error(error);
      }
    },
    [_setError]
  );
  const [state, setState] = useState(STATE.NONE);
  const [chainId, setChainId] = useState();
  const [nonce, setNonce] = useState();
  const { gasPrice, setGasPrice, resetGasPrice, waitTime } = useGasPrice(
    initialGasPrice
  );
  const [gasLimit] = useState(initialGasLimit);
  const [unsignedTransactions, setUnsignedTransactions] = useState();
  const [signedTransactions, setSignedTransactions] = useState();
  const [txHashes, setTxHashes] = useState();
  const [needFunds, setNeedFunds] = useState();
  const [confirmationProgress, setConfirmationProgress] = useState(0.0);

  const [finalCost, setFinalCost] = useState();

  const initializing = nonce === undefined || chainId === undefined;
  const constructed = !!unsignedTransactions;
  const isDefaultState = state === STATE.NONE;
  const signed = state === STATE.SIGNED;
  const broadcasted = state === STATE.BROADCASTED;
  const confirmed = state === STATE.CONFIRMED;
  const completed = state === STATE.COMPLETED;

  // lock inputs once we're out of the default state
  const inputsLocked = !isDefaultState;

  // we can sign when:
  const canSign = !initializing && constructed && isDefaultState;

  const construct = useCallback(
    async (...args) =>
      setUnsignedTransactions(await transactionBuilder(...args)),
    [transactionBuilder]
  );

  const unconstruct = useCallback(() => setUnsignedTransactions(undefined), [
    setUnsignedTransactions,
  ]);

  const generateAndSign = useCallback(async () => {
    try {
      setError(undefined);

      const utxs = Array.isArray(unsignedTransactions)
        ? unsignedTransactions
        : [unsignedTransactions];

      const txns = await Promise.all(
        utxs.map((utx, i) =>
          signTransaction({
            wallet: _wallet,
            walletType,
            walletHdPath,
            networkType,
            txn: utx,
            nonce: nonce + i,
            chainId,
            gasPrice: gasPrice.toFixed(0),
            gasLimit,
          })
        )
      );

      setSignedTransactions(txns);
      setState(STATE.SIGNED);
    } catch (error) {
      setError(error);
    }
  }, [
    _wallet,
    chainId,
    gasLimit,
    gasPrice,
    networkType,
    nonce,
    setError,
    unsignedTransactions,
    walletHdPath,
    walletType,
  ]);

  const broadcast = useCallback(async () => {
    try {
      setConfirmationProgress(0.0);
      setError(undefined);
      setState(STATE.BROADCASTED);

      const rawTxs = signedTransactions.map(stx => hexify(stx.serialize()));

      const costGwei = toBN(gasLimit)
        .mul(toBN(gasPrice))
        .mul(toBN(rawTxs.length));
      const cost = safeToWei(costGwei, 'gwei');
      let usedTank = false;
      // if this ethereum transaction is being executed by a specific point
      // see if we can use the tank
      if (Just.hasInstance(pointCursor)) {
        usedTank = await ensureFundsFor(
          _web3,
          pointCursor.value,
          _wallet.address,
          walletType,
          cost,
          rawTxs,
          (address, minBalance, balance) =>
            setNeedFunds({ address, minBalance, balance }),
          () => setNeedFunds(undefined)
        );
      }

      const txHashes = await signedTransactions.reduce(
        (acc, stx) =>
          acc.then(hashes =>
            sendSignedTransaction(
              _web3,
              stx,
              /* doubtNonceError */ usedTank
            ).then(hash => [...hashes, hash])
          ),
        Promise.resolve([])
      );

      setTxHashes(txHashes);

      await timeout(PROGRESS_ANIMATION_DELAY_MS);

      setConfirmationProgress(0.2);

      const receipts = await Promise.all(
        txHashes.map(txHash => waitForTransactionConfirm(_web3, txHash))
      );

      setFinalCost(
        safeFromWei(
          safeToWei(
            receipts.reduce(
              (acc, receipt) =>
                toBN(receipt.gasUsed)
                  .mul(toBN(gasPrice))
                  .add(acc),
              toBN(0)
            ),
            'gwei'
          ),
          'ether'
        )
      );

      setConfirmationProgress(0.9);

      setState(STATE.CONFIRMED);
    } catch (error) {
      setError(error);
    }
  }, [
    _wallet.address,
    _web3,
    gasLimit,
    gasPrice,
    pointCursor,
    setError,
    signedTransactions,
    walletType,
  ]);

  const reset = useCallback(() => {
    setTxHashes(undefined);
    setSignedTransactions(undefined);
    setNonce(undefined);
    setChainId(undefined);
    resetGasPrice();
    setState(STATE.NONE);
    setError(undefined);
    setNeedFunds(undefined);
    setConfirmationProgress(0.0);
    setFinalCost(undefined);
  }, [resetGasPrice, setError]);

  useEffect(() => {
    let mounted = true;
    // if nonce or chainId is undefined, re-fetch on-chain info
    if (!(nonce === undefined || chainId === undefined)) {
      return;
    }

    (async () => {
      try {
        setError(undefined);
        const [nonce, chainId] = await Promise.all([
          _web3.eth.getTransactionCount(_wallet.address),
          _web3.eth.net.getId(),
        ]);

        if (!mounted) {
          return;
        }

        setNonce(nonce);
        setChainId(chainId);
      } catch (error) {
        setError(error);
      }
    })();

    return () => (mounted = false);
  }, [_wallet, _web3, setError, nonce, chainId, networkType, initialGasPrice]);

  useEffect(() => {
    let mounted = true;

    if (confirmed) {
      (async () => {
        if (refetch) {
          try {
            await refetch();
          } catch (error) {
            // log the original
            console.error(error);
            // track a user-friendly error
            setError(
              new Error(
                'The transaction succeeded but we were unable to refresh chain state. Refresh to continue.'
              )
            );
          }
        }

        if (!mounted) {
          return;
        }

        setConfirmationProgress(1.0);

        await timeout(PROGRESS_ANIMATION_DELAY_MS);

        if (!mounted) {
          return;
        }

        setState(STATE.COMPLETED);
      })();
    }

    return () => (mounted = false);
  }, [confirmed, refetch, completed, setError]);

  const values = useDeepEqualReference({
    isDefaultState,
    initializing,
    construct,
    unconstruct,
    constructed,
    canSign,
    generateAndSign,
    signed,
    broadcast,
    broadcasted,
    confirmed,
    completed,
    reset,
    error,
    inputsLocked,
    confirmationProgress,
    txHashes,
    signedTransactions,
    gasPrice,
    setGasPrice,
    resetGasPrice,
    nonce,
    chainId,
    needFunds,
    gasLimit,
    unsignedTransactions,
    finalCost,
    waitTime,
  });

  return { ...values, bind: values };
}
