export default function MyWorker(args) {
  console.log('ARGS', args)
  let onmessage = e => { // eslint-disable-line no-unused-vars
      // Write your code here...
      console.log('MESSAGE', e)
      postMessage("Response");
  };
}
