import Maybe from "folktale/maybe";
import React from "react";
import * as azimuth from "azimuth-js";
import * as ob from "urbit-ob";
import * as need from "../lib/need";

import {
  Row,
  Col,
  H1,
  InnerLabel,
  ShowBlockie,
  P,
  Anchor,
} from "../components/Base";
import { AddressInput } from "../components/Base";
import StatelessTransaction from "../components/StatelessTransaction";

import { NETWORK_NAMES } from "../lib/network";

import { isValidAddress } from "../lib/wallet";

class Transfer extends React.Component {
  constructor(props) {
    super(props);

    const issuingPoint = need.pointCursor(props);

    this.state = {
      receivingAddress: "",
      issuingPoint: issuingPoint,
    };

    this.handleAddressInput = this.handleAddressInput.bind(this);
    this.createUnsignedTxn = this.createUnsignedTxn.bind(this);
    this.statelessRef = React.createRef();
  }

  handleAddressInput(receivingAddress) {
    this.setState({ receivingAddress });
    this.statelessRef.current.clearTxn();
  }

  handleConfirmAvailability() {
    this.confirmPointAvailability().then(r => {
      this.setState({ isAvailable: r });
    });
  }

  createUnsignedTxn() {
    const { state, props } = this;

    const validContracts = need.contracts(props);

    const validPoint = need.pointCursor(props);

    const txn = azimuth.ecliptic.setTransferProxy(
      validContracts,
      validPoint,
      state.receivingAddress,
    );

    return Maybe.Just(txn);
  }

  render() {
    const { props, state } = this;

    const validAddress = isValidAddress(state.receivingAddress);
    const canGenerate = validAddress === true;

    const esvisible =
      props.networkType === NETWORK_NAMES.ROPSTEN ||
      props.networkType === NETWORK_NAMES.MAINNET;

    const esdomain =
      props.networkType === NETWORK_NAMES.ROPSTEN
        ? "ropsten.etherscan.io"
        : "etherscan.io";

    return (
      <Row>
        <Col>
          <H1>
            {"Transfer"} <code>{` ${ob.patp(state.issuingPoint)} `}</code>
            {"To a New Owner"}
          </H1>

          <P>
            {`Please provide the Ethereum address of the new owner. You own these
            points until the recipient accepts the incoming transfer.
            You may cancel the transfer until the transfer is accepted.`}
          </P>

          <AddressInput
            className={"mono mt-8"}
            prop-size="lg"
            prop-format="innerLabel"
            value={state.receivingAddress}
            placeholder={`e.g. 0x84295d5e054d8cff5a22428b195f5a1615bd644f`}
            onChange={v => this.handleAddressInput(v)}
          >
            <InnerLabel>{"New ownership address"}</InnerLabel>
            <ShowBlockie className={"mt-1"} address={state.receivingAddress} />
          </AddressInput>

          <Anchor
            className={"mt-1"}
            prop-size={"s"}
            prop-disabled={
              !isValidAddress(state.receivingAddress) || !esvisible
            }
            target={"_blank"}
            href={`https://${esdomain}/address/${state.receivingAddress}`}
          >
            {"View on Etherscan ↗"}
          </Anchor>

          <StatelessTransaction
            // Upper scope
            {...props}
            // Checks
            userApproval={state.userApproval}
            canGenerate={canGenerate}
            // Methods
            createUnsignedTxn={this.createUnsignedTxn}
            ref={this.statelessRef}
          />
        </Col>
      </Row>
    );
  }
}

export default Transfer;
