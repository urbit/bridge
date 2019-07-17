import { useCallback, useState } from 'react';
import { fromWei } from 'web3-utils';

import { useNetwork } from 'store/network';
import { useWallet } from 'store/wallet';

import {
  signTransaction,
  sendSignedTransaction,
  waitForTransactionConfirm,
} from './txn';
import * as need from './need';
import { GAS_LIMITS } from './constants';
import useLifecycle from './useLifecycle';

const STATE = {
  NONE: 'NONE',
  SIGNED: 'SIGNED',
  BROADCASTED: 'BROADCASTED',
  CONFIRMED: 'CONFIRMED',
};

/**
 * manage the state around sending and confirming an ethereum transaction
 * @param {number} initialGasLimit
 */
export default function useEthereumTransaction(
  initialGasLimit = GAS_LIMITS.DEFAULT,
  initialGasPrice = 20
) {
  const { wallet, walletType, walletHdPath } = useWallet();
  const { web3, networkType } = useNetwork();
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

  const initializing = nonce === undefined || chainId === undefined;
  const constructed = !!unsignedTransaction;
  const isDefaultState = state === STATE.NONE;
  const signed = state === STATE.SIGNED;
  const broadcasted = state === STATE.BROADCASTED;
  const confirmed = state === STATE.CONFIRMED;

  // disable the inputs when:
  const inputsLocked = signed || broadcasted || confirmed;

  // we can sign when:
  const canSign = !initializing && constructed;

  const construct = useCallback(txn => setUnsignedTransaction(txn), [
    setUnsignedTransaction,
  ]);

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
      const txHash = await sendSignedTransaction(
        _web3,
        signedTransaction,
        /* doubtNonceError */ false
      );

      setState(STATE.BROADCASTED);
      setTxHash(txHash);

      await waitForTransactionConfirm(_web3, txHash);

      setState(STATE.CONFIRMED);
    } catch (error) {
      setError(error);
    }
  }, [_web3, setError, signedTransaction]);

  const reset = useCallback(() => {
    setUnsignedTransaction(undefined);
    setTxHash(undefined);
    setSignedTransaction(undefined);
    setGasPrice(suggestedGasPrice);
    setState(STATE.NONE);
    setError(undefined);
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

  const values = {
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
  };

  return {
    ...values,
    bind: values,
  };
}
