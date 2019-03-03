import React from 'react'

import Button from '../components/Button'

const NEXT_STEP_NUM = 4;

class Understand extends React.Component {
  render() {
    const { setGlobalState } = this.props;

    return(
      <div className={'col-md-6'}>
        <h2 className={'mb-4'}>{"First, let's look at the HD Wallet in more detail."}</h2>

        <p>{`Urbit HD wallets contain the following important items.`}</p>

        <h3 className={'mt-4 mb-0'}>Master Ticket</h3>
        <p>Think of your master ticket like a very high value password. The master ticket is the secret code from which all of your other keys are derived. Technically, your master ticket is seed entropy. You should never share it with anyone, and store it very securely. This ticket can derive all of your other keys: your ownership key and all of the related proxies. </p>
        <h3 className={'mt-4 mb-0'}>Ownership Address</h3>
        <p>An ownership address has all rights over the assets deeded to it. These rights are on-chain actions described and implemented in the Constitution, Urbit’s Ethereum smart contracts.</p>
        <h3 className={'mt-4 mb-0'}>Proxies</h3>
        <p>{`Proxy addresses allow you to execute non-ownership related actions like spawning child ships, voting, and setting networking keys without jeopardizing the keys you've designated with ownership rights. Setting proxy rights is optional, but it is recommended for on-chain actions you will execute more frequently.`}</p>
        <h3 className={'mt-4 mb-0 ml-8'}>Management Proxy</h3>
        <p className={'ml-8'}>Can configure or set Urbit networking keys and conduct sponsorship related operations.</p>
        <h3 className={'mt-4 mb-0 ml-8'}>Voting Proxy</h3>
        <p className={'ml-8'}>Galaxies only. Galaxies are the part of the galactic senate, and this means they can cast votes on new proposals including changes to the Constitution.</p>
        <h3 className={'mt-4 mb-0 ml-8'}>Spawn Proxy</h3>
        <p className={'ml-8'}>For stars and galaxies only. Can create new child ships.</p>

        <div className={'btn-tray'}>
          <Button
            className={'btn btn-primary'}
            text={"Ok, got it →"}
            onClick={ () => setGlobalState({ route: '/Custody', 'currentStep': NEXT_STEP_NUM })}
          />
        </div>

      </div>
    )
  }
}

export default Understand
