import React from 'react';

import { version } from '../../package.json';

const Footer = props => (
  <footer className={'row h-13 mt-20'}>
    <div className={'col-md-6 text-mono'}>{'v' + version}</div>

    <div className={'col-md-3'}>
      <a href="https://github.com/urbit/bridge">{'GitHub'}</a>
    </div>
  </footer>
);

export default Footer;
