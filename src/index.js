import 'babel-polyfill' // required for @ledgerhq/hw-transport-u2f

import React from 'react'
import ReactDOM from 'react-dom'

// import Bridge from './Bridge'
import Walletgen from './walletgen/Walletgen'

import './style/index.css'

ReactDOM.render(
  <Walletgen />,
  document.getElementById('root')
)
