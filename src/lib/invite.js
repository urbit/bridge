import * as wg from './walletgen';

import JSZip from 'jszip';
import saveAs from 'file-saver';

export async function generateWallet(point, boot) {
  const ticket = await wg.makeTicket(point);
  const wallet = await wg.generateWallet(point, ticket, boot);
  return wallet;
}

//TODO should be moved to lib/walletgen
export async function downloadWallet(paperWallets, keyfile, keyfilename) {
  if (paperWallets.length === 1) {
    const zip = new JSZip();

    const wallet = paperWallets[0];
    const ship = wallet.wallet.meta.patp.replace('~', '');
    const zipName = `${ship}-passport`;
    const folder = zip.folder(zipName);

    wallet.frames.forEach(frame => {
      const filename = `${ship}-${frame.givenName}.png`;
      folder.file(filename, frame.image);
    });

    if (keyfile && keyfilename) {
      folder.file(keyfilename, keyfile);
    }

    await zip.generateAsync({ type: 'blob' }).then(content => {
      saveAs(content, `${zipName}.zip`);
      // resolve(true);
    });
  } else {
    console.error('downloadWallet() can only download 1 wallet at a time.');
  }
}
