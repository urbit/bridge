import lodash from 'lodash'
import { Just, Nothing } from 'folktale/maybe'
import Tx from 'ethereumjs-tx'

import * as azimuth from 'azimuth-js'
import * as more from 'more-entropy'
import * as ob from 'urbit-ob'
import * as kg from '../../../node_modules/urbit-key-generation/dist/index'
import * as tank from './tank'
import { MAX_GALAXY, MIN_STAR, MAX_STAR, MIN_PLANET,
         GALAXY_ENTROPY_BITS, STAR_ENTROPY_BITS, PLANET_ENTROPY_BITS,
         SEED_ENTROPY_BITS,
         GEN_STATES
       } from '../../walletgen/lib/constants'

import JSZip from 'jszip'
import saveAs from 'file-saver'

import {
  signTransaction,
  sendSignedTransaction,
  waitForTransactionConfirm,
  isTransactionConfirmed
} from './txn'
import { BRIDGE_ERROR } from './error'
import { attemptSeedDerivation, genKey  } from './keys'
import {
  EthereumWallet,
  addressFromSecp256k1Public,
  urbitWalletFromTicket,
  addHexPrefix,
  WALLET_NAMES
} from './wallet'

const NEXT_STEP_NUM = 6;
const SEED_LENGTH_BYTES = SEED_ENTROPY_BITS / 8

const INVITE_STAGES = {
  INVITE_LOGIN: "invite login",
  INVITE_WALLET: "invite wallet",
  INVITE_VERIFY: "invite verify",
  INVITE_TRANSACTIONS: "invite transactions"
}

const WALLET_STATES = {
  UNLOCKING: "Unlocking invite wallet",
  GENERATING: "Generating your wallet",
  RENDERING: "Creating paper collateral",
  PAPER_READY: "Download your wallet",
  DOWNLOADED: "Wallet downloaded",
  TRANSACTIONS: "Sending transactions"
}

const TRANSACTION_STATES = {
  GENERATING: 'Generating transactions',
  SIGNING: 'Signing transactions',
  FUNDING: 'Funding transactions',
  CLAIMING: 'Claiming invite',
  CONFIGURING: 'Configuring planet',
  CLEANING: 'Cleaning up',
  DONE: 'Done'
}

async function generateWallet(point) {
  const makeTicket = point => {

    const bits = point < MIN_STAR
      ? GALAXY_ENTROPY_BITS
      : point < MIN_PLANET
        ? STAR_ENTROPY_BITS
        : PLANET_ENTROPY_BITS

    const bytes = bits / 8
    const some = new Uint8Array(bytes)
    window.crypto.getRandomValues(some)

    const gen = new more.Generator()

    return new Promise((resolve, reject) => {
      gen.generate(bits, result => {
        const chunked = lodash.chunk(result, 2)
        const desired = chunked.slice(0, bytes) // only take required entropy
        const more = lodash.flatMap(desired, arr => arr[0] ^ arr[1])
        const entropy = lodash.zipWith(some, more, (x, y) => x ^ y)
        const buf = Buffer.from(entropy)
        const patq = ob.hex2patq(buf.toString('hex'))
        resolve(patq)
        reject('Entropy generation failed')
      })
    })
  }

  const genWallet = async (point, ticket, cb) => {

    const config = {
      ticket: ticket,
      seedSize: SEED_LENGTH_BYTES,
      ship: point,
      password: '',
      revisions: {},
      boot: false //TODO should this generate networking keys here already?
    };

    const wallet = await kg.generateWallet(config);

    // This is here to notify the anyone who opens console because the thread
    // hangs, blocking UI updates so this cannot be doen in the UI
    console.log('Generating Wallet for point address: ', point);

    return wallet;
  }

  const ticket = await makeTicket(point);
  const wallet = await genWallet(point, ticket);
  return wallet;
}

//TODO pulled from walletgen/views/Generate and Download, put into lib
async function downloadWallet(paper) {
  return new Promise((resolve, reject) => {
    const zip = new JSZip();
    //TODO the categories here aren't explained in bridge at all...

    const bin0 = paper.filter(item => item.bin === '0');
    const bin1 = paper.filter(item => item.bin === '1');
    const bin2 = paper.filter(item => item.bin === '2');
    const bin3 = paper.filter(item => item.bin === '3');
    const bin4 = paper.filter(item => item.bin === '4');

    const bin0Folder = zip.folder("0. Public");
    const bin1Folder = zip.folder("1. Very High Friction Custody");
    const bin2Folder = zip.folder("2. High Friction Custody");
    const bin3Folder = zip.folder("3. Medium Friction Custody");
    const bin4Folder = zip.folder("4. Low Friction Custody");

    bin0.forEach(item => bin0Folder.file(`${item.pageTitle}.png`, item.png))
    bin1.forEach(item => bin1Folder.file(`${item.pageTitle}.png`, item.png));
    bin2.forEach(item => bin2Folder.file(`${item.pageTitle}.png`, item.png));
    bin3.forEach(item => bin3Folder.file(`${item.pageTitle}.png`, item.png));
    bin4.forEach(item => bin4Folder.file(`${item.pageTitle}.png`, item.png));

    zip.generateAsync({type:"blob"}).then((content) => {
      saveAs(content, 'urbit-wallet.zip');
      resolve(true)
    });
  })
}

