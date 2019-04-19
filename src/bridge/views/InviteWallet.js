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

import { generateWallet, downloadWallet } from '../lib/invite'

// for wallet generation
import PaperCollateralRenderer from 'PaperCollateralRenderer'

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

  async componentDidMount() {
    const { web3, wallet, contracts, setPointCursor } = this.props

    web3.chain(_ =>
    contracts.chain(ctrcs =>
    wallet.chain(async wal => {
      const addr = addressFromSecp256k1Public(wal.publicKey);
      console.log('fetching incoming for', addr)
      const incoming = await azimuth.azimuth.getTransferringFor(ctrcs, addr)
      console.log('incoming', incoming)

      let point = Nothing();
      let wallet = Nothing();

      if (incoming.length > 0) {
        let pointNum = parseInt(incoming[0]);
        point = Just(pointNum);
        wallet = await generateWallet(pointNum);
        if (incoming.length > 1) {
          //TODO  notify user "...and others / ticket reusable"
        }
      }
      this.setState({loaded: true, point: point, wallet: Just(wallet)})
    })))
  }

  componentDidUpdate(prevProps) {
    //
  }

  async download() {
    let result = await downloadWallet(this.state.paper)
    this.setState({
      downloaded: true
    })
  }

  proceed() {
    this.props.pushRoute(ROUTE_NAMES.INVITE_VERIFY, {
      ticket: this.state.wallet.value.ticket,
      point: parseInt(this.state.point.value)
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

    // let pointOverview;
    // if (loaded && Just.hasInstance(point)) {
    //   const name = ob.patp(point.value);
    //   const sigil = pour({
    //     patp: name,
    //     renderer: ReactSVGComponents,
    //     size: 256
    //   });
    //   pointOverview = (
    //     //TODO Passport display component
    //     <>
    //       <div className={'mt-12 pt-6'}>
    //         { sigil }
    //       </div>
    //       <H3><code>{ name }</code></H3>
    //     </>
    //   );
    // }

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
          { paperRenderer }
        </Col>
      </Row>
    )
  }
}

export default InviteWallet
