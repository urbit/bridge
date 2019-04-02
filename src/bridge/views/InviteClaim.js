import Maybe from 'folktale/maybe'
import React from 'react'
import { pour } from 'sigil-js'
import * as ob from 'urbit-ob'
import * as azimuth from 'azimuth-js'

import { addressFromSecp256k1Public, EthereumWallet } from '../lib/wallet'

import PointList from '../components/PointList'
import ReactSVGComponents from '../components/ReactSVGComponents'
import KeysAndMetadata from './Point/KeysAndMetadata'
import Actions from './Point/Actions'
import { BRIDGE_ERROR } from '../lib/error'
import { Row, Col, Warning, Button, H1, H3 } from '../components/Base'


class InviteClaim extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      loaded: false,
      point: Maybe.Nothing(),
      newTicket: Maybe.Nothing(),
      isGenerating: true
    }
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

      this.state.loaded = true;
      if (0 === incoming.length) {
        setPointCursor(Maybe.Nothing());
      } else {
        setPointCursor(Maybe.Just(incoming[0]));
        this.generateWallet(incoming[0])
        if (1 < incoming.length) {
          //TODO  notify user "...and others"
        }
      }
    })))
  }

  componentDidUpdate(prevProps) {
    //
  }

  generateWallet(point) {
    //TODO combine wg/views/Generate and Download into single lib function?
  }

  render() {

    const { pointCursor } = this.props

    //TODO do something about DOM duplication below

    if (!this.state.loaded) {
      return (
        <Row>
          <Col>
            {'Loading...'}
          </Col>
        </Row>
      )
    }

    if (!Maybe.Just.hasInstance(pointCursor)) {
      return (
        <Row>
          <Col>
            <Warning>
              <h3 className={'mb-2'}>{'Warning'}</h3>
              {
                'This invite has no claimable balance.'
              }
            </Warning>
          </Col>
        </Row>
      )
    }


    const point = pointCursor.matchWith({
      Just: (cursor) => cursor.value,
      Nothing: () => {
        throw BRIDGE_ERROR.MISSING_POINT
      }
    })

    const name = ob.patp(point)

    const sigil = pour({
      patp: name,
      renderer: ReactSVGComponents,
      size: 256
    })

    return (
        <Row>
          <Col>
            <div className={'mt-12 pt-6'}>
              { sigil }
            </div>
            <H1><code>{ name }</code></H1>

            <p>{'TODO copy'}</p>

            <Button
              className={'mt-8'}
              prop-size={'lg wide'}
              disabled={this.state.isGenerating}
              onClick={() => console.log('TODO download wallet')}>

              <span className="relative">
                {this.state.isGenerating &&
                  <span className="btn-spinner"></span>
                }
                {'Generating wallet...'}
              </span>
            </Button>

        </Col>
      </Row>
    )
  }
}

export default InviteClaim
