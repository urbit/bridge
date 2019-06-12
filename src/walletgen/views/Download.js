import React from 'react';
import saveAs from 'file-saver';
import { get } from 'lodash';
import JSZip from 'jszip';

import Button from '../components/Button';
import CheckBox from '../components/CheckBox';

const NEXT_STEP_NUM = 7;

class Download extends React.Component {
  handleSave = event => {
    const { props } = this;

    const wallets = props['wallets.value'];
    const profile = props['profile.value'];
    const paper = props['paperCollateral.value'];

    const urbit_registration = Object.entries(wallets).reduce(
      (acc, [k, v]) => {
        const owner = get(v, 'ownership.keys.address', '');
        const transfer = '';
        const spawn = get(v, 'spawn.keys.address', '');
        const manage = get(v, 'management.keys.address', '');
        const voting = get(v, 'voting.keys.address', '');
        const auth = get(v, 'network.keys.auth.public', '');
        const crypt = get(v, 'network.keys.crypt.public', '');
        return {
          ...acc,
          [k]: [owner, transfer, spawn, manage, voting, auth, crypt],
        };
      },
      { idCode: profile.idCode }
    );

    const json_urbit_registration = JSON.stringify(urbit_registration);
    const encoded_urbit_registration = new Blob(
      [btoa(json_urbit_registration)],
      { type: 'text/plain;charset=utf-8' }
    );

    const zip = new JSZip();

    const bin0 = paper.filter(item => item.bin === '0');
    const bin1 = paper.filter(item => item.bin === '1');
    const bin2 = paper.filter(item => item.bin === '2');
    const bin3 = paper.filter(item => item.bin === '3');
    const bin4 = paper.filter(item => item.bin === '4');

    const bin0Folder = zip.folder('0. Public');
    const bin1Folder = zip.folder('1. Very High Friction Custody');
    const bin2Folder = zip.folder('2. High Friction Custody');
    const bin3Folder = zip.folder('3. Medium Friction Custody');
    const bin4Folder = zip.folder('4. Low Friction Custody');

    bin0.forEach(item => bin0Folder.file(`${item.pageTitle}.png`, item.png));
    bin1.forEach(item => bin1Folder.file(`${item.pageTitle}.png`, item.png));
    bin2.forEach(item => bin2Folder.file(`${item.pageTitle}.png`, item.png));
    bin3.forEach(item => bin3Folder.file(`${item.pageTitle}.png`, item.png));
    bin4.forEach(item => bin4Folder.file(`${item.pageTitle}.png`, item.png));

    // TEMPORARY
    // const jsonWallet = JSON.stringify(wallets, null, 2);
    // zip.file("jsonWallet.json", jsonWallet);

    zip.generateAsync({ type: 'blob' }).then(content => {
      saveAs(content, 'urbit-wallets.zip');
      setTimeout(() => {
        saveAs(encoded_urbit_registration, 'urbit-registration.txt');
        props.setGlobalState({ didClickDownload: true });
      }, 2000);
    });
  };

  render() {
    const { setGlobalState } = this.props;

    const { props } = this;

    const downloaded = props['downloaded'];
    const didClickDownload = props['didClickDownload'];

    const nextButtonClass = downloaded
      ? 'btn btn-primary'
      : 'btn shape-gray-10';

    return (
      <div className={'col-md-6'}>
        <h2 className={'mb-4'}>
          Your wallets have been generated. Download the files to a storage
          medium you trust.
        </h2>

        <div
          className={`white row text-mono pb-2`}
          style={{ borderBottom: '2px solid #222' }}>
          <div className={'col-md-6 text-400'}>{'Filename'}</div>
          <div className={'col-md-6 text-400'}>{'Contents'}</div>
        </div>

        <div
          className={`white row pv-4`}
          style={{ borderBottom: '2px solid #222' }}>
          <div className={'col-md-6 text-mono text-600'}>
            {'urbit-wallets.zip'}
          </div>
          <div className={'col-md-6'}>
            <p className={'mv-0'}>
              Paper wallet PNG files for{' '}
              <code>{`${props['profile.shipCount']}`}</code> ships, organized by
              recommended custody tier. This contains your private keys, keep it
              safe.{' '}
            </p>
          </div>
        </div>

        <div
          className={`white row pv-2`}
          style={{ borderBottom: '2px solid #222' }}>
          <div className={'col-md-6 text-600 text-mono'}>
            {'urbit-registration.txt'}
          </div>
          <div className={'col-md-6 mv-0'}>
            <p
              className={
                'mv-0'
              }>{`A file containing the public addresses of your wallets. You need to upload this to Registration next.`}</p>
          </div>
        </div>

        <Button
          className={'btn btn-primary mv-6'}
          text={'Download All'}
          onClick={e => this.handleSave(e)}
        />

        {didClickDownload ? (
          <div>
            <p>
              Please verify that the above files have been successfully
              downloaded. You may wish to unpack the zip file and inspect the
              contents. If you open your .png wallets on your screen, ensure you
              are in a secure location.
            </p>
            <CheckBox
              title={'I have my urbit-wallets.zip and urbit-registration.txt'}
              onChange={() => setGlobalState({ downloaded: !downloaded })}
              state={downloaded}
            />

            <Button
              className={nextButtonClass + ' mt-8'}
              text={'Next →'}
              disabled={!downloaded}
              onClick={() =>
                setGlobalState({ route: '/Done', currentStep: NEXT_STEP_NUM })
              }
            />
          </div>
        ) : (
          <div />
        )}
      </div>
    );
  }
}

export default Download;
