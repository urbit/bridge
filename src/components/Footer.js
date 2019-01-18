import React from 'react'

import { version } from '../../package.json'

const Footer = (props) =>
  <footer className={'row h-16 mt-8 items-center'}>

    <div className={'col-md-3'}>
      { 'v' + version }
    </div>

    <div className={'col-md-3'}>
      {'Tlon'}
    </div>

    <div className={'col-md-3'}>
      <a href='https://github.com/urbit/bridge'>
        { 'GitHub' }
      </a>
    </div>

  </footer>




export default Footer
