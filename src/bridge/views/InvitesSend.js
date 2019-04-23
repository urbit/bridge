import { Just, Nothing } from 'folktale/maybe'
import React from 'react'
import { pour } from 'sigil-js'
import * as ob from 'urbit-ob'
import * as azimuth from 'azimuth-js'

import {
  EthereumWallet,
  addressFromSecp256k1Public,
  urbitWalletFromTicket,
  addHexPrefix,
  WALLET_NAMES
} from '../lib/wallet'

import ReactSVGComponents from '../components/ReactSVGComponents'
import KeysAndMetadata from './Point/KeysAndMetadata'
import Actions from './Point/Actions'
import { BRIDGE_ERROR } from '../lib/error'
import { Row, Col, Warning, Button, H1, H3 } from '../components/Base'
import StatelessTransaction from '../components/StatelessTransaction'

// for wallet generation
import * as kg from '../../../node_modules/urbit-key-generation/dist/index'
import * as more from 'more-entropy'
import lodash from 'lodash'
import { PLANET_ENTROPY_BITS } from '../../walletgen/lib/constants'

// for transaction generation and signing
import {
  signTransaction,
  sendSignedTransaction,
  waitForTransactionConfirm,
  isTransactionConfirmed
} from '../lib/txn'
import * as tank from '../lib/tank'
import Tx from 'ethereumjs-tx'

//TODO needs more work to include email sending in the process
class InvitesSend extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      invitesAvailable: Nothing(),
      fromPool: Nothing(),
      haveInvited: Nothing(),
      randomPlanet: Nothing(),
      inviteWallet: Nothing()
    }

    this.findInvited = this.findInvited.bind(this);
    this.findRandomPlanet = this.findRandomPlanet.bind(this);
    this.generateWallet = this.generateWallet.bind(this);
    this.canGenerate = this.canGenerate.bind(this);
  }

  componentDidMount() {
    this.point = this.props.pointCursor.matchWith({
      Just: (pt) => parseInt(pt.value, 10),
      Nothing: () => {
        throw BRIDGE_ERROR.MISSING_POINT
      }
    });
    this.contracts = this.props.contracts.matchWith({
      Just: cs => cs.value,
      Nothing: _ => {
        throw BRIDGE_ERROR.MISSING_CONTRACTS
      }
    });

    azimuth.delegatedSending.getPool(this.contracts, this.point)
    .then(pool => {
      this.setState({fromPool: Just(pool)});
      azimuth.delegatedSending.invitesInPool(this.contracts, pool)
      .then(count => {
        this.setState({invitesAvailable: Just(count)});
      });
    });
    this.findInvited();
    this.findRandomPlanet();
    this.generateWallet();
  }

  componentDidUpdate(prevProps) {
    //
  }

  async findInvited() {
    let invited = await azimuth.delegatedSending.getInvited(
      this.contracts,
      this.point
    );
    invited.map(async point => {
      const active = await azimuth.azimuth.isActive(this.contracts, point);
      console.log('point active', point, active);
      return {point: Number(point), active};
    });
    invited = await Promise.all(invited);
    this.setState({haveInvited: Just(invited)});
  }

  async findRandomPlanet() {
    let res = Nothing();
    const kids = azimuth.azimuth.getUnspawnedChildren(
      this.contracts,
      azimuth.azimuth.getPrefix(this.point)
    );
    if (kids.length > 0) {
      const i = Math.floor(Math.random() * kids.length);
      res = Just(Number(kids[i]));
    }
    this.setState({randomPlanet: res});
    return res;
  }

  //TODO pulled from walletgen/views/Generate, put into lib
  async generateWallet() {
    const makeTicket = () => {

      const bits = PLANET_ENTROPY_BITS

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
    };

    const ticket = await makeTicket(0x10000); // planet-sized ticket
    const wallet = await kg.generateWallet({ticket, ship:0});
    console.log('found ticket', ticket, wallet, wallet.ownership.keys.address);
    this.setState({inviteWallet:
      Just({ticket, owner:wallet.ownership.keys.address})
    });
  }

  canGenerate() {
    //TODO and canSend()
    console.log('can generate', this.state.invitesAvailable, this.state.randomPlanet,);
    let res = this.state.invitesAvailable.matchWith({
      Nothing: () => false,
      Just: invites => ((invites.value > 0)
                        && Just.hasInstance(this.state.randomPlanet)
                        && Just.hasInstance(this.state.inviteWallet))
    });
    return res;
  }

  render() {

    const inviteStatus = this.state.invitesAvailable.matchWith({
      Nothing: () => 'Loading...',
      Just: (invites) => {
        let res = `${invites.value} invites available`;
        return res + this.state.fromPool.matchWith({
          Nothing: () => '',
          Just: (pool) => (pool.value == this.point)
                          ? ''
                          : ` (from ${ob.patp(pool.value)})`
        });
      }
    });


    const inviteList = this.state.haveInvited.matchWith({
      Nothing: () => (<li>{'Loading...'}</li>),
      Just: (invited) => invited.value.map(i => {
        return (<li>
          <span class="invitee">{ob.patp(i.point)}</span>
          <span class="status">{i.active ? 'accepted' : 'pending'}</span>
        </li>);
      })
    });

    return (
      <Row>
        <Col>

          <p>{ 'send invites here, for planets' }</p>

          <p>{ inviteStatus }</p>

          <ul>{ inviteList }</ul>

          <StatelessTransaction
            // Upper scope
            web3={this.props.web3}
            contracts={this.props.contracts}
            wallet={this.props.wallet}
            walletType={this.props.walletType}
            walletHdPath={this.props.walletHdPath}
            networkType={this.props.networkType}
            setTxnHashCursor={this.props.setTxnHashCursor}
            setTxnConfirmations={this.props.setTxnConfirmations}
            popRoute={this.props.popRoute}
            pushRoute={this.props.pushRoute}
            // Other
            canGenerate={this.canGenerate()}
            createUnsignedTxn={this.createUnsignedTxn}
            ref={this.statelessRef} />

        </Col>
      </Row>
    )
  }
}

export default InvitesSend
