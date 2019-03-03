import React from 'react'

import EulaText from '../components/EulaText'
import Button from '../components/Button'

class EulaView extends React.Component {
  render() {
    let { setGlobalState, lastRoute } = this.props;

    return (
      <div>

        <EulaText />

        <div className={'mt-8'}>

          <Button
            className={'btn shape-gray-10 ml-2'}
            text={'Close'}
            onClick={ () => setGlobalState({ 'route': lastRoute })}
          />

        </div>

        <p><strong>
          By clicking “I Accept,” or by downloading, installing, or otherwise
          accessing or using the Software, you agree that you have read and
          understood, and, as a condition to your use of the Software, you agree
          to be bound by, the above terms and conditions.
        </strong></p>

      </div>
    )
  }
}

export default EulaView
