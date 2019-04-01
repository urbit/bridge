import 'babel-polyfill' // required for @ledgerhq/hw-transport-u2f

import React from 'react'
import ReactDOM from 'react-dom'

import Bridge from './Bridge'
import Walletgen from './walletgen/Walletgen'
import { AppNavigation } from './components/AppNavigation'

import './style/index.css'
import './walletgen/styles/index.css'

class Root extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      appView: "bridge"
    }

    this.setView = this.setView.bind(this)
  }

  componentDidMount() {
    let styles = document.getElementsByTagName('style')

    for (var i = 0; i < styles.length; i++) {
      if (i < 7) styles[i].classList.add('css-bridge');
      if (i >= 7) {
        styles[i].classList.add('css-walletgen');
        styles[i].disabled = true;
      }
    }
  }

  setView(appView) {
    if (appView === "bridge") {
      document.querySelectorAll('.css-walletgen').forEach(s => s.disabled = true)
      document.querySelectorAll('.css-bridge').forEach(s => s.disabled = false)
    } else if (appView === "walletgen") {
      document.querySelectorAll('.css-walletgen').forEach(s => s.disabled = false)
      document.querySelectorAll('.css-bridge').forEach(s => s.disabled = true)
    }

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
