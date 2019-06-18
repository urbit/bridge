import React from 'react';

import Button from '../components/Button';

const NEXT_STEP_NUM = 5;

class Custody extends React.Component {
  render() {
    let { setGlobalState } = this.props;

    return (
      <div className={'col-md-6'}>
        <h2 className={'mb-4'}>{`A Word On Custody`}</h2>

        <p>
          {`You are about to generate several important pieces of cryptographic material that you will use to operate and own your Urbit ships. Your ownership and control of these ships is only as secure as the way you store this secret information.`}
        </p>

        <p>
          {`On the following page, we list default custody recommendations for each of your wallets and proxies. These range from ‘safe to store in a desk drawer’ to ‘you may want to get a safety deposit box at a bank’ and are also printed on all paper wallets. We strongly urge you follow these recommendations.`}
        </p>

        <div className={'btn-tray'}>
          <Button
            className={'btn btn-primary'}
            text={'I Understand →'}
            onClick={() =>
              setGlobalState({ route: '/Generate', currentStep: NEXT_STEP_NUM })
            }
          />
        </div>
      </div>
    );
  }
}

export default Custody;
