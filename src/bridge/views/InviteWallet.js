import { Just, Nothing } from 'folktale/maybe'
import React from 'react'
import { pour } from 'sigil-js'
import * as ob from 'urbit-ob'
import * as azimuth from 'azimuth-js'

import { addressFromSecp256k1Public, EthereumWallet } from '../lib/wallet'
import { ROUTE_NAMES } from '../lib/router'

import PointList from '../components/PointList'
import ReactSVGComponents from '../components/ReactSVGComponents'
import KeysAndMetadata from './Point/KeysAndMetadata'
import Actions from './Point/Actions'
import { BRIDGE_ERROR } from '../lib/error'
import { Row, Col, Warning, Button, H1, H3 } from '../components/Base'

// for wallet generation
import * as kg from '../../../node_modules/urbit-key-generation/dist/index'
import * as more from 'more-entropy'
import lodash from 'lodash'
import PaperCollateralRenderer from 'PaperCollateralRenderer'
import JSZip from 'jszip'
import saveAs from 'file-saver'
import { MAX_GALAXY, MIN_STAR, MAX_STAR, MIN_PLANET,
         GALAXY_ENTROPY_BITS, STAR_ENTROPY_BITS, PLANET_ENTROPY_BITS,
         SEED_ENTROPY_BITS,
         GEN_STATES
       } from '../../walletgen/lib/constants'
const SEED_LENGTH_BYTES = SEED_ENTROPY_BITS / 8
const NEXT_STEP_NUM = 6;

class InviteWallet extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      loaded: false,
      point: Nothing(),
      wallet: Nothing(),
      paper: Nothing(),
      downloaded: false
    }

    this.download = this.download.bind(this)
    this.proceed = this.proceed.bind(this)
  }

  componentDidMount() {
    const { web3, wallet, contracts, setPointCursor } = this.props

    web3.chain(_ =>
    contracts.chain(ctrcs =>
    wallet.chain(async wal => {
      const addr = addressFromSecp256k1Public(wal.publicKey);
      console.log('fetching incoming for', addr)
      const incoming = await azimuth.azimuth.getTransferringFor(ctrcs, addr)
      console.log('incoming', incoming)

      let point = Nothing();
      if (incoming.length > 0) {
        point = Just(incoming[0]);
        this.generateWallet(incoming[0]);
        this.setState({ loaded: true, point: point });
        if (incoming.length > 1) {
          //TODO  notify user "...and others / ticket reusable"
        }
      }
    })))
  }

  componentDidUpdate(prevProps) {
    //
  }

  //TODO pulled from walletgen/views/Generate and Download, put into lib
  async generateWallet(point) {
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

      const boot = point < MIN_STAR || point > MAX_STAR;

      const config = {
        ticket: ticket,
        seedSize: SEED_LENGTH_BYTES,
        ship: point,
        password: '',
        revisions: {},
        boot: boot
      };

      const wallet = await kg.generateWallet(config);

      // This is here to notify the anyone who opens console because the thread
      // hangs, blocking UI updates so this cannot be doen in the UI
      console.log('Generating Wallet for point address: ', point);

      return wallet;
    }

    const ticket = await makeTicket(point);

    const wallet = await genWallet(point, ticket);

    this.setState({ wallet: Just(wallet) });
    console.log('got wallet', wallet);
    console.log('should start rendering now');
  }

  download() {
    const zip = new JSZip();
    //TODO the categories here aren't explained in bridge at all...

    const bin0 = this.state.paper.filter(item => item.bin === '0');
    const bin1 = this.state.paper.filter(item => item.bin === '1');
    const bin2 = this.state.paper.filter(item => item.bin === '2');
    const bin3 = this.state.paper.filter(item => item.bin === '3');
    const bin4 = this.state.paper.filter(item => item.bin === '4');

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
      this.setState({ downloaded: true });
    });
  }

  proceed() {
    this.props.pushRoute(ROUTE_NAMES.INVITE_VERIFY, {
      ticket: this.state.wallet.value.ticket,
      point: this.state.point.value
    });
  }

  render() {

    const { loaded, point, wallet, paper, downloaded } = this.state;

    let loading;
    if (!loaded) {
      loading = ( <div>{ 'Loading...' }</div> );
    }

    let balanceWarning;
    if (loaded && Nothing.hasInstance(point)) {
      balanceWarning = (
        <Warning>
          <h3 className={'mb-2'}>{'Warning'}</h3>
          {
            'This invite has no claimable balance.'
          }
        </Warning>
      );
    }

    let pointOverview;
    if (loaded && Just.hasInstance(point)) {
      const name = ob.patp(point.value);
      const sigil = pour({
        patp: name,
        renderer: ReactSVGComponents,
        size: 256
      });
      pointOverview = (
        //TODO Passport display component
        <>
          <div className={'mt-12 pt-6'}>
            { sigil }
          </div>
          <H3><code>{ name }</code></H3>
        </>
      );
    }

    let downloadButtonContents = 'Download wallet';
    if ( Nothing.hasInstance(this.state.wallet) ||
         Nothing.hasInstance(this.state.paper) ) {
      downloadButtonContents = (
        <>
          <span className="btn-spinner"></span>
          {'Generating wallet...'}
        </>
      );
    }

    let downloadButton;
    let nextButton;
    if (loaded) {
      downloadButton = (
        <Button
          className={'mt-8'}
          prop-size={'lg wide'}
          disabled={( Nothing.hasInstance(this.state.wallet) ||
                      Nothing.hasInstance(this.state.paper) )}
          onClick={this.download}
        >
          <span className="relative">
              { downloadButtonContents }
          </span>
        </Button>
      );

      nextButton = (
        <Button
          className={'mt-8'}
          prop-size={'lg wide'}
          disabled={!this.state.downloaded}
          onClick={this.proceed}
        >
          {'Proceed'}
        </Button>
      );
    }

    let paperRenderer;
    if ( Just.hasInstance(this.state.wallet) &&
         Nothing.hasInstance(this.state.paper) ) {
      console.log('rendering for', point.value)
      paperRenderer = (
        <PaperCollateralRenderer
          wallet={{[point.value]: wallet.value}}
          className={'extremely-hidden'}
          callback={data => {
            console.log('got paper', data);
            this.setState({isRendering: false, paper: data})
          }}
          mode={'REGISTRATION'} />
      );
    }

    return (
      <Row>
        <Col>

          { loading }
          { balanceWarning }
          { pointOverview }

          <p>{'TODO copy. you need a wallet to receive the point into. download it below. also explanation of wallet files/storage'}</p>

          { downloadButton }
          { nextButton }

          { paperRenderer }

        </Col>
      </Row>
    )
  }
}

export default InviteWallet
