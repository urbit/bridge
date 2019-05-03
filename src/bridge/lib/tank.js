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
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(what)
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
  return sendRequest('/point', {point:point});
};

const fundTransactions = signedTxs => {
  return sendRequest('/request', {txs:signedTxs});
};

export {
  remainingTransactions,
  fundTransactions
}

