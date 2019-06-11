import React from 'react';

import Button from '../components/Button';

const NEXT_STEP_NUM = 1;

class Welcome extends React.Component {
  render() {
    let { setGlobalState } = this.props;

    return (
      <div>
        <div className={'col-md-7'}>
          <h2>{`Welcome`}</h2>

          <p>
            {`If you came here from Registration and you’re ready to make a wallet for your ships. You’ve come to the right place.`}
          </p>

          <p>
            To start, you need to tell us about the ships you own by uploading
            the <code>urbit-ships.txt</code> you should have downloaded from the
            Registration website. If you didn’t get this file, please return to
            Registration and download it.
          </p>
          <p>
            Reminder: Run this software offline and disable any browser
            extensions. If you highly value your ships, please use a new,
            airgapped computer.
          </p>

          <div className={'btn-tray'}>
            <p>
              <strong>{`When you’re ready to begin, start by accepting our End User License Agreement.`}</strong>
            </p>
            <Button
              className={'btn btn-primary mt-8'}
              text={'View →'}
              onClick={() =>
                setGlobalState({ route: '/Eula', currentStep: NEXT_STEP_NUM })
              }
            />
          </div>
        </div>
      </div>
    );
  }
}

export default Welcome;
