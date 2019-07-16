import { useCallback, useEffect, useState } from 'react';
import { Just } from 'folktale/maybe';

import { useNetwork } from 'store/network';
import { useWallet } from 'store/wallet';

import {
  signTransaction,
  sendSignedTransaction,
  waitForTransactionConfirm,
  hexify,
} from './txn';
import * as need from './need';
import { toHex, toWei, fromWei } from 'web3-utils';

const STATE = {
  NONE: 'NONE',
  GENERATED: 'GENERATED',
  SIGNED: 'SIGNED',
  BROADCASTED: 'BROADCASTED',
  CONFIRMED: 'CONFIRMED',
};

/**
 * manage the state around sending and confirming an ethereum transaction
 * @param {Maybe<EthereumTx>} unsignedTx
 * @param {number} initialGasLimit
 */
export default function useEthereumTransaction(
  unsignedTx,
  initialGasLimit = 0
) {
  const { wallet, walletType, walletHdPath } = useWallet();
  const { web3, networkType } = useNetwork();
  const _web3 = need.web3(web3);
  const _wallet = need.wallet(wallet);

  const [error, setError] = useState();
  const [state, setState] = useState(STATE.NONE);
  const [chainId, setChainId] = useState();
  const [nonce, setNonce] = useState();
  const [gasPrice, setGasPrice] = useState(20); // gwei
  const [gasLimit] = useState(initialGasLimit);
  const [unsignedTransaction, setUnsignedTransaction] = useState();
  const [signedTransaction, setSignedTransaction] = useState();

  const initializing = nonce === undefined || chainId === undefined;
  const constructed = Just.hasInstance(unsignedTx);
  const generated = state === STATE.GENERATED;
  const signed = state === STATE.SIGNED;
  const broadcasted = state === STATE.BROADCASTED;
  const confirmed = state === STATE.CONFIRMED;

  const generate = useCallback(() => {
    const txn = unsignedTx.value;
    try {
      txn.gas = toHex(gasLimit);
      txn.gasPrice = toHex(toWei(gasPrice, 'gwei'));

      setUnsignedTransaction(txn);
      setState(STATE.GENERATED);
    } catch (error) {
      setError(error);
    }
  }, [gasLimit, gasPrice, unsignedTx.value]);

  const sign = useCallback(async () => {
    try {
      // TODO: sign the transaction
      const txn = await signTransaction(
        _wallet,
        walletType,
        walletHdPath.getOrElse(''),
        networkType,
        chainId,
        unsignedTransaction
      );
      const stx = hexify(txn.serialize());

      setSignedTransaction(stx);
      setState(STATE.SIGNED);
    } catch (error) {
      setError(error);
    }
  }, [
    _wallet,
    chainId,
    networkType,
    unsignedTransaction,
    walletHdPath,
    walletType,
  ]);

  const waitForConfirmation = useCallback(
    async txHash => {
      try {
        await waitForTransactionConfirm(_web3, txHash);
        setState(STATE.CONFIRMED);
      } catch (error) {
        setError(error);
      }
    },
    [_web3]
  );

  const broadcast = useCallback(async () => {
    try {
      const txHash = await sendSignedTransaction(_web3, signedTransaction);

      setState(STATE.BROADCASTED);
      waitForConfirmation(txHash);
    } catch (error) {
      setError(error);
    }
  }, [_web3, signedTransaction, waitForConfirmation]);

  const reset = useCallback(() => {
    setState(STATE.NONE);
    setError(undefined);
    setGasPrice(0);
    setSignedTransaction(undefined);
  }, [setState]);

  useEffect(() => {
    (async () => {
      try {
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
  }, [_wallet.address, _web3.eth]);

  return {
    initializing,
    constructed,
    generate,
    generated,
    sign,
    signed,
    broadcast,
    broadcasted,
    confirmed,
    reset,
    error,
    bind: {
      error,
      initializing,
      constructed,
      generated,
      signed,
      broadcasted,
      confirmed,
      setGasPrice,
    },
  };
}
