import * as http from 'http';
import Maybe from 'folktale/maybe';

//NOTE if accessing this in a localhost configuration fails with "CORS request
//     did not succeed", you might need to visit localhost:3001 or whatever
//     explicitly and tell your browser that's safe to access.
//     https://stackoverflow.com/a/53011185/1334324
const baseOptions = {
  hostname: 'localhost',
  port: 3001,
  protocol: 'https:',
  headers: { 'Content-Type': 'application/json' }, //TODO text/plain vs application/json
  json: true
}

const reqHandler = (resolve, reject) => {
  return (response) => {
    console.log('xx got response', response)
    // handle http errors
    if (response.statusCode < 200 || response.statusCode > 299) {
      reject(new Error('Failed to load, status code: ' + response.statusCode));
    }
    // temporary data holder
    const body = [];
    // on every content chunk, push it to the data array
    response.on('data', (chunk) => body.push(chunk));
    // we are done, resolve promise with those joined chunks
    response.on('end', () => {
      return resolve(JSON.parse(body.join('')))
    });
  }
}

const remainingTransactions = point => {
  return new Promise((resolve, reject) => {
    const options = {
      path: '/point',
      method: 'POST'
    }
    const request = http.request(
      Object.assign(baseOptions, options),
      reqHandler(resolve, reject)
    );
    request.on('error', (e) => reject(new Error(e)));
    request.write(JSON.stringify({point:point}));
    request.end();
  });
};

//TODO refactor, add sendRequest(path, json)
const fundTransactions = signedTxs => {
  return new Promise((resolve, reject) => {
    const options = {
      path: '/request',
      method: 'POST'
    }
    const request = http.request(
      Object.assign(baseOptions, options),
      reqHandler(resolve, reject)
    );
    request.on('error', (e) => reject(new Error(e)));
    request.write(JSON.stringify({txs:signedTxs}));
    request.end();
  });
};

export {
  remainingTransactions,
  fundTransactions
}

