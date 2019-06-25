import React from 'react';
import * as sigil from 'sigil-js';
import ob from 'urbit-ob';
import classnames from 'classnames';
import * as wg from '../../lib/walletgen';

import Button from '../components/Button';
import ReactSVGComponents from '../components/ReactSVGComponents';
import PaperCollateralRenderer from 'PaperCollateralRenderer';

import {
  MAX_GALAXY,
  MIN_STAR,
  MAX_STAR,
  GEN_STATES,
} from '../../lib/constants';

const NEXT_STEP_NUM = 6;

const shipInfo = ship => {
  const name = ob.patp(ship);
  const sig = sigil.pour({
    colorway: ['black', 'white'],
    patp: name,
    renderer: ReactSVGComponents,
    size: 233,
  });

  return ship < MAX_GALAXY
    ? galaxyInfo(name, sig)
    : ship < MAX_STAR
    ? starInfo(name, sig)
    : planetInfo(name, sig);
};

const infoHeader = ship => (
  <div className={'row text-600 text-mono'} key={ship + '-header'}>
    {ship + ' Wallet'}
  </div>
);

const infoSigil = (ship, sig) => {
  return (
    <div className={''} key={'sigil-' + ship}>
      {sig}
    </div>
  );
};

const getColor = (classOf, seedType) => {
  if (classOf === 'galaxy') {
    if (seedType === 'manage') return 'bg-medium';
    if (seedType === 'voting') return 'bg-medium';
    if (seedType === 'spawn') return 'bg-high';
    if (seedType === 'master') return 'bg-very-high';
    if (seedType === 'masterShard') return 'bg-very-high';
  }
  if (classOf === 'star') {
    if (seedType === 'manage') return 'bg-low';
    if (seedType === 'spawn') return 'bg-medium';
    if (seedType === 'master') return 'bg-high';
  }
  if (classOf === 'planet') {
    if (seedType === 'manage') return 'bg-low';
    if (seedType === 'master') return 'bg-medium';
  }
};

const infoManagementSeed = ship => {
  const classOf = ob.clan(ship);
  const colorClass = getColor(classOf, 'manage');
  return (
    <Tile
      colorClass={colorClass}
      key={`info-${ship}-manage`}
      col1={`Management Proxy`}
      col2={''}
    />
  );
};

const infoVotingSeed = ship => {
  const classOf = ob.clan(ship);
  const colorClass = getColor(classOf, 'voting');
  return (
    <Tile
      colorClass={colorClass}
      key={`info-${ship}-voting`}
      col1={`Voting Proxy`}
      col2={''}
    />
  );
};

const infoSpawnSeed = ship => {
  const classOf = ob.clan(ship);
  const colorClass = getColor(classOf, 'spawn');
  return (
    <Tile
      colorClass={colorClass}
      key={`info-${ship}-spawn`}
      col1={`Spawn Proxy`}
      col2={''}
    />
  );
};

const infoMasterTicket = ship => {
  const classOf = ob.clan(ship);
  const colorClass = getColor(classOf, 'master');
  return (
    <Tile
      colorClass={colorClass}
      key={`info-${ship}-master`}
      col1={`Master Ticket`}
      col2={''}
    />
  );
};

const infoMasterTicketShard = ship => {
  const classOf = ob.clan(ship);
  const colorClass = getColor(classOf, 'master');
  return [
    <Tile
      colorClass={colorClass}
      key={`info-${ship}-master-1`}
      col1={`Master Ticket Shard 1 of 3`}
      col2={''}
    />,
    <Tile
      colorClass={colorClass}
      key={`info-${ship}-master-2`}
      col1={`Master Ticket Shard 2 of 3`}
      col2={''}
    />,
    <Tile
      colorClass={colorClass}
      key={`info-${ship}-master-3`}
      col1={`Master Ticket Shard 3 of 3`}
      col2={''}
    />,
  ];
};

