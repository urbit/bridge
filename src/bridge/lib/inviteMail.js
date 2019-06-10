//NOTE if accessing this in a localhost configuration fails with "CORS request
//     did not succeed", you might need to visit localhost:3001 or whatever
//     explicitly and tell your browser that's safe to access.
//     https://stackoverflow.com/a/53011185/1334324
const baseUrl = 'https://localhost:3002'

function sendMail(recipient, ticket) {
  return new Promise((resolve, reject) => {
    fetch(baseUrl + '/send-ticket', {
      method: 'POST',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({recipient,ticket}),
    })
    .then(response => resolve(response.ok))
    .catch(reject);
  });
}

export {
  sendMail
}

