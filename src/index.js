import 'babel-polyfill' // required for @ledgerhq/hw-transport-u2f

import React from 'react'
import ReactDOM from 'react-dom'

import Bridge from './Bridge'
// import Walletgen from './walletgen/Walletgen'

ReactDOM.render(
  // <Walletgen />,
  <Bridge />,
  document.getElementById('root')
)