async function startTransactions(args) {
  let { realPointM, web3M, contractsM, realTicket,
    inviteWalletM, realWalletM, setUrbitWallet, updateProgress } = args

  if (Nothing.hasInstance(web3M)) {
    throw BRIDGE_ERROR.MISSING_WEB3;
  }
  const web3 = web3M.value;

  if (Nothing.hasInstance(contractsM)) {
    throw BRIDGE_ERROR.MISSING_CONTRACTS;
  }
  const contracts = contractsM.value;

  if (Nothing.hasInstance(inviteWalletM)) {
    throw BRIDGE_ERROR.MISSING_WALLET;
  }
  const inviteWallet = inviteWalletM.value;

  // if (Nothing.hasInstance(realWalletM)) {
  //   throw BRIDGE_ERROR.MISSING_WALLET;
  // }
  // const realWallet = realWalletM.value;

  if (Nothing.hasInstance(realPointM)) {
    throw BRIDGE_ERROR.MISSING_POINT;
  }
  const point = realPointM.value;

  const inviteAddress = addressFromSecp256k1Public(inviteWallet.publicKey);
  console.log('working as', inviteAddress);

  const realWallet = await urbitWalletFromTicket(realTicket, point);

  // transfer from invite wallet to new wallet

  let transferTx = azimuth.ecliptic.transferPoint(contracts, point, realWallet.ownership.keys.address);
  transferTx.gas = 500000; //TODO can maybe be lower?

  // ping gas tank with txs if needed

  let inviteNonce = await web3.eth.getTransactionCount(inviteAddress);
  transferTx.nonce = inviteNonce++;
  transferTx.gasPrice = 20000000000; //NOTE we pay the premium for faster ux
  transferTx.from = inviteAddress;

  //NOTE using web3.eth.accounts.signTransaction is broken (1.0.0-beta51)
  let transferStx = new Tx(transferTx);
  transferStx.sign(inviteWallet.privateKey);
  let rawTransferStx = '0x'+transferStx.serialize().toString('hex');

  const transferCost = transferTx.gas * transferTx.gasPrice;
  await ensureFundsFor(web3, point, inviteAddress, transferCost, [rawTransferStx], updateProgress);

  // send transaction
  updateProgress(TRANSACTION_STATES.CLAIMING);
  await sendAndAwaitConfirm(web3, [rawTransferStx]);

  //
  // we're gonna be operating as the new wallet from here on out, so change
  // the relevant values
  //
  setUrbitWallet(Just(realWallet));
  const newAddress = realWallet.ownership.keys.address;

  // configure management proxy

  let managementTx = azimuth.ecliptic.setManagementProxy(contracts, point, realWallet.management.keys.address);
  managementTx.gas = 200000;
  managementTx.nonce = 0;

  // configure networking public keys
  //TODO feels like more of this logic should live in a lib?
  let networkSeed = await attemptSeedDerivation(true, {
    walletType: WALLET_NAMES.TICKET,
    urbitWallet: Just(realWallet),
    pointCursor: Just(point),
    pointCache: {[point]: {keyRevisionNumber: 0}}
  });
  if (Nothing.hasInstance(networkSeed)) {
    throw new Error('wtf network seed not derived');
  }
  networkSeed = networkSeed.value;
  const networkKeys = kg.deriveNetworkKeys(networkSeed);

  let keysTx = azimuth.ecliptic.configureKeys(
    contracts,
    point,
    addHexPrefix(networkKeys.crypt.public),
    addHexPrefix(networkKeys.auth.public),
    1,
    false
  );
  keysTx.gas = 150000;
  keysTx.nonce = 1;

  //TODO  refactor this process into function
  let totalCost = 0;
  let txs = [managementTx, keysTx];
  txs = txs.map(tx => {
    tx.gasPrice = 20000000000;
    tx.from = newAddress;
    totalCost = totalCost + (tx.gasPrice * tx.gas);
    return tx;
  });

  let rawStxs = txs.map(tx => {
    let stx = new Tx(tx);
    stx.sign(Buffer.from(realWallet.ownership.keys.private, 'hex'));
    return '0x'+stx.serialize().toString('hex');
  });

  await ensureFundsFor(web3, point, newAddress, totalCost, rawStxs, updateProgress);

  updateProgress(TRANSACTION_STATES.CONFIGURING);
  await sendAndAwaitConfirm(web3, rawStxs);

  // if non-trivial eth left in invite wallet, transfer to new ownership
  updateProgress(TRANSACTION_STATES.CLEANING);
  let balance = await web3.eth.getBalance(inviteAddress);
  const gasPrice = 20000000000;
  const gasLimit = 21000;
  const sendEthCost = gasPrice * gasLimit;
  if (balance > sendEthCost) {
    const value = (balance - sendEthCost);
    console.log('sending', value);
    const tx = {
      to: newAddress,
      value: value,
      gasPrice: gasPrice,
      gas: gasLimit,
      nonce: inviteNonce++
    }
    let stx = new Tx(tx);
    stx.sign(inviteWallet.privateKey);
    const rawTx = '0x'+stx.serialize().toString('hex');
    web3.eth.sendSignedTransaction(rawTx).catch(err => {
      console.log('error sending value tx, who cares', err);
    });
    console.log('sent old balance');
  }

  // proceed without waiting for confirm
  updateProgress(TRANSACTION_STATES.DONE);
  setUrbitWallet(Just(realWallet));
  //TODO forward to "all done!" screen
}