const Tile = props => {
  return (
    <div
      className={`${props.colorClass} white row pl-4  text-mono`}
      style={{ borderBottom: '2px solid black', height: '39px' }}
      key={props.key}>
      <div className={'col-md-8 flex align-center text-600'}>{props.col1}</div>
      <div className={'col-md-4 flex align-center text-500'}>{props.col2}</div>
    </div>
  );
};

const galaxyInfo = (ship, sig) => (
  <div className={'mt-8'} key={'wallet-' + ship}>
    {infoHeader(ship)}
    <div className={'row'} key={ship + '-body'}>
      {infoSigil(ship, sig)}
      <div className={'col-md-7 ml-2'} key={'info-' + ship}>
        {infoMasterTicketShard(ship)}
        {infoSpawnSeed(ship)}
        {infoManagementSeed(ship)}
        {infoVotingSeed(ship)}
      </div>
    </div>
  </div>
);

const starInfo = (ship, sig) => (
  <div className={'mt-8'} key={'wallet-' + ship}>
    {infoHeader(ship)}
    <div className={'row'} key={ship + '-body'}>
      {infoSigil(ship, sig)}
      <div className={'col-md-7 ml-2'} key={'info-' + ship}>
        {infoMasterTicket(ship)}
        {infoSpawnSeed(ship)}
        {infoManagementSeed(ship)}
      </div>
    </div>
  </div>
);

const planetInfo = (ship, sig) => (
  <div className={'mt-8'} key={'wallet-' + ship}>
    {infoHeader(ship)}
    <div className={'row'} key={ship + '-body'}>
      {infoSigil(ship, sig)}
      <div className={'col-md-7 ml-2'} key={'info-' + ship}>
        {infoMasterTicket(ship)}
        {infoManagementSeed(ship)}
      </div>
    </div>
  </div>
);

class Generate extends React.Component {
  constructor(props) {
    super(props);
    this.handleGenerate = this.handleGenerate.bind(this);
  }

  handleGenerate = async () => {
    const { props } = this;
    const { setGlobalState } = this.props;

    setGlobalState({ 'eny.state': GEN_STATES.ENY_PENDING });

    const ships = [
      ...props['profile.value'].galaxies,
      ...props['profile.value'].stars,
      ...props['profile.value'].planets,
    ];

    const enyPromises = ships.map(async ship => {
      return {
        ship,
        ticket: await wg.makeTicket(ship),
      };
    });

    const enyTable = await Promise.all(enyPromises);

    setGlobalState({
      'eny.value': enyTable,
      'eny.state': GEN_STATES.ENY_SUCCESS,
      'wallets.state': GEN_STATES.DERIVATION_PENDING,
    });

    await this.forciblyExecuteArgon2Once(enyTable);

    const walletPromises = enyTable.map(async ({ ship, ticket }) => {
      const boot = ship < MIN_STAR || ship > MAX_STAR;
      return {
        ship,
        wallet: await wg.generateWallet(ship, ticket, boot),
      };
    });

    const wallets = await Promise.all(walletPromises);

    const reshapedWallet = wallets.reduce(
      (acc, { ship, wallet }) => ({ ...acc, [ship]: wallet }),
      {}
    );

    setGlobalState({
      'wallets.value': reshapedWallet,
      'wallets.state': GEN_STATES.DERIVATION_SUCCESS,
      'paperCollateral.state': GEN_STATES.PAPER_PENDING,
    });
  };

  forciblyExecuteArgon2Once = async enyTable => {
    // NB (jtobin):
    //
    // following is some insane thing required so as not to run into bizarre
    // emscripten errors
    if (enyTable.length === 0) {
      throw new Error('no ship information provided');
    } else {
      let throwawayEntry = enyTable[0];
      // eslint-disable-next-line
      let throwaway = await genWallet(
        throwawayEntry.ship,
        throwawayEntry.ticket,
        () => {}
      );
    }
  };

