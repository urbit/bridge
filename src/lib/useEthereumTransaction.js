import { useCallback, useEffect, useState } from 'react';

import { useNetwork } from 'store/network';
import { useWallet } from 'store/wallet';

import {
  signTransaction,
  sendSignedTransaction,
  waitForTransactionConfirm,
} from './txn';
import * as need from './need';
import { fromWei } from 'web3-utils';

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
export default function useEthereumTransaction(initialGasLimit = 0) {
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
  const [gasPrice, setGasPrice] = useState(20); // gwei
  const [gasLimit] = useState(initialGasLimit);
  const [unsignedTransaction, setUnsignedTransaction] = useState();
  const [signedTransaction, setSignedTransaction] = useState();
  const [txHash, setTxHash] = useState();

  const initializing = nonce === undefined || chainId === undefined;
  const constructed = !!unsignedTransaction;
  const signed = state === STATE.SIGNED;
  const broadcasted = state === STATE.BROADCASTED;
  const confirmed = state === STATE.CONFIRMED;

  const inputsLocked = signed || broadcasted || confirmed;

  const canSign = !initializing && constructed;

  const construct = useCallback(txn => setUnsignedTransaction(txn), [
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
        gasPrice,
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
    setState(STATE.NONE);
    setError(undefined);
    setGasPrice(0);
    setSignedTransaction(undefined);
  }, [setError]);

  useEffect(() => {
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
        setGasPrice(fromWei(estimatedGasPrice, 'gwei'));
      } catch (error) {
        setError(error);
      }
    })();
  }, [_wallet.address, _web3.eth, setError]);

  return {
    initializing,
    construct,
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
    txHash,
    signedTransaction,
    bind: {
      constructed,
      canSign,
      generateAndSign,
      signed,
      broadcast,
      broadcasted,
      confirmed,
      reset,
      error,
      setGasPrice,
      txHash,
      signedTransaction,
    },
  };
}