async function ensureFundsFor(web3, point, address, cost, signedTxs, updateProgress) {
  updateProgress(TRANSACTION_STATES.FUNDING);
  let balance = await web3.eth.getBalance(address);

  if (cost > balance) {

    try {

      const fundsRemaining = await tank.remainingTransactions(point);
      if (fundsRemaining < signedTxs.length) {
        throw new Error('request invalid');
      }

      const res = await tank.fundTransactions(signedTxs);
      if (!res.success) {
        throw new Error('request rejected');
      } else {
        await waitForTransactionConfirm(web3, res.txHash);
        let newBalance = await web3.eth.getBalance(address);
        console.log('funds have confirmed', balance >= cost, balance, newBalance);
      }

    } catch (e) {

      console.log('funding failed', e);
      await waitForBalance(web3, address, cost, updateProgress);

    }

  } else {
    console.log('already have sufficient funds');
  }
}

// resolves when address has at least minBalance
//
async function waitForBalance(web3, address, minBalance, updateProgress) {
  console.log('awaiting balance', address, minBalance);
  return new Promise((resolve, reject) => {
    let oldBalance = null;
    const checkForBalance = async () => {
      const balance = await web3.eth.getBalance(address);
      if (balance >= minBalance) {
        resolve();
      } else {
        if (balance !== oldBalance) {
          askForFunding(address, minBalance, balance, updateProgress);
        }
        setTimeout(checkForBalance, 13000);
      }
    };
    checkForBalance();
  });
}

async function sendAndAwaitConfirm(web3, signedTxs) {
  await Promise.all(signedTxs.map(tx => {
    console.log('sending...');
    return new Promise((resolve, reject) => {
      web3.eth.sendSignedTransaction(tx).then(res => {
        console.log('sent, now waiting for confirm!', res.transactionHash);
        waitForTransactionConfirm(web3, res.transactionHash)
        .then(resolve);
      }).catch(async err => {
        // if there's an error, check if it's because the transaction was
        // already confirmed prior to sending.
        // this is really only the case in local dev environments.
        const txHash = web3.utils.keccak256(tx);
        console.log(err.message);
        if (err.message.slice(0,54) ===
            "Returned error: the tx doesn't have the correct nonce.") {
          console.log('nonce error, awaiting confirm', err.message.slice(55));
          //TODO max wait time before assume failure?
          let res = await waitForTransactionConfirm(web3, txHash);
          if (res) resolve();
          else reject(new Error('Unexpected tx failure'));
        } else {
          const confirmed = await isTransactionConfirmed(web3, txHash);
          console.log('error, but maybe confirmed:', confirmed);
          if (confirmed) resolve();
          else reject(err);
        }
      });
    });
  }));
}

function awaitForResult(desired, retryTime, func) {
  return new Promise((resolve, reject) => {
    const retry = async () => {
      const result = await func();
      console.log('result vs desired', result, desired);
      if (result === desired) resolve();
      else setTimeout(retry, retryTime);
    };
    retry();
  });
}

function askForFunding(address, amount, current, updateProgress) {
  updateProgress(`Please make sure ${address} has at least ${amount} wei, we'll continue once that's true. Current balance: ${current}. Waiting`);
}

export {
  generateWallet,
  downloadWallet,
  startTransactions,
  INVITE_STAGES,
  WALLET_STATES,
  TRANSACTION_STATES
}
