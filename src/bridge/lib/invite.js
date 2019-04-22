import lodash from 'lodash'
import * as more from 'more-entropy'
import * as ob from 'urbit-ob'
import * as kg from '../../../node_modules/urbit-key-generation/dist/index'
import { MAX_GALAXY, MIN_STAR, MAX_STAR, MIN_PLANET,
         GALAXY_ENTROPY_BITS, STAR_ENTROPY_BITS, PLANET_ENTROPY_BITS,
         SEED_ENTROPY_BITS,
         GEN_STATES
       } from '../../walletgen/lib/constants'

import JSZip from 'jszip'
import saveAs from 'file-saver'

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
  GENERATED: "Wallet generation complete",
  PAPER_READY: "Paper collateral generated",
  DOWNLOADED: "Wallet downloaded",
  TRANSACTIONS: "Sending transactions"
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
  console.log('got wallet', wallet);
  console.log('should start rendering now');
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

export {
  generateWallet,
  downloadWallet,
  INVITE_STAGES,
  WALLET_STATES
}
