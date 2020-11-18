import React, { useState, useEffect, useCallback, useMemo } from 'react';
import cn from 'classnames';
import { Grid, H4, HelpText } from 'indigo-react';
import { Just, Nothing } from 'folktale/maybe';
import { eq } from 'lodash';
import * as ob from 'urbit-ob';
import * as azimuth from 'azimuth-js';
import Tabs from 'components/Tabs';
import Sigil from 'components/Sigil';
import Blinky from 'components/Blinky';

import { useLocalRouter } from 'lib/LocalRouter';
import * as need from 'lib/need';

import { usePointCursor } from 'store/pointCursor';
import { usePointCache } from 'store/pointCache';
import Footer from 'components/Footer';
import { useNetwork } from 'store/network';
import convertToInt from 'lib/convertToInt';
import useEthereumTransaction from 'lib/useEthereumTransaction';
import { GAS_LIMITS } from 'lib/constants';
import InlineEthereumTransaction from 'components/InlineEthereumTransaction';
import { ForwardButton } from 'components/Buttons';

const NAMES = {
  ALTID: 'ALTID',
  OTHER: 'OTHER',
};

const OPTIONS = [
  { text: 'Alt Id', value: NAMES.ALTID },

  { text: 'Other', value: NAMES.OTHER },
];

const VIEWS = {
  [NAMES.ALTID]: Tab,
  [NAMES.OTHER]: Tab,
};

const CLAIM_AS = {
  [NAMES.ALTID]: AltId,
  [NAMES.OTHER]: Claim,
};

const PAGE_SIZE = 10;

function useRemoveClaim() {
  const { contracts } = useNetwork();
  const { pointCursor } = usePointCursor();

  const _contracts = need.contracts(contracts);
  const _point = convertToInt(need.point(pointCursor), 10);

  const [claimData, setClaimData] = useState();
  const { syncClaims } = usePointCache();

  return useEthereumTransaction(
    useCallback(
      (protocol, claim) => {
        setClaimData({ protocol, claim });
        return azimuth.claims.removeClaim(_contracts, _point, protocol, claim);
      },
      [_contracts, _point]
    ),
    useCallback(() => {
      syncClaims(_point);
    }, [syncClaims, _point]),
    GAS_LIMITS.DEFAULT
  );
}

function Tab({
  className,
  claimSelected,
  clickClaim,
  onReturn,
  tab,
  claims,
  claimAs,
  page,
  setPage,
  bind,
}) {
  const start = page * PAGE_SIZE;
  const end = page * PAGE_SIZE + PAGE_SIZE;
  const claimsCount = claims.map(cs => cs.length).getOrElse(0);
  const maxPage = Math.ceil(claimsCount / PAGE_SIZE) - 1;
  const hasNext = page < maxPage;
  const hasPrev = page > 0;
  const _claims = claims
    .map(cs => {
      let claims = [];
      if (tab == NAMES.ALTID) {
        claims = cs.filter(claim => claim.protocol == 'alt-id');
      } else {
        claims = cs.filter(claim => claim.protocol != 'alt-id');
      }
      return claims.slice(start, end);
    })
    .getOrElse([]);
  const onNext = useCallback(() => {
    setPage(p => p + 1);
  }, [setPage]);

  const onPrev = useCallback(() => {
    setPage(p => p - 1);
  }, [setPage]);

  if (Nothing.hasInstance(claims)) {
    return <Grid className={className}></Grid>;
  }

  return (
    <Grid className={cn('mt2', className)}>
      {_claims.length === 0 && (
        <Grid.Item full as={HelpText} className="mt8 t-center">
          {Just.hasInstance(claims) ? (
            'No claims to display'
          ) : (
            <>
              <Blinky /> Loading...
            </>
          )}
        </Grid.Item>
      )}

      {_claims.map(claim =>
        claimAs({
          key: JSON.stringify(claim),
          claim: claim,
          bind: bind,
          clickClaim: clickClaim,
          onReturn: onReturn,
          selected: eq(claim, claimSelected),
        })
      )}

      <Grid.Item as={Footer}>
        <Grid className="pb9">
          {hasPrev && (
            <Grid.Item
              className="pointer underline mt4"
              fourth={1}
              onClick={onPrev}>
              {'<-'}
            </Grid.Item>
          )}
          {maxPage > 0 && (
            <Grid.Item className="mt4 t-center gray3" cols={[4, 10]}>
              <span className="black">Page {page + 1}</span> of {maxPage + 1}
            </Grid.Item>
          )}
          {hasNext && (
            <Grid.Item
              className="pointer underline t-right mt4"
              fourth={4}
              onClick={onNext}>
              {'->'}
            </Grid.Item>
          )}
        </Grid>
      </Grid.Item>
    </Grid>
  );
}