  render() {
    const { props } = this;
    const { setGlobalState } = this.props;

    const {
      ENY_NOSTART,
      ENY_PENDING,
      ENY_SUCCESS,
      ENY_FAILURE,
      DERIVATION_NOSTART,
      DERIVATION_PENDING,
      DERIVATION_SUCCESS,
      DERIVATION_FAILURE,
      PAPER_NOSTART,
      PAPER_PENDING,
      PAPER_SUCCESS,
      PAPER_FAILURE,
    } = GEN_STATES;

    const es = props['eny.state'];
    const ws = props['wallets.state'];
    const ps = props['paperCollateral.state'];

    const ALL_SUCCESS =
      es === ENY_SUCCESS && ws === DERIVATION_SUCCESS && ps === PAPER_SUCCESS;

    const NONE_START =
      es === ENY_NOSTART && ws === DERIVATION_NOSTART && ps === PAPER_NOSTART;

    const ANY_ERROR =
      es === ENY_FAILURE || ws === DERIVATION_FAILURE || ps === PAPER_FAILURE;

    const ANY_PENDING =
      es === ENY_PENDING || ws === DERIVATION_PENDING || ps === PAPER_PENDING;

    const genButtonClass = classnames({
      'bg-blue white': true,
      'bg-green noClick black': ALL_SUCCESS,
    });

    const entropyBarClassnames = classnames({
      'bg-blue': es === ENY_SUCCESS,
      'bg-lightBlue': es === ENY_PENDING,
      'bg-gray': es === ENY_NOSTART,
      'bg-orange': es === ENY_FAILURE,
      'bg-green': ALL_SUCCESS,
    });

    const walletsBarClassnames = classnames({
      'bg-blue': ws === DERIVATION_SUCCESS,
      'bg-lightBlue': ws === DERIVATION_PENDING,
      'bg-gray': ws === DERIVATION_NOSTART,
      'bg-orange': ws === DERIVATION_FAILURE,
      'bg-green': ALL_SUCCESS,
    });

    const paperBarClassnames = classnames({
      'bg-blue': ps === PAPER_SUCCESS,
      'bg-lightBlue': ps === PAPER_PENDING,
      'bg-gray': ps === PAPER_NOSTART,
      'bg-orange': ps === PAPER_FAILURE,
      'bg-green': ALL_SUCCESS,
    });

    const isGenerateButtonDisabled = () => {
      if (NONE_START === true) return false;
      if (ANY_PENDING === true) return true;
      if (ANY_ERROR === true) return false;
      if (ALL_SUCCESS === true) return true;
    };

    const getGenButtonText = () => {
      // const N = props['wallets.genCounter'] + 1;
      // const X = props['eny.value'].length;
      let r = '';
      if (NONE_START === true) r = 'Generate All';
      if (es === ENY_PENDING) r = 'Generating Entropy';
      // if (ws === DERIVATION_PENDING) r = `Generating Wallet ${N} / ${X}`;
      if (ws === DERIVATION_PENDING) r = `Generating Wallets`;
      if (ps === PAPER_PENDING) r = 'Making Paper Collateral';
      if (ALL_SUCCESS === true) r = 'Success.';
      if (ANY_ERROR === true) r = 'Try Again';
      return r;
    };

    const disableGenerateButton = isGenerateButtonDisabled();
    const genText = getGenButtonText();

    const nextButtonClass = classnames({
      'bg-blue white': ALL_SUCCESS === true,
      'bg-gray black': ALL_SUCCESS !== true,
    });

    const nextButtonDisabled = ws !== ALL_SUCCESS;

    return (
      <div className={'row'}>
        <div className={'col-md-8'}>
          <div className={'col-md-8'}>
            <h2>{`Review your paper wallet storage recommendations.`}</h2>
            <p>
              {`Each ship is placed into its own wallet with proxies that differ in
            importance and security requirements. These are listed as examples below. A key to our security recommendations can be found to the right of the page.`}
            </p>
          </div>

          {props['profile.value'].galaxies.map(ship => shipInfo(ship))}
          {props['profile.value'].stars.map(ship => shipInfo(ship))}
          {props['profile.value'].planets.map(ship => shipInfo(ship))}
        </div>

        <div className="col-md-3 col-md-offset-1 mt-9">
          <div className="fixed" style={{ width: '230px' }}>
            <div className="col-md-12 bg-very-high h-2 mt-4" />
            <h4 className="text-600 mt-2">Very High Friction</h4>
            <p className="text-sm" style={{ lineHeight: '16px' }}>
              Extremely valuable. Cold storage on a 3 part sharded paper wallet.
              Store each shard in a separate geographic location with protection
              against fire, water and other elements.
            </p>
            <div className="col-md-12 bg-high h-2 mt-4" />
            <h4 className="text-600 mt-2">High Friction</h4>
            <p className="text-sm" style={{ lineHeight: '16px' }}>
              Very valuable. Cold storage on a paper wallet in a different
              location than your computer, such as a safe.
            </p>
            <div className="col-md-12 bg-medium h-2 mt-4" />
            <h4 className="text-600 mt-2">Medium Friction</h4>
            <p className="text-sm" style={{ lineHeight: '16px' }}>
              Store cold in a paper wallet; can be stored in a desk drawer in a
              trusted environment.
            </p>
            <div className="col-md-12 bg-low h-2 mt-4" />
            <h4 className="text-600 mt-2">Low Friction</h4>
            <p className="text-sm" style={{ lineHeight: '16px' }}>
              Ok to store hot on a trusted networked computer.
            </p>
          </div>
        </div>

        <div className={'col-md-9 btn-tray col-'}>
          <h3>{"Got it?  Then it's time to generate your wallets."}</h3>
          <p className={'col-md-8'}>
            {
              'If you have a large number of ships, this may take several minutes and the page may hang or become unresponsive. If you close this browser window, you will have to start from the beginning.'
            }
          </p>

          <div className={'flex h-12 mt-8 mb-4'}>
            <Button
              className={`${genButtonClass} b-r-1-black w-50 m-0`}
              text={genText}
              onClick={this.handleGenerate}
              disable={disableGenerateButton}
            />
            <div className={`${entropyBarClassnames} f-1 b-r-1-black`} />
            <div className={`${walletsBarClassnames} f-3 b-r-1-black`} />
            <div className={`${paperBarClassnames} f-3 b-r-1-black`} />
            <Button
              className={`${nextButtonClass} m-0`}
              text={'View wallets →'}
              disable={nextButtonDisabled}
              onClick={() =>
                setGlobalState({
                  route: '/Download',
                  currentStep: NEXT_STEP_NUM,
                })
              }
            />
          </div>
        </div>

        <div className={'extremely-hidden'}>
          <div className={'text-300'}>{'text-300'}</div>
          <div className={'text-400'}>{'text-400'}</div>
          <div className={'text-500'}>{'text-500'}</div>
          <div className={'text-600'}>{'text-600'}</div>
          <div className={'text-400 text-mono'}>{'text-400 text-mono'}</div>
          <div className={'text-600 text-mono'}>{'text-600 text-mono'}</div>
          <div className={'text-500 h-font'}>{'text-500 h-font'}</div>
          <div className={'text-600 h-font'}>{'text-600 h-font'}</div>
        </div>

        {props['wallets.state'] === GEN_STATES.DERIVATION_SUCCESS ? (
          <PaperCollateralRenderer
            wallet={props['wallets.value']}
            className={'extremely-hidden'}
            callback={data =>
              setGlobalState({
                'paperCollateral.value': data,
                'paperCollateral.state': GEN_STATES.PAPER_SUCCESS,
              })
            }
            mode={'REGISTRATION'}
          />
        ) : (
          <div />
        )}
      </div>
    );
  }
}

export default Generate;
