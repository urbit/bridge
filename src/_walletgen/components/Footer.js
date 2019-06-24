import React from 'react';

import { version } from '../../../package.json';

class Footer extends React.Component {
  render() {
    // eslint-disable-next-line
    const { setGlobalState, route } = this.props;

    return (
      <footer className={'row h-13 mt-20'}>
        <div className={'col-md-3'}>{'Urbit Wallet Generator v' + version}</div>

        <div className={'col-md-3'}>{'Tlon Corporation'}</div>

        <div className={'col-md-3'}>
          {/* eslint-disable-next-line */}
          <a
            href={'#'}
            onClick={() =>
              setGlobalState({ route: '/EulaView', lastRoute: route })
            }>
            EULA
          </a>
        </div>

        <div className={'col-md-3'}>
          {/* eslint-disable-next-line */}
          <a
            href={'#'}
            onClick={() =>
              setGlobalState({ route: '/PrivacyPolicy', lastRoute: route })
            }>
            Privacy Policy
          </a>
        </div>
      </footer>
    );
  }
}

export default Footer;
