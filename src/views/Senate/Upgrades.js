import React, { useCallback, useMemo, useState } from 'react';
import { Grid, Text, P, LinkButton } from 'indigo-react';
import * as azimuth from 'azimuth-js';

import { useNetwork } from 'store/network';
import { usePointCursor } from 'store/pointCursor';

import * as need from 'lib/need';
import useEthereumTransaction from 'lib/useEthereumTransaction';
import { GAS_LIMITS } from 'lib/constants';
import { useLocalRouter } from 'lib/LocalRouter';

import ViewHeader from 'components/ViewHeader';
import InlineEthereumTransaction from 'components/InlineEthereumTransaction';
import View from 'components/View';
import BridgeForm from 'form/BridgeForm';
import convertToInt from 'lib/convertToInt';

function useCastUpgradeVote() {
  const { contracts } = useNetwork();
  const { pointCursor } = usePointCursor();

  const _contracts = need.contracts(contracts);
  const _point = need.point(pointCursor);

  return useEthereumTransaction(
    useCallback(
      (address, accept) => {
        return azimuth.ecliptic.castUpgradeVote(
          _contracts,
          _point,
          address,
          accept
        );
      },
      [_contracts, _point]
    ),
    useCallback(() => null, []), //TODO update polls[address].hasVoted ?
    GAS_LIMITS.DEFAULT //TODO update once we have a decent sample size
  );
}

export default function Upgrades() {
  const { pop } = useLocalRouter();
  const { contracts } = useNetwork();
  const { pointCursor } = usePointCursor();

  const _contracts = need.contracts(contracts);
  const _point = convertToInt(need.point(pointCursor), 10);

  const { construct, bind } = useCastUpgradeVote();

  const [proposals, setProposals] = useState([]);
  const [polls, setPolls] = useState({});
  const [loading, setLoading] = useState(true);
  const [votingOn, setVotingOn] = useState({});

  //TODO update every second?
  const now = Math.round(new Date().getTime() / 1000);

  useMemo(async () => {
    let proposals = await azimuth.polls.getUpgradeProposals(_contracts);
    let polls = {};
    for (let address of proposals) {
      let poll = await azimuth.polls.getUpgradePoll(_contracts, address);
      poll.endTime = convertToInt(poll.start) + convertToInt(poll.duration);
      poll.hasVoted = await azimuth.polls.hasVotedOnUpgradePoll(
        _contracts,
        _point,
        address
      );
      polls[address] = poll;
    }
    setProposals(proposals);
    setPolls(polls);
    setLoading(false);
    return;
  }, [_contracts, _point]);

  // eslint-disable-next-line
  const [open, closed] = useMemo(() => {
    let open = [];
    let closed = [];
    if (loading) return [open, closed];
    for (let address of proposals) {
      if (now > polls[address].endTime) {
        closed.push(address);
      } else {
        open.push(address);
      }
    }
    return [open, closed];
  }, [loading, proposals, polls, now]);

  const doVote = useCallback(
    (address, accept) => {
      construct(address, accept);
      setVotingOn({ address, accept });
    },
    [construct, setVotingOn]
  );

  const didVote = useCallback(() => {
    polls[votingOn].hasVoted = true;
    setPolls(polls);
    setVotingOn({});
  }, [polls, setPolls, votingOn]);

  const openList = useMemo(() => {
    return open.map(address => {
      const hasVoted = polls[address].hasVoted;
      return (
        <>
          <Grid.Item full className="mv2" as={Text}>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href={`https://etherscan.io/address/${address}#code`}
              class="mb4 mono wrap pre">
              {address}↗
            </a>
            <P className="mt0">
              {hasVoted ? (
                'Your vote has been cast.'
              ) : (
                <>
                  <LinkButton onClick={() => doVote(address, true)}>
                    {votingOn.address === address && votingOn.accept ? (
                      <b>support</b>
                    ) : (
                      <>support</>
                    )}
                  </LinkButton>
                  {' / '}
                  <LinkButton onClick={() => doVote(address, false)}>
                    {votingOn.address === address && !votingOn.accept ? (
                      <b>reject</b>
                    ) : (
                      <>reject</>
                    )}
                  </LinkButton>
                </>
              )}
            </P>
          </Grid.Item>
          <Grid.Divider />
        </>
      );
    });
  }, [open, polls, votingOn, doVote]);

  return (
    <View pop={pop} inset>
      <Grid>
        <Grid.Item full as={ViewHeader}>
          Senate: Upgrade Proposals
        </Grid.Item>

        <Grid.Item full as={Grid}>
          <Grid.Item full as={P}>
            Current Ecliptic:
          </Grid.Item>
          <Grid.Item full className="mv2 mb4 mono wrap pre" as={P}>
            {_contracts.ecliptic.address}
          </Grid.Item>
        </Grid.Item>

        {openList.length > 0 && (
          <>
            <Grid.Divider className="mv4" />

            <Grid.Item full as={Grid}>
              <Grid.Item full as={P}>
                Open upgrade polls:
              </Grid.Item>
              {openList}
            </Grid.Item>

            <BridgeForm>
              {({ onSubmit, values }) => (
                // <>
                <Grid.Item
                  full
                  as={InlineEthereumTransaction}
                  {...bind}
                  onReturn={didVote}
                />
              )}
            </BridgeForm>
          </>
        )}
      </Grid>
    </View>
  );
}
