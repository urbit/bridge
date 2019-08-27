// /lib/tank: functions for funding transactions

import retry from 'async-retry';
import { toBN } from 'web3-utils';
import { RETRY_OPTIONS, waitForTransactionConfirm } from './txn';

//NOTE if accessing this in a localhost configuration fails with "CORS request
//     did not succeed", you might need to visit localhost:3001 or whatever
//     explicitly and tell your browser that's safe to access.
//     https://stackoverflow.com/a/53011185/1334324
const baseUrl = 'https://localhost:3001';

function sendRequest(where, what) {
  return new Promise((resolve, reject) => {
    fetch(baseUrl + where, {
      method: 'POST',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(what),
    })
      .then(response => {
        if (response.ok) {
          resolve(response.json());
        } else {
          reject(response);
        }
      })
      .catch(reject);
  });
}

const remainingTransactions = point => {
  if (typeof point === 'string') point = Number(point);
  return sendRequest('/point', { point: point });
};

const fundTransactions = signedTxs => {
  return sendRequest('/request', { txs: signedTxs });
};

// resolves when address has at least cost balance
// returns true if gas tank was used, false otherwise
// askForFunding: callback that takes (address, requiredBalance, currentBalance)
//                and tells the user to get that address the required balance
// gotFunding: optional callback that stops telling the user to go get funding
const ensureFundsFor = async (
  web3,
  point,
  address,
  cost,
  signedTxs,
  askForFunding,
  gotFunding
) => {
  const balance = toBN(await web3.eth.getBalance(address));
  cost = toBN(cost);

  if (balance.gte(cost)) {
    console.log(
      `tank: already have sufficient funds: ${address} proposed ` +
        `a transacton(s) that will cost ${cost.toString()}wei but it ` +
        `already has ${balance.toString}wei`
    );
    return false;
  }

  try {
    // TODO: if we can't always (easily) provide a point, and the
    // fundTransactions call is gonna fail anyway, should we maybe
    // just not bother doing this check in the first place?
    if (point !== null) {
      const fundsRemaining = await remainingTransactions(point);
      if (fundsRemaining < signedTxs.length) {
        throw new Error('tank: request invalid');
      }
    } else {
      console.log('tank: no point provided. skipping remaining-funds check...');
    }

    const res = await fundTransactions(signedTxs);
    if (!res.success) {
      throw new Error('tank: request rejected', res);
    }

    await waitForTransactionConfirm(web3, res.txHash);

    const newBalance = await web3.eth.getBalance(address);
    console.log(
      `tank: funds have confirmed: ${address} now has ` +
        ` ${newBalance.toString()}wei, up from ${balance.toString()}wei`
    );
    return true;
  } catch (e) {
    console.log('tank: funding failed, waiting on user funds...', e);
    await waitForBalance(web3, address, cost, askForFunding, gotFunding);
  }

  return false;
};

// returns a promise that resolves when address has at least minBalance
function waitForBalance(web3, address, minBalance, askForFunding, gotFunding) {
  return retry(async (bail, n) => {
    const balance = toBN(await web3.eth.getBalance(address));
    if (balance.gte(minBalance)) {
      gotFunding && gotFunding();
      return;
    } else {
      askForFunding(address, minBalance.toString(), balance);
      throw new Error('retrying');
    }
  }, RETRY_OPTIONS);
}

export { remainingTransactions, fundTransactions, ensureFundsFor };
