import { useCallback, useEffect, useState } from 'react';
import { Just } from 'folktale/maybe';
import { fromWei, toWei } from 'web3-utils';

import { useNetwork } from 'store/network';
import { useWallet } from 'store/wallet';
import { usePointCursor } from 'store/pointCursor';

import { GAS_LIMITS } from './constants';
import {
  signTransaction,
  sendSignedTransaction,
  waitForTransactionConfirm,
  hexify,
} from './txn';
import * as need from './need';
import useLifecycle from './useLifecycle';
import { ensureFundsFor } from './tank';
import useDeepEqualReference from './useDeepEqualReference';

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
  initialGasPrice = 20
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
  const [gasPrice, setGasPrice] = useState(initialGasPrice); // gwei
  const [suggestedGasPrice, setSuggestedGasPrice] = useState(gasPrice); // gwei
  const [gasLimit] = useState(initialGasLimit);
  const [unsignedTransaction, setUnsignedTransaction] = useState();
  const [signedTransaction, setSignedTransaction] = useState();
  const [txHash, setTxHash] = useState();
  const [needFunds, setNeedFunds] = useState();

  const initializing = nonce === undefined || chainId === undefined;
  const constructed = !!unsignedTransaction;
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
      setUnsignedTransaction(await transactionBuilder(...args)),
    [transactionBuilder]
  );

  const unconstruct = useCallback(() => setUnsignedTransaction(undefined), [
    setUnsignedTransaction,
  ]);

  const generateAndSign = useCallback(async () => {
    try {
      setError(undefined);

      const txn = await signTransaction({
        wallet: _wallet,
        walletType,
        walletHdPath,
        networkType,
        txn: unsignedTransaction,
        nonce,
        chainId,
        gasPrice: gasPrice.toFixed(0),
        gasLimit,
      });

      setSignedTransaction(txn);
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
    unsignedTransaction,
    walletHdPath,
    walletType,
  ]);

  const broadcast = useCallback(async () => {
    try {
      setError(undefined);

      const rawTx = hexify(signedTransaction.serialize());
      const cost = toWei(gasPrice.toFixed(0), 'gwei') * gasLimit;

      let usedTank = false;
      // if this ethereum transaction is being executed by a specific point
      // see if we can use the tank
      if (Just.hasInstance(pointCursor)) {
        usedTank = await ensureFundsFor(
          _web3,
          pointCursor.value,
          _wallet.address,
          cost,
          [rawTx],
          (address, minBalance, balance) =>
            setNeedFunds({ address, minBalance, balance }),
          () => setNeedFunds(undefined)
        );
      }

      const txHash = await sendSignedTransaction(
        _web3,
        signedTransaction,
        /* doubtNonceError */ usedTank
      );

      setState(STATE.BROADCASTED);
      setTxHash(txHash);

      await waitForTransactionConfirm(_web3, txHash);

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
    signedTransaction,
  ]);

  const reset = useCallback(() => {
    setUnsignedTransaction(undefined);
    setTxHash(undefined);
    setSignedTransaction(undefined);
    setGasPrice(suggestedGasPrice);
    setState(STATE.NONE);
    setError(undefined);
    setNeedFunds(undefined);
  }, [suggestedGasPrice, setError]);

  const resetGasPrice = useCallback(() => setGasPrice(suggestedGasPrice), [
    setGasPrice,
    suggestedGasPrice,
  ]);

  useLifecycle(() => {
    (async () => {
      try {
        setError(undefined);
        const [nonce, chainId, estimatedGasPrice] = await Promise.all([
          _web3.eth.getTransactionCount(_wallet.address),
          _web3.eth.net.getId(),
          _web3.eth.getGasPrice(),
        ]);

        setNonce(nonce);
        setChainId(chainId);
        const gasPrice = parseInt(fromWei(estimatedGasPrice, 'gwei'), 10);
        setSuggestedGasPrice(gasPrice);
        setGasPrice(gasPrice);
      } catch (error) {
        setError(error);
      }
    })();
  });

  useEffect(() => {
    let cancelled = false;

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

        if (cancelled) {
          return;
        }

        setState(STATE.COMPLETED);
      })();
    }

    return () => (cancelled = true);
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
    //
    txHash,
    signedTransaction,
    gasPrice,
    setGasPrice,
    resetGasPrice,
    nonce,
    chainId,
    needFunds,
  });

  return { ...values, bind: values };
}
