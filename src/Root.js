import 'babel-polyfill' // required for @ledgerhq/hw-transport-u2f

import React from 'react'
import ReactDOM from 'react-dom'

import Bridge from './Bridge'
import Walletgen from './walletgen/Walletgen'

class Root extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      appView: "bridge"
    }

    this.setView = this.setView.bind(this)
  }

  setView(appView) {
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
      </React.Fragment>
    )
  }
}

export {
  Root
}
