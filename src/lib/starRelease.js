import { linearSR, conditionalSR } from 'azimuth-js';

function mapRange(amount, cb) {
  return [...Array(amount).keys()].map(cb);
}

// Preferentially withdraw from conditional contracts and use linear
// to mop up the rest
export function generateWithdrawTxs(contracts, batchLimits, amount, to) {
  const [left, ...csrTxs] = generateConditionalWithdrawTxs(
    contracts,
    batchLimits,
    amount,
    to
  );
  const lsrTxs = generateLinearWithdrawTxs(contracts, left, to);
  return [...csrTxs, ...lsrTxs];
}

/**
 * Recurse over batchLimits to generate a valid number of withdraw txs.
 * amount may exceed the number of withdraw txs available in the consolidated SR contract.
 *
 * @param {object} contracts - The azimuth contracts object
 * @param {array} batchLimits - An array of the maximum withdraw limit for each batch
 * @param {amount} amount - The number of txs to be generated
 * @param {string} to - The addresss to withdraw to
 * @return {array} An array with the number of transactions missing as the head
 * (i.e. requested amount exceeded available), and the generated transactions
 * as the rest of the list
 */
function generateConditionalWithdrawTxs(
  contracts,
  batchLimits,
  amount,
  to,
  offset = 0
) {
  // Successfully withdrawn all requested, none missing
  if (amount <= 0) {
    return [0];
  }
  // Return missing amount in head of list
  if (batchLimits.length === 0) {
    return [amount];
  }
  const [next, ...rest] = batchLimits;
  const currentAmount = Math.min(amount, next);
  return [
    ...generateConditionalWithdrawTxs(
      contracts,
      rest,
      amount - currentAmount,
      to,
      offset + 1
    ),
    ...mapRange(currentAmount, () =>
      conditionalSR.withdrawTo(contracts, offset, to)
    ),
  ];
}

function generateLinearWithdrawTxs(contracts, amount, to) {
  return mapRange(amount, () => linearSR.withdrawTo(contracts, to));
}

export async function getLockupKind(contracts, address) {
  const conditional = await conditionalSR.getCommitment(contracts, address);
  const linear = await linearSR.getBatch(contracts, address);
  const haveConditional = conditional.total > 0;
  const haveLinear = linear.amount > 0;
  if (haveConditional && !haveLinear) return 'conditional';
  if (!haveConditional && haveLinear) return 'linear';
  if (haveConditional && haveLinear) return 'both';
  return 'none';
}

export async function getConditional(contracts, address) {
  const [commitment, batches, remaining] = await Promise.all([
    conditionalSR.getCommitment(contracts, address),
    conditionalSR.getBatches(contracts, address),
    conditionalSR.getRemainingStars(contracts, address),
  ]);

  if (batches === [] || commitment.total === '0') {
    return { total: 0, available: 0, withdrawn: 0, batchLimits: [] };
  }

  const total = remaining.length;
  let balance = total;

  //NOTE  we don't strictly need to convert the received number-strings to
  //      integers, but it helps keep the shenanigans at bay.

  // does not account for forfeiting or withdrawl
  const limits = (
    await Promise.all(
      batches.map((_, idx) =>
        conditionalSR.getWithdrawLimit(contracts, address, idx)
      )
    )
  ).map(n => parseInt(n));

  const withdrawn = (
    await conditionalSR.getWithdrawn(contracts, address)
  ).map(n => parseInt(n));

  const forfeited = await conditionalSR.getForfeited(contracts, address);

  const batchLimits = [];

  for (let i = 0; i < limits.length; i++) {
    // skip batch if forfeited or no stars left
    if (forfeited[i] || balance === 0) {
      batchLimits.push(0);
      continue;
    }
    const availableInBatch = limits[i] - withdrawn[i];
    if (balance < availableInBatch) {
      batchLimits.push(balance);
      balance = 0;
      continue;
    }
    batchLimits.push(availableInBatch);
    balance = balance - availableInBatch;
  }

  const withdrawnTotal = withdrawn.reduce((acc, val) => acc + val, 0);
  const available = batchLimits.reduce((acc, val) => acc + val, 0);

  return {
    total,
    available,
    withdrawn: withdrawnTotal,
    batchLimits,
    approvedTransferTo: commitment.approvedTransferTo,
  };
}

export async function getLinear(contracts, address) {
  const batch = await linearSR.getBatch(contracts, address);

  //NOTE  careful, we get the batch data as strings!
  const amount = parseInt(batch.amount);
  const withdrawn = parseInt(batch.withdrawn);

  if (amount === 0) {
    return { available: 0, withdrawn: 0, total: 0 };
  }

  //NOTE  be careful, getting the withdraw limit for an address that doesn't
  //      have a lockup throws an exception!
  const limit = await linearSR.getWithdrawLimit(contracts, address);
  const remaining = (await linearSR.getRemainingStars(contracts, address))
    .length;

  const available = Math.min(limit - withdrawn, remaining);
  const total = Math.min(amount, remaining);

  return {
    available,
    withdrawn,
    total,
    approvedTransferTo: batch.approvedTransferTo,
  };
}
