import 'babel-polyfill' // required for @ledgerhq/hw-transport-u2f

import React from 'react'
import ReactDOM from 'react-dom'
import _ from 'lodash'

import Bridge from './bridge/Bridge'
import Walletgen from './walletgen/Walletgen'
import { AppNavigation } from './common/components/AppNavigation'

import './common/style/index.css'
import './bridge/style/index.css'
import './walletgen/style/index.css'

class Root extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      appView: "bridge"
    }

    this.setView = this.setView.bind(this)
  }

  /*
    Style switching:

    To switch between walletgen and bridge styles without them clobbering each
    other, we need a way to identify which app the stylesheet belongs to.

    So we include a "walletgen" or "bridge" style as the first rule of any
    stylesheet. If this directive is included, we can disable the appropriate
    sheet when the user switches applications

    A bit hacky, but does the job for now. These styles should probably be
    fully merged at some point.
  */

  isWalletgenStyle(styleSheet) {
    return _.get(styleSheet, 'cssRules[0].selectorText', null) === "walletgen"
  }

  isBridgeStyle(styleSheet) {
    return _.get(styleSheet, 'cssRules[0].selectorText', null) === "bridge"
  }

  disableStylesheets(appView) {
    for (var i = 0; i < document.styleSheets.length; i++) {
      let styleSheet = document.styleSheets[i]

      if (appView === "bridge") {
        if (this.isWalletgenStyle(styleSheet)) styleSheet.disabled = true
        if (this.isBridgeStyle(styleSheet)) styleSheet.disabled = false
      } else if (appView === "walletgen") {
        if (this.isWalletgenStyle(styleSheet)) styleSheet.disabled = false
        if (this.isBridgeStyle(styleSheet)) styleSheet.disabled = true
      }
    }
  }

  componentDidMount() {
    this.disableStylesheets(this.state.appView)
  }

  setView(appView) {
    this.disableStylesheets(appView)

    this.setState({
      appView
    })
  }

  render() {
    let appComponent = null;

    if (this.state.appView === "walletgen") {
      appComponent = <Walletgen
                      appView={this.state.appView}
                      setView={this.setView} />
    }

    if (this.state.appView === "bridge") {
      appComponent = <Bridge
                      appView={this.state.appView}
                      setView={this.setView} />
    }

    return (
      <React.Fragment>
        {appComponent}
        <AppNavigation
          setView={this.setView}
          appView={this.state.appView}
          />
      </React.Fragment>
    )
  }
}

export {
  Root
}
