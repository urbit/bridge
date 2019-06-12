import React from 'react';
import { Row, Col, H1, H2, P } from '../components/Base';
import { Button } from '../components/Base';
import * as azimuth from 'azimuth-js';

import PointList from '../components/PointList';
import { NETWORK_TYPES } from '../lib/network';
import { ROUTE_NAMES } from '../lib/routeNames';
import { withHistory } from '../store/history';
import { ETH_ZERO_ADDR, eqAddr } from '../lib/wallet';
import { withNetwork } from '../store/network';
import { compose } from '../lib/lib';

const hasTransferProxy = (cache, point) =>
  point in cache ? !eqAddr(cache[point].transferProxy, ETH_ZERO_ADDR) : false;

class Points extends React.Component {
  constructor(props) {
    super(props);

    const { networkType } = props;
    const loading = networkType !== NETWORK_TYPES.OFFLINE;

    this.state = {
      points: [],
      incoming: [],
      managing: [],
      voting: [],
      spawning: [],
      eclipticOwner: false,
      loading: loading,
    };
  }

  componentDidMount() {
    const { web3, wallet, contracts, addToPointCache } = this.props;

    web3.chain(_ =>
      contracts.chain(ctrcs =>
        wallet.chain(async wal => {
          const addr = wal.address;

          const points = await azimuth.azimuth.getOwnedPoints(ctrcs, addr);

          const incoming = await azimuth.azimuth.getTransferringFor(
            ctrcs,
            addr
          );

          const managing = await azimuth.azimuth.getManagerFor(ctrcs, addr);

          const voting = await azimuth.azimuth.getVotingFor(ctrcs, addr);

          const spawning = await azimuth.azimuth.getSpawningFor(ctrcs, addr);

          const owner = await azimuth.ecliptic.owner(ctrcs);

          const eclipticOwner = eqAddr(addr, owner);

          this.setState({
            points,
            incoming,
            managing,
            voting,
            spawning,
            eclipticOwner,
            loading: false,
          });

          this.cachePoints(ctrcs, addToPointCache, points);
        })
      )
    );
  }

  cachePoints(contracts, addToPointCache, points) {
    points.forEach(point => {
      azimuth.azimuth
        .getPoint(contracts, point)
        .then(details => addToPointCache({ [point]: details }));
    });
  }

  render() {
    const { setPointCursor, history } = this.props;
    const { pointCache } = this.props;

    const {
      points,
      incoming,
      managing,
      voting,
      spawning,
      loading,
    } = this.state;
    const { eclipticOwner } = this.state;

    const lookupPointButton = (
      <Row>
        <Col>
          <Button
            prop-type={'link'}
            prop-size={'md'}
            onClick={() => history.push(ROUTE_NAMES.VIEW_SHIP)}>
            {'View a point  →'}
          </Button>
          <P>{'View a point on Azimuth.'}</P>
        </Col>
      </Row>
    );

    const createGalaxyButton =
      eclipticOwner === false ? (
        <div />
      ) : (
        <Row>
          <Col>
            <Button
              prop-type={'link'}
              prop-size={'md'}
              onClick={() => history.push(ROUTE_NAMES.CREATE_GALAXY)}>
              {'Create a galaxy  →'}
            </Button>
            <P>
              {
                'You have the authority to create a new Galaxy and you can do so here.'
              }
            </P>
          </Col>
        </Row>
      );

    const outgoing = points.filter(point =>
      hasTransferProxy(pointCache, point)
    );

    const outgoingPoints =
      outgoing.length !== 0 ? (
        <React.Fragment>
          <H2>{'Outgoing Transfers'}</H2>
          <P>
            {`You own these points until the recipient accepts the incoming
            transfer. You may cancel the transfer until accepted.`}
          </P>
          <PointList
            setPointCursor={setPointCursor}
            routeHandler={history.push}
            points={outgoing}
          />
        </React.Fragment>
      ) : (
        <div />
      );

    const incomingPoints =
      incoming.length !== 0 ? (
        <React.Fragment>
          <H2>{'Incoming Transfers'}</H2>
          <P>
            {`You do not own these points until you accept the incoming transfer.
            You may reject any incoming transfers.`}
          </P>
          <PointList
            setPointCursor={setPointCursor}
            routeHandler={history.push}
            points={incoming}
          />
        </React.Fragment>
      ) : (
        <div />
      );

    const managingPoints =
      managing.length !== 0 ? (
        <React.Fragment>
          <H2>{'You Are a Management Proxy For'}</H2>
          <P>
            {`You can configure or set network keys and conduct sponsorship
             related operations for these points.`}
          </P>
          <PointList
            setPointCursor={setPointCursor}
            routeHandler={history.push}
            points={managing}
          />
        </React.Fragment>
      ) : (
        <div />
      );

    const votingPoints =
      voting.length !== 0 ? (
        <React.Fragment>
          <H2>{'You Are a Voting Proxy For'}</H2>
          <P>
            {`Since you are part of the Galactic Senate, you can cast votes on
            new Azimuth proposals on behalf of these points.`}
          </P>
          <PointList
            setPointCursor={setPointCursor}
            routeHandler={history.push}
            points={voting}
          />
        </React.Fragment>
      ) : (
        <div />
      );

    const spawningPoints =
      spawning.length !== 0 ? (
        <React.Fragment>
          <H2>{'You Are a Spawn Proxy For'}</H2>
          <P>{`You can create new child ships under these points.`}</P>
          <PointList
            setPointCursor={setPointCursor}
            routeHandler={history.push}
            points={spawning}
          />
        </React.Fragment>
      ) : (
        <div />
      );

    return (
      <Row>
        <Col>
          <H1>{'Points'}</H1>

          <P>{`A point is an identity on the Ethereum blockchain.
            Points declare keys for ships on the Arvo network.`}</P>

          {lookupPointButton}

          {createGalaxyButton}

          {incomingPoints}

          {outgoingPoints}

          <H2>{'Your Points'}</H2>

          <PointList
            setPointCursor={setPointCursor}
            routeHandler={history.push}
            points={points}
            loading={loading}
          />

          {managingPoints}

          {votingPoints}

          {spawningPoints}
        </Col>
      </Row>
    );
  }
}

export default compose(
  withNetwork,
  withHistory
)(Points);
