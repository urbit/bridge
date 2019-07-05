// usage: tweak constants at head of file, then run "node find-gas-usage.js"
//        for very common events/calls, you may need to use a smaller TO-FROM
//        range to keep web3 from yelling at you

const ORIGIN = 6784800; // launch ceremony begins
const PUBLIC = 7033765; // azimuth becomes public
const LATEST = 'latest';

const FROM = ORIGIN;
const TO = LATEST;

const VENT = 'ChangedKeys';
const FUNC = '0x4447e48c'; // configureKeys
const ARGS = 5;

// const VENT = 'Spawned';
// const FUNC = '0xa0d3253f'; // spawn
// const ARGS = 2;

// const VENT = 'OwnerChanged';
// const FUNC = '0x1e79a85b'; // transferPoint
// const ARGS = 3;

// const VENT = 'ChangedSpawnProxy';
// const FUNC = '0xae326221'; // setSpawnProxy
// const ARGS = 2;

// const VENT = 'ChangedManagementProxy';
// const FUNC = '0x8866bb2c'; // setManagementProxy
// const ARGS = 2;

// const VENT = 'ChangedTransferProxy';
// const FUNC = '0x2c7ba564'; // setTransferProxy
// const ARGS = 2;

// const VENT = 'ChangedVotingProxy';
// const FUNC = '0xa60e8bd6'; // setVotingProxy
// const ARGS = 2;

// const VENT = 'EscapeRequested';
// const FUNC = '0xbf5772b9'; // escape
// const ARGS = 2;

// const VENT = 'EscapeCanceled';
// const FUNC = '0xc6d761d4'; // cancelEscape
// const ARGS = 1;

// const VENT = 'EscapeAccepted';
// const FUNC = '0xc1b9d98b'; // adopt
// const ARGS = 1;

// const VENT = 'EscapeCanceled';
// const FUNC = '0xbbe21ca5'; // reject
// const ARGS = 1;

// const VENT = 'LostSponsor';
// const FUNC = '0x073a7804'; // detach
// const ARGS = 1;

const LENT = 64 * ARGS + FUNC.length;

const Web3 = require('web3');
const azimuth = require('azimuth-js');

(async () => {
  const web3 = new Web3(
    new Web3.providers.HttpProvider(
      'https://mainnet.infura.io/v3/196a7f37c7d54211b4a07904ec73ad87'
    )
  );
  const contracts = await azimuth.initContractsPartial(
    web3,
    '0x223c067f8cf28ae173ee5cafea60ca44c335fecb'
  );

  const keyEvents = await contracts.azimuth.getPastEvents(VENT, {
    fromBlock: FROM,
    toBlock: TO,
  });

  const txsBatch = new web3.BatchRequest();
  keyEvents.map(vent => {
    txsBatch.add(
      web3.eth.getTransaction.request(vent.transactionHash, (err, res) => {})
    );
  });
  const txs = await txsBatch.execute();
  const keyTxs = txs.response.filter(tx => {
    const head = tx.input.slice(0, 10) === FUNC;
    const size = tx.input.length === LENT;
    if (head && !size) {
      console.log('weird inputs', tx.hash);
    }
    return head && size;
  });

  const receiptsBatch = new web3.BatchRequest();
  keyTxs.map(tx => {
    receiptsBatch.add(
      web3.eth.getTransactionReceipt.request(tx.hash, (err, res) => {})
    );
  });
  const recs = await receiptsBatch.execute();

  let usage = {};
  recs.response.map(rec => {
    if (rec.status !== true) {
      console.log('rejecting', rec.gasUsed);
      return;
    }
    if (rec.gasUsed > 480000) {
      console.log(rec.transactionHash);
    }
    if (rec.gasUsed in usage) {
      usage[rec.gasUsed]++;
    } else {
      usage[rec.gasUsed] = 1;
    }
  });
  console.log(usage);
})();
