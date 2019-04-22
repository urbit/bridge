import React from 'react'
import { pour } from 'sigil-js'
import * as ob from 'urbit-ob'
import ReactSVGComponents from './ReactSVGComponents'
import PropTypes from 'prop-types'
import PaperCollateralRenderer from 'PaperCollateralRenderer'
import { Button } from './Base'

import { downloadWallet } from '../lib/invite'

class Passport extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      paper: null
    }

    this.masterScreen = this.generateScreen()
    this.managementScreen = this.generateScreen()

    this.download = this.download.bind(this)
  }

  download() {
    downloadWallet(this.state.paper)
    this.props.confirmWalletDownload()
  }

  generateScreen() {
    let blocks = [];

    for (var i = 0; i < 80; i++) {
      let rand = Math.round(Math.random())
      let className = rand ? "passport-block bg-gray-30" : "passport-block"

      blocks.push(<div key={i} className={className}></div>)
    }

    return (
      <div className="flex flex-wrap">
        {blocks}
      </div>
    )
  }

  getCurrentDate() {
    let date = new Date()
    var fil = function(n) {
        return n >= 10 ? n : "0" + n;
      };
    let fmtDate = `${date.getUTCFullYear()}.` +
                  `${(date.getUTCMonth() + 1)}.` +
                  `${fil(date.getUTCDate())}`

    return fmtDate
  }

  getWalletStates() {
    console.log('walletStates = ', this.props.walletStates)

    let stateElems = this.props.walletStates.map(state => {
      return (
        <div className="flex justify-between">
          <div className="text-mono text-sm lh-6 green-dark">{state}</div>
          <div className="text-700 text-sm lh-6 green-dark">✓</div>
        </div>
      )
    })

    return (
      <div>
        {stateElems}
      </div>
    )
  }

  render() {
    let sigil = null

    let patp = this.props.point.matchWith({
      Just: p => ob.patp(p.value),
      Nothing: () => ''
    })

    let wallet = this.props.wallet.matchWith({
      Just: w => w.value,
      Nothing: () => null
    })

    let ownershipAddress = this.props.wallet.matchWith({
      Just: w => w.value.ownership.keys.address,
      Nothing: () => null
    })

    if (patp !== '') {
      sigil = pour({
        patp: patp,
        renderer: ReactSVGComponents,
        size: 128
      })
    } else {
      sigil = <div className="passport-sigil-blank"></div>
    }

    let currentDate = this.getCurrentDate()
    let walletStates = this.getWalletStates()

    return (
      <div>
        <div className={`passport ${wallet && 'passport-filled'}`}>
          <div className="flex">
            <div className="passport-sigil">
              {sigil}
            </div>
            <div className="passport-metadata ml-4">
              <div className="passport-label text-mono">Point</div>
              <div className="text-mono">{patp || '-'}</div>

              <div className="passport-label gray-50 mt-6">Created on</div>
              <div className="passport-value">{patp ? currentDate : '-' }</div>

              <div className="passport-label gray-50 mt-2">Invited by</div>
              <div className="passport-value">{this.props.invitedBy || '-'}</div>
            </div>
          </div>

          <div className="mt-8">
            <div className="passport-label text-mono">Ethereum Address</div>
            <div className="passport-value">{ownershipAddress || 'Ungenerated'}</div>

            <div className="passport-label gray-50 mt-3">Master Ticket</div>
            <div className="passport-value">{ownershipAddress ? this.masterScreen : 'Ungenerated'}</div>

            <div className="passport-label gray-50 mt-5">Managment Seed</div>
            <div className="passport-value">{ownershipAddress ? this.managementScreen : 'Ungenerated'}</div>

            <Button
              disabled={ !this.state.paper }
              className={ 'mt-8' }
              prop-size={ 'lg wide' }
              prop-color={ 'green' }
              onClick={ this.download }
            >
              { 'Download' }
            </Button>
          </div>

          {wallet &&
            <PaperCollateralRenderer
              wallet={{[this.props.point.value]: wallet}}
              className={'extremely-hidden'}
              callback={data => {
                console.log('paper wallet generated')
                this.setState({paper: data})
              }}
              mode={'REGISTRATION'} />
          }
        </div>
        <div className="passport-wallet-states mt-3">
          {walletStates}
        </div>
      </div>
    )
  }
}

Passport.propTypes = {
  wallet: PropTypes.object
};

Passport.defaultProps = {
  wallet: null
};

export default Passport
