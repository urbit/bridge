import React from 'react'
import { pour } from 'sigil-js'
import * as ob from 'urbit-ob'
import ReactSVGComponents from './ReactSVGComponents'
import PropTypes from 'prop-types'
import PaperCollateralRenderer from 'PaperCollateralRenderer'
import { Button } from './Base'

import { WALLET_STATES } from '../lib/invite'
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
    this.props.pushWalletState(WALLET_STATES.DOWNLOADED)
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

  getWalletProgress() {
    let { walletStates } = this.props

    if ( !walletStates.includes(WALLET_STATES.UNLOCKING) ) return null
    if ( walletStates.includes(WALLET_STATES.TRANSACTIONS) ) return null

    let progressTimes = {
      [WALLET_STATES.UNLOCKING]: {ms: "2813", pct: "44%"},
      [WALLET_STATES.GENERATING]: {ms: "2433", pct: "38%"},
      [WALLET_STATES.RENDERING]: {ms: "986", pct: "15%"}
    }

    const progressBars = Object.keys(progressTimes).map(state => {
      let progressIndex = walletStates.indexOf(state)
      let progressDone = progressIndex !== -1 && progressIndex < walletStates.length -1

      let progressStyle = {
        width: progressTimes[state].pct
      }

      return (
        <div className="passport-wallet-progress" style={progressStyle}>
          {progressDone &&
            <div className="passport-wallet-progress-fill"></div>
          }
        </div>
      )
    })

    return (
      <div className="flex space-between mt-3">
        {progressBars}
      </div>
    )
  }

  getWalletStates() {
    let { walletStates } = this.props

    if ( walletStates.includes(WALLET_STATES.TRANSACTIONS) ) return null

    let stateElems = walletStates.map(state => {
      if (state === WALLET_STATES.DOWNLOADED) return null

      let lastIndex = walletStates.indexOf(state) === walletStates.length - 1

      return (
        <div className="flex justify-between">
          <div className="text-mono text-sm lh-6 green-dark">{state}</div>
          {(!lastIndex) &&
            <div className="text-700 text-sm lh-6 green-dark">✓</div>
          }
        </div>
      )
    })

    return (
      <div className="mt-3">
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
    let walletProgress = this.getWalletProgress()
    let paperReady = this.state.paper && this.props.walletStates.includes(WALLET_STATES.PAPER_READY)
    let downloadColor = paperReady ? 'green' : 'black'

    window.curTime = (new Date()).getTime()

    return (
      <div>
        <div className="passport-border">
          <div className={`passport ${paperReady && 'passport-filled'}`}>
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
            </div>

            {wallet &&
              <PaperCollateralRenderer
                wallet={{[this.props.point.value]: wallet}}
                className={'extremely-hidden'}
                callback={data => {
                  this.setState({paper: data})
                  this.props.pushWalletState(WALLET_STATES.PAPER_READY)
                }}
                mode={'REGISTRATION'} />
            }
          </div>
          <Button
            disabled={ !paperReady }
            prop-size={ 'lg wide' }
            prop-color={ downloadColor }
            onClick={ this.download }
          >
            { 'Download' }
          </Button>
        </div>

        {walletProgress}
        {walletStates}

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
