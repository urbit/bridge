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

export async function getConditional(contracts, address) {
  const [commitment, batches] = await Promise.all([
    conditionalSR.getCommitment(contracts, address),
    conditionalSR.getBatches(contracts, address),
  ]);

  if (commitment === null || batches === null) {
    return { total: 0, available: 0, withdrawn: 0, batchLimits: [] };
  }

  const { total } = commitment;
  const withdrawLimits = await Promise.all(
    batches.map((_, idx) =>
      conditionalSR.getWithdrawLimit(contracts, address, idx)
    )
  );
  const available = withdrawLimits.reduce((acc, val) => acc + val, 0);

  const withdrawnAmounts = await conditionalSR.getWithdrawn(contracts, address);

  const withdrawn = withdrawnAmounts.reduce((acc, val) => acc + val, 0);
  const batchLimits = withdrawLimits.map(
    (limit, idx) => limit - withdrawnAmounts[idx]
  );

  return { total, available, withdrawn, batchLimits };
}

export async function getLinear(contracts, address) {
  const { amount, withdrawn } = await linearSR.getBatch(contracts, address);

  const available = // Contract errors on withdrawing from a user that does not have any
    amount > 0 ? await linearSR.getWithdrawLimit(contracts, address) : 0;
  return { available, withdrawn, total: amount };
}
