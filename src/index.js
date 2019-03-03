import 'babel-polyfill' // required for @ledgerhq/hw-transport-u2f

import React from 'react'
import ReactDOM from 'react-dom'

import Bridge from './Bridge'
import App from './walletgen/App'

import './style/index.css'

ReactDOM.render(
  <Bridge />,
  document.getElementById('root')
)
