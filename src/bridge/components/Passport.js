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

  render() {
    let sigil = null

    console.log('this.props.point = ', this.props.point)

    let patp = this.props.point.matchWith({
      Just: p => ob.patp(p.value),
      Nothing: () => ''
    })

    let wallet = this.props.wallet.matchWith({
      Just: w => w.value,
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

    return (
      <div className="passport">
        <div className="flex">
          <div className="passport-sigil">
            {sigil}
          </div>
          <div className="passport-metadata ml-4">
            <div className="passport-label text-mono">Point</div>
            <div className="text-mono">{patp || '-'}</div>

            <div className="passport-label gray-50 mt-6">Created on</div>
            <div className="passport-value">{this.props.createdOn || '-'}</div>

            <div className="passport-label gray-50 mt-2">Invited by</div>
            <div className="passport-value">{this.props.invitedBy || '-'}</div>
          </div>
        </div>

        <div className="mt-8">
          <div className="passport-label text-mono">Ethereum Address</div>
          <div className="passport-value">{this.props.ethAddress || 'Ungenerated'}</div>

          <div className="passport-label gray-50 mt-3">Master Ticket</div>
          <div className="passport-value">{this.props.ethAddress ? this.masterScreen : 'Ungenerated'}</div>

          <div className="passport-label gray-50 mt-5">Managment Seed</div>
          <div className="passport-value">{this.props.ethAddress ? this.managmentScreen : 'Ungenerated'}</div>

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
            wallet={this.props.wallet}
            className={'extremely-hidden'}
            callback={data => {
              this.setState({paper: data})
            }}
            mode={'REGISTRATION'} />
        }
      </div>
    )
  }
}

Passport.propTypes = {
  'patp': PropTypes.string,
  'createdOn': PropTypes.string,
  'invitedBy': PropTypes.string,
  'ethAddress': PropTypes.string,
  wallet: PropTypes.object
};

Passport.defaultProps = {
  'patp': '',
  'createdOn': '',
  'invitedBy': '',
  'ethAddress': '',
  wallet: null
};

export default Passport
