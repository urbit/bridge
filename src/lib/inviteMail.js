//NOTE if accessing this in a localhost configuration fails with "CORS request
//     did not succeed", you might need to visit localhost:3001 or whatever
//     explicitly and tell your browser that's safe to access.
//     https://stackoverflow.com/a/53011185/1334324
import { isGoerli } from './flags';

const port = isGoerli ? '3012' : '3002';
const baseUrl = `https://onboarding-emails.urbit.org:${port}`;

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

async function hasReceived(recipient) {
  const res = await sendRequest('/has-received', { recipient });
  return res.hasReceived;
}

function sendMail(recipient, ticket, sender, message, tx) {
  return sendRequest('/send-ticket', {
    recipient,
    ticket,
    sender,
    message,
    tx,
  });
}

export { hasReceived, sendMail };
