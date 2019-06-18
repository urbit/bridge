import React from 'react';

import EulaText from '../components/EulaText';
import Button from '../components/Button';

const NEXT_STEP_NUM = 2;

class Eula extends React.Component {
  render() {
    let { setGlobalState } = this.props;

    return (
      <div>
        <EulaText />

        <div className={'mt-8'}>
          <Button
            className={'btn btn-primary mb-4'}
            text={'I Accept'}
            onClick={() =>
              setGlobalState({
                route: '/Upload',
                currentStep: NEXT_STEP_NUM,
              })
            }
          />

          <Button
            className={'btn shape-gray-10 ml-2'}
            text={'I Do Not Accept'}
            onClick={() => setGlobalState({ route: '/Welcome' })}
          />
        </div>

        <p>
          <strong>
            By clicking “I Accept,” or by downloading, installing, or otherwise
            accessing or using the Software, you agree that you have read and
            understood, and, as a condition to your use of the Software, you
            agree to be bound by, the above terms and conditions.
          </strong>
        </p>
      </div>
    );
  }
}

export default Eula;