function Claim({ claim, selected, clickClaim, bind, onReturn }) {
  return (
    <>
      <Grid.Item onClick={() => clickClaim(claim)}>
        <Grid.Item className="flex-row align-center mono" cols={[3, 7]}>
          Protocol: {claim.protocol}
        </Grid.Item>
        <Grid.Item
          className="flex-row-r align-center underline green3 pointer"
          cols={[7, 10]}>
          Claim: {claim.claim}
        </Grid.Item>
        <Grid.Item
          className="flex-row-r align-center underline red4 pointer"
          cols={[10, 13]}>
          Dossier: 0x
        </Grid.Item>
      </Grid.Item>
      {selected && (
        <>
          <Grid.Item
            full
            as={InlineEthereumTransaction}
            label={'Generate transaction to remove claim'}
            {...bind}
            onReturn={onReturn}
          />
        </>
      )}
      <Grid.Divider />
    </>
  );
}

function AltId({ claim, selected, clickClaim, bind, onReturn }) {
  const patp = ob.patp(claim.claim);
  const sigilSize = 50;
  return (
    <>
      <Grid.Item className="flex-row justify-center align-center" cols={[1, 3]}>
        <div
          style={{
            display: 'inline-block',
            height: `${sigilSize}px`,
            width: `${sigilSize}px`,
          }}>
          <Sigil patp={patp} size={25} colors={['#FFFFFF', '#000000']} />
        </div>
      </Grid.Item>
      <Grid.Item className="flex-row align-center mono" cols={[3, 10]}>
        {patp}{' '}
      </Grid.Item>
      <Grid.Item
        className="flex-row-r align-center underline red4 pointer"
        cols={[10, 13]}
        onClick={() => clickClaim(claim)}>
        Remove
      </Grid.Item>
      {selected && (
        <>
          <Grid.Item
            full
            as={InlineEthereumTransaction}
            label={'Generate transaction to remove alternative id'}
            {...bind}
            onReturn={onReturn}
          />
        </>
      )}
      <Grid.Divider />
    </>
  );
}

export default function Claims() {
  const { push, names } = useLocalRouter();

  const { pointCursor } = usePointCursor();
  const point = need.point(pointCursor);
  const { getClaims, syncClaims } = usePointCache();

  const {
    isDefaultState,
    construct,
    unconstruct,
    completed,
    inputsLocked,
    bind,
  } = useRemoveClaim();

  useEffect(() => {
    syncClaims(point);
  }, [syncClaims, point]);

  const { claims } = getClaims(point);
  const [currentTab, _setCurrentTab] = useState(NAMES.ALTID);
  const [page, setPage] = useState(0);
  const [claimSelected, setClaimSelected] = useState(null);

  useMemo(() => {
    if (!claimSelected) {
      unconstruct();
    }
  }, [claimSelected, unconstruct]);

  const setCurrentTab = useCallback(
    tab => {
      setPage(0);
      _setCurrentTab(tab);
    },
    [setPage, _setCurrentTab]
  );

  const goToMakeClaim = useCallback(() => push(names.MAKE_CLAIM, {}), [
    push,
    names,
  ]);
  const goToMakeAltId = useCallback(() => push(names.MAKE_ALTID, {}), [
    push,
    names,
  ]);

  const clickClaim = useCallback(
    claim => {
      if (!inputsLocked) {
        construct(claim.protocol, claim.claim);
        setClaimSelected(claim);
      }
    },
    [construct, inputsLocked]
  );

  const onReturn = () => setClaimSelected(null);

  return (
    <Grid>
      <Grid.Item full as={H4} className="mt4">
        Claims
      </Grid.Item>
      <Grid.Item
        full
        className="mt1"
        as={Tabs}
        views={VIEWS}
        options={OPTIONS}
        currentTab={currentTab}
        tab={currentTab}
        onTabChange={setCurrentTab}
        claims={claims}
        bind={bind}
        claimSelected={claimSelected}
        clickClaim={clickClaim}
        onReturn={onReturn}
        page={page}
        setPage={setPage}
        claimAs={CLAIM_AS[currentTab]}
      />
      {currentTab === NAMES.OTHER ? (
        <Grid.Item
          onClick={() => goToMakeClaim()}
          full
          solid
          as={ForwardButton}>
          Create claim
        </Grid.Item>
      ) : (
        <Grid.Item
          onClick={() => goToMakeAltId()}
          full
          solid
          as={ForwardButton}>
          Create alt id
        </Grid.Item>
      )}
    </Grid>
  );
}
