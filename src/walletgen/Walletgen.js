import React from 'react';
import * as lodash from 'lodash';

import Header from './components/Header';
import Footer from './components/Footer';

import { PROFILE_STATES, GEN_STATES } from './lib/constants';

import PrivacyPolicy from './views/PrivacyPolicy';
import Welcome from './views/Welcome';
import Eula from './views/Eula';
import EulaView from './views/EulaView';
import Upload from './views/Upload';
import Understand from './views/Understand';
import Generate from './views/Generate';
import Custody from './views/Custody';
import Download from './views/Download';
import Done from './views/Done';

import './style/index.css';

import { OnlineProvider } from '../bridge/store/online';

const ROUTES = [
  { path: '/Welcome', Component: Welcome },
  { path: '/Eula', Component: Eula },
  { path: '/Upload', Component: Upload },
  { path: '/Understand', Component: Understand },
  { path: '/Custody', Component: Custody },
  { path: '/Generate', Component: Generate },
  { path: '/Download', Component: Download },
  { path: '/Done', Component: Done },
  { path: '/PrivacyPolicy', Component: PrivacyPolicy },
  { path: '/EulaView', Component: EulaView },
];

const TOTAL_STEPS = 7;

class Walletgen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      'profile.state': PROFILE_STATES.NOSTART,
      'profile.value': null,
      'profile.shipCount': 0,
      'profile.error': '',
      'eny.state': GEN_STATES.ENY_NOSTART,
      'eny.value': [],
      'eny.error': '',
      'wallets.state': GEN_STATES.DERIVATION_NOSTART,
      'wallets.value': null,
      'wallets.error': '',
      'wallets.genCounter': 0,
      'paperCollateral.state': GEN_STATES.PAPER_NOSTART,
      'paperCollateral.value': null,
      'paperCollateral.error': '',
      route: '/Welcome',
      lastRoute: '/Welcome',
      currentStep: 1,
      totalSteps: TOTAL_STEPS,
      downloaded: false,
      didClickDownload: false,
    };
  }

  setGlobalState = state => this.setState(state);

  router = path => {
    const route = key => {
      const { Component } = lodash.find(ROUTES, { path: key });
      const globals = {
        setGlobalState: this.setGlobalState,
        ...this.state,
      };
      return <Component {...globals} />;
    };

    return route(path);
  };

  render() {
    const { route, currentStep, lastRoute } = this.state;

    const routed = this.router(route);

    return (
      <OnlineProvider>
        <main className={'container'}>
          <Header currentStep={currentStep} totalSteps={TOTAL_STEPS} />

          <div className={'row wrapper'}>
            <div className={'col-'}>{routed}</div>
            <div className={'push'} />
          </div>

          <Footer
            route={route}
            lastRoute={lastRoute}
            setGlobalState={this.setGlobalState}
          />
        </main>
      </OnlineProvider>
    );
  }
}

export default Walletgen;
