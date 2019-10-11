//TODO we could make this way fancier, deserializing the raw transactions
//     to display a list of function(args), asking for confirmation, etc.

import React, { useCallback, useState, useMemo } from 'react';
import { Grid, Input, P, LinkButton, ErrorText } from 'indigo-react';
import { fromWei } from 'web3-utils';

import ViewHeader from 'components/ViewHeader';
import View from 'components/View';

import BridgeForm from 'form/BridgeForm';
import UploadInput from 'form/UploadInput';
import SubmitButton from 'form/SubmitButton';

import * as need from 'lib/need';
import {
  signTransaction,
  sendSignedTransaction,
  waitForTransactionConfirm,
} from 'lib/txn';
import { useExploreAddressUrl } from 'lib/explorer';

import { useLocalRouter } from 'lib/LocalRouter';
import { useWallet } from 'store/wallet';
import { useNetwork } from 'store/network';

//TODO into lib file?
const parseEthTxLine = line => {
  // tx: 0: nonce, 1: gas-price, 2: gas, 3: to, 4: value, 5: data, 6: chain-id
  const tx = line.split(',');
  return {
    nonce: Number(tx[0].slice(2)),
    chainId: Number(tx[6]),
    gasPrice: fromWei(tx[1].slice(2), 'gwei'), //TODO kill conversion in lib/txn
    gasLimit: Number(tx[2].slice(2)),
    txn: {
      to: tx[3],
      value: Number(tx[4].slice(2)),
      data: tx[5],
    },
  };
};

export default function Admin() {
  const { pop } = useLocalRouter();
  const { web3, networkType } = useNetwork();
  const { wallet, walletType, walletHdPath } = useWallet();
  const _wallet = need.wallet(wallet);
  const exploreAddressUrl = useExploreAddressUrl(_wallet.address);

  const [ethTxs, setEthTxs] = useState([]);
  const [sentTxs, setSentTxs] = useState([]);
  const [status, setStatus] = useState('waiting on the above');
  const [error, setError] = useState(null);

  const loadTransactions = useCallback(
    values => {
      setEthTxs(
        values.ethTxs
          .trim()
          .split('\n')
          .slice(1)
      );
    },
    [setEthTxs]
  );

  const transactionCount = useMemo(() => {
    return ethTxs.length;
  }, [ethTxs]);

  const sendTransactions = useCallback(
    async values => {
      const startTx = values.startTx || 1;
      const endTx = values.endTx || ethTxs.length;
      let txs = ethTxs.slice(startTx - 1, endTx);
      const _wallet = need.wallet(wallet);
      await Promise.all(
        txs.map(async tx => {
          try {
            const txo = parseEthTxLine(tx);
            const stx = await signTransaction({
              ...txo,
              wallet: _wallet,
              walletType,
              walletHdPath,
              networkType,
            });
            const hash = await sendSignedTransaction(
              need.web3(web3),
              stx,
              false
            );
            sentTxs.push(hash);
            setSentTxs(sentTxs);
            setStatus(
              `Dispatched ${sentTxs.length} transactions, see Etherscan for confirmation progress`
            );
            await waitForTransactionConfirm(need.web3(web3), hash);
          } catch (e) {
            setError(e.message || e);
          }
        })
      );
      setStatus('all done!');
    },
    [
      ethTxs,
      web3,
      networkType,
      wallet,
      walletType,
      walletHdPath,
      sentTxs,
      setSentTxs,
      setError,
    ]
  );

  return (
    <View pop={pop} inset>
      <Grid>
        <Grid.Item full as={ViewHeader}>
          Sign & send transactions
        </Grid.Item>

        <Grid.Item full as={LinkButton} href={exploreAddressUrl}>
          {`Logged in as ${_wallet.address} on ${networkType.toString()}`}
        </Grid.Item>

        <Grid.Item full as={P}>
          Make sure it has sufficient eth balance!
        </Grid.Item>

        <BridgeForm onSubmit={loadTransactions}>
          {({ handleSubmit }) => (
            <>
              <Grid.Item
                full
                as={UploadInput}
                name="ethTxs"
                label="Select .eth-txs"
              />

              <Grid.Item full as={SubmitButton} handleSubmit={handleSubmit}>
                Load transactions
              </Grid.Item>
            </>
          )}
        </BridgeForm>

        <BridgeForm onSubmit={sendTransactions}>
          {({ handleSubmit }) => (
            <>
              <Grid.Item full as={P}>
                {`Loaded ${transactionCount} transactions`}
              </Grid.Item>

              <Grid.Item
                as={Input}
                type="number"
                name="startTx"
                placeholder="1 (start)"
                mono
              />
              <Grid.Item
                as={Input}
                type="number"
                name="endTx"
                placeholder={`${transactionCount} (end)`}
                mono
              />

              <Grid.Item
                full
                as={SubmitButton}
                handleSubmit={handleSubmit}
                disabled={transactionCount === 0}>
                Sign & send transactions
              </Grid.Item>

              {error && (
                <Grid.Item full as={ErrorText} className="mv1">
                  {error}
                </Grid.Item>
              )}
            </>
          )}
        </BridgeForm>

        <Grid.Item full as={P}>
          {status}
        </Grid.Item>
      </Grid>
    </View>
  );
}
