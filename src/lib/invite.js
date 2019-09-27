import * as wg from './walletgen';

import JSZip from 'jszip';
import saveAs from 'file-saver';

export async function generateWallet(point) {
  const ticket = await wg.makeTicket(point);
  const wallet = await wg.generateWallet(point, ticket);
  return wallet;
}

//TODO should be moved to lib/walletgen
export async function downloadWallet(paperWallets) {
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

    await zip.generateAsync({ type: 'blob' }).then(content => {
      saveAs(content, `${zipName}.zip`);
      // resolve(true);
    });
  } else {
    console.error('downloadWallet() can only download 1 wallet at a time.');
  }
}
