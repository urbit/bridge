import React from 'react';

class Done extends React.Component {
  render() {
    return (
      <div className={'col-md-7'}>
        <h2>{`Next Steps`}</h2>

        <ol>
          <li className={'mb-8'}>
            <span className="h3">
              You <b>must</b> close this tab before connecting to the internet.
            </span>
          </li>

          <li className={'mb-8'}>
            <span className="h3">Connect to the internet.</span>
            <p className={'mt-0 ml-6'}>
              {`Or, if airgapped, move your urbit-registration.txt to a networked machine.`}
            </p>
          </li>

          <li className={'mb-8'}>
            <span className="h3">
              {'Upload your '}
              <code>{'urbit-registration.txt'}</code>
              {' to Registration'}
            </span>
            <p className={'mt-0 ml-6'}>
              {`If you kept the Registration tab open, you can simply return there to upload. Otherwise, you can log into Registration again with the code in your email and navigate back to where you left off. If you do not upload this file to Registration, we will have no way to transfer your
              ships to you. This means you could lose your ships.`}
            </p>
          </li>

          <li className={'mb-8'}>
            <span className="h3">Print your paper wallets</span>
            <p className={'ml-6 mv-0'}>
              You will lose your assets if you lose your wallets. Do not use a
              public printer. Please note that most modern printers contain
              immutable memory of all printed materials.
            </p>
          </li>

          <li className={'mb-8'}>
            <span className="h3">
              Securely erase the <span className={'text-mono'}>.zip</span> file
              and your wallet <span className={'text-mono'}>.png</span> files
            </span>
            <p className={'ml-6 mv-0'}>
              If you used an airgapped machine, strongly consider destroying
              this machine.
            </p>
          </li>

          <li className={'mb-8'}>
            <span className="h3">
              If you understand the above steps, you may now close this tab.
            </span>
          </li>
        </ol>
        {
          // <CheckBox
          //   title={'I understand what to do next.'}
          //   onChange={ () => setGlobalState({ understand: !understand }) }
          //   state={ understand } />
          //
          // <Button
          //   className={ nextButtonClass + ' mt-8' }
          //   text={'Close this tab'}
          //   disabled={ !understand }
          //   onClick= { () => window.close() }
          // />
        }
      </div>
    );
  }
}

export default Done;
