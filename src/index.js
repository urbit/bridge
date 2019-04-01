import 'babel-polyfill' // required for @ledgerhq/hw-transport-u2f

import React from 'react'
import ReactDOM from 'react-dom'

import { Root } from './Root'

// import Bridge from './Bridge'
// import Walletgen from './walletgen/Walletgen'

ReactDOM.render(
  // <Walletgen />,
  // <Bridge />,
  <Root />,
  document.getElementById('root')
)
