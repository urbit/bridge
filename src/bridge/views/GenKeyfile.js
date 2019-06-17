import React from 'react';
import * as need from '../lib/need';

import { Button } from '../components/Base';
import { Row, Col, H1, P } from '../components/Base';

import * as ob from 'urbit-ob';
import * as kg from 'urbit-key-generation/dist/index';
import saveAs from 'file-saver';

import { attemptNetworkSeedDerivation, genKey } from '../lib/keys';
import { addHexPrefix } from '../lib/wallet';
import { compose } from '../lib/lib';
import { withWallet } from '../store/wallet';
import { withPointCursor } from '../store/pointCursor';
import { withPointCache } from '../store/pointCache';

class GenKeyfile extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      keyfile: '',
      loaded: false,
    };
  }

  getPointDetails() {
    const point = need.pointCursor(this.props);

    const pointDetails = need.fromPointCache(this.props, point);

    // in case we did SetKeys earlier this session, make sure to generate the
    // newer keyfile, rather than the one that will expire soon
    const revision = this.props.networkRevision.matchWith({
      Nothing: () => parseInt(pointDetails.keyRevisionNumber),
      Just: p => p.value,
    });

    return {
      point,
      pointDetails,
      revision,
    };
  }

  async componentDidMount() {
    const { point, pointDetails, revision } = this.getPointDetails();
    let keyfile = '';

    const hexRegExp = /[0-9A-Fa-f]{64}/g;
    const networkSeed = await this.deriveSeed();

    const keysmatch = this.checkKeysMatch(networkSeed, pointDetails);
    const seedValid = hexRegExp.test(networkSeed);

    if (keysmatch && seedValid) {
      keyfile = genKey(networkSeed, point, revision);
    }

    this.setState({
      keyfile: keyfile,
      loaded: true,
    });
  }

  checkKeysMatch(networkSeed, pointDetails) {
    const crypub = pointDetails.encryptionKey;
    const sgnpub = pointDetails.authenticationKey;

    const { crypt, auth } = kg.deriveNetworkKeys(networkSeed);

    const keysmatch =
      crypub === addHexPrefix(crypt.public) &&
      sgnpub === addHexPrefix(auth.public);

    return keysmatch;
  }

  async deriveSeed() {
    const next = false;

    const seed = await attemptNetworkSeedDerivation(next, this.props);

    // either return the derived seed, the cached seed, or empty string
    return seed.matchWith({
      Nothing: () => this.props.networkSeed.getOrElse(''),
      Just: p => p.value,
    });
  }

  render() {
    const { point, revision } = this.getPointDetails();
    const { keyfile, loaded } = this.state;

    return (
      <Row>
        <Col className={'col-md-8'}>
          <H1>{'Generate keyfile'}</H1>

          <P>{'Download a private key file for booting this point in Arvo.'}</P>

          {keyfile === '' && !loaded && <P>{'Generating keyfile...'}</P>}

          {keyfile === '' && loaded && (
            <React.Fragment>
              <P>
                <b>Warning: </b>
                {`No valid network seed detected. To generate a keyfile, you
                  must reset your networking keys, or try logging in with your
                  master ticket or management mnemonic.`}
              </P>

              <P>
                {`If you've just reset your networking keys, you may need to wait for the transaction to go through. Check back shortly.`}
              </P>
            </React.Fragment>
          )}

          {keyfile !== '' && (
            <React.Fragment>
              <div className="pb-5 text-code keyfile">{keyfile}</div>
              <Button
                onClick={() => {
                  let blob = new Blob([keyfile], {
                    type: 'text/plain;charset=utf-8',
                  });
                  saveAs(blob, `${ob.patp(point).slice(1)}-${revision}.key`);
                }}>
                Download →
              </Button>
            </React.Fragment>
          )}
        </Col>
      </Row>
    );
  }
}

export default compose(
  withWallet,
  withPointCursor,
  withPointCache
)(GenKeyfile);
