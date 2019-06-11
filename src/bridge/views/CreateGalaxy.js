import React from 'react';
import Maybe from 'folktale/maybe';
import * as azimuth from 'azimuth-js';
import * as ob from 'urbit-ob';
import * as need from '../lib/need';

import { Button } from '../components/Base';
import { Row, Col, H1, P, Anchor } from '../components/Base';
import {
  InnerLabel,
  GalaxyInput,
  AddressInput,
  ValidatedSigil,
  ShowBlockie,
} from '../components/Base';
import StatelessTransaction from '../components/StatelessTransaction';

import { NETWORK_NAMES } from '../lib/network';
import { canDecodePatp } from '../lib/txn';

import { ETH_ZERO_ADDR, isValidAddress, eqAddr } from '../lib/wallet';

import { isValidGalaxy } from '../lib/lib';

const buttonTriState = status => {
  if (status === null) return 'blue';
  if (status === false) return 'yellow';
  if (status === true) return 'green';
};

const buttonTriStateText = status => {
  if (status === null) return 'Confirm Galaxy Availablility';
  if (status === false) return 'Galaxy is Not Available';
  if (status === true) return 'Galaxy is Available';
};

class CreateGalaxy extends React.Component {
  constructor(props) {
    super(props);

    const galaxyOwner = need.address(props);

    this.state = {
      galaxyOwner: galaxyOwner,
      galaxyName: '',
      isAvailable: null,
    };

    this.handleAddressInput = this.handleAddressInput.bind(this);
    this.handleGalaxyNameInput = this.handleGalaxyNameInput.bind(this);
    this.confirmAvailability = this.confirmAvailability.bind(this);
    this.createUnsignedTxn = this.createUnsignedTxn.bind(this);
    this.statelessRef = React.createRef();
  }

  handleGalaxyNameInput = galaxyName => {
    this.setState({ galaxyName, isAvailable: null });
    this.statelessRef.current.clearTxn();
  };

  handleAddressInput = galaxyOwner => {
    this.setState({ galaxyOwner });
    this.statelessRef.current.clearTxn();
  };

  createUnsignedTxn = () => {
    const { state, props } = this;
    if (isValidAddress(state.galaxyOwner) === false) return Maybe.Nothing();
    if (state.isAvailable === false) return Maybe.Nothing();
    if (canDecodePatp(state.galaxyName) === false) return Maybe.Nothing();
    if (isValidGalaxy(state.galaxyName) === false) return Maybe.Nothing();

    const validContracts = need.contracts(props);

    const galaxyDec = parseInt(ob.patp2dec(state.galaxyName), 10);

    const txn = azimuth.ecliptic.createGalaxy(
      validContracts,
      galaxyDec,
      state.galaxyOwner
    );

    return Maybe.Just(txn);
  };

  confirmAvailability = async () => {
    const { state, props } = this;

    if (canDecodePatp(state.galaxyName) === false) {
      this.setState({ isAvailable: false });
      return;
    }

    const validContracts = need.contracts(props);

    const galaxyDec = ob.patp2dec(state.galaxyName);

    const currentOwner = await azimuth.azimuth.getOwner(
      validContracts,
      galaxyDec
    );

    const available = eqAddr(currentOwner, ETH_ZERO_ADDR);

    this.setState({ isAvailable: available });
  };

  render() {
    const { props, state } = this;

    const validAddress = isValidAddress(state.galaxyOwner);
    const validGalaxy = isValidGalaxy(state.galaxyName);

    const canGenerate =
      validAddress === true &&
      validGalaxy === true &&
      state.isAvailable === true;

    const esvisible =
      props.networkType === NETWORK_NAMES.ROPSTEN ||
      props.networkType === NETWORK_NAMES.MAINNET;

    const esdomain =
      props.networkType === NETWORK_NAMES.ROPSTEN
        ? 'ropsten.etherscan.io'
        : 'etherscan.io';

    return (
      <Row>
        <Col>
          <H1> {'Create a Galaxy'} </H1>

          <P>
            {'Enter the galaxy to create and the address that will own ' +
              'it (defaulting to this account, if not provided).'}
          </P>

          <GalaxyInput
            className="mono"
            prop-size="lg"
            prop-format="innerLabel"
            autoFocus
            placeholder="e.g. ~zod"
            value={state.galaxyName}
            onChange={v => this.handleGalaxyNameInput(v)}>
            <InnerLabel>{'Galaxy Name'}</InnerLabel>
            <ValidatedSigil
              className="tr-0 mt-05 mr-0 abs"
              patp={state.galaxyName}
              size={68}
              margin={8}
            />
          </GalaxyInput>

          <AddressInput
            className="mono mt-8"
            prop-size="lg"
            prop-format="innerLabel"
            value={state.galaxyOwner}
            onChange={v => this.handleAddressInput(v)}>
            <InnerLabel>{'Address that will own this galaxy'}</InnerLabel>
            <ShowBlockie className={'mt-1'} address={state.galaxyOwner} />
          </AddressInput>

          <Anchor
            className={'mt-1'}
            prop-size={'sm'}
            prop-disabled={!validAddress || !esvisible}
            target={'_blank'}
            href={`https://${esdomain}/address/${state.galaxyOwner}`}>
            {'View on Etherscan ↗'}
          </Anchor>

          <Button
            prop-size="lg wide"
            className="mt-8"
            prop-color={buttonTriState(state.isAvailable)}
            disabled={!validGalaxy}
            onClick={() => this.confirmAvailability()}>
            {buttonTriStateText(state.isAvailable)}
          </Button>

          <StatelessTransaction
            // Upper scope
            {...props}
            // Other
            ref={this.statelessRef}
            canGenerate={canGenerate}
            createUnsignedTxn={this.createUnsignedTxn}
          />
        </Col>
      </Row>
    );
  }
}

export default CreateGalaxy;
